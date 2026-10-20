import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { bankAccountsApi } from '../../../api/account';
import { 
  ArrowLeft, Building2, CheckCircle, XCircle, Edit, Download, Printer, 
  RefreshCw, FileText, TrendingUp, TrendingDown, DollarSign, Activity, 
  Calendar, CreditCard, Hash, MapPin, Search, ChevronRight, MoreVertical,
  Layers, Settings, SearchX, Plus, Wallet, ArrowLeftRight, ArrowUpRight, 
  ArrowDownLeft, Link2, Paperclip, History
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import BankAccountForm from '../components/BankAccountForm';
import { useRoutePath } from '../../../hooks/useRoutePath';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'balance', label: 'Balance Summary', icon: Wallet },
  { id: 'transactions', label: 'Bank Transactions', icon: ArrowLeftRight },
  { id: 'payment-vouchers', label: 'Payment Vouchers', icon: ArrowUpRight },
  { id: 'receipt-vouchers', label: 'Receipt Vouchers', icon: ArrowDownLeft },
  { id: 'ledger', label: 'Ledger Posting', icon: FileText },
  { id: 'reconciliation', label: 'Reconciliation', icon: RefreshCw },
  { id: 'related', label: 'Related Documents', icon: Link2 },
  { id: 'attachments', label: 'Attachments', icon: Paperclip },
  { id: 'audit', label: 'Audit Log', icon: History }
];

const maskAccountNumber = (accNo) => {
  if (!accNo) return 'XXXX';
  const str = String(accNo);
  if (str.length <= 4) return str;
  return `XXXX-XXXX-${str.slice(-4)}`;
};

