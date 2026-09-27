import { ObjectId } from "mongodb";
import { getDb } from "../config/db.js";
import { COOKIE_NAME, verifyUserToken } from "../utils/jwt.js";

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payload = verifyUserToken(token);
    const db = getDb();
    const user = await db.collection("user").findOne({
      $or: [{ _id: new ObjectId(payload.id) }, { email: payload.email }],
    });

    if (!user || user.isBlocked) {
      return res.status(403).json({ message: "Access denied" });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role || "collaborator",
      isBlocked: user.isBlocked,
      skills: user.skills || "",
      bio: user.bio || "",
      isPremium: user.isPremium || false,
      hasSelectedRole: user.hasSelectedRole === true,
    };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}
