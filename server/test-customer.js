const BASE_URL = 'http://localhost:5000/api';

const logResult = (testName, passed, details = '') => {
  const symbol = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${symbol}] ${testName} ${details ? `(${details})` : ''}`);
};

const runCustomerTests = async () => {
  console.log('=== Starting Customer End-to-End API Tests ===\n');

  let userToken = null;
  const store2Id = 'da67c9c0-992a-4a2c-905b-8e50bc784444'; // Seeded store2

  // 1. Log in as Normal User
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user1@roxiler.com', password: 'Admin@123' })
    });
    const data = await res.json();
    if (res.status === 200 && data.data?.accessToken) {
      userToken = data.data.accessToken;
      logResult('Customer Login', true);
    } else {
      logResult('Customer Login', false, `Status: ${res.status}`);
      return;
    }
  } catch (err) {
    logResult('Customer Login', false, err.message);
    return;
  }

  // Test 2: Get Stores Directory
  try {
    const res = await fetch(`${BASE_URL}/stores`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    const data = await res.json();
    const passed = res.status === 200 && 
                   data.status === 'success' && 
                   Array.isArray(data.data.stores) && 
                   data.data.stores.length >= 2;
    logResult('Get Stores Directory', passed, `Fetched: ${data.data.stores?.length} stores`);
  } catch (err) {
    logResult('Get Stores Directory', false, err.message);
  }

  // Test 3: Search Stores
  try {
    const res = await fetch(`${BASE_URL}/stores?search=Fashion`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    const data = await res.json();
    const passed = res.status === 200 && 
                   data.data.stores.every(s => s.name.includes('Fashion') || s.address.includes('Fashion'));
    logResult('Search Stores (?search=Fashion)', passed, `Matches: ${data.data.stores?.length}`);
  } catch (err) {
    logResult('Search Stores', false, err.message);
  }

  // Test 4: Submit Rating (Post new rating)
  try {
    const res = await fetch(`${BASE_URL}/ratings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        storeId: store2Id,
        rating: 5,
        reviewText: 'This store is amazing! Loved the experience.'
      })
    });
    const data = await res.json();
    const passed = res.status === 200 && data.status === 'success' && data.data.rating.rating === 5;
    logResult('Submit Rating (5 stars)', passed, `Status: ${res.status}`);
  } catch (err) {
    logResult('Submit Rating', false, err.message);
  }

  // Test 5: Verify rating was saved in stores list
  try {
    const res = await fetch(`${BASE_URL}/stores`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    const data = await res.json();
    const store2 = data.data.stores.find(s => s.id === store2Id);
    const passed = store2 && store2.userRating === 5 && store2.userReviewText === 'This store is amazing! Loved the experience.';
    logResult('Verify Rating Stored', passed);
  } catch (err) {
    logResult('Verify Rating Stored', false, err.message);
  }

  // Test 6: Modify Rating (Updates existing rating)
  try {
    const res = await fetch(`${BASE_URL}/ratings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        storeId: store2Id,
        rating: 4,
        reviewText: 'Updated review: Good store, slightly expensive.'
      })
    });
    const data = await res.json();
    const passed = res.status === 200 && data.status === 'success' && data.data.rating.rating === 4 && data.data.rating.updated === true;
    logResult('Modify Rating (4 stars)', passed, `Status: ${res.status}`);
  } catch (err) {
    logResult('Modify Rating', false, err.message);
  }

  // Test 7: Verify modified rating in list
  try {
    const res = await fetch(`${BASE_URL}/stores`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    const data = await res.json();
    const store2 = data.data.stores.find(s => s.id === store2Id);
    const passed = store2 && store2.userRating === 4 && store2.userReviewText === 'Updated review: Good store, slightly expensive.';
    logResult('Verify Rating Modified', passed);
  } catch (err) {
    logResult('Verify Rating Modified', false, err.message);
  }

  // Test 8: Password Update (Change to new password)
  const currentPassword = 'Admin@123';
  const newPassword = 'NewPassword123!';

  try {
    const res = await fetch(`${BASE_URL}/auth/update-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });
    const data = await res.json();
    const passed = res.status === 200 && data.status === 'success';
    logResult('Update Password', passed, `Status: ${res.status}`);
  } catch (err) {
    logResult('Update Password', false, err.message);
  }

  // Test 9: Verify old password fails
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user1@roxiler.com', password: currentPassword })
    });
    const passed = res.status === 401;
    logResult('Verify Old Password Fails', passed, `Status: ${res.status} (Expected: 401)`);
  } catch (err) {
    logResult('Verify Old Password Fails', false, err.message);
  }

  // Test 10: Verify new password succeeds and retrieve new token
  let newUserToken = null;
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user1@roxiler.com', password: newPassword })
    });
    const data = await res.json();
    const passed = res.status === 200 && !!data.data?.accessToken;
    if (passed) newUserToken = data.data.accessToken;
    logResult('Verify New Password Succeeds', passed, `Status: ${res.status}`);
  } catch (err) {
    logResult('Verify New Password Succeeds', false, err.message);
  }

  // Test 11: Revert password back to original (Clean up)
  if (newUserToken) {
    try {
      const res = await fetch(`${BASE_URL}/auth/update-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${newUserToken}`
        },
        body: JSON.stringify({
          currentPassword: newPassword,
          newPassword: currentPassword
        })
      });
      const data = await res.json();
      const passed = res.status === 200 && data.status === 'success';
      logResult('Cleanup Revert Password', passed);
    } catch (err) {
      logResult('Cleanup Revert Password', false, err.message);
    }
  }

  console.log('\n=== Customer Testing Finished ===');
};

runCustomerTests();
