import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  archiveJob,
  getArchivedJobs,
  restoreJob,
} from "../controllers/jobController.js";

const router = express.Router();

router.route("/")
  .get(protect, getJobs)
  .post(protect, createJob);

router.get("/archived", protect, getArchivedJobs);

router.route("/:id")
  .get(protect, getJob)
  .put(protect, updateJob)
  .delete(protect, deleteJob);

router.patch("/:id/archive", protect, archiveJob);
router.patch("/:id/restore", protect, restoreJob);

export default router;