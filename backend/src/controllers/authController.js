import * as authService from '../services/authService.js';
import { COOKIE_NAME, getCookieOptions } from '../utils/jwt.js';
import { CSRF_COOKIE_NAME, generateCsrfToken, getCsrfCookieOptions } from '../middlewares/csrfMiddleware.js';

export const login = async (req, res, next) => {
  try {
    const { user, token } = await authService.login(req.body);

    // Set secure HTTP-only cookie for session
    res.cookie(COOKIE_NAME, token, getCookieOptions());

    // Use consistent CSRF token for frontend and cookie
    const csrfToken = req.csrfToken || req.cookies?.[CSRF_COOKIE_NAME] || generateCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, csrfToken, getCsrfCookieOptions());
    res.setHeader('X-CSRF-Token', csrfToken);

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user,
        csrfToken,
      },
      csrfToken,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: getCookieOptions().secure,
    sameSite: getCookieOptions().sameSite,
    path: '/',
  });
  res.clearCookie(CSRF_COOKIE_NAME, {
    httpOnly: false,
    secure: getCsrfCookieOptions().secure,
    sameSite: getCsrfCookieOptions().sameSite,
    path: '/',
  });
  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
};

export const getMe = async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
};

export const changePassword = async (req, res, next) => {
  try {
    const result = await authService.changePassword(req.user._id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getCsrfToken = (req, res) => {
  let token = req.cookies?.[CSRF_COOKIE_NAME] || req.csrfToken;
  if (!token) {
    token = generateCsrfToken();
  }
  res.cookie(CSRF_COOKIE_NAME, token, getCsrfCookieOptions());
  res.setHeader('X-CSRF-Token', token);
  res.json({ success: true, csrfToken: token });
};
