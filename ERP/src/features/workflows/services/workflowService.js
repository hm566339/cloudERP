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
export const WORKFLOW_SETTINGS_STORAGE_KEY = 'erp_workflow_additional_settings';

export const WORKFLOW_DATA_SOURCES = Object.freeze({
  API: 'api',
  DRAFT: 'draft',
});

export const APPROVER_TYPES = Object.freeze([
  'USER',
  'ROLE',
  'DEPARTMENT',
  'RULE',
  'DOCUMENT_OWNER',
]);

export const WORKFLOW_ACTION_TYPES = Object.freeze([
  'SUBMIT',
  'APPROVE',
  'REJECT',
  'RETURN',
  'CANCEL',
  'DELEGATE',
  'ESCALATE',
  'REASSIGN',
  'COMPLETE',
]);

export const WORKFLOW_EXECUTION_TYPES = Object.freeze(['SEQUENTIAL', 'PARALLEL']);
export const WORKFLOW_REJECTION_ACTIONS = Object.freeze(['REJECT_DOCUMENT', 'RETURN_TO_INITIATOR']);

export const DOCUMENT_TYPES_BY_MODULE = Object.freeze({
  Sales: [
    { value: 'QUOTATION', label: 'Sales Quotation (QUOTATION)' },
    { value: 'PROFORMA_INVOICE', label: 'Proforma Invoice (PROFORMA_INVOICE)' },
    { value: 'SALES_ORDER', label: 'Sales Order (SALES_ORDER)' },
    { value: 'DELIVERY_CHALLAN', label: 'Delivery Challan (DELIVERY_CHALLAN)' },
    { value: 'SALES_INVOICE', label: 'Sales Invoice (SALES_INVOICE)' },
    { value: 'SALES', label: 'General Sales (SALES)' },
  ],
  Purchase: [
    { value: 'PURCHASE_REQUISITION', label: 'Purchase Requisition (PURCHASE_REQUISITION)' },
    { value: 'RFQ', label: 'Request for Quotation (RFQ)' },
    { value: 'SUPPLIER_QUOTATION', label: 'Supplier Quotation (SUPPLIER_QUOTATION)' },
    { value: 'PURCHASE_ORDER', label: 'Purchase Order (PURCHASE_ORDER)' },
    { value: 'GOODS_RECEIPT', label: 'Goods Receipt Note (GOODS_RECEIPT)' },
    { value: 'AP_INVOICE', label: 'Vendor Bill / AP Invoice (AP_INVOICE)' },
    { value: 'AP_PAYMENT', label: 'AP Payment (AP_PAYMENT)' },
    { value: 'PURCHASE', label: 'General Purchase (PURCHASE)' },
  ],
  Manufacturing: [
    { value: 'BOM', label: 'Bill of Materials (BOM)' },
    { value: 'PRODUCTION_ORDER', label: 'Production Order (PRODUCTION_ORDER)' },
    { value: 'WORK_ORDER', label: 'Work Order (WORK_ORDER)' },
    { value: 'PRODUCTION_COMPLETION', label: 'Production Completion (PRODUCTION_COMPLETION)' },
  ],
  Inventory: [
    { value: 'STOCK_TRANSFER', label: 'Stock Transfer (STOCK_TRANSFER)' },
    { value: 'STOCK_ADJUSTMENT', label: 'Stock Adjustment (STOCK_ADJUSTMENT)' },
    { value: 'STOCK_MOVEMENT', label: 'Stock Movement (STOCK_MOVEMENT)' },
    { value: 'OPENING_STOCK', label: 'Opening Stock (OPENING_STOCK)' },
    { value: 'STOCK_RESERVATION', label: 'Stock Reservation (STOCK_RESERVATION)' },
    { value: 'INVENTORY', label: 'General Inventory (INVENTORY)' },
  ],
  Expenses: [
    { value: 'EXPENSE_REQUEST', label: 'Expense Request (EXPENSE_REQUEST)' },
    { value: 'EXPENSE', label: 'General Expense (EXPENSE)' },
  ],
  Invoices: [
    { value: 'SALES_INVOICE', label: 'Sales Invoice (SALES_INVOICE)' },
    { value: 'AP_INVOICE', label: 'AP Invoice (AP_INVOICE)' },
    { value: 'INVOICE', label: 'General Invoice (INVOICE)' },
  ],
  Reimbursements: [
    { value: 'REIMBURSEMENT', label: 'Reimbursement Request (REIMBURSEMENT)' },
  ],
  Others: [
    { value: 'RECEIPT_VOUCHER', label: 'Receipt Voucher (RECEIPT_VOUCHER)' },
    { value: 'PAYMENT_VOUCHER', label: 'Payment Voucher (PAYMENT_VOUCHER)' },
    { value: 'JOURNAL_ENTRY', label: 'Journal Entry (JOURNAL_ENTRY)' },
    { value: 'CREDIT_NOTE', label: 'Credit Note (CREDIT_NOTE)' },
    { value: 'DEBIT_NOTE', label: 'Debit Note (DEBIT_NOTE)' },
    { value: 'FISCAL_YEAR', label: 'Fiscal Year (FISCAL_YEAR)' },
    { value: 'GENERAL', label: 'General Document (GENERAL)' },
  ],
});

