import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createReport, getActive, getStats, resolveItem, getMyItems } from '../controllers/itemController.js';
import { protect, requireRole } from '../middleware/auth.js';
import { guardObjectId } from '../middleware/validate.js';

const router = Router();

// Rate-limit item creation to prevent spam (20 reports per 15 min per IP)
const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many reports submitted. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// All item routes require authentication
router.post(
  '/report',
  protect,
  requireRole('user', 'admin', 'superadmin'),
  reportLimiter,
  createReport
);

router.get(
  '/active',
  protect,
  requireRole('user', 'admin', 'superadmin'),
  getActive
);

router.get(
  '/stats',
  protect,
  requireRole('user', 'admin', 'superadmin'),
  getStats
);

// My own submitted reports (authenticated, any role)
router.get(
  '/mine',
  protect,
  requireRole('user', 'admin', 'superadmin'),
  getMyItems
);

// Only campus wardens (admin/superadmin) may resolve/archive items
router.patch(
  '/resolve/:id',
  protect,
  requireRole('admin', 'superadmin'),
  guardObjectId('id'),  // returns 400 on malformed ObjectId
  resolveItem
);

export default router;
