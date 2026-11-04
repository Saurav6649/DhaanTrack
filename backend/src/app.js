import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env.js';
import apiRouter from './routes/index.js';
import { attachCsrfToken, verifyCsrf } from './middlewares/csrfMiddleware.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';
import { apiLimiter } from './middlewares/rateLimiter.js';

const app = express();

// Configure Express trust proxy for Render / reverse proxies (1 hop)
// This ensures express-rate-limit accurately identifies client IPs from X-Forwarded-For
// without throwing ERR_ERL_UNEXPECTED_X_FORWARDED_FOR, and enables accurate req.secure / protocol detection.
app.set('trust proxy', ENV.TRUST_PROXY);

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible inline resources where needed
    crossOriginEmbedderPolicy: false,
  })
);

// Compile and validate allowed CORS origins
const isOriginAllowed = (origin) => {
  // Allow requests without Origin header (e.g. server-to-server, mobile native, curl, supertest)
  if (!origin) return true;

  const cleanOrigin = origin.trim().replace(/\/+$/, '');

  // Extract origins configured in environment variables (support comma-separated list)
  const configuredOrigins = (ENV.FRONTEND_URL || '')
    .split(',')
    .map((url) => url.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const allowedExactOrigins = [
    ...configuredOrigins,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  if (allowedExactOrigins.includes(cleanOrigin)) {
    return true;
  }

  // Allow DhaanTrack Vercel production and preview subdomains (e.g. https://dhaantrack.vercel.app, https://dhaantrack-*.vercel.app)
  if (/^https:\/\/dhaantrack[a-zA-Z0-9-]*\.vercel\.app$/.test(cleanOrigin)) {
    return true;
  }

  return false;
};

// CORS configuration (strictly restricted to authorized origins)
app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        if (process.env.NODE_ENV !== 'test') {
          console.warn(`[CORS] Rejected request from unauthorized origin: ${origin}`);
        }
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'x-csrf-token'],
    exposedHeaders: ['X-CSRF-Token', 'x-csrf-token'],
  })
);

// Body parsing with safe size limit
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser(ENV.COOKIE_SECRET));

// CSRF cookie attachment & verification
app.use(attachCsrfToken);
app.use(verifyCsrf);

// Health check endpoints (exempt from rate limiter for continuous cloud platform uptime monitoring)
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'ok',
    app: 'DhaanTrack Harvester Management API',
    timestamp: new Date().toISOString(),
  });
});

// Rate limiting for general API requests
app.use('/api', apiLimiter);

// Main API routes
app.use('/api', apiRouter);

// Catch 404 and Forward to Error Handler
app.use(notFound);
app.use(errorHandler);

export default app;
