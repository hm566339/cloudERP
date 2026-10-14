/**
 * Workflow & Approvals data service.
 *
 * This module wires the page to the workflow-service endpoints:
 *
 * - GET /api/v1/workflow/definitions?companyId={...}&moduleName={...}&documentType={...}
 * - GET /api/v1/workflow/definitions/{id}?companyId={...}
 * - GET /api/v1/workflow/definitions/active?documentType={...}&companyId={...}&moduleName={...}
 * - POST /api/v1/workflow/definitions (with { data: payload })
 * - PATCH /api/v1/workflow/definitions/{id}/activate?companyId={...}
 * - PATCH /api/v1/workflow/definitions/{id}/deactivate?companyId={...}
 * - DELETE /api/v1/workflow/definitions/{id}?companyId={...}
 *
 * The missing contract pieces are reported explicitly instead of faked:
 * - PUT/PATCH /api/v1/workflow/definitions/{definitionId}
 * - POST /api/v1/workflow/definitions/{definitionId}/stages
 *
 * Transaction actions documented in apiFormet.md are delegated to the existing
 * account modules without inventing new URLs.
 */

import apiClient from '../../../api/common/client.js';

export const WORKFLOW_STORAGE_KEY = 'erp_workflow_configurations';
export const WORKFLOW_DATA_SOURCES = Object.freeze({
  API: 'api',
  DRAFT: 'draft',
});

export class WorkflowApiNotImplementedError extends Error {
  constructor(operation) {
    super(`Missing backend endpoint: ${operation}. This workflow API is not documented in the backend contract.`);
    this.name = 'WorkflowApiNotImplementedError';
    this.code = 'WORKFLOW_API_NOT_IMPLEMENTED';
    this.operation = operation;
  }
}

const unwrapApiData = (response) => {
  const payload = response?.data ?? response;
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    if (payload.data !== undefined) return payload.data;
    if (payload.success !== undefined && payload.data === undefined && payload.message !== undefined) return payload;
  }
  return payload;
};

const normalizeDocumentType = (moduleName = 'GENERAL') => {
  const value = String(moduleName || 'GENERAL').trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
  if (!value || value === '_') return 'GENERAL';
  if (value === 'EXPENSES') return 'EXPENSE';
  if (value === 'INVOICES') return 'INVOICE';
  if (value === 'REIMBURSEMENTS') return 'REIMBURSEMENT';
  return value;
};

const normalizeModuleName = (moduleName = 'GENERAL') => ({
  SALES: 'Sales',
  PURCHASE: 'Purchase',
  EXPENSE: 'Expenses',
  EXPENSES: 'Expenses',
  INVOICE: 'Invoices',
  INVOICES: 'Invoices',
  REIMBURSEMENT: 'Reimbursements',
  REIMBURSEMENTS: 'Reimbursements',
  INVENTORY: 'Inventory',
})[normalizeDocumentType(moduleName)] || 'Others';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUUID = (val) => typeof val === 'string' && UUID_REGEX.test(val);

export const extractRoles = (res) => {
  if (!res) return [];
  let raw = [];
  if (Array.isArray(res)) {
    raw = res;
  } else if (Array.isArray(res.roles)) {
    raw = res.roles;
  } else if (Array.isArray(res.items)) {
    raw = res.items;
  } else if (Array.isArray(res.content)) {
    raw = res.content;
  } else if (Array.isArray(res.results)) {
    raw = res.results;
  } else if (res.data) {
    if (Array.isArray(res.data)) {
      raw = res.data;
    } else if (Array.isArray(res.data.roles)) {
      raw = res.data.roles;
    } else if (Array.isArray(res.data.items)) {
      raw = res.data.items;
    } else if (Array.isArray(res.data.content)) {
      raw = res.data.content;
    }
  }
  return raw
    .filter((item) => item && (item.id || item.roleId || item.uuid))
    .map((item) => ({
      id: String(item.id || item.roleId || item.uuid),
      name: item.name || item.roleName || item.title || item.displayName || 'Unnamed Role',
      status: item.status !== false && item.active !== false,
    }));
};

