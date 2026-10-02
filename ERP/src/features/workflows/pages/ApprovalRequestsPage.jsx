import React, { useMemo, useState } from 'react';
import { Check, RefreshCw, X } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { workflowTasksApi } from '../../../api/account';
import { useAppDispatch } from '../../../app/hooks';
import PageHeader from '../../../components/common/PageHeader';
import DataTableStatusBadge from '../../../components/data-table/DataTableStatusBadge';
import { confirmDialog } from '../../../utils/confirmDialog';
import { addAlert } from '../../notifications/notificationSlice';
import { useApiMutation, useApiQuery } from '../../../hooks/useApi';

const formatType = (value) => {
  if (!value) return 'General';
  return String(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function ApprovalRequestsPage() {
  const dispatch = useAppDispatch();
  const { companyId: routeCompanyId } = useParams();
  const companyId = routeCompanyId || JSON.parse(localStorage.getItem('selected_company') || '{}')?.id || JSON.parse(localStorage.getItem('auth_user') || '{}')?.companyCode;
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, refetch } = useApiQuery(workflowTasksApi.getPending, {
    companyId,
    page,
    size: pageSize,
    sort: 'assignedAt,desc',
  }, { skip: !companyId });

  const tasks = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    const items = Array.isArray(data.items) ? data.items : Array.isArray(data.data) ? data.data : [];
    return items;
  }, [data]);

  const filteredTasks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return tasks;
    return tasks.filter((task) => {
      const text = [task.documentType, task.documentId, task.transactionId, task.status].filter(Boolean).join(' ').toLowerCase();
      return text.includes(query);
    });
  }, [tasks, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const pageItems = filteredTasks.slice(page * pageSize, (page + 1) * pageSize);

  const approveMutation = useApiMutation((taskId, comment) => workflowTasksApi.approve(taskId, comment));
  const rejectMutation = useApiMutation((taskId, comment) => workflowTasksApi.reject(taskId, comment));

  const handleAction = async (taskId, action) => {
    const confirmed = await confirmDialog({
      title: action === 'approve' ? 'Approve request' : 'Reject request',
      message: action === 'approve'
        ? 'This approval request will be marked as approved.'
        : 'This approval request will be marked as rejected.',
      confirmLabel: action === 'approve' ? 'Approve' : 'Reject',
      isDestructive: action === 'reject',
    });

    if (!confirmed) return;

    try {
      if (action === 'approve') {
        await approveMutation.mutateAsync([taskId, 'Approved from Approval Requests list']);
      } else {
        await rejectMutation.mutateAsync([taskId, 'Rejected from Approval Requests list']);
      }

      dispatch(addAlert({ type: 'success', message: action === 'approve' ? 'Approval request approved.' : 'Approval request rejected.' }));
      refetch();
    } catch (error) {
      dispatch(addAlert({
        type: 'error',
        message: error?.response?.data?.message || error?.message || 'Unable to process approval request.',
      }));
    }
  };

  return (
    <div className="animate-fade-in space-y-4 pb-8">
      <PageHeader
        title="Approval Requests"
        description="Review pending workflow tasks assigned to this company."
        action={{
          label: 'Refresh',
          icon: RefreshCw,
          onClick: refetch,
          variant: 'secondary',
          disabled: isLoading,
        }}
      />

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-md">
            <input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(0);
              }}
              placeholder="Search by document, ID, or status"
              className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-800 outline-none transition focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>Rows</span>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(0);
              }}
              className="h-9 rounded-lg border border-zinc-200 bg-zinc-50 px-2 text-sm text-zinc-700 outline-none focus:border-blue-500"
            >
              {[10, 20, 50].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Document</th>
                <th className="px-4 py-3 font-semibold">Transaction</th>
                <th className="px-4 py-3 font-semibold">Assigned</th>
                <th className="px-4 py-3 font-semibold">Due</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {isLoading ? (
                <tr>
                  <td className="px-4 py-10 text-center text-zinc-500" colSpan={6}>Loading pending approvals…</td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-zinc-500" colSpan={6}>No pending approval requests found.</td>
                </tr>
              ) : (
                pageItems.map((task) => (
                  <tr key={task.id} className="hover:bg-zinc-50/70">
                    <td className="px-4 py-3 align-top">
                      <div className="font-semibold text-zinc-900">{formatType(task.documentType)}</div>
                      <div className="mt-1 text-xs text-zinc-500">{task.documentId || '—'}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium text-zinc-700">{task.transactionId || task.id || '—'}</div>
                    </td>
                    <td className="px-4 py-3 align-top text-zinc-600">{formatDate(task.assignedAt)}</td>
                    <td className="px-4 py-3 align-top text-zinc-600">{formatDate(task.dueAt)}</td>
                    <td className="px-4 py-3 align-top">
                      <DataTableStatusBadge status={task.status} label={task.status ? task.status.replace(/_/g, ' ') : 'Pending'} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleAction(task.id, 'approve')}
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                          disabled={approveMutation.isLoading || rejectMutation.isLoading}
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAction(task.id, 'reject')}
                          className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
                          disabled={approveMutation.isLoading || rejectMutation.isLoading}
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && filteredTasks.length > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-zinc-200 px-4 py-3 text-sm text-zinc-600">
            <span>
              Showing {Math.min((page * pageSize) + 1, filteredTasks.length)}-{Math.min((page + 1) * pageSize, filteredTasks.length)} of {filteredTasks.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                disabled={page === 0}
                className="rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-xs">
                Page {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}