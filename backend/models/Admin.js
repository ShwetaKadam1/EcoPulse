// models/Admin.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true }, // hashed password
  createdAt: { type: Date, default: Date.now }
});

// helper to set password
adminSchema.methods.setPassword = async function(password) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(password, salt);
};

adminSchema.methods.checkPassword = async function(password) {
  const bcrypt = require("bcryptjs");
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model("Admin", adminSchema);
