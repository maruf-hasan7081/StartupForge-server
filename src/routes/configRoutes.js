import { Router } from "express";
import { env } from "../config/env.js";

const router = Router();

router.get("/public", (req, res) => {
  res.json({
    googleEnabled: Boolean(env.googleClientId && env.googleClientSecret),
    stripeEnabled: Boolean(env.stripeSecretKey && env.stripePremiumPriceId),
    imgbbRequired: true,
  });
});

export default router;
