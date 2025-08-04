import request from 'supertest';
import app from '../../src/index';
import { TestHelpers } from '../utils/testHelpers';
import User from '../../src/models/User';
import Booking from '../../src/models/Booking';

describe('End-to-End API Tests', () => {
  let customerToken: string;
  let adminToken: string;
  let customerId: string;
  let adminId: string;

  beforeAll(async () => {
    // Create test customer
    const customerData = {
      firstName: 'Test',
      lastName: 'Customer',
      email: TestHelpers.generateRandomEmail(),
      password: 'customer123',
      userType: 'customer',
      phone: TestHelpers.generateRandomPhone(),
      companyName: 'Customer Company'
    };

    const customerResponse = await request(app)
      .post('/api/auth/register')
      .send(customerData);

    customerToken = customerResponse.body.data.token;
    customerId = customerResponse.body.data.user.id;

    // Create test admin
    const adminData = {
      firstName: 'Test',
      lastName: 'Admin',
      email: TestHelpers.generateRandomEmail(),
      password: 'admin123',
      userType: 'admin',
      phone: TestHelpers.generateRandomPhone(),
      companyName: 'Admin Company'
    };

    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send(adminData);

    adminToken = adminResponse.body.data.token;
    adminId = adminResponse.body.data.user.id;
  });

  describe('Complete Booking Flow', () => {
    let addressId: string;
    let bookingId: string;

    it('should complete full customer booking flow', async () => {
      // Step 1: Customer creates an address
      const addressData = {
        label: 'Home',
        type: 'home',
        contactName: 'Test Contact',
        phone: '+1234567890',
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'USA',
        isDefault: true
      };

      const addressResponse = await request(app)
        .post('/api/address')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(addressData)
        .expect(201);

      expect(addressResponse.body.success).toBe(true);
      addressId = addressResponse.body.data.id;

      // Step 2: Customer creates a booking
      const bookingData = TestHelpers.createTestBookingData(customerId);

      const bookingResponse = await request(app)
        .post('/api/booking')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(bookingData)
        .expect(201);

      expect(bookingResponse.body.success).toBe(true);
      bookingId = bookingResponse.body.data.id;

      // Step 3: Customer retrieves their bookings
      const bookingsResponse = await request(app)
        .get('/api/booking')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(bookingsResponse.body.success).toBe(true);
      expect(bookingsResponse.body.data.bookings).toHaveLength(1);
      expect(bookingsResponse.body.data.bookings[0].id).toBe(bookingId);

      // Step 4: Customer retrieves specific booking
      const singleBookingResponse = await request(app)
        .get(`/api/booking/${bookingId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(singleBookingResponse.body.success).toBe(true);
      expect(singleBookingResponse.body.data.id).toBe(bookingId);
    });

    it('should complete admin booking management flow', async () => {
      // Step 1: Admin gets all bookings
      const allBookingsResponse = await request(app)
        .get('/api/booking/admin/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(allBookingsResponse.body.success).toBe(true);
      expect(allBookingsResponse.body.data.bookings.length).toBeGreaterThan(0);

      // Step 2: Admin updates booking status
      const statusUpdateResponse = await request(app)
        .put(`/api/booking/${bookingId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'confirmed' })
        .expect(200);

      expect(statusUpdateResponse.body.success).toBe(true);
      expect(statusUpdateResponse.body.data.status).toBe('confirmed');

      // Step 3: Admin gets booking statistics
      const statsResponse = await request(app)
        .get('/api/booking/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(statsResponse.body.success).toBe(true);
      expect(statsResponse.body.data).toHaveProperty('total');
      expect(statsResponse.body.data).toHaveProperty('confirmed');
    });
  });

  describe('Address Management Flow', () => {
    it('should complete full address management flow', async () => {
      // Step 1: Customer creates multiple addresses
      const homeAddress = {
        label: 'Home',
        type: 'home',
        contactName: 'Home Contact',
        phone: '+1111111111',
        street: '123 Home Street',
        city: 'Home City',
        state: 'Home State',
        zipCode: '11111',
        country: 'USA',
        isDefault: true
      };

      const homeResponse = await request(app)
        .post('/api/address')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(homeAddress)
        .expect(201);

      const homeId = homeResponse.body.data.id;

      const officeAddress = {
        label: 'Office',
        type: 'office',
        contactName: 'Office Contact',
        phone: '+2222222222',
        street: '456 Office Street',
        city: 'Office City',
        state: 'Office State',
        zipCode: '22222',
        country: 'USA',
        isDefault: false
      };

      const officeResponse = await request(app)
        .post('/api/address')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(officeAddress)
        .expect(201);

      const officeId = officeResponse.body.data.id;

      // Step 2: Customer retrieves all addresses
      const addressesResponse = await request(app)
        .get('/api/address')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(addressesResponse.body.success).toBe(true);
      expect(addressesResponse.body.data.addresses).toHaveLength(2);

      // Step 3: Customer updates an address
      const updateData = {
        label: 'Updated Home',
        contactName: 'Updated Contact'
      };

      const updateResponse = await request(app)
        .put(`/api/address/${homeId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.label).toBe('Updated Home');

      // Step 4: Customer sets a different default address
      const defaultResponse = await request(app)
        .put(`/api/address/${officeId}/default`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(defaultResponse.body.success).toBe(true);
      expect(defaultResponse.body.data.isDefault).toBe(true);

      // Step 5: Customer deletes an address
      await request(app)
        .delete(`/api/address/${homeId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      // Verify deletion
      const finalAddressesResponse = await request(app)
        .get('/api/address')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(finalAddressesResponse.body.data.addresses).toHaveLength(1);
    });
  });

  describe('Authentication and Authorization Flow', () => {
    it('should handle authentication flow correctly', async () => {
      // Step 1: Register new user
      const userData = {
        firstName: 'Auth',
        lastName: 'Test',
        email: TestHelpers.generateRandomEmail(),
        password: 'authtest123',
        userType: 'customer'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      const newToken = registerResponse.body.data.token;

      // Step 2: Login with credentials
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.token).toBeDefined();

      // Step 3: Access protected route
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.email).toBe(userData.email);

      // Step 4: Update profile
      const updateData = {
        firstName: 'Updated',
        lastName: 'Profile'
      };

      const updateResponse = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${newToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.firstName).toBe('Updated');
    });

    it('should handle authorization correctly', async () => {
      // Customer trying to access admin-only endpoint
      const customerAttempt = await request(app)
        .get('/api/booking/admin/all')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      expect(customerAttempt.body.success).toBe(false);
      expect(customerAttempt.body.message).toContain('access');

      // Admin accessing admin endpoint should work
      const adminAccess = await request(app)
        .get('/api/booking/admin/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(adminAccess.body.success).toBe(true);
    });
  });

  describe('Error Handling Flow', () => {
    it('should handle various error scenarios', async () => {
      // 1. Unauthorized access
      await request(app)
        .get('/api/auth/profile')
        .expect(401);

      // 2. Invalid booking ID
      await request(app)
        .get('/api/booking/invalid-id')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(400);

      // 3. Non-existent booking
      const fakeId = TestHelpers.generateObjectId();
      await request(app)
        .get(`/api/booking/${fakeId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(404);

      // 4. Invalid request data
      await request(app)
        .post('/api/booking')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({}) // Empty data
        .expect(400);

      // 5. Accessing other user's data
      const otherUserData = {
        firstName: 'Other',
        lastName: 'User',
        email: TestHelpers.generateRandomEmail(),
        password: 'other123',
        userType: 'customer'
      };

      const otherUserResponse = await request(app)
        .post('/api/auth/register')
        .send(otherUserData);

      const otherUserToken = otherUserResponse.body.data.token;

      // Create booking with customer token, try to access with other user token
      const bookingData = TestHelpers.createTestBookingData(customerId);
      const bookingResponse = await request(app)
        .post('/api/booking')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(bookingData);

      const bookingId = bookingResponse.body.data.id;

      // Other user trying to access this booking should fail
      await request(app)
        .get(`/api/booking/${bookingId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);
    });
  });

  describe('Data Validation Flow', () => {
    it('should validate booking data correctly', async () => {
      // Missing required fields
      await request(app)
        .post('/api/booking')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          pickupAddress: {
            address: '123 Test'
            // Missing required fields
          }
        })
        .expect(400);

      // Invalid service type
      const invalidBooking = TestHelpers.createTestBookingData(customerId);
      (invalidBooking as any).serviceType = 'invalid_service_type';

      await request(app)
        .post('/api/booking')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(invalidBooking)
        .expect(400);

      // Invalid weight (negative)
      const negativeWeightBooking = TestHelpers.createTestBookingData(customerId);
      (negativeWeightBooking as any).weight = -5;

      await request(app)
        .post('/api/booking')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(negativeWeightBooking)
        .expect(400);
    });

    it('should validate address data correctly', async () => {
      // Missing required fields
      await request(app)
        .post('/api/address')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          label: 'Test'
          // Missing required fields
        })
        .expect(400);

      // Invalid address type
      await request(app)
        .post('/api/address')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          label: 'Test',
          type: 'invalid_type',
          contactName: 'Test',
          phone: '+1234567890',
          street: '123 Test',
          city: 'Test',
          state: 'Test',
          zipCode: '12345',
          country: 'USA'
        })
        .expect(400);

      // Invalid phone format
      await request(app)
        .post('/api/address')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          label: 'Test',
          type: 'home',
          contactName: 'Test',
          phone: 'invalid-phone',
          street: '123 Test',
          city: 'Test',
          state: 'Test',
          zipCode: '12345',
          country: 'USA'
        })
        .expect(400);
    });
  });
});
