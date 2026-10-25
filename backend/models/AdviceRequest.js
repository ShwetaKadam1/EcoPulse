//models/AdviceRequest.js
const mongoose = require("mongoose");

const adviceRequestSchema = new mongoose.Schema({
  professional: { type: mongoose.Schema.Types.ObjectId, ref: "Professional", required: true },
  requestedAt: { type: Date, default: Date.now },
  completed: { type: Boolean, default: false },
  adviceText: { type: String, default: "" },
  startDate: { type: Date }, // when the advice becomes active
  endDate: { type: Date }    // one week validity
}, { timestamps: true });

module.exports = mongoose.model("AdviceRequest", adviceRequestSchema);
