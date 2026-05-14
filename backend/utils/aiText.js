import { classifyComplaintText, CATEGORIES } from "./classify.js";

function clampConfidence(n) {
  if (Number.isNaN(n)) return 0.55;
  return Math.min(0.97, Math.max(0.2, n));
}

function normalizeCategory(raw) {
  const s = String(raw || "").trim();
  const hit = CATEGORIES.find((c) => c.toLowerCase() === s.toLowerCase());
  return hit || "General";
}

function normalizeUrgency(raw) {
  const s = String(raw || "").trim().toLowerCase();
  if (s === "high" || s === "medium" || s === "low") {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  return "Low";
}

function extractJsonObject(text) {
  const t = String(text || "").trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(t.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function classifyWithGemini(text) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

  const prompt = `You classify civic / government service complaints for India-style municipal issues.
Return ONLY valid JSON (no markdown) with keys: category, urgency, summary.
category must be exactly one of: ${CATEGORIES.join(", ")}
urgency must be exactly one of: Low, Medium, High
summary: one clear English sentence (max 220 chars) describing the issue.

Complaint:
"""${text.replace(/"/g, '\\"')}"""`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 256 }
    })
  });

  if (!res.ok) return null;
  const data = await res.json();
  const out =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ||
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "";
  const parsed = extractJsonObject(out);
  if (!parsed) return null;

  return {
    category: normalizeCategory(parsed.category),
    urgency: normalizeUrgency(parsed.urgency),
    summary: String(parsed.summary || "").slice(0, 240) || text.slice(0, 200),
    confidence: 0.82,
    aiSource: "gemini"
  };
}

async function classifyWithOpenAI(text) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 220,
      messages: [
        {
          role: "system",
          content: `You classify civic complaints. Reply ONLY with compact JSON: {"category":"...","urgency":"...","summary":"..."}. category ∈ {${CATEGORIES.join(
            ", "
          )}}. urgency ∈ {Low, Medium, High}. summary ≤ 220 chars.`
        },
        { role: "user", content: text }
      ]
    })
  });

  if (!res.ok) return null;
  const data = await res.json();
  const out = data?.choices?.[0]?.message?.content || "";
  const parsed = extractJsonObject(out);
  if (!parsed) return null;

  return {
    category: normalizeCategory(parsed.category),
    urgency: normalizeUrgency(parsed.urgency),
    summary: String(parsed.summary || "").slice(0, 240) || text.slice(0, 200),
    confidence: 0.8,
    aiSource: "openai"
  };
}

async function classifyWithHuggingFace(text) {
  const key = process.env.HF_API_KEY;
  const model = process.env.HF_TEXT_MODEL || "facebook/bart-large-mnli";
  if (!key) return null;

  const hypothesis = `This complaint is about ${CATEGORIES.join(", ")}.`;
  const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      inputs: text,
      parameters: { candidate_labels: CATEGORIES, hypothesis_template: "This complaint is about {}." }
    })
  });

  if (!res.ok) return null;
  const data = await res.json();
  const labels = data?.labels;
  const scores = data?.scores;
  if (!Array.isArray(labels) || !Array.isArray(scores) || !labels.length) return null;

  const category = normalizeCategory(labels[0]);
  const base = classifyComplaintText(text);
  const topScore = Number(scores[0]) || 0.35;
  return {
    category,
    urgency: base.urgency,
    summary: text.length > 200 ? `${text.slice(0, 200)}…` : text,
    confidence: clampConfidence(topScore),
    aiSource: "huggingface"
  };
}

export async function classifyTextWithAI(text) {
  const trimmed = String(text || "").trim();
  const rules = classifyComplaintText(trimmed);
  const summary =
    trimmed.length > 220 ? `${trimmed.slice(0, 220).trimEnd()}…` : trimmed || `Reported issue: ${rules.category}`;

  try {
    const gemini = await classifyWithGemini(trimmed);
    if (gemini) {
      const mergedUrgency =
        rules.urgency === "High" && gemini.urgency !== "High" ? "High" : gemini.urgency;
      return { ...gemini, urgency: mergedUrgency, confidence: clampConfidence(gemini.confidence) };
    }
  } catch {
    // fall through
  }

  try {
    const openai = await classifyWithOpenAI(trimmed);
    if (openai) {
      const mergedUrgency =
        rules.urgency === "High" && openai.urgency !== "High" ? "High" : openai.urgency;
      return { ...openai, urgency: mergedUrgency, confidence: clampConfidence(openai.confidence) };
    }
  } catch {
    // fall through
  }

  try {
    const hf = await classifyWithHuggingFace(trimmed);
    if (hf) {
      const mergedUrgency = rules.urgency === "High" && hf.urgency !== "High" ? "High" : hf.urgency;
      return { ...hf, urgency: mergedUrgency };
    }
  } catch {
    // fall through
  }

  return {
    category: rules.category,
    urgency: rules.urgency,
    summary,
    confidence: 0.52,
    aiSource: "rules"
  };
}
