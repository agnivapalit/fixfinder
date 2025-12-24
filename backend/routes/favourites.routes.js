import express from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { httpError } from "../lib/errors.js";

export const favouritesRouter = express.Router();

favouritesRouter.use(requireAuth, requireRole("TECHNICIAN"));

// List my favourites
favouritesRouter.get("/", async (req, res, next) => {
  try {
    const favs = await prisma.favourite.findMany({
      where: { technicianId: req.user.sub },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        listing: {
          select: { id: true, title: true, category: true, expiresAt: true, createdAt: true },
        },
      },
    });
    res.json({ favourites: favs });
  } catch (err) {
    next(err);
  }
});

// Toggle favourite for a listing
favouritesRouter.post("/toggle/:listingId", async (req, res, next) => {
  try {
    const listingId = req.params.listingId;

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw httpError(404, "Listing not found");

    const existing = await prisma.favourite.findUnique({
      where: { technicianId_listingId: { technicianId: req.user.sub, listingId } },
    });

    if (existing) {
      await prisma.favourite.delete({ where: { id: existing.id } });
      return res.json({ favourited: false });
    }

    await prisma.favourite.create({
      data: { technicianId: req.user.sub, listingId },
    });

    res.json({ favourited: true });
  } catch (err) {
    next(err);
  }
});
