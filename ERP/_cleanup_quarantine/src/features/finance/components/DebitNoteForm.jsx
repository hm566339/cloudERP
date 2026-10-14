import React, { useState, useEffect } from 'react';
import CustomSelect from '../../../components/common/CustomSelect';
import { apInvoicesApi } from '../../../api/account/apInvoices';
import { chartOfAccountsApi } from '../../../api/account/chartOfAccounts';
import { formatCurrency } from '../../../utils/formatters';

export default function DebitNoteForm({ onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    apInvoiceId: '',
    debitNoteNo: '',
    noteDate: '',
    amount: '',
    gstAmount: '',
    referenceNo: '',
    reason: '',
    payableAccountId: '',
    purchaseReturnAccountId: ''
  });

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.apInvoiceId) newErrors.apInvoiceId = 'AP Invoice is required';
    if (!formData.debitNoteNo?.trim()) newErrors.debitNoteNo = 'Debit Note Number is required';
    if (!formData.noteDate) newErrors.noteDate = 'Note Date is required';
    if (!formData.amount || Number(formData.amount) <= 0) newErrors.amount = 'Amount must be greater than 0';
    if (formData.gstAmount && Number(formData.gstAmount) < 0) newErrors.gstAmount = 'GST Amount cannot be negative';
    if (!formData.payableAccountId) newErrors.payableAccountId = 'Payable Account is required';
    if (!formData.purchaseReturnAccountId) newErrors.purchaseReturnAccountId = 'Purchase Return Account is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    const payload = {
      apInvoiceId: formData.apInvoiceId,
      debitNoteNo: formData.debitNoteNo.trim(),
      noteDate: formData.noteDate,
      amount: Number(formData.amount),
      gstAmount: formData.gstAmount ? Number(formData.gstAmount) : 0,
      referenceNo: formData.referenceNo?.trim() || '',
      reason: formData.reason?.trim() || '',
      payableAccountId: formData.payableAccountId,
      purchaseReturnAccountId: formData.purchaseReturnAccountId
    };
    
    onSubmit({ data: payload });
  };

  // Helper for AP Invoices
  const fetchInvoices = async (search) => {
    try {
      const res = await apInvoicesApi.getList({ keyword: search });
      const items = res.data?.data || res.data?.content || res.data?.invoices || res.data || [];
      return items.map(inv => ({
        value: inv.id,
        label: `${inv.invoiceNo} - ${inv.vendorName || ''}`,
        original: inv
      }));
    } catch (err) {
      return [];
    }
  };

  // Helper for GL Accounts
  const fetchAccounts = async (search) => {
    try {
      const res = await chartOfAccountsApi.getList({ searchKey: search });
      const items = res.data?.accountCharts || res.data?.content || res.data?.data || res.data || [];
      return items.map(acc => ({
        value: acc.id,
        label: `${acc.code} - ${acc.name}`
      }));
    } catch (err) {
      return [];
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Invoice Section */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Invoice Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">AP Invoice *</label>
            <CustomSelect
              loadOptions={fetchInvoices}
              value={formData.apInvoiceId ? { value: formData.apInvoiceId, label: selectedInvoice ? `${selectedInvoice.invoiceNo} - ${selectedInvoice.vendorName}` : 'Selected Invoice' } : null}
              onChange={(option) => {
                setFormData(prev => ({ ...prev, apInvoiceId: option?.value || '' }));
                setSelectedInvoice(option?.original || null);
                if (errors.apInvoiceId) setErrors(prev => ({ ...prev, apInvoiceId: null }));
              }}
              placeholder="Search AP Invoices..."
            />
            {errors.apInvoiceId && <p className="text-red-500 text-xs mt-1">{errors.apInvoiceId}</p>}
          </div>

          {selectedInvoice && (
            <>
              <div>
                <label className="block text-xs text-gray-500">Invoice Number</label>
                <div className="mt-1 text-sm font-medium">{selectedInvoice.invoiceNo || '-'}</div>
              </div>
              <div>
                <label className="block text-xs text-gray-500">Vendor</label>
                <div className="mt-1 text-sm font-medium">{selectedInvoice.vendorName || '-'} {selectedInvoice.vendorCode ? `(${selectedInvoice.vendorCode})` : ''}</div>
              </div>
              <div>
                <label className="block text-xs text-gray-500">Invoice Amount</label>
                <div className="mt-1 text-sm font-medium">{selectedInvoice.invoiceAmount !== undefined ? formatCurrency(selectedInvoice.invoiceAmount) : '-'}</div>
              </div>
              <div>
                <label className="block text-xs text-gray-500">Outstanding Amount</label>
                <div className="mt-1 text-sm font-medium">{selectedInvoice.outstandingAmount !== undefined ? formatCurrency(selectedInvoice.outstandingAmount) : '-'}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Debit Note Details */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-4 border-b pb-2">Debit Note Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Debit Note Number *</label>
            <input
              type="text"
              name="debitNoteNo"
              value={formData.debitNoteNo}
              onChange={handleChange}
              className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 ${errors.debitNoteNo ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="e.g. DN-2026-001"
            />
            {errors.debitNoteNo && <p className="text-red-500 text-xs mt-1">{errors.debitNoteNo}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note Date *</label>
            <input
              type="date"
              name="noteDate"
              value={formData.noteDate}
              onChange={handleChange}
              className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 ${errors.noteDate ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.noteDate && <p className="text-red-500 text-xs mt-1">{errors.noteDate}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
            <input
              type="number"
              step="0.01"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 ${errors.amount ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="0.00"
            />
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GST Amount</label>
            <input
              type="number"
              step="0.01"
              name="gstAmount"
              value={formData.gstAmount}
              onChange={handleChange}
              className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 ${errors.gstAmount ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="0.00"
            />
            {errors.gstAmount && <p className="text-red-500 text-xs mt-1">{errors.gstAmount}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
            <input
              type="text"
              name="referenceNo"
              value={formData.referenceNo}
              onChange={handleChange}
              className="w-full p-2 border rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
              placeholder="Optional reference"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              rows={2}
              className="w-full p-2 border rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
              placeholder="Reason for debit note..."
            />
          </div>
        </div>
      </div>

      {/* GL Accounts Section */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-4 border-b pb-2">GL Accounts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payable Account *</label>
            <CustomSelect
              loadOptions={fetchAccounts}
              value={formData.payableAccountId ? { value: formData.payableAccountId, label: 'Selected Account' } : null}
              onChange={(option) => {
                setFormData(prev => ({ ...prev, payableAccountId: option?.value || '' }));
                if (errors.payableAccountId) setErrors(prev => ({ ...prev, payableAccountId: null }));
              }}
              placeholder="Search GL Account..."
            />
            {errors.payableAccountId && <p className="text-red-500 text-xs mt-1">{errors.payableAccountId}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Return Account *</label>
            <CustomSelect
              loadOptions={fetchAccounts}
              value={formData.purchaseReturnAccountId ? { value: formData.purchaseReturnAccountId, label: 'Selected Account' } : null}
              onChange={(option) => {
                setFormData(prev => ({ ...prev, purchaseReturnAccountId: option?.value || '' }));
                if (errors.purchaseReturnAccountId) setErrors(prev => ({ ...prev, purchaseReturnAccountId: null }));
              }}
              placeholder="Search GL Account..."
            />
            {errors.purchaseReturnAccountId && <p className="text-red-500 text-xs mt-1">{errors.purchaseReturnAccountId}</p>}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          {isLoading ? (
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
          ) : null}
          Create Debit Note
        </button>
      </div>
    </form>
  );
}
