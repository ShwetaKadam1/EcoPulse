const express = require("express");
const router = express.Router();
const profCtrl = require("../controllers/professionalController");
const { verifyFirebaseToken, admin } = require("../middleware/firebaseAuth");
const Professional = require("../models/Professional");
const dbConnect = require("../config/db");
const upload = require("../middleware/documentUpload");
const AdviceRequest = require("../models/AdviceRequest");

// --- PROFESSIONAL SIGNUP
router.post("/signup", async (req, res) => {
  const { name, email, password, experience, skills, languages, consultationFee } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "Missing fields" });

  try {
    await dbConnect();

    // Create Firebase user
    const userRecord = await admin.auth().createUser({ email, password, displayName: name });

    // Create MongoDB professional
    const newPro = await Professional.create({
      firebaseUID: userRecord.uid,
      name,
      email,
      experience,
      skills: skills?.split(",").map(s => s.trim()) || [],
      languages: languages?.split(",").map(l => l.trim()) || [],
      consultationFee: Number(consultationFee) || 0,
      approved: false,
      createdAt: new Date(),
    });

    res.status(201).json({ message: "Professional account created successfully" });
  } catch (err) {
    console.error("Professional signup error:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/professionals/me
router.get("/me", verifyFirebaseToken, async (req, res) => {
  try {
    const prof = await Professional.findOne({ firebaseUID: req.firebaseUID });
    if (!prof) return res.status(404).json({ message: "Profile not found" });
    res.json({ professional: prof });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/sendAdvice", verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.firebaseUID;
    const { requestId, adviceText } = req.body;

    const prof = await Professional.findOne({ firebaseUID: uid });
    if (!prof) return res.status(404).json({ message: "Professional not found" });

    const request = await AdviceRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Advice request not found" });
    if (request.professional.toString() !== prof._id.toString())
      return res.status(403).json({ message: "Not authorized for this request" });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 7);

    request.adviceText = adviceText;
    request.completed = true;
    request.startDate = startDate;
    request.endDate = endDate;

    await request.save();
    res.json({ message: "Advice sent", request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});




// --- Existing routes
router.post("/profile", verifyFirebaseToken, profCtrl.createOrUpdateProfile);
router.get("/consultations", verifyFirebaseToken, profCtrl.getPendingConsultations);
router.get("/consultations/all", verifyFirebaseToken, profCtrl.getAllConsultations);
router.post("/consultation/update", verifyFirebaseToken, profCtrl.updateConsultation);
router.get("/pendingAdvice", verifyFirebaseToken, profCtrl.getPendingAdvice);
router.get("/earnings", verifyFirebaseToken, profCtrl.getTotalEarnings);


module.exports = router;
