import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
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

const generateToken = (userId: string, userType: string): string => {
  return jwt.sign(
    { userId, userType },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
};

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

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ConflictError(ERROR_MESSAGES.USER_EXISTS);
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create new user
  const user = new User({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    phone,
    userType,
    companyName: userType === 'customer' ? companyName : undefined,
    isActive: true,
    isEmailVerified: false
  });

  await user.save();

  // Generate token
  const token = generateToken((user._id as string).toString(), user.userType);

  // Return user data without password
  const userResponse = {
    id: (user._id as string).toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    userType: user.userType,
    companyName: user.companyName,
    isActive: user.isActive,
    createdAt: user.createdAt
  };

  sendCreatedResponse(res, RESPONSE_MESSAGES.REGISTRATION_SUCCESS, {
    user: userResponse,
    token
  });
});

export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email, password } = req.body;

  // Validate required fields
  validateRequired({ email, password });

  // Find user by email
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AuthenticationError(ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AuthenticationError(ERROR_MESSAGES.ACCOUNT_DEACTIVATED);
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AuthenticationError(ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = generateToken((user._id as string).toString(), user.userType);

  // Return user data without password
  const userResponse = {
    id: (user._id as string).toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    userType: user.userType,
    companyName: user.companyName,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt
  };

  sendSuccessResponse(res, RESPONSE_MESSAGES.LOGIN_SUCCESS, {
    user: userResponse,
    token
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

  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
  }

  const userResponse = {
    id: (user._id as string).toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    userType: user.userType,
    companyName: user.companyName,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt
  };

  sendSuccessResponse(res, RESPONSE_MESSAGES.RETRIEVED, userResponse);
});
