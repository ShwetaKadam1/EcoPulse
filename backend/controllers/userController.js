// controllers/userController.js
const User = require("../models/User");
const calculateFootprint = require("../utils/carbonCalculator");
const { generateAdviceFromLog } = require("../utils/adviceRules");
const Consultation = require("../models/Consultation");
const Payment = require("../models/Payment");
const FootprintLog = require("../models/FootprintLog"); 
const Professional = require("../models/Professional"); 

exports.getOrCreateUser = async (req, res) => {
  try {
    const uid = req.firebaseUID;
    if (!uid) return res.status(400).json({ message: "No firebaseUID" });

    let user = await User.findOne({ firebaseUID: uid });
    if (!user) {
      user = new User({ firebaseUID: uid, email: req.firebaseEmail });
      await user.save();
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.logFootprint = async (req, res) => {
  try {
    const uid = req.firebaseUID;
    const entry = req.body.entry;
    if (!entry) return res.status(400).json({ message: "Missing entry" });

    const footprint = calculateFootprint(entry);

    const log = {
      date: new Date(),
      timeOfDay: entry.timeOfDay || "morning",
      travel: entry.travel || [],
      food: entry.food || [],
      electricity: entry.electricity || {},
      water: entry.water || {},
      shopping: entry.shopping || [],
      gas: entry.gas || [],
      totals: footprint
    };

    const user = await User.findOneAndUpdate(
      { firebaseUID: uid },
      { $push: { footprintLogs: log } },
      { new: true, upsert: true }
    );

    // generate rule-based advice
    const advice = generateAdviceFromLog(log);

    res.json({ message: "Logged", log, advice, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const uid = req.params.firebaseUID || req.firebaseUID;
    const user = await User.findOne({ firebaseUID: uid });
    if (!user) return res.status(404).json({ message: "User not found" });

    // prepare last 7 days totals
    const last7 = user.footprintLogs.slice(-7);
    res.json({ user, last7 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.requestConsultation = async (req, res) => {
  try {
    const uid = req.firebaseUID;
    const { preferredDate, notes, professionalId } = req.body;

    // 1️⃣ Fetch user
    const user = await User.findOne({ firebaseUID: uid });
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2️⃣ Fetch selected professional
    const professional = await Professional.findById(professionalId);
    if (!professional) return res.status(404).json({ message: "Professional not found" });

    // 3️⃣ Get latest footprint
    const latestFootprint = await FootprintLog.findOne({ firebaseUID: uid })
      .sort({ date: -1 });

    // 4️⃣ Create consultation
    const consultation = new Consultation({
      user: user._id,
      professional: professional._id,             // ✅ assign selected consultant
      consultationFee: professional.consultationFee, // ✅ copy fee at booking
      scheduledFor: preferredDate ? new Date(preferredDate) : null,
      notes,
      priority: user.premium ? true : false,
      footprintSnapshot: latestFootprint
        ? { ...latestFootprint.totals, capturedAt: latestFootprint.date }
        : null
    });

    // 5️⃣ Save consultation
    await consultation.save();

    // 6️⃣ Link to user
    user.consultationsRequested.push(consultation._id);
    await user.save();

    // 7️⃣ Respond
    res.json({ message: "Consultation requested", consultation });

  } catch (err) {
    console.error("Consultation error:", err);
    res.status(500).json({ message: err.message });
  }
};


exports.getMyConsultations = async (req, res) => {
  try {
    const uid = req.firebaseUID;
    const user = await User.findOne({ firebaseUID: uid })
      .populate({
        path: "consultationsRequested",
        populate: {
          path: "professional",
          select: "name email consultationFee", // fetch name and email
        },
      });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ consultations: user.consultationsRequested });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

