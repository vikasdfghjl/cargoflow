import { Response } from 'express';
import { ApiResponse, StandardApiResponse } from '../types';

/**
 * Utility functions for creating consistent API responses
 */

// Success response with data
export const sendSuccessResponse = <T = any>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    ...(data && { data })
  };

  res.status(statusCode).json(response);
};

// Success response with pagination
export const sendPaginatedResponse = <T = any>(
  res: Response,
  message: string,
  data: T,
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  },
  statusCode = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    pagination
  };

  res.status(statusCode).json(response);
};

// Created response
export const sendCreatedResponse = <T = any>(
  res: Response,
  message: string,
  data?: T
): void => {
  sendSuccessResponse(res, message, data, 201);
};

// No content response
export const sendNoContentResponse = (res: Response): void => {
  res.status(204).send();
};

// Enhanced response with additional metadata
export const sendEnhancedResponse = <T = any>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200,
  options?: {
    requestId?: string;
    timestamp?: string;
    path?: string;
  }
): void => {
  const response: StandardApiResponse<T> = {
    success: true,
    message,
    ...(data && { data }),
    ...(options?.timestamp && { timestamp: options.timestamp }),
    ...(options?.path && { path: options.path }),
    ...(options?.requestId && { requestId: options.requestId })
  };

  res.status(statusCode).json(response);
};

// Error response (this should typically be handled by error middleware)
export const sendErrorResponse = (
  res: Response,
  message: string,
  statusCode = 500,
  error?: string
): void => {
  const response: ApiResponse = {
    success: false,
    message,
    ...(error && process.env.NODE_ENV === 'development' && { error })
  };

  res.status(statusCode).json(response);
};

// Common response messages
export const RESPONSE_MESSAGES = {
  // Success messages
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  RETRIEVED: 'Resource retrieved successfully',
  
  // Authentication
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  REGISTRATION_SUCCESS: 'Registration successful',
  PASSWORD_RESET_SUCCESS: 'Password reset successful',
  
  // Operations
  UPLOAD_SUCCESS: 'File uploaded successfully',
  DOWNLOAD_SUCCESS: 'File downloaded successfully',
  EMAIL_SENT: 'Email sent successfully',
  NOTIFICATION_SENT: 'Notification sent successfully',
  
  // Status updates
  STATUS_UPDATED: 'Status updated successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  SETTINGS_UPDATED: 'Settings updated successfully',
} as const;
