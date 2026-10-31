import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as orgApi from '../../../api/sso/organizationSettings.api.js';

describe('Organization Settings API Client Suite', () => {
  describe('1. Profile API Methods', () => {
    it('exports getOrganizationProfile function', () => {
      assert.strictEqual(typeof orgApi.getOrganizationProfile, 'function');
    });

    it('exports updateOrganizationProfile function', () => {
      assert.strictEqual(typeof orgApi.updateOrganizationProfile, 'function');
    });
  });

  describe('2. Dedicated Login Portal API Methods', () => {
    it('exports getLoginPortal function', () => {
      assert.strictEqual(typeof orgApi.getLoginPortal, 'function');
    });
  });

  describe('3. Regional & Fiscal Defaults API Methods', () => {
    it('exports getRegionalSettings function', () => {
      assert.strictEqual(typeof orgApi.getRegionalSettings, 'function');
    });

    it('exports updateRegionalSettings function', () => {
      assert.strictEqual(typeof orgApi.updateRegionalSettings, 'function');
    });
  });

  describe('4. Security & Compliance API Methods', () => {
    it('exports getSecuritySettings function', () => {
      assert.strictEqual(typeof orgApi.getSecuritySettings, 'function');
    });

    it('exports updateSecuritySettings function', () => {
      assert.strictEqual(typeof orgApi.updateSecuritySettings, 'function');
    });
  });

  describe('5. Multi-Company Management API Methods', () => {
    it('exports getOrganizationCompanies function', () => {
      assert.strictEqual(typeof orgApi.getOrganizationCompanies, 'function');
    });

    it('exports createOrganizationCompany function', () => {
      assert.strictEqual(typeof orgApi.createOrganizationCompany, 'function');
    });

    it('exports getOrganizationCompanyById function', () => {
      assert.strictEqual(typeof orgApi.getOrganizationCompanyById, 'function');
    });

    it('exports updateOrganizationCompany function', () => {
      assert.strictEqual(typeof orgApi.updateOrganizationCompany, 'function');
    });

    it('exports deleteOrganizationCompany function', () => {
      assert.strictEqual(typeof orgApi.deleteOrganizationCompany, 'function');
    });
  });

  describe('6. Subscription & Usage API Methods', () => {
    it('exports getOrganizationSubscription function', () => {
      assert.strictEqual(typeof orgApi.getOrganizationSubscription, 'function');
    });

    it('exports getOrganizationSubscriptionUsage function', () => {
      assert.strictEqual(typeof orgApi.getOrganizationSubscriptionUsage, 'function');
    });
  });

  describe('7. Entitled Modules API Methods', () => {
    it('exports getOrganizationModules function', () => {
      assert.strictEqual(typeof orgApi.getOrganizationModules, 'function');
    });

    it('exports updateOrganizationModules function', () => {
      assert.strictEqual(typeof orgApi.updateOrganizationModules, 'function');
    });

    it('exports getCompanyModules function', () => {
      assert.strictEqual(typeof orgApi.getCompanyModules, 'function');
    });

    it('exports updateCompanyModules function', () => {
      assert.strictEqual(typeof orgApi.updateCompanyModules, 'function');
    });
  });
});

