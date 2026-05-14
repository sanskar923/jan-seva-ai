import crypto from "crypto";
import { getUsers, saveUsers } from "../utils/storage.js";
import { signUserToken } from "../utils/jwt.js";

function sanitizeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

function issueAuthResponse(user, res, status = 200) {
  const token = signUserToken(user);
  res.status(status).json({ token, user: sanitizeUser(user) });
}

export function signup(req, res) {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ message: "Username and password required" });
  if (String(password).length < 4) return res.status(400).json({ message: "Password too short" });

  const users = getUsers();
  const exists = users.some((u) => u.username.toLowerCase() === String(username).toLowerCase());
  if (exists) return res.status(409).json({ message: "Username already exists" });

  const user = {
    id: crypto.randomUUID(),
    username: String(username).trim(),
    password: String(password),
    role: "user",
    createdAt: new Date().toISOString()
  };
  users.push(user);
  saveUsers(users);
  issueAuthResponse(user, res, 201);
}

export function login(req, res) {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ message: "Username and password required" });

  const users = getUsers();
  const user = users.find(
    (u) => u.username.toLowerCase() === String(username).toLowerCase() && u.password === String(password)
  );
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  issueAuthResponse(user, res, 200);
}

export function me(req, res) {
  res.json({ user: req.user });
}

export function logout(_req, res) {
  res.json({ ok: true });
}
