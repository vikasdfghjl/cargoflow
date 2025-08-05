import { Response } from 'express';
import Invoice from '../models/Invoice';
import User from '../models/User';
import Booking from '../models/Booking';
import { AuthRequest, ApiResponse } from '../types';
import mongoose from 'mongoose';

// Helper function to generate invoice number
const generateInvoiceNumber = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const count = await Invoice.countDocuments({
    createdAt: {
      $gte: new Date(`${currentYear}-01-01`),
      $lt: new Date(`${currentYear + 1}-01-01`)
    }
  });
  
  return `INV-${currentYear}-${String(count + 1).padStart(4, '0')}`;
};

// Get all invoices for admin dashboard
export const getAllInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      customerId,
      search
    } = req.query;

    // Build query
    const query: any = {};
    
    // Add status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Add customer filter
    if (customerId) {
      if (!mongoose.Types.ObjectId.isValid(customerId as string)) {
        res.status(400).json({
          success: false,
          message: 'Invalid customer ID format'
        } as ApiResponse);
        return;
      }
      query.customerId = customerId;
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortObject: any = {};
    sortObject[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const invoices = await Invoice.find(query)
      .populate('customerId', 'firstName lastName email companyName')
      .populate('bookingIds', 'bookingNumber status totalCost')
      .sort(sortObject)
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    // Get total count for pagination
    const totalInvoices = await Invoice.countDocuments(query);
    const totalPages = Math.ceil(totalInvoices / Number(limit));

    const invoicesResponse = invoices.map(invoice => ({
      id: (invoice._id as string).toString(),
      invoiceNumber: invoice.invoiceNumber,
      customer: invoice.customerId,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      totalAmount: invoice.totalAmount,
      bookingCount: invoice.bookingIds.length,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt
    }));

    res.status(200).json({
      success: true,
      message: 'Invoices retrieved successfully',
      data: {
        invoices: invoicesResponse,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalInvoices,
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1
        }
      }
    } as ApiResponse);

  } catch (error: any) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve invoices',
      error: error.message
    } as ApiResponse);
  }
};

// Get invoice details
export const getInvoiceDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { invoiceId } = req.params;

    if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid invoice ID'
      } as ApiResponse);
      return;
    }

    const invoice = await Invoice.findById(invoiceId)
      .populate('customerId', 'firstName lastName email companyName phone companyAddress')
      .populate('bookingIds', 'bookingNumber status totalCost pickupAddress deliveryAddress');

    if (!invoice) {
      res.status(404).json({
        success: false,
        message: 'Invoice not found'
      } as ApiResponse);
      return;
    }

    const invoiceDetails = {
      id: (invoice._id as string).toString(),
      invoiceNumber: invoice.invoiceNumber,
      customer: invoice.customerId,
      bookings: invoice.bookingIds,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      items: invoice.items,
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      discountAmount: invoice.discountAmount,
      totalAmount: invoice.totalAmount,
      notes: invoice.notes,
      paymentTerms: invoice.paymentTerms,
      sentAt: invoice.sentAt,
      paidAt: invoice.paidAt,
      paymentMethod: invoice.paymentMethod,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt
    };

    res.status(200).json({
      success: true,
      message: 'Invoice details retrieved successfully',
      data: invoiceDetails
    } as ApiResponse);

  } catch (error: any) {
    console.error('Get invoice details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve invoice details',
      error: error.message
    } as ApiResponse);
  }
};

