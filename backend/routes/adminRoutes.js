import express from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { listAllComplaints, updateComplaintStatus } from "../controllers/adminController.js";

const router = express.Router();

router.get("/complaints", requireAuth, requireAdmin, listAllComplaints);
router.patch("/complaints/:id/status", requireAuth, requireAdmin, updateComplaintStatus);

export default router;

