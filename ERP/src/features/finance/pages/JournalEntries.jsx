import React, { useState, useEffect } from 'react';
import useListQuery from '../../../hooks/useListQuery';
import SearchInput from '../../../components/common/SearchInput';
import Pagination from '../../../components/common/Pagination';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Book,
  Plus,
  Download,
  Printer,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  FileText,
  RotateCcw,
  Coins,
  Layers,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import {
  glJournalEntriesApi,
  chartOfAccountsApi,
  accountingPeriodsApi,
  fiscalYearsApi
} from '../../../api/account';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { formatCurrency } from '../../../utils/formatters';
import usePermission from '../../../hooks/usePermission';
import { confirmDialog } from '../../../utils/confirmDialog';
import JournalEntryForm from '../components/JournalEntryForm';
import { useRoutePath } from '../../../hooks/useRoutePath';
import ExportModal from '../../../components/common/ExportModal';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { accountingTabs } from '../../../components/module-tabs';
import DataTable from '../../../components/data-table';
import useUrlFilters from '../../../hooks/useUrlFilters';

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'POSTED', label: 'Posted' },
  { value: 'CANCELLED', label: 'Cancelled' }
];

const getStatusBadge = (status) => {
  if (!status) return <span className="px-2.5 py-0.5 text-[8px] font-bold uppercase rounded-md border bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-[#1D212C] dark:text-[#A0A6B5] dark:border-[#2A2F3D]">DRAFT</span>;
  const s = status.toString().toUpperCase();
  if (s === 'POSTED' || s === 'APPROVED' || s === 'PAID') return <span className="px-2.5 py-0.5 text-[8px] font-bold uppercase rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50">{status}</span>;
  if (s === 'CREATED' || s === 'DRAFT' || s === 'PENDING_APPROVAL' || s === 'PARTIALLY_PAID') return <span className="px-2.5 py-0.5 text-[8px] font-bold uppercase rounded-md border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50">{status}</span>;
  if (s === 'CANCELLED' || s === 'REJECTED') return <span className="px-2.5 py-0.5 text-[8px] font-bold uppercase rounded-md border bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50">{status}</span>;
  return <span className="px-2.5 py-0.5 text-[8px] font-bold uppercase rounded-md border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/50">{status}</span>;
};

/**
 * RFQ-style 3-Column Expandable Journal Details
 */
