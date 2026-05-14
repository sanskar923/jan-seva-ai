function replyFor(message) {
  const m = (message || "").toLowerCase();
  if (!m.trim()) return "Please type your question and I’ll help.";

  if (m.includes("hello") || m.includes("hi") || m.includes("namaste")) {
    return "Namaste! I’m SevaBot. You can report complaints (Electricity, Water, Road, Sanitation, Billing, Health, Police, Government) or ask how to use the dashboard.";
  }
  if (m.includes("how") && (m.includes("complaint") || m.includes("report"))) {
    return "Go to Dashboard → type your complaint, or use Voice to dictate, or upload an image. MobileNet runs in your browser; the server uses local rules to finalize category and urgency.";
  }
  if (m.includes("status") || m.includes("track")) {
    return "Open Dashboard → Complaints list. Each item shows ticket ID, category, urgency, and status (Submitted/In Progress/Resolved).";
  }
  if (m.includes("ticket") || m.includes("jsa")) {
    return "Every complaint gets a ticket like JSA-2026-001. You’ll see it in your history after you submit.";
  }
  if (m.includes("electric") || m.includes("power") || m.includes("light")) {
    return "For electricity issues, include location, pole/transformer number if any, and whether it’s a safety hazard.";
  }
  if (m.includes("water") || m.includes("leak") || m.includes("pipeline")) {
    return "For water issues, mention leak point (street/house), duration, and whether supply is fully stopped.";
  }
  if (m.includes("road") || m.includes("pothole")) {
    return "For road issues, share landmark, approximate size of damage, and whether it’s causing accidents or blockage.";
  }
  if (m.includes("garbage") || m.includes("drain") || m.includes("sanitation")) {
    return "For sanitation issues, mention exact spot, how long it’s been pending, and if there’s foul smell or mosquito breeding.";
  }
  if (m.includes("bill") || m.includes("payment") || m.includes("overcharge")) {
    return "For billing issues, include consumer ID (if comfortable), bill month, and what looks incorrect.";
  }
  if (m.includes("health") || m.includes("hospital") || m.includes("clinic") || m.includes("ambulance")) {
    return "For health-related civic issues, name the facility or area, what service failed, and if it’s urgent for patient safety.";
  }
  if (m.includes("police") || m.includes("theft") || m.includes("crime") || m.includes("fir")) {
    return "For police-related reports on this portal, describe the incident type, location, time, and whether you already visited the station.";
  }
  if (m.includes("government") || m.includes("ration") || m.includes("certificate") || m.includes("scheme")) {
    return "For government scheme or certificate issues, mention department, application ID if any, and how long it’s delayed.";
  }
  return "I can help you report a complaint or guide you to the right category. Try: 'How to report a complaint?' or tell me your issue briefly.";
}

export function chat(req, res) {
  const { message } = req.body || {};
  res.json({ reply: replyFor(String(message || "")) });
}
