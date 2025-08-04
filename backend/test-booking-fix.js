const axios = require('axios');

// Test booking creation without customerId field
async function testBookingCreation() {
  try {
    console.log('Testing booking creation fix...');
    
    // First, we need to login to get a token
    const loginResponse = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'test@example.com', // Replace with a valid test user
      password: 'testpassword'
    });
    
    const token = loginResponse.data.data.token;
    console.log('Login successful, token obtained');
    
    // Now test booking creation without customerId
    const bookingData = {
      // Note: No customerId field - this should be automatically set
      pickupAddress: {
        address: "123 Test Street",
        contactName: "John Doe",
        phone: "+91-9876543210",
        city: "Mumbai",
        postalCode: "400001"
      },
      deliveryAddress: {
        address: "456 Delivery Road",
        contactName: "Jane Doe", 
        phone: "+91-9876543211",
        city: "Delhi",
        postalCode: "110001"
      },
      serviceType: "standard",
      weight: 2.5,
      packageType: "Document",
      pickupDate: "2025-08-05T10:00:00.000Z",
      description: "Test booking"
    };
    
    const bookingResponse = await axios.post('http://localhost:5000/api/v1/bookings', bookingData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Booking creation successful!');
    console.log('Response:', bookingResponse.data);
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Error:', error.response.status, error.response.data);
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
}

// Run the test if a server is running on port 5000
testBookingCreation();
