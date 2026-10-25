// backend/routes/chat.js
const express = require("express");
const router = express.Router();
const ChatMessage = require("../models/ChatMessage");
const Consultation = require("../models/Consultation");
const User = require("../models/User");
const Professional = require("../models/Professional");
const { verifyFirebaseToken } = require("../middleware/firebaseAuth");

// --- Attach role middleware ---
async function attachUserRole(req, res, next) {
  try {
    const uid = req.firebaseUID;

    // Try fetching as Professional first
    const prof = await Professional.findOne({ firebaseUID: uid });
    if (prof) {
      req.user = prof.toObject();
      req.userRole = "professional";
      return next();
    }

    // Else try as regular User
    const user = await User.findOne({ firebaseUID: uid });
    if (user) {
      req.user = user.toObject();
      req.userRole = "user";
      return next();
    }

    return res.status(401).json({ message: "User not found" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// GET messages for a consultation
router.get("/:consultationId", verifyFirebaseToken, attachUserRole, async (req, res) => {
  const messages = await ChatMessage.find({
    consultation: req.params.consultationId,
  }).sort({ createdAt: 1 });

  res.json({ messages });
});

// SEND message
router.post("/", verifyFirebaseToken, attachUserRole, async (req, res) => {
  const { consultationId, message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message required" });
  }

  const consultation = await Consultation.findById(consultationId)
    .populate("professional", "name")
    .populate("user", "name");

  if (!consultation) {
    return res.status(404).json({ error: "Consultation not found" });
  }

  // Only allow chat if consultation is scheduled
  if (consultation.status !== "scheduled") {
    return res.status(403).json({ error: "Chat only allowed for scheduled consultations" });
  }

  const chat = await ChatMessage.create({
    consultation: consultationId,
    senderRole: req.userRole, // from middleware
    sender: req.user._id,
    message,
  });

  res.json({ chat });
});

module.exports = router;
