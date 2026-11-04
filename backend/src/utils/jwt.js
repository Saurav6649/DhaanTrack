import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

export const COOKIE_NAME = 'dhaantrack_session';

export const generateToken = (payload) => {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN,
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, ENV.JWT_SECRET);
};

export const getCookieOptions = () => {
  const isProduction = ENV.NODE_ENV === 'production';
  const sameSite = String(ENV.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax')).toLowerCase();
  const isNone = sameSite === 'none';
  const isSecure = ENV.COOKIE_SECURE || isProduction || isNone;

  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: isNone ? 'none' : sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
};
