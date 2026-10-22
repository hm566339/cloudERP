import React, { useState, useMemo, useEffect } from 'react';
import useListQuery from '../../../hooks/useListQuery';
import SearchInput from '../../../components/common/SearchInput';
import Pagination from '../../../components/common/Pagination';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Download,
  Printer,
  Eye,
  Edit,
  Trash2,
  FileText,
  RotateCcw,
  Coins,
  Layers,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { glJournalLinesApi, chartOfAccountsApi } from '../../../api/account';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { formatCurrency } from '../../../utils/formatters';
import usePermission from '../../../hooks/usePermission';
import { confirmDialog } from '../../../utils/confirmDialog';
import { useRoutePath } from '../../../hooks/useRoutePath';
import Modal from '../../../components/common/Modal';
import ComboBox from '../../../components/common/ComboBox';
import ExportModal from '../../../components/common/ExportModal';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { accountingTabs } from '../../../components/module-tabs';
import DataTable from '../../../components/data-table';
import useUrlFilters from '../../../hooks/useUrlFilters';

const STATUS_OPTIONS = [
  { value: 'false', label: 'Active' },
  { value: 'true', label: 'Deleted' }
];

const getStatusBadge = (status, isDeleted) => {
  if (isDeleted) {
    return <span className="px-2.5 py-0.5 text-[8px] font-bold uppercase rounded-md border bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50">DELETED</span>;
  }
  switch (status) {
    case 'POSTED':
    case 'APPROVED':
      return <span className="px-2.5 py-0.5 text-[8px] font-bold uppercase rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50"><CheckCircle size={10} className="inline mr-1 mb-0.5" />{status}</span>;
    case 'CANCELLED':
    case 'REJECTED':
      return <span className="px-2.5 py-0.5 text-[8px] font-bold uppercase rounded-md border bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50">{status}</span>;
    case 'DRAFT':
    case 'REVERSED':
      return <span className="px-2.5 py-0.5 text-[8px] font-bold uppercase rounded-md border bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-[#1D212C] dark:text-[#A0A6B5] dark:border-[#2A2F3D]"><Clock size={10} className="inline mr-1 mb-0.5" />{status}</span>;
    default:
      return <span className="px-2.5 py-0.5 text-[8px] font-bold uppercase rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50">ACTIVE</span>;
  }
};

/**
 * RFQ-style 3-Column Expandable Journal Line Details
 */
