import jwt from "jsonwebtoken";
import { httpError } from "../lib/errors.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";

  // Accept "Bearer <token>" (case-insensitive) + trim whitespace
  const match = header.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();

  if (!token) return next(httpError(401, "Missing token"));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    // Temporary: surface the real reason
    console.error("JWT verify failed:", e.message);
    return next(httpError(401, `Invalid token (${e.message})`));
  }
}
