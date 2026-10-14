import React, { useMemo, useState } from 'react';
import { Check, RefreshCw, X, ExternalLink } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';

import { workflowTasksApi } from '../../../api/account';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import PageHeader from '../../../components/common/PageHeader';
import DataTableStatusBadge from '../../../components/data-table/DataTableStatusBadge';
import { confirmDialog } from '../../../utils/confirmDialog';
import { addAlert } from '../../notifications/notificationSlice';
import { useApiMutation, useApiQuery } from '../../../hooks/useApi';
import useListQuery from '../../../hooks/useListQuery';
import SearchInput from '../../../components/common/SearchInput';
import Pagination from '../../../components/common/Pagination';

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
  const selectedCompany = useAppSelector((state) => state.company?.selectedCompany);
  const currentUser = useAppSelector((state) => state.auth?.user);
  const companyId =
    routeCompanyId ||
    selectedCompany?.id ||
    selectedCompany?.code ||
    currentUser?.companyId ||
    currentUser?.companyCode ||
    JSON.parse(localStorage.getItem('selected_company') || '{}')?.id ||
    JSON.parse(localStorage.getItem('auth_user') || '{}')?.companyCode ||
    null;
  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    searchTerm,
    setSearch,
    debouncedSearch,
  } = useListQuery(null, { defaultPageSize: 10, searchParam: 'search' });

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
          <div className="w-full max-w-md">
            <SearchInput
              value={searchTerm}
              onChange={setSearch}
              placeholder="Search by document, ID, or status"
              isLoading={isLoading}
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>Rows</span>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
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
                        <Link
                          to={`/workflows/transactions/${task.transactionId || task.workflowTransactionId || task.id}`}
                          className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                        >
                          <ExternalLink size={14} /> Review
                        </Link>
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
          <div className="border-t border-zinc-200 px-4 py-3">
            <Pagination
              page={page}
              totalPages={totalPages}
              totalElements={filteredTasks.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </div>
    </div>
  );
}