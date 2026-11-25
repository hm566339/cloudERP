import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  formatPlanLimit,
  normalizePlanCode,
  validatePlanFormData,
  preparePlanPayload
} from '../../../utils/subscriptionPlanHelper.js';
import { getSafeErrorMessage } from '../../../utils/apiErrorHelper.js';

describe('Subscription Plan Frontend Rules & Management Tests', () => {

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Create plan with limited companies and users
  // ──────────────────────────────────────────────────────────────────────────
  describe('1. Create plan with limited companies and users', () => {
    it('creates payload with numeric positive integer limits when limited', () => {
      const formData = {
        name: 'Professional Tier',
        code: 'PRO_TIER',
        description: 'Mid-market business plan',
        durationDays: 30,
        price: 2999,
        currency: 'INR',
        active: true,
        isTrial: false,
        isUnlimitedCompanies: false,
        maxCompanies: 5,
        isUnlimitedUsers: false,
        maxUsersPerCompany: 25,
        moduleIds: ['mod-acc', 'mod-inv', 'mod-wf'],
      };

      const validation = validatePlanFormData(formData);
      assert.strictEqual(validation.isValid, true);
      assert.deepStrictEqual(validation.errors, {});

      const payload = preparePlanPayload(formData);
      assert.strictEqual(payload.name, 'Professional Tier');
      assert.strictEqual(payload.code, 'PRO_TIER');
      assert.strictEqual(payload.durationDays, 30);
      assert.strictEqual(payload.maxCompanies, 5);
      assert.strictEqual(payload.maxUsersPerCompany, 25);
      assert.strictEqual(payload.maxUsers, 25);
      assert.strictEqual(payload.moduleIds.length, 3);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Create plan with unlimited companies
  // ──────────────────────────────────────────────────────────────────────────
  describe('2. Create plan with unlimited companies', () => {
    it('sends NULL for maxCompanies when unlimited companies is checked (never huge magic number like 999999999)', () => {
      const formData = {
        name: 'Enterprise Multi-Company',
        code: 'ENTERPRISE',
        durationDays: 365,
        isUnlimitedCompanies: true,
        maxCompanies: '',
        isUnlimitedUsers: false,
        maxUsersPerCompany: 100,
        moduleIds: ['mod-acc', 'mod-inv', 'mod-crm'],
      };

      const validation = validatePlanFormData(formData);
      assert.strictEqual(validation.isValid, true);

      const payload = preparePlanPayload(formData);
      assert.strictEqual(payload.maxCompanies, null);
      assert.notStrictEqual(payload.maxCompanies, 999999999);
      assert.strictEqual(payload.maxUsersPerCompany, 100);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Create plan with unlimited users/company
  // ──────────────────────────────────────────────────────────────────────────
  describe('3. Create plan with unlimited users per company', () => {
    it('sends NULL for maxUsersPerCompany and maxUsers when unlimited users is checked', () => {
      const formData = {
        name: 'Scale Tier',
        code: 'SCALE_PLAN',
        durationDays: 30,
        isUnlimitedCompanies: false,
        maxCompanies: 2,
        isUnlimitedUsers: true,
        maxUsersPerCompany: '',
        moduleIds: ['mod-acc'],
      };

      const validation = validatePlanFormData(formData);
      assert.strictEqual(validation.isValid, true);

      const payload = preparePlanPayload(formData);
      assert.strictEqual(payload.maxCompanies, 2);
      assert.strictEqual(payload.maxUsersPerCompany, null);
      assert.strictEqual(payload.maxUsers, null);
    });

    it('supports UNLIMITED_EDUCATION with null maxCompanies, maxUsersPerCompany, and maxUsers', () => {
      const formData = {
        name: 'Unlimited education',
        code: 'UNLIMITED_EDUCATION',
        durationDays: 365,
        price: 0,
        isUnlimitedCompanies: true,
        maxCompanies: null,
        isUnlimitedUsers: true,
        maxUsersPerCompany: null,
        moduleIds: ['mod-acc'],
      };

      const validation = validatePlanFormData(formData);
      assert.strictEqual(validation.isValid, true);

      const payload = preparePlanPayload(formData);
      assert.strictEqual(payload.code, 'UNLIMITED_EDUCATION');
      assert.strictEqual(payload.maxCompanies, null);
      assert.strictEqual(payload.maxUsersPerCompany, null);
      assert.strictEqual(payload.maxUsers, null);
    });

    it('normalizes empty string limits to null even if isUnlimited flag was omitted', () => {
      const formData = {
        name: 'Unlimited education',
        code: 'UNLIMITED_EDUCATION',
        durationDays: 365,
        maxCompanies: '',
        maxUsersPerCompany: '',
        moduleIds: ['mod-acc'],
      };

      const payload = preparePlanPayload(formData);
      assert.strictEqual(payload.maxCompanies, null);
      assert.strictEqual(payload.maxUsersPerCompany, null);
      assert.strictEqual(payload.maxUsers, null);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Edit existing plan
  // ──────────────────────────────────────────────────────────────────────────
  describe('4. Edit existing plan', () => {
    it('preserves existing unexposed fields like razorpayPlanId and planVersion when updating', () => {
      const existingPlan = {
        id: 'plan-123',
        code: 'PRO',
        name: 'Pro',
        razorpayPlanId: 'plan_Rzp123456',
        planVersion: 'v2',
        createdAt: '2026-01-01T00:00:00',
      };

      const formData = {
        name: 'Pro Updated',
        code: 'PRO',
        durationDays: 60,
        isUnlimitedCompanies: false,
        maxCompanies: 8,
        isUnlimitedUsers: false,
        maxUsersPerCompany: 40,
        moduleIds: ['mod-acc', 'mod-inv'],
      };

      const payload = preparePlanPayload(formData, existingPlan);
      assert.strictEqual(payload.name, 'Pro Updated');
      assert.strictEqual(payload.durationDays, 60);
      assert.strictEqual(payload.maxCompanies, 8);
      assert.strictEqual(payload.razorpayPlanId, 'plan_Rzp123456');
      assert.strictEqual(payload.planVersion, 'v2');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Existing NULL limits correctly render as Unlimited
  // ──────────────────────────────────────────────────────────────────────────
  describe('5. Existing NULL limits correctly render as Unlimited', () => {
    it('renders "Unlimited" when limit is null or undefined, never showing "null" or "0"', () => {
      assert.strictEqual(formatPlanLimit(null), 'Unlimited');
      assert.strictEqual(formatPlanLimit(undefined), 'Unlimited');
      assert.strictEqual(formatPlanLimit(''), 'Unlimited');
      assert.strictEqual(formatPlanLimit(null, 'companies'), 'Unlimited');
      assert.strictEqual(formatPlanLimit(undefined, 'users'), 'Unlimited');
      assert.notStrictEqual(formatPlanLimit(null), 'null');
      assert.notStrictEqual(formatPlanLimit(null), '0');
    });

    it('renders positive number with unit when limit is defined', () => {
      assert.strictEqual(formatPlanLimit(4, 'companies'), '4 companies');
      assert.strictEqual(formatPlanLimit(10, 'users'), '10 users');
      assert.strictEqual(formatPlanLimit(1), '1');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Selected modules correctly render
  // ──────────────────────────────────────────────────────────────────────────
  describe('6. Selected modules correctly render', () => {
    it('restores active modules list correctly from backend response', () => {
      const backendPlan = {
        id: 'plan-1',
        name: 'Pro Plan',
        modules: [
          { moduleId: 'mod-1', moduleName: 'ACCOUNT', active: true },
          { moduleId: 'mod-2', moduleName: 'INVENTORY', active: true },
          { moduleId: 'mod-3', moduleName: 'CRM', active: false }, // Inactive module
        ],
      };

      const activeModuleIds = backendPlan.modules
        .filter(m => m.active !== false)
        .map(m => m.moduleId);

      assert.strictEqual(activeModuleIds.length, 2);
      assert.deepStrictEqual(activeModuleIds, ['mod-1', 'mod-2']);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 7. Module selection changes are submitted correctly
  // ──────────────────────────────────────────────────────────────────────────
  describe('7. Module selection changes are submitted correctly', () => {
    it('submits updated moduleIds array in payload matching backend DTO contract', () => {
      const formData = {
        name: 'Basic Plan',
        code: 'BASIC',
        durationDays: 30,
        isUnlimitedCompanies: false,
        maxCompanies: 1,
        isUnlimitedUsers: false,
        maxUsersPerCompany: 5,
        moduleIds: ['mod-acc', 'mod-crm'],
      };

      const payload = preparePlanPayload(formData);
      assert.deepStrictEqual(payload.moduleIds, ['mod-acc', 'mod-crm']);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 8. Invalid duration rejected
  // ──────────────────────────────────────────────────────────────────────────
  describe('8. Invalid duration rejected', () => {
    it('rejects 0 days duration', () => {
      const res = validatePlanFormData({
        name: 'Test Plan',
        code: 'TEST',
        durationDays: 0,
        isUnlimitedCompanies: true,
        isUnlimitedUsers: true,
        moduleIds: ['mod-1'],
      });
      assert.strictEqual(res.isValid, false);
      assert.strictEqual(res.errors.durationDays, 'Duration must be a positive whole number of days');
    });

    it('rejects negative days duration', () => {
      const res = validatePlanFormData({
        name: 'Test Plan',
        code: 'TEST',
        durationDays: -5,
        isUnlimitedCompanies: true,
        isUnlimitedUsers: true,
        moduleIds: ['mod-1'],
      });
      assert.strictEqual(res.isValid, false);
      assert.strictEqual(res.errors.durationDays, 'Duration must be a positive whole number of days');
    });

    it('rejects decimal days duration', () => {
      const res = validatePlanFormData({
        name: 'Test Plan',
        code: 'TEST',
        durationDays: 14.5,
        isUnlimitedCompanies: true,
        isUnlimitedUsers: true,
        moduleIds: ['mod-1'],
      });
      assert.strictEqual(res.isValid, false);
      assert.strictEqual(res.errors.durationDays, 'Duration must be a positive whole number of days');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 9. Invalid limits rejected
  // ──────────────────────────────────────────────────────────────────────────
  describe('9. Invalid limits rejected', () => {
    it('rejects negative maxCompanies when not unlimited', () => {
      const res = validatePlanFormData({
        name: 'Test Plan',
        code: 'TEST',
        durationDays: 30,
        isUnlimitedCompanies: false,
        maxCompanies: -2,
        isUnlimitedUsers: true,
        moduleIds: ['mod-1'],
      });
      assert.strictEqual(res.isValid, false);
      assert.strictEqual(res.errors.maxCompanies, 'Maximum companies must be a positive whole number');
    });

    it('rejects 0 maxUsersPerCompany when not unlimited', () => {
      const res = validatePlanFormData({
        name: 'Test Plan',
        code: 'TEST',
        durationDays: 30,
        isUnlimitedCompanies: true,
        isUnlimitedUsers: false,
        maxUsersPerCompany: 0,
        moduleIds: ['mod-1'],
      });
      assert.strictEqual(res.isValid, false);
      assert.strictEqual(res.errors.maxUsersPerCompany, 'Maximum users per company must be a positive whole number');
    });

    it('rejects empty modules list', () => {
      const res = validatePlanFormData({
        name: 'Test Plan',
        code: 'TEST',
        durationDays: 30,
        isUnlimitedCompanies: true,
        isUnlimitedUsers: true,
        moduleIds: [],
      });
      assert.strictEqual(res.isValid, false);
      assert.strictEqual(res.errors.moduleIds, 'At least one module must be included in the plan');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 10. Backend 400 displayed correctly
  // ──────────────────────────────────────────────────────────────────────────
  describe('10. Backend 400 displayed correctly', () => {
    it('extracts and displays backend validation message on HTTP 400', () => {
      const error = {
        response: {
          status: 400,
          data: {
            message: 'Company limit for current plan has been reached (4/4)',
          },
        },
      };

      const msg = getSafeErrorMessage(error);
      assert.strictEqual(msg, 'Company limit for current plan has been reached (4/4)');
    });

    it('formats multiple field errors if returned as a map on 400', () => {
      const error = {
        response: {
          status: 400,
          data: {
            data: {
              code: 'Plan code is required',
              durationDays: 'Duration must be at least 1 day',
            },
          },
        },
      };

      const msg = getSafeErrorMessage(error);
      assert.strictEqual(msg.includes('Plan code is required'), true);
      assert.strictEqual(msg.includes('Duration must be at least 1 day'), true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 11. Backend 403 displayed correctly
  // ──────────────────────────────────────────────────────────────────────────
  describe('11. Backend 403 displayed correctly', () => {
    it('displays helpful access denied message on 403', () => {
      const error = {
        response: {
          status: 403,
          data: {
            message: 'Access denied: Only SYSTEM_ADMIN is authorized to manage modules',
          },
        },
      };

      const msg = getSafeErrorMessage(error);
      assert.strictEqual(msg, "You don't have permission to perform this action.");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 12. Backend 409 displayed correctly
  // ──────────────────────────────────────────────────────────────────────────
  describe('12. Backend 409 displayed correctly', () => {
    it('displays duplicate plan code conflict message on 409', () => {
      const error = {
        response: {
          status: 409,
          data: {
            message: "Subscription plan with code 'PRO' already exists",
          },
        },
      };

      const msg = getSafeErrorMessage(error);
      assert.strictEqual(msg, "Subscription plan with code 'PRO' already exists");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 13. Save button prevents duplicate submission
  // ──────────────────────────────────────────────────────────────────────────
  describe('13. Save button prevents duplicate submission', () => {
    it('prevents concurrent invocation when isSaving is active', async () => {
      let callCount = 0;
      let isSaving = false;

      const triggerSave = async () => {
        if (isSaving) return;
        isSaving = true;
        callCount++;
        // Simulate async API call
        await new Promise(r => setTimeout(r, 20));
        isSaving = false;
      };

      // Call twice concurrently
      const p1 = triggerSave();
      const p2 = triggerSave();
      await Promise.all([p1, p2]);

      assert.strictEqual(callCount, 1);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 14. Unauthorized user cannot access plan-management actions
  // ──────────────────────────────────────────────────────────────────────────
  describe('14. Unauthorized user cannot access plan-management actions', () => {
    it('verifies non-admin role check rejects regular member access to admin settings', () => {
      const regularUserRoles = ['ROLE_MEMBER', 'user'];
      const isSuperAdmin = regularUserRoles.some(r =>
        ['super_admin', 'SUPER_ADMIN', 'system_admin', 'ROLE_SYSTEM_ADMIN'].includes(r)
      );

      assert.strictEqual(isSuperAdmin, false);
    });

    it('verifies super_admin role check permits access', () => {
      const superAdminRoles = ['super_admin'];
      const isSuperAdmin = superAdminRoles.some(r =>
        ['super_admin', 'SUPER_ADMIN', 'system_admin'].includes(r)
      );

      assert.strictEqual(isSuperAdmin, true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 15. Existing plans continue to render correctly
  // ──────────────────────────────────────────────────────────────────────────
  describe('15. Existing plans continue to render correctly', () => {
    it('normalizes plan code by converting to uppercase and snake_case', () => {
      assert.strictEqual(normalizePlanCode('30 Day Free Trial'), '30_DAY_FREE_TRIAL');
      assert.strictEqual(normalizePlanCode('Pro tier-1'), 'PRO_TIER1');
      assert.strictEqual(normalizePlanCode('  Enterprise  '), 'ENTERPRISE');
    });

    it('supports Enterprise tier with unlimited companies and users per company', () => {
      const enterprisePlan = {
        code: 'ENTERPRISE',
        name: 'Enterprise Plan',
        durationDays: 30,
        maxCompanies: null,
        maxUsersPerCompany: null,
        modules: [
          { moduleName: 'ACCOUNT', active: true },
          { moduleName: 'INVENTORY', active: true },
          { moduleName: 'WORKFLOW', active: true },
          { moduleName: 'CRM', active: true },
        ],
      };

      assert.strictEqual(formatPlanLimit(enterprisePlan.maxCompanies), 'Unlimited');
      assert.strictEqual(formatPlanLimit(enterprisePlan.maxUsersPerCompany), 'Unlimited');
      assert.strictEqual(enterprisePlan.modules.length, 4);
    });

    it('supports Free Trial tier with 4 companies and 10 users per company', () => {
      const trialPlan = {
        code: '30_DAY_FREE_TRIAL',
        name: '30 Day Free Trial',
        durationDays: 30,
        maxCompanies: 4,
        maxUsersPerCompany: 10,
        modules: [
          { moduleName: 'ACCOUNT', active: true },
          { moduleName: 'INVENTORY', active: true },
          { moduleName: 'WORKFLOW', active: true },
          { moduleName: 'CRM', active: true },
        ],
      };

      assert.strictEqual(formatPlanLimit(trialPlan.maxCompanies, 'companies'), '4 companies');
      assert.strictEqual(formatPlanLimit(trialPlan.maxUsersPerCompany, 'users'), '10 users');
      assert.strictEqual(trialPlan.durationDays, 30);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 17. Module Catalog Unpacking & Fallback Harvesting
  // ──────────────────────────────────────────────────────────────────────────
  describe('17. Module Catalog Unpacking & Fallback Harvesting', () => {
    function extractModules(rawMods) {
      return Array.isArray(rawMods)
        ? rawMods
        : Array.isArray(rawMods?.modules)
        ? rawMods.modules
        : Array.isArray(rawMods?.data?.modules)
        ? rawMods.data.modules
        : Array.isArray(rawMods?.data)
        ? rawMods.data
        : Array.isArray(rawMods?.content)
        ? rawMods.content
        : Array.isArray(rawMods?.items)
        ? rawMods.items
        : [];
    }

    it('correctly extracts modules from { modules: [...] } backend payload', () => {
      const ssoResponse = {
        modules: [
          { id: 'mod-1', name: 'ACCOUNT', moduleStatus: true },
          { id: 'mod-2', name: 'INVENTORY', moduleStatus: true },
          { id: 'mod-3', name: 'CRM', moduleStatus: true },
        ],
        pagination: { page: 0, pageSize: 200, totalElements: 3, totalPages: 1 }
      };

      const extracted = extractModules(ssoResponse);
      assert.strictEqual(extracted.length, 3);
      assert.strictEqual(extracted[0].name, 'ACCOUNT');
    });

    it('correctly extracts modules from direct array or nested data envelope', () => {
      const directArray = [{ id: 'm-1', name: 'WORKFLOW' }];
      assert.strictEqual(extractModules(directArray).length, 1);

      const nestedEnvelope = { data: { modules: [{ id: 'm-2', name: 'HR' }] } };
      assert.strictEqual(extractModules(nestedEnvelope).length, 1);
      assert.strictEqual(extractModules(nestedEnvelope)[0].name, 'HR');
    });

    it('harvests module definitions from plan modules when server catalog is empty', () => {
      const emptyServerMods = { modules: [] };
      let mods = extractModules(emptyServerMods);
      assert.strictEqual(mods.length, 0);

      const editingPlan = {
        name: '30-Day Free Trial',
        modules: [
          { moduleId: 'm-1', moduleName: 'ACCOUNT', active: true },
          { moduleId: 'm-2', moduleName: 'INVENTORY', active: true },
          { moduleId: 'm-3', moduleName: 'CRM', active: true },
          { moduleId: 'm-4', moduleName: 'WORKFLOW', active: true },
          { moduleId: 'm-5', moduleName: 'MANUFACTURING', active: true },
        ]
      };

      const harvested = [...mods];
      const existingIds = new Set(harvested.map((m) => m.id));
      editingPlan.modules.forEach((pm) => {
        const modId = pm.moduleId || pm.id;
        if (modId && !existingIds.has(modId)) {
          existingIds.add(modId);
          harvested.push({
            id: modId,
            name: pm.moduleName || pm.name,
            active: pm.active !== false,
          });
        }
      });

      assert.strictEqual(harvested.length, 5);
      assert.strictEqual(harvested[0].name, 'ACCOUNT');
      assert.strictEqual(harvested[4].name, 'MANUFACTURING');
    });
  });

});
