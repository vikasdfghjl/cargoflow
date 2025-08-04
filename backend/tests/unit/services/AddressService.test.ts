import AddressService from '../../../src/services/AddressService';
import Address from '../../../src/models/Address';
import { TestHelpers } from '../../utils/testHelpers';
import { ValidationError, NotFoundError, AuthorizationError } from '../../../src/middleware/errorHandler';

describe('AddressService Unit Tests', () => {
  let testUserId: string;
  let otherUserId: string;

  beforeEach(() => {
    testUserId = TestHelpers.generateObjectId();
    otherUserId = TestHelpers.generateObjectId();
  });

  describe('createAddress', () => {
    it('should successfully create a new address', async () => {
      // Arrange
      const addressData = TestHelpers.createAddressServiceData();

      // Act
      const result = await AddressService.createAddress(testUserId, addressData);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId.toString()).toBe(testUserId);
      expect(result.label).toBe(addressData.label);
      expect(result.type).toBe(addressData.type);
      expect(result.contactName).toBe(addressData.contactName);
      expect(result.phone).toBe(addressData.phone);
      expect(result.street).toBe(addressData.street);
      expect(result.city).toBe(addressData.city);
      expect(result.state).toBe(addressData.state);
      expect(result.zipCode).toBe(addressData.zipCode);
      expect(result.country).toBe(addressData.country);
    });

    it('should set first address as default automatically', async () => {
      // Arrange
      const addressData = TestHelpers.createAddressServiceData({ isDefault: false });

      // Act
      const result = await AddressService.createAddress(testUserId, addressData);

      // Assert
      expect(result.isDefault).toBe(true);
    });

    it('should handle multiple addresses with only one default', async () => {
      // Arrange
      const address1Data = TestHelpers.createAddressServiceData({ label: 'Home' });
      const address2Data = TestHelpers.createAddressServiceData({ 
        label: 'Office',
        isDefault: true 
      });

      // Act
      const address1 = await AddressService.createAddress(testUserId, address1Data);
      const address2 = await AddressService.createAddress(testUserId, address2Data);

      // Assert
      expect(address1.isDefault).toBe(true); // First address is default
      expect(address2.isDefault).toBe(true); // New default address
      
      // Check that the first address is no longer default
      const updatedAddress1 = await Address.findById(address1.id);
      expect(updatedAddress1?.isDefault).toBe(false);
    });

    it('should validate required fields', async () => {
      // Arrange
      const incompleteData = {
        label: 'Test',
        // Missing required fields
      };

      // Act & Assert
      await expect(AddressService.createAddress(testUserId, incompleteData as any)).rejects.toThrow();
    });
  });

  describe('getUserAddresses', () => {
    beforeEach(async () => {
      // Create multiple addresses for the test user
      await AddressService.createAddress(testUserId, TestHelpers.createAddressServiceData({ 
        label: 'Home',
        type: 'home' 
      }));
      await AddressService.createAddress(testUserId, TestHelpers.createAddressServiceData({ 
        label: 'Office',
        type: 'office' 
      }));
      await AddressService.createAddress(otherUserId, TestHelpers.createAddressServiceData({ 
        label: 'Other User Address' 
      }));
    });

    it('should return all addresses for a specific user', async () => {
      // Act
      const result = await AddressService.getUserAddresses({ userId: testUserId });

      // Assert
      expect(result.addresses).toHaveLength(2);
      result.addresses.forEach(address => {
        expect(address.userId.toString()).toBe(testUserId);
      });
    });

    it('should return addresses sorted with default first', async () => {
      // Act
      const result = await AddressService.getUserAddresses({ userId: testUserId });

      // Assert
      expect(result.addresses.length).toBeGreaterThan(0);
      // First address should be the default one
      expect(result.addresses[0]?.isDefault).toBe(true);
    });

    it('should return empty array for user with no addresses', async () => {
      // Arrange
      const newUserId = TestHelpers.generateObjectId();

      // Act
      const result = await AddressService.getUserAddresses({ userId: newUserId });

      // Assert
      expect(result.addresses).toHaveLength(0);
    });

    it('should support pagination', async () => {
      // Act
      const result = await AddressService.getUserAddresses({ 
        userId: testUserId, 
        page: 1, 
        limit: 1 
      });

      // Assert
      expect(result.addresses).toHaveLength(1);
      expect(result.totalCount).toBe(2);
      expect(result.pagination).toBeDefined();
    });
  });

  describe('getAddressById', () => {
    let testAddress: any;

    beforeEach(async () => {
      const addressData = TestHelpers.createAddressServiceData();
      testAddress = await AddressService.createAddress(testUserId, addressData);
    });

    it('should successfully get address by valid ID', async () => {
      // Act
      const result = await AddressService.getAddressById(testAddress.id, testUserId);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(testAddress.id);
      expect(result.label).toBe(testAddress.label);
      expect(result.userId.toString()).toBe(testUserId);
    });

    it('should throw NotFoundError for invalid address ID', async () => {
      // Arrange
      const invalidId = TestHelpers.generateObjectId();

      // Act & Assert
      await expect(AddressService.getAddressById(invalidId, testUserId)).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when trying to access another user address', async () => {
      // Arrange - Create address for another user
      const otherAddress = await AddressService.createAddress(otherUserId, TestHelpers.createAddressServiceData());

      // Act & Assert
      await expect(AddressService.getAddressById(otherAddress.id, testUserId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateAddress', () => {
    let testAddress: any;

    beforeEach(async () => {
      const addressData = TestHelpers.createAddressServiceData();
      testAddress = await AddressService.createAddress(testUserId, addressData);
    });

    it('should successfully update address', async () => {
      // Arrange
      const updateData = {
        label: 'Updated Home',
        contactName: 'Updated Contact',
        phone: '+9876543210',
        street: 'Updated Street Address'
      };

      // Act
      const result = await AddressService.updateAddress(testAddress.id, testUserId, updateData);

      // Assert
      expect(result).toBeDefined();
      expect(result.label).toBe(updateData.label);
      expect(result.contactName).toBe(updateData.contactName);
      expect(result.phone).toBe(updateData.phone);
      expect(result.street).toBe(updateData.street);
    });

    it('should throw NotFoundError for invalid address ID', async () => {
      // Arrange
      const invalidId = TestHelpers.generateObjectId();
      const updateData = { label: 'Updated' };

      // Act & Assert
      await expect(
        AddressService.updateAddress(invalidId, testUserId, updateData)
      ).rejects.toThrow(NotFoundError);
    });

    it('should handle setting new default address', async () => {
      // Arrange - Create another address
      const address2Data = TestHelpers.createAddressServiceData({ 
        label: 'Office',
        isDefault: false 
      });
      const address2 = await AddressService.createAddress(testUserId, address2Data);

      // Act - Set the second address as default
      const result = await AddressService.updateAddress(address2.id, testUserId, { isDefault: true });

      // Assert
      expect(result.isDefault).toBe(true);
      
      // Check that the original default is no longer default
      const updatedAddress1 = await Address.findById(testAddress.id);
      expect(updatedAddress1?.isDefault).toBe(false);
    });

    it('should not allow removing default flag if it is the only address', async () => {
      // Act
      const result = await AddressService.updateAddress(testAddress.id, testUserId, { isDefault: false });

      // Assert - Should still be default since it's the only address
      expect(result.isDefault).toBe(true);
    });

    it('should throw NotFoundError when trying to update another user address', async () => {
      // Arrange - Create address for another user
      const otherAddress = await AddressService.createAddress(otherUserId, TestHelpers.createAddressServiceData());

      // Act & Assert
      await expect(
        AddressService.updateAddress(otherAddress.id, testUserId, { label: 'Hacked' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteAddress', () => {
    let testAddress: any;

    beforeEach(async () => {
      const addressData = TestHelpers.createAddressServiceData();
      testAddress = await AddressService.createAddress(testUserId, addressData);
    });

    it('should successfully delete address', async () => {
      // Act
      await AddressService.deleteAddress(testAddress.id, testUserId);

      // Assert
      const deletedAddress = await Address.findById(testAddress.id);
      expect(deletedAddress).toBeNull();
    });

    it('should throw NotFoundError for invalid address ID', async () => {
      // Arrange
      const invalidId = TestHelpers.generateObjectId();

      // Act & Assert
      await expect(AddressService.deleteAddress(invalidId, testUserId)).rejects.toThrow(NotFoundError);
    });

    it('should handle deleting default address with multiple addresses', async () => {
      // Arrange - Create another address
      const address2Data = TestHelpers.createAddressServiceData({ 
        label: 'Office',
        isDefault: false 
      });
      const address2 = await AddressService.createAddress(testUserId, address2Data);

      // Act - Delete the default address
      await AddressService.deleteAddress(testAddress.id, testUserId);

      // Assert - The remaining address should become default
      const updatedAddress2 = await Address.findById(address2.id);
      expect(updatedAddress2?.isDefault).toBe(true);
    });

    it('should allow deleting the last address', async () => {
      // Act
      await AddressService.deleteAddress(testAddress.id, testUserId);

      // Assert
      const addresses = await AddressService.getUserAddresses({ userId: testUserId });
      expect(addresses.addresses).toHaveLength(0);
    });

    it('should throw NotFoundError when trying to delete another user address', async () => {
      // Arrange - Create address for another user
      const otherAddress = await AddressService.createAddress(otherUserId, TestHelpers.createAddressServiceData());

      // Act & Assert
      await expect(AddressService.deleteAddress(otherAddress.id, testUserId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('setDefaultAddress', () => {
    let address1: any;
    let address2: any;

    beforeEach(async () => {
      const address1Data = TestHelpers.createAddressServiceData({ label: 'Home' });
      const address2Data = TestHelpers.createAddressServiceData({ 
        label: 'Office',
        isDefault: false 
      });

      address1 = await AddressService.createAddress(testUserId, address1Data);
      address2 = await AddressService.createAddress(testUserId, address2Data);
    });

    it('should set new default address', async () => {
      // Act
      const result = await AddressService.setDefaultAddress(address2.id, testUserId);

      // Assert
      expect(result.isDefault).toBe(true);
      expect(result.label).toBe('Office');
      
      // Check that the previous default is no longer default
      const updatedAddress1 = await Address.findById(address1.id);
      expect(updatedAddress1?.isDefault).toBe(false);
    });

    it('should throw NotFoundError for invalid address ID', async () => {
      // Arrange
      const invalidId = TestHelpers.generateObjectId();

      // Act & Assert
      await expect(
        AddressService.setDefaultAddress(invalidId, testUserId)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when trying to set default for another user address', async () => {
      // Arrange - Create address for another user
      const otherAddress = await AddressService.createAddress(
        otherUserId, TestHelpers.createAddressServiceData({ label: 'Other User Address' })
      );

      // Act & Assert
      await expect(
        AddressService.setDefaultAddress(otherAddress.id, testUserId)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getDefaultAddress', () => {
    it('should return default address for user', async () => {
      // Arrange
      const addressData = TestHelpers.createAddressServiceData({ label: 'Default Home' });
      const createdAddress = await AddressService.createAddress(testUserId, addressData);

      // Act
      const result = await AddressService.getDefaultAddress(testUserId);

      // Assert
      expect(result).toBeDefined();
      expect(result?.isDefault).toBe(true);
      expect(result?.label).toBe('Default Home');
      expect(result?.id).toBe(createdAddress.id);
    });

    it('should return null when user has no addresses', async () => {
      // Act
      const result = await AddressService.getDefaultAddress(testUserId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getAddressesByType', () => {
    beforeEach(async () => {
      // Create addresses for pickup and delivery
      await AddressService.createAddress(testUserId, TestHelpers.createAddressServiceData({ 
        label: 'Home Pickup',
        type: 'home' 
      }));
      await AddressService.createAddress(testUserId, TestHelpers.createAddressServiceData({ 
        label: 'Office Delivery',
        type: 'office' 
      }));
    });

    it('should return addresses suitable for pickup', async () => {
      // Act
      const result = await AddressService.getAddressesByType(testUserId, 'pickup');

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return addresses suitable for delivery', async () => {
      // Act
      const result = await AddressService.getAddressesByType(testUserId, 'delivery');

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return all addresses when type is both', async () => {
      // Act
      const result = await AddressService.getAddressesByType(testUserId, 'both');

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
    });
  });
});
