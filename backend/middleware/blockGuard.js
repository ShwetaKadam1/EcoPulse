// middleware/blockGuard.js
const User = require("../models/User");

module.exports = async function blockGuard(req, res, next) {
  try {
    const user = await User.findOne({ firebaseUID: req.firebaseUID });

    if (user?.isBlocked) {
      return res.status(403).json({
        code: "ACCOUNT_BLOCKED",
        message: "Your account is restricted due to policy violation.",
        reason: user.blockedReason
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({ message: "Block check failed" });
  }
};
