import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  signup,
  login,
  getMe,
  createAdmin,
  listAdmins,
  deleteAdmin,
  getGlobalStats,
} from '../controllers/authController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

// ── Public routes ─────────────────────────────────────────────────────────────
router.post('/signup', authLimiter, signup);
router.post('/login',  authLimiter, login);

// ── Authenticated routes ──────────────────────────────────────────────────────
router.get('/me', protect, getMe);

// ── SuperAdmin-only: admin management ────────────────────────────────────────
router.post('/admins',        protect, requireRole('superadmin'), createAdmin);
router.get('/admins',         protect, requireRole('superadmin'), listAdmins);
router.delete('/admins/:id',  protect, requireRole('superadmin'), deleteAdmin);
router.get('/global-stats',   protect, requireRole('superadmin'), getGlobalStats);

export default router;
