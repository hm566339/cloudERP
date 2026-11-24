import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  CheckSquare,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Calendar,
  Building2,
  Users
} from 'lucide-react';
import TasksActivitiesHeader from '../components/TasksActivitiesHeader';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import useUrlFilters from '../../../hooks/useUrlFilters';
import {
  useGetCrmTasksQuery,
  useCompleteCrmTaskMutation,
} from '../../../api/sales-crm/crm.api';
import TaskFormModal from '../components/TaskFormModal';
import useCrmPermissions from '../hooks/useCrmPermissions';

const DEFAULT_COLUMNS = [
  'title',
  'entityType',
  'priority',
  'dueDate',
  'status',
];

export default function TasksPage() {
  const { companyId } = useParams();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);

  const {
    page, setPage, setPageSize, apiParams,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10 });

  const { data: tasksRes, isLoading, refetch, isFetching } = useGetCrmTasksQuery({
    companyId,
    priority: filters.priority || undefined,
    status: filters.status !== undefined ? (filters.status || undefined) : 'PENDING',
  });

  const [completeTask] = useCompleteCrmTaskMutation();

  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.content)) return res.data.content;
    return [];
  };

  const allTasks = toArray(tasksRes);
  
  // Client-side search and pagination if backend returns unpaginated list
  const filteredTasks = useMemo(() => {
    let res = allTasks;
    if (filters.searchKey && filters.searchKey.trim()) {
      const q = filters.searchKey.toLowerCase();
      res = res.filter(t => (t.title || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q));
    }
    return res;
  }, [allTasks, filters.searchKey]);

  const totalElements = filteredTasks.length;
  const pageSize = apiParams.size || 10;
  const totalPages = Math.ceil(totalElements / pageSize) || 1;
  const paginatedTasks = useMemo(() => {
    const start = ((page || 1) - 1) * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, page, pageSize]);

  const handleToggleComplete = async (taskId) => {
    try {
      await completeTask({ id: taskId, companyId }).unwrap();
      refetch();
    } catch (err) {
      console.error('Failed to complete task', err);
    }
  };

  const handleExport = () => {
    if (!filteredTasks || filteredTasks.length === 0) return;
    const headers = ['Title', 'Description', 'Target Entity', 'Priority', 'Due Date', 'Status'];
    const csvRows = [headers.join(',')];
    filteredTasks.forEach((t) => {
      const title = `"${(t.title || '').replace(/"/g, '""')}"`;
      const desc = `"${(t.description || '').replace(/"/g, '""')}"`;
      const entity = t.entityType || 'LEAD';
      const priority = t.priority || 'MEDIUM';
      const due = t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '';
      const status = t.status || 'PENDING';
      csvRows.push([title, desc, entity, priority, `"${due}"`, status].join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `crm-tasks-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const basicFilters = useMemo(() => [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Tasks', value: '' },
        { label: 'Pending Tasks', value: 'PENDING' },
        { label: 'Completed Tasks', value: 'COMPLETED' },
      ],
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { label: 'All Priorities', value: '' },
        { label: 'Urgent', value: 'URGENT' },
        { label: 'High', value: 'HIGH' },
        { label: 'Medium', value: 'MEDIUM' },
        { label: 'Low', value: 'LOW' },
      ],
    },
  ], []);

  const columns = useMemo(() => [
    {
      id: 'title',
      label: 'TASK TITLE & DESCRIPTION',
      sortable: true,
      headerClassName: 'w-2/5 min-w-[260px]',
      className: 'w-2/5 min-w-[260px]',
      render: (val, t) => {
        const isCompleted = t?.status === 'COMPLETED';
        return (
          <div className="flex items-start gap-2.5">
            <button
              type="button"
              onClick={() => !isCompleted && handleToggleComplete(t?.id)}
              disabled={isCompleted}
              className={`mt-0.5 rounded transition-colors ${
                isCompleted ? 'text-emerald-500' : 'text-zinc-400 hover:text-emerald-500'
              }`}
            >
              {isCompleted ? <CheckCircle2 size={16} /> : <CheckSquare size={16} />}
            </button>
            <div className="space-y-0.5">
              <span className={`font-semibold text-xs block ${isCompleted ? 'line-through text-zinc-400' : 'text-zinc-900 dark:text-white'}`}>
                {t?.title || val}
              </span>
              {t?.description && <span className="text-[11px] text-zinc-500 block">{t.description}</span>}
            </div>
          </div>
        );
      },
    },
    {
      id: 'entityType',
      label: 'TARGET ENTITY',
      sortable: true,
      headerClassName: 'w-48',
      className: 'w-48 whitespace-nowrap',
      render: (val, t) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 dark:bg-[#1C202B] text-zinc-700 dark:text-[#E6E8EE]">
          {t?.entityType || val || 'LEAD'}
        </span>
      ),
    },
    {
      id: 'priority',
      label: 'PRIORITY',
      sortable: true,
      headerClassName: 'w-36',
      className: 'w-36 whitespace-nowrap',
      render: (val, t) => {
        const p = t?.priority || val || 'MEDIUM';
        let statusType = 'neutral';
        if (p === 'URGENT') statusType = 'danger';
        else if (p === 'HIGH') statusType = 'warning';
        else if (p === 'MEDIUM') statusType = 'primary';

        return (
          <DataTableStatusBadge
            status={p}
            variant={statusType}
          />
        );
      },
    },
    {
      id: 'dueDate',
      label: 'DUE DATE',
      sortable: true,
      headerClassName: 'w-44',
      className: 'w-44 whitespace-nowrap',
      render: (val, t) => {
        const date = t?.dueDate || val ? new Date(t?.dueDate || val) : null;
        const isOverdue = date && date < new Date() && t?.status !== 'COMPLETED';

        return (
          <div className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-rose-500 font-bold' : 'text-zinc-500'}`}>
            <Clock size={12} />
            <span>{date ? date.toLocaleDateString() : 'Today'}</span>
          </div>
        );
      },
    },
    {
      id: 'status',
      label: 'STATUS',
      sortable: true,
      headerClassName: 'w-36',
      className: 'w-36 whitespace-nowrap',
      render: (val, t) => (
        <DataTableStatusBadge
          status={t?.status || val || 'PENDING'}
          variant={t?.status === 'COMPLETED' ? 'success' : 'neutral'}
        />
      ),
    },
  ], []);

  const { activities: actPerms } = useCrmPermissions();

  const rowActions = useMemo(() => {
    const actions = [];
    if (actPerms.canComplete) {
      actions.push({
        key: 'complete',
        label: 'Complete Task',
        icon: CheckCircle2,
        tooltip: 'Mark Completed',
        hidden: (row) => row.status === 'COMPLETED',
        className: 'hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20',
        onClick: (row) => handleToggleComplete(row.id),
      });
    }
    return actions;
  }, [actPerms.canComplete]);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <TasksActivitiesHeader
        activeTab="tasks"
        actions={
          actPerms.canCreate ? (
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="btn-primary flex items-center gap-1.5 text-xs font-semibold h-8 px-3.5 cursor-pointer rounded-lg shadow-sm"
            >
              <Plus size={15} />
              <span>New Task</span>
            </button>
          ) : null
        }
      />

      <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-5 min-h-0">
        <div className="flex-1 flex flex-col min-h-[300px]">
          <div className="flex-1 min-h-[300px]">
            <DataTable
              permissionFeature="CRM_ACTIVITIES"
              selectable={false}
              showIndex={true}
              columns={columns}
              data={paginatedTasks}
              rowKey="id"
              loading={isLoading}
              isRefreshing={isFetching}

              // Search
              searchable
              searchValue={filters.searchKey || ''}
              searchPlaceholder="Search task title, description..."
              onSearchChange={(val) => setFilter('searchKey', val)}

              // Filters
              filters={basicFilters}
              filterValues={filters}
              onFilterChange={setFilter}

              // Reset & Refresh
              onReset={resetFilters}
              onRefresh={refetch}
              onExport={handleExport}
              exportLabel="Export"

              // Column Visibility
              visibleColumns={visibleColumns}
              onVisibleColumnsChange={setVisibleColumns}

              // Sorting
              sort={{ key: sortBy, direction: sortOrder }}
              onSortChange={({ key }) => handleColumnSort(key)}

              // Row Actions
              rowActions={rowActions}

              // Pagination
              pagination={{
                page,
                pageSize,
                totalPages,
                totalElements,
              }}
              pageIndexBase={0}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              itemName="tasks"

              // Empty State
              emptyMessage="No tasks found"
              emptyDescription="Try adjusting your status or priority filters to find action items."
            />
          </div>
        </div>
      </div>

      <TaskFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        companyId={companyId}
        onSuccess={() => refetch()}
      />
    </div>
  );
}


