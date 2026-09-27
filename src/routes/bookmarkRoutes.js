import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const bookmarks = await db
      .collection("bookmarks")
      .find({ user_email: req.user.email })
      .sort({ createdAt: -1 })
      .toArray();

    const ids = bookmarks.map((b) => b.startup_id);
    const startups = await db
      .collection("startups")
      .find({ _id: { $in: ids.map((id) => new ObjectId(id)) }, status: { $ne: "removed" } })
      .toArray();

    res.json({ startups, bookmarkIds: ids });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/ids", requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const bookmarks = await db
      .collection("bookmarks")
      .find({ user_email: req.user.email })
      .toArray();
    res.json({ ids: bookmarks.map((b) => b.startup_id) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:startupId", requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const startupId = req.params.startupId;
    const startup = await db.collection("startups").findOne({
      _id: new ObjectId(startupId),
      status: { $ne: "removed" },
    });
    if (!startup) return res.status(404).json({ message: "Startup not found" });

    await db.collection("bookmarks").updateOne(
      { user_email: req.user.email, startup_id: startupId },
      { $setOnInsert: { user_email: req.user.email, startup_id: startupId, createdAt: new Date() } },
      { upsert: true },
    );
    res.json({ message: "Bookmarked" });
  } catch {
    res.status(400).json({ message: "Invalid startup id" });
  }
});

router.delete("/:startupId", requireAuth, async (req, res) => {
  try {
    const db = getDb();
    await db.collection("bookmarks").deleteOne({
      user_email: req.user.email,
      startup_id: req.params.startupId,
    });
    res.json({ message: "Bookmark removed" });
  } catch {
    res.status(400).json({ message: "Invalid startup id" });
  }
});

export default router;
