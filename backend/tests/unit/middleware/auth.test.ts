import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { authenticate, authorize } from '../../../src/middleware/auth';
import { TestHelpers } from '../../utils/testHelpers';
import User from '../../../src/models/User';

// Define AuthenticatedRequest interface locally to match middleware
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    userType: string;
  };
}

// Mock request and response objects for testing
const mockRequest = (overrides: any = {}): Partial<AuthenticatedRequest> => ({
  headers: {},
  ...overrides
});

const mockResponse = (): Partial<Response> => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = (): NextFunction => jest.fn();

describe('Auth Middleware Tests', () => {
  describe('authenticate middleware', () => {
    it('should authenticate valid JWT token', async () => {
      // Arrange - Create a test user in database first
      const testUserData = TestHelpers.createTestUser({
        email: TestHelpers.generateRandomEmail()
      });
      const createdUser = await User.create(testUserData);
      const userId = (createdUser._id as string).toString();
      
      const token = TestHelpers.generateTestToken(userId, 'customer');
      
      const req = mockRequest({
        headers: { authorization: `Bearer ${token}` }
      }) as AuthenticatedRequest;
      const res = mockResponse() as Response;
      const next = mockNext();

      // Act
      await authenticate(req, res, next);

      // Assert
      expect(req.user).toBeDefined();
      expect(req.user?.userId).toBe(userId);
      expect(req.user?.userType).toBe('customer');
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject request without authorization header', async () => {
      // Arrange
      const req = mockRequest() as AuthenticatedRequest;
      const res = mockResponse() as Response;
      const next = mockNext();

      // Act
      await authenticate(req, res, next);

      // Assert
      expect(req.user).toBeUndefined();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('token')
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid JWT token', async () => {
      // Arrange
      const req = mockRequest({
        headers: { authorization: 'Bearer invalid-token' }
      }) as AuthenticatedRequest;
      const res = mockResponse() as Response;
      const next = mockNext();

      // Act
      await authenticate(req, res, next);

      // Assert
      expect(req.user).toBeUndefined();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('token')
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject malformed authorization header', async () => {
      // Arrange
      const req = mockRequest({
        headers: { authorization: 'InvalidFormat token' }
      }) as AuthenticatedRequest;
      const res = mockResponse() as Response;
      const next = mockNext();

      // Act
      await authenticate(req, res, next);

      // Assert
      expect(req.user).toBeUndefined();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle expired JWT token', async () => {
      // Arrange
      const expiredToken = jwt.sign(
        { userId: TestHelpers.generateObjectId(), userType: 'customer' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' } // Already expired
      );
      
      const req = mockRequest({
        headers: { authorization: `Bearer ${expiredToken}` }
      }) as AuthenticatedRequest;
      const res = mockResponse() as Response;
      const next = mockNext();

      // Act
      await authenticate(req, res, next);

      // Assert
      expect(req.user).toBeUndefined();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Token expired'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authorize middleware', () => {
    it('should allow access for authorized user type', async () => {
      // Arrange
      const authorizeAdmin = authorize('admin');
      const req = mockRequest({
        user: { userId: TestHelpers.generateObjectId(), userType: 'admin' }
      }) as AuthenticatedRequest;
      const res = mockResponse() as Response;
      const next = mockNext();

      // Act
      await authorizeAdmin(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access for unauthorized user type', async () => {
      // Arrange  
      const authorizeAdmin = authorize('admin');
      const req = mockRequest({
        user: { userId: TestHelpers.generateObjectId(), userType: 'customer' }
      }) as AuthenticatedRequest;
      const res = mockResponse() as Response;
      const next = mockNext();

      // Act
      await authorizeAdmin(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Insufficient permissions'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow access for multiple authorized user types', async () => {
      // Arrange
      const authorizeMultiple = authorize('admin', 'customer');
      const req = mockRequest({
        user: { userId: TestHelpers.generateObjectId(), userType: 'customer' }
      }) as AuthenticatedRequest;
      const res = mockResponse() as Response;
      const next = mockNext();

      // Act
      await authorizeMultiple(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access when user object is missing', async () => {
      // Arrange
      const authorizeAdmin = authorize('admin');
      const req = mockRequest() as AuthenticatedRequest; // No user object
      const res = mockResponse() as Response;
      const next = mockNext();

      // Act
      await authorizeAdmin(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Authentication')
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('auth middleware integration', () => {
    it('should work together in middleware chain', async () => {
      // Arrange - Create a test user in database first
      const testUserData = TestHelpers.createTestUser({
        email: TestHelpers.generateRandomEmail(),
        userType: 'admin'
      });
      const createdUser = await User.create(testUserData);
      const userId = (createdUser._id as string).toString();
      
      const token = TestHelpers.generateTestToken(userId, 'admin');
      const authorizeAdmin = authorize('admin');
      
      const req = mockRequest({
        headers: { authorization: `Bearer ${token}` }
      }) as AuthenticatedRequest;
      const res = mockResponse() as Response;
      const next = mockNext();

      // Act - First authenticate
      await authenticate(req, res, next);
      
      // Then authorize (if authentication succeeded)
      if (req.user) {
        await authorizeAdmin(req, res, next);
      }

      // Assert
      expect(req.user).toBeDefined();
      expect(req.user?.userId).toBe(userId);
      expect(req.user?.userType).toBe('admin');
      expect(next).toHaveBeenCalledTimes(2); // Called by both middleware
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should stop chain when authentication fails', async () => {
      // Arrange
      const authorizeAdmin = authorize('admin');
      
      const req = mockRequest({
        headers: { authorization: 'Bearer invalid-token' }
      }) as AuthenticatedRequest;
      const res = mockResponse() as Response;
      const next = mockNext();

      // Act - First authenticate (should fail)
      await authenticate(req, res, next);
      
      // Don't call authorize since auth failed
      if (req.user) {
        await authorizeAdmin(req, res, next);
      }

      // Assert
      expect(req.user).toBeUndefined();
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should stop chain when authorization fails', async () => {
      // Arrange - Create a test user in database first
      const testUserData = TestHelpers.createTestUser({
        email: TestHelpers.generateRandomEmail(),
        userType: 'customer'
      });
      const createdUser = await User.create(testUserData);
      const userId = (createdUser._id as string).toString();
      
      const token = TestHelpers.generateTestToken(userId, 'customer');
      const authorizeAdmin = authorize('admin');
      
      const req = mockRequest({
        headers: { authorization: `Bearer ${token}` }
      }) as AuthenticatedRequest;
      const res = mockResponse() as Response;
      const authNext = mockNext();
      const authzNext = mockNext();

      // Act - First authenticate (should succeed)
      await authenticate(req, res, authNext);
      
      // Then authorize (should fail)
      if (req.user) {
        await authorizeAdmin(req, res, authzNext);
      }

      // Assert
      expect(req.user).toBeDefined();
      expect(req.user?.userType).toBe('customer');
      expect(authNext).toHaveBeenCalled(); // Auth middleware called next
      expect(authzNext).not.toHaveBeenCalled(); // Authorization failed
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
