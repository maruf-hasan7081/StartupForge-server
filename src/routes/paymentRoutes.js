import { Router } from "express";
import Stripe from "stripe";
import { ObjectId } from "mongodb";
import { getDb } from "../config/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { env } from "../config/env.js";

const router = Router();

function getStripe() {
  if (!env.stripeSecretKey) return null;
  return new Stripe(env.stripeSecretKey);
}

router.post("/checkout", requireAuth, requireRole("founder"), async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe || !env.stripePremiumPriceId) {
      return res.status(503).json({ message: "Stripe is not configured" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: env.stripePremiumPriceId, quantity: 1 }],
      success_url: `${env.clientUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.clientUrl}/dashboard/founder`,
      metadata: { userEmail: req.user.email },
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/success", requireAuth, async (req, res) => {
  try {
    const stripe = getStripe();
    const sessionId = req.query.session_id;
    if (!stripe || !sessionId) {
      return res.status(400).json({ message: "Invalid session" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return res.status(400).json({ message: "Payment not completed" });
    }

    const sessionEmail = session.metadata?.userEmail;
    if (!sessionEmail || sessionEmail !== req.user.email) {
      return res.status(403).json({ message: "Payment session does not belong to this account" });
    }

    const db = getDb();
    const amount = (session.amount_total || 0) / 100;
    const payment = {
      user_email: req.user.email,
      amount,
      transaction_id: session.id,
      payment_status: "paid",
      paid_at: new Date(),
    };

    await db.collection("payments").updateOne(
      { transaction_id: session.id },
      { $set: payment },
      { upsert: true },
    );

    await db.collection("user").updateOne(
      { email: req.user.email },
      { $set: { isPremium: true } },
    );

    res.json({ payment, message: "Premium activated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
