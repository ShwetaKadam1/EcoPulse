// backend/routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const adminCtrl = require("../controllers/admincontroller");
const simpleAdminAuth = require("../middleware/simpleAdminAuth");
const User = require("../models/User");
const Professional = require("../models/Professional");
const FootprintLog = require("../models/Footprintlog");
const Payment = require("../models/Payment");
const AdviceRequest = require("../models/AdviceRequest");
const Consultation = require("../models/Consultation");


// --- Get all users (no middleware, just like before)
router.get("/users", async (req, res) => {
  try {
    // Get all professional UIDs
    const pros = await Professional.find({}, "firebaseUID"); // only need firebaseUID
    const proUIDs = pros.map(p => p.firebaseUID);

    // Get all users whose firebaseUID is NOT in professionals
    const users = await User.find({
      firebaseUID: { $nin: proUIDs }
    });

    const usersForAdmin = users.map(u => ({
      _id: u._id,
      firebaseUID: u.firebaseUID,
      name: u.name || "-",
      email: u.email || "-",
      premium: Boolean(u.premium),
      isBlocked: Boolean(u.isBlocked),
     blockedReason: u.blockedReason || "",
     blockedAt: u.blockedAt || null,
    }));

    res.json(usersForAdmin);
  } catch (err) {
    console.error("Admin GET users error:", err);
    res.status(500).json({ message: err.message });
  }
});


// Example: GET /admin/footprintLogs
router.get("/footprintLogs", async (req, res) => {
  try {
    const logs = await FootprintLog.find().sort({ date: -1 });

    // Map to frontend format
    const formattedLogs = logs.map(log => ({
      _id: log._id,
      userName: log.name,          // previously `userId.name`
      firebaseUID: log.firebaseUID,
      date: log.date,
      totals: log.totals
    }));

    res.json(formattedLogs);
  } catch (err) {
    console.error("Admin GET footprintLogs error:", err);
    res.status(500).json({ message: "Failed to fetch footprint logs" });
  }
});


// --- Get all professionals (keep middleware if needed)
router.get("/professionals", simpleAdminAuth, async (req, res) => {
  try {
    const pros = await Professional.find().select("_id firebaseUID name email consultationFee approvalStatus isStarred starAssignedAt");

    res.json(pros);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/requestAdvice", simpleAdminAuth, async (req, res) => {
  try {
    const { professionalId } = req.body;
    if (!professionalId) {
      return res.status(400).json({ message: "Professional required" });
    }

    const professional = await Professional.findById(professionalId);
    if (!professional) {
      return res.status(404).json({ message: "Professional not found" });
    }

    // If this professional is already starred, do nothing
    if (professional.isStarred) {
      return res.json({ message: "Professional already starred", professional });
    }

    // Remove star from current starred professional
    await Professional.updateMany(
      { isStarred: true },
      { $set: { isStarred: false, starAssignedAt: null } }
    );

    // Star the selected professional
    professional.isStarred = true;
    professional.starAssignedAt = new Date();
    await professional.save();

    // Optionally create advice request
    const request = await AdviceRequest.create({ professional: professionalId });

    res.json({
      message: "Professional starred and advice request created",
      professional,
      request,
    });

  } catch (err) {
    console.error("Request advice error:", err);
    res.status(500).json({ message: err.message });
  }
});


// --- Admin: Get all payments
// GET all premium upgrade payments
router.get("/payments/premium", simpleAdminAuth, async (req, res) => {
  try {
    const payments = await Payment.find({ type: "premium" })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
});

// GET /admin/payments/donations
router.get("/payments/donations", simpleAdminAuth, async (req, res) => {
  try {
    const donations = await Payment.find({ type: "donation" })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    // Total donation amount
    const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);

    res.json({
      donations,
      summary: { totalDonations }
    });
  } catch (err) {
    console.error("Admin GET donation payments error:", err);
    res.status(500).json({ message: "Failed to fetch donation payments" });
  }
});

router.get("/payments/summary", simpleAdminAuth, async (req, res) => {
  try {
    const premiumPayments = await Payment.find({ type: "premium" });
    const donationPayments = await Payment.find({ type: "donation" });

    const totalPremium = premiumPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalDonations = donationPayments.reduce((sum, d) => sum + d.amount, 0);

    res.json({
      summary: {
        totalPremium,
        totalDonations,
        totalBalance: totalPremium + totalDonations
      }
    });
  } catch (err) {
    console.error("Admin GET payments summary error:", err);
    res.status(500).json({ message: "Failed to fetch payment summary" });
  }
});

router.get("/professionals/earnings", async (req, res) => {
  try {
    const professionals = await Professional.find().lean();

    const data = await Promise.all(
      professionals.map(async (p) => {
        const consultations = await Consultation.find({
          professional: p._id,
          paid: true,
        }).lean();

        const totalProfessional = consultations.reduce(
          (sum, c) => sum + (c.consultationFee || 0) * 0.9,
          0
        );
        const totalAdmin = consultations.reduce(
          (sum, c) => sum + (c.consultationFee || 0) * 0.1,
          0
        );

        return {
          _id: p._id,
          name: p.name,
          email: p.email,
          professionalEarnings: totalProfessional,
          adminEarnings: totalAdmin,
        };
      })
    );

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch earnings" });
  }
});

//-----User block/unblock-----//
router.post("/block-user", simpleAdminAuth, async (req, res) => {
  try {
    const { userId, block, reason } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isBlocked: block,
        blockedReason: block ? reason : "",
        blockedAt: block ? new Date() : null
      },
      { new: true }
    );

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// GET /admin/weeklyAdvice/latest
router.get("/weeklyAdvice/latest", simpleAdminAuth, async (req, res) => {
  try {
    const today = new Date();

    // Get the most recent completed advice that includes today
    const latestAdvice = await AdviceRequest.findOne({
      completed: true,
      startDate: { $lte: today },
      endDate: { $gte: today }
    })
      .sort({ startDate: -1 }) // latest first
      .populate("professional", "name");

    res.json({ advice: latestAdvice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});


// --- Create admin (use once)
router.post("/create", adminCtrl.createAdmin);

// --- Login
router.post("/login", adminCtrl.login);

// --- Protected: global stats
router.get("/stats", simpleAdminAuth, adminCtrl.getGlobalStats);

module.exports = router;