// Create new invoice
export const createInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      customerId,
      bookingIds = [],
      dueDate,
      items,
      taxRate = 0,
      discountAmount = 0,
      notes,
      paymentTerms = 'Net 30'
    } = req.body;

    // Validate customer
    if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid customer ID'
      } as ApiResponse);
      return;
    }

    const customer = await User.findOne({ 
      _id: customerId, 
      userType: 'customer' 
    });

    if (!customer) {
      res.status(404).json({
        success: false,
        message: 'Customer not found'
      } as ApiResponse);
      return;
    }

    // Validate bookings if provided
    const validBookingIds = [];
    if (bookingIds.length > 0) {
      for (const bookingId of bookingIds) {
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
          res.status(400).json({
            success: false,
            message: `Invalid booking ID: ${bookingId}`
          } as ApiResponse);
          return;
        }

        const booking = await Booking.findOne({
          _id: bookingId,
          customerId: customerId
        });

        if (!booking) {
          res.status(404).json({
            success: false,
            message: `Booking not found: ${bookingId}`
          } as ApiResponse);
          return;
        }

        validBookingIds.push(new mongoose.Types.ObjectId(bookingId));
      }
    }

    // Calculate amounts
    const subtotal = items.reduce((sum: number, item: any) => sum + item.amount, 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount - discountAmount;

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Create invoice
    const invoice = new Invoice({
      invoiceNumber,
      customerId: new mongoose.Types.ObjectId(customerId),
      bookingIds: validBookingIds,
      dueDate: new Date(dueDate),
      items,
      subtotal,
      taxRate,
      taxAmount,
      discountAmount,
      totalAmount,
      notes,
      paymentTerms
    });

    await invoice.save();

    // Populate the created invoice
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('customerId', 'firstName lastName email companyName')
      .populate('bookingIds', 'bookingNumber status totalCost');

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: {
        id: (populatedInvoice!._id as string).toString(),
        invoiceNumber: populatedInvoice!.invoiceNumber,
        customer: populatedInvoice!.customerId,
        bookings: populatedInvoice!.bookingIds,
        invoiceDate: populatedInvoice!.invoiceDate,
        dueDate: populatedInvoice!.dueDate,
        status: populatedInvoice!.status,
        totalAmount: populatedInvoice!.totalAmount,
        createdAt: populatedInvoice!.createdAt
      }
    } as ApiResponse);

  } catch (error: any) {
    console.error('Create invoice error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: validationErrors.join(', ')
      } as ApiResponse);
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create invoice',
      error: error.message
    } as ApiResponse);
  }
};

// Update invoice
export const updateInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { invoiceId } = req.params;
    const {
      dueDate,
      items,
      taxRate,
      discountAmount,
      notes,
      paymentTerms,
      status
    } = req.body;

    if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid invoice ID'
      } as ApiResponse);
      return;
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      res.status(404).json({
        success: false,
        message: 'Invoice not found'
      } as ApiResponse);
      return;
    }

    // Don't allow updates to paid invoices (except status changes)
    if (invoice.status === 'paid' && status !== 'paid') {
      res.status(400).json({
        success: false,
        message: 'Cannot modify paid invoices'
      } as ApiResponse);
      return;
    }

    // Calculate new amounts if items changed
    let updateData: any = {
      updatedAt: new Date()
    };

    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (notes !== undefined) updateData.notes = notes;
    if (paymentTerms) updateData.paymentTerms = paymentTerms;
    if (status) updateData.status = status;

    if (items) {
      const subtotal = items.reduce((sum: number, item: any) => sum + item.amount, 0);
      const finalTaxRate = taxRate !== undefined ? taxRate : invoice.taxRate;
      const finalDiscountAmount = discountAmount !== undefined ? discountAmount : invoice.discountAmount;
      const taxAmount = (subtotal * finalTaxRate) / 100;
      const totalAmount = subtotal + taxAmount - finalDiscountAmount;

      updateData.items = items;
      updateData.subtotal = subtotal;
      updateData.taxRate = finalTaxRate;
      updateData.discountAmount = finalDiscountAmount;
      updateData.taxAmount = taxAmount;
      updateData.totalAmount = totalAmount;
    }

    // Update sent timestamp if status changed to sent
    if (status === 'sent' && invoice.status !== 'sent') {
      updateData.sentAt = new Date();
    }

    // Update paid timestamp if status changed to paid
    if (status === 'paid' && invoice.status !== 'paid') {
      updateData.paidAt = new Date();
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      invoiceId,
      updateData,
      { new: true, runValidators: true }
    ).populate('customerId', 'firstName lastName email companyName');

    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      data: {
        id: (updatedInvoice!._id as string).toString(),
        invoiceNumber: updatedInvoice!.invoiceNumber,
        status: updatedInvoice!.status,
        totalAmount: updatedInvoice!.totalAmount,
        updatedAt: updatedInvoice!.updatedAt
      }
    } as ApiResponse);

  } catch (error: any) {
    console.error('Update invoice error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: validationErrors.join(', ')
      } as ApiResponse);
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update invoice',
      error: error.message
    } as ApiResponse);
  }
};

