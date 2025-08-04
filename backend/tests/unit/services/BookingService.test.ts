import BookingService from '../../../src/services/BookingService';
import Booking from '../../../src/models/Booking';
import { TestHelpers } from '../../utils/testHelpers';
import { ValidationError, NotFoundError, AuthorizationError } from '../../../src/middleware/errorHandler';

describe('BookingService Unit Tests', () => {
  let testUserId: string;
  let testAdminId: string;

  beforeEach(() => {
    testUserId = TestHelpers.generateObjectId();
    testAdminId = TestHelpers.generateObjectId();
  });

  describe('createBooking', () => {
    it('should successfully create a new booking', async () => {
      // Arrange
      const bookingData = TestHelpers.createBookingServiceData(testUserId);

      // Act
      const result = await BookingService.createBooking(bookingData);

      // Assert
      expect(result).toBeDefined();
      expect(result.customerId.toString()).toBe(testUserId);
      expect(result.status).toBe('pending');
      expect(result.id).toBeDefined();
      expect(result.bookingNumber).toMatch(/^CB-\d{8}-\d{4}$/);
      expect(result.trackingNumber).toBeTruthy();
      expect(result.pickupAddress).toEqual(bookingData.pickupAddress);
      expect(result.deliveryAddress).toEqual(bookingData.deliveryAddress);
      expect(result.totalCost).toBeGreaterThan(0);
    });

    it('should generate unique booking ID', async () => {
      // Arrange
      const bookingData1 = TestHelpers.createBookingServiceData(testUserId);
      const bookingData2 = TestHelpers.createBookingServiceData(testUserId);

      // Act
      const result1 = await BookingService.createBooking(bookingData1);
      const result2 = await BookingService.createBooking(bookingData2);

      // Assert
      expect(result1.id).not.toBe(result2.id);
      expect(result1.bookingNumber).not.toBe(result2.bookingNumber);
      expect(result1.trackingNumber).not.toBe(result2.trackingNumber);
      expect(result1.bookingNumber).toMatch(/^CB-\d{8}-\d{4}$/);
      expect(result2.bookingNumber).toMatch(/^CB-\d{8}-\d{4}$/);
    });

    it('should initialize tracking with correct status history', async () => {
      // Arrange
      const bookingData = TestHelpers.createBookingServiceData(testUserId);

      // Act
      const result = await BookingService.createBooking(bookingData);

      // Assert
      expect(result.status).toBe('pending');
      expect(result.trackingNumber).toBeTruthy();
      expect(result.createdAt).toBeDefined();
    });

    it('should set correct pricing with taxes', async () => {
      // Arrange
      const bookingData = TestHelpers.createBookingServiceData(testUserId, {
        weight: 15, // Higher weight for pricing calculation
        serviceType: 'express'
      });

      // Act
      const result = await BookingService.createBooking(bookingData);

      // Assert
      expect(result.totalCost).toBeDefined();
      expect(result.totalCost).toBeGreaterThan(0);
      expect(result.serviceType).toBe(bookingData.serviceType);
      expect(result.weight).toBe(bookingData.weight);
    });
  });

  describe('getBookingById', () => {
    let testBooking: any;

    beforeEach(async () => {
      const bookingData = TestHelpers.createBookingServiceData(testUserId);
      testBooking = await BookingService.createBooking(bookingData);
    });

    it('should successfully get booking by valid ID', async () => {
      // Act
      const result = await BookingService.getBookingById(testBooking.id);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(testBooking.id);
      expect(result.bookingNumber).toBe(testBooking.bookingNumber);
      expect(result.customerId).toBe(testUserId);
    });

    it('should throw NotFoundError for invalid booking ID', async () => {
      // Arrange
      const invalidId = TestHelpers.generateObjectId();

      // Act & Assert
      await expect(BookingService.getBookingById(invalidId)).rejects.toThrow(NotFoundError);
    });

    it('should return booking with correct data structure', async () => {
      // Act  
      const result = await BookingService.getBookingById(testBooking.id);
      
      // Assert
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('bookingNumber');
      expect(result).toHaveProperty('trackingNumber');
      expect(result).toHaveProperty('customerId');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('totalCost');
      expect(result.customerId).toBe(testUserId);
    });
  });

  describe('getBookings', () => {
    beforeEach(async () => {
      // Create multiple bookings for the test user
      const bookingData1 = TestHelpers.createBookingServiceData(testUserId);
      const bookingData2 = TestHelpers.createBookingServiceData(testUserId, {
        serviceType: 'express'
      });
      const bookingData3 = TestHelpers.createBookingServiceData(TestHelpers.generateObjectId()); // Different user

      await BookingService.createBooking(bookingData1);
      await BookingService.createBooking(bookingData2);
      await BookingService.createBooking(bookingData3);
    });

    it('should return bookings for a specific customer', async () => {
      // Act
      const result = await BookingService.getBookings({ customerId: testUserId });

      // Assert
      expect(result.bookings).toHaveLength(2);
      result.bookings.forEach(booking => {
        expect(booking.customerId).toBe(testUserId);
      });
    });

    it('should return paginated results', async () => {
      // Act
      const result = await BookingService.getBookings({ page: 1, limit: 1, customerId: testUserId });

      // Assert
      expect(result.bookings).toHaveLength(1);
      expect(result.totalCount).toBeGreaterThanOrEqual(2);
      expect(result.pagination).toBeDefined();
    });

    it('should return empty array for customer with no bookings', async () => {
      // Arrange
      const newCustomerId = TestHelpers.generateObjectId();

      // Act
      const result = await BookingService.getBookings({ customerId: newCustomerId });

      // Assert
      expect(result.bookings).toHaveLength(0);
    });
  });

  describe('updateBookingStatus', () => {
    let testBooking: any;

    beforeEach(async () => {
      const bookingData = TestHelpers.createBookingServiceData(testUserId);
      testBooking = await BookingService.createBooking(bookingData);
    });

    it('should successfully update booking status', async () => {
      // Act
      const result = await BookingService.updateBookingStatus(
        testBooking.id,
        'confirmed',
        testAdminId
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe('confirmed');
      expect(result.id).toBe(testBooking.id);
    });

    it('should throw NotFoundError for invalid booking ID', async () => {
      // Arrange
      const invalidId = TestHelpers.generateObjectId();

      // Act & Assert
      await expect(
        BookingService.updateBookingStatus(invalidId, 'confirmed', testAdminId)
      ).rejects.toThrow(NotFoundError);
    });

    it('should update status to different valid statuses', async () => {
      // Test different status updates
      const statusTests = ['confirmed', 'picked_up', 'in_transit', 'delivered'];

      for (const status of statusTests) {
        const result = await BookingService.updateBookingStatus(
          testBooking.id,
          status as any,
          testAdminId
        );

        expect(result.status).toBe(status);
      }
    });
  });

  describe('getBookings (all bookings)', () => {
    beforeEach(async () => {
      // Create bookings with different service types
      const serviceTypes = ['standard', 'express', 'same_day'];
      
      for (let i = 0; i < serviceTypes.length; i++) {
        const bookingData = TestHelpers.createBookingServiceData(testUserId, {
          serviceType: serviceTypes[i] as any
        });
        await BookingService.createBooking(bookingData);
      }
    });

    it('should return all bookings', async () => {
      // Act
      const result = await BookingService.getBookings({});

      // Assert
      expect(result.bookings.length).toBeGreaterThanOrEqual(3);
      expect(result.totalCount).toBeGreaterThanOrEqual(3);
    });

    it('should return paginated bookings', async () => {
      // Act
      const result = await BookingService.getBookings({ page: 1, limit: 2 });

      // Assert
      expect(result.bookings.length).toBeLessThanOrEqual(2);
      expect(result.pagination).toBeDefined();
    });
  });

  describe('getBookingStats', () => {
    beforeEach(async () => {
      // Create bookings with different service types for stats testing
      const bookingPromises = [
        BookingService.createBooking(TestHelpers.createBookingServiceData(testUserId, { serviceType: 'standard' })),
        BookingService.createBooking(TestHelpers.createBookingServiceData(testUserId, { serviceType: 'standard' })),
        BookingService.createBooking(TestHelpers.createBookingServiceData(testUserId, { serviceType: 'express' })),
        BookingService.createBooking(TestHelpers.createBookingServiceData(testUserId, { serviceType: 'same_day' })),
        BookingService.createBooking(TestHelpers.createBookingServiceData(testUserId, { serviceType: 'same_day' }))
      ];

      await Promise.all(bookingPromises);
    });

    it('should return correct booking statistics', async () => {
      // Act
      const result = await BookingService.getBookingStats();

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.totalBookings).toBe('number');
      expect(result.totalBookings).toBeGreaterThanOrEqual(5);
    });

    it('should return stats with correct structure', async () => {
      // Act
      const result = await BookingService.getBookingStats();

      // Assert
      expect(result).toHaveProperty('totalBookings');
      expect(typeof result).toBe('object');
    });

    it('should return customer-specific stats when customerId provided', async () => {
      // Act
      const result = await BookingService.getBookingStats(testUserId);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.totalBookings).toBe('number');
      expect(result.totalBookings).toBeGreaterThanOrEqual(5);
    });
  });
});
