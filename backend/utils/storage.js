import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendRoot = path.join(__dirname, "..");
const dataDir = path.join(backendRoot, "data");

export const paths = {
  backendRoot,
  dataDir,
  db: path.join(backendRoot, "db.json"),
  legacyUsers: path.join(dataDir, "users.json"),
  legacyComplaints: path.join(dataDir, "complaints.json")
};

function readJson(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJsonAtomic(filePath, data) {
  const tmp = `${filePath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmp, filePath);
}

function backfillTicketIds(complaints) {
  const year = new Date().getFullYear();
  let max = 0;
  const re = new RegExp(`^JSA-${year}-(\\d+)$`);
  for (const c of complaints) {
    const m = String(c.ticketId || "").match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  const missing = complaints
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => !c.ticketId)
    .sort((a, b) => new Date(a.c.createdAt).getTime() - new Date(b.c.createdAt).getTime());
  for (const { c } of missing) {
    max += 1;
    c.ticketId = `JSA-${year}-${String(max).padStart(3, "0")}`;
  }
  return complaints;
}

export function ensureDataFiles() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  if (!fs.existsSync(paths.db)) {
    let users = [];
    let complaints = [];

    if (fs.existsSync(paths.legacyUsers)) {
      users = readJson(paths.legacyUsers, []);
    }
    if (fs.existsSync(paths.legacyComplaints)) {
      complaints = readJson(paths.legacyComplaints, []);
    }

    if (!Array.isArray(users) || users.length === 0) {
      users = [
        {
          id: crypto.randomUUID(),
          username: "admin",
          password: "admin123",
          role: "admin",
          createdAt: new Date().toISOString()
        }
      ];
    }
    if (!Array.isArray(complaints)) complaints = [];

    complaints = backfillTicketIds(complaints);
    writeJsonAtomic(paths.db, { users, complaints });
  } else {
    const db = readJson(paths.db, { users: [], complaints: [] });
    const updated = backfillTicketIds(Array.isArray(db.complaints) ? db.complaints : []);
    if (JSON.stringify(updated) !== JSON.stringify(db.complaints)) {
      db.complaints = updated;
      writeJsonAtomic(paths.db, db);
    }
  }

  const uploadsDir = path.join(backendRoot, "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
}

let cache = null;

function loadDb() {
  const raw = readJson(paths.db, { users: [], complaints: [] });
  return {
    users: Array.isArray(raw.users) ? raw.users : [],
    complaints: Array.isArray(raw.complaints) ? raw.complaints : []
  };
}

export function getUsers() {
  if (!cache) cache = loadDb();
  return cache.users;
}

export function saveUsers(users) {
  if (!cache) cache = loadDb();
  cache.users = users;
  writeJsonAtomic(paths.db, cache);
}

export function getComplaints() {
  if (!cache) cache = loadDb();
  return cache.complaints;
}

export function saveComplaints(complaints) {
  if (!cache) cache = loadDb();
  cache.complaints = complaints;
  writeJsonAtomic(paths.db, cache);
}
