import express from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { httpError } from "../lib/errors.js";
import { notify } from "../lib/notify.js";

export const chatRouter = express.Router();

chatRouter.use(requireAuth, requireRole("CUSTOMER", "TECHNICIAN", "ADMIN"));

function isParticipant(thread, user) {
  return thread.customerId === user.sub || thread.technicianId === user.sub || user.role === "ADMIN";
}

// List my threads (inbox)
chatRouter.get("/threads", async (req, res, next) => {
  try {
    const where =
      req.user.role === "ADMIN"
        ? {}
        : req.user.role === "CUSTOMER"
          ? { customerId: req.user.sub }
          : { technicianId: req.user.sub };

    const threads = await prisma.chatThread.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        listingId: true,
        customerId: true,
        technicianId: true,
        updatedAt: true,
        listing: { select: { title: true, category: true } },
        customer: { select: { email: true } },
        technician: { select: { email: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { body: true, createdAt: true, senderId: true },
        },
      },
    });

    const normalized = threads.map((t) => ({
      id: t.id,
      listingId: t.listingId,
      updatedAt: t.updatedAt,
      listing: t.listing,
      customerEmail: t.customer.email,
      technicianEmail: t.technician.email,
      lastMessage: t.messages[0] || null,
    }));

    res.json({ threads: normalized });
  } catch (err) {
    next(err);
  }
});

// Create or get a thread for a listing+technician
// CUSTOMER: provide listingId + technicianId
// TECHNICIAN: provide listingId (technicianId inferred)
chatRouter.post("/threads", async (req, res, next) => {
  try {
    const schema = z.object({
      listingId: z.string().min(1),
      technicianId: z.string().min(1).optional(),
    });
    const { listingId, technicianId } = schema.parse(req.body);

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, customerId: true, acceptedTechnicianId: true, jobDoneAt: true },
    });
    if (!listing) throw httpError(404, "Listing not found");

    let techId = technicianId;

    if (req.user.role === "CUSTOMER") {
      if (listing.jobDoneAt) throw httpError(400, "Job is done. Messaging closed.");
      if (listing.acceptedTechnicianId && listing.acceptedTechnicianId !== techId) {
        throw httpError(400, "Listing already accepted by a different technician.");
      }
      if (listing.customerId !== req.user.sub) throw httpError(403, "Not your listing");
      if (!techId) throw httpError(400, "technicianId is required");
    } else if (req.user.role === "TECHNICIAN") {
      techId = req.user.sub;
    } else if (req.user.role === "ADMIN") {
      if (!techId) throw httpError(400, "technicianId is required for admin");
    }

    const thread = await prisma.chatThread.upsert({
      where: { listingId_technicianId: { listingId, technicianId: techId } },
      create: {
        listingId,
        customerId: listing.customerId,
        technicianId: techId,
      },
      update: {},
      select: { id: true, listingId: true, customerId: true, technicianId: true, updatedAt: true },
    });

    res.status(201).json({ thread });
  } catch (err) {
    next(err);
  }
});

// Get messages in a thread
chatRouter.get("/threads/:threadId/messages", async (req, res, next) => {
  try {
    const threadId = req.params.threadId;

    const thread = await prisma.chatThread.findUnique({ where: { id: threadId } });
    if (!thread) throw httpError(404, "Thread not found");
    if (!isParticipant(thread, req.user)) throw httpError(403, "Forbidden");

    const messages = await prisma.message.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        body: true,
        createdAt: true,
        senderId: true,
        sender: { select: { email: true } },
      },
    });

    res.json({ messages });
  } catch (err) {
    next(err);
  }
});

// Send a message
chatRouter.post("/threads/:threadId/messages", async (req, res, next) => {
  try {
    const threadId = req.params.threadId;
    const schema = z.object({ body: z.string().min(1).max(2000) });
    const { body } = schema.parse(req.body);

    const thread = await prisma.chatThread.findUnique({
      where: { id: threadId },
      include: {
        listing: { select: { jobDoneAt: true, acceptedTechnicianId: true } },
      },
    });
    if (!thread) throw httpError(404, "Thread not found");
    if (!isParticipant(thread, req.user)) throw httpError(403, "Forbidden");

    // Technician restrictions
    if (req.user.role === "TECHNICIAN") {
      if (thread.listing.jobDoneAt) throw httpError(400, "Job is done. Messaging closed.");
      if (thread.listing.acceptedTechnicianId && thread.listing.acceptedTechnicianId !== req.user.sub) {
        throw httpError(403, "Listing accepted by another technician.");
      }
    }

    const msg = await prisma.message.create({
      data: { threadId, senderId: req.user.sub, body },
      select: { id: true, body: true, createdAt: true, senderId: true },
    });

    // send notification to other participants
    const threadFull = await prisma.chatThread.findUnique({
      where: { id: threadId },
      include: {
        customer: { select: { email: true, id: true } },
        technician: { select: { email: true, id: true } },
      },
    });
    const to =
      req.user.sub === threadFull.customerId ? threadFull.technician : threadFull.customer;

    await notify("message_received", {
      threadId,
      listingId: threadFull.listingId,
      toEmail: to.email,
      toUserId: to.id,
    });

    // bump thread updatedAt (so inbox ordering is correct)
    await prisma.chatThread.update({ where: { id: threadId }, data: {} });

    res.status(201).json({ message: msg });
  } catch (err) {
    next(err);
  }
});
