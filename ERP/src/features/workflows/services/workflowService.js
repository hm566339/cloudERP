/**
 * Workflow & Approvals data service.
 *
 * This module wires the page to the backend contract documented in
 * account.json. The workflow-definition endpoints are real and live at:
 *
 * - GET /api/account/workflow/definitions?documentType={...}&companyId={...}
 * - POST /api/account/workflow/definitions
 * - POST /api/account/workflow/definitions/{definitionId}/stages
 * - POST /api/account/workflow/definitions/{definitionId}/activate
 *
 * The missing contract pieces are reported explicitly instead of faked:
 * - PUT/PATCH /api/account/workflow/definitions/{definitionId}
 * - DELETE /api/account/workflow/definitions/{definitionId}
 * - GET /api/account/workflow/definitions/{definitionId}
 * - workflow-definition deactivation and stage reorder/update/delete
 *
 * Transaction actions documented in apiFormet.md are delegated to the existing
 * account modules without inventing new URLs.
 */

import apiClient from '../../../api/common/client';
import { auditLogsApi } from '../../../api/account/auditLogs';
import { salesInvoicesApi } from '../../../api/account/salesInvoices';
import { apInvoicesApi } from '../../../api/account/apInvoices';
import { receiptVouchersApi } from '../../../api/account/receiptVouchers';
import { paymentVouchersApi } from '../../../api/account/paymentVouchers';
import { creditNotesApi } from '../../../api/account/creditNotes';
import { debitNotesApi } from '../../../api/account/debitNotes';
import { expenseRequestsApi } from '../../../api/account/expenseRequests';
import { reimbursementsApi } from '../../../api/account/reimbursements';

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
  approvalRequired: item.approvalRequired ?? true,
  approverRole: item.approverRole || '',
  threshold: item.threshold || '',
  customerScope: item.customerScope || 'all',
  customerAcceptance: item.customerAcceptance ?? false,
  autoCreateOrder: item.autoCreateOrder ?? false,
  emailNotifications: item.emailNotifications ?? true,
  notes: item.notes || '',
  steps: Array.isArray(item.steps) ? item.steps : [],
});

