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
import CustomSelect from '../../../components/common/CustomSelect';

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

  const [statusFilter, setStatusFilter] = useState('ALL');

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
    let result = tasks;
    if (statusFilter !== 'ALL') {
      result = result.filter((task) => {
        const s = (task.status || task.taskStatus || '').toUpperCase();
        return s === statusFilter;
      });
    }
    const query = searchTerm.trim().toLowerCase();
    if (!query) return result;
    return result.filter((task) => {
      const text = [task.documentType, task.documentId, task.transactionId, task.status, task.taskStatus].filter(Boolean).join(' ').toLowerCase();
      return text.includes(query);
    });
  }, [tasks, searchTerm, statusFilter]);

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
    <div className="animate-fade-in h-full overflow-y-auto p-4 sm:p-6 space-y-4 pb-8">
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

      <div className="rounded-xl border border-zinc-200 dark:border-border-dark bg-white dark:bg-card-dark shadow-sm">
        <div className="flex flex-col gap-3 border-b border-zinc-200 dark:border-border-dark p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5 max-w-lg">
            <div className="flex-1 min-w-[200px]">
              <SearchInput
                value={searchTerm}
                onChange={setSearch}
                placeholder="Search by document, ID, or status"
                isLoading={isLoading}
              />
            </div>
            <div className="w-full sm:w-36">
              <CustomSelect
                id="approval-status-filter"
                value={statusFilter}
                onChange={(e, val) => setStatusFilter(val !== undefined ? val : e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'APPROVED', label: 'Approved' },
                  { value: 'REJECTED', label: 'Rejected' },
                  { value: 'RETURNED', label: 'Returned' },
                ]}
                size="sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 self-end sm:self-auto">
            <span className="font-medium">Rows:</span>
            <div className="w-20">
              <CustomSelect
                id="approval-rows-per-page"
                value={pageSize}
                onChange={(e, val) => setPageSize(Number(val !== undefined ? val : e.target.value))}
                options={[
                  { value: 10, label: '10' },
                  { value: 20, label: '20' },
                  { value: 50, label: '50' },
                ]}
                size="sm"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto min-w-0 max-w-full custom-scrollbar">
          <table className="w-full min-w-[700px] text-left text-sm" aria-label="Approval Requests Table">
            <thead className="bg-zinc-50 dark:bg-hover-dark/40 text-xs uppercase tracking-wide text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-border-dark sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Document</th>
                <th scope="col" className="px-4 py-3 font-semibold">Transaction</th>
                <th scope="col" className="px-4 py-3 font-semibold">Assigned</th>
                <th scope="col" className="px-4 py-3 font-semibold">Due</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-border-dark/60">
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
                  <tr key={task.id} className="hover:bg-zinc-50/70 dark:hover:bg-hover-dark/30">
                    <td className="px-4 py-3 align-top">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">{formatType(task.documentType)}</div>
                      <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{task.documentId || '—'}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium text-zinc-700 dark:text-zinc-300">{task.transactionId || task.id || '—'}</div>
                    </td>
                    <td className="px-4 py-3 align-top text-zinc-600 dark:text-zinc-400">{formatDate(task.assignedAt)}</td>
                    <td className="px-4 py-3 align-top text-zinc-600 dark:text-zinc-400">{formatDate(task.dueAt)}</td>
                    <td className="px-4 py-3 align-top">
                      <DataTableStatusBadge status={task.status} label={task.status ? task.status.replace(/_/g, ' ') : 'Pending'} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/workflows/transactions/${task.transactionId || task.workflowTransactionId || task.id}`}
                          className="inline-flex items-center gap-1 rounded-md border border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 transition hover:bg-blue-100 dark:hover:bg-blue-900/50"
                        >
                          <ExternalLink size={14} /> Review
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleAction(task.id, 'approve')}
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 transition hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                          disabled={approveMutation.isLoading || rejectMutation.isLoading}
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAction(task.id, 'reject')}
                          className="inline-flex items-center gap-1 rounded-md border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-400 transition hover:bg-rose-100 dark:hover:bg-rose-900/50"
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
          <div className="border-t border-zinc-200 dark:border-border-dark px-4 py-3">
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