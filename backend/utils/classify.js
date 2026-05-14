import { analyzeText, CATEGORIES, classifyFilename, urgencyFromCategory } from "./aiEngine.js";

export { CATEGORIES, urgencyFromCategory, classifyFilename as classifyImageUpload };

export function classifyComplaintText(text) {
  const r = analyzeText(String(text || "").trim());
  return { category: r.category, urgency: r.urgency, categories: CATEGORIES };
}
