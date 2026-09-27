import { Router } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { getAuth } from "../auth.js";
import {
  clearAuthCookie,
  setAuthCookie,
  signUserToken,
} from "../utils/jwt.js";

const router = Router();

router.post("/sync-jwt", async (req, res) => {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      return res.status(401).json({ message: "No active session" });
    }

    if (session.user.isBlocked) {
      return res.status(403).json({ message: "Account blocked" });
    }

    const token = signUserToken(session.user);
    setAuthCookie(res, token);
    return res.json({ user: session.user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const auth = getAuth();
    await auth.api.signOut({ headers: fromNodeHeaders(req.headers) });
    clearAuthCookie(res);
    return res.json({ message: "Logged out" });
  } catch {
    clearAuthCookie(res);
    return res.json({ message: "Logged out" });
  }
});

export default router;
