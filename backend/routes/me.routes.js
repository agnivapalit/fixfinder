import express from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { z } from "zod";
import { httpError } from "../lib/errors.js";

export const meRouter = express.Router();

meRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.sub;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        phoneVerified: true,
        technicianProfile: {
          select: { approved: true, workplace: true, categories: true },
        },
      },
    });

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().min(6).optional(),
});

meRouter.patch("/", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.sub;
    const data = updateProfileSchema.parse(req.body);

    // Build update object with only provided fields
    const updateData = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName?.trim() || null;
    if (data.lastName !== undefined) updateData.lastName = data.lastName?.trim() || null;
    if (data.phone !== undefined) updateData.phone = data.phone || null;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        phoneVerified: true,
      },
    });

    res.json({ user });
  } catch (err) {
    if (err?.code === "P2002") return next(httpError(409, "Phone already in use"));
    next(err);
  }
});
