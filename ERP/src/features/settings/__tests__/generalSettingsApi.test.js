import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generalSettingsApi } from '../services/generalSettingsApi.js';
import { settingsApi } from '../../../api/sso/settings.api.js';

describe('General Settings Backend Integration & API Contract Suite', () => {
  describe('1. RTK Query Endpoint Definitions Contract', () => {
    it('defines getGeneralSettings query endpoint for GET /api/settings/general', () => {
      assert.ok(generalSettingsApi.endpoints.getGeneralSettings);
      const queryDef = generalSettingsApi.endpoints.getGeneralSettings.initiate();
      assert.ok(queryDef);
    });

    it('defines updateGeneralSettings mutation endpoint for PUT /api/settings/general', () => {
      assert.ok(generalSettingsApi.endpoints.updateGeneralSettings);
      const mutDef = generalSettingsApi.endpoints.updateGeneralSettings.initiate({
        companyName: 'Acme International',
        contactEmail: 'admin@acme.com',
        defaultCurrency: 'INR',
        timezone: 'IST',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '12h',
      });
      assert.ok(mutDef);
    });

    it('defines getOrganizationSettings query endpoint for GET /api/settings/organization', () => {
      assert.ok(generalSettingsApi.endpoints.getOrganizationSettings);
      const queryDef = generalSettingsApi.endpoints.getOrganizationSettings.initiate();
      assert.ok(queryDef);
    });

    it('defines updateOrganizationSettings mutation endpoint for PUT /api/settings/organization', () => {
      assert.ok(generalSettingsApi.endpoints.updateOrganizationSettings);
      const mutDef = generalSettingsApi.endpoints.updateOrganizationSettings.initiate({
        companyName: 'Acme Global',
        contactEmail: 'contact@acmeglobal.com',
      });
      assert.ok(mutDef);
    });

    it('defines getLocalizationSettings query endpoint for GET /api/settings/localization', () => {
      assert.ok(generalSettingsApi.endpoints.getLocalizationSettings);
      const queryDef = generalSettingsApi.endpoints.getLocalizationSettings.initiate();
      assert.ok(queryDef);
    });

    it('defines updateLocalizationSettings mutation endpoint for PUT /api/settings/localization', () => {
      assert.ok(generalSettingsApi.endpoints.updateLocalizationSettings);
      const mutDef = generalSettingsApi.endpoints.updateLocalizationSettings.initiate({
        defaultCurrency: 'USD',
        timezone: 'America/New_York',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: '24h',
      });
      assert.ok(mutDef);
    });
  });

  describe('2. Direct Axios settingsApi Client Methods', () => {
    it('provides getGeneralSettings, updateGeneralSettings, getOrganizationSettings, etc.', () => {
      assert.strictEqual(typeof settingsApi.getGeneralSettings, 'function');
      assert.strictEqual(typeof settingsApi.updateGeneralSettings, 'function');
      assert.strictEqual(typeof settingsApi.getOrganizationSettings, 'function');
      assert.strictEqual(typeof settingsApi.updateOrganizationSettings, 'function');
      assert.strictEqual(typeof settingsApi.getLocalizationSettings, 'function');
      assert.strictEqual(typeof settingsApi.updateLocalizationSettings, 'function');
    });

    it('preserves legacy getCompanySettings and updateCompanySettings', () => {
      assert.strictEqual(typeof settingsApi.getCompanySettings, 'function');
      assert.strictEqual(typeof settingsApi.updateCompanySettings, 'function');
    });
  });
});

