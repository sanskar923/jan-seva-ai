import fs from "fs";
import { classifyComplaintText, classifyImageUpload, CATEGORIES, urgencyFromCategory } from "./classify.js";

const ROAD_LABEL_HINTS = [
  "street",
  "road",
  "highway",
  "traffic",
  "parking",
  "jeep",
  "truck",
  "bus",
  "van",
  "pickup",
  "taxi",
  "cab",
  "vehicle",
  "wheel",
  "tire",
  "manhole",
  "drain",
  "gravel",
  "pavement",
  "asphalt",
  "sign",
  "meter",
  "bridge",
  "tractor",
  "forklift",
  "plow",
  "dirt",
  "grate",
  "guardrail",
  "lakeside",
  "valley",
  "cliff",
  "dam",
  "promontory",
  "cup",
  "plate",
  "tray",
  "bowl",
  "tile",
  "concrete",
  "cement",
  "floor",
  "crack",
  "hole",
  "pothole"
];

function normalizeImagenetCategory(label) {
  const l = String(label || "").toLowerCase();
  if (
    l.includes("garbage") ||
    l.includes("trash") ||
    l.includes("ashcan") ||
    l.includes("plastic bag") ||
    l.includes("toilet")
  ) {
    return "Sanitation";
  }
  if (
    l.includes("street") ||
    l.includes("traffic") ||
    l.includes("highway") ||
    l.includes("parking") ||
    l.includes("tow truck") ||
    l.includes("snowplow") ||
    l.includes("jeep") ||
    l.includes("minivan") ||
    l.includes("trailer") ||
    l.includes("pickup") ||
    l.includes("school bus") ||
    l.includes("fire engine") ||
    l.includes("gravel") ||
    l.includes("manhole") ||
    l.includes("street sign") ||
    l.includes("traffic light") ||
    l.includes("pavement") ||
    l.includes("asphalt")
  ) {
    return "Road";
  }
  if (
    l.includes("water") ||
    l.includes("fountain") ||
    l.includes("swimming") ||
    l.includes("snorkel") ||
    l.includes("paddle") ||
    l.includes("canoe") ||
    l.includes("tub") ||
    l.includes("shower")
  ) {
    return "Water";
  }
  if (
    l.includes("spotlight") ||
    l.includes("lampshade") ||
    l.includes("radio") ||
    l.includes("television") ||
    l.includes("monitor") ||
    l.includes("screen") ||
    l.includes("laptop") ||
    l.includes("desktop") ||
    l.includes("microwave") ||
    l.includes("iron")
  ) {
    return "Electricity";
  }
  if (l.includes("envelope") || l.includes("wallet") || l.includes("menu") || l.includes("packet")) {
    return "Billing";
  }
  return "General";
}

function roadHintScoreFromTopLabels(topLabels) {
  if (!Array.isArray(topLabels) || !topLabels.length) return 0;
  let s = 0;
  for (const row of topLabels) {
    const raw = String(row.label || "").toLowerCase();
    const weight = Number(row.score) || 0;
    const parts = raw
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    for (const part of parts) {
      if (ROAD_LABEL_HINTS.some((h) => part.includes(h))) s += weight;
    }
  }
  return s;
}

function scoreLabels(labels) {
  const scores = { Electricity: 0, Water: 0, Road: 0, Sanitation: 0, Billing: 0, General: 0 };
  for (const row of labels) {
    const cat = normalizeImagenetCategory(row.label);
    const s = Number(row.score) || 0;
    scores[cat] += s;
  }
  let best = "General";
  let max = scores.General;
  for (const c of CATEGORIES) {
    if (scores[c] > max) {
      max = scores[c];
      best = c;
    }
  }
  const top = Number(labels[0]?.score) || 0;
  const confidence = Math.min(0.92, Math.max(0.28, max > 0 ? max : top * 0.45));
  return { category: best, confidence, topLabels: labels };
}

export async function classifyImageWithHuggingFace(filePath) {
  const key = process.env.HF_API_KEY;
  const model = process.env.HF_IMAGE_MODEL || "google/vit-base-patch16-224";
  if (!key || !filePath) return null;

  const buf = fs.readFileSync(filePath);
  const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/octet-stream"
    },
    body: buf
  });

  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data)) return null;

  const labels = data
    .slice(0, 8)
    .map((x) => ({ label: String(x.label || x.class || ""), score: Number(x.score || x.confidence || 0) }))
    .filter((x) => x.label);

  if (!labels.length) return null;

  const { category, confidence, topLabels } = scoreLabels(labels);
  return {
    category,
    confidence,
    topLabels,
    urgency: urgencyFromCategory(category),
    aiSource: "huggingface-image"
  };
}

export function mergeImageSignals({ fileMeta, caption, clientPrediction, serverPrediction }) {
  const filenameGuess = classifyImageUpload({
    originalname: fileMeta.originalname,
    mimetype: fileMeta.mimetype
  });

  const captionText = String(caption || "").trim();
  const captionGuess = captionText ? classifyComplaintText(captionText) : null;

  const candidates = [];

  if (clientPrediction?.category) {
    candidates.push({
      category: clientPrediction.category,
      confidence: Number(clientPrediction.confidence) || 0.5,
      urgency: clientPrediction.urgency || urgencyFromCategory(clientPrediction.category),
      topLabels: clientPrediction.topLabels || [],
      aiSource: clientPrediction.aiSource || "mobilenet"
    });
  }

  if (serverPrediction?.category) {
    candidates.push({
      category: serverPrediction.category,
      confidence: Number(serverPrediction.confidence) || 0.55,
      urgency: serverPrediction.urgency || urgencyFromCategory(serverPrediction.category),
      topLabels: serverPrediction.topLabels || [],
      aiSource: serverPrediction.aiSource || "huggingface-image"
    });
  }

  candidates.push({
    category: filenameGuess.category,
    confidence: 0.34,
    urgency: filenameGuess.urgency,
    topLabels: [],
    aiSource: "filename"
  });

  if (captionGuess) {
    candidates.push({
      category: captionGuess.category,
      confidence: 0.48,
      urgency: captionGuess.urgency,
      topLabels: [],
      aiSource: "caption-keywords"
    });
  }

  const labelRoadHint = roadHintScoreFromTopLabels(clientPrediction?.topLabels || serverPrediction?.topLabels);
  if (labelRoadHint >= 0.16) {
    candidates.push({
      category: "Road",
      confidence: Math.min(0.78, 0.42 + labelRoadHint * 0.45),
      urgency: urgencyFromCategory("Road"),
      topLabels: clientPrediction?.topLabels || serverPrediction?.topLabels || [],
      aiSource: "image-label-hint"
    });
  }

  candidates.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  const best = candidates[0];

  const summary =
    captionText ||
    `Image complaint classified as ${best.category} (${best.aiSource}).`;

  return {
    category: best.category,
    urgency: best.urgency,
    confidence: Math.min(0.97, Math.max(0.2, best.confidence)),
    summary: summary.slice(0, 280),
    aiSource: best.aiSource,
    topLabels: best.topLabels || [],
    signalsTried: candidates.map((c) => c.aiSource)
  };
}
