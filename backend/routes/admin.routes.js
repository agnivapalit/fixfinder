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

// Get single technician details (for admin review)
adminRouter.get("/technicians/:userId", async (req, res) => {
  const tech = await prisma.technicianProfile.findUnique({
    where: { userId: req.params.userId },
    include: { user: { select: { id: true, email: true, phone: true, createdAt: true } } },
  });
  if (!tech) return res.status(404).json({ error: "Technician not found" });
  res.json({ tech });
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
    select: {
      id: true,
      listingId: true,
      reason: true,
      createdAt: true,
      includeChat: true,
      listing: { select: { id: true, title: true } },
      reporter: { select: { email: true } },
      reported: { select: { email: true } },
    },
  });
  res.json({ reports });
});

// Get chat messages tied to a report (only if report.includeChat is true)
adminRouter.get('/reports/:id/chat', async (req, res, next) => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findUnique({ where: { id }, select: { id: true, listingId: true, reporterId: true, reportedId: true, includeChat: true } });
    if (!report) return res.status(404).json({ error: 'Report not found' });
    if (!report.includeChat) return res.status(400).json({ error: 'Chat was not included with this report' });

    // Find threads for the listing that are related to either the reported user or reporter
    const threads = await prisma.chatThread.findMany({
      where: {
        listingId: report.listingId,
        OR: [
          { customerId: report.reportedId },
          { technicianId: report.reportedId },
          { customerId: report.reporterId },
          { technicianId: report.reporterId },
        ],
      },
      select: { id: true, listingId: true, customerId: true, technicianId: true },
    });

    const threadsWithMessages = await Promise.all(
      threads.map(async (t) => {
        const messages = await prisma.message.findMany({
          where: { threadId: t.id },
          orderBy: { createdAt: 'asc' },
          select: { id: true, body: true, createdAt: true, senderId: true, sender: { select: { email: true } } },
        });
        return { threadId: t.id, customerId: t.customerId, technicianId: t.technicianId, messages };
      })
    );

    res.json({ threads: threadsWithMessages });
  } catch (err) {
    next(err);
  }
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
adminRouter.delete("/listings/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    // Remove dependent records to satisfy FK RESTRICT constraints
    const threads = await prisma.chatThread.findMany({ where: { listingId: id }, select: { id: true } });
    const threadIds = threads.map((t) => t.id);

    const ops = [];
    if (threadIds.length) ops.push(prisma.message.deleteMany({ where: { threadId: { in: threadIds } } }));
    ops.push(prisma.chatThread.deleteMany({ where: { listingId: id } }));
    ops.push(prisma.bid.deleteMany({ where: { listingId: id } }));
    ops.push(prisma.offer.deleteMany({ where: { listingId: id } }));
    ops.push(prisma.favourite.deleteMany({ where: { listingId: id } }));
    ops.push(prisma.report.deleteMany({ where: { listingId: id } }));
    ops.push(prisma.review.deleteMany({ where: { listingId: id } }));

    // Finally delete the listing itself
    ops.push(prisma.listing.delete({ where: { id } }));

    await prisma.$transaction(ops);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});