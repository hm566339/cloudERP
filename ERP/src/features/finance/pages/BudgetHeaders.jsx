import React, { useState, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, Eye, AlertCircle, CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { budgetHeadersApi, fiscalYearsApi } from '../../../api/account';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import useUrlFilters from '../../../hooks/useUrlFilters';
import RequirePermission from '../../../components/common/RequirePermission';
import { confirmDialog } from '../../../utils/confirmDialog';
import BudgetHeaderFormModal from '../components/BudgetHeaderFormModal';
import ExportModal from '../../../components/common/ExportModal';
import PageHeader from '../../../components/common/PageHeader';
import { useRoutePath } from '../../../hooks/useRoutePath';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import AuditLogHover from '../../../components/common/AuditLogHover';
import { formatCurrency } from '../../../utils/formatters';
import BudgetLinesTable from '../components/BudgetLinesTable';

const DEFAULT_COLUMNS = [
  'budgetName',
  'fiscalYear',
  'totalBudget',
  'totalAllocated',
  'totalUtilized',
  'remainingBudget',
  'status'
];

const getBudgetHeadersList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data?.budgetHeaders)) return response.data.data.budgetHeaders;
  if (Array.isArray(response?.data?.budgetHeaders)) return response.data.budgetHeaders;
  if (Array.isArray(response?.budgetHeaders)) return response.budgetHeaders;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.items)) return response.items;
  return [];
};

const getPageInfo = (response) => {
  if (Array.isArray(response)) return response._pageInfo || {};
  return response?.pagination || response?.data?.pagination || response?.data?.paginationResponse || response?.data?.pageInfo || response?.data?._pageInfo || response?._pageInfo || response || {};
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
};

