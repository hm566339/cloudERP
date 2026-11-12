import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAuthContext } from '../utils/moduleNormalization.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Default Company Assignment & Multi-Company Switching Suite', () => {
  it('buildAuthContext preserves membership.defaultCompanyId, companies, and active company across switches', () => {
    const meCompanyA = {
      user: { id: 'u-1', username: 'mohit', email: 'harshomohit13@gmail.com' },
      organization: { id: 'org-1', code: 'apex-group', name: 'Apex Group' },
      activeOrganizationId: 'org-1',
      activeCompanyId: 'apex-id',
      currentCompany: {
        id: 'apex-id',
        code: 'APEXIN',
        name: 'Apex India Pvt Ltd',
        active: true,
        membership: { role: { name: 'Accountant' }, roles: [{ name: 'Accountant', status: true }] },
        modules: [{ id: 'm-acc', name: 'ACCOUNT', active: true }],
      },
      companies: [
        { id: 'apex-id', code: 'APEXIN', name: 'Apex India Pvt Ltd', active: true },
        { id: 'technova-id', code: 'TECHNOVA', name: 'TechNova Solutions', active: true },
      ],
      membership: {
        memberId: 'mem-1',
        memberType: 'MEMBER',
        defaultCompanyId: 'apex-id',
        defaultCompanyName: 'Apex India Pvt Ltd',
      },
      modules: [{ id: 'm-acc', name: 'ACCOUNT', active: true }],
    };

    const ctxA = buildAuthContext(meCompanyA);
    assert.equal(ctxA.activeCompanyId, 'apex-id');
    assert.equal(ctxA.user.companyId, 'apex-id');
    assert.equal(ctxA.membership.defaultCompanyId, 'apex-id');
    assert.equal(ctxA.companies.length, 2);

    const meCompanyB = {
      ...meCompanyA,
      activeCompanyId: 'technova-id',
      companies: [
        { id: 'apex-id', code: 'APEXIN', name: 'Apex India Pvt Ltd', active: true },
        {
          id: 'technova-id',
          code: 'TECHNOVA',
          name: 'TechNova Solutions',
          active: true,
          membership: {
            role: { name: 'Inventory Manager' },
            roles: [{ name: 'Inventory Manager', status: true }, { name: 'Sales Executive', status: true }],
          },
          modules: [{ id: 'm-inv', name: 'INVENTORY', active: true }],
        },
      ],
      currentCompany: {
        id: 'technova-id',
        code: 'TECHNOVA',
        name: 'TechNova Solutions',
        active: true,
        membership: {
          role: { name: 'Inventory Manager' },
          roles: [{ name: 'Inventory Manager', status: true }, { name: 'Sales Executive', status: true }],
        },
        modules: [{ id: 'm-inv', name: 'INVENTORY', active: true }],
      },
      modules: [{ id: 'm-inv', name: 'INVENTORY', active: true }],
    };

    const ctxB = buildAuthContext(meCompanyB);
    assert.equal(ctxB.activeCompanyId, 'technova-id');
    assert.equal(ctxB.user.companyId, 'technova-id');
    assert.equal(ctxB.user.companyName, 'TechNova Solutions');
    assert.equal(ctxB.currentCompany.id, 'technova-id');
    assert.equal(ctxB.user.roles.length, 2);
  });

  it('organization.api.js exports default company CRUD endpoints and RTK hooks', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../api/sso/organization.api.js'), 'utf8');
    assert.ok(source.includes('getMemberDefaultCompany'));
    assert.ok(source.includes('setMemberDefaultCompany'));
    assert.ok(source.includes('clearMemberDefaultCompany'));
    assert.ok(source.includes('useGetMemberDefaultCompanyQuery'));
    assert.ok(source.includes('useSetMemberDefaultCompanyMutation'));
    assert.ok(source.includes('useClearMemberDefaultCompanyMutation'));
    assert.ok(source.includes('/default-company'));
  });

  it('authApi.js defines and exports useSwitchCompanyMutation for /api/sso/auth/switch-company', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../features/auth/services/authApi.js'), 'utf8');
    assert.ok(source.includes('/api/sso/auth/switch-company'));
    assert.ok(source.includes('useSwitchCompanyMutation'));
  });

  it('OrgUsersView.jsx includes Default Company column, row action, and authorized-only selector modal', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../features/settings/components/organization/OrgUsersView.jsx'),
      'utf8'
    );
    assert.ok(source.includes("'defaultCompany'"));
    assert.ok(source.includes("label: 'Default Company'"));
    assert.ok(source.includes('Assign Default Login Company'));
    assert.ok(source.includes('setMemberDefaultCompany'));
    assert.ok(source.includes('clearMemberDefaultCompany'));
  });

  it('SwitchTenantPopup.jsx restricts regular members to authorized companies, rotates tokens, and resets baseApi cache', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../features/account/components/SwitchTenantPopup.jsx'),
      'utf8'
    );
    assert.ok(source.includes('if (isSuperAdmin || isOwner)'));
    assert.ok(source.includes('useSwitchCompanyMutation'));
    assert.ok(source.includes('switchCompanyApi({ companyId: targetCompany.id })'));
    assert.ok(source.includes('dispatch(baseApi.util.resetApiState())'));
    assert.ok(source.includes('norm.active === false'));
  });

  it('CompanyLayout.jsx and AccountantLayout.jsx provide header company display & switcher dropdown', () => {
    const companyLayout = fs.readFileSync(path.resolve(__dirname, '../layouts/CompanyLayout.jsx'), 'utf8');
    const accountantLayout = fs.readFileSync(path.resolve(__dirname, '../layouts/AccountantLayout.jsx'), 'utf8');
    assert.ok(companyLayout.includes('headerCompanySwitchOpen'));
    assert.ok(companyLayout.includes('placement="top-left"'));
    assert.ok(accountantLayout.includes('headerCompanySwitchOpen'));
    assert.ok(accountantLayout.includes('placement="top-left"'));
  });
});
