/**
 * Credit Note Workflow Permission Helpers
 * 
 * Centralized permission logic for Credit Note workflow actions.
 * Uses the role → module → permission mapping from rbac.js via rbacUtils.js.
 * 
 * Permission required: APPROVE on CREDIT_NOTES module
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

const MODULE = 'CREDIT_NOTES';

// ─── Individual Permission Checks ───────────────────────────────────────────

/** Can the current user perform workflow actions on credit notes? (requires APPROVE on CREDIT_NOTES) */
export const canPerformWorkflowAction = (state) => hasPermission(state, MODULE, 'APPROVE');

// ─── Action Definitions ─────────────────────────────────────────────────────

const ACTION_DEFS = {
  submit: {
    key: 'submit',
    label: 'Submit',
    mutationKey: 'submitMutation',
    color: 'blue',
    icon: 'Send',
    confirm: true,
    confirmTitle: 'Submit Credit Note',
    confirmMessage: 'Are you sure you want to submit this credit note for approval?',
    successMessage: 'Credit note submitted successfully.',
  },
  approve: {
    key: 'approve',
    label: 'Approve',
    mutationKey: 'approveMutation',
    color: 'emerald',
    icon: 'Check',
    confirm: true,
    confirmTitle: 'Approve Credit Note',
    confirmMessage: 'Are you sure you want to approve this credit note?',
    successMessage: 'Credit note approved successfully.',
  },
  reject: {
    key: 'reject',
    label: 'Reject',
    mutationKey: 'rejectMutation',
    color: 'rose',
    icon: 'X',
    confirm: true,
    confirmTitle: 'Reject Credit Note',
    confirmMessage: 'Are you sure you want to reject this credit note?',
    successMessage: 'Credit note rejected successfully.',
  },
  post: {
    key: 'post',
    label: 'Post to GL',
    mutationKey: 'postMutation',
    color: 'indigo',
    icon: 'BookOpen',
    confirm: true,
    confirmTitle: 'Post Credit Note',
    confirmMessage: 'Are you sure you want to post this credit note to the General Ledger?',
    successMessage: 'Credit note posted successfully.',
  },
  reverse: {
    key: 'reverse',
    label: 'Reverse',
    mutationKey: 'reverseMutation',
    color: 'amber',
    icon: 'Undo',
    confirm: true,
    confirmTitle: 'Reverse Credit Note',
    confirmMessage: 'Are you sure you want to reverse this posted credit note? This will undo the GL posting.',
    successMessage: 'Credit note reversed successfully.',
  },
  cancel: {
    key: 'cancel',
    label: 'Cancel',
    mutationKey: 'cancelMutation',
    color: 'rose',
    icon: 'XCircle',
    confirm: true,
    confirmTitle: 'Cancel Credit Note',
    confirmMessage: 'Are you sure you want to cancel this credit note? This action cannot be undone.',
    successMessage: 'Credit note cancelled successfully.',
  },
};

// ─── Status → Action Mapping ────────────────────────────────────────────────

const STATUS_ACTION_MAP = {
  DRAFT: [
    { ...ACTION_DEFS.submit, permissionCheck: canPerformWorkflowAction },
    { ...ACTION_DEFS.cancel, permissionCheck: canPerformWorkflowAction },
  ],
  SUBMITTED: [
    { ...ACTION_DEFS.approve, permissionCheck: canPerformWorkflowAction },
    { ...ACTION_DEFS.reject,  permissionCheck: canPerformWorkflowAction },
  ],
  APPROVED: [
    { ...ACTION_DEFS.post,   permissionCheck: canPerformWorkflowAction },
  ],
  POSTED: [
    { ...ACTION_DEFS.reverse, permissionCheck: canPerformWorkflowAction },
  ],
  REVERSED: [
    { ...ACTION_DEFS.cancel, permissionCheck: canPerformWorkflowAction },
  ],
  // Terminal statuses
  REJECTED: [],
  CANCELLED: [],
};

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * Returns the list of workflow actions available for the current user
 * given the credit note's current status.
 */
export const getCreditNoteWorkflowActions = (state, status) => {
  if (!status) return [];

  const statusUpper = status.toUpperCase();
  const possibleActions = STATUS_ACTION_MAP[statusUpper] || [];

  return possibleActions.filter(action => {
    if (!action.permissionCheck) return true;
    return action.permissionCheck(state);
  });
};

export const hasCreditNoteWorkflowAccess = (state) => canPerformWorkflowAction(state);
