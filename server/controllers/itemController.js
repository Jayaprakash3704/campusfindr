import mongoose from 'mongoose';
import Item from '../models/Item.js';
import { sanitizeString } from '../middleware/validate.js';

const VALID_CATEGORIES = ['Electronics', 'Documents', 'Wallets/Bags', 'Books', 'Sports Gear', 'Keys', 'Other'];
const VALID_REPORT_TYPES = ['lost', 'found'];
const VALID_ITEM_TYPES = ['personal', 'institutional'];

// ── POST /api/v1/items/report ─────────────────────────────────────────────────
// Roles: user, admin, superadmin
export async function createReport(req, res, next) {
  try {
    const {
      type, reportType, title, category,
      description, location, metadata,
    } = req.body;

    // ── Structured validation ─────────────────────────────────
    const errors = [];

    if (!type || !VALID_ITEM_TYPES.includes(type)) {
      errors.push({ field: 'type', message: 'Item type must be "personal" or "institutional".' });
    }
    if (!reportType || !VALID_REPORT_TYPES.includes(reportType)) {
      errors.push({ field: 'reportType', message: 'Report type must be "lost" or "found".' });
    }
    if (!title || !title.trim()) {
      errors.push({ field: 'title', message: 'Item title is required.' });
    } else if (title.trim().length < 3) {
      errors.push({ field: 'title', message: 'Title must be at least 3 characters.' });
    } else if (title.trim().length > 120) {
      errors.push({ field: 'title', message: 'Title must be 120 characters or less.' });
    }
    if (!category || !VALID_CATEGORIES.includes(category)) {
      errors.push({ field: 'category', message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}.` });
    }
    if (!location || !location.trim()) {
      errors.push({ field: 'location', message: 'Location is required.' });
    } else if (location.trim().length < 3) {
      errors.push({ field: 'location', message: 'Please be more specific about the location.' });
    }
    if (description && description.length > 500) {
      errors.push({ field: 'description', message: 'Description must be 500 characters or less.' });
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // ── Sanitize free-text fields ─────────────────────────────
    const cleanTitle       = sanitizeString(title);
    const cleanLocation    = sanitizeString(location);
    const cleanDescription = description ? sanitizeString(description) : '';

    // ── Duplicate spam check ──────────────────────────────────
    // Reject if same reporterId submitted the exact same title within 60 seconds
    const reporterId = req.body.reporterId || req.user.name;
    const oneMinuteAgo = new Date(Date.now() - 60_000);
    const duplicate = await Item.findOne({
      reporterId,
      title: { $regex: new RegExp(`^${cleanTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      timestamp: { $gte: oneMinuteAgo },
    });
    if (duplicate) {
      return res.status(429).json({
        error: 'A duplicate report was submitted too recently. Please wait before resubmitting.',
      });
    }

    const item = await Item.create({
      reporterId,
      type,
      reportType,
      title:       cleanTitle,
      category,
      description: cleanDescription,
      location:    cleanLocation,
      metadata: {
        serialNumber:         metadata?.serialNumber ? sanitizeString(String(metadata.serialNumber)) : null,
        associatedDepartment: metadata?.associatedDepartment ? sanitizeString(String(metadata.associatedDepartment)) : null,
      },
    });

    return res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/v1/items/active ──────────────────────────────────────────────────
export async function getActive(req, res, next) {
  try {
    const active = await Item.find({ status: 'unclaimed' }).sort({ timestamp: -1 });
    const lost   = active.filter((i) => i.reportType === 'lost');
    const found  = active.filter((i) => i.reportType === 'found');
    return res.json({ success: true, data: { lost, found } });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/v1/items/stats ──────────────────────────────────────────────────
export async function getStats(req, res, next) {
  try {
    const [lost, found, resolved] = await Promise.all([
      Item.countDocuments({ status: 'unclaimed', reportType: 'lost' }),
      Item.countDocuments({ status: 'unclaimed', reportType: 'found' }),
      Item.countDocuments({ status: 'claimed' }),
    ]);
    return res.json({ success: true, data: { lost, found, resolved } });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/v1/items/mine ───────────────────────────────────────────────────
// Returns all items submitted by the authenticated user.
// reporterId stored at create time = rollOrEmployeeId || email || _id.toString()
export async function getMyItems(req, res, next) {
  try {
    // Build a list of all possible reporterId values this user could have used
    const possibleIds = [
      req.user.rollOrEmployeeId,
      req.user.email,
      req.user._id?.toString(),
    ].filter(Boolean);

    const items = await Item.find({ reporterId: { $in: possibleIds } })
      .sort({ timestamp: -1 });
    return res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/v1/items/resolve/:id ──────────────────────────────────────────
// Roles: admin, superadmin — ObjectId validated by middleware
export async function resolveItem(req, res, next) {
  try {
    const { id } = req.params;
    const { matchedWithId } = req.body;

    // Validate matchedWithId if provided
    if (matchedWithId && !mongoose.Types.ObjectId.isValid(matchedWithId)) {
      return res.status(400).json({ error: 'Invalid matchedWithId format.' });
    }

    if (matchedWithId) {
      const [primary, matched] = await Promise.all([
        Item.findOne({ _id: id, status: 'unclaimed' }),
        Item.findOne({ _id: matchedWithId, status: 'unclaimed' }),
      ]);
      if (!primary || !matched) {
        return res.status(404).json({ error: 'One or both items not found or already resolved.' });
      }
      if (primary.reportType === matched.reportType) {
        return res.status(400).json({ error: 'Cannot match two items of the same report type.' });
      }
    }

    let resolvedCount = 0;

    if (matchedWithId) {
      const [r1, r2] = await Promise.all([
        Item.updateOne(
          { _id: id, status: 'unclaimed' },
          { $set: { status: 'claimed', 'wardenLogs.matchedWithId': matchedWithId, 'wardenLogs.resolvedByWarden': req.user._id, 'wardenLogs.resolvedAt': new Date() } }
        ),
        Item.updateOne(
          { _id: matchedWithId, status: 'unclaimed' },
          { $set: { status: 'claimed', 'wardenLogs.matchedWithId': id, 'wardenLogs.resolvedByWarden': req.user._id, 'wardenLogs.resolvedAt': new Date() } }
        ),
      ]);
      resolvedCount = r1.modifiedCount + r2.modifiedCount;
    } else {
      const result = await Item.updateOne(
        { _id: id, status: 'unclaimed' },
        { $set: { status: 'claimed', 'wardenLogs.matchedWithId': null, 'wardenLogs.resolvedByWarden': req.user._id, 'wardenLogs.resolvedAt': new Date() } }
      );
      resolvedCount = result.modifiedCount;
    }

    if (resolvedCount === 0) {
      return res.status(404).json({ error: 'Item not found or already resolved.' });
    }

    return res.json({ success: true, message: 'Asset successfully archived.', resolvedCount });
  } catch (err) {
    next(err);
  }
}
