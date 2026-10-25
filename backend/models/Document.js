// models/Document.js
const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  consultant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Professional",
    required: true
  },
  type: {
    type: String,
    enum: [
      "degree",
      "id_proof",
      "license",
      "pcc",
      "experience",
      "other"
    ],
    required: true
  },
  filename: String,
  url: String,
  approvalStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  rejectionReason: String,
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Document", documentSchema);
