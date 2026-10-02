import React, { useState, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { budgetLinesApi, chartOfAccountsApi } from '../../../api/account';
import { accountHttpClient } from '../../../api/common/client';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import useUrlFilters from '../../../hooks/useUrlFilters';
import RequirePermission from '../../../components/common/RequirePermission';
import { confirmDialog } from '../../../utils/confirmDialog';
import BudgetLineFormModal from '../components/BudgetLineFormModal';
import ExportModal from '../../../components/common/ExportModal';
import PageHeader from '../../../components/common/PageHeader';
import { useRoutePath } from '../../../hooks/useRoutePath';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import AuditLogHover from '../../../components/common/AuditLogHover';
import { formatCurrency } from '../../../utils/formatters';
import BudgetLinesTable from '../components/BudgetLinesTable';

const fetchBudgetHeaders = (companyId) => {
  return accountHttpClient.get('/api/account/budget-headers', { params: { size: 1000, companyId } });
};

const fetchDepartments = (companyId) => {
  return accountHttpClient.get('/api/account/departments', { params: { size: 1000, companyId } }).catch(() => ({ data: [] }));
};

const getLineStatus = (record) => {
  const raw = record?.status?.toUpperCase?.();
  if (raw) return raw;
  const util = record?.utilizationPercentage ?? 0;
  if (util > 100) return 'EXCEEDED';
  if (util >= 100) return 'COMPLETED';
  if (util > 0) return 'ACTIVE';
  return 'DRAFT';
};

const DEFAULT_COLUMNS = [
  'budgetHeaderName',
  'accountName',
  'departmentName',
  'allocatedAmount',
  'utilizedAmount',
  'remainingAmount',
  'utilizationPercentage',
  'status'
];

const getBudgetLinesList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data?.budgetLines)) return response.data.data.budgetLines;
  if (Array.isArray(response?.data?.budgetLines)) return response.data.budgetLines;
  if (Array.isArray(response?.budgetLines)) return response.budgetLines;
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

