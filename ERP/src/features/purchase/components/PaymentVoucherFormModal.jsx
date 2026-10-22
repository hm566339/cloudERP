import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '../../../hooks/useApi';
import { paymentVouchersApi, vendorsApi, apInvoicesApi, chartOfAccountsApi } from '../../../api/account';
import { bankAccountsApi } from '../../../api/account/bankAccounts';
import apiClient from '../../../api/common/client';
import { useParams } from 'react-router-dom';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import useDebounce from '../../../hooks/useDebounce';
import CustomSelect from '../../../components/common/CustomSelect';
import ComboBox from '../../../components/common/ComboBox';
import ChartOfAccountsModal from '../../finance/components/ChartOfAccountsModal';
import BankAccountForm from '../../finance/components/BankAccountForm';
import VendorFormModal from '../../account/components/VendorFormModal';
import APInvoiceFormModal from './APInvoiceFormModal';
import { useGetAccountGroupsQuery } from '../../../api/account';

export default function PaymentVoucherFormModal({ isOpen, onClose, initialData, onSuccess }) {
  const dispatch = useAppDispatch();
  const isEditing = !!initialData?.id;
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;

  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [activeAccountTarget, setActiveAccountTarget] = useState(null); // 'payable' or 'payment'
  const [isAddBankAccountOpen, setIsAddBankAccountOpen] = useState(false);
  const [bankSearchTerm, setBankSearchTerm] = useState('');
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [vendorSearchTerm, setVendorSearchTerm] = useState('');
  const debouncedVendorSearch = useDebounce(vendorSearchTerm, 500);
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [accountSearchTerm, setAccountSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    vendorId: '',
    bankAccountId: '',
    voucherDate: new Date().toISOString().split('T')[0],
    paymentAmount: '',
    paymentMode: 'CASH',
    voucherNo: '',
    referenceNo: '',
    remarks: '',
    chequeNumber: '',
    chequeDate: '',
    upiReferenceNumber: '',
    transactionReference: '',
    payableAccountId: '',
    paymentAccountId: '',
    allocations: []
  });

  const { data: vendorsData } = useApiQuery(
    vendorsApi.getVendors,
    [{ isActive: true, searchKey: debouncedVendorSearch || undefined }, { page: 0, size: 50, sort: 'vendorName,asc' }],
    { skip: !isOpen }
  );

  const { data: accountsData } = useApiQuery(
    chartOfAccountsApi.getList,
    [{}, { page: 0, size: 1000, sort: 'accountName,asc' }],
    { skip: !isOpen }
  );

  const { data: bankAccountsResponse } = useApiQuery(
    bankAccountsApi.getBankAccounts,
    [{ page: 0, size: 500, sort: 'bankName,asc' }],
    { skip: !isOpen }
  );

  const { data: apInvoicesData, refetch: refetchInvoices } = useApiQuery(
    apInvoicesApi.getList,
    [{ vendorId: formData.vendorId || undefined }, { page: 0, size: 500, sort: 'invoiceDate,asc' }],
    { skip: !isOpen }
  );

  const { data: groupsResponse } = useGetAccountGroupsQuery({ pageSize: 1000 }, { skip: !isOpen });
  const groups = groupsResponse?.data?.content || groupsResponse?.data || groupsResponse?.content || [];

  const vendors = vendorsData?.content || vendorsData?.data?.content || vendorsData?.data || [];
  const allAccountsRaw = accountsData?.data?.data || accountsData?.data?.content || accountsData?.data || accountsData?.content || accountsData || [];
  const allAccounts = Array.isArray(allAccountsRaw) ? allAccountsRaw : [];
  const liabilityAccounts = allAccounts.filter(a => a.accountType === 'CREDIT' && a.postingAllowed !== false);
  const assetAccounts = allAccounts.filter(a => a.accountType === 'DEBIT' && a.postingAllowed !== false);
  const bankAccountsRaw = bankAccountsResponse?.data?.bankAccounts || bankAccountsResponse?.bankAccounts || bankAccountsResponse?.data?.data?.content || bankAccountsResponse?.data?.content || bankAccountsResponse?.data || [];
  const bankAccounts = Array.isArray(bankAccountsRaw) ? bankAccountsRaw : [];
  const apInvoicesRaw = apInvoicesData?.content || apInvoicesData?.data?.content || apInvoicesData || [];
  const apInvoices = Array.isArray(apInvoicesRaw) ? apInvoicesRaw : [];

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          vendorId: initialData.vendorId || '',
          bankAccountId: initialData.bankAccountId || '',
          voucherDate: initialData.voucherDate || new Date().toISOString().split('T')[0],
          paymentAmount: initialData.paymentAmount || '',
          paymentMode: initialData.paymentMode || 'CASH',
          voucherNo: initialData.voucherNo || '',
          referenceNo: initialData.referenceNo || '',
          remarks: initialData.remarks || '',
          chequeNumber: initialData.chequeNumber || '',
          chequeDate: initialData.chequeDate || '',
          upiReferenceNumber: initialData.upiReferenceNumber || '',
          transactionReference: initialData.transactionReference || '',
          payableAccountId: initialData.payableAccountId || '',
          paymentAccountId: initialData.paymentAccountId || '',
          allocations: initialData.allocations?.map(a => ({
            apInvoiceId: a.apInvoiceId, 
            allocatedAmount: a.allocatedAmount || 0,
            invoiceNo: a.invoiceNo || ''
          })) || []
        });
      } else {
        setFormData({
          vendorId: '',
          bankAccountId: '',
          voucherDate: new Date().toISOString().split('T')[0],
          paymentAmount: '',
          paymentMode: 'CASH',
          voucherNo: '',
          referenceNo: '',
          remarks: '',
          chequeNumber: '',
          chequeDate: '',
          upiReferenceNumber: '',
          transactionReference: '',
          payableAccountId: '',
          paymentAccountId: '',
          allocations: [{ apInvoiceId: '', allocatedAmount: '' }]
        });
      }
    }
  }, [isOpen, initialData]);

  const createMutation = useApiMutation(paymentVouchersApi.createPaymentVoucher);
  const updateMutation = useApiMutation(paymentVouchersApi.updatePaymentVoucher);
  const createBankMutation = useApiMutation(bankAccountsApi.createBankAccount);
  const createInvoiceMutation = useApiMutation(apInvoicesApi.create);

  const createAccount = async (payload) => {
    try {
      const response = await chartOfAccountsApi.create(payload);
      return { success: true, data: response?.data || response };
    } catch (err) {
      return { success: false, message: err?.response?.data?.message || err.message };
    }
  };

  const handleAccountSuccess = (newAccount) => {
    setIsAddAccountOpen(false);
    if (newAccount?.id) {
      if (activeAccountTarget === 'payable') {
        setFormData(prev => ({ ...prev, payableAccountId: newAccount.id }));
      } else if (activeAccountTarget === 'payment') {
        setFormData(prev => ({ ...prev, paymentAccountId: newAccount.id }));
      }
    }
  };

  const handleBankSuccess = async (payload) => {
    try {
      const response = await createBankMutation.mutateAsync([payload]);
      setIsAddBankAccountOpen(false);
      if (response?.id || response?.data?.id) {
         setFormData(prev => ({ ...prev, bankAccountId: response.id || response.data.id }));
      }
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to create bank account' }));
    }
  };

  const handleVendorSuccess = (newVendor) => {
    setIsAddVendorOpen(false);
    if (newVendor?.id) {
      setFormData(prev => ({ 
        ...prev, 
        vendorId: newVendor.id,
        payableAccountId: newVendor.payableAccountId || newVendor.defaultAccountId || prev.payableAccountId
      }));
    }
  };

  const handleInvoiceSubmit = async (payload) => {
    try {
      const res = await createInvoiceMutation.mutateAsync([payload]);
      dispatch(addAlert({ type: 'success', message: 'Invoice generated successfully' }));
      setIsAddInvoiceOpen(false);
      refetchInvoices();
      // Optionally auto-add this invoice to allocations if possible
      if (res?.data?.id || res?.id) {
         setFormData(prev => ({
           ...prev,
           allocations: [...prev.allocations, { apInvoiceId: res?.data?.id || res?.id, allocatedAmount: '' }]
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

  const handleVendorChange = (e) => {
    const vendorId = e.target.value;
    const vendor = vendors.find(v => String(v.id) === String(vendorId));
    setFormData(prev => ({ 
      ...prev, 
      vendorId: vendorId,
      payableAccountId: vendor?.payableAccountId || vendor?.defaultAccountId || prev.payableAccountId
    }));
  };

  const handleAddAllocation = () => {
    setFormData(prev => ({
      ...prev,
      allocations: [...prev.allocations, { apInvoiceId: '', allocatedAmount: '' }]
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
    const totalPayment = parseFloat(formData.paymentAmount) || 0;
    const totalAllocated = formData.allocations.reduce((sum, a) => sum + (parseFloat(a.allocatedAmount) || 0), 0);
    return totalPayment - totalAllocated;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const paymentAmt = parseFloat(formData.paymentAmount) || 0;
    if (paymentAmt <= 0) {
      dispatch(addAlert({ type: 'error', message: 'Payment amount must be greater than zero' }));
      return;
    }

    const remaining = calculateRemainingBalance();
    if (remaining < 0) {
      dispatch(addAlert({ type: 'error', message: 'Total allocated amount cannot exceed payment amount' }));
      return;
    }

    if (formData.paymentMode === 'CHEQUE') {
      if (!formData.chequeNumber) return dispatch(addAlert({ type: 'error', message: 'Cheque Number is required for Cheque payment' }));
      if (!formData.chequeDate) return dispatch(addAlert({ type: 'error', message: 'Cheque Date is required for Cheque payment' }));
    }
    if (formData.paymentMode === 'UPI' && !formData.upiReferenceNumber) {
      return dispatch(addAlert({ type: 'error', message: 'UPI Reference Number is required for UPI payment' }));
    }
    if (formData.paymentMode === 'BANK_TRANSFER' && !formData.transactionReference) {
      return dispatch(addAlert({ type: 'error', message: 'Transaction Reference is required for Bank Transfer' }));
    }

    for (const alloc of formData.allocations) {
      const allocAmt = parseFloat(alloc.allocatedAmount) || 0;
      if (allocAmt <= 0) {
        dispatch(addAlert({ type: 'error', message: 'Allocated amounts must be greater than zero' }));
        return;
      }
      if (!alloc.apInvoiceId) {
        dispatch(addAlert({ type: 'error', message: 'Please select an invoice for all allocations' }));
        return;
      }
      
      const inv = apInvoices.find(i => i.id === alloc.apInvoiceId);
      if (inv) {
        const remainingInvBalance = inv.outstandingAmount || 0;
        if (allocAmt > remainingInvBalance) {
          dispatch(addAlert({ type: 'error', message: `Allocation for invoice ${inv.invoiceNo} exceeds its remaining balance of ${remainingInvBalance}` }));
          return;
        }
      }
    }

    const payload = {
      data: {
        vendorId: formData.vendorId || null,
        bankAccountId: formData.bankAccountId || null,
        ...(isEditing && formData.voucherNo ? { voucherNo: formData.voucherNo } : {}),
        voucherDate: formData.voucherDate,
        paymentAmount: paymentAmt,
        paymentMode: formData.paymentMode,
        referenceNo: formData.referenceNo || null,
        chequeNumber: formData.paymentMode === 'CHEQUE' ? formData.chequeNumber : null,
        chequeDate: formData.paymentMode === 'CHEQUE' ? formData.chequeDate : null,
        upiReferenceNumber: formData.paymentMode === 'UPI' ? formData.upiReferenceNumber : null,
        transactionReference: formData.paymentMode === 'BANK_TRANSFER' ? formData.transactionReference : null,
        remarks: formData.remarks || null,
        payableAccountId: formData.payableAccountId || null,
        paymentAccountId: formData.paymentAccountId || null,
        allocations: formData.allocations.map(a => ({
          apInvoiceId: a.apInvoiceId,
          allocatedAmount: parseFloat(a.allocatedAmount) || 0
        }))
      }
    };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync([initialData.id, payload]);
        dispatch(addAlert({ type: 'success', message: 'Payment voucher updated successfully' }));
      } else {
        const response = await createMutation.mutateAsync([payload]);
        const generatedVoucherNo = response?.voucherNo || response?.data?.voucherNo;
        dispatch(addAlert({ 
          type: 'success', 
          message: generatedVoucherNo 
            ? `Payment voucher ${generatedVoucherNo} created successfully` 
            : 'Payment voucher created successfully' 
        }));
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to save payment voucher' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-card-dark rounded-xl shadow-2xl w-full max-w-[960px] h-[90vh] max-h-[90vh] flex flex-col overflow-hidden border border-zinc-200 dark:border-border-dark">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1D212C]/50 flex-none">
          <h2 className="text-base font-bold text-zinc-800">
            {isEditing ? 'Edit Payment Voucher' : 'Create Payment Voucher'}
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <form id="voucher-form" onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden text-xs min-h-0">
          
          {/* Header Controls */}
          <div className="p-4 flex-none space-y-3 bg-white dark:bg-card-dark border-b border-zinc-100 dark:border-[#2A2F3D]">
            {/* Row 1: Basic Info */}
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-zinc-600">Voucher Number</label>
                <input type="text" name="voucherNo" value={formData.voucherNo || ''} placeholder="Auto Generated" disabled className="input-field w-full h-9 bg-zinc-50 cursor-not-allowed" />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-zinc-600">Voucher Date *</label>
                <input type="date" name="voucherDate" value={formData.voucherDate} onChange={handleInputChange} className="input-field w-full h-9" required />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-zinc-600">Payment Amount *</label>
                <input type="number" step="0.01" name="paymentAmount" value={formData.paymentAmount} onChange={handleInputChange} className="input-field w-full h-9" required />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-zinc-600">Payment Mode *</label>
                <CustomSelect name="paymentMode" value={formData.paymentMode} onChange={handleInputChange} className="input-field w-full h-9" required>
                  <option value="CASH">CASH</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER</option>
                  <option value="CHEQUE">CHEQUE</option>
                  <option value="CREDIT_CARD">CREDIT CARD</option>
                  <option value="UPI">UPI</option>
                </CustomSelect>
              </div>
            </div>

            {/* Row 2: Entities & Accounts */}
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-zinc-600">Vendor *</label>
                <ComboBox
                  name="vendorId"
                  value={formData.vendorId}
                  onChange={(val) => handleVendorChange({ target: { name: 'vendorId', value: val }})}
                  options={vendors.map(v => ({ value: v.id, label: `[${v.vendorCode}] ${v.vendorName}` }))}
                  placeholder="Search vendor..."
                  onSearchChange={setVendorSearchTerm}
                  serverSideSearch={true}
                  required
                  onCreateClick={(searchTerm) => {
                    setVendorSearchTerm(searchTerm);
                    setIsAddVendorOpen(true);
                  }}
                  createSubtext="Add as new vendor"
                  inputClassName="w-full h-8 pl-8 pr-2 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-xs hover:border-zinc-300 focus:border-zinc-400 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-zinc-600">Bank Account</label>
                <ComboBox
                  name="bankAccountId"
                  value={formData.bankAccountId}
                  onChange={(val) => handleInputChange({ target: { name: 'bankAccountId', value: val }})}
                  options={bankAccounts.map(b => ({ value: b.id, label: `${b.bankName} - ${b.accountNumber}` }))}
                  placeholder="Search bank account..."
                  onCreateClick={(searchTerm) => {
                    setBankSearchTerm(searchTerm);
                    setIsAddBankAccountOpen(true);
                  }}
                  createSubtext="Add as new bank account"
                  inputClassName="w-full h-8 pl-8 pr-2 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-xs hover:border-zinc-300 focus:border-zinc-400 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-zinc-600">Payable Account *</label>
                <ComboBox
                  name="payableAccountId"
                  value={formData.payableAccountId}
                  onChange={(val) => handleInputChange({ target: { name: 'payableAccountId', value: val }})}
                  options={liabilityAccounts.map(a => ({ value: a.id, label: `[${a.accountCode}] ${a.accountName}` }))}
                  placeholder="Search payable account..."
                  required
                  onCreateClick={(searchTerm) => { 
                    setAccountSearchTerm(searchTerm);
                    setActiveAccountTarget('payable'); 
                    setIsAddAccountOpen(true); 
                  }}
                  createSubtext="Add as new payable account"
                  inputClassName="w-full h-8 pl-8 pr-2 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-xs hover:border-zinc-300 focus:border-zinc-400 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-zinc-600">Payment Account *</label>
                <ComboBox
                  name="paymentAccountId"
                  value={formData.paymentAccountId}
                  onChange={(val) => handleInputChange({ target: { name: 'paymentAccountId', value: val }})}
                  options={assetAccounts.map(a => ({ value: a.id, label: `[${a.accountCode}] ${a.accountName}` }))}
                  placeholder="Search payment account..."
                  required
                  onCreateClick={(searchTerm) => { 
                    setAccountSearchTerm(searchTerm);
                    setActiveAccountTarget('payment'); 
                    setIsAddAccountOpen(true); 
                  }}
                  createSubtext="Add as new payment account"
                  inputClassName="w-full h-8 pl-8 pr-2 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-xs hover:border-zinc-300 focus:border-zinc-400 outline-none"
                />
              </div>
            </div>

            {/* Row 3: Conditional & Remarks */}
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1 col-span-2">
                <label className="font-bold text-zinc-600">Remarks</label>
                <input type="text" name="remarks" value={formData.remarks} onChange={handleInputChange} className="input-field w-full h-9" />
              </div>

              {formData.paymentMode === 'CHEQUE' && (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-600">Cheque Number *</label>
                    <input type="text" name="chequeNumber" value={formData.chequeNumber} onChange={handleInputChange} className="input-field w-full h-9" required />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-600">Cheque Date *</label>
                    <input type="date" name="chequeDate" value={formData.chequeDate} onChange={handleInputChange} className="input-field w-full h-9" required />
                  </div>
                </>
              )}
              {formData.paymentMode === 'UPI' && (
                <div className="space-y-1 col-span-2">
                  <label className="font-bold text-zinc-600">UPI Reference Number *</label>
                  <input type="text" name="upiReferenceNumber" value={formData.upiReferenceNumber} onChange={handleInputChange} className="input-field w-full h-9" required />
                </div>
              )}
              {formData.paymentMode === 'BANK_TRANSFER' && (
                <div className="space-y-1 col-span-2">
                  <label className="font-bold text-zinc-600">Transaction Reference *</label>
                  <input type="text" name="transactionReference" value={formData.transactionReference} onChange={handleInputChange} className="input-field w-full h-9" required />
                </div>
              )}
              {formData.paymentMode !== 'CHEQUE' && formData.paymentMode !== 'UPI' && formData.paymentMode !== 'BANK_TRANSFER' && (
                 <div className="space-y-1 col-span-2">
                  <label className="font-bold text-zinc-600">Reference Number</label>
                  <input type="text" name="referenceNo" value={formData.referenceNo} onChange={handleInputChange} className="input-field w-full h-9" />
                </div>
              )}
            </div>
          </div>

          {/* Allocations Table */}
          <div className="flex-1 overflow-auto bg-zinc-50/30">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-zinc-100/80 text-zinc-500 sticky top-0 z-10 border-b border-zinc-200">
                <tr className="h-[24px] text-[8.8px]">
                  <th className="p-1 font-semibold min-w-[240px]">AP Invoice</th>
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
                  const inv = apInvoices.find(i => i.id === alloc.apInvoiceId);
                  const displayBalance = inv ? (inv.outstandingAmount || 0) : '-';
                  return (
                    <tr key={index} className="bg-white dark:bg-card-dark hover:bg-zinc-50/50 dark:hover:bg-hover-dark/40">
                      <td className="p-1 align-middle">
                        <ComboBox
                          name={`alloc-invoice-${index}`}
                          value={alloc.apInvoiceId}
                          onChange={(val) => handleAllocationChange(index, 'apInvoiceId', val)}
                          options={apInvoices.map(i => ({ value: i.id, label: `${i.invoiceNo} (${i.invoiceDate})` }))}
                          placeholder="Search AP Invoice..."
                          onCreateClick={() => setIsAddInvoiceOpen(true)}
                          createSubtext="Create new AP Invoice"
                          inputClassName="w-full h-8 pl-8 pr-2 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-xs hover:border-zinc-300 focus:border-zinc-400 outline-none"
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
                      No allocations added. Click the + button to allocate payment amount to invoices.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Notes / Summary */}
          <div className="p-4 flex-none border-t border-zinc-100 dark:border-border-dark bg-white dark:bg-card-dark flex justify-end">
            <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200 w-80 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-zinc-600">Total Payment</span>
                <span className="font-bold text-zinc-900">{parseFloat(formData.paymentAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-zinc-200 pb-2">
                <span className="font-bold text-zinc-600">Total Allocated</span>
                <span className="font-bold text-zinc-900">{formData.allocations.reduce((sum, a) => sum + (parseFloat(a.allocatedAmount) || 0), 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-1">
                <span className="font-bold text-zinc-800">Remaining</span>
                <span className={`font-bold ${calculateRemainingBalance() < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {calculateRemainingBalance().toLocaleString(undefined, {minimumFractionDigits: 2})}
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 p-3 border-t border-zinc-200 bg-zinc-100 flex-none">
          <button type="button" onClick={onClose} className="btn-secondary py-1.5 px-5">Cancel</button>
          <button type="submit" form="voucher-form" className="btn-primary py-1.5 px-5" disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Voucher'}
          </button>
        </div>
      </div>
      {isAddBankAccountOpen && (
        <BankAccountForm
          isOpen={isAddBankAccountOpen}
          onClose={() => setIsAddBankAccountOpen(false)}
          initialData={bankSearchTerm ? { bankName: bankSearchTerm } : null}
          onSubmit={handleBankSuccess}
          isLoading={createBankMutation.isLoading || createBankMutation.isPending}
        />
      )}

      {isAddVendorOpen && (
        <VendorFormModal
          isOpen={isAddVendorOpen}
          onClose={() => setIsAddVendorOpen(false)}
          initialData={vendorSearchTerm ? { vendorName: vendorSearchTerm } : null}
          onSuccess={handleVendorSuccess}
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
          companyId={companyId}
          createAccount={createAccount}
          onSuccess={handleAccountSuccess}
        />
      )}

      {isAddInvoiceOpen && (
        <APInvoiceFormModal
          isOpen={isAddInvoiceOpen}
          onClose={() => setIsAddInvoiceOpen(false)}
          onSubmit={handleInvoiceSubmit}
          initialData={formData.vendorId ? { vendorId: formData.vendorId } : null}
        />
      )}
    </div>
  );
}
