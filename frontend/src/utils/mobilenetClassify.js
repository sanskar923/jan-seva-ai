import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";

let modelPromise = null;

/** Clears the cached model so the next run downloads/loads again (e.g. after WebGL loss). */
export function resetMobilenetModel() {
  modelPromise = null;
}

async function ensureTfBackend() {
  await tf.ready();
  try {
    const webglOk = await tf.setBackend("webgl");
    if (webglOk) return;
  } catch {
    // try cpu
  }
  try {
    await tf.setBackend("cpu");
  } catch {
    // last resort: leave default
  }
}

export function loadMobilenetModel() {
  if (!modelPromise) {
    const p = (async () => {
      await ensureTfBackend();
      return mobilenet.load({ version: 2, alpha: 1.0 });
    })();
    modelPromise = p.catch((err) => {
      modelPromise = null;
      throw err;
    });
  }
  return modelPromise;
}

/** ImageNet labels are comma-separated synonyms; score each fragment. */
function labelParts(className) {
  return String(className || "")
    .toLowerCase()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const BUCKETS = {
  Sanitation: [
    "garbage",
    "trash",
    "ashcan",
    "dustbin",
    "bin",
    "toilet",
    "shower cap",
    "vacuum",
    "diaper",
    "plastic bag",
    "landfill",
    "litter",
    "dumpster"
  ],
  // Pothole / road damage rarely matches a single ImageNet class — use broad vehicle + street + surface cues.
  Road: [
    "street",
    "road",
    "highway",
    "freeway",
    "pavement",
    "asphalt",
    "traffic",
    "parking",
    "parking lot",
    "tow truck",
    "snowplow",
    "jeep",
    "minivan",
    "moving van",
    "street sign",
    "traffic light",
    "pickup",
    "school bus",
    "bullet train",
    "forklift",
    "trailer truck",
    "fire engine",
    "garbage truck",
    "police van",
    "trolleybus",
    "streetcar",
    "cab",
    "taxi",
    "limousine",
    "convertible",
    "sports car",
    "racer",
    "minibus",
    "recreational vehicle",
    "grille",
    "bicycle",
    "unicycle",
    "motor scooter",
    "tractor",
    "harvester",
    "plow",
    "barrow",
    "shopping cart",
    "manhole",
    "drain",
    "grate",
    "guardrail",
    "traffic",
    "meter",
    "stoplight",
    "viaduct",
    "steel arch bridge",
    "suspension bridge",
    "breakwater",
    "promontory",
    "valley",
    "alp",
    "cliff",
    "stone wall",
    "lakeside",
    "seashore",
    "sandbar",
    "geyser",
    "dam",
    "maze",
    "tile roof",
    "tile",
    "shingle",
    "gravel",
    "worm fence",
    "picket fence",
    "turnstile"
  ],
  Water: [
    "water",
    "fountain",
    "swimming",
    "snorkel",
    "beer bottle",
    "fireboat",
    "paddle",
    "canoe",
    "dam",
    "tub",
    "wash",
    "shower",
    "bucket",
    "hose",
    "rain barrel"
  ],
  Electricity: [
    "electric",
    "laptop",
    "desktop",
    "modem",
    "switch",
    "microwave",
    "iron",
    "spotlight",
    "lampshade",
    "traffic light",
    "digital clock",
    "radio",
    "television",
    "monitor",
    "screen",
    "cellular",
    "iPod",
    "projector",
    "printer",
    "power"
  ],
  Billing: ["envelope", "wallet", "cash", "packet", "menu", "ticket", "comic book", "receipt", "rule", "notebook"],
  Health: [
    "hospital",
    "clinic",
    "ambulance",
    "stethoscope",
    "mask",
    "pill",
    "medicine",
    "dentist",
    "syringe",
    "stretcher",
    "lab coat",
    "radiology",
    "operating",
    "nurse",
    "band aid",
    "gown"
  ],
  Police: [
    "police",
    "bulletproof",
    "rifle",
    "revolver",
    "holster",
    "military",
    "uniform",
    "handcuff",
    "prison",
    "barbershop",
    "street sign"
  ],
  Government: [
    "palace",
    "dome",
    "library",
    "classroom",
    "desk",
    "scoreboard",
    "monument",
    "throne",
    "altar",
    "church",
    "mosque",
    "bell tower",
    "triumphal arch"
  ]
};

/** Extra road signal when buckets miss (e.g. pothole → “cup”, “plate”, “tray”). */
const ROAD_INFER_STRONG = [
  "street",
  "road",
  "highway",
  "traffic",
  "parking",
  "sign",
  "jeep",
  "truck",
  "bus",
  "van",
  "pickup",
  "taxi",
  "cab",
  "wheel",
  "tire",
  "bumper",
  "windshield",
  "vehicle",
  "manhole",
  "drain",
  "gravel",
  "pavement",
  "asphalt",
  "lane",
  "bridge",
  "construction",
  "tractor",
  "bulldozer",
  "forklift",
  "plow",
  "guard",
  "barrier",
  "cone",
  "meter",
  "light",
  "dirt",
  "mud",
  "track",
  "path",
  "crack",
  "hole",
  "pothole",
  "cement",
  "concrete",
  "floor",
  "tile",
  "plate",
  "tray",
  "dish",
  "saucer",
  "bowl",
  "cup",
  "coffee",
  "tabletop",
  "countertop",
  "parallel",
  "strip",
  "line",
  "groove",
  "ridge"
];

const ROAD_INFER_WEAK = ["valley", "alp", "cliff", "lakeside", "dam", "seashore", "sandbar", "promontory", "geyser"];

function roadInferenceScore(predictions) {
  let s = 0;
  for (const p of predictions) {
    const prob = Number(p.probability) || 0;
    for (const part of labelParts(p.className)) {
      if (ROAD_INFER_STRONG.some((k) => part.includes(k))) s += prob;
      else if (ROAD_INFER_WEAK.some((k) => part.includes(k))) s += prob * 0.35;
    }
  }
  return s;
}

function mapPredictionsToComplaint(predictions) {
  const scores = {
    Electricity: 0,
    Water: 0,
    Road: 0,
    Sanitation: 0,
    Billing: 0,
    Health: 0,
    Police: 0,
    Government: 0,
    General: 0
  };

  for (const p of predictions) {
    const prob = Number(p.probability) || 0;
    for (const part of labelParts(p.className)) {
      for (const [cat, keywords] of Object.entries(BUCKETS)) {
        if (keywords.some((k) => part.includes(k))) scores[cat] += prob;
      }
    }
  }

  let bestCat = "General";
  let best = scores.General;
  for (const [c, v] of Object.entries(scores)) {
    if (v > best) {
      best = v;
      bestCat = c;
    }
  }

  const roadInfer = roadInferenceScore(predictions);

  // Broken-road / pothole photos often map to "General" or weak labels (cup, plate, texture) — boost Road.
  if (roadInfer >= 0.18 && bestCat === "General") {
    bestCat = "Road";
    best = Math.max(scores.Road, roadInfer, 0.42);
  } else if (
    bestCat === "Sanitation" &&
    roadInfer >= 0.24 &&
    scores.Sanitation < 0.42 &&
    scores.Road + roadInfer * 0.85 >= scores.Sanitation
  ) {
    // Only override Sanitation when trash signal is weak (avoid garbage heaps mis-tagged as roads).
    bestCat = "Road";
    best = Math.max(scores.Road, roadInfer);
  } else if (bestCat !== "Road" && roadInfer >= 0.32 && scores.Road + roadInfer * 0.5 > best * 0.85) {
    bestCat = "Road";
    best = Math.max(scores.Road, roadInfer);
  }

  const topProb = predictions[0]?.probability || 0;
  let confidence =
    best > 0 ? Math.min(0.94, Math.max(0.3, best)) : Math.min(0.78, Math.max(0.24, topProb * 0.55));

  if (bestCat === "Road" && roadInfer >= 0.15) {
    confidence = Math.min(0.92, Math.max(confidence, 0.38 + roadInfer * 0.35));
  }

  return {
    category: bestCat,
    confidence,
    topLabels: predictions.map((p) => ({ label: p.className, score: p.probability })),
    aiSource: "mobilenet",
    urgency:
      bestCat === "Road" || bestCat === "Electricity" || bestCat === "Police" || bestCat === "Health"
        ? "Medium"
        : bestCat === "General"
          ? "Low"
          : "Medium"
  };
}

export async function classifyImageFile(file) {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.decoding = "async";

  try {
    const model = await loadMobilenetModel();

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error("Image decode failed"));
      img.src = url;
    });

    const predictions = await model.classify(img, 10);
    return mapPredictionsToComplaint(predictions);
  } catch (e) {
    resetMobilenetModel();
    throw e;
  } finally {
    URL.revokeObjectURL(url);
  }
}
