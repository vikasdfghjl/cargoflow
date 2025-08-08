import { log } from '../lib/logger';
import { Response } from 'express';
import Address from '../models/Address';
import { AuthRequest, ApiResponse } from '../types';

// Get all addresses for the authenticated user
export const getAddresses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    const addresses = await Address.find({ userId })
      .sort({ isDefault: -1, createdAt: -1 });

    const addressResponse = addresses.map(address => ({
      _id: address._id.toString(), // Changed from 'id' to '_id' to match frontend interface
      label: address.label,
      type: address.type,
      contactName: address.contactName,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      isDefault: address.isDefault,
      landmark: address.landmark,
      instructions: address.instructions,
      // Google Maps integration fields
      coordinates: address.coordinates,
      formattedAddress: address.formattedAddress,
      placeId: address.placeId,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt
    }));

    res.status(200).json({
      success: true,
      message: 'Addresses retrieved successfully',
      data: addressResponse
    } as ApiResponse);

  } catch (error: any) {
  log.error('Get addresses error', { error: (error as Error).message });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve addresses',
      error: error.message
    } as ApiResponse);
  }
};

// Create a new address
export const createAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const {
      label,
      type,
      contactName,
      phone,
      street,
      city,
      state,
      zipCode,
      country,
      isDefault,
      landmark,
      instructions,
      // Google Maps integration fields
      coordinates,
      formattedAddress,
      placeId
    } = req.body;

    // If this is set as default, check if user has other addresses
    if (isDefault) {
      await Address.updateMany(
        { userId },
        { isDefault: false }
      );
    }

    const address = new Address({
      userId,
      label,
      type,
      contactName,
      phone,
      street,
      city,
      state,
      zipCode,
      country: country || 'India',
      isDefault,
      landmark,
      instructions,
      // Google Maps integration fields
      coordinates,
      formattedAddress,
      placeId
    });

    await address.save();

    const addressResponse = {
      _id: address._id.toString(), // Changed from 'id' to '_id'
      label: address.label,
      type: address.type,
      contactName: address.contactName,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      isDefault: address.isDefault,
      landmark: address.landmark,
      instructions: address.instructions,
      // Google Maps integration fields
      coordinates: address.coordinates,
      formattedAddress: address.formattedAddress,
      placeId: address.placeId,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt
    };

    res.status(201).json({
      success: true,
      message: 'Address created successfully',
      data: addressResponse
    } as ApiResponse);

  } catch (error: any) {
  log.error('Create address error', { error: (error as Error).message });
    res.status(500).json({
      success: false,
      message: 'Failed to create address',
      error: error.message
    } as ApiResponse);
  }
};

// Update an existing address
export const updateAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params; // Changed from addressId to id
    const {
      label,
      type,
      contactName,
      phone,
      street,
      city,
      state,
      zipCode,
      country,
      isDefault,
      landmark,
      instructions,
      // Google Maps integration fields
      coordinates,
      formattedAddress,
      placeId
    } = req.body;

    // Find the address and ensure it belongs to the user
    const address = await Address.findOne({ _id: id, userId }); // Changed from addressId to id
    if (!address) {
      res.status(404).json({
        success: false,
        message: 'Address not found'
      } as ApiResponse);
      return;
    }

    // If this is set as default, remove default from others
    if (isDefault && !address.isDefault) {
      await Address.updateMany(
        { userId, _id: { $ne: id } }, // Changed from addressId to id
        { isDefault: false }
      );
    }

    // Update the address
    address.label = label;
    address.type = type;
    address.contactName = contactName;
    address.phone = phone;
    address.street = street;
    address.city = city;
    address.state = state;
    address.zipCode = zipCode;
    address.country = country || address.country;
    address.isDefault = isDefault;
    address.landmark = landmark;
    address.instructions = instructions;
    // Google Maps integration fields
    if (coordinates) address.coordinates = coordinates;
    if (formattedAddress) address.formattedAddress = formattedAddress;
    if (placeId) address.placeId = placeId;

    await address.save();

    const addressResponse = {
      _id: address._id.toString(), // Changed from 'id' to '_id'
      label: address.label,
      type: address.type,
      contactName: address.contactName,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      isDefault: address.isDefault,
      landmark: address.landmark,
      instructions: address.instructions,
      // Google Maps integration fields
      coordinates: address.coordinates,
      formattedAddress: address.formattedAddress,
      placeId: address.placeId,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt
    };

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: addressResponse
    } as ApiResponse);

  } catch (error: any) {
  log.error('Update address error', { error: (error as Error).message });
    res.status(500).json({
      success: false,
      message: 'Failed to update address',
      error: error.message
    } as ApiResponse);
  }
};

// Delete an address
export const deleteAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params; // Changed from addressId to id

    // Find and delete the address
    const address = await Address.findOneAndDelete({ _id: id, userId }); // Changed from addressId to id
    if (!address) {
      res.status(404).json({
        success: false,
        message: 'Address not found'
      } as ApiResponse);
      return;
    }

    // If deleted address was default, set another address as default
    if (address.isDefault) {
      const nextAddress = await Address.findOne({ userId }).sort({ createdAt: -1 });
      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully'
    } as ApiResponse);

  } catch (error: any) {
  log.error('Delete address error', { error: (error as Error).message });
    res.status(500).json({
      success: false,
      message: 'Failed to delete address',
      error: error.message
    } as ApiResponse);
  }
};

// Set an address as default
export const setDefaultAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params; // Changed from addressId to id

    // Find the address and ensure it belongs to the user
    const address = await Address.findOne({ _id: id, userId }); // Changed from addressId to id
    if (!address) {
      res.status(404).json({
        success: false,
        message: 'Address not found'
      } as ApiResponse);
      return;
    }

    // Remove default from all other addresses
    await Address.updateMany(
      { userId, _id: { $ne: id } }, // Changed from addressId to id
      { isDefault: false }
    );

    // Set this address as default
    address.isDefault = true;
    await address.save();

    res.status(200).json({
      success: true,
      message: 'Default address updated successfully'
    } as ApiResponse);

  } catch (error: any) {
  log.error('Set default address error', { error: (error as Error).message });
    res.status(500).json({
      success: false,
      message: 'Failed to set default address',
      error: error.message
    } as ApiResponse);
  }
};