export const resolveRoleId = (val, rolesList = []) => {
  if (!val) return '';
  const str = String(val).trim();
  const matchById = rolesList.find((r) => r.id === str);
  if (matchById) return matchById.id;
  const matchByName = rolesList.find((r) => r.name.toLowerCase() === str.toLowerCase());
  if (matchByName) return matchByName.id;
  return str;
};

export const resolveRoleName = (val, rolesList = []) => {
  if (!val) return '';
  const str = String(val).trim();
  const match = rolesList.find(
    (r) => r.id === str || r.name.toLowerCase() === str.toLowerCase()
  );
  return match ? match.name : str;
};

const normalizeWorkflowDefinition = (item = {}) => ({
  id: item.id || item.definitionId || item.workflowId,
  companyId: item.companyId,
  workflowCode: item.workflowCode || item.code || item.id,
  workflowName: item.workflowName || item.name,
  name: item.workflowName || item.name || item.workflowCode || item.code || 'Unnamed workflow',
  moduleName: item.moduleName || item.module || 'GENERAL',
  module: normalizeModuleName(item.moduleName || item.module || item.documentType),
  documentType: item.documentType || normalizeDocumentType(item.moduleName || item.module),
  description: item.description || '',
  version: item.version ?? 1,
  isActive: item.isActive ?? item.active ?? false,
  active: item.isActive ?? item.active ?? false,
  isDefault: item.isDefault ?? false,
  status: item.isActive ?? item.active ? 'active' : 'inactive',
  initiatedBy: item.initiatedBy || '',
  initiatedByRoleId: item.initiatedByRoleId || (isUUID(item.initiatedBy) ? item.initiatedBy : undefined),
  initiatedByRoleName: item.initiatedByRoleName || (!isUUID(item.initiatedBy) ? item.initiatedBy : undefined),
  approvalRequired: item.approvalRequired ?? true,
  approverRole: item.approverRole || (item.stages?.[0]?.approvers?.[0]?.roleId || item.stages?.[0]?.approvers?.[0]?.roleName || ''),
  approverRoleId: item.approverRoleId || item.stages?.[0]?.approvers?.[0]?.roleId || (isUUID(item.approverRole) ? item.approverRole : undefined),
  approverRoleName: item.approverRoleName || item.stages?.[0]?.approvers?.[0]?.roleName || (!isUUID(item.approverRole) ? item.approverRole : undefined),
  threshold: item.threshold || '',
  customerScope: item.customerScope || 'all',
  customerAcceptance: item.customerAcceptance ?? false,
  autoCreateOrder: item.autoCreateOrder ?? false,
  emailNotifications: item.emailNotifications ?? true,
  notes: item.notes || '',
  stages: Array.isArray(item.stages) ? item.stages : [],
  steps: Array.isArray(item.steps) && item.steps.length
    ? item.steps
    : Array.isArray(item.stages)
      ? item.stages.map((stage, idx) => ({
          id: stage.id || `stage-${idx + 1}`,
          title: stage.stageName || `Stage ${idx + 1}`,
          role: stage.approvers?.[0]?.roleId || stage.approvers?.[0]?.roleName || stage.approvers?.[0]?.userName || '',
          roleId: stage.approvers?.[0]?.roleId,
          roleName: stage.approvers?.[0]?.roleName,
          type: 'approval',
          active: stage.isActive !== false,
        }))
      : [],
});

