import { Types, FilterQuery, UpdateQuery } from 'mongoose';
import Address from '../models/Address';
import { IAddress } from '../types';

export interface AddressCreateData {
  userId: Types.ObjectId;
  label: string;
  type: 'home' | 'office' | 'warehouse' | 'other';
  contactName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
  landmark?: string;
  instructions?: string;
}

export interface AddressUpdateData {
  label?: string;
  type?: 'home' | 'office' | 'warehouse' | 'other';
  contactName?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  isDefault?: boolean;
  landmark?: string;
  instructions?: string;
}

export interface AddressQueryOptions {
  lean?: boolean;
  sort?: any;
}

/**
 * Repository for Address data access operations
 * Handles all database interactions for Address entities
 */
export class AddressRepository {
  /**
   * Create a new address
   */
  static async create(addressData: AddressCreateData): Promise<IAddress> {
    return Address.create(addressData);
  }

  /**
   * Find address by ID
   */
  static async findById(addressId: string, lean: boolean = false): Promise<IAddress | null> {
    if (lean) {
      return Address.findById(addressId).lean() as Promise<IAddress | null>;
    }
    return Address.findById(addressId);
  }

  /**
   * Find address by ID and user ID
   */
  static async findByIdAndUserId(addressId: string, userId: string, lean: boolean = false): Promise<IAddress | null> {
    if (lean) {
      return Address.findOne({ 
        _id: addressId, 
        userId: new Types.ObjectId(userId) 
      }).lean() as Promise<IAddress | null>;
    }
    return Address.findOne({ 
      _id: addressId, 
      userId: new Types.ObjectId(userId) 
    });
  }

  /**
   * Find addresses by user ID
   */
  static async findByUserId(userId: string, sort: any = { isDefault: -1, createdAt: -1 }, lean: boolean = false): Promise<IAddress[]> {
    if (lean) {
      return Address.find({ userId: new Types.ObjectId(userId) })
        .sort(sort)
        .lean() as Promise<IAddress[]>;
    }
    return Address.find({ userId: new Types.ObjectId(userId) }).sort(sort);
  }

  /**
   * Find addresses with filtering and pagination
   */
  static async findWithPagination(
    filter: FilterQuery<IAddress>,
    page: number = 1,
    limit: number = 10,
    sort: any = { isDefault: -1, createdAt: -1 }
  ): Promise<{ addresses: IAddress[]; totalCount: number }> {
    const skip = (page - 1) * limit;

    const [addresses, totalCount] = await Promise.all([
      Address.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Address.countDocuments(filter)
    ]);

    return { addresses: addresses as IAddress[], totalCount };
  }

  /**
   * Update address by ID
   */
  static async updateById(addressId: string, updateData: AddressUpdateData): Promise<IAddress | null> {
    return Address.findByIdAndUpdate(
      addressId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  /**
   * Delete address by ID
   */
  static async deleteById(addressId: string): Promise<IAddress | null> {
    return Address.findByIdAndDelete(addressId);
  }

  /**
   * Find default address for user
   */
  static async findDefaultByUserId(userId: string): Promise<IAddress | null> {
    return Address.findOne({ 
      userId: new Types.ObjectId(userId),
      isDefault: true 
    }).lean();
  }

  /**
   * Set all addresses as non-default for user
   */
  static async unsetAllDefaultsForUser(userId: string): Promise<any> {
    return Address.updateMany(
      { userId: new Types.ObjectId(userId) },
      { $set: { isDefault: false } }
    );
  }

  /**
   * Set all addresses as non-default except one
   */
  static async unsetDefaultsExcept(userId: string, addressId: string): Promise<any> {
    return Address.updateMany(
      { 
        userId: new Types.ObjectId(userId),
        _id: { $ne: addressId }
      },
      { $set: { isDefault: false } }
    );
  }

  /**
   * Find addresses by type
   */
  static async findByType(userId: string, type: string): Promise<IAddress[]> {
    let filter: any = { userId: new Types.ObjectId(userId) };
    
    if (type) {
      filter.type = type;
    }

    return Address.find(filter)
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();
  }

  /**
   * Search addresses by text
   */
  static async searchByText(userId: string, searchText: string, limit: number = 10): Promise<IAddress[]> {
    const searchRegex = new RegExp(searchText, 'i');
    
    return Address.find({
      userId: new Types.ObjectId(userId),
      $or: [
        { label: searchRegex },
        { street: searchRegex },
        { city: searchRegex },
        { contactName: searchRegex },
        { landmark: searchRegex }
      ]
    })
    .sort({ isDefault: -1, createdAt: -1 })
    .limit(limit)
    .lean();
  }

  /**
   * Count addresses by user
   */
  static async countByUserId(userId: string): Promise<number> {
    return Address.countDocuments({ userId: new Types.ObjectId(userId) });
  }

  /**
   * Find most recent non-default address for user
   */
  static async findMostRecentNonDefault(userId: string, excludeId?: string): Promise<IAddress | null> {
    const filter: any = {
      userId: new Types.ObjectId(userId),
      isDefault: false
    };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    return Address.findOne(filter)
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Get address statistics for user
   */
  static async getAddressStats(userId: string): Promise<{
    totalAddresses: number;
    addressesByType: { [key: string]: number };
    hasDefault: boolean;
  }> {
    const stats = await Address.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalAddresses: { $sum: 1 },
          typeBreakdown: { $push: '$type' },
          hasDefault: { $max: '$isDefault' }
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        totalAddresses: 0,
        addressesByType: {},
        hasDefault: false
      };
    }

    const result = stats[0];
    const addressesByType: { [key: string]: number } = {};
    
    result.typeBreakdown.forEach((type: string) => {
      addressesByType[type] = (addressesByType[type] || 0) + 1;
    });

    return {
      totalAddresses: result.totalAddresses,
      addressesByType,
      hasDefault: result.hasDefault || false
    };
  }

  /**
   * Bulk update addresses
   */
  static async bulkUpdate(filter: FilterQuery<IAddress>, update: UpdateQuery<IAddress>): Promise<any> {
    return Address.updateMany(filter, update);
  }

  /**
   * Check if address exists
   */
  static async existsById(addressId: string): Promise<boolean> {
    const address = await Address.findById(addressId).lean();
    return !!address;
  }

  /**
   * Check if user owns address
   */
  static async isOwnedByUser(addressId: string, userId: string): Promise<boolean> {
    const address = await Address.findOne({ 
      _id: addressId, 
      userId: new Types.ObjectId(userId) 
    }).lean();
    return !!address;
  }
}

export default AddressRepository;
