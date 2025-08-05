import { Response } from 'express';
import User from '../models/User';
import Booking from '../models/Booking';
import { AuthRequest, ApiResponse } from '../types';
import mongoose from 'mongoose';

// Get all customers for admin dashboard
export const getAllCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      search
    } = req.query;

    // Build query for customers only
    const query: any = { userType: 'customer' };
    
    // Add search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } }
      ];
    }

    // Add status filter if provided
    if (status) {
      query.isActive = status === 'active';
    }

    // Build sort object
    const sortObject: any = {};
    sortObject[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const customers = await User.find(query)
      .select('-password')
      .sort(sortObject)
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    // Get total count for pagination
    const totalCustomers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalCustomers / Number(limit));

    // Get booking counts for each customer
    const customersWithBookings = await Promise.all(
      customers.map(async (customer) => {
        const bookingCount = await Booking.countDocuments({ 
          customerId: customer._id 
        });
        
        const activeBookings = await Booking.countDocuments({ 
          customerId: customer._id,
          status: { $in: ['pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery'] }
        });

        return {
          id: (customer._id as string).toString(),
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          companyName: customer.companyName,
          isActive: customer.isActive,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
          totalBookings: bookingCount,
          activeBookings: activeBookings
        };
      })
    );

    res.status(200).json({
      success: true,
      message: 'Customers retrieved successfully',
      data: {
        customers: customersWithBookings,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalCustomers,
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1
        }
      }
    } as ApiResponse);

  } catch (error: any) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve customers',
      error: error.message
    } as ApiResponse);
  }
};

// Get customer details with full information
export const getCustomerDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;

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
    }).select('-password');

    if (!customer) {
      res.status(404).json({
        success: false,
        message: 'Customer not found'
      } as ApiResponse);
      return;
    }

    // Get customer's recent bookings
    const recentBookings = await Booking.find({ customerId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customerId', 'firstName lastName companyName');

    // Get customer statistics
    const totalBookings = await Booking.countDocuments({ customerId });
    const completedBookings = await Booking.countDocuments({ 
      customerId, 
      status: 'delivered' 
    });
    const cancelledBookings = await Booking.countDocuments({ 
      customerId, 
      status: 'cancelled' 
    });
    const activeBookings = await Booking.countDocuments({ 
      customerId,
      status: { $in: ['pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery'] }
    });

    // Calculate total revenue from this customer
    const revenueResult = await Booking.aggregate([
      { $match: { customerId: new mongoose.Types.ObjectId(customerId), status: 'delivered' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalCost' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    const customerDetails = {
      id: (customer._id as string).toString(),
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      companyName: customer.companyName,
      isActive: customer.isActive,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      statistics: {
        totalBookings,
        completedBookings,
        cancelledBookings,
        activeBookings,
        totalRevenue
      },
      recentBookings: recentBookings.map(booking => ({
        id: booking._id.toString(),
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        totalCost: booking.totalCost,
        pickupDate: booking.pickupDate,
        createdAt: booking.createdAt,
        pickupAddress: booking.pickupAddress,
        deliveryAddress: booking.deliveryAddress
      }))
    };

    res.status(200).json({
      success: true,
      message: 'Customer details retrieved successfully',
      data: customerDetails
    } as ApiResponse);

  } catch (error: any) {
    console.error('Get customer details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve customer details',
      error: error.message
    } as ApiResponse);
  }
};

// Update customer status (activate/deactivate)
export const updateCustomerStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;
    const { isActive } = req.body;

    if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid customer ID'
      } as ApiResponse);
      return;
    }

    const customer = await User.findOneAndUpdate(
      { _id: customerId, userType: 'customer' },
      { isActive },
      { new: true, select: '-password' }
    );

    if (!customer) {
      res.status(404).json({
        success: false,
        message: 'Customer not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: `Customer ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: (customer._id as string).toString(),
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        isActive: customer.isActive
      }
    } as ApiResponse);

  } catch (error: any) {
    console.error('Update customer status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update customer status',
      error: error.message
    } as ApiResponse);
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get total customers
    const totalCustomers = await User.countDocuments({ userType: 'customer' });
    const activeCustomers = await User.countDocuments({ 
      userType: 'customer', 
      isActive: true 
    });

    // Get booking statistics
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ 
      status: { $in: ['pending', 'confirmed'] } 
    });
    const inTransitBookings = await Booking.countDocuments({ 
      status: { $in: ['picked_up', 'in_transit', 'out_for_delivery'] } 
    });
    const completedBookings = await Booking.countDocuments({ status: 'delivered' });

    // Get revenue statistics
    const revenueResult = await Booking.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalCost' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Get monthly revenue for current year
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = await Booking.aggregate([
      {
        $match: {
          status: 'delivered',
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lt: new Date(`${currentYear + 1}-01-01`)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          revenue: { $sum: '$totalCost' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const stats = {
      customers: {
        total: totalCustomers,
        active: activeCustomers,
        inactive: totalCustomers - activeCustomers
      },
      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        inTransit: inTransitBookings,
        completed: completedBookings
      },
      revenue: {
        total: totalRevenue,
        monthly: monthlyRevenue
      }
    };

    res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: stats
    } as ApiResponse);

  } catch (error: any) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard statistics',
      error: error.message
    } as ApiResponse);
  }
};

