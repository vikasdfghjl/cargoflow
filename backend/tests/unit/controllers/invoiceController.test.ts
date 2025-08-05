// @ts-nocheck
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import {
  getAllInvoices,
  getInvoiceDetails,
  createInvoice,
  updateInvoice,
  generateInvoiceFromBookings,
  deleteInvoice,
  getInvoiceStats,
  getCustomerInvoices,
  getCustomerInvoiceDetails
} from '../../../src/controllers/invoiceController';
import Invoice from '../../../src/models/Invoice';
import User from '../../../src/models/User';
import Booking from '../../../src/models/Booking';
import { AuthRequest } from '../../../src/types';
import { TestHelpers } from '../../utils/testHelpers';

// Mock the models
jest.mock('../../../src/models/Invoice');
jest.mock('../../../src/models/User');
jest.mock('../../../src/models/Booking');

// Type the mocked modules
const mockedInvoice = Invoice as jest.Mocked<typeof Invoice>;
const mockedUser = User as jest.Mocked<typeof User>;
const mockedBooking = Booking as jest.Mocked<typeof Booking>;

describe('Invoice Controller', () => {
  const mockInvoiceModel = Invoice as jest.Mocked<typeof Invoice>;
  const mockUserModel = User as jest.Mocked<typeof User>;
  const mockBookingModel = Booking as jest.Mocked<typeof Booking>;
  
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
    } as Partial<Response>;

    jest.clearAllMocks();
  });

  describe('getAllInvoices', () => {
    it('should return paginated invoices with default parameters', async () => {
      // Arrange
      const mockInvoices = [
        {
          _id: 'invoice1',
          invoiceNumber: 'INV-2024-0001',
          customerId: 'customer1',
          status: 'paid',
          totalAmount: 100,
          createdAt: new Date()
        },
        {
          _id: 'invoice2',
          invoiceNumber: 'INV-2024-0002',
          customerId: 'customer2',
          status: 'pending',
          totalAmount: 200,
          createdAt: new Date()
        }
      ];

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockResolvedValue(mockInvoices)
      } as any;

      (Invoice.find as jest.Mock).mockReturnValue(mockFind);
      (Invoice.countDocuments as jest.Mock).mockResolvedValue(2);

      // Act
      await getAllInvoices(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(Invoice.find).toHaveBeenCalledWith({});
      expect(mockFind.populate).toHaveBeenCalledWith('customerId', 'firstName lastName email companyName');
      expect(mockFind.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockFind.limit).toHaveBeenCalledWith(10);
      expect(mockFind.skip).toHaveBeenCalledWith(0);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          invoices: mockInvoices,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 2,
            itemsPerPage: 10
          }
        }
      });
    });

    it('should handle status filter', async () => {
      // Arrange
      mockReq.query = { status: 'paid' };

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockResolvedValue([])
      } as any;

      (Invoice.find as jest.Mock).mockReturnValue(mockFind);
      (Invoice.countDocuments as jest.Mock).mockResolvedValue(0);

      // Act
      await getAllInvoices(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(Invoice.find).toHaveBeenCalledWith({ status: 'paid' });
    });

    it('should handle customer filter', async () => {
      // Arrange
      mockReq.query = { customerId: '507f1f77bcf86cd799439011' }; // Valid ObjectId

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockResolvedValue([])
      } as any;

      (Invoice.find as jest.Mock).mockReturnValue(mockFind);
      (Invoice.countDocuments as jest.Mock).mockResolvedValue(0);

      // Act
      await getAllInvoices(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(Invoice.find).toHaveBeenCalledWith({ customerId: '507f1f77bcf86cd799439011' });
    });

    it('should return 400 for invalid customer ID', async () => {
      // Arrange
      mockReq.query = { customerId: 'invalid-id' };

      // Act
      await getAllInvoices(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid customer ID format'
      });
    });

    it('should handle search query', async () => {
      // Arrange
      mockReq.query = { search: 'INV-2024' };

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockResolvedValue([])
      } as any;

      (Invoice.find as jest.Mock).mockReturnValue(mockFind);
      (Invoice.countDocuments as jest.Mock).mockResolvedValue(0);

      // Act
      await getAllInvoices(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(Invoice.find).toHaveBeenCalledWith({
        $or: [
          { invoiceNumber: { $regex: 'INV-2024', $options: 'i' } },
          { description: { $regex: 'INV-2024', $options: 'i' } }
        ]
      });
    });

    it('should handle errors', async () => {
      // Arrange
      (Invoice.find as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      // Act
      await getAllInvoices(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch invoices'
      });
    });
  });

  describe('getInvoiceDetails', () => {
    it('should return invoice details with populated data', async () => {
      // Arrange
      mockReq.params = { invoiceId: 'invoice123' };

      const mockInvoice = {
        _id: 'invoice123',
        invoiceNumber: 'INV-2024-0001',
        customerId: {
          _id: 'customer1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        },
        status: 'paid',
        totalAmount: 100,
        items: [
          { description: 'Service 1', quantity: 1, unitPrice: 100 }
        ]
      };

      (Invoice.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockInvoice)
      } as any);

      // Act
      await getInvoiceDetails(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(Invoice.findById).toHaveBeenCalledWith('invoice123');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: { invoice: mockInvoice }
      });
    });

    it('should return 404 when invoice not found', async () => {
      // Arrange
      mockReq.params = { invoiceId: 'nonexistent' };

      (Invoice.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      } as any);

      // Act
      await getInvoiceDetails(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Invoice not found'
      });
    });

    it('should handle errors', async () => {
      // Arrange
      mockReq.params = { invoiceId: 'invoice123' };

      (Invoice.findById as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      // Act
      await getInvoiceDetails(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch invoice details'
      });
    });
  });

  describe('createInvoice', () => {
    beforeEach(() => {
      // Mock the generateInvoiceNumber function
      (Invoice.countDocuments as jest.Mock).mockResolvedValue(0);
    });

    it('should create a new invoice successfully', async () => {
      // Arrange
      mockReq.body = {
        customerId: 'customer123',
        items: [
          { description: 'Service 1', quantity: 1, unitPrice: 100 }
        ],
        notes: 'Test notes'
      };

      const mockCustomer = {
        _id: 'customer123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const mockCreatedInvoice = {
        _id: 'invoice123',
        invoiceNumber: 'INV-2024-0001',
        customerId: 'customer123',
        items: mockReq.body.items,
        totalAmount: 100,
        status: 'draft',
        notes: 'Test notes'
      };

      (User.findById as jest.Mock).mockResolvedValue(mockCustomer);
      (Invoice.prototype.save as jest.Mock) = jest.fn().mockResolvedValue(mockCreatedInvoice);
      (Invoice as any).mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(mockCreatedInvoice)
      }));

      // Act
      await createInvoice(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('customer123');
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Invoice created successfully',
        data: { invoice: mockCreatedInvoice }
      });
    });

    it('should return 404 when customer not found', async () => {
      // Arrange
      mockReq.body = {
        customerId: 'nonexistent',
        items: [{ description: 'Service', quantity: 1, unitPrice: 100 }]
      };

      (User.findById as jest.Mock).mockResolvedValue(null);

      // Act
      await createInvoice(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Customer not found'
      });
    });

    it('should return 400 for empty items array', async () => {
      // Arrange
      mockReq.body = {
        customerId: 'customer123',
        items: []
      };

      // Act
      await createInvoice(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Invoice must have at least one item'
      });
    });
  });

  describe('updateInvoice', () => {
    it('should update invoice successfully', async () => {
      // Arrange
      mockReq.params = { invoiceId: 'invoice123' };
      mockReq.body = {
        status: 'paid',
        items: [
          { description: 'Updated Service', quantity: 2, unitPrice: 50 }
        ]
      };

      const mockUpdatedInvoice = {
        _id: 'invoice123',
        status: 'paid',
        items: mockReq.body.items,
        totalAmount: 100
      };

      (Invoice.findByIdAndUpdate as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUpdatedInvoice)
      });

      // Act
      await updateInvoice(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(Invoice.findByIdAndUpdate).toHaveBeenCalledWith(
        'invoice123',
        expect.objectContaining({
          status: 'paid',
          items: mockReq.body.items,
          totalAmount: 100
        }),
        { new: true, runValidators: true }
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Invoice updated successfully',
        data: { invoice: mockUpdatedInvoice }
      });
    });

    it('should return 404 when invoice not found', async () => {
      // Arrange
      mockReq.params = { invoiceId: 'nonexistent' };
      mockReq.body = { status: 'paid' };

      (Invoice.findByIdAndUpdate as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      // Act
      await updateInvoice(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Invoice not found'
      });
    });
  });

  describe('generateInvoiceFromBookings', () => {
    it('should generate invoice from multiple bookings', async () => {
      // Arrange
      mockReq.body = {
        customerId: 'customer123',
        bookingIds: ['booking1', 'booking2']
      };

      const mockCustomer = {
        _id: 'customer123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const mockBookings = [
        {
          _id: 'booking1',
          pickupAddress: 'Address 1',
          deliveryAddress: 'Address 2',
          totalCost: 50,
          status: 'completed'
        },
        {
          _id: 'booking2',
          pickupAddress: 'Address 3',
          deliveryAddress: 'Address 4',
          totalCost: 75,
          status: 'completed'
        }
      ];

      const mockCreatedInvoice = {
        _id: 'invoice123',
        invoiceNumber: 'INV-2024-0001',
        customerId: 'customer123',
        totalAmount: 125,
        bookingIds: ['booking1', 'booking2']
      };

      (User.findById as jest.Mock).mockResolvedValue(mockCustomer);
      (Booking.find as jest.Mock).mockResolvedValue(mockBookings);
      (Invoice as any).mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(mockCreatedInvoice)
      }));

      // Act
      await generateInvoiceFromBookings(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('customer123');
      expect(Booking.find).toHaveBeenCalledWith({
        _id: { $in: ['booking1', 'booking2'] },
        customerId: 'customer123',
        status: 'completed'
      });
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Invoice generated successfully from bookings',
        data: { invoice: mockCreatedInvoice }
      });
    });

    it('should return 404 when customer not found', async () => {
      // Arrange
      mockReq.body = {
        customerId: 'nonexistent',
        bookingIds: ['booking1']
      };

      (User.findById as jest.Mock).mockResolvedValue(null);

      // Act
      await generateInvoiceFromBookings(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Customer not found'
      });
    });

    it('should return 400 when no completed bookings found', async () => {
      // Arrange
      mockReq.body = {
        customerId: 'customer123',
        bookingIds: ['booking1']
      };

      const mockCustomer = { _id: 'customer123' };

      (User.findById as jest.Mock).mockResolvedValue(mockCustomer);
      (Booking.find as jest.Mock).mockResolvedValue([]);

      // Act
      await generateInvoiceFromBookings(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'No completed bookings found for the specified IDs'
      });
    });
  });

  describe('deleteInvoice', () => {
    it('should delete invoice successfully', async () => {
      // Arrange
      mockReq.params = { invoiceId: 'invoice123' };

      const mockInvoice = {
        _id: 'invoice123',
        status: 'draft'
      };

      (Invoice.findById as jest.Mock).mockResolvedValue(mockInvoice);
      (Invoice.findByIdAndDelete as jest.Mock).mockResolvedValue(mockInvoice);

      // Act
      await deleteInvoice(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(Invoice.findById).toHaveBeenCalledWith('invoice123');
      expect(Invoice.findByIdAndDelete).toHaveBeenCalledWith('invoice123');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Invoice deleted successfully'
      });
    });

    it('should return 404 when invoice not found', async () => {
      // Arrange
      mockReq.params = { invoiceId: 'nonexistent' };

      (Invoice.findById as jest.Mock).mockResolvedValue(null);

      // Act
      await deleteInvoice(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Invoice not found'
      });
    });

    it('should return 400 when trying to delete paid invoice', async () => {
      // Arrange
      mockReq.params = { invoiceId: 'invoice123' };

      const mockInvoice = {
        _id: 'invoice123',
        status: 'paid'
      };

      (Invoice.findById as jest.Mock).mockResolvedValue(mockInvoice);

      // Act
      await deleteInvoice(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Cannot delete paid or partially paid invoices'
      });
    });
  });

  describe('getInvoiceStats', () => {
    it('should return comprehensive invoice statistics', async () => {
      // Arrange
      const mockInvoices = [
        { status: 'paid', totalAmount: 100 },
        { status: 'pending', totalAmount: 50 },
        { status: 'draft', totalAmount: 25 },
        { status: 'overdue', totalAmount: 75 }
      ];

      (Invoice.find as jest.Mock).mockResolvedValue(mockInvoices);

      // Act
      await getInvoiceStats(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          totalInvoices: 4,
          paidInvoices: 1,
          pendingInvoices: 1,
          overdueInvoices: 1,
          draftInvoices: 1,
          totalRevenue: 250,
          paidRevenue: 100,
          pendingRevenue: 50,
          overdueRevenue: 75,
          avgInvoiceAmount: 62.5
        }
      });
    });

    it('should handle errors', async () => {
      // Arrange
      (Invoice.find as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act
      await getInvoiceStats(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(500);
    });
  });

  describe('getCustomerInvoices', () => {
    it('should return customer invoices for customer user', async () => {
      // Arrange
      mockReq.user = { userId: 'customer123', userType: 'customer' };
      mockReq.query = { page: '1', limit: '10' };

      const mockInvoices = [
        {
          _id: 'invoice1',
          invoiceNumber: 'INV-2024-0001',
          status: 'paid',
          totalAmount: 100
        }
      ];

      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockResolvedValue(mockInvoices)
      };

      (Invoice.find as jest.Mock).mockReturnValue(mockFind);
      (Invoice.countDocuments as jest.Mock).mockResolvedValue(1);

      // Act
      await getCustomerInvoices(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(Invoice.find).toHaveBeenCalledWith({ customerId: 'customer123' });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          invoices: mockInvoices,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 1,
            itemsPerPage: 10
          }
        }
      });
    });

    it('should handle status filter for customer', async () => {
      // Arrange
      mockReq.user = { userId: 'customer123', userType: 'customer' };
      mockReq.query = { status: 'paid' };

      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockResolvedValue([])
      };

      (Invoice.find as jest.Mock).mockReturnValue(mockFind);
      (Invoice.countDocuments as jest.Mock).mockResolvedValue(0);

      // Act
      await getCustomerInvoices(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(Invoice.find).toHaveBeenCalledWith({
        customerId: 'customer123',
        status: 'paid'
      });
    });
  });

  describe('getCustomerInvoiceDetails', () => {
    it('should return invoice details for customer', async () => {
      // Arrange
      mockReq.user = { userId: 'customer123', userType: 'customer' };
      mockReq.params = { invoiceId: 'invoice123' };

      const mockInvoice = {
        _id: 'invoice123',
        customerId: 'customer123',
        invoiceNumber: 'INV-2024-0001',
        status: 'paid',
        totalAmount: 100
      };

      (Invoice.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockInvoice)
      });

      // Act
      await getCustomerInvoiceDetails(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(Invoice.findOne).toHaveBeenCalledWith({
        _id: 'invoice123',
        customerId: 'customer123'
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: { invoice: mockInvoice }
      });
    });

    it('should return 404 when invoice not found for customer', async () => {
      // Arrange
      mockReq.user = { userId: 'customer123', userType: 'customer' };
      mockReq.params = { invoiceId: 'invoice123' };

      (Invoice.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      // Act
      await getCustomerInvoiceDetails(mockReq as AuthRequest, mockRes as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Invoice not found'
      });
    });
  });
});
