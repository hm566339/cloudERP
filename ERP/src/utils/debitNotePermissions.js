/**
 * Debit Note Workflow Permission Helpers
 * 
 * Centralized permission logic for Debit Note workflow actions.
 * Uses the role → module → permission mapping from rbac.js via rbacUtils.js.
 * 
 * Permission required: APPROVE on DEBIT_NOTES module
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

const MODULE = 'DEBIT_NOTES';

// ─── Individual Permission Checks ───────────────────────────────────────────

/** Can the current user perform workflow actions on debit notes? (requires APPROVE on DEBIT_NOTES) */
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
    confirmTitle: 'Submit Debit Note',
    confirmMessage: 'Are you sure you want to submit this debit note for approval?',
    successMessage: 'Debit note submitted successfully.',
  },
  approve: {
    key: 'approve',
    label: 'Approve',
    mutationKey: 'approveMutation',
    color: 'emerald',
    icon: 'Check',
    confirm: true,
    confirmTitle: 'Approve Debit Note',
    confirmMessage: 'Are you sure you want to approve this debit note?',
    successMessage: 'Debit note approved successfully.',
  },
  reject: {
    key: 'reject',
    label: 'Reject',
    mutationKey: 'rejectMutation',
    color: 'rose',
    icon: 'X',
    confirm: true,
    confirmTitle: 'Reject Debit Note',
    confirmMessage: 'Are you sure you want to reject this debit note?',
    successMessage: 'Debit note rejected successfully.',
  },
  post: {
    key: 'post',
    label: 'Post to GL',
    mutationKey: 'postMutation',
    color: 'indigo',
    icon: 'BookOpen',
    confirm: true,
    confirmTitle: 'Post Debit Note',
    confirmMessage: 'Are you sure you want to post this debit note to the General Ledger?',
    successMessage: 'Debit note posted successfully.',
  },
  reverse: {
    key: 'reverse',
    label: 'Reverse',
    mutationKey: 'reverseMutation',
    color: 'amber',
    icon: 'Undo',
    confirm: true,
    confirmTitle: 'Reverse Debit Note',
    confirmMessage: 'Are you sure you want to reverse this posted debit note? This will undo the GL posting.',
    successMessage: 'Debit note reversed successfully.',
  },
  cancel: {
    key: 'cancel',
    label: 'Cancel',
    mutationKey: 'cancelMutation',
    color: 'rose',
    icon: 'XCircle',
    confirm: true,
    confirmTitle: 'Cancel Debit Note',
    confirmMessage: 'Are you sure you want to cancel this debit note? This action cannot be undone.',
    successMessage: 'Debit note cancelled successfully.',
  },
};

// ─── Status → Action Mapping ────────────────────────────────────────────────

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
  // Terminal statuses
  REJECTED: [],
  CANCELLED: [],
  REVERSED: [],
};

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * Returns the list of workflow actions available for the current user
 * given the debit note's current status.
 */
export const getDebitNoteWorkflowActions = (state, status) => {
  if (!status) return [];

  const statusUpper = status.toUpperCase();
  const possibleActions = STATUS_ACTION_MAP[statusUpper] || [];

  return possibleActions.filter(action => {
    if (!action.permissionCheck) return true;
    return action.permissionCheck(state);
  });
};

export const hasDebitNoteWorkflowAccess = (state) => canPerformWorkflowAction(state);
