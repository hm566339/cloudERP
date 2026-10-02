import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Plus, Trash2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '../../../hooks/useApi';
import { receiptVouchersApi, customersApi, chartOfAccountsApi, salesInvoicesApi } from '../../../api/account';
import { bankAccountsApi } from '../../../api/account/bankAccounts';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import CustomSelect from '../../../components/common/CustomSelect';
import ComboBox from '../../../components/common/ComboBox';
import ChartOfAccountsModal from '../../finance/components/ChartOfAccountsModal';
import BankAccountForm from '../../finance/components/BankAccountForm';
import CustomerFormModal from '../../account/components/CustomerFormModal';
import InvoiceFormModal from '../../sales/components/InvoiceFormModal';
import { useGetAccountGroupsQuery } from '../../../api/account';
import { useRoutePath } from "../../../hooks/useRoutePath";
import ConfirmModal from '../../../components/common/ConfirmModal';
import DeliveryChallanFromSoModal from '../../sales/components/DeliveryChallanFromSoModal';

export default function ReceiptVoucherFormModal({ isOpen, onClose, initialData, onSuccess }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
  const isEditing = !!initialData?.id;
  const [customerSearchKey, setCustomerSearchKey] = useState('');
  const [accountSearchKey, setAccountSearchKey] = useState('');
  const [bankSearchKey, setBankSearchKey] = useState('');
  const [invoiceSearchKey, setInvoiceSearchKey] = useState('');
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');

  const [savedReceipt, setSavedReceipt] = useState(null);
  const [isDeliveryChallanConfirmOpen, setIsDeliveryChallanConfirmOpen] = useState(false);
  const [isDeliveryChallanFormOpen, setIsDeliveryChallanFormOpen] = useState(false);
  const [isConfirmProcessing, setIsConfirmProcessing] = useState(false);

  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [activeAccountTarget, setActiveAccountTarget] = useState(null);
  const [accountSearchTerm, setAccountSearchTerm] = useState('');
  const [isAddBankAccountOpen, setIsAddBankAccountOpen] = useState(false);
  const [bankSearchTerm, setBankSearchTerm] = useState('');

  const { data: groupsResponse } = useGetAccountGroupsQuery({ pageSize: 1000 }, { skip: !isOpen });
  const groups = groupsResponse?.data?.content || groupsResponse?.data || groupsResponse?.content || [];

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
    allocations: [{ salesInvoiceId: '', allocatedAmount: '' }]
  });

  const { data: customersData, isFetching: isFetchingCustomers } = useApiQuery(
    customersApi.getList,
    [{ isActive: true, searchKey: customerSearchKey || undefined }, { page: 0, size: 100 }],
    { skip: !isOpen }
  );

  const { data: accountsData, isFetching: isFetchingAccounts } = useApiQuery(
    chartOfAccountsApi.getList,
    [{ searchKey: accountSearchKey || undefined }, { page: 0, size: 1000, sort: 'accountName,asc' }],
    { skip: !isOpen }
  );

  const { data: bankAccountsResponse, isFetching: isFetchingBanks } = useApiQuery(
    bankAccountsApi.getBankAccounts,
    [{ searchKey: bankSearchKey || undefined, page: 0, size: 500, sort: 'bankName,asc' }],
    { skip: !isOpen }
  );

  const { data: salesInvoicesData, isFetching: isFetchingInvoices } = useApiQuery(
    salesInvoicesApi.getList,
    [{ customerId: formData.customerId || undefined, searchKey: invoiceSearchKey || undefined }, { page: 0, size: 500, sort: 'invoiceDate,asc' }],
    { skip: !isOpen }
  );

  const rawCustomers = customersData?.content || customersData?.data?.content || customersData?.data || customersData || [];
  const customers = Array.isArray(rawCustomers) ? rawCustomers : (rawCustomers?.content ? rawCustomers.content : []);
  const safeCustomers = Array.isArray(customers) ? customers : [];
  const rawAccounts = accountsData?.data?.data || accountsData?.data?.content || accountsData?.content || accountsData?.data || accountsData || [];
  const accountsContent = Array.isArray(rawAccounts) ? rawAccounts : (rawAccounts?.content ? rawAccounts.content : (rawAccounts?.data ? rawAccounts.data : []));
  const allAccounts = Array.isArray(accountsContent) ? accountsContent : [];

  const receivableAccounts = allAccounts.filter(a =>
    a.postingAllowed !== false &&
    (a.groupName === 'Accounts Receivable' || a.accountName?.toLowerCase().includes('receivable'))
  );

  const receiptAccounts = allAccounts.filter(a =>
    a.postingAllowed !== false &&
    (a.groupName === 'Cash & Cash Equivalent' || a.groupName === 'Bank Accounts' || a.accountName?.toLowerCase().includes('cash') || a.accountName?.toLowerCase().includes('bank'))
  );

  const rawBankAccounts = bankAccountsResponse?.data?.bankAccounts || bankAccountsResponse?.bankAccounts || bankAccountsResponse?.data?.content || bankAccountsResponse?.content || bankAccountsResponse?.data || bankAccountsResponse || [];
  const bankAccounts = Array.isArray(rawBankAccounts) ? rawBankAccounts : (rawBankAccounts?.content ? rawBankAccounts.content : (rawBankAccounts?.bankAccounts ? rawBankAccounts.bankAccounts : []));
  const safeBankAccounts = Array.isArray(bankAccounts) ? bankAccounts : [];

  const rawSalesInvoices = salesInvoicesData?.data?.data || salesInvoicesData?.data?.content || salesInvoicesData?.content || salesInvoicesData?.data || salesInvoicesData || [];
  const invoicesContent = Array.isArray(rawSalesInvoices) ? rawSalesInvoices : (rawSalesInvoices?.content ? rawSalesInvoices.content : (rawSalesInvoices?.data ? rawSalesInvoices.data : []));
  const salesInvoices = Array.isArray(invoicesContent) ? invoicesContent : [];

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          customerId: initialData.customerId || '',
          bankAccountId: initialData.bankAccountId || '',
          receiptDate: initialData.receiptDate || new Date().toISOString().split('T')[0],
          receiptAmount: initialData.receiptAmount || '',
          paymentMode: initialData.paymentMode || 'CASH',
          receiptNo: initialData.receiptNo || '',
          referenceNo: initialData.referenceNo || '',
          remarks: initialData.remarks || '',
          receivableAccountId: initialData.receivableAccountId || '',
          receiptAccountId: initialData.receiptAccountId || '',
          allocations: initialData.allocations?.map(a => ({
            salesInvoiceId: a.salesInvoiceId || a.arInvoiceId,
            allocatedAmount: a.allocatedAmount || 0,
            invoiceNo: a.invoiceNo || ''
          })) || []
        });
      } else {
        setFormData({
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
          allocations: [{ salesInvoiceId: '', allocatedAmount: '' }]
        });
      }
    }
  }, [isOpen, initialData]);

  const createMutation = useApiMutation(receiptVouchersApi.createReceipt);
  const updateMutation = useApiMutation(receiptVouchersApi.updateReceipt);
  const createInvoiceMutation = useApiMutation(salesInvoicesApi.create);

  const handleInvoiceSubmit = async (payload) => {
    try {
      const res = await createInvoiceMutation.mutateAsync([payload.data || payload]);
      dispatch(addAlert({ type: 'success', message: 'Invoice created successfully' }));
      setIsAddInvoiceOpen(false);
      const newInvoiceId = res?.data?.id || res?.id;
      if (newInvoiceId) {
        setFormData(prev => ({
          ...prev,
          allocations: [...prev.allocations, { salesInvoiceId: newInvoiceId, allocatedAmount: '' }]
        }));
      }
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to create invoice' }));
    }
  };

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
      const invId = alloc.salesInvoiceId || alloc.arInvoiceId;
      if (!invId) {
        dispatch(addAlert({ type: 'error', message: 'Please select an invoice for all allocations' }));
        return;
      }

      const inv = salesInvoices.find(i => i.id === invId);
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
      let savedResult;
      if (isEditing) {
        savedResult = await updateMutation.mutateAsync([initialData.id, payload]);
        dispatch(addAlert({ type: 'success', message: 'Receipt voucher updated successfully' }));
      } else {
        savedResult = await createMutation.mutateAsync([payload]);
        dispatch(addAlert({ type: 'success', message: 'Receipt voucher created successfully' }));
      }
      
      const savedReceiptData = savedResult?.data || savedResult;
      setSavedReceipt(savedReceiptData);
      setIsDeliveryChallanConfirmOpen(true);
      
      onSuccess?.(savedReceiptData);
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to save receipt voucher' }));
    }
  };

  const handleDeliveryChallanYes = async () => {
    if (isConfirmProcessing) return;
    setIsConfirmProcessing(true);

    try {
      const receiptVoucherId = savedReceipt?.id;
      if (!receiptVoucherId) {
        throw new Error('Receipt Voucher ID is missing');
      }

      // Step 1: Approve Receipt Voucher
      await receiptVouchersApi.approveReceipt(receiptVoucherId);
      
      // Step 2: Post Receipt Voucher
      await receiptVouchersApi.postReceipt(receiptVoucherId);

      // Step 3: Open existing Delivery Challan form
      setIsDeliveryChallanConfirmOpen(false);
      setIsDeliveryChallanFormOpen(true);
    } catch (error) {
      dispatch(addAlert({ 
        type: 'error', 
        message: error?.response?.data?.message || error?.message || 'Workflow failed' 
      }));
    } finally {
      setIsConfirmProcessing(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[960px] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-zinc-100 bg-zinc-50/50 flex-none rounded-t-xl">
          <h2 className="text-base font-bold text-zinc-800">
            {isEditing ? 'Edit Receipt Voucher' : 'Create Receipt Voucher'}
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <form id="receipt-form" onSubmit={handleSubmit} className="flex-1 flex flex-col text-xs min-h-0">

          {/* Header Controls */}
          <div className="p-6 flex-none bg-white border-b border-zinc-100 overflow-y-auto max-h-[50vh]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
              
              {/* SECTION: VOUCHER DETAILS */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider pb-2 border-b border-zinc-100">
                  Voucher Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9.6px] font-semibold text-zinc-700 block">Receipt Number</label>
                    <input type="text" name="receiptNo" value={formData.receiptNo || ''} placeholder="Auto Generated" disabled className="w-full h-9 px-3 bg-zinc-100 border border-zinc-200 rounded-md text-[10.4px] font-medium text-zinc-900 cursor-not-allowed opacity-60" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9.6px] font-semibold text-zinc-700 block">Receipt Date <span className="text-rose-500 ml-0.5">*</span></label>
                    <input type="date" name="receiptDate" value={formData.receiptDate} onChange={handleInputChange} className="w-full h-9 px-3 bg-zinc-50 border border-zinc-200 rounded-md text-[10.4px] font-medium text-zinc-900 focus:bg-white focus:border-zinc-900 outline-none transition-all" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9.6px] font-semibold text-zinc-700 block">Receipt Amount <span className="text-rose-500 ml-0.5">*</span></label>
                    <input type="number" step="0.01" name="receiptAmount" value={formData.receiptAmount} onChange={handleInputChange} className="w-full h-9 px-3 bg-zinc-50 border border-zinc-200 rounded-md text-[10.4px] font-medium text-zinc-900 focus:bg-white focus:border-zinc-900 outline-none transition-all" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9.6px] font-semibold text-zinc-700 block">Payment Mode <span className="text-rose-500 ml-0.5">*</span></label>
                    <CustomSelect name="paymentMode" value={formData.paymentMode} onChange={handleInputChange} buttonClassName="w-full h-9 px-3 bg-zinc-50 border border-zinc-200 rounded-md text-[10.4px] font-medium text-zinc-900 focus:bg-white focus:border-zinc-900 outline-none transition-all flex items-center justify-between" required>
                      <option value="CASH">CASH</option>
                      <option value="BANK_TRANSFER">BANK TRANSFER</option>
                      <option value="CHEQUE">CHEQUE</option>
                      <option value="UPI">UPI</option>
                      <option value="CARD">CARD</option>
                      <option value="OTHER">OTHER</option>
                    </CustomSelect>
                  </div>
                </div>
              </div>

              {/* SECTION: ACCOUNTING INFORMATION */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider pb-2 border-b border-zinc-100">
                  Accounting Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9.6px] font-semibold text-zinc-700 block">Customer <span className="text-rose-500 ml-0.5">*</span></label>
                    <ComboBox
                      name="customerId"
                      value={formData.customerId}
                      onChange={(val) => handleInputChange({ target: { name: 'customerId', value: val } })}
                      options={safeCustomers.map(c => ({ value: c.id, label: `${c.customerCode || ''} - ${c.customerName || ''}` }))}
                      placeholder="Search Customer..."
                      required
                      onCreateClick={(searchTerm) => {
                        setCustomerSearchTerm(searchTerm);
                        setIsAddCustomerOpen(true);
                      }}
                      createSubtext="Create New Customer"
                      inputClassName="w-full h-9 pl-8 pr-2 bg-zinc-50 border border-zinc-200 rounded-md text-[10.4px] font-medium text-zinc-900 focus:bg-white focus:border-zinc-900 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9.6px] font-semibold text-zinc-700 block">Bank Account</label>
                    <ComboBox
                      name="bankAccountId"
                      value={formData.bankAccountId}
                      onChange={(val) => handleInputChange({ target: { name: 'bankAccountId', value: val } })}
                      options={safeBankAccounts.map(b => ({ value: b.id, label: `${b.bankName || ''} - ${b.accountNumber || ''}` }))}
                      placeholder="Search Bank Account..."
                      onCreateClick={(searchTerm) => {
                        setBankSearchTerm(searchTerm);
                        setIsAddBankAccountOpen(true);
                      }}
                      createSubtext="Create New Bank Account"
                      inputClassName="w-full h-9 pl-8 pr-2 bg-zinc-50 border border-zinc-200 rounded-md text-[10.4px] font-medium text-zinc-900 focus:bg-white focus:border-zinc-900 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9.6px] font-semibold text-zinc-700 block">Receivable Account <span className="text-rose-500 ml-0.5">*</span></label>
                    <ComboBox
                      name="receivableAccountId"
                      value={formData.receivableAccountId}
                      onChange={(val) => handleInputChange({ target: { name: 'receivableAccountId', value: val } })}
                      options={receivableAccounts.map(a => ({ value: a.id, label: `[${a.accountCode || ''}] ${a.accountName || ''}` }))}
                      placeholder="Search Receivable Account..."
                      required
                      onCreateClick={(searchTerm) => {
                        setAccountSearchTerm(searchTerm);
                        setActiveAccountTarget('receivable');
                        setIsAddAccountOpen(true);
                      }}
                      createSubtext="Create New GL Account"
                      inputClassName="w-full h-9 pl-8 pr-2 bg-zinc-50 border border-zinc-200 rounded-md text-[10.4px] font-medium text-zinc-900 focus:bg-white focus:border-zinc-900 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9.6px] font-semibold text-zinc-700 block">Receipt Account <span className="text-rose-500 ml-0.5">*</span></label>
                    <ComboBox
                      name="receiptAccountId"
                      value={formData.receiptAccountId}
                      onChange={(val) => handleInputChange({ target: { name: 'receiptAccountId', value: val } })}
                      options={receiptAccounts.map(a => ({ value: a.id, label: `[${a.accountCode || ''}] ${a.accountName || ''}` }))}
                      placeholder="Search Receipt Account..."
                      required
                      onCreateClick={(searchTerm) => {
                        setAccountSearchTerm(searchTerm);
                        setActiveAccountTarget('receipt');
                        setIsAddAccountOpen(true);
                      }}
                      createSubtext="Create New GL Account"
                      inputClassName="w-full h-9 pl-8 pr-2 bg-zinc-50 border border-zinc-200 rounded-md text-[10.4px] font-medium text-zinc-900 focus:bg-white focus:border-zinc-900 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: ADDITIONAL DETAILS */}
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider pb-2 border-b border-zinc-100">
                  Additional Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9.6px] font-semibold text-zinc-700 block">Remarks</label>
                    <textarea name="remarks" value={formData.remarks} onChange={handleInputChange} rows={2} className="w-full py-2 px-3 bg-zinc-50 border border-zinc-200 rounded-md text-[10.4px] font-medium text-zinc-900 focus:bg-white focus:border-zinc-900 outline-none transition-all resize-none" placeholder="Optional notes..."></textarea>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9.6px] font-semibold text-zinc-700 block">Reference Number</label>
                    <input type="text" name="referenceNo" value={formData.referenceNo} onChange={handleInputChange} className="w-full h-9 px-3 bg-zinc-50 border border-zinc-200 rounded-md text-[10.4px] font-medium text-zinc-900 focus:bg-white focus:border-zinc-900 outline-none transition-all" placeholder="e.g. TRN-12345" />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Allocations Table */}
          <div className="flex-1 overflow-auto bg-zinc-50/30">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-zinc-100/80 text-zinc-500 sticky top-0 z-10 border-b border-zinc-200">
                <tr className="h-[24px] text-[8.8px]">
                  <th className="p-1 font-semibold min-w-[240px]">Sales Invoice</th>
                  <th className="p-1 font-semibold w-[120px] text-right">Invoice Balance</th>
                  <th className="p-1 font-semibold w-[160px]">Allocated Amount</th>
                  <th className="p-1 w-[25.6px] text-center">
                    <button type="button" onClick={handleAddAllocation} className="p-1 text-blue-600 hover:bg-blue-50 rounded flex justify-center w-full" title="Add Allocation">
                      <Plus size={14} />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {formData.allocations.length > 0 ? formData.allocations.map((alloc, index) => {
                  const invId = alloc.salesInvoiceId || alloc.arInvoiceId;
                  const inv = salesInvoices.find(i => i.id === invId);
                  const displayBalance = inv ? (inv.outstandingAmount ?? inv.remainingBalance ?? 0) : '-';
                  return (
                    <tr key={index} className="bg-white hover:bg-zinc-50/50">
                      <td className="p-1 align-middle">
                        <ComboBox
                          name={`salesInvoiceId-${index}`}
                          value={invId}
                          onChange={(val) => handleAllocationChange(index, 'salesInvoiceId', val)}
                          options={salesInvoices.map(i => ({ value: i.id, label: `${i.invoiceNumber || i.invoiceNo || 'Unknown'} (${i.invoiceDate || ''})` }))}
                          placeholder="Search Invoice..."
                          required
                          onCreateClick={(searchTerm) => {
                            setInvoiceSearchTerm(searchTerm);
                            setIsAddInvoiceOpen(true);
                          }}
                          createSubtext="Create New Sales Invoice"
                          inputClassName="w-full h-8 pl-8 pr-2 bg-white border border-zinc-200 rounded-md text-xs hover:border-zinc-300 focus:border-zinc-400 outline-none"
                        />
                      </td>
                      <td className="p-1 align-middle text-right font-medium text-zinc-700">
                        {displayBalance}
                      </td>
                      <td className="p-1 align-middle">
                        <input
                          type="number"
                          step="0.01"
                          className="input-field w-full h-8 text-right text-[8.8px]"
                          value={alloc.allocatedAmount}
                          onChange={(e) => handleAllocationChange(index, 'allocatedAmount', e.target.value)}
                          placeholder="0.00"
                        />
                      </td>
                      <td className="p-1 align-middle text-center">
                        <button type="button" onClick={() => handleRemoveAllocation(index)} className="p-1 text-zinc-400 hover:text-red-500 rounded hover:bg-red-50 flex justify-center w-full">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-zinc-500 text-xs bg-zinc-50 border-b border-dashed border-zinc-200">
                      No allocations added. Click the + button to allocate receipt amount to invoices.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Notes / Summary */}
          <div className="p-4 flex-none border-t border-zinc-100 bg-white flex justify-end">
            <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200 w-80 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-zinc-600">Total Receipt</span>
                <span className="font-bold text-zinc-900">{parseFloat(formData.receiptAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-zinc-200 pb-2">
                <span className="font-bold text-zinc-600">Total Allocated</span>
                <span className="font-bold text-zinc-900">{formData.allocations.reduce((sum, a) => sum + (parseFloat(a.allocatedAmount) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-1">
                <span className="font-bold text-zinc-800">Remaining</span>
                <span className={`font-bold ${calculateRemainingBalance() < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {calculateRemainingBalance().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 p-3 border-t border-zinc-200 bg-zinc-100 flex-none rounded-b-xl">
          <button type="button" onClick={onClose} className="btn-secondary py-1.5 px-5">Cancel</button>
          <button type="submit" form="receipt-form" className="btn-primary py-1.5 px-5" disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Receipt'}
          </button>
        </div>
      </div>

      {isAddCustomerOpen && (
        <CustomerFormModal
          isOpen={isAddCustomerOpen}
          onClose={() => setIsAddCustomerOpen(false)}
          initialData={customerSearchTerm ? { customerName: customerSearchTerm } : null}
          onSubmit={async (newCustomerPayload) => {
            try {
              const res = await customersApi.create(newCustomerPayload);
              setIsAddCustomerOpen(false);
              const newCus = res?.data || res;
              if (newCus?.id) {
                setFormData(prev => ({ ...prev, customerId: newCus.id }));
              }
            } catch (e) {
              throw e;
            }
          }}
        />
      )}

      {isAddBankAccountOpen && (
        <BankAccountForm
          isOpen={isAddBankAccountOpen}
          onClose={() => setIsAddBankAccountOpen(false)}
          initialData={bankSearchTerm ? { bankName: bankSearchTerm } : null}
          onSuccess={(newBank) => {
            setIsAddBankAccountOpen(false);
            if (newBank?.id) {
              setFormData(prev => ({ ...prev, bankAccountId: newBank.id }));
            }
          }}
        />
      )}

      {isAddAccountOpen && (
        <ChartOfAccountsModal
          isOpen={isAddAccountOpen}
          onClose={() => setIsAddAccountOpen(false)}
          mode="create"
          account={accountSearchTerm ? { accountName: accountSearchTerm } : null}
          groups={groups}
          allAccounts={allAccounts}
          companyId={formData.companyId}
          createAccount={async (payload) => {
            try {
              const res = await chartOfAccountsApi.create(payload);
              return { success: true, data: res?.data || res };
            } catch (e) {
              return { success: false };
            }
          }}
          onSuccess={(newAccount) => {
            setIsAddAccountOpen(false);
            if (newAccount?.id) {
              if (activeAccountTarget === 'receivable') {
                setFormData(prev => ({ ...prev, receivableAccountId: newAccount.id }));
              } else if (activeAccountTarget === 'receipt') {
                setFormData(prev => ({ ...prev, receiptAccountId: newAccount.id }));
              }
            }
          }}
        />
      )}

      {isAddInvoiceOpen && (
        <InvoiceFormModal
          isOpen={isAddInvoiceOpen}
          onClose={() => setIsAddInvoiceOpen(false)}
          onSubmit={handleInvoiceSubmit}
          initialData={{
            invoiceNumber: invoiceSearchTerm,
            customerId: formData.customerId
          }}
        />
      )}

      <ConfirmModal
        open={isDeliveryChallanConfirmOpen}
        title="Delivery Challan Confirmation"
        message="Do you want to generate a Delivery Challan for this Receipt Voucher?"
        confirmLabel="Yes"
        cancelLabel="No"
        isDestructive={false}
        loading={isConfirmProcessing}
        onConfirm={handleDeliveryChallanYes}
        onCancel={() => {
          if (isConfirmProcessing) return;
          setIsDeliveryChallanConfirmOpen(false);
          onClose(); // Follow standard flow to close the receipt modal since we're done
        }}
        zIndex={500}
      />

      {isDeliveryChallanFormOpen && (
        <DeliveryChallanFromSoModal
          isOpen={isDeliveryChallanFormOpen}
          onClose={() => {
            setIsDeliveryChallanFormOpen(false);
            setSavedReceipt(null);
            onClose(); // Also close receipt form after DC flow completes
          }}
          companyId={companyId}
          receipt={savedReceipt}
          onSuccess={() => {
            // Success handled inside DC modal, just close when done
            setIsDeliveryChallanFormOpen(false);
            setSavedReceipt(null);
            onClose();
          }}
        />
      )}
    </div>,
    document.body
  );
}