export const workflowDefinitionApi = {
  available: true,
  missingEndpoints: [
    'PUT/PATCH /api/account/workflow/definitions/{definitionId}',
    'DELETE /api/account/workflow/definitions/{definitionId}',
    'GET /api/account/workflow/definitions/{definitionId}',
    'DELETE /api/account/workflow/definitions/{definitionId}/stages/{stageId}',
    'POST /api/account/workflow/definitions/{definitionId}/deactivate',
  ],
  list: async (companyId, documentType = 'GENERAL') => {
    const params = { documentType: documentType || 'GENERAL' };
    if (companyId) params.companyId = companyId;

    const response = await apiClient.get('/api/account/workflow/definitions', { params });
    const payload = unwrapApiData(response);
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
    return items.map(normalizeWorkflowDefinition);
  },
  get: async () => { throw new WorkflowApiNotImplementedError('GET /api/account/workflow/definitions/{definitionId}'); },
  create: async (definitionPayload) => {
    const source = definitionPayload && typeof definitionPayload === 'object' && 'data' in definitionPayload ? definitionPayload.data : definitionPayload;
    const payload = {
      companyId: source.companyId,
      workflowCode: source.workflowCode || source.code || `${normalizeDocumentType(source.moduleName || source.module)}-${Date.now()}`,
      workflowName: source.workflowName || source.name,
      moduleName: source.moduleName || source.module || 'GENERAL',
      documentType: source.documentType || normalizeDocumentType(source.moduleName || source.module),
      description: source.description || '',
      version: source.version ?? 1,
      isDefault: Boolean(source.isDefault ?? false),
    };

    if (!payload.workflowName) {
      throw new Error('Workflow name is required to create a workflow definition.');
    }

    const response = await apiClient.post('/api/account/workflow/definitions', payload);
    const data = unwrapApiData(response);
    return normalizeWorkflowDefinition(data);
  },
  update: async () => { throw new WorkflowApiNotImplementedError('PUT/PATCH /api/account/workflow/definitions/{definitionId}'); },
  remove: async () => { throw new WorkflowApiNotImplementedError('DELETE /api/account/workflow/definitions/{definitionId}'); },
  addStage: async (definitionId, stagePayload) => {
    if (!definitionId) throw new Error('Workflow definition ID is required.');
    const payload = stagePayload && typeof stagePayload === 'object' && 'data' in stagePayload ? stagePayload.data : stagePayload;
    const response = await apiClient.post(`/api/account/workflow/definitions/${definitionId}/stages`, payload || {});
    return unwrapApiData(response);
  },
  setActive: async (definitionId) => {
    if (!definitionId) throw new Error('Workflow definition ID is required.');
    const response = await apiClient.post(`/api/account/workflow/definitions/${definitionId}/activate`);
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

export async function loadWorkflowDefinitions(companyId, documentType = 'GENERAL', seed = []) {
  if (workflowDefinitionApi.available) {
    const definition = await workflowDefinitionApi.list(companyId, documentType);
    return { definitions: definition || [], source: WORKFLOW_DATA_SOURCES.API };
  }
  return { definitions: readWorkflowDraft(companyId, seed), source: WORKFLOW_DATA_SOURCES.DRAFT };
}

export async function saveWorkflowDefinitions(companyId, definitions, options = {}) {
  const mode = options.mode || 'create';

  if (Array.isArray(definitions)) {
    if (mode === 'update') {
      throw new WorkflowApiNotImplementedError('PUT/PATCH /api/account/workflow/definitions/{definitionId}');
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

  if (mode === 'update') {
    throw new WorkflowApiNotImplementedError('PUT/PATCH /api/account/workflow/definitions/{definitionId}');
  }

  const created = await workflowDefinitionApi.create({ ...definitions, companyId });
  return { definitions: [created], source: WORKFLOW_DATA_SOURCES.API };
}

export async function deleteWorkflowDefinition(companyId, definitions, id) {
  const next = definitions.filter((item) => item.id !== id);
  if (workflowDefinitionApi.available) {
    throw new WorkflowApiNotImplementedError('DELETE /api/account/workflow/definitions/{definitionId}');
  }
  writeWorkflowDraft(companyId, next);
  return { definitions: next, source: WORKFLOW_DATA_SOURCES.DRAFT };
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

    const response = await auditLogsApi.getAuditLogs(params);
    const body = response?.data ?? response;
    return {
      entries: normalizeAuditEntries(body),
      pagination: body && typeof body.pagination === 'object' ? body.pagination : null,
    };
  },
};

export const workflowActionsApi = {
  salesInvoices: {
    approve: (id) => salesInvoicesApi.approve(id),
    reject: (id) => salesInvoicesApi.reject(id),
    post: (id) => salesInvoicesApi.postToGL(id),
    partialPayment: (id, paymentAmount) => salesInvoicesApi.partialPayment(id, paymentAmount),
    markPaid: (id, paymentAmount) => salesInvoicesApi.markPaid(id, paymentAmount),
    cancel: (id) => salesInvoicesApi.cancel(id),
  },
  apInvoices: {
    submit: (id) => apInvoicesApi.submitForApproval(id),
    approve: (id) => apInvoicesApi.approve(id),
    reject: (id) => apInvoicesApi.reject(id),
    post: (id) => apInvoicesApi.postToGL(id),
    partialPayment: (id, amount) => apInvoicesApi.partialPayment(id, amount),
    cancel: (id) => apInvoicesApi.cancel(id),
  },
  receipts: {
    submit: (id) => receiptVouchersApi.submitReceipt(id),
    approve: (id) => receiptVouchersApi.approveReceipt(id),
    reject: (id) => receiptVouchersApi.rejectReceipt(id),
    post: (id) => receiptVouchersApi.postReceipt(id),
    reverse: (id) => receiptVouchersApi.reverseReceipt(id),
    cancel: (id) => receiptVouchersApi.cancelReceipt(id),
  },
  paymentVouchers: {
    submit: (id) => paymentVouchersApi.submitPaymentVoucher(id),
    approve: (id) => paymentVouchersApi.approvePaymentVoucher(id),
    reject: (id) => paymentVouchersApi.rejectPaymentVoucher(id),
    post: (id) => paymentVouchersApi.postPaymentVoucher(id),
    reverse: (id) => paymentVouchersApi.reversePaymentVoucher(id),
    cancel: (id) => paymentVouchersApi.cancelPaymentVoucher(id),
  },
  creditNotes: {
    submit: (id) => creditNotesApi.submit(id),
    approve: (id) => creditNotesApi.approve(id),
    reject: (id) => creditNotesApi.reject(id),
    post: (id) => creditNotesApi.post(id),
    reverse: (id) => creditNotesApi.reverse(id),
    cancel: (id) => creditNotesApi.cancel(id),
  },
  debitNotes: {
    submit: (id) => debitNotesApi.submitDebitNote(id),
    approve: (id) => debitNotesApi.approveDebitNote(id),
    reject: (id) => debitNotesApi.rejectDebitNote(id),
    post: (id) => debitNotesApi.postDebitNote(id),
    reverse: (id) => debitNotesApi.reverseDebitNote(id),
    cancel: (id) => debitNotesApi.cancelDebitNote(id),
  },
};

export const workflowActionsSupplemental = {
  specConfirmed: false,
  expenseRequests: {
    submit: (id) => expenseRequestsApi.submit(id),
    approve: (id, payload = {}) => expenseRequestsApi.approve(id, payload),
    reject: (id, payload = {}) => expenseRequestsApi.reject(id, payload),
    cancel: (id) => expenseRequestsApi.cancel(id),
  },
  reimbursements: {
    submit: (id) => reimbursementsApi.submit(id),
    approve: (id, payload = {}) => reimbursementsApi.approve(id, payload),
    reject: (id, payload = {}) => reimbursementsApi.reject(id, payload),
    pay: (id, payload = {}) => reimbursementsApi.pay(id, payload),
    cancel: (id) => reimbursementsApi.cancel(id),
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

export default workflowDefinitionApi;