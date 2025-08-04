// Simple test script to verify backend-frontend integration
const API_URL = 'http://localhost:5000/api/v1';

async function testAPI() {
    console.log('🧪 Testing Backend API Integration...\n');

    // Test 1: Register a new user
    console.log('1. Testing user registration...');
    try {
        const registerResponse = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                firstName: 'Test',
                lastName: 'User',
                email: `test${Date.now()}@example.com`,
                password: 'TestPass123',
                userType: 'customer',
                companyName: 'Test Company',
                phone: '+919876543210'
            })
        });

        const registerData = await registerResponse.json();
        
        if (registerData.success) {
            console.log('✅ Registration successful');
            console.log('   User ID:', registerData.data.user.id);
            console.log('   User Type:', registerData.data.user.userType);
            console.log('   Token received:', registerData.data.token ? 'Yes' : 'No');
            
            // Test 2: Login with the same user
            console.log('\n2. Testing user login...');
            const loginResponse = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: registerData.data.user.email,
                    password: 'TestPass123'
                })
            });

            const loginData = await loginResponse.json();
            
            if (loginData.success) {
                console.log('✅ Login successful');
                console.log('   Welcome:', loginData.data.user.firstName, loginData.data.user.lastName);
                
                // Test 3: Get user profile
                console.log('\n3. Testing profile retrieval...');
                const profileResponse = await fetch(`${API_URL}/auth/profile`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${loginData.data.token}`,
                        'Content-Type': 'application/json',
                    }
                });

                const profileData = await profileResponse.json();
                
                if (profileData.success) {
                    console.log('✅ Profile retrieval successful');
                    console.log('   Profile data:', profileData.data.firstName, profileData.data.lastName);
                } else {
                    console.log('❌ Profile retrieval failed:', profileData.message);
                }
                
                // Test 4: Logout
                console.log('\n4. Testing logout...');
                const logoutResponse = await fetch(`${API_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${loginData.data.token}`,
                        'Content-Type': 'application/json',
                    }
                });

                const logoutData = await logoutResponse.json();
                
                if (logoutData.success) {
                    console.log('✅ Logout successful');
                } else {
                    console.log('❌ Logout failed:', logoutData.message);
                }
                
            } else {
                console.log('❌ Login failed:', loginData.message);
            }
            
        } else {
            console.log('❌ Registration failed:', registerData.message);
        }
        
    } catch (error) {
        console.error('❌ API Test failed:', error.message);
        console.log('\n💡 Make sure the backend server is running on http://localhost:5000');
    }

    console.log('\n🏁 Integration test completed!');
}

// Run the test
testAPI();
