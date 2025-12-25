import express from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { httpError } from "../lib/errors.js";
import { countWords } from "../lib/words.js";
import { notify } from "../lib/notify.js";

export const listingsRouter = express.Router();

const createListingSchema = z.object({
  title: z.string().min(3).max(80),
  category: z.string().min(2).max(40),
  description: z.string().min(1),
  imageUrls: z.array(z.string().min(1)).length(3),
});

const createBidSchema = z.object({
  priceCents: z.number().int().min(100), // min €1.00 style
  note: z.string().max(500).optional(),
});

// Create listing (CUSTOMER only)
listingsRouter.post(
  "/",
  requireAuth,
  requireRole("CUSTOMER"),
  async (req, res, next) => {
    try {
      const data = createListingSchema.parse(req.body);

      if (countWords(data.description) < 50) {
        throw httpError(400, "Description must be at least 50 words");
      }

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const listing = await prisma.listing.create({
        data: {
          customerId: req.user.sub,
          title: data.title,
          category: data.category,
          description: data.description,
          imageUrls: JSON.stringify(data.imageUrls),
          status: "ACTIVE",
          expiresAt,
        },
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          createdAt: true,
          expiresAt: true,
        },
      });

      res.status(201).json({ listing });
    } catch (err) {
      next(err);
    }
  }
);

// Browse active listings (TECHNICIAN + CUSTOMER)
listingsRouter.get(
  "/",
  requireAuth,
  requireRole("TECHNICIAN", "CUSTOMER", "ADMIN"),
  async (req, res, next) => {
    try {
      const now = new Date();
      const category = typeof req.query.category === "string" ? req.query.category : null;

      // show only active + not expired
      const listings = await prisma.listing.findMany({
        where: {
          status: "ACTIVE",
          expiresAt: { gt: now },
          ...(category ? { category } : {}),
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          category: true,
          createdAt: true,
          expiresAt: true,
        },
      });

      res.json({ listings });
    } catch (err) {
      next(err);
    }
  }
);

// Customer: my listings
listingsRouter.get(
  "/mine",
  requireAuth,
  requireRole("CUSTOMER"),
  async (req, res, next) => {
    try {
      const listings = await prisma.listing.findMany({
        where: { customerId: req.user.sub },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          createdAt: true,
          expiresAt: true,
        },
      });

      res.json({ listings });
    } catch (err) {
      next(err);
    }
  }
);

//Create Bid (TECH)
listingsRouter.post(
  "/:id/bids",
  requireAuth,
  requireRole("TECHNICIAN"),
  async (req, res, next) => {
    try {
      const listingId = req.params.id;
      const data = createBidSchema.parse(req.body);

      const listing = await prisma.listing.findUnique({ where: { id: listingId } });
      if (!listing) throw httpError(404, "Listing not found");

      const now = new Date();
      if (listing.status !== "ACTIVE" || listing.expiresAt <= now) {
        throw httpError(400, "Listing is not open for bidding");
      }

      const bid = await prisma.bid.upsert({
        where: { listingId_technicianId: { listingId, technicianId: req.user.sub } },
        create: {
          listingId,
          technicianId: req.user.sub,
          priceCents: data.priceCents,
          note: data.note,
        },
        update: {
          priceCents: data.priceCents,
          note: data.note,
        },
        select: { id: true, priceCents: true, note: true, createdAt: true },
      });

      const listingWithCustomer = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { customer: { select: { email: true, id: true } } },
      });

      await notify("bid_received", {
        listingId,
        toEmail: listingWithCustomer.customer.email,
        customerId: listingWithCustomer.customer.id,
      });

      res.status(201).json({ bid });
    } catch (err) {
      next(err);
    }
  }
);

//List Bids for a post
listingsRouter.get(
  "/:id/bids",
  requireAuth,
  requireRole("CUSTOMER", "TECHNICIAN", "ADMIN"),
  async (req, res, next) => {
    try {
      const listingId = req.params.id;

      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { customerId: true },
      });
      if (!listing) throw httpError(404, "Listing not found");

      const isOwner = req.user.role === "CUSTOMER" && listing.customerId === req.user.sub;
      const isAdmin = req.user.role === "ADMIN";

      if (!isOwner && !isAdmin && req.user.role !== "TECHNICIAN") {
        throw httpError(403, "Forbidden");
      }

      // Sorting: price asc/desc (rating later)
      const sort = typeof req.query.sort === "string" ? req.query.sort : "price_asc";

      const orderBy =
        sort === "price_desc"
          ? [{ priceCents: "desc" }]
          : sort === "rating_desc"
            ? [{ technician: { technicianProfile: { ratingAvg: "desc" } } }]
            : sort === "rating_asc"
              ? [{ technician: { technicianProfile: { ratingAvg: "asc" } } }]
              : [{ priceCents: "asc" }];


      const where =
        req.user.role === "TECHNICIAN" && !isAdmin
          ? { listingId, technicianId: req.user.sub }
          : { listingId };

      const bids = await prisma.bid.findMany({
        where,
        orderBy,
        select: {
          id: true,
          priceCents: true,
          note: true,
          createdAt: true,
          technician: { select: { id: true, email: true,
            technicianProfile: { select: { ratingAvg: true, ratingCount: true } } } }, 
        },
      });

      res.json({ bids });
    } catch (err) {
      next(err);
    }
  }
);

// Listing details
listingsRouter.get(
  "/:id",
  requireAuth,
  requireRole("TECHNICIAN", "CUSTOMER", "ADMIN"),
  async (req, res, next) => {
    try {
      const listing = await prisma.listing.findUnique({
        where: { id: req.params.id },
        include: { customer: { select: { id: true, email: true } } },
      });
      if (!listing) throw httpError(404, "Listing not found");

      res.json({
        listing: {
          id: listing.id,
          title: listing.title,
          category: listing.category,
          description: listing.description,
          imageUrls: JSON.parse(listing.imageUrls || "[]"),
          status: listing.status,
          createdAt: listing.createdAt,
          expiresAt: listing.expiresAt,
          customer: listing.customer,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);
