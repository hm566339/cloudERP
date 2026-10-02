import { attachRequestInterceptor } from './src/api/common/interceptors.js';

// Mock localStorage
const store = {};
global.localStorage = {
  getItem: (key) => store[key] || null,
  setItem: (key, value) => { store[key] = value; },
};

// Mock Axios Instance
const mockInstance = {
  interceptors: {
    request: {
      use: (handler) => handler
    }
  }
};

const interceptor = attachRequestInterceptor(mockInstance);

function runTest(name, mockState, config) {
  console.log(`\n--- Test: ${name} ---`);
  // Setup state
  global.localStorage.setItem('auth_user', JSON.stringify(mockState.authUser || {}));
  if (mockState.selectedCompany) {
    global.localStorage.setItem('selected_company', JSON.stringify(mockState.selectedCompany));
  } else {
    store['selected_company'] = null; // clear
  }
  
  const result = interceptor(config);
  console.log('Result Params:', result.params);
}

// 1. System Admin WITH company selected (chart-of-accounts)
runTest('System Admin with Company - Chart of Accounts', {
  authUser: { role: 'superadmin', companyCode: '000000' },
  selectedCompany: { id: 'uuid-1234', companyCode: '00001' }
}, {
  method: 'get',
  url: '/api/account/chart-of-accounts',
  params: { page: 0, size: 10, companyCode: '00001' }
});

// 2. System Admin WITH company selected (account-groups)
runTest('System Admin with Company - Account Groups', {
  authUser: { role: 'superadmin', companyCode: '000000' },
  selectedCompany: { id: 'uuid-1234', companyCode: '00001' }
}, {
  method: 'get',
  url: '/api/account/account-groups',
  params: { size: 1000 }
});

// 3. System Admin NO company selected
runTest('System Admin NO Company - Chart of Accounts', {
  authUser: { role: 'superadmin', companyCode: '000000' }
}, {
  method: 'get',
  url: '/api/account/chart-of-accounts',
  params: { page: 0, size: 10, companyCode: '00001' }
});

// 4. Non-Admin (should omit companyId if not required by swagger)
runTest('Non-Admin with Company - Chart of Accounts', {
  authUser: { role: 'accountant', companyCode: '00001' },
  selectedCompany: { id: 'uuid-5678', companyCode: '00001' }
}, {
  method: 'get',
  url: '/api/account/chart-of-accounts',
  params: { page: 0, size: 10, companyId: 'uuid-5678' }
});

// 5. Auth ME endpoint (should not inject for anyone)
runTest('System Admin - Auth Me', {
  authUser: { role: 'superadmin', companyCode: '000000' },
  selectedCompany: { id: 'uuid-1234', companyCode: '00001' }
}, {
  method: 'get',
  url: '/api/sso/auth/me',
  params: {}
});