export const workflowDefinitionApi = {
  available: true,
  missingEndpoints: [
    'PUT/PATCH /api/v1/workflow/definitions/{definitionId}',
    'POST /api/v1/workflow/definitions/{definitionId}/stages',
  ],
  list: async (companyId, documentType = 'GENERAL', options = {}) => {
    const params = {};
    if (companyId) params.companyId = companyId;
    if (documentType) params.documentType = documentType;
    if (options.moduleName) params.moduleName = options.moduleName;
    if (options.page !== undefined) params.page = options.page;
    if (options.size !== undefined) params.size = options.size;
    if (options.sort) params.sort = options.sort;

    const response = await apiClient.get('/api/v1/workflow/definitions', { params });
    const payload = unwrapApiData(response);
    const items = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.content)
        ? payload.content
        : Array.isArray(payload?.data)
          ? payload.data
          : [];
    return items.map(normalizeWorkflowDefinition);
  },
  get: async (definitionId, companyId) => {
    if (!definitionId) throw new Error('Workflow definition ID is required.');
    const params = companyId ? { companyId } : undefined;
    const response = await apiClient.get(`/api/v1/workflow/definitions/${definitionId}`, { params });
    const data = unwrapApiData(response);
    return normalizeWorkflowDefinition(data);
  },
  getActive: async (documentType, companyId, moduleName) => {
    if (!documentType) throw new Error('Document type is required.');
    const params = { documentType };
    if (companyId) params.companyId = companyId;
    if (moduleName) params.moduleName = moduleName;
    const response = await apiClient.get('/api/v1/workflow/definitions/active', { params });
    const data = unwrapApiData(response);
    return normalizeWorkflowDefinition(data);
  },
  create: async (definitionPayload) => {
    const source = definitionPayload && typeof definitionPayload === 'object' && 'data' in definitionPayload ? definitionPayload.data : definitionPayload;

    const buildApprover = (roleValue, fallbackRoleId, fallbackRoleName) => {
      const targetRole = roleValue || fallbackRoleId || fallbackRoleName;
      if (!targetRole) return null;
      const isRoleUUID = isUUID(targetRole);
      const roleId = fallbackRoleId || (isRoleUUID ? targetRole : undefined);
      const roleName = fallbackRoleName || (!isRoleUUID ? targetRole : undefined) || 'Approver Role';

      const approver = {
        approverType: 'ROLE',
        approvalOrder: 1,
        isRequired: true,
        canDelegate: true,
      };
      if (roleId) approver.roleId = roleId;
      if (roleName) approver.roleName = roleName;
      return approver;
    };

    const stages = (Array.isArray(source.stages) && source.stages.length > 0)
      ? source.stages
      : (Array.isArray(source.steps) && source.steps.length > 0)
        ? source.steps.filter((s) => s.active !== false).map((step, idx) => {
            const approver = buildApprover(
              step.role || source.approverRole,
              step.roleId || source.approverRoleId,
              step.roleName || source.approverRoleName
            );

            return {
              stageCode: `STAGE_${idx + 1}`,
              stageName: step.title || `Stage ${idx + 1}`,
              stageOrder: idx + 1,
              sequenceNo: idx + 1,
              executionType: 'SEQUENTIAL',
              minimumApprovalsRequired: 1,
              rejectionAction: 'REJECT_DOCUMENT',
              isMandatory: true,
              approvers: approver ? [approver] : [],
            };
          })
        : [{
            stageCode: 'STAGE_1',
            stageName: 'Initial Approval',
            stageOrder: 1,
            sequenceNo: 1,
            executionType: 'SEQUENTIAL',
            minimumApprovalsRequired: 1,
            rejectionAction: 'REJECT_DOCUMENT',
            isMandatory: true,
            approvers: buildApprover(source.approverRole, source.approverRoleId, source.approverRoleName)
              ? [buildApprover(source.approverRole, source.approverRoleId, source.approverRoleName)]
              : [],
          }];

    const payload = {
      companyId: source.companyId,
      workflowCode: source.workflowCode || source.code || `${normalizeDocumentType(source.moduleName || source.module)}-${Date.now()}`,
      workflowName: source.workflowName || source.name,
      moduleName: source.moduleName || source.module || 'GENERAL',
      documentType: source.documentType || normalizeDocumentType(source.moduleName || source.module),
      description: source.description || '',
      version: source.version ?? 1,
      isActive: source.isActive ?? source.active ?? true,
      isDefault: Boolean(source.isDefault ?? false),
      stages,
      transitions: Array.isArray(source.transitions) ? source.transitions : [],
    };

    if (!payload.workflowName) {
      throw new Error('Workflow name is required to create a workflow definition.');
    }

    const response = await apiClient.post('/api/v1/workflow/definitions', { data: payload });
    const data = unwrapApiData(response);
    return normalizeWorkflowDefinition(data);
  },
  update: async () => { throw new WorkflowApiNotImplementedError('PUT/PATCH /api/v1/workflow/definitions/{definitionId}'); },
  remove: async (definitionId, companyId) => {
    if (!definitionId) throw new Error('Workflow definition ID is required.');
    const params = companyId ? { companyId } : undefined;
    const response = await apiClient.delete(`/api/v1/workflow/definitions/${definitionId}`, { params });
    return unwrapApiData(response);
  },
  addStage: async () => {
    throw new WorkflowApiNotImplementedError('POST /api/v1/workflow/definitions/{definitionId}/stages');
  },
  setActive: async (definitionId, companyId) => {
    if (!definitionId) throw new Error('Workflow definition ID is required.');
    const params = companyId ? { companyId } : undefined;
    const response = await apiClient.patch(`/api/v1/workflow/definitions/${definitionId}/activate`, null, { params });
    return unwrapApiData(response);
  },
  deactivate: async (definitionId, companyId) => {
    if (!definitionId) throw new Error('Workflow definition ID is required.');
    const params = companyId ? { companyId } : undefined;
    const response = await apiClient.patch(`/api/v1/workflow/definitions/${definitionId}/deactivate`, null, { params });
    return unwrapApiData(response);
  },
};

