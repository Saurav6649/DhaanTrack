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

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible inline resources where needed
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin || origin === ENV.FRONTEND_URL || origin === 'http://localhost:5173') {
        callback(null, true);
      } else {
        callback(null, true); // Dev-friendly fallback
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  })
);

// Body parsing with safe size limit
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser(ENV.COOKIE_SECRET));

// CSRF cookie attachment & verification
app.use(attachCsrfToken);
app.use(verifyCsrf);

// Rate limiting for general API requests
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'DhaanTrack Harvester Management API',
    timestamp: new Date().toISOString(),
  });
});

// Main API routes
app.use('/api', apiRouter);

// Catch 404 and Forward to Error Handler
app.use(notFound);
app.use(errorHandler);

export default app;
