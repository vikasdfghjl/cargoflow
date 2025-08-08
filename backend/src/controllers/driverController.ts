import { Request, Response, NextFunction } from 'express';
import DriverService from '../services/DriverService';
import Driver from '../models/Driver';
import Booking from '../models/Booking';
import { ApiResponse, AuthRequest } from '../types';
import { 
  asyncHandler, 
  ValidationError, 
  AuthenticationError, 
  NotFoundError 
} from '../middleware/errorHandler';
import { 
  validateRequired, 
  ERROR_MESSAGES 
} from '../utils/errorUtils';
import { 
  sendSuccessResponse, 
  sendCreatedResponse, 
  RESPONSE_MESSAGES 
} from '../utils/responseUtils';

interface AuthenticatedRequest extends AuthRequest {}

export const createDriver = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const {
    firstName,
    lastName,
    email,
    phone,
    licenseNumber,
    licenseExpiry,
    experience,
    vehicle,
    certifications,
    documents
  } = req.body;

  // Validate required fields
  validateRequired({
    firstName,
    lastName,
    email,
    phone,
    licenseNumber,
    licenseExpiry,
    experience,
    vehicle,
    documents
  });

  // Validate vehicle details
  validateRequired({
    vehicleNumber: vehicle?.number,
    vehicleType: vehicle?.type,
    vehicleModel: vehicle?.model,
    vehicleCapacity: vehicle?.capacity
  });

  // Validate documents
  validateRequired({
    licenseDocument: documents?.license,
    insuranceDocument: documents?.insurance,
    registrationDocument: documents?.registration
  });

  const driverData = {
    firstName,
    lastName,
    email,
    phone,
    licenseNumber,
    licenseExpiry: new Date(licenseExpiry),
    experience: Number(experience),
    vehicle: {
      number: vehicle.number,
      type: vehicle.type,
      model: vehicle.model,
      capacity: Number(vehicle.capacity)
    },
    certifications: certifications || [],
    documents
  };

  const driver = await DriverService.createDriver(driverData);

  sendCreatedResponse(res, 'Driver created successfully', driver);
});

export const getAllDrivers = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const {
    status,
    vehicleType,
    isAvailable,
    minRating,
    minExperience,
    latitude,
    longitude,
    radius,
    page,
    limit,
    sortBy,
    sortOrder
  } = req.query;

  const filters: any = {};
  const options: any = {};

  // Build filters
  if (status) {
    filters.status = status as string;
  }
  
  if (vehicleType) {
    filters.vehicleType = vehicleType as string;
  }
  
  if (isAvailable !== undefined) {
    filters.isAvailable = isAvailable === 'true';
  }
  
  if (minRating) {
    filters.minRating = Number(minRating);
  }
  
  if (minExperience) {
    filters.minExperience = Number(minExperience);
  }

  // Location filtering
  if (latitude && longitude) {
    filters.location = {
      latitude: Number(latitude),
      longitude: Number(longitude),
      radius: radius ? Number(radius) : 50
    };
  }

  // Build pagination options
  if (page) {
    options.page = Number(page);
  }
  
  if (limit) {
    options.limit = Number(limit);
  }
  
  if (sortBy) {
    options.sortBy = sortBy as string;
  }
  
  if (sortOrder) {
    options.sortOrder = sortOrder as 'asc' | 'desc';
  }

  const result = await DriverService.getAllDrivers(filters, options);

  sendSuccessResponse(res, 'Drivers retrieved successfully', result);
});

export const getDriverById = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { driverId } = req.params;

  if (!driverId) {
    throw new ValidationError('Driver ID is required');
  }

  const driver = await DriverService.getDriverById(driverId);

  sendSuccessResponse(res, 'Driver retrieved successfully', driver);
});

export const updateDriver = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { driverId } = req.params;
  const updateData = req.body;

  if (!driverId) {
    throw new ValidationError('Driver ID is required');
  }

  // Convert date strings if present
  if (updateData.licenseExpiry) {
    updateData.licenseExpiry = new Date(updateData.licenseExpiry);
  }

  // Convert number strings if present
  if (updateData.experience) {
    updateData.experience = Number(updateData.experience);
  }

  if (updateData.vehicle?.capacity) {
    updateData.vehicle.capacity = Number(updateData.vehicle.capacity);
  }

  const driver = await DriverService.updateDriver(driverId, updateData);

  sendSuccessResponse(res, 'Driver updated successfully', driver);
});

export const deleteDriver = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { driverId } = req.params;

  if (!driverId) {
    throw new ValidationError('Driver ID is required');
  }

  const result = await DriverService.deleteDriver(driverId);

  sendSuccessResponse(res, 'Driver deleted successfully', result);
});

export const updateDriverStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { driverId } = req.params;
  const { status } = req.body;

  if (!driverId) {
    throw new ValidationError('Driver ID is required');
  }

  validateRequired({ status });

  if (!['active', 'inactive', 'suspended'].includes(status)) {
    throw new ValidationError('Status must be one of: active, inactive, suspended');
  }

  const driver = await DriverService.updateDriverStatus(driverId, status);

  sendSuccessResponse(res, 'Driver status updated successfully', driver);
});

export const updateDriverLocation = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { driverId } = req.params;
  const { latitude, longitude, address } = req.body;

  if (!driverId) {
    throw new ValidationError('Driver ID is required');
  }

  validateRequired({ latitude, longitude });

  // Validate coordinate ranges
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (lat < -90 || lat > 90) {
    throw new ValidationError('Latitude must be between -90 and 90');
  }

  if (lng < -180 || lng > 180) {
    throw new ValidationError('Longitude must be between -180 and 180');
  }

  const driver = await DriverService.updateDriverLocation(driverId, lat, lng, address);

  sendSuccessResponse(res, 'Driver location updated successfully', driver);
});

