import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, XCircle, Loader2, Trash2 } from 'lucide-react';
import CustomSelect from '../../../../components/common/CustomSelect';
import { chartOfAccountsApi } from '../../../../api/account/chartOfAccounts';

/**
 * Modal to confirm and submit an Expense Claim Approval
 */
export function ExpenseApproveModal({ isOpen, onClose, expense, onConfirm, isLoading = false }) {
  const [notes, setNotes] = useState('');
  const [employeePayableAccountId, setEmployeePayableAccountId] = useState('');
  const [bankOrCashAccountId, setBankOrCashAccountId] = useState('');
  
  const [accounts, setAccounts] = useState([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNotes('');
      setEmployeePayableAccountId('');
      setBankOrCashAccountId('');
      
      const fetchAccounts = async () => {
        setIsLoadingAccounts(true);
        try {
          const response = await chartOfAccountsApi.getList({ page: 0, size: 500 });
          const raw = response?.data?.data || response?.data?.content || response?.data?.chartOfAccounts || response?.data || [];
          const list = Array.isArray(raw) ? raw : (Array.isArray(response?.data) ? response.data : []);
          setAccounts(list);

          // Auto-select sensible defaults if available
          const payable = list.find(a => 
            a.accountCode === '200001' || 
            a.accountName?.toLowerCase().includes('payable')
          );
          if (payable) setEmployeePayableAccountId(payable.id);
          
          const bankOrCash = list.find(a => 
            a.accountCode === '100001' || 
            a.accountCode === '100002' || 
            a.accountName?.toLowerCase().includes('cash') || 
            a.accountName?.toLowerCase().includes('bank')
          );
          if (bankOrCash) setBankOrCashAccountId(bankOrCash.id);
        } catch (error) {
          console.error('Failed to fetch accounts', error);
          setAccounts([]);
        } finally {
          setIsLoadingAccounts(false);
        }
      };
      fetchAccounts();
    }
  }, [isOpen]);

  if (!isOpen || !expense) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanPayableId = typeof employeePayableAccountId === 'object'
      ? (employeePayableAccountId?.target?.value || employeePayableAccountId?.value || '')
      : employeePayableAccountId;
    const cleanBankCashId = typeof bankOrCashAccountId === 'object'
      ? (bankOrCashAccountId?.target?.value || bankOrCashAccountId?.value || '')
      : bankOrCashAccountId;

    if (!cleanPayableId || !cleanBankCashId) return;
    
    onConfirm({ 
      notes: notes.trim() || undefined,
      employeePayableAccountId: String(cleanPayableId),
      bankOrCashAccountId: String(cleanBankCashId)
    });
  };

  const accountList = Array.isArray(accounts) ? accounts : [];
  const accountOptions = accountList.map(acc => ({
    value: acc.id,
    label: acc.accountCode ? `${acc.accountCode} - ${acc.accountName}` : acc.accountName
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 bg-emerald-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Approve Expense</h2>
              <p className="text-[8.8px] text-zinc-500 font-mono">{expense.claimNo || expense.expenseRequestNumber || 'New Expense'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-500">Claim Amount:</span>
              <span className="font-bold text-zinc-900">₹{Number(expense.claimAmount || 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[8.8px] font-bold text-zinc-600 uppercase tracking-wider mb-1 block">
                Employee Payable Account <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                options={accountOptions}
                value={employeePayableAccountId}
                onChange={(e) => {
                  const val = e?.target ? e.target.value : e;
                  setEmployeePayableAccountId(typeof val === 'string' ? val : (val?.value || ''));
                }}
                placeholder={isLoadingAccounts ? "Loading accounts..." : "Select payable account..."}
                required
              />
            </div>
            
            <div>
              <label className="text-[8.8px] font-bold text-zinc-600 uppercase tracking-wider mb-1 block">
                Bank / Cash Account <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                options={accountOptions}
                value={bankOrCashAccountId}
                onChange={(e) => {
                  const val = e?.target ? e.target.value : e;
                  setBankOrCashAccountId(typeof val === 'string' ? val : (val?.value || ''));
                }}
                placeholder={isLoadingAccounts ? "Loading accounts..." : "Select bank/cash account..."}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[8.8px] font-bold text-zinc-600 uppercase tracking-wider mb-1 block">
              Approval Notes
            </label>
            <textarea
              rows={2}
              placeholder="Optional approval notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-800 focus:border-zinc-400 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-8 px-3.5 text-xs font-semibold text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !employeePayableAccountId || !bankOrCashAccountId}
              className="h-8 px-4 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-60"
            >
              {isLoading && <Loader2 size={13} className="animate-spin" />}
              Confirm Approval
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}/**
 * Modal to collect a mandatory reason when Rejecting an Expense Claim
 */
export function ExpenseRejectModal({ isOpen, onClose, expense, onConfirm, isLoading = false }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !expense) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Rejection reason is required');
      return;
    }
    onConfirm({ rejectionReason: reason.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 bg-rose-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
              <XCircle size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Reject Expense</h2>
              <p className="text-[8.8px] text-zinc-500 font-mono">{expense.claimNo || expense.expenseRequestNumber || 'New Expense'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-zinc-600">
            Please provide the reason for rejecting expense <span className="font-mono font-bold text-zinc-800">{expense.claimNo || expense.expenseRequestNumber || 'New Expense'}</span>.
          </p>

          <div>
            <label className="text-[8.8px] font-bold text-zinc-600 uppercase tracking-wider mb-1 block">
              Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Non-compliant bill or missing details"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              className="w-full p-2.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-800 focus:border-zinc-400 outline-none"
            />
            {error && <p className="text-[8.8px] text-rose-500 mt-1 font-medium">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-8 px-3.5 text-xs font-semibold text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="h-8 px-4 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-60"
            >
              {isLoading && <Loader2 size={13} className="animate-spin" />}
              Confirm Rejection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal to confirm cancelling an Expense Claim
 */
export function ExpenseCancelModal({ isOpen, onClose, expense, onConfirm, isLoading = false }) {
  if (!isOpen || !expense) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 space-y-3 text-center">
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <AlertTriangle size={20} />
          </div>
          <h2 className="text-sm font-bold text-zinc-900">Cancel Expense?</h2>
          <p className="text-xs text-zinc-500">
            Are you sure you want to cancel expense <span className="font-mono font-bold text-zinc-800">{expense.claimNo || expense.expenseRequestNumber || 'New Expense'}</span>?
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-zinc-50 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-8 px-3.5 text-xs font-semibold text-zinc-600 hover:text-zinc-800 rounded-lg transition-colors"
          >
            No, Keep Expense
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="h-8 px-4 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-60"
          >
            {isLoading && <Loader2 size={13} className="animate-spin" />}
            Yes, Cancel Expense
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal to confirm deleting an Expense Claim (Soft Delete)
 */
export function ExpenseDeleteModal({ isOpen, onClose, expense, onConfirm, isLoading = false }) {
  if (!isOpen || !expense) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 space-y-3 text-center">
          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <Trash2 size={20} />
          </div>
          <h2 className="text-sm font-bold text-zinc-900">Delete Expense?</h2>
          <p className="text-xs text-zinc-500">
            Are you sure you want to delete expense <span className="font-mono font-bold text-zinc-800">{expense.claimNo || expense.expenseRequestNumber || 'New Expense'}</span>? This will permanently remove the record from view.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-zinc-50 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-8 px-3.5 text-xs font-semibold text-zinc-600 hover:text-zinc-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="h-8 px-4 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-60"
          >
            {isLoading && <Loader2 size={13} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

