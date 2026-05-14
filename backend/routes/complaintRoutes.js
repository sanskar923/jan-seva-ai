import express from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

import { requireAuth } from "../middleware/auth.js";
import {
  deleteComplaint,
  listMyComplaints,
  submitImageComplaint,
  submitTextComplaint
} from "../controllers/complaintController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to store uploaded images
const uploadsDir = path.join(__dirname, "..", "uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    // Generate a unique ID for each complaint image to avoid name collisions
    const ext = path.extname(file.originalname || "");
    cb(null, `${crypto.randomUUID()}${ext || ""}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit matching your server.js
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) return cb(null, true);
    cb(new Error("Only image uploads allowed"));
  }
});

const router = express.Router();

/**
 * GET /api/complaints
 * Lists all complaints belonging to the logged-in citizen.
 */
router.get("/", requireAuth, listMyComplaints);

/**
 * POST /api/complaints/text
 * Handles standard text complaints.
 * Now expects: { text, fullname, occupation, employmentType, location }
 */
router.post("/text", requireAuth, (req, res, next) => {
  submitTextComplaint(req, res).catch(next);
});

/**
 * POST /api/complaints/image
 * Handles multimodal complaints with AI vision.
 * Multer extracts the file to req.file and the profile data to req.body.
 */
router.post("/image", requireAuth, upload.single("image"), (req, res, next) => {
  // We explicitly catch errors to pass to the global error handler in server.js
  submitImageComplaint(req, res).catch(next);
});

/**
 * DELETE /api/complaints/:id
 * Allows citizens to remove their own reports.
 */
router.delete("/:id", requireAuth, deleteComplaint);

export default router;