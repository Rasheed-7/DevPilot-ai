import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getPlatforms,
  connectPlatform,
  disconnectPlatform,
  verifyPlatform,
  syncCodeforces,
  syncLeetCode,
} from '../controllers/platformController.js';

const router = express.Router();

router.get('/', protect, getPlatforms);
router.post('/', protect, connectPlatform);
router.delete('/:platform', protect, disconnectPlatform);
router.post('/verify', protect, verifyPlatform);

// Platform-specific sync routes
router.post('/Codeforces/sync', protect, syncCodeforces);
router.post('/LeetCode/sync', protect, syncLeetCode);

export default router;