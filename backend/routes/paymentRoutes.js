// routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const User = require("../models/User");
const Consultation = require("../models/Consultation");
const Payment = require("../models/Payment");
const bodyParser = require("body-parser");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// --- CREATE PREMIUM UPGRADE CHECKOUT SESSION ---
router.post("/premium", async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price:"price_1SriXVHVJrnr9N6TaSW68ydk",
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: user.email,
      success_url: `${process.env.BASE_URL}/user/dashboard?payment=success&type=premium&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL}/user/dashboard?canceled=true`,
      metadata: {
        type: "premium",
        userId: user._id.toString(),
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create session" });
  }
});


// --- CREATE CONSULTATION PAYMENT SESSION ---
// routes/paymentRoutes.js
router.post("/consultation", async (req, res) => {
  try {
    const { userId, consultationId, amount } = req.body;

    if (!userId || !consultationId || !amount) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    const user = await User.findById(userId);
    const consultation = await Consultation.findById(consultationId).populate("professional");

    if (!user || !consultation) return res.status(404).json({ message: "User or consultation not found" });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: { name: `Consultation with ${consultation.professional?.name || "Professional"}` },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: user.email,
      success_url: `${process.env.BASE_URL}/user/dashboard?payment=success&type=consultation&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL}/user/dashboard?canceled=true`,
      // Remove transfer_data for now
      metadata: {
        type: "consultation",
        userId: user._id.toString(),
        consultationId: consultation._id.toString(),
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Consultation payment error:", err);
    res.status(500).json({ message: err.message });
  }
});


// --- DONATION SESSION ---
router.post("/donate", async (req, res) => {
  try {
    const { userId, amount } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: { name: "Donation" },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: user.email,
      success_url: `${process.env.BASE_URL}/user/dashboard?payment=success&type=donation&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL}/user/dashboard?canceled=true`,
      metadata: {
        type: "donation",
        userId: user._id.toString(),
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create donation session" });
  }
});

// --- UNIFIED VERIFY PAYMENT ---
router.post("/verify", async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({ message: "Invalid sessionId" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(400).json({ message: "Payment not completed" });
    }

    // Prevent duplicates (VERY IMPORTANT)
    const existing = await Payment.findOne({ stripeSessionId: session.id });
    if (existing) return res.json({ success: true });

    const { type, userId, consultationId } = session.metadata;

    // ---------- PREMIUM ----------
    if (type === "premium") {
      await Payment.create({
        userId,
        email: session.customer_email,
        amount: session.amount_total / 100,
        type: "premium",
        stripeSessionId: session.id,
      });

      const premiumUntil = new Date();
      premiumUntil.setMonth(premiumUntil.getMonth() + 3);

      await User.findByIdAndUpdate(userId, {
        premium: true,
        premiumSince: new Date(),
        premiumUntil,
      });

      return res.json({ success: true });
    }

    // ---------- DONATION ----------
    if (type === "donation") {
      await Payment.create({
        userId,
        email: session.customer_email,
        amount: session.amount_total / 100,
        type: "donation",
        stripeSessionId: session.id,
      });

      return res.json({ success: true });
    }

    // ---------- CONSULTATION (future-safe) ----------
    // inside if (type === "consultation")
if (type === "consultation") {
  // Find the consultation to get the professional
  const consultation = await Consultation.findById(consultationId);
  if (!consultation) return res.status(404).json({ message: "Consultation not found" });

  await Payment.create({
    userId,
    email: session.customer_email,
    amount: session.amount_total / 100,
    type: "consultation",
    professionalId: consultation.professional, // <-- store professional here
    createdAt: new Date(),
  });

  // Mark consultation as paid
  consultation.paid = true;
  await consultation.save();

  return res.json({ success: true });
}
    return res.status(400).json({ message: "Unknown payment type" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Verification failed" });
  }
});

module.exports = router;
