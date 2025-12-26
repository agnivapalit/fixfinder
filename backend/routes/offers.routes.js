import express from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { httpError } from "../lib/errors.js";
import { notify } from "../lib/notify.js";

export const offersRouter = express.Router();

offersRouter.use(requireAuth, requireRole("CUSTOMER", "TECHNICIAN", "ADMIN"));

const offerCreateSchema = z.object({
  repairType: z.string().min(2).max(60),
  description: z.string().min(10).max(1000),
  location: z.string().min(2).max(120),
});

// TECHNICIAN: send offer (max 3 per listing per technician)
offersRouter.post("/listings/:listingId/offers", requireRole("TECHNICIAN"), async (req, res, next) => {
  try {
    const listingId = req.params.listingId;
    const data = offerCreateSchema.parse(req.body);

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { customer: { select: { email: true, id: true } } },
    });
    if (!listing) throw httpError(404, "Listing not found");

    const now = new Date();
    if (listing.status !== "ACTIVE" || listing.expiresAt <= now) throw httpError(400, "Listing is not open");
    if (listing.jobDoneAt) throw httpError(400, "Job already marked done");

    const acceptedExists = await prisma.offer.findFirst({
      where: { listingId, status: "ACCEPTED" },
      select: { id: true },
    });
    if (acceptedExists) throw httpError(400, "Offer already accepted for this listing");

    const count = await prisma.offer.count({
      where: { listingId, technicianId: req.user.sub },
    });
    if (count >= 3) throw httpError(400, "Offer limit reached (3)");

    const offer = await prisma.offer.create({
      data: {
        listingId,
        technicianId: req.user.sub,
        repairType: data.repairType,
        description: data.description,
        location: data.location,
      },
      select: {
        id: true,
        repairType: true,
        description: true,
        location: true,
        status: true,
        createdAt: true,
      },
    });

    await notify("offer_sent", {
      listingId,
      offerId: offer.id,
      toEmail: listing.customer.email,
      customerId: listing.customer.id,
      technicianId: req.user.sub,
    });

    res.status(201).json({ offer });
  } catch (err) {
    next(err);
  }
});

// CUSTOMER (owner) / TECH (own) / ADMIN: list offers for a listing
offersRouter.get("/listings/:listingId/offers", async (req, res, next) => {
  try {
    const listingId = req.params.listingId;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { customerId: true },
    });
    if (!listing) throw httpError(404, "Listing not found");

    const isOwner = req.user.role === "CUSTOMER" && listing.customerId === req.user.sub;
    const isAdmin = req.user.role === "ADMIN";

    const where =
      isOwner || isAdmin
        ? { listingId }
        : req.user.role === "TECHNICIAN"
          ? { listingId, technicianId: req.user.sub }
          : null;

    if (!where) throw httpError(403, "Forbidden");

    const offers = await prisma.offer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        repairType: true,
        description: true,
        location: true,
        status: true,
        createdAt: true,
        technician: { select: { id: true, email: true } },
      },
    });

    res.json({ offers });
  } catch (err) {
    next(err);
  }
});

// CUSTOMER (owner) or ADMIN: accept an offer
offersRouter.post("/offers/:offerId/accept", requireRole("CUSTOMER", "ADMIN"), async (req, res, next) => {
  try {
    const offerId = req.params.offerId;

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        listing: { select: { id: true, customerId: true, status: true, jobDoneAt: true } },
        technician: { select: { email: true, id: true } },
      },
    });
    if (!offer) throw httpError(404, "Offer not found");

    const isOwner = req.user.role === "CUSTOMER" && offer.listing.customerId === req.user.sub;
    const isAdmin = req.user.role === "ADMIN";
    if (!isOwner && !isAdmin) throw httpError(403, "Forbidden");

    if (offer.listing.jobDoneAt) throw httpError(400, "Job already done");
    if (offer.listing.status !== "ACTIVE") throw httpError(400, "Listing not active");
    if (offer.status !== "SENT") throw httpError(400, "Offer not in SENT state");

    const acceptedExists = await prisma.offer.findFirst({
      where: { listingId: offer.listing.id, status: "ACCEPTED" },
      select: { id: true },
    });
    if (acceptedExists) throw httpError(400, "Another offer already accepted");

    await prisma.$transaction([
      prisma.offer.update({ where: { id: offerId }, data: { status: "ACCEPTED" } }),
      prisma.offer.updateMany({
        where: { listingId: offer.listing.id, status: "SENT", NOT: { id: offerId } },
        data: { status: "REJECTED" },
      }),
      prisma.listing.update({ where: { id: offer.listing.id }, data: { status: "CLOSED", acceptedTechnicianId: offer.technicianId } }),
    ]);

    await notify("offer_accepted", {
      listingId: offer.listing.id,
      offerId,
      toEmail: offer.technician.email,
      technicianId: offer.technician.id,
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// TECHNICIAN (accepted offer owner) or ADMIN: mark job done
offersRouter.post("/listings/:listingId/done", requireRole("TECHNICIAN", "ADMIN"), async (req, res, next) => {
  try {
    const listingId = req.params.listingId;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { customer: { select: { email: true, id: true } } },
    });
    if (!listing) throw httpError(404, "Listing not found");
    if (listing.jobDoneAt) throw httpError(400, "Already marked done");

    if (req.user.role === "TECHNICIAN") {
      const accepted = await prisma.offer.findFirst({
        where: { listingId, status: "ACCEPTED", technicianId: req.user.sub },
        select: { id: true },
      });
      if (!accepted) throw httpError(403, "No accepted offer for you on this listing");
    }

    await prisma.listing.update({
      where: { id: listingId },
      data: { jobDoneAt: new Date() },
    });

    await notify("job_done", {
      listingId,
      toEmail: listing.customer.email,
      customerId: listing.customer.id,
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});