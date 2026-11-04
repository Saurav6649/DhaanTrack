import { verifyToken, COOKIE_NAME } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { ROLES } from '../config/constants.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = req.cookies?.[COOKIE_NAME];

    // Optional Bearer token header fallback
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      if (process.env.NODE_ENV !== 'test') {
        const hasCookie = Boolean(req.cookies?.[COOKIE_NAME]);
        const hasBearer = Boolean(req.headers.authorization?.startsWith('Bearer '));
        console.warn(`[Auth] Authentication required for ${req.method} ${req.originalUrl || req.path} (Cookie: ${hasCookie}, Bearer: ${hasBearer}, Origin: ${req.headers.origin || 'none'})`);
      }
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login.',
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`[Auth] Session verification failed for ${req.method} ${req.originalUrl || req.path}: ${err.message}`);
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session. Please log in again.',
      });
    }

    // Verify user exists and is ACTIVE in DB
    const user = await User.findById(decoded.id).populate('assignedMachine');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found.',
      });
    }

    if (user.status === 'DISABLED') {
      return res.status(403).json({
        success: false,
        message: 'Account is disabled. Contact your administrator.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: insufficient permissions.',
      });
    }

    next();
  };
};

export const requireAdmin = requireRole(ROLES.ADMIN);
export const requireOperator = requireRole(ROLES.USER);