// Generate invoice from bookings
export const generateInvoiceFromBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { customerId, bookingIds, dueDate, taxRate = 0, discountAmount = 0, notes } = req.body;

    if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid customer ID'
      } as ApiResponse);
      return;
    }

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'At least one booking ID is required'
      } as ApiResponse);
      return;
    }

    // Validate customer
    const customer = await User.findOne({ 
      _id: customerId, 
      userType: 'customer' 
    });

    if (!customer) {
      res.status(404).json({
        success: false,
        message: 'Customer not found'
      } as ApiResponse);
      return;
    }

    // Get bookings and validate
    const bookings = await Booking.find({
      _id: { $in: bookingIds.map(id => new mongoose.Types.ObjectId(id)) },
      customerId: customerId,
      status: 'delivered' // Only delivered bookings can be invoiced
    });

    if (bookings.length !== bookingIds.length) {
      res.status(400).json({
        success: false,
        message: 'Some bookings were not found or are not eligible for invoicing'
      } as ApiResponse);
      return;
    }

    // Generate invoice items from bookings
    const items = bookings.map(booking => ({
      description: `Cargo delivery service - ${booking.bookingNumber}`,
      quantity: 1,
      unitPrice: booking.totalCost,
      amount: booking.totalCost,
      bookingId: booking._id
    }));

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount - discountAmount;

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Create invoice
    const invoice = new Invoice({
      invoiceNumber,
      customerId: new mongoose.Types.ObjectId(customerId),
      bookingIds: bookings.map(b => b._id),
      dueDate: new Date(dueDate),
      items,
      subtotal,
      taxRate,
      taxAmount,
      discountAmount,
      totalAmount,
      notes,
      paymentTerms: 'Net 30'
    });

    await invoice.save();

    // Populate the created invoice
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('customerId', 'firstName lastName email companyName')
      .populate('bookingIds', 'bookingNumber status totalCost');

    res.status(201).json({
      success: true,
      message: 'Invoice generated successfully from bookings',
      data: {
        id: (populatedInvoice!._id as string).toString(),
        invoiceNumber: populatedInvoice!.invoiceNumber,
        customer: populatedInvoice!.customerId,
        bookings: populatedInvoice!.bookingIds,
        totalAmount: populatedInvoice!.totalAmount,
        itemCount: items.length
      }
    } as ApiResponse);

  } catch (error: any) {
    console.error('Generate invoice from bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice from bookings',
      error: error.message
    } as ApiResponse);
  }
};

// Delete invoice
export const deleteInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { invoiceId } = req.params;

    if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid invoice ID'
      } as ApiResponse);
      return;
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      res.status(404).json({
        success: false,
        message: 'Invoice not found'
      } as ApiResponse);
      return;
    }

    // Don't allow deletion of paid invoices
    if (invoice.status === 'paid') {
      res.status(400).json({
        success: false,
        message: 'Cannot delete paid invoices'
      } as ApiResponse);
      return;
    }

    await Invoice.findByIdAndDelete(invoiceId);

    res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully'
    } as ApiResponse);

  } catch (error: any) {
    console.error('Delete invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete invoice',
      error: error.message
    } as ApiResponse);
  }
};

