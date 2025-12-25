import express from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { httpError } from "../lib/errors.js";
import { notify } from "../lib/notify.js";

export const reviewsRouter = express.Router();

reviewsRouter.use(requireAuth, requireRole("CUSTOMER", "ADMIN"));

// Get review for a listing (owner/admin)
reviewsRouter.get("/listings/:listingId/review", async (req, res, next) => {
  try {
    const listingId = req.params.listingId;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { customerId: true },
    });
    if (!listing) throw httpError(404, "Listing not found");

    const isOwner = req.user.role === "CUSTOMER" && listing.customerId === req.user.sub;
    const isAdmin = req.user.role === "ADMIN";
    if (!isOwner && !isAdmin) throw httpError(403, "Forbidden");

    const review = await prisma.review.findUnique({
      where: { listingId },
      select: { id: true, rating: true, comment: true, createdAt: true, technicianId: true },
    });

    res.json({ review });
  } catch (err) {
    next(err);
  }
});

// Create review (owner only; only after job done; only once)
reviewsRouter.post("/listings/:listingId/review", requireRole("CUSTOMER"), async (req, res, next) => {
  try {
    const listingId = req.params.listingId;

    const schema = z.object({
      rating: z.number().int().min(1).max(5),
      comment: z.string().max(1000).optional(),
    });
    const { rating, comment } = schema.parse(req.body);

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, customerId: true, jobDoneAt: true },
    });
    if (!listing) throw httpError(404, "Listing not found");
    if (listing.customerId !== req.user.sub) throw httpError(403, "Not your listing");
    if (!listing.jobDoneAt) throw httpError(400, "Job not marked done yet");

    const existing = await prisma.review.findUnique({ where: { listingId } });
    if (existing) throw httpError(409, "Review already exists");

    // Determine the technician from the accepted offer
    const accepted = await prisma.offer.findFirst({
      where: { listingId, status: "ACCEPTED" },
      select: { technicianId: true, technician: { select: { id: true, email: true } } },
    });
    if (!accepted) throw httpError(400, "No accepted offer found for this listing");

    const technicianProfile = await prisma.technicianProfile.findUnique({
      where: { userId: accepted.technicianId },
      select: { ratingAvg: true, ratingCount: true },
    });
    if (!technicianProfile) throw httpError(400, "Technician profile missing");

    const newCount = technicianProfile.ratingCount + 1;
    const newAvg = (technicianProfile.ratingAvg * technicianProfile.ratingCount + rating) / newCount;

    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          listingId,
          customerId: req.user.sub,
          technicianId: accepted.technicianId,
          rating,
          comment,
        },
        select: { id: true, rating: true, comment: true, createdAt: true },
      });

      await tx.technicianProfile.update({
        where: { userId: accepted.technicianId },
        data: { ratingAvg: newAvg, ratingCount: newCount },
      });

      return created;
    });

    await notify("review_created", {
      listingId,
      toEmail: accepted.technician.email,
      technicianId: accepted.technician.id,
      rating,
    });

    res.status(201).json({ review: result });
  } catch (err) {
    next(err);
  }
});
