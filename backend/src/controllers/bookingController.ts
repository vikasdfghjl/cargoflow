import { Response } from 'express';
import mongoose from 'mongoose';
import Booking, { IBooking as IBookingModel } from '../models/Booking';
import { AuthRequest, ApiResponse, IBooking } from '../types';
import { BookingDraftService, StatelessSessionService } from '../services/StatelessSessionService';
import { 
  asyncHandler, 
  ValidationError, 
  AuthenticationError, 
  NotFoundError 
} from '../middleware/errorHandler';
import { 
  validateRequired, 
  validateObjectId, 
  ERROR_MESSAGES 
} from '../utils/errorUtils';
import { 
  sendSuccessResponse, 
  sendCreatedResponse, 
  RESPONSE_MESSAGES 
} from '../utils/responseUtils';

// Pricing calculation function
function calculateBookingPrice(bookingData: any) {
  const baseRates = {
    standard: 250,
    express: 450,
    same_day: 750
  };
  
  const baseCost = baseRates[bookingData.serviceType as keyof typeof baseRates] || baseRates.standard;
  
  // Weight-based charges (if weight > 5kg, apply 50% extra)
  const weightCharges = bookingData.weight > 5 ? baseCost * 0.5 : 0;
  
  // Insurance charges (2% of declared value, minimum ₹50)
  let insuranceCharges = 0;
  if (bookingData.insurance && bookingData.insuranceValue) {
    insuranceCharges = Math.max(bookingData.insuranceValue * 0.02, 50);
  }
  
  const totalCost = baseCost + weightCharges + insuranceCharges;
  
  return {
    baseCost,
    weightCharges,
    insuranceCharges,
    totalCost: Math.round(totalCost)
  };
}

