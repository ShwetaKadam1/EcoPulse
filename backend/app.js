// app.js
const express = require("express");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
require('dotenv').config(); 

const loginRoleRoute = require("./routes/loginRoutes");
const logsRouter = require("./routes/logs");
const adminRoutes = require("./routes/adminRoutes");
const adminDocuments = require("./routes/admindocuments");
const adminConsultants = require("./routes/adminProfessionals");


connectDB();


const app = express();

// Use morgan for logging in dev
app.use(morgan("dev"));

// CORS - adjust origin as needed
app.use(cors({
  origin: true,
  credentials: true
}));


app.use(bodyParser.json());

app.use(
  "/uploads/documents",
  express.static(path.join(__dirname, "uploads/documents"))
);

// Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/professionals", require("./routes/professionalRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/professionals/documents", require("./routes/professionalDocuments"));
app.use("/api/loginRole", loginRoleRoute);
app.use("/api/logs", logsRouter);
app.use("/api/admin/documents", adminDocuments);
app.use("/api/admin/professionals", adminConsultants);
app.use("/api/chat", require("./routes/chat"));
app.use("/api/payments", require("./routes/paymentRoutes"));


app.get("/", (req, res) => res.json({ message: "EcoPulse API running" }));

module.exports = app;

