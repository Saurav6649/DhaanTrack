import crypto from 'crypto';
import { ENV } from '../config/env.js';

export const CSRF_COOKIE_NAME = 'dhaantrack_csrf';

/**
 * Common cookie options for CSRF token
 */
export const getCsrfCookieOptions = () => {
  const isProduction = ENV.NODE_ENV === 'production';
  const sameSite = String(ENV.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax')).toLowerCase();
  const isNone = sameSite === 'none';
  const isSecure = ENV.COOKIE_SECURE || isProduction || isNone;

  return {
    httpOnly: false, // Accessible by frontend JS so Axios/SWR can read it
    secure: isSecure,
    sameSite: isNone ? 'none' : sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
};

/**
 * Generate a random CSRF token
 */
export const generateCsrfToken = () => {
  return crypto.randomBytes(24).toString('hex');
};

/**
 * Middleware to ensure CSRF cookie is set on GET requests and header is exposed
 */
export const attachCsrfToken = (req, res, next) => {
  let token = req.cookies?.[CSRF_COOKIE_NAME];
  if (!token) {
    token = generateCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, token, getCsrfCookieOptions());
  }
  req.csrfToken = token;
  res.setHeader('X-CSRF-Token', token);
  next();
};

/**
 * CSRF protection middleware for state-changing requests (POST, PUT, PATCH, DELETE)
 */
export const verifyCsrf = (req, res, next) => {
  // Allow safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Normalize path to ignore query parameters and trailing slashes
  const cleanPath = (req.originalUrl || req.path || '').split('?')[0].replace(/\/+$/, '');

  // Exempt login, bootstrap, and logout endpoints from CSRF check
  if (
    cleanPath === '/api/auth/login' ||
    cleanPath === '/api/auth/bootstrap' ||
    cleanPath === '/api/auth/logout'
  ) {
    return next();
  }

  // If request uses Bearer token in header (e.g. mobile native / API clients), CSRF check passes
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers['x-csrf-token'];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({
      success: false,
      code: 'CSRF_INVALID',
      message: 'Invalid or missing CSRF token. Please refresh the page.',
    });
  }

  next();
};
