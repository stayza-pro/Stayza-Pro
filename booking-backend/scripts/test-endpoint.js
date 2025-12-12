const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const BASE_URL = 'http://localhost:5050/api';
const JWT_SECRET = process.env.JWT_SECRET;
const USER_ID = 'cmivrjc1f000attvksgxfjclp';

async function testEndpoint() {
  try {
    // Generate token
    const token = jwt.sign(
      { id: USER_ID, email: 'soodelight1@gmail.com', role: 'GUEST' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('\n🔍 Testing Backend Connectivity...\n');

    // Test 1: Health check
    console.log('1️⃣ Testing health check...');
    try {
      const healthResponse = await axios.get('http://localhost:5050/health');
      console.log('   ✅ Health check passed:', healthResponse.data);
    } catch (error) {
      console.log('   ❌ Health check failed:', error.message);
      console.log('   🚨 BACKEND IS NOT RUNNING!');
      return;
    }

    // Test 2: Auth endpoint
    console.log('\n2️⃣ Testing authenticated request...');
    try {
      const authResponse = await axios.get(`${BASE_URL}/bookings/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('   ✅ Auth working, found', authResponse.data.data?.length || 0, 'bookings');
    } catch (error) {
      console.log('   ❌ Auth failed:', error.response?.data?.message || error.message);
    }

    // Test 3: Payment initialization (dry run)
    console.log('\n3️⃣ Testing payment endpoint reachability...');
    try {
      const paymentResponse = await axios.post(
        `${BASE_URL}/payments/initialize-paystack`,
        { bookingId: 'test-booking-id' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('   ✅ Endpoint reached (even if it returns error)');
    } catch (error) {
      if (error.response) {
        console.log('   ✅ Endpoint reached, returned:', error.response.status, error.response.data.message);
      } else {
        console.log('   ❌ Cannot reach endpoint:', error.message);
        console.log('   🚨 CHECK IF BACKEND IS RUNNING ON PORT 5050');
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('DIAGNOSIS:');
    console.log('='.repeat(50));
    console.log('If all tests passed, backend is working.');
    console.log('Check frontend console for actual errors.');
    console.log('Check backend terminal for request logs.');
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEndpoint();
