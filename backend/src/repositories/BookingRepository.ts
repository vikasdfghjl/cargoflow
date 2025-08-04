import { Types, FilterQuery, UpdateQuery } from 'mongoose';
import Booking from '../models/Booking';
import { IBooking } from '../types';

export interface BookingCreateData {
  customerId: Types.ObjectId;
  bookingNumber: string;
  trackingNumber: string;
  pickupAddress: {
    address: string;
    contactName: string;
    phone: string;
    city: string;
    postalCode: string;
    instructions?: string;
  };
  deliveryAddress: {
    address: string;
    contactName: string;
    phone: string;
    city: string;
    postalCode: string;
    instructions?: string;
  };
  packageType: string;
  weight: number;
  serviceType: 'standard' | 'express' | 'same_day';
  status: string;
  pickupDate: Date;
  baseCost: number;
  weightCharges?: number;
  insuranceCharges?: number;
  totalCost: number;
  specialInstructions?: string;
  insurance?: boolean;
  insuranceValue?: number;
  driverId?: Types.ObjectId;
}

export interface BookingUpdateData {
  status?: string;
  driverId?: Types.ObjectId;
  deliveredAt?: Date;
  cancelledAt?: Date;
  estimatedDelivery?: Date;
  actualPickupTime?: Date;
  actualDeliveryTime?: Date;
  notes?: string;
}

/**
 * Repository for Booking data access operations
 * Handles all database interactions for Booking entities
 */
export class BookingRepository {
  /**
   * Create a new booking
   */
  static async create(bookingData: BookingCreateData): Promise<any> {
    return Booking.create(bookingData);
  }

  /**
   * Find booking by ID
   */
  static async findById(bookingId: string, lean: boolean = false): Promise<any> {
    if (lean) {
      return Booking.findById(bookingId).lean();
    }
    return Booking.findById(bookingId);
  }

  /**
   * Find booking by ID and customer ID
   */
  static async findByIdAndCustomerId(bookingId: string, customerId: string, lean: boolean = false): Promise<any> {
    const filter = { _id: bookingId, customerId: new Types.ObjectId(customerId) };
    if (lean) {
      return Booking.findOne(filter).lean();
    }
    return Booking.findOne(filter);
  }

  /**
   * Find booking by tracking number
   */
  static async findByTrackingNumber(trackingNumber: string, lean: boolean = false): Promise<any> {
    if (lean) {
      return Booking.findOne({ trackingNumber }).lean();
    }
    return Booking.findOne({ trackingNumber });
  }

  /**
   * Find bookings with filtering and pagination
   */
  static async findWithPagination(
    filter: FilterQuery<IBooking>,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ bookings: IBooking[]; totalCount: number }> {
    const skip = (page - 1) * limit;
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [bookings, totalCount] = await Promise.all([
      Booking.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Booking.countDocuments(filter)
    ]);

    return { bookings: bookings as any[], totalCount };
  }

