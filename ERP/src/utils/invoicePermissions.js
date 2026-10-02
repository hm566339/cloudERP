/**
 * Purchase Invoice Workflow Permission Helpers
 * 
 * Centralized permission logic for AP Invoice workflow actions.
 * Uses the role → module → permission mapping from rbac.js via rbacUtils.js.
 * 
 * No hardcoded role names — all checks go through hasPermission(state, module, action).
 */
import { hasPermission, hasModuleAccess } from './rbacUtils';

const MODULE = 'PURCHASE_INVOICES';

// ─── Individual Permission Checks ───────────────────────────────────────────

/** Can the current user edit a purchase invoice? (requires UPDATE on PURCHASE_INVOICES) */
export const canEditInvoice = (state) => hasPermission(state, MODULE, 'UPDATE');

/** Can the current user delete a purchase invoice? (requires DELETE on PURCHASE_INVOICES) */
export const canDeleteInvoice = (state) => hasPermission(state, MODULE, 'DELETE');

/** Can the current user submit an invoice for approval? (requires UPDATE on PURCHASE_INVOICES) */
export const canSubmitForApproval = (state) => hasPermission(state, MODULE, 'UPDATE');

/** Can the current user approve an invoice? (requires APPROVE on PURCHASE_INVOICES) */
export const canApproveInvoice = (state) => hasPermission(state, MODULE, 'APPROVE');

/** Can the current user reject an invoice? (requires APPROVE on PURCHASE_INVOICES) */
export const canRejectInvoice = (state) => hasPermission(state, MODULE, 'APPROVE');

/** Can the current user cancel an invoice? (requires UPDATE on PURCHASE_INVOICES) */
export const canCancelInvoice = (state) => hasPermission(state, MODULE, 'UPDATE');

/** Can the current user post an invoice to GL? (requires APPROVE on PURCHASE_INVOICES) */
export const canPostInvoice = (state) => hasPermission(state, MODULE, 'APPROVE');

/** Can the current user void an invoice? (requires APPROVE on PURCHASE_INVOICES) */
export const canVoidInvoice = (state) => hasPermission(state, MODULE, 'APPROVE');

/** Can the current user reverse a GL posting? (requires APPROVE on PURCHASE_INVOICES) */
export const canReverseInvoice = (state) => hasPermission(state, MODULE, 'APPROVE');

/** Can the current user write off an invoice? (requires APPROVE on PURCHASE_INVOICES) */
export const canWriteOffInvoice = (state) => hasPermission(state, MODULE, 'APPROVE');

/** Can the current user record a payment? (requires UPDATE on PURCHASE_INVOICES) */
export const canRecordPayment = (state) => hasPermission(state, MODULE, 'UPDATE');

/** Is the current user read-only? (no UPDATE, no DELETE, no APPROVE) */
export const isReadOnly = (state) => {
  return !hasPermission(state, MODULE, 'UPDATE') &&
         !hasPermission(state, MODULE, 'DELETE') &&
         !hasPermission(state, MODULE, 'APPROVE');
};

// ─── Action Definitions ─────────────────────────────────────────────────────

/**
 * Each action definition contains:
 * - key: unique identifier used for rendering
 * - label: button text
 * - type: 'workflow' | 'edit' | 'payment' — determines handler
 * - color: tailwind color prefix for styling
 * - icon: lucide icon name (used by the component)
 * - confirm: whether to show a confirmation dialog before executing
 * - permissionCheck: function(state) → boolean
 */