const settingsKey = (companyId) => `${WORKFLOW_SETTINGS_STORAGE_KEY}_${companyId || 'default'}`;
const memorySettingsStore = {};

export const getWorkflowAdditionalSettings = (companyId, definitionId) => {
  const key = settingsKey(companyId);
  try {
    let raw = null;
    if (typeof localStorage !== 'undefined' && localStorage?.getItem) {
      raw = localStorage.getItem(key);
    }
    const store = raw ? JSON.parse(raw) : (memorySettingsStore[key] || {});
    return definitionId ? store[definitionId] || {} : store;
  } catch {
    const store = memorySettingsStore[key] || {};
    return definitionId ? store[definitionId] || {} : store;
  }
};

export const saveWorkflowAdditionalSettings = (companyId, definitionId, settings = {}) => {
  if (!definitionId) return;
  const key = settingsKey(companyId);
  try {
    let store = {};
    if (typeof localStorage !== 'undefined' && localStorage?.getItem) {
      const raw = localStorage.getItem(key);
      store = raw ? JSON.parse(raw) : {};
    } else {
      store = memorySettingsStore[key] || {};
    }
    store[definitionId] = {
      ...(store[definitionId] || {}),
      customerScope: settings.customerScope || 'all',
      threshold: settings.threshold || '',
      customerAcceptance: Boolean(settings.customerAcceptance),
      autoCreateOrder: Boolean(settings.autoCreateOrder),
      emailNotifications: settings.emailNotifications ?? true,
      notes: settings.notes || '',
      initiatedBy: settings.initiatedBy || '',
      initiatedByRoleId: settings.initiatedByRoleId,
      initiatedByRoleName: settings.initiatedByRoleName,
      approvalRequired: settings.approvalRequired ?? true,
      approverRole: settings.approverRole || '',
      approverRoleId: settings.approverRoleId,
      approverRoleName: settings.approverRoleName,
      steps: Array.isArray(settings.steps) ? settings.steps : (store[definitionId]?.steps || []),
    };
    if (typeof localStorage !== 'undefined' && localStorage?.setItem) {
      localStorage.setItem(key, JSON.stringify(store));
    }
    memorySettingsStore[key] = store;
  } catch {
    // Fallback in memory
  }
};

