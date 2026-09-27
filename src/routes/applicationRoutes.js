import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../config/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.post("/", requireAuth, requireRole("collaborator"), async (req, res) => {
  try {
    const db = getDb();
    const opportunity = await db.collection("opportunities").findOne({
      _id: new ObjectId(req.body.opportunity_id),
      status: "active",
    });
    if (!opportunity) {
      return res.status(404).json({ message: "Opportunity not found" });
    }

    const existing = await db.collection("applications").findOne({
      opportunity_id: req.body.opportunity_id,
      applicant_email: req.user.email,
    });
    if (existing) {
      return res.status(400).json({ message: "Already applied" });
    }

    const doc = {
      opportunity_id: req.body.opportunity_id,
      opportunity_name: opportunity.role_title,
      startup_name: opportunity.startup_name,
      applicant_email: req.user.email,
      portfolio_link: req.body.portfolio_link,
      motivation: req.body.motivation,
      status: "pending",
      applied_at: new Date(),
    };

    const result = await db.collection("applications").insertOne(doc);
    res.status(201).json({ application: { ...doc, _id: result.insertedId } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/mine", requireAuth, requireRole("collaborator"), async (req, res) => {
  try {
    const db = getDb();
    const applications = await db
      .collection("applications")
      .find({ applicant_email: req.user.email })
      .sort({ applied_at: -1 })
      .toArray();
    res.json({ applications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/founder", requireAuth, requireRole("founder"), async (req, res) => {
  try {
    const db = getDb();
    const startup = await db.collection("startups").findOne({
      founder_email: req.user.email,
      status: { $ne: "removed" },
    });
    if (!startup) return res.json({ applications: [] });

    const opportunities = await db
      .collection("opportunities")
      .find({ startup_id: startup._id.toString() })
      .toArray();
    const oppIds = opportunities.map((o) => o._id.toString());

    const applications = await db
      .collection("applications")
      .find({ opportunity_id: { $in: oppIds } })
      .sort({ applied_at: -1 })
      .toArray();

    res.json({ applications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/status", requireAuth, requireRole("founder"), async (req, res) => {
  try {
    const { status } = req.body;
    if (!["accepted", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const db = getDb();
    const application = await db.collection("applications").findOne({
      _id: new ObjectId(req.params.id),
    });
    if (!application) return res.status(404).json({ message: "Not found" });

    const opportunity = await db.collection("opportunities").findOne({
      _id: new ObjectId(application.opportunity_id),
    });
    const startup = await db.collection("startups").findOne({
      _id: new ObjectId(opportunity.startup_id),
      founder_email: req.user.email,
    });
    if (!startup) return res.status(403).json({ message: "Forbidden" });

    await db.collection("applications").updateOne(
      { _id: application._id },
      { $set: { status } },
    );
    res.json({ application: { ...application, status } });
  } catch {
    res.status(400).json({ message: "Invalid id" });
  }
});

export default router;
