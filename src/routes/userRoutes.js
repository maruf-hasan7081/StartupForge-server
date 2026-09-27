import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/me", requireAuth, (req, res) => {
  res.json({
    user: {
      ...req.user,
      hasSelectedRole: req.user.hasSelectedRole === true,
    },
  });
});

router.patch("/role", requireAuth, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["founder", "collaborator"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const db = getDb();
    await db.collection("user").updateOne(
      { _id: new ObjectId(req.user.id) },
      { $set: { role, hasSelectedRole: true } },
    );
    const user = await db.collection("user").findOne({ _id: new ObjectId(req.user.id) });
    res.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        hasSelectedRole: true,
        skills: user.skills || "",
        bio: user.bio || "",
        isPremium: user.isPremium || false,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/profile", requireAuth, async (req, res) => {
  try {
    const { name, image, skills, bio } = req.body;
    const db = getDb();
    const update = {};
    if (name) update.name = name;
    if (image) update.image = image;
    if (skills !== undefined) update.skills = skills;
    if (bio !== undefined) update.bio = bio;

    await db.collection("user").updateOne(
      { _id: new ObjectId(req.user.id) },
      { $set: update },
    );

    const user = await db.collection("user").findOne({
      _id: new ObjectId(req.user.id),
    });

    res.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        skills: user.skills || "",
        bio: user.bio || "",
        isPremium: user.isPremium || false,
        hasSelectedRole: user.hasSelectedRole === true,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
