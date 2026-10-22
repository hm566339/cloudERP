import React, { useState, useEffect } from 'react';
import { X, Banknote, Save } from 'lucide-react';
import CustomSelect from '../../../components/common/CustomSelect';
import { useGetChartOfAccountsQuery } from '../../../api/account/accounting.api';
import { useCreateReceiptMutation } from '../../../api/account/finance.api';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { useApiQuery } from '../../../hooks/useApi';
import { bankAccountsApi } from '../../../api/account';

const PAYMENT_MODES = [
  { label: 'Cash', value: 'CASH' },
  { label: 'Bank Transfer', value: 'BANK_TRANSFER' },
  { label: 'Cheque', value: 'CHEQUE' },
  { label: 'Credit Card', value: 'CREDIT_CARD' },
  { label: 'UPI', value: 'UPI' }
];

export default function AdvancePaymentModal({ isOpen, onClose, pi, companyId, onSuccess }) {
  const dispatch = useAppDispatch();
  const [createReceipt, { isLoading: isSubmitting }] = useCreateReceiptMutation();

  const { data: bankAccountsResponse, isLoading: banksLoading } = useApiQuery(bankAccountsApi.getBankAccounts, { companyId, size: 1000 }, { skip: !isOpen });
  const rawBankAccounts = bankAccountsResponse?.data?.bankAccounts || bankAccountsResponse?.bankAccounts || bankAccountsResponse?.data?.content || bankAccountsResponse?.content || bankAccountsResponse?.data || bankAccountsResponse || [];
  const bankAccounts = Array.isArray(rawBankAccounts) ? rawBankAccounts : (rawBankAccounts?.content ? rawBankAccounts.content : (rawBankAccounts?.bankAccounts ? rawBankAccounts.bankAccounts : []));
  const safeBankAccounts = Array.isArray(bankAccounts) ? bankAccounts : [];
  const bankAccountOptions = safeBankAccounts.map(b => ({ label: `${b.bankName} - ${b.accountNumber}`, value: b.id }));

  const { data: chartOfAccountsData, isLoading: accountsLoading } = useGetChartOfAccountsQuery({ companyId, page: 0, size: 1000 }, { skip: !isOpen });
  const rawAccounts = chartOfAccountsData?.data?.data || chartOfAccountsData?.data?.content || chartOfAccountsData?.content || chartOfAccountsData?.data || [];
  const chartOfAccounts = Array.isArray(rawAccounts) ? rawAccounts : [];

  const [formData, setFormData] = useState({
    receiptDate: new Date().toISOString().split('T')[0],
    amount: '',
    paymentMode: 'BANK_TRANSFER',
    bankAccountId: '',
    receivableAccountId: '',
    receiptAccountId: '',
    referenceNo: '',
    remarks: ''
  });

  const receivableAccounts = chartOfAccounts.filter(a =>
    a.postingAllowed !== false &&
    (a.groupName === 'Accounts Receivable' || a.accountName?.toLowerCase().includes('receivable'))
  );
  const receivableAccountOptions = receivableAccounts.map(a => ({ label: `${a.accountCode} - ${a.accountName}`, value: a.id }));

  const receiptAccounts = chartOfAccounts.filter(a => {
    if (a.postingAllowed === false) return false;
    const isCash = a.groupName === 'Cash & Cash Equivalent' || a.accountName?.toLowerCase().includes('cash');
    const isBank = a.groupName === 'Bank Accounts' || a.accountName?.toLowerCase().includes('bank');

    if (formData.paymentMode === 'CASH') return isCash;
    return isBank; // For BANK_TRANSFER, CHEQUE, CREDIT_CARD, UPI
  });
  const receiptAccountOptions = receiptAccounts.map(a => ({ label: `${a.accountCode} - ${a.accountName}`, value: a.id }));

  const curr = pi?.currency || 'INR';
  const fmt = (n) => (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  useEffect(() => {
    if (isOpen && pi) {
      setFormData(prev => ({
        ...prev,
        amount: pi.advanceAmount || pi.totalAmount || 0,
        receiptDate: new Date().toISOString().split('T')[0],
        paymentMode: 'BANK_TRANSFER',
        bankAccountId: '',
        receivableAccountId: '',
        receiptAccountId: '',
        referenceNo: '',
        remarks: ''
      }));
    }
  }, [isOpen, pi]);

  if (!isOpen || !pi) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) {
      dispatch(addAlert({ type: 'error', message: 'Please enter a valid amount' }));
      return;
    }
    if (!formData.bankAccountId || !formData.receivableAccountId || !formData.receiptAccountId) {
      dispatch(addAlert({ type: 'error', message: 'Please select required accounts' }));
      return;
    }

    try {
      const payload = {
        data: {
          customerId: pi.customerId,
          bankAccountId: formData.bankAccountId,
          receiptDate: formData.receiptDate,
          receiptAmount: Number(formData.amount),
          paymentMode: formData.paymentMode,
          receivableAccountId: formData.receivableAccountId,
          receiptAccountId: formData.receiptAccountId,
          referenceNo: formData.referenceNo,
          remarks: formData.remarks || `Advance payment for PI ${pi.piNumber}`,
          allocations: []
        }
      };

      const res = await createReceipt({ companyId, ...payload }).unwrap();
      dispatch(addAlert({ type: 'success', message: 'Advance payment recorded successfully' }));
      if (onSuccess) onSuccess(res);
      onClose();
    } catch (err) {
      console.error(err);
      // baseApi already dispatches an error toast for HTTP errors
      if (!err?.status) {
        dispatch(addAlert({ type: 'error', message: err?.data?.message || err?.message || 'Failed to record advance payment' }));
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-[#2A2F3D]">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Banknote size={20} />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-[#E6E8EE]">Record Advance Payment</h2>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 dark:text-[#6B7184] hover:text-zinc-600 dark:hover:text-[#E6E8EE] hover:bg-zinc-100 dark:hover:bg-[#222736] rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 bg-zinc-50/50 dark:bg-[#0F1117]">
          <div className="mb-6 p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-lg">
            <h3 className="text-xs font-bold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider mb-3">Proforma Invoice Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-zinc-500 dark:text-[#A0A6B5] mb-1">PI Number</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-[#E6E8EE]">{pi.piNumber}</span>
              </div>
              <div>
                <span className="block text-zinc-500 dark:text-[#A0A6B5] mb-1">Customer</span>
                <span className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">{pi.customerName}</span>
              </div>
              <div>
                <span className="block text-zinc-500 dark:text-[#A0A6B5] mb-1">Total Amount</span>
                <span className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">{curr} {fmt(pi.totalAmount)}</span>
              </div>
              <div>
                <span className="block text-indigo-600 dark:text-indigo-400 font-medium mb-1">Advance Required</span>
                <span className="font-bold text-indigo-700 dark:text-indigo-400">{curr} {fmt(pi.advanceAmount)}</span>
              </div>
            </div>
          </div>

          <form id="advance-payment-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1.5">Receipt Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="receiptDate"
                  value={formData.receiptDate}
                  onChange={handleChange}
                  required
                  className="w-full h-9 px-3 text-sm bg-white dark:bg-[#1D212C] border border-zinc-300 dark:border-[#2A2F3D] text-zinc-900 dark:text-[#E6E8EE] rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900/10/20 focus:border-zinc-400 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1.5">Amount <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500 dark:text-[#6B7184] font-medium">{curr}</span>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    min="0.01"
                    step="0.01"
                    className="w-full h-9 pl-10 pr-3 text-sm bg-white dark:bg-[#1D212C] border border-zinc-300 dark:border-[#2A2F3D] rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900/10/20 focus:border-zinc-400 transition-shadow font-semibold text-zinc-900 dark:text-[#E6E8EE]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1.5">Payment Mode <span className="text-red-500">*</span></label>
                <select
                  name="paymentMode"
                  value={formData.paymentMode}
                  onChange={handleChange}
                  required
                  className="w-full h-9 px-3 text-sm bg-white dark:bg-[#1D212C] border border-zinc-300 dark:border-[#2A2F3D] text-zinc-900 dark:text-[#E6E8EE] rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900/10/20 focus:border-zinc-400 transition-shadow"
                >
                  {PAYMENT_MODES.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1.5">Bank Account <span className="text-red-500">*</span></label>
                <CustomSelect
                  options={bankAccountOptions}
                  isLoading={banksLoading}
                  value={formData.bankAccountId}
                  onChange={(e) => handleSelectChange('bankAccountId', e.target.value)}
                  placeholder="Select Bank Account"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1.5">Receivable Account <span className="text-red-500">*</span></label>
                <CustomSelect
                  options={receivableAccountOptions}
                  isLoading={accountsLoading}
                  value={formData.receivableAccountId}
                  onChange={(e) => handleSelectChange('receivableAccountId', e.target.value)}
                  placeholder="Select Account"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1.5">Receipt Account <span className="text-red-500">*</span></label>
                <CustomSelect
                  options={receiptAccountOptions}
                  isLoading={accountsLoading}
                  value={formData.receiptAccountId}
                  onChange={(e) => handleSelectChange('receiptAccountId', e.target.value)}
                  placeholder="Select Account"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1.5">Reference No.</label>
                <input
                  type="text"
                  name="referenceNo"
                  value={formData.referenceNo}
                  onChange={handleChange}
                  placeholder="e.g. Cheque No / UTR"
                  className="w-full h-9 px-3 text-sm bg-white dark:bg-[#1D212C] border border-zinc-300 dark:border-[#2A2F3D] text-zinc-900 dark:text-[#E6E8EE] rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900/10/20 focus:border-zinc-400 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1.5">Remarks</label>
                <input
                  type="text"
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Add a note..."
                  className="w-full h-9 px-3 text-sm bg-white dark:bg-[#1D212C] border border-zinc-300 dark:border-[#2A2F3D] text-zinc-900 dark:text-[#E6E8EE] rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900/10/20 focus:border-zinc-400 transition-shadow"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 bg-zinc-50 dark:bg-[#161922] border-t border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-[#A0A6B5] bg-white dark:bg-[#1D212C] border border-zinc-300 dark:border-[#2A2F3D] rounded-md hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="advance-payment-form"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-zinc-900 dark:bg-primary hover:bg-zinc-800 dark:hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save Payment
          </button>
        </div>
      </div>
    </div>
  );
}
