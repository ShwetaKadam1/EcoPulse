const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads/documents exists
const uploadDir = "uploads/documents";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Sanitize original filename
    const name = file.originalname
      .toLowerCase()
      .replace(/\s+/g, "_")       // spaces → underscores
      .replace(/[^\w.-]/g, "");  // remove special chars except . and -

    // Add timestamp to avoid collisions
    const timestamp = Date.now();
    cb(null, `${timestamp}_${name}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter(req, file, cb) {
    const allowed = ["application/pdf", "image/png", "image/jpeg"];
    cb(null, allowed.includes(file.mimetype));
  },
});

module.exports = upload;
