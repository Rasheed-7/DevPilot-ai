import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
} from "../controllers/goalController.js";

const router = express.Router();

router.get("/", protect, getGoals);
router.post("/", protect, createGoal);
router.get("/:id", protect, getGoal);
router.put("/:id", protect, updateGoal);
router.delete("/:id", protect, deleteGoal);

export default router;