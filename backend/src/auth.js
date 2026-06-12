import jwt from "jsonwebtoken";
import { config } from "./config.js";

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name, role: user.role, username: user.username },
    config.jwtSecret,
    { expiresIn: "7d" },
  );
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Não autenticado." });
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.auth = payload;
    return next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }
}

export function requireRole(role) {
  return function (req, res, next) {
    if (!req.auth?.role) return res.status(403).json({ error: "Permissão insuficiente." });
    if (req.auth.role !== role) return res.status(403).json({ error: "Permissão insuficiente." });
    return next();
  };
}

export const requireAdmin = requireRole("ADMIN");

