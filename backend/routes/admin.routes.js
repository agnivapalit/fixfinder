import express from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const adminRouter = express.Router();

adminRouter.use(requireAuth, requireRole("ADMIN"));

// List pending technician approvals
adminRouter.get("/technicians/pending", async (_, res) => {
  const techs = await prisma.technicianProfile.findMany({
    where: { approved: false },
    include: { user: { select: { id: true, email: true } } },
  });
  res.json({ techs });
});


// Approve technician
adminRouter.post("/technicians/:userId/approve", async (req, res) => {
  await prisma.technicianProfile.update({
    where: { userId: req.params.userId },
    data: { approved: true },
  });
  res.json({ ok: true });
});

// Reject technician
adminRouter.post("/technicians/:userId/reject", async (req, res) => {
  await prisma.technicianProfile.delete({
    where: { userId: req.params.userId },
  });
  await prisma.user.delete({ where: { id: req.params.userId } });
  res.json({ ok: true });
});

// Platform Activity (Listings, Bids, offers)
adminRouter.get("/listings", async (_, res) => {
  const listings = await prisma.listing.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json({ listings });
});

adminRouter.get("/bids", async (_, res) => {
  // Return bids with related listing and technician info so the admin UI can display them inline
  const bids = await prisma.bid.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      listing: { select: { id: true, title: true } },
      technician: { select: { id: true, email: true, technicianProfile: { select: { ratingAvg: true, ratingCount: true } } } },
    },
  });
  res.json({ bids });
});

// Admin: remove a bid
adminRouter.post('/bids/remove', async (req, res) => {
  const { id } = req.body;
  await prisma.bid.delete({ where: { id } });
  res.json({ ok: true });
});

adminRouter.get("/offers", async (_, res) => {
  const offers = await prisma.offer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      listing: { select: { id: true, title: true } },
      technician: { select: { id: true, email: true } },
    },
  });
  res.json({ offers });
});

//Reports
adminRouter.get("/reports", async (_, res) => {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      listing: { select: { title: true } },
      reporter: { select: { email: true } },
      reported: { select: { email: true } },
    },
  });
  res.json({ reports });
});

//Ban User -------------------- 
adminRouter.post("/ban", async (req, res) => {
  const { email, phone, reason } = req.body;

  await prisma.ban.create({
    data: { email, phone, reason },
  });

  res.json({ ok: true });
});

//Get Banned Users
adminRouter.get("/bans", async (_, res) => {
  const bans = await prisma.ban.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ bans });
});

//Remove Ban
adminRouter.post("/bans/remove", async (req, res) => {
  const { id } = req.body;

  await prisma.ban.delete({ where: { id } });

  res.json({ ok: true });
});

// Get platform statistics
adminRouter.get("/stats", async (_, res) => {
  const userCount = await prisma.user.count();
  const technicianCount = await prisma.technicianProfile.count({
    where: { approved: true },
  });
  const listingCount = await prisma.listing.count();
  const bidCount = await prisma.bid.count();
  const offerCount = await prisma.offer.count();
  res.json({
    userCount,
    technicianCount,
    listingCount,
    bidCount,
    offerCount,
  });
});

// Delete a listing
adminRouter.delete("/listings/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.listing.delete({ where: { id: parseInt(id) } });
  res.json({ ok: true });
});