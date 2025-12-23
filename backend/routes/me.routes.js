import express from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

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
