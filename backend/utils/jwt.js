import jwt from "jsonwebtoken";

export function signUserToken(user) {
  const secret = process.env.JWT_SECRET || "dev-insecure-change-me";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role || "user" },
    secret,
    { expiresIn }
  );
}

export function verifyUserToken(token) {
  const secret = process.env.JWT_SECRET || "dev-insecure-change-me";
  return jwt.verify(token, secret);
}
