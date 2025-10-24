const axios = require('axios');

async function testSettingsAPI() {
  try {
    console.log('🧪 Testing Settings API...');
    
    // Step 1: Login as admin
    console.log('Step 1: Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5050/api/auth/login', {
      email: 'admin@stayza.com',
      password: 'SecurePass123!'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }
    
    const { accessToken } = loginResponse.data.data;
    console.log('✅ Login successful');
    
    // Step 2: Fetch all settings
    console.log('Step 2: Fetching all settings...');
    const settingsResponse = await axios.get('http://localhost:5050/api/admin/settings', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log('✅ Settings API Response:', JSON.stringify(settingsResponse.data, null, 2));
    
    // Step 3: Test individual setting fetch
    console.log('Step 3: Fetching commission_rate setting...');
    const commissionResponse = await axios.get('http://localhost:5050/api/admin/settings/commission_rate', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log('✅ Commission Rate:', JSON.stringify(commissionResponse.data, null, 2));
    
    console.log('🎉 All tests passed! Settings API is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testSettingsAPI();