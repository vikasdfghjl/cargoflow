import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { IUser, IBooking, IAddress } from '../../src/types';

export class TestHelpers {
  /**
   * Generate a valid JWT token for testing
   */
  static generateTestToken(userId: string, userType: 'customer' | 'admin' = 'customer'): string {
    const jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';
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
      email: 'john.doe@test.com',
      password: 'TestPassword123!',
      userType: 'customer' as const,
      companyName: 'Test Company',
      phone: '+1234567890',
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
      email: 'john.doe@test.com',
      password: 'TestPassword123!',
      userType: 'customer' as const,
      companyName: 'Test Company',
      phone: '+1234567890',
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
      phone: '+1234567890',
      street: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345',
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
      phone: '+1234567890',
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345',
      country: 'United States',
      type: 'home' as const,
      isDefault: false,
      ...overrides
    };
  }

  /**
   * Generate a test booking data object
   */
  static createTestBookingData(customerId: string, overrides: Partial<IBooking> = {}): Partial<IBooking> {
    return {
      customerId: new Types.ObjectId(customerId),
      bookingId: 'CF123456789',
      pickupAddress: {
        street: '123 Pickup Street',
        city: 'Pickup City',
        state: 'Pickup State',
        zipCode: '12345',
        coordinates: [-74.0060, 40.7128]
      },
      deliveryAddress: {
        street: '456 Delivery Avenue',
        city: 'Delivery City',
        state: 'Delivery State',
        zipCode: '54321',
        coordinates: [-73.9352, 40.7304]
      },
      packageDetails: {
        type: 'package',
        description: 'Test Package',
        weight: 10,
        dimensions: {
          length: 20,
          width: 15,
          height: 10
        },
        value: 100,
        specialInstructions: 'Handle with care'
      },
      serviceType: 'standard' as const,
      status: 'pending' as const,
      pricing: {
        basePrice: 100,
        taxes: 18,
        totalAmount: 118,
        currency: 'USD'
      },
      timeline: {
        bookedAt: new Date(),
        estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000)
      },
      tracking: {
        statusHistory: [{
          status: 'pending',
          timestamp: new Date()
        }]
      },
      recipient: {
        name: 'Test Recipient',
        phone: '+1234567890'
      },
      paymentStatus: 'pending' as const,
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
    // Generate a more standard US phone number format that passes express-validator
    const areaCode = Math.floor(Math.random() * 900) + 100; // 100-999
    const exchange = Math.floor(Math.random() * 900) + 100; // 100-999
    const number = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
    return `+1${areaCode}${exchange}${number}`;
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
