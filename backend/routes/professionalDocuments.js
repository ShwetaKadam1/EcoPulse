const router = require("express").Router();
const upload = require("../middleware/documentUpload");
const Document = require("../models/Document");
const Professional = require("../models/Professional");
const { verifyFirebaseToken } = require("../middleware/firebaseAuth");

router.post(
  "/",
  verifyFirebaseToken,
  upload.array("files", 5),
  async (req, res) => {
    try {
      const professional = await Professional.findOne({
        firebaseUID: req.firebaseUID
      });
      if (!professional) return res.status(404).json({ message: "Professional not found" });

      if (!req.files || req.files.length === 0) return res.status(400).json({ message: "No files uploaded" });
      if (!req.body.type) return res.status(400).json({ message: "Document type is required" });

      const docs = [];

      for (const file of req.files) {
        try {
          const doc = await Document.create({
            consultant: professional._id,
            type: req.body.type,
            filename: file.originalname,              // show readable name in frontend
            url: `/uploads/documents/${file.filename}` // actual file path
          });
          docs.push(doc);
        } catch (err) {
          console.error("Failed to save document:", file.originalname, err);
        }
      }

      res.json({ documents: docs });
    } catch (err) {
      console.error("❌ Document upload failed:", err);
      res.status(500).json({ message: "Upload failed" });
    }
  }
);

router.get("/me", verifyFirebaseToken, async (req, res) => {
  try {
    const professional = await Professional.findOne({ firebaseUID: req.firebaseUID });
    if (!professional) return res.status(404).json({ message: "Professional not found" });

    const documents = await Document.find({ consultant: professional._id });
    res.json({ documents });
  } catch (err) {
    console.error("❌ Fetch documents failed:", err);
    res.status(500).json({ message: "Could not fetch documents" });
  }
});

module.exports = router;
