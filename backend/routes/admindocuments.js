// routes/admindocuments.js
const router = require("express").Router();
const Document = require("../models/Document");
const simpleAdminAuth = require("../middleware/simpleAdminAuth");

// Approve a document
router.post("/:id/approve", simpleAdminAuth, async (req, res) => {
  try {
    await Document.findByIdAndUpdate(req.params.id, {
      approvalStatus: "approved",
      rejectionReason: null
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to approve document" });
  }
});

// Reject a document
router.post("/:id/reject", simpleAdminAuth, async (req, res) => {
  try {
    await Document.findByIdAndUpdate(req.params.id, {
      approvalStatus: "rejected",
      rejectionReason: req.body.reason
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to reject document" });
  }
});

// Get all documents
router.get("/", simpleAdminAuth, async (req, res) => {
  try {
    const docs = await Document.find().populate("consultant", "name email");
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch documents" });
  }
});

// Get all documents for a specific professional
router.get("/professional/:id", simpleAdminAuth, async (req, res) => {
  try {
    const docs = await Document.find({ consultant: req.params.id });
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch documents for professional" });
  }
});

module.exports = router;
