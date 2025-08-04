import AuthService from '../../../src/services/AuthService';
import User from '../../../src/models/User';
import { TestHelpers } from '../../utils/testHelpers';
import { ConflictError, AuthenticationError, NotFoundError } from '../../../src/middleware/errorHandler';

describe('AuthService Unit Tests', () => {
  describe('registerUser', () => {
    it('should successfully register a new user', async () => {
      // Arrange
      const userData = TestHelpers.createAuthServiceRegisterData({
        email: TestHelpers.generateRandomEmail()
      });

      // Act
      const result = await AuthService.registerUser(userData);

      // Assert
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.user.firstName).toBe(userData.firstName);
      expect(result.user.lastName).toBe(userData.lastName);
      expect(result.user.userType).toBe(userData.userType);
    });

    it('should throw ConflictError when email already exists', async () => {
      // Arrange
      const userData = TestHelpers.createAuthServiceRegisterData({
        email: 'duplicate@example.com'
      });

      // Create first user
      await AuthService.registerUser(userData);

      // Act & Assert
      await expect(AuthService.registerUser(userData)).rejects.toThrow(ConflictError);
    });

    it('should hash the password before saving', async () => {
      // Arrange
      const userData = TestHelpers.createAuthServiceRegisterData({
        email: TestHelpers.generateRandomEmail(),
        password: 'plainPassword123'
      });

      // Act
      const result = await AuthService.registerUser(userData);

      // Assert
      const savedUser = await User.findById(result.user.id).select('+password');
      expect(savedUser?.password).not.toBe(userData.password);
      expect(savedUser?.password).toBeDefined();
      expect(savedUser?.password.length).toBeGreaterThan(20); // Hashed password is longer
    });

    it('should create user with correct default values', async () => {
      // Arrange
      const userData = TestHelpers.createAuthServiceRegisterData({
        email: TestHelpers.generateRandomEmail()
      });

      // Act
      const result = await AuthService.registerUser(userData);

      // Assert
      const savedUser = await User.findById(result.user.id);
      expect(savedUser?.isActive).toBe(true);
      expect(savedUser?.isEmailVerified).toBe(false); // Should be false by default for new registrations
      expect(savedUser?.createdAt).toBeDefined();
      expect(savedUser?.updatedAt).toBeDefined();
    });
  });

  describe('loginUser', () => {
    let testUser: any;
    const password = 'testPassword123';

    beforeEach(async () => {
      // Create a test user for login tests
      const userData = TestHelpers.createAuthServiceRegisterData({
        email: TestHelpers.generateRandomEmail(),
        password
      });
      testUser = await AuthService.registerUser(userData);
    });

    it('should successfully login with correct credentials', async () => {
      // Act
      const result = await AuthService.loginUser({ 
        email: testUser.user.email, 
        password 
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe(testUser.user.email);
    });

    it('should throw AuthenticationError with incorrect email', async () => {
      // Act & Assert
      await expect(
        AuthService.loginUser({ email: 'nonexistent@example.com', password })
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError with incorrect password', async () => {
      // Act & Assert
      await expect(
        AuthService.loginUser({ email: testUser.user.email, password: 'wrongPassword' })
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError for inactive user', async () => {
      // Arrange - deactivate the user
      await User.findByIdAndUpdate(testUser.user.id, { isActive: false });

      // Act & Assert
      await expect(
        AuthService.loginUser({ email: testUser.user.email, password })
      ).rejects.toThrow(AuthenticationError);
    });

    it('should update lastLogin timestamp on successful login', async () => {
      // Arrange
      const beforeLogin = new Date();

      // Act
      await AuthService.loginUser({ email: testUser.user.email, password });

      // Assert
      const updatedUser = await User.findById(testUser.user.id);
      expect(updatedUser?.lastLogin).toBeDefined();
      expect(updatedUser?.lastLogin!.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
    });
  });

  describe('getUserProfile', () => {
    let testUser: any;

    beforeEach(async () => {
      const userData = TestHelpers.createAuthServiceRegisterData({
        email: TestHelpers.generateRandomEmail()
      });
      testUser = await AuthService.registerUser(userData);
    });

    it('should successfully get user by valid ID', async () => {
      // Act
      const result = await AuthService.getUserProfile(testUser.user.id);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(testUser.user.id);
      expect(result.email).toBe(testUser.user.email);
      expect(result.firstName).toBe(testUser.user.firstName);
    });

    it('should throw NotFoundError for invalid user ID', async () => {
      // Arrange
      const invalidId = TestHelpers.generateObjectId();

      // Act & Assert
      await expect(AuthService.getUserProfile(invalidId)).rejects.toThrow(NotFoundError);
    });

    it('should not return password field', async () => {
      // Act
      const result = await AuthService.getUserProfile(testUser.user.id);

      // Assert
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('updateUserProfile', () => {
    let testUser: any;

    beforeEach(async () => {
      const userData = TestHelpers.createAuthServiceRegisterData({
        email: TestHelpers.generateRandomEmail()
      });
      testUser = await AuthService.registerUser(userData);
    });

    it('should successfully update user profile', async () => {
      // Arrange
      const updateData = {
        firstName: 'UpdatedFirst',
        lastName: 'UpdatedLast',
        phone: '+9876543210',
        companyName: 'Updated Company'
      };

      // Act
      const result = await AuthService.updateUserProfile(testUser.user.id, updateData);

      // Assert
      expect(result).toBeDefined();
      expect(result.firstName).toBe(updateData.firstName);
      expect(result.lastName).toBe(updateData.lastName);
      expect(result.phone).toBe(updateData.phone);
      expect(result.companyName).toBe(updateData.companyName);
    });

    it('should throw NotFoundError for invalid user ID', async () => {
      // Arrange
      const invalidId = TestHelpers.generateObjectId();
      const updateData = { firstName: 'Updated' };

      // Act & Assert
      await expect(
        AuthService.updateUserProfile(invalidId, updateData)
      ).rejects.toThrow(NotFoundError);
    });

    it('should not allow updating email through profile update', async () => {
      // Arrange
      const updateData = {
        email: 'newemail@example.com',
        firstName: 'Updated'
      };

      // Act
      const result = await AuthService.updateUserProfile(testUser.user.id, updateData);

      // Assert
      expect(result.email).toBe(testUser.user.email); // Email should remain unchanged
      expect(result.firstName).toBe(updateData.firstName);
    });
  });
});
