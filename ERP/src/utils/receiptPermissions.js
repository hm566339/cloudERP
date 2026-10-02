/**
 * Receipt Voucher Workflow Permission Helpers
 * 
 * Centralized permission logic for Receipt workflow actions.
 * Uses the role → module → permission mapping from rbac.js via rbacUtils.js.
 * 
 * No hardcoded role names — all checks go through hasPermission(state, module, action).
 * 
 * Permission required: APPROVE on RECEIPTS module
 * Applicable roles: SYSTEM_ADMIN, FINANCE_MANAGER
 * 
 * Status transitions:
 *   DRAFT       → Submit
 *   SUBMITTED   → Approve, Reject, Cancel
 *   APPROVED    → Post, Cancel
 *   POSTED      → Reverse
 *   REJECTED    → (no actions)
 *   CANCELLED   → (no actions)
 *   REVERSED    → (no actions)
 */
import { hasPermission } from './rbacUtils';

const MODULE = 'RECEIPTS';

// ─── Individual Permission Checks ───────────────────────────────────────────

/** Can the current user perform workflow actions on receipts? (requires APPROVE on RECEIPTS) */
export const canPerformWorkflowAction = (state) => hasPermission(state, MODULE, 'APPROVE');

// ─── Action Definitions ─────────────────────────────────────────────────────

/**
 * Each action definition contains:
 * - key: unique identifier used for rendering and mutation lookup
 * - label: button text
 * - color: tailwind color prefix for styling
 * - icon: lucide icon name (used by the component)
 * - confirm: whether to show a confirmation dialog before executing
 * - confirmTitle: title for the confirmation dialog
 * - confirmMessage: message for the confirmation dialog
 * - successMessage: toast message on success
 * - mutationKey: key to look up the mutation in the mutations map
 */
const ACTION_DEFS = {
  submit: {
    key: 'submit',
    label: 'Submit',
    mutationKey: 'submitMutation',
    color: 'blue',
    icon: 'Send',
    confirm: true,
    confirmTitle: 'Submit Receipt',
    confirmMessage: 'Are you sure you want to submit this receipt for approval?',
    successMessage: 'Receipt submitted successfully.',
  },
  approve: {
    key: 'approve',
    label: 'Approve',
    mutationKey: 'approveMutation',
    color: 'emerald',
    icon: 'Check',
    confirm: true,
    confirmTitle: 'Approve Receipt',
    confirmMessage: 'Are you sure you want to approve this receipt?',
    successMessage: 'Receipt approved successfully.',
  },
  reject: {
    key: 'reject',
    label: 'Reject',
    mutationKey: 'rejectMutation',
    color: 'rose',
    icon: 'X',
    confirm: true,
    confirmTitle: 'Reject Receipt',
    confirmMessage: 'Are you sure you want to reject this receipt?',
    successMessage: 'Receipt rejected successfully.',
  },
  post: {
    key: 'post',
    label: 'Post to GL',
    mutationKey: 'postMutation',
    color: 'indigo',
    icon: 'BookOpen',
    confirm: true,
    confirmTitle: 'Post Receipt',
    confirmMessage: 'Are you sure you want to post this receipt to the General Ledger?',
    successMessage: 'Receipt posted successfully.',
  },
  reverse: {
    key: 'reverse',
    label: 'Reverse',
    mutationKey: 'reverseMutation',
    color: 'amber',
    icon: 'Undo',
    confirm: true,
    confirmTitle: 'Reverse Receipt',
    confirmMessage: 'Are you sure you want to reverse this posted receipt? This will undo the GL posting.',
    successMessage: 'Receipt reversed successfully.',
  },
  cancel: {
    key: 'cancel',
    label: 'Cancel',
    mutationKey: 'cancelMutation',
    color: 'rose',
    icon: 'XCircle',
    confirm: true,
    confirmTitle: 'Cancel Receipt',
    confirmMessage: 'Are you sure you want to cancel this receipt? This action cannot be undone.',
    successMessage: 'Receipt cancelled successfully.',
  },
};

// ─── Status → Action Mapping ────────────────────────────────────────────────

/**
 * Maps each receipt status to the actions allowed in that state.
 * All workflow actions require APPROVE permission on RECEIPTS module.
 */
const STATUS_ACTION_MAP = {
  DRAFT: [
    { ...ACTION_DEFS.submit, permissionCheck: canPerformWorkflowAction },
  ],
  SUBMITTED: [
    { ...ACTION_DEFS.approve, permissionCheck: canPerformWorkflowAction },
    { ...ACTION_DEFS.reject,  permissionCheck: canPerformWorkflowAction },
    { ...ACTION_DEFS.cancel,  permissionCheck: canPerformWorkflowAction },
  ],
  APPROVED: [
    { ...ACTION_DEFS.post,   permissionCheck: canPerformWorkflowAction },
    { ...ACTION_DEFS.cancel, permissionCheck: canPerformWorkflowAction },
  ],
  POSTED: [
    { ...ACTION_DEFS.reverse, permissionCheck: canPerformWorkflowAction },
  ],
  // Terminal statuses — no workflow actions
  REJECTED: [],
  CANCELLED: [],
  REVERSED: [],
};

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * Returns the list of workflow actions available for the current user
 * given the receipt's current status.
 *
 * @param {Object} state          - Full Redux state
 * @param {string} receiptStatus  - Current receipt status (e.g. 'DRAFT', 'SUBMITTED', 'POSTED')
 * @returns {Array} Array of action objects the current user is allowed to perform
 */
export const getReceiptWorkflowActions = (state, receiptStatus) => {
  if (!receiptStatus) return [];

  const status = receiptStatus.toUpperCase();
  const possibleActions = STATUS_ACTION_MAP[status] || [];

  // Filter by user permissions
  return possibleActions.filter(action => {
    if (!action.permissionCheck) return true;
    return action.permissionCheck(state);
  });
};

/**
 * Checks if the current user has any workflow capability for receipts.
 * Useful for deciding whether to render the workflow actions section at all.
 */
export const hasReceiptWorkflowAccess = (state) => canPerformWorkflowAction(state);
