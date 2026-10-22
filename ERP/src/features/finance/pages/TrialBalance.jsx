import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scale,
  Printer,
  Download,
  RotateCcw,
  AlertCircle,
  Eye,
  BookMarked,
  Coins,
  FileText
} from 'lucide-react';
import { useAppSelector } from '../../../app/hooks';
import { trialBalanceApi, getGeneralLedger } from '../../../api/account/reports';
import { fiscalYearsApi, chartOfAccountsApi, accountGroupsApi } from '../../../api/account';
import { useApiQuery } from '../../../hooks/useApi';
import { useRoutePath } from '../../../hooks/useRoutePath';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { accountingTabs } from '../../../components/module-tabs';
import DataTable from '../../../components/data-table';
import ExportModal from '../../../components/common/ExportModal';
import TrialBalanceSummary from '../../../components/accounting/TrialBalanceSummary';

const formatINR = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(val));
};

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
  } catch {
    return String(dateStr);
  }
};

/**
 * Expandable Row Drawer: Recent transactions for the selected account
 */
const AccountTransactionsOverview = ({ account, companyId, fromDate, toDate }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const accountId = account?.accountId || account?.id;

  useEffect(() => {
    let isMounted = true;
    const fetchTransactions = async () => {
      if (!accountId || !companyId) return;
      try {
        setLoading(true);
        setError(null);
        const res = await getGeneralLedger({
          companyId,
          accountId,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          page: 0,
          pageSize: 10,
          sortBy: 'voucherDate',
          sortDirection: 'DESC'
        });
        if (isMounted) {
          setData(res?.data?.data || res?.data || res);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.response?.data?.message || err.message || 'Failed to fetch ledger transactions');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTransactions();
    return () => { isMounted = false; };
  }, [accountId, companyId, fromDate, toDate]);

  const transactions = data?.transactions || data?.content || [];

  return (
    <div className="p-4 bg-zinc-50/70 dark:bg-[#161922]/70 border-y border-zinc-200 dark:border-[#2A2F3D] animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
      <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-[#2A2F3D]">
          <div className="flex items-center gap-2">
            <BookMarked size={16} className="text-zinc-600 dark:text-[#A0A6B5]" />
            <h4 className="text-xs font-bold text-zinc-900 dark:text-[#E6E8EE] uppercase tracking-wider">
              Recent Transactions: {account.accountCode ? `${account.accountCode} - ` : ''}{account.accountName || 'Account'}
            </h4>
          </div>
          <span className="text-[10px] text-zinc-400 dark:text-[#6B7184] font-medium">
            Showing latest 10 vouchers
          </span>
        </div>

        {loading ? (
          <div className="p-6 text-center text-xs text-zinc-400 dark:text-[#6B7184] animate-pulse">
            Loading recent transactions...
          </div>
        ) : error ? (
          <div className="p-3 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 rounded-lg">
            {error}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-4 text-center text-xs text-zinc-500 dark:text-[#A0A6B5] italic">
            No transactions found for this account in the specified period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-left">
              <thead className="bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-zinc-500 dark:text-[#A0A6B5] font-bold uppercase text-[9px] tracking-wider">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Voucher No</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Reference</th>
                  <th className="px-3 py-2 text-right">Debit (DR)</th>
                  <th className="px-3 py-2 text-right">Credit (CR)</th>
                  <th className="px-3 py-2 text-right">Running Bal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D] font-medium">
                {transactions.map((tx, idx) => (
                  <tr key={tx.id || tx.voucherNumber || idx} className="hover:bg-zinc-50/60 dark:hover:bg-[#222736]/60">
                    <td className="px-3 py-2 whitespace-nowrap text-zinc-700 dark:text-[#A0A6B5]">{formatLedgerDate(tx.voucherDate)}</td>
                    <td className="px-3 py-2 font-semibold text-zinc-900 dark:text-[#E6E8EE]">{tx.voucherNumber || '—'}</td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-[#A0A6B5] capitalize">{(tx.type || tx.voucherType || '—').toLowerCase().replace(/_/g, ' ')}</td>
                    <td className="px-3 py-2 text-zinc-500 dark:text-[#6B7184] font-mono text-[10px]">{tx.referenceNo || '—'}</td>
                    <td className="px-3 py-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {Number(tx.debit || 0) > 0 ? formatINR(tx.debit) : '—'}
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-rose-600 dark:text-rose-400">
                      {Number(tx.credit || 0) > 0 ? formatINR(tx.credit) : '—'}
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-zinc-900 dark:text-[#E6E8EE]">
                      {tx.runningBalance?.amount != null ? formatINR(tx.runningBalance.amount) : '₹0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default function TrialBalance() {
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const selectedCompany = useAppSelector((state) => state.company.selectedCompany);

  const fallbackCompanyId = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('selected_company'))?.id ||
        JSON.parse(localStorage.getItem('auth_user'))?.companyCode || '';
    } catch {
      return '';
    }
  }, []);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const initialFilters = {
    companyId: selectedCompany?.id || fallbackCompanyId || '',
    fromDate: '',
    toDate: '',
    fiscalYearId: '',
    accountType: '',
    accountGroupId: '',
    onlyPostedEntries: true,
    includeZeroBalance: true,
    page: 0,
    pageSize: 50
  };

  const [filters, setFilters] = useState(initialFilters);

  const [visibleColumns, setVisibleColumns] = useState([
    'accountCode',
    'accountName',
    'accountType',
    'openingBalance',
    'periodDebit',
    'periodCredit',
    'closingBalance'
  ]);

  const effectiveCompanyId = filters.companyId || selectedCompany?.id || fallbackCompanyId;

  // Fetch Fiscal Years for filter dropdown
  const { data: fiscalYearsResponse } = useApiQuery(
    () => fiscalYearsApi.getFiscalYears({ companyId: effectiveCompanyId, size: 100 }),
    null,
    { skip: !effectiveCompanyId }
  );

  const fiscalYearOptions = useMemo(() => {
    const raw = fiscalYearsResponse?.data?.data || fiscalYearsResponse?.data?.content || fiscalYearsResponse?.data || [];
    const list = Array.isArray(raw) ? raw : (raw?.content && Array.isArray(raw.content) ? raw.content : []);
    return [
      { value: '', label: 'All Fiscal Years' },
      ...list.map((fy) => ({
        value: fy.id,
        label: fy.name || fy.fiscalYear || `${fy.startDate?.split('-')[0] || ''} - ${fy.endDate?.split('-')[0] || ''}`
      }))
    ];
  }, [fiscalYearsResponse]);

  // Fetch Account Groups for filter
  const { data: accountGroupsData } = useApiQuery(
    accountGroupsApi.getList,
    { size: 200, companyId: effectiveCompanyId },
    { skip: !effectiveCompanyId }
  );

  const accountGroupOptions = useMemo(() => {
    const raw = accountGroupsData?.data?.data || accountGroupsData?.data?.content || accountGroupsData?.data || [];
    const list = Array.isArray(raw) ? raw : (raw?.content && Array.isArray(raw.content) ? raw.content : []);
    return [
      { value: '', label: 'All Account Groups' },
      ...list.map((g) => ({
        value: g.id,
        label: g.name || g.groupName || g.code || g.id
      }))
    ];
  }, [accountGroupsData]);

  // Fetch Trial Balance report
  const fetchReport = useCallback(async (overrideFilters = {}) => {
    const currentFilters = { ...filters, ...overrideFilters };
    const companyId = currentFilters.companyId || selectedCompany?.id || fallbackCompanyId;

    if (!companyId) {
      setError('Company is required. Please select a company from the top menu.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = {
        companyId,
        page: currentFilters.page || 0,
        pageSize: currentFilters.pageSize || 50
      };

      if (currentFilters.fromDate) params.fromDate = currentFilters.fromDate;
      if (currentFilters.toDate) params.toDate = currentFilters.toDate;
      if (currentFilters.fiscalYearId) params.fiscalYearId = currentFilters.fiscalYearId;
      if (currentFilters.accountType) params.accountType = currentFilters.accountType;
      if (currentFilters.accountGroupId) params.accountGroupId = currentFilters.accountGroupId;
      if (currentFilters.onlyPostedEntries !== undefined) params.onlyPostedEntries = currentFilters.onlyPostedEntries;
      if (currentFilters.includeZeroBalance !== undefined) params.includeZeroBalance = currentFilters.includeZeroBalance;

      const res = await trialBalanceApi.getTrialBalance(params);
      const parsedData = res?.data?.data || res?.data || res;

      if (res && res.success !== false) {
        setData(parsedData);
      } else {
        setError(res?.message || 'Failed to fetch Trial Balance report');
      }
    } catch (err) {
      console.error('Trial Balance API error:', err);
      setError(err?.response?.data?.message || err?.message || 'An error occurred while fetching the Trial Balance');
    } finally {
      setLoading(false);
    }
  }, [filters, selectedCompany, fallbackCompanyId]);

  useEffect(() => {
    if (effectiveCompanyId) {
      fetchReport();
    }
  }, [effectiveCompanyId, filters.fromDate, filters.toDate, filters.fiscalYearId, filters.page, filters.pageSize]);

  useEffect(() => {
    if (selectedCompany?.id && filters.companyId !== selectedCompany.id) {
      setFilters(prev => ({ ...prev, companyId: selectedCompany.id, page: 0 }));
    }
  }, [selectedCompany]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value, page: 0 }));
  };

  const handleResetFilters = () => {
    const reset = {
      ...initialFilters,
      companyId: selectedCompany?.id || fallbackCompanyId || ''
    };
    setFilters(reset);
    setData(null);
    setError(null);
  };

  const toggleRow = (id) => {
    setExpandedRowId(prev => (prev === id ? null : id));
  };

  const reportData = data?.data || data;
  const rows = reportData?.rows || reportData?.entries || reportData?.accounts || [];
  const summary = reportData?.summary || {};

  const totalElements = reportData?.pagination?.totalElements ?? rows.length;
  const totalPages = reportData?.pagination?.totalPages || Math.max(1, Math.ceil(totalElements / (filters.pageSize || 50)));

  const columns = [
    {
      key: 'accountCode',
      label: 'ACCOUNT CODE',
      sortable: true,
      className: 'w-36 whitespace-nowrap font-mono font-semibold text-zinc-900 dark:text-[#E6E8EE]',
      render: (val) => val || '—'
    },
    {
      key: 'accountName',
      label: 'ACCOUNT NAME',
      sortable: true,
      className: 'min-w-[220px]',
      render: (val, row) => (
        <div>
          <div className="font-semibold text-zinc-900 dark:text-[#E6E8EE] hover:text-zinc-700 dark:hover:text-[#A0A6B5]">{val || '—'}</div>
          {row.accountGroup && (
            <span className="text-[10px] text-zinc-400 dark:text-[#6B7184] font-medium">{row.accountGroup}</span>
          )}
        </div>
      )
    },
    {
      key: 'accountType',
      label: 'CATEGORY / TYPE',
      sortable: true,
      className: 'w-36 whitespace-nowrap',
      render: (val) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-[#1D212C] text-zinc-600 dark:text-[#A0A6B5] border border-zinc-200 dark:border-[#2A2F3D]">
          {val || 'General'}
        </span>
      )
    },
    {
      key: 'openingBalance',
      label: 'OPENING BAL',
      sortable: true,
      className: 'text-right w-36 whitespace-nowrap',
      render: (val, row) => {
        const amt = Number(val ?? row.openingDebit ?? 0);
        return <span className="font-medium text-zinc-700 dark:text-[#A0A6B5]">{formatINR(amt)}</span>;
      }
    },
    {
      key: 'periodDebit',
      label: 'DEBIT (DR)',
      sortable: true,
      className: 'text-right w-36 whitespace-nowrap',
      render: (val, row) => {
        const debit = Number(val ?? row.debitTotal ?? row.debit ?? 0);
        return debit > 0 ? (
          <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatINR(debit)}</span>
        ) : (
          <span className="text-zinc-400 dark:text-[#6B7184] font-medium">—</span>
        );
      }
    },
    {
      key: 'periodCredit',
      label: 'CREDIT (CR)',
      sortable: true,
      className: 'text-right w-36 whitespace-nowrap',
      render: (val, row) => {
        const credit = Number(val ?? row.creditTotal ?? row.credit ?? 0);
        return credit > 0 ? (
          <span className="font-bold text-rose-600 dark:text-rose-400">{formatINR(credit)}</span>
        ) : (
          <span className="text-zinc-400 dark:text-[#6B7184] font-medium">—</span>
        );
      }
    },
    {
      key: 'closingBalance',
      label: 'CLOSING BAL',
      sortable: true,
      className: 'text-right w-36 whitespace-nowrap',
      render: (val, row) => {
        const amt = Number(val ?? row.balance ?? 0);
        return <span className="font-bold text-zinc-900 dark:text-[#E6E8EE]">{formatINR(amt)}</span>;
      }
    }
  ];

  const basicFilters = [
    {
      key: 'fromDate',
      label: 'Date From',
      type: 'date'
    },
    {
      key: 'toDate',
      label: 'Date To',
      type: 'date'
    },
    {
      key: 'fiscalYearId',
      label: 'Fiscal Year',
      type: 'select',
      options: fiscalYearOptions,
      placeholder: 'Select Fiscal Year...'
    }
  ];

  const advancedFilters = [
    {
      id: 'account_filters',
      title: 'Account Classifications',
      fields: [
        {
          id: 'accountType',
          label: 'Account Type',
          type: 'select',
          options: [
            { value: '', label: 'All Types' },
            { value: 'ASSET', label: 'Asset' },
            { value: 'LIABILITY', label: 'Liability' },
            { value: 'EQUITY', label: 'Equity' },
            { value: 'REVENUE', label: 'Revenue / Income' },
            { value: 'EXPENSE', label: 'Expense' }
          ]
        },
        {
          id: 'accountGroupId',
          label: 'Account Group',
          type: 'select',
          options: accountGroupOptions
        }
      ]
    }
  ];

  const rowActions = (row) => [
    {
      key: 'view',
      label: 'Recent Vouchers',
      icon: <Eye size={15} />,
      onClick: () => toggleRow(row.accountId || row.accountCode)
    }
  ];

  const handleCustomExport = async ({ format, dateFrom, dateTo }) => {
    const params = {
      companyId: effectiveCompanyId,
      fromDate: dateFrom || filters.fromDate || undefined,
      toDate: dateTo || filters.toDate || undefined,
      fiscalYearId: filters.fiscalYearId || undefined
    };

    const isPdf = String(format).toUpperCase() === 'PDF';
    const exporter = isPdf ? trialBalanceApi.exportTrialBalancePdf : trialBalanceApi.exportTrialBalanceExcel;
    const ext = isPdf ? 'pdf' : 'xlsx';

    const blob = await exporter(params);
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `trial-balance-${Date.now()}.${ext}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      {/* 1. Page Header */}
      <PageHeader
        title="Trial Balance"
        description="Comprehensive summary of debit and credit balances for all accounts to ensure ledger equilibrium."
        icon={Scale}
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
          <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-xl text-sm font-medium">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* 4. Enterprise Reusable DataTable */}
        <div className="flex-1 flex flex-col min-h-[300px]">
          <div className="flex-1 min-h-[300px]">
            <DataTable
              columns={columns}
              data={rows}
              rowKey={(row, idx) => row.accountId || row.accountCode || idx}
              loading={loading}
              selectable={false}
              showIndex={true}
              visibleColumns={visibleColumns}
              onVisibleColumnsChange={setVisibleColumns}
              searchable={false}
              basicFilters={basicFilters}
              filterValues={filters}
              onFilterChange={handleFilterChange}
              advancedFilters={advancedFilters}
              onReset={handleResetFilters}
              onRefresh={() => fetchReport()}
              onExport={() => setIsExportModalOpen(true)}
              expandedRowId={expandedRowId}
              onToggleExpand={toggleRow}
              renderExpandedRow={(row) => (
                <AccountTransactionsOverview
                  account={row}
                  companyId={effectiveCompanyId}
                  fromDate={filters.fromDate}
                  toDate={filters.toDate}
                />
              )}
              rowActions={rowActions}
              pagination={{
                page: filters.page,
                pageSize: filters.pageSize,
                totalPages,
                totalElements
              }}
              pageIndexBase={0}
              onPageChange={(p) => handleFilterChange('page', p)}
              onPageSizeChange={(s) => handleFilterChange('pageSize', s)}
              itemName="accounts"
              emptyMessage="No trial balance accounts found"
              emptyDescription="Try selecting a different date range or fiscal year to generate the report."
              headerActions={
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="h-9 px-3 text-[10.4px] font-semibold text-zinc-600 dark:text-[#A0A6B5] hover:text-zinc-900 dark:hover:text-[#E6E8EE] bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 dark:hover:bg-[#222736] transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs"
                  title="Print Report"
                >
                  <Printer size={14} />
                  <span>Print</span>
                </button>
              }
            />
          </div>

          {/* 5. Bottom Total Summary */}
          {rows.length > 0 && (
            <div className="mt-4 flex-none">
              <TrialBalanceSummary
                totalOpening={summary.totalOpening ?? 0}
                totalDebit={summary.totalDebit ?? summary.totalPeriodDebit ?? 0}
                totalCredit={summary.totalCredit ?? summary.totalPeriodCredit ?? 0}
                totalClosing={summary.totalClosing ?? 0}
                accountCount={totalElements}
              />
            </div>
          )}
        </div>
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="trial-balance"
        defaultFilters={Object.fromEntries(Object.entries(filters).filter(([k, v]) => v !== '' && v !== null))}
        onExportCustom={handleCustomExport}
      />
    </div>
  );
}
