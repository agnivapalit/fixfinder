import express from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const technicianRouter = express.Router();

technicianRouter.use(requireAuth, requireRole("TECHNICIAN"));

// GET /technician/jobs?type=current|history
technicianRouter.get("/jobs", async (req, res, next) => {
  try {
    const type = typeof req.query.type === "string" ? req.query.type : "current";

    const offers = await prisma.offer.findMany({
      where: {
        technicianId: req.user.sub,
        status: "ACCEPTED",
        listing: type === "current"
          ? { jobDoneAt: null }
          : { jobDoneAt: { not: null } },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        repairType: true,
        description: true,
        location: true,
        createdAt: true,
        listing: {
          select: {
            id: true,
            title: true,
            category: true,
            status: true,
            createdAt: true,
            expiresAt: true,
            jobDoneAt: true,
            customer: { select: { email: true } },
          },
        },
      },
    });

    res.json({ jobs: offers });
  } catch (err) {
    next(err);
  }
});
