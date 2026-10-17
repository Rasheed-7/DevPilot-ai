import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  uploadResume,
  getResumes,
  previewResume,
  deleteResume,
  archiveResume,
  downloadResume,
  updateResume,
  analyzeResume,
  matchResumeToJob,
} from '../controllers/resumeController.js';
import { uploadResume as uploadMiddleware, handleMulterError } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// GET /api/resumes - Get all resumes for the authenticated user
// POST /api/resumes - Upload a new resume
router
  .route('/')
  .get(protect, getResumes)
  .post(protect, uploadMiddleware, handleMulterError, uploadResume);

router.put("/:id", protect, updateResume);
router.get("/:id/preview", protect, previewResume); 
router.patch("/:id/archive", protect, archiveResume);
router.delete("/:id", protect, deleteResume);
router.get("/:id/download", protect, downloadResume);
router.post("/:id/analyze", protect, analyzeResume);
router.post("/match", protect, matchResumeToJob);

export default router;