export default function BudgetLines() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLine, setSelectedLine] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
  const [selectedRows, setSelectedRows] = useState([]);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const companyId = JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;

  // Fetch Lookups for Filters
  const { data: budgetHeadersData } = useApiQuery(fetchBudgetHeaders, companyId);
  const raw_budgetHeadersList = budgetHeadersData?.data?.data?.budgetHeaders || budgetHeadersData?.data?.budgetHeaders || budgetHeadersData?.data?.content || budgetHeadersData?.data?.items || budgetHeadersData?.content || [];
  const budgetHeadersList = Array.isArray(raw_budgetHeadersList) ? raw_budgetHeadersList : [];

  const { data: accountsData } = useApiQuery(chartOfAccountsApi.getList, { size: 1000, companyId });
  const raw_accountsList = accountsData?.data?.data?.content || accountsData?.data?.content || accountsData?.data || [];
  const accountsList = Array.isArray(raw_accountsList) ? raw_accountsList : [];

  const { data: departmentsData } = useApiQuery(fetchDepartments, companyId);
  const raw_departmentsList = departmentsData?.data?.content || departmentsData?.data || [];
  const departmentsList = Array.isArray(raw_departmentsList) ? raw_departmentsList : [];
  
  const {
    page, setPage, setPageSize, apiParams,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10 });

  // Dynamically build query filters without null or empty values
  const queryFilters = useMemo(() => {
    const q = { companyId };
    if (filters.searchKey && filters.searchKey.trim()) q.searchKeyword = filters.searchKey.trim();
    if (filters.budgetHeaderId && filters.budgetHeaderId.trim()) q.budgetHeaderId = filters.budgetHeaderId.trim();
    if (filters.accountId && filters.accountId.trim()) q.accountId = filters.accountId.trim();
    if (filters.departmentId && filters.departmentId.trim()) q.departmentId = filters.departmentId.trim();
    
    if (filters.minAllocatedAmount !== undefined && filters.minAllocatedAmount !== '') q.minAllocatedAmount = Number(filters.minAllocatedAmount);
    if (filters.maxAllocatedAmount !== undefined && filters.maxAllocatedAmount !== '') q.maxAllocatedAmount = Number(filters.maxAllocatedAmount);
    
    if (filters.minUtilizedAmount !== undefined && filters.minUtilizedAmount !== '') q.minUtilizedAmount = Number(filters.minUtilizedAmount);
    if (filters.maxUtilizedAmount !== undefined && filters.maxUtilizedAmount !== '') q.maxUtilizedAmount = Number(filters.maxUtilizedAmount);
    
    return q;
  }, [filters, companyId]);

  const { data: responseData, isLoading, refetch, isFetching } = useApiQuery(
    budgetLinesApi.getBudgetLines,
    { ...queryFilters, ...apiParams, sortBy, sortDir: sortOrder }
  );

  const budgetLines = getBudgetLinesList(responseData);
  const pageInfo = getPageInfo(responseData);

  const deleteMutation = useApiMutation(budgetLinesApi.deleteBudgetLine);

  const handleReset = () => {
    resetFilters();
    setPage(0);
    setSelectedRows([]);
  };

  const handleDelete = (id) => {
    confirmDialog(
      'Delete Budget Line',
      'Are you sure you want to delete this budget line? This action cannot be undone.',
      async () => {
        try {
          await deleteMutation.mutateAsync(id);
          dispatch(addAlert({ type: 'success', message: 'Budget line deleted successfully' }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to delete budget line' }));
        }
      }
    );
  };

  const handleEdit = (line) => {
    setSelectedLine(line);
    setIsFormOpen(true);
  };

  const handleCreate = (prefillData = null) => {
    if (prefillData && prefillData.nativeEvent) {
      prefillData = null;
    }
    setSelectedLine(prefillData);
    setIsFormOpen(true);
  };

  // Columns Configuration
  const columns = useMemo(() => [
    {
      id: 'budgetHeaderName',
      label: 'Budget Header',
      sortable: true,
      render: (val, row) => <span className="font-medium text-zinc-900">{row.budgetHeaderName || row.budgetHeaderId || '-'}</span>
    },
    {
      id: 'accountName',
      label: 'Account',
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="font-semibold text-zinc-900">{row.accountName || '-'}</div>
          {row.accountCode && <div className="text-[8.8px] text-zinc-500 font-mono mt-0.5">{row.accountCode}</div>}
        </div>
      )
    },
    {
      id: 'departmentName',
      label: 'Department',
      sortable: true,
      render: (val, row) => <span className="text-zinc-700">{row.departmentName || '-'}</span>
    },
    {
      id: 'allocatedAmount',
      label: 'Allocated',
      sortable: true,
      align: 'right',
      render: (val, row) => <span className="text-blue-600 font-medium">₹ {formatCurrency(row.allocatedAmount)}</span>
    },
    {
      id: 'utilizedAmount',
      label: 'Utilized',
      sortable: true,
      align: 'right',
      render: (val, row) => <span className="text-emerald-600 font-medium">₹ {formatCurrency(row.utilizedAmount)}</span>
    },
    {
      id: 'remainingAmount',
      label: 'Remaining',
      sortable: true,
      align: 'right',
      render: (val, row) => <span className="text-rose-600 font-medium">₹ {formatCurrency(row.remainingAmount)}</span>
    },
    {
      id: 'utilizationPercentage',
      label: 'Utilization %',
      sortable: true,
      align: 'right',
      render: (val, row) => <span className="font-medium text-zinc-800">{(row.utilizationPercentage || 0).toFixed(1)}%</span>
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      align: 'center',
      render: (val, row) => {
        const s = getLineStatus(row);
        const type = 
          s === 'ACTIVE' ? 'success' :
          s === 'EXCEEDED' ? 'error' :
          s === 'COMPLETED' ? 'info' : 'default';
        const label = s.charAt(0) + s.slice(1).toLowerCase();
        return <DataTableStatusBadge type={type}>{label}</DataTableStatusBadge>;
      }
    }
  ], []);

  // Basic filters mapped directly to state keys
  const basicFilters = useMemo(() => [
    {
      id: 'budgetHeaderId',
      label: 'Budget Header',
      type: 'select',
      options: [
        { label: 'All Budget Headers', value: '' },
        ...budgetHeadersList.map(h => ({ label: h.budgetName || h.budgetHeaderName || h.id, value: String(h.id) }))
      ]
    },
    {
      id: 'accountId',
      label: 'Account',
      type: 'select',
      options: [
        { label: 'All Accounts', value: '' },
        ...accountsList.map(a => ({ label: a.accountName, value: String(a.id) }))
      ]
    },
    {
      id: 'departmentId',
      label: 'Department',
      type: 'select',
      options: [
        { label: 'All Departments', value: '' },
        ...departmentsList.map(d => ({ label: d.name || d.departmentName, value: String(d.id) }))
      ]
    }
  ], [budgetHeadersList, accountsList, departmentsList]);

  // Expandable grouped advanced filters
  const advancedFilters = useMemo(() => [
    {
      title: 'Allocated Amount',
      fields: [
        { id: 'minAllocatedAmount', label: 'Min Allocated', type: 'number', placeholder: 'Min Amount' },
        { id: 'maxAllocatedAmount', label: 'Max Allocated', type: 'number', placeholder: 'Max Amount' }
      ]
    },
    {
      title: 'Utilized Amount',
      fields: [
        { id: 'minUtilizedAmount', label: 'Min Utilized', type: 'number', placeholder: 'Min Amount' },
        { id: 'maxUtilizedAmount', label: 'Max Utilized', type: 'number', placeholder: 'Max Amount' }
      ]
    }
  ], []);

  // Row actions configuration
  const rowActions = useMemo(() => [
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
  ], []);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <PageHeader
        title="Budget Lines"
        description="Manage budget allocations at the account level"
      >
        <RequirePermission module="BUDGET" action="CREATE">
          <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span>New Budget Line</span>
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
          data={budgetLines}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}
          
          // Search
          searchable
          searchValue={filters.searchKey || ''}
          searchPlaceholder="Account Name, Code..."
          onSearchChange={(val) => setFilter('searchKey', val)}
          createOption={{
            enabled: true,
            label: (val) => `Create line for "${val}"`,
            description: 'Add as new budget line',
            onCreate: () => handleCreate()
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

          // Pagination
          pagination={{
            page,
            pageSize: apiParams.size,
            totalPages: pageInfo?.totalPages || 1,
            totalElements: pageInfo?.totalElements || budgetLines.length
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="budget lines"

          // Empty State
          emptyMessage="No budget lines found"
          emptyDescription="Try adjusting your search keywords or filter criteria to find budget lines."
        />
      </div>

      <BudgetLineFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        editingRecord={selectedLine}
        onSuccess={refetch}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="budget-lines-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}
