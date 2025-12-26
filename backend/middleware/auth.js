import jwt from "jsonwebtoken";
import { httpError } from "../lib/errors.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(httpError(401, "Missing token"));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { sub, role }
    next();
  } catch {
    next(httpError(401, "Invalid token"));
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(httpError(401, "Unauthorized"));

    const got = String(req.user.role ?? "").trim().toUpperCase();
    const allowed = roles.map((r) => String(r).trim().toUpperCase());

    if (!allowed.includes(got)) {
      console.log("ROLE CHECK FAIL:", { method: req.method, url: req.originalUrl, gotRaw: req.user.role, got, allowed, sub: req.user.sub });
      return next(httpError(403, "Forbidden"));
    }

    // normalize for downstream code
    req.user.role = got;
    next();
  };
}
