import { Request, Response, NextFunction } from 'express';
import AuthService from '../services/AuthService';
import { ApiResponse, AuthRequest } from '../types';
import { 
  asyncHandler, 
  ValidationError, 
  AuthenticationError, 
  ConflictError,
  NotFoundError 
} from '../middleware/errorHandler';
import { 
  validateRequired, 
  validateEmail, 
  validatePassword, 
  ERROR_MESSAGES 
} from '../utils/errorUtils';
import { 
  sendSuccessResponse, 
  sendCreatedResponse, 
  RESPONSE_MESSAGES 
} from '../utils/responseUtils';

// Extend Request interface for authenticated routes
interface AuthenticatedRequest extends AuthRequest {}

export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { firstName, lastName, email, password, phone, userType, companyName } = req.body;

  // Validate required fields
  validateRequired({ firstName, lastName, email, password, userType });
  
  // Validate email and password
  validateEmail(email);
  validatePassword(password);

  // Validate user type
  if (!['customer', 'admin'].includes(userType)) {
    throw new ValidationError('User type must be either customer or admin');
  }

  // Use AuthService to register user
  const result = await AuthService.registerUser({
    firstName,
    lastName,
    email,
    password,
    phone,
    userType,
    companyName
  });

  sendCreatedResponse(res, RESPONSE_MESSAGES.REGISTRATION_SUCCESS, {
    user: result.user,
    token: result.token
  });
});

export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email, password } = req.body;

  // Validate required fields
  validateRequired({ email, password });

  // Use AuthService to login user
  const result = await AuthService.loginUser({ email, password });

  sendSuccessResponse(res, RESPONSE_MESSAGES.LOGIN_SUCCESS, {
    user: result.user,
    token: result.token
  });
});

export const logout = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  // In a production app, you might want to blacklist the token
  // For now, we'll just send a success response
  sendSuccessResponse(res, RESPONSE_MESSAGES.LOGOUT_SUCCESS);
});

export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const userId = req.user?.userId;
  
  if (!userId) {
    throw new AuthenticationError(ERROR_MESSAGES.UNAUTHORIZED);
  }

  const user = await AuthService.getUserProfile(userId);

  sendSuccessResponse(res, RESPONSE_MESSAGES.RETRIEVED, user);
});
