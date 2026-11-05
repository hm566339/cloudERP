import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getOwnerSidebarNavGroups } from '../ownerSidebarConfig.js';
import { isItemOrChildActive } from '../SidebarNavUtils.js';
import { ORG_NAV_ITEMS, resolveOrgSubmenuPath } from '../../features/settings/components/organizationNavConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Owner Sidebar Organization Management Expandable Navigation Test Suite', () => {

  describe('1. Organization Management Expandable Navigation Configuration', () => {
    const navGroups = getOwnerSidebarNavGroups({
      entitledModules: ['ACCOUNT', 'INVENTORY', 'CRM', 'PURCHASES', 'WORKFLOW', 'SSO'],
      activeCompanyId: 'comp-101',
      companiesCount: 3,
      isActive: true,
    });

    const settingsGroup = navGroups.find((g) => g.id === 'settings-group');
    assert.ok(settingsGroup, 'settings-group must exist');

    const orgItem = settingsGroup.items.find((i) => i.id === 'organization-management');
    assert.ok(orgItem, 'organization-management item must exist in settings-group');

    it('defines Organization Management as a parent item with children array', () => {
      assert.strictEqual(orgItem.label, 'Organization Management');
      assert.strictEqual(orgItem.path, '/owner/settings');
      assert.strictEqual(orgItem.isEntitled, true);
      assert.ok(Array.isArray(orgItem.children), 'organization-management must have a children array');
    });

    it('contains exactly the 12 requested submenu items in exact order', () => {
      assert.strictEqual(orgItem.children.length, 12, 'Must contain exactly 12 submenu items');

      const expectedOrder = [
        { label: 'Overview', path: '/owner/settings' },
        { label: 'Organization Profile', path: '/owner/settings/profile' },
        { label: 'Companies Management', path: '/owner/settings/companies' },
        { label: 'Users & Permissions', path: '/owner/settings/users' },
        { label: 'Role Management', path: '/owner/settings/roles' },
        { label: 'Permission Management', path: '/owner/settings/permissions' },
        { label: 'Portal & Module Access', path: '/owner/settings/portal-access' },
        { label: 'Security & Authentication', path: '/owner/settings/security' },
        { label: 'Organization Login Portal', path: '/owner/settings/login-portal' },
        { label: 'Notifications', path: '/owner/settings/notifications' },
        { label: 'Localization & Formats', path: '/owner/settings/localization' },
        { label: 'Appearance & Themes', path: '/owner/settings/appearance' },
      ];

      expectedOrder.forEach((expected, index) => {
        const actual = orgItem.children[index];
        assert.ok(actual, `Child item at index ${index} must exist`);
        assert.strictEqual(actual.label, expected.label, `Label at index ${index} must match ${expected.label}`);
        assert.strictEqual(actual.path, expected.path, `Path at index ${index} must match ${expected.path}`);
      });
    });

    it('preserves other settings group items intact (Subscription & Owner Profile)', () => {
      const subItem = settingsGroup.items.find((i) => i.id === 'subscription-management');
      assert.ok(subItem, 'subscription-management must exist');
      assert.strictEqual(subItem.path, '/subscription');

      const profileItem = settingsGroup.items.find((i) => i.id === 'owner-profile');
      assert.ok(profileItem, 'owner-profile must exist');
      assert.strictEqual(profileItem.path, '/profile');
    });
  });

  describe('2. Active Submenu Highlighting & Parent Auto-Expansion', () => {
    const navGroups = getOwnerSidebarNavGroups({});
    const settingsGroup = navGroups.find((g) => g.id === 'settings-group');
    const orgItem = settingsGroup.items.find((i) => i.id === 'organization-management');

    it('activates Overview and expands parent on /owner/settings route', () => {
      const currentPath = '/owner/settings';
      const isParentActive = isItemOrChildActive(orgItem, currentPath);
      assert.strictEqual(isParentActive, true, 'Parent must be active on /owner/settings');

      const overviewChild = orgItem.children.find((c) => c.label === 'Overview');
      assert.strictEqual(isItemOrChildActive(overviewChild, currentPath), true, 'Overview must be active');

      const profileChild = orgItem.children.find((c) => c.label === 'Organization Profile');
      assert.strictEqual(isItemOrChildActive(profileChild, currentPath), false, 'Profile must not be active');
    });

    it('activates Organization Profile and expands parent on /owner/settings/profile', () => {
      const currentPath = '/owner/settings/profile';
      const isParentActive = isItemOrChildActive(orgItem, currentPath);
      assert.strictEqual(isParentActive, true, 'Parent must be active on /owner/settings/profile');

      const overviewChild = orgItem.children.find((c) => c.label === 'Overview');
      assert.strictEqual(isItemOrChildActive(overviewChild, currentPath), false, 'Overview must NOT be active');

      const profileChild = orgItem.children.find((c) => c.label === 'Organization Profile');
      assert.strictEqual(isItemOrChildActive(profileChild, currentPath), true, 'Profile must be active');
    });

    it('activates Appearance & Themes and expands parent on /owner/settings/appearance', () => {
      const currentPath = '/owner/settings/appearance';
      assert.strictEqual(isItemOrChildActive(orgItem, currentPath), true, 'Parent must be active');

      const appearanceChild = orgItem.children.find((c) => c.label === 'Appearance & Themes');
      assert.strictEqual(isItemOrChildActive(appearanceChild, currentPath), true, 'Appearance must be active');

      const overviewChild = orgItem.children.find((c) => c.label === 'Overview');
      assert.strictEqual(isItemOrChildActive(overviewChild, currentPath), false, 'Overview must NOT be active');
    });

    it('supports backwards-compatible /settings/organization routes', () => {
      const currentPath = '/settings/organization/security';
      assert.strictEqual(isItemOrChildActive(orgItem, currentPath), true, 'Parent must be active on /settings/organization/security');

      const secChild = orgItem.children.find((c) => c.label === 'Security & Authentication');
      assert.strictEqual(isItemOrChildActive(secChild, currentPath), true, 'Security must be active');
    });
  });

  describe('3. Removal of Second Sub-Sidebar & Layout Verification', () => {
    const pageFilePath = path.resolve(__dirname, '../../features/settings/pages/OrganizationSettingsPage.jsx');
    const pageContent = fs.readFileSync(pageFilePath, 'utf8');

    it('does not import or render OrganizationSubSidebar inside OrganizationSettingsPage', () => {
      assert.doesNotMatch(
        pageContent,
        /<OrganizationSubSidebar/,
        'OrganizationSettingsPage must NOT render <OrganizationSubSidebar />'
      );
      assert.doesNotMatch(
        pageContent,
        /import\s+OrganizationSubSidebar/,
        'OrganizationSettingsPage must NOT import OrganizationSubSidebar'
      );
    });

    it('does not render mobile separate sub-sidebar drawer or menu trigger', () => {
      assert.doesNotMatch(
        pageContent,
        /mobileDrawerOpen/,
        'OrganizationSettingsPage must NOT use mobileDrawerOpen state'
      );
      assert.doesNotMatch(
        pageContent,
        /Open Organization Submenu/,
        'OrganizationSettingsPage must NOT render sub-sidebar mobile drawer button'
      );
    });

    it('uses full content width with w-full and no column layout split', () => {
      assert.ok(pageContent.includes('w-full'), 'OrganizationSettingsPage must include w-full');
      assert.doesNotMatch(
        pageContent,
        /flex-row/,
        'OrganizationSettingsPage root must not be a multi-column flex-row with a sub-sidebar'
      );
    });
  });

  describe('4. OwnerSidebar Nav Item Rendering', () => {
    const sidebarFilePath = path.resolve(__dirname, '../OwnerSidebar.jsx');
    const sidebarContent = fs.readFileSync(sidebarFilePath, 'utf8');

    it('imports SidebarNavItem to render expandable parent navigation items', () => {
      assert.ok(
        sidebarContent.includes('import SidebarNavItem from \'./SidebarNavItem\';'),
        'OwnerSidebar must import SidebarNavItem'
      );
    });

    it('delegates expandable items with children to SidebarNavItem', () => {
      assert.ok(
        sidebarContent.includes('item.children && item.children.length > 0'),
        'OwnerSidebar must check for item.children to render expandable navigation'
      );
      assert.ok(
        sidebarContent.includes('<SidebarNavItem'),
        'OwnerSidebar must render <SidebarNavItem /> for expandable items'
      );
    });
  });

});

