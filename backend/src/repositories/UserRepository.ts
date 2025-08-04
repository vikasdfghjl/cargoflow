import { Types, FilterQuery, UpdateQuery } from 'mongoose';
import User from '../models/User';
import { IUser } from '../types';

export interface UserCreateData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userType: 'customer' | 'admin';
  phone?: string;
  companyName?: string;
}

export interface UserUpdateData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  companyName?: string;
  password?: string;
  lastLogin?: Date;
  isActive?: boolean;
  isEmailVerified?: boolean;
}

export interface UserQueryOptions {
  includePassword?: boolean;
  lean?: boolean;
}

/**
 * Repository for User data access operations
 * Handles all database interactions for User entities
 */
export class UserRepository {
  /**
   * Create a new user
   */
  static async create(userData: UserCreateData): Promise<any> {
    return User.create(userData);
  }

  /**
   * Find user by ID
   */
  static async findById(userId: string, options: UserQueryOptions = {}): Promise<any> {
    let query: any = User.findById(userId);

    if (options.includePassword) {
      query = query.select('+password');
    } else {
      query = query.select('-password');
    }

    if (options.lean) {
      query = query.lean();
    }

    return query.exec();
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string, options: UserQueryOptions = {}): Promise<any> {
    let query: any = User.findOne({ email: email.toLowerCase() });

    if (options.includePassword) {
      query = query.select('+password');
    } else {
      query = query.select('-password');
    }

    if (options.lean) {
      query = query.lean();
    }

    return query.exec();
  }

  /**
   * Update user by ID
   */
  static async updateById(userId: string, updateData: UserUpdateData): Promise<any> {
    return User.findByIdAndUpdate(
      userId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');
  }

  /**
   * Delete user by ID
   */
  static async deleteById(userId: string): Promise<any> {
    return User.findByIdAndDelete(userId);
  }

  /**
   * Find users with filtering and pagination
   */
  static async findWithPagination(
    filter: FilterQuery<IUser> = {},
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ users: any[]; totalCount: number }> {
    const skip = (page - 1) * limit;
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [users, totalCount] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter)
    ]);

    return { users: users as any[], totalCount };
  }

  /**
   * Check if user exists by email
   */
  static async existsByEmail(email: string): Promise<boolean> {
    const user = await User.findOne({ email: email.toLowerCase() }).lean() as any;
    return !!user;
  }

  /**
   * Update user password
   */
  static async updatePassword(userId: string, hashedPassword: string): Promise<any> {
    return User.findByIdAndUpdate(
      userId,
      { password: hashedPassword, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');
  }

  /**
   * Get users by type
   */
  static async findByUserType(userType: 'customer' | 'admin'): Promise<any[]> {
    return User.find({ userType }).select('-password').lean() as any;
  }

  /**
   * Search users by text (name, email, company)
   */
  static async searchUsers(
    searchText: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ users: any[]; totalCount: number }> {
    const searchRegex = new RegExp(searchText, 'i');
    const filter = {
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { companyName: searchRegex }
      ]
    };

    return this.findWithPagination(filter, page, limit);
  }

  /**
   * Get user statistics
   */
  static async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    customerCount: number;
    adminCount: number;
    verifiedUsers: number;
  }> {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
          customerCount: { $sum: { $cond: [{ $eq: ['$userType', 'customer'] }, 1, 0] } },
          adminCount: { $sum: { $cond: [{ $eq: ['$userType', 'admin'] }, 1, 0] } },
          verifiedUsers: { $sum: { $cond: ['$isEmailVerified', 1, 0] } }
        }
      }
    ]);

    return stats[0] || {
      totalUsers: 0,
      activeUsers: 0,
      customerCount: 0,
      adminCount: 0,
      verifiedUsers: 0
    };
  }

  /**
   * Update user last login
   */
  static async updateLastLogin(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { lastLogin: new Date() }) as any;
  }

  /**
   * Bulk update users
   */
  static async bulkUpdate(filter: FilterQuery<IUser>, update: UpdateQuery<IUser>): Promise<any> {
    return User.updateMany(filter, update) as any;
  }
}

export default UserRepository;
