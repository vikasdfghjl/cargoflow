import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { IUser, IBooking, IAddress } from '../../src/types';

export class TestHelpers {
  /**
   * Generate a valid JWT token for testing
   */
  static generateTestToken(userId: string, userType: 'customer' | 'admin' = 'customer'): string {
    const jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-purposes-only-not-for-production-use';
    return jwt.sign(
      { userId, userType },
      jwtSecret,
      { expiresIn: '7d' }
    );
  }

  /**
   * Generate a test user object
   */
  static createTestUser(overrides: Partial<IUser> = {}): Partial<IUser> {
    return {
      firstName: 'John',
      lastName: 'Doe',
      email: TestHelpers.generateRandomEmail(),
      password: 'TestPassword123!',
      userType: 'customer' as const,
      companyName: 'Test Company Inc',
      phone: TestHelpers.generateRandomPhone(),
      isActive: true,
      ...overrides
    };
  }

  /**
   * Generate registration data for AuthService
   */
  static createAuthServiceRegisterData(overrides: any = {}): any {
    return {
      firstName: 'John',
      lastName: 'Doe',
      email: TestHelpers.generateRandomEmail(),
      password: 'TestPassword123!',
      userType: 'customer' as const,
      companyName: 'Test Company Inc',
      phone: TestHelpers.generateRandomPhone(),
      ...overrides
    };
  }

  /**
   * Generate a test address data object
   */
  static createTestAddressData(userId: string, overrides: Partial<IAddress> = {}): Partial<IAddress> {
    return {
      userId: new Types.ObjectId(userId),
      label: 'Test Address',
      type: 'home' as const,
      contactName: 'John Doe',
      phone: TestHelpers.generateRandomPhone(),
      street: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      zipCode: '123456',
      country: 'United States',
      isDefault: false,
      ...overrides
    };
  }

  /**
   * Generate address data for AddressService (without userId)
   */
  static createAddressServiceData(overrides: any = {}): any {
    return {
      label: 'Test Address',
      street: '123 Test Street',
      contactName: 'John Doe',
      phone: TestHelpers.generateRandomPhone(),
      city: 'Test City',
      state: 'Test State',
      zipCode: '123456',
      country: 'United States',
      type: 'home' as const,
      isDefault: false,
      ...overrides
    };
  }

  /**
   * Generate a test booking data object that matches validation requirements
   */
  static createTestBookingData(customerId: string, overrides: any = {}): any {
    return {
      customerId: new Types.ObjectId(customerId),
      pickupAddress: {
        address: '123 Pickup Street, Main Building',
        contactName: 'John Pickup',
        phone: TestHelpers.generateRandomPhone(),
        city: 'Pickup City',
        postalCode: '123456'
      },
      deliveryAddress: {
        address: '456 Delivery Avenue, Side Entrance',
        contactName: 'Jane Delivery',
        phone: TestHelpers.generateRandomPhone(),
        city: 'Delivery City',
        postalCode: '654321'
      },
      packageType: 'package',
      weight: 10.5,
      serviceType: 'standard',
      pickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      specialInstructions: 'Handle with care',
      insurance: false,
      ...overrides
    };
  }

  /**
   * Generate test booking data matching BookingService.createBooking() interface
   */
  static createBookingServiceData(customerId: string, overrides: Partial<any> = {}): any {
    return {
      customerId: customerId,
      pickupAddress: {
        address: '123 Pickup Street, Pickup City',
        contactName: 'John Pickup',
        phone: '+1234567890',
        city: 'Pickup City',
        postalCode: '12345'
      },
      deliveryAddress: {
        address: '456 Delivery Avenue, Delivery City',
        contactName: 'Jane Delivery',
        phone: '+0987654321',
        city: 'Delivery City',
        postalCode: '54321'
      },
      packageType: 'package',
      weight: 10,
      serviceType: 'standard' as const,
      pickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      specialInstructions: 'Handle with care',
      insurance: false,
      insuranceValue: 0,
      ...overrides
    };
  }

  /**
   * Hash a password for testing
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '4');
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Generate a random ObjectId string
   */
  static generateObjectId(): string {
    return new Types.ObjectId().toString();
  }

  /**
   * Generate a random email for testing
   */
  static generateRandomEmail(): string {
    const randomString = Math.random().toString(36).substring(7);
    return `test.${randomString}@example.com`;
  }

  /**
   * Generate a random phone number for testing
   */
  static generateRandomPhone(): string {
    // Simple valid phone number that works with both express-validator and MongoDB regex
    return '+12345678901';
  }

  /**
   * Create a mock Express request object
   */
  static createMockRequest(overrides: any = {}): any {
    return {
      body: {},
      params: {},
      query: {},
      headers: {},
      user: undefined,
      ...overrides
    };
  }

  /**
   * Create a mock Express response object
   */
  static createMockResponse(): any {
    const res: any = {
      status: () => res,
      json: () => res,
      send: () => res,
      cookie: () => res,
      clearCookie: () => res
    };
    return res;
  }

  /**
   * Create a mock Express next function  
   */
  static createMockNext(): any {
    return () => {};
  }

  /**
   * Wait for a specified amount of time
   */
  static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
