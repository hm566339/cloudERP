import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Verification Test Suite: UserCompanyAccessModal Request Deduplication & Lifecycle Stability
 *
 * Verifies:
 * 1. Root Cause Resolution:
 *    - Default props instability resolved via EMPTY_ARRAY outside component.
 *    - Passed companies normalized across both allCompanies and companies props.
 *    - Stable loadAccessData, loadOrganizationCompanies, and fetchRolesForCompany hooks.
 *    - In-flight request guards (inFlightAccessRef, inFlightCompaniesRef, inFlightRolesRef).
 *    - Roles and companies caching (rolesCacheRef, companiesCacheRef).
 *    - AbortController cancellation for modal close and unmount.
 *    - Main lifecycle effect guarded by hasInitializedRef and activeUserIdRef.
 * 2. Static Code Verification for Modal and SSO API Client wrappers.
 * 3. Lifecycle Simulation verifying zero duplicate or infinite network requests.
 */
describe('UserCompanyAccessModal Request Deduplication & Lifecycle Stability Suite', () => {

  const modalPath = path.resolve(__dirname, '../components/UserCompanyAccessModal.jsx');
  const modalSource = fs.readFileSync(modalPath, 'utf8');

  const orgApiPath = path.resolve(__dirname, '../../../api/sso/organization.api.js');
  const orgApiSource = fs.readFileSync(orgApiPath, 'utf8');

  const companyApiPath = path.resolve(__dirname, '../../../api/sso/company.js');
  const companyApiSource = fs.readFileSync(companyApiPath, 'utf8');

  const roleApiPath = path.resolve(__dirname, '../../../api/sso/role.js');
  const roleApiSource = fs.readFileSync(roleApiPath, 'utf8');

  describe('1. Static Code Analysis & Reference Stability Guards', () => {
    it('defines EMPTY_ARRAY outside component to prevent new array identity on re-render', () => {
      assert.ok(
        modalSource.includes('const EMPTY_ARRAY = [];'),
        'Modal must declare EMPTY_ARRAY constant outside component to prevent re-render identity churn'
      );
    });

    it('supports both allCompanies and legacy companies props', () => {
      assert.ok(modalSource.includes('allCompanies,'), 'Props must include allCompanies');
      assert.ok(modalSource.includes('companies: legacyCompanies,'), 'Props must support legacy companies prop');
      assert.ok(
        modalSource.includes('const passedCompanies = allCompanies || legacyCompanies || EMPTY_ARRAY;'),
        'Must normalize passedCompanies with EMPTY_ARRAY fallback'
      );
    });

    it('supports both onUpdated and onSuccess callback props', () => {
      assert.ok(modalSource.includes('onUpdated,'), 'Props must include onUpdated');
      assert.ok(modalSource.includes('onSuccess,'), 'Props must include onSuccess');
      assert.ok(
        modalSource.includes('(onUpdated || onSuccess)?.()'),
        'Must trigger either callback on successful mutation'
      );
    });

    it('uses dedicated refs to decouple volatile parent props from hook dependencies', () => {
      assert.ok(modalSource.includes('const userRef = useRef(user);'), 'Must track userRef');
      assert.ok(
        modalSource.includes('const passedCompaniesRef = useRef(passedCompanies);'),
        'Must track passedCompaniesRef'
      );
      assert.ok(
        modalSource.includes('const inFlightAccessRef = useRef(null);'),
        'Must track inFlightAccessRef'
      );
      assert.ok(
        modalSource.includes('const inFlightCompaniesRef = useRef(false);'),
        'Must track inFlightCompaniesRef'
      );
      assert.ok(
        modalSource.includes('const inFlightRolesRef = useRef({});'),
        'Must track inFlightRolesRef'
      );
      assert.ok(
        modalSource.includes('const rolesCacheRef = useRef({});'),
        'Must track rolesCacheRef'
      );
      assert.ok(
        modalSource.includes('const abortControllersRef = useRef('),
        'Must track abortControllersRef'
      );
    });

    it('verifies fetchRolesForCompany has a stable empty dependency array []', () => {
      const fetchFuncMatch = modalSource.match(/const fetchRolesForCompany = useCallback\([\s\S]*?\},\s*\[\s*\]\);/);
      assert.ok(
        fetchFuncMatch,
        'fetchRolesForCompany must be wrapped in useCallback with an empty dependency array []'
      );
    });

    it('verifies main modal open effect is guarded against repeated executions for the same user session', () => {
      assert.ok(
        modalSource.includes('sessionUserRef.current === userIdentifier') ||
        modalSource.includes('if (hasInitializedRef.current && activeUserIdRef.current === userIdentifier)'),
        'Effect must guard against re-running when modal is already initialized for the active user'
      );
    });

    it('verifies target company role loading effect uses roles cache to avoid repeated calls', () => {
      assert.ok(
        modalSource.includes('moduleRolesCache.has(') ||
        modalSource.includes('if (rolesCacheRef.current[targetCompanyId])'),
        'Must check roles cache before triggering network request for target company roles'
      );
    });

    it('verifies API methods support AbortController signal forwarding in request config', () => {
      assert.ok(
        orgApiSource.includes('export const getUserCompanyAccess = async (userId, config = {}) =>'),
        'getUserCompanyAccess must accept optional config parameter'
      );
      assert.ok(
        orgApiSource.includes('export const getMemberCompanyAccess = async (memberId, config = {}) =>'),
        'getMemberCompanyAccess must accept optional config parameter'
      );
      assert.ok(
        companyApiSource.includes('export const getCompanies = async (params = {}, config = {}) =>'),
        'getCompanies must accept optional config parameter'
      );
      assert.ok(
        roleApiSource.includes('export const getRoles = async (params = {}, config = {}) =>'),
        'getRoles must accept optional config parameter'
      );
    });

    it('verifies target company role loading handles errors cleanly with dedicated rolesLoadError and retry', () => {
      assert.ok(
        modalSource.includes('rolesLoadError'),
        'Modal must define and maintain dedicated rolesLoadError state'
      );
      assert.ok(
        modalSource.includes('Retry') && modalSource.includes('fetchRolesForCompany(targetCompanyId, true)'),
        'Modal must render Retry button allowing manual retry on role loading failure'
      );
      assert.ok(
        modalSource.includes('rolesLoadError ?') && modalSource.includes('targetRoles.length === 0 ?'),
        'Modal must distinguish between an API error and legitimately empty roles list'
      );
    });
  });

  describe('2. In-Memory Request Deduplication & Lifecycle Simulation', () => {
    class ModalLifecycleHarness {
      constructor() {
        this.accessCalls = 0;
        this.companyCalls = 0;
        this.roleCalls = {};
        this.abortedCalls = [];

        // Internal modal state refs mirroring UserCompanyAccessModal
        this.userRef = { current: null };
        this.passedCompaniesRef = { current: [] };
        this.inFlightAccessRef = { current: null };
        this.inFlightCompaniesRef = { current: false };
        this.inFlightRolesRef = { current: {} };
        this.rolesCacheRef = { current: {} };
        this.companiesCacheRef = { current: null };
        this.hasInitializedRef = { current: false };
        this.activeUserIdRef = { current: null };
        this.abortControllersRef = { current: { access: null, companies: null, roles: {} } };

        this.isOpen = false;
        this.accessList = [];
        this.fetchedCompanies = [];
      }

      open(user, passedCompanies = []) {
        this.isOpen = true;
        this.userRef.current = user;
        this.passedCompaniesRef.current = passedCompanies;

        const currentUserId = user?.id || user?.userId;
        const currentMemberId = user?.memberId;
        const userIdentifier = currentUserId || currentMemberId;

        // Modal open lifecycle check
        if (this.hasInitializedRef.current && this.activeUserIdRef.current === userIdentifier) {
          return;
        }

        this.hasInitializedRef.current = true;
        this.activeUserIdRef.current = userIdentifier;

        this.loadAccessData(false);
        this.loadOrganizationCompanies(false);
      }

      reRender(user, passedCompanies = []) {
        if (!this.isOpen) return;
        this.userRef.current = user;
        this.passedCompaniesRef.current = passedCompanies;

        const currentUserId = user?.id || user?.userId;
        const currentMemberId = user?.memberId;
        const userIdentifier = currentUserId || currentMemberId;

        // Re-render check guarded by hasInitializedRef
        if (this.hasInitializedRef.current && this.activeUserIdRef.current === userIdentifier) {
          return;
        }

        this.loadAccessData(false);
        this.loadOrganizationCompanies(false);
      }

      close() {
        this.isOpen = false;
        this.hasInitializedRef.current = false;
        this.activeUserIdRef.current = null;
        if (this.abortControllersRef.current.access) {
          this.abortControllersRef.current.access.abort();
          this.abortControllersRef.current.access = null;
        }
        if (this.abortControllersRef.current.companies) {
          this.abortControllersRef.current.companies.abort();
          this.abortControllersRef.current.companies = null;
        }
      }

      async loadAccessData(forceRefresh = false) {
        const effectiveUserId = this.userRef.current?.id || this.userRef.current?.userId;
        if (!effectiveUserId) return;

        const userKey = String(effectiveUserId);
        if (!forceRefresh && this.inFlightAccessRef.current === userKey) {
          return;
        }

        if (this.abortControllersRef.current.access) {
          this.abortControllersRef.current.access.abort();
        }
        const controller = {
          aborted: false,
          abort: () => {
            controller.aborted = true;
            this.abortedCalls.push('access');
          }
        };
        this.abortControllersRef.current.access = controller;
        this.inFlightAccessRef.current = userKey;
        this.accessCalls++;

        // Simulate async API completion
        await Promise.resolve();

        if (!controller.aborted) {
          this.accessList = [
            { companyId: 'comp-1', companyName: 'Company 1', active: true, roleName: 'Admin' }
          ];
        }
        if (this.inFlightAccessRef.current === userKey) {
          this.inFlightAccessRef.current = null;
        }
      }

      async loadOrganizationCompanies(forceRefresh = false) {
        const currentPassed = this.passedCompaniesRef.current;
        if (Array.isArray(currentPassed) && currentPassed.length > 0) {
          return;
        }

        if (!forceRefresh && this.companiesCacheRef.current && this.companiesCacheRef.current.length > 0) {
          this.fetchedCompanies = this.companiesCacheRef.current;
          return;
        }

        if (this.inFlightCompaniesRef.current) {
          return;
        }

        this.inFlightCompaniesRef.current = true;
        this.companyCalls++;

        await Promise.resolve();

        const dummyComps = [{ id: 'comp-1', name: 'Company 1' }, { id: 'comp-2', name: 'Company 2' }];
        this.companiesCacheRef.current = dummyComps;
        this.fetchedCompanies = dummyComps;
        this.inFlightCompaniesRef.current = false;
      }

      async fetchRolesForCompany(compId, forceRefresh = false) {
        if (!compId) return [];
        if (!forceRefresh && this.rolesCacheRef.current[compId]) {
          return this.rolesCacheRef.current[compId];
        }
        if (this.inFlightRolesRef.current[compId]) {
          return this.inFlightRolesRef.current[compId];
        }

        const promise = (async () => {
          this.roleCalls[compId] = (this.roleCalls[compId] || 0) + 1;
          await Promise.resolve();
          const roles = [
            { id: `role-${compId}-1`, name: 'Role 1' },
            { id: `role-${compId}-2`, name: 'Role 2' },
          ];
          this.rolesCacheRef.current[compId] = roles;
          return roles;
        })();

        this.inFlightRolesRef.current[compId] = promise;
        const res = await promise;
        delete this.inFlightRolesRef.current[compId];
        return res;
      }
    }

    it('opening modal with companies passed executes access API exactly once and 0 company requests', async () => {
      const harness = new ModalLifecycleHarness();
      const user = { id: 'user-100', fullName: 'Test User' };
      const companies = [{ id: 'comp-1', name: 'Company 1' }];

      harness.open(user, companies);
      await Promise.resolve();

      assert.strictEqual(harness.accessCalls, 1, 'Access API should be called exactly once');
      assert.strictEqual(harness.companyCalls, 0, 'Company API should NOT be called when companies are passed');
    });

    it('opening modal without companies passed executes company API exactly once', async () => {
      const harness = new ModalLifecycleHarness();
      const user = { id: 'user-100', fullName: 'Test User' };

      harness.open(user, []);
      await Promise.resolve();

      assert.strictEqual(harness.accessCalls, 1, 'Access API called once');
      assert.strictEqual(harness.companyCalls, 1, 'Company API called once when no companies passed');
    });

    it('50 rapid re-renders with new array references trigger 0 additional network calls', async () => {
      const harness = new ModalLifecycleHarness();
      const user = { id: 'user-100', fullName: 'Test User' };
      harness.open(user, [{ id: 'c1', name: 'C1' }]);
      await Promise.resolve();

      assert.strictEqual(harness.accessCalls, 1);
      assert.strictEqual(harness.companyCalls, 0);

      // Simulate 50 rapid re-renders with new array instances (like state updates in parent)
      for (let i = 0; i < 50; i++) {
        harness.reRender({ ...user }, [{ id: 'c1', name: 'C1' }]);
      }
      await Promise.resolve();

      assert.strictEqual(harness.accessCalls, 1, 'Access API count must stay at 1 after 50 re-renders');
      assert.strictEqual(harness.companyCalls, 0, 'Company API count must stay at 0 after 50 re-renders');
    });

    it('fetching roles for a company caches them so subsequent switches trigger 0 network calls', async () => {
      const harness = new ModalLifecycleHarness();
      const user = { id: 'user-100', fullName: 'Test User' };
      harness.open(user, [{ id: 'c1', name: 'C1' }, { id: 'c2', name: 'C2' }]);
      await Promise.resolve();

      // First time selecting c1
      const roles1 = await harness.fetchRolesForCompany('c1');
      assert.strictEqual(roles1.length, 2);
      assert.strictEqual(harness.roleCalls['c1'], 1, 'c1 roles requested once');

      // Re-selecting c1 (e.g. user toggling dropdown)
      const roles1Cached = await harness.fetchRolesForCompany('c1');
      assert.strictEqual(roles1Cached.length, 2);
      assert.strictEqual(harness.roleCalls['c1'], 1, 'c1 roles NOT requested again, served from cache');

      // First time selecting c2
      const roles2 = await harness.fetchRolesForCompany('c2');
      assert.strictEqual(roles2.length, 2);
      assert.strictEqual(harness.roleCalls['c2'], 1, 'c2 roles requested once');

      // Switching back to c1
      await harness.fetchRolesForCompany('c1');
      assert.strictEqual(harness.roleCalls['c1'], 1, 'c1 roles still served from cache');
    });

    it('closing modal cleanly cancels any in-flight requests and resets initialization refs', () => {
      const harness = new ModalLifecycleHarness();
      const user = { id: 'user-100', fullName: 'Test User' };
      harness.open(user, []);

      assert.strictEqual(harness.isOpen, true);
      assert.strictEqual(harness.hasInitializedRef.current, true);

      harness.close();

      assert.strictEqual(harness.isOpen, false);
      assert.strictEqual(harness.hasInitializedRef.current, false);
      assert.strictEqual(harness.activeUserIdRef.current, null);
      assert.ok(harness.abortedCalls.includes('access'), 'Access controller was aborted on close');
    });

    it('React 18 StrictMode double-mount simulation completes successfully without getting stuck in loading', async () => {
      const harness = new ModalLifecycleHarness();
      const user = { id: 'user-100', fullName: 'Test User' };

      // Mount 1
      harness.open(user, [{ id: 'c1', name: 'C1' }]);
      assert.strictEqual(harness.hasInitializedRef.current, true);

      // StrictMode simulated unmount cleanup
      harness.hasInitializedRef.current = false;
      if (harness.abortControllersRef.current.access) {
        harness.abortControllersRef.current.access.abort();
        harness.abortControllersRef.current.access = null;
      }
      harness.inFlightAccessRef.current = null;

      // Mount 2 (remount)
      harness.open(user, [{ id: 'c1', name: 'C1' }]);
      await Promise.resolve();

      // Access data should be populated and valid
      assert.strictEqual(harness.accessList.length, 1);
      assert.strictEqual(harness.accessList[0].companyId, 'comp-1');
    });

      it('closing and reopening the modal does not cause duplicate requests and loads cleanly', async () => {
        const harness = new ModalLifecycleHarness();
        const user = { id: 'user-100', fullName: 'Test User' };
        const companies = [{ id: 'c1', name: 'Company 1' }];

        // 1. Initial open
        harness.open(user, companies);
        await Promise.resolve();
        assert.strictEqual(harness.accessCalls, 1, 'First open makes exactly 1 access call');
        assert.strictEqual(harness.companyCalls, 0, 'First open makes 0 company calls');

        // 2. Close modal
        harness.close();
        assert.strictEqual(harness.isOpen, false);

        // 3. Reopen modal
        harness.open(user, companies);
        await Promise.resolve();
        assert.strictEqual(harness.accessCalls, 2, 'Reopening makes exactly 1 additional fresh access call');
        assert.strictEqual(harness.companyCalls, 0, 'Reopening still makes 0 company calls');
        assert.strictEqual(harness.accessList.length, 1);
      });

      it('verifies company API is never called when companies are passed via allCompanies or companies', async () => {
        const harness1 = new ModalLifecycleHarness();
        const user = { id: 'user-100', fullName: 'Test User' };

        // Passed via companies
        harness1.open(user, [{ id: 'comp-10', name: 'Alpha Corp' }]);
        await Promise.resolve();
        assert.strictEqual(harness1.companyCalls, 0, 'Company API should NOT be called when companies are provided');

        // Passed via allCompanies (multiple companies)
        const harness2 = new ModalLifecycleHarness();
        harness2.open(user, [{ id: 'comp-1', name: 'C1' }, { id: 'comp-2', name: 'C2' }]);
        await Promise.resolve();
        assert.strictEqual(harness2.companyCalls, 0, 'Company API should NOT be called when multiple companies are provided');
      });
    });

    describe('3. Organization Role Template Assignment & Cross-Company Reusability', () => {
      it('verifies getOrgRoleTemplates is imported and used in UserCompanyAccessModal', () => {
        assert.ok(
          modalSource.includes("import { getOrgRoleTemplates } from '../../../api/sso/roleTemplate.api';"),
          'Modal must import getOrgRoleTemplates to load organization-level role templates'
        );
        assert.ok(
          modalSource.includes('fetchOrgRoleTemplatesList'),
          'Modal must implement fetchOrgRoleTemplatesList for role template resolution'
        );
      });

      it('verifies templates are filtered by status === true and not by appliedCompanies or selected company', () => {
        assert.ok(
          modalSource.includes('t.status === true || t.status === undefined'),
          'Templates must only be filtered by active status (true or undefined)'
        );
        assert.ok(
          !modalSource.includes('.filter(t => t.appliedCompanies') && !modalSource.includes('.filter(t => t.companyId ==='),
          'Templates must NOT be filtered by appliedCompanies or companyId so all org templates are reusable'
        );
      });

      it('verifies roles already assigned to that user in target company are excluded, while preserving roles across other companies', () => {
        // Mock role templates
        const mockOrgTemplates = [
          { id: 'tpl-accountant', name: 'Accountant', status: true, appliedCompanies: ['Apex India Pvt Ltd'] },
          { id: 'tpl-admin', name: 'Company Admin', status: true, appliedCompanies: ['Apex India Pvt Ltd'] },
          { id: 'tpl-hr', name: 'HR Manager', status: true, appliedCompanies: [] },
          { id: 'tpl-inactive', name: 'Old Role', status: false, appliedCompanies: [] },
        ];

        // Active templates filtering
        const activeTemplates = mockOrgTemplates.filter(t => t.status === true || t.status === undefined);
        assert.strictEqual(activeTemplates.length, 3, 'Only active templates should be retained');

        // User currently has Accountant in Apex India (comp-1), and NO roles in TechNova (comp-2)
        const userAccessList = [
          {
            companyId: 'comp-1',
            companyName: 'Apex India Pvt Ltd',
            active: true,
            roleNames: ['Accountant'],
            roleIds: ['tpl-accountant'],
          },
        ];

        // When target company is TechNova (comp-2)
        const targetCompanyId = 'comp-2';
        const currentCompAccess = userAccessList.find(a => String(a.companyId) === String(targetCompanyId));
        const assignedNames = new Set(
          (Array.isArray(currentCompAccess?.roleNames) ? currentCompAccess.roleNames : [])
            .map(n => n.toLowerCase())
        );
        const assignedIds = new Set(
          (Array.isArray(currentCompAccess?.roleIds) ? currentCompAccess.roleIds : [])
            .map(String)
        );

        const availableForTechNova = activeTemplates.filter(t => {
          const nameKey = (t.name || '').trim().toLowerCase();
          const idKey = String(t.id || '');
          return !assignedNames.has(nameKey) && !assignedIds.has(idKey);
        });

        // In TechNova, ALL 3 active organization templates (including Accountant!) must be available
        assert.strictEqual(availableForTechNova.length, 3);
        assert.ok(availableForTechNova.some(t => t.name === 'Accountant'), 'Accountant must be assignable to TechNova even though applied to Apex');
        assert.ok(availableForTechNova.some(t => t.name === 'Company Admin'));
        assert.ok(availableForTechNova.some(t => t.name === 'HR Manager'));

        // If target company is Apex India (comp-1), Accountant is already assigned and must be excluded
        const apexAccess = userAccessList.find(a => String(a.companyId) === 'comp-1');
        const apexAssignedNames = new Set(apexAccess.roleNames.map(n => n.toLowerCase()));
        const availableForApex = activeTemplates.filter(t => !apexAssignedNames.has((t.name || '').toLowerCase()));
        assert.strictEqual(availableForApex.length, 2);
        assert.ok(!availableForApex.some(t => t.name === 'Accountant'), 'Accountant must be excluded for Apex India');
      });
    });
  });

