import { getUsers } from "../utils/storage.js";
import { verifyUserToken } from "../utils/jwt.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const payload = verifyUserToken(token);
    const users = getUsers();
    const user = users.find((u) => u.id === payload.sub);
    if (!user) return res.status(401).json({ message: "Invalid token user" });

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role || payload.role || "user"
    };
    req.token = token;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admin only" });
  next();
}
