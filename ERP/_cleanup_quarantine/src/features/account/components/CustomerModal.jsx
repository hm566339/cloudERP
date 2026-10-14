import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import { customerApiSlice } from '../../../api/sales-crm';
import { useAppDispatch } from '../../../app/hooks';

export default function CustomerModal({
  isOpen,
  onClose,
  mode, // 'create', 'edit', 'view'
  customer, // null or customer object
  companyId,
  createCustomer,
  updateCustomer,
  isCreating,
  isUpdating,
  canEdit,
  onSwitchToEdit
}) {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState('details'); // details, transactions, ledger

  const [formData, setFormData] = useState({
    customerCode: '',
    customerName: '',
    email: '',
    phone: '',
    gstin: '',
    panNo: '',
    addressLine1: '',
    city: '',
    state: '',
    country: '',
    creditLimit: '',
    isActive: true,
  });

  // Transactions / Ledger State
  const [dateRange, setDateRange] = useState({
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });
  const [financialData, setFinancialData] = useState(null);
  const [isFinancialLoading, setIsFinancialLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('details');
      if (customer && (mode === 'edit' || mode === 'view')) {
        setFormData({
          customerCode: customer.customerCode || '',
          customerName: customer.customerName || '',
          email: customer.email || '',
          phone: customer.phone || '',
          gstin: customer.gstin || '',
          panNo: customer.panNo || '',
          addressLine1: customer.addressLine1 || '',
          city: customer.city || '',
          state: customer.state || '',
          country: customer.country || '',
          creditLimit: customer.creditLimit !== null ? customer.creditLimit : '',
          isActive: customer.isActive ?? true,
        });
      } else {
        setFormData({
          customerCode: '',
          customerName: '',
          email: '',
          phone: '',
          gstin: '',
          panNo: '',
          addressLine1: '',
          city: '',
          state: '',
          country: '',
          creditLimit: '',
          isActive: true,
        });
      }
    }
  }, [isOpen, customer, mode]);

  const loadFinancials = async (type) => {
    if (!customer?.id || !companyId) return;
    setIsFinancialLoading(true);
    try {
      const endpoint = type === 'transactions' ? customerApiSlice.endpoints.getCustomerTransactions : customerApiSlice.endpoints.getCustomerLedger;
      const res = await dispatch(endpoint.initiate({ 
        id: customer.id, 
        companyId, 
        fromDate: dateRange.fromDate, 
        toDate: dateRange.toDate 
      }));
      setFinancialData(res?.data || res);
    } catch (err) {
      console.error(`Error loading ${type}`, err);
      setFinancialData(null);
    } finally {
      setIsFinancialLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && mode === 'view' && customer?.id && (activeTab === 'transactions' || activeTab === 'ledger')) {
      loadFinancials(activeTab);
    }
  }, [activeTab, dateRange, isOpen, mode, customer?.id]);

  const handleInputChange = (e) => {
    if (mode === 'view') return;
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'view') {
      onClose();
      return;
    }
    
    try {
      const payload = {
        ...(mode === 'edit' && customer ? customer : {}),
        ...formData,
        creditLimit: formData.creditLimit === '' ? 0 : parseFloat(formData.creditLimit)
      };
      
      if (mode === 'edit' && customer) {
        await updateCustomer({ id: customer.id, companyId, ...payload });
      } else {
        await createCustomer({ companyId, ...payload });
      }
      onClose();
    } catch (err) {
      alert(`Error saving customer: ${err?.data?.message || err?.message || 'Unknown error'}`);
    }
  };

  const title = mode === 'create' ? 'Create Customer' : mode === 'edit' ? 'Edit Customer' : 'View Customer';
  const isReadOnly = mode === 'view';

  const renderDetails = () => (
    <div className="space-y-6">
      {isReadOnly && customer && (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
           <div className="text-sm">
              <span className="text-slate-500 font-medium block">Outstanding Balance</span>
              <span className="text-red-600 font-semibold text-lg">₹{(customer.outstandingBalance || 0).toFixed(2)}</span>
           </div>
           <div className="text-sm">
              <span className="text-slate-500 font-medium block">Available Credit</span>
              <span className="text-green-600 font-semibold text-lg">₹{(customer.availableCredit || 0).toFixed(2)}</span>
           </div>
           <div className="text-sm">
              <span className="text-slate-500 font-medium block">Total Invoices</span>
              <span className="text-slate-900 font-semibold text-lg">{customer.totalInvoices || 0}</span>
           </div>
           <div className="text-sm">
              <span className="text-slate-500 font-medium block">Total Receipts</span>
              <span className="text-slate-900 font-semibold text-lg">{customer.totalReceipts || 0}</span>
           </div>
        </div>
      )}

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-zinc-700">Customer Code *</label>
          <input type="text" name="customerCode" value={formData.customerCode} onChange={handleInputChange} className={`input-field w-full font-mono ${isReadOnly ? 'bg-zinc-50 opacity-80 cursor-not-allowed' : ''}`} required readOnly={isReadOnly} placeholder="e.g. CUST-001" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-zinc-700">Customer Name *</label>
          <input type="text" name="customerName" value={formData.customerName} onChange={handleInputChange} className={`input-field w-full ${isReadOnly ? 'bg-zinc-50 opacity-80 cursor-not-allowed' : ''}`} required readOnly={isReadOnly} placeholder="e.g. Acme Corp" />
        </div>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-zinc-700">Email Address</label>
          <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={`input-field w-full ${isReadOnly ? 'bg-zinc-50 opacity-80 cursor-not-allowed' : ''}`} readOnly={isReadOnly} placeholder="email@example.com" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-zinc-700">Phone Number</label>
          <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className={`input-field w-full font-mono ${isReadOnly ? 'bg-zinc-50 opacity-80 cursor-not-allowed' : ''}`} readOnly={isReadOnly} placeholder="+91 9876543210" />
        </div>
      </div>

      {/* Tax Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-zinc-700">GSTIN</label>
          <input type="text" name="gstin" value={formData.gstin} onChange={handleInputChange} className={`input-field w-full uppercase ${isReadOnly ? 'bg-zinc-50 opacity-80 cursor-not-allowed' : ''}`} readOnly={isReadOnly} placeholder="22AAAAA0000A1Z5" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-zinc-700">PAN Number</label>
          <input type="text" name="panNo" value={formData.panNo} onChange={handleInputChange} className={`input-field w-full uppercase ${isReadOnly ? 'bg-zinc-50 opacity-80 cursor-not-allowed' : ''}`} readOnly={isReadOnly} placeholder="ABCDE1234F" />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-zinc-700">Address Line 1</label>
        <input type="text" name="addressLine1" value={formData.addressLine1} onChange={handleInputChange} className={`input-field w-full ${isReadOnly ? 'bg-zinc-50 opacity-80 cursor-not-allowed' : ''}`} readOnly={isReadOnly} placeholder="123 Business Park" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-zinc-700">City</label>
          <input type="text" name="city" value={formData.city} onChange={handleInputChange} className={`input-field w-full ${isReadOnly ? 'bg-zinc-50 opacity-80 cursor-not-allowed' : ''}`} readOnly={isReadOnly} placeholder="Mumbai" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-zinc-700">State</label>
          <input type="text" name="state" value={formData.state} onChange={handleInputChange} className={`input-field w-full ${isReadOnly ? 'bg-zinc-50 opacity-80 cursor-not-allowed' : ''}`} readOnly={isReadOnly} placeholder="Maharashtra" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-zinc-700">Country</label>
          <input type="text" name="country" value={formData.country} onChange={handleInputChange} className={`input-field w-full ${isReadOnly ? 'bg-zinc-50 opacity-80 cursor-not-allowed' : ''}`} readOnly={isReadOnly} placeholder="India" />
        </div>
      </div>

      {/* Financial settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-zinc-700">Credit Limit (₹)</label>
          <input type="number" step="0.01" name="creditLimit" value={formData.creditLimit} onChange={handleInputChange} placeholder="e.g. 50000.00" readOnly={isReadOnly} className={`input-field w-full text-right font-mono ${isReadOnly ? 'bg-zinc-50 opacity-80 cursor-not-allowed' : ''}`} />
        </div>
      </div>

      {/* Status Toggle */}
      <div className="flex gap-8 pt-4 pb-2 border-t border-zinc-100">
        <label className={`flex items-center gap-2.5 group ${isReadOnly ? 'cursor-default opacity-80' : 'cursor-pointer'}`}>
          <div className="relative flex items-center justify-center">
            <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} disabled={isReadOnly} className="peer sr-only" />
            <div className="w-5 h-5 rounded-[4.8px] border-2 border-zinc-300 bg-white peer-checked:bg-primary peer-checked:border-primary transition-all"></div>
            <div className="absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <span className="text-sm font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">Active Customer</span>
        </label>
      </div>
      
      {isReadOnly && customer && (
        <div className="flex flex-wrap gap-4 justify-between items-center pt-4 border-t border-zinc-100 text-xs">
          <div><span className="text-zinc-500 font-medium">Created: </span><span className="text-zinc-900 font-semibold">{new Date(customer.createdAt).toLocaleString()}</span></div>
          <div><span className="text-zinc-500 font-medium">Updated: </span><span className="text-zinc-900 font-semibold">{new Date(customer.updatedAt).toLocaleString()}</span></div>
        </div>
      )}
    </div>
  );

  const renderFinancials = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-end gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
          <div className="space-y-1.5 flex-1">
            <label className="text-sm font-semibold text-zinc-700">From Date</label>
            <input type="date" name="fromDate" value={dateRange.fromDate} onChange={handleDateChange} className="input-field w-full text-sm" />
          </div>
          <div className="space-y-1.5 flex-1">
            <label className="text-sm font-semibold text-zinc-700">To Date</label>
            <input type="date" name="toDate" value={dateRange.toDate} onChange={handleDateChange} className="input-field w-full text-sm" />
          </div>
          <button type="button" onClick={() => loadFinancials(activeTab)} className="btn-primary h-10 px-6">
            Fetch {activeTab === 'transactions' ? 'Transactions' : 'Ledger'}
          </button>
        </div>

        {isFinancialLoading ? (
          <div className="py-12 flex justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : financialData ? (
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Metric</th>
                  <th className="px-6 py-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm">
                <tr className="hover:bg-zinc-50/50">
                  <td className="px-6 py-4 font-medium text-zinc-700">Opening Balance</td>
                  <td className="px-6 py-4 font-mono text-right font-semibold text-zinc-900">{(financialData.openingBalance || 0).toFixed(2)}</td>
                </tr>
                <tr className="hover:bg-zinc-50/50">
                  <td className="px-6 py-4 font-medium text-zinc-700">Invoice Amount</td>
                  <td className="px-6 py-4 font-mono text-right font-semibold text-red-600">+{(financialData.invoiceAmount || 0).toFixed(2)}</td>
                </tr>
                <tr className="hover:bg-zinc-50/50">
                  <td className="px-6 py-4 font-medium text-zinc-700">Receipt Amount</td>
                  <td className="px-6 py-4 font-mono text-right font-semibold text-green-600">-{(financialData.receiptAmount || 0).toFixed(2)}</td>
                </tr>
                <tr className="bg-zinc-50 font-bold border-t border-zinc-200">
                  <td className="px-6 py-4 text-zinc-900">Closing Balance</td>
                  <td className="px-6 py-4 font-mono text-right text-zinc-900">{(financialData.closingBalance || 0).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-zinc-500">
            No data found for the selected date range.
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-3xl">
      {mode === 'view' && (
        <div className="flex border-b border-zinc-200 mb-6">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'details' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'transactions' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'}`}
            onClick={() => setActiveTab('transactions')}
          >
            Transactions
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'ledger' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'}`}
            onClick={() => setActiveTab('ledger')}
          >
            Ledger
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="min-h-[320px]">
          {activeTab === 'details' && renderDetails()}
          {(activeTab === 'transactions' || activeTab === 'ledger') && renderFinancials()}
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
          {isReadOnly ? (
             <>
               {canEdit && activeTab === 'details' && (
                 <button type="button" onClick={onSwitchToEdit} className="btn-secondary">
                   Edit Customer
                 </button>
               )}
               <button type="button" onClick={onClose} className="btn-primary">
                  Close
               </button>
             </>
          ) : (
            <>
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? 'Saving...' : 'Save Customer'}
              </button>
            </>
          )}
        </div>
      </form>
    </Modal>
  );
}
