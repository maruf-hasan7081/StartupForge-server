import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const notifications = await db
      .collection("notifications")
      .find({ user_email: req.user.email })
      .sort({ createdAt: -1 })
      .limit(30)
      .toArray();
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/read-all", requireAuth, async (req, res) => {
  try {
    const db = getDb();
    await db.collection("notifications").updateMany(
      { user_email: req.user.email, read: false },
      { $set: { read: true } },
    );
    res.json({ message: "All marked read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/read", requireAuth, async (req, res) => {
  try {
    const db = getDb();
    await db.collection("notifications").updateOne(
      { _id: new ObjectId(req.params.id), user_email: req.user.email },
      { $set: { read: true } },
    );
    res.json({ message: "Marked read" });
  } catch {
    res.status(400).json({ message: "Invalid notification id" });
  }
});

export async function createNotification(db, userEmail, message, type = "application") {
  if (!userEmail) return;
  await db.collection("notifications").insertOne({
    user_email: userEmail,
    message,
    type,
    read: false,
    createdAt: new Date(),
  });
}

export default router;
