// backend/routes/userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authMiddleware, verifyFirebaseToken, admin } = require("../middleware/firebaseAuth");
const User = require("../models/User");
const dbConnect  = require("../config/db");
const simpleAdminAuth = require("../middleware/simpleAdminAuth");
const blockGuard = require("../middleware/blockGuard");
const AdviceRequest = require("../models/AdviceRequest");
const Professional = require("../models/Professional");
const checkPremium = require("../middleware/checkPremium");

// --- SIGNUP (create user in Firebase + MongoDB)
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "Missing fields" });

  try {
    await dbConnect();

    // Create Firebase user
    const userRecord = await admin.auth().createUser({ email, password, displayName: name });

    // Create MongoDB user
    const newUser = await User.create({
      firebaseUID: userRecord.uid,
      name,
      email,
      createdAt: new Date(),
    });

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: err.message });
  }
});

router.get("/weeklyAdvice", verifyFirebaseToken, async (req, res) => {
  try {
    const today = new Date();
    const advice = await AdviceRequest.findOne({
      completed: true,
      startDate: { $lte: today },
      endDate: { $gte: today }
    }).populate("professional", "name");

    res.json({ advice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

router.get("/professionals", async (req, res) => {
  try {
    const professionals = await Professional.find(
      { approvalStatus: "approved" },
      "name experience skills languages consultationFee"
    );

    res.json({ professionals });
  } catch (err) {
    res.status(500).json({ message: "Failed to load professionals" });
  }
});



// --- Existing routes
router.get("/me", authMiddleware, checkPremium, userController.getOrCreateUser);
router.post("/log", authMiddleware, blockGuard, checkPremium, userController.logFootprint);
router.get("/dashboard/:firebaseUID?", authMiddleware, checkPremium, userController.getDashboard);
router.post("/consultation/request", authMiddleware, blockGuard, checkPremium, userController.requestConsultation);
router.get("/consultations", authMiddleware, checkPremium, userController.getMyConsultations);

router.get("/profile", authMiddleware, checkPremium, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
