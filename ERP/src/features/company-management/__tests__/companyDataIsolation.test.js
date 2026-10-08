import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  getActiveCompanyId,
  isOwnerOrAdminUser,
  isCompanySpecificEndpoint,
  attachRequestInterceptor
} from '../../../api/common/interceptors.js';

describe('Company-Level Data Isolation & Query Parameter Injection Tests', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem: (key) => store[key] || null,
      setItem: (key, val) => { store[key] = String(val); },
      removeItem: (key) => { delete store[key]; },
      clear: () => { store = {}; }
    };
  })();

  beforeEach(() => {
    global.window = {
      localStorage: localStorageMock,
      __REDUX_STORE__: null,
    };
    global.localStorage = localStorageMock;
    localStorageMock.clear();
  });

  describe('1. Endpoint Scope Classification', () => {
    it('identifies company-specific endpoints correctly', () => {
      assert.strictEqual(isCompanySpecificEndpoint('/api/account/fiscal-years'), true);
      assert.strictEqual(isCompanySpecificEndpoint('/api/account/account-groups'), true);
      assert.strictEqual(isCompanySpecificEndpoint('/api/account/chart-of-accounts'), true);
      assert.strictEqual(isCompanySpecificEndpoint('/api/account/accounts'), true);
      assert.strictEqual(isCompanySpecificEndpoint('/api/account/accounting-periods'), true);
      assert.strictEqual(isCompanySpecificEndpoint('/api/inventory/stocks'), true);
      assert.strictEqual(isCompanySpecificEndpoint('/api/sales/invoices'), true);
      assert.strictEqual(isCompanySpecificEndpoint('/api/purchase/orders'), true);
      assert.strictEqual(isCompanySpecificEndpoint('/api/finance/budget-lines'), true);
      assert.strictEqual(isCompanySpecificEndpoint('/api/workflows/definitions'), true);
    });

    it('identifies global and non-company endpoints as not company-specific', () => {
      assert.strictEqual(isCompanySpecificEndpoint('/api/sso/login'), false);
      assert.strictEqual(isCompanySpecificEndpoint('/api/sso/refresh'), false);
      assert.strictEqual(isCompanySpecificEndpoint('/api/sso/signup'), false);
      assert.strictEqual(isCompanySpecificEndpoint('/api/sso/me'), false);
      assert.strictEqual(isCompanySpecificEndpoint('/api/sso/platform/admins'), false);
      assert.strictEqual(isCompanySpecificEndpoint('/api/companies'), false);
      assert.strictEqual(isCompanySpecificEndpoint('/api/account/companies'), false);
      assert.strictEqual(isCompanySpecificEndpoint('/api/subscription/plans'), false);
    });
  });

  describe('2. Active Company ID Resolution', () => {
    it('resolves active company from selected_company in localStorage as single source of truth', () => {
      localStorageMock.setItem('selected_company', JSON.stringify({
        id: 'comp-uuid-aaa',
        code: 'COMP_A',
        name: 'Company A'
      }));

      const activeId = getActiveCompanyId();
      assert.strictEqual(activeId, 'comp-uuid-aaa');
    });

    it('updates active company immediately when user switches company in selector', () => {
      localStorageMock.setItem('selected_company', JSON.stringify({
        id: 'comp-uuid-aaa',
        code: 'COMP_A',
        name: 'Company A'
      }));
      assert.strictEqual(getActiveCompanyId(), 'comp-uuid-aaa');

      // User selects Company B
      localStorageMock.setItem('selected_company', JSON.stringify({
        id: 'comp-uuid-bbb',
        code: 'COMP_B',
        name: 'Company B'
      }));
      assert.strictEqual(getActiveCompanyId(), 'comp-uuid-bbb');
    });

    it('falls back to auth_user for normal tenant users when no company is explicitly selected', () => {
      localStorageMock.setItem('auth_user', JSON.stringify({
        id: 'u1',
        companyId: 'comp-normal-111',
        role: 'accountant'
      }));

      const activeId = getActiveCompanyId();
      assert.strictEqual(activeId, 'comp-normal-111');
    });

    it('returns null safely when company selection is loading or unavailable', () => {
      assert.strictEqual(getActiveCompanyId(), null);
    });
  });

  describe('3. Request Interceptor Company ID Injection', () => {
    const createMockAxiosInstance = () => {
      let interceptorFn = null;
      const instance = {
        interceptors: {
          request: {
            use: (fn) => { interceptorFn = fn; }
          }
        },
        execute: (config) => interceptorFn(config)
      };
      attachRequestInterceptor(instance);
      return instance;
    };

    it('automatically adds companyId query parameter to account-groups', () => {
      localStorageMock.setItem('selected_company', JSON.stringify({ id: 'comp-123' }));
      const axiosMock = createMockAxiosInstance();

      const config = axiosMock.execute({
        url: '/api/account/account-groups',
        method: 'GET',
        params: { size: 10 }
      });

      assert.strictEqual(config.params.companyId, 'comp-123');
      assert.strictEqual(config.params.size, 10);
      assert.strictEqual(config.headers['X-Company-Id'], 'comp-123');
    });

    it('automatically adds companyId query parameter to chart-of-accounts', () => {
      localStorageMock.setItem('selected_company', JSON.stringify({ id: 'comp-123' }));
      const axiosMock = createMockAxiosInstance();

      const config = axiosMock.execute({
        url: '/api/account/chart-of-accounts',
        method: 'GET',
        params: {}
      });

      assert.strictEqual(config.params.companyId, 'comp-123');
      assert.strictEqual(config.headers['X-Company-Id'], 'comp-123');
    });

    it('automatically adds companyId query parameter to fiscal-years', () => {
      localStorageMock.setItem('selected_company', JSON.stringify({ id: 'comp-123' }));
      const axiosMock = createMockAxiosInstance();

      const config = axiosMock.execute({
        url: '/api/account/fiscal-years',
        method: 'GET'
      });

      assert.strictEqual(config.params.companyId, 'comp-123');
    });

    it('uses selected company as single source of truth for Owner and SystemAdmin', () => {
      localStorageMock.setItem('selected_company', JSON.stringify({ id: 'comp-selected-owner' }));
      localStorageMock.setItem('auth_user', JSON.stringify({
        id: 'u-owner',
        membership: { memberType: 'OWNER' },
        companyId: 'comp-stale-ignored'
      }));

      const axiosMock = createMockAxiosInstance();
      const config = axiosMock.execute({
        url: '/api/account/account-groups',
        method: 'GET',
        params: { companyId: 'comp-stale-ignored' }
      });

      // Owner selection overrides any stale companyId in params
      assert.strictEqual(config.params.companyId, 'comp-selected-owner');
    });

    it('does NOT send undefined or null companyId when selection is still loading', () => {
      const axiosMock = createMockAxiosInstance();
      const config = axiosMock.execute({
        url: '/api/account/account-groups',
        method: 'GET',
        params: { companyId: undefined }
      });

      assert.strictEqual(config.params.companyId, undefined);
      assert.strictEqual('companyId' in config.params, false);
    });

    it('does NOT attach companyId to global non-company APIs like /api/sso/login or /api/companies', () => {
      localStorageMock.setItem('selected_company', JSON.stringify({ id: 'comp-123' }));
      const axiosMock = createMockAxiosInstance();

      const config1 = axiosMock.execute({
        url: '/api/sso/login',
        method: 'POST',
        data: { username: 'test' }
      });
      assert.strictEqual(config1.params, undefined);

      const config2 = axiosMock.execute({
        url: '/api/companies',
        method: 'GET',
        params: { page: 0 }
      });
      assert.strictEqual(config2.params.companyId, undefined);

      const config3 = axiosMock.execute({
        url: '/api/organization/details',
        method: 'GET'
      });
      assert.strictEqual(config3.params, undefined);
    });
  });

  describe('4. End-to-End Company Switch Verification (Owner & SystemAdmin)', () => {
    const createMockAxiosInstance = () => {
      let interceptorFn = null;
      const instance = {
        interceptors: {
          request: {
            use: (fn) => { interceptorFn = fn; }
          }
        },
        execute: (config) => interceptorFn(config)
      };
      attachRequestInterceptor(instance);
      return instance;
    };

    const accountingEndpoints = [
      '/api/account/fiscal-years',
      '/api/account/account-groups',
      '/api/account/chart-of-accounts',
      '/api/account/bank-accounts',
      '/api/account/accounts',
      '/api/finance/budget-lines'
    ];

    it('Step 1 & 2: When Owner selects Company A, all accounting requests send Company A ID', () => {
      // Simulate Owner login
      localStorageMock.setItem('auth_user', JSON.stringify({
        id: 'owner-user-1',
        membership: { memberType: 'OWNER' }
      }));
      // Select Company A
      localStorageMock.setItem('selected_company', JSON.stringify({
        id: 'comp-A-00000000-0000-0000-0000-000000000001',
        name: 'Company A'
      }));

      const axiosMock = createMockAxiosInstance();

      accountingEndpoints.forEach((url) => {
        const config = axiosMock.execute({ url, method: 'GET', params: { page: 0 } });
        assert.strictEqual(
          config.params.companyId,
          'comp-A-00000000-0000-0000-0000-000000000001',
          `Endpoint ${url} must receive Company A ID`
        );
        assert.strictEqual(
          config.headers['X-Company-Id'],
          'comp-A-00000000-0000-0000-0000-000000000001',
          `Endpoint ${url} must receive Company A X-Company-Id header`
        );
      });
    });

    it('Step 3 & 4: When Owner switches from Company A to Company B, all subsequent requests immediately use Company B ID', () => {
      localStorageMock.setItem('auth_user', JSON.stringify({
        id: 'owner-user-1',
        membership: { memberType: 'OWNER' }
      }));
      const axiosMock = createMockAxiosInstance();

      // Company A active
      localStorageMock.setItem('selected_company', JSON.stringify({
        id: 'comp-A-id',
        name: 'Company A'
      }));
      const reqA = axiosMock.execute({ url: '/api/account/fiscal-years', method: 'GET' });
      assert.strictEqual(reqA.params.companyId, 'comp-A-id');

      // User switches to Company B
      localStorageMock.setItem('selected_company', JSON.stringify({
        id: 'comp-B-id',
        name: 'Company B'
      }));

      // Every subsequent accounting request must now contain Company B ID, never Company A ID
      accountingEndpoints.forEach((url) => {
        const config = axiosMock.execute({ url, method: 'GET', params: { page: 0 } });
        assert.strictEqual(
          config.params.companyId,
          'comp-B-id',
          `Endpoint ${url} must immediately send Company B ID after company switch`
        );
        assert.notStrictEqual(
          config.params.companyId,
          'comp-A-id',
          `Endpoint ${url} must NOT send old Company A ID`
        );
        assert.strictEqual(
          config.headers['X-Company-Id'],
          'comp-B-id'
        );
      });
    });

    it('Step 5: Verifies that standard non-Owner user continues using their existing company context', () => {
      localStorageMock.setItem('auth_user', JSON.stringify({
        id: 'standard-user-1',
        role: 'accountant',
        companyId: 'standard-comp-assigned-999'
      }));

      const axiosMock = createMockAxiosInstance();

      accountingEndpoints.forEach((url) => {
        const config = axiosMock.execute({ url, method: 'GET' });
        assert.strictEqual(
          config.params.companyId,
          'standard-comp-assigned-999',
          `Standard user must send their assigned companyId for ${url}`
        );
      });
    });

    it('Step 6: Never sends companyId=undefined, companyId=null, or string "undefined"/"null"', () => {
      // Nothing selected and no auth user
      const axiosMock = createMockAxiosInstance();

      accountingEndpoints.forEach((url) => {
        const config = axiosMock.execute({
          url,
          method: 'GET',
          params: { companyId: undefined }
        });
        assert.strictEqual(config.params?.companyId, undefined);
        assert.strictEqual('companyId' in (config.params || {}), false);
      });

      // When params has explicit null
      accountingEndpoints.forEach((url) => {
        const config = axiosMock.execute({
          url,
          method: 'GET',
          params: { companyId: null }
        });
        assert.strictEqual(config.params?.companyId, undefined);
        assert.strictEqual('companyId' in (config.params || {}), false);
      });
    });
  });

  describe('5. Whole ERP Application Global Isolation Verification (All Modules)', () => {
    const createMockAxiosInstance = () => {
      let interceptorFn = null;
      const instance = {
        interceptors: {
          request: {
            use: (fn) => { interceptorFn = fn; }
          }
        },
        execute: (config) => interceptorFn(config)
      };
      attachRequestInterceptor(instance);
      return instance;
    };

    const allErpModulesEndpoints = [
      // Account & Finance
      { module: 'Account/GL', url: '/api/account/gl/journals' },
      { module: 'Account/FiscalYears', url: '/api/account/fiscal-years' },
      { module: 'Account/COA', url: '/api/account/chart-of-accounts' },
      { module: 'Account/Groups', url: '/api/account/account-groups' },
      { module: 'Finance/Budgets', url: '/api/finance/budget-lines' },
      { module: 'Dashboard/Finance', url: '/api/dashboard/finance' },
      // Inventory
      { module: 'Inventory/Stocks', url: '/api/inventory/inventory-stocks' },
      { module: 'Inventory/Products', url: '/api/inventory/products' },
      { module: 'Inventory/Warehouses', url: '/api/inventory/warehouses' },
      { module: 'Inventory/Transfers', url: '/api/inventory/stock-transfers' },
      { module: 'Inventory/Valuation', url: '/api/inventory/inventory-valuations' },
      // Purchase
      { module: 'Purchase/Orders', url: '/api/account/purchase-orders' },
      { module: 'Purchase/Requisitions', url: '/api/account/purchase-requisitions' },
      { module: 'Purchase/Vendors', url: '/api/account/v1/vendors' },
      { module: 'Purchase/GoodsReceipts', url: '/api/account/goods-receipts' },
      // Sales
      { module: 'Sales/Orders', url: '/api/account/v1/sales-orders' },
      { module: 'Sales/Quotations', url: '/api/account/v1/quotations' },
      { module: 'Sales/Invoices', url: '/api/account/sales/invoices' },
      { module: 'Sales/Challans', url: '/api/account/v1/delivery-challans' },
      { module: 'Sales/Customers', url: '/api/account/customers' },
      // CRM & Leads
      { module: 'CRM/Leads', url: '/api/leads' },
      // HR & Payroll
      { module: 'HR/Employees', url: '/api/account/employees' },
      { module: 'HR/ProcessPayroll', url: '/api/hr/payroll/process' },
      // Workflows
      { module: 'Workflows/Definitions', url: '/api/v1/workflow/definitions' },
      { module: 'Workflows/Tasks', url: '/api/v1/workflow/tasks' },
      // Reports
      { module: 'Reports/GeneralLedger', url: '/api/account/v1/reports/general-ledger' },
      { module: 'Reports/GST', url: '/api/account/reports/gst' },
      // Fleet & Manufacturing
      { module: 'Fleet/Vehicles', url: '/api/fleet/v1/vehicles' },
      { module: 'Manufacturing/Schedules', url: '/api/manufacturing/production-schedules' },
      // Settings
      { module: 'Settings/PaymentTerms', url: '/api/account/v1/settings/payment-terms' },
    ];

    it('SystemAdmin + Company A -> Automatically injects Company A ID across EVERY ERP module', () => {
      localStorageMock.setItem('auth_user', JSON.stringify({
        id: 'sysadmin-1',
        role: 'system_admin'
      }));
      localStorageMock.setItem('selected_company', JSON.stringify({
        id: 'company-ALPHA-uuid',
        name: 'Company Alpha'
      }));

      const axiosMock = createMockAxiosInstance();

      allErpModulesEndpoints.forEach(({ module, url }) => {
        const config = axiosMock.execute({ url, method: 'GET', params: { page: 0 } });
        assert.strictEqual(
          config.params.companyId,
          'company-ALPHA-uuid',
          `[${module}] ${url} must receive Company ALPHA ID for SystemAdmin`
        );
        assert.strictEqual(
          config.headers['X-Company-Id'],
          'company-ALPHA-uuid',
          `[${module}] ${url} must receive Company ALPHA X-Company-Id header`
        );
      });
    });

    it('SystemAdmin switches Company Alpha -> Company Beta -> ALL ERP modules immediately switch to Company Beta ID', () => {
      localStorageMock.setItem('auth_user', JSON.stringify({
        id: 'sysadmin-1',
        role: 'system_admin'
      }));
      // User switches to Company Beta
      localStorageMock.setItem('selected_company', JSON.stringify({
        id: 'company-BETA-uuid',
        name: 'Company Beta'
      }));

      const axiosMock = createMockAxiosInstance();

      allErpModulesEndpoints.forEach(({ module, url }) => {
        const config = axiosMock.execute({ url, method: 'GET', params: { page: 0 } });
        assert.strictEqual(
          config.params.companyId,
          'company-BETA-uuid',
          `[${module}] ${url} must immediately send Company BETA ID after switch`
        );
        assert.notStrictEqual(
          config.params.companyId,
          'company-ALPHA-uuid',
          `[${module}] ${url} must NEVER retain stale Company ALPHA ID`
        );
        assert.strictEqual(
          config.headers['X-Company-Id'],
          'company-BETA-uuid'
        );
      });
    });

    it('Owner + Company Switch synchronizes path-parameter company IDs and fixes undefined/stale IDs', () => {
      localStorageMock.setItem('auth_user', JSON.stringify({
        id: 'owner-1',
        membership: { memberType: 'OWNER' }
      }));
      localStorageMock.setItem('selected_company', JSON.stringify({
        id: 'company-ACTIVE-uuid',
        name: 'Company Active'
      }));

      const axiosMock = createMockAxiosInstance();

      // Path param /company/old-id is rewritten to /company/company-ACTIVE-uuid
      const req1 = axiosMock.execute({
        url: '/api/hr/payroll/company/stale-old-uuid',
        method: 'GET'
      });
      assert.strictEqual(req1.url, '/api/hr/payroll/company/company-ACTIVE-uuid');
      assert.strictEqual(req1.params.companyId, 'company-ACTIVE-uuid');

      // Path param /company/undefined is rewritten
      const req2 = axiosMock.execute({
        url: '/api/leads/company/undefined',
        method: 'GET'
      });
      assert.strictEqual(req2.url, '/api/leads/company/company-ACTIVE-uuid');

      // /settings/:id is rewritten
      const req3 = axiosMock.execute({
        url: '/api/settings/null',
        method: 'GET'
      });
      assert.strictEqual(req3.url, '/api/settings/company-ACTIVE-uuid');
    });

    it('Future-proofing: Any non-global /api/ endpoint automatically inherits company data isolation', () => {
      localStorageMock.setItem('auth_user', JSON.stringify({
        id: 'owner-1',
        membership: { memberType: 'OWNER' }
      }));
      localStorageMock.setItem('selected_company', JSON.stringify({
        id: 'future-comp-id',
        name: 'Future Co'
      }));

      const axiosMock = createMockAxiosInstance();

      const futureEndpoint = axiosMock.execute({
        url: '/api/logistics/custom-shipments',
        method: 'GET',
        params: {}
      });

      assert.strictEqual(futureEndpoint.params.companyId, 'future-comp-id');
      assert.strictEqual(futureEndpoint.headers['X-Company-Id'], 'future-comp-id');
    });
  });
});
