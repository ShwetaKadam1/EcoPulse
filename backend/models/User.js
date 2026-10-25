// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firebaseUID: { type: String, index: true, unique: true, required: true },
  name: String,
  email: String,
  premium: { type: Boolean, default: false },
  premiumSince: Date,
  premiumUntil: Date,
  createdAt: { type: Date, default: Date.now },
  consultationsRequested: [{ type: mongoose.Schema.Types.ObjectId, ref: "Consultation" }],
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedReason: {
    type: String,
    default: ""
  },
  blockedAt: {
    type: Date
  }
});

userSchema.virtual("premiumDaysLeft").get(function () {
  if (!this.premium || !this.premiumUntil) return 0;
  const now = new Date();
  const diffMs = this.premiumUntil - now;
  return Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24)), 0);
});

// Include virtuals in JSON output
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("User", userSchema);
