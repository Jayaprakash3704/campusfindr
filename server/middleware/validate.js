import mongoose from 'mongoose';

/**
 * guardObjectId(paramName)
 * Middleware factory that validates a route param is a valid MongoDB ObjectId.
 * Returns 400 (not 500) on malformed IDs to prevent unhandled CastErrors.
 *
 * Usage: router.patch('/resolve/:id', protect, guardObjectId('id'), resolveItem)
 */
export function guardObjectId(paramName = 'id') {
  return (req, res, next) => {
    const val = req.params[paramName];
    if (!mongoose.Types.ObjectId.isValid(val)) {
      return res.status(400).json({
        error: `Invalid ID format for parameter "${paramName}".`,
      });
    }
    next();
  };
}

/**
 * sanitizeString(str)
 * Strips HTML tags from a string to prevent stored XSS.
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/<[^>]*>/g, '')   // strip tags
    .replace(/&[a-z]+;/gi, '') // strip common HTML entities
    .trim();
}
