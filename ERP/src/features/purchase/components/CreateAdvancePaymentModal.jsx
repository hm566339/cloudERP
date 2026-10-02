import React, { useState, useEffect } from 'react';
import { X, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { useCreatePurchaseOrderAdvancePaymentMutation } from '../../../api/purchase';
import { useApiQuery } from '../../../hooks/useApi';
import { bankAccountsApi, chartOfAccountsApi } from '../../../api/account';
import { PaymentMode } from '../../../constants/accountingEnums';
import { useParams } from 'react-router-dom';
import CustomSelect from '../../../components/common/CustomSelect';

export default function CreateAdvancePaymentModal({ isOpen, onClose, purchaseOrder }) {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;
  const dispatch = useAppDispatch();
  const [createAdvancePayment, { isLoading }] = useCreatePurchaseOrderAdvancePaymentMutation();

  const [formData, setFormData] = useState({
    amount: '',
    bankAccountId: '',
    payableAccountId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: '',
    reference: '',
    remarks: ''
  });

  const { data: bankAccountsResponse, isLoading: isLoadingBanks } = useApiQuery(
    bankAccountsApi.getBankAccounts, 
    [{ page: 0, size: 500, sort: 'bankName,asc' }], 
    { skip: !isOpen }
  );
  
  const { data: accountsData, isLoading: isLoadingAccounts } = useApiQuery(
    chartOfAccountsApi.getList, 
    [{}, { page: 0, size: 1000, sort: 'accountName,asc' }], 
    { skip: !isOpen }
  );

  const allAccountsRaw = accountsData?.data?.data || accountsData?.data?.content || accountsData?.data || accountsData?.content || accountsData || [];
  const allAccounts = Array.isArray(allAccountsRaw) ? allAccountsRaw : [];
  const liabilityAccounts = allAccounts.filter(a => a.accountType === 'CREDIT' && a.postingAllowed !== false);

  const bankAccountsRaw = bankAccountsResponse?.data?.bankAccounts || bankAccountsResponse?.bankAccounts || bankAccountsResponse?.data?.data?.content || bankAccountsResponse?.data?.content || bankAccountsResponse?.data || [];
  const bankAccounts = Array.isArray(bankAccountsRaw) ? bankAccountsRaw : [];

  useEffect(() => {
    if (isOpen && purchaseOrder) {
      setFormData({
        amount: '',
        bankAccountId: '',
        payableAccountId: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMode: '',
        reference: '',
        remarks: ''
      });
    }
  }, [isOpen, purchaseOrder]);

  if (!isOpen || !purchaseOrder) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    const amount = Number(formData.amount);
    if (!amount || amount <= 0) {
      dispatch(addAlert({ type: 'error', message: 'Amount must be greater than 0' }));
      return;
    }
    if (!formData.bankAccountId) {
      dispatch(addAlert({ type: 'error', message: 'Please select a bank account' }));
      return;
    }
    if (!formData.payableAccountId) {
      dispatch(addAlert({ type: 'error', message: 'Please select a payable account' }));
      return;
    }
    if (!formData.paymentDate) {
      dispatch(addAlert({ type: 'error', message: 'Payment date is required' }));
      return;
    }
    if (!formData.paymentMode) {
      dispatch(addAlert({ type: 'error', message: 'Please select a payment mode' }));
      return;
    }

    try {
      await createAdvancePayment({
        id: purchaseOrder.id,
        companyId,
        amount,
        bankAccountId: formData.bankAccountId,
        payableAccountId: formData.payableAccountId,
        paymentDate: formData.paymentDate,
        paymentMode: formData.paymentMode,
        reference: formData.reference,
        remarks: formData.remarks
      }).unwrap();
      
      dispatch(addAlert({ type: 'success', message: 'Advance payment created successfully' }));
      onClose();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.data?.message || err?.message || 'Failed to create advance payment' }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CreditCard className="text-emerald-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 leading-tight">Create Advance Payment</h2>
              <p className="text-xs text-zinc-500 font-medium">Create a supplier advance payment against this PO</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* PO Context Info */}
          <div className="mb-6 bg-zinc-50 p-4 rounded-lg border border-zinc-200 grid grid-cols-3 gap-4">
            <div>
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Purchase Order</label>
              <div className="font-mono text-xs font-semibold text-zinc-900">{purchaseOrder.poNumber || '-'}</div>
            </div>
            <div>
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Supplier</label>
              <div className="text-xs font-semibold text-zinc-900">{purchaseOrder.vendorName || '-'}</div>
            </div>
            <div>
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Grand Total</label>
              <div className="text-xs font-bold text-primary">{purchaseOrder.currency || 'INR'} {(purchaseOrder.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          <form id="advance-payment-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10.4px] font-bold text-zinc-700 mb-1.5">Advance Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-medium">{purchaseOrder.currency || '₹'}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    disabled={isLoading}
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Enter advance amount"
                    className="w-full h-9 pl-11 pr-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] text-zinc-800 placeholder-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all disabled:opacity-60 disabled:bg-zinc-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10.4px] font-bold text-zinc-700 mb-1.5">Payment Date *</label>
                <input
                  type="date"
                  required
                  disabled={isLoading}
                  value={formData.paymentDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                  className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] font-medium text-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all disabled:opacity-60 disabled:bg-zinc-50"
                />
              </div>

              <div>
                <label className="block text-[10.4px] font-bold text-zinc-700 mb-1.5">Bank Account *</label>
                <CustomSelect
                  name="bankAccountId"
                  required
                  disabled={isLoading || isLoadingBanks}
                  value={formData.bankAccountId}
                  onChange={(e) => setFormData(prev => ({ ...prev, bankAccountId: e.target.value }))}
                  options={bankAccounts.map(acc => ({ value: acc.id, label: `${acc.bankName} - ${acc.accountNumber}` }))}
                  placeholder={isLoadingBanks ? 'Loading bank accounts...' : (bankAccounts.length === 0 ? 'No bank accounts found' : 'Select bank account')}
                  isLoading={isLoadingBanks}
                  buttonClassName="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] font-medium text-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all cursor-pointer disabled:opacity-60 disabled:bg-zinc-50"
                />
              </div>

              <div>
                <label className="block text-[10.4px] font-bold text-zinc-700 mb-1.5">Payable Account *</label>
                <CustomSelect
                  name="payableAccountId"
                  required
                  disabled={isLoading || isLoadingAccounts}
                  value={formData.payableAccountId}
                  onChange={(e) => setFormData(prev => ({ ...prev, payableAccountId: e.target.value }))}
                  options={liabilityAccounts.map(acc => ({ value: acc.id, label: `${acc.accountCode} - ${acc.accountName}` }))}
                  placeholder={isLoadingAccounts ? 'Loading payable accounts...' : (liabilityAccounts.length === 0 ? 'No payable accounts found' : 'Select payable account')}
                  isLoading={isLoadingAccounts}
                  buttonClassName="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] font-medium text-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all cursor-pointer disabled:opacity-60 disabled:bg-zinc-50"
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-[10.4px] font-bold text-zinc-700 mb-1.5">Payment Mode *</label>
                <CustomSelect
                  name="paymentMode"
                  required
                  disabled={isLoading}
                  value={formData.paymentMode}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMode: e.target.value }))}
                  options={PaymentMode.map(mode => ({ value: mode.value, label: mode.label }))}
                  placeholder="Select payment mode"
                  buttonClassName="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] font-medium text-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all cursor-pointer disabled:opacity-60 disabled:bg-zinc-50"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10.4px] font-bold text-zinc-700 mb-1.5">Reference</label>
                <input
                  type="text"
                  disabled={isLoading}
                  value={formData.reference}
                  onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                  placeholder="Enter payment reference (e.g. UTR number)"
                  className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] text-zinc-800 placeholder-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all disabled:opacity-60 disabled:bg-zinc-50"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10.4px] font-bold text-zinc-700 mb-1.5">Remarks</label>
                <textarea
                  disabled={isLoading}
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Enter remarks"
                  rows={3}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-[10.4px] text-zinc-800 placeholder-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-none disabled:opacity-60 disabled:bg-zinc-50"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-9 px-4 rounded-lg text-xs font-semibold text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 transition-colors disabled:opacity-60 disabled:hover:bg-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="advance-payment-form"
            disabled={isLoading}
            className="h-9 px-4 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm border border-emerald-700 transition-colors flex items-center justify-center min-w-[160px] disabled:opacity-60 disabled:hover:bg-emerald-600"
          >
            {isLoading ? (
              <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Creating...</span>
            ) : (
              'Create Advance Payment'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
