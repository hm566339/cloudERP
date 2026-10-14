import React from 'react';
import {
  Send, Check, X, BookOpen, Undo, XCircle,
  RefreshCw, FileText
} from 'lucide-react';
import { useApiMutation } from '../../../hooks/useApi';
import { receiptVouchersApi } from '../../../api/account';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { confirmDialog } from '../../../utils/confirmDialog';
import { getReceiptWorkflowActions } from '../../../utils/receiptPermissions';

/**
 * Icon lookup map for Lucide icons referenced by action definitions.
 */
const ICON_MAP = { Send, Check, X, BookOpen, Undo, XCircle };

/**
 * Tailwind color class map for action button styling.
 */
const COLOR_MAP = {
  blue:    { bg: 'bg-blue-50 hover:bg-blue-100',       text: 'text-blue-700',    icon: 'text-blue-500',    border: 'border-blue-200' },
  emerald: { bg: 'bg-emerald-50 hover:bg-emerald-100', text: 'text-emerald-700', icon: 'text-emerald-500', border: 'border-emerald-200' },
  rose:    { bg: 'bg-rose-50 hover:bg-rose-100',       text: 'text-rose-600',    icon: 'text-rose-500',    border: 'border-rose-200' },
  indigo:  { bg: 'bg-indigo-50 hover:bg-indigo-100',   text: 'text-indigo-700',  icon: 'text-indigo-500',  border: 'border-indigo-200' },
  amber:   { bg: 'bg-amber-50 hover:bg-amber-100',     text: 'text-amber-700',   icon: 'text-amber-500',   border: 'border-amber-200' },
  zinc:    { bg: 'bg-zinc-50 hover:bg-zinc-100',       text: 'text-zinc-700',    icon: 'text-zinc-400',    border: 'border-zinc-200' },
};

/**
 * ReceiptWorkflowActions — Reusable component for receipt status workflow.
 *
 * Renders workflow action buttons dynamically based on:
 *   - Current receipt status
 *   - User RBAC permissions (APPROVE on RECEIPTS module)
 *
 * @param {Object}   props
 * @param {string}   props.receiptId       - UUID of the receipt
 * @param {string}   props.receiptStatus   - Current status (DRAFT, SUBMITTED, APPROVED, POSTED, etc.)
 * @param {Function} props.onActionComplete - Callback after a successful action (e.g. refetch)
 * @param {'header'|'dropdown'|'sidebar'} [props.variant='header'] - Rendering style
 */
