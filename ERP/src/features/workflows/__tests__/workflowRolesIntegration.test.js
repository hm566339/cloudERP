import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import apiClient from '../../../api/common/client.js';
import { getRoles } from '../../../api/sso/role.js';
import workflowDefinitionApi, {
  extractRoles,
  resolveRoleId,
  resolveRoleName,
  saveWorkflowDefinitions,
  isUUID,
} from '../services/workflowService.js';

describe('Workflow & Approvals Role Dropdown Integration Tests', () => {
  let originalGet;
  let originalPost;
  let lastRequest = null;

  beforeEach(() => {
    originalGet = apiClient.get;
    originalPost = apiClient.post;
    lastRequest = null;
  });

  const restoreClient = () => {
    apiClient.get = originalGet;
    apiClient.post = originalPost;
  };

  describe('1. Role Extraction & Normalization from SSO API', () => {
    it('extracts roles from { roles: [...] } format', () => {
      const apiResponse = {
        roles: [
          { id: 'role-1', name: 'Sales Executive', status: true },
          { id: 'role-2', name: 'Sales Manager', status: true },
        ],
        pagination: { page: 0, pageSize: 200, totalCount: 2 },
      };
      const extracted = extractRoles(apiResponse);
      assert.strictEqual(extracted.length, 2);
      assert.strictEqual(extracted[0].id, 'role-1');
      assert.strictEqual(extracted[0].name, 'Sales Executive');
      assert.strictEqual(extracted[1].id, 'role-2');
      assert.strictEqual(extracted[1].name, 'Sales Manager');
    });

    it('extracts roles from { data: { roles: [...] } } ResponseWrapper format', () => {
      const apiResponse = {
        data: {
          roles: [
            { id: 'ea811382-0afc-4908-a209-9bedcc63c445', name: 'Finance Manager', status: true },
          ],
        },
      };
      const extracted = extractRoles(apiResponse);
      assert.strictEqual(extracted.length, 1);
      assert.strictEqual(extracted[0].id, 'ea811382-0afc-4908-a209-9bedcc63c445');
      assert.strictEqual(extracted[0].name, 'Finance Manager');
    });

    it('extracts roles from Spring Page { content: [...] } format', () => {
      const apiResponse = {
        content: [
          { id: 'role-page-1', name: 'Accountant', status: true },
        ],
      };
      const extracted = extractRoles(apiResponse);
      assert.strictEqual(extracted.length, 1);
      assert.strictEqual(extracted[0].name, 'Accountant');
    });

    it('extracts roles from plain array and filters out items without id', () => {
      const apiResponse = [
        { id: 'valid-1', name: 'Admin' },
        { name: 'Invalid without id' },
        null,
      ];
      const extracted = extractRoles(apiResponse);
      assert.strictEqual(extracted.length, 1);
      assert.strictEqual(extracted[0].id, 'valid-1');
    });

    it('handles empty or null response gracefully', () => {
      assert.deepStrictEqual(extractRoles(null), []);
      assert.deepStrictEqual(extractRoles(undefined), []);
      assert.deepStrictEqual(extractRoles({}), []);
    });
  });

  describe('2. Role ID and Name Resolution Helpers', () => {
    const rolesList = [
      { id: 'uuid-role-sales', name: 'Sales Executive' },
      { id: 'uuid-role-manager', name: 'Sales Manager' },
    ];

    it('resolveRoleId returns the role ID when already an ID', () => {
      assert.strictEqual(resolveRoleId('uuid-role-sales', rolesList), 'uuid-role-sales');
    });

    it('resolveRoleId maps a legacy role name to its corresponding UUID', () => {
      assert.strictEqual(resolveRoleId('Sales Executive', rolesList), 'uuid-role-sales');
      assert.strictEqual(resolveRoleId('sales manager', rolesList), 'uuid-role-manager');
    });

    it('resolveRoleId returns empty string for falsy input', () => {
      assert.strictEqual(resolveRoleId('', rolesList), '');
      assert.strictEqual(resolveRoleId(null, rolesList), '');
      assert.strictEqual(resolveRoleId(undefined, rolesList), '');
    });

    it('resolveRoleName resolves human-readable role name from UUID', () => {
      assert.strictEqual(resolveRoleName('uuid-role-sales', rolesList), 'Sales Executive');
      assert.strictEqual(resolveRoleName('uuid-role-manager', rolesList), 'Sales Manager');
    });

    it('resolveRoleName returns the name directly if already given a name', () => {
      assert.strictEqual(resolveRoleName('Sales Manager', rolesList), 'Sales Manager');
    });
  });

  describe('3. Roles API Request Parameters Contract', () => {
    it('getRoles calls /api/sso/role with page=0, pageSize=200 and companyId', async () => {
      try {
        apiClient.get = async (url) => {
          lastRequest = { url };
          return {
            data: {
              success: true,
              data: {
                roles: [
                  { id: 'ea811382-0afc-4908-a209-9bedcc63c445', name: 'System Admin', status: true },
                ],
                pagination: { page: 0, pageSize: 200 },
              },
            },
          };
        };

        const companyId = 'ea811382-0afc-4908-a209-9bedcc63c445';
        const res = await getRoles({ companyId, page: 0, pageSize: 200 });
        const roles = extractRoles(res);

        assert.ok(lastRequest.url.startsWith('/api/sso/role?'));
        assert.ok(lastRequest.url.includes('companyId=ea811382-0afc-4908-a209-9bedcc63c445'));
        assert.ok(lastRequest.url.includes('page=0'));
        assert.ok(lastRequest.url.includes('pageSize=200'));
        assert.strictEqual(roles.length, 1);
        assert.strictEqual(roles[0].name, 'System Admin');
      } finally {
        restoreClient();
      }
    });
  });

  describe('4. Approver RoleId & RoleName Mapping in Workflow Definition Service', () => {
    it('detects UUID correctly with isUUID', () => {
      assert.strictEqual(isUUID('ea811382-0afc-4908-a209-9bedcc63c445'), true);
      assert.strictEqual(isUUID('Sales Manager'), false);
      assert.strictEqual(isUUID(''), false);
      assert.strictEqual(isUUID(null), false);
    });

    it('sends roleId as UUID and roleName as string in approvers stage', async () => {
      try {
        apiClient.post = async (url, body) => {
          lastRequest = { url, body };
          return {
            data: {
              success: true,
              data: {
                id: 'wf-saved-1',
                ...body.data,
              },
            },
          };
        };

        const companyId = 'ea811382-0afc-4908-a209-9bedcc63c445';
        const roleUUID = '7d2a5f11-3c4a-4e2b-a19e-9e7f5b3a1c2d';

        const result = await workflowDefinitionApi.create({
          companyId,
          name: 'Purchase Flow',
          module: 'Purchase',
          approverRole: roleUUID,
          approverRoleId: roleUUID,
          approverRoleName: 'Purchase Manager',
          steps: [
            {
              id: 'step-1',
              title: 'Purchase Review',
              role: roleUUID,
              roleId: roleUUID,
              roleName: 'Purchase Manager',
              active: true,
            },
          ],
        });

        assert.strictEqual(lastRequest.url, '/api/v1/workflow/definitions');
        const stage = lastRequest.body.data.stages[0];
        assert.ok(stage.approvers.length > 0);
        assert.strictEqual(stage.approvers[0].approverType, 'ROLE');
        assert.strictEqual(stage.approvers[0].roleId, roleUUID);
        assert.strictEqual(stage.approvers[0].roleName, 'Purchase Manager');
        assert.strictEqual(result.id, 'wf-saved-1');
      } finally {
        restoreClient();
      }
    });

    it('saveWorkflowDefinitions handles new drafts in create mode and preserves roleId', async () => {
      try {
        apiClient.post = async (url, body) => {
          lastRequest = { url, body };
          return {
            data: {
              success: true,
              data: {
                id: 'wf-persisted-from-draft',
                ...body.data,
              },
            },
          };
        };

        const companyId = 'ea811382-0afc-4908-a209-9bedcc63c445';
        const draft = {
          id: `workflow-${Date.now()}`,
          name: 'New Draft Flow',
          module: 'Sales',
          approverRole: 'ea811382-0afc-4908-a209-9bedcc63c445',
          approverRoleId: 'ea811382-0afc-4908-a209-9bedcc63c445',
          approverRoleName: 'Sales Director',
          steps: [
            {
              id: 'step-draft-1',
              title: 'Draft Step',
              role: 'ea811382-0afc-4908-a209-9bedcc63c445',
              roleId: 'ea811382-0afc-4908-a209-9bedcc63c445',
              roleName: 'Sales Director',
              active: true,
            },
          ],
        };

        const res = await saveWorkflowDefinitions(companyId, draft);
        assert.strictEqual(res.definitions.length, 1);
        assert.strictEqual(res.definitions[0].id, 'wf-persisted-from-draft');
        assert.strictEqual(lastRequest.body.data.stages[0].approvers[0].roleId, 'ea811382-0afc-4908-a209-9bedcc63c445');
        assert.strictEqual(lastRequest.body.data.stages[0].approvers[0].roleName, 'Sales Director');
      } finally {
        restoreClient();
      }
    });
  });
});
