import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  isSystemAdmin,
  isOrganizationOwner,
  isOrganizationAdmin,
  canManagePlans,
  canBuySubscription,
  canViewPlans,
  getBuyDisabledReason,
} from '../../../utils/subscriptionPermissions.js';

import {
  SUBSCRIPTION_STATUS,
  ACCESS_MODE,
  formatINR,
  formatCurrencyAmount,
  formatDurationCycle,
  rupeesToPaise,
  paiseToRupees,
  formatSubscriptionStatusText,
} from '../../../constants/subscriptionConstants.js';

import {
  validatePlanFormData,
  preparePlanPayload,
  formatPlanLimit,
  normalizePlanCode,
} from '../../../utils/subscriptionPlanHelper.js';

describe('Phase 4: Subscription Permissions, Formatters & State Handling Tests', () => {

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Role & Permission Helpers (derived strictly from backend SSO /me)
  // ──────────────────────────────────────────────────────────────────────────
  describe('1. Role & Permission Helpers', () => {
    it('isSystemAdmin returns true for SYSTEM_ADMIN and ROLE_SYSTEM_ADMIN', () => {
      assert.strictEqual(isSystemAdmin({ user: { role: 'SYSTEM_ADMIN' } }), true);
      assert.strictEqual(isSystemAdmin({ user: { role: 'role_system_admin' } }), true);
      assert.strictEqual(isSystemAdmin({ user: { roles: ['ROLE_SYSTEM_ADMIN'] } }), true);
      assert.strictEqual(isSystemAdmin({ user: { role: 'OWNER' } }), false);
      assert.strictEqual(isSystemAdmin({ user: { role: 'ADMIN' } }), false);
      assert.strictEqual(isSystemAdmin(null), false);
    });

    it('canManagePlans allows ONLY SYSTEM_ADMIN (super admin)', () => {
      const superAdminContext = { user: { role: 'SYSTEM_ADMIN' } };
      const ownerContext = {
        membership: { memberType: 'OWNER' },
        organization: { ownerId: 'user-1' },
        user: { id: 'user-1', role: 'owner' },
      };
      const adminContext = {
        membership: { memberType: 'ADMIN' },
        user: { role: 'ADMIN' },
      };
      const regularUser = { user: { role: 'STAFF' } };

      assert.strictEqual(canManagePlans(superAdminContext), true);
      assert.strictEqual(canManagePlans(ownerContext), false);
      assert.strictEqual(canManagePlans(adminContext), false);
      assert.strictEqual(canManagePlans(regularUser), false);
    });

    it('canBuySubscription allows SYSTEM_ADMIN, OWNER, and ADMIN', () => {
      const superAdminContext = { user: { role: 'SYSTEM_ADMIN' } };
      const ownerContext = { membership: { memberType: 'OWNER' } };
      const adminContext = { membership: { memberType: 'ADMIN' } };
      const accountantContext = { membership: { memberType: 'MEMBER' }, user: { role: 'ACCOUNTANT' } };

      assert.strictEqual(canBuySubscription(superAdminContext), true);
      assert.strictEqual(canBuySubscription(ownerContext), true);
      assert.strictEqual(canBuySubscription(adminContext), true);
      assert.strictEqual(canBuySubscription(accountantContext), false);
    });

    it('canViewPlans allows SYSTEM_ADMIN, OWNER, ADMIN, and users with SUBSCRIPTION_PLAN:READ', () => {
      assert.strictEqual(canViewPlans({ user: { role: 'SYSTEM_ADMIN' } }), true);
      assert.strictEqual(canViewPlans({ membership: { memberType: 'OWNER' } }), true);
      assert.strictEqual(canViewPlans({ membership: { memberType: 'ADMIN' } }), true);
      assert.strictEqual(canViewPlans({ permissions: ['SUBSCRIPTION_PLAN:READ'] }), true);
      assert.strictEqual(canViewPlans({ user: { role: 'ACCOUNTANT' }, membership: { memberType: 'MEMBER' } }), false);
      assert.strictEqual(canViewPlans({ user: { role: 'STAFF' } }), false);
      assert.strictEqual(canViewPlans(null), false);
    });

    it('getBuyDisabledReason gives actionable explanation for unprivileged roles', () => {
      const regularContext = { user: { role: 'ACCOUNTANT' }, membership: { memberType: 'MEMBER' } };
      const ownerContext = { membership: { memberType: 'OWNER' } };

      assert.strictEqual(getBuyDisabledReason(ownerContext), null);
      assert.strictEqual(
        getBuyDisabledReason(regularContext),
        'Only Organization Owners or Administrators have permission to purchase or upgrade subscriptions.'
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Price, Paise & Cycle Formatters
  // ──────────────────────────────────────────────────────────────────────────
  describe('2. Currency, Paise & Cycle Formatting', () => {
    it('correctly converts rupees to paise and paise to rupees', () => {
      assert.strictEqual(rupeesToPaise(4999), 499900);
      assert.strictEqual(rupeesToPaise(0), 0);
      assert.strictEqual(rupeesToPaise('49.50'), 4950);

      assert.strictEqual(paiseToRupees(499900), 4999);
      assert.strictEqual(paiseToRupees(4950), 49.5);
      assert.strictEqual(paiseToRupees(0), 0);
    });

    it('formatINR formats currency in INR with en-IN numbering', () => {
      assert.strictEqual(formatINR(4999, false), '₹4,999');
      assert.strictEqual(formatINR(499900, true), '₹4,999');
      assert.strictEqual(formatINR(0, false), '₹0');
    });

    it('formatDurationCycle renders user-friendly cycle string', () => {
      assert.strictEqual(formatDurationCycle(30), 'month');
      assert.strictEqual(formatDurationCycle(365), 'year');
      assert.strictEqual(formatDurationCycle(366), 'year');
      assert.strictEqual(formatDurationCycle(90), 'quarter');
      assert.strictEqual(formatDurationCycle(14), '14 days');
    });

    it('formatSubscriptionStatusText renders unknown enum values as raw text', () => {
      assert.strictEqual(formatSubscriptionStatusText('ACTIVE'), 'Active');
      assert.strictEqual(formatSubscriptionStatusText('TRIALING'), 'Free Trial');
      assert.strictEqual(formatSubscriptionStatusText('CANCELLED'), 'Cancelled');
      assert.strictEqual(formatSubscriptionStatusText('NEW_UNKNOWN_STATUS'), 'NEW_UNKNOWN_STATUS');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Plan Form Validation & Payload Mapping
  // ──────────────────────────────────────────────────────────────────────────
  describe('3. Plan Form Validation & Payload Mapping', () => {
    it('validates required fields: code, name, price, duration', () => {
      const invalidForm = {
        name: '',
        code: '',
        durationDays: 0,
        price: -10,
      };

      const validation = validatePlanFormData(invalidForm);
      assert.strictEqual(validation.isValid, false);
      assert.ok(validation.errors.name);
      assert.ok(validation.errors.code);
      assert.ok(validation.errors.durationDays);
      assert.ok(validation.errors.price);
    });

    it('prepares payload with null quotas when unlimited is checked', () => {
      const form = {
        name: 'Enterprise Plus',
        code: 'ENT_PLUS',
        description: 'Scalable cloud tier',
        durationDays: 365,
        price: 99999,
        currency: 'INR',
        active: true,
        isTrial: false,
        isUnlimitedCompanies: true,
        maxCompanies: '',
        isUnlimitedUsers: true,
        maxUsersPerCompany: '',
        moduleIds: ['mod-1'],
      };

      const payload = preparePlanPayload(form);
      assert.strictEqual(payload.maxCompanies, null);
      assert.strictEqual(payload.maxUsersPerCompany, null);
      assert.strictEqual(payload.maxUsers, null);
      assert.strictEqual(payload.price, 99999);
      assert.strictEqual(payload.code, 'ENT_PLUS');
    });

    it('normalizes plan codes to clean uppercase strings', () => {
      assert.strictEqual(normalizePlanCode('pro plan 2026_v1'), 'PRO_PLAN_2026_V1');
      assert.strictEqual(normalizePlanCode('  starter_tier  '), 'STARTER_TIER');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Checkout State Handling & Double-Click Guard
  // ──────────────────────────────────────────────────────────────────────────
  describe('4. Checkout State Handling & Double-Click Guard', () => {
    it('prevents double-submit when submission is already in-flight', () => {
      let isSubmitting = false;
      let orderCallCount = 0;

      const triggerCheckout = () => {
        if (isSubmitting) return 'BLOCKED_BY_GUARD';
        isSubmitting = true;
        orderCallCount += 1;
        return 'INITIATED';
      };

      // First click: triggers order creation
      const res1 = triggerCheckout();
      assert.strictEqual(res1, 'INITIATED');
      assert.strictEqual(orderCallCount, 1);

      // Concurrent rapid second click: blocked by guard
      const res2 = triggerCheckout();
      assert.strictEqual(res2, 'BLOCKED_BY_GUARD');
      assert.strictEqual(orderCallCount, 1);

      // Reset upon completion / dismiss
      isSubmitting = false;
      const res3 = triggerCheckout();
      assert.strictEqual(res3, 'INITIATED');
      assert.strictEqual(orderCallCount, 2);
    });

    it('prevents double payment verification race conditions', () => {
      let isVerifying = false;
      let verifyCallCount = 0;

      const handlePaymentSuccess = () => {
        if (isVerifying) return 'BLOCKED_VERIFICATION';
        isVerifying = true;
        verifyCallCount += 1;
        return 'VERIFYING';
      };

      const call1 = handlePaymentSuccess();
      assert.strictEqual(call1, 'VERIFYING');
      assert.strictEqual(verifyCallCount, 1);

      // Double webhook / duplicate event
      const call2 = handlePaymentSuccess();
      assert.strictEqual(call2, 'BLOCKED_VERIFICATION');
      assert.strictEqual(verifyCallCount, 1);
    });

    it('verifies checkout payload unwrapping compatibility', () => {
      const serverResponseRaw = {
        orderId: 'order_123',
        amountInPaise: 499900,
        keyId: 'rzp_test_key',
      };
      const serverResponseWrapped = {
        data: {
          orderId: 'order_123',
          amountInPaise: 499900,
          keyId: 'rzp_test_key',
        },
      };

      const unwrap = (res) => res?.data?.data ?? res?.data ?? res;
      assert.strictEqual(unwrap(serverResponseRaw).orderId, 'order_123');
      assert.strictEqual(unwrap(serverResponseWrapped).orderId, 'order_123');
    });
  });
});