  /**
   * Update booking by ID
   */
  static async updateById(bookingId: string, updateData: BookingUpdateData): Promise<IBooking | null> {
    return Booking.findByIdAndUpdate(
      bookingId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  /**
   * Delete booking by ID
   */
  static async deleteById(bookingId: string): Promise<IBooking | null> {
    return Booking.findByIdAndDelete(bookingId);
  }

  /**
   * Find bookings by customer ID
   */
  static async findByCustomerId(
    customerId: string,
    page: number = 1,
    limit: number = 10,
    status?: string
  ): Promise<{ bookings: IBooking[]; totalCount: number }> {
    const filter: FilterQuery<IBooking> = { customerId: new Types.ObjectId(customerId) };
    if (status) {
      filter.status = status;
    }

    return this.findWithPagination(filter, page, limit);
  }

  /**
   * Find bookings by status
   */
  static async findByStatus(
    status: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ bookings: IBooking[]; totalCount: number }> {
    const filter: FilterQuery<IBooking> = { status };
    return this.findWithPagination(filter, page, limit);
  }

  /**
   * Find bookings by driver ID
   */
  static async findByDriverId(
    driverId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ bookings: IBooking[]; totalCount: number }> {
    const filter: FilterQuery<IBooking> = { driverId: new Types.ObjectId(driverId) };
    return this.findWithPagination(filter, page, limit);
  }

  /**
   * Get booking statistics
   */
  static async getBookingStats(customerId?: string): Promise<{
    totalBookings: number;
    totalRevenue: number;
    statusBreakdown: { [key: string]: number };
    recentBookings: number;
  }> {
    const matchStage: any = {};
    if (customerId) {
      matchStage.customerId = new Types.ObjectId(customerId);
    }

    const stats = await Booking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$totalCost' },
          statusCounts: { $push: '$status' },
          recentBookings: {
            $sum: {
              $cond: {
                if: { $gte: ['$createdAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                then: 1,
                else: 0
              }
            }
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        totalBookings: 0,
        totalRevenue: 0,
        statusBreakdown: {},
        recentBookings: 0
      };
    }

    const result = stats[0];
    const statusBreakdown: { [key: string]: number } = {};
    
    result.statusCounts.forEach((status: string) => {
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    });

    return {
      totalBookings: result.totalBookings,
      totalRevenue: result.totalRevenue,
      statusBreakdown,
      recentBookings: result.recentBookings
    };
  }

  /**
   * Count bookings by filter
   */
  static async countDocuments(filter: FilterQuery<IBooking> = {}): Promise<number> {
    return Booking.countDocuments(filter);
  }

  /**
   * Check if booking exists
   */
  static async existsById(bookingId: string): Promise<boolean> {
    const booking = await Booking.findById(bookingId).lean();
    return !!booking;
  }

  /**
   * Check if booking number exists
   */
  static async existsByBookingNumber(bookingNumber: string): Promise<boolean> {
    const booking = await Booking.findOne({ bookingNumber }).lean();
    return !!booking;
  }

  /**
   * Check if tracking number exists
   */
  static async existsByTrackingNumber(trackingNumber: string): Promise<boolean> {
    const booking = await Booking.findOne({ trackingNumber }).lean();
    return !!booking;
  }

  /**
   * Find bookings within date range
   */
  static async findByDateRange(
    startDate: Date,
    endDate: Date,
    customerId?: string
  ): Promise<IBooking[]> {
    const filter: FilterQuery<IBooking> = {
      createdAt: { $gte: startDate, $lte: endDate }
    };

    if (customerId) {
      filter.customerId = new Types.ObjectId(customerId);
    }

    return Booking.find(filter).sort({ createdAt: -1 }).lean() as any;
  }

  /**
   * Search bookings by text
   */
  static async searchBookings(
    searchText: string,
    page: number = 1,
    limit: number = 10,
    customerId?: string
  ): Promise<{ bookings: IBooking[]; totalCount: number }> {
    const searchRegex = new RegExp(searchText, 'i');
    const filter: FilterQuery<IBooking> = {
      $or: [
        { bookingNumber: searchRegex },
        { trackingNumber: searchRegex },
        { 'pickupAddress.address': searchRegex },
        { 'deliveryAddress.address': searchRegex },
        { packageType: searchRegex }
      ]
    };

    if (customerId) {
      filter.customerId = new Types.ObjectId(customerId);
    }

    return this.findWithPagination(filter, page, limit);
  }

  /**
   * Get revenue by date range
   */
  static async getRevenueByDateRange(
    startDate: Date,
    endDate: Date,
    customerId?: string
  ): Promise<{ totalRevenue: number; bookingCount: number }> {
    const matchStage: any = {
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $nin: ['cancelled', 'failed'] }
    };

    if (customerId) {
      matchStage.customerId = new Types.ObjectId(customerId);
    }

    const result = await Booking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalCost' },
          bookingCount: { $sum: 1 }
        }
      }
    ]);

    return result[0] || { totalRevenue: 0, bookingCount: 0 };
  }

  /**
   * Bulk update bookings
   */
  static async bulkUpdate(filter: FilterQuery<IBooking>, update: UpdateQuery<IBooking>): Promise<any> {
    return Booking.updateMany(filter, update);
  }

  /**
   * Get bookings requiring attention (overdue, etc.)
   */
  static async getBookingsRequiringAttention(): Promise<IBooking[]> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return Booking.find({
      $or: [
        // Pending bookings older than 1 day
        { status: 'pending', createdAt: { $lt: oneDayAgo } },
        // In transit bookings older than expected delivery
        { 
          status: 'in_transit', 
          estimatedDelivery: { $lt: new Date() }
        }
      ]
    }).lean() as any;
  }
}

export default BookingRepository;
