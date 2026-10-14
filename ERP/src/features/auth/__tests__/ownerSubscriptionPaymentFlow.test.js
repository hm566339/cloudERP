import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  canWrite,
  canRead,
  buildAuthContext,
} from '../../../utils/moduleNormalization.js';
import {
  computeCheckoutPricing,
  isCurrentPlan,
  validatePaymentGatewayConfig,
} from '../../../utils/subscriptionCheckoutHelper.js';

describe('Owner Subscription Plan & Payment Flow Integration Tests', () => {

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Role & Permission Separation: Catalog Management vs Company Upgrade
  // ──────────────────────────────────────────────────────────────────────────
  describe('1. Role & Permission Separation', () => {
    it('evaluates Owner permissions accurately: cannot manage catalog, but CAN upgrade company subscription', () => {
      // Current Owner auth payload described in the issue
      const ownerPayload = {
        user: {
          id: 'user-owner-1',
          username: 'owner@mark2erp.com',
          role: 'owner',
          organizationId: 'org-101',
          companyId: 'comp-202',
        },
        organization: {
          id: 'org-101',
          code: 'mohit',
          name: 'Mohit Org',
          status: 'ACTIVE',
          accessMode: 'FULL',
        },
        currentCompany: {
          id: 'comp-202',
          code: 'MOHIT',
          name: 'Mohit Company',
          active: true,
        },
        membership: {
          memberType: 'OWNER',
          status: 'ACTIVE',
        },
        subscription: {
          id: 'sub-303',
          planCode: '30_DAY_FREE_TRIAL',
          planName: '30-Day Free Trial',
          trialing: true,
          status: 'TRIALING',
          accessMode: 'FULL',
          daysRemaining: 14,
        },
        features: [
          'BILLING',
          'SUBSCRIPTION_PLAN',
        ],
        permissions: [
          'SUBSCRIPTION:WRITE',
          'COMPANY_SUBSCRIPTION:WRITE',
          'SUBSCRIPTION_PLAN:READ', // Only READ on catalog!
        ],
      };

      const authContext = buildAuthContext(ownerPayload);

      const isSuperAdmin =
        authContext.user?.role === 'super_admin' ||
        (Array.isArray(authContext.user?.roles) &&
          authContext.user.roles.some((r) => (typeof r === 'string' ? r : r?.name)?.toLowerCase() === 'super_admin'));

      const isOwner =
        authContext.membership?.memberType === 'OWNER' ||
        authContext.user?.role === 'owner' ||
        authContext.user?.membership?.memberType === 'OWNER';

      // 1. Catalog Management (Create / Edit / Deactivate plans in catalog)
      const canManageCatalog = isSuperAdmin || canWrite(authContext, 'SUBSCRIPTION_PLAN');

      // 2. Company Subscription Upgrade (Purchase / Pay for current company)
      const canUpgradeSubscription =
        isSuperAdmin ||
        isOwner ||
        canWrite(authContext, 'COMPANY_SUBSCRIPTION') ||
        canWrite(authContext, 'SUBSCRIPTION') ||
        canWrite(authContext, 'BILLING');

      // Assertions
      assert.strictEqual(canManageCatalog, false, 'Owner with only READ on SUBSCRIPTION_PLAN must NOT manage catalog (hide Edit/Create/Deactivate)');
      assert.strictEqual(canUpgradeSubscription, true, 'Owner with SUBSCRIPTION:WRITE & COMPANY_SUBSCRIPTION:WRITE must be permitted to upgrade company subscription');
    });

    it('permits Super Admin to manage catalog and upgrade subscriptions', () => {
      const superAdminPayload = {
        user: {
          id: 'admin-1',
          role: 'super_admin',
        },
        permissions: ['ALL'],
      };

      const authContext = buildAuthContext(superAdminPayload);
      const isSuperAdmin = authContext.user?.role === 'super_admin';
      const canManageCatalog = isSuperAdmin || canWrite(authContext, 'SUBSCRIPTION_PLAN');
      const canUpgradeSubscription = isSuperAdmin || canWrite(authContext, 'SUBSCRIPTION');

      assert.strictEqual(canManageCatalog, true);
      assert.strictEqual(canUpgradeSubscription, true);
    });

    it('blocks unprivileged employee from both catalog management and subscription purchase', () => {
      const employeePayload = {
        user: {
          id: 'emp-1',
          role: 'employee',
        },
        membership: {
          memberType: 'MEMBER',
        },
        permissions: ['INVENTORY:READ', 'ACCOUNT:READ'],
      };

      const authContext = buildAuthContext(employeePayload);
      const isSuperAdmin = authContext.user?.role === 'super_admin';
      const isOwner = authContext.membership?.memberType === 'OWNER';

      const canManageCatalog = isSuperAdmin || canWrite(authContext, 'SUBSCRIPTION_PLAN');
      const canUpgradeSubscription =
        isSuperAdmin ||
        isOwner ||
        canWrite(authContext, 'COMPANY_SUBSCRIPTION') ||
        canWrite(authContext, 'SUBSCRIPTION') ||
        canWrite(authContext, 'BILLING');

      assert.strictEqual(canManageCatalog, false);
      assert.strictEqual(canUpgradeSubscription, false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Active Company Subscription Identification (isCurrentPlan)
  // ──────────────────────────────────────────────────────────────────────────
  describe('2. Active Company Subscription Identification (isCurrentPlan)', () => {
    const trialSubscription = {
      id: 'sub-trial-1',
      planId: 'plan-trial-uuid',
      planCode: '30_DAY_FREE_TRIAL',
      planName: '30-Day Free Trial',
      trialing: true,
      status: 'TRIALING',
    };

    const trialCatalogPlan = {
      id: 'plan-trial-uuid',
      code: '30_DAY_FREE_TRIAL',
      name: '30-Day Free Trial',
      isTrial: true,
      price: 0,
    };

    const businessCatalogPlan = {
      id: 'plan-biz-uuid',
      code: 'BUSINESS_PLAN',
      name: 'Business Plan',
      isTrial: false,
      price: 4999,
    };

    const proCatalogPlan = {
      id: 'plan-pro-uuid',
      code: 'PRO',
      name: 'Pro Plan',
      isTrial: false,
      price: 9999,
    };

    it('identifies the active trial plan as Current Plan', () => {
      assert.strictEqual(isCurrentPlan(trialCatalogPlan, trialSubscription), true);
    });

    it('identifies paid plans as NOT Current Plan when company is in trial', () => {
      assert.strictEqual(isCurrentPlan(businessCatalogPlan, trialSubscription), false);
      assert.strictEqual(isCurrentPlan(proCatalogPlan, trialSubscription), false);
    });

    it('updates identification when company upgrades to Business Plan', () => {
      const activeBusinessSubscription = {
        id: 'sub-biz-1',
        planId: 'plan-biz-uuid',
        planCode: 'BUSINESS_PLAN',
        planName: 'Business Plan',
        trialing: false,
        status: 'ACTIVE',
      };

      assert.strictEqual(isCurrentPlan(trialCatalogPlan, activeBusinessSubscription), false);
      assert.strictEqual(isCurrentPlan(businessCatalogPlan, activeBusinessSubscription), true);
      assert.strictEqual(isCurrentPlan(proCatalogPlan, activeBusinessSubscription), false);
    });

    it('handles null or undefined active subscription gracefully', () => {
      assert.strictEqual(isCurrentPlan(businessCatalogPlan, null), false);
      assert.strictEqual(isCurrentPlan(null, trialSubscription), false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Checkout Pricing & GST Breakdown (computeCheckoutPricing)
  // ──────────────────────────────────────────────────────────────────────────
  describe('3. Checkout Pricing & GST Breakdown (computeCheckoutPricing)', () => {
    it('computes 18% GST and total amount when taxRate is explicitly passed', () => {
      const pricing = computeCheckoutPricing(4999, 'INR', 0.18);

      assert.strictEqual(pricing.isFree, false);
      assert.strictEqual(pricing.basePrice, 4999);
      assert.strictEqual(pricing.taxAmount, 899.82);
      assert.strictEqual(pricing.totalAmount, 5898.82);
      assert.strictEqual(pricing.currencySymbol, '₹');
      assert.strictEqual(pricing.formattedBasePrice, '₹4,999');
    });

    it('defaults to 0 tax rate so frontend does not add GST to plan price', () => {
      const pricing = computeCheckoutPricing(4999, 'INR');

      assert.strictEqual(pricing.isFree, false);
      assert.strictEqual(pricing.basePrice, 4999);
      assert.strictEqual(pricing.taxAmount, 0);
      assert.strictEqual(pricing.totalAmount, 4999);
      assert.strictEqual(pricing.currencySymbol, '₹');
      assert.strictEqual(pricing.formattedBasePrice, '₹4,999');
      assert.strictEqual(pricing.formattedTotal, '₹4,999');
    });

    it('handles free trial plan correctly', () => {
      const pricing = computeCheckoutPricing(0, 'INR');

      assert.strictEqual(pricing.isFree, true);
      assert.strictEqual(pricing.basePrice, 0);
      assert.strictEqual(pricing.taxAmount, 0);
      assert.strictEqual(pricing.totalAmount, 0);
      assert.strictEqual(pricing.formattedTotal, 'Free');
    });

    it('handles invalid or negative price values gracefully', () => {
      const pricing = computeCheckoutPricing(-100, 'INR');
      assert.strictEqual(pricing.isFree, true);
      assert.strictEqual(pricing.totalAmount, 0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Payment Gateway Configuration Validation Contract
  // ──────────────────────────────────────────────────────────────────────────
  describe('4. Payment Gateway Configuration Validation Contract', () => {
    it('detects unconfigured payment gateway when keyId is missing from server response', () => {
      const serverResponseWithoutKey = {
        keyId: null,
        orderId: 'order_test123',
        amount: 589882,
        currency: 'INR',
      };

      assert.throws(
        () => validatePaymentGatewayConfig(serverResponseWithoutKey),
        /Payment gateway configuration is missing/
      );
    });

    it('accepts configured payment gateway when valid keyId and orderId are present (one-time checkout)', () => {
      const validOrderResponse = {
        keyId: 'rzp_test_1234567890',
        orderId: 'order_one_time_123',
        amount: 499900,
        currency: 'INR',
      };

      assert.strictEqual(validatePaymentGatewayConfig(validOrderResponse), true);
    });

    it('accepts configured payment gateway when valid keyId and legacy subscriptionId are present', () => {
      const validSubscriptionResponse = {
        keyId: 'rzp_test_1234567890',
        subscriptionId: 'sub_test123',
        amount: 589882,
        currency: 'INR',
      };

      assert.strictEqual(validatePaymentGatewayConfig(validSubscriptionResponse), true);
    });

    it('rejects when both orderId and subscriptionId are missing', () => {
      const missingIdsResponse = {
        keyId: 'rzp_test_1234567890',
        amount: 589882,
        currency: 'INR',
      };

      assert.throws(
        () => validatePaymentGatewayConfig(missingIdsResponse),
        /Server did not return a valid payment order or subscription ID/
      );
    });
  });
});

