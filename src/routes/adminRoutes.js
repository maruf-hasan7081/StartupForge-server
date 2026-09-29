import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../config/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/overview", async (req, res) => {
  try {
    const db = getDb();
    const [users, startups, opportunities, payments] = await Promise.all([
      db.collection("user").countDocuments(),
      db.collection("startups").countDocuments({ status: { $ne: "removed" } }),
      db.collection("opportunities").countDocuments({ status: { $ne: "removed" } }),
      db.collection("payments").find({ payment_status: "paid" }).toArray(),
    ]);

    const revenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    res.json({
      stats: {
        users,
        startups,
        opportunities,
        revenue,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/users", async (req, res) => {
  try {
    const db = getDb();
    const users = await db
      .collection("user")
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/users/:id/block", async (req, res) => {
  try {
    const db = getDb();
    const userId = new ObjectId(req.params.id);
    await db.collection("user").updateOne(
      { _id: userId },
      { $set: { isBlocked: true } },
    );
    await db.collection("session").deleteMany({
      $or: [{ userId: userId.toString() }, { userId }],
    });
    res.json({ message: "User blocked" });
  } catch {
    res.status(400).json({ message: "Invalid user id" });
  }
});

router.patch("/users/:id/unblock", async (req, res) => {
  try {
    const db = getDb();
    await db.collection("user").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { isBlocked: false } },
    );
    res.json({ message: "User unblocked" });
  } catch {
    res.status(400).json({ message: "Invalid user id" });
  }
});

router.get("/startups", async (req, res) => {
  try {
    const db = getDb();
    const startups = await db
      .collection("startups")
      .find({ status: { $ne: "removed" } })
      .sort({ createdAt: -1 })
      .toArray();
    res.json({ startups });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/startups/:id/approve", async (req, res) => {
  try {
    const db = getDb();
    await db.collection("startups").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: "approved", updatedAt: new Date() } },
    );
    res.json({ message: "Startup approved" });
  } catch {
    res.status(400).json({ message: "Invalid startup id" });
  }
});

router.delete("/startups/:id", async (req, res) => {
  try {
    const db = getDb();
    await db.collection("startups").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: "removed", updatedAt: new Date() } },
    );
    res.json({ message: "Startup removed" });
  } catch {
    res.status(400).json({ message: "Invalid startup id" });
  }
});

router.get("/transactions", async (req, res) => {
  try {
    const db = getDb();
    const transactions = await db
      .collection("payments")
      .find()
      .sort({ paid_at: -1 })
      .toArray();
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
