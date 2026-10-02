import React, { useState, useMemo } from 'react';
import {
  Download, Calendar, Edit, Trash2, Eye,
  AlertCircle, Plus, CheckCircle, XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRoutePath } from '../../../hooks/useRoutePath';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { fiscalYearsApi } from '../../../api/account';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import Modal from '../../../components/common/Modal';
import RequirePermission from '../../../components/common/RequirePermission';
import { confirmDialog } from '../../../utils/confirmDialog';
import { differenceInDays, differenceInMonths, parseISO } from 'date-fns';
import ExportModal from '../../../components/common/ExportModal';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import AuditLogHover from '../../../components/common/AuditLogHover';

const DEFAULT_COLUMNS = [
  'fiscalYear', 'companyName', 'startDate', 'endDate', 'isClosed', 'duration'
];

export default function FiscalYears() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();

  const dispatch = useAppDispatch();
  const companyId = JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;

  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('fiscalYears_visible_columns');
    return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
  });

  const [selectedRows, setSelectedRows] = useState([]);
  const [expandedRowId, setExpandedRowId] = useState(null);

  const {
    page, setPage, setPageSize, apiParams,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10, defaultSortBy: 'startDate', defaultSortOrder: 'desc' });

  // Dynamically build query filters
  const queryFilters = useMemo(() => {
    const q = {};
    if (filters.searchKey && filters.searchKey.trim()) q.searchKey = filters.searchKey.trim();
    if (filters.fiscalYearName && filters.fiscalYearName.trim()) q.fiscalYearName = filters.fiscalYearName.trim();
    if (filters.isClosed !== undefined && filters.isClosed !== '') {
      q.isClosed = filters.isClosed === 'true' || filters.isClosed === true;
    }
    if (filters.startDateFrom) q.startDateFrom = filters.startDateFrom;
    if (filters.startDateTo) q.startDateTo = filters.startDateTo;
    if (filters.endDateFrom) q.endDateFrom = filters.endDateFrom;
    if (filters.endDateTo) q.endDateTo = filters.endDateTo;
    if (filters.createdFrom) q.createdFrom = filters.createdFrom;
    if (filters.createdTo) q.createdTo = filters.createdTo;
    if (filters.updatedFrom) q.updatedFrom = filters.updatedFrom;
    if (filters.updatedTo) q.updatedTo = filters.updatedTo;

    return q;
  }, [filters]);

  const finalParams = useMemo(() => ({
    ...queryFilters,
    companyId,
    page,
    size: apiParams.size || 10,
    sortBy: sortBy || 'startDate',
    sortDir: sortOrder || 'desc'
  }), [queryFilters, companyId, page, apiParams.size, sortBy, sortOrder]);

  const { data: responseData, isLoading, refetch, isFetching } = useApiQuery(
    fiscalYearsApi.getFiscalYears,
    finalParams,
    { enabled: !!companyId }
  );

  const extractArray = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (res?.data?.fiscalYears && Array.isArray(res.data.fiscalYears)) return res.data.fiscalYears;
    if (res?.fiscalYears && Array.isArray(res.fiscalYears)) return res.fiscalYears;
    if (res?.data && Array.isArray(res.data)) return res.data;
    if (res?.data?.data && Array.isArray(res.data.data)) return res.data.data;
    if (res?.data?.content && Array.isArray(res.data.content)) return res.data.content;
    if (res?.content && Array.isArray(res.content)) return res.content;
    return [];
  };

  const rawFiscalYears = responseData?.data?.fiscalYears ||
    responseData?.data?.data?.fiscalYears ||
    responseData?.fiscalYears ||
    responseData?.content ||
    responseData?.data?.content ||
    extractArray(responseData);

  const fiscalYears = Array.isArray(rawFiscalYears) ? rawFiscalYears : [];

  const pageInfo = responseData?.data?.paginationResponse ||
    responseData?.data?.pagination ||
    responseData?.data?.data?.paginationResponse ||
    responseData?.data?.data?.pagination ||
    responseData?.paginationResponse ||
    responseData?.pagination ||
    { totalPages: 1, totalElements: fiscalYears.length };

  const createFiscalYearMutation = useApiMutation(fiscalYearsApi.createFiscalYear);
  const updateFiscalYearMutation = useApiMutation(fiscalYearsApi.updateFiscalYear);
  const deleteFiscalYearMutation = useApiMutation(fiscalYearsApi.deleteFiscalYear);
  const updateStatusMutation = useApiMutation(fiscalYearsApi.updateFiscalYearStatus);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    fiscalYear: '',
    startDate: '',
    endDate: '',
    isClosed: false
  });

  const handleOpenModal = (record = null) => {
    if (record && record.nativeEvent) record = null;
    if (record) {
      setEditingId(record.id);
      setFormData({
        fiscalYear: record.fiscalYear || '',
        startDate: record.startDate || '',
        endDate: record.endDate || '',
        isClosed: record.isClosed || false
      });
    } else {
      setEditingId(null);
      setFormData({
        fiscalYear: '',
        startDate: '',
        endDate: '',
        isClosed: false
      });
    }
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    const fyStr = formData.fiscalYear.trim();
    if (!fyStr) return "Fiscal Year is required";

    if (!/^\d{4}-\d{4}$/.test(fyStr)) {
      return "Fiscal year format must be YYYY-YYYY (e.g., 2027-2028)";
    }

    if (!formData.startDate) return "Start Date is required";
    if (!formData.endDate) return "End Date is required";

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (isNaN(start.getTime())) return "Valid Start Date is required";
    if (isNaN(end.getTime())) return "Valid End Date is required";

    if (end <= start) {
      return "End Date must be strictly after Start Date";
    }

    const [startYearStr, endYearStr] = fyStr.split('-');
    const startYear = parseInt(startYearStr, 10);
    const endYear = parseInt(endYearStr, 10);

    if (start.getFullYear() !== startYear) {
      return `Start Date year (${start.getFullYear()}) must match the fiscal year start (${startYear})`;
    }
    if (end.getFullYear() !== endYear) {
      return `End Date year (${end.getFullYear()}) must match the fiscal year end (${endYear})`;
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      dispatch(addAlert({ type: 'warning', message: error }));
      return;
    }

    try {
      const submitData = {
        fiscalYear: formData.fiscalYear.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        isClosed: formData.isClosed
      };

      if (editingId) {
        await updateFiscalYearMutation.mutateAsync({ id: editingId, data: submitData });
        dispatch(addAlert({ type: 'success', message: 'Fiscal Year updated successfully' }));
      } else {
        await createFiscalYearMutation.mutateAsync({ companyId, data: submitData });
        dispatch(addAlert({ type: 'success', message: 'Fiscal Year created successfully' }));
      }
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      console.error('Failed to save Fiscal Year:', err);
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || err?.message || 'Operation failed' }));
    }
  };

  const handleDelete = (record) => {
    confirmDialog(
      'Delete Fiscal Year',
      `Are you sure you want to delete Fiscal Year ${record.fiscalYear}? This action cannot be undone.`,
      async () => {
        try {
          await deleteFiscalYearMutation.mutateAsync(record.id);
          dispatch(addAlert({ type: 'success', message: 'Fiscal year deleted successfully' }));
          refetch();
        } catch (err) {
          dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to delete fiscal year' }));
        }
      }
    );
  };

  const handleStatusChange = (record, isClosed) => {
    const action = isClosed ? 'Close' : 'Reopen';
    confirmDialog(
      `${action} Fiscal Year`,
      `Are you sure you want to ${action.toLowerCase()} the Fiscal Year ${record.fiscalYear}?`,
      async () => {
        try {
          await updateStatusMutation.mutateAsync({ id: record.id, status: isClosed });
          dispatch(addAlert({ type: 'success', message: `Fiscal year ${isClosed ? 'closed' : 'opened'} successfully` }));
          refetch();
        } catch (err) {
          dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || `Failed to ${action.toLowerCase()} fiscal year` }));
        }
      }
    );
  };

  const handleReset = () => {
    resetFilters();
    setPage(0);
    setSelectedRows([]);
  };

  const getDuration = (start, end) => {
    if (!start || !end) return '-';
    try {
      const s = parseISO(start);
      const e = parseISO(end);
      const months = differenceInMonths(e, s);
      const days = differenceInDays(e, s) % 30;
      if (months > 0) {
        return `${months} mos ${days > 0 ? `${days} days` : ''}`;
      }
      return `${days} days`;
    } catch {
      return '-';
    }
  };

  // Column definitions for DataTable
  const columns = useMemo(() => [
    {
      id: 'fiscalYear',
      label: 'Fiscal Year',
      sortable: true,
      render: (val, row) => (
        <span className="font-semibold text-zinc-900 flex items-center gap-1.5">
          <Calendar size={13} className="text-zinc-400" />
          {row.fiscalYear || '-'}
        </span>
      )
    },
    {
      id: 'companyName',
      label: 'Company Name',
      sortable: true,
      render: (val, row) => <span className="text-zinc-700">{row.companyName || '-'}</span>
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
      id: 'isClosed',
      label: 'Status',
      sortable: true,
      align: 'center',
      render: (val, row) => (
        <DataTableStatusBadge status={!row.isClosed} activeLabel="Open" inactiveLabel="Closed" />
      )
    },
    {
      id: 'duration',
      label: 'Duration',
      sortable: false,
      render: (val, row) => (
        <span className="text-xs text-zinc-500 font-medium">
          {getDuration(row.startDate, row.endDate)}
        </span>
      )
    }
  ], []);

  // Basic Toolbar Filters
  const basicFilters = useMemo(() => [
    {
      id: 'isClosed',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Open', value: 'false' },
        { label: 'Closed', value: 'true' },
      ]
    }
  ], []);

  // Expandable Advanced Filters
  const advancedFilters = useMemo(() => [
    {
      title: 'Fiscal Period Identification',
      fields: [
        { id: 'fiscalYearName', label: 'Fiscal Year', placeholder: 'e.g. 2026-2027' }
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
      onClick: (row) => navigate(buildPath(`/accounts/organization/financial-years/${row.id}`)),
      tooltip: 'View Details',
      className: 'hover:text-blue-600 hover:bg-blue-50'
    },
    {
      key: 'audit',
      component: ({ row }) => <AuditLogHover audit={row.audit} />
    },
    {
      key: 'toggle-status',
      label: (row) => (row.isClosed ? 'Reopen Fiscal Year' : 'Close Fiscal Year'),
      icon: (row) => (row.isClosed ? CheckCircle : AlertCircle),
      onClick: (row) => handleStatusChange(row, !row.isClosed),
      tooltip: (row) => (row.isClosed ? 'Reopen Fiscal Year' : 'Close Fiscal Year'),
      className: (row) => (row.isClosed
        ? 'hover:text-emerald-600 hover:bg-emerald-50'
        : 'hover:text-amber-600 hover:bg-amber-50')
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: Edit,
      onClick: (row) => handleOpenModal(row),
      tooltip: 'Edit',
      className: 'hover:text-indigo-600 hover:bg-indigo-50'
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      onClick: (row) => handleDelete(row),
      tooltip: 'Delete'
    }
  ], [navigate, buildPath]);

  // Sub-row drawer renderer
  const renderExpandedRow = (fy) => (
    <div className="p-4 bg-white border border-zinc-100 rounded-lg shadow-2xs">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
        <div>
          <h3 className="text-base font-bold text-zinc-900">{fy.fiscalYear}</h3>
          <p className="text-xs font-medium text-zinc-500 mt-0.5">{fy.companyName || 'Company'}</p>
        </div>
        <div>
          <DataTableStatusBadge status={!fy.isClosed} activeLabel="Open" inactiveLabel="Closed" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Start Date</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{fy.startDate || '-'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">End Date</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{fy.endDate || '-'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Total Periods</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{fy.totalAccountingPeriods || fy.totalPeriods || 0}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Open Periods</p>
          <p className="text-sm font-medium text-emerald-600 mt-1">{fy.openPeriods || 0}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Closed Periods</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{fy.closedPeriods || 0}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Duration</p>
          <p className="text-sm font-medium text-zinc-900 mt-1">{getDuration(fy.startDate, fy.endDate)}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <PageHeader
        title="Fiscal Years"
        description="Manage fiscal years"
        icon={Calendar}
      >


        <RequirePermission module="FISCAL_YEARS" action="CREATE">
          <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span>New Fiscal Year</span>
          </button>
        </RequirePermission>
      </PageHeader>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          columns={columns}
          data={fiscalYears}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          onRowClick={(row) => navigate(buildPath(`/accounts/organization/financial-years/${row.id}`))}

          // Search
          searchable
          searchValue={filters.searchKey || ''}
          searchPlaceholder="Search fiscal year..."
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
          onVisibleColumnsChange={(cols) => {
            setVisibleColumns(cols);
            localStorage.setItem('fiscalYears_visible_columns', JSON.stringify(cols));
          }}

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
            totalElements: pageInfo?.totalElements || fiscalYears.length
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="fiscal years"

          // Empty State
          emptyMessage="No fiscal years found"
          emptyDescription="Try adjusting your search keywords or filter criteria to find fiscal years."
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Fiscal Year' : 'Create Fiscal Year'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Fiscal Year <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fiscalYear"
              value={formData.fiscalYear}
              onChange={handleInputChange}
              placeholder="e.g. 2026-2027"
              className="w-full h-9 px-3 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-zinc-400"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full h-9 px-3 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-zinc-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full h-9 px-3 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-zinc-400"
                required
              />
            </div>
          </div>

          {editingId && (
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isClosed"
                name="isClosed"
                checked={formData.isClosed}
                onChange={handleInputChange}
                className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
              />
              <label htmlFor="isClosed" className="text-xs font-medium text-zinc-700 select-none">
                Mark as Closed
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createFiscalYearMutation.isLoading || updateFiscalYearMutation.isLoading}
              className="btn-primary"
            >
              {editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="fiscal-years-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}
