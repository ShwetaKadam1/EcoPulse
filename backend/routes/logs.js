const express = require("express");
const router = express.Router();
const FootprintLog = require("../models/Footprintlog");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/firebaseAuth");
const calculateFootprint = require("../utils/carbonCalculator"); // totals calculator

// GET all logs for the current user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const logs = await FootprintLog.find({ firebaseUID: req.firebaseUID }).sort({ date: -1 });
    res.status(200).json({ logs });
  } catch (err) {
    console.error("GET /logs error:", err);
    res.status(500).json({ message: "Failed to fetch logs" });
  }
});

// POST a new footprint log
router.post("/", authMiddleware, async (req, res) => {
  try {
    // 1️⃣ Get user info
    const user = await User.findOne({ firebaseUID: req.firebaseUID });
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2️⃣ Map travel & electricity properly
    const travelMapped = (req.body.travel || []).map(t => ({
      mode: t.mode,
      distanceKm: t.distanceKm ?? t.km ?? 0
    }));

    const electricityMapped = {
      breakdown: Object.entries(req.body.electricity || {}).map(([appliance, hours]) => ({
        appliance,
        hours: Number(hours)
      }))
    };

    // 3️⃣ Prepare log data
    const logData = {
      firebaseUID: req.firebaseUID,
      name: user.name,
      travel: travelMapped,
      food: req.body.food || [],
      electricity: electricityMapped,
      water: req.body.water || {},
      shopping: req.body.shopping || [],
      gas: req.body.gas || [],
    };

    // 4️⃣ Calculate totals
    logData.totals = calculateFootprint(logData);

    // 5️⃣ Save to DB
    const log = await FootprintLog.create(logData);

    res.status(201).json({ log });
  } catch (err) {
    console.error("POST /logs error:", err);
    res.status(500).json({ message: "Failed to save log" });
  }
});

module.exports = router;
