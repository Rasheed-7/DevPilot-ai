import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getSettings,
  updateSettings,
  changePassword,
  deleteAccount,
} from "../controllers/settingsController.js";

const router = express.Router();

router.get("/", protect, getSettings);
router.put("/", protect, updateSettings);
router.put("/change-password", protect, changePassword);
router.delete("/account", protect, deleteAccount);

export default router;