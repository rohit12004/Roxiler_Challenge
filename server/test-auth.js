const BASE_URL = 'http://localhost:5000/api/auth';

const logResult = (testName, passed, details = '') => {
  const symbol = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${symbol}] ${testName} ${details ? `(${details})` : ''}`);
};

const runTests = async () => {
  console.log('=== Starting Authentication End-to-End API Tests ===\n');

  const testEmail = `testuser_${Date.now()}@example.com`;
  const validUser = {
    name: 'Standard User Test Account Name (Long Enough)',
    email: testEmail,
    password: 'Password123!',
    address: '123 Test Street, Developer City',
    role: 'user'
  };

  // Test 1: Name validation error (too short)
  try {
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validUser,
        name: 'Short Name'
      })
    });
    const data = await res.json();
    const passed = res.status === 400 && data.errors?.some(e => e.field === 'name');
    logResult('Name validation check (<20 chars)', passed, `Status: ${res.status}`);
  } catch (err) {
    logResult('Name validation check (<20 chars)', false, err.message);
  }

  // Test 2: Password validation error (no special char)
  try {
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validUser,
        password: 'Password123'
      })
    });
    const data = await res.json();
    const passed = res.status === 400 && data.errors?.some(e => e.field === 'password');
    logResult('Password validation check (missing special char)', passed, `Status: ${res.status}`);
  } catch (err) {
    logResult('Password validation check (missing special char)', false, err.message);
  }

  // Test 3: Password validation error (no uppercase)
  try {
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validUser,
        password: 'password123!'
      })
    });
    const data = await res.json();
    const passed = res.status === 400 && data.errors?.some(e => e.field === 'password');
    logResult('Password validation check (missing uppercase)', passed, `Status: ${res.status}`);
  } catch (err) {
    logResult('Password validation check (missing uppercase)', false, err.message);
  }

  // Test 4: Successful Registration
  let registeredUser = null;
  try {
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validUser)
    });
    const data = await res.json();
    const passed = res.status === 201 && data.status === 'success';
    if (passed) registeredUser = data.data.user;
    logResult('User Registration', passed, `Status: ${res.status}`);
  } catch (err) {
    logResult('User Registration', false, err.message);
  }

  // Test 5: Successful Login
  let accessToken = null;
  let refreshCookie = null;
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: validUser.email,
        password: validUser.password
      })
    });
    const data = await res.json();
    const passed = res.status === 200 && data.status === 'success' && !!data.data.accessToken;
    if (passed) {
      accessToken = data.data.accessToken;
      
      // Extract refreshToken from the Set-Cookie header
      const setCookie = res.headers.get('set-cookie');
      if (setCookie) {
        const match = setCookie.match(/refreshToken=([^;]+)/);
        if (match) refreshCookie = match[0];
      }
    }
    logResult('User Login', passed, `Status: ${res.status}`);
  } catch (err) {
    logResult('User Login', false, err.message);
  }

  // Test 6: Access /api/auth/me (Protected Route)
  try {
    const res = await fetch(`${BASE_URL}/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const data = await res.json();
    const passed = res.status === 200 && data.status === 'success' && data.data.user.email === validUser.email;
    logResult('Access Protected Route (/me)', passed, `Status: ${res.status}`);
  } catch (err) {
    logResult('Access Protected Route (/me)', false, err.message);
  }

  // Test 7: Access Token refresh via HttpOnly Cookie simulation (Verifies Token Rotation)
  let newAccessToken = null;
  try {
    const res = await fetch(`${BASE_URL}/refresh`, {
      method: 'POST',
      headers: {
        'Cookie': refreshCookie || ''
      }
    });
    const data = await res.json();
    const passed = res.status === 200 && data.status === 'success' && !!data.data.accessToken;
    if (passed) {
      newAccessToken = data.data.accessToken;
      // Extract the rotated refresh token from the Set-Cookie header
      const setCookie = res.headers.get('set-cookie');
      if (setCookie) {
        const match = setCookie.match(/refreshToken=([^;]+)/);
        if (match) refreshCookie = match[0];
      }
    }
    logResult('Token Refresh with Rotation (/refresh)', passed, `Status: ${res.status}`);
  } catch (err) {
    logResult('Token Refresh with Rotation (/refresh)', false, err.message);
  }

  // Test 8: Logout
  try {
    const res = await fetch(`${BASE_URL}/logout`, {
      method: 'POST',
      headers: {
        'Cookie': refreshCookie || ''
      }
    });
    const data = await res.json();
    const passed = res.status === 200 && data.status === 'success';
    logResult('User Logout (/logout)', passed, `Status: ${res.status}`);
  } catch (err) {
    logResult('User Logout (/logout)', false, err.message);
  }

  // Test 9: Verify token is revoked after logout
  try {
    const res = await fetch(`${BASE_URL}/refresh`, {
      method: 'POST',
      headers: {
        'Cookie': refreshCookie || ''
      }
    });
    const passed = res.status === 401;
    logResult('Revocation Check post-logout', passed, `Status: ${res.status} (Expected: 401)`);
  } catch (err) {
    logResult('Revocation Check post-logout', false, err.message);
  }

  // Test 10: Logout All (Verifies global session revocation)
  try {
    console.log('\n--- Starting Logout-All / Global Session Revocation Tests ---');
    
    // 10a. Create Session A (Login 1)
    let cookieA = null;
    const resLoginA = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: validUser.email, password: validUser.password })
    });
    const setCookieA = resLoginA.headers.get('set-cookie');
    if (setCookieA) {
      const match = setCookieA.match(/refreshToken=([^;]+)/);
      if (match) cookieA = match[0];
    }
    
    // 10b. Create Session B (Login 2)
    let cookieB = null;
    const resLoginB = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: validUser.email, password: validUser.password })
    });
    const setCookieB = resLoginB.headers.get('set-cookie');
    if (setCookieB) {
      const match = setCookieB.match(/refreshToken=([^;]+)/);
      if (match) cookieB = match[0];
    }

    // Ensure we have two distinct sessions
    const gotSessions = !!cookieA && !!cookieB && cookieA !== cookieB;
    logResult('Multi-session login creation', gotSessions);

    if (gotSessions) {
      // 10c. Call logout-all using Session B
      const resLogoutAll = await fetch(`${BASE_URL}/logout-all`, {
        method: 'POST',
        headers: { 'Cookie': cookieB }
      });
      const dataLogoutAll = await resLogoutAll.json();
      const logoutAllPassed = resLogoutAll.status === 200 && dataLogoutAll.status === 'success';
      logResult('Global Logout execution (/logout-all)', logoutAllPassed, `Status: ${resLogoutAll.status}`);

      // 10d. Verify Session A is revoked
      const resRefreshA = await fetch(`${BASE_URL}/refresh`, {
        method: 'POST',
        headers: { 'Cookie': cookieA }
      });
      const sessionARevoked = resRefreshA.status === 401;
      logResult('Session A revoked check', sessionARevoked, `Status: ${resRefreshA.status} (Expected: 401)`);

      // 10e. Verify Session B is revoked
      const resRefreshB = await fetch(`${BASE_URL}/refresh`, {
        method: 'POST',
        headers: { 'Cookie': cookieB }
      });
      const sessionBRevoked = resRefreshB.status === 401;
      logResult('Session B revoked check', sessionBRevoked, `Status: ${resRefreshB.status} (Expected: 401)`);
    } else {
      logResult('Logout All verification', false, 'Could not establish distinct sessions for verification');
    }
  } catch (err) {
    logResult('Logout All verification', false, err.message);
  }

  console.log('\n=== Testing Finished ===');
};

runTests();
