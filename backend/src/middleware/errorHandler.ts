import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

// Base application error class
export class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;
  public code?: string;
  public path?: string;
  public value?: any;
  public keyValue?: any;
  public errors?: any;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error classes for common scenarios
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, false);
  }
}

// Helper function to handle Mongoose Cast errors
const handleCastErrorDB = (err: any): AppError => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new NotFoundError(message);
};

// Helper function to handle Mongoose duplicate field errors
const handleDuplicateFieldsDB = (err: any): AppError => {
  const value = err.errmsg ? err.errmsg.match(/(["'])(\\?.)*?\1/)?.[0] : 'unknown';
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const message = `Duplicate ${field} value: ${value}. Please use another value`;
  return new ConflictError(message);
};

// Helper function to handle Mongoose validation errors
const handleValidationErrorDB = (err: any): AppError => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new ValidationError(message);
};

// Helper function to handle JWT errors
const handleJWTError = (): AppError => {
  return new AuthenticationError('Invalid token. Please log in again');
};

const handleJWTExpiredError = (): AppError => {
  return new AuthenticationError('Your token has expired. Please log in again');
};

// Enhanced error logging
const logError = (err: any, req: Request): void => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const ip = req.ip || req.connection.remoteAddress || 'Unknown';

  console.error(`
🚨 ERROR OCCURRED 🚨
Timestamp: ${timestamp}
Method: ${method}
URL: ${url}
IP: ${ip}
User-Agent: ${userAgent}
Error Name: ${err.name}
Error Message: ${err.message}
Status Code: ${err.statusCode || 500}
Stack: ${err.stack}
${err.isOperational ? '✅ Operational Error' : '❌ Programming Error'}
${'='.repeat(80)}
  `);

  // In production, you might want to send this to a logging service
  if (process.env.NODE_ENV === 'production') {
    // Send to logging service (e.g., Winston, Sentry, etc.)
    // Example: logger.error({ error: err, request: { method, url, ip, userAgent } });
  }
};

// Main error handling middleware
const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error
  logError(err, req);

  let error = { ...err };
  error.message = err.message;

  // Handle specific error types
  if (err.name === 'CastError') error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

  // Handle Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new ValidationError('File too large. Please upload a smaller file');
  }

  // Handle Express validator errors
  if (err.array && typeof err.array === 'function') {
    const validationErrors = err.array();
    const message = validationErrors.map((e: any) => `${e.path}: ${e.msg}`).join(', ');
    error = new ValidationError(message);
  }

  // Default to internal server error if not an operational error
  if (!error.statusCode) {
    error = new InternalServerError(error.message || 'Something went wrong');
  }

  // Prepare response
  const response: ApiResponse = {
    success: false,
    message: error.message || 'Internal server error',
  };

  // Add error details in development mode
  if (process.env.NODE_ENV === 'development') {
    response.error = {
      name: err.name,
      statusCode: error.statusCode,
      status: error.status,
      stack: err.stack,
      ...(err.path && { path: err.path }),
      ...(err.value && { value: err.value }),
      ...(err.keyValue && { keyValue: err.keyValue }),
    };
  }

  // Send error response
  res.status(error.statusCode || 500).json(response);
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

export default errorHandler;
