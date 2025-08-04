import { AppError, ValidationError, AuthenticationError, AuthorizationError, NotFoundError, ConflictError, RateLimitError, InternalServerError } from '../middleware/errorHandler';

/**
 * Error utility functions for creating consistent error responses
 */

// Create validation error
export const createValidationError = (message: string): ValidationError => {
  return new ValidationError(message);
};

// Create authentication error
export const createAuthError = (message?: string): AuthenticationError => {
  return new AuthenticationError(message);
};

// Create authorization error
export const createAuthzError = (message?: string): AuthorizationError => {
  return new AuthorizationError(message);
};

// Create not found error
export const createNotFoundError = (resource: string): NotFoundError => {
  return new NotFoundError(`${resource} not found`);
};

// Create conflict error
export const createConflictError = (message: string): ConflictError => {
  return new ConflictError(message);
};

// Create rate limit error
export const createRateLimitError = (message?: string): RateLimitError => {
  return new RateLimitError(message);
};

// Create internal server error
export const createInternalError = (message?: string): InternalServerError => {
  return new InternalServerError(message);
};

// Create custom application error
export const createAppError = (message: string, statusCode: number): AppError => {
  return new AppError(message, statusCode);
};

// Validation helpers
export const validateRequired = (fields: Record<string, any>): void => {
  const missingFields = Object.entries(fields)
    .filter(([key, value]) => value === undefined || value === null || value === '')
    .map(([key]) => key);

  if (missingFields.length > 0) {
    throw createValidationError(`Missing required fields: ${missingFields.join(', ')}`);
  }
};

export const validateEmail = (email: string): void => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw createValidationError('Please provide a valid email address');
  }
};

export const validatePassword = (password: string, minLength = 6): void => {
  if (password.length < minLength) {
    throw createValidationError(`Password must be at least ${minLength} characters long`);
  }
};

export const validatePhone = (phone: string): void => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  if (!phoneRegex.test(phone)) {
    throw createValidationError('Please provide a valid phone number');
  }
};

export const validateObjectId = (id: string): void => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  if (!objectIdRegex.test(id)) {
    throw createValidationError('Invalid ID format');
  }
};

// Common error messages
export const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_DEACTIVATED: 'Account is deactivated. Please contact support.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  TOKEN_INVALID: 'Invalid authentication token',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  
  // Validation
  REQUIRED_FIELDS: 'All required fields must be provided',
  INVALID_EMAIL: 'Please provide a valid email address',
  WEAK_PASSWORD: 'Password must be at least 6 characters long',
  INVALID_PHONE: 'Please provide a valid phone number',
  INVALID_ID: 'Invalid ID format',
  
  // Database
  USER_EXISTS: 'User with this email already exists',
  USER_NOT_FOUND: 'User not found',
  RESOURCE_NOT_FOUND: 'Resource not found',
  DUPLICATE_ENTRY: 'Duplicate entry found',
  
  // Server
  INTERNAL_ERROR: 'Internal server error',
  DATABASE_ERROR: 'Database operation failed',
  NETWORK_ERROR: 'Network connection error',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
  
  // File upload
  FILE_TOO_LARGE: 'File size exceeds the maximum limit',
  INVALID_FILE_TYPE: 'Invalid file type',
} as const;