const JournalLineOverview = ({ line }) => {
  const curr = line.currencyCode || line.currency || 'INR';
  const debitNum = Number(line.debitAmount || 0);
  const creditNum = Number(line.creditAmount || 0);

  return (
    <div className="p-4 bg-zinc-50/60 dark:bg-[#161922]/60 border-y border-zinc-200 dark:border-[#2A2F3D] animate-in fade-in slide-in-from-top-1 duration-200" onClick={e => e.stopPropagation()}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Column 1: Voucher & Account */}
        <div className="bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-[#2A2F3D]">
            <BookOpen size={16} className="text-zinc-600 dark:text-[#A0A6B5]" />
            <h4 className="text-xs font-bold text-zinc-900 dark:text-[#E6E8EE] uppercase tracking-wider">Line Information</h4>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-zinc-400 dark:text-[#6B7184] block text-[9px] uppercase font-semibold">Voucher No</span>
              <span className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">{line.voucherNo || line.id?.substring(0, 8) || '—'}</span>
            </div>
            <div>
              <span className="text-zinc-400 dark:text-[#6B7184] block text-[9px] uppercase font-semibold">Date</span>
              <span className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">{line.voucherDate || '—'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-zinc-400 dark:text-[#6B7184] block text-[9px] uppercase font-semibold">Account</span>
              <span className="font-mono text-zinc-800 dark:text-[#E6E8EE] font-semibold">{line.accountCode}</span>
              {line.accountName && <span className="text-zinc-700 dark:text-[#A0A6B5] text-[11px] block truncate">{line.accountName}</span>}
            </div>
            <div className="col-span-2">
              <span className="text-zinc-400 dark:text-[#6B7184] block text-[9px] uppercase font-semibold">Journal Entry ID</span>
              <span className="font-mono text-zinc-600 dark:text-[#A0A6B5] text-xs truncate block">{line.journalEntryId || line.journalId || '—'}</span>
            </div>
          </div>
        </div>

        {/* Column 2: Financial Amounts */}
        <div className="bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-[#2A2F3D]">
            <Coins size={16} className="text-zinc-600 dark:text-[#A0A6B5]" />
            <h4 className="text-xs font-bold text-zinc-900 dark:text-[#E6E8EE] uppercase tracking-wider">Financial Amounts</h4>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-zinc-400 dark:text-[#6B7184] block text-[9px] uppercase font-semibold">Debit Amount</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {debitNum > 0 ? formatCurrency(debitNum, curr) : '—'}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 dark:text-[#6B7184] block text-[9px] uppercase font-semibold">Credit Amount</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {creditNum > 0 ? formatCurrency(creditNum, curr) : '—'}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 dark:text-[#6B7184] block text-[9px] uppercase font-semibold">Base Amount</span>
              <span className="font-semibold text-zinc-800 dark:text-[#E6E8EE]">
                {line.baseAmount != null ? formatCurrency(line.baseAmount, curr) : '—'}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 dark:text-[#6B7184] block text-[9px] uppercase font-semibold">Exchange Rate</span>
              <span className="font-semibold text-zinc-800 dark:text-[#E6E8EE]">{line.exchangeRate || '1.0'}</span>
            </div>
            <div className="col-span-2 pt-2 border-t border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between">
              <span className="text-zinc-500 dark:text-[#A0A6B5] text-[10px] uppercase font-semibold">Currency</span>
              <span className="font-bold text-zinc-900 dark:text-[#E6E8EE]">{curr}</span>
            </div>
          </div>
        </div>

        {/* Column 3: Remarks & Audit */}
        <div className="bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-[#2A2F3D]">
            <FileText size={16} className="text-zinc-600 dark:text-[#A0A6B5]" />
            <h4 className="text-xs font-bold text-zinc-900 dark:text-[#E6E8EE] uppercase tracking-wider">Description & Metadata</h4>
          </div>
          <div className="space-y-2 text-xs">
            {line.lineDescription && (
              <div>
                <span className="text-zinc-400 dark:text-[#6B7184] block text-[9px] uppercase font-semibold">Description</span>
                <p className="text-zinc-800 dark:text-[#E6E8EE] text-[11px] leading-relaxed">{line.lineDescription}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-[#2A2F3D]">
              <div>
                <span className="text-zinc-400 dark:text-[#6B7184] block text-[9px] uppercase font-semibold">Status</span>
                <div className="mt-0.5">{getStatusBadge(line.status, line.isDeleted)}</div>
              </div>
              <div>
                <span className="text-zinc-400 dark:text-[#6B7184] block text-[9px] uppercase font-semibold">Created At</span>
                <span className="text-zinc-700 dark:text-[#A0A6B5]">{line.createdAt ? new Date(line.createdAt).toLocaleDateString() : '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function JournalLines() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const selectedCompany = useAppSelector((state) => state.company.selectedCompany);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const location = useLocation();

  const canCreate = usePermission('GL_JOURNAL_LINES', 'CREATE');
  const canUpdate = usePermission('GL_JOURNAL_LINES', 'UPDATE');
  const canDelete = usePermission('GL_JOURNAL_LINES', 'DELETE');

  const fallbackCompanyId = JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;

  const { data: accountsData } = useApiQuery(
    chartOfAccountsApi.getList,
    {
      companyId: selectedCompany?.id || fallbackCompanyId,
      page: 0,
      size: 1000
    },
    { skip: !(selectedCompany?.id || fallbackCompanyId) }
  );

  const accountOptions = useMemo(() => {
    const raw = accountsData?.data?.data || accountsData?.data?.content || accountsData?.content || accountsData?.data || accountsData || [];
    const list = Array.isArray(raw) ? raw : (raw?.content && Array.isArray(raw.content) ? raw.content : []);
    return list.map(acc => ({
      value: acc.id,
      label: `${acc.accountCode} - ${acc.accountName}`
    }));
  }, [accountsData]);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [expandedRowId, setExpandedRowId] = useState(null);

  const initialFormData = {
    journalId: '',
    accountId: '',
    debitAmount: 0,
    creditAmount: 0,
    currencyCode: 'INR',
    exchangeRate: 1.0,
    lineDescription: ''
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const {
    page, setPage, pageSize, setPageSize, apiParams,
    searchTerm: search, setSearchTerm: setSearch, debouncedSearch,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10 });

  const effectiveCompanyId = filters.companyId || selectedCompany?.id || fallbackCompanyId;

  const createLineMutation = useApiMutation(glJournalLinesApi.createJournalLine);
  const updateLineMutation = useApiMutation(glJournalLinesApi.updateJournalLine);
  const deleteLineMutation = useApiMutation(glJournalLinesApi.deleteJournalLine);

  useEffect(() => {
    if (selectedCompany?.id) {
      setFilter('companyId', selectedCompany.id);
    }
  }, [selectedCompany]);

  const fetchJournalLines = async () => {
    if (!effectiveCompanyId) {
      setError("Company is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = {
        companyId: effectiveCompanyId,
        page,
        pageSize: pageSize,
        ...Object.fromEntries(
          Object.entries(filters).filter(([k, v]) => v !== '' && v !== null && v !== undefined && k !== 'companyId')
        )
      };

      if (sortBy) {
        params.sortBy = sortBy;
        params.sortDirection = (sortOrder || 'asc').toUpperCase();
      }
      if (debouncedSearch) {
        params.description = debouncedSearch;
      }

      const res = await glJournalLinesApi.getJournalLines(params);
      setData(res?.data || res);
    } catch (err) {
      console.error("API error:", err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load journal lines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (effectiveCompanyId) {
      fetchJournalLines();
    }
  }, [effectiveCompanyId, page, pageSize, sortBy, sortOrder, debouncedSearch, JSON.stringify(filters)]);

  const handleFilterChange = (name, value) => {
    setFilter(name, value);
  };

  const handleClearFilters = () => {
    resetFilters();
  };

  const toggleRow = (id) => {
    setExpandedRowId(prev => prev === id ? null : id);
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseFloat(value) : '') : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        companyId: effectiveCompanyId,
        companyIdUUID: effectiveCompanyId
      };

      if (editingId) {
        await updateLineMutation.mutateAsync({ id: editingId, ...payload });
        dispatch(addAlert({ type: 'success', message: 'Journal line updated successfully!' }));
      } else {
        await createLineMutation.mutateAsync(payload);
        dispatch(addAlert({ type: 'success', message: 'Journal line created successfully!' }));
      }
      setIsModalOpen(false);
      fetchJournalLines();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.data?.message || 'Failed to save journal line.' }));
    }
  };

  const handleDelete = async (id) => {
    if (await confirmDialog({ title: 'Delete Journal Line', message: 'Are you sure you want to delete this line?' })) {
      try {
        await deleteLineMutation.mutateAsync(id);
        dispatch(addAlert({ type: 'success', message: 'Journal line deleted successfully.' }));
        fetchJournalLines();
      } catch (err) {
        dispatch(addAlert({ type: 'error', message: err?.data?.message || 'Failed to delete.' }));
      }
    }
  };

  const handleEdit = (line) => {
    setEditingId(line.id);
    setFormData({
      journalId: line.journalEntryId || line.journalId || '',
      accountId: line.accountId || '',
      debitAmount: line.debitAmount || 0,
      creditAmount: line.creditAmount || 0,
      currencyCode: line.currencyCode || line.currency || 'INR',
      exchangeRate: line.exchangeRate || 1.0,
      lineDescription: line.lineDescription || line.description || ''
    });
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({
      journalId: '',
      accountId: '',
      debitAmount: 0,
      creditAmount: 0,
      currencyCode: selectedCompany?.baseCurrency || 'INR',
      exchangeRate: 1.0,
      lineDescription: ''
    });
    setIsModalOpen(true);
  };

  const journalLines = data?.content || [];
  const pageInfo = data || {};
  const totalElements = pageInfo.totalElements || journalLines.length;
  const totalPages = pageInfo.totalPages || 1;
  const stats = data?.statistics || {};

  const totalLinesCount = totalElements;
  const totalDebit = stats?.totalDebit || journalLines.reduce((sum, line) => sum + (parseFloat(line.debitAmount) || 0), 0);
  const totalCredit = stats?.totalCredit || journalLines.reduce((sum, line) => sum + (parseFloat(line.creditAmount) || 0), 0);
  const netBalance = Math.abs(totalDebit - totalCredit);

  const columns = [
    {
      key: 'voucherNo',
      label: 'VOUCHER NO.',
      sortable: true,
      className: 'w-32 whitespace-nowrap',
      render: (val, row) => (
        <span className="font-mono text-zinc-900 dark:text-[#E6E8EE] font-bold">
          {val || row.id?.substring(0, 8) || '—'}
        </span>
      )
    },
    {
      key: 'voucherDate',
      label: 'DATE',
      sortable: true,
      className: 'w-28 whitespace-nowrap',
      render: (val) => <span className="text-zinc-600 dark:text-[#A0A6B5] font-medium">{val || '—'}</span>
    },
    {
      key: 'accountCode',
      label: 'ACCOUNT',
      sortable: false,
      className: 'min-w-[180px]',
      render: (val, row) => (
        <div className="truncate">
          <span className="font-mono text-zinc-800 dark:text-[#E6E8EE] font-semibold text-xs">{val}</span>
          {row.accountName && <span className="text-zinc-600 dark:text-[#A0A6B5] text-xs ml-1.5">— {row.accountName}</span>}
        </div>
      )
    },
    {
      key: 'debitAmount',
      label: 'DEBIT',
      sortable: true,
      className: 'text-right w-32 whitespace-nowrap',
      render: (val) => {
        const num = Number(val || 0);
        return num > 0 ? (
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            ₹{num.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        ) : (
          <span className="text-zinc-400 dark:text-[#6B7184] font-medium">—</span>
        );
      }
    },
    {
      key: 'creditAmount',
      label: 'CREDIT',
      sortable: true,
      className: 'text-right w-32 whitespace-nowrap',
      render: (val) => {
        const num = Number(val || 0);
        return num > 0 ? (
          <span className="font-bold text-rose-600 dark:text-rose-400">
            ₹{num.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        ) : (
          <span className="text-zinc-400 dark:text-[#6B7184] font-medium">—</span>
        );
      }
    },
    {
      key: 'lineDescription',
      label: 'DESCRIPTION',
      sortable: false,
      className: 'min-w-[180px]',
      render: (val) => <span className="text-zinc-700 dark:text-[#A0A6B5] truncate max-w-[240px] block" title={val}>{val || '—'}</span>
    },
    {
      key: 'currencyCode',
      label: 'CURRENCY',
      sortable: false,
      className: 'w-24 whitespace-nowrap',
      render: (val) => <span className="text-zinc-600 dark:text-[#A0A6B5] font-medium">{val || 'INR'}</span>
    },
    {
      key: 'baseAmount',
      label: 'BASE AMOUNT',
      sortable: false,
      className: 'text-right w-32 whitespace-nowrap',
      render: (val) => val != null ? <span className="font-medium text-zinc-800 dark:text-[#E6E8EE]">₹{Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span> : '—'
    },
    {
      key: 'exchangeRate',
      label: 'RATE',
      sortable: false,
      className: 'w-20 whitespace-nowrap text-center',
      render: (val) => <span className="text-zinc-600 dark:text-[#A0A6B5]">{val || '1.0'}</span>
    },
    {
      key: 'createdAt',
      label: 'CREATED AT',
      sortable: true,
      className: 'w-28 whitespace-nowrap',
      render: (val) => <span className="text-zinc-500 dark:text-[#A0A6B5] text-xs">{val ? new Date(val).toLocaleDateString() : '—'}</span>
    }
  ];

  const basicFilters = [
    {
      key: 'accountId',
      label: 'Account',
      type: 'select',
      searchable: true,
      options: accountOptions,
      placeholder: 'All Accounts'
    },
    {
      key: 'fromDate',
      label: 'From Date',
      type: 'date'
    },
    {
      key: 'toDate',
      label: 'To Date',
      type: 'date'
    }
  ];

  const advancedFilters = [
    {
      id: 'line_filters',
      title: 'Line Filters',
      fields: [
        {
          id: 'isDeleted',
          label: 'Status',
          type: 'select',
          options: [{ value: '', label: 'All Status' }, ...STATUS_OPTIONS]
        },
        {
          id: 'journalEntryId',
          label: 'Journal Entry ID',
          type: 'text',
          placeholder: 'Journal ID'
        },
        {
          id: 'voucherNumber',
          label: 'Voucher No.',
          type: 'text',
          placeholder: 'Voucher No.'
        }
      ]
    }
  ];

  const rowActions = (line) => {
    const actions = [
      {
        key: 'view',
        label: 'View Details',
        icon: <Eye size={15} />,
        onClick: () => toggleRow(line.id)
      }
    ];

    if (canUpdate && !line.isDeleted) {
      actions.push({
        key: 'edit',
        label: 'Edit Line',
        icon: <Edit size={15} />,
        onClick: () => handleEdit(line)
      });
    }

    if (canDelete && !line.isDeleted) {
      actions.push({
        key: 'delete',
        label: 'Delete Line',
        icon: <Trash2 size={15} className="text-rose-600" />,
        onClick: () => handleDelete(line.id)
      });
    }

    actions.push({
      key: 'page',
      label: 'Open Details',
      icon: <FileText size={15} className="text-blue-600" />,
      onClick: () => navigate(buildPath(`/accounts/transactions/journal-lines/${line.id}`))
    });

    return actions;
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      {/* 1. Common Enterprise Page Header */}
      <PageHeader
        title="GL Journal Lines"
        description="Detailed debit and credit lines for journal entries."
        icon={BookOpen}
        actionButtons={[
          {
            key: 'print',
            label: 'Print',
            icon: Printer,
            variant: 'outline',
            onClick: () => window.print()
          },
          {
            key: 'export',
            label: 'Export',
            icon: Download,
            variant: 'outline',
            onClick: () => setIsExportModalOpen(true)
          },
          ...(canCreate ? [{
            key: 'new',
            label: 'New Line',
            icon: Plus,
            variant: 'primary',
            onClick: openNewModal
          }] : [])
        ]}
      />

      {/* 2. Common Enterprise Module Tabs */}
      <ModuleTabs tabs={accountingTabs} />

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-5 min-h-0">
        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-xl text-sm font-medium">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* 4. Enterprise Reusable DataTable */}
        <div className="flex-1 min-h-[300px]">
          <DataTable
            columns={columns}
            data={journalLines}
            rowKey="id"
            loading={loading}
            searchable={true}
            searchValue={search || ''}
            searchPlaceholder="Search journal lines..."
            onSearchChange={(val) => setSearch(val)}
            basicFilters={basicFilters}
            filterValues={filters}
            onFilterChange={handleFilterChange}
            advancedFilters={advancedFilters}
            onReset={handleClearFilters}
            onRefresh={() => fetchJournalLines()}
            exportable={true}
            onExport={() => setIsExportModalOpen(true)}
            expandedRowId={expandedRowId}
            onToggleExpand={toggleRow}
            renderExpandedRow={(line) => (
              <JournalLineOverview line={line} />
            )}
            rowActions={rowActions}
            pagination={{
              page: page,
              pageSize: pageSize,
              totalPages: totalPages,
              totalElements: totalElements
            }}
            pageIndexBase={0}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            sort={{
              key: sortBy,
              direction: sortOrder
            }}
            onSortChange={handleColumnSort}
            itemName="items"
            emptyMessage="No journal lines found"
            emptyDescription="Create your first journal line or try adjusting your search filters."
          />
        </div>
      </div>

      {/* Create / Edit Line Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Journal Line' : 'Create Journal Line'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1 block">Journal Entry ID *</label>
            <input
              type="text"
              name="journalId"
              value={formData.journalId}
              onChange={handleInputChange}
              required
              placeholder="e.g. UUID or voucher code"
              className="w-full h-9 px-3 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-zinc-400 dark:focus:border-[#4C8DFF] outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1 block">Account *</label>
            <ComboBox
              options={accountOptions}
              value={formData.accountId}
              onChange={(val) => setFormData(prev => ({ ...prev, accountId: val }))}
              placeholder="Search and select account..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1 block">Debit Amount</label>
              <input
                type="number"
                step="0.01"
                name="debitAmount"
                value={formData.debitAmount}
                onChange={handleInputChange}
                className="w-full h-9 px-3 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-zinc-400 dark:focus:border-[#4C8DFF] outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1 block">Credit Amount</label>
              <input
                type="number"
                step="0.01"
                name="creditAmount"
                value={formData.creditAmount}
                onChange={handleInputChange}
                className="w-full h-9 px-3 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-zinc-400 dark:focus:border-[#4C8DFF] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1 block">Currency Code</label>
              <input
                type="text"
                name="currencyCode"
                value={formData.currencyCode}
                onChange={handleInputChange}
                className="w-full h-9 px-3 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-zinc-400 dark:focus:border-[#4C8DFF] outline-none uppercase"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1 block">Exchange Rate</label>
              <input
                type="number"
                step="0.0001"
                name="exchangeRate"
                value={formData.exchangeRate}
                onChange={handleInputChange}
                className="w-full h-9 px-3 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-zinc-400 dark:focus:border-[#4C8DFF] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1 block">Description</label>
            <textarea
              name="lineDescription"
              value={formData.lineDescription}
              onChange={handleInputChange}
              rows={3}
              placeholder="Line notes or description..."
              className="w-full p-2.5 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-zinc-400 dark:focus:border-[#4C8DFF] outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-[#2A2F3D]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="h-9 px-4 text-xs font-semibold text-zinc-600 dark:text-[#A0A6B5] hover:text-zinc-900 dark:hover:text-[#E6E8EE] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 dark:hover:bg-[#222736]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLineMutation.isLoading || updateLineMutation.isLoading}
              className="btn-primary h-9 px-5 text-xs font-semibold flex items-center gap-2"
            >
              {(createLineMutation.isLoading || updateLineMutation.isLoading) && (
                <RotateCcw size={14} className="animate-spin" />
              )}
              <span>{editingId ? 'Update Line' : 'Create Line'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="journal-lines"
        defaultFilters={Object.fromEntries(Object.entries({ ...filters, page, pageSize }).filter(([k, v]) => v !== '' && v !== null))}
      />
    </div>
  );
}
