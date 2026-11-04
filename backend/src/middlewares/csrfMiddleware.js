import crypto from 'crypto';

export const CSRF_COOKIE_NAME = 'dhaantrack_csrf';

/**
 * Generate a random CSRF token
 */
export const generateCsrfToken = () => {
  return crypto.randomBytes(24).toString('hex');
};

/**
 * Middleware to ensure CSRF cookie is set on GET requests
 */
export const attachCsrfToken = (req, res, next) => {
  if (!req.cookies?.[CSRF_COOKIE_NAME]) {
    const token = generateCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // Accessible by frontend JS so Axios/SWR can send it in headers
      secure: false, // Works in local dev and prod
      sameSite: 'lax',
      path: '/',
    });
    req.csrfToken = token;
  } else {
    req.csrfToken = req.cookies[CSRF_COOKIE_NAME];
  }
  next();
};

/**
 * CSRF protection middleware for state-changing requests
 */
export const verifyCsrf = (req, res, next) => {
  // Allow safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Exempt login & bootstrap endpoints from CSRF check (as cookie doesn't exist yet)
  if (req.path === '/api/auth/login' || req.path === '/api/auth/bootstrap') {
    return next();
  }

  // If request uses Bearer token in header (e.g., API clients, mobile native, or automated tests), CSRF doesn't apply
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers['x-csrf-token'];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or missing CSRF token. Please refresh the page.',
    });
  }

  next();
};
