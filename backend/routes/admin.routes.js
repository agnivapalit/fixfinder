import express from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { httpError } from "../lib/errors.js";

export const adminRouter = express.Router();

adminRouter.use(requireAuth, requireRole("ADMIN"));

// List pending technician approvals
adminRouter.get("/technicians/pending", async (req, res, next) => {
  try {
    const pending = await prisma.technicianProfile.findMany({
      where: { approved: false },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        userId: true,
        createdAt: true,
        user: { select: { email: true, phone: true, role: true, isBanned: true } },
      },
    });
    res.json({ pending });
  } catch (err) {
    next(err);
  }
});

// Approve technician
adminRouter.post("/technicians/:userId/approve", async (req, res, next) => {
  try {
    const userId = req.params.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { technicianProfile: true },
    });
    if (!user) throw httpError(404, "User not found");
    if (user.role !== "TECHNICIAN") throw httpError(400, "User is not a technician");
    if (!user.technicianProfile) throw httpError(400, "Missing technician profile");

    await prisma.technicianProfile.update({
      where: { userId },
      data: { approved: true },
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Reject technician (keeps account but removes technician ability)
adminRouter.post("/technicians/:userId/reject", async (req, res, next) => {
  try {
    const userId = req.params.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { technicianProfile: true },
    });
    if (!user) throw httpError(404, "User not found");
    if (user.role !== "TECHNICIAN") throw httpError(400, "User is not a technician");

    await prisma.$transaction([
      prisma.technicianProfile.deleteMany({ where: { userId } }),
      prisma.user.update({ where: { id: userId }, data: { role: "CUSTOMER" } }),
    ]);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
