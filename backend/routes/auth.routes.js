import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../db.js";
import { httpError } from "../lib/errors.js";

export const authRouter = express.Router();

const signupSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(6).optional(),
  password: z.string().min(8),
  role: z.enum(["CUSTOMER", "TECHNICIAN"]).optional(),
  certifications: z.union([z.string(), z.array(z.string())]).optional(),
  experience: z.union([z.string(), z.number()]).optional(),
  workplace: z.enum(["IN_SHOP", "FLEXIBLE"]).optional(),
  experiences: z.array(z.string()).optional(),
});

authRouter.post("/signup", async (req, res, next) => {
  try {
    const data = signupSchema.parse(req.body);

    const ban = await prisma.ban.findFirst({
      where: {
        OR: [{ email: data.email.toLowerCase() }, { phone: data.phone }],
      },
    });
    if (ban) throw httpError(403, "Registration blocked");

    const passwordHash = await bcrypt.hash(data.password, 10);

    // parse experience into integer years (accept number or string)
    let experienceYears = 0;
    if (typeof data.experience === "number" && Number.isFinite(data.experience)) {
      experienceYears = Math.max(0, Math.floor(data.experience));
    } else {
      experienceYears = Number.parseInt(String(data.experience || "").trim(), 10) || 0;
    }

    // prepare certifications JSON string: accept either CSV string, stringified JSON, or array
    let certificationsStr = "[]";
    if (data.certifications) {
      if (Array.isArray(data.certifications)) certificationsStr = JSON.stringify(data.certifications);
      else {
        // try to detect if it's a JSON array string
        try {
          const parsed = JSON.parse(String(data.certifications));
          if (Array.isArray(parsed)) certificationsStr = JSON.stringify(parsed);
          else certificationsStr = JSON.stringify(String(data.certifications).split(",").map(s => s.trim()).filter(Boolean));
        } catch (e) {
          certificationsStr = JSON.stringify(String(data.certifications).split(",").map(s => s.trim()).filter(Boolean));
        }
      }
    } else if (data.experiences && Array.isArray(data.experiences)) {
      // If experiences were submitted, store them in the certifications column as JSON for now
      certificationsStr = JSON.stringify(data.experiences);
    }

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        phone: data.phone,
        passwordHash,
        role: data.role ?? "CUSTOMER",
        ...(data.role === "TECHNICIAN"
          ? {
              technicianProfile: {
                create: {
                  workplace: data.workplace ?? "IN_SHOP",
                  certifications: certificationsStr,
                  experienceYears,
                },
              },
            }
          : {}),
      },
      select: { id: true, email: true, role: true },
    });

    res.status(201).json({ user });
  } catch (err) {
    // Prisma unique constraint -> friendly message
    if (err?.code === "P2002") return next(httpError(409, "Email/phone already in use"));
    next(err);
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      include: { technicianProfile: true },
    });
    if (!user) return next(httpError(401, "Invalid credentials"));
    if (user.isBanned) return next(httpError(403, "Account banned"));

    // Technician approval pending
    if (user.role === "TECHNICIAN" && !user.technicianProfile?.approved) {
      return next(httpError(403, "Technician pending admin approval"));
    }

    const ok = await bcrypt.compare(data.password, user.passwordHash);
    if (!ok) return next(httpError(401, "Invalid credentials"));

    const ban = await prisma.ban.findFirst({
      where: {
        OR: [{ email: user.email }, { phone: user.phone }],
      },
    });
    if (ban) throw httpError(403, "Account banned");

    const token = jwt.sign(
      { sub: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

// Mock verification endpoints (temp)
authRouter.post("/mock-verify-email", async (req, res, next) => {
  try {
    const schema = z.object({ email: z.string().email() });
    const { email } = schema.parse(req.body);

    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { emailVerified: true },
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/mock-verify-phone", async (req, res, next) => {
  try {
    const schema = z.object({ email: z.string().email() });
    const { email } = schema.parse(req.body);

    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { phoneVerified: true },
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
