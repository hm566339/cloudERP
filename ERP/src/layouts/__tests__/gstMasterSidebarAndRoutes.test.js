import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  buildDynamicSidebar,
  hasPermission,
} from '../dynamicSidebarConfig.js';
import { CANONICAL_MODULES, buildAuthContext, canViewModule } from '../../utils/moduleNormalization.js';

describe('GST Master Sidebar Menu and Permission Verification Suite', () => {

  const createAuthUser = ({ hasGstMaster = true, hasGstSlabs = true, hasHsnSac = true, role = 'OWNER' } = {}) => {
    const features = [];
    const permissions = [];

    if (hasGstMaster) {
      features.push({ featureCode: 'GST_MASTER', featureName: 'GST Master', moduleName: 'ACCOUNT', active: true });
      permissions.push('GST_MASTER:READ', 'GST_MASTER:WRITE', 'GST_MASTER:DELETE');
    }
    if (hasGstSlabs) {
      features.push({ featureCode: 'GST_SLABS', featureName: 'GST Slabs', moduleName: 'ACCOUNT', active: true });
      permissions.push('GST_SLABS:READ');
    }
    if (hasHsnSac) {
      features.push({ featureCode: 'HSN_SAC', featureName: 'HSN / SAC', moduleName: 'ACCOUNT', active: true });
      permissions.push('HSN_SAC:READ');
    }

    const rawSsoMe = {
      user: { id: 'usr-123', role, email: 'owner@testcorp.com', status: 'ACTIVE' },
      organization: { id: 'org-456', code: 'TEST_ORG', status: 'ACTIVE' },
      currentCompany: { id: 'comp-789', code: 'TEST_CO', name: 'Test Company', status: 'ACTIVE' },
      membership: { memberType: role, status: 'ACTIVE' },
      accessMode: 'FULL',
      modules: [
        { id: 'm1', code: 'account', canonical: 'ACCOUNT', active: true }
      ],
      features,
      permissions
    };

    return buildAuthContext(rawSsoMe);
  };

  it('1. OWNER with GST_MASTER can see GST Master under Tax in Accounts sidebar', () => {
    const authContext = createAuthUser({ hasGstMaster: true, hasGstSlabs: true, hasHsnSac: true });
    const links = buildDynamicSidebar({
      authContext,
      companyId: 'comp-789',
      userRole: 'owner',
      isSuperAdminGlobal: false,
    });

    const accountsGroup = links.find((l) => l.id === 'accounts');
    assert.ok(accountsGroup, 'Accounts group should exist');

    const taxSection = accountsGroup.children?.find((c) => c.id === 'acc-tax');
    assert.ok(taxSection, 'Tax section should exist under Accounts');

    const taxChildren = taxSection.children || [];
    const childIds = taxChildren.map((c) => c.id);
    const childLabels = taxChildren.map((c) => c.label);

    assert.ok(childIds.includes('acc-tax-gst-master'), 'GST Master must be present in Tax menu');
    assert.ok(childIds.includes('acc-tax-gst'), 'GST Slabs must be present');
    assert.ok(childIds.includes('acc-tax-hsn'), 'HSN / SAC must be present');

    assert.deepStrictEqual(childLabels, ['GST Master', 'GST Slabs', 'HSN / SAC'], 'Tax items must appear in expected order');

    const gstMasterItem = taxChildren.find((c) => c.id === 'acc-tax-gst-master');
    assert.strictEqual(gstMasterItem.path, '/company/comp-789/accounts/tax/gst-master');
    assert.strictEqual(gstMasterItem.featureCode, 'GST_MASTER');
  });

  it('2. Users without GST_MASTER permission cannot see GST Master in sidebar', () => {
    const authContext = createAuthUser({ hasGstMaster: false, hasGstSlabs: true, hasHsnSac: true });
    const links = buildDynamicSidebar({
      authContext,
      companyId: 'comp-789',
      userRole: 'accountant',
      isSuperAdminGlobal: false,
    });

    const accountsGroup = links.find((l) => l.id === 'accounts');
    const taxSection = accountsGroup.children?.find((c) => c.id === 'acc-tax');
    const taxChildren = taxSection?.children || [];
    const childIds = taxChildren.map((c) => c.id);

    assert.strictEqual(childIds.includes('acc-tax-gst-master'), false, 'GST Master must NOT be visible without permission');
    assert.ok(childIds.includes('acc-tax-gst'), 'GST Slabs should remain visible');
    assert.ok(childIds.includes('acc-tax-hsn'), 'HSN / SAC should remain visible');
  });

  it('3. Route guard canViewModule grants access to GST_MASTER only when permission exists', () => {
    const authorized = createAuthUser({ hasGstMaster: true });
    const unauthorized = createAuthUser({ hasGstMaster: false });

    assert.strictEqual(canViewModule(authorized, 'GST_MASTER'), true, 'Authorized user must be allowed on GST_MASTER route');
    assert.strictEqual(canViewModule(unauthorized, 'GST_MASTER'), false, 'Unauthorized user must be denied on GST_MASTER route');
  });

  it('4. Respects READ, WRITE, and DELETE permissions for GST_MASTER', () => {
    const authorized = createAuthUser({ hasGstMaster: true });

    assert.strictEqual(hasPermission(authorized, 'GST_MASTER', 'READ'), true, 'READ permission granted');
    assert.strictEqual(hasPermission(authorized, 'GST_MASTER', 'WRITE'), true, 'WRITE permission granted');
    assert.strictEqual(hasPermission(authorized, 'GST_MASTER', 'DELETE'), true, 'DELETE permission granted');
    assert.strictEqual(hasPermission(authorized, 'GST_MASTER', 'APPROVE'), false, 'APPROVE permission not granted');

    const unauthorized = createAuthUser({ hasGstMaster: false });
    assert.strictEqual(hasPermission(unauthorized, 'GST_MASTER', 'READ'), false, 'READ denied');
    assert.strictEqual(hasPermission(unauthorized, 'GST_MASTER', 'WRITE'), false, 'WRITE denied');
    assert.strictEqual(hasPermission(unauthorized, 'GST_MASTER', 'DELETE'), false, 'DELETE denied');
  });
});