export function validateWorkflowDefinition(workflow, options = {}) {
  const errors = {};
  const effectiveCompanyId = options.companyId || workflow?.companyId;

  if (!effectiveCompanyId) {
    errors.companyId = 'companyId is required.';
  }

  const code = (workflow?.workflowCode || workflow?.code || '').trim();
  if (!code) {
    errors.workflowCode = 'workflowCode is required.';
  }

  const name = (workflow?.workflowName || workflow?.name || '').trim();
  if (!name) {
    errors.name = 'workflowName is required.';
    errors.workflowName = 'workflowName is required.';
  }

  const docType = (workflow?.documentType || workflow?.moduleName || workflow?.module || '').trim();
  if (!docType) {
    errors.documentType = 'documentType is required.';
  }

  const rawStages = (Array.isArray(workflow?.stages) && workflow.stages.length > 0)
    ? workflow.stages
    : (Array.isArray(workflow?.steps) && workflow.steps.length > 0)
      ? workflow.steps.filter((s) => s.active !== false)
      : [];

  if (rawStages.length === 0) {
    errors.steps = 'At least one stage is required.';
    errors.stages = 'At least one stage is required.';
  } else {
    rawStages.forEach((stage, idx) => {
      const stageCode = (stage.stageCode !== undefined)
        ? String(stage.stageCode).trim()
        : (stage.id && !String(stage.id).startsWith('step-') && !String(stage.id).startsWith('stage-') ? stage.id : `STAGE_${idx + 1}`);
      const stageName = (stage.stageName !== undefined)
        ? String(stage.stageName).trim()
        : String(stage.title || `Stage ${idx + 1}`).trim();

      if (!stageCode) {
        errors[`stage_${idx}_code`] = `Stage ${idx + 1} code is required.`;
        if (!errors.steps) errors.steps = 'Each stage must have a valid stage code and name.';
      }
      if (!stageName) {
        errors[`stage_${idx}_name`] = `Stage ${idx + 1} name is required.`;
        if (!errors.steps) errors.steps = 'Each stage must have a valid stage code and name.';
      }

      if (Array.isArray(stage.approvers)) {
        stage.approvers.forEach((app, aIdx) => {
          if (!app?.approverType || !APPROVER_TYPES.includes(String(app.approverType).toUpperCase())) {
            errors[`stage_${idx}_approver_${aIdx}_type`] = `Approver must have a valid approverType: ${APPROVER_TYPES.join(', ')}`;
            if (!errors.steps) errors.steps = 'Each configured approver must have a valid approverType.';
          }
        });
      }

      if (stage.sla) {
        const duration = Number(stage.sla.durationHours);
        if (isNaN(duration) || duration <= 0) {
          errors[`stage_${idx}_sla`] = 'SLA durationHours is required and must be greater than 0.';
          if (!errors.steps) errors.steps = 'Any configured SLA must have a valid durationHours.';
        }
      }
    });
  }

  if (Array.isArray(workflow?.transitions)) {
    workflow.transitions.forEach((trans, tIdx) => {
      if (!trans?.actionType || !WORKFLOW_ACTION_TYPES.includes(String(trans.actionType).toUpperCase())) {
        errors[`transition_${tIdx}_actionType`] = `Transition must have a valid actionType: ${WORKFLOW_ACTION_TYPES.join(', ')}`;
        if (!errors.transitions) errors.transitions = 'Each configured transition must have a valid actionType.';
      }
    });
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

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

const normalizeModuleName = (moduleName = 'GENERAL') => {
  const norm = normalizeDocumentType(moduleName);
  const map = {
    SALES: 'Sales',
    QUOTATION: 'Sales',
    PROFORMA_INVOICE: 'Sales',
    SALES_ORDER: 'Sales',
    DELIVERY_CHALLAN: 'Sales',
    SALES_INVOICE: 'Sales',

    PURCHASE: 'Purchase',
    PURCHASE_REQUISITION: 'Purchase',
    RFQ: 'Purchase',
    SUPPLIER_QUOTATION: 'Purchase',
    PURCHASE_ORDER: 'Purchase',
    GOODS_RECEIPT: 'Purchase',
    AP_INVOICE: 'Purchase',
    AP_PAYMENT: 'Purchase',

    MANUFACTURING: 'Manufacturing',
    BOM: 'Manufacturing',
    PRODUCTION_ORDER: 'Manufacturing',
    WORK_ORDER: 'Manufacturing',
    PRODUCTION_COMPLETION: 'Manufacturing',

    INVENTORY: 'Inventory',
    STOCK_TRANSFER: 'Inventory',
    STOCK_ADJUSTMENT: 'Inventory',
    STOCK_MOVEMENT: 'Inventory',
    OPENING_STOCK: 'Inventory',
    STOCK_RESERVATION: 'Inventory',

    EXPENSE: 'Expenses',
    EXPENSES: 'Expenses',
    EXPENSE_REQUEST: 'Expenses',

    INVOICE: 'Invoices',
    INVOICES: 'Invoices',

    REIMBURSEMENT: 'Reimbursements',
    REIMBURSEMENTS: 'Reimbursements',

    RECEIPT_VOUCHER: 'Others',
    PAYMENT_VOUCHER: 'Others',
    JOURNAL_ENTRY: 'Others',
    CREDIT_NOTE: 'Others',
    DEBIT_NOTE: 'Others',
    FISCAL_YEAR: 'Others',
  };
  return map[norm] || 'Others';
};

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

const normalizeWorkflowDefinition = (item = {}, companyId) => {
  const defId = item.id || item.definitionId || item.workflowId;
  const effectiveCompanyId = companyId || item.companyId;
  const extra = (effectiveCompanyId && defId) ? getWorkflowAdditionalSettings(effectiveCompanyId, defId) : {};

  return {
    id: defId,
    companyId: effectiveCompanyId,
    workflowCode: item.workflowCode || item.code || defId,
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
    initiatedBy: item.initiatedBy || item.initiatedByRoleId || item.initiatedByRoleName || extra.initiatedBy || '',
    initiatedByRoleId: item.initiatedByRoleId || extra.initiatedByRoleId || (isUUID(item.initiatedBy) ? item.initiatedBy : undefined),
    initiatedByRoleName: item.initiatedByRoleName || extra.initiatedByRoleName || (!isUUID(item.initiatedBy) ? item.initiatedBy : undefined),
    approvalRequired: item.isApprovalRequired !== undefined ? Boolean(item.isApprovalRequired) : (item.approvalRequired !== undefined ? Boolean(item.approvalRequired) : (extra.approvalRequired ?? true)),
    isApprovalRequired: item.isApprovalRequired !== undefined ? Boolean(item.isApprovalRequired) : (item.approvalRequired !== undefined ? Boolean(item.approvalRequired) : (extra.approvalRequired ?? true)),
    approverRole: item.approverRole || (item.stages?.[0]?.approvers?.[0]?.roleId || item.stages?.[0]?.approvers?.[0]?.roleName || ''),
    approverRoleId: item.approverRoleId || item.stages?.[0]?.approvers?.[0]?.roleId || (isUUID(item.approverRole) ? item.approverRole : undefined),
    approverRoleName: item.approverRoleName || item.stages?.[0]?.approvers?.[0]?.roleName || (!isUUID(item.approverRole) ? item.approverRole : undefined),
    threshold: item.approvalThreshold != null ? String(item.approvalThreshold) : (item.threshold || extra.threshold || ''),
    approvalThreshold: item.approvalThreshold != null ? item.approvalThreshold : (item.threshold ? Number(String(item.threshold).replace(/,/g, '')) : null),
    customerScope: item.customerScope || extra.customerScope || 'all',
    customerAcceptance: item.customerAcceptance !== undefined ? Boolean(item.customerAcceptance) : (extra.customerAcceptance ?? false),
    autoCreateOrder: item.autoCreateOrder !== undefined ? Boolean(item.autoCreateOrder) : (extra.autoCreateOrder ?? false),
    emailNotifications: item.emailNotifications !== undefined ? Boolean(item.emailNotifications) : (extra.emailNotifications ?? true),
    notes: item.internalNotes || item.notes || extra.notes || '',
    internalNotes: item.internalNotes || item.notes || extra.notes || '',
    stages: Array.isArray(item.stages) ? item.stages : [],
    transitions: Array.isArray(item.transitions) ? item.transitions : [],
    steps: Array.isArray(item.steps) && item.steps.length
      ? item.steps
      : Array.isArray(item.stages) && item.stages.length
        ? item.stages.map((stage, idx) => {
            const extraSteps = Array.isArray(extra.steps) ? extra.steps : [];
            const extraStep = extraSteps.find((s) => s.id === stage.id || s.stageCode === stage.stageCode || s.sequenceNo === stage.sequenceNo);
            const roleVal = stage.approvers?.[0]?.roleId || stage.approvers?.[0]?.roleName || stage.approvers?.[0]?.userName || extraStep?.role || '';
            return {
              id: stage.id || extraStep?.id || `stage-${idx + 1}`,
              stageCode: stage.stageCode || extraStep?.stageCode || `STAGE_${idx + 1}`,
              title: stage.stageName || extraStep?.title || `Stage ${idx + 1}`,
              stageName: stage.stageName || extraStep?.stageName || `Stage ${idx + 1}`,
              role: roleVal,
              roleId: stage.approvers?.[0]?.roleId || extraStep?.roleId,
              roleName: stage.approvers?.[0]?.roleName || extraStep?.roleName,
              approvers: stage.approvers,
              sla: stage.sla,
              executionType: stage.executionType || 'SEQUENTIAL',
              minimumApprovalsRequired: stage.minimumApprovalsRequired || 1,
              rejectionAction: stage.rejectionAction || 'REJECT_DOCUMENT',
              isMandatory: stage.isMandatory !== false,
              type: extraStep?.type || 'approval',
              approvalRule: extraStep?.approvalRule || (stage.minimumApprovalsRequired > 1 ? 'MINIMUM_REQUIRED' : (stage.executionType === 'PARALLEL' ? 'ALL_MUST_APPROVE' : 'ANY_ONE')),
              ruleExpression: extraStep?.ruleExpression || stage.approvers?.[0]?.ruleExpression || '',
              notificationChannel: extraStep?.notificationChannel || 'IN_APP',
              notificationMessage: extraStep?.notificationMessage || '',
              sequenceNo: stage.sequenceNo || idx + 1,
              active: stage.isActive !== false,
            };
          })
        : (Array.isArray(extra.steps) && extra.steps.length ? extra.steps : []),
  };
};

const mapApprover = (app, defaultOrder = 1) => {
  if (!app) return null;
  if (typeof app === 'string') {
    const isRoleUUID = isUUID(app);
    return {
      approverType: 'ROLE',
      approvalOrder: defaultOrder,
      isRequired: true,
      canDelegate: true,
      roleId: isRoleUUID ? app : undefined,
      roleName: !isRoleUUID ? app : undefined,
    };
  }

  const approverType = app.approverType && APPROVER_TYPES.includes(String(app.approverType).toUpperCase())
    ? String(app.approverType).toUpperCase()
    : 'ROLE';

  const mapped = {
    approverType,
    approvalOrder: typeof app.approvalOrder === 'number' ? app.approvalOrder : defaultOrder,
    isRequired: app.isRequired ?? true,
    canDelegate: app.canDelegate ?? true,
  };

  if (app.userId && isUUID(app.userId)) mapped.userId = app.userId;
  if (app.userName) mapped.userName = app.userName;
  if (app.roleId && isUUID(app.roleId)) mapped.roleId = app.roleId;
  else if (app.role && isUUID(app.role)) mapped.roleId = app.role;
  if (app.roleName) mapped.roleName = app.roleName;
  else if (app.role && !isUUID(app.role)) mapped.roleName = app.role;
  if (app.departmentId && isUUID(app.departmentId)) mapped.departmentId = app.departmentId;
  if (app.departmentName) mapped.departmentName = app.departmentName;
  if (app.ruleExpression) mapped.ruleExpression = app.ruleExpression;

  return mapped;
};

const mapSla = (sla) => {
  if (!sla || typeof sla !== 'object') return undefined;
  const durationHours = parseInt(sla.durationHours, 10);
  if (isNaN(durationHours) || durationHours <= 0) return undefined;
  const mapped = {
    durationHours,
    escalationAction: sla.escalationAction || 'NOTIFY_MANAGER',
  };
  if (sla.reminderHours !== undefined && !isNaN(parseInt(sla.reminderHours, 10))) {
    mapped.reminderHours = parseInt(sla.reminderHours, 10);
  }
  if (sla.escalateToUserId && isUUID(sla.escalateToUserId)) {
    mapped.escalateToUserId = sla.escalateToUserId;
  }
  if (sla.escalateToRoleName) {
    mapped.escalateToRoleName = sla.escalateToRoleName;
  }
  return mapped;
};

const mapTransition = (trans) => {
  if (!trans || typeof trans !== 'object') return null;
  const actionType = String(trans.actionType || 'APPROVE').toUpperCase();
  if (!WORKFLOW_ACTION_TYPES.includes(actionType)) return null;

  const mapped = { actionType };
  if (trans.sourceStageCode) mapped.sourceStageCode = trans.sourceStageCode;
  if (trans.targetStageCode) mapped.targetStageCode = trans.targetStageCode;
  if (trans.transitionCondition) mapped.transitionCondition = trans.transitionCondition;
  if (trans.allowedRoles) mapped.allowedRoles = trans.allowedRoles;
  return mapped;
};

const buildStagesPayload = (source) => {
  const rawStages = (Array.isArray(source.stages) && source.stages.length > 0)
    ? source.stages
    : (Array.isArray(source.steps) && source.steps.length > 0)
      ? source.steps
      : [];

  if (rawStages.length === 0) {
    return [{
      stageCode: 'STAGE_1',
      stageName: 'Initial Approval',
      stageOrder: 1,
      sequenceNo: 1,
      executionType: 'SEQUENTIAL',
      minimumApprovalsRequired: 1,
      rejectionAction: 'REJECT_DOCUMENT',
      isMandatory: true,
      isActive: true,
      approvers: [mapApprover({
        approverType: 'ROLE',
        roleId: source.approverRoleId || (isUUID(source.approverRole) ? source.approverRole : undefined),
        roleName: source.approverRoleName || (!isUUID(source.approverRole) ? source.approverRole : undefined) || 'Approver Role',
        approvalOrder: 1,
        isRequired: true,
        canDelegate: true,
      })].filter(Boolean),
    }];
  }

  return rawStages.map((stageItem, idx) => {
    const stageCode = (stageItem.stageCode || `STAGE_${idx + 1}`).trim();
    const stageName = (stageItem.stageName || stageItem.title || `Stage ${idx + 1}`).trim();
    const stageOrder = typeof stageItem.stageOrder === 'number' ? stageItem.stageOrder : idx + 1;
    const sequenceNo = typeof stageItem.sequenceNo === 'number' ? stageItem.sequenceNo : idx + 1;
    const executionType = stageItem.executionType === 'PARALLEL' ? 'PARALLEL' : 'SEQUENTIAL';
    const minimumApprovalsRequired = typeof stageItem.minimumApprovalsRequired === 'number' && stageItem.minimumApprovalsRequired > 0
      ? stageItem.minimumApprovalsRequired
      : 1;
    const rejectionAction = stageItem.rejectionAction === 'RETURN_TO_INITIATOR' ? 'RETURN_TO_INITIATOR' : 'REJECT_DOCUMENT';
    const isMandatory = stageItem.isMandatory !== false;
    const isActive = stageItem.active !== false && stageItem.isActive !== false;

    let approvers = [];
    if (Array.isArray(stageItem.approvers) && stageItem.approvers.length > 0) {
      approvers = stageItem.approvers.map((a, aIdx) => mapApprover(a, aIdx + 1)).filter(Boolean);
    } else if (stageItem.role || stageItem.roleId || stageItem.roleName || source.approverRole || source.approverRoleId || source.approverRoleName) {
      const roleVal = stageItem.role || stageItem.roleId || stageItem.roleName || source.approverRole || source.approverRoleId || source.approverRoleName;
      const approver = mapApprover({
        approverType: 'ROLE',
        roleId: stageItem.roleId || source.approverRoleId || (isUUID(roleVal) ? roleVal : undefined),
        roleName: stageItem.roleName || source.approverRoleName || (!isUUID(roleVal) ? roleVal : undefined),
        ruleExpression: stageItem.ruleExpression || (stageItem.type === 'condition' ? stageItem.ruleExpression : undefined),
        approvalOrder: 1,
        isRequired: true,
        canDelegate: true,
      });
      if (approver) approvers.push(approver);
    }

    const stage = {
      stageCode,
      stageName,
      stageOrder,
      sequenceNo,
      executionType,
      minimumApprovalsRequired,
      rejectionAction,
      isMandatory,
      isActive,
      approvers,
    };

    const sla = mapSla(stageItem.sla);
    if (sla) stage.sla = sla;

    return stage;
  });
};

export const workflowDefinitionApi = {
  available: true,
  missingEndpoints: [
    'POST /api/v1/workflow/definitions/{definitionId}/stages',
  ],
  list: async (companyId, documentType, options = {}) => {
    const params = {};
    if (companyId) params.companyId = companyId;
    const cleanDocType = (documentType || '').trim();
    if (cleanDocType && cleanDocType.toUpperCase() !== 'ALL') {
      params.documentType = cleanDocType;
    }
    const cleanModuleName = (options.moduleName || '').trim();
    if (cleanModuleName && cleanModuleName.toUpperCase() !== 'ALL') {
      params.moduleName = cleanModuleName;
    }
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
    return items.map((item) => normalizeWorkflowDefinition(item, companyId));
  },
  get: async (definitionId, companyId) => {
    if (!definitionId) throw new Error('Workflow definition ID is required.');
    const params = companyId ? { companyId } : undefined;
    const response = await apiClient.get(`/api/v1/workflow/definitions/${definitionId}`, { params });
    const data = unwrapApiData(response);
    return normalizeWorkflowDefinition(data, companyId);
  },
  getActive: async (documentType, companyId, moduleName) => {
    if (!documentType) throw new Error('Document type is required.');
    const params = { documentType };
    if (companyId) params.companyId = companyId;
    if (moduleName) params.moduleName = moduleName;
    const response = await apiClient.get('/api/v1/workflow/definitions/active', { params });
    const data = unwrapApiData(response);
    return normalizeWorkflowDefinition(data, companyId);
  },
  create: async (definitionPayload) => {
    const source = definitionPayload && typeof definitionPayload === 'object' && 'data' in definitionPayload ? definitionPayload.data : definitionPayload;
    const stages = buildStagesPayload(source);

    const workflowName = (source.workflowName || source.name || '').trim();
    if (!workflowName) {
      throw new Error('Workflow name is required to create a workflow definition.');
    }

    const workflowCode = (source.workflowCode || source.code || '').trim() || `${normalizeDocumentType(source.moduleName || source.module)}-${Date.now()}`;
    const moduleName = (source.moduleName || source.module || 'GENERAL').toUpperCase();
    const documentType = (source.documentType || normalizeDocumentType(source.moduleName || source.module)).toUpperCase();

    // DTO fields ONLY - strictly match CreateWorkflowDefinitionRequest
    const payload = {
      companyId: source.companyId,
      workflowCode,
      workflowName,
      moduleName,
      documentType,
      description: source.description || '',
      version: typeof source.version === 'number' ? source.version : 1,
      isActive: Boolean(source.isActive !== undefined ? source.isActive : source.active),
      isDefault: Boolean(source.isDefault ?? false),
      initiatedByRoleId: source.initiatedByRoleId || (isUUID(source.initiatedBy) ? source.initiatedBy : undefined),
      initiatedByRoleName: source.initiatedByRoleName || (!isUUID(source.initiatedBy) ? source.initiatedBy : undefined),
      customerScope: source.customerScope || 'all',
      approvalThreshold: source.approvalThreshold != null ? source.approvalThreshold : (source.threshold ? Number(String(source.threshold).replace(/,/g, '')) : undefined),
      isApprovalRequired: source.isApprovalRequired !== undefined ? Boolean(source.isApprovalRequired) : (source.approvalRequired !== undefined ? Boolean(source.approvalRequired) : true),
      customerAcceptance: Boolean(source.customerAcceptance),
      autoCreateOrder: Boolean(source.autoCreateOrder),
      emailNotifications: source.emailNotifications !== undefined ? Boolean(source.emailNotifications) : true,
      internalNotes: source.internalNotes || source.notes || '',
      stages,
      transitions: Array.isArray(source.transitions)
        ? source.transitions.map(mapTransition).filter(Boolean)
        : [],
    };

    if (source.effectiveFrom) payload.effectiveFrom = source.effectiveFrom;
    if (source.effectiveTo) payload.effectiveTo = source.effectiveTo;

    const response = await apiClient.post('/api/v1/workflow/definitions', { data: payload });
    const data = unwrapApiData(response);
    return normalizeWorkflowDefinition(data, source.companyId);
  },
  update: async (definitionId, definitionPayload) => {
    if (!definitionPayload) {
      throw new WorkflowApiNotImplementedError('PUT/PATCH /api/v1/workflow/definitions/{definitionId}');
    }
    if (!definitionId) throw new Error('Workflow definition ID is required.');
    const source = definitionPayload && typeof definitionPayload === 'object' && 'data' in definitionPayload ? definitionPayload.data : definitionPayload;
    const stages = buildStagesPayload(source);

    const workflowName = (source.workflowName || source.name || '').trim();
    if (!workflowName) {
      throw new Error('Workflow name is required to update a workflow definition.');
    }

    const workflowCode = (source.workflowCode || source.code || '').trim() || `${normalizeDocumentType(source.moduleName || source.module)}-${Date.now()}`;
    const moduleName = (source.moduleName || source.module || 'GENERAL').toUpperCase();
    const documentType = (source.documentType || normalizeDocumentType(source.moduleName || source.module)).toUpperCase();

    const payload = {
      companyId: source.companyId,
      workflowCode,
      workflowName,
      moduleName,
      documentType,
      description: source.description || '',
      version: typeof source.version === 'number' ? source.version : 1,
      isActive: Boolean(source.isActive !== undefined ? source.isActive : source.active),
      isDefault: Boolean(source.isDefault ?? false),
      initiatedByRoleId: source.initiatedByRoleId || (isUUID(source.initiatedBy) ? source.initiatedBy : undefined),
      initiatedByRoleName: source.initiatedByRoleName || (!isUUID(source.initiatedBy) ? source.initiatedBy : undefined),
      customerScope: source.customerScope || 'all',
      approvalThreshold: source.approvalThreshold != null ? source.approvalThreshold : (source.threshold ? Number(String(source.threshold).replace(/,/g, '')) : undefined),
      isApprovalRequired: source.isApprovalRequired !== undefined ? Boolean(source.isApprovalRequired) : (source.approvalRequired !== undefined ? Boolean(source.approvalRequired) : true),
      customerAcceptance: Boolean(source.customerAcceptance),
      autoCreateOrder: Boolean(source.autoCreateOrder),
      emailNotifications: source.emailNotifications !== undefined ? Boolean(source.emailNotifications) : true,
      internalNotes: source.internalNotes || source.notes || '',
      stages,
      transitions: Array.isArray(source.transitions)
        ? source.transitions.map(mapTransition).filter(Boolean)
        : [],
    };

    if (source.effectiveFrom) payload.effectiveFrom = source.effectiveFrom;
    if (source.effectiveTo) payload.effectiveTo = source.effectiveTo;

    const response = await apiClient.put(`/api/v1/workflow/definitions/${definitionId}`, { data: payload });
    const data = unwrapApiData(response);
    return normalizeWorkflowDefinition(data, source.companyId);
  },
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

export async function loadWorkflowDefinitions(companyId, documentType, options = {}) {
  // Always query backend workflow-service directly.
  // Never silently fall back to localStorage drafts as server-persisted definitions.
  const definitions = await workflowDefinitionApi.list(companyId, documentType, options);
  return { definitions: definitions || [], source: WORKFLOW_DATA_SOURCES.API };
}

export async function saveWorkflowDefinitions(companyId, definitions, options = {}) {
  const isDraftItem = (item) => !item?.id || String(item.id).startsWith('workflow-') || String(item.id).startsWith('draft-');
  const mode = options.mode || (isDraftItem(definitions) ? 'create' : 'update');

  if (Array.isArray(definitions)) {
    if (mode === 'update') {
      throw new WorkflowApiNotImplementedError('PUT/PATCH /api/v1/workflow/definitions/{definitionId}');
    }

    const created = [];
    for (const item of definitions) {
      if (!item || !(item.name || item.workflowName)) continue;
      const createdItem = await workflowDefinitionApi.create({ ...item, companyId });
      saveWorkflowAdditionalSettings(companyId, createdItem.id, item);
      created.push(createdItem);
    }
    return { definitions: created, source: WORKFLOW_DATA_SOURCES.API };
  }

  if (!definitions || !(definitions.name || definitions.workflowName)) {
    return { definitions: [], source: WORKFLOW_DATA_SOURCES.API };
  }

  const payloadToValidate = {
    ...definitions,
    companyId,
    workflowCode: (definitions.workflowCode || definitions.code || '').trim() || (definitions.name || definitions.workflowName ? `${normalizeDocumentType(definitions.moduleName || definitions.module)}_${Date.now().toString().slice(-4)}` : ''),
  };
  const validation = validateWorkflowDefinition(payloadToValidate, { companyId });
  if (!validation.isValid) {
    const errorMsg = Object.values(validation.errors)[0] || 'Workflow validation failed.';
    const err = new Error(errorMsg);
    err.validationErrors = validation.errors;
    throw err;
  }

  if (mode === 'update' && !isDraftItem(definitions)) {
    if (definitions.id) {
      const updated = await workflowDefinitionApi.update(definitions.id, { ...payloadToValidate, companyId });
      saveWorkflowAdditionalSettings(companyId, definitions.id, definitions);
      return { definitions: [updated], source: WORKFLOW_DATA_SOURCES.API };
    }
    throw new WorkflowApiNotImplementedError('PUT/PATCH /api/v1/workflow/definitions/{definitionId}');
  }

  // Create mode: validate first
  const created = await workflowDefinitionApi.create({ ...payloadToValidate, companyId });
  saveWorkflowAdditionalSettings(companyId, created.id, definitions);
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
  endpoint: 'GET /api/v1/workflow/transactions',
  async getAuditTrail({
    companyId,
    moduleName,
    documentType,
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
    const params = { page, size };
    if (companyId) params.companyId = companyId;
    if (moduleName) params.moduleName = moduleName.toUpperCase();
    if (documentType) params.documentType = documentType;

    try {
      const response = await apiClient.get('/api/v1/workflow/transactions', { params });
      const payload = unwrapApiData(response);
      const transactions = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.content)
          ? payload.content
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

      const entries = [];
      for (const tx of transactions) {
        if (Array.isArray(tx.actions) && tx.actions.length > 0) {
          for (const act of tx.actions) {
            entries.push({
              id: act.id || `${tx.id}-${act.actionType}-${act.performedAt}`,
              type: 'TRANSACTION_ACTION',
              actionType: act.actionType,
              performedBy: act.performedByName || 'System',
              entityName: `${tx.documentType || 'DOCUMENT'} #${tx.documentNumber || String(tx.id).slice(0, 8)}`,
              performedAt: act.performedAt || tx.createdAt,
              description: act.comments ? `[${act.actionType}] ${act.comments}` : `Transaction #${tx.documentNumber || String(tx.id).slice(0, 8)}: ${act.actionType}`,
              status: tx.status,
            });
          }
        } else {
          entries.push({
            id: tx.id,
            type: 'TRANSACTION',
            actionType: tx.status || 'SUBMITTED',
            performedBy: tx.initiatedByName || 'System',
            entityName: `${tx.documentType || 'DOCUMENT'} #${tx.documentNumber || String(tx.id).slice(0, 8)}`,
            performedAt: tx.initiatedAt || tx.createdAt,
            description: `Document submitted for approval. Status: ${tx.status}`,
            status: tx.status,
          });
        }
      }

      return {
        entries,
        pagination: payload && typeof payload.totalPages === 'number' ? {
          page: payload.number || page,
          totalPages: payload.totalPages,
          totalElements: payload.totalElements,
        } : null,
      };
    } catch (err) {
      try {
        const fallbackParams = { page, size, sortBy, sortDir };
        if (companyId) fallbackParams.companyId = companyId;
        if (moduleName) fallbackParams['filter.moduleName'] = moduleName;
        if (entityName) fallbackParams['filter.entityName'] = entityName;
        if (entityId) fallbackParams['filter.entityId'] = entityId;
        if (actionType) fallbackParams['filter.actionType'] = actionType;
        if (performedBy) fallbackParams['filter.performedBy'] = performedBy;
        if (fromDate) fallbackParams['filter.fromDate'] = fromDate;
        if (toDate) fallbackParams['filter.toDate'] = toDate;

        const fallbackRes = await apiClient.get('/api/account/audit-logs', { params: fallbackParams });
        const body = fallbackRes?.data ?? fallbackRes;
        return {
          entries: normalizeAuditEntries(body),
          pagination: body && typeof body.pagination === 'object' ? body.pagination : null,
        };
      } catch (innerErr) {
        return { entries: [], pagination: null };
      }
    }
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