const clone = (value) => JSON.parse(JSON.stringify(value));
const draftKey = (companyId) => `${WORKFLOW_STORAGE_KEY}_${companyId || 'default'}`;

export const readWorkflowDraft = (companyId, seed = []) => {
  try {
    const saved = JSON.parse(localStorage.getItem(draftKey(companyId)));
    return Array.isArray(saved) && saved.length ? saved : clone(seed);
  } catch {
    return clone(seed);
  }
};

export const writeWorkflowDraft = (companyId, definitions) => {
  localStorage.setItem(draftKey(companyId), JSON.stringify(definitions));
};

export async function loadWorkflowDefinitions(companyId, documentType = 'GENERAL') {
  // Always query backend workflow-service directly.
  // Never silently fall back to localStorage drafts as server-persisted definitions.
  const definitions = await workflowDefinitionApi.list(companyId, documentType);
  return { definitions: definitions || [], source: WORKFLOW_DATA_SOURCES.API };
}

export async function saveWorkflowDefinitions(companyId, definitions, options = {}) {
  const isDraftItem = (item) => !item?.id || String(item.id).startsWith('workflow-');
  const mode = options.mode || (isDraftItem(definitions) ? 'create' : 'update');

  if (Array.isArray(definitions)) {
    if (mode === 'update') {
      throw new WorkflowApiNotImplementedError('PUT/PATCH /api/v1/workflow/definitions/{definitionId}');
    }

    const created = [];
    for (const item of definitions) {
      if (!item || !item.name) continue;
      created.push(await workflowDefinitionApi.create({ ...item, companyId }));
    }
    return { definitions: created, source: WORKFLOW_DATA_SOURCES.API };
  }

  if (!definitions || !definitions.name) {
    return { definitions: [], source: WORKFLOW_DATA_SOURCES.API };
  }

  if (mode === 'update' && !isDraftItem(definitions)) {
    if (definitions.id) {
      if (definitions.active || definitions.isActive) {
        await workflowDefinitionApi.setActive(definitions.id, companyId);
      } else {
        await workflowDefinitionApi.deactivate(definitions.id, companyId);
      }
      return { definitions: [definitions], source: WORKFLOW_DATA_SOURCES.API };
    }
    throw new WorkflowApiNotImplementedError('PUT/PATCH /api/v1/workflow/definitions/{definitionId}');
  }

  const created = await workflowDefinitionApi.create({ ...definitions, companyId });
  return { definitions: [created], source: WORKFLOW_DATA_SOURCES.API };
}

