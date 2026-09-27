import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../config/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

const FREE_OPPORTUNITY_LIMIT = 3;

router.get("/", async (req, res) => {
  try {
    const db = getDb();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(20, Number(req.query.limit) || 9);
    const skip = (page - 1) * limit;

    const filter = { status: { $ne: "removed" } };

    if (req.query.search) {
      const regex = { $regex: req.query.search, $options: "i" };
      filter.$or = [{ role_title: regex }, { required_skills: regex }];
    }

    const workTypes = req.query.work_type
      ? String(req.query.work_type).split(",").filter(Boolean)
      : [];
    if (workTypes.length) {
      filter.work_type = { $in: workTypes };
    }

    const industries = req.query.industry
      ? String(req.query.industry).split(",").filter(Boolean)
      : [];
    if (industries.length) {
      filter.industry = { $in: industries };
    }

    const collection = db.collection("opportunities");
    const [items, total] = await Promise.all([
      collection.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      collection.countDocuments(filter),
    ]);

    res.json({
      opportunities: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/featured", async (req, res) => {
  try {
    const db = getDb();
    const opportunities = await db
      .collection("opportunities")
      .find({ status: "active" })
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();
    res.json({ opportunities });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/founder/mine", requireAuth, requireRole("founder"), async (req, res) => {
  try {
    const db = getDb();
    const startup = await db.collection("startups").findOne({
      founder_email: req.user.email,
      status: { $ne: "removed" },
    });
    if (!startup) return res.json({ opportunities: [] });

    const opportunities = await db
      .collection("opportunities")
      .find({ startup_id: startup._id.toString(), status: { $ne: "removed" } })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ opportunities });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const db = getDb();
    const opportunity = await db.collection("opportunities").findOne({
      _id: new ObjectId(req.params.id),
      status: { $ne: "removed" },
    });
    if (!opportunity) {
      return res.status(404).json({ message: "Opportunity not found" });
    }
    res.json({ opportunity });
  } catch {
    res.status(400).json({ message: "Invalid opportunity id" });
  }
});

router.post("/", requireAuth, requireRole("founder"), async (req, res) => {
  try {
    const db = getDb();
    const startup = await db.collection("startups").findOne({
      founder_email: req.user.email,
      status: { $ne: "removed" },
    });
    if (!startup) {
      return res.status(400).json({ message: "Create your startup first" });
    }

    const count = await db.collection("opportunities").countDocuments({
      startup_id: startup._id.toString(),
      status: { $ne: "removed" },
    });

    if (!req.user.isPremium && count >= FREE_OPPORTUNITY_LIMIT) {
      return res.status(402).json({
        message: "Premium required to post more than 3 opportunities",
        requiresPremium: true,
      });
    }

    const doc = {
      startup_id: startup._id.toString(),
      startup_name: startup.startup_name,
      industry: startup.industry,
      role_title: req.body.role_title,
      required_skills: req.body.required_skills,
      work_type: req.body.work_type,
      commitment_level: req.body.commitment_level,
      deadline: new Date(req.body.deadline),
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("opportunities").insertOne(doc);
    res.status(201).json({ opportunity: { ...doc, _id: result.insertedId } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id", requireAuth, requireRole("founder"), async (req, res) => {
  try {
    const db = getDb();
    const opportunity = await db.collection("opportunities").findOne({
      _id: new ObjectId(req.params.id),
      status: { $ne: "removed" },
    });
    if (!opportunity) return res.status(404).json({ message: "Not found" });

    const startup = await db.collection("startups").findOne({
      _id: new ObjectId(opportunity.startup_id),
      founder_email: req.user.email,
    });
    if (!startup) return res.status(403).json({ message: "Forbidden" });

    const update = {
      role_title: req.body.role_title ?? opportunity.role_title,
      required_skills: req.body.required_skills ?? opportunity.required_skills,
      work_type: req.body.work_type ?? opportunity.work_type,
      commitment_level: req.body.commitment_level ?? opportunity.commitment_level,
      deadline: req.body.deadline ? new Date(req.body.deadline) : opportunity.deadline,
      updatedAt: new Date(),
    };

    await db.collection("opportunities").updateOne(
      { _id: opportunity._id },
      { $set: update },
    );
    res.json({ opportunity: { ...opportunity, ...update } });
  } catch {
    res.status(400).json({ message: "Invalid id" });
  }
});

router.delete("/:id", requireAuth, requireRole("founder"), async (req, res) => {
  try {
    const db = getDb();
    const opportunity = await db.collection("opportunities").findOne({
      _id: new ObjectId(req.params.id),
    });
    if (!opportunity) return res.status(404).json({ message: "Not found" });

    const startup = await db.collection("startups").findOne({
      _id: new ObjectId(opportunity.startup_id),
      founder_email: req.user.email,
    });
    if (!startup) return res.status(403).json({ message: "Forbidden" });

    await db.collection("opportunities").updateOne(
      { _id: opportunity._id },
      { $set: { status: "removed", updatedAt: new Date() } },
    );
    res.json({ message: "Opportunity removed" });
  } catch {
    res.status(400).json({ message: "Invalid id" });
  }
});

export default router;
