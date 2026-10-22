import React, { useState, useEffect } from 'react';
import { X, CreditCard, IndianRupee, Building2, CheckCircle2 } from 'lucide-react';
import CustomSelect from '../../../../components/common/CustomSelect';

const PAYMENT_METHODS = [
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'CASH', label: 'Cash' },
  { value: 'OTHER', label: 'Other' }
];

const BANK_ACCOUNTS = [
  'HDFC Bank - Current A/C (A/C: 50200084928891)',
  'ICICI Bank - Operations A/C (A/C: 002105019284)',
  'State Bank of India - Disbursal A/C (A/C: 38291049281)',
  'Main Cash in Hand / Petty Cash Drawer'
];

export default function ProcessReimbursementModal({ isOpen, onClose, reimbursement, onSubmit }) {
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'BANK_TRANSFER',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentReference: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen && reimbursement) {
      const balance = reimbursement.balanceDue ?? ((reimbursement.reimbursementAmount || 0) - (reimbursement.reimbursedAmount || 0));
      setFormData({
        amount: balance,
        paymentMethod: 'BANK_TRANSFER',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentReference: '',
        notes: `Payout for ${reimbursement.expenseClaimNo || reimbursement.reimbursementNo}`
      });
    }
  }, [isOpen, reimbursement]);

  if (!isOpen || !reimbursement) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const payAmount = parseFloat(formData.amount) || 0;
    if (payAmount <= 0) return;

    onSubmit(reimbursement.id, {
      paymentMethod: formData.paymentMethod,
      paymentDate: formData.paymentDate,
      paymentReference: formData.paymentReference,
      amount: payAmount,
      notes: formData.notes
    });
  };

  const currentBalance = reimbursement.balanceDue ?? ((reimbursement.reimbursementAmount || 0) - (reimbursement.reimbursedAmount || 0));
  const payAmt = parseFloat(formData.amount) || 0;
  const remainingBalance = Math.max(0, currentBalance - payAmt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-zinc-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#161922] rounded-xl shadow-2xl border border-zinc-200 dark:border-[#2A2F3D] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
              <CreditCard size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-[#E6E8EE]">Process Reimbursement</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Disburse approved expense funds to staff or driver</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-[#E6E8EE] rounded-lg hover:bg-zinc-100 dark:hover:bg-[#222736] transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Summary Box */}
          <div className="p-3.5 bg-zinc-50 dark:bg-[#1D212C] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] text-xs space-y-2">
            <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400">
              <span>Reimbursement Ref:</span>
              <span className="font-mono font-bold text-zinc-900 dark:text-[#E6E8EE]">{reimbursement.reimbursementNo}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400">
              <span>Beneficiary:</span>
              <span className="font-bold text-zinc-900 dark:text-[#E6E8EE]">{reimbursement.employeeName || reimbursement.employeeId || 'Employee'}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400">
              <span>Expense Reference:</span>
              <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">{reimbursement.expenseClaimNo || '—'}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-zinc-200/80 dark:border-[#2A2F3D]/80 font-bold">
              <span className="text-zinc-700 dark:text-zinc-300">Total Outstanding Balance:</span>
              <span className="text-sm font-extrabold text-amber-700 dark:text-amber-400">₹{currentBalance.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[8.8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 block">
                Disbursal Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <IndianRupee size={14} className="absolute left-3 top-2.5 text-zinc-400 dark:text-zinc-500" />
                <input
                  type="number"
                  required
                  min="1"
                  max={currentBalance}
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full h-9 pl-8 pr-3 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs font-bold text-zinc-900 dark:text-[#E6E8EE] focus:border-zinc-400 dark:focus:border-zinc-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[8.8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 block">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                className="w-full h-9 px-3 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-zinc-400 dark:focus:border-zinc-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[8.8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 block">
              Payment Method <span className="text-rose-500">*</span>
            </label>
            <CustomSelect
              value={formData.paymentMethod}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
              className="h-9 px-3 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs font-medium text-zinc-700 dark:text-[#E6E8EE] focus:bg-white dark:focus:bg-[#1D212C] focus:border-zinc-400 dark:focus:border-zinc-500 outline-none w-full"
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm.value} value={pm.value}>{pm.label}</option>
              ))}
            </CustomSelect>
          </div>

          <div>
            <label className="text-[8.8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 block">
              Source Bank / Cash Ledger <span className="text-rose-500">*</span>
            </label>
            <CustomSelect
              value={formData.bankAccount}
              onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
              className="w-full h-9 px-3 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-zinc-400 dark:focus:border-zinc-500 outline-none"
            >
              {BANK_ACCOUNTS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </CustomSelect>
          </div>

          <div>
            <label className="text-[8.8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 block">
              Transaction / UTR Reference
            </label>
            <input
              type="text"
              placeholder="e.g. UTR / Cheque No. / IMPS Ref"
              value={formData.paymentReference}
              onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
              className="w-full h-9 px-3 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs font-mono text-zinc-800 dark:text-[#E6E8EE] focus:border-zinc-400 dark:focus:border-zinc-500 outline-none"
            />
          </div>

          {/* Balance Preview */}
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs flex items-center justify-between">
            <span className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
              Remaining Balance after this payment:
            </span>
            <span className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
              ₹{remainingBalance.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100 dark:border-[#2A2F3D]">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-[#E6E8EE] hover:bg-zinc-100 dark:hover:bg-[#222736] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 px-5 text-xs font-semibold text-white bg-zinc-900 dark:bg-[#4C8DFF] hover:bg-zinc-800 dark:hover:bg-[#6AA1FF] rounded-lg shadow-sm transition-colors active:scale-98"
            >
              Confirm & Settle Payout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
