import { analyzeText, CATEGORIES, defaultImageSummary, urgencyFromCategory } from "./aiEngine.js";

/**
 * Enhanced patterns to better understand infrastructure issues from MobileNet labels.
 * Added specific terms for leakage, electrical poles, and road damage.
 */
const LABEL_PATTERNS = [
  { 
    patterns: ["road", "street", "pothole", "highway", "traffic", "asphalt", "pavement", "jeep", "truck", "bus", "manhole", "freeway", "crack", "sinkhole", "curb"], 
    category: "Road" 
  },
  { 
    patterns: ["garbage", "trash", "waste", "litter", "dumpster", "toilet", "ashcan", "landfill", "vacuum", "diaper", "refuse", "bin"], 
    category: "Sanitation" 
  },
  { 
    // Patterns for leakage and water supply issues
    patterns: ["water", "fountain", "swimming", "fireboat", "canoe", "dam", "hose", "bucket", "tub", "paddle", "leak", "pipe", "drain", "spout", "puddle"], 
    category: "Water" 
  },
  { 
    // Patterns for electrical infrastructure
    patterns: ["electric", "laptop", "modem", "switch", "lampshade", "traffic light", "screen", "monitor", "printer", "spotlight", "pole", "wire", "transformer", "power line"], 
    category: "Electricity" 
  },
  { 
    patterns: ["envelope", "wallet", "cash", "receipt", "ticket", "menu", "notebook", "bill", "invoice"], 
    category: "Billing" 
  },
  { 
    patterns: ["hospital", "clinic", "ambulance", "stethoscope", "mask", "pill", "medicine", "dentist", "syringe", "stretcher", "medical"], 
    category: "Health" 
  },
  { 
    patterns: ["police", "bulletproof", "rifle", "revolver", "holster", "military", "uniform", "handcuff", "prison", "security"], 
    category: "Police" 
  },
  { 
    patterns: ["palace", "dome", "library", "classroom", "desk", "scoreboard", "monument", "throne", "office", "court"], 
    category: "Government" 
  }
];

function labelFragments(label) {
  return String(label || "")
    .toLowerCase()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function categoryFromTopLabels(topLabels) {
  if (!Array.isArray(topLabels) || !topLabels.length) return null;
  const scores = {};
  for (const row of topLabels) {
    const weight = Number(row.score || row.probability) || 0; // Support probability from MobileNet
    for (const frag of labelFragments(row.label || row.className)) {
      for (const { patterns, category } of LABEL_PATTERNS) {
        if (patterns.some((p) => frag.includes(p))) {
          scores[category] = (scores[category] || 0) + weight;
        }
      }
    }
  }
  let best = null;
  let max = 0.12;
  for (const [k, v] of Object.entries(scores)) {
    if (v > max) {
      max = v;
      best = k;
    }
  }
  if (!best) return null;
  return { category: best, confidence: Math.min(0.9, max) };
}

function urgencyRank(u) {
  if (u === "High") return 3;
  if (u === "Medium") return 2;
  return 1;
}

function pickHigherUrgency(a, b) {
  return urgencyRank(a) >= urgencyRank(b) ? a : b;
}

export function mergeImageComplaint({ caption, clientPrediction }) {
  const captionText = String(caption || "").trim();
  const captionAnalysis = captionText ? analyzeText(captionText) : null;

  // 1. Get hints from specific keywords in labels (e.g., "pole", "leak")
  const labelHint = categoryFromTopLabels(clientPrediction?.topLabels || []);
  
  // 2. Get the raw category MobileNet predicted
  const mobilenetCat = clientPrediction?.category;
  const mobilenetConf = Number(clientPrediction?.confidence) || 0;
  const mobilenetUrgency = clientPrediction?.urgency;

  const scores = {};
  function add(cat, w) {
    const c = CATEGORIES.includes(cat) ? cat : "General";
    scores[c] = (scores[c] || 0) + w;
  }

  // Caption analysis is weighted highest
  if (captionAnalysis) {
    add(captionAnalysis.category, 2.5);
  }
  
  // Custom label hints (our keyword mapping) are weighted second
  if (labelHint) {
    add(labelHint.category, 2.0 + (labelHint.confidence || 0));
  }

  // Raw MobileNet category is weighted third
  if (mobilenetCat && mobilenetCat !== "General") {
    add(mobilenetCat, 1.2 + mobilenetConf);
  }

  let bestCat = "General";
  let bestScore = scores.General || 0;
  for (const c of CATEGORIES) {
    const s = scores[c] || 0;
    if (s > bestScore) {
      bestScore = s;
      bestCat = c;
    }
  }

  // --- URGENCY LOGIC ---
  // Default urgency comes from the determined category (Electricity/Health = High)
  let urgency = urgencyFromCategory(bestCat); 
  
  // If the text analysis or MobileNet found a higher urgency, use that
  if (captionAnalysis?.urgency) urgency = pickHigherUrgency(urgency, captionAnalysis.urgency);
  if (mobilenetUrgency) urgency = pickHigherUrgency(urgency, mobilenetUrgency);

  let summary = captionAnalysis?.summary || "";
  if (!summary) summary = defaultImageSummary(bestCat);

  const confidence = Math.min(0.94, Math.max(0.28, mobilenetConf || bestScore / 5.0 || 0.35));

  return {
    category: bestCat,
    urgency,
    summary,
    confidence,
    aiSource: "local-mobilenet+rules",
    topLabels: clientPrediction?.topLabels || []
  };
}