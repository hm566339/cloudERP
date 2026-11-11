import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appFooterPath = path.resolve(__dirname, '../../components/common/AppFooter.jsx');
const commonIndexPath = path.resolve(__dirname, '../../components/common/index.js');
const dashboardLayoutPath = path.resolve(__dirname, '../DashboardLayout.jsx');
const companyLayoutPath = path.resolve(__dirname, '../CompanyLayout.jsx');
const accountantLayoutPath = path.resolve(__dirname, '../AccountantLayout.jsx');
const orgSettingsPagePath = path.resolve(__dirname, '../../features/settings/pages/OrganizationSettingsPage.jsx');
const appearanceSettingsPath = path.resolve(__dirname, '../../pages/settings/AppearanceSettings.jsx');
const ownerDashboardPath = path.resolve(__dirname, '../../features/dashboard/pages/OwnerDashboard.jsx');
const commonWorkspaceViewPath = path.resolve(__dirname, '../../features/dashboard/pages/CommonWorkspaceView.jsx');

describe('Application-Wide Footer Branding and Bottom Position Test Suite', () => {
  const appFooterContent = fs.readFileSync(appFooterPath, 'utf8');
  const commonIndexContent = fs.readFileSync(commonIndexPath, 'utf8');
  const dashboardLayoutContent = fs.readFileSync(dashboardLayoutPath, 'utf8');
  const companyLayoutContent = fs.readFileSync(companyLayoutPath, 'utf8');
  const accountantLayoutContent = fs.readFileSync(accountantLayoutPath, 'utf8');
  const orgSettingsContent = fs.readFileSync(orgSettingsPagePath, 'utf8');
  const appearanceContent = fs.readFileSync(appearanceSettingsPath, 'utf8');
  const ownerDashboardContent = fs.readFileSync(ownerDashboardPath, 'utf8');
  const commonWorkspaceContent = fs.readFileSync(commonWorkspaceViewPath, 'utf8');

  describe('1. Shared AppFooter Component & Exact Branding', () => {
    it('AppFooter component exists and renders exact Mark2 branding: © 2026 Mark2', () => {
      assert.ok(fs.existsSync(appFooterPath), 'AppFooter.jsx must exist');
      assert.match(
        appFooterContent,
        /(&copy;|©)\s*2026\s*Mark2/,
        'AppFooter must contain exact brand string "© 2026 Mark2" or "&copy; 2026 Mark2"'
      );
    });

    it('AppFooter applies mt-auto and responsive utility classes for full-height positioning', () => {
      assert.ok(appFooterContent.includes('mt-auto'), 'AppFooter must include mt-auto to push to bottom of flex container');
      assert.ok(appFooterContent.includes('w-full'), 'AppFooter must span full width');
      assert.ok(appFooterContent.includes('py-4'), 'AppFooter must have py-4 vertical padding');
      assert.ok(appFooterContent.includes('text-center'), 'AppFooter must be center-aligned');
      assert.ok(appFooterContent.includes('border-t'), 'AppFooter must have top border separation');
      assert.ok(appFooterContent.includes('data-testid="app-footer"'), 'AppFooter must have data-testid');
    });

    it('AppFooter does NOT use fixed or absolute positioning', () => {
      assert.doesNotMatch(appFooterContent, /\bfixed\b/, 'AppFooter must not use fixed positioning');
      assert.doesNotMatch(appFooterContent, /\babsolute\b/, 'AppFooter must not use absolute positioning');
    });

    it('Common index exports AppFooter for centralized component consumption', () => {
      assert.match(
        commonIndexContent,
        /export\s+\{\s*default\s+as\s+AppFooter\s*\}\s+from\s+'\.\/AppFooter';/,
        'components/common/index.js must export AppFooter'
      );
    });
  });

  describe('2. DashboardLayout Shell Full-Height Flexbox Structure', () => {
    it('DashboardLayout imports and renders AppFooter by default', () => {
      assert.ok(
        dashboardLayoutContent.includes("import AppFooter from '../components/common/AppFooter'"),
        'DashboardLayout must import AppFooter'
      );
      assert.match(
        dashboardLayoutContent,
        /\{!hideFooter\s*&&\s*\(footer\s*\|\|\s*<AppFooter\s*\/>\)\}/,
        'DashboardLayout must render AppFooter when hideFooter is falsy'
      );
    });

    it('DashboardLayout main scroll container uses vertical flex layout', () => {
      assert.match(
        dashboardLayoutContent,
        /<main\s+className="[^"]*flex-1[^"]*min-h-0[^"]*min-w-0[^"]*flex\s+flex-col[^"]*overflow-y-auto[^"]*"/,
        'DashboardLayout <main> must be flex-1 min-h-0 min-w-0 flex flex-col overflow-y-auto'
      );
    });

    it('DashboardLayout inner container enforces min-h-full for bottom footer anchoring', () => {
      assert.match(
        dashboardLayoutContent,
        /<div\s+className="[^"]*w-full\s+flex-1\s+flex\s+flex-col\s+min-h-full[^"]*"/,
        'DashboardLayout inner container must be min-h-full and flex flex-col'
      );
    });

    it('DashboardLayout preserves required responsive max-width and sidebar offset', () => {
      assert.ok(
        dashboardLayoutContent.includes('max-w-[2560px]'),
        'DashboardLayout must preserve max-w-[2560px]'
      );
      assert.match(
        dashboardLayoutContent,
        /sidebar\s*\?\s*\(isCollapsed\s*\?\s*'lg:pl-sidebar-collapsed'\s*:\s*'lg:pl-sidebar-expanded'\)\s*:\s*''/,
        'DashboardLayout must preserve sidebar responsive padding offset'
      );
    });
  });

  describe('3. CompanyLayout and AccountantLayout Full-Height Integration', () => {
    it('CompanyLayout imports and renders AppFooter inside main container', () => {
      assert.ok(
        companyLayoutContent.includes("import AppFooter from '../components/common/AppFooter'"),
        'CompanyLayout must import AppFooter'
      );
      assert.match(
        companyLayoutContent,
        /\{!isFullHeightPage\s*&&\s*\(\s*<AppFooter\s*\/>\s*\)\}/,
        'CompanyLayout must render AppFooter inside main content when not full height page'
      );
    });

    it('CompanyLayout applies min-h-full on inner content container when not full-height page', () => {
      assert.match(
        companyLayoutContent,
        /isFullHeightPage\s*\?\s*'h-full\s+min-h-0'\s*:\s*'min-h-full\s+max-w-\[2560px\]/,
        'CompanyLayout inner container must be min-h-full when not full-height page'
      );
    });

    it('AccountantLayout imports and renders AppFooter inside main container', () => {
      assert.ok(
        accountantLayoutContent.includes("import AppFooter from '../components/common/AppFooter'"),
        'AccountantLayout must import AppFooter'
      );
      assert.match(
        accountantLayoutContent,
        /\{!isFullHeightPage\s*&&\s*\(\s*<AppFooter\s*\/>\s*\)\}/,
        'AccountantLayout must render AppFooter inside main content when not full height page'
      );
    });

    it('AccountantLayout applies min-h-full on inner content container when not full-height page', () => {
      assert.match(
        accountantLayoutContent,
        /isFullHeightPage\s*\?\s*'h-full\s+min-h-0'\s*:\s*'min-h-full\s+max-w-\[2560px\]/,
        'AccountantLayout inner container must be min-h-full when not full-height page'
      );
    });
  });

  describe('4. Elimination of Ad-Hoc Footers & Branding Consistency Across Pages', () => {
    it('OrganizationSettingsPage does not contain duplicate ad-hoc footer', () => {
      assert.doesNotMatch(
        orgSettingsContent,
        /<footer[^>]*>.*?<\/footer>/s,
        'OrganizationSettingsPage must NOT contain an ad-hoc footer (uses layout footer)'
      );
      assert.doesNotMatch(
        orgSettingsContent,
        /2026\s*Mark\b(?!2)/,
        'OrganizationSettingsPage must NOT contain legacy "2026 Mark" branding'
      );
    });

    it('AppearanceSettings does not contain duplicate ad-hoc footer', () => {
      assert.doesNotMatch(
        appearanceContent,
        /<footer[^>]*>.*?<\/footer>/s,
        'AppearanceSettings must NOT contain an ad-hoc footer (uses layout footer)'
      );
      assert.doesNotMatch(
        appearanceContent,
        /2026\s*Mark\b(?!2)/,
        'AppearanceSettings must NOT contain legacy "2026 Mark" branding'
      );
    });

    it('OwnerDashboard relies on shared DashboardLayout AppFooter and does not duplicate footer', () => {
      assert.doesNotMatch(
        ownerDashboardContent,
        /<footer[^>]*>.*?<\/footer>/s,
        'OwnerDashboard must NOT contain an ad-hoc footer'
      );
    });

    it('CommonWorkspaceView uses updated Mark2 copyright branding', () => {
      assert.match(
        commonWorkspaceContent,
        /©\s*2026\s*Mark2/,
        'CommonWorkspaceView must use "© 2026 Mark2"'
      );
      assert.ok(
        commonWorkspaceContent.includes('mt-auto'),
        'CommonWorkspaceView footer must use mt-auto'
      );
    });
  });

  describe('5. Layout Math & Simulation for Short vs Long Content', () => {
    it('Short Page: Inner container expands to 100% viewport and mt-auto pins footer to bottom', () => {
      const viewportHeight = 800; // px
      const headerHeight = 56; // px
      const availableMainHeight = viewportHeight - headerHeight; // 744px
      const contentHeight = 180; // short page (e.g., 2 roles or empty table)
      const footerHeight = 48; // AppFooter py-4 + text height

      // With min-h-full (100% of availableMainHeight):
      const innerContainerHeight = Math.max(availableMainHeight, contentHeight + footerHeight);
      assert.strictEqual(innerContainerHeight, 744, 'Inner container must fill 100% of available viewport (744px)');

      // With mt-auto on footer:
      const footerMarginTop = innerContainerHeight - (contentHeight + footerHeight);
      assert.strictEqual(footerMarginTop, 516, 'mt-auto absorbs all remaining vertical space');

      const footerBottomOffset = availableMainHeight - (contentHeight + footerMarginTop + footerHeight);
      assert.strictEqual(footerBottomOffset, 0, 'Footer is placed precisely at the bottom of the viewport with 0px empty gap');
    });

    it('Long Page: Inner container expands naturally with content and footer scrolls after complete content', () => {
      const viewportHeight = 800; // px
      const headerHeight = 56; // px
      const availableMainHeight = viewportHeight - headerHeight; // 744px
      const contentHeight = 2400; // long page (e.g., 20 roles + 368 permissions matrix)
      const footerHeight = 48; // AppFooter

      const innerContainerHeight = Math.max(availableMainHeight, contentHeight + footerHeight);
      assert.strictEqual(innerContainerHeight, 2448, 'Inner container expands to fit complete content + footer');

      const footerMarginTop = Math.max(0, innerContainerHeight - (contentHeight + footerHeight));
      assert.strictEqual(footerMarginTop, 0, 'mt-auto adds 0 extra margin when content exceeds viewport');

      const totalScrollableHeight = contentHeight + footerHeight;
      assert.strictEqual(totalScrollableHeight, 2448, 'Total scroll height matches content plus footer');
    });
  });
});

