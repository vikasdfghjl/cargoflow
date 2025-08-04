import { Types } from 'mongoose';
import Address from '../models/Address';
import AddressRepository from '../repositories/AddressRepository';
import { IAddress } from '../types';
import { 
  ValidationError, 
  NotFoundError,
  ConflictError 
} from '../middleware/errorHandler';

interface AddressData {
  label: string;
  street: string;
  contactName: string;
  phone: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  type: 'home' | 'office' | 'warehouse' | 'other';
  isDefault?: boolean;
  landmark?: string;
  instructions?: string;
}

interface AddressQuery {
  page?: number;
  limit?: number;
  type?: string;
  userId: string;
}

interface AddressResponse {
  id: string;
  label: string;
  street: string;
  contactName: string;
  phone: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  type: string;
  isDefault: boolean;
  landmark?: string;
  instructions?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AddressService {
  /**
   * Convert address document to response object
   */
  private static toAddressResponse(address: IAddress): AddressResponse {
    return {
      id: (address._id as Types.ObjectId).toString(),
      label: address.label,
      street: address.street,
      contactName: address.contactName,
      phone: address.phone,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      type: address.type,
      isDefault: address.isDefault || false,
      ...(address.landmark && { landmark: address.landmark }),
      ...(address.instructions && { instructions: address.instructions }),
      userId: (address.userId as Types.ObjectId).toString(),
      createdAt: address.createdAt,
      updatedAt: address.updatedAt
    };
  }

  /**
   * Create a new address
   */
  static async createAddress(userId: string, addressData: AddressData): Promise<AddressResponse> {
    // Check if this is the user's first address
    const existingAddressCount = await AddressRepository.countByUserId(userId);
    const isFirstAddress = existingAddressCount === 0;

    // Set as default if it's the first address or explicitly requested
    const shouldSetAsDefault = isFirstAddress || addressData.isDefault;

    // If this is being set as default, unset other defaults
    if (shouldSetAsDefault) {
      await AddressRepository.unsetAllDefaultsForUser(userId);
    }

    // Create address
    const address = await AddressRepository.create({
      ...addressData,
      isDefault: shouldSetAsDefault || false,
      userId: new Types.ObjectId(userId)
    });

    return this.toAddressResponse(address as any);
  }

  /**
   * Get address by ID
   */
  static async getAddressById(addressId: string, userId: string): Promise<AddressResponse> {
    const address = await AddressRepository.findByIdAndUserId(addressId, userId);
    
    if (!address) {
      throw new NotFoundError('Address not found');
    }

    return this.toAddressResponse(address as any);
  }

  /**
   * Get user addresses with filtering and pagination
   */
  static async getUserAddresses(query: AddressQuery): Promise<{ addresses: AddressResponse[]; totalCount: number; pagination: any }> {
    const {
      page = 1,
      limit = 10,
      type,
      userId
    } = query;

    // Build filter object
    const filter: any = { userId: new Types.ObjectId(userId) };
    if (type) filter.type = type;

    // Execute queries using repository
    const { addresses, totalCount } = await AddressRepository.findWithPagination(
      filter,
      page,
      limit,
      { isDefault: -1, createdAt: -1 }
    );

    // Convert to response format
    const addressResponses = addresses.map(address => this.toAddressResponse(address as any));

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
      addresses: addressResponses,
      totalCount,
      pagination
    };
  }

  /**
   * Update address
   */
  static async updateAddress(
    addressId: string, 
    userId: string, 
    updateData: Partial<AddressData>
  ): Promise<AddressResponse> {
    // Check if address exists and belongs to user
    const existingAddress = await AddressRepository.findByIdAndUserId(addressId, userId);
    
    if (!existingAddress) {
      throw new NotFoundError('Address not found');
    }

    // If trying to unset default flag, check if it's the only address
    if (updateData.isDefault === false && existingAddress.isDefault) {
      const addressCount = await AddressRepository.countByUserId(userId);
      if (addressCount === 1) {
        // Don't allow removing default flag if it's the only address
        updateData.isDefault = true;
      }
    }

    // If setting as default, unset other defaults first
    if (updateData.isDefault) {
      await AddressRepository.unsetDefaultsExcept(userId, addressId);
    }

    // Update address
    const address = await AddressRepository.updateById(addressId, updateData);

    if (!address) {
      throw new NotFoundError('Address not found');
    }

    return this.toAddressResponse(address as any);
  }

  /**
   * Delete address
   */
  static async deleteAddress(addressId: string, userId: string): Promise<void> {
    const address = await AddressRepository.findByIdAndUserId(addressId, userId);
    
    if (!address) {
      throw new NotFoundError('Address not found');
    }

    // If deleting default address, set another address as default
    if (address.isDefault) {
      const mostRecentAddress = await AddressRepository.findMostRecentNonDefault(userId, addressId);
      if (mostRecentAddress) {
        await AddressRepository.updateById(mostRecentAddress._id.toString(), { isDefault: true });
      }
    }

    await AddressRepository.deleteById(addressId);
  }

  /**
   * Set address as default
   */
  static async setDefaultAddress(addressId: string, userId: string): Promise<AddressResponse> {
    // Check if address exists and belongs to user
    const address = await AddressRepository.findByIdAndUserId(addressId, userId);
    
    if (!address) {
      throw new NotFoundError('Address not found');
    }

    // Set this address as default (first unset others, then set this one)
    await AddressRepository.unsetAllDefaultsForUser(userId);
    const updatedAddress = await AddressRepository.updateById(addressId, { isDefault: true });
    
    if (!updatedAddress) {
      throw new NotFoundError('Address not found');
    }

    return this.toAddressResponse(updatedAddress as any);
  }

  /**
   * Get default address for user
   */
  static async getDefaultAddress(userId: string): Promise<AddressResponse | null> {
    const address = await AddressRepository.findDefaultByUserId(userId);
    
    if (!address) {
      return null;
    }

    return this.toAddressResponse(address as any);
  }

  /**
   * Get addresses by type
   */
  static async getAddressesByType(userId: string, type: 'pickup' | 'delivery' | 'both'): Promise<AddressResponse[]> {
    // For 'both', pass empty string to get all addresses  
    const filterType = type === 'both' ? '' : type;
    const addresses = await AddressRepository.findByType(userId, filterType);
    return addresses.map(address => this.toAddressResponse(address as any));
  }

  /**
   * Validate postal code format (Indian postal code)
   */
  static validatePostalCode(postalCode: string): boolean {
    const postalCodeRegex = /^[1-9][0-9]{5}$/;
    return postalCodeRegex.test(postalCode);
  }

  /**
   * Search addresses by text
   */
  static async searchAddresses(userId: string, searchText: string): Promise<AddressResponse[]> {
    const addresses = await AddressRepository.searchByText(userId, searchText);
    return addresses.map(address => this.toAddressResponse(address as any));
  }
}

export default AddressService;
