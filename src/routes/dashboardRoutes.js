import { Router } from "express";
import { getDb } from "../config/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/founder", requireAuth, requireRole("founder"), async (req, res) => {
  try {
    const db = getDb();
    const startup = await db.collection("startups").findOne({
      founder_email: req.user.email,
      status: { $ne: "removed" },
    });
    if (!startup) {
      return res.json({
        stats: { opportunities: 0, applications: 0, accepted: 0 },
      });
    }

    const startupId = startup._id.toString();
    const opportunities = await db
      .collection("opportunities")
      .find({ startup_id: startupId, status: { $ne: "removed" } })
      .toArray();
    const oppIds = opportunities.map((o) => o._id.toString());
    const applications = await db
      .collection("applications")
      .find({ opportunity_id: { $in: oppIds } })
      .toArray();

    res.json({
      stats: {
        opportunities: opportunities.length,
        applications: applications.length,
        accepted: applications.filter((a) => a.status === "accepted").length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
