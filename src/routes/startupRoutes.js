import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../config/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const db = getDb();
    const startups = await db
      .collection("startups")
      .find({ status: { $ne: "removed" } })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    res.json({ startups });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/featured", async (req, res) => {
  try {
    const db = getDb();
    const startups = await db
      .collection("startups")
      .find({ status: "approved" })
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();
    res.json({ startups });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/mine", requireAuth, requireRole("founder"), async (req, res) => {
  try {
    const db = getDb();
    const startup = await db.collection("startups").findOne({
      founder_email: req.user.email,
      status: { $ne: "removed" },
    });
    res.json({ startup });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const db = getDb();
    const startup = await db.collection("startups").findOne({
      _id: new ObjectId(req.params.id),
      status: { $ne: "removed" },
    });
    if (!startup) return res.status(404).json({ message: "Startup not found" });
    res.json({ startup });
  } catch {
    res.status(400).json({ message: "Invalid startup id" });
  }
});

router.post("/", requireAuth, requireRole("founder"), async (req, res) => {
  try {
    const db = getDb();
    const existing = await db.collection("startups").findOne({
      founder_email: req.user.email,
      status: { $ne: "removed" },
    });
    if (existing) {
      return res.status(400).json({ message: "You already have a startup" });
    }

    const doc = {
      startup_name: req.body.startup_name,
      logo: req.body.logo,
      industry: req.body.industry,
      description: req.body.description,
      funding_stage: req.body.funding_stage,
      founder_email: req.user.email,
      founder_name: req.user.name,
      team_size_needed: req.body.team_size_needed || 1,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("startups").insertOne(doc);
    res.status(201).json({ startup: { ...doc, _id: result.insertedId } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id", requireAuth, requireRole("founder"), async (req, res) => {
  try {
    const db = getDb();
    const startup = await db.collection("startups").findOne({
      _id: new ObjectId(req.params.id),
      founder_email: req.user.email,
    });
    if (!startup) return res.status(404).json({ message: "Startup not found" });

    const update = {
      startup_name: req.body.startup_name ?? startup.startup_name,
      logo: req.body.logo ?? startup.logo,
      industry: req.body.industry ?? startup.industry,
      description: req.body.description ?? startup.description,
      funding_stage: req.body.funding_stage ?? startup.funding_stage,
      team_size_needed: req.body.team_size_needed ?? startup.team_size_needed,
      updatedAt: new Date(),
    };

    await db.collection("startups").updateOne(
      { _id: startup._id },
      { $set: update },
    );
    res.json({ startup: { ...startup, ...update } });
  } catch {
    res.status(400).json({ message: "Invalid startup id" });
  }
});

router.delete("/:id", requireAuth, requireRole("founder"), async (req, res) => {
  try {
    const db = getDb();
    await db.collection("startups").updateOne(
      {
        _id: new ObjectId(req.params.id),
        founder_email: req.user.email,
      },
      { $set: { status: "removed", updatedAt: new Date() } },
    );
    res.json({ message: "Startup removed" });
  } catch {
    res.status(400).json({ message: "Invalid startup id" });
  }
});

export default router;
