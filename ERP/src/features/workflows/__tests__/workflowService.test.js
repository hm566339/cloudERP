import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import apiClient from '../../../api/common/client.js';
import { detectModule, getRefreshEndpoint } from '../../../api/common/moduleRegistry.js';
import workflowDefinitionApi, {
  loadWorkflowDefinitions,
  saveWorkflowDefinitions,
  deleteWorkflowDefinition,
  validateWorkflowDefinition,
  getWorkflowAdditionalSettings,
  saveWorkflowAdditionalSettings,
  APPROVER_TYPES,
  WORKFLOW_ACTION_TYPES,
  WorkflowApiNotImplementedError,
  WORKFLOW_DATA_SOURCES,
} from '../services/workflowService.js';

describe('Workflow Definitions API Routing & Service Verification', () => {
  let originalGet;
  let originalPost;
  let originalPatch;
  let originalDelete;
  let lastRequest = null;

  beforeEach(() => {
    originalGet = apiClient.get;
    originalPost = apiClient.post;
    originalPatch = apiClient.patch;
    originalDelete = apiClient.delete;
    lastRequest = null;
  });

  const restoreClient = () => {
    apiClient.get = originalGet;
    apiClient.post = originalPost;
    apiClient.patch = originalPatch;
    apiClient.delete = originalDelete;
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

    it('remove sends DELETE to /api/v1/workflow/definitions/:id with companyId param', async () => {
      try {
        apiClient.delete = async (url, config) => {
          lastRequest = { url, config };
          return { data: { success: true, message: 'Workflow definition deleted' } };
        };

        await workflowDefinitionApi.remove('3fa85f64-5717-4562-b3fc-2c963f66afa6', 'comp-123');

        assert.strictEqual(lastRequest.url, '/api/v1/workflow/definitions/3fa85f64-5717-4562-b3fc-2c963f66afa6');
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

    it('deleteWorkflowDefinition deletes persistent definition via backend API and removes from list', async () => {
      try {
        const targetId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
        let deletedUrl = null;
        let deletedParams = null;
        apiClient.delete = async (url, config) => {
          deletedUrl = url;
          deletedParams = config?.params;
          return { data: { success: true, message: 'Workflow definition deleted' } };
        };

        const existing = [
          { id: targetId, name: 'To Delete' },
          { id: '4fa85f64-5717-4562-b3fc-2c963f66afa7', name: 'Keep Me' },
        ];

        const result = await deleteWorkflowDefinition('comp-123', existing, targetId);

        assert.strictEqual(deletedUrl, `/api/v1/workflow/definitions/${targetId}`);
        assert.strictEqual(deletedParams.companyId, 'comp-123');
        assert.strictEqual(result.definitions.length, 1);
        assert.strictEqual(result.definitions[0].id, '4fa85f64-5717-4562-b3fc-2c963f66afa7');
        assert.strictEqual(result.source, WORKFLOW_DATA_SOURCES.API);
      } finally {
        restoreClient();
      }
    });

    it('deleteWorkflowDefinition removes local draft definition without calling server', async () => {
      let serverCalled = false;
      apiClient.delete = async () => {
        serverCalled = true;
      };

      const existing = [
        { id: 'workflow-123456789', name: 'Draft WF' },
        { id: 'workflow-987654321', name: 'Other Draft' },
      ];

      const result = await deleteWorkflowDefinition('comp-123', existing, 'workflow-123456789');

      assert.strictEqual(serverCalled, false);
      assert.strictEqual(result.definitions.length, 1);
      assert.strictEqual(result.definitions[0].id, 'workflow-987654321');
      assert.strictEqual(result.source, WORKFLOW_DATA_SOURCES.DRAFT);
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

  describe('4. Workflow Validation Rules (validateWorkflowDefinition)', () => {
    const validDraft = {
      companyId: 'ea811382-0afc-4908-a209-9bedcc63c445',
      workflowCode: 'SALES_APPROVAL_01',
      workflowName: 'Sales Invoice Approval',
      documentType: 'SALES',
      moduleName: 'SALES',
      stages: [
        {
          stageCode: 'STAGE_1',
          stageName: 'Manager Review',
          approvers: [{ approverType: 'ROLE', roleName: 'Sales Manager' }],
          sla: { durationHours: 24 },
        },
      ],
      transitions: [
        {
          fromStageCode: 'STAGE_1',
          toStageCode: 'STAGE_2',
          actionType: 'APPROVE',
        },
      ],
    };

    it('passes for a fully valid workflow draft', () => {
      const res = validateWorkflowDefinition(validDraft, { companyId: validDraft.companyId });
      assert.strictEqual(res.isValid, true);
      assert.deepStrictEqual(res.errors, {});
    });

    it('rejects missing companyId', () => {
      const res = validateWorkflowDefinition({ ...validDraft, companyId: '' }, { companyId: '' });
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.companyId);
    });

    it('rejects empty workflowCode', () => {
      const res = validateWorkflowDefinition({ ...validDraft, workflowCode: '   ' }, { companyId: validDraft.companyId });
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.workflowCode);
    });

    it('rejects empty workflowName', () => {
      const res = validateWorkflowDefinition({ ...validDraft, workflowName: '' }, { companyId: validDraft.companyId });
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.name || res.errors.workflowName);
    });

    it('rejects missing documentType', () => {
      const res = validateWorkflowDefinition({ ...validDraft, documentType: '', moduleName: '', module: '' }, { companyId: validDraft.companyId });
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.documentType);
    });

    it('rejects empty stages and steps', () => {
      const res = validateWorkflowDefinition({ ...validDraft, stages: [], steps: [] }, { companyId: validDraft.companyId });
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.steps || res.errors.stages);
    });

    it('rejects stage with missing stageCode or stageName', () => {
      const res = validateWorkflowDefinition({
        ...validDraft,
        stages: [{ stageCode: '', stageName: '' }],
      }, { companyId: validDraft.companyId });
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors['stage_0_code']);
      assert.ok(res.errors['stage_0_name']);
    });

    it('rejects invalid approverType not in APPROVER_TYPES', () => {
      const res = validateWorkflowDefinition({
        ...validDraft,
        stages: [{
          stageCode: 'STAGE_1',
          stageName: 'Review',
          approvers: [{ approverType: 'INVALID_TYPE' }],
        }],
      }, { companyId: validDraft.companyId });
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors['stage_0_approver_0_type']);
    });

    it('rejects invalid transition actionType not in WORKFLOW_ACTION_TYPES', () => {
      const res = validateWorkflowDefinition({
        ...validDraft,
        transitions: [{ actionType: 'UNKNOWN_ACTION' }],
      }, { companyId: validDraft.companyId });
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors['transition_0_actionType']);
    });

    it('rejects invalid SLA durationHours (zero or negative)', () => {
      const resZero = validateWorkflowDefinition({
        ...validDraft,
        stages: [{
          stageCode: 'STAGE_1',
          stageName: 'Review',
          sla: { durationHours: 0 },
        }],
      }, { companyId: validDraft.companyId });
      assert.strictEqual(resZero.isValid, false);
      assert.ok(resZero.errors['stage_0_sla']);

      const resNegative = validateWorkflowDefinition({
        ...validDraft,
        stages: [{
          stageCode: 'STAGE_1',
          stageName: 'Review',
          sla: { durationHours: -5 },
        }],
      }, { companyId: validDraft.companyId });
      assert.strictEqual(resNegative.isValid, false);
      assert.ok(resNegative.errors['stage_0_sla']);
    });
  });

  describe('5. Create Workflow POST Payload Contract & Field Whitelisting', () => {
    it('sets isActive explicitly to false when draft is inactive', async () => {
      try {
        apiClient.post = async (url, body) => {
          lastRequest = { url, body };
          return { data: { success: true, data: { id: 'wf-inactive', ...body.data } } };
        };

        const result = await workflowDefinitionApi.create({
          companyId: 'ea811382-0afc-4908-a209-9bedcc63c445',
          workflowCode: 'INACTIVE_WF',
          name: 'Inactive Approval',
          module: 'Sales',
          active: false,
          isActive: false,
          steps: [{ id: 'step-1', stageCode: 'STAGE_1', stageName: 'Review', active: true }],
        });

        assert.strictEqual(lastRequest.body.data.isActive, false, 'isActive must be explicitly false in POST payload');
        assert.strictEqual(result.active, false);
      } finally {
        restoreClient();
      }
    });

    it('sets isActive explicitly to true when draft is active', async () => {
      try {
        apiClient.post = async (url, body) => {
          lastRequest = { url, body };
          return { data: { success: true, data: { id: 'wf-active', ...body.data } } };
        };

        const result = await workflowDefinitionApi.create({
          companyId: 'ea811382-0afc-4908-a209-9bedcc63c445',
          workflowCode: 'ACTIVE_WF',
          name: 'Active Approval',
          module: 'Sales',
          active: true,
          isActive: true,
          steps: [{ id: 'step-1', stageCode: 'STAGE_1', stageName: 'Review', active: true }],
        });

        assert.strictEqual(lastRequest.body.data.isActive, true, 'isActive must be explicitly true when enabled');
        assert.strictEqual(result.active, true);
      } finally {
        restoreClient();
      }
    });

    it('does not send frontend-only properties in POST payload to backend', async () => {
      try {
        apiClient.post = async (url, body) => {
          lastRequest = { url, body };
          return { data: { success: true, data: { id: 'wf-dto-clean', ...body.data } } };
        };

        await workflowDefinitionApi.create({
          companyId: 'ea811382-0afc-4908-a209-9bedcc63c445',
          workflowCode: 'CLEAN_DTO',
          name: 'Clean DTO',
          module: 'Sales',
          notes: 'Internal secret notes',
          threshold: '50000',
          customerScope: 'specific',
          customerAcceptance: true,
          autoCreateOrder: true,
          emailNotifications: true,
          status: 'draft',
          steps: [{ id: 'step-1', stageCode: 'STAGE_1', stageName: 'Review', active: true }],
        });

        const sentPayload = lastRequest.body.data;
        assert.strictEqual(sentPayload.notes, undefined, 'notes must not be sent in backend payload');
        assert.strictEqual(sentPayload.threshold, undefined, 'threshold must not be sent in backend payload');
        assert.strictEqual(sentPayload.customerScope, undefined, 'customerScope must not be sent in backend payload');
        assert.strictEqual(sentPayload.customerAcceptance, undefined, 'customerAcceptance must not be sent in backend payload');
        assert.strictEqual(sentPayload.autoCreateOrder, undefined, 'autoCreateOrder must not be sent in backend payload');
        assert.strictEqual(sentPayload.emailNotifications, undefined, 'emailNotifications must not be sent in backend payload');
        assert.strictEqual(sentPayload.steps, undefined, 'steps must not be sent in backend payload (stages is used)');
        assert.strictEqual(sentPayload.status, undefined, 'frontend status string must not be sent');

        // Confirm Java DTO keys exist
        assert.strictEqual(sentPayload.companyId, 'ea811382-0afc-4908-a209-9bedcc63c445');
        assert.strictEqual(sentPayload.workflowCode, 'CLEAN_DTO');
        assert.strictEqual(sentPayload.workflowName, 'Clean DTO');
        assert.strictEqual(sentPayload.moduleName, 'SALES');
        assert.strictEqual(sentPayload.documentType, 'SALES');
        assert.ok(Array.isArray(sentPayload.stages));
        assert.ok(Array.isArray(sentPayload.transitions));
      } finally {
        restoreClient();
      }
    });

    it('saves and retrieves additional settings via localStorage helper without backend definition mutation', () => {
      const companyId = 'ea811382-0afc-4908-a209-9bedcc63c445';
      const defId = 'wf-extra-settings-test';

      saveWorkflowAdditionalSettings(companyId, defId, {
        customerScope: 'specific',
        threshold: '75000',
        customerAcceptance: true,
        autoCreateOrder: true,
        emailNotifications: false,
        notes: 'Admin review only',
      });

      const retrieved = getWorkflowAdditionalSettings(companyId, defId);
      assert.strictEqual(retrieved.customerScope, 'specific');
      assert.strictEqual(retrieved.threshold, '75000');
      assert.strictEqual(retrieved.customerAcceptance, true);
      assert.strictEqual(retrieved.autoCreateOrder, true);
      assert.strictEqual(retrieved.emailNotifications, false);
      assert.strictEqual(retrieved.notes, 'Admin review only');
    });

    it('update throws WorkflowApiNotImplementedError confirming PUT/PATCH update limitation', async () => {
      await assert.rejects(
        async () => {
          await workflowDefinitionApi.update('some-id');
        },
        (err) => {
          assert.ok(err instanceof WorkflowApiNotImplementedError);
          assert.match(err.message, /PUT\/PATCH \/api\/v1\/workflow\/definitions/);
          return true;
        }
      );
    });
  });
});
