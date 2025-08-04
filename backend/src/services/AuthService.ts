import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { 
  ValidationError, 
  AuthenticationError, 
  ConflictError,
  NotFoundError 
} from '../middleware/errorHandler';
import UserRepository from '../repositories/UserRepository';
import User, { IUser } from '../models/User';

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  userType: 'customer' | 'admin';
  companyName?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: string;
  companyName?: string;
  phone?: string;
}

interface UserCreateData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  userType: 'customer' | 'admin';
  companyName: string;
}

export class AuthService {
  /**
   * Convert user document to profile object
   */
  private static toUserProfile(user: any): UserProfile {
    return {
      id: (user._id as Types.ObjectId).toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userType: user.userType,
      ...(user.companyName && { companyName: user.companyName }),
      ...(user.phone && { phone: user.phone })
    };
  }

  /**
   * Generate JWT token for user
   */
  static generateToken(userId: string, userType: string): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined');
    }
    
    return jwt.sign(
      { userId, userType },
      jwtSecret,
      { expiresIn: '7d' }
    );
  }

  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Register a new user
   */
  static async registerUser(userData: RegisterData): Promise<{ user: UserProfile; token: string }> {
    const { firstName, lastName, email, password, phone, userType, companyName } = userData;

    // Check if user already exists
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user
    const user = await UserRepository.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone?.trim() || '',
      userType,
      companyName: companyName?.trim() || ''
    });

    // Generate token
    const token = this.generateToken((user._id as Types.ObjectId).toString(), user.userType);

    // Return user profile (without password)
    const userProfile = this.toUserProfile(user);

    return { user: userProfile, token };
  }

  /**
   * Authenticate user login
   */
  static async loginUser(loginData: LoginData): Promise<{ user: UserProfile; token: string }> {
    const { email, password } = loginData;

    // Find user by email
    const user = await UserRepository.findByEmail(email.toLowerCase(), { includePassword: true });
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Check password
    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate token
    const token = this.generateToken((user._id as Types.ObjectId).toString(), user.userType);

    // Return user profile (without password)
    const userProfile = this.toUserProfile(user);

    return { user: userProfile, token };
  }

  /**
   * Get user profile by ID
   */
  static async getUserProfile(userId: string): Promise<UserProfile> {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.toUserProfile(user);
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId: string, updateData: Partial<RegisterData>): Promise<UserProfile> {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Prepare update data
    const updates: Partial<UserCreateData> = {};
    if (updateData.firstName) updates.firstName = updateData.firstName.trim();
    if (updateData.lastName) updates.lastName = updateData.lastName.trim();
    if (updateData.phone) updates.phone = updateData.phone.trim();
    if (updateData.companyName) updates.companyName = updateData.companyName.trim();

    const updatedUser = await UserRepository.updateById(userId, updates);
    if (!updatedUser) {
      throw new NotFoundError('User not found');
    }

    return this.toUserProfile(updatedUser);
  }

  /**
   * Change user password
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await this.hashPassword(newPassword);
    
    // Update password
    await UserRepository.updateById(userId, { password: hashedNewPassword });
  }
}

export default AuthService;
