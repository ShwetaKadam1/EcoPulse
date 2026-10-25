// middleware/firebaseAuth.js
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Initialize Firebase Admin once
if (!admin.apps.length) {

  let serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (!serviceAccountPath) {
    console.error("❌ FIREBASE_SERVICE_ACCOUNT_PATH is missing in .env");
    process.exit(1);
  }

  // Resolve absolute path
  serviceAccountPath = path.resolve(__dirname, "..", serviceAccountPath);

  if (!fs.existsSync(serviceAccountPath)) {
    console.error("❌ Firebase service account file NOT FOUND at:", serviceAccountPath);
    process.exit(1);
  }

  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("✅ Firebase Admin initialized");
}

// Verify token middleware
async function verifyFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const match = authHeader.match(/^Bearer (.+)$/);

    if (!match) {
      return res.status(401).json({ message: "Missing Authorization header" });
    }

    const idToken = match[1];
    const decoded = await admin.auth().verifyIdToken(idToken);

    req.firebaseUID = decoded.uid;
    req.firebaseEmail = decoded.email;

    next();
  } catch (err) {
    console.error("❌ Firebase token verification failed:", err.message);
    return res.status(401).json({ message: "Invalid Firebase token" });
  }
}

module.exports = {
  verifyFirebaseToken,
  authMiddleware: verifyFirebaseToken,
  admin
};

