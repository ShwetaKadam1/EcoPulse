// config/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI not defined in .env");
    await mongoose.connect(process.env.MONGO_URI, {
      // useNewUrlParser / useUnifiedTopology are default in mongoose v6+
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
