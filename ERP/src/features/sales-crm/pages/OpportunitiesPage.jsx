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
import Button from '../../../components/common/Button';
import ConfirmModal from '../../../components/common/ConfirmModal';
import { Select } from '../../../components/common';
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
import useCrmPermissions from '../hooks/useCrmPermissions';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../../features/notifications/notificationSlice';

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
  const [stageOverrides, setStageOverrides] = useState({});

  const dispatch = useAppDispatch();

  const {
    page, setPage, setPageSize, apiParams,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10 });

  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.content)) return res.data.content;
    return [];
  };

  const { data: pipelinesRes } = useGetCrmPipelinesQuery(companyId);
  const pipelines = toArray(pipelinesRes);
  const currentPipelineId = selectedPipelineId || pipelines[0]?.id;

  const { data: kanbanRes, isLoading: isKanbanLoading, refetch: refetchKanban } = useGetCrmKanbanQuery(
    { pipelineId: currentPipelineId, companyId },
    { skip: !currentPipelineId }
  );

  const { data: oppsRes, isLoading: isTableLoading, refetch: refetchTable, isFetching } = useGetCrmOpportunitiesQuery(
    {
      pipelineId: currentPipelineId || undefined,
      companyId,
      search: filters.searchKey || undefined,
      page,
      size: apiParams.size || 10,
    },
    { skip: !companyId }
  );

  const [updateStage] = useUpdateOpportunityStageMutation();
  const [closeOpportunity, { isLoading: isClosing }] = useCloseOpportunityMutation();

  const kanbanColumns = useMemo(() => {
    if (Array.isArray(kanbanRes?.stages)) return kanbanRes.stages;
    if (Array.isArray(kanbanRes?.columns)) return kanbanRes.columns;
    if (Array.isArray(kanbanRes?.data?.stages)) return kanbanRes.data.stages;
    if (Array.isArray(kanbanRes?.data?.columns)) return kanbanRes.data.columns;
    return [];
  }, [kanbanRes]);

  const opportunities = useMemo(() => {
    if (Array.isArray(oppsRes)) return oppsRes;
    if (Array.isArray(oppsRes?.data)) return oppsRes.data;
    if (Array.isArray(oppsRes?.data?.content)) return oppsRes.data.content;
    if (Array.isArray(oppsRes?.content)) return oppsRes.content;
    return [];
  }, [oppsRes]);

  const effectiveOpportunities = useMemo(() => {
    return opportunities.map((opp) => {
      const override = stageOverrides[opp.id];
      if (override) {
        return {
          ...opp,
          currentStageId: override.stageId,
          stageId: override.stageId,
          currentStageName: override.stageName || opp.currentStageName,
          stageName: override.stageName || opp.stageName,
          probabilityPct: override.probabilityPct !== undefined ? override.probabilityPct : opp.probabilityPct,
          probabilityPercent: override.probabilityPct !== undefined ? override.probabilityPct : opp.probabilityPercent,
        };
      }
      return opp;
    });
  }, [opportunities, stageOverrides]);

  const totalElements = oppsRes?._pageInfo?.totalElements
    ?? oppsRes?.pagination?.totalElements
    ?? oppsRes?.data?.totalElements
    ?? oppsRes?.totalElements
    ?? effectiveOpportunities.length;

  const totalPages = oppsRes?._pageInfo?.totalPages
    ?? oppsRes?.pagination?.totalPages
    ?? oppsRes?.data?.totalPages
    ?? oppsRes?.totalPages
    ?? Math.ceil(totalElements / (apiParams.size || 10))
    ?? 1;

  const totalValue = useMemo(() => {
  return effectiveOpportunities.reduce((acc, o) => acc + (Number(o?.dealValue) || 0), 0);
}, [effectiveOpportunities]);

const weightedValue = useMemo(() => {
    return effectiveOpportunities.reduce((acc, o) => {
      const val = Number(o?.dealValue) || 0;
      const prob = Number(o?.probabilityPct ?? o?.probabilityPercent ?? 50);
      return acc + (val * prob) / 100;
    }, 0);
}, [effectiveOpportunities]);

