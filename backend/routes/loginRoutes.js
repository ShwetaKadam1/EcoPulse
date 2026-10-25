const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Professional = require("../models/Professional");
const { admin } = require("../middleware/firebaseAuth"); // Your firebase-admin setup

// POST /api/loginRole
// Updated logic for /api/loginRole
router.post("/", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Missing token" });

    const decoded = await admin.auth().verifyIdToken(token);
    const uid = decoded.uid;

    // 1. Check Professional FIRST
    const professional = await Professional.findOne({ firebaseUID: uid });
    if (professional) {
      return res.status(200).json({ role: "professional" });
    }

    // 2. Check User SECOND
    const user = await User.findOne({ firebaseUID: uid });
    if (user) {
      return res.status(200).json({ role: "user" });
    }

    // 3. Not found in either
    return res.status(404).json({ message: "Account not found" });

  } catch (err) {
    console.error("LoginRole Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