export default function ReceiptWorkflowActions({
  receiptId,
  receiptStatus,
  onActionComplete,
  variant = 'header',
}) {
  const dispatch = useAppDispatch();
  const authState = useAppSelector((state) => state.auth);

  // Get permitted actions for current user + status
  const workflowActions = getReceiptWorkflowActions(authState, receiptStatus);

  // Create mutations for all six workflow endpoints
  const submitMutation   = useApiMutation(() => receiptVouchersApi.submitReceipt(receiptId));
  const approveMutation  = useApiMutation(() => receiptVouchersApi.approveReceipt(receiptId));
  const rejectMutation   = useApiMutation(() => receiptVouchersApi.rejectReceipt(receiptId));
  const postMutation     = useApiMutation(() => receiptVouchersApi.postReceipt(receiptId));
  const reverseMutation  = useApiMutation(() => receiptVouchersApi.reverseReceipt(receiptId));
  const cancelMutation   = useApiMutation(() => receiptVouchersApi.cancelReceipt(receiptId));

  const mutations = {
    submitMutation,
    approveMutation,
    rejectMutation,
    postMutation,
    reverseMutation,
    cancelMutation,
  };

  /**
   * Executes a workflow action with optional confirmation dialog.
   */
  const handleAction = async (action) => {
    const mutation = mutations[action.mutationKey];
    if (!mutation) return;

    // Show confirmation dialog
    if (action.confirm) {
      const confirmed = await confirmDialog({
        title: action.confirmTitle,
        message: action.confirmMessage,
        confirmLabel: action.label,
        isDestructive: ['reject', 'cancel', 'reverse'].includes(action.key),
      });
      if (!confirmed) return;
    }

    try {
      await mutation.mutateAsync();
      dispatch(addAlert({ type: 'success', message: action.successMessage }));
      if (onActionComplete) onActionComplete();
    } catch (err) {
      const status = err?.response?.status;
      const msg = status === 403
        ? `You do not have permission to ${action.label.toLowerCase()} this receipt.`
        : (err?.response?.data?.message || err?.message || `Failed to ${action.label.toLowerCase()} receipt.`);
      dispatch(addAlert({ type: 'error', message: msg }));
    }
  };

  // If no actions are available, render nothing
  if (!workflowActions || workflowActions.length === 0) return null;

  // ─── Header Variant ─── Inline buttons in the page header
  if (variant === 'header') {
    return (
      <>
        {workflowActions.map((action) => {
          const IconComponent = ICON_MAP[action.icon] || FileText;
          const mutation = mutations[action.mutationKey];
          const loading = mutation?.isLoading || false;
          const colors = COLOR_MAP[action.color] || COLOR_MAP.zinc;

          return (
            <button
              key={action.key}
              onClick={() => handleAction(action)}
              disabled={loading}
              className={`h-9 px-4 text-[10.4px] font-semibold ${colors.text} ${colors.bg} border ${colors.border} rounded-lg transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading
                ? <RefreshCw size={14} className={`animate-spin ${colors.icon}`} />
                : <IconComponent size={14} className={colors.icon} />
              }
              {action.label}
            </button>
          );
        })}
      </>
    );
  }

  // ─── Dropdown Variant ─── Stacked items for a "More Actions" dropdown menu
  if (variant === 'dropdown') {
    return (
      <>
        {workflowActions.map((action) => {
          const IconComponent = ICON_MAP[action.icon] || FileText;
          const mutation = mutations[action.mutationKey];
          const loading = mutation?.isLoading || false;
          const colors = COLOR_MAP[action.color] || COLOR_MAP.zinc;

          return (
            <button
              key={action.key}
              onClick={() => handleAction(action)}
              disabled={loading}
              className={`w-full text-left px-4 py-2 hover:bg-zinc-50 flex items-center gap-2 ${colors.text} font-semibold border-t border-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed text-xs`}
            >
              {loading
                ? <RefreshCw size={14} className={`animate-spin ${colors.icon}`} />
                : <IconComponent size={14} className={colors.icon} />
              }
              {action.label}
            </button>
          );
        })}
      </>
    );
  }

  // ─── Sidebar Variant ─── Full-width buttons for the sidebar Quick Actions panel
  if (variant === 'sidebar') {
    return (
      <>
        {workflowActions.map((action) => {
          const IconComponent = ICON_MAP[action.icon] || FileText;
          const mutation = mutations[action.mutationKey];
          const loading = mutation?.isLoading || false;
          const colors = COLOR_MAP[action.color] || COLOR_MAP.zinc;

          return (
            <button
              key={action.key}
              onClick={() => handleAction(action)}
              disabled={loading}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium ${colors.text} hover:bg-zinc-50 rounded-lg transition-colors w-full text-left disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading
                ? <RefreshCw size={15} className={`animate-spin ${colors.icon}`} />
                : <IconComponent size={15} className={colors.icon} />
              }
              {action.label}
            </button>
          );
        })}
      </>
    );
  }

  return null;
}

/**
 * Helper to generate extraActions array for TableRowActions component.
 * Used in the receipt list page to add workflow items to the 3-dot menu.
 *
 * @param {Object}   params
 * @param {string}   params.receiptId       - UUID of the receipt
 * @param {string}   params.receiptStatus   - Current status
 * @param {Object}   params.state           - Full Redux state
 * @param {Function} params.onAction        - Callback (action) => void
 * @returns {Array} Array of { icon, tooltip, onClick, className } for TableRowActions
 */
export function getReceiptRowActions({ receiptStatus, state }) {
  const actions = getReceiptWorkflowActions(state, receiptStatus);
  return actions.map((action) => {
    const IconComponent = ICON_MAP[action.icon] || FileText;
    const colors = COLOR_MAP[action.color] || COLOR_MAP.zinc;
    return {
      icon: <IconComponent size={14} />,
      tooltip: action.label,
      className: `${colors.text} hover:bg-zinc-100`,
      actionDef: action, // Pass the full definition for the handler to use
    };
  });
}
