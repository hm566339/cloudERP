import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Layers } from 'lucide-react';
import { useApiMutation, useApiQuery } from '../../../hooks/useApi';
import { receiptVouchersApi, customersApi, salesInvoicesApi, chartOfAccountsApi } from '../../../api/account';
import { bankAccountsApi } from '../../../api/account/bankAccounts';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import CustomSelect from '../../../components/common/CustomSelect';
import { useRoutePath } from "../../../hooks/useRoutePath";

export default function CreateReceipt() {
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState({
    customerId: '',
    bankAccountId: '',
    receiptDate: new Date().toISOString().split('T')[0],
    receiptAmount: '',
    paymentMode: 'CASH',
    receiptNo: '',
    referenceNo: '',
    remarks: '',
    receivableAccountId: '',
    receiptAccountId: '',
    allocations: []
  });

  const { data: customersData } = useApiQuery(
    customersApi.getCustomers,
    [{ isActive: true }],
    { page: 0, size: 500, sort: 'customerName,asc' }
  );

  const { data: accountsData } = useApiQuery(
    chartOfAccountsApi.getChartOfAccounts,
    [{}],
    { page: 0, size: 1000, sort: 'accountName,asc' }
  );

  const { data: bankAccountsResponse } = useApiQuery(
    bankAccountsApi.getBankAccounts,
    [{ page: 0, size: 500, sort: 'bankName,asc' }]
  );

  const { data: salesInvoicesData } = useApiQuery(
    salesInvoicesApi.getList,
    { customerId: formData.customerId, size: 500, sort: 'invoiceDate,asc' },
    { enabled: !!formData.customerId }
  );

  const customers = customersData?.content || [];
  const allAccounts = Array.isArray(accountsData?.content) ? accountsData.content : (Array.isArray(accountsData) ? accountsData : []);
  const liabilityAccounts = allAccounts.filter(a => a.accountType === 'CREDIT' && a.postingAllowed !== false);
  const assetAccounts = allAccounts.filter(a => a.accountType === 'DEBIT' && a.postingAllowed !== false);

  const rawBankAccounts = bankAccountsResponse?.content || bankAccountsResponse?.data?.content || bankAccountsResponse?.data?.data?.content || bankAccountsResponse?.data || bankAccountsResponse || [];
  const bankAccounts = Array.isArray(rawBankAccounts) ? rawBankAccounts : (rawBankAccounts?.content ? rawBankAccounts.content : []);
  const safeBankAccounts = Array.isArray(bankAccounts) ? bankAccounts : [];

  const rawSalesInvoices = salesInvoicesData?.data?.content || salesInvoicesData?.content || salesInvoicesData?.data || (Array.isArray(salesInvoicesData) ? salesInvoicesData : []);
  const salesInvoices = Array.isArray(rawSalesInvoices) ? rawSalesInvoices : [];

  const createMutation = useApiMutation(receiptVouchersApi.createReceipt);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddAllocation = () => {
    setFormData(prev => ({
      ...prev,
      allocations: [...prev.allocations, { salesInvoiceId: '', allocatedAmount: '' }]
    }));
  };

  const handleRemoveAllocation = (index) => {
    setFormData(prev => ({
      ...prev,
      allocations: prev.allocations.filter((_, i) => i !== index)
    }));
  };

  const handleAllocationChange = (index, field, value) => {
    setFormData(prev => {
      const newAllocations = [...prev.allocations];
      newAllocations[index][field] = value;
      return { ...prev, allocations: newAllocations };
    });
  };

  const calculateRemainingBalance = () => {
    const totalReceipt = parseFloat(formData.receiptAmount) || 0;
    const totalAllocated = formData.allocations.reduce((sum, a) => sum + (parseFloat(a.allocatedAmount) || 0), 0);
    return totalReceipt - totalAllocated;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const receiptAmt = parseFloat(formData.receiptAmount) || 0;
    if (receiptAmt <= 0) {
      dispatch(addAlert({ type: 'error', message: 'Receipt amount must be greater than zero' }));
      return;
    }

    const remaining = calculateRemainingBalance();
    if (remaining < 0) {
      dispatch(addAlert({ type: 'error', message: 'Total allocated amount cannot exceed receipt amount' }));
      return;
    }

    for (const alloc of formData.allocations) {
      const allocAmt = parseFloat(alloc.allocatedAmount) || 0;
      if (allocAmt <= 0) {
        dispatch(addAlert({ type: 'error', message: 'Allocated amounts must be greater than zero' }));
        return;
      }
      const invoiceKey = alloc.salesInvoiceId || alloc.arInvoiceId;
      if (!invoiceKey) {
        dispatch(addAlert({ type: 'error', message: 'Please select an invoice for all allocations' }));
        return;
      }

      const inv = salesInvoices.find(i => i.id === invoiceKey);
      if (inv) {
        const remainingInvBalance = inv.outstandingAmount ?? inv.remainingBalance ?? 0;
        if (allocAmt > remainingInvBalance) {
          dispatch(addAlert({ type: 'error', message: `Allocation for invoice ${inv.invoiceNumber || inv.invoiceNo} exceeds its remaining balance of ${remainingInvBalance}` }));
          return;
        }
      }
    }

    const payload = {
      data: {
        customerId: formData.customerId || null,
        bankAccountId: formData.bankAccountId || null,
        receiptDate: formData.receiptDate,
        receiptAmount: receiptAmt,
        paymentMode: formData.paymentMode,
        receiptNo: formData.receiptNo,
        referenceNo: formData.referenceNo || null,
        remarks: formData.remarks || null,
        receivableAccountId: formData.receivableAccountId || null,
        receiptAccountId: formData.receiptAccountId || null,
        allocations: formData.allocations.map(a => ({
          salesInvoiceId: a.salesInvoiceId || a.arInvoiceId,
          allocatedAmount: parseFloat(a.allocatedAmount) || 0
        }))
      }
    };

    try {
      await createMutation.mutateAsync([payload]);
      dispatch(addAlert({ type: 'success', message: 'Receipt created successfully.' }));
      navigate(buildPath('/accounts/transactions/receipts'));
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to save receipt voucher' }));
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-30 shadow-sm">
        <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(buildPath('/accounts/transactions/receipts'))}
              className="p-2 text-zinc-400 hover:text-zinc-800 rounded-full hover:bg-zinc-100 transition-colors -ml-2"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Create Receipt Voucher</h1>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => navigate(buildPath('/accounts/transactions/receipts'))} className="btn-secondary py-2 px-4">
              Cancel
            </button>
            <button type="submit" form="receipt-form" className="btn-primary py-2 px-4" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Save Receipt'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          <form id="receipt-form" onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 pb-2 border-b border-zinc-100">Receipt Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Receipt Number</label>
                  <input type="text" name="receiptNo" value={formData.receiptNo} onChange={handleInputChange} className="input-field w-full" placeholder="Auto Generated" />
                </div>
                <div>
                  <label className="block text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Receipt Date *</label>
                  <input type="date" name="receiptDate" value={formData.receiptDate} onChange={handleInputChange} className="input-field w-full" required />
                </div>
                <div>
                  <label className="block text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Receipt Amount *</label>
                  <input type="number" step="0.01" name="receiptAmount" value={formData.receiptAmount} onChange={handleInputChange} className="input-field w-full" required />
                </div>
                <div>
                  <label className="block text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Payment Mode *</label>
                  <CustomSelect name="paymentMode" value={formData.paymentMode} onChange={handleInputChange} required>
                    <option value="CASH">CASH</option>
                    <option value="BANK_TRANSFER">BANK TRANSFER</option>
                    <option value="CHEQUE">CHEQUE</option>
                    <option value="CREDIT_CARD">CREDIT CARD</option>
                    <option value="UPI">UPI</option>
                  </CustomSelect>
                </div>
                <div>
                  <label className="block text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Reference Number</label>
                  <input type="text" name="referenceNo" value={formData.referenceNo} onChange={handleInputChange} className="input-field w-full" />
                </div>
                <div className="lg:col-span-3">
                  <label className="block text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Remarks</label>
                  <input type="text" name="remarks" value={formData.remarks} onChange={handleInputChange} className="input-field w-full" />
                </div>
              </div>
            </div>

            {/* Entities & Accounts */}
            <div>
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 pb-2 border-b border-zinc-100">Entities & GL Accounts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Customer *</label>
                  <CustomSelect
                    name="customerId"
                    value={formData.customerId}
                    onChange={(e) => handleInputChange({ target: { name: 'customerId', value: e.target.value } })}
                    options={customers.map(c => ({ value: c.id, label: `[${c.customerCode}] ${c.customerName}` }))}
                    placeholder="Select Customer..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Bank Account</label>
                  <CustomSelect
                    name="bankAccountId"
                    value={formData.bankAccountId}
                    onChange={(e) => handleInputChange({ target: { name: 'bankAccountId', value: e.target.value } })}
                    options={safeBankAccounts.map(b => ({ value: b.id, label: `${b.bankName} - ${b.accountNumber}` }))}
                    placeholder="Select Bank Account..."
                  />
                </div>
                <div>
                  <label className="block text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Receivable Account *</label>
                  <CustomSelect
                    name="receivableAccountId"
                    value={formData.receivableAccountId}
                    onChange={(e) => handleInputChange({ target: { name: 'receivableAccountId', value: e.target.value } })}
                    options={assetAccounts.map(a => ({ value: a.id, label: `[${a.accountCode}] ${a.accountName}` }))}
                    placeholder="Select Receivable Account..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Receipt Account *</label>
                  <CustomSelect
                    name="receiptAccountId"
                    value={formData.receiptAccountId}
                    onChange={(e) => handleInputChange({ target: { name: 'receiptAccountId', value: e.target.value } })}
                    options={assetAccounts.map(a => ({ value: a.id, label: `[${a.accountCode}] ${a.accountName}` }))}
                    placeholder="Select Receipt Account..."
                    required
                  />
                </div>
              </div>
            </div>

            {/* Allocations */}
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-100">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Invoice Allocations</h3>
                <button type="button" onClick={handleAddAllocation} className="text-primary hover:text-primary-dark font-medium text-sm flex items-center gap-1 bg-primary/5 px-3 py-1.5 rounded-lg transition-colors">
                  <Plus size={14} /> Add Allocation
                </button>
              </div>

              {formData.allocations.length > 0 ? (
                <div className="border border-zinc-200 rounded-lg overflow-hidden mb-6">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
                      <tr>
                        <th className="p-4">Invoice</th>
                        <th className="p-4 text-right">Invoice Balance</th>
                        <th className="p-4 text-right">Allocated Amount</th>
                        <th className="p-4 text-center w-16">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {formData.allocations.map((alloc, index) => {
                        const invId = alloc.salesInvoiceId || alloc.arInvoiceId;
                        const inv = salesInvoices.find(i => i.id === invId);
                        const displayBalance = inv ? (inv.outstandingAmount ?? inv.remainingBalance ?? 0) : '-';
                        return (
                          <tr key={index} className="hover:bg-zinc-50/50">
                            <td className="p-3">
                              <CustomSelect
                                name={`alloc-invoice-${index}`}
                                value={invId}
                                onChange={(e) => handleAllocationChange(index, 'salesInvoiceId', e.target.value)}
                                options={salesInvoices.map(i => ({ value: i.id, label: `${i.invoiceNumber || i.invoiceNo} (${i.invoiceDate || ''})` }))}
                                placeholder="Select Invoice..."
                              />
                            </td>
                            <td className="p-4 text-right font-medium text-zinc-700">
                              {displayBalance}
                            </td>
                            <td className="p-3 text-right">
                              <input
                                type="number"
                                step="0.01"
                                className="input-field w-32 text-right"
                                value={alloc.allocatedAmount}
                                onChange={(e) => handleAllocationChange(index, 'allocatedAmount', e.target.value)}
                                placeholder="0.00"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <button type="button" onClick={() => handleRemoveAllocation(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-zinc-300 rounded-lg bg-zinc-50 mb-6 text-zinc-500">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <Layers size={24} className="text-zinc-400" />
                  </div>
                  No allocations added. Click "Add Allocation" to allocate receipt amount to invoices.
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-6 sm:gap-12 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                <div className="text-right">
                  <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Receipt</p>
                  <p className="text-xl font-bold text-zinc-900">{parseFloat(formData.receiptAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Allocated</p>
                  <p className="text-xl font-bold text-zinc-900">{formData.allocations.reduce((sum, a) => sum + (parseFloat(a.allocatedAmount) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Remaining Balance</p>
                  <p className={`text-xl font-bold ${calculateRemainingBalance() < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {calculateRemainingBalance().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