export async function deleteWorkflowDefinition(companyId, definitions, id) {
  if (!id) {
    throw new Error('Workflow definition ID is required to delete.');
  }

  const isDraftItem = !isUUID(id);
  if (!isDraftItem) {
    await workflowDefinitionApi.remove(id, companyId);
  }

  const list = Array.isArray(definitions) ? definitions : [];
  const remaining = list.filter((item) => item && item.id !== id);

  try {
    const currentDrafts = readWorkflowDraft(companyId, []);
    const filteredDrafts = currentDrafts.filter((item) => item && item.id !== id);
    writeWorkflowDraft(companyId, filteredDrafts);
  } catch {
    // ignore draft storage issues
  }

  return {
    definitions: remaining,
    source: isDraftItem ? WORKFLOW_DATA_SOURCES.DRAFT : WORKFLOW_DATA_SOURCES.API,
  };
}

const normalizeAuditEntries = (payload) => {
  if (!payload) return [];
  const list = Array.isArray(payload) ? payload : Array.isArray(payload.data) ? payload.data : [];
  return list.map((entry) => ({
    id: entry.id,
    companyId: entry.companyId,
    moduleName: entry.moduleName,
    entityName: entry.entityName,
    entityId: entry.entityId,
    actionType: entry.actionType,
    description: entry.description || '',
    oldValue: entry.oldValue,
    newValue: entry.newValue,
    performedBy: entry.performedBy,
    performedAt: entry.performedAt,
    ipAddress: entry.ipAddress,
    userAgent: entry.userAgent,
  }));
};

export const workflowAuditApi = {
  available: true,
  endpoint: 'GET /api/account/audit-logs',
  async getAuditTrail({
    companyId,
    moduleName,
    entityName,
    entityId,
    actionType,
    performedBy,
    fromDate,
    toDate,
    page = 0,
    size = 30,
    sortBy = 'performedAt',
    sortDir = 'desc',
  } = {}) {
    const params = { page, size, sortBy, sortDir };
    if (companyId) params.companyId = companyId;
    if (moduleName) params['filter.moduleName'] = moduleName;
    if (entityName) params['filter.entityName'] = entityName;
    if (entityId) params['filter.entityId'] = entityId;
    if (actionType) params['filter.actionType'] = actionType;
    if (performedBy) params['filter.performedBy'] = performedBy;
    if (fromDate) params['filter.fromDate'] = fromDate;
    if (toDate) params['filter.toDate'] = toDate;

    const response = await apiClient.get('/api/account/audit-logs', { params });
    const body = response?.data ?? response;
    return {
      entries: normalizeAuditEntries(body),
      pagination: body && typeof body.pagination === 'object' ? body.pagination : null,
    };
  },
};

