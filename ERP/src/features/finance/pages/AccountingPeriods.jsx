import React, { useState, useMemo } from 'react';
import {
  Plus, Edit2, Trash2, Eye, AlertCircle, CheckCircle,
  Download, Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRoutePath } from '../../../hooks/useRoutePath';
import { accountingPeriodsApi, fiscalYearsApi } from '../../../api/account';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import useUrlFilters from '../../../hooks/useUrlFilters';
import RequirePermission from '../../../components/common/RequirePermission';
import { confirmDialog } from '../../../utils/confirmDialog';
import Modal from '../../../components/common/Modal';
import AccountingPeriodForm from '../components/AccountingPeriodForm';
import PresetPeriodGenerator from '../components/PresetPeriodGenerator';
import ExportModal from '../../../components/common/ExportModal';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/data-table';
import AuditLogHover from '../../../components/common/AuditLogHover';

const DEFAULT_COLUMNS = ['periodNumber', 'periodName', 'periodType', 'startDate', 'endDate', 'status'];

export default function AccountingPeriods() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
  const [expandedRowId, setExpandedRowId] = useState(null);

  const {
    page, setPage, setPageSize, apiParams,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10 });

  // Fetch Fiscal Years list for filter dropdown
  const { data: fiscalYearsData } = useApiQuery(fiscalYearsApi.getFiscalYears, [{ size: 100 }]);

  const rawFiscalYears = fiscalYearsData?.data?.fiscalYears ||
    fiscalYearsData?.data?.data?.fiscalYears ||
    fiscalYearsData?.fiscalYears ||
    fiscalYearsData?.content ||
    fiscalYearsData?.data?.content ||
    (Array.isArray(fiscalYearsData?.data) ? fiscalYearsData.data : []);
  const fiscalYears = Array.isArray(rawFiscalYears) ? rawFiscalYears : [];

  // Dynamically build query filters
  const queryFilters = useMemo(() => {
    const q = {};
    if (filters.searchKey && filters.searchKey.trim()) q.searchKey = filters.searchKey.trim();
    if (filters.fiscalYearId && filters.fiscalYearId.trim()) q.fiscalYearId = filters.fiscalYearId.trim();
    if (filters.periodNumber !== undefined && filters.periodNumber !== '') {
      q.periodNumber = Number(filters.periodNumber);
    }
    if (filters.periodType && filters.periodType.trim()) q.periodType = filters.periodType.trim();
    if (filters.status && filters.status.trim()) q.status = filters.status.trim();
    if (filters.startDateFrom) q.startDateFrom = filters.startDateFrom;
    if (filters.startDateTo) q.startDateTo = filters.startDateTo;
    if (filters.endDateFrom) q.endDateFrom = filters.endDateFrom;
    if (filters.endDateTo) q.endDateTo = filters.endDateTo;

    return q;
  }, [filters]);

  const { data: responseData, isLoading, refetch, isFetching } = useApiQuery(
    accountingPeriodsApi.getList,
    [{ params: { ...apiParams, ...queryFilters } }]
  );

  const rawPeriods = responseData?.data?.accountingPeriods ||
    responseData?.data?.data?.accountingPeriods ||
    responseData?.data?.periods ||
    responseData?.accountingPeriods ||
    responseData?.periods ||
    responseData?.content ||
    responseData?.data?.content ||
    (Array.isArray(responseData?.data) ? responseData.data : []);

  const periods = Array.isArray(rawPeriods) ? rawPeriods : [];

  const pageInfo = responseData?.data?.pagination ||
    responseData?.data?.paginationResponse ||
    responseData?.data?.data?.pagination ||
    responseData?.data?.data?.paginationResponse ||
    responseData?.pagination ||
    responseData?.paginationResponse ||
    { totalPages: 1, totalElements: periods.length };

  const deleteMutation = useApiMutation(accountingPeriodsApi.delete);
  const toggleStatusMutation = useApiMutation(accountingPeriodsApi.toggleStatus);
  const createMutation = useApiMutation(accountingPeriodsApi.create);
  const updateMutation = useApiMutation(accountingPeriodsApi.update);
  const presetMutation = useApiMutation(accountingPeriodsApi.createPreset);

  const handleReset = () => {
    resetFilters();
    setPage(0);
    setSelectedRows([]);
  };

  const handleDelete = (id) => {
    confirmDialog(
      'Delete Accounting Period',
      'Are you sure you want to delete this accounting period? This action cannot be undone.',
      async () => {
        try {
          await deleteMutation.mutateAsync([id]);
          dispatch(addAlert({ type: 'success', message: 'Accounting period deleted successfully' }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to delete accounting period' }));
        }
      }
    );
  };

  const handleToggleStatus = async (period) => {
    const isClosing = period.status === 'OPEN';
    confirmDialog(
      `${isClosing ? 'Close' : 'Open'} Accounting Period`,
      `Are you sure you want to ${isClosing ? 'close' : 'open'} period "${period.periodName}"?`,
      async () => {
        try {
          await toggleStatusMutation.mutateAsync([period.id || period.accountingPeriodId]);
          dispatch(addAlert({ type: 'success', message: `Accounting period ${isClosing ? 'closed' : 'opened'} successfully` }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Status update failed' }));
        }
      }
    );
  };

  const handleFormSubmit = async (payload) => {
    try {
      if (selectedPeriod) {
        await updateMutation.mutateAsync([{ id: selectedPeriod.id || selectedPeriod.accountingPeriodId, data: payload.data }]);
        dispatch(addAlert({ type: 'success', message: 'Accounting period updated successfully' }));
      } else {
        await createMutation.mutateAsync([payload]);
        dispatch(addAlert({ type: 'success', message: 'Accounting period created successfully' }));
      }
      setIsFormOpen(false);
      setSelectedPeriod(null);
      refetch();
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Operation failed' }));
    }
  };

  const handlePresetSubmit = async (payload) => {
    try {
      await presetMutation.mutateAsync([{ data: payload }]);
      dispatch(addAlert({ type: 'success', message: 'Preset accounting periods created successfully' }));
      setIsPresetModalOpen(false);
      refetch();
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to create presets' }));
    }
  };

  const handleEdit = (period) => {
    setSelectedPeriod(period);
    setIsFormOpen(true);
  };

  const handleCreate = (prefillData = null) => {
    if (prefillData && prefillData.nativeEvent) {
      prefillData = null;
    }
    setSelectedPeriod(prefillData);
    setIsFormOpen(true);
  };

  // Column definitions for DataTable
  const columns = useMemo(() => [
    {
      id: 'periodNumber',
      label: 'No.',
      sortable: true,
      align: 'center',
      render: (val, row) => (
        <span className="font-mono text-xs text-zinc-500 font-semibold">
          #{row.periodNumber ?? '-'}
        </span>
      )
    },
    {
      id: 'periodName',
      label: 'Period Name',
      sortable: true,
      render: (val, row) => (
        <span className="font-semibold text-zinc-900">{row.periodName || '-'}</span>
      )
    },
    {
      id: 'periodType',
      label: 'Type',
      sortable: true,
      render: (val, row) => (
        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded border bg-zinc-50 text-zinc-700 border-zinc-200">
          {row.periodType || '-'}
        </span>
      )
    },
    {
      id: 'startDate',
      label: 'Start Date',
      sortable: true,
      render: (val, row) => <span className="text-zinc-600 text-xs">{row.startDate || '-'}</span>
    },
    {
      id: 'endDate',
      label: 'End Date',
      sortable: true,
      render: (val, row) => <span className="text-zinc-600 text-xs">{row.endDate || '-'}</span>
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      align: 'center',
      render: (val, row) => {
        const isOpen = row.status === 'OPEN';
        const isLocked = row.status === 'LOCKED';
        return (
          <span
            className={`px-2.5 py-0.5 text-xs font-semibold rounded-md border inline-flex items-center gap-1.5 ${isOpen
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : isLocked
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-zinc-100 text-zinc-600 border-zinc-200'
              }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-500' : isLocked ? 'bg-red-500' : 'bg-zinc-400'
                }`}
            />
            {row.status || 'UNKNOWN'}
          </span>
        );
      }
    }
  ], []);

  // Basic Toolbar Filters
  const basicFilters = useMemo(() => [
    {
      id: 'fiscalYearId',
      label: 'Fiscal Year',
      type: 'select',
      placeholder: 'All Fiscal Years',
      options: fiscalYears.map((fy) => ({
        label: fy.fiscalYear || fy.name || `Fiscal Year ${fy.id}`,
        value: fy.id
      }))
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Open', value: 'OPEN' },
        { label: 'Closed', value: 'CLOSED' },
        { label: 'Locked', value: 'LOCKED' }
      ]
    },
    {
      id: 'periodType',
      label: 'Period Type',
      type: 'select',
      options: [
        { label: 'All Types', value: '' },
        { label: 'Monthly', value: 'MONTHLY' },
        { label: 'Quarterly', value: 'QUARTERLY' },
        { label: 'Half Yearly', value: 'HALF_YEARLY' },
        { label: 'Annual', value: 'ANNUAL' }
      ]
    }
  ], [fiscalYears]);

  // Expandable Advanced Filters
  const advancedFilters = useMemo(() => [
    {
      title: 'Period Filters',
      fields: [
        { id: 'periodNumber', label: 'Period Number', type: 'number', placeholder: 'e.g. 1' }
      ]
    },
    {
      title: 'Date Ranges',
      fields: [
        { id: 'startDateFrom', label: 'Start Date From', type: 'date' },
        { id: 'startDateTo', label: 'Start Date To', type: 'date' },
        { id: 'endDateFrom', label: 'End Date From', type: 'date' },
        { id: 'endDateTo', label: 'End Date To', type: 'date' }
      ]
    }
  ], []);

  // Row actions configuration
  const rowActions = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => navigate(buildPath(`/accounts/organization/accounting-periods/${row.id || row.accountingPeriodId}`)),
      tooltip: 'View Details',
      className: 'hover:text-blue-600 hover:bg-blue-50'
    },
    {
      key: 'audit',
      component: ({ row }) => <AuditLogHover audit={row.audit} />
    },
    {
      key: 'toggle-status',
      label: (row) => (row.status === 'OPEN' ? 'Close Period' : 'Open Period'),
      icon: (row) => (row.status === 'OPEN' ? AlertCircle : CheckCircle),
      permission: { module: 'ACCOUNTING_PERIODS', action: 'UPDATE' },
      onClick: (row) => handleToggleStatus(row),
      tooltip: (row) => (row.status === 'OPEN' ? 'Close Period' : 'Open Period'),
      className: (row) => (row.status === 'OPEN'
        ? 'hover:text-amber-600 hover:bg-amber-50'
        : 'hover:text-emerald-600 hover:bg-emerald-50')
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: Edit2,
      permission: { module: 'ACCOUNTING_PERIODS', action: 'UPDATE' },
      onClick: (row) => handleEdit(row),
      tooltip: 'Edit',
      className: 'hover:text-indigo-600 hover:bg-indigo-50'
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      permission: { module: 'ACCOUNTING_PERIODS', action: 'DELETE' },
      onClick: (row) => handleDelete(row.id || row.accountingPeriodId),
      tooltip: 'Delete'
    }
  ], [navigate, buildPath]);

  // Sub-row drawer renderer
  const renderExpandedRow = (period) => {
    const isOpen = period.status === 'OPEN';
    const isLocked = period.status === 'LOCKED';
    return (
      <div className="p-4 bg-white border border-zinc-100 rounded-lg shadow-2xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
          <div>
            <h3 className="text-base font-bold text-zinc-900">{period.periodName}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {period.fiscalYearName || period.fiscalYearId || 'N/A'} &mdash; Period #{period.periodNumber}
            </p>
          </div>
          <div className="flex gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md border bg-zinc-50 text-zinc-600 border-zinc-200">
              {period.periodType}
            </span>
            <span
              className={`px-2.5 py-0.5 text-xs font-semibold rounded-md border inline-flex items-center gap-1.5 ${isOpen
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : isLocked
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-500' : isLocked ? 'bg-red-500' : 'bg-zinc-400'
                  }`}
              />
              {period.status}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          <div>
            <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Start Date</p>
            <p className="text-sm font-medium text-zinc-900 mt-1">{period.startDate || '-'}</p>
          </div>
          <div>
            <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">End Date</p>
            <p className="text-sm font-medium text-zinc-900 mt-1">{period.endDate || '-'}</p>
          </div>
          <div>
            <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Total Transactions</p>
            <p className="text-sm font-medium text-zinc-900 mt-1">{period.totalTransactions || 0}</p>
          </div>
          <div>
            <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Total Sales</p>
            <p className="text-sm font-medium text-emerald-600 mt-1">₹{(period.totalSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Total Purchases</p>
            <p className="text-sm font-medium text-red-600 mt-1">₹{(period.totalPurchases || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Last Transaction</p>
            <p className="text-sm font-medium text-zinc-900 mt-1">{period.lastTransactionDate || '-'}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <PageHeader
        title="Accounting Periods"
        description="Manage accounting periods"
      >


        <RequirePermission module="ACCOUNTING_PERIODS" action="CREATE">
          <button
            onClick={() => setIsPresetModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all active:scale-95 shadow-2xs"
          >
            <Layers size={14} />
            <span>Generate Presets</span>
          </button>
          <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span>New Period</span>
          </button>
        </RequirePermission>
      </PageHeader>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          columns={columns}
          data={periods}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          onRowClick={(row) => navigate(buildPath(`/accounts/organization/accounting-periods/${row.id || row.accountingPeriodId}`))}

          // Search
          searchable
          searchValue={filters.searchKey || ''}
          searchPlaceholder="Search periods..."
          onSearchChange={(val) => setFilter('searchKey', val)}

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
            pageSize: apiParams.size || 10,
            totalPages: pageInfo?.totalPages || 1,
            totalElements: pageInfo?.totalElements || periods.length
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="periods"

          // Empty State
          emptyMessage="No accounting periods found"
          emptyDescription="Try adjusting your search keywords or filter criteria to find accounting periods."
        />
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setSelectedPeriod(null); }}
        title={selectedPeriod ? 'Edit Accounting Period' : 'New Accounting Period'}
        maxWidth="max-w-xl"
      >
        <AccountingPeriodForm
          initialData={selectedPeriod}
          fiscalYears={fiscalYears}
          onSubmit={handleFormSubmit}
          onCancel={() => { setIsFormOpen(false); setSelectedPeriod(null); }}
        />
      </Modal>

      <Modal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        title="Generate Preset Accounting Periods"
        maxWidth="max-w-xl"
      >
        <PresetPeriodGenerator
          fiscalYears={fiscalYears}
          onSubmit={handlePresetSubmit}
          onCancel={() => setIsPresetModalOpen(false)}
        />
      </Modal>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="accounting-periods-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}
