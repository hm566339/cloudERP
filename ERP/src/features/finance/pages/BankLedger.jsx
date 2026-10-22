import React, { useState, useMemo, useCallback } from 'react';
import { 
  Building2, ArrowUpRight, ArrowDownLeft, Download, Printer, RefreshCw,
  Search, Filter, ChevronLeft, CheckCircle, XCircle, FileText,
  Copy, Check, AlertCircle
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApiQuery } from '../../../hooks/useApi';
import { bankAccountsApi } from '../../../api/account/bankAccounts';
import { accountHttpClient } from '../../../api/common/client';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { useRoutePath } from '../../../hooks/useRoutePath';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { copyToClipboard } from '../../../utils/clipboard';

import { TableRowSkeleton } from '../../../components/common/SkeletonLoader';
import CustomSelect from '../../../components/common/CustomSelect';
import Pagination from '../../../components/common/Pagination';

// Helper to mask account number e.g. "XXXX XXXX 7890"
const maskAccount = (accountStr) => {
  if (!accountStr) return 'XXXX';
  const clean = String(accountStr).trim();
  if (clean.length <= 4) return clean;
  return `XXXX XXXX ${clean.slice(-4)}`;
};

export default function BankLedger() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { buildPath } = useRoutePath();

  const {
    page,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
  } = useUrlFilters({
    defaultSortBy: 'transactionDate',
    defaultSortDir: 'desc'
  });

  // Client-side filter state (since backend currently only supports page, size, sort)
  const [clientFilters, setClientFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
    status: '',
    type: ''
  });

  const [copiedField, setCopiedField] = useState(null);

  const handleCopy = useCallback(async (text, fieldKey) => {
    if (!text || text === '—') return;
    try {
      await copyToClipboard(text);
      setCopiedField(fieldKey);
      setTimeout(() => {
        setCopiedField(null);
      }, 1500);
    } catch (error) {
      // Clipboard unavailable in this context; ignore silently.
    }
  }, []);

  // Fetch list of bank accounts for the switcher dropdown
  const { data: bankAccountsData } = useApiQuery(
    bankAccountsApi.getBankAccounts,
    { size: 1000 }
  );
  
  const bankAccountsList = useMemo(() => {
    if (Array.isArray(bankAccountsData?.data?.bankAccounts)) return bankAccountsData.data.bankAccounts;
    if (Array.isArray(bankAccountsData?.bankAccounts)) return bankAccountsData.bankAccounts;
    if (Array.isArray(bankAccountsData?.data?.content)) return bankAccountsData.data.content;
    if (Array.isArray(bankAccountsData?.data)) return bankAccountsData.data;
    if (Array.isArray(bankAccountsData?.content)) return bankAccountsData.content;
    if (Array.isArray(bankAccountsData)) return bankAccountsData;
    return [];
  }, [bankAccountsData]);

  const activeBankAccountId = id || (bankAccountsList.length > 0 ? bankAccountsList[0].id : null);

  // Fetch Ledger data from Backend API: GET /api/account/bank-accounts/{id}/ledger?page={page}&size={size}
  const { data, isLoading, refetch, isFetching, isError, error } = useApiQuery(
    bankAccountsApi.getBankLedger,
    {
      id: activeBankAccountId,
      params: {
        page,
        size: pageSize,
        sort: 'transactionDate,desc'
      }
    },
    {
      enabled: !!activeBankAccountId
    }
  );

  const ledgerData = data?.data || {};
  const ledgerEntries = ledgerData.ledgerEntries || [];
  const pagination = data?.pagination || {};

  // Extract dynamic list of transaction types present in current entries
  const availableTransactionTypes = useMemo(() => {
    const types = new Set();
    ledgerEntries.forEach(item => {
      if (item.transactionType) types.add(item.transactionType);
    });
    return Array.from(types);
  }, [ledgerEntries]);

  // Client-side filtering logic operating on loaded ledgerEntries
  const filteredEntries = useMemo(() => {
    if (!ledgerEntries || ledgerEntries.length === 0) return [];
    
    return ledgerEntries.filter(entry => {
      // 1. Search Details (narration, referenceNo, utrNo)
      if (clientFilters.search) {
        const query = clientFilters.search.toLowerCase().trim();
        const matchNarration = (entry.narration || '').toLowerCase().includes(query);
        const matchRef = (entry.referenceNo || '').toLowerCase().includes(query);
        const matchUtr = (entry.utrNo || '').toLowerCase().includes(query);
        if (!matchNarration && !matchRef && !matchUtr) return false;
      }

      // 2. From Date
      if (clientFilters.startDate && entry.transactionDate) {
        if (entry.transactionDate < clientFilters.startDate) return false;
      }

      // 3. To Date
      if (clientFilters.endDate && entry.transactionDate) {
        if (entry.transactionDate > clientFilters.endDate) return false;
      }

      // 4. Status (Reconciled / Unreconciled)
      if (clientFilters.status) {
        if (clientFilters.status === 'RECONCILED' && !entry.reconciled) return false;
        if (clientFilters.status === 'UNRECONCILED' && entry.reconciled) return false;
      }

      // 5. Transaction Type
      if (clientFilters.type) {
        if ((entry.transactionType || '').toUpperCase() !== clientFilters.type.toUpperCase()) return false;
      }

      return true;
    });
  }, [ledgerEntries, clientFilters]);

  // Export CSV
  const handleExportCSV = () => {
    if (!filteredEntries.length) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Reference No,UTR No,Narration,Transaction Type,Debit,Credit,Running Balance,Status\n";
    
    filteredEntries.forEach(row => {
      const date = row.transactionDate ? formatDate(row.transactionDate, 'dd MMM yyyy') : '';
      const ref = (row.referenceNo || '').replace(/"/g, '""');
      const utr = (row.utrNo || '').replace(/"/g, '""');
      const narration = (row.narration || '').replace(/"/g, '""');
      const type = row.transactionType || '';
      const debit = row.debitAmount != null ? row.debitAmount : '';
      const credit = row.creditAmount != null ? row.creditAmount : '';
      const bal = row.runningBalance != null ? row.runningBalance : '';
      const status = row.reconciled ? 'Reconciled' : 'Unreconciled';
      
      csvContent += `"${date}","${ref}","${utr}","${narration}","${type}","${debit}","${credit}","${bal}","${status}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bank_ledger_${ledgerData.bankName || 'account'}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClearFilters = () => {
    setClientFilters({
      search: '',
      startDate: '',
      endDate: '',
      status: '',
      type: ''
    });
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 px-4 md:px-6 lg:px-8">
      
      {/* ─── PRINT-ONLY STATEMENT HEADER ───────────────────────────────── */}
      <div className="hidden print:block mb-8 p-4 border-b-2 border-zinc-300">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">{ledgerData.bankName || 'Bank'}</h1>
            <p className="text-sm font-semibold text-zinc-700 mt-1">
              Account No: {maskAccount(ledgerData.accountNumber)}
            </p>
            <p className="text-sm text-zinc-600">
              IFSC: {ledgerData.ifscCode || '—'}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-zinc-800 uppercase tracking-wide">Bank Account Ledger</h2>
            <p className="text-xs text-zinc-500 mt-1">Generated on: {new Date().toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-6 p-4 bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded">
          <div>
            <span className="text-xs text-zinc-500 uppercase block">Opening Balance</span>
            <span className="text-base font-bold text-zinc-900">{formatCurrency(ledgerData.openingBalance || 0)}</span>
          </div>
          <div>
            <span className="text-xs text-zinc-500 uppercase block">Total Credits</span>
            <span className="text-base font-bold text-emerald-700">{formatCurrency(ledgerData.totalCredits || 0)}</span>
          </div>
          <div>
            <span className="text-xs text-zinc-500 uppercase block">Total Debits</span>
            <span className="text-base font-bold text-rose-700">{formatCurrency(ledgerData.totalDebits || 0)}</span>
          </div>
          <div>
            <span className="text-xs text-zinc-500 uppercase block">Closing Balance</span>
            <span className="text-base font-bold text-blue-900">{formatCurrency(ledgerData.closingBalance || 0)}</span>
          </div>
        </div>
      </div>

      {/* ─── 1. PAGE HEADER CARD ───────────────────────────────────────── */}
      <div className="print:hidden bg-white dark:bg-[#161922] p-5 md:p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Left: Back button & Bank details */}
        <div className="flex items-center gap-3 md:gap-4">
          <button 
            type="button"
            onClick={() => navigate(buildPath('/accounts/masters/bank-accounts'))}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-[#222736] rounded-full transition-colors text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
            title="Back to Bank Accounts"
          >
            <ChevronLeft size={22} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm shrink-0">
              <Building2 size={24} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                {ledgerData.bankName || 'Bank Ledger'}
              </h1>
              {activeBankAccountId && (
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs md:text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                  <span className="inline-flex items-center bg-zinc-100 dark:bg-[#1D212C] px-2.5 py-0.5 rounded-md text-zinc-700 dark:text-zinc-300 font-mono text-xs">
                    Acct: {maskAccount(ledgerData.accountNumber)}
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-600">•</span>
                  <span className="inline-flex items-center bg-zinc-100 dark:bg-[#1D212C] px-2.5 py-0.5 rounded-md text-zinc-700 dark:text-zinc-300 font-mono text-xs">
                    IFSC: {ledgerData.ifscCode || '—'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right: Actions toolbar */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-100 dark:border-[#2A2F3D]">
          {/* Switch Bank Account Dropdown */}
          <div className="w-64 min-w-[160px]">
            <CustomSelect
              options={bankAccountsList.map(acc => ({ 
                value: acc.id, 
                label: `${acc.bankName || 'Bank'} (${maskAccount(acc.accountNumber)})` 
              }))}
              value={activeBankAccountId || ''}
              onChange={(e) => {
                const selectedId = e.target.value;
                if (selectedId) {
                  navigate(buildPath(`/accounts/masters/bank-accounts/${selectedId}/ledger`));
                }
              }}
              placeholder="Switch Bank Account..."
            />
          </div>

          {/* Export CSV */}
          <button 
            type="button"
            onClick={handleExportCSV}
            className="btn-secondary flex items-center gap-1.5 bg-white dark:bg-[#1D212C] h-10 px-3.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 shadow-sm border-zinc-200 dark:border-[#2A2F3D] hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors"
            disabled={!activeBankAccountId || filteredEntries.length === 0}
            title="Export transactions to CSV"
          >
            <Download size={15} /> 
            <span>Export CSV</span>
          </button>

          {/* Print */}
          <button 
            type="button"
            onClick={handlePrint}
            className="btn-secondary flex items-center gap-1.5 bg-white dark:bg-[#1D212C] h-10 px-3.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 shadow-sm border-zinc-200 dark:border-[#2A2F3D] hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors"
            disabled={!activeBankAccountId || ledgerEntries.length === 0}
            title="Print Bank Ledger Statement"
          >
            <Printer size={15} /> 
            <span>Print</span>
          </button>

          {/* Refresh */}
          <button 
            type="button"
            onClick={() => refetch()} 
            className="btn-primary flex items-center gap-1.5 h-10 px-4 text-xs font-semibold shadow-sm"
            disabled={!activeBankAccountId || isFetching}
            title="Refresh ledger data"
          >
            <RefreshCw size={15} className={isFetching ? "animate-spin" : ""} /> 
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ─── ERROR STATE ──────────────────────────────────────────────── */}
      {isError && (
        <div className="card p-8 text-center text-rose-600 print:hidden border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 rounded-2xl shadow-sm">
          <AlertCircle size={44} className="mx-auto mb-3 text-rose-500" />
          <h3 className="text-lg font-bold text-rose-900 dark:text-rose-200">Unable to load bank ledger</h3>
          <p className="text-sm mt-1 text-rose-700 dark:text-rose-300 max-w-md mx-auto">
            {error?.data?.message || error?.message || 'An error occurred while fetching bank ledger records. Please try again.'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700 transition-colors inline-flex items-center gap-2 shadow-sm"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* ─── LOADING SKELETON STATE ───────────────────────────────────── */}
      {isLoading && !data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-5 bg-white dark:bg-[#161922] border-zinc-200 dark:border-[#2A2F3D] animate-pulse h-28 rounded-2xl">
                <div className="h-4 bg-zinc-200 dark:bg-[#222736] rounded w-1/2 mb-3"></div>
                <div className="h-7 bg-zinc-200 dark:bg-[#222736] rounded w-3/4"></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] p-4 animate-pulse h-14"></div>
            ))}
          </div>
          <div className="card p-8 shadow-sm bg-white dark:bg-[#161922] rounded-2xl border-zinc-200 dark:border-[#2A2F3D]">
            <TableRowSkeleton columns={7} rows={6} />
          </div>
        </div>
      )}

      {/* ─── MAIN CONTENT WHEN LOADED ─────────────────────────────────── */}
      {!isLoading && !isError && (
        <div className="space-y-6">
          
          {/* ─── 2. SUMMARY CARDS (4 Large Cards) ──────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Opening Balance */}
            <div className="bg-white dark:bg-[#161922] p-6 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm flex flex-col justify-center">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 block">
                Opening Balance
              </span>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {formatCurrency(ledgerData.openingBalance || 0)}
              </p>
            </div>
            
            {/* Total Credits */}
            <div className="bg-white dark:bg-[#161922] p-6 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm flex flex-col justify-center">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 block">
                Total Credits
              </span>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(ledgerData.totalCredits || 0)}
              </p>
            </div>
            
            {/* Total Debits */}
            <div className="bg-white dark:bg-[#161922] p-6 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm flex flex-col justify-center">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 block">
                Total Debits
              </span>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {formatCurrency(ledgerData.totalDebits || 0)}
              </p>
            </div>
            
            {/* Closing Balance */}
            <div className="bg-white dark:bg-[#161922] p-6 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm flex flex-col justify-center">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 block">
                Closing Balance
              </span>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {formatCurrency(ledgerData.closingBalance || 0)}
              </p>
            </div>
          </div>

          {/* ─── 3. SECONDARY STATISTICS (3 Compact Cards) ──────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 print:hidden">
            <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] px-5 py-4 flex justify-between items-center shadow-sm">
              <span className="text-xs md:text-sm font-semibold text-zinc-700 dark:text-zinc-300">Total Transactions</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono text-sm">
                {ledgerData.totalTransactions || 0}
              </span>
            </div>
            
            <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] px-5 py-4 flex justify-between items-center shadow-sm">
              <span className="text-xs md:text-sm font-semibold text-zinc-700 dark:text-zinc-300">Reconciled</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 text-sm">
                <CheckCircle size={14} className="text-emerald-500 dark:text-emerald-400" /> {ledgerData.reconciledTransactions || 0}
              </span>
            </div>
            
            <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] px-5 py-4 flex justify-between items-center shadow-sm">
              <span className="text-xs md:text-sm font-semibold text-zinc-700 dark:text-zinc-300">Unreconciled</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 text-sm">
                <XCircle size={14} className="text-rose-500 dark:text-rose-400" /> {ledgerData.unreconciledTransactions || 0}
              </span>
            </div>
          </div>

          {/* ─── 4. FILTER TOOLBAR ────────────────────────────────────────── */}
          <div className="bg-white dark:bg-[#161922] p-5 md:p-6 border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-sm print:hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-4 lg:gap-5 items-end">
              
              {/* Search Details */}
              <div className="lg:col-span-4">
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">Search Details</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search narration, ref, UTR..."
                    value={clientFilters.search}
                    onChange={(e) => setClientFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="input-field pl-9 w-full text-xs md:text-sm bg-white dark:bg-[#1D212C] border-zinc-200 dark:border-[#2A2F3D] text-zinc-900 dark:text-zinc-100 h-9 md:h-10"
                  />
                </div>
              </div>
              
              {/* From Date */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">From Date</label>
                <input
                  type="date"
                  value={clientFilters.startDate}
                  onChange={(e) => setClientFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="input-field w-full text-xs md:text-sm bg-white dark:bg-[#1D212C] border-zinc-200 dark:border-[#2A2F3D] text-zinc-900 dark:text-zinc-100 h-9 md:h-10"
                />
              </div>
              
              {/* To Date */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">To Date</label>
                <input
                  type="date"
                  value={clientFilters.endDate}
                  onChange={(e) => setClientFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="input-field w-full text-xs md:text-sm bg-white dark:bg-[#1D212C] border-zinc-200 dark:border-[#2A2F3D] text-zinc-900 dark:text-zinc-100 h-9 md:h-10"
                />
              </div>

              {/* Status */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">Status</label>
                <select 
                  className="input-field w-full text-xs md:text-sm bg-white dark:bg-[#1D212C] border-zinc-200 dark:border-[#2A2F3D] text-zinc-900 dark:text-zinc-100 h-9 md:h-10"
                  value={clientFilters.status}
                  onChange={(e) => setClientFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="">All Statuses</option>
                  <option value="RECONCILED">Reconciled</option>
                  <option value="UNRECONCILED">Unreconciled</option>
                </select>
              </div>

              {/* Transaction Type */}
              <div className="lg:col-span-1">
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2 truncate" title="Transaction Type">Type</label>
                <select 
                  className="input-field w-full text-xs md:text-sm bg-white dark:bg-[#1D212C] border-zinc-200 dark:border-[#2A2F3D] text-zinc-900 dark:text-zinc-100 h-9 md:h-10"
                  value={clientFilters.type}
                  onChange={(e) => setClientFilters(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="">All Types</option>
                  {availableTransactionTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  {!availableTransactionTypes.includes('PAYMENT') && <option value="PAYMENT">PAYMENT</option>}
                  {!availableTransactionTypes.includes('RECEIPT') && <option value="RECEIPT">RECEIPT</option>}
                  {!availableTransactionTypes.includes('CONTRA') && <option value="CONTRA">CONTRA</option>}
                  {!availableTransactionTypes.includes('DEBIT') && <option value="DEBIT">DEBIT</option>}
                  {!availableTransactionTypes.includes('CREDIT') && <option value="CREDIT">CREDIT</option>}
                </select>
              </div>

              {/* Clear */}
              <div className="lg:col-span-1 flex items-end">
                <button 
                  type="button"
                  onClick={handleClearFilters}
                  className="btn w-full text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] text-xs md:text-sm h-9 md:h-10 flex items-center justify-center gap-1.5 shadow-sm hover:bg-zinc-50 dark:hover:bg-[#222736]"
                  title="Clear all filters"
                >
                  <Filter size={14} /> Clear
                </button>
              </div>

            </div>
          </div>

          {/* ─── 5. LEDGER TABLE CARD ─────────────────────────────────────── */}
          <div className="shadow-sm overflow-hidden border border-zinc-200 dark:border-[#2A2F3D] rounded-xl bg-white dark:bg-[#161922]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-zinc-50/90 dark:bg-[#1D212C]/90 border-b border-zinc-200 dark:border-[#2A2F3D] text-zinc-600 dark:text-zinc-400 uppercase tracking-wider text-[8.8px] font-bold sticky top-0 z-10 backdrop-blur-sm">
                  <tr>
                    <th className="px-4 py-3.5 w-28">DATE</th>
                    <th className="px-4 py-3.5 w-44">REF / UTR NO.</th>
                    <th className="px-4 py-3.5 min-w-[192px]">NARRATION</th>
                    <th className="px-4 py-3.5 text-right w-36">DEBIT (DR)</th>
                    <th className="px-4 py-3.5 text-right w-36">CREDIT (CR)</th>
                    <th className="px-4 py-3.5 text-right w-40">RUNNING BAL.</th>
                    <th className="px-4 py-3.5 text-center w-32">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D] bg-white dark:bg-[#161922]">
                  
                  {/* Opening Balance Row (Presentation-only, rendered before entries) */}
                  {(page === 0 || !page) && (
                    <tr className="bg-zinc-50/60 dark:bg-[#1D212C]/60 font-medium border-b border-zinc-200/60 dark:border-[#2A2F3D]">
                      <td className="px-4 py-3 text-zinc-400 dark:text-zinc-500 font-mono text-xs">—</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">OPENING</span>
                      </td>
                      <td className="px-4 py-3 italic text-zinc-600 dark:text-zinc-300 font-medium">Opening Balance</td>
                      <td className="px-4 py-3 text-right text-zinc-400 dark:text-zinc-500">—</td>
                      <td className="px-4 py-3 text-right text-zinc-400 dark:text-zinc-500">—</td>
                      <td className="px-4 py-3 text-right font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-100/40 dark:bg-[#222736]/40">
                        {formatCurrency(ledgerData.openingBalance || 0)}
                      </td>
                      <td className="px-4 py-3 text-center text-zinc-400 dark:text-zinc-500">—</td>
                    </tr>
                  )}

                  {/* Empty state when no records match */}
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center text-zinc-500 dark:text-zinc-400 bg-zinc-50/20 dark:bg-[#1D212C]/20">
                        <FileText size={36} className="mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
                        <p className="font-semibold text-zinc-700 dark:text-zinc-200 text-base">No transactions found</p>
                        <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-1">Try adjusting your filters or date range.</p>
                      </td>
                    </tr>
                  ) : (
                    /* Transaction entries */
                    filteredEntries.map((record, index) => {
                      const refKey = `ref_${record.transactionId || index}`;
                      const utrKey = `utr_${record.transactionId || index}`;
                      
                      return (
                        <tr 
                          key={record.transactionId || index} 
                          className="hover:bg-blue-50/30 dark:hover:bg-[#222736]/50 transition-colors group"
                        >
                          {/* Date */}
                          <td className="px-4 py-3.5 text-zinc-800 dark:text-zinc-200 font-medium text-xs md:text-sm">
                            {record.transactionDate ? formatDate(record.transactionDate, 'dd MMM yyyy') : '—'}
                          </td>

                          {/* Ref / UTR No. */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5 font-semibold text-zinc-800 dark:text-zinc-200 text-xs">
                              <span>{record.referenceNo || '—'}</span>
                              {record.referenceNo && (
                                <button
                                  type="button"
                                  onClick={() => handleCopy(record.referenceNo, refKey)}
                                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
                                  title="Copy Reference Number"
                                >
                                  {copiedField === refKey ? <Check size={12} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={12} />}
                                </button>
                              )}
                            </div>
                            
                            {record.utrNo ? (
                              <div className="flex items-center gap-1 text-[8.8px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                                <span>UTR: {record.utrNo}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(record.utrNo, utrKey)}
                                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
                                  title="Copy UTR Number"
                                >
                                  {copiedField === utrKey ? <Check size={11} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={11} />}
                                </button>
                              </div>
                            ) : (
                              <div className="text-[8.8px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">UTR: —</div>
                            )}
                          </td>

                          {/* Narration */}
                          <td className="px-4 py-3.5">
                            <div 
                              className="truncate max-w-[224px] md:max-w-[272px] text-zinc-700 dark:text-zinc-300 font-normal text-xs md:text-sm" 
                              title={record.narration || ''}
                            >
                              {record.narration || '—'}
                            </div>
                            {record.transactionType && (
                              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[7.2px] font-bold tracking-wider uppercase bg-zinc-100 dark:bg-[#222736] text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-[#2A2F3D]">
                                {record.transactionType}
                              </span>
                            )}
                          </td>

                          {/* Debit (DR) */}
                          <td className="px-4 py-3.5 text-right font-medium text-rose-600 dark:text-rose-400 bg-rose-50/5 dark:bg-rose-950/10 group-hover:bg-rose-50/20 dark:group-hover:bg-rose-950/30 text-xs md:text-sm">
                            {record.debitAmount != null && Number(record.debitAmount) > 0 ? (
                              formatCurrency(record.debitAmount)
                            ) : (
                              <span className="text-zinc-300 dark:text-zinc-600 font-normal">—</span>
                            )}
                          </td>

                          {/* Credit (CR) */}
                          <td className="px-4 py-3.5 text-right font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50/5 dark:bg-emerald-950/10 group-hover:bg-emerald-50/20 dark:group-hover:bg-emerald-950/30 text-xs md:text-sm">
                            {record.creditAmount != null && Number(record.creditAmount) > 0 ? (
                              formatCurrency(record.creditAmount)
                            ) : (
                              <span className="text-zinc-300 dark:text-zinc-600 font-normal">—</span>
                            )}
                          </td>

                          {/* Running Balance */}
                          <td className="px-4 py-3.5 text-right font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-50/40 dark:bg-[#1D212C]/40 text-xs md:text-sm">
                            {record.runningBalance != null ? formatCurrency(record.runningBalance) : '—'}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5 text-center">
                            {record.reconciled ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8.8px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                                <CheckCircle size={12} /> Reconciled
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8.8px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                                <XCircle size={12} /> Unreconciled
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {/* Closing Balance Row (Shown on the last page of entries) */}
                  {pagination.hasNext === false && filteredEntries.length > 0 && (
                    <tr className="bg-blue-50/40 dark:bg-blue-950/30 border-t-2 border-blue-200 dark:border-blue-800 font-bold">
                      <td colSpan={3} className="px-4 py-3.5 text-right font-bold text-blue-900 dark:text-blue-300 uppercase text-xs tracking-wider">
                        Closing Balance
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-rose-700 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/30 text-xs md:text-sm">
                        {formatCurrency(ledgerData.totalDebits || 0)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/30 text-xs md:text-sm">
                        {formatCurrency(ledgerData.totalCredits || 0)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-blue-900 dark:text-blue-300 text-sm md:text-base bg-blue-100/40 dark:bg-blue-900/30 border-l border-blue-200 dark:border-blue-800">
                        {formatCurrency(ledgerData.closingBalance || 0)}
                      </td>
                      <td className="px-4 py-3.5 bg-blue-100/20 dark:bg-blue-900/20"></td>
                    </tr>
                  )}
                </tbody>
              </table>
              
              {/* ─── 6. PAGINATION ────────────────────────────────────────── */}
              {pagination && pagination.totalElements > 0 && (
                <div className="print:hidden">
                  <Pagination
                    page={pagination.page ?? page ?? 0}
                    pageSize={pagination.size ?? pageSize ?? 20}
                    totalPages={pagination.totalPages ?? 1}
                    totalElements={pagination.totalElements ?? ledgerEntries.length}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    itemName="transactions"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