export const workflowActionsApi = {
  salesInvoices: {
    approve: (id) => apiClient.post(`/api/account/sales/invoices/${id}/approve`),
    reject: (id) => apiClient.post(`/api/account/sales/invoices/${id}/reject`),
    post: (id) => apiClient.post(`/api/account/sales/invoices/${id}/post`),
    partialPayment: (id, paymentAmount) => apiClient.post(`/api/account/sales/invoices/${id}/partial-payment`, null, { params: { paymentAmount } }),
    markPaid: (id, paymentAmount) => apiClient.post(`/api/account/sales/invoices/${id}/mark-paid`, null, { params: { paymentAmount } }),
    cancel: (id) => apiClient.post(`/api/account/sales/invoices/${id}/cancel`),
  },
  apInvoices: {
    submit: (id) => apiClient.post(`/api/account/ap/invoices/${id}/submit`),
    approve: (id) => apiClient.post(`/api/account/ap/invoices/${id}/approve`),
    reject: (id) => apiClient.post(`/api/account/ap/invoices/${id}/reject`),
    post: (id) => apiClient.post(`/api/account/ap/invoices/${id}/post`),
    partialPayment: (id, amount) => apiClient.post(`/api/account/ap/invoices/${id}/partial-payment`, null, { params: { amount } }),
    cancel: (id) => apiClient.post(`/api/account/ap/invoices/${id}/cancel`),
  },
  receipts: {
    submit: (id) => apiClient.post(`/api/account/receipts/${id}/submit`),
    approve: (id) => apiClient.post(`/api/account/receipts/${id}/approve`),
    reject: (id) => apiClient.post(`/api/account/receipts/${id}/reject`),
    post: (id) => apiClient.post(`/api/account/receipts/${id}/post`),
    reverse: (id) => apiClient.post(`/api/account/receipts/${id}/reverse`),
    cancel: (id) => apiClient.post(`/api/account/receipts/${id}/cancel`),
  },
  paymentVouchers: {
    submit: (id) => apiClient.post(`/api/account/payment-vouchers/${id}/submit`),
    approve: (id) => apiClient.post(`/api/account/payment-vouchers/${id}/approve`),
    reject: (id) => apiClient.post(`/api/account/payment-vouchers/${id}/reject`),
    post: (id) => apiClient.post(`/api/account/payment-vouchers/${id}/post`),
    reverse: (id) => apiClient.post(`/api/account/payment-vouchers/${id}/reverse`),
    cancel: (id) => apiClient.post(`/api/account/payment-vouchers/${id}/cancel`),
  },
  creditNotes: {
    submit: (id) => apiClient.post(`/api/account/credit-notes/${id}/submit`),
    approve: (id) => apiClient.post(`/api/account/credit-notes/${id}/approve`),
    reject: (id) => apiClient.post(`/api/account/credit-notes/${id}/reject`),
    post: (id) => apiClient.post(`/api/account/credit-notes/${id}/post`),
    reverse: (id) => apiClient.post(`/api/account/credit-notes/${id}/reverse`),
    cancel: (id) => apiClient.post(`/api/account/credit-notes/${id}/cancel`),
  },
  debitNotes: {
    submit: (id) => apiClient.post(`/api/account/debit-notes/${id}/submit`),
    approve: (id) => apiClient.post(`/api/account/debit-notes/${id}/approve`),
    reject: (id) => apiClient.post(`/api/account/debit-notes/${id}/reject`),
    post: (id) => apiClient.post(`/api/account/debit-notes/${id}/post`),
    reverse: (id) => apiClient.post(`/api/account/debit-notes/${id}/reverse`),
    cancel: (id) => apiClient.post(`/api/account/debit-notes/${id}/cancel`),
  },
};

export const workflowActionsSupplemental = {
  specConfirmed: false,
  expenseRequests: {
    submit: (id) => apiClient.post(`/api/account/expense-requests/${id}/submit`),
    approve: (id, payload = {}) => apiClient.post(`/api/account/expense-requests/${id}/approve`, payload),
    reject: (id, payload = {}) => apiClient.post(`/api/account/expense-requests/${id}/reject`, payload),
    cancel: (id) => apiClient.post(`/api/account/expense-requests/${id}/cancel`),
  },
  reimbursements: {
    submit: (id) => apiClient.post(`/api/account/reimbursements/${id}/submit`),
    approve: (id, payload = {}) => apiClient.post(`/api/account/reimbursements/${id}/approve`, payload),
    reject: (id, payload = {}) => apiClient.post(`/api/account/reimbursements/${id}/reject`, payload),
    pay: (id, payload = {}) => apiClient.post(`/api/account/reimbursements/${id}/pay`, payload),
    cancel: (id) => apiClient.post(`/api/account/reimbursements/${id}/cancel`),
  },
};

export const workflowApiStatus = {
  definitions: {
    available: workflowDefinitionApi.available,
    missingEndpoints: workflowDefinitionApi.missingEndpoints,
  },
  audit: { available: workflowAuditApi.available, endpoint: workflowAuditApi.endpoint },
  actionsSpecConfirmed: Object.keys(workflowActionsApi),
  supplementalSources: Object.keys(workflowActionsSupplemental),
};

