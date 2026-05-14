import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer"; 

import authRoutes from "./routes/authRoutes.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import { ensureDataFiles } from "./utils/storage.js";
import { analyzeText } from "./utils/aiEngine.js";

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

ensureDataFiles();

/**
 * 1. TRANSPORTER (For future real-mail use)
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com', 
    pass: process.env.EMAIL_PASS || 'xxxx xxxx xxxx xxxx'
  }
});

/**
 * 2. TEMPORARY OTP STORAGE
 * This memory persists as long as the server is running.
 */
let verificationCodes = {}; 

const extraOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      try {
        const u = new URL(origin);
        if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return callback(null, true);
      } catch { /* ignore */ }
      if (extraOrigins.includes(origin)) return callback(null, true);
      callback(null, false);
    },
    credentials: false
  })
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const nonsenseFilter = (req, res, next) => {
  if (req.method === "POST" && (req.path === "/" || req.path === "/text" || req.path === "/image")) {
    const { text } = req.body;
    if (text && text.trim().length > 0) {
      const analysis = analyzeText(text);
      if (analysis.confidence === 0.0) {
        return res.status(400).json({ 
          message: "Your complaint description is too short or unclear. Please provide more detail." 
        });
      }
    }
  }
  next();
};

/**
 * 3. DYNAMIC OTP ROUTES (Works for both Complaint Form & Login Page)
 */

// Handle OTP generation for both Login and Complaints
app.post('/api/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email address is required for verification." });

  const cleanEmail = email.toLowerCase().trim();
  const otp = Math.floor(100000 + Math.random() * 900000);
  
  // Save OTP in session memory
  verificationCodes[cleanEmail] = otp;

  // --- LOG TO TERMINAL (Citizen uses this to see the code) ---
  console.log("------------------------------------------");
  console.log(`[AUTH/REPORT] OTP for ${cleanEmail} is [ ${otp} ]`);
  console.log("------------------------------------------");

  res.json({ 
    success: true, 
    message: "Debug Mode: OTP generated! Check your server terminal." 
  });
});

// Handle Verification for Login flow in Login.jsx
app.post('/api/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: "Email or OTP missing." });

  const cleanEmail = email.toLowerCase().trim();
  
  // Loose equality (==) used to handle string vs number comparison from frontend
  if (verificationCodes[cleanEmail] && verificationCodes[cleanEmail] == otp) {
    delete verificationCodes[cleanEmail]; // OTP is used once, then deleted
    return res.json({ success: true, message: "Identity Verified!" });
  }
  
  res.status(400).json({ success: false, message: "Invalid or expired OTP code." });
});

/**
 * API ROUTES
 */
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, name: "Jan Seva AI", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/complaints", nonsenseFilter, complaintRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chatbot", chatbotRoutes);

app.use((err, _req, res, _next) => {
  console.error("Backend Error:", err);
  res.status(500).json({ message: err?.message || "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Bhopal Local Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
});