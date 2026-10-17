import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const settingsLayoutPath = path.resolve(__dirname, '../shared/SettingsLayout.jsx');
const orgSettingsPath = path.resolve(__dirname, '../../../features/settings/pages/OrganizationSettingsPage.jsx');
const salesSettingsPath = path.resolve(__dirname, '../../../features/finance/pages/SalesSettings.jsx');
const subPlansSettingsPath = path.resolve(__dirname, '../../../pages/settings/SubscriptionPlansSettings.jsx');
const profilePagePath = path.resolve(__dirname, '../../../features/profile/pages/ProfilePage.jsx');
const accountDashboardPath = path.resolve(__dirname, '../../../features/account/pages/AccountDashboard.jsx');

describe('Settings Pages Content Width & Layout Alignment with Account Dashboard', () => {
  const settingsLayoutCode = fs.readFileSync(settingsLayoutPath, 'utf-8');
  const orgSettingsCode = fs.readFileSync(orgSettingsPath, 'utf-8');
  const salesSettingsCode = fs.readFileSync(salesSettingsPath, 'utf-8');
  const subPlansCode = fs.readFileSync(subPlansSettingsPath, 'utf-8');
  const profilePageCode = fs.readFileSync(profilePagePath, 'utf-8');
  const accountDashboardCode = fs.readFileSync(accountDashboardPath, 'utf-8');

  describe('1. Account Dashboard Content Width Baseline', () => {
    it('Account Dashboard content spans available width without narrow max-w constraints', () => {
      // Account Dashboard does not restrict page container with max-w-4xl, max-w-5xl, max-w-6xl, or max-w-7xl
      assert.doesNotMatch(
        accountDashboardCode,
        /className="[^"]*max-w-[4567]xl[^"]*"/,
        'Account Dashboard should not constrain root container with narrow max-w classes'
      );
      assert.ok(
        accountDashboardCode.includes('flex-1 overflow-auto space-y-4 p-4'),
        'Account Dashboard uses full flex-1 width with standard padding'
      );
    });
  });

  describe('2. Shared SettingsLayout Expansion', () => {
    it('SettingsLayout uses w-full and responsive padding matching dashboard conventions', () => {
      assert.ok(
        settingsLayoutCode.includes('w-full'),
        'SettingsLayout root container must have w-full'
      );
      assert.ok(
        settingsLayoutCode.includes('p-4 sm:p-6'),
        'SettingsLayout must use responsive p-4 sm:p-6 padding matching ERP dashboard conventions'
      );
    });

    it('SettingsLayout eliminates restrictive max-w-6xl and mx-auto centering', () => {
      assert.doesNotMatch(
        settingsLayoutCode,
        /max-w-6xl/,
        'SettingsLayout must not contain max-w-6xl'
      );
      assert.doesNotMatch(
        settingsLayoutCode,
        /mx-auto/,
        'SettingsLayout root container must not be centered with mx-auto'
      );
    });
  });

  describe('3. Organization Settings Page Expansion', () => {
    it('OrganizationSettingsPage uses w-full and eliminates max-w-6xl mx-auto', () => {
      assert.ok(
        orgSettingsCode.includes('w-full'),
        'OrganizationSettingsPage must use w-full'
      );
      assert.doesNotMatch(
        orgSettingsCode,
        /max-w-6xl/,
        'OrganizationSettingsPage must not contain max-w-6xl'
      );
      assert.doesNotMatch(
        orgSettingsCode,
        /<div className="[^"]*mx-auto[^"]*"/,
        'OrganizationSettingsPage root container must not contain mx-auto'
      );
      assert.ok(
        orgSettingsCode.includes('p-4 sm:p-6'),
        'OrganizationSettingsPage must use standard p-4 sm:p-6 padding'
      );
    });
  });

  describe('4. Sales Module Settings Page Alignment', () => {
    it('SalesSettings SettingsNavbar container uses w-full without max-w-6xl mx-auto', () => {
      assert.doesNotMatch(
        salesSettingsCode,
        /max-w-6xl mx-auto/,
        'SalesSettings navbar container must not constrain width with max-w-6xl mx-auto'
      );
      assert.ok(
        salesSettingsCode.includes('p-4 sm:p-6 pb-2 shrink-0 w-full'),
        'SalesSettings navbar container must span w-full with standard padding'
      );
    });
  });

  describe('5. Subscription Plans Settings Page Expansion', () => {
    it('SubscriptionPlansSettings container uses w-full without max-w-7xl mx-auto', () => {
      assert.doesNotMatch(
        subPlansCode,
        /<div className="[^"]*max-w-7xl mx-auto[^"]*"/,
        'SubscriptionPlansSettings container must not restrict width with max-w-7xl mx-auto'
      );
      assert.ok(
        subPlansCode.includes('w-full p-4 sm:p-6 space-y-6 animate-fade-in'),
        'SubscriptionPlansSettings must use w-full with p-4 sm:p-6 padding'
      );
    });
  });

  describe('6. Profile / My Account Page Expansion', () => {
    it('ProfilePage uses w-full without max-w-[1600px] mx-auto', () => {
      assert.doesNotMatch(
        profilePageCode,
        /max-w-\[1600px\]/,
        'ProfilePage must not restrict width with max-w-[1600px]'
      );
      assert.ok(
        profilePageCode.includes('w-full p-4 sm:p-6'),
        'ProfilePage must use w-full with p-4 sm:p-6 padding'
      );
    });
  });
});
