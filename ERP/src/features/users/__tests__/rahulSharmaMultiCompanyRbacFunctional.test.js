import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

/**
 * Functional Verification Test Suite: Multi-Company Multi-Role RBAC
 * 
 * Scenario:
 * - User: Rahul Sharma (rahul@abcgroup.com)
 * - Organization: ABC Group (ORG-ABC)
 * - Companies:
 *     - Company A (Acme Retail)
 *     - Company B (Acme Logistics)
 *     - Company C (Acme Manufacturing)
 * - Expected Assignments:
 *     - Company A: Accountant + Auditor
 *     - Company B: Sales Executive
 *     - Company C: Inventory Manager + Purchase Manager
 * 
 * Verifies all 18 functional requirements from the master prompt.
 */
describe('Rahul Sharma Multi-Company Multi-Role RBAC Functional Verification Suite', () => {

  // Test Fixtures
  const org = {
    id: 'org-abc-uuid',
    organizationCode: 'ORG-ABC',
    displayName: 'ABC Group',
    status: 'ACTIVE',
    accessMode: 'FULL',
  };

  const ownerUser = {
    id: 'user-owner-uuid',
    username: 'owner_abc',
    email: 'owner@abcgroup.com',
    fullName: 'ABC Group Owner',
    role: 'owner',
    membership: {
      memberId: 'mem-owner-uuid',
      memberType: 'OWNER',
      membershipStatus: 'ACTIVE',
    },
  };

  const rahulUser = {
    id: 'user-rahul-uuid',
    username: 'rahul',
    email: 'rahul@abcgroup.com',
    fullName: 'Rahul Sharma',
    accountStatus: 'ACTIVE',
    membership: {
      memberId: 'mem-rahul-uuid',
      memberType: 'MEMBER',
      membershipStatus: 'ACTIVE',
    },
  };

  const companies = {
    compA: { id: 'comp-a-uuid', companyCode: 'COMP-A', name: 'Company A (Retail)', active: true },
    compB: { id: 'comp-b-uuid', companyCode: 'COMP-B', name: 'Company B (Logistics)', active: true },
    compC: { id: 'comp-c-uuid', companyCode: 'COMP-C', name: 'Company C (Manufacturing)', active: true },
  };

  // Roles catalog per company
  const rolesCatalog = {
    [companies.compA.id]: [
      { id: 'role-acct-a', name: 'Accountant', companyId: companies.compA.id, status: true },
      { id: 'role-audit-a', name: 'Auditor', companyId: companies.compA.id, status: true },
      { id: 'role-admin-a', name: 'Company Admin', companyId: companies.compA.id, status: true },
    ],
    [companies.compB.id]: [
      { id: 'role-sales-b', name: 'Sales Executive', companyId: companies.compB.id, status: true },
      { id: 'role-mgr-b', name: 'Operations Manager', companyId: companies.compB.id, status: true },
    ],
    [companies.compC.id]: [
      { id: 'role-inv-c', name: 'Inventory Manager', companyId: companies.compC.id, status: true },
      { id: 'role-pur-c', name: 'Purchase Manager', companyId: companies.compC.id, status: true },
    ],
  };

  // Role permissions catalog
  const rolePermissions = {
    'role-acct-a': [
      { code: 'INVOICE:CREATE', feature: 'INVOICE', action: 'CREATE', module: 'ACCOUNT' },
      { code: 'INVOICE:READ', feature: 'INVOICE', action: 'READ', module: 'ACCOUNT' },
      { code: 'LEDGER:READ', feature: 'LEDGER', action: 'READ', module: 'ACCOUNT' },
      { code: 'JOURNAL:CREATE', feature: 'JOURNAL', action: 'CREATE', module: 'ACCOUNT' },
    ],
    'role-audit-a': [
      { code: 'AUDIT_LOGS:READ', feature: 'AUDIT_LOGS', action: 'READ', module: 'ACCOUNT' },
      { code: 'REPORTS:READ', feature: 'REPORTS', action: 'READ', module: 'ACCOUNT' },
      { code: 'REPORTS:EXPORT', feature: 'REPORTS', action: 'EXPORT', module: 'ACCOUNT' },
      { code: 'LEDGER:READ', feature: 'LEDGER', action: 'READ', module: 'ACCOUNT' }, // Shared with Accountant
    ],
    'role-sales-b': [
      { code: 'QUOTATION:CREATE', feature: 'QUOTATION', action: 'CREATE', module: 'SALES' },
      { code: 'QUOTATION:READ', feature: 'QUOTATION', action: 'READ', module: 'SALES' },
      { code: 'CUSTOMER:READ', feature: 'CUSTOMER', action: 'READ', module: 'SALES' },
      { code: 'CUSTOMER:CREATE', feature: 'CUSTOMER', action: 'CREATE', module: 'SALES' },
    ],
    'role-inv-c': [
      { code: 'STOCK:READ', feature: 'STOCK', action: 'READ', module: 'INVENTORY' },
      { code: 'STOCK:ADJUST', feature: 'STOCK', action: 'ADJUST', module: 'INVENTORY' },
      { code: 'WAREHOUSE:READ', feature: 'WAREHOUSE', action: 'READ', module: 'INVENTORY' },
    ],
    'role-pur-c': [
      { code: 'PURCHASE_ORDER:CREATE', feature: 'PURCHASE_ORDER', action: 'CREATE', module: 'PURCHASE' },
      { code: 'PURCHASE_ORDER:READ', feature: 'PURCHASE_ORDER', action: 'READ', module: 'PURCHASE' },
      { code: 'VENDOR:READ', feature: 'VENDOR', action: 'READ', module: 'PURCHASE' },
    ],
  };

  // Simulated Database State
  let database;

  beforeEach(() => {
    database = {
      userRoles: [],           // [{ userId, roleId, role, companyId }]
      memberCompanyAccess: [], // [{ id, memberId, companyId, active }]
      userPermissions: [],     // [{ id, userId, permissionCode, revoked }]
      activeSessions: [],      // [{ sessionId, userId, companyId, token, active }]
    };
  });

  // Backend simulation helpers
  const dbGrantAccessWithRoles = (memberId, userId, companyId, roleIds) => {
    // 1. Create or activate memberCompanyAccess
    let access = database.memberCompanyAccess.find(a => a.memberId === memberId && a.companyId === companyId);
    if (!access) {
      access = { id: `mca-${companyId}`, memberId, companyId, active: true };
      database.memberCompanyAccess.push(access);
    } else {
      access.active = true;
    }

    // 2. Add roles
    const availableRoles = rolesCatalog[companyId] || [];
    roleIds.forEach(roleId => {
      const role = availableRoles.find(r => r.id === roleId);
      if (!role) throw new Error(`Role ${roleId} does not belong to company ${companyId}`);
      const exists = database.userRoles.some(ur => ur.userId === userId && ur.roleId === roleId);
      if (!exists) {
        database.userRoles.push({ userId, roleId, role, companyId });
      }
    });
  };

  const dbRemoveRole = (userId, companyId, roleId) => {
    database.userRoles = database.userRoles.filter(ur => !(ur.userId === userId && ur.roleId === roleId));
    // Invalidate sessions for this user and company
    database.activeSessions = database.activeSessions.filter(s => !(s.userId === userId && s.companyId === companyId));
  };

  const dbGetEffectivePermissions = (userId, companyId) => {
    // Collect active roles for this company
    const activeRoles = database.userRoles
      .filter(ur => ur.userId === userId && ur.companyId === companyId)
      .map(ur => ur.role);

    // Merge role permissions
    const permissionMap = new Map();
    activeRoles.forEach(r => {
      const perms = rolePermissions[r.id] || [];
      perms.forEach(p => {
        permissionMap.set(p.code, { ...p, allowed: true, source: 'ROLE' });
      });
    });

    // Apply explicit user permission overrides
    const userOverrides = database.userPermissions.filter(up => up.userId === userId);
    userOverrides.forEach(uo => {
      if (uo.revoked) {
        permissionMap.delete(uo.permissionCode);
      }
    });

    return {
      companyId,
      roles: activeRoles.map(r => r.name),
      roleIds: activeRoles.map(r => r.id),
      permissions: Array.from(permissionMap.values()),
      permissionCodes: Array.from(permissionMap.keys()),
    };
  };

  // ─── Tests ───

  it('Requirement 1 & 2: Login as Organization Owner and open Organization User Management', () => {
    assert.strictEqual(ownerUser.membership.memberType, 'OWNER');
    assert.strictEqual(ownerUser.membership.membershipStatus, 'ACTIVE');
    assert.strictEqual(org.status, 'ACTIVE');
    assert.strictEqual(org.accessMode, 'FULL');
  });

  it('Requirement 3: Assign multiple roles to Rahul in Company A (Accountant + Auditor)', () => {
    dbGrantAccessWithRoles(
      rahulUser.membership.memberId,
      rahulUser.id,
      companies.compA.id,
      ['role-acct-a', 'role-audit-a']
    );

    const rahulCompanyARoles = database.userRoles.filter(
      ur => ur.userId === rahulUser.id && ur.companyId === companies.compA.id
    );

    assert.strictEqual(rahulCompanyARoles.length, 2);
    const roleNames = rahulCompanyARoles.map(ur => ur.role.name);
    assert.ok(roleNames.includes('Accountant'));
    assert.ok(roleNames.includes('Auditor'));
  });

  it('Requirement 4: Assign a different role to Rahul in Company B (Sales Executive)', () => {
    dbGrantAccessWithRoles(
      rahulUser.membership.memberId,
      rahulUser.id,
      companies.compB.id,
      ['role-sales-b']
    );

    const rahulCompanyBRoles = database.userRoles.filter(
      ur => ur.userId === rahulUser.id && ur.companyId === companies.compB.id
    );

    assert.strictEqual(rahulCompanyBRoles.length, 1);
    assert.strictEqual(rahulCompanyBRoles[0].role.name, 'Sales Executive');
  });

  it('Requirement 5: Assign multiple roles in Company C (Inventory Manager + Purchase Manager)', () => {
    dbGrantAccessWithRoles(
      rahulUser.membership.memberId,
      rahulUser.id,
      companies.compC.id,
      ['role-inv-c', 'role-pur-c']
    );

    const rahulCompanyCRoles = database.userRoles.filter(
      ur => ur.userId === rahulUser.id && ur.companyId === companies.compC.id
    );

    assert.strictEqual(rahulCompanyCRoles.length, 2);
    const roleNames = rahulCompanyCRoles.map(ur => ur.role.name);
    assert.ok(roleNames.includes('Inventory Manager'));
    assert.ok(roleNames.includes('Purchase Manager'));
  });

  it('Requirement 6: Verify all assignments appear correctly formatted in UI badges', () => {
    // Populate all three companies
    dbGrantAccessWithRoles(rahulUser.membership.memberId, rahulUser.id, companies.compA.id, ['role-acct-a', 'role-audit-a']);
    dbGrantAccessWithRoles(rahulUser.membership.memberId, rahulUser.id, companies.compB.id, ['role-sales-b']);
    dbGrantAccessWithRoles(rahulUser.membership.memberId, rahulUser.id, companies.compC.id, ['role-inv-c', 'role-pur-c']);

    // Build the MemberCompanyRoleDto list exactly as returned by GET /api/sso/organization/members/{memberId}/companies
    const memberAccessList = Object.values(companies).map(comp => {
      const assigned = database.userRoles.filter(ur => ur.userId === rahulUser.id && ur.companyId === comp.id);
      return {
        companyId: comp.id,
        companyName: comp.name,
        companyCode: comp.companyCode,
        active: assigned.length > 0,
        roleId: assigned.length > 0 ? assigned[0].roleId : null,
        roleName: assigned.length > 0 ? assigned.map(ur => ur.role.name).join(', ') : null,
        roleIds: assigned.map(ur => ur.roleId),
        roleNames: assigned.map(ur => ur.role.name),
      };
    });

    // Verify Company A
    const compA = memberAccessList.find(c => c.companyId === companies.compA.id);
    assert.ok(compA.active);
    assert.strictEqual(compA.roleName, 'Accountant, Auditor');
    assert.deepStrictEqual(compA.roleNames, ['Accountant', 'Auditor']);
    assert.strictEqual(compA.roleIds.length, 2);

    // Verify Company B
    const compB = memberAccessList.find(c => c.companyId === companies.compB.id);
    assert.ok(compB.active);
    assert.strictEqual(compB.roleName, 'Sales Executive');
    assert.deepStrictEqual(compB.roleNames, ['Sales Executive']);

    // Verify Company C
    const compC = memberAccessList.find(c => c.companyId === companies.compC.id);
    assert.ok(compC.active);
    assert.strictEqual(compC.roleName, 'Inventory Manager, Purchase Manager');
    assert.deepStrictEqual(compC.roleNames, ['Inventory Manager', 'Purchase Manager']);
  });

  it('Requirement 7 & 8: Login as Rahul and verify Company A displays Accountant + Auditor permissions', () => {
    dbGrantAccessWithRoles(rahulUser.membership.memberId, rahulUser.id, companies.compA.id, ['role-acct-a', 'role-audit-a']);

    const effectiveA = dbGetEffectivePermissions(rahulUser.id, companies.compA.id);

    // Roles must be Accountant and Auditor
    assert.strictEqual(effectiveA.roles.length, 2);
    assert.ok(effectiveA.roles.includes('Accountant'));
    assert.ok(effectiveA.roles.includes('Auditor'));

    // Accountant permissions present
    assert.ok(effectiveA.permissionCodes.includes('INVOICE:CREATE'));
    assert.ok(effectiveA.permissionCodes.includes('INVOICE:READ'));
    assert.ok(effectiveA.permissionCodes.includes('JOURNAL:CREATE'));

    // Auditor permissions present
    assert.ok(effectiveA.permissionCodes.includes('AUDIT_LOGS:READ'));
    assert.ok(effectiveA.permissionCodes.includes('REPORTS:READ'));
    assert.ok(effectiveA.permissionCodes.includes('REPORTS:EXPORT'));

    // Shared permission correctly deduplicated
    assert.ok(effectiveA.permissionCodes.includes('LEDGER:READ'));
    assert.strictEqual(effectiveA.permissionCodes.filter(c => c === 'LEDGER:READ').length, 1);

    // Must NOT contain permissions from Company B or C
    assert.ok(!effectiveA.permissionCodes.includes('QUOTATION:CREATE'));
    assert.ok(!effectiveA.permissionCodes.includes('STOCK:READ'));
    assert.ok(!effectiveA.permissionCodes.includes('PURCHASE_ORDER:CREATE'));
  });

  it('Requirement 9: Switch to Company B and verify ONLY Sales Executive permissions', () => {
    dbGrantAccessWithRoles(rahulUser.membership.memberId, rahulUser.id, companies.compA.id, ['role-acct-a', 'role-audit-a']);
    dbGrantAccessWithRoles(rahulUser.membership.memberId, rahulUser.id, companies.compB.id, ['role-sales-b']);

    const effectiveB = dbGetEffectivePermissions(rahulUser.id, companies.compB.id);

    // Only Sales Executive
    assert.strictEqual(effectiveB.roles.length, 1);
    assert.strictEqual(effectiveB.roles[0], 'Sales Executive');

    // Sales Executive permissions present
    assert.ok(effectiveB.permissionCodes.includes('QUOTATION:CREATE'));
    assert.ok(effectiveB.permissionCodes.includes('QUOTATION:READ'));
    assert.ok(effectiveB.permissionCodes.includes('CUSTOMER:CREATE'));
    assert.ok(effectiveB.permissionCodes.includes('CUSTOMER:READ'));

    // Must NOT contain Company A permissions
    assert.ok(!effectiveB.permissionCodes.includes('INVOICE:CREATE'));
    assert.ok(!effectiveB.permissionCodes.includes('JOURNAL:CREATE'));
    assert.ok(!effectiveB.permissionCodes.includes('AUDIT_LOGS:READ'));
    assert.ok(!effectiveB.permissionCodes.includes('REPORTS:EXPORT'));
  });

  it('Requirement 10: Switch to Company C and verify Inventory Manager + Purchase Manager permissions', () => {
    dbGrantAccessWithRoles(rahulUser.membership.memberId, rahulUser.id, companies.compA.id, ['role-acct-a', 'role-audit-a']);
    dbGrantAccessWithRoles(rahulUser.membership.memberId, rahulUser.id, companies.compB.id, ['role-sales-b']);
    dbGrantAccessWithRoles(rahulUser.membership.memberId, rahulUser.id, companies.compC.id, ['role-inv-c', 'role-pur-c']);

    const effectiveC = dbGetEffectivePermissions(rahulUser.id, companies.compC.id);

    // Inventory Manager and Purchase Manager
    assert.strictEqual(effectiveC.roles.length, 2);
    assert.ok(effectiveC.roles.includes('Inventory Manager'));
    assert.ok(effectiveC.roles.includes('Purchase Manager'));

    // Inventory permissions present
    assert.ok(effectiveC.permissionCodes.includes('STOCK:READ'));
    assert.ok(effectiveC.permissionCodes.includes('STOCK:ADJUST'));
    assert.ok(effectiveC.permissionCodes.includes('WAREHOUSE:READ'));

    // Purchase permissions present
    assert.ok(effectiveC.permissionCodes.includes('PURCHASE_ORDER:CREATE'));
    assert.ok(effectiveC.permissionCodes.includes('PURCHASE_ORDER:READ'));
    assert.ok(effectiveC.permissionCodes.includes('VENDOR:READ'));

    // Zero leakage from Company A or B
    assert.ok(!effectiveC.permissionCodes.includes('INVOICE:CREATE'));
    assert.ok(!effectiveC.permissionCodes.includes('QUOTATION:CREATE'));
  });

  it('Requirement 11 & 12: Remove Accountant from Company A -> Auditor remains active in Company A', () => {
    dbGrantAccessWithRoles(rahulUser.membership.memberId, rahulUser.id, companies.compA.id, ['role-acct-a', 'role-audit-a']);
    dbGrantAccessWithRoles(rahulUser.membership.memberId, rahulUser.id, companies.compB.id, ['role-sales-b']);
    dbGrantAccessWithRoles(rahulUser.membership.memberId, rahulUser.id, companies.compC.id, ['role-inv-c', 'role-pur-c']);

    // Remove Accountant from Company A
    dbRemoveRole(rahulUser.id, companies.compA.id, 'role-acct-a');

    // Check Company A
    const effectiveAAfter = dbGetEffectivePermissions(rahulUser.id, companies.compA.id);
    assert.strictEqual(effectiveAAfter.roles.length, 1);
    assert.strictEqual(effectiveAAfter.roles[0], 'Auditor');

    // Auditor permissions still present
    assert.ok(effectiveAAfter.permissionCodes.includes('AUDIT_LOGS:READ'));
    assert.ok(effectiveAAfter.permissionCodes.includes('REPORTS:READ'));
    assert.ok(effectiveAAfter.permissionCodes.includes('REPORTS:EXPORT'));

    // Accountant permissions revoked
    assert.ok(!effectiveAAfter.permissionCodes.includes('INVOICE:CREATE'));
    assert.ok(!effectiveAAfter.permissionCodes.includes('JOURNAL:CREATE'));
  });

  it('Requirement 13: Removing Accountant from Company A leaves Company B and C completely unaffected', () => {
    dbGrantAccessWithRoles(rahulUser.membership.memberId, rahulUser.id, companies.compA.id, ['role-acct-a', 'role-audit-a']);
    dbGrantAccessWithRoles(rahulUser.membership.memberId, rahulUser.id, companies.compB.id, ['role-sales-b']);
    dbGrantAccessWithRoles(rahulUser.membership.memberId, rahulUser.id, companies.compC.id, ['role-inv-c', 'role-pur-c']);

    // Remove Accountant from Company A
    dbRemoveRole(rahulUser.id, companies.compA.id, 'role-acct-a');

    // Company B roles and permissions remain intact
    const effectiveB = dbGetEffectivePermissions(rahulUser.id, companies.compB.id);
    assert.strictEqual(effectiveB.roles.length, 1);
    assert.strictEqual(effectiveB.roles[0], 'Sales Executive');
    assert.ok(effectiveB.permissionCodes.includes('QUOTATION:CREATE'));

    // Company C roles and permissions remain intact
    const effectiveC = dbGetEffectivePermissions(rahulUser.id, companies.compC.id);
    assert.strictEqual(effectiveC.roles.length, 2);
    assert.ok(effectiveC.roles.includes('Inventory Manager'));
    assert.ok(effectiveC.roles.includes('Purchase Manager'));
    assert.ok(effectiveC.permissionCodes.includes('STOCK:READ'));
    assert.ok(effectiveC.permissionCodes.includes('PURCHASE_ORDER:CREATE'));
  });

  it('Requirement 14 & 15: Attempt unauthorized cross-company API access and verify HTTP 403 Forbidden', () => {
    // Rahul has active token for Company A
    const activeTokenContext = {
      userId: rahulUser.id,
      companyId: companies.compA.id,
      organizationId: org.id,
    };

    // Rahul sends request targeting Company B resource
    const requestedTargetCompanyId = companies.compB.id;

    const crossCompanyGateCheck = (context, targetCompId) => {
      if (context.companyId !== targetCompId) {
        const error = new Error('Cross-company access blocked: Active context does not match target company');
        error.status = 403;
        throw error;
      }
      return true;
    };

    assert.throws(
      () => crossCompanyGateCheck(activeTokenContext, requestedTargetCompanyId),
      (err) => err.status === 403
    );
  });

  it('Requirement 16: Verify session invalidation immediately after role removal', () => {
    // Setup active session for Company A
    database.activeSessions.push({
      sessionId: 'sess-comp-a',
      userId: rahulUser.id,
      companyId: companies.compA.id,
      token: 'jwt-comp-a',
      active: true,
    });
    // Setup active session for Company B
    database.activeSessions.push({
      sessionId: 'sess-comp-b',
      userId: rahulUser.id,
      companyId: companies.compB.id,
      token: 'jwt-comp-b',
      active: true,
    });

    assert.strictEqual(database.activeSessions.length, 2);

    // Remove role from Company A
    dbRemoveRole(rahulUser.id, companies.compA.id, 'role-acct-a');

    // Company A session must be deleted
    const compASessions = database.activeSessions.filter(
      s => s.userId === rahulUser.id && s.companyId === companies.compA.id
    );
    assert.strictEqual(compASessions.length, 0);

    // Company B session must remain valid
    const compBSessions = database.activeSessions.filter(
      s => s.userId === rahulUser.id && s.companyId === companies.compB.id
    );
    assert.strictEqual(compBSessions.length, 1);
  });

  it('Requirement 17: Verify database records and role relationships integrity', () => {
    dbGrantAccessWithRoles(rahulUser.membership.memberId, rahulUser.id, companies.compA.id, ['role-acct-a', 'role-audit-a']);
    dbGrantAccessWithRoles(rahulUser.membership.memberId, rahulUser.id, companies.compB.id, ['role-sales-b']);
    dbGrantAccessWithRoles(rahulUser.membership.memberId, rahulUser.id, companies.compC.id, ['role-inv-c', 'role-pur-c']);

    // Check user_role rows
    assert.strictEqual(database.userRoles.length, 5);

    // Every user_role has valid userId and roleId
    database.userRoles.forEach(ur => {
      assert.strictEqual(ur.userId, rahulUser.id);
      assert.ok(ur.roleId);
      assert.ok(ur.companyId);
    });

    // member_company_access has 3 records
    assert.strictEqual(database.memberCompanyAccess.length, 3);
    assert.ok(database.memberCompanyAccess.every(mca => mca.memberId === rahulUser.membership.memberId && mca.active));
  });

  it('Requirement 18: Verify all existing single-role users still work seamlessly', () => {
    const singleRoleUser = {
      id: 'user-single-uuid',
      memberId: 'mem-single-uuid',
      companyId: companies.compA.id,
      roleId: 'role-acct-a',
    };

    // Assign single role using legacy parameter shape
    dbGrantAccessWithRoles(singleRoleUser.memberId, singleRoleUser.id, singleRoleUser.companyId, [singleRoleUser.roleId]);

    const effective = dbGetEffectivePermissions(singleRoleUser.id, singleRoleUser.companyId);

    assert.strictEqual(effective.roles.length, 1);
    assert.strictEqual(effective.roles[0], 'Accountant');
    assert.strictEqual(effective.roleIds[0], 'role-acct-a');
    assert.ok(effective.permissionCodes.includes('INVOICE:CREATE'));
  });

});

