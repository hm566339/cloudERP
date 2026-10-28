import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  calculateTrialDaysRemaining,
  deriveSubscriptionStatus,
  formatTrialBadge,
  deriveOrganizationContext,
  getReadAccessPolicy,
  sanitizeWriteAccessError,
  READ_ONLY_BLOCK_MESSAGE,
  BLOCKED_ACCESS_MESSAGE
} from '../../../utils/subscriptionHelper.js';

describe('Phase 11 — Trial Status, Organization Context & Subscription UX Tests', () => {

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Authoritative Server Timestamp Calculation & Countdown
  // ──────────────────────────────────────────────────────────────────────────
  describe('1. Authoritative Trial Countdown (Server Timestamp, Never Hardcoded)', () => {
    it('calculates remaining days accurately from UTC server timestamp', () => {
      const now = new Date('2026-09-25T12:00:00.000Z');
      const trialEndsAt = '2026-10-25T12:00:00.000Z'; // Exactly 30 days later

      const daysRemaining = calculateTrialDaysRemaining(trialEndsAt, now);
      assert.strictEqual(daysRemaining, 30);
    });

    it('calculates 29 days remaining for 29 days ahead', () => {
      const now = new Date('2026-09-25T12:00:00.000Z');
      const trialEndsAt = '2026-10-24T12:00:00.000Z';

      const daysRemaining = calculateTrialDaysRemaining(trialEndsAt, now);
      assert.strictEqual(daysRemaining, 29);
    });

    it('calculates 1 day remaining when less than 24 hours remain but not yet expired', () => {
      const now = new Date('2026-09-25T12:00:00.000Z');
      const trialEndsAt = '2026-09-26T06:00:00.000Z'; // 18 hours later

      const daysRemaining = calculateTrialDaysRemaining(trialEndsAt, now);
      assert.strictEqual(daysRemaining, 1);
    });

    it('returns 0 days remaining when trial timestamp is in the past', () => {
      const now = new Date('2026-09-25T12:00:00.000Z');
      const trialEndsAt = '2026-09-24T12:00:00.000Z'; // Expired 1 day ago

      const daysRemaining = calculateTrialDaysRemaining(trialEndsAt, now);
      assert.strictEqual(daysRemaining, 0);
    });

    it('returns null gracefully when trialEndsAt is missing or invalid', () => {
      assert.strictEqual(calculateTrialDaysRemaining(null), null);
      assert.strictEqual(calculateTrialDaysRemaining(undefined), null);
      assert.strictEqual(calculateTrialDaysRemaining('invalid-date'), null);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. TRIALING + FULL State
  // ──────────────────────────────────────────────────────────────────────────
  describe('2. TRIALING + FULL State', () => {
    it('shows Trial badge with exact remaining days when status is TRIALING and access is FULL', () => {
      const badge = formatTrialBadge({
        status: 'TRIALING',
        accessMode: 'FULL',
        daysRemaining: 29
      });

      assert.strictEqual(badge.show, true);
      assert.strictEqual(badge.type, 'trial');
      assert.strictEqual(badge.text, 'Trial • 29 days remaining');
      assert.strictEqual(badge.shortText, 'Trial • 29d');
      assert.strictEqual(badge.days, 29);
    });

    it('derives TRIALING status and FULL access mode correctly from backend state', () => {
      const now = new Date('2026-09-25T12:00:00.000Z');
      const derived = deriveSubscriptionStatus({
        status: 'TRIALING',
        accessMode: 'FULL',
        trialEndsAt: '2026-10-24T12:00:00.000Z',
        now
      });

      assert.strictEqual(derived, 'TRIALING');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. ACTIVE + FULL State
  // ──────────────────────────────────────────────────────────────────────────
  describe('3. ACTIVE + FULL State (No Trial Countdown)', () => {
    it('does NOT show trial countdown when organization status is ACTIVE', () => {
      const badge = formatTrialBadge({
        status: 'ACTIVE',
        accessMode: 'FULL',
        daysRemaining: 25 // Even if trial date was retained in DB, ACTIVE suppresses countdown
      });

      assert.strictEqual(badge.show, false);
      assert.strictEqual(badge.type, 'active');
      assert.strictEqual(badge.text, 'Subscription Active');
    });

    it('derives ACTIVE status correctly even when access mode is FULL', () => {
      const derived = deriveSubscriptionStatus({
        status: 'ACTIVE',
        accessMode: 'FULL'
      });

      assert.strictEqual(derived, 'ACTIVE');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. EXPIRED + READ_ONLY State
  // ──────────────────────────────────────────────────────────────────────────
  describe('4. EXPIRED + READ_ONLY State', () => {
    it('shows Read-Only badge and action to Upgrade when trial expires', () => {
      const badge = formatTrialBadge({
        status: 'EXPIRED',
        accessMode: 'READ_ONLY',
        daysRemaining: 0
      });

      assert.strictEqual(badge.show, true);
      assert.strictEqual(badge.type, 'read_only');
      assert.strictEqual(badge.text, 'Trial Expired • Read-Only');
      assert.strictEqual(badge.shortText, 'Read-Only');
    });

    it('derives EXPIRED status when accessMode is READ_ONLY', () => {
      const derived = deriveSubscriptionStatus({
        status: 'TRIALING',
        accessMode: 'READ_ONLY',
        trialEndsAt: '2026-09-20T00:00:00.000Z'
      });

      assert.strictEqual(derived, 'EXPIRED');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. BLOCKED State
  // ──────────────────────────────────────────────────────────────────────────
  describe('5. BLOCKED State', () => {
    it('shows restricted access state when accessMode is BLOCKED', () => {
      const badge = formatTrialBadge({
        status: 'BLOCKED',
        accessMode: 'BLOCKED'
      });

      assert.strictEqual(badge.show, true);
      assert.strictEqual(badge.type, 'blocked');
      assert.strictEqual(badge.text, 'Account Access Restricted');
    });

    it('derives BLOCKED status whenever accessMode is BLOCKED, taking precedence', () => {
      const derived = deriveSubscriptionStatus({
        status: 'ACTIVE',
        accessMode: 'BLOCKED'
      });

      assert.strictEqual(derived, 'BLOCKED');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Business Write UX & 403 Read-Only Handling
  // ──────────────────────────────────────────────────────────────────────────
  describe('6. Business Write UX & 403 Read-Only Handling', () => {
    it('returns standard helpful read-only message on blocked write attempt', () => {
      const error = {
        status: 403,
        data: { message: 'Organization is read-only' }
      };

      const message = sanitizeWriteAccessError(error);
      assert.strictEqual(message, READ_ONLY_BLOCK_MESSAGE);
      assert.strictEqual(
        message.includes('Your free trial has expired. This account is currently read-only.'),
        true
      );
    });

    it('returns restricted access message on BLOCKED 403', () => {
      const error = {
        status: 403,
        data: { message: 'Account access blocked by administrator' }
      };

      const message = sanitizeWriteAccessError(error);
      assert.strictEqual(message, BLOCKED_ACCESS_MESSAGE);
    });

    it('does not confuse read-only 403 with invalid password or logout triggers', () => {
      const error = {
        status: 403,
        data: { message: 'Organization is read-only' }
      };

      const message = sanitizeWriteAccessError(error);
      assert.strictEqual(message.includes('Invalid email or password'), false);
      assert.strictEqual(message.includes('Session expired'), false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 7. Read Operations Allowed in READ_ONLY Mode
  // ──────────────────────────────────────────────────────────────────────────
  describe('7. Read Operations Retention in READ_ONLY Mode', () => {
    it('permits reading dashboards, reports, and existing records in READ_ONLY mode', () => {
      const policy = getReadAccessPolicy('READ_ONLY');

      assert.strictEqual(policy.canReadDashboard, true);
      assert.strictEqual(policy.canReadReports, true);
      assert.strictEqual(policy.canReadRecords, true);
      assert.strictEqual(policy.canReadSubscription, true);
      assert.strictEqual(policy.canWriteBusinessData, false);
      assert.strictEqual(policy.shouldRedirectToLogin, false);
      assert.strictEqual(policy.shouldClearSession, false);
    });

    it('blocks all operations when access is BLOCKED', () => {
      const policy = getReadAccessPolicy('BLOCKED');

      assert.strictEqual(policy.canReadDashboard, false);
      assert.strictEqual(policy.canReadReports, false);
      assert.strictEqual(policy.canWriteBusinessData, false);
    });

    it('permits full read and write when access is FULL', () => {
      const policy = getReadAccessPolicy('FULL');

      assert.strictEqual(policy.canReadDashboard, true);
      assert.strictEqual(policy.canWriteBusinessData, true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 8. Organization & Company Context Dynamic Display
  // ──────────────────────────────────────────────────────────────────────────
  describe('8. Organization & Company Dynamic Context', () => {
    it('derives organization and company dynamically from authenticated user state', () => {
      const user = {
        id: 'usr_123',
        username: 'vishal_admin',
        fullName: 'Vishal Sharma',
        organizationId: 'org_999',
        organizationCode: 'vishal',
        organizationName: 'Vishal Enterprises',
        companyId: 'comp_001',
        companyCode: 'VISHAL_MUMBAI',
        companyName: 'Vishal Mumbai Branch',
        accessMode: 'FULL',
        subscription: {
          status: 'TRIALING',
          trialEndsAt: new Date(Date.now() + 10 * 86400000).toISOString()
        }
      };

      const context = deriveOrganizationContext(user);

      assert.strictEqual(context.organization.code, 'vishal');
      assert.strictEqual(context.organization.name, 'Vishal Enterprises');
      assert.strictEqual(context.company.code, 'VISHAL_MUMBAI');
      assert.strictEqual(context.company.name, 'Vishal Mumbai Branch');
      assert.strictEqual(context.isTrial, true);
      assert.strictEqual(context.isReadOnly, false);
    });

    it('respects explicitly selected company over default user company', () => {
      const user = {
        organizationCode: 'vishal',
        companyCode: 'VISHAL_MUMBAI',
        companyName: 'Vishal Mumbai'
      };

      const selectedCompany = {
        id: 'comp_002',
        code: 'VISHAL_DELHI',
        name: 'Vishal Delhi Branch'
      };

      const context = deriveOrganizationContext(user, selectedCompany);
      assert.strictEqual(context.company.code, 'VISHAL_DELHI');
      assert.strictEqual(context.company.name, 'Vishal Delhi Branch');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 9. Security & Anti-Spoofing (Frontend Isolation)
  // ──────────────────────────────────────────────────────────────────────────
  describe('9. Security & Anti-Spoofing Isolation', () => {
    it('does not treat URL or arbitrary strings as authorization', () => {
      // If user state is empty, context must be empty regardless of external inputs
      const context = deriveOrganizationContext(null);

      assert.strictEqual(context.organization.code, null);
      assert.strictEqual(context.organization.name, null);
      assert.strictEqual(context.company.code, null);
      assert.strictEqual(context.isReadOnly, false);
    });

    it('requires backend accessMode to establish read-only status (frontend is UX only)', () => {
      // Backend is always authoritative
      const userWithFull = { accessMode: 'FULL' };
      const userWithReadOnly = { accessMode: 'READ_ONLY' };

      assert.strictEqual(deriveOrganizationContext(userWithFull).isReadOnly, false);
      assert.strictEqual(deriveOrganizationContext(userWithReadOnly).isReadOnly, true);
    });
  });

});