export default function BankAccountDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: apiData, isLoading, isError, error, refetch, mutateLocal } = useApiQuery(
    bankAccountsApi.getBankAccountById,
    id,
    { enabled: !!id }
  );

  const profile = apiData?.data || {};
  const master = profile.bankAccountMaster || {};
  const balance = profile.balanceSummary || {};
  const stats = profile.statistics || {};
  const company = profile.companyInformation || {};
  const linkedGl = profile.linkedGlAccount || {};
  const linkedLedger = profile.linkedLedgerAccount || {};

  const { mutateAsync: updateAccount, isLoading: isUpdating } = useApiMutation(bankAccountsApi.updateBankAccount);

  const handleEditSubmit = async (formData) => {
    try {
      const updatedAccount = await updateAccount({ id: master.bankAccountId || master.id, data: formData });
      dispatch(addAlert({ type: 'success', message: 'Bank account updated successfully' }));
      setIsEditModalOpen(false);
      
      mutateLocal(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          data: {
            ...(prev.data || {}),
            bankAccountMaster: {
              ...(prev.data?.bankAccountMaster || {}),
              ...formData,
              ...(typeof updatedAccount === 'object' ? updatedAccount : {})
            }
          }
        };
      });
      
      // Background refetch for other data
      refetch();
    } catch (err) {
      console.error('Failed to update account:', err);
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to update bank account' }));
      throw err; 
    }
  };

  const renderEmptyState = (title, message) => (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
      <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
        <SearchX className="text-zinc-400" size={24} />
      </div>
      <h3 className="text-sm font-semibold text-zinc-900 mb-1">{title}</h3>
      <p className="text-xs text-zinc-500">{message}</p>
    </div>
  );

  if (isLoading && !apiData) {
    return (
      <div className="p-8 space-y-6 animate-pulse bg-zinc-50/50 min-h-screen">
        <div className="h-20 bg-zinc-200 rounded-xl w-full"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-zinc-200 rounded-xl"></div>)}
        </div>
        <div className="flex gap-6">
          <div className="w-[30%] h-96 bg-zinc-200 rounded-xl"></div>
          <div className="w-[70%] h-96 bg-zinc-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (isError || !master.bankName) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[320px] bg-zinc-50/50">
        <XCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-lg font-semibold text-zinc-900 mb-2">Failed to load Bank Account</h2>
        <p className="text-sm text-zinc-500 mb-4">{error?.message || 'Bank account not found'}</p>
        <button onClick={() => navigate(buildPath('/accounts/masters/bank-accounts'))} className="btn-secondary">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50">
      
      {/* 1. Sticky Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-zinc-200 shadow-sm px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(buildPath('/accounts/masters/bank-accounts'))}
            className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Building2 size={20} />
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-zinc-900 leading-none">{master.bankName}</h1>
              <span className={`px-2 py-0.5 text-[8px] font-bold rounded-md border ${
                master.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {master.isActive ? 'ACTIVE' : 'INACTIVE'}
              </span>
              <span className="px-2 py-0.5 text-[8px] font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                {master.accountType}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-500 font-medium">
              <span>{maskAccountNumber(master.accountNumber)}</span>
              <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
              <span>{master.branchName}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="h-9 px-4 text-[10.4px] font-semibold text-zinc-700 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Edit size={14} />
            Edit
          </button>
          
          <div className="relative group">
            <button className="h-9 px-3 text-[10.4px] font-semibold text-zinc-700 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all flex items-center gap-1.5 shadow-sm">
              <MoreVertical size={14} />
            </button>
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-zinc-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 py-1">
              <button onClick={() => window.print()} className="w-full text-left px-4 py-2 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"><Printer size={14}/> Print</button>
              <button onClick={() => window.print()} className="w-full text-left px-4 py-2 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"><Download size={14}/> Export PDF</button>
              <button onClick={() => setActiveTab('reconciliation')} className="w-full text-left px-4 py-2 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"><RefreshCw size={14}/> Reconciliation</button>
              <button onClick={() => navigate(buildPath(`/accounts/masters/bank-accounts/${id}/ledger`))} className="w-full text-left px-4 py-2 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"><FileText size={14}/> View Ledger</button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top KPI Cards */}
      <div className="p-6 pb-2">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <DollarSign size={32} className="text-emerald-600" />
            </div>
            <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Current Balance</p>
            <p className={`text-lg font-bold ${balance.currentBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              ₹ {formatCurrency(Math.abs(balance.currentBalance || 0))}
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
             <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Available Balance</p>
            <p className={`text-lg font-bold ${balance.availableBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              ₹ {formatCurrency(Math.abs(balance.availableBalance || 0))}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors">
             <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Reconciled Balance</p>
            <p className="text-lg font-bold text-blue-600">
              ₹ {formatCurrency(Math.abs(balance.reconciledBalance || 0))}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm relative overflow-hidden group hover:border-amber-200 transition-colors">
             <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Uncleared Amount</p>
            <p className="text-lg font-bold text-amber-600">
              ₹ {formatCurrency(balance.unclearedAmount || 0)}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
             <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Receipts</p>
            <p className="text-lg font-bold text-zinc-900">
              ₹ {formatCurrency(stats.totalReceipts || 0)}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
             <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Payments</p>
            <p className="text-lg font-bold text-zinc-900">
              ₹ {formatCurrency(stats.totalPayments || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Main Layout: 30% Sidebar / 70% Content */}
      <div className="flex-1 p-6 pt-4 flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Sidebar (30%) */}
        <div className="w-full lg:w-[30%] space-y-6 shrink-0">
          
          {/* Summary Card */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <h3 className="text-[10.4px] font-bold text-zinc-900 flex items-center gap-2 uppercase tracking-wide">
                <Building2 size={16} className="text-zinc-500" />
                Account Summary
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Bank Name</p>
                <p className="text-[10.4px] font-medium text-zinc-900 mt-0.5">{master.bankName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Account Number</p>
                  <p className="text-[10.4px] font-medium text-zinc-900 mt-0.5 font-mono">{maskAccountNumber(master.accountNumber)}</p>
                </div>
                <div>
                  <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">IFSC Code</p>
                  <p className="text-[10.4px] font-medium text-zinc-900 mt-0.5 font-mono">{master.ifscCode}</p>
                </div>
                <div>
                  <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Branch</p>
                  <p className="text-[10.4px] font-medium text-zinc-900 mt-0.5">{master.branchName}</p>
                </div>
                <div>
                  <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Account Type</p>
                  <p className="text-[10.4px] font-medium text-zinc-900 mt-0.5 capitalize">{master.accountType}</p>
                </div>
              </div>
              {master.upiId && (
                <div>
                  <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">UPI ID</p>
                  <p className="text-[10.4px] font-medium text-zinc-900 mt-0.5 font-mono">{master.upiId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <h3 className="text-[10.4px] font-bold text-zinc-900 flex items-center gap-2 uppercase tracking-wide">
                <Activity size={16} className="text-zinc-500" />
                Quick Actions
              </h3>
            </div>
            <div className="p-2">
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-[10.4px] font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 flex items-center gap-3 transition-colors"
              >
                <Edit size={16} className="text-zinc-400" /> Edit Account Details
              </button>
              <button onClick={() => setActiveTab('reconciliation')} className="w-full text-left px-3 py-2.5 rounded-lg text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 flex items-center gap-3 transition-colors">
                <RefreshCw size={16} className="text-zinc-400" /> Bank Reconciliation
              </button>
              <button onClick={() => navigate(buildPath(`/accounts/masters/bank-accounts/${id}/ledger`))} className="w-full text-left px-3 py-2.5 rounded-lg text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 flex items-center gap-3 transition-colors">
                <FileText size={16} className="text-zinc-400" /> View Ledger Report
              </button>
              <button onClick={() => window.print()} className="w-full text-left px-3 py-2.5 rounded-lg text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 flex items-center gap-3 transition-colors">
                <Download size={16} className="text-zinc-400" /> Download Statement
              </button>
            </div>
          </div>

        </div>

        {/* Right Main Content (70%) */}
        <div className="w-full lg:w-[70%] bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col min-h-[480px] overflow-hidden">
          
          {/* Tabs Header */}
          <div className="bg-zinc-50/80 border-b border-zinc-200/80 p-1.5 sticky top-0 z-10 overflow-x-auto no-scrollbar">
            <div className="flex overflow-x-auto no-scrollbar gap-1.5 pb-0.5 min-w-max">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all outline-none shrink-0 whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'bg-white text-zinc-900 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-zinc-200/60' 
                      : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/80 border border-transparent'
                  }`}
                >
                  <tab.icon size={14} strokeWidth={activeTab === tab.id ? 2.5 : 2} className={activeTab === tab.id ? "text-zinc-900" : "text-zinc-400"} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 p-0 overflow-auto bg-zinc-50/30">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                {/* Company Info */}
                <div>
                  <h4 className="text-[9.6px] font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Building2 size={14} /> Company Information
                  </h4>
                  <div className="bg-white rounded-xl border border-zinc-200 p-5 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Company Name</p>
                      <p className="text-[10.4px] font-semibold text-zinc-900 mt-1">{company.name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">GSTIN</p>
                      <p className="text-[10.4px] font-semibold text-zinc-900 mt-1">{company.gstin || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">PAN</p>
                      <p className="text-[10.4px] font-semibold text-zinc-900 mt-1">{company.pan || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Base Currency</p>
                      <p className="text-[10.4px] font-semibold text-zinc-900 mt-1">{company.baseCurrency || 'INR'}</p>
                    </div>
                  </div>
                </div>

                {/* Linked Accounts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* GL Account */}
                  <div>
                    <h4 className="text-[9.6px] font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Layers size={14} /> Linked GL Account
                    </h4>
                    <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
                      <div>
                        <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Account Code & Name</p>
                        <p className="text-[10.4px] font-semibold text-zinc-900 mt-1 flex items-center gap-2">
                          <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-xs">{linkedGl.glAccountCode || '-'}</span>
                          {linkedGl.glAccountName || '-'}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Account Type</p>
                          <p className="text-[10.4px] font-medium text-zinc-900 mt-1">{linkedGl.accountType || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Ledger Balance</p>
                          <p className="text-[10.4px] font-medium text-zinc-900 mt-1">₹ {formatCurrency(linkedGl.currentLedgerBalance || 0)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Ledger Account */}
                  <div>
                    <h4 className="text-[9.6px] font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <FileText size={14} /> Linked Ledger Account
                    </h4>
                    <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
                      <div>
                        <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Ledger Code & Name</p>
                        <p className="text-[10.4px] font-semibold text-zinc-900 mt-1 flex items-center gap-2">
                          <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-xs">{linkedLedger.ledgerCode || '-'}</span>
                          {linkedLedger.ledgerName || '-'}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Opening Balance</p>
                          <p className="text-[10.4px] font-medium text-zinc-900 mt-1">₹ {formatCurrency(linkedLedger.openingBalance || 0)}</p>
                        </div>
                        <div>
                          <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider">Closing Balance</p>
                          <p className="text-[10.4px] font-medium text-zinc-900 mt-1">₹ {formatCurrency(linkedLedger.closingBalance || 0)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* BALANCE SUMMARY TAB */}
            {activeTab === 'balance' && (
              <div className="p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Balance Cards */}
                    <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
                      <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Opening Balance</p>
                      <p className="text-2xl font-bold text-zinc-900">₹ {formatCurrency(balance.openingBalance || 0)}</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm border-l-4 border-l-emerald-500">
                      <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Current Balance</p>
                      <p className="text-2xl font-bold text-emerald-600">₹ {formatCurrency(balance.currentBalance || 0)}</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm border-l-4 border-l-blue-500">
                      <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Reconciled Balance</p>
                      <p className="text-2xl font-bold text-blue-600">₹ {formatCurrency(balance.reconciledBalance || 0)}</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm border-l-4 border-l-amber-500">
                      <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Uncleared Amount</p>
                      <p className="text-2xl font-bold text-amber-600">₹ {formatCurrency(balance.unclearedAmount || 0)}</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm border-l-4 border-l-indigo-500">
                      <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Available Balance</p>
                      <p className="text-2xl font-bold text-indigo-600">₹ {formatCurrency(balance.availableBalance || 0)}</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
                      <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Closing Balance</p>
                      <p className="text-2xl font-bold text-zinc-900">₹ {formatCurrency(balance.closingBalance || 0)}</p>
                    </div>
                 </div>
              </div>
            )}

            {/* TRANSACTIONS TAB */}
            {activeTab === 'transactions' && (
              <div className="animate-in fade-in duration-300">
                {profile.bankTransactions && profile.bankTransactions.length > 0 ? (
                  <div className="overflow-x-auto min-w-0 max-w-full custom-scrollbar border border-zinc-200 rounded-xl shadow-sm">
                    <table className="w-full min-w-[700px] text-left border-collapse whitespace-nowrap text-sm" aria-label="Bank Transactions Table">
                      <thead className="bg-zinc-100/80 border-b border-zinc-200 sticky top-0 z-10">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-zinc-600 font-semibold text-xs">Date</th>
                          <th scope="col" className="px-4 py-3 text-zinc-600 font-semibold text-xs">Voucher No</th>
                          <th scope="col" className="px-4 py-3 text-zinc-600 font-semibold text-xs">Description</th>
                          <th scope="col" className="px-4 py-3 text-zinc-600 font-semibold text-xs text-right">Debit</th>
                          <th scope="col" className="px-4 py-3 text-zinc-600 font-semibold text-xs text-right">Credit</th>
                          <th scope="col" className="px-4 py-3 text-zinc-600 font-semibold text-xs text-right">Running Bal</th>
                          <th scope="col" className="px-4 py-3 text-zinc-600 font-semibold text-xs">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 bg-white">
                        {profile.bankTransactions.map((trx, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                            <td className="px-4 py-3 text-zinc-600">{formatDate(trx.transactionDate)}</td>
                            <td className="px-4 py-3 font-mono text-xs text-blue-600">{trx.voucherNumber || '-'}</td>
                            <td className="px-4 py-3 text-zinc-800">{trx.description || '-'}</td>
                            <td className="px-4 py-3 text-right text-red-600 font-medium tabular-nums">{trx.debit > 0 ? formatCurrency(trx.debit) : '-'}</td>
                            <td className="px-4 py-3 text-right text-emerald-600 font-medium tabular-nums">{trx.credit > 0 ? formatCurrency(trx.credit) : '-'}</td>
                            <td className="px-4 py-3 text-right text-zinc-900 font-medium tabular-nums">{formatCurrency(trx.runningBalance)}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${trx.transactionStatus === 'CLEARED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                                {trx.transactionStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : renderEmptyState('No Transactions Found', 'This bank account has no recorded transactions yet.')}
              </div>
            )}

            {/* PAYMENT VOUCHERS TAB */}
            {activeTab === 'payment-vouchers' && (
              <div className="animate-in fade-in duration-300">
                {profile.paymentVouchers && profile.paymentVouchers.length > 0 ? (
                  <div className="overflow-x-auto min-w-0 max-w-full custom-scrollbar border border-zinc-200 rounded-xl shadow-sm">
                    <table className="w-full min-w-[620px] text-left border-collapse whitespace-nowrap text-sm" aria-label="Payment Vouchers Table">
                      <thead className="bg-zinc-100/80 border-b border-zinc-200 sticky top-0 z-10">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-zinc-600 font-semibold text-xs">Voucher No</th>
                          <th scope="col" className="px-4 py-3 text-zinc-600 font-semibold text-xs">Vendor Name</th>
                          <th scope="col" className="px-4 py-3 text-zinc-600 font-semibold text-xs text-right">Amount</th>
                          <th scope="col" className="px-4 py-3 text-zinc-600 font-semibold text-xs">Mode</th>
                          <th scope="col" className="px-4 py-3 text-zinc-600 font-semibold text-xs">Status</th>
                          <th scope="col" className="px-4 py-3 text-zinc-600 font-semibold text-xs text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 bg-white">
                        {profile.paymentVouchers.map((pv, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs font-semibold text-zinc-900">{pv.voucherNumber}</td>
                            <td className="px-4 py-3 text-zinc-700">{pv.vendorName}</td>
                            <td className="px-4 py-3 text-right font-medium text-red-600 tabular-nums">₹ {formatCurrency(pv.paymentAmount)}</td>
                            <td className="px-4 py-3 text-zinc-600 text-xs">{pv.paymentMode}</td>
                            <td className="px-4 py-3">
                              <span className="badge badge-success">{pv.status}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button className="text-blue-600 hover:text-blue-800 font-medium text-xs">View</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : renderEmptyState('No Payment Vouchers', 'No payment vouchers linked to this bank account.')}
              </div>
            )}

            {/* RECEIPT VOUCHERS TAB */}
            {activeTab === 'receipt-vouchers' && (
              <div className="animate-in fade-in duration-300">
                {profile.receiptVouchers && profile.receiptVouchers.length > 0 ? (
                  <div className="overflow-x-auto min-w-0 max-w-full custom-scrollbar border border-zinc-200 rounded-xl shadow-sm">
                    <table className="w-full min-w-[620px] text-left border-collapse whitespace-nowrap text-sm" aria-label="Receipt Vouchers Table">
                      <thead className="bg-zinc-100/80 border-b border-zinc-200 sticky top-0 z-10">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-zinc-600 font-semibold text-xs">Voucher No</th>
                          <th scope="col" className="px-4 py-3 text-zinc-600 font-semibold text-xs">Customer Name</th>
                          <th scope="col" className="px-4 py-3 text-zinc-600 font-semibold text-xs text-right">Amount</th>
                          <th scope="col" className="px-4 py-3 text-zinc-600 font-semibold text-xs">Mode</th>
                          <th scope="col" className="px-4 py-3 text-zinc-600 font-semibold text-xs">Status</th>
                          <th scope="col" className="px-4 py-3 text-zinc-600 font-semibold text-xs text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 bg-white">
                        {profile.receiptVouchers.map((rv, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs font-semibold text-zinc-900">{rv.voucherNumber}</td>
                            <td className="px-4 py-3 text-zinc-700">{rv.customerName}</td>
                            <td className="px-4 py-3 text-right font-medium text-emerald-600 tabular-nums">₹ {formatCurrency(rv.receiptAmount)}</td>
                            <td className="px-4 py-3 text-zinc-600 text-xs">{rv.receiptMode}</td>
                            <td className="px-4 py-3">
                              <span className="badge badge-success">{rv.status}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button className="text-blue-600 hover:text-blue-800 font-medium text-xs">View</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : renderEmptyState('No Receipt Vouchers', 'No receipt vouchers linked to this bank account.')}
              </div>
            )}

            {/* LEDGER POSTING TAB */}
            {activeTab === 'ledger' && (
              <div className="p-6 animate-in fade-in duration-300">
                {profile.generalLedgerPostings && profile.generalLedgerPostings.length > 0 ? (
                  <div className="space-y-6">
                    {profile.generalLedgerPostings.map((gl, idx) => (
                      <div key={idx} className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-zinc-50/80 px-4 py-3 border-b border-zinc-200 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-bold px-2 py-1 bg-zinc-200 text-zinc-800 rounded">{gl.journalNumber}</span>
                            <span className="text-xs font-medium text-zinc-500">{formatDate(gl.postingDate)}</span>
                          </div>
                          <span className="px-2 py-0.5 text-xs font-medium rounded-md border bg-blue-50 text-blue-700 border-blue-200">{gl.postingStatus}</span>
                        </div>
                        <div className="overflow-x-auto min-w-0 max-w-full custom-scrollbar">
                          <table className="w-full min-w-[500px] text-sm" aria-label="Journal Entries Table">
                             <thead className="bg-zinc-50 text-zinc-600 border-b border-zinc-100 text-left text-xs font-semibold">
                                <tr>
                                  <th scope="col" className="px-4 py-2">Account Code</th>
                                  <th scope="col" className="px-4 py-2">Account Name</th>
                                  <th scope="col" className="px-4 py-2">Narration</th>
                                  <th scope="col" className="px-4 py-2 text-right">Debit</th>
                                  <th scope="col" className="px-4 py-2 text-right">Credit</th>
                                </tr>
                             </thead>
                           <tbody className="divide-y divide-zinc-50">
                              {gl.debitEntries?.map((dr, i) => (
                                <tr key={`dr-${i}`}>
                                  <td className="px-4 py-2 font-mono text-xs">{dr.accountCode}</td>
                                  <td className="px-4 py-2 font-medium text-zinc-800">{dr.accountName}</td>
                                  <td className="px-4 py-2 text-zinc-500 text-xs truncate max-w-[160px]" title={dr.narration}>{dr.narration || '-'}</td>
                                  <td className="px-4 py-2 text-right text-zinc-900 font-medium">{formatCurrency(dr.amount)}</td>
                                  <td className="px-4 py-2 text-right text-zinc-400">-</td>
                                </tr>
                              ))}
                              {gl.creditEntries?.map((cr, i) => (
                                <tr key={`cr-${i}`}>
                                  <td className="px-4 py-2 font-mono text-xs pl-8">{cr.accountCode}</td>
                                  <td className="px-4 py-2 font-medium text-zinc-800 pl-8">{cr.accountName}</td>
                                  <td className="px-4 py-2 text-zinc-500 text-xs truncate max-w-[160px]" title={cr.narration}>{cr.narration || '-'}</td>
                                  <td className="px-4 py-2 text-right text-zinc-400">-</td>
                                  <td className="px-4 py-2 text-right text-zinc-900 font-medium">{formatCurrency(cr.amount)}</td>
                                </tr>
                              ))}
                           </tbody>
                        </table>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : renderEmptyState('No Ledger Postings', 'No journal entries found for this bank account.')}
              </div>
            )}

            {/* RECONCILIATION TAB */}
            {activeTab === 'reconciliation' && (
              <div className="p-6 animate-in fade-in duration-300">
                {profile.bankReconciliation ? (
                  <div className="bg-white rounded-xl border border-zinc-200 p-6 max-w-3xl mx-auto shadow-sm">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-100">
                      <div>
                        <h3 className="text-lg font-bold text-zinc-900">Bank Reconciliation</h3>
                        <p className="text-xs text-zinc-500 mt-1">Last Reconciled: {formatDate(profile.bankReconciliation.lastReconciliationDate)}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-md text-xs font-bold border ${profile.bankReconciliation.reconciliationStatus === 'RECONCILED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {profile.bankReconciliation.reconciliationStatus}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 rounded-lg bg-zinc-50">
                        <span className="text-sm font-semibold text-zinc-700">Cleared Balance</span>
                        <span className="text-sm font-bold text-zinc-900">₹ {formatCurrency(profile.bankReconciliation.clearedBalance)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-zinc-50">
                        <span className="text-sm font-semibold text-zinc-700">+ Uncleared Deposits</span>
                        <span className="text-sm font-bold text-emerald-600">₹ {formatCurrency(profile.bankReconciliation.unclearedDeposits)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-zinc-50">
                        <span className="text-sm font-semibold text-zinc-700">- Outstanding Cheques</span>
                        <span className="text-sm font-bold text-red-600">₹ {formatCurrency(profile.bankReconciliation.outstandingCheques)}</span>
                      </div>
                      <div className="my-4 border-t border-dashed border-zinc-200"></div>
                      <div className="flex justify-between items-center p-4 rounded-xl bg-zinc-100/80 border border-zinc-200">
                        <span className="text-base font-bold text-zinc-900">Reconciliation Difference</span>
                        <span className={`text-lg font-bold ${profile.bankReconciliation.reconciliationDifference !== 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          ₹ {formatCurrency(profile.bankReconciliation.reconciliationDifference)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : renderEmptyState('Not Reconciled', 'This bank account has not been reconciled yet.')}
              </div>
            )}
            
            {/* AUDIT TAB */}
            {activeTab === 'audit' && (
              <div className="p-6 animate-in fade-in duration-300">
                <div className="bg-white rounded-xl border border-zinc-200 p-6 max-w-2xl shadow-sm">
                   <h3 className="text-[10.4px] font-bold text-zinc-900 flex items-center gap-2 uppercase tracking-wide mb-6">
                    <Activity size={16} className="text-zinc-500" />
                    Audit Information
                  </h3>
                  <div className="space-y-6">
                    <div className="flex gap-4 items-start relative">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 z-10">
                        <Plus size={16} />
                      </div>
                      <div className="absolute left-4 top-8 bottom-[-24px] w-px bg-zinc-200"></div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">Created Bank Account</p>
                        <p className="text-xs text-zinc-500 mt-1">By {profile.auditInformation?.createdBy || 'System'} on {formatDate(profile.auditInformation?.createdAt)}</p>
                      </div>
                    </div>
                    
                    {profile.auditInformation?.updatedAt && (
                      <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 z-10">
                          <Edit size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">Last Updated</p>
                          <p className="text-xs text-zinc-500 mt-1">By {profile.auditInformation?.updatedBy || 'System'} on {formatDate(profile.auditInformation?.updatedAt)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* OTHER TABS (Attachments, Related) - Empty for now */}
            {(activeTab === 'attachments' || activeTab === 'related') && (
              <div className="p-6 animate-in fade-in duration-300 h-full flex items-center justify-center">
                 {renderEmptyState('Coming Soon', 'This section is under development.')}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Edit Form Modal */}
      {isEditModalOpen && (
        <BankAccountForm
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          initialData={master}
          onSubmit={handleEditSubmit}
          isLoading={isUpdating}
        />
      )}
    </div>
  );
}
