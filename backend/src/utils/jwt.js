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
  return {
    httpOnly: true,
    secure: ENV.COOKIE_SECURE || isProduction,
    sameSite: ENV.COOKIE_SAME_SITE, // 'lax' works nicely across browsers & local dev
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
};
