import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * protect — Verifies Bearer JWT and attaches req.user.
 * Returns 401 if token is missing or invalid.
 */
export async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated. Please log in.' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Token is invalid or expired. Please log in again.' });
    }

    // Confirm user still exists and is active
    const user = await User.findOne({ _id: decoded.id, isActive: true });
    if (!user) {
      return res.status(401).json({ error: 'The user associated with this token no longer exists.' });
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * requireRole(...roles) — Role guard middleware factory.
 * Usage: requireRole('admin', 'superadmin')
 * Returns 403 if the authenticated user's role is not in the allowed list.
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}.`,
      });
    }
    next();
  };
}
