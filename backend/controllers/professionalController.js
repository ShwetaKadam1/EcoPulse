// controllers/professionalController.js
const Professional = require("../models/Professional");
const User = require("../models/User");
const FootprintLog = require("../models/FootprintLog"); 
const Consultation = require("../models/Consultation");
const AdviceRequest = require("../models/AdviceRequest");
const Payment = require("../models/Payment");

exports.createOrUpdateProfile = async (req, res) => {
  try {
    const uid = req.firebaseUID;
    const { name, experience, skills, languages, consultationFee } = req.body;
    let prof = await Professional.findOne({ firebaseUID: uid });
    if (!prof) {
      prof = new Professional({ firebaseUID: uid, name, experience, skills, languages, consultationFee: Number(consultationFee) || 0, approved: false });
    } else {
      prof.name = name || prof.name;
      prof.experience = experience || prof.experience;
      prof.skills = skills || prof.skills;
      prof.languages = languages || prof.languages;
      if (consultationFee !== undefined) prof.consultationFee = Number(consultationFee);
    }
    await prof.save();
    res.json({ message: "Profile saved", prof });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPendingAdvice = async (req, res) => {
  try {
    const prof = await Professional.findOne({ firebaseUID: req.firebaseUID });
    if (!prof) return res.status(404).json({ message: "Professional not found" });

    const requests = await AdviceRequest.find({
      professional: prof._id,
      completed: false,
    }).sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error("Pending advice fetch error:", err);
    res.status(500).json({ message: err.message });
  }
};



exports.getPendingConsultations = async (req, res) => {
  try {
    const prof = await Professional.findOne({ firebaseUID: req.firebaseUID });
    if (!prof) return res.status(404).json({ message: "Professional not found" });

    // Fetch consultations assigned to this professional and with status "requested"
    const consultations = await Consultation.find({ 
        status: "requested",
        professional: prof._id  // ✅ only their consultations
      })
      .populate("user", "name email firebaseUID") 
      .populate("professional", "name email consultationFee")
      .sort({ priority: -1, requestedAt: 1 })
      .limit(200)
      .lean();

    // Attach last footprint log date for each consultation's user
    for (let c of consultations) {
      const lastLog = await FootprintLog.findOne({ firebaseUID: c.user.firebaseUID })
        .sort({ date: -1 })
        .lean();
      c.user.lastLogDate = lastLog ? lastLog.date : null;
      c.user.lastFootprint = lastLog ? lastLog.totals : null;
      c.fee = c.consultationFee || (c.professional ? c.professional.consultationFee : 0);
      c.paid = c.paid || false;
    }

    res.json({ consultations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


exports.updateConsultation = async (req, res) => {
  try {
    const { consultationId, status, scheduledFor, professionalNotes } = req.body;
    const cons = await Consultation.findById(consultationId);
    if (!cons) return res.status(404).json({ message: "Consultation not found" });
    if (status) cons.status = status;
    if (scheduledFor) cons.scheduledFor = new Date(scheduledFor);
    if (professionalNotes) cons.notes = professionalNotes;
    if (req.firebaseUID) {
      const prof = await Professional.findOne({ firebaseUID: req.firebaseUID });
      if (prof) cons.professional = prof._id;
    }
    await cons.save();
    res.json({ message: "Consultation updated", cons });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllConsultations = async (req, res) => {
  try {
    const prof = await Professional.findOne({ firebaseUID: req.firebaseUID });
    if (!prof) return res.status(404).json({ message: "Professional not found" });

    // Fetch all consultations assigned to this professional
    const consultations = await Consultation.find({ professional: prof._id })
      .populate("user", "name email firebaseUID")
      .populate("professional", "name email consultationFee")
      .sort({ requestedAt: -1 })
      .limit(200)
      .lean();

    for (let c of consultations) {
      const lastLog = await FootprintLog.findOne({ firebaseUID: c.user.firebaseUID })
        .sort({ date: -1 })
        .lean();
      c.user.lastLogDate = lastLog ? lastLog.date : null;
      c.user.lastFootprint = lastLog ? lastLog.totals : null;
      c.fee = c.consultationFee || (c.professional ? c.professional.consultationFee : 0);
      c.paid = c.paid || false;
    }

    res.json({ consultations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


// controllers/professionalController.js
exports.getTotalEarnings = async (req, res) => {
  try {
    const professional = await Professional.findOne({ firebaseUID: req.firebaseUID });
    if (!professional) return res.status(404).json({ message: "Professional not found" });

    // Fetch all paid consultations for this professional
    const consultations = await Consultation.find({
      professional: professional._id,
      paid: true,
    }).lean();

    // Sum 90% of consultationFee
    const totalEarnings = consultations.reduce((sum, c) => sum + ((c.consultationFee || 0) * 0.9), 0);

    res.json({ totalEarnings });
  } catch (err) {
    console.error("Failed to calculate earnings:", err);
    res.status(500).json({ message: "Failed to calculate earnings" });
  }
};

