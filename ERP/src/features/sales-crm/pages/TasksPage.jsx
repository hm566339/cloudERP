import React, { useState } from 'react';
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
import { PageHeader } from '../../../components/common';
import DataTable from '../../../components/data-table/DataTable';
import {
  useGetCrmTasksQuery,
  useCompleteCrmTaskMutation,
} from '../../../api/sales-crm/crm.api';
import TaskFormModal from '../components/TaskFormModal';

export default function TasksPage() {
  const { companyId } = useParams();
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('PENDING');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: tasksRes, isLoading, refetch } = useGetCrmTasksQuery({
    companyId,
    priority: selectedPriority || undefined,
    status: selectedStatus || undefined,
  });

  const [completeTask] = useCompleteCrmTaskMutation();

  const tasks = tasksRes?.data || [];

  const handleToggleComplete = async (taskId) => {
    try {
      await completeTask({ id: taskId, companyId }).unwrap();
      refetch();
    } catch (err) {
      console.error('Failed to complete task', err);
    }
  };

  const columns = [
    {
      header: 'Task Title & Description',
      accessorKey: 'title',
      cell: ({ row }) => {
        const t = row.original;
        const isCompleted = t.status === 'COMPLETED';
        return (
          <div className="flex items-start gap-2.5">
            <button
              onClick={() => !isCompleted && handleToggleComplete(t.id)}
              disabled={isCompleted}
              className={`mt-0.5 rounded transition-colors ${
                isCompleted ? 'text-emerald-500' : 'text-zinc-400 hover:text-emerald-500'
              }`}
            >
              {isCompleted ? <CheckCircle2 size={16} /> : <CheckSquare size={16} />}
            </button>
            <div className="space-y-0.5">
              <span className={`font-semibold text-xs block ${isCompleted ? 'line-through text-zinc-400' : 'text-zinc-900 dark:text-white'}`}>
                {t.title}
              </span>
              {t.description && <span className="text-[11px] text-zinc-500 block">{t.description}</span>}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Target Entity',
      accessorKey: 'entityType',
      cell: ({ row }) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 dark:bg-[#1C202B] text-zinc-700 dark:text-[#E6E8EE]">
          {row.original.entityType || 'LEAD'}
        </span>
      ),
    },
    {
      header: 'Priority',
      accessorKey: 'priority',
      cell: ({ row }) => {
        const p = row.original.priority || 'MEDIUM';
        let color = 'bg-zinc-100 text-zinc-600';
        if (p === 'URGENT') color = 'bg-rose-500/10 text-rose-500 font-bold';
        else if (p === 'HIGH') color = 'bg-amber-500/10 text-amber-600 font-semibold';
        else if (p === 'MEDIUM') color = 'bg-blue-500/10 text-blue-600';

        return (
          <span className={`px-2 py-0.5 rounded text-[11px] ${color}`}>
            {p}
          </span>
        );
      },
    },
    {
      header: 'Due Date',
      accessorKey: 'dueDate',
      cell: ({ row }) => {
        const date = row.original.dueDate ? new Date(row.original.dueDate) : null;
        const isOverdue = date && date < new Date() && row.original.status !== 'COMPLETED';

        return (
          <div className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-rose-500 font-bold' : 'text-zinc-500'}`}>
            <Clock size={12} />
            <span>{date ? date.toLocaleDateString() : 'Today'}</span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="CRM Action Tasks"
        subtitle={`Tracking ${tasks.length} sales follow-ups, calls, and action items.`}
        actions={
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5"
          >
            <Plus size={14} /> New Task
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1C202B] text-zinc-800 dark:text-[#E6E8EE]"
          >
            <option value="PENDING">Pending Tasks</option>
            <option value="COMPLETED">Completed Tasks</option>
            <option value="">All Tasks</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1C202B] text-zinc-800 dark:text-[#E6E8EE]"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      <DataTable
        data={tasks}
        columns={columns}
        isLoading={isLoading}
        enablePagination={true}
      />

      <TaskFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        companyId={companyId}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

