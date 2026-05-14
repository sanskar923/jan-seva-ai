export const CATEGORIES = [
  "Electricity",
  "Water",
  "Road",
  "Sanitation",
  "Billing",
  "Health",
  "Police",
  "Government",
  "General"
];

/** * HELPER: Filters out nonsense, gibberish, or spam 
 */
function isNonsense(text) {
  const t = (text || "").trim();
  
  // 1. Reject if too short (less than 10 characters)
  if (t.length < 10) return true;

  // 2. Reject "Keyboard Mashing" (e.g., "aaaaa", "qwertyqwerty")
  if (/(.)\1{4,}/.test(t)) return true;

  // 3. Reject if no vowels (e.g., "bcdfghjkl") - common in English/Hinglish
  if (t.length > 5 && !/[aeiouyAEIOUY]/.test(t)) return true;

  return false;
}

function hasAny(text, words) {
  const t = (text || "").toLowerCase();
  return words.some((w) => t.includes(w));
}

export function detectCategory(text) {
  const t = String(text || "").trim().toLowerCase();
  if (!t) return "General";

  if (hasAny(t, ["hospital", "clinic", "doctor", "patient", "ambulance", "medicine", "vaccine", "fever", "dengue", "health", "ward", "nurse", "pharmacy", "injury", "blood", "medical", "icu"])) {
    return "Health";
  }
  if (hasAny(t, ["police", "fir", "theft", "crime", "assault", "robbery", "constable", "station", "law and order", "missing", "harassment", "violence"])) {
    return "Police";
  }
  if (hasAny(t, ["government", "ration", "aadhaar", "aadhar", "tehsil", "municipality", "municipal", "pension", "scheme", "certificate", "panchayat", "officer", "office", "passport", "rti", "department"])) {
    return "Government";
  }
  if (hasAny(t, ["power", "electric", "electricity", "light", "transformer", "voltage", "meter", "blackout", "wire", "pole", "spark", "substation", "outage"])) {
    return "Electricity";
  }
  if (hasAny(t, ["water", "leak", "pipeline", "tap", "drinking", "sewage", "supply", "drainage", "flooding", "contamination"])) {
    return "Water";
  }
  if (hasAny(t, ["road", "pothole", "street", "bridge", "traffic", "highway", "crack", "broken road", "bad road", "pavement", "asphalt", "sinkhole", "bump", "uneven", "tarmac", "manhole", "shoulder", "divider"])) {
    return "Road";
  }
  if (hasAny(t, ["garbage", "trash", "waste", "dirty", "drain", "toilet", "mosquito", "sanitation", "litter", "septic"])) {
    return "Sanitation";
  }
  if (hasAny(t, ["bill", "billing", "charge", "payment", "fine", "receipt", "overcharged", "invoice", "tariff", "meter reading"])) {
    return "Billing";
  }

  return "General";
}

export function detectUrgency(text) {
  const t = String(text || "").toLowerCase();
  if (/\burgent\b|\bemergency\b|\bdangerous\b|\bdanger\b|\basap\b|\bimmediately\b|\baccident\b|\bfire\b|\belectrocution\b/.test(t)) {
    return "High";
  }
  if (/\bissue\b|\bproblem\b|\bbroken\b|\bleak\b|\bnot working\b/.test(t)) {
    return "Medium";
  }
  return "Low";
}

export function summarizeText(text) {
  const t = String(text || "").trim();
  if (!t) return "";
  const words = t.split(/\s+/).filter(Boolean);
  const slice = words.slice(0, 15);
  const suffix = words.length > 15 ? "…" : "";
  return slice.join(" ") + suffix;
}

export function analyzeText(text) {
  const t = String(text || "").trim();
  
  // NEW: Nonsense protection check
  if (isNonsense(t)) {
    return {
      category: "General",
      urgency: "Low",
      summary: "Invalid input detected.",
      confidence: 0.0, // This tells the server to REJECT
      aiSource: "validation-filter",
      topLabels: ["nonsense"]
    };
  }

  const category = detectCategory(t);
  const urgency = detectUrgency(t);
  const summary = summarizeText(t);
  
  return {
    category,
    urgency,
    summary,
    confidence: category === "General" && t.length > 0 ? 0.38 : t ? 0.74 : 0.25,
    aiSource: "local-rules",
    topLabels: []
  };
}

// (Rest of your existing functions remain the same)
export function classifyFilename({ originalname, mimetype }) {
  const name = (originalname || "").toLowerCase();
  const type = (mimetype || "").toLowerCase();
  let category = "General";
  if (name.includes("hospital") || name.includes("clinic") || name.includes("ambulance") || name.includes("doctor") || name.includes("health")) {
    category = "Health";
  } else if (name.includes("police") || name.includes("fir") || name.includes("theft") || name.includes("crime")) {
    category = "Police";
  } else if (name.includes("office") || name.includes("certificate") || name.includes("ration") || name.includes("aadhaar") || name.includes("aadhar") || name.includes("government")) {
    category = "Government";
  } else if (name.includes("garbage") || name.includes("trash") || name.includes("waste") || name.includes("sanitation")) {
    category = "Sanitation";
  } else if (name.includes("road") || name.includes("pothole") || name.includes("street") || name.includes("broken") || name.includes("crack") || name.includes("damage") || name.includes("highway") || name.includes("pavement")) {
    category = "Road";
  } else if (name.includes("water") || name.includes("leak") || name.includes("pipe")) {
    category = "Water";
  } else if (name.includes("bill") || name.includes("invoice") || name.includes("billing")) {
    category = "Billing";
  } else if (name.includes("electric") || name.includes("meter") || name.includes("power") || name.includes("pole")) {
    category = "Electricity";
  } else if (type.startsWith("image/")) {
    category = "General";
  }
  const urgency = urgencyFromCategory(category);
  return { category, urgency, categories: CATEGORIES };
}

export function urgencyFromCategory(category) {
  if (category === "Electricity" || category === "Road" || category === "Police" || category === "Health") return "Medium";
  if (category === "Water" || category === "Sanitation") return "Medium";
  if (category === "Government" || category === "Billing") return "Low";
  return "Low";
}

export function defaultImageSummary(category) {
  const c = category || "General";
  const text = `Image-based complaint — ${c}.`;
  const words = text.split(/\s+/).filter(Boolean).slice(0, 15).join(" ");
  return words.endsWith(".") ? words : `${words}.`;
}