import express from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const technicianReviewsRouter = express.Router();

technicianReviewsRouter.use(requireAuth, requireRole("TECHNICIAN"));

technicianReviewsRouter.get("/my-reviews", async (req, res, next) => {
  try {
    const profile = await prisma.technicianProfile.findUnique({
      where: { userId: req.user.sub },
      select: { ratingAvg: true, ratingCount: true },
    });

    const reviews = await prisma.review.findMany({
      where: { technicianId: req.user.sub },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        listing: { select: { id: true, title: true, category: true } },
      },
    });

    res.json({ profile, reviews });
  } catch (err) {
    next(err);
  }
});