export const updateDriverAvailability = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { driverId } = req.params;
  const { isAvailable, availableFrom, availableTo } = req.body;

  if (!driverId) {
    throw new ValidationError('Driver ID is required');
  }

  validateRequired({ isAvailable });

  const availability: any = {
    isAvailable: Boolean(isAvailable)
  };

  if (availableFrom) {
    availability.availableFrom = new Date(availableFrom);
  }

  if (availableTo) {
    availability.availableTo = new Date(availableTo);
  }

  // Validate date range if both dates are provided
  if (availability.availableFrom && availability.availableTo) {
    if (availability.availableFrom >= availability.availableTo) {
      throw new ValidationError('Available from date must be before available to date');
    }
  }

  const driver = await DriverService.updateDriverAvailability(driverId, availability);

  sendSuccessResponse(res, 'Driver availability updated successfully', driver);
});

export const getAvailableDrivers = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { latitude, longitude, vehicleType, minCapacity, radius } = req.query;

  if (!latitude || !longitude) {
    throw new ValidationError('Latitude and longitude are required');
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (lat < -90 || lat > 90) {
    throw new ValidationError('Latitude must be between -90 and 90');
  }

  if (lng < -180 || lng > 180) {
    throw new ValidationError('Longitude must be between -180 and 180');
  }

  const drivers = await DriverService.getAvailableDrivers(
    lat,
    lng,
    vehicleType as any,
    minCapacity ? Number(minCapacity) : undefined,
    radius ? Number(radius) : undefined
  );

  sendSuccessResponse(res, 'Available drivers retrieved successfully', drivers);
});

export const getDriverStatistics = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const stats = await DriverService.getDriverStatistics();

  sendSuccessResponse(res, 'Driver statistics retrieved successfully', stats);
});

export const assignDriverToBooking = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const { driverId, bookingId } = req.body;

  validateRequired({ driverId, bookingId });

  // Verify driver exists and is available
  const driver = await DriverService.getDriverById(driverId);
  if (!driver) {
    throw new NotFoundError('Driver not found');
  }

  if (driver.status !== 'active') {
    throw new ValidationError('Driver must be active to receive assignments');
  }

  // Find the booking and verify it exists
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  // Only allow assignment to bookings that are confirmed or already assigned to drivers (for reassignment)
  const allowedStatuses = ['confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];
  if (!allowedStatuses.includes(booking.status)) {
    throw new ValidationError('Only confirmed or in-progress bookings can be assigned to drivers');
  }

  const previousDriverId = booking.driverId;
  const wasDelivered = booking.status === 'delivered';
  const isReassignment = !!previousDriverId && previousDriverId.toString() !== driverId;

  // Assign the driver to the booking
  booking.driverId = driverId as any;
  // Don't change status if it's already in progress or delivered
  if (booking.status === 'confirmed') {
    booking.status = 'picked_up'; // Update status to indicate driver assignment only for confirmed bookings
  }
  await booking.save();

  // Handle delivery count updates if this was a reassignment of a delivered booking
  if (wasDelivered && isReassignment) {
    try {
      // Decrement previous driver's delivery count (with safety check)
      const previousDriver = await Driver.findById(previousDriverId);
      if (previousDriver && previousDriver.totalDeliveries > 0) {
        await Driver.findByIdAndUpdate(
          previousDriverId,
          { $inc: { totalDeliveries: -1 } },
          { new: true }
        );
      }

      // Increment new driver's delivery count
      await Driver.findByIdAndUpdate(
        driverId,
        { $inc: { totalDeliveries: 1 } },
        { new: true }
      );
    } catch (driverUpdateError) {
      console.error('Error updating driver total deliveries during reassignment:', driverUpdateError);
      // Continue execution even if driver update fails
    }
  }

  // Optionally update driver availability
  // You might want to set driver as unavailable or busy
  
  sendSuccessResponse(res, 'Driver assigned to booking successfully', {
    driverId,
    bookingId,
    bookingNumber: booking.bookingNumber,
    assignedAt: new Date(),
    status: booking.status
  });
});

export const getDriverBookings = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { driverId } = req.params;
  const { status, page = 1, limit = 10 } = req.query;

  if (!driverId) {
    throw new ValidationError('Driver ID is required');
  }

  // Verify driver exists
  const driver = await DriverService.getDriverById(driverId);
  if (!driver) {
    throw new NotFoundError('Driver not found');
  }

  // Build query
  const query: any = { driverId };
  if (status && status !== 'all') {
    query.status = status;
  }

  // Calculate pagination
  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 10;
  const skip = (pageNum - 1) * limitNum;

  // Query bookings with population
  const [bookings, totalItems] = await Promise.all([
    Booking.find(query)
      .populate('customerId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Booking.countDocuments(query)
  ]);

  const totalPages = Math.ceil(totalItems / limitNum);

  sendSuccessResponse(res, 'Driver bookings retrieved successfully', {
    driverId,
    bookings,
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalItems,
      itemsPerPage: limitNum
    }
  });
});

export const getDriverPerformance = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { driverId } = req.params;
  const { startDate, endDate } = req.query;

  if (!driverId) {
    throw new ValidationError('Driver ID is required');
  }

  // TODO: Implement performance metrics calculation
  // This would analyze completed bookings, ratings, on-time delivery, etc.

  sendSuccessResponse(res, 'Driver performance retrieved successfully', {
    driverId,
    period: {
      startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: endDate || new Date()
    },
    metrics: {
      totalDeliveries: 0,
      completedDeliveries: 0,
      averageRating: 0,
      onTimeDeliveryRate: 0,
      customerSatisfactionScore: 0
    }
  });
});
