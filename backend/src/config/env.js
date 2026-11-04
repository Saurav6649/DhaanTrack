import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isProduction = process.env.NODE_ENV === 'production';

const parseTrustProxy = (val) => {
  if (val === undefined || val === null || val === '') return 1;
  if (val === 'true') return true;
  if (val === 'false') return false;
  const num = Number(val);
  return !isNaN(num) ? num : val;
};

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dhaantrack',
  JWT_SECRET: process.env.JWT_SECRET || 'dhaantrack_secure_jwt_secret_dev_2026_production_must_replace',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'dhaantrack_cookie_signature_secret_2026',
  // In production (Vercel + Render cross-domain), cookies must be SameSite=None and Secure=true
  COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax'),
  COOKIE_SECURE: process.env.COOKIE_SECURE !== undefined
    ? process.env.COOKIE_SECURE === 'true'
    : (isProduction || (process.env.COOKIE_SAME_SITE || '').toLowerCase() === 'none'),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  BOOTSTRAP_ADMIN_USER_ID: process.env.BOOTSTRAP_ADMIN_USER_ID || 'admin',
  BOOTSTRAP_ADMIN_PASSWORD: process.env.BOOTSTRAP_ADMIN_PASSWORD || 'Admin@DhaanTrack2026',
  BOOTSTRAP_ADMIN_NAME: process.env.BOOTSTRAP_ADMIN_NAME || 'Super Admin',
  BOOTSTRAP_ADMIN_MOBILE: process.env.BOOTSTRAP_ADMIN_MOBILE || '9876543210',
  TRUST_PROXY: parseTrustProxy(process.env.TRUST_PROXY),
};
