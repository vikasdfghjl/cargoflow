import { Types } from 'mongoose';
import Driver, { IDriver } from '../models/Driver';
import { 
  ValidationError, 
  NotFoundError, 
  ConflictError 
} from '../middleware/errorHandler';

interface CreateDriverData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: Date;
  experience: number;
  vehicle: {
    number: string;
    type: 'truck' | 'van' | 'bike' | 'car';
    model: string;
    capacity: number;
  };
  certifications?: string[];
  documents: {
    license: string;
    insurance: string;
    registration: string;
  };
}

interface UpdateDriverData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  licenseNumber?: string;
  licenseExpiry?: Date;
  experience?: number;
  status?: 'active' | 'inactive' | 'suspended';
  vehicle?: {
    number?: string;
    type?: 'truck' | 'van' | 'bike' | 'car';
    model?: string;
    capacity?: number;
  };
  certifications?: string[];
  documents?: {
    license?: string;
    insurance?: string;
    registration?: string;
  };
  availability?: {
    isAvailable?: boolean;
    availableFrom?: Date;
    availableTo?: Date;
  };
}

interface DriverFilters {
  status?: 'active' | 'inactive' | 'suspended';
  vehicleType?: 'truck' | 'van' | 'bike' | 'car';
  isAvailable?: boolean;
  minRating?: number;
  minExperience?: number;
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // in kilometers
  };
}

interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class DriverService {
  /**
   * Convert driver document to response object
   */
  private static formatDriverResponse(driver: IDriver) {
    return {
      id: driver._id.toString(),
      firstName: driver.firstName,
      lastName: driver.lastName,
      fullName: `${driver.firstName} ${driver.lastName}`,
      email: driver.email,
      phone: driver.phone,
      licenseNumber: driver.licenseNumber,
      licenseExpiry: driver.licenseExpiry,
      experience: driver.experience,
      rating: driver.rating,
      totalDeliveries: driver.totalDeliveries,
      status: driver.status,
      vehicle: driver.vehicle,
      currentLocation: driver.currentLocation,
      certifications: driver.certifications,
      documents: driver.documents,
      availability: driver.availability,
      createdAt: driver.createdAt,
      updatedAt: driver.updatedAt
    };
  }

  /**
   * Create a new driver
   */
  static async createDriver(driverData: CreateDriverData) {
    try {
      // Check if email already exists
      const existingDriverByEmail = await Driver.findOne({ email: driverData.email });
      if (existingDriverByEmail) {
        throw new ConflictError('Driver with this email already exists');
      }

      // Check if license number already exists
      const existingDriverByLicense = await Driver.findOne({ 
        licenseNumber: driverData.licenseNumber 
      });
      if (existingDriverByLicense) {
        throw new ConflictError('Driver with this license number already exists');
      }

      // Check if vehicle number already exists
      const existingDriverByVehicle = await Driver.findOne({ 
        'vehicle.number': driverData.vehicle.number 
      });
      if (existingDriverByVehicle) {
        throw new ConflictError('Driver with this vehicle number already exists');
      }

      // Validate license expiry date
      if (new Date(driverData.licenseExpiry) <= new Date()) {
        throw new ValidationError('License expiry date must be in the future');
      }

      const driver = new Driver(driverData);
      await driver.save();

      return this.formatDriverResponse(driver);
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((err: any) => err.message);
        throw new ValidationError(messages.join(', '));
      }
      throw error;
    }
  }

  /**
   * Get all drivers with filters and pagination
   */
  static async getAllDrivers(filters: DriverFilters = {}, options: PaginationOptions = {}) {
    const {
      status,
      vehicleType,
      isAvailable,
      minRating,
      minExperience,
      location
    } = filters;

    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    // Build query
    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (vehicleType) {
      query['vehicle.type'] = vehicleType;
    }

    if (typeof isAvailable === 'boolean') {
      query['availability.isAvailable'] = isAvailable;
    }

    if (minRating) {
      query.rating = { $gte: minRating };
    }

    if (minExperience) {
      query.experience = { $gte: minExperience };
    }

    // Location-based filtering (simplified - in production, use $geoNear)
    if (location) {
      query['currentLocation.latitude'] = {
        $gte: location.latitude - (location.radius / 111), // Rough conversion
        $lte: location.latitude + (location.radius / 111)
      };
      query['currentLocation.longitude'] = {
        $gte: location.longitude - (location.radius / 111),
        $lte: location.longitude + (location.radius / 111)
      };
    }

    const skip = (page - 1) * limit;
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [drivers, total] = await Promise.all([
      Driver.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Driver.countDocuments(query)
    ]);

    const formattedDrivers = drivers.map(driver => this.formatDriverResponse(driver as IDriver));

    return {
      drivers: formattedDrivers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    };
  }

  /**
   * Get driver by ID
   */
  static async getDriverById(driverId: string) {
    if (!Types.ObjectId.isValid(driverId)) {
      throw new ValidationError('Invalid driver ID format');
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      throw new NotFoundError('Driver not found');
    }

    return this.formatDriverResponse(driver);
  }

  /**
   * Update driver
   */
  static async updateDriver(driverId: string, updateData: UpdateDriverData) {
    if (!Types.ObjectId.isValid(driverId)) {
      throw new ValidationError('Invalid driver ID format');
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      throw new NotFoundError('Driver not found');
    }

    // Check for conflicts if updating unique fields
    if (updateData.email && updateData.email !== driver.email) {
      const existingDriver = await Driver.findOne({ email: updateData.email });
      if (existingDriver) {
        throw new ConflictError('Driver with this email already exists');
      }
    }

    if (updateData.licenseNumber && updateData.licenseNumber !== driver.licenseNumber) {
      const existingDriver = await Driver.findOne({ licenseNumber: updateData.licenseNumber });
      if (existingDriver) {
        throw new ConflictError('Driver with this license number already exists');
      }
    }

    if (updateData.vehicle?.number && updateData.vehicle.number !== driver.vehicle.number) {
      const existingDriver = await Driver.findOne({ 'vehicle.number': updateData.vehicle.number });
      if (existingDriver) {
        throw new ConflictError('Driver with this vehicle number already exists');
      }
    }

    // Validate license expiry if being updated
    if (updateData.licenseExpiry && new Date(updateData.licenseExpiry) <= new Date()) {
      throw new ValidationError('License expiry date must be in the future');
    }

    try {
      const updatedDriver = await Driver.findByIdAndUpdate(
        driverId,
        updateData,
        { new: true, runValidators: true }
      );

      return this.formatDriverResponse(updatedDriver!);
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((err: any) => err.message);
        throw new ValidationError(messages.join(', '));
      }
      throw error;
    }
  }

  /**
   * Delete driver
   */
  static async deleteDriver(driverId: string) {
    if (!Types.ObjectId.isValid(driverId)) {
      throw new ValidationError('Invalid driver ID format');
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      throw new NotFoundError('Driver not found');
    }

    await Driver.findByIdAndDelete(driverId);
    return { message: 'Driver deleted successfully' };
  }

  /**
   * Update driver status
   */
  static async updateDriverStatus(driverId: string, status: 'active' | 'inactive' | 'suspended') {
    if (!Types.ObjectId.isValid(driverId)) {
      throw new ValidationError('Invalid driver ID format');
    }

    const driver = await Driver.findByIdAndUpdate(
      driverId,
      { status },
      { new: true, runValidators: true }
    );

    if (!driver) {
      throw new NotFoundError('Driver not found');
    }

    return this.formatDriverResponse(driver);
  }

  /**
   * Update driver location
   */
  static async updateDriverLocation(
    driverId: string, 
    latitude: number, 
    longitude: number, 
    address?: string
  ) {
    if (!Types.ObjectId.isValid(driverId)) {
      throw new ValidationError('Invalid driver ID format');
    }

    const driver = await Driver.findByIdAndUpdate(
      driverId,
      {
        currentLocation: {
          latitude,
          longitude,
          address,
          lastUpdated: new Date()
        }
      },
      { new: true, runValidators: true }
    );

    if (!driver) {
      throw new NotFoundError('Driver not found');
    }

    return this.formatDriverResponse(driver);
  }

  /**
   * Update driver availability
   */
  static async updateDriverAvailability(
    driverId: string,
    availability: {
      isAvailable: boolean;
      availableFrom?: Date;
      availableTo?: Date;
    }
  ) {
    if (!Types.ObjectId.isValid(driverId)) {
      throw new ValidationError('Invalid driver ID format');
    }

    const driver = await Driver.findByIdAndUpdate(
      driverId,
      { availability },
      { new: true, runValidators: true }
    );

    if (!driver) {
      throw new NotFoundError('Driver not found');
    }

    return this.formatDriverResponse(driver);
  }

  /**
   * Get available drivers by location and vehicle requirements
   */
  static async getAvailableDrivers(
    latitude: number,
    longitude: number,
    vehicleType?: 'truck' | 'van' | 'bike' | 'car',
    minCapacity?: number,
    radius = 50
  ) {
    const query: any = {
      status: 'active',
      'availability.isAvailable': true
    };

    if (vehicleType) {
      query['vehicle.type'] = vehicleType;
    }

    if (minCapacity) {
      query['vehicle.capacity'] = { $gte: minCapacity };
    }

    // Location-based filtering (simplified)
    query['currentLocation.latitude'] = {
      $gte: latitude - (radius / 111),
      $lte: latitude + (radius / 111)
    };
    query['currentLocation.longitude'] = {
      $gte: longitude - (radius / 111),
      $lte: longitude + (radius / 111)
    };

    const drivers = await Driver.find(query)
      .sort({ rating: -1, totalDeliveries: -1 })
      .limit(20)
      .lean();

    return drivers.map(driver => this.formatDriverResponse(driver as IDriver));
  }

  /**
   * Get driver statistics
   */
  static async getDriverStatistics() {
    const stats = await Driver.aggregate([
      {
        $group: {
          _id: null,
          totalDrivers: { $sum: 1 },
          activeDrivers: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          availableDrivers: {
            $sum: { $cond: ['$availability.isAvailable', 1, 0] }
          },
          avgRating: { $avg: '$rating' },
          totalDeliveries: { $sum: '$totalDeliveries' }
        }
      }
    ]);

    const vehicleStats = await Driver.aggregate([
      {
        $group: {
          _id: '$vehicle.type',
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      overview: stats[0] || {
        totalDrivers: 0,
        activeDrivers: 0,
        availableDrivers: 0,
        avgRating: 0,
        totalDeliveries: 0
      },
      vehicleDistribution: vehicleStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };
  }
}

export default DriverService;
