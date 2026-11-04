import * as authService from '../services/authService.js';
import { COOKIE_NAME, getCookieOptions } from '../utils/jwt.js';
import { CSRF_COOKIE_NAME, generateCsrfToken } from '../middlewares/csrfMiddleware.js';

export const login = async (req, res, next) => {
  try {
    const { user, token } = await authService.login(req.body);

    // Set secure HTTP-only cookie for session
    res.cookie(COOKIE_NAME, token, getCookieOptions());

    // Use consistent CSRF token for frontend and cookie
    const csrfToken = req.csrfToken || req.cookies?.[CSRF_COOKIE_NAME] || generateCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user,
        csrfToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.clearCookie(CSRF_COOKIE_NAME, { path: '/' });
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
  let token = req.cookies?.[CSRF_COOKIE_NAME];
  if (!token) {
    token = generateCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });
  }
  res.json({ success: true, csrfToken: token });
};
