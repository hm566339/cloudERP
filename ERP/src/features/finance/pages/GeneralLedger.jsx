import React, { useState, useEffect, useMemo } from 'react';
import useListQuery from '../../../hooks/useListQuery';
import SearchInput from '../../../components/common/SearchInput';
import Pagination from '../../../components/common/Pagination';
import { useSearchParams } from 'react-router-dom';
import {
  BookMarked,
  Printer,
  Download,
  AlertCircle,
  Eye,
  Coins,
  FileText,
  RotateCcw
} from 'lucide-react';
import { useAppSelector } from '../../../app/hooks';
import { getGeneralLedger } from '../../../api/account/reports';
import { chartOfAccountsApi } from '../../../api/account';
import { useApiQuery } from '../../../hooks/useApi';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { accountingTabs } from '../../../components/module-tabs';
import DataTable from '../../../components/data-table';
import ExportModal from '../../../components/common/ExportModal';
import AccountSummary from '../../../components/accounting/AccountSummary';

const VOUCHER_TYPES = [
  { value: 'SALES_INVOICE', label: 'Sales Invoice' },
  { value: 'PURCHASE_INVOICE', label: 'Purchase Invoice' },
  { value: 'JOURNAL_ENTRY', label: 'Journal Entry' },
  { value: 'PAYMENT_VOUCHER', label: 'Payment Voucher' },
  { value: 'RECEIPT_VOUCHER', label: 'Receipt Voucher' },
  { value: 'CREDIT_NOTE', label: 'Credit Note' },
  { value: 'DEBIT_NOTE', label: 'Debit Note' }
];

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'POSTED', label: 'Posted' },
  { value: 'CANCELLED', label: 'Cancelled' }
];

const TRANSACTION_TYPES = [
  { value: 'DEBIT', label: 'Debit Only' },
  { value: 'CREDIT', label: 'Credit Only' }
];

/**
 * Format date strictly as DD/MM/YYYY
 */
const formatLedgerDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const cleanStr = String(dateStr).split('T')[0];
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
    return String(dateStr);
  } catch (e) {
    return String(dateStr);
  }
};

/**
 * Indian numbering currency formatter
 */
const formatINR = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(val));
};

const getStatusBadge = (status) => {
  if (!status) return <span className="px-2.5 py-0.5 text-[8px] font-bold uppercase rounded-md border bg-zinc-50 text-zinc-600 border-zinc-200">DRAFT</span>;
  const s = status.toString().toUpperCase();
  if (s === 'POSTED' || s === 'APPROVED' || s === 'PAID') return <span className="px-2.5 py-0.5 text-[8px] font-bold uppercase rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200">{status}</span>;
  if (s === 'CREATED' || s === 'DRAFT' || s === 'PENDING_APPROVAL' || s === 'PARTIALLY_PAID') return <span className="px-2.5 py-0.5 text-[8px] font-bold uppercase rounded-md border bg-amber-50 text-amber-700 border-amber-200">{status}</span>;
  if (s === 'CANCELLED' || s === 'REJECTED') return <span className="px-2.5 py-0.5 text-[8px] font-bold uppercase rounded-md border bg-rose-50 text-rose-700 border-rose-200">{status}</span>;
  return <span className="px-2.5 py-0.5 text-[8px] font-bold uppercase rounded-md border bg-blue-50 text-blue-700 border-blue-200">{status}</span>;
};

/**
 * RFQ-style 3-Column Expandable Transaction Details
 */