const ACTION_DEFS = {
  edit: {
    key: 'edit',
    label: 'Edit Invoice',
    type: 'edit',
    color: 'zinc',
    icon: 'Edit',
    confirm: false,
  },
  submit: {
    key: 'submit',
    label: 'Submit for Approval',
    type: 'workflow',
    mutationKey: 'submitMutation',
    color: 'blue',
    icon: 'Send',
    confirm: false,
  },
  approve: {
    key: 'approve',
    label: 'Approve',
    type: 'workflow',
    mutationKey: 'approveMutation',
    color: 'emerald',
    icon: 'Check',
    confirm: true,
  },
  reject: {
    key: 'reject',
    label: 'Reject',
    type: 'workflow',
    mutationKey: 'rejectMutation',
    color: 'rose',
    icon: 'X',
    confirm: true,
  },
  cancel: {
    key: 'cancel',
    label: 'Cancel Invoice',
    type: 'workflow',
    mutationKey: 'cancelMutation',
    color: 'rose',
    icon: 'StopCircle',
    confirm: true,
  },
  postToGL: {
    key: 'postToGL',
    label: 'Post to GL',
    type: 'workflow',
    mutationKey: 'postMutation',
    color: 'blue',
    icon: 'BookOpen',
    confirm: true,
  },
  recordPayment: {
    key: 'recordPayment',
    label: 'Record Partial Payment',
    type: 'payment',
    color: 'emerald',
    icon: 'CreditCard',
    confirm: false,
  },
  void: {
    key: 'void',
    label: 'Void Invoice',
    type: 'workflow',
    mutationKey: 'voidMutation',
    color: 'rose',
    icon: 'XCircle',
    confirm: true,
  },
  reverse: {
    key: 'reverse',
    label: 'Reverse GL Posting',
    type: 'workflow',
    mutationKey: 'reverseMutation',
    color: 'rose',
    icon: 'Undo',
    confirm: true,
  },
  writeOff: {
    key: 'writeOff',
    label: 'Write Off',
    type: 'workflow',
    mutationKey: 'writeOffMutation',
    color: 'amber',
    icon: 'XCircle',
    confirm: true,
  },
};

// ─── Status → Action Mapping ────────────────────────────────────────────────

/**
 * Maps each invoice status to the actions that are allowed in that state,
 * along with the permission check function for each action.
 */
const STATUS_ACTION_MAP = {
  DRAFT: [
    { ...ACTION_DEFS.edit,    permissionCheck: canEditInvoice },
    { ...ACTION_DEFS.submit,  permissionCheck: canSubmitForApproval },
    { ...ACTION_DEFS.cancel,  permissionCheck: canCancelInvoice },
  ],
  PENDING_APPROVAL: [
    { ...ACTION_DEFS.approve, permissionCheck: canApproveInvoice },
    { ...ACTION_DEFS.reject,  permissionCheck: canRejectInvoice },
    { ...ACTION_DEFS.cancel,  permissionCheck: canCancelInvoice },
  ],
  APPROVED: [
    { ...ACTION_DEFS.postToGL, permissionCheck: canPostInvoice },
    { ...ACTION_DEFS.cancel,   permissionCheck: canCancelInvoice },
  ],
  POSTED: [
    { ...ACTION_DEFS.recordPayment, permissionCheck: canRecordPayment },
    { ...ACTION_DEFS.void,          permissionCheck: canVoidInvoice },
    { ...ACTION_DEFS.writeOff,      permissionCheck: canWriteOffInvoice },
    { ...ACTION_DEFS.reverse,       permissionCheck: canReverseInvoice },
  ],
  PARTIALLY_PAID: [
    { ...ACTION_DEFS.recordPayment, permissionCheck: canRecordPayment },
    { ...ACTION_DEFS.writeOff,      permissionCheck: canWriteOffInvoice },
  ],
  REJECTED: [
    { ...ACTION_DEFS.edit,   permissionCheck: canEditInvoice },
    { ...ACTION_DEFS.submit, permissionCheck: canSubmitForApproval },
  ],
  // Terminal statuses — no workflow actions
  PAID: [],
  CANCELLED: [],
  REVERSED: [],
  WRITTEN_OFF: [],
  VOIDED: [],
};

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * Returns the list of workflow actions available for the current user
 * given the invoice's status and payment status.
 *
 * @param {Object} state         - Full Redux state
 * @param {string} invoiceStatus - Current invoice status (e.g. 'DRAFT', 'POSTED')
 * @param {string} paymentStatus - Current payment status (e.g. 'UNPAID', 'PAID')
 * @returns {Array} Array of action objects the current user is allowed to perform
 */
export const getWorkflowActions = (state, invoiceStatus, paymentStatus) => {
  if (!invoiceStatus) return [];

  const status = invoiceStatus.toUpperCase();
  const possibleActions = STATUS_ACTION_MAP[status] || [];

  // Filter by user permissions
  const allowedActions = possibleActions.filter(action => {
    if (!action.permissionCheck) return true;
    return action.permissionCheck(state);
  });

  // For POSTED/PARTIALLY_PAID: hide payment if already fully paid
  if (paymentStatus && paymentStatus.toUpperCase() === 'PAID') {
    return allowedActions.filter(a => a.key !== 'recordPayment');
  }

  return allowedActions;
};
