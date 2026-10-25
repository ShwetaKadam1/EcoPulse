// routes/adminProfessionals.js
const router = require("express").Router();
const Document = require("../models/Document");
const Professional = require("../models/Professional");
const { REQUIRED_DOCUMENTS } = require("../utils/documentRules");
const simpleAdminAuth = require("../middleware/simpleAdminAuth");

// Approve professional if all required documents are approved
router.post("/:id/approve", simpleAdminAuth, async (req, res) => {
  try {
    const docs = await Document.find({ consultant: req.params.id });

    const approvedTypes = docs
      .filter(d => d.approvalStatus === "approved")
      .map(d => d.type);

    const allOk = REQUIRED_DOCUMENTS.every(t => approvedTypes.includes(t));

    if (!allOk) {
      return res.status(400).json({ message: "All documents not approved" });
    }

    await Professional.findByIdAndUpdate(req.params.id, {
      approved: true,
      approvalStatus: "approved",
      rejectionReason: null
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to approve professional" });
  }
});

// Reject professional
router.post("/:id/reject", simpleAdminAuth, async (req, res) => {
  try {
    await Professional.findByIdAndUpdate(req.params.id, {
      approved: false,
      approvalStatus: "rejected",
      rejectionReason: req.body.reason
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to reject professional" });
  }
});

// Get all professionals for admin dashboard
router.get("/", simpleAdminAuth, async (req, res) => {
  try {
    const pros = await Professional.find();
    res.json(pros);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch professionals" });
  }
});

module.exports = router;