// Create a new booking
export const createBooking = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AuthenticationError(ERROR_MESSAGES.UNAUTHORIZED);
  }

  const bookingData = req.body;
  console.log('Received booking data:', JSON.stringify(bookingData, null, 2));
  
  // For customers, automatically set customerId to their own user ID
  // For admins, they can specify customerId or it defaults to their own ID
  if (req.user?.userType === 'customer') {
    bookingData.customerId = userId;
  } else if (req.user?.userType === 'admin' && !bookingData.customerId) {
    bookingData.customerId = userId;
  }
  
  // Validate required fields
  validateRequired({
    customerId: bookingData.customerId,
    pickupAddress: bookingData.pickupAddress,
    deliveryAddress: bookingData.deliveryAddress,
    serviceType: bookingData.serviceType,
    weight: bookingData.weight,
    packageType: bookingData.packageType,
    pickupDate: bookingData.pickupDate
  });

  // Validate that user can only create bookings for themselves (unless admin)
  if (req.user?.userType !== 'admin' && bookingData.customerId !== userId) {
    throw new AuthenticationError('You can only create bookings for yourself');
  }

  // Validate pickup address
  if (!bookingData.pickupAddress || typeof bookingData.pickupAddress !== 'object') {
    throw new ValidationError('pickupAddress is required and must be an object');
  }

  const pickupRequired = ['address', 'contactName', 'phone', 'city', 'postalCode'];
  for (const field of pickupRequired) {
    if (!bookingData.pickupAddress[field] || bookingData.pickupAddress[field].trim() === '') {
      throw new ValidationError(`pickupAddress.${field} is required and cannot be empty`);
    }
  }

  // Validate delivery address
  if (!bookingData.deliveryAddress || typeof bookingData.deliveryAddress !== 'object') {
    throw new ValidationError('deliveryAddress is required and must be an object');
  }

  const deliveryRequired = ['address', 'contactName', 'phone', 'city', 'postalCode'];
  for (const field of deliveryRequired) {
    if (!bookingData.deliveryAddress[field] || bookingData.deliveryAddress[field].trim() === '') {
      throw new ValidationError(`deliveryAddress.${field} is required and cannot be empty`);
    }
  }

  // Validate other fields
  if (!bookingData.weight || bookingData.weight <= 0) {
    throw new ValidationError('weight is required and must be greater than 0');
  }

  // Calculate pricing
  const pricing = calculateBookingPrice(bookingData);
  
  // Create booking document
  const bookingDoc = new Booking({
    customerId: userId,
    pickupAddress: {
      address: bookingData.pickupAddress.address.trim(),
      contactName: bookingData.pickupAddress.contactName.trim(),
      phone: bookingData.pickupAddress.phone.trim(),
      city: bookingData.pickupAddress.city.trim(),
      postalCode: bookingData.pickupAddress.postalCode.trim(),
      instructions: bookingData.pickupAddress.instructions?.trim()
    },
    deliveryAddress: {
      address: bookingData.deliveryAddress.address.trim(),
      contactName: bookingData.deliveryAddress.contactName.trim(),
      phone: bookingData.deliveryAddress.phone.trim(),
      city: bookingData.deliveryAddress.city.trim(),
      postalCode: bookingData.deliveryAddress.postalCode.trim(),
      instructions: bookingData.deliveryAddress.instructions?.trim()
    },
    packageType: bookingData.packageType,
    weight: parseFloat(bookingData.weight),
    serviceType: bookingData.serviceType || 'standard',
    pickupDate: new Date(bookingData.pickupDate),
    specialInstructions: bookingData.specialInstructions?.trim(),
    insurance: Boolean(bookingData.insurance),
    insuranceValue: bookingData.insuranceValue ? parseFloat(bookingData.insuranceValue) : undefined,
    baseCost: pricing.baseCost,
    weightCharges: pricing.weightCharges,
    insuranceCharges: pricing.insuranceCharges,
    totalCost: pricing.totalCost,
    status: 'pending'
  });

  // Save booking and handle draft cleanup
  const [savedBooking, userSessions] = await Promise.all([
    bookingDoc.save(),
    StatelessSessionService.getUserSessions(userId, 'booking_draft')
  ]);

  // Clean up drafts asynchronously
  if (userSessions.length > 0) {
    Promise.all(
      userSessions.map(session => 
        StatelessSessionService.deleteSession(session.sessionId)
      )
    ).catch(error => {
      console.error('Draft cleanup error (non-blocking):', error);
    });
  }

  // Send successful response
  sendCreatedResponse(res, RESPONSE_MESSAGES.CREATED, {
    id: savedBooking._id.toString(),
    bookingNumber: savedBooking.bookingNumber,
    status: savedBooking.status,
    totalCost: savedBooking.totalCost,
    trackingNumber: savedBooking.trackingNumber,
    estimatedDeliveryDate: savedBooking.estimatedDeliveryDate,
    pickupDate: savedBooking.pickupDate
  });
});

// Save booking draft using stateless sessions
export const saveDraft = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      } as ApiResponse);
      return;
    }

    const { draftId } = req.params;
    const draftData = req.body;

    const savedDraftId = await BookingDraftService.saveDraft(userId, draftData, draftId);

    res.status(200).json({
      success: true,
      message: 'Draft saved successfully',
      data: { draftId: savedDraftId }
    } as ApiResponse<{ draftId: string }>);
  } catch (error) {
    console.error('Save draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    } as ApiResponse);
  }
};

// Get booking draft
export const getDraft = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      } as ApiResponse);
      return;
    }

    const { draftId } = req.params;
    if (!draftId) {
      res.status(400).json({
        success: false,
        message: 'Draft ID is required'
      } as ApiResponse);
      return;
    }

    const draftData = await BookingDraftService.getDraft(draftId);

    if (!draftData) {
      res.status(404).json({
        success: false,
        message: 'Draft not found or expired'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Draft retrieved successfully',
      data: draftData
    } as ApiResponse);
  } catch (error) {
    console.error('Get draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    } as ApiResponse);
  }
};

// Get user drafts
export const getUserDrafts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      } as ApiResponse);
      return;
    }

    const drafts = await BookingDraftService.getUserDrafts(userId);

    res.status(200).json({
      success: true,
      message: 'Drafts retrieved successfully',
      data: drafts
    } as ApiResponse);
  } catch (error) {
    console.error('Get user drafts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    } as ApiResponse);
  }
};