const handleStageChange = async (dealId, newStageId) => {
  if (!dealId || !newStageId) return;

  const targetStage = kanbanColumns.find((s) => s.id === newStageId || s.stageId === newStageId);

  // Optimistically update card position and metrics
  setStageOverrides((prev) => ({
    ...prev,
    [dealId]: {
      stageId: newStageId,
      stageName: targetStage?.stageName,
      probabilityPct: targetStage?.winProbabilityPct,
    },
  }));

  try {
    await updateStage({
      id: dealId,
      targetStageId: newStageId,
      stageId: newStageId,
      data: { targetStageId: newStageId },
      companyId,
    }).unwrap();

    // Refresh kanban and table views
    refetchKanban();
    refetchTable();

    // Clear local override once server responds
    setStageOverrides((prev) => {
      const next = { ...prev };
      delete next[dealId];
      return next;
    });

    dispatch(addAlert({
      type: 'success',
      message: `Deal moved to ${targetStage?.stageName || 'new stage'}.`,
    }));
  } catch (err) {
    // Revert optimistic state on failure
    setStageOverrides((prev) => {
      const next = { ...prev };
      delete next[dealId];
      return next;
    });

    const errMsg = err?.data?.errors?.[0]
      || (err?.data?.errors && typeof err.data.errors === 'object' && Object.values(err.data.errors)[0])
      || err?.data?.message
      || err?.message
      || 'Failed to update deal stage';

    dispatch(addAlert({ type: 'error', message: errMsg }));
    console.error('Failed to update deal stage:', err);
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
      <div className="space-y-0.5">
        <span className="font-semibold text-zinc-900 dark:text-white text-xs block">
          {o?.opportunityName || o?.title || val || 'Untitled Opportunity'}
        </span>
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
          {o?.opportunityCode && <span className="font-mono text-primary font-medium">{o.opportunityCode}</span>}
          {o?.accountName ? <span>• {o.accountName}</span> : (o?.contactName ? <span>• {o.contactName}</span> : null)}
        </div>
      </div>
    ),
  },
  {
    id: 'stageName',
    label: 'Stage',
    sortable: true,
    render: (val, o) => (
      <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light">
        {o?.currentStageName || o?.stageName || val || 'Open'}
      </span>
    ),
  },
  {
    id: 'dealValue',
    label: 'Deal Value',
    sortable: true,
    render: (val, o) => (
      <span className="font-mono font-semibold text-xs text-zinc-900 dark:text-white">
        ₹{Number(o?.dealValue ?? val ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    ),
  },
  {
    id: 'probabilityPercent',
    label: 'Win Probability',
    sortable: true,
    render: (val, o) => {
      const prob = o?.probabilityPct ?? o?.probabilityPercent ?? val ?? 0;
      return (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs font-semibold text-emerald-600">{prob}%</span>
        </div>
      );
    },
  },
  {
    id: 'expectedCloseDate',
    label: 'Close Date',
    sortable: true,
    render: (val, o) => {
      const d = o?.expectedCloseDate || val;
      return (
        <span className="text-xs text-zinc-500">
          {d ? new Date(d).toLocaleDateString() : 'N/A'}
        </span>
      );
    },
  },
], []);

const { opportunities: oppPerms, can } = useCrmPermissions();

const rowActions = useMemo(() => {
  const actions = [];
  if (oppPerms.canClose) {
    actions.push(
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
      }
    );
  }
  return actions;
}, [oppPerms.canClose]);

return (
  <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
    <PageHeader
      title="Opportunities & Pipelines"
      description="Visual deal progression, Kanban pipeline forecasting, and revenue pipeline"
    >
      <div className="flex items-center gap-2">
        {(can('CRM_OPPORTUNITIES', 'MANAGE') || oppPerms.canUpdate) && (
          <Button
            variant="secondary"
            onClick={() => navigate(`${crmBase}/pipelines`)}
            icon={Layers}
          >
            Configure Pipelines
          </Button>
        )}
        {oppPerms.canCreate && (
          <Button
            variant="primary"
            onClick={() => setIsCreateOpen(true)}
            icon={Plus}
          >
            New Opportunity
          </Button>
        )}
      </div>
    </PageHeader>

    {/* Top Filter and Mode Switcher Strip */}
    <div className="px-6 py-2.5 bg-white dark:bg-[#161922] border-b border-zinc-200 dark:border-[#2A2F3D] flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-3">
        <Select
          value={currentPipelineId || ''}
          onChange={(e) => setSelectedPipelineId(e.target.value)}
          className="w-56"
        >
          {pipelines.map((p) => (
            <option key={p.id} value={p.id}>
              Pipeline: {p.pipelineName || p.name} {p.isDefault ? '(Default)' : ''}
            </option>
          ))}
        </Select>

        <div className="flex items-center bg-zinc-100 dark:bg-[#1C202B] p-0.5 rounded-lg border border-zinc-200 dark:border-[#2A2F3D]">
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${viewMode === 'kanban'
                ? 'bg-white dark:bg-[#161922] shadow text-primary'
                : 'text-zinc-500'
              }`}
          >
            <Kanban size={13} /> Board
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${viewMode === 'table'
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
            stages={kanbanColumns}
            columns={kanbanColumns}
            opportunities={effectiveOpportunities}
            onStageChange={handleStageChange}
            onOpportunityClick={(opp) => console.log('View opp', opp)}
          />
        </div>
      ) : (
        <DataTable
          permissionFeature="CRM_OPPORTUNITIES"
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={tableColumns}
          data={effectiveOpportunities}
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
          pageIndexBase={0}
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