// Get invoice statistics
export const getInvoiceStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get invoice counts by status
    const statusCounts = await Invoice.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Get overdue invoices
    const overdueCount = await Invoice.countDocuments({
      status: { $in: ['sent'] },
      dueDate: { $lt: new Date() }
    });

    // Update overdue status
    await Invoice.updateMany(
      {
        status: 'sent',
        dueDate: { $lt: new Date() }
      },
      { status: 'overdue' }
    );

    // Get monthly revenue
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = await Invoice.aggregate([
      {
        $match: {
          status: 'paid',
          paidAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lt: new Date(`${currentYear + 1}-01-01`)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$paidAt' },
          revenue: { $sum: '$totalAmount' },
          invoices: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const stats = {
      total: await Invoice.countDocuments(),
      draft: statusCounts.find(s => s._id === 'draft')?.count || 0,
      sent: statusCounts.find(s => s._id === 'sent')?.count || 0,
      paid: statusCounts.find(s => s._id === 'paid')?.count || 0,
      overdue: overdueCount,
      cancelled: statusCounts.find(s => s._id === 'cancelled')?.count || 0,
      totalRevenue: statusCounts.find(s => s._id === 'paid')?.totalAmount || 0,
      monthlyRevenue
    };

    res.status(200).json({
      success: true,
      message: 'Invoice statistics retrieved successfully',
      data: stats
    } as ApiResponse);

  } catch (error: any) {
    console.error('Get invoice stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve invoice statistics',
      error: error.message
    } as ApiResponse);
  }
};

// Get customer's invoices
export const getCustomerInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customerId = req.user?.userId;
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      search
    } = req.query;

    if (!customerId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized'
      } as ApiResponse);
      return;
    }

    // Build query for customer's invoices only
    const query: any = { customerId: new mongoose.Types.ObjectId(customerId) };
    
    // Add status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortObject: any = {};
    sortObject[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const invoices = await Invoice.find(query)
      .populate('bookingIds', 'bookingNumber status totalCost pickupAddress deliveryAddress')
      .sort(sortObject)
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    // Get total count for pagination
    const totalInvoices = await Invoice.countDocuments(query);
    const totalPages = Math.ceil(totalInvoices / Number(limit));

    const invoicesResponse = invoices.map(invoice => ({
      id: (invoice._id as string).toString(),
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      totalAmount: invoice.totalAmount,
      bookings: invoice.bookingIds,
      itemCount: invoice.items.length,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt
    }));

    res.status(200).json({
      success: true,
      message: 'Customer invoices retrieved successfully',
      data: {
        invoices: invoicesResponse,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalInvoices,
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1
        }
      }
    } as ApiResponse);

  } catch (error: any) {
    console.error('Get customer invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve customer invoices',
      error: error.message
    } as ApiResponse);
  }
};

// Get customer invoice details
export const getCustomerInvoiceDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customerId = req.user?.userId;
    const { invoiceId } = req.params;

    if (!customerId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized'
      } as ApiResponse);
      return;
    }

    if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid invoice ID'
      } as ApiResponse);
      return;
    }

    const invoice = await Invoice.findOne({
      _id: invoiceId,
      customerId: new mongoose.Types.ObjectId(customerId)
    }).populate('bookingIds', 'bookingNumber status totalCost pickupAddress deliveryAddress cargoDetails');

    if (!invoice) {
      res.status(404).json({
        success: false,
        message: 'Invoice not found'
      } as ApiResponse);
      return;
    }

    const invoiceDetails = {
      id: (invoice._id as string).toString(),
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      items: invoice.items,
      bookings: invoice.bookingIds,
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      discountAmount: invoice.discountAmount,
      totalAmount: invoice.totalAmount,
      notes: invoice.notes,
      paymentTerms: invoice.paymentTerms,
      sentAt: invoice.sentAt,
      paidAt: invoice.paidAt,
      paymentMethod: invoice.paymentMethod,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt
    };

    res.status(200).json({
      success: true,
      message: 'Customer invoice details retrieved successfully',
      data: invoiceDetails
    } as ApiResponse);

  } catch (error: any) {
    console.error('Get customer invoice details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve customer invoice details',
      error: error.message
    } as ApiResponse);
  }
};
