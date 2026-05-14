import { getComplaints, saveComplaints } from "../utils/storage.js";

export function listAllComplaints(req, res) {
  const { category, status } = req.query || {};
  let complaints = getComplaints();

  if (category && String(category).trim()) {
    const c = String(category).trim().toLowerCase();
    complaints = complaints.filter((x) => String(x.category).toLowerCase() === c);
  }
  if (status && String(status).trim()) {
    const s = String(status).trim();
    complaints = complaints.filter((x) => String(x.status) === s);
  }

  complaints = [...complaints].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ complaints });
}

export function updateComplaintStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body || {};
  const allowed = ["Submitted", "In Progress", "Resolved", "Rejected"];
  if (!allowed.includes(String(status))) return res.status(400).json({ message: "Invalid status" });

  const complaints = getComplaints();
  const idx = complaints.findIndex((c) => c.id === id);
  if (idx === -1) return res.status(404).json({ message: "Complaint not found" });

  complaints[idx] = { ...complaints[idx], status: String(status), updatedAt: new Date().toISOString() };
  saveComplaints(complaints);
  res.json({ complaint: complaints[idx] });
}
