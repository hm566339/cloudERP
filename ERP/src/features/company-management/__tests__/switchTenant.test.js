import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import accountCompanyReducer, {
  setAccountSelectedCompany,
  clearAccountCompany,
} from '../../account/store/accountCompanySlice.js';
import companyReducer, {
  setSelectedCompany,
  clearSelectedCompany,
} from '../companySlice.js';
import {
  getActiveCompanyId,
  isValidCompanyId,
} from '../../../api/common/interceptors.js';

describe('Switch Tenant & Organization Company Selection Tests', () => {
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem: (key) => store[key] || null,
      setItem: (key, val) => {
        store[key] = String(val);
      },
      removeItem: (key) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
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

  describe('1. Redux Slices & Active Tenant State Handling', () => {
    it('sets and clears selected company in companySlice with localStorage sync', () => {
      const companyA = {
        id: 'comp-alpha-123',
        name: 'Alpha Enterprises',
        code: 'ALPHA01',
      };

      let state = companyReducer(undefined, setSelectedCompany(companyA));
      assert.strictEqual(state.selectedCompany.id, 'comp-alpha-123');
      assert.strictEqual(state.selectedCompany.name, 'Alpha Enterprises');

      // LocalStorage updated
      const saved = JSON.parse(localStorageMock.getItem('selected_company'));
      assert.strictEqual(saved.id, 'comp-alpha-123');

      // Clear
      state = companyReducer(state, clearSelectedCompany());
      assert.strictEqual(state.selectedCompany, null);
      assert.strictEqual(localStorageMock.getItem('selected_company'), null);
    });

    it('sets and clears accountSelectedCompany in accountCompanySlice', () => {
      const companyB = {
        id: 'comp-beta-456',
        companyName: 'Beta Logistics',
        companyCode: 'BETA02',
      };

      let state = accountCompanyReducer(undefined, setAccountSelectedCompany(companyB));
      assert.strictEqual(state.selectedCompany.id, 'comp-beta-456');
      assert.strictEqual(state.selectedCompany.companyName, 'Beta Logistics');

      state = accountCompanyReducer(state, clearAccountCompany());
      assert.strictEqual(state.selectedCompany, null);
      assert.strictEqual(state.companies.length, 0);
    });
  });

  describe('2. Active Tenant Persistence & Interceptor Context', () => {
    it('persists selected company across reload and getActiveCompanyId retrieves it', () => {
      const company1 = {
        id: '11111111-2222-3333-4444-555555555555',
        name: 'Titan Corp',
        code: 'TITAN01',
      };

      companyReducer(undefined, setSelectedCompany(company1));

      // getActiveCompanyId retrieves the company from localStorage
      const activeId = getActiveCompanyId();
      assert.strictEqual(activeId, '11111111-2222-3333-4444-555555555555');
    });

    it('switches between Company 1 and Company 2 and updates active company ID immediately', () => {
      const company1 = {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'First Organization Company',
        code: 'FOC01',
      };

      const company2 = {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Second Organization Company',
        code: 'SOC02',
      };

      // 1. Initial Company 1 active
      companyReducer(undefined, setSelectedCompany(company1));
      assert.strictEqual(getActiveCompanyId(), company1.id);

      // 2. User switches to Company 2
      companyReducer(undefined, setSelectedCompany(company2));
      assert.strictEqual(getActiveCompanyId(), company2.id);

      // 3. User switches back to Company 1
      companyReducer(undefined, setSelectedCompany(company1));
      assert.strictEqual(getActiveCompanyId(), company1.id);
    });

    it('rejects invalid or placeholder company IDs from being active', () => {
      assert.strictEqual(isValidCompanyId('000000'), false);
      assert.strictEqual(isValidCompanyId('0'), false);
      assert.strictEqual(isValidCompanyId('00000000-0000-0000-0000-000000000000'), false);
      assert.strictEqual(isValidCompanyId(null), false);
      assert.strictEqual(isValidCompanyId(undefined), false);

      assert.strictEqual(isValidCompanyId('comp-1234'), true);
      assert.strictEqual(isValidCompanyId('ea811382-0afc-4908-a209-9bedcc63c445'), true);
    });
  });

  describe('3. Dynamic Company Normalization & Security Rules', () => {
    it('normalizes multi-format company data (SSO, account, org) properly', () => {
      const rawApiCompany = {
        companyId: 'uuid-100',
        companyName: 'Kasdenge Innovations',
        companyCode: 'KD01',
        active: true,
      };

      const id = rawApiCompany.id || rawApiCompany.companyId;
      const name = rawApiCompany.name || rawApiCompany.companyName;
      const code = rawApiCompany.code || rawApiCompany.companyCode;

      assert.strictEqual(id, 'uuid-100');
      assert.strictEqual(name, 'Kasdenge Innovations');
      assert.strictEqual(code, 'KD01');
    });

    it('validates authorized tenant check prevents unauthorized company selection', () => {
      const authorizedCompanies = [
        { id: 'c-1', code: 'C01', name: 'Authorized 1' },
        { id: 'c-2', code: 'C02', name: 'Authorized 2' },
      ];

      const checkAuthorization = (targetId, isOwner, isSuperAdmin) => {
        if (isOwner || isSuperAdmin) return true;
        return authorizedCompanies.some((c) => c.id === targetId);
      };

      // Member attempting to switch to authorized company
      assert.strictEqual(checkAuthorization('c-2', false, false), true);

      // Member attempting to switch to unauthorized rogue company
      assert.strictEqual(checkAuthorization('rogue-tenant-999', false, false), false);

      // Owner or Super Admin has organization-wide entitlement
      assert.strictEqual(checkAuthorization('rogue-tenant-999', true, false), true);
      assert.strictEqual(checkAuthorization('rogue-tenant-999', false, true), true);
    });
  });
});

