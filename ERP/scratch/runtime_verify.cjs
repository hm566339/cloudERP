const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          // keep as string
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed,
          raw: data
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      if (typeof body === 'object') {
        req.write(JSON.stringify(body));
      } else {
        req.write(body);
      }
    }
    req.end();
  });
}

async function run() {
  console.log('================================================================');
  console.log('REAL RUNTIME VERIFICATION FOR VISHAL / VISHAL / OWNER');
  console.log('================================================================\n');

  // STEP 1: Logout / clear session
  console.log('--- Step 1: Clear existing session / Logout ---');
  try {
    const logoutRes = await request({
      hostname: 'localhost',
      port: 8090,
      path: '/api/sso/auth/logout',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`Logout Status: ${logoutRes.statusCode}`);
  } catch (err) {
    console.log(`Logout Note: ${err.message}`);
  }

  // STEP 2 & 3: Normal organization login flow & Select company VISHAL
  console.log('\n--- Step 2 & 3: Organization Login & Company Selection ---');
  const loginPayload = {
    data: {
      organizationCode: 'vishal',
      email: 'vishal@gmail.com',
      password: 'Admin@123',
      companyId: 'ff808d58-4bd6-4036-9642-03c6212b48f3'
    }
  };

  const loginRes = await request({
    hostname: 'localhost',
    port: 8090,
    path: '/api/sso/auth/select-company',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }, loginPayload);

  console.log(`Select Company Status: ${loginRes.statusCode}`);
  console.log('Select Company Response:', JSON.stringify(loginRes.data, null, 2));

  let authCode = null;
  if (loginRes.data?.data?.redirectUrl) {
    const url = new URL(loginRes.data.data.redirectUrl);
    authCode = url.searchParams.get('code');
  }

  if (!authCode) {
    console.error('FATAL: Could not obtain authorization code from redirectUrl!');
    return;
  }
  console.log(`\nObtained fresh authorization code: ${authCode}`);

  // STEP 4: Exchange code for access token
  console.log('\n--- Step 4: Token Exchange ---');
  const exchangePayload = {
    data: {
      code: authCode,
      clientId: '78ff3d7d-e7ef-47e4-bb40-9d1aa919f715', // accountDev client
      clientSecret: 'f3yzpBBBwHK2giz9eX2Kv7zbIs4L4NwgN4IzeHW58gWBLWcc'
    }
  };

  const exchangeRes = await request({
    hostname: 'localhost',
    port: 8090,
    path: '/api/sso/token/exchange',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }, exchangePayload);

  console.log(`Token Exchange Status: ${exchangeRes.statusCode}`);
  console.log('Token Exchange Response keys:', Object.keys(exchangeRes.data || {}));
  
  const accessToken = exchangeRes.data?.access_token || exchangeRes.data?.data?.access_token || exchangeRes.data?.data?.accessToken || exchangeRes.data?.accessToken;
  if (!accessToken) {
    console.error('FATAL: Access token not returned in token exchange:', exchangeRes.data);
    return;
  }
  console.log(`Access Token obtained successfully! (length: ${accessToken.length})`);

  // STEP 5: Call GET /api/sso/auth/me
  console.log('\n--- Step 5: Verification of GET /api/sso/auth/me ---');
  const meRes = await request({
    hostname: 'localhost',
    port: 8090,
    path: '/api/sso/auth/me',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  console.log(`GET /api/sso/auth/me Status: ${meRes.statusCode}`);
  const meData = meRes.data?.data || meRes.data;

  // Detailed validations:
  console.log('Organization:', meData?.organization);
  console.log('Current Company:', meData?.currentCompany);
  console.log('Membership:', meData?.membership);
  console.log('Subscription:', meData?.subscription);
  console.log('Authorized Modules:', meData?.authorizedModules?.map(m => m.name || m.moduleName));
  console.log('Total Permissions count:', meData?.permissions?.length);
  
  const accountPerms = (meData?.permissions || []).filter(p => (p.moduleName || '').toUpperCase().includes('ACCOUNT') || (p.featureCode || '').includes('CUSTOMER') || (p.featureCode || '').includes('DASHBOARD'));
  const inventoryPerms = (meData?.permissions || []).filter(p => (p.moduleName || '').toUpperCase().includes('INVENTORY') || (p.featureCode || '').includes('PRODUCT') || (p.featureCode || '').includes('STOCK'));
  console.log(`Account-related permissions count: ${accountPerms.length}`);
  console.log(`Inventory-related permissions count: ${inventoryPerms.length}`);

  // Also verify token directly against SSO token verification
  console.log('\n--- Step 5b: SSO Token Verification API ---');
  const verifyRes = await request({
    hostname: 'localhost',
    port: 8090,
    path: '/api/sso/token/verify',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  console.log(`SSO /api/sso/token/verify Status: ${verifyRes.statusCode}`);
  const verifyData = verifyRes.data?.data || verifyRes.data;
  console.log('SSO Verify Token User:', {
    username: verifyData?.user?.username,
    orgCode: verifyData?.user?.organizationCode,
    companyCode: verifyData?.user?.companyCode,
    accessMode: verifyData?.user?.accessMode,
    roles: verifyData?.user?.role?.map(r => r.name),
    permissionsCount: verifyData?.user?.permissions?.length
  });

  // STEP 6: Test ACTUAL Account API endpoints
  console.log('\n================================================================');
  console.log('--- Step 6: Testing Account Endpoints (/api/account/**) ---');
  console.log('================================================================');

  const authHeaders = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Cookie': `ACCESS_TOKEN=${accessToken}`
  };

  // 6a. Account Dashboard
  const acctDash = await request({
    hostname: 'localhost',
    port: 8081,
    path: '/api/account/dashboard',
    method: 'GET',
    headers: authHeaders
  });
  console.log(`Account Dashboard [GET /api/account/dashboard]: HTTP ${acctDash.statusCode}`);

  // 6b. Account Dashboard Cards
  const acctDashCards = await request({
    hostname: 'localhost',
    port: 8081,
    path: '/api/account/dashboard/cards',
    method: 'GET',
    headers: authHeaders
  });
  console.log(`Account Dashboard Cards [GET /api/account/dashboard/cards]: HTTP ${acctDashCards.statusCode}`);

  // 6c. Account Masters / Read (Customers)
  const custRead = await request({
    hostname: 'localhost',
    port: 8081,
    path: '/api/account/customers',
    method: 'GET',
    headers: authHeaders
  });
  console.log(`Account Customers READ [GET /api/account/customers]: HTTP ${custRead.statusCode}`);

  // 6d. Account Masters / Read (Vendors)
  const vendorRead = await request({
    hostname: 'localhost',
    port: 8081,
    path: '/api/account/v1/vendors',
    method: 'GET',
    headers: authHeaders
  });
  console.log(`Account Vendors READ [GET /api/account/v1/vendors]: HTTP ${vendorRead.statusCode}`);

  // 6e. Account CREATE/WRITE (Customer)
  const uniqueSuffix = Date.now().toString().slice(-6);
  const newCustPayload = {
    data: {
      customerCode: 'CUST-' + uniqueSuffix,
      customerName: 'Vishal Test Customer ' + uniqueSuffix,
      email: 'cust' + uniqueSuffix + '@example.com',
      phone: '9876543210',
      isActive: true
    }
  };
  const custCreate = await request({
    hostname: 'localhost',
    port: 8081,
    path: '/api/account/customers',
    method: 'POST',
    headers: authHeaders
  }, newCustPayload);
  console.log(`Account Customer CREATE [POST /api/account/customers]: HTTP ${custCreate.statusCode}`);
  const createdCustId = custCreate.data?.data?.id || custCreate.data?.id;
  console.log(`Created Customer ID: ${createdCustId}`);

  // 6f. Account UPDATE
  if (createdCustId) {
    const updateCustPayload = {
      data: {
        customerCode: 'CUST-' + uniqueSuffix,
        customerName: 'Vishal Customer Updated ' + uniqueSuffix,
        email: 'cust' + uniqueSuffix + '@example.com',
        phone: '9876543210',
        isActive: true
      }
    };
    const custUpdate = await request({
      hostname: 'localhost',
      port: 8081,
      path: `/api/account/customers/${createdCustId}`,
      method: 'PUT',
      headers: authHeaders
    }, updateCustPayload);
    console.log(`Account Customer UPDATE [PUT /api/account/customers/${createdCustId}]: HTTP ${custUpdate.statusCode}`);

    // 6g. Account DELETE
    const custDelete = await request({
      hostname: 'localhost',
      port: 8081,
      path: `/api/account/customers/${createdCustId}`,
      method: 'DELETE',
      headers: authHeaders
    });
    console.log(`Account Customer DELETE [DELETE /api/account/customers/${createdCustId}]: HTTP ${custDelete.statusCode}`);
  }

  // STEP 7: Test ACTUAL Inventory API endpoints
  console.log('\n================================================================');
  console.log('--- Step 7: Testing Inventory Endpoints (/api/inventory/**) ---');
  console.log('================================================================');

  // 7a. Inventory Dashboard
  const invDash = await request({
    hostname: 'localhost',
    port: 8082,
    path: '/api/inventory/dashboard?companyId=ff808d58-4bd6-4036-9642-03c6212b48f3&role=OWNER',
    method: 'GET',
    headers: authHeaders
  });
  console.log(`Inventory Dashboard [GET /api/inventory/dashboard]: HTTP ${invDash.statusCode}`);

  // 7b. Products READ
  const prodRead = await request({
    hostname: 'localhost',
    port: 8082,
    path: '/api/inventory/products',
    method: 'GET',
    headers: authHeaders
  });
  console.log(`Inventory Products READ [GET /api/inventory/products]: HTTP ${prodRead.statusCode}`);

  // 7c. Stock READ
  const stockRead = await request({
    hostname: 'localhost',
    port: 8082,
    path: '/api/inventory/inventory-stocks',
    method: 'GET',
    headers: authHeaders
  });
  console.log(`Inventory Stock READ [GET /api/inventory/inventory-stocks]: HTTP ${stockRead.statusCode}`);

  // 7d. Warehouse READ
  const whRead = await request({
    hostname: 'localhost',
    port: 8082,
    path: '/api/inventory/warehouses',
    method: 'GET',
    headers: authHeaders
  });
  console.log(`Inventory Warehouse READ [GET /api/inventory/warehouses]: HTTP ${whRead.statusCode}`);

  // 7e. Inventory CREATE/WRITE (Warehouse)
  const newWhPayload = {
    data: {
      warehouseName: 'Vishal WH ' + uniqueSuffix,
      warehouseType: 'MAIN',
      addressLine1: 'Central Warehouse Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pinCode: '400001',
      status: 'ACTIVE'
    }
  };
  const whCreate = await request({
    hostname: 'localhost',
    port: 8082,
    path: '/api/inventory/warehouses',
    method: 'POST',
    headers: authHeaders
  }, newWhPayload);
  console.log(`Inventory Warehouse CREATE [POST /api/inventory/warehouses]: HTTP ${whCreate.statusCode}`);
  const createdWhId = whCreate.data?.data?.id || whCreate.data?.id;
  console.log(`Created Warehouse ID: ${createdWhId}`);

  // 7f. Inventory UPDATE
  if (createdWhId) {
    const updateWhPayload = {
      data: {
        warehouseName: 'Vishal WH Updated ' + uniqueSuffix,
        warehouseType: 'MAIN',
        addressLine1: 'Central Warehouse Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        pinCode: '400001',
        status: 'ACTIVE'
      }
    };
    const whUpdate = await request({
      hostname: 'localhost',
      port: 8082,
      path: `/api/inventory/warehouses/${createdWhId}`,
      method: 'PUT',
      headers: authHeaders
    }, updateWhPayload);
    console.log(`Inventory Warehouse UPDATE [PUT /api/inventory/warehouses/${createdWhId}]: HTTP ${whUpdate.statusCode}`);

    // 7g. Inventory DELETE
    const whDelete = await request({
      hostname: 'localhost',
      port: 8082,
      path: `/api/inventory/warehouses/${createdWhId}`,
      method: 'DELETE',
      headers: authHeaders
    });
    console.log(`Inventory Warehouse DELETE [DELETE /api/inventory/warehouses/${createdWhId}]: HTTP ${whDelete.statusCode}`);
  }

  // Also test through Gateway (port 8080)
  console.log('\n================================================================');
  console.log('--- Step 7b: Testing via API Gateway (port 8080) ---');
  console.log('================================================================');
  const gwAcct = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/account/customers',
    method: 'GET',
    headers: authHeaders
  });
  console.log(`Gateway Account Customers [GET :8080/api/account/customers]: HTTP ${gwAcct.statusCode}`);

  const gwInv = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/inventory/products',
    method: 'GET',
    headers: authHeaders
  });
  console.log(`Gateway Inventory Products [GET :8080/api/inventory/products]: HTTP ${gwInv.statusCode}`);

  console.log('\n================================================================');
  console.log('RUNTIME VERIFICATION COMPLETE');
  console.log('================================================================');
}

run().catch(console.error);
