// models/Consultation.js
const mongoose = require("mongoose");

const consultationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  professional: { type: mongoose.Schema.Types.ObjectId, ref: "Professional", default: null },
  requestedAt: { type: Date, default: Date.now },
  scheduledFor: Date,
  status: { type: String, enum: ["requested","scheduled","completed","cancelled"], default: "requested" },
  consultationFee: { type: Number, default: 0 },
  paid: { type: Boolean, default: false },
  notes: String,
  priority: { type: Boolean, default: false },

  footprintSnapshot: {
    type: {
      total: Number,
      travel: Number,
      food: Number,
      electricity: Number,
      water: Number,
      shopping: Number,
      gas: Number,
      capturedAt: Date, // timestamp of snapshot
    },
    default: null
  }
});

module.exports = mongoose.model("Consultation", consultationSchema);
