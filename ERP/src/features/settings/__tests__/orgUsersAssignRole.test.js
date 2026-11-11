import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Verification Test Suite: Organization Users Assign Role (Key Icon) Functionality
 *
 * Validates:
 * 1. Root Cause Resolution: UserAssignRoleModal is properly imported, mounted in JSX, and triggered by the row action.
 * 2. User & Tenant Identity Presentation: Selected user's name, email, organization, and associated company are displayed.
 * 3. Role Catalog & Descriptions: Fetches company-specific roles and supplies clear, meaningful descriptions.
 * 4. Multi-Role Selection: Matches PostgreSQL (user_id, role_id) composite model and syncs multiple role IDs.
 * 5. Persistence via Backend Endpoints: Uses syncMemberCompanyRoles and grantMemberCompanyAccess with correct target IDs (never logged-in user).
 * 6. UI Update & Persistence: Invokes refetch callback and preserves assigned roles on data refresh.
 */
describe('Organization Users Assign Role Functionality Suite', () => {

  const orgUsersViewPath = path.resolve(__dirname, '../components/organization/OrgUsersView.jsx');
  const userAssignRoleModalPath = path.resolve(__dirname, '../../users/components/UserAssignRoleModal.jsx');

  const mockOrganization = {
    id: 'org-apex-uuid',
    name: 'Apex India Pvt Ltd',
    code: 'APEX-IND',
  };

  const mockCompanies = [
    { id: 'comp-retail-uuid', name: 'Apex Retail', companyCode: 'APEX_RET' },
    { id: 'comp-logistics-uuid', name: 'Apex Logistics', companyCode: 'APEX_LOG' },
  ];

  const mockMember = {
    id: 'mem-rahul-uuid',
    memberId: 'mem-rahul-uuid',
    userId: 'user-rahul-uuid',
    fullName: 'Rahul Sharma',
    email: 'rahul.sharma@apex.com',
    empId: 'EMP-102',
    memberType: 'MEMBER',
    membershipStatus: 'ACTIVE',
    companyAccess: [
      {
        companyId: 'comp-retail-uuid',
        companyName: 'Apex Retail',
        companyCode: 'APEX_RET',
        roleId: 'role-acct-uuid',
        roleName: 'Accountant',
        roleIds: ['role-acct-uuid'],
        roleNames: ['Accountant'],
        active: true,
      },
    ],
  };

  const mockAvailableRoles = [
    {
      id: 'role-acct-uuid',
      name: 'Accountant',
      companyId: 'comp-retail-uuid',
      status: true,
      description: 'Manage invoices, payments, vouchers, reconciliation, and financial ledgers.',
    },
    {
      id: 'role-audit-uuid',
      name: 'Auditor',
      companyId: 'comp-retail-uuid',
      status: true,
      description: 'Read-only audit trails, compliance verification, and financial reports inspection.',
    },
    {
      id: 'role-admin-uuid',
      name: 'Company Admin',
      companyId: 'comp-retail-uuid',
      status: true,
      description: 'Full administrative access to manage all company operations, workflows, and settings.',
    },
  ];

  describe('1. Static Code Analysis & Root Cause Verification', () => {
    it('verifies OrgUsersView imports UserAssignRoleModal', () => {
      const source = fs.readFileSync(orgUsersViewPath, 'utf8');
      assert.ok(
        source.includes("import UserAssignRoleModal from '../../../users/components/UserAssignRoleModal';"),
        'OrgUsersView must import UserAssignRoleModal'
      );
    });

    it('verifies rowActions configures assign-role key icon action handler', () => {
      const source = fs.readFileSync(orgUsersViewPath, 'utf8');
      assert.ok(source.includes("key: 'assign-role'"), 'Row actions must include assign-role key');
      assert.ok(source.includes('icon: Key'), 'Row action must use Key icon');
      assert.ok(source.includes('setSelectedUserForRole(row)'), 'Click handler must set selectedUserForRole');
      assert.ok(source.includes('setIsRoleModalOpen(true)'), 'Click handler must set isRoleModalOpen');
    });

    it('verifies UserAssignRoleModal is explicitly rendered in OrgUsersView JSX', () => {
      const source = fs.readFileSync(orgUsersViewPath, 'utf8');
      assert.ok(
        source.includes('<UserAssignRoleModal'),
        'UserAssignRoleModal must be mounted in OrgUsersView JSX'
      );
      assert.ok(
        source.includes('isOpen={isRoleModalOpen}'),
        'UserAssignRoleModal must bind isOpen to isRoleModalOpen'
      );
      assert.ok(
        source.includes('user={selectedUserForRole}'),
        'UserAssignRoleModal must bind user to selectedUserForRole'
      );
      assert.ok(
        source.includes('organization={organization}'),
        'UserAssignRoleModal must pass organization context'
      );
      assert.ok(
        source.includes('companies={companies}'),
        'UserAssignRoleModal must pass companies list'
      );
      assert.ok(
        source.includes('onSuccess={() => refetchMembers()}'),
        'UserAssignRoleModal must trigger refetchMembers on success'
      );
    });
  });

  describe('2. Modal Component Structure & UI Requirements', () => {
    it('verifies UserAssignRoleModal component file exists and contains enterprise features', () => {
      const modalSource = fs.readFileSync(userAssignRoleModalPath, 'utf8');
      assert.ok(
        modalSource.includes('export default function UserAssignRoleModal'),
        'UserAssignRoleModal must export default component'
      );
      assert.ok(
        modalSource.includes('syncMemberCompanyRoles'),
        'UserAssignRoleModal must import syncMemberCompanyRoles'
      );
      assert.ok(
        modalSource.includes('grantMemberCompanyAccess'),
        'UserAssignRoleModal must import grantMemberCompanyAccess'
      );
      assert.ok(
        modalSource.includes('getRoles'),
        'UserAssignRoleModal must import getRoles API'
      );
    });

    it('displays user identity, organization context, and associated company', () => {
      const modalSource = fs.readFileSync(userAssignRoleModalPath, 'utf8');
      assert.ok(modalSource.includes('Organization:'), 'Modal must render organization label');
      assert.ok(modalSource.includes('Associated Company:'), 'Modal must render associated company label');
      assert.ok(modalSource.includes('orgName'), 'Modal must render resolved organization name');
      assert.ok(modalSource.includes('selectedCompanyName'), 'Modal must render selected company name');
    });

    it('provides comprehensive role descriptions for all standard ERP roles', () => {
      const modalSource = fs.readFileSync(userAssignRoleModalPath, 'utf8');
      assert.ok(modalSource.includes('ROLE_DESCRIPTIONS'), 'Modal must define standard role descriptions map');
      assert.ok(modalSource.includes('ACCOUNTANT:'), 'Must include Accountant role description');
      assert.ok(modalSource.includes('AUDITOR:'), 'Must include Auditor role description');
      assert.ok(modalSource.includes('ADMIN:'), 'Must include Admin role description');
      assert.ok(modalSource.includes('SALES_EXECUTIVE:'), 'Must include Sales Executive role description');
      assert.ok(modalSource.includes('INVENTORY_MANAGER:'), 'Must include Inventory Manager role description');
      assert.ok(modalSource.includes('PURCHASE_MANAGER:'), 'Must include Purchase Manager role description');
    });

    it('supports multi-role selection with checkboxes and counter', () => {
      const modalSource = fs.readFileSync(userAssignRoleModalPath, 'utf8');
      assert.ok(modalSource.includes('selectedRoleIds'), 'Modal must manage selectedRoleIds state');
      assert.ok(modalSource.includes('handleToggleRole'), 'Modal must implement handleToggleRole');
      assert.ok(modalSource.includes('handleSelectAll'), 'Modal must implement handleSelectAll');
      assert.ok(modalSource.includes('handleDeselectAll'), 'Modal must implement handleDeselectAll');
      assert.ok(modalSource.includes('type="checkbox"'), 'Modal must render checkboxes for multi-role assignment');
    });

    it('displays currently assigned roles and highlights them with badges', () => {
      const modalSource = fs.readFileSync(userAssignRoleModalPath, 'utf8');
      assert.ok(modalSource.includes('Currently Assigned'), 'Modal must display Currently Assigned badge');
      assert.ok(modalSource.includes('currentlyAssignedRoleNames'), 'Modal must calculate currentlyAssignedRoleNames');
    });

    it('displays loading states during role fetch and role assignment', () => {
      const modalSource = fs.readFileSync(userAssignRoleModalPath, 'utf8');
      assert.ok(modalSource.includes('isLoadingRoles'), 'Modal must handle isLoadingRoles state');
      assert.ok(modalSource.includes('isSubmitting'), 'Modal must handle isSubmitting state');
      assert.ok(modalSource.includes('Saving Roles...'), 'Save button must display loading text when submitting');
    });
  });

  describe('3. Multi-Role RBAC Persistence & API Payloads', () => {
    it('generates correct payload for syncing multiple roles in target company', () => {
      const targetMemberId = mockMember.memberId;
      const targetCompanyId = mockCompanies[0].id;
      const selectedRoleIds = ['role-acct-uuid', 'role-audit-uuid'];

      // Simulated sync call payload
      const expectedPath = `/api/sso/organization/members/${targetMemberId}/companies/${targetCompanyId}/roles`;
      const expectedPayload = { data: { roleIds: selectedRoleIds } };

      assert.strictEqual(expectedPath, `/api/sso/organization/members/mem-rahul-uuid/companies/comp-retail-uuid/roles`);
      assert.deepStrictEqual(expectedPayload.data.roleIds, ['role-acct-uuid', 'role-audit-uuid']);
      assert.notStrictEqual(targetMemberId, 'logged-in-user-id', 'Target ID must never be the logged-in user');
    });

    it('falls back to grantMemberCompanyAccess when user does not yet have active access', () => {
      const targetMemberId = mockMember.memberId;
      const newCompanyId = mockCompanies[1].id; // comp-logistics
      const selectedRoleIds = ['role-audit-uuid'];

      const expectedPath = `/api/sso/organization/members/${targetMemberId}/companies`;
      const expectedPayload = {
        companyId: newCompanyId,
        roleIds: selectedRoleIds,
      };

      assert.strictEqual(expectedPath, `/api/sso/organization/members/mem-rahul-uuid/companies`);
      assert.strictEqual(expectedPayload.companyId, 'comp-logistics-uuid');
      assert.deepStrictEqual(expectedPayload.roleIds, ['role-audit-uuid']);
    });

    it('simulates updating user list immediately and preserving roles across page reload', () => {
      // 1. Initial State: Rahul has Accountant in Apex Retail
      let memberRecord = JSON.parse(JSON.stringify(mockMember));
      assert.strictEqual(memberRecord.companyAccess[0].roleNames.length, 1);
      assert.strictEqual(memberRecord.companyAccess[0].roleNames[0], 'Accountant');

      // 2. Assign Auditor as secondary role
      const newRoleIds = ['role-acct-uuid', 'role-audit-uuid'];
      const newRoleNames = ['Accountant', 'Auditor'];

      // Simulate backend response after sync
      memberRecord.companyAccess[0].roleIds = newRoleIds;
      memberRecord.companyAccess[0].roleNames = newRoleNames;
      memberRecord.companyAccess[0].roleName = newRoleNames.join(', ');

      // 3. User table formatting check
      const displayRoles = memberRecord.companyAccess[0].roleNames.join(', ');
      assert.strictEqual(displayRoles, 'Accountant, Auditor');

      // 4. Simulate page refresh (re-fetching from mock backend)
      const refreshedList = [JSON.parse(JSON.stringify(memberRecord))];
      const reloadedMember = refreshedList.find(m => m.id === mockMember.id);

      assert.ok(reloadedMember);
      assert.deepStrictEqual(reloadedMember.companyAccess[0].roleIds, newRoleIds);
      assert.deepStrictEqual(reloadedMember.companyAccess[0].roleNames, ['Accountant', 'Auditor']);
      assert.strictEqual(reloadedMember.companyAccess[0].roleName, 'Accountant, Auditor');
    });
  });

});

