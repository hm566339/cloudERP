import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import apiClient from '../../../api/common/client.js';
import { detectModule, getRefreshEndpoint } from '../../../api/common/moduleRegistry.js';
import workflowDefinitionApi, {
  loadWorkflowDefinitions,
  saveWorkflowDefinitions,
  deleteWorkflowDefinition,
  WorkflowApiNotImplementedError,
  WORKFLOW_DATA_SOURCES,
} from '../services/workflowService.js';

describe('Workflow Definitions API Routing & Service Verification', () => {
  let originalGet;
  let originalPost;
  let originalPatch;
  let lastRequest = null;

  beforeEach(() => {
    originalGet = apiClient.get;
    originalPost = apiClient.post;
    originalPatch = apiClient.patch;
    lastRequest = null;
  });

  const restoreClient = () => {
    apiClient.get = originalGet;
    apiClient.post = originalPost;
    apiClient.patch = originalPatch;
  };

  describe('1. API Route Alignment with workflow-service', () => {
    it('list sends GET to /api/v1/workflow/definitions with query params', async () => {
      try {
        apiClient.get = async (url, config) => {
          lastRequest = { url, config };
          return {
            data: {
              success: true,
              data: {
                content: [
                  {
                    id: 'wf-1',
                    workflowCode: 'SALES_WF',
                    workflowName: 'Sales Approval',
                    moduleName: 'SALES',
                    documentType: 'SALES',
                    isActive: true,
                    stages: [
                      {
                        id: 'stage-1',
                        stageCode: 'STAGE_1',
                        stageName: 'Manager Approval',
                        approvers: [{ roleName: 'Sales Manager' }],
                      },
                    ],
                  },
                ],
              },
            },
          };
        };

        const result = await workflowDefinitionApi.list('comp-123', 'SALES');

        assert.strictEqual(lastRequest.url, '/api/v1/workflow/definitions');
        assert.notStrictEqual(lastRequest.url, '/api/account/workflow/definitions');
        assert.strictEqual(lastRequest.config.params.companyId, 'comp-123');
        assert.strictEqual(lastRequest.config.params.documentType, 'SALES');
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].id, 'wf-1');
        assert.strictEqual(result[0].name, 'Sales Approval');
        assert.strictEqual(result[0].approverRole, 'Sales Manager');
      } finally {
        restoreClient();
      }
    });

    it('get sends GET to /api/v1/workflow/definitions/:id', async () => {
      try {
        apiClient.get = async (url, config) => {
          lastRequest = { url, config };
          return {
            data: {
              success: true,
              data: {
                id: 'wf-10',
                workflowName: 'Purchase WF',
                moduleName: 'PURCHASE',
                documentType: 'PURCHASE',
              },
            },
          };
        };

        const result = await workflowDefinitionApi.get('wf-10', 'comp-123');

        assert.strictEqual(lastRequest.url, '/api/v1/workflow/definitions/wf-10');
        assert.strictEqual(lastRequest.config.params.companyId, 'comp-123');
        assert.strictEqual(result.id, 'wf-10');
        assert.strictEqual(result.name, 'Purchase WF');
      } finally {
        restoreClient();
      }
    });

    it('getActive sends GET to /api/v1/workflow/definitions/active with query params', async () => {
      try {
        apiClient.get = async (url, config) => {
          lastRequest = { url, config };
          return {
            data: {
              success: true,
              data: {
                id: 'wf-active',
                workflowName: 'Active Invoice WF',
                documentType: 'INVOICE',
              },
            },
          };
        };

        const result = await workflowDefinitionApi.getActive('INVOICE', 'comp-123', 'INVOICE');

        assert.strictEqual(lastRequest.url, '/api/v1/workflow/definitions/active');
        assert.strictEqual(lastRequest.config.params.documentType, 'INVOICE');
        assert.strictEqual(lastRequest.config.params.companyId, 'comp-123');
        assert.strictEqual(lastRequest.config.params.moduleName, 'INVOICE');
        assert.strictEqual(result.id, 'wf-active');
      } finally {
        restoreClient();
      }
    });

    it('create sends POST to /api/v1/workflow/definitions wrapped in { data: payload } with stages', async () => {
      try {
        apiClient.post = async (url, body) => {
          lastRequest = { url, body };
          return {
            data: {
              success: true,
              data: {
                id: 'wf-new-1',
                ...body.data,
              },
            },
          };
        };

        const result = await workflowDefinitionApi.create({
          companyId: 'comp-123',
          name: 'Expense Flow',
          module: 'Expenses',
          approverRole: 'Finance Manager',
          steps: [
            { id: 'step-1', title: 'Step 1 Approval', role: 'Finance Manager', active: true },
          ],
        });

        assert.strictEqual(lastRequest.url, '/api/v1/workflow/definitions');
        assert.ok(lastRequest.body.data, 'Request body must be wrapped in { data: payload }');
        assert.strictEqual(lastRequest.body.data.workflowName, 'Expense Flow');
        assert.strictEqual(lastRequest.body.data.companyId, 'comp-123');
        assert.strictEqual(lastRequest.body.data.documentType, 'EXPENSE');
        assert.ok(Array.isArray(lastRequest.body.data.stages), 'stages array must be populated');
        assert.strictEqual(lastRequest.body.data.stages.length, 1);
        assert.strictEqual(lastRequest.body.data.stages[0].stageCode, 'STAGE_1');
        assert.strictEqual(result.id, 'wf-new-1');
      } finally {
        restoreClient();
      }
    });

    it('setActive sends PATCH to /api/v1/workflow/definitions/:id/activate', async () => {
      try {
        apiClient.patch = async (url, body, config) => {
          lastRequest = { url, body, config };
          return { data: { success: true, message: 'Workflow definition activated' } };
        };

        await workflowDefinitionApi.setActive('wf-42', 'comp-123');

        assert.strictEqual(lastRequest.url, '/api/v1/workflow/definitions/wf-42/activate');
        assert.strictEqual(lastRequest.config.params.companyId, 'comp-123');
      } finally {
        restoreClient();
      }
    });

    it('deactivate sends PATCH to /api/v1/workflow/definitions/:id/deactivate', async () => {
      try {
        apiClient.patch = async (url, body, config) => {
          lastRequest = { url, body, config };
          return { data: { success: true, message: 'Workflow definition deactivated' } };
        };

        await workflowDefinitionApi.deactivate('wf-42', 'comp-123');

        assert.strictEqual(lastRequest.url, '/api/v1/workflow/definitions/wf-42/deactivate');
        assert.strictEqual(lastRequest.config.params.companyId, 'comp-123');
      } finally {
        restoreClient();
      }
    });
  });

  describe('2. Error Handling & Silent Fallback Removal', () => {
    it('loadWorkflowDefinitions throws directly on server failure without falling back to localStorage drafts', async () => {
      try {
        apiClient.get = async () => {
          const err = new Error('Gateway 502 Bad Gateway');
          err.status = 502;
          throw err;
        };

        await assert.rejects(
          async () => {
            await loadWorkflowDefinitions('comp-123', 'SALES');
          },
          (err) => {
            assert.match(err.message, /Gateway 502 Bad Gateway/);
            return true;
          }
        );
      } finally {
        restoreClient();
      }
    });

    it('deleteWorkflowDefinition throws WorkflowApiNotImplementedError instead of silently persisting to draft', async () => {
      await assert.rejects(
        async () => {
          await deleteWorkflowDefinition('comp-123', [{ id: 'wf-1' }], 'wf-1');
        },
        WorkflowApiNotImplementedError
      );
    });
  });

  describe('3. Module Registry & Gateway Routing Detection', () => {
    it('detects workflow module from /api/v1/workflow/definitions', () => {
      const detected = detectModule('/api/v1/workflow/definitions');
      assert.strictEqual(detected, 'workflow');
    });

    it('routes workflow token refresh to /api/sso/token/refresh', () => {
      const endpoint = getRefreshEndpoint('workflow');
      assert.strictEqual(endpoint, '/api/sso/token/refresh');
    });
  });
});
