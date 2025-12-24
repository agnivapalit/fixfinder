import express from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { httpError } from "../lib/errors.js";
import { countWords } from "../lib/words.js";

export const listingsRouter = express.Router();

const createListingSchema = z.object({
  title: z.string().min(3).max(80),
  category: z.string().min(2).max(40),
  description: z.string().min(1),
  imageUrls: z.array(z.string().min(1)).length(3),
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
