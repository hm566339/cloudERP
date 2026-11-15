import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Target,
  Plus,
  Kanban,
  Table as TableIcon,
  CheckCircle2,
  XCircle,
  TrendingUp,
  DollarSign,
  Filter,
  Layers
} from 'lucide-react';
import { PageHeader, ConfirmModal } from '../../../components/common';
import DataTable from '../../../components/data-table/DataTable';
import CrmKanbanBoard from '../components/CrmKanbanBoard';
import OpportunityFormModal from '../components/OpportunityFormModal';
import {
  useGetCrmPipelinesQuery,
  useGetCrmKanbanQuery,
  useGetCrmOpportunitiesQuery,
  useUpdateOpportunityStageMutation,
  useCloseOpportunityMutation,
} from '../../../api/sales-crm/crm.api';

export default function OpportunitiesPage() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const crmBase = companyId ? `/company/${companyId}/sales-crm` : '/sales-crm';

  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [closingDeal, setClosingDeal] = useState(null); // { id, status: 'WON' | 'LOST' }
  const [lostReason, setLostReason] = useState('PRICE_HIGH');

  const { data: pipelinesRes } = useGetCrmPipelinesQuery(companyId);
  const pipelines = pipelinesRes?.data || [];
  const currentPipelineId = selectedPipelineId || pipelines[0]?.id;

  const { data: kanbanRes, isLoading: isKanbanLoading, refetch: refetchKanban } = useGetCrmKanbanQuery(
    { pipelineId: currentPipelineId, companyId },
    { skip: !currentPipelineId }
  );

  const { data: oppsRes, isLoading: isTableLoading, refetch: refetchTable } = useGetCrmOpportunitiesQuery(
    { pipelineId: currentPipelineId, companyId },
    { skip: !currentPipelineId }
  );

  const [updateStage] = useUpdateOpportunityStageMutation();
  const [closeOpportunity, { isLoading: isClosing }] = useCloseOpportunityMutation();

  const kanbanColumns = kanbanRes?.data?.columns || [];
  const opportunities = oppsRes?.data?.content || oppsRes?.data || [];

  const totalValue = opportunities.reduce((acc, o) => acc + (Number(o.dealValue) || 0), 0);
  const weightedValue = opportunities.reduce((acc, o) => {
    const val = Number(o.dealValue) || 0;
    const prob = Number(o.probabilityPercent) || 50;
    return acc + (val * prob) / 100;
  }, 0);

  const handleStageChange = async (dealId, newStageId) => {
    try {
      await updateStage({
        id: dealId,
        stageId: newStageId,
        companyId,
      }).unwrap();
      refetchKanban();
      refetchTable();
    } catch (err) {
      console.error('Failed to update deal stage', err);
    }
  };

  const handleCloseConfirm = async () => {
    if (!closingDeal) return;
    try {
      await closeOpportunity({
        id: closingDeal.id,
        isWon: closingDeal.status === 'WON',
        lostReason: closingDeal.status === 'LOST' ? lostReason : null,
        companyId,
      }).unwrap();
      setClosingDeal(null);
      refetchKanban();
      refetchTable();
    } catch (err) {
      console.error('Failed to close opportunity', err);
    }
  };

  const tableColumns = [
    {
      header: 'Deal Title',
      accessorKey: 'title',
      cell: ({ row }) => (
        <span className="font-semibold text-zinc-900 dark:text-white text-xs">
          {row.original.title}
        </span>
      ),
    },
    {
      header: 'Stage',
      accessorKey: 'stageName',
      cell: ({ row }) => (
        <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary">
          {row.original.stageName}
        </span>
      ),
    },
    {
      header: 'Deal Value',
      accessorKey: 'dealValue',
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-xs text-zinc-900 dark:text-white">
          ₹{(row.original.dealValue || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      header: 'Win Probability',
      accessorKey: 'probabilityPercent',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs">{row.original.probabilityPercent || 50}%</span>
        </div>
      ),
    },
    {
      header: 'Close Date',
      accessorKey: 'expectedCloseDate',
      cell: ({ row }) => (
        <span className="text-xs text-zinc-500">
          {row.original.expectedCloseDate ? new Date(row.original.expectedCloseDate).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={() => setClosingDeal({ id: row.original.id, status: 'WON' })}
            className="p-1.5 text-zinc-400 hover:text-emerald-500 rounded"
            title="Mark Won"
          >
            <CheckCircle2 size={14} />
          </button>
          <button
            onClick={() => setClosingDeal({ id: row.original.id, status: 'LOST' })}
            className="p-1.5 text-zinc-400 hover:text-rose-500 rounded"
            title="Mark Lost"
          >
            <XCircle size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Opportunities & Pipelines"
        subtitle="Visual deal progression, Kanban pipeline forecasting, and revenue pipeline."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`${crmBase}/pipelines`)}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <Layers size={13} /> Configure Pipelines
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5"
            >
              <Plus size={14} /> New Opportunity
            </button>
          </div>
        }
      />

      {/* Pipeline Toolbar & Forecast Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <select
            value={currentPipelineId || ''}
            onChange={(e) => setSelectedPipelineId(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1C202B] text-zinc-800 dark:text-[#E6E8EE]"
          >
            {pipelines.map((p) => (
              <option key={p.id} value={p.id}>
                Pipeline: {p.name} {p.isDefault ? '(Default)' : ''}
              </option>
            ))}
          </select>

          <div className="flex items-center bg-zinc-100 dark:bg-[#1C202B] p-0.5 rounded-lg border border-zinc-200 dark:border-[#2A2F3D]">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-[#161922] shadow text-primary'
                  : 'text-zinc-500'
              }`}
            >
              <Kanban size={13} /> Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-[#161922] shadow text-primary'
                  : 'text-zinc-500'
              }`}
            >
              <TableIcon size={13} /> Table
            </button>
          </div>
        </div>

        {/* Live Forecast Snapshot */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">Pipeline Total:</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-white">
              ₹{(totalValue / 100000).toFixed(1)}L
            </span>
          </div>
          <div className="h-4 w-px bg-zinc-200 dark:bg-[#2A2F3D]" />
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">Weighted Forecast:</span>
            <span className="font-mono font-bold text-emerald-600">
              ₹{(weightedValue / 100000).toFixed(1)}L
            </span>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'kanban' ? (
        <CrmKanbanBoard
          columns={kanbanColumns}
          onStageChange={handleStageChange}
          onOpportunityClick={(opp) => console.log('View opp', opp)}
        />
      ) : (
        <DataTable
          data={opportunities}
          columns={tableColumns}
          isLoading={isTableLoading}
          enablePagination={true}
        />
      )}

      {/* Modals */}
      <OpportunityFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        companyId={companyId}
        onSuccess={() => {
          refetchKanban();
          refetchTable();
        }}
      />

      <ConfirmModal
        isOpen={!!closingDeal}
        onClose={() => setClosingDeal(null)}
        onConfirm={handleCloseConfirm}
        title={closingDeal?.status === 'WON' ? 'Mark Opportunity as Won' : 'Mark Opportunity as Lost'}
        message={
          closingDeal?.status === 'WON'
            ? 'Congratulations! Marking this deal Won locks the closed stage at 100% and triggers downstream sales order creation.'
            : 'Marking this deal Lost records the loss reason for revenue attribution analysis.'
        }
        confirmText={isClosing ? 'Updating...' : closingDeal?.status === 'WON' ? 'Confirm Closed Won' : 'Confirm Closed Lost'}
        variant={closingDeal?.status === 'WON' ? 'primary' : 'danger'}
      />
    </div>
  );
}

