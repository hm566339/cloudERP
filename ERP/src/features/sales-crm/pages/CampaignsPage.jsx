import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Megaphone,
  Plus,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Calendar,
  ExternalLink
} from 'lucide-react';
import PageHeader from '../../../components/common/PageHeader';
import StatCard from '../../../components/common/StatCard';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { useGetCrmCampaignsQuery } from '../../../api/sales-crm/crm.api';
import CampaignFormModal from '../components/CampaignFormModal';

const DEFAULT_COLUMNS = [
  'name',
  'channel',
  'budget',
  'actualRevenueWon',
  'roiPercent',
  'leadsCount',
];

export default function CampaignsPage() {
  const { companyId } = useParams();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);

  const {
    page, setPage, setPageSize, apiParams,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10 });

  const { data: campaignsRes, isLoading, refetch, isFetching } = useGetCrmCampaignsQuery({
    companyId,
    search: filters.searchKey || undefined,
    page,
    size: apiParams.size || 10,
  });

  const campaigns = campaignsRes?.data?.content || campaignsRes?.data || [];
  const totalElements = campaignsRes?.data?.totalElements || campaigns.length;
  const totalPages = campaignsRes?.data?.totalPages || Math.ceil(totalElements / (apiParams.size || 10)) || 1;

  const totalBudget = campaigns.reduce((acc, c) => acc + (Number(c.budget) || 0), 0);
  const totalRevenue = campaigns.reduce((acc, c) => acc + (Number(c.actualRevenueWon) || 0), 0);
  const overallRoi = totalBudget > 0 ? (((totalRevenue - totalBudget) / totalBudget) * 100).toFixed(1) : 0;

  const columns = useMemo(() => [
    {
      id: 'name',
      label: 'Campaign & Code',
      sortable: true,
      render: (val, c) => (
        <div className="space-y-0.5">
          <span className="font-semibold text-zinc-900 dark:text-white text-xs block">{c?.name || val}</span>
          <span className="text-[11px] font-mono text-zinc-500">{c?.code}</span>
        </div>
      ),
    },
    {
      id: 'channel',
      label: 'Channel & Type',
      sortable: true,
      render: (val, c) => (
        <div className="space-y-0.5 text-xs">
          <span className="font-semibold text-zinc-800 dark:text-[#E6E8EE] block">
            {c?.channel || val || 'MARKETPLACE'}
          </span>
          <span className="text-[11px] text-zinc-500">{c?.type || 'Inbound'}</span>
        </div>
      ),
    },
    {
      id: 'budget',
      label: 'Budget & Spend',
      sortable: true,
      render: (val, c) => (
        <div className="text-xs space-y-0.5">
          <span className="font-mono font-semibold text-zinc-900 dark:text-white block">
            Budget: ₹{(c?.budget || val || 0).toLocaleString('en-IN')}
          </span>
          <span className="font-mono text-[11px] text-zinc-500">
            Spend: ₹{(c?.actualSpend || c?.budget || val || 0).toLocaleString('en-IN')}
          </span>
        </div>
      ),
    },
    {
      id: 'actualRevenueWon',
      label: 'Revenue Won',
      sortable: true,
      render: (val, c) => (
        <span className="font-mono font-bold text-emerald-600 text-xs">
          ₹{(c?.actualRevenueWon || val || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      id: 'roiPercent',
      label: 'ROI %',
      sortable: true,
      render: (val, c) => {
        const budget = Number(c?.budget) || 0;
        const revenue = Number(c?.actualRevenueWon) || 0;
        const roi = budget > 0 ? (((revenue - budget) / budget) * 100).toFixed(0) : (val ?? 0);
        const isPositive = Number(roi) > 0;

        return (
          <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
            isPositive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-zinc-100 text-zinc-600'
          }`}>
            {isPositive ? `+${roi}%` : `${roi}%`}
          </span>
        );
      },
    },
    {
      id: 'leadsCount',
      label: 'Leads Generated',
      sortable: true,
      render: (val, c) => (
        <span className="font-semibold text-xs text-zinc-800 dark:text-[#E6E8EE]">
          {c?.leadsCount ?? val ?? 0} Leads
        </span>
      ),
    },
  ], []);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <PageHeader
        title="Marketing Campaigns & Spend"
        description="Monitoring campaigns across digital, search, and marketplace channels"
      >
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-primary-500/20 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Campaign</span>
        </button>
      </PageHeader>

      <div className="flex-1 p-6 overflow-hidden flex flex-col space-y-4">
        {/* KPI Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
          <StatCard
            title="Total Budget Allocated"
            value={`₹${(totalBudget / 100000).toFixed(1)}L`}
            subtitle="Cumulative marketing budget"
            icon={DollarSign}
          />
          <StatCard
            title="Revenue Won"
            value={`₹${(totalRevenue / 100000).toFixed(1)}L`}
            trend="up"
            trendValue="+24%"
            subtitle="Attributed closed deals"
            icon={TrendingUp}
          />
          <StatCard
            title="Portfolio ROI"
            value={`${overallRoi}%`}
            trend="up"
            subtitle="Marketing return on investment"
            icon={Target}
          />
        </div>

        {/* DataTable Container */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <DataTable
            permissionFeature="CRM"
            selectable
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
            columns={columns}
            data={campaigns}
            rowKey="id"
            loading={isLoading}
            isRefreshing={isFetching}

            // Search
            searchable
            searchValue={filters.searchKey || ''}
            searchPlaceholder="Search campaign name, code..."
            onSearchChange={(val) => setFilter('searchKey', val)}

            // Reset & Refresh
            onReset={resetFilters}
            onRefresh={refetch}

            // Column Visibility
            visibleColumns={visibleColumns}
            onVisibleColumnsChange={setVisibleColumns}

            // Sorting
            sort={{ key: sortBy, direction: sortOrder }}
            onSortChange={({ key }) => handleColumnSort(key)}

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
            itemName="campaigns"

            // Empty State
            emptyMessage="No campaigns found"
            emptyDescription="Try adjusting your search criteria or create a new campaign."
          />
        </div>
      </div>

      <CampaignFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        companyId={companyId}
        onSuccess={() => refetch()}
      />
    </div>
  );
}


