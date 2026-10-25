// controllers/adminController.js
const Admin = require("../models/Admin");
const Professional = require("../models/Professional");
const User = require("../models/User");
const Payment = require("../models/Payment");
const bcrypt = require("bcryptjs");

exports.createAdmin = async (req, res) => {
  // For initial setup only. Protect or remove in production.
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: "username & password required" });
    let existing = await Admin.findOne({ username });
    if (existing) return res.status(400).json({ message: "admin already exists" });
    const admin = new Admin({ username });
    await admin.setPassword(password);
    await admin.save();
    res.json({ message: "Admin created", username: admin.username });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const ok = await admin.checkPassword(password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    // Return a simple admin token
    res.json({
      success: true,
      token: process.env.ADMIN_TOKEN
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



exports.logout = async (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out" });
  });
};

exports.approveProfessional = async (req, res) => {
  try {
    const { professionalId, approve } = req.body;
    const prof = await Professional.findById(professionalId);
    if (!prof) return res.status(404).json({ message: "Professional not found" });
    prof.approved = !!approve;
    await prof.save();
    res.json({ message: "Updated professional", prof });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getGlobalStats = async (req, res) => {
  try {
    const users = await User.find();
    const payments = await Payment.find();
    let totals = { travel:0, food:0, electricity:0, water:0, shopping:0, gas:0, total:0 };

    users.forEach(u => {
      u.footprintLogs.forEach(log => {
        totals.travel += (log.totals?.travel || 0);
        totals.food += (log.totals?.food || 0);
        totals.electricity += (log.totals?.electricity || 0);
        totals.water += (log.totals?.water || 0);
        totals.shopping += (log.totals?.shopping || 0);
        totals.gas += (log.totals?.gas || 0);
        totals.total += (log.totals?.total || 0);
      });
    });

    res.json({ totals, userCount: users.length, paymentCount: payments.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
