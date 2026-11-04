import { ENV } from '../config/env.js';

export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? (err.statusCode || 500) : res.statusCode;
  const isProduction = ENV.NODE_ENV === 'production';

  console.error(`[Error] [${req.method} ${req.path}]`, err.message);
  if (!isProduction && err.stack) {
    console.error(err.stack);
  }

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists.`,
    });
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid format for ID: ${err.value}`,
    });
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'An internal server error occurred.',
    ...(isProduction ? {} : { stack: err.stack }),
  });
};
