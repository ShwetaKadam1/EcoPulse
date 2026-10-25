// models/Professional.js
const mongoose = require("mongoose");

const professionalSchema = new mongoose.Schema({
  firebaseUID: { type: String, index: true, unique: true, required: true },
  name: String,
  email: String, 
  experience: { type: Number, default: 0 },
  skills: [String],
  languages: [String],
  consultationFee: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  approvalStatus: {
  type: String,
  enum: ["pending", "approved", "rejected"],
  default: "pending"
},
rejectionReason: {
  type: String
},
  isStarred: {
    type: Boolean,
    default: false
  },
  starAssignedAt: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model("Professional", professionalSchema);

