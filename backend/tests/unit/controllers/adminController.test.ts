// @ts-nocheck
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import {
  getAllCustomers,
  getCustomerDetails,
  updateCustomerStatus,
  getDashboardStats,
  getCustomerBookings,
  updateCustomer
} from '../../../src/controllers/adminController';
import User from '../../../src/models/User';
import Booking from '../../../src/models/Booking';
import { AuthRequest } from '../../../src/types';
import { TestHelpers } from '../../utils/testHelpers';

// Mock the models
jest.mock('../../../src/models/User');
jest.mock('../../../src/models/Booking');

describe('Admin Controller', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockReq = {
      user: { userId: 'admin123', userType: 'admin' },
      query: {},
      params: {},
      body: {}
    };
    
    mockRes = {
      status: mockStatus,
      json: mockJson
    };

    jest.clearAllMocks();
  });

  describe('getAllCustomers', () => {
    it('should return paginated customers with default parameters', async () => {
      // Arrange
      const mockCustomers = [
        {
          _id: 'customer1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          userType: 'customer',
          isActive: true,
          createdAt: new Date()
        },
        {
          _id: 'customer2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          userType: 'customer',
          isActive: true,
          createdAt: new Date()
        }
      ];

      const mockFind = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockResolvedValue(mockCustomers)
      };

      (User.find as jest.Mock).mockReturnValue(mockFind);
      (User.countDocuments as jest.Mock).mockResolvedValue(2);

      // Act
      await getAllCustomers(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(User.find).toHaveBeenCalledWith({ userType: 'customer' });
      expect(mockFind.select).toHaveBeenCalledWith('-password');
      expect(mockFind.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockFind.limit).toHaveBeenCalledWith(10);
      expect(mockFind.skip).toHaveBeenCalledWith(0);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          customers: mockCustomers,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 2,
            itemsPerPage: 10
          }
        }
      });
    });

    it('should handle search query', async () => {
      // Arrange
      mockReq.query = { search: 'john' };

      const mockFind = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockResolvedValue([])
      };

      (User.find as jest.Mock).mockReturnValue(mockFind);
      (User.countDocuments as jest.Mock).mockResolvedValue(0);

      // Act
      await getAllCustomers(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(User.find).toHaveBeenCalledWith({
        userType: 'customer',
        $or: [
          { firstName: { $regex: 'john', $options: 'i' } },
          { lastName: { $regex: 'john', $options: 'i' } },
          { email: { $regex: 'john', $options: 'i' } },
          { companyName: { $regex: 'john', $options: 'i' } }
        ]
      });
    });

    it('should handle status filter', async () => {
      // Arrange
      mockReq.query = { status: 'active' };

      const mockFind = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockResolvedValue([])
      };

      (User.find as jest.Mock).mockReturnValue(mockFind);
      (User.countDocuments as jest.Mock).mockResolvedValue(0);

      // Act
      await getAllCustomers(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(User.find).toHaveBeenCalledWith({
        userType: 'customer',
        isActive: true
      });
    });

    it('should handle custom sorting and pagination', async () => {
      // Arrange
      mockReq.query = {
        page: '2',
        limit: '5',
        sortBy: 'email',
        sortOrder: 'asc'
      };

      const mockFind = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockResolvedValue([])
      };

      (User.find as jest.Mock).mockReturnValue(mockFind);
      (User.countDocuments as jest.Mock).mockResolvedValue(0);

      // Act
      await getAllCustomers(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(mockFind.sort).toHaveBeenCalledWith({ email: 1 });
      expect(mockFind.limit).toHaveBeenCalledWith(5);
      expect(mockFind.skip).toHaveBeenCalledWith(5);
    });

    it('should handle errors', async () => {
      // Arrange
      (User.find as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      // Act
      await getAllCustomers(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch customers'
      });
    });
  });

  describe('getCustomerDetails', () => {
    it('should return customer details with booking stats', async () => {
      // Arrange
      mockReq.params = { customerId: 'customer123' };

      const mockCustomer = {
        _id: 'customer123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        userType: 'customer',
        isActive: true
      };

      const mockBookings = [
        { status: 'completed', totalCost: 100 },
        { status: 'pending', totalCost: 50 },
        { status: 'completed', totalCost: 75 }
      ];

      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockCustomer)
      });

      (Booking.find as jest.Mock).mockResolvedValue(mockBookings);

      // Act
      await getCustomerDetails(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('customer123');
      expect(Booking.find).toHaveBeenCalledWith({ customerId: 'customer123' });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          customer: mockCustomer,
          bookingStats: {
            totalBookings: 3,
            completedBookings: 2,
            pendingBookings: 1,
            totalRevenue: 225,
            avgBookingValue: 75
          }
        }
      });
    });

    it('should return 404 when customer not found', async () => {
      // Arrange
      mockReq.params = { customerId: 'nonexistent' };

      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      // Act
      await getCustomerDetails(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Customer not found'
      });
    });

    it('should handle errors', async () => {
      // Arrange
      mockReq.params = { customerId: 'customer123' };

      (User.findById as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      // Act
      await getCustomerDetails(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch customer details'
      });
    });
  });

  describe('updateCustomerStatus', () => {
    it('should update customer status successfully', async () => {
      // Arrange
      mockReq.params = { customerId: 'customer123' };
      mockReq.body = { isActive: false };

      const mockUpdatedCustomer = {
        _id: 'customer123',
        firstName: 'John',
        lastName: 'Doe',
        isActive: false
      };

      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUpdatedCustomer)
      });

      // Act
      await updateCustomerStatus(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'customer123',
        { isActive: false },
        { new: true, runValidators: true }
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Customer status updated successfully',
        data: { customer: mockUpdatedCustomer }
      });
    });

    it('should return 404 when customer not found', async () => {
      // Arrange
      mockReq.params = { customerId: 'nonexistent' };
      mockReq.body = { isActive: false };

      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      // Act
      await updateCustomerStatus(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Customer not found'
      });
    });
  });

  describe('getDashboardStats', () => {
    it('should return comprehensive dashboard statistics', async () => {
      // Arrange
      const mockUsers = [
        { userType: 'customer', isActive: true },
        { userType: 'customer', isActive: false },
        { userType: 'admin', isActive: true }
      ];

      const mockBookings = [
        { status: 'completed', totalCost: 100, createdAt: new Date() },
        { status: 'pending', totalCost: 50, createdAt: new Date() },
        { status: 'cancelled', totalCost: 25, createdAt: new Date() }
      ];

      (User.find as jest.Mock).mockResolvedValue(mockUsers);
      (Booking.find as jest.Mock).mockResolvedValue(mockBookings);

      // Act
      await getDashboardStats(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          totalCustomers: 2,
          activeCustomers: 1,
          inactiveCustomers: 1,
          totalBookings: 3,
          completedBookings: 1,
          pendingBookings: 1,
          cancelledBookings: 1,
          totalRevenue: 175,
          avgBookingValue: expect.any(Number),
          recentBookings: expect.any(Array)
        }
      });
    });

    it('should handle errors', async () => {
      // Arrange
      (User.find as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act
      await getDashboardStats(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch dashboard statistics'
      });
    });
  });

  describe('getCustomerBookings', () => {
    it('should return paginated customer bookings', async () => {
      // Arrange
      mockReq.params = { customerId: 'customer123' };
      mockReq.query = { page: '1', limit: '10' };

      const mockBookings = [
        {
          _id: 'booking1',
          customerId: 'customer123',
          status: 'completed',
          totalCost: 100
        }
      ];

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockResolvedValue(mockBookings)
      };

      (User.findById as jest.Mock).mockResolvedValue({ _id: 'customer123' });
      (Booking.find as jest.Mock).mockReturnValue(mockFind);
      (Booking.countDocuments as jest.Mock).mockResolvedValue(1);

      // Act
      await getCustomerBookings(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('customer123');
      expect(Booking.find).toHaveBeenCalledWith({ customerId: 'customer123' });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          bookings: mockBookings,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 1,
            itemsPerPage: 10
          }
        }
      });
    });

    it('should return 404 when customer not found', async () => {
      // Arrange
      mockReq.params = { customerId: 'nonexistent' };

      (User.findById as jest.Mock).mockResolvedValue(null);

      // Act
      await getCustomerBookings(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Customer not found'
      });
    });
  });

  describe('updateCustomer', () => {
    it('should update customer information successfully', async () => {
      // Arrange
      mockReq.params = { customerId: 'customer123' };
      mockReq.body = {
        firstName: 'John',
        lastName: 'Updated',
        companyName: 'New Company'
      };

      const mockUpdatedCustomer = {
        _id: 'customer123',
        firstName: 'John',
        lastName: 'Updated',
        companyName: 'New Company'
      };

      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUpdatedCustomer)
      });

      // Act
      await updateCustomer(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'customer123',
        {
          firstName: 'John',
          lastName: 'Updated',
          companyName: 'New Company'
        },
        { new: true, runValidators: true }
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Customer updated successfully',
        data: { customer: mockUpdatedCustomer }
      });
    });

    it('should return 404 when customer not found', async () => {
      // Arrange
      mockReq.params = { customerId: 'nonexistent' };
      mockReq.body = { firstName: 'John' };

      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      // Act
      await updateCustomer(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Customer not found'
      });
    });

    it('should handle validation errors', async () => {
      // Arrange
      mockReq.params = { customerId: 'customer123' };
      mockReq.body = { firstName: 'John' };

      const validationError = new Error('Validation failed');
      (validationError as any).name = 'ValidationError';

      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: jest.fn().mockRejectedValue(validationError)
      });

      // Act
      await updateCustomer(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed'
      });
    });

    it('should handle general errors', async () => {
      // Arrange
      mockReq.params = { customerId: 'customer123' };
      mockReq.body = { firstName: 'John' };

      (User.findByIdAndUpdate as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      // Act
      await updateCustomer(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to update customer'
      });
    });
  });
});