const JournalEntryOverview = ({ journalId, selectedCompany }) => {
  const { data: response, isLoading, error } = useApiQuery(
    glJournalEntriesApi.getJournalEntryById,
    journalId,
    { enabled: !!journalId }
  );

  if (isLoading) {
    return (
      <div className="p-8 text-center bg-zinc-50/50 dark:bg-[#161922]/50">
        <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent dark:border-[#E6E8EE] dark:border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] font-medium">Loading journal details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center bg-zinc-50/50 dark:bg-[#161922]/50">
        <p className="text-xs text-rose-500 font-medium">Failed to load journal details</p>
      </div>
    );
  }

  const rawData = response?.data?.data || response?.data || response || {};
  const journal = rawData.journalEntry || rawData;
  const journalLines = rawData.journalLines || journal.journalLines || [];
  const stats = rawData.statistics || {};
  const curr = journal.currency || selectedCompany?.baseCurrency || 'INR';

  const totalDebit = journal.totalDebit ?? stats.totalDebit ?? 0;
  const totalCredit = journal.totalCredit ?? stats.totalCredit ?? 0;
  const isBalanced = journal.isBalanced ?? (Math.abs(totalDebit - totalCredit) < 0.01);
  const diff = Math.abs(totalDebit - totalCredit);

  return (
    <div className="p-4 bg-zinc-50/60 dark:bg-[#161922]/60 border-y border-zinc-200 dark:border-[#2A2F3D] space-y-4 animate-in fade-in slide-in-from-top-1 duration-200" onClick={e => e.stopPropagation()}>
      {/* 3-Column Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Column 1: Voucher & Reference */}
        <div className="bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-[#2A2F3D]">
            <Book size={16} className="text-zinc-600 dark:text-[#A0A6B5]" />
            <h4 className="text-xs font-bold text-zinc-900 dark:text-[#E6E8EE] uppercase tracking-wider">Entry Information</h4>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-zinc-400 dark:text-[#6B7184] block text-[9px] uppercase font-semibold">Voucher No</span>
              <span className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">{journal.voucherNumber || journal.voucherNo || journal.id}</span>
            </div>
            <div>
              <span className="text-zinc-400 dark:text-[#6B7184] block text-[9px] uppercase font-semibold">Date</span>
              <span className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">{journal.voucherDate ? new Date(journal.voucherDate).toLocaleDateString() : '—'}</span>
            </div>
            <div>
              <span className="text-zinc-400 dark:text-[#6B7184] block text-[9px] uppercase font-semibold">Source Module</span>
              <span className="font-medium text-zinc-800 dark:text-[#E6E8EE]">{journal.sourceModule || 'Manual'}</span>
            </div>
            <div>
              <span className="text-zinc-400 dark:text-[#6B7184] block text-[9px] uppercase font-semibold">Reference</span>
              <span className="font-mono text-zinc-800 dark:text-[#E6E8EE]">{journal.referenceNumber || journal.referenceNo || '—'}</span>
            </div>
          </div>
        </div>

        {/* Column 2: Financial Impact */}
        <div className="bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-[#2A2F3D]">
            <Coins size={16} className="text-zinc-600 dark:text-[#A0A6B5]" />
            <h4 className="text-xs font-bold text-zinc-900 dark:text-[#E6E8EE] uppercase tracking-wider">Financial Impact</h4>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-zinc-400 dark:text-[#6B7184] block text-[9px] uppercase font-semibold">Total Debit</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalDebit, curr)}</span>
            </div>
            <div>
              <span className="text-zinc-400 dark:text-[#6B7184] block text-[9px] uppercase font-semibold">Total Credit</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">{formatCurrency(totalCredit, curr)}</span>
            </div>
            <div>
              <span className="text-zinc-400 dark:text-[#6B7184] block text-[9px] uppercase font-semibold">Balance Status</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${isBalanced ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50' : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50'}`}>
                {isBalanced ? 'Balanced' : `Diff: ${formatCurrency(diff, curr)}`}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 dark:text-[#6B7184] block text-[9px] uppercase font-semibold">Status</span>
              <div className="mt-0.5">{getStatusBadge(journal.status)}</div>
            </div>
          </div>
        </div>

        {/* Column 3: Narration & Metadata */}
        <div className="bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-[#2A2F3D]">
            <FileText size={16} className="text-zinc-600 dark:text-[#A0A6B5]" />
            <h4 className="text-xs font-bold text-zinc-900 dark:text-[#E6E8EE] uppercase tracking-wider">Remarks & Metadata</h4>
          </div>
          <div className="space-y-2 text-xs">
            {journal.narration && (
              <div>
                <span className="text-zinc-400 dark:text-[#6B7184] block text-[9px] uppercase font-semibold">Narration</span>
                <p className="text-zinc-800 dark:text-[#E6E8EE] text-[11px] leading-relaxed">{journal.narration}</p>
              </div>
            )}
            {journal.description && (
              <div>
                <span className="text-zinc-400 dark:text-[#6B7184] block text-[9px] uppercase font-semibold">Description</span>
                <p className="text-zinc-800 dark:text-[#E6E8EE] text-[11px] leading-relaxed">{journal.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-[#2A2F3D]">
              <div>
                <span className="text-zinc-400 dark:text-[#6B7184] block text-[9px] uppercase font-semibold">Created At</span>
                <span className="text-zinc-700 dark:text-[#A0A6B5]">{journal.createdAt ? new Date(journal.createdAt).toLocaleDateString() : '—'}</span>
              </div>
              <div>
                <span className="text-zinc-400 dark:text-[#6B7184] block text-[9px] uppercase font-semibold">Posted At</span>
                <span className="text-zinc-700 dark:text-[#A0A6B5]">{journal.postedAt ? new Date(journal.postedAt).toLocaleDateString() : '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Journal Lines Table */}
      {journalLines.length > 0 ? (
        <div className="bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl overflow-hidden shadow-2xs">
          <div className="px-4 py-2.5 bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={14} className="text-zinc-500 dark:text-[#A0A6B5]" />
              Journal Lines ({journalLines.length})
            </span>
            <span className="text-xs font-semibold text-zinc-500 dark:text-[#A0A6B5]">
              Currency: <strong className="text-zinc-800 dark:text-[#E6E8EE]">{curr}</strong>
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-zinc-50/70 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-[8.5px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5 text-center w-12">#</th>
                  <th className="px-4 py-2.5">Account Code</th>
                  <th className="px-4 py-2.5 min-w-[160px]">Account Name</th>
                  <th className="px-4 py-2.5 min-w-[200px]">Description</th>
                  <th className="px-4 py-2.5 text-right w-32">Debit</th>
                  <th className="px-4 py-2.5 text-right w-32">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
                {journalLines.map((item, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-[#222736]/50">
                    <td className="px-4 py-2.5 text-center text-zinc-400 dark:text-[#6B7184] font-medium">{item.lineNumber || (idx + 1)}</td>
                    <td className="px-4 py-2.5 font-mono text-zinc-700 dark:text-[#A0A6B5] font-semibold">{item.accountCode || '—'}</td>
                    <td className="px-4 py-2.5 font-semibold text-zinc-900 dark:text-[#E6E8EE]">{item.accountName || '—'}</td>
                    <td className="px-4 py-2.5 text-zinc-600 dark:text-[#A0A6B5] truncate max-w-[240px]" title={item.description || item.lineDescription}>
                      {item.description || item.lineDescription || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {item.debitAmount ? formatCurrency(item.debitAmount, curr) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-rose-600 dark:text-rose-400">
                      {item.creditAmount ? formatCurrency(item.creditAmount, curr) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-zinc-50 dark:bg-[#1D212C] border-t border-zinc-200 dark:border-[#2A2F3D] font-bold">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right uppercase text-zinc-600 dark:text-[#A0A6B5] tracking-wider">Totals:</td>
                  <td className="px-4 py-3 text-right text-emerald-700 dark:text-emerald-400 text-sm">{formatCurrency(totalDebit, curr)}</td>
                  <td className="px-4 py-3 text-right text-rose-700 dark:text-rose-400 text-sm">{formatCurrency(totalCredit, curr)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-4 text-center bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] text-xs text-zinc-500 dark:text-[#A0A6B5]">
          No lines found for this journal entry.
        </div>
      )}
    </div>
  );
};

export default function JournalEntries() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const selectedCompany = useAppSelector((state) => state.company.selectedCompany);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const location = useLocation();

  const canCreate = usePermission('GL_JOURNALS', 'CREATE');
  const canUpdate = usePermission('GL_JOURNALS', 'UPDATE');
  const canApprove = usePermission('GL_JOURNALS', 'APPROVE');

  const fallbackCompanyId = JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [expandedRowId, setExpandedRowId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState(null);

  const {
    page, setPage, pageSize, setPageSize, apiParams,
    searchTerm: search, setSearchTerm: setSearch, debouncedSearch,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10 });

  const effectiveCompanyId = filters.companyId || selectedCompany?.id || fallbackCompanyId;

  const { data: fyData, isLoading: isLoadingFY } = useApiQuery(
    fiscalYearsApi.getFiscalYears,
    { companyId: effectiveCompanyId, page: 0, size: 50 }
  );
  const _rawFy = fyData?.data?.fiscalYears || fyData?.fiscalYears || fyData?.data?.content || fyData?.content || fyData?.data?.data || fyData?.data || [];
  const fiscalYears = Array.isArray(_rawFy) ? _rawFy : [];

  const { data: periodsData, isLoading: isLoadingPeriods } = useApiQuery(
    accountingPeriodsApi.getList,
    { params: { companyId: effectiveCompanyId, page: 0, size: 50 } }
  );
  const _rawPeriods = periodsData?.data?.accountingPeriods || periodsData?.accountingPeriods || periodsData?.data?.content || periodsData?.content || periodsData?.data?.data || periodsData?.data || [];
  const periods = Array.isArray(_rawPeriods) ? _rawPeriods : [];

  const { data: coaData } = useApiQuery(
    chartOfAccountsApi.getList,
    { companyId: effectiveCompanyId, page: 0, size: 1000 },
    { skip: !effectiveCompanyId }
  );
  const _rawCoa = coaData?.data?.chartOfAccounts || coaData?.chartOfAccounts || coaData?.data?.content || coaData?.content || coaData?.data?.data || coaData?.data || [];
  const accounts = Array.isArray(_rawCoa) ? _rawCoa : [];

  const [createJournal, { isLoading: isCreating }] = useApiMutation(glJournalEntriesApi.createJournalEntry);
  const [updateJournal, { isLoading: isUpdating }] = useApiMutation(glJournalEntriesApi.updateJournalEntry);
  const [postJournal] = useApiMutation(glJournalEntriesApi.postJournalEntry);

  useEffect(() => {
    if (selectedCompany?.id) {
      setFilter('companyId', selectedCompany.id);
    }
  }, [selectedCompany]);

  const fetchJournals = async () => {
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
        params.voucherNumber = debouncedSearch;
      }

      const res = await glJournalEntriesApi.getJournalEntries(params);
      setData(res?.data || res);
    } catch (err) {
      console.error("API error:", err);
      setError(err?.response?.data?.message || err?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (effectiveCompanyId) {
      fetchJournals();
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

  const handleSubmit = async (payload) => {
    try {
      if (selectedJournal) {
        await updateJournal({ id: selectedJournal.id, companyId: effectiveCompanyId, ...payload });
        dispatch(addAlert({ type: 'success', message: 'Journal updated successfully' }));
      } else {
        await createJournal({ companyId: effectiveCompanyId, companyIdUUID: effectiveCompanyId, ...payload });
        dispatch(addAlert({ type: 'success', message: 'Journal Entry created successfully in Draft!' }));
      }
      setShowModal(false);
      setSelectedJournal(null);
      fetchJournals();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.data?.message || err?.data?.errors?.join(', ') || 'Failed to save journal entry' }));
    }
  };

  const handlePostJournal = async (id) => {
    if (await confirmDialog({ message: "Are you sure you want to post this journal? Once posted, it cannot be edited." })) {
      try {
        await postJournal(id);
        dispatch(addAlert({ type: 'success', message: 'Journal Entry posted successfully!' }));
        fetchJournals();
      } catch (err) {
        dispatch(addAlert({ type: 'error', message: err?.data?.message || 'Failed to post journal' }));
      }
    }
  };

  const handleDeleteJournal = async (id) => {
    if (await confirmDialog({ message: 'Are you sure you want to delete this journal entry?' })) {
      try {
        dispatch(addAlert({ type: 'info', message: 'Delete operation requested' }));
        fetchJournals();
      } catch (err) {
        dispatch(addAlert({ type: 'error', message: 'Failed to delete journal entry' }));
      }
    }
  };

  const journals = data?.content || [];
  const pageInfo = data || {};

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
      render: (val) => (
        <span className="text-zinc-600 dark:text-[#A0A6B5] font-medium">
          {val ? new Date(val).toLocaleDateString() : '—'}
        </span>
      )
    },
    {
      key: 'companyName',
      label: 'COMPANY',
      sortable: false,
      className: 'w-36 whitespace-nowrap',
      render: (val) => <span className="text-zinc-700 dark:text-[#E6E8EE]">{val || '—'}</span>
    },
    {
      key: 'sourceModule',
      label: 'SOURCE',
      sortable: false,
      className: 'w-28 whitespace-nowrap',
      render: (val) => (
        <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-[#1D212C] text-zinc-600 dark:text-[#A0A6B5] border border-zinc-200 dark:border-[#2A2F3D]">
          {val || 'Manual'}
        </span>
      )
    },
    {
      key: 'referenceNo',
      label: 'REFERENCE',
      sortable: false,
      className: 'w-36 whitespace-nowrap',
      render: (val) => <span className="font-mono text-zinc-700 dark:text-[#A0A6B5] text-xs">{val || '—'}</span>
    },
    {
      key: 'totalDebit',
      label: 'TOTAL DEBIT',
      sortable: true,
      className: 'text-right w-36 whitespace-nowrap',
      render: (val) => (
        <span className="font-bold text-emerald-600 dark:text-emerald-400">
          ₹{Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'totalCredit',
      label: 'TOTAL CREDIT',
      sortable: true,
      className: 'text-right w-36 whitespace-nowrap',
      render: (val) => (
        <span className="font-bold text-rose-600 dark:text-rose-400">
          ₹{Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'status',
      label: 'STATUS',
      sortable: true,
      className: 'text-center w-28 whitespace-nowrap',
      render: (val) => getStatusBadge(val)
    },
    {
      key: 'isBalanced',
      label: 'BALANCED',
      sortable: false,
      className: 'text-center w-24 whitespace-nowrap',
      render: (val) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${val ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50' : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50'}`}>
          {val ? 'YES' : 'NO'}
        </span>
      )
    },
    {
      key: 'lineCount',
      label: 'LINES',
      sortable: false,
      className: 'text-center w-20 whitespace-nowrap',
      render: (val) => <span className="font-semibold text-zinc-700 dark:text-[#E6E8EE]">{val ?? '—'}</span>
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
      key: 'status',
      label: 'Status',
      type: 'select',
      options: STATUS_OPTIONS,
      placeholder: 'All Statuses'
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
      id: 'journal_attributes',
      title: 'Journal Attributes',
      fields: [
        {
          id: 'createdBy',
          label: 'Created By',
          type: 'text',
          placeholder: 'User ID / Name'
        },
        {
          id: 'referenceNo',
          label: 'Reference Number',
          type: 'text',
          placeholder: 'Ref #'
        },
        {
          id: 'sourceModule',
          label: 'Source Module',
          type: 'text',
          placeholder: 'e.g. AR, AP'
        }
      ]
    }
  ];

  const rowActions = (item) => {
    const isDraft = item.status === 'DRAFT';
    const actions = [
      {
        key: 'view',
        label: 'View Details',
        icon: <Eye size={15} />,
        onClick: () => toggleRow(item.id)
      }
    ];

    if (canUpdate && isDraft) {
      actions.push({
        key: 'edit',
        label: 'Edit Entry',
        icon: <Edit size={15} />,
        onClick: () => {
          setSelectedJournal(item);
          setShowModal(true);
        }
      });
    }

    if (canApprove && isDraft) {
      actions.push({
        key: 'post',
        label: 'Post Journal',
        icon: <CheckCircle size={15} className="text-emerald-600" />,
        onClick: () => handlePostJournal(item.id)
      });
      actions.push({
        key: 'delete',
        label: 'Delete Entry',
        icon: <Trash2 size={15} className="text-rose-600" />,
        onClick: () => handleDeleteJournal(item.id)
      });
    }

    actions.push({
      key: 'page',
      label: 'Open Full Page',
      icon: <FileText size={15} className="text-blue-600" />,
      onClick: () => navigate(buildPath(`/accounts/transactions/journal/${item.id}`))
    });

    return actions;
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      {/* 1. Common Enterprise Page Header */}
      <PageHeader
        title="Journal Entries"
        description="Record and view double-entry manual journal entries."
        icon={Book}
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
            label: 'New Journal Entry',
            icon: Plus,
            variant: 'primary',
            onClick: () => {
              setSelectedJournal(null);
              setShowModal(true);
            }
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

        {/* 3. Enterprise Reusable DataTable */}
        <div className="flex-1 min-h-[300px]">
          <DataTable
            columns={columns}
            data={journals}
            rowKey="id"
            loading={loading}
            searchable={true}
            searchValue={search || ''}
            searchPlaceholder="Search journal entries..."
            onSearchChange={(val) => setSearch(val)}
            basicFilters={basicFilters}
            filterValues={filters}
            onFilterChange={handleFilterChange}
            advancedFilters={advancedFilters}
            onReset={handleClearFilters}
            onRefresh={() => fetchJournals()}
            exportable={true}
            onExport={() => setIsExportModalOpen(true)}
            expandedRowId={expandedRowId}
            onToggleExpand={toggleRow}
            renderExpandedRow={(item) => (
              <JournalEntryOverview
                journalId={item.id}
                selectedCompany={selectedCompany}
              />
            )}
            rowActions={rowActions}
            pagination={{
              page: page,
              pageSize: pageSize,
              totalPages: pageInfo.totalPages || 1,
              totalElements: pageInfo.totalElements || journals.length
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
            emptyMessage="No journal entries found"
            emptyDescription="Create your first double-entry journal entry or try adjusting your search filters."
          />
        </div>
      </div>

      {/* Journal Entry Create / Edit Modal */}
      <JournalEntryForm
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelectedJournal(null); }}
        initialData={selectedJournal}
        fiscalYears={fiscalYears}
        periods={periods}
        accounts={accounts}
        onSubmit={handleSubmit}
        isSubmitting={isCreating || isUpdating}
        isLoadingFY={isLoadingFY}
        isLoadingPeriods={isLoadingPeriods}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="journal-entries"
        defaultFilters={Object.fromEntries(Object.entries({ ...filters, page, pageSize }).filter(([k, v]) => v !== '' && v !== null))}
      />
    </div>
  );
}