// Get bookings for a specific customer
export const getCustomerBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status
    } = req.query;

    if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid customer ID'
      } as ApiResponse);
      return;
    }

    // Verify customer exists
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

    // Build query
    const query: any = { customerId };
    if (status && status !== 'all') {
      query.status = status;
    }

    // Build sort object
    const sortObject: any = {};
    sortObject[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const bookings = await Booking.find(query)
      .populate('customerId', 'firstName lastName email companyName')
      .sort(sortObject)
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    // Get total count for pagination
    const totalBookings = await Booking.countDocuments(query);
    const totalPages = Math.ceil(totalBookings / Number(limit));

    const bookingsResponse = bookings.map(booking => ({
      _id: booking._id.toString(),
      bookingNumber: booking.bookingNumber,
      customerId: booking.customerId,
      pickupAddress: booking.pickupAddress,
      deliveryAddress: booking.deliveryAddress,
      packageType: booking.packageType,
      weight: booking.weight,
      dimensions: booking.dimensions,
      serviceType: booking.serviceType,
      pickupDate: booking.pickupDate,
      estimatedDeliveryDate: booking.estimatedDeliveryDate,
      actualDeliveryDate: booking.actualDeliveryDate,
      status: booking.status,
      specialInstructions: booking.specialInstructions,
      insurance: booking.insurance,
      insuranceValue: booking.insuranceValue,
      baseCost: booking.baseCost,
      weightCharges: booking.weightCharges,
      insuranceCharges: booking.insuranceCharges,
      totalCost: booking.totalCost,
      trackingNumber: booking.trackingNumber,
      driverId: booking.driverId,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      confirmedAt: booking.confirmedAt,
      pickedUpAt: booking.pickedUpAt,
      deliveredAt: booking.deliveredAt
    }));

    res.status(200).json({
      success: true,
      message: 'Customer bookings retrieved successfully',
      data: {
        bookings: bookingsResponse,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalBookings,
          hasNextPage: Number(page) < totalPages,
          hasPrevPage: Number(page) > 1
        }
      }
    } as ApiResponse);

  } catch (error: any) {
    console.error('Get customer bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve customer bookings',
      error: error.message
    } as ApiResponse);
  }
};

// Update customer details
export const updateCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      companyName,
      companyAddress,
      businessType,
      isActive
    } = req.body;

    // Validate customerId
    if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid customer ID format'
      } as ApiResponse);
      return;
    }

    // Check if customer exists
    const existingCustomer = await User.findById(customerId);
    if (!existingCustomer || existingCustomer.userType !== 'customer') {
      res.status(404).json({
        success: false,
        message: 'Customer not found'
      } as ApiResponse);
      return;
    }

    // Check if email is being changed and if it's already in use
    if (email !== existingCustomer.email) {
      const emailExists = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: new mongoose.Types.ObjectId(customerId) }
      });
      
      if (emailExists) {
        res.status(400).json({
          success: false,
          message: 'Email address is already in use by another account'
        } as ApiResponse);
        return;
      }
    }

    // Update customer details
    const updatedCustomer = await User.findByIdAndUpdate(
      new mongoose.Types.ObjectId(customerId),
      {
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone,
        companyName,
        companyAddress,
        businessType,
        isActive,
        updatedAt: new Date()
      },
      { 
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!updatedCustomer) {
      res.status(404).json({
        success: false,
        message: 'Customer not found'
      } as ApiResponse);
      return;
    }

    // Format response
    const customerResponse = {
      id: (updatedCustomer._id as string).toString(),
      firstName: updatedCustomer.firstName,
      lastName: updatedCustomer.lastName,
      email: updatedCustomer.email,
      phone: updatedCustomer.phone,
      companyName: updatedCustomer.companyName,
      companyAddress: updatedCustomer.companyAddress,
      businessType: updatedCustomer.businessType,
      isActive: updatedCustomer.isActive,
      createdAt: updatedCustomer.createdAt.toISOString(),
      updatedAt: updatedCustomer.updatedAt.toISOString(),
      totalBookings: 0, // Will be calculated if needed
      activeBookings: 0  // Will be calculated if needed
    };

    res.status(200).json({
      success: true,
      message: 'Customer details updated successfully',
      data: customerResponse
    } as ApiResponse);

  } catch (error: any) {
    console.error('Update customer error:', error);
    
    // Handle validation errors
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
      message: 'Failed to update customer details',
      error: error.message
    } as ApiResponse);
  }
};
