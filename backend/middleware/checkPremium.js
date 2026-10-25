const User = require("../models/User");

module.exports = async function checkPremium(req, res, next) {
  try {
    const user = req.user;
    if (!user) return next();

    // Expire premium if date passed
    if (user.premium && user.premiumUntil && user.premiumUntil < new Date()) {
      user.premium = false;
      await user.save();
      console.log(`⚠️ Premium expired for user ${user._id}`);
    }

    // Calculate remaining days
    if (user.premium && user.premiumUntil) {
      const now = new Date();
      const diffMs = user.premiumUntil - now;
      user.premiumDaysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24)); // days
    } else {
      user.premiumDaysLeft = 0;
    }

    next();
  } catch (err) {
    console.error("CheckPremium error:", err.message);
    next();
  }
};
