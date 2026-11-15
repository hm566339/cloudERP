import React, { useState, useMemo } from 'react';
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
import PageHeader from '../../../components/common/PageHeader';
import ConfirmModal from '../../../components/common/ConfirmModal';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import CrmKanbanBoard from '../components/CrmKanbanBoard';
import OpportunityFormModal from '../components/OpportunityFormModal';
import useUrlFilters from '../../../hooks/useUrlFilters';
import {
  useGetCrmPipelinesQuery,
  useGetCrmKanbanQuery,
  useGetCrmOpportunitiesQuery,
  useUpdateOpportunityStageMutation,
  useCloseOpportunityMutation,
} from '../../../api/sales-crm/crm.api';

const DEFAULT_COLUMNS = [
  'title',
  'stageName',
  'dealValue',
  'probabilityPercent',
  'expectedCloseDate',
];

export default function OpportunitiesPage() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const crmBase = companyId ? `/company/${companyId}/sales-crm` : '/sales-crm';

  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [closingDeal, setClosingDeal] = useState(null); // { id, status: 'WON' | 'LOST' }
  const [lostReason, setLostReason] = useState('PRICE_HIGH');
  const [selectedRows, setSelectedRows] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);

  const {
    page, setPage, setPageSize, apiParams,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10 });

  const { data: pipelinesRes } = useGetCrmPipelinesQuery(companyId);
  const pipelines = pipelinesRes?.data || [];
  const currentPipelineId = selectedPipelineId || pipelines[0]?.id;

  const { data: kanbanRes, isLoading: isKanbanLoading, refetch: refetchKanban } = useGetCrmKanbanQuery(
    { pipelineId: currentPipelineId, companyId },
    { skip: !currentPipelineId }
  );

  const { data: oppsRes, isLoading: isTableLoading, refetch: refetchTable, isFetching } = useGetCrmOpportunitiesQuery(
    {
      pipelineId: currentPipelineId,
      companyId,
      search: filters.searchKey || undefined,
      page: page ? page - 1 : 0,
      size: apiParams.size || 10,
    },
    { skip: !currentPipelineId }
  );

  const [updateStage] = useUpdateOpportunityStageMutation();
  const [closeOpportunity, { isLoading: isClosing }] = useCloseOpportunityMutation();

  const kanbanColumns = kanbanRes?.data?.columns || [];
  const opportunities = oppsRes?.data?.content || oppsRes?.data || [];
  const totalElements = oppsRes?.data?.totalElements || opportunities.length;
  const totalPages = oppsRes?.data?.totalPages || Math.ceil(totalElements / (apiParams.size || 10)) || 1;

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

  const tableColumns = useMemo(() => [
    {
      id: 'title',
      label: 'Deal Title',
      sortable: true,
      render: (val, o) => (
        <span className="font-semibold text-zinc-900 dark:text-white text-xs">
          {o?.title || val}
        </span>
      ),
    },
    {
      id: 'stageName',
      label: 'Stage',
      sortable: true,
      render: (val, o) => (
        <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary">
          {o?.stageName || val}
        </span>
      ),
    },
    {
      id: 'dealValue',
      label: 'Deal Value',
      sortable: true,
      render: (val, o) => (
        <span className="font-mono font-semibold text-xs text-zinc-900 dark:text-white">
          ₹{Number(o?.dealValue ?? val ?? 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      id: 'probabilityPercent',
      label: 'Win Probability',
      sortable: true,
      render: (val, o) => (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs font-semibold text-emerald-600">{o?.probabilityPercent ?? val ?? 50}%</span>
        </div>
      ),
    },
    {
      id: 'expectedCloseDate',
      label: 'Close Date',
      sortable: true,
      render: (val, o) => (
        <span className="text-xs text-zinc-500">
          {(o?.expectedCloseDate || val) ? new Date(o?.expectedCloseDate || val).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
  ], []);

  const rowActions = useMemo(() => [
    {
      key: 'won',
      label: 'Mark Won',
      icon: CheckCircle2,
      tooltip: 'Mark Won',
      className: 'hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20',
      onClick: (row) => setClosingDeal({ id: row.id, status: 'WON' }),
    },
    {
      key: 'lost',
      label: 'Mark Lost',
      icon: XCircle,
      tooltip: 'Mark Lost',
      className: 'hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20',
      onClick: (row) => setClosingDeal({ id: row.id, status: 'LOST' }),
    },
  ], []);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <PageHeader
        title="Opportunities & Pipelines"
        description="Visual deal progression, Kanban pipeline forecasting, and revenue pipeline"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`${crmBase}/pipelines`)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-300 dark:border-[#2A2F3D] text-zinc-700 dark:text-[#E6E8EE] hover:bg-zinc-100 dark:hover:bg-[#1C202B] text-xs font-semibold rounded-lg shadow-sm transition-all active:scale-95"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Configure Pipelines</span>
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-primary-500/20 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Opportunity</span>
          </button>
        </div>
      </PageHeader>

      {/* Top Filter and Mode Switcher Strip */}
      <div className="px-6 py-2.5 bg-white dark:bg-[#161922] border-b border-zinc-200 dark:border-[#2A2F3D] flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
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
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-[#161922] shadow text-primary'
                  : 'text-zinc-500'
              }`}
            >
              <Kanban size={13} /> Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
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
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        {viewMode === 'kanban' ? (
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <CrmKanbanBoard
              columns={kanbanColumns}
              onStageChange={handleStageChange}
              onOpportunityClick={(opp) => console.log('View opp', opp)}
            />
          </div>
        ) : (
          <DataTable
            permissionFeature="CRM"
            selectable
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
            columns={tableColumns}
            data={opportunities}
            rowKey="id"
            loading={isTableLoading}
            isRefreshing={isFetching}

            // Search
            searchable
            searchValue={filters.searchKey || ''}
            searchPlaceholder="Search deal title..."
            onSearchChange={(val) => setFilter('searchKey', val)}

            // Reset & Refresh
            onReset={resetFilters}
            onRefresh={refetchTable}

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
              pageSize: apiParams.size || 10,
              totalPages,
              totalElements,
            }}
            pageIndexBase={1}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemName="opportunities"

            // Empty State
            emptyMessage="No opportunities found"
            emptyDescription="Try adjusting your search query or pipeline filter."
          />
        )}
      </div>

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