export default function BudgetHeaders() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedHeader, setSelectedHeader] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const companyId = JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;

  // Fetch Fiscal Years for Dropdown to inject into filters dynamically
  const { data: fiscalYearsData } = useApiQuery(fiscalYearsApi.getFiscalYears);
  const rawFiscalYears = fiscalYearsData?.data?.data?.fiscalYears || fiscalYearsData?.data?.data?.items || fiscalYearsData?.data?.fiscalYears || fiscalYearsData?.data?.items || fiscalYearsData?.fiscalYears || fiscalYearsData?.items || [];
  const fiscalYearsList = Array.isArray(rawFiscalYears) ? rawFiscalYears : [];
  
  const {
    page, setPage, setPageSize, apiParams,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10 });

  // Dynamically build query filters without null or empty values
  const queryFilters = useMemo(() => {
    const q = { companyId };
    if (filters.searchKey && filters.searchKey.trim()) q.searchKey = filters.searchKey.trim();
    if (filters.fiscalYearId && filters.fiscalYearId.trim()) q.fiscalYearId = filters.fiscalYearId.trim();
    if (filters.status && filters.status.trim()) q.status = filters.status.trim();
    
    if (filters.minAmount !== undefined && filters.minAmount !== '') {
      q.minAmount = Number(filters.minAmount);
    }
    if (filters.maxAmount !== undefined && filters.maxAmount !== '') {
      q.maxAmount = Number(filters.maxAmount);
    }
    return q;
  }, [filters, companyId]);

  const { data: responseData, isLoading, refetch, isFetching } = useApiQuery(
    budgetHeadersApi.getBudgetHeaders,
    { ...queryFilters, ...apiParams, sortBy, sortDir: sortOrder }
  );

  const budgetHeaders = getBudgetHeadersList(responseData);
  const pageInfo = getPageInfo(responseData);

  const deleteMutation = useApiMutation(budgetHeadersApi.deleteBudgetHeader);

  const handleReset = () => {
    resetFilters();
    setPage(0);
    setSelectedRows([]);
  };

  const handleDelete = (id) => {
    confirmDialog(
      'Delete Budget Header',
      'Are you sure you want to delete this budget header? This action cannot be undone.',
      async () => {
        try {
          await deleteMutation.mutateAsync(id);
          dispatch(addAlert({ type: 'success', message: 'Budget header deleted successfully' }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to delete budget header' }));
        }
      }
    );
  };

  const handleEdit = (header) => {
    setSelectedHeader(header);
    setIsFormOpen(true);
  };

  const handleCreate = (prefillData = null) => {
    if (prefillData && prefillData.nativeEvent) {
      prefillData = null;
    }
    setSelectedHeader(prefillData);
    setIsFormOpen(true);
  };

  // Columns Configuration
  const columns = useMemo(() => [
    {
      id: 'budgetName',
      label: 'Budget Name',
      sortable: true,
      render: (val, row) => <span className="font-medium text-zinc-900">{row.budgetName || '-'}</span>
    },
    {
      id: 'fiscalYear',
      label: 'Fiscal Year',
      sortable: true,
      render: (val, row) => <span className="text-zinc-700">{row.fiscalYearName || '-'}</span>
    },
    {
      id: 'totalBudget',
      label: 'Total Budget',
      sortable: true,
      align: 'right',
      render: (val, row) => <span className="font-medium">₹ {formatCurrency(row.totalBudget)}</span>
    },
    {
      id: 'totalAllocated',
      label: 'Allocated',
      sortable: true,
      align: 'right',
      render: (val, row) => <span className="text-blue-600 font-medium">₹ {formatCurrency(row.totalAllocated)}</span>
    },
    {
      id: 'totalUtilized',
      label: 'Utilized',
      sortable: true,
      align: 'right',
      render: (val, row) => <span className="text-emerald-600 font-medium">₹ {formatCurrency(row.totalUtilized)}</span>
    },
    {
      id: 'remainingBudget',
      label: 'Remaining',
      sortable: true,
      align: 'right',
      render: (val, row) => <span className="text-rose-600 font-medium">₹ {formatCurrency(row.remainingBudget)}</span>
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      align: 'center',
      render: (val, row) => {
        const s = row.status?.toUpperCase() || 'DRAFT';
        const type = 
          s === 'ACTIVE' ? 'success' :
          s === 'EXPIRED' ? 'error' :
          s === 'CLOSED' ? 'info' : 'default';
        const label = s.charAt(0) + s.slice(1).toLowerCase();
        return <DataTableStatusBadge type={type}>{label}</DataTableStatusBadge>;
      }
    }
  ], []);

  // Basic filters mapped directly to state keys
  const basicFilters = useMemo(() => [
    {
      id: 'fiscalYearId',
      label: 'Fiscal Year',
      type: 'select',
      options: [
        { label: 'All Fiscal Years', value: '' },
        ...fiscalYearsList.map(y => ({ label: y.fiscalYear || y.name, value: String(y.id) }))
      ]
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Closed', value: 'CLOSED' },
        { label: 'Expired', value: 'EXPIRED' }
      ]
    }
  ], [fiscalYearsList]);

  // Expandable grouped advanced filters
  const advancedFilters = useMemo(() => [
    {
      title: 'Budget Details',
      fields: [
        { id: 'minAmount', label: 'Min Budget Amount', type: 'number', placeholder: 'Min Amount' },
        { id: 'maxAmount', label: 'Max Budget Amount', type: 'number', placeholder: 'Max Amount' }
      ]
    }
  ], []);

  // Row actions configuration
  const rowActions = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => navigate(buildPath(`/accounts/budget/budget-headers/${row.id}`)),
      tooltip: 'View Details',
      className: 'hover:text-blue-600 hover:bg-blue-50'
    },
    {
      key: 'audit',
      component: ({ row }) => <AuditLogHover audit={row.audit} />
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: Edit2,
      permission: { module: 'BUDGET', action: 'UPDATE' },
      onClick: (row) => handleEdit(row),
      tooltip: 'Edit',
      className: 'hover:text-indigo-600 hover:bg-indigo-50'
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      permission: { module: 'BUDGET', action: 'DELETE' },
      onClick: (row) => handleDelete(row.id),
      tooltip: 'Delete'
    }
  ], [navigate, buildPath]);

  // Sub-row drawer renderer
  const renderExpandedRow = (header) => {
    return (
      <div className="p-4 bg-zinc-50/50 dark:bg-[#1D212C] border-t border-zinc-200 dark:border-[#2A2F3D]">
        <BudgetLinesTable headerId={header.id} />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <PageHeader
        title="Budget Headers"
        description="Manage budget definitions and overall allocations"
      >
        <RequirePermission module="BUDGET" action="CREATE">
          <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span>New Budget Header</span>
          </button>
        </RequirePermission>
      </PageHeader>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={budgetHeaders}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}
          
          // Search
          searchable
          searchValue={filters.searchKey || ''}
          searchPlaceholder="Budget Name..."
          onSearchChange={(val) => setFilter('searchKey', val)}
          createOption={{
            enabled: true,
            label: (val) => `Create "${val}"`,
            description: 'Add as new budget header',
            onCreate: (searchTerm) => handleCreate({ budgetName: searchTerm })
          }}

          // Basic Filters
          filters={basicFilters}
          filterValues={filters}
          onFilterChange={setFilter}

          // Advanced Filters
          advancedFilters={advancedFilters}

          // Reset & Refresh & Export
          onReset={handleReset}
          onRefresh={refetch}
          onExport={() => setIsExportModalOpen(true)}

          // Column Visibility
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={setVisibleColumns}

          // Sorting
          sort={{ key: sortBy, direction: sortOrder }}
          onSortChange={({ key }) => handleColumnSort(key)}

          // Row Actions
          rowActions={rowActions}

          // Expandable Sub-rows
          expandedRowId={expandedRowId}
          onToggleExpand={(id) => setExpandedRowId(expandedRowId === id ? null : id)}
          renderExpandedRow={renderExpandedRow}

          // Pagination
          pagination={{
            page,
            pageSize: apiParams.size,
            totalPages: pageInfo?.totalPages || 1,
            totalElements: pageInfo?.totalElements || budgetHeaders.length
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="budget headers"

          // Empty State
          emptyMessage="No budget headers found"
          emptyDescription="Try adjusting your search keywords or filter criteria to find budget headers."
        />
      </div>

      <BudgetHeaderFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        editingRecord={selectedHeader}
        onSuccess={refetch}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="budget-headers-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}
