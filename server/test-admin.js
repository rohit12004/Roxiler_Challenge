const BASE_URL = 'http://localhost:5000/api';

const logResult = (testName, passed, details = '') => {
  const symbol = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${symbol}] ${testName} ${details ? `(${details})` : ''}`);
};

const runAdminTests = async () => {
  console.log('=== Starting Administrative End-to-End API Tests ===\n');

  let adminToken = null;
  let userToken = null;

  // 1. Log in as Admin to get token
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@roxiler.com', password: 'Admin@123' })
    });
    const data = await res.json();
    if (res.status === 200 && data.data?.accessToken) {
      adminToken = data.data.accessToken;
      logResult('Admin Login', true);
    } else {
      logResult('Admin Login', false, `Status: ${res.status}`);
      return;
    }
  } catch (err) {
    logResult('Admin Login', false, err.message);
    return;
  }

  // 2. Log in as Normal User to get token
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user1@roxiler.com', password: 'Admin@123' })
    });
    const data = await res.json();
    if (res.status === 200 && data.data?.accessToken) {
      userToken = data.data.accessToken;
      logResult('Normal User Login', true);
    } else {
      logResult('Normal User Login', false, `Status: ${res.status}`);
      return;
    }
  } catch (err) {
    logResult('Normal User Login', false, err.message);
    return;
  }

  // Test 3: Unauthorized Access Protection (Normal user tries to access admin stats)
  try {
    const res = await fetch(`${BASE_URL}/admin/stats`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    const passed = res.status === 403;
    logResult('Role Authorization Check (User accessing Admin endpoint)', passed, `Status: ${res.status} (Expected: 403)`);
  } catch (err) {
    logResult('Role Authorization Check', false, err.message);
  }

  // Test 4: Access Admin Stats (Admin accessing stats)
  try {
    const res = await fetch(`${BASE_URL}/admin/stats`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    const passed = res.status === 200 && 
                   data.status === 'success' && 
                   data.data.totalUsers >= 2 && 
                   data.data.totalStores >= 2;
    logResult('Get Dashboard Stats', passed, `Users: ${data.data?.totalUsers}, Stores: ${data.data?.totalStores}, Ratings: ${data.data?.totalRatings}`);
  } catch (err) {
    logResult('Get Dashboard Stats', false, err.message);
  }

  // Test 5: List Users (Normal and Admin users)
  try {
    const res = await fetch(`${BASE_URL}/admin/users`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    const passed = res.status === 200 && 
                   data.status === 'success' && 
                   Array.isArray(data.data.users) && 
                   data.data.users.length >= 2;
    logResult('List Users (Normal/Admins)', passed, `Fetched: ${data.data.users?.length} accounts`);
  } catch (err) {
    logResult('List Users (Normal/Admins)', false, err.message);
  }

  // Test 6: Search Users by query
  try {
    const res = await fetch(`${BASE_URL}/admin/users?search=Jane`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    const passed = res.status === 200 && 
                   data.data.users.every(u => u.name.includes('Jane') || u.email.includes('Jane'));
    logResult('List Users with Search Filter (?search=Jane)', passed, `Matches: ${data.data.users?.length}`);
  } catch (err) {
    logResult('List Users with Search Filter', false, err.message);
  }

  // Test 7: Filter Users by Role
  try {
    const res = await fetch(`${BASE_URL}/admin/users?role=admin`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    const passed = res.status === 200 && 
                   data.data.users.every(u => u.role === 'admin');
    logResult('List Users with Role Filter (?role=admin)', passed, `Matches: ${data.data.users?.length}`);
  } catch (err) {
    logResult('List Users with Role Filter', false, err.message);
  }

  // Test 8: List Stores with Average Ratings
  try {
    const res = await fetch(`${BASE_URL}/admin/stores`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    const passed = res.status === 200 && 
                   data.status === 'success' && 
                   Array.isArray(data.data.stores) && 
                   data.data.stores.length >= 2;
    logResult('List Stores with Avg Ratings', passed, `Fetched: ${data.data.stores?.length} stores`);
  } catch (err) {
    logResult('List Stores with Avg Ratings', false, err.message);
  }

  // Test 9: Get Store Details & Reviews (da67c9c0-992a-4a2c-905b-8e50bc783333 is electronic store)
  try {
    const res = await fetch(`${BASE_URL}/admin/users/da67c9c0-992a-4a2c-905b-8e50bc783333`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    const user = data.data?.user;
    const passed = res.status === 200 && 
                   user && 
                   user.role === 'owner' && 
                   user.averageRating === 4 && 
                   user.reviews?.length === 2;
    logResult('Get Store Details & Reviews', passed, `Store: "${user?.name}", Avg Rating: ${user?.averageRating}, Reviews: ${user?.reviews?.length}`);
  } catch (err) {
    logResult('Get Store Details & Reviews', false, err.message);
  }

  // Test 10: Create new Store Account via Admin
  const newStore = {
    name: 'New Registered Store Outlet (Admin Created)',
    email: `store_${Date.now()}@example.com`,
    password: 'Password123!',
    address: '999 Administration Boulevard, City Center',
    role: 'owner'
  };

  try {
    const res = await fetch(`${BASE_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(newStore)
    });
    const data = await res.json();
    const passed = res.status === 201 && data.status === 'success' && data.data?.user?.email === newStore.email;
    logResult('Register Account via Admin (Role: owner)', passed, `Status: ${res.status}`);
  } catch (err) {
    logResult('Register Account via Admin', false, err.message);
  }

  // Test 11: Validation check on user creation via admin (Short Name)
  try {
    const res = await fetch(`${BASE_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        ...newStore,
        email: `error_${Date.now()}@example.com`,
        name: 'Short Name'
      })
    });
    const data = await res.json();
    const passed = res.status === 400 && data.errors?.some(e => e.field === 'name');
    logResult('Admin Account Creation Validation (Name < 20 chars)', passed, `Status: ${res.status}`);
  } catch (err) {
    logResult('Admin Account Creation Validation', false, err.message);
  }

  // Test 12: Create user with BLANK password (Auto-generation)
  let generatedUser = null;
  const blankPwdUser = {
    name: 'New Registered Customer (Blank Password Test)',
    email: `blank_pwd_${Date.now()}@example.com`,
    password: '',
    address: '101 Auto-Generated Street, Cybercity',
    role: 'user'
  };

  try {
    const res = await fetch(`${BASE_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(blankPwdUser)
    });
    const data = await res.json();
    generatedUser = data.data?.user;
    
    const hasTempPassword = generatedUser && typeof generatedUser.temporaryPassword === 'string';
    const startsWithTemp = hasTempPassword && generatedUser.temporaryPassword.startsWith('Temp_');
    const endsWithBang = hasTempPassword && generatedUser.temporaryPassword.endsWith('!');
    const lengthSatisfied = hasTempPassword && generatedUser.temporaryPassword.length === 14;

    const passed = res.status === 201 && hasTempPassword && startsWithTemp && endsWithBang && lengthSatisfied;
    logResult('Create Account with Blank Password (Auto-gen)', passed, `Temp Password: ${generatedUser?.temporaryPassword}`);
  } catch (err) {
    logResult('Create Account with Blank Password (Auto-gen)', false, err.message);
  }

  // Test 13: Reset Password for the newly created user
  if (generatedUser) {
    try {
      const res = await fetch(`${BASE_URL}/admin/users/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ userId: generatedUser.id })
      });
      const data = await res.json();
      const newTempPassword = data.data?.temporaryPassword;
      
      const hasTempPassword = typeof newTempPassword === 'string';
      const startsWithTemp = hasTempPassword && newTempPassword.startsWith('Temp_');
      const lengthSatisfied = hasTempPassword && newTempPassword.length === 14;
      const isDifferent = hasTempPassword && newTempPassword !== generatedUser.temporaryPassword;

      const passed = res.status === 200 && hasTempPassword && startsWithTemp && lengthSatisfied && isDifferent;
      logResult('Reset Password via Admin', passed, `New Temp Password: ${newTempPassword}`);
    } catch (err) {
      logResult('Reset Password via Admin', false, err.message);
    }
  } else {
    logResult('Reset Password via Admin', false, 'Skipped: User was not created.');
  }

  // Test 14: Log in as a Store Owner and Access Store Owner Dashboard
  try {
    // Log in as electronic store owner: owner1@roxiler.com / Owner@123
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner1@roxiler.com', password: 'Owner@123' })
    });
    const loginData = await loginRes.json();
    const ownerToken = loginData.data?.accessToken;

    if (loginRes.status === 200 && ownerToken) {
      const res = await fetch(`${BASE_URL}/store/dashboard`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${ownerToken}` }
      });
      const data = await res.json();
      
      const passed = res.status === 200 &&
                     data.status === 'success' &&
                     data.data?.store?.email === 'owner1@roxiler.com' &&
                     typeof data.data?.averageRating === 'number' &&
                     Array.isArray(data.data?.reviews);

      logResult('Get Store Owner Dashboard Analytics', passed, `Reviews Count: ${data.data?.reviews?.length}`);
    } else {
      logResult('Store Owner Login', false, `Status: ${loginRes.status}`);
    }
  } catch (err) {
    logResult('Get Store Owner Dashboard Analytics', false, err.message);
  }

  console.log('\n=== Administrative Testing Finished ===');
};

runAdminTests();
