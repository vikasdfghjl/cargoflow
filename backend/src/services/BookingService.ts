import { Types } from 'mongoose';
import Booking, { IBooking } from '../models/Booking';
import BookingRepository from '../repositories/BookingRepository';
import { 
  ValidationError, 
  NotFoundError,
  ConflictError 
} from '../middleware/errorHandler';

interface BookingData {
  customerId: string;
  pickupAddress: {
    address: string;
    contactName: string;
    phone: string;
    city: string;
    postalCode: string;
  };
  deliveryAddress: {
    address: string;
    contactName: string;
    phone: string;
    city: string;
    postalCode: string;
  };
  packageType: string;
  weight: number;
  serviceType: 'standard' | 'express' | 'same_day';
  pickupDate: Date;
  specialInstructions?: string;
  insurance?: boolean;
  insuranceValue?: number;
}

interface BookingQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  customerId?: string;
}

interface BookingResponse {
  id: string;
  bookingNumber: string;
  trackingNumber: string;
  customerId: string;
  pickupAddress: any;
  deliveryAddress: any;
  packageType: string;
  weight: number;
  serviceType: string;
  status: string;
  pickupDate: Date;
  totalCost: number;
  specialInstructions?: string;
  insurance?: boolean;
  insuranceValue?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class BookingService {
  /**
   * Generate unique booking number
   */
  private static generateBookingNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    
    return `CB-${year}${month}${day}-${random}`;
  }

  /**
   * Generate unique tracking number
   */
  private static generateTrackingNumber(): string {
    const prefix = 'CPP';
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
    
    return `${prefix}${timestamp}${random}`;
  }

  /**
   * Calculate shipping cost based on weight and service type
   */
  private static calculateShippingCost(weight: number, serviceType: string): { baseCost: number; weightCharges: number; totalCost: number } {
    const baseRates = {
      standard: 10,
      express: 20,
      same_day: 35
    };

    const baseCost = baseRates[serviceType as keyof typeof baseRates] || baseRates.standard;
    const weightCharges = Math.ceil(weight) * 5; // $5 per kg
    const totalCost = baseCost + weightCharges;
    
    return { baseCost, weightCharges, totalCost };
  }

  /**
   * Convert booking document to response object
   */
  private static toBookingResponse(booking: IBooking): BookingResponse {
    return {
      id: (booking._id as Types.ObjectId).toString(),
      bookingNumber: booking.bookingNumber,
      trackingNumber: booking.trackingNumber || '',
      customerId: (booking.customerId as Types.ObjectId).toString(),
      pickupAddress: booking.pickupAddress,
      deliveryAddress: booking.deliveryAddress,
      packageType: booking.packageType,
      weight: booking.weight,
      serviceType: booking.serviceType,
      status: booking.status,
      pickupDate: booking.pickupDate,
      totalCost: booking.totalCost,
      ...(booking.specialInstructions && { specialInstructions: booking.specialInstructions }),
      ...(booking.insurance !== undefined && { insurance: booking.insurance }),
      ...(booking.insuranceValue !== undefined && { insuranceValue: booking.insuranceValue }),
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    };
  }

  /**
   * Create a new booking
   */
  static async createBooking(bookingData: BookingData): Promise<BookingResponse> {
    // Generate unique identifiers
    const bookingNumber = this.generateBookingNumber();
    const trackingNumber = this.generateTrackingNumber();
    
    // Calculate cost breakdown
    const costBreakdown = this.calculateShippingCost(bookingData.weight, bookingData.serviceType);

    // Create booking
    const booking = await BookingRepository.create({
      ...bookingData,
      customerId: new Types.ObjectId(bookingData.customerId),
      bookingNumber,
      trackingNumber,
      baseCost: costBreakdown.baseCost,
      weightCharges: costBreakdown.weightCharges,
      totalCost: costBreakdown.totalCost,
      status: 'pending'
    });

    return this.toBookingResponse(booking);
  }

  /**
   * Get booking by ID
   */
  static async getBookingById(bookingId: string, customerId?: string): Promise<BookingResponse> {
    let booking;
    
    if (customerId) {
      booking = await BookingRepository.findByIdAndCustomerId(bookingId, customerId);
    } else {
      booking = await BookingRepository.findById(bookingId);
    }

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    return this.toBookingResponse(booking);
  }

  /**
   * Get bookings with filtering and pagination
   */
  static async getBookings(query: BookingQuery): Promise<{ bookings: BookingResponse[]; totalCount: number; pagination: any }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      customerId
    } = query;

    // Build filter object
    const filter: any = {};
    if (status) filter.status = status;
    if (customerId) filter.customerId = new Types.ObjectId(customerId);

    // Execute queries using repository
    const { bookings, totalCount } = await BookingRepository.findWithPagination(
      filter,
      page,
      limit,
      sortBy,
      sortOrder
    );

    // Convert to response format
    const bookingResponses = bookings.map(booking => this.toBookingResponse(booking as any));

    // Pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const pagination = {
      currentPage: page,
      totalPages,
      totalCount,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };

    return {
      bookings: bookingResponses,
      totalCount,
      pagination
    };
  }

  /**
   * Update booking status
   */
  static async updateBookingStatus(
    bookingId: string, 
    newStatus: string, 
    driverId?: string
  ): Promise<BookingResponse> {
    const updateData: any = { 
      status: newStatus
    };
    
    if (driverId) {
      updateData.driverId = driverId;
    }

    const booking = await BookingRepository.updateById(bookingId, updateData);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    return this.toBookingResponse(booking as any);
  }

  /**
   * Get booking by tracking number
   */
  static async getBookingByTrackingNumber(trackingNumber: string): Promise<BookingResponse> {
    const booking = await BookingRepository.findByTrackingNumber(trackingNumber);
    if (!booking) {
      throw new NotFoundError('Booking not found with this tracking number');
    }

    return this.toBookingResponse(booking as any);
  }

  /**
   * Cancel booking
   */
  static async cancelBooking(bookingId: string, customerId?: string): Promise<BookingResponse> {
    let booking;
    
    if (customerId) {
      booking = await BookingRepository.findByIdAndCustomerId(bookingId, customerId);
    } else {
      booking = await BookingRepository.findById(bookingId);
    }

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Check if booking can be cancelled
    if (['delivered', 'cancelled'].includes(booking.status)) {
      throw new ConflictError(`Cannot cancel booking with status: ${booking.status}`);
    }

    const updatedBooking = await BookingRepository.updateById(bookingId, { status: 'cancelled' });
    if (!updatedBooking) {
      throw new NotFoundError('Booking not found');
    }

    return this.toBookingResponse(updatedBooking as any);
  }

  /**
   * Get booking statistics
   */
  static async getBookingStats(customerId?: string): Promise<any> {
    return BookingRepository.getBookingStats(customerId);
  }

  /**
   * Get booking revenue analytics
   */
  static async getRevenueAnalytics(startDate: Date, endDate: Date, customerId?: string): Promise<any> {
    return BookingRepository.getRevenueByDateRange(startDate, endDate, customerId);
  }
}

export default BookingService;
