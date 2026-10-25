//models/ChatMessage.js
const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({
  consultation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Consultation",
    required: true,
  },
  senderRole: {
    type: String,
    enum: ["user", "professional"],
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
