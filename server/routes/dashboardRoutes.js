import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getDashboardData } from "../controllers/dashboardController.js";

const router = express.Router();

// GET /api/dashboard - Get all dashboard data for authenticated user
router.get("/", protect, getDashboardData);

export default router;