export const workflowExecutionApi = {
  getUiDetails: async (transactionId, companyId) => {
    if (!transactionId) throw new Error('Transaction ID is required.');
    const params = companyId ? { companyId } : undefined;
    const response = await apiClient.get(`/api/v1/workflow/transactions/${transactionId}/ui`, { params });
    return unwrapApiData(response);
  },

  getUiDetailsByDocument: async (documentType, documentId, companyId) => {
    if (!documentType || !documentId) throw new Error('documentType and documentId are required.');
    const params = { documentType, documentId };
    if (companyId) params.companyId = companyId;
    const response = await apiClient.get('/api/v1/workflow/transactions/document/ui', { params });
    return unwrapApiData(response);
  },

  getFormSchema: async (documentType = 'GENERAL') => {
    const params = { documentType };
    const response = await apiClient.get('/api/v1/workflow/definitions/schemas', { params });
    return unwrapApiData(response);
  },

  getTransaction: async (transactionId, companyId) => {
    const params = companyId ? { companyId } : undefined;
    const response = await apiClient.get(`/api/v1/workflow/transactions/${transactionId}`, { params });
    return unwrapApiData(response);
  },

  getTransactionByDocument: async (documentType, documentId, companyId) => {
    const params = { documentType, documentId };
    if (companyId) params.companyId = companyId;
    const response = await apiClient.get('/api/v1/workflow/transactions/document', { params });
    return unwrapApiData(response);
  },

  submitWorkflow: async (payload) => {
    const response = await apiClient.post('/api/v1/workflow/transactions/submit', { data: payload });
    return unwrapApiData(response);
  },

  cancelWorkflow: async (transactionId, reason = 'Cancelled by user') => {
    const response = await apiClient.post(`/api/v1/workflow/transactions/${transactionId}/cancel`, {
      data: { reason }
    });
    return unwrapApiData(response);
  },

  addComment: async (transactionId, commentText, isInternal = false) => {
    const response = await apiClient.post(`/api/v1/workflow/transactions/${transactionId}/comments`, {
      data: { commentText, isInternal }
    });
    return unwrapApiData(response);
  },

  getComments: async (transactionId) => {
    const response = await apiClient.get(`/api/v1/workflow/transactions/${transactionId}/comments`);
    return unwrapApiData(response);
  },

  uploadAttachment: async (transactionId, file, taskId = null) => {
    const formData = new FormData();
    formData.append('transactionId', transactionId);
    if (taskId) formData.append('taskId', taskId);
    formData.append('file', file);
    const response = await apiClient.post('/api/v1/workflow/attachments/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return unwrapApiData(response);
  },

  getAttachments: async (transactionId) => {
    const response = await apiClient.get(`/api/v1/workflow/attachments/transaction/${transactionId}`);
    return unwrapApiData(response);
  },

  getAuditHistory: async (transactionId) => {
    const response = await apiClient.get(`/api/v1/workflow/transactions/${transactionId}/audit-trail`);
    return unwrapApiData(response);
  },

  approveTask: async (taskId, comments = 'Approved') => {
    const response = await apiClient.post(`/api/v1/workflow/tasks/${taskId}/approve`, {
      data: { taskId, comments }
    });
    return unwrapApiData(response);
  },

  rejectTask: async (taskId, reason = 'Rejected') => {
    const response = await apiClient.post(`/api/v1/workflow/tasks/${taskId}/reject`, {
      data: { taskId, reason }
    });
    return unwrapApiData(response);
  },

  returnTask: async (taskId, reason = 'Returned for revision') => {
    const response = await apiClient.post(`/api/v1/workflow/tasks/${taskId}/return`, {
      data: { taskId, reason }
    });
    return unwrapApiData(response);
  },

  delegateTask: async (taskId, targetUserId, reason = 'Delegated') => {
    const response = await apiClient.post(`/api/v1/workflow/tasks/${taskId}/delegate`, {
      data: { taskId, targetUserId, reason }
    });
    return unwrapApiData(response);
  },

  getMyTasks: async ({ companyId, page = 0, size = 20 } = {}) => {
    const params = { status: 'PENDING', page, size };
    if (companyId) params.companyId = companyId;
    const response = await apiClient.get('/api/v1/workflow/tasks/my-tasks', { params });
    return unwrapApiData(response);
  },
};

export default workflowDefinitionApi;