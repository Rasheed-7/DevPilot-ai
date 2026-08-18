import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getInterviews,
  getInterview,
  createInterview,
  updateInterview,
  deleteInterview,
} from "../controllers/interviewController.js";

const router = express.Router();

router
  .route("/")
  .get(protect, getInterviews)
  .post(protect, createInterview);

router
  .route("/:id")
  .get(protect, getInterview)
  .put(protect, updateInterview)
  .delete(protect, deleteInterview);

export default router;