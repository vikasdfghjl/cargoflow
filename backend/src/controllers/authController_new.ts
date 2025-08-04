import { Request, Response, NextFunction } from 'express';
import { ApiResponse, AuthRequest } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import { 
  sendSuccessResponse, 
  sendCreatedResponse, 
  RESPONSE_MESSAGES 
} from '../utils/responseUtils';
import AuthService from '../services/AuthService';

// Register new user
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userData = req.body;
  
  const { user, token } = await AuthService.registerUser(userData);
  
  sendCreatedResponse(res, RESPONSE_MESSAGES.REGISTRATION_SUCCESS, { user, token });
});

// Login user
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const loginData = req.body;
  
  const { user, token } = await AuthService.loginUser(loginData);
  
  sendSuccessResponse(res, RESPONSE_MESSAGES.LOGIN_SUCCESS, { user, token });
});

// Get user profile
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId!;
  
  const user = await AuthService.getUserProfile(userId);
  
  sendSuccessResponse(res, RESPONSE_MESSAGES.RETRIEVED, user);
});

// Update user profile
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId!;
  const updateData = req.body;
  
  const user = await AuthService.updateUserProfile(userId, updateData);
  
  sendSuccessResponse(res, RESPONSE_MESSAGES.PROFILE_UPDATED, user);
});

// Change password
export const changePassword = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId!;
  const { currentPassword, newPassword } = req.body;
  
  await AuthService.changePassword(userId, currentPassword, newPassword);
  
  sendSuccessResponse(res, RESPONSE_MESSAGES.PASSWORD_RESET_SUCCESS);
});

// Logout (client-side token removal)
export const logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  sendSuccessResponse(res, RESPONSE_MESSAGES.LOGOUT_SUCCESS);
});