// Delete draft
export const deleteDraft = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      } as ApiResponse);
      return;
    }

    const { draftId } = req.params;
    if (!draftId) {
      res.status(400).json({
        success: false,
        message: 'Draft ID is required'
      } as ApiResponse);
      return;
    }

    const deleted = await BookingDraftService.deleteDraft(draftId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Draft not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Draft deleted successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Delete draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    } as ApiResponse);
  }
};

// Auto-save draft
export const autoSaveDraft = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      } as ApiResponse);
      return;
    }

    const partialData = req.body;

    const session = await BookingDraftService.autoSaveDraft(userId, partialData);

    res.status(200).json({
      success: true,
      message: 'Draft auto-saved successfully',
      data: {
        draftId: session.sessionId,
        lastSaved: session.lastAccessed
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Auto-save draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    } as ApiResponse);
  }
};

// Get booking by ID
export const getBookingById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      } as ApiResponse);
      return;
    }

    const { id: bookingId } = req.params;

    // First, check if booking exists
    const booking = await Booking.findById(bookingId)
      .populate('customerId', 'firstName lastName email')
      .populate('driverId', 'firstName lastName phone')
      .lean();

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found'
      } as ApiResponse);
      return;
    }

    // Then check if it belongs to the user
    if (booking.customerId._id.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Booking retrieved successfully',
      data: booking
    } as ApiResponse);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    } as ApiResponse);
  }
};

// Get user bookings
export const getUserBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      } as ApiResponse);
      return;
    }

    // Get query parameters for pagination and filtering
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { customerId: userId };
    if (status && status !== 'all') {
      query.status = status;
    }

    // Parallel async operations for better performance
    const [bookings, totalBookings] = await Promise.all([
      // Get bookings with pagination
      Booking.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('customerId', 'firstName lastName email')
        .lean()
        .exec(),
      
      // Get total count for pagination
      Booking.countDocuments(query).exec()
    ]);

    const totalPages = Math.ceil(totalBookings / limit);

    res.status(200).json({
      success: true,
      message: 'Bookings retrieved successfully',
      data: {
        bookings,
        pagination: {
          currentPage: page,
          totalPages,
          totalBookings,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    } as ApiResponse);
  }
};

// Admin function: Get all bookings
export const getAllBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Admin access is now handled by middleware, so no need to check again
    
    // Get query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Parallel async operations for better performance
    const [bookings, totalBookings, stats] = await Promise.all([
      // Get bookings with pagination
      Booking.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('customerId', 'firstName lastName email companyName')
        .populate('driverId', 'firstName lastName phone')
        .lean()
        .exec(),
      
      // Get total count for pagination
      Booking.countDocuments(query).exec(),
      
      // Get booking statistics
      (Booking as any).getBookingStats()
    ]);

    const totalPages = Math.ceil(totalBookings / limit);

    res.status(200).json({
      success: true,
      message: 'All bookings retrieved successfully',
      data: {
        bookings,
        pagination: {
          currentPage: page,
          totalPages,
          totalBookings,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        statistics: stats
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    } as ApiResponse);
  }
};

// Admin function: Update booking status
export const updateBookingStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userType = req.user?.userType;
    if (userType !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Admin access required'
      } as ApiResponse);
      return;
    }

    const { id: bookingId } = req.params;
    const { status, driverId, notes } = req.body;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'failed'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid status'
      } as ApiResponse);
      return;
    }

    // Update booking
    const updateData: any = { status };
    if (driverId) updateData.driverId = driverId;
    if (status === 'picked_up' && !updateData.pickedUpAt) updateData.pickedUpAt = new Date();
    if (status === 'delivered' && !updateData.deliveredAt) updateData.deliveredAt = new Date();

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true }
    ).populate('customerId', 'firstName lastName email');

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking
    } as ApiResponse);
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    } as ApiResponse);
  }
};