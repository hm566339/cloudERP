import React, { useState, useEffect, useMemo } from 'react';
import { useApiQuery } from '../../../hooks/useApi';
import { vendorsApi } from '../../../api/account/vendors';
import { bankAccountsApi } from '../../../api/account/bankAccounts';
import { chartOfAccountsApi } from '../../../api/account/chartOfAccounts';
import { apInvoicesApi } from '../../../api/account/apInvoices';
import CustomSelect from '../../../components/common/CustomSelect';
import { formatCurrency } from '../../../utils/formatters';
import { Plus, Trash2 } from 'lucide-react';

const PAYMENT_MODES = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK', label: 'Bank Transfer' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'UPI', label: 'UPI' },
  { value: 'NEFT', label: 'NEFT' },
  { value: 'RTGS', label: 'RTGS' },
  { value: 'IMPS', label: 'IMPS' }
];

export default function ApPaymentForm({ initialData, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    vendorId: '',
    paymentNo: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentAmount: 0,
    paymentMode: 'BANK',
    bankAccountId: '',
    referenceNo: '',
    chequeNumber: '',
    utrNumber: '',
    transactionId: '',
    chequeDate: '',
    remarks: '',
    tdsAmount: 0,
    tdsPayableAccountId: '',
    allocations: [],
    ...initialData
  });

  const [errors, setErrors] = useState({});

  // Fetches
  const { data: vendorsData } = useApiQuery(vendorsApi.getVendors, { size: 1000 });
  const { data: banksData } = useApiQuery(bankAccountsApi.getBankAccounts, { size: 1000 });
  const { data: coaData } = useApiQuery(chartOfAccountsApi.getList, { size: 1000 });
  
  const vendorOptions = useMemo(() => {
    const list = Array.isArray(vendorsData) ? vendorsData : vendorsData?.data?.content || vendorsData?.content || [];
    return list.map(v => ({ value: v.id, label: `${v.vendorCode} - ${v.vendorName}` }));
  }, [vendorsData]);

  const bankOptions = useMemo(() => {
    const list = Array.isArray(banksData) ? banksData : banksData?.data?.content || banksData?.content || [];
    return list.filter(b => b.isActive).map(b => ({ value: b.id, label: `${b.bankName} - ${b.accountNumber}` }));
  }, [banksData]);

  const glOptions = useMemo(() => {
    const list = Array.isArray(coaData) ? coaData : coaData?.data?.content || coaData?.content || [];
    return list.map(a => ({ value: a.id, label: `${a.accountCode} - ${a.accountName}` }));
  }, [coaData]);

  // Unpaid invoices for selected vendor
  const [invoicesToAllocate, setInvoicesToAllocate] = useState([]);
  
  useEffect(() => {
    if (formData.vendorId) {
      const fetchInvoices = async () => {
        try {
          const res = await apInvoicesApi.getList({ 
            vendorId: formData.vendorId, 
            status: 'APPROVED', 
            // Just bringing in approved invoices, maybe we should also filter paymentStatus
          }, { size: 1000 });
          const list = Array.isArray(res) ? res : res?.content || res?.data?.content || [];
          
          // Filter those with outstanding balance > 0
          const unpaidList = list.filter(inv => inv.outstandingAmount > 0);
          setInvoicesToAllocate(unpaidList);
        } catch (err) {
          console.error("Failed to fetch unpaid invoices", err);
        }
      };
      fetchInvoices();
    } else {
      setInvoicesToAllocate([]);
    }
  }, [formData.vendorId]);

  // Vendor Outstanding display
  const selectedVendor = useMemo(() => {
    const list = Array.isArray(vendorsData) ? vendorsData : vendorsData?.data?.content || vendorsData?.content || [];
    return list.find(v => v.id === formData.vendorId);
  }, [vendorsData, formData.vendorId]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let finalValue = value;
    if (type === 'number') {
      finalValue = value === '' ? '' : Number(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
    
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  // Allocation Handlers
  const addAllocation = () => {
    setFormData(prev => ({
      ...prev,
      allocations: [
        ...prev.allocations,
        { apInvoiceId: '', allocatedAmount: 0 }
      ]
    }));
  };

  const removeAllocation = (index) => {
    setFormData(prev => ({
      ...prev,
      allocations: prev.allocations.filter((_, i) => i !== index)
    }));
  };

  const updateAllocation = (index, field, value) => {
    setFormData(prev => {
      const newAlloc = [...prev.allocations];
      newAlloc[index] = { ...newAlloc[index], [field]: value };
      return { ...prev, allocations: newAlloc };
    });
  };

  const totalAllocatedAmount = formData.allocations.reduce((sum, alloc) => sum + (Number(alloc.allocatedAmount) || 0), 0);

  const validate = () => {
    const newErrors = {};
    if (!formData.vendorId) newErrors.vendorId = 'Vendor is required';
    if (!formData.paymentNo) newErrors.paymentNo = 'Payment Number is required';
    if (!formData.paymentDate) newErrors.paymentDate = 'Payment Date is required';
    if (!formData.paymentMode) newErrors.paymentMode = 'Payment Mode is required';
    if (formData.paymentAmount === '' || formData.paymentAmount <= 0) {
      newErrors.paymentAmount = 'Payment Amount must be greater than 0';
    }
    
    if (formData.paymentMode === 'CHEQUE') {
      if (!formData.chequeNumber) newErrors.chequeNumber = 'Cheque Number is required';
      if (!formData.chequeDate) newErrors.chequeDate = 'Cheque Date is required';
    }
    
    if (['BANK', 'UPI', 'NEFT', 'RTGS', 'IMPS'].includes(formData.paymentMode)) {
      if (!formData.bankAccountId) newErrors.bankAccountId = 'Bank Account is required';
    }

    if (formData.tdsAmount < 0) {
      newErrors.tdsAmount = 'TDS Amount cannot be negative';
    }

    if (totalAllocatedAmount > Number(formData.paymentAmount)) {
      newErrors.allocations = 'Total allocated amount cannot exceed payment amount';
    }

    // Validate allocations
    formData.allocations.forEach((alloc, idx) => {
      if (!alloc.apInvoiceId) {
        newErrors[`alloc_${idx}_apInvoiceId`] = 'Invoice is required';
      }
      if (alloc.allocatedAmount <= 0) {
        newErrors[`alloc_${idx}_allocatedAmount`] = 'Amount must be > 0';
      }
      
      const inv = invoicesToAllocate.find(i => i.id === alloc.apInvoiceId);
      if (inv && alloc.allocatedAmount > inv.outstandingAmount) {
         newErrors[`alloc_${idx}_allocatedAmount`] = 'Exceeds outstanding';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    // Clean up payload based on backend rules (remove backend generated fields if any)
    const payload = {
      vendorId: formData.vendorId,
      paymentNo: formData.paymentNo,
      paymentDate: formData.paymentDate,
      paymentAmount: formData.paymentAmount,
      paymentMode: formData.paymentMode,
      bankAccountId: formData.bankAccountId || null,
      referenceNo: formData.referenceNo,
      chequeNumber: formData.chequeNumber,
      utrNumber: formData.utrNumber,
      transactionId: formData.transactionId,
      chequeDate: formData.chequeDate || null,
      remarks: formData.remarks,
      tdsAmount: formData.tdsAmount || 0,
      tdsPayableAccountId: formData.tdsPayableAccountId || null,
      allocations: formData.allocations.map(a => ({
        apInvoiceId: a.apInvoiceId,
        allocatedAmount: a.allocatedAmount
      }))
    };
    
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-1 md:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Payment Information</h3>
        </div>

        <div>
          <CustomSelect
            label="Vendor *"
            value={formData.vendorId}
            options={vendorOptions}
            onChange={(e) => handleSelectChange('vendorId', e.target.value)}
            error={errors.vendorId}
          />
          {selectedVendor && (
            <p className="text-sm text-gray-500 mt-1">
              Outstanding Balance: <span className="font-medium text-gray-900">{formatCurrency(selectedVendor.outstandingBalance || 0)}</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Number *</label>
          <input
            type="text"
            name="paymentNo"
            value={formData.paymentNo}
            onChange={handleChange}
            className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 ${errors.paymentNo ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.paymentNo && <p className="text-red-500 text-xs mt-1">{errors.paymentNo}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
          <input
            type="date"
            name="paymentDate"
            value={formData.paymentDate}
            onChange={handleChange}
            className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 ${errors.paymentDate ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.paymentDate && <p className="text-red-500 text-xs mt-1">{errors.paymentDate}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            name="paymentAmount"
            value={formData.paymentAmount}
            onChange={handleChange}
            className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 ${errors.paymentAmount ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.paymentAmount && <p className="text-red-500 text-xs mt-1">{errors.paymentAmount}</p>}
        </div>

        <div>
          <CustomSelect
            label="Payment Mode *"
            value={formData.paymentMode}
            options={PAYMENT_MODES}
            onChange={(e) => handleSelectChange('paymentMode', e.target.value)}
            error={errors.paymentMode}
          />
        </div>

        {['BANK', 'UPI', 'NEFT', 'RTGS', 'IMPS'].includes(formData.paymentMode) && (
          <div>
            <CustomSelect
              label="Bank Account *"
              value={formData.bankAccountId || ''}
              options={bankOptions}
              onChange={(e) => handleSelectChange('bankAccountId', e.target.value)}
              error={errors.bankAccountId}
            />
          </div>
        )}

        {formData.paymentMode === 'CHEQUE' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cheque Number *</label>
              <input
                type="text"
                name="chequeNumber"
                value={formData.chequeNumber}
                onChange={handleChange}
                className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 ${errors.chequeNumber ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.chequeNumber && <p className="text-red-500 text-xs mt-1">{errors.chequeNumber}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cheque Date *</label>
              <input
                type="date"
                name="chequeDate"
                value={formData.chequeDate || ''}
                onChange={handleChange}
                className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 ${errors.chequeDate ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.chequeDate && <p className="text-red-500 text-xs mt-1">{errors.chequeDate}</p>}
            </div>
          </>
        )}

        {['BANK', 'UPI', 'NEFT', 'RTGS', 'IMPS'].includes(formData.paymentMode) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">UTR / Transaction ID</label>
            <input
              type="text"
              name="utrNumber"
              value={formData.utrNumber}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Enter UTR or TXN ID"
            />
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reference No</label>
          <input
            type="text"
            name="referenceNo"
            value={formData.referenceNo}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">TDS Amount</label>
          <input
            type="number"
            step="0.01"
            min="0"
            name="tdsAmount"
            value={formData.tdsAmount}
            onChange={handleChange}
            className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 ${errors.tdsAmount ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.tdsAmount && <p className="text-red-500 text-xs mt-1">{errors.tdsAmount}</p>}
        </div>

        {Number(formData.tdsAmount) > 0 && (
          <div>
            <CustomSelect
              label="TDS Payable Account"
              value={formData.tdsPayableAccountId || ''}
              options={glOptions}
              onChange={(e) => handleSelectChange('tdsPayableAccountId', e.target.value)}
              error={errors.tdsPayableAccountId}
            />
          </div>
        )}

        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            rows={2}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Invoice Allocation Section */}
      <div className="mt-8">
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h3 className="text-lg font-medium text-gray-900">Invoice Allocation</h3>
          <button
            type="button"
            onClick={addAllocation}
            className="px-3 py-1 bg-blue-50 text-blue-600 rounded border border-blue-200 hover:bg-blue-100 flex items-center text-sm font-medium"
          >
            <Plus size={16} className="mr-1" /> Add Allocation
          </button>
        </div>

        {errors.allocations && (
          <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm border border-red-200">
            {errors.allocations}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700">Invoice</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-right">Invoice Total</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-right">Outstanding</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Allocated Amount</th>
                <th className="px-4 py-3 font-semibold text-center text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {formData.allocations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No invoices allocated. Click 'Add Allocation' to allocate payment to an invoice.
                  </td>
                </tr>
              ) : (
                formData.allocations.map((alloc, idx) => {
                  const inv = invoicesToAllocate.find(i => i.id === alloc.apInvoiceId);
                  // Include already mapped invoices if editing
                  const displayInvOptions = [
                    ...invoicesToAllocate.map(i => ({ value: i.id, label: i.invoiceNo })),
                    ...(initialData && alloc.apInvoiceId && !invoicesToAllocate.some(i => i.id === alloc.apInvoiceId) 
                      ? [{ value: alloc.apInvoiceId, label: alloc.invoiceNo || 'Unknown Invoice' }] 
                      : [])
                  ];

                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <CustomSelect
                          value={alloc.apInvoiceId}
                          onChange={(e) => updateAllocation(idx, 'apInvoiceId', e.target.value)}
                          className={`w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 bg-white ${
                            errors[`alloc_${idx}_apInvoiceId`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select Invoice</option>
                          {displayInvOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </CustomSelect>
                        {errors[`alloc_${idx}_apInvoiceId`] && <p className="text-red-500 text-xs mt-1">{errors[`alloc_${idx}_apInvoiceId`]}</p>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {inv ? formatCurrency(inv.totalAmount) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {inv ? formatCurrency(inv.outstandingAmount) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.01"
                          value={alloc.allocatedAmount}
                          onChange={(e) => updateAllocation(idx, 'allocatedAmount', e.target.value === '' ? '' : Number(e.target.value))}
                          className={`w-full p-2 border rounded text-right focus:ring-blue-500 focus:border-blue-500 ${
                            errors[`alloc_${idx}_allocatedAmount`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors[`alloc_${idx}_allocatedAmount`] && <p className="text-red-500 text-xs mt-1">{errors[`alloc_${idx}_allocatedAmount`]}</p>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeAllocation(idx)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                          title="Remove Allocation"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td colSpan={3} className="px-4 py-3 font-semibold text-right text-gray-700">Total Allocated:</td>
                <td className="px-4 py-3 text-right font-bold text-gray-900">
                  {formatCurrency(totalAllocatedAmount)}
                </td>
                <td></td>
              </tr>
              <tr>
                <td colSpan={3} className="px-4 py-2 font-medium text-right text-gray-500">Unallocated Amount:</td>
                <td className={`px-4 py-2 text-right font-medium ${Number(formData.paymentAmount) - totalAllocatedAmount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(Number(formData.paymentAmount) - totalAllocatedAmount)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t mt-8">
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
          {initialData?.id ? 'Update Payment' : 'Create Payment'}
        </button>
      </div>
    </form>
  );
}
