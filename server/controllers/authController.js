import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Item from '../models/Item.js';

// ── Helper: sign JWT ──────────────────────────────────────
function signToken(user) {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function sendToken(res, user, statusCode = 200) {
  const token = signToken(user);
  res.status(statusCode).json({ success: true, token, user });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── POST /api/v1/auth/signup  (public — creates 'user' role only) ─────────────
export async function signup(req, res, next) {
  try {
    const { name, email, password, rollOrEmployeeId } = req.body;

    // Structured validation
    const errors = [];
    if (!name || !name.trim()) {
      errors.push({ field: 'name', message: 'Full name is required.' });
    } else if (name.trim().length > 80) {
      errors.push({ field: 'name', message: 'Name must be 80 characters or less.' });
    }
    if (!email || !email.trim()) {
      errors.push({ field: 'email', message: 'Email is required.' });
    } else if (!isValidEmail(email.trim().toLowerCase())) {
      errors.push({ field: 'email', message: 'Please enter a valid email address.' });
    }
    if (!password) {
      errors.push({ field: 'password', message: 'Password is required.' });
    } else if (password.length < 6) {
      errors.push({ field: 'password', message: 'Password must be at least 6 characters.' });
    }
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(409).json({
        errors: [{ field: 'email', message: 'An account with this email already exists.' }],
      });
    }

    const user = await User.create({
      name:             name.trim(),
      email:            normalizedEmail,
      password,
      role:             'user',
      rollOrEmployeeId: rollOrEmployeeId?.trim() || null,
    });
    sendToken(res, user, 201);
  } catch (err) {
    next(err);
  }
}

// ── POST /api/v1/auth/login  (public) ────────────────────────────────────────
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const user = await User.findOne({ email: normalizedEmail, isActive: true }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    sendToken(res, user);
  } catch (err) {
    next(err);
  }
}

// ── GET /api/v1/auth/me  (authenticated) ─────────────────────────────────────
export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/v1/auth/admins  (superadmin only — creates an admin) ────────────
export async function createAdmin(req, res, next) {
  try {
    const { name, email, password, rollOrEmployeeId } = req.body;

    const errors = [];
    if (!name || !name.trim()) {
      errors.push({ field: 'name', message: 'Full name is required.' });
    }
    if (!email || !email.trim()) {
      errors.push({ field: 'email', message: 'Email is required.' });
    } else if (!isValidEmail(email.trim().toLowerCase())) {
      errors.push({ field: 'email', message: 'Please enter a valid email address.' });
    }
    if (!password) {
      errors.push({ field: 'password', message: 'Password is required.' });
    } else if (password.length < 6) {
      errors.push({ field: 'password', message: 'Password must be at least 6 characters.' });
    }
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(409).json({
        errors: [{ field: 'email', message: 'An account with this email already exists.' }],
      });
    }

    const admin = await User.create({
      name:             name.trim(),
      email:            normalizedEmail,
      password,
      role:             'admin',
      rollOrEmployeeId: rollOrEmployeeId?.trim() || null,
      createdBy:        req.user.id,
    });
    res.status(201).json({ success: true, user: admin });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/v1/auth/admins  (superadmin only) ───────────────────────────────
export async function listAdmins(req, res, next) {
  try {
    const admins = await User.find({ role: 'admin' }).sort({ createdAt: -1 });
    res.json({ success: true, data: admins });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/v1/auth/admins/:id  (superadmin only — soft delete) ───────────
export async function deleteAdmin(req, res, next) {
  try {
    const admin = await User.findOne({ _id: req.params.id, role: 'admin' });
    if (!admin) return res.status(404).json({ error: 'Admin not found.' });
    admin.isActive = false;
    await admin.save();
    res.json({ success: true, message: 'Admin deactivated successfully.' });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/v1/auth/global-stats  (superadmin only) ─────────────────────────
export async function getGlobalStats(req, res, next) {
  try {
    const [totalUsers, totalWardens, totalItems, resolvedItems, activeItems] = await Promise.all([
      User.countDocuments({ role: 'user', isActive: true }),
      User.countDocuments({ role: 'admin', isActive: true }),
      Item.countDocuments({}),
      Item.countDocuments({ status: 'claimed' }),
      Item.countDocuments({ status: 'unclaimed' }),
    ]);
    const resolutionRate = totalItems > 0
      ? Math.round((resolvedItems / totalItems) * 100)
      : 0;
    res.json({
      success: true,
      data: { totalUsers, totalWardens, totalItems, resolvedItems, activeItems, resolutionRate },
    });
  } catch (err) {
    next(err);
  }
}
