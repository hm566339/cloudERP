import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import apiClient from '../../../api/common/client.js';
import { workflowExecutionApi } from '../services/workflowService.js';

describe('Dynamic Workflow Execution & UI API Verification', () => {
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

  it('getUiDetails calls /api/v1/workflow/transactions/{id}/ui with companyId', async () => {
    try {
      apiClient.get = async (url, config) => {
        lastRequest = { url, config };
        return {
          data: {
            success: true,
            data: {
              transaction: { id: 'txn-123', status: 'PENDING', documentNumber: 'EXP-999' },
              permittedActions: {
                canApprove: true,
                canReject: true,
                isApprover: true,
                availableActions: ['APPROVE', 'REJECT'],
              },
              formSchema: {
                documentType: 'EXPENSE',
                groups: [{ id: 'overview', title: 'General', fields: [] }],
              },
            },
          },
        };
      };

      const result = await workflowExecutionApi.getUiDetails('txn-123', 'comp-abc');
      assert.strictEqual(lastRequest.url, '/api/v1/workflow/transactions/txn-123/ui');
      assert.strictEqual(lastRequest.config.params.companyId, 'comp-abc');
      assert.strictEqual(result.transaction.documentNumber, 'EXP-999');
      assert.strictEqual(result.permittedActions.canApprove, true);
    } finally {
      restoreClient();
    }
  });

  it('getUiDetailsByDocument calls /api/v1/workflow/transactions/document/ui', async () => {
    try {
      apiClient.get = async (url, config) => {
        lastRequest = { url, config };
        return {
          data: {
            success: true,
            data: {
              transaction: { id: 'txn-doc-1', status: 'PENDING', documentType: 'SALES' },
            },
          },
        };
      };

      const result = await workflowExecutionApi.getUiDetailsByDocument('SALES', 'quote-555', 'comp-xyz');
      assert.strictEqual(lastRequest.url, '/api/v1/workflow/transactions/document/ui');
      assert.strictEqual(lastRequest.config.params.documentType, 'SALES');
      assert.strictEqual(lastRequest.config.params.documentId, 'quote-555');
      assert.strictEqual(lastRequest.config.params.companyId, 'comp-xyz');
      assert.strictEqual(result.transaction.documentType, 'SALES');
    } finally {
      restoreClient();
    }
  });

  it('approveTask calls /api/v1/workflow/tasks/{id}/approve with payload wrapper', async () => {
    try {
      apiClient.post = async (url, body) => {
        lastRequest = { url, body };
        return {
          data: {
            success: true,
            message: 'Task approved',
            data: { id: 'task-1', taskStatus: 'APPROVED' },
          },
        };
      };

      const result = await workflowExecutionApi.approveTask('task-1', 'Approved by Senior Manager');
      assert.strictEqual(lastRequest.url, '/api/v1/workflow/tasks/task-1/approve');
      assert.strictEqual(lastRequest.body.data.taskId, 'task-1');
      assert.strictEqual(lastRequest.body.data.comments, 'Approved by Senior Manager');
      assert.strictEqual(result.taskStatus, 'APPROVED');
    } finally {
      restoreClient();
    }
  });

  it('rejectTask calls /api/v1/workflow/tasks/{id}/reject with reason', async () => {
    try {
      apiClient.post = async (url, body) => {
        lastRequest = { url, body };
        return {
          data: {
            success: true,
            message: 'Task rejected',
            data: { id: 'task-1', taskStatus: 'REJECTED' },
          },
        };
      };

      const result = await workflowExecutionApi.rejectTask('task-1', 'Exceeds departmental budget');
      assert.strictEqual(lastRequest.url, '/api/v1/workflow/tasks/task-1/reject');
      assert.strictEqual(lastRequest.body.data.taskId, 'task-1');
      assert.strictEqual(lastRequest.body.data.reason, 'Exceeds departmental budget');
      assert.strictEqual(result.taskStatus, 'REJECTED');
    } finally {
      restoreClient();
    }
  });

  it('returnTask calls /api/v1/workflow/tasks/{id}/return', async () => {
    try {
      apiClient.post = async (url, body) => {
        lastRequest = { url, body };
        return {
          data: {
            success: true,
            message: 'Task returned',
            data: { id: 'task-1', taskStatus: 'RETURNED' },
          },
        };
      };

      const result = await workflowExecutionApi.returnTask('task-1', 'Please attach invoice receipts');
      assert.strictEqual(lastRequest.url, '/api/v1/workflow/tasks/task-1/return');
      assert.strictEqual(lastRequest.body.data.reason, 'Please attach invoice receipts');
      assert.strictEqual(result.taskStatus, 'RETURNED');
    } finally {
      restoreClient();
    }
  });

  it('delegateTask calls /api/v1/workflow/tasks/{id}/delegate with target user', async () => {
    try {
      apiClient.post = async (url, body) => {
        lastRequest = { url, body };
        return {
          data: {
            success: true,
            message: 'Task delegated',
            data: { id: 'task-1', taskStatus: 'PENDING', delegatedTo: 'user-delegate-9' },
          },
        };
      };

      const result = await workflowExecutionApi.delegateTask('task-1', 'user-delegate-9', 'Out of office');
      assert.strictEqual(lastRequest.url, '/api/v1/workflow/tasks/task-1/delegate');
      assert.strictEqual(lastRequest.body.data.targetUserId, 'user-delegate-9');
      assert.strictEqual(lastRequest.body.data.reason, 'Out of office');
    } finally {
      restoreClient();
    }
  });

  it('addComment posts to /api/v1/workflow/transactions/{id}/comments', async () => {
    try {
      apiClient.post = async (url, body) => {
        lastRequest = { url, body };
        return {
          data: {
            success: true,
            data: { id: 'comm-1', commentText: 'Checking ledger balance' },
          },
        };
      };

      const result = await workflowExecutionApi.addComment('txn-99', 'Checking ledger balance', true);
      assert.strictEqual(lastRequest.url, '/api/v1/workflow/transactions/txn-99/comments');
      assert.strictEqual(lastRequest.body.data.commentText, 'Checking ledger balance');
      assert.strictEqual(lastRequest.body.data.isInternal, true);
      assert.strictEqual(result.commentText, 'Checking ledger balance');
    } finally {
      restoreClient();
    }
  });
});