const TransactionOverview = ({ transaction, reportData }) => {
  const debitNum = Number(transaction.debit || 0);
  const creditNum = Number(transaction.credit || 0);
  const voucherTypeDisplay = transaction.type || (transaction.voucherType ? transaction.voucherType.replace(/_/g, ' ') : '') || '—';

  return (
    <div className="p-4 bg-zinc-50/60 border-y border-zinc-200 animate-in fade-in slide-in-from-top-1 duration-200" onClick={e => e.stopPropagation()}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Column 1: Transaction Information */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
            <BookMarked size={16} className="text-zinc-600" />
            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Transaction Info</h4>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-zinc-400 block text-[9px] uppercase font-semibold">Voucher No</span>
              <span className="font-semibold text-zinc-900">{transaction.voucherNumber || '—'}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[9px] uppercase font-semibold">Date</span>
              <span className="font-semibold text-zinc-900">{formatLedgerDate(transaction.voucherDate)}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[9px] uppercase font-semibold">Voucher Type</span>
              <span className="font-medium text-zinc-800">{voucherTypeDisplay}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[9px] uppercase font-semibold">Ref / UTR</span>
              <span className="font-mono text-zinc-800">{transaction.referenceNo || '—'}</span>
            </div>
          </div>
        </div>

        {/* Column 2: Financial Summary */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
            <Coins size={16} className="text-zinc-600" />
            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Financial Impact</h4>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-zinc-400 block text-[9px] uppercase font-semibold">Account</span>
              <span className="font-semibold text-zinc-900 truncate block">{reportData?.accountName || transaction.accountName || '—'}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[9px] uppercase font-semibold">Status</span>
              <div className="mt-0.5">{getStatusBadge(transaction.status)}</div>
            </div>
            <div>
              <span className="text-zinc-400 block text-[9px] uppercase font-semibold">Debit (DR)</span>
              <span className="font-bold text-emerald-600">{debitNum > 0 ? formatINR(debitNum) : '—'}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[9px] uppercase font-semibold">Credit (CR)</span>
              <span className="font-bold text-rose-600">{creditNum > 0 ? formatINR(creditNum) : '—'}</span>
            </div>
            <div className="col-span-2 pt-2 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-zinc-500 text-[10px] uppercase font-semibold">Running Balance</span>
              <span className="font-bold text-zinc-900">
                {transaction.runningBalance?.amount != null ? formatINR(transaction.runningBalance.amount) : '₹0.00'}
              </span>
            </div>
          </div>
        </div>

        {/* Column 3: Remarks & Metadata */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
            <FileText size={16} className="text-zinc-600" />
            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Narration & Metadata</h4>
          </div>
          <div className="space-y-2 text-xs">
            {transaction.narration && (
              <div>
                <span className="text-zinc-400 block text-[9px] uppercase font-semibold">Narration</span>
                <p className="text-zinc-800 text-[11px] leading-relaxed">{transaction.narration}</p>
              </div>
            )}
            {transaction.description && (
              <div>
                <span className="text-zinc-400 block text-[9px] uppercase font-semibold">Description</span>
                <p className="text-zinc-800 text-[11px] leading-relaxed">{transaction.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100">
              <div>
                <span className="text-zinc-400 block text-[9px] uppercase font-semibold">Created By</span>
                <span className="text-zinc-700">{transaction.createdBy || 'System'}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[9px] uppercase font-semibold">Currency</span>
                <span className="text-zinc-700">{transaction.currency || 'INR'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function GeneralLedger() {
  const selectedCompany = useAppSelector((state) => state.company.selectedCompany);
  const [searchParams, setSearchParams] = useSearchParams();

  const urlAccountId = searchParams.get('accountId') || '';
  const urlFromDate = searchParams.get('fromDate') || '';
  const urlToDate = searchParams.get('toDate') || '';

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const fallbackCompanyId = JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;

  const initialFilters = {
    companyId: selectedCompany?.id || fallbackCompanyId || '',
    accountId: urlAccountId,
    fromDate: urlFromDate,
    toDate: urlToDate,
    branchId: '',
    costCenterId: '',
    projectId: '',
    voucherType: '',
    voucherNumber: '',
    referenceNo: '',
    status: '',
    createdBy: '',
    currency: '',
    transactionType: '',
    minAmount: '',
    maxAmount: '',
    narration: '',
    page: 0,
    pageSize: 10,
    sortBy: '',
    sortOrder: 'asc'
  };

  const [filters, setFilters] = useState(initialFilters);
  const [selectedAccountObj, setSelectedAccountObj] = useState(null);

  const [visibleColumns, setVisibleColumns] = useState([
    'voucherDate',
    'referenceNo',
    'narration',
    'debit',
    'credit',
    'runningBalance',
    'status'
  ]);

  const effectiveCompanyId = filters.companyId || selectedCompany?.id || fallbackCompanyId;

  const { data: accountsData } = useApiQuery(
    chartOfAccountsApi.getList,
    { size: 1000, companyId: effectiveCompanyId }
  );

  const accountOptions = useMemo(() => {
    const raw = accountsData?.data?.data || accountsData?.data?.content || accountsData?.content || accountsData?.data || accountsData || [];
    const list = Array.isArray(raw) ? raw : (raw?.content && Array.isArray(raw.content) ? raw.content : []);

    const validAccounts = list.filter(acc =>
      acc.isActive !== false &&
      acc.postingAllowed !== false &&
      acc.deleted !== true
    );

    return validAccounts.map(acc => ({
      value: acc.id,
      label: `${acc.accountCode ? acc.accountCode + ' - ' : ''}${acc.accountName || acc.name || ''}`
    }));
  }, [accountsData]);

  // If selected account is not in accountOptions yet, fetch it by ID so label is always shown
  useEffect(() => {
    if (filters.accountId) {
      const exists = accountOptions.some(o => o.value === filters.accountId);
      if (!exists && (!selectedAccountObj || selectedAccountObj.value !== filters.accountId)) {
        chartOfAccountsApi.getById(filters.accountId)
          .then(res => {
            const acc = res?.data?.data || res?.data || res;
            if (acc && (acc.accountName || acc.name)) {
              setSelectedAccountObj({
                value: acc.id,
                label: `${acc.accountCode ? acc.accountCode + ' - ' : ''}${acc.accountName || acc.name || ''}`
              });
            }
          })
          .catch(() => { });
      }
    }
  }, [filters.accountId, accountOptions, selectedAccountObj]);

  const mergedAccountOptions = useMemo(() => {
    if (selectedAccountObj && !accountOptions.some(o => o.value === selectedAccountObj.value)) {
      return [selectedAccountObj, ...accountOptions];
    }
    return accountOptions;
  }, [accountOptions, selectedAccountObj]);

  // Sync state if URL query params change (e.g. from top header SearchAccount or browser back/forward)
  useEffect(() => {
    const nextAcc = searchParams.get('accountId') || '';
    const nextFrom = searchParams.get('fromDate') || '';
    const nextTo = searchParams.get('toDate') || '';

    setFilters(prev => {
      if (prev.accountId === nextAcc && prev.fromDate === nextFrom && prev.toDate === nextTo) {
        return prev;
      }
      return {
        ...prev,
        accountId: nextAcc,
        fromDate: nextFrom,
        toDate: nextTo,
        page: 0
      };
    });
  }, [searchParams]);

  useEffect(() => {
    if (selectedCompany?.id) {
      setFilters(prev => ({ ...prev, companyId: selectedCompany.id }));
    }
  }, [selectedCompany]);

  const syncUrlParams = (updatedFilters) => {
    const nextParams = new URLSearchParams(searchParams);
    if (updatedFilters.accountId) nextParams.set('accountId', updatedFilters.accountId);
    else nextParams.delete('accountId');

    if (updatedFilters.fromDate) nextParams.set('fromDate', updatedFilters.fromDate);
    else nextParams.delete('fromDate');

    if (updatedFilters.toDate) nextParams.set('toDate', updatedFilters.toDate);
    else nextParams.delete('toDate');

    setSearchParams(nextParams, { replace: true });
  };

  const fetchReport = async (overrideFilters = {}) => {
    const currentFilters = { ...filters, ...overrideFilters };

    if (!currentFilters.accountId) {
      setError("Please select an account to generate the General Ledger report.");
      return;
    }
    if (!currentFilters.companyId) {
      const fallback = JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;
      if (fallback) {
        currentFilters.companyId = fallback;
        setFilters(prev => ({ ...prev, companyId: fallback }));
      } else {
        setError("Company is required. Please select a company from the top menu.");
        return;
      }
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const params = Object.fromEntries(
        Object.entries(currentFilters).filter(([k, v]) => v !== '' && v !== null && v !== undefined && k !== 'sortOrder')
      );

      params.includeOpening = true;
      params.includeClosing = true;
      if (currentFilters.sortBy) {
        params.sortBy = currentFilters.sortBy;
      }
      params.sortDirection = (currentFilters.sortOrder || 'asc').toUpperCase();
      params.page = currentFilters.page || 0;
      params.pageSize = currentFilters.pageSize || 10;

      const res = await getGeneralLedger(params);

      const parsedData = res?.data?.data || res?.data || res;
      if (res && (res.success !== false && (res.success || parsedData))) {
        setData(parsedData);
      } else {
        setError(res?.message || 'Failed to fetch report');
      }
    } catch (err) {
      console.error("API error:", err);
      setError(err?.response?.data?.message || err?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Automatically fetch report when accountId or dates change
  useEffect(() => {
    if (effectiveCompanyId && filters.accountId) {
      fetchReport();
    }
  }, [effectiveCompanyId, filters.accountId, filters.fromDate, filters.toDate]);

  useEffect(() => {
    if (hasSearched && filters.accountId) {
      fetchReport();
    }
  }, [filters.page, filters.pageSize, filters.sortBy, filters.sortOrder]);

  const handleFilterChange = (name, value) => {
    if (name === 'pageSize' || name === 'sortBy' || name === 'sortOrder') {
      setFilters(prev => ({ ...prev, [name]: value, page: 0 }));
    } else if (name === 'accountId') {
      const next = { ...filters, accountId: value, page: 0 };
      setFilters(next);
      syncUrlParams(next);
      if (!value) {
        setData(null);
        setHasSearched(false);
      }
    } else if (name === 'fromDate' || name === 'toDate') {
      const next = { ...filters, [name]: value, page: 0 };
      setFilters(next);
      syncUrlParams(next);
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleClearFilters = () => {
    const cleared = {
      ...initialFilters,
      companyId: selectedCompany?.id || fallbackCompanyId || '',
      accountId: '',
      fromDate: '',
      toDate: ''
    };
    setFilters(cleared);
    syncUrlParams(cleared);
    setData(null);
    setError(null);
    setHasSearched(false);
  };

  const toggleRow = (id) => {
    setExpandedRowId(prev => prev === id ? null : id);
  };

  const reportData = data?.data || data;
  const transactions = reportData?.transactions || [];

  const columns = [
    {
      key: 'voucherDate',
      label: 'DATE',
      sortable: true,
      className: 'w-32 whitespace-nowrap',
      render: (val) => (
        <span className="font-medium text-zinc-700">
          {formatLedgerDate(val)}
        </span>
      )
    },
    {
      key: 'referenceNo',
      label: 'REF / UTR NO.',
      sortable: false,
      className: 'w-48 whitespace-nowrap',
      render: (val, row) => (
        <div className="flex flex-col gap-0.5 font-mono text-zinc-800">
          <span className="font-semibold">{row.voucherNumber || '—'}</span>
          {val ? (
            <span className="text-zinc-500 text-[8.5px] uppercase font-semibold">
              UTR: {val}
            </span>
          ) : null}
        </div>
      )
    },
    {
      key: 'narration',
      label: 'NARRATION',
      sortable: false,
      className: 'min-w-[200px]',
      render: (val, row) => {
        const voucherTypeDisplay = row.type || (row.voucherType ? row.voucherType.replace(/_/g, ' ') : '');
        return (
          <div className="space-y-1">
            <div className="font-medium text-zinc-800 leading-snug">
              {val || row.description || `${voucherTypeDisplay ? voucherTypeDisplay + ' - ' : ''}${row.accountName || '—'}`}
            </div>
            {voucherTypeDisplay && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[7.5px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-200">
                {voucherTypeDisplay}
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'debit',
      label: 'DEBIT (DR)',
      sortable: true,
      className: 'text-right w-36 whitespace-nowrap',
      render: (val) => {
        const num = Number(val || 0);
        return num > 0 ? (
          <span className="font-bold text-emerald-600">{formatINR(num)}</span>
        ) : (
          <span className="text-zinc-400 font-medium">—</span>
        );
      }
    },
    {
      key: 'credit',
      label: 'CREDIT (CR)',
      sortable: true,
      className: 'text-right w-36 whitespace-nowrap',
      render: (val) => {
        const num = Number(val || 0);
        return num > 0 ? (
          <span className="font-bold text-rose-600">{formatINR(num)}</span>
        ) : (
          <span className="text-zinc-400 font-medium">—</span>
        );
      }
    },
    {
      key: 'runningBalance',
      label: 'RUNNING BALANCE',
      sortable: false,
      className: 'text-right w-36 whitespace-nowrap',
      render: (val) => (
        <span className="font-bold text-zinc-900">
          {val?.amount != null ? formatINR(val.amount) : '₹0.00'}
        </span>
      )
    },
    {
      key: 'status',
      label: 'STATUS',
      sortable: true,
      className: 'text-center w-32 whitespace-nowrap',
      render: (val) => getStatusBadge(val)
    }
  ];

  const basicFilters = [
    {
      key: 'accountId',
      label: 'Account *',
      type: 'select',
      searchable: true,
      options: mergedAccountOptions,
      placeholder: 'Select Account...'
    },
    {
      key: 'fromDate',
      label: 'Date From',
      type: 'date'
    },
    {
      key: 'toDate',
      label: 'Date To',
      type: 'date'
    }
  ];

  const advancedFilters = [
    {
      id: 'voucher_details',
      title: 'Voucher & Status',
      fields: [
        {
          id: 'voucherType',
          label: 'Voucher Type',
          type: 'select',
          options: [{ value: '', label: 'All Types' }, ...VOUCHER_TYPES]
        },
        {
          id: 'status',
          label: 'Status',
          type: 'select',
          options: [{ value: '', label: 'All Statuses' }, ...STATUS_OPTIONS]
        },
        {
          id: 'transactionType',
          label: 'Transaction Type',
          type: 'select',
          options: [{ value: '', label: 'All Types' }, ...TRANSACTION_TYPES]
        },
        {
          id: 'voucherNumber',
          label: 'Voucher Number',
          type: 'text',
          placeholder: 'e.g. VCH-001'
        },
        {
          id: 'referenceNo',
          label: 'Reference / UTR',
          type: 'text',
          placeholder: 'e.g. UTR12345'
        }
      ]
    },
    {
      id: 'accounting_allocations',
      title: 'Allocation & Amounts',
      fields: [
        {
          id: 'branchId',
          label: 'Branch ID',
          type: 'text',
          placeholder: 'Branch ID'
        },
        {
          id: 'costCenterId',
          label: 'Cost Center ID',
          type: 'text',
          placeholder: 'Cost Center ID'
        },
        {
          id: 'projectId',
          label: 'Project ID',
          type: 'text',
          placeholder: 'Project ID'
        },
        {
          id: 'minAmount',
          label: 'Min Amount',
          type: 'number',
          placeholder: '0.00'
        },
        {
          id: 'maxAmount',
          label: 'Max Amount',
          type: 'number',
          placeholder: '0.00'
        },
        {
          id: 'createdBy',
          label: 'Created By',
          type: 'text',
          placeholder: 'User ID / Name'
        },
        {
          id: 'currency',
          label: 'Currency',
          type: 'text',
          placeholder: 'INR'
        },
        {
          id: 'narration',
          label: 'Narration / Remarks',
          type: 'text',
          placeholder: 'Search in narration'
        }
      ]
    }
  ];

  const rowActions = (row) => [
    {
      key: 'view',
      label: 'View Details',
      icon: <Eye size={15} />,
      onClick: () => toggleRow(row.id || row.voucherNumber)
    }
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      {/* 1. Common Enterprise Page Header */}
      <PageHeader
        title="General Ledger"
        description="Detailed record of all financial transactions by account."
        icon={BookMarked}
        actionButtons={[
          {
            key: 'print',
            label: 'Print',
            icon: Printer,
            variant: 'outline',
            onClick: () => {
              if (!filters.accountId) { setError("Please select an account first."); return; }
              window.print();
            }
          },
          {
            key: 'export',
            label: 'Export',
            icon: Download,
            variant: 'outline',
            onClick: () => {
              if (!filters.accountId) { setError("Please select an account first."); return; }
              setIsExportModalOpen(true);
            }
          },
          {
            key: 'generate',
            label: loading ? 'Generating...' : 'Generate Report',
            icon: RotateCcw,
            variant: 'primary',
            disabled: loading,
            onClick: () => fetchReport()
          }
        ]}
      />

      {/* 2. Common Enterprise Module Tabs */}
      <ModuleTabs tabs={accountingTabs} />

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-5 min-h-0">
        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-medium">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* 4. Enterprise Reusable DataTable */}
        <div className="flex-1 flex flex-col min-h-[300px]">
          <div className="flex-1 min-h-[300px]">
            <DataTable
              columns={columns}
              data={transactions}
              rowKey={(row, idx) => row.id || row.voucherNumber || idx}
              loading={loading}
              selectable={true}
              showIndex={true}
              visibleColumns={visibleColumns}
              onVisibleColumnsChange={setVisibleColumns}
              searchable={false}
              basicFilters={basicFilters}
              filterValues={filters}
              onFilterChange={handleFilterChange}
              advancedFilters={advancedFilters}
              onReset={handleClearFilters}
              onRefresh={() => fetchReport()}
              onExport={() => {
                if (!filters.accountId) { setError("Please select an account first."); return; }
                setIsExportModalOpen(true);
              }}
              expandedRowId={expandedRowId}
              onToggleExpand={toggleRow}
              renderExpandedRow={(row) => (
                <TransactionOverview
                  transaction={row}
                  reportData={reportData}
                />
              )}
              rowActions={rowActions}
              pagination={{
                page: filters.page,
                pageSize: filters.pageSize,
                totalPages: reportData?.pagination?.totalPages || Math.ceil((reportData?.pagination?.totalElements || transactions.length) / filters.pageSize) || 1,
                totalElements: reportData?.pagination?.totalElements ?? transactions.length
              }}
              pageIndexBase={0}
              onPageChange={(p) => handleFilterChange('page', p)}
              onPageSizeChange={(s) => handleFilterChange('pageSize', s)}
              itemName="items"
              emptyMessage={hasSearched ? "No transactions found" : "Select an account to view General Ledger"}
              emptyDescription={hasSearched ? "Try selecting a different date range or account." : "Choose an account in the filters above to generate the report."}
              headerActions={
                <button
                  type="button"
                  onClick={() => {
                    if (!filters.accountId) { setError("Please select an account first."); return; }
                    window.print();
                  }}
                  className="h-9 px-3 text-[10.4px] font-semibold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs"
                  title="Print Report"
                >
                  <Printer size={14} />
                  <span>Print</span>
                </button>
              }
            />
          </div>

          {/* 5. Bottom Total Summary */}
          {hasSearched && reportData && (
            <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300 flex-none">
              <AccountSummary
                openingBalance={reportData.openingBalance}
                totalDebit={reportData.totalDebit}
                totalCredit={reportData.totalCredit}
                closingBalance={reportData.closingBalance}
              />
            </div>
          )}
        </div>
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="general-ledger"
        defaultFilters={Object.fromEntries(Object.entries(filters).filter(([k, v]) => v !== '' && v !== null))}
      />
    </div>
  );
}
