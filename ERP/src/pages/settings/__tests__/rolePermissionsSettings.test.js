import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('RolePermissionsSettings Granular Action Permissions Suite', () => {
  const CANONICAL_ACTIONS = [
    { label: 'Read', value: 'READ' },
    { label: 'Create', value: 'CREATE' },
    { label: 'Update', value: 'UPDATE' },
    { label: 'Write', value: 'WRITE' },
    { label: 'Delete', value: 'DELETE' },
    { label: 'Approve', value: 'APPROVE' },
    { label: 'Reject', value: 'REJECT' },
    { label: 'Return', value: 'RETURN' },
    { label: 'Delegate', value: 'DELEGATE' },
    { label: 'Cancel', value: 'CANCEL' },
    { label: 'Activate', value: 'ACTIVATE' },
    { label: 'Deactivate', value: 'DEACTIVATE' },
    { label: 'Export', value: 'EXPORT' }
  ];

  // Simulated logic mirroring RolePermissionsSettings.jsx
  function loadRolePermissions(permsList) {
    const newSet = new Set();
    (permsList || []).forEach(p => {
      if (!p.featureCode || !p.action) return;
      if (p.active !== false && p.enabled !== false && p.allowed !== false) {
        const featureCode = p.featureCode.toUpperCase().trim();
        let action = p.action.toUpperCase().trim();
        if (action === 'VIEW') action = 'READ';
        newSet.add(`${featureCode}:${action}`);
      }
    });
    return newSet;
  }

  function buildSupportedFeatureActions(catalog) {
    const map = new Map();
    (catalog || []).forEach(p => {
      if (!p.featureCode || !p.action) return;
      const fCode = p.featureCode.toUpperCase().trim();
      const act = p.action.toUpperCase().trim();
      if (!map.has(fCode)) {
        map.set(fCode, new Set());
      }
      map.get(fCode).add(act);
    });
    return map;
  }

  function buildSavePayload(catalog, selectedPerms) {
    const permissionMap = new Map();

    (catalog || []).forEach(p => {
      if (!p.featureCode || !p.action) return;
      const featureCode = p.featureCode.toUpperCase().trim();
      const action = p.action.toUpperCase().trim();
      const key = `${featureCode}:${action}`;
      permissionMap.set(key, {
        featureCode,
        action,
        enabled: selectedPerms.has(key)
      });
    });

    selectedPerms.forEach(permKey => {
      const [featCode, act] = permKey.split(':');
      if (featCode && act) {
        const featureCode = featCode.toUpperCase().trim();
        const action = act.toUpperCase().trim();
        const key = `${featureCode}:${action}`;
        if (!permissionMap.has(key)) {
          permissionMap.set(key, {
            featureCode,
            action,
            enabled: true
          });
        }
      }
    });

    return Array.from(permissionMap.values());
  }

  function toggleFeatureAction(selectedPerms, featureCode, action, isActionSupported) {
    const fCode = featureCode.toUpperCase().trim();
    const act = action.toUpperCase().trim();
    const key = `${fCode}:${act}`;
    const newSet = new Set(selectedPerms);
    if (newSet.has(key)) {
      newSet.delete(key);
      if (act === 'READ') {
        newSet.delete(`${fCode}:WRITE`);
        newSet.delete(`${fCode}:DELETE`);
      }
    } else {
      newSet.add(key);
      if (act === 'WRITE' || act === 'DELETE') {
        if (isActionSupported(fCode, 'READ')) {
          newSet.add(`${fCode}:READ`);
        }
      }
    }
    return newSet;
  }

  describe('1. Granular Actions Definition', () => {
    it('contains all 13 canonical actions in correct sequence', () => {
      const actionValues = CANONICAL_ACTIONS.map(a => a.value);
      assert.deepStrictEqual(actionValues, [
        'READ',
        'CREATE',
        'UPDATE',
        'WRITE',
        'DELETE',
        'APPROVE',
        'REJECT',
        'RETURN',
        'DELEGATE',
        'CANCEL',
        'ACTIVATE',
        'DEACTIVATE',
        'EXPORT'
      ]);
      assert.strictEqual(CANONICAL_ACTIONS.length, 13);
    });
  });

  describe('2. Permission Loading Behavior', () => {
    it('preserves all 13 actions without discarding APPROVE, REJECT, EXPORT, etc.', () => {
      const apiResponse = [
        { featureCode: 'SALES_INVOICES', action: 'READ', active: true },
        { featureCode: 'SALES_INVOICES', action: 'CREATE', active: true },
        { featureCode: 'SALES_INVOICES', action: 'UPDATE', active: true },
        { featureCode: 'SALES_INVOICES', action: 'WRITE', active: true },
        { featureCode: 'SALES_INVOICES', action: 'DELETE', active: true },
        { featureCode: 'SALES_INVOICES', action: 'APPROVE', active: true },
        { featureCode: 'SALES_INVOICES', action: 'REJECT', active: true },
        { featureCode: 'SALES_INVOICES', action: 'RETURN', active: true },
        { featureCode: 'SALES_INVOICES', action: 'DELEGATE', active: true },
        { featureCode: 'SALES_INVOICES', action: 'CANCEL', active: true },
        { featureCode: 'USERS', action: 'ACTIVATE', active: true },
        { featureCode: 'USERS', action: 'DEACTIVATE', active: true },
        { featureCode: 'REPORTS', action: 'EXPORT', active: true }
      ];

      const loaded = loadRolePermissions(apiResponse);

      // Verify no flattening of CREATE/UPDATE into WRITE
      assert.strictEqual(loaded.has('SALES_INVOICES:CREATE'), true);
      assert.strictEqual(loaded.has('SALES_INVOICES:UPDATE'), true);
      assert.strictEqual(loaded.has('SALES_INVOICES:WRITE'), true);

      // Verify workflow actions are preserved
      assert.strictEqual(loaded.has('SALES_INVOICES:APPROVE'), true);
      assert.strictEqual(loaded.has('SALES_INVOICES:REJECT'), true);
      assert.strictEqual(loaded.has('SALES_INVOICES:RETURN'), true);
      assert.strictEqual(loaded.has('SALES_INVOICES:DELEGATE'), true);
      assert.strictEqual(loaded.has('SALES_INVOICES:CANCEL'), true);

      // Verify lifecycle and utility actions
      assert.strictEqual(loaded.has('USERS:ACTIVATE'), true);
      assert.strictEqual(loaded.has('USERS:DEACTIVATE'), true);
      assert.strictEqual(loaded.has('REPORTS:EXPORT'), true);
    });

    it('ignores inactive, disabled, or not-allowed permission entries', () => {
      const apiResponse = [
        { featureCode: 'SALES_INVOICES', action: 'READ', active: true },
        { featureCode: 'SALES_INVOICES', action: 'APPROVE', active: false },
        { featureCode: 'SALES_INVOICES', action: 'DELETE', enabled: false },
        { featureCode: 'CUSTOMERS', action: 'WRITE', allowed: false }
      ];

      const loaded = loadRolePermissions(apiResponse);
      assert.strictEqual(loaded.has('SALES_INVOICES:READ'), true);
      assert.strictEqual(loaded.has('SALES_INVOICES:APPROVE'), false);
      assert.strictEqual(loaded.has('SALES_INVOICES:DELETE'), false);
      assert.strictEqual(loaded.has('CUSTOMERS:WRITE'), false);
    });
  });

  describe('3. Permission Saving & Payload Format', () => {
    it('sends granular actions without filtering to READ, WRITE, DELETE', () => {
      const catalog = [
        { featureCode: 'SALES_INVOICES', action: 'READ' },
        { featureCode: 'SALES_INVOICES', action: 'WRITE' },
        { featureCode: 'SALES_INVOICES', action: 'DELETE' },
        { featureCode: 'SALES_INVOICES', action: 'APPROVE' },
        { featureCode: 'SALES_INVOICES', action: 'REJECT' },
        { featureCode: 'REPORTS', action: 'EXPORT' }
      ];

      const selected = new Set([
        'SALES_INVOICES:READ',
        'SALES_INVOICES:APPROVE',
        'REPORTS:EXPORT'
      ]);

      const payload = buildSavePayload(catalog, selected);

      // Check structure
      const approveItem = payload.find(p => p.featureCode === 'SALES_INVOICES' && p.action === 'APPROVE');
      assert.ok(approveItem, 'APPROVE item must exist in sync payload');
      assert.strictEqual(approveItem.enabled, true);

      const writeItem = payload.find(p => p.featureCode === 'SALES_INVOICES' && p.action === 'WRITE');
      assert.ok(writeItem, 'WRITE item must exist in sync payload');
      assert.strictEqual(writeItem.enabled, false);

      const exportItem = payload.find(p => p.featureCode === 'REPORTS' && p.action === 'EXPORT');
      assert.ok(exportItem, 'EXPORT item must exist in sync payload');
      assert.strictEqual(exportItem.enabled, true);

      // Verify no invalid permissions are invented
      const invented = payload.filter(p => p.featureCode === 'REPORTS' && p.action === 'APPROVE');
      assert.strictEqual(invented.length, 0);
    });
  });

  describe('4. Independent SALES_INVOICES:APPROVE Selection', () => {
    const isSupported = () => true;

    it('allows selecting SALES_INVOICES:APPROVE without selecting WRITE or DELETE', () => {
      let perms = new Set(['SALES_INVOICES:READ']);

      // Toggle APPROVE on
      perms = toggleFeatureAction(perms, 'SALES_INVOICES', 'APPROVE', isSupported);
      assert.strictEqual(perms.has('SALES_INVOICES:APPROVE'), true);
      assert.strictEqual(perms.has('SALES_INVOICES:WRITE'), false);
      assert.strictEqual(perms.has('SALES_INVOICES:DELETE'), false);

      // Toggle APPROVE off
      perms = toggleFeatureAction(perms, 'SALES_INVOICES', 'APPROVE', isSupported);
      assert.strictEqual(perms.has('SALES_INVOICES:APPROVE'), false);
      assert.strictEqual(perms.has('SALES_INVOICES:READ'), true);
    });

    it('allows toggling WRITE without affecting APPROVE', () => {
      let perms = new Set(['SALES_INVOICES:READ', 'SALES_INVOICES:APPROVE']);

      // Toggle WRITE on
      perms = toggleFeatureAction(perms, 'SALES_INVOICES', 'WRITE', isSupported);
      assert.strictEqual(perms.has('SALES_INVOICES:WRITE'), true);
      assert.strictEqual(perms.has('SALES_INVOICES:APPROVE'), true);

      // Toggle WRITE off
      perms = toggleFeatureAction(perms, 'SALES_INVOICES', 'WRITE', isSupported);
      assert.strictEqual(perms.has('SALES_INVOICES:WRITE'), false);
      assert.strictEqual(perms.has('SALES_INVOICES:APPROVE'), true);
    });

    it('unchecking READ does NOT automatically remove APPROVE', () => {
      let perms = new Set(['SALES_INVOICES:READ', 'SALES_INVOICES:WRITE', 'SALES_INVOICES:APPROVE']);

      // Uncheck READ: drops WRITE and DELETE, but preserves APPROVE
      perms = toggleFeatureAction(perms, 'SALES_INVOICES', 'READ', isSupported);
      assert.strictEqual(perms.has('SALES_INVOICES:READ'), false);
      assert.strictEqual(perms.has('SALES_INVOICES:WRITE'), false);
      assert.strictEqual(perms.has('SALES_INVOICES:APPROVE'), true);
    });
  });

  describe('5. Supported Feature Actions Mapping & Masking', () => {
    it('correctly maps supported actions from permissions catalog', () => {
      const catalog = [
        { featureCode: 'SALES_INVOICES', action: 'READ' },
        { featureCode: 'SALES_INVOICES', action: 'WRITE' },
        { featureCode: 'SALES_INVOICES', action: 'DELETE' },
        { featureCode: 'SALES_INVOICES', action: 'APPROVE' },
        { featureCode: 'GST_MASTER', action: 'READ' },
        { featureCode: 'GST_MASTER', action: 'WRITE' },
        { featureCode: 'GST_MASTER', action: 'DELETE' }
      ];

      const supported = buildSupportedFeatureActions(catalog);

      // SALES_INVOICES supports APPROVE
      assert.strictEqual(supported.get('SALES_INVOICES').has('APPROVE'), true);
      assert.strictEqual(supported.get('SALES_INVOICES').has('DELEGATE'), false);

      // GST_MASTER does NOT support APPROVE
      assert.strictEqual(supported.get('GST_MASTER').has('APPROVE'), false);
      assert.strictEqual(supported.get('GST_MASTER').has('READ'), true);
      assert.strictEqual(supported.get('GST_MASTER').has('WRITE'), true);
      assert.strictEqual(supported.get('GST_MASTER').has('DELETE'), true);
    });
  });
});

