import request from 'supertest';
import app from '../../src/index';
import connectDB from '../../src/config/database';
import Driver from '../../src/models/Driver';
import User from '../../src/models/User';
import mongoose from 'mongoose';

describe('Driver Management API', () => {
  let authToken: string;
  let adminUser: any;
  let driverId: string;

  beforeAll(async () => {
    // Connect to test database
    await connectDB();
    
    // Clear existing data
    await Promise.all([
      Driver.deleteMany({}),
      User.deleteMany({})
    ]);

    // Create admin user for authentication
    const adminData = {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: 'password123',
      userType: 'admin'
    };

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(adminData);

    authToken = registerResponse.body.data.token;
    adminUser = registerResponse.body.data.user;
  });

  afterAll(async () => {
    // Clean up test data
    await Promise.all([
      Driver.deleteMany({}),
      User.deleteMany({})
    ]);
    await mongoose.connection.close();
  });

  describe('POST /api/v1/drivers', () => {
    it('should create a new driver with valid data', async () => {
      const driverData = {
        firstName: 'John',
        lastName: 'Driver',
        email: 'john.driver@test.com',
        phone: '+1234567890',
        licenseNumber: 'DL123456789',
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        experience: 5,
        vehicle: {
          number: 'TRK001',
          type: 'truck',
          model: 'Ford Transit',
          capacity: 1000
        },
        certifications: ['Hazmat', 'CDL'],
        documents: {
          license: 'license-doc-url',
          insurance: 'insurance-doc-url',
          registration: 'registration-doc-url'
        }
      };

      const response = await request(app)
        .post('/api/v1/drivers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(driverData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(driverData.email);
      expect(response.body.data.firstName).toBe(driverData.firstName);
      expect(response.body.data.vehicle.number).toBe(driverData.vehicle.number);
      
      driverId = response.body.data.id;
    });

    it('should return validation error for invalid driver data', async () => {
      const invalidDriverData = {
        firstName: 'J', // Too short
        email: 'invalid-email', // Invalid email format
        phone: '123', // Invalid phone
        licenseExpiry: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Expired date
      };

      const response = await request(app)
        .post('/api/v1/drivers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDriverData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/drivers', () => {
    it('should retrieve all drivers with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/drivers?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.drivers).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
      expect(Array.isArray(response.body.data.drivers)).toBe(true);
    });

    it('should filter drivers by status', async () => {
      const response = await request(app)
        .get('/api/v1/drivers?status=active')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/drivers/:driverId', () => {
    it('should retrieve a specific driver by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/drivers/${driverId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(driverId);
    });

    it('should return 404 for non-existent driver', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      const response = await request(app)
        .get(`/api/v1/drivers/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/drivers/:driverId', () => {
    it('should update driver information', async () => {
      const updateData = {
        firstName: 'Jane',
        experience: 7
      };

      const response = await request(app)
        .put(`/api/v1/drivers/${driverId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe(updateData.firstName);
      expect(response.body.data.experience).toBe(updateData.experience);
    });
  });

  describe('PATCH /api/v1/drivers/:driverId/status', () => {
    it('should update driver status', async () => {
      const response = await request(app)
        .patch(`/api/v1/drivers/${driverId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'inactive' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('inactive');
    });
  });

  describe('GET /api/v1/drivers/statistics', () => {
    it('should retrieve driver statistics', async () => {
      const response = await request(app)
        .get('/api/v1/drivers/statistics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.overview).toBeDefined();
      expect(response.body.data.vehicleDistribution).toBeDefined();
    });
  });

  describe('GET /api/v1/drivers/available', () => {
    it('should retrieve available drivers by location', async () => {
      const response = await request(app)
        .get('/api/v1/drivers/available?latitude=40.7128&longitude=-74.0060')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return validation error for invalid coordinates', async () => {
      const response = await request(app)
        .get('/api/v1/drivers/available?latitude=invalid&longitude=-74.0060');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/drivers/:driverId', () => {
    it('should delete a driver', async () => {
      const response = await request(app)
        .delete(`/api/v1/drivers/${driverId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 when trying to delete non-existent driver', async () => {
      const response = await request(app)
        .delete(`/api/v1/drivers/${driverId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
