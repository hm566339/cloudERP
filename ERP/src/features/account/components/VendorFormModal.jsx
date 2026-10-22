import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X, ChevronDown, Search, Plus, Loader2, Check } from 'lucide-react';
import { useApiMutation } from '../../../hooks/useApi';
import { vendorsApi, chartOfAccountsApi, accountGroupsApi } from '../../../api/account';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import ChartOfAccountsModal from '../../finance/components/ChartOfAccountsModal';
import CustomSelect from '../../../components/common/CustomSelect';

function SearchableAccountSelect({ accounts, apGroup, value, onChange, onCreateNew, isLoading, required, onSearch }) {
  const [isFocused, setIsFocused] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const listRef = useRef(null);
  const searchDebounceRef = useRef(null);

  const selectedAccount = useMemo(() => {
    return accounts.find(acc => String(acc.id) === String(value));
  }, [accounts, value]);

  // Initialize search term from selected value
  useEffect(() => {
    if (value && selectedAccount) {
      setSearchTerm(`${selectedAccount.accountName}${selectedAccount.accountCode ? ` (${selectedAccount.accountCode})` : ''}`);
    } else {
      setSearchTerm('');
    }
  }, [value, selectedAccount]);

  // Filter accounts locally by name or code
  const filteredAccounts = useMemo(() => {
    if (!searchTerm.trim()) return accounts;
    const currentLabel = selectedAccount ? `${selectedAccount.accountName}${selectedAccount.accountCode ? ` (${selectedAccount.accountCode})` : ''}` : '';
    if (searchTerm === currentLabel) return accounts; // If term is exactly the selected label, show all
    
    const term = searchTerm.toLowerCase().trim();
    return accounts.filter(acc => {
      const nameMatch = acc.accountName && acc.accountName.toLowerCase().includes(term);
      const codeMatch = acc.accountCode && String(acc.accountCode).toLowerCase().includes(term);
      return nameMatch || codeMatch;
    });
  }, [accounts, searchTerm, selectedAccount]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsFocused(false);
        // On blur, reset to current value
        if (value && selectedAccount) {
          setSearchTerm(`${selectedAccount.accountName}${selectedAccount.accountCode ? ` (${selectedAccount.accountCode})` : ''}`);
        } else {
          setSearchTerm('');
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, selectedAccount]);

  // Handle server-side debounced search
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (!isFocused) setIsFocused(true);
    
    if (val === '') {
      onChange({ target: { name: 'payableAccountId', value: '' } });
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      if (onSearch) {
        onSearch(val);
      }
    }, 300);
  };

  const showCreateOption = onCreateNew && (!searchTerm || !accounts.some(acc => acc.accountName?.toLowerCase() === searchTerm.toLowerCase()));
  const totalOptions = filteredAccounts.length + (showCreateOption ? 1 : 0);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm, accounts]);

  useEffect(() => {
    if (isFocused && listRef.current && listRef.current.children[highlightedIndex]) {
      listRef.current.children[highlightedIndex].scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isFocused]);

  const handleSelectAccount = (accId) => {
    onChange({ target: { name: 'payableAccountId', value: accId } });
    setIsFocused(false);
  };

  const handleKeyDown = (e) => {
    if (!isFocused) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsFocused(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % totalOptions);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + totalOptions) % totalOptions);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex === filteredAccounts.length && showCreateOption) {
        setIsFocused(false);
        onCreateNew(searchTerm);
      } else if (filteredAccounts[highlightedIndex]) {
        handleSelectAccount(filteredAccounts[highlightedIndex].id);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsFocused(false);
    }
  };

  return (
    <div className={`relative group ${isFocused ? 'z-50' : 'z-10'}`} ref={containerRef}>
      {required && (
        <input
          type="text"
          name="payableAccountId"
          value={value || ''}
          onChange={() => {}}
          className="absolute opacity-0 bottom-0 left-1/2 w-1 h-1 -z-10"
          tabIndex={-1}
          required
        />
      )}

      <div className="relative">
        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Select Account..."
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          className="w-full h-9 pl-8 pr-8 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-[10.4px] text-zinc-800 dark:text-[#E6E8EE] placeholder-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 outline-none transition-all"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange({ target: { name: 'payableAccountId', value: '' } });
              setSearchTerm('');
              if (onSearch) onSearch('');
              setIsFocused(true);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors focus:outline-none"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isFocused && (filteredAccounts.length > 0 || showCreateOption || isLoading) && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto z-50">
          <div className="py-1" ref={listRef}>
            {isLoading && (
               <div className="py-3 flex justify-center items-center">
                 <Loader2 size={16} className="animate-spin text-zinc-400" />
               </div>
            )}
            {!isLoading && filteredAccounts.length === 0 && !showCreateOption && (
              <div className="py-6 text-center text-sm text-zinc-500">
                <p className="text-base mb-1">😕</p>
                No accounts found
              </div>
            )}
            {!isLoading && filteredAccounts.map((acc, index) => {
              const isSelected = String(acc.id) === String(value);
              const isHighlighted = index === highlightedIndex;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelectAccount(acc.id)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                    isSelected
                      ? 'bg-blue-50/50 dark:bg-blue-900/20'
                      : isHighlighted
                      ? 'bg-zinc-50 dark:bg-[#222736]'
                      : 'hover:bg-zinc-50 dark:hover:bg-[#222736]'
                  }`}
                >
                  <div className={`text-[10.4px] truncate ${isSelected ? 'font-semibold text-blue-700 dark:text-blue-400' : 'text-zinc-900 dark:text-[#E6E8EE] font-medium'}`}>
                    {acc.accountName} {acc.accountCode ? `(${acc.accountCode})` : ''}
                  </div>
                  {isSelected && <Check size={14} className="text-blue-600 shrink-0" />}
                </button>
              );
            })}

            {!isLoading && showCreateOption && (
              <>
                {filteredAccounts.length > 0 && <div className="h-px bg-zinc-100 dark:bg-[#2A2F3D] my-1"></div>}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setIsFocused(false);
                    onCreateNew(searchTerm);
                  }}
                  onMouseEnter={() => setHighlightedIndex(filteredAccounts.length)}
                  className={`w-full flex items-start gap-3 p-3 text-left transition-colors ${
                    highlightedIndex === filteredAccounts.length ? 'bg-zinc-50 dark:bg-[#222736]' : 'hover:bg-zinc-50 dark:hover:bg-[#222736]'
                  }`}
                >
                  <Plus size={16} className="text-zinc-600 dark:text-[#A0A6B5] mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-zinc-900 dark:text-[#E6E8EE] text-[10.4px] truncate">
                      {searchTerm && searchTerm !== 'Create Payable Account' ? `Create "${searchTerm}"` : 'Create Payable Account'}
                    </div>
                    {searchTerm && searchTerm !== 'Create Payable Account' && (
                      <div className="text-[8.8px] text-zinc-500 mt-0.5 truncate">
                        Add as new payable account
                      </div>
                    )}
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VendorFormModal({ isOpen, onClose, initialData, onSuccess }) {
  const dispatch = useAppDispatch();
  const isEditing = !!initialData?.id;

  const wasOpenRef = useRef(false);
  const initializedKeyRef = useRef(null);

  const [accounts, setAccounts] = useState([]);
  const [accountGroups, setAccountGroups] = useState([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');

  const companyId = JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;

  const [formData, setFormData] = useState({
    vendorCode: '',
    vendorName: '',
    gstin: '',
    panNo: '',
    email: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    country: '',
    pinCode: '',
    creditLimit: '',
    payableAccountId: '',
    openingBalance: '0',
    openingBalanceDate: new Date().toISOString().slice(0, 10),
    paymentTermDays: '0',
    defaultCurrency: JSON.parse(localStorage.getItem('selected_company'))?.baseCurrency || 'INR',
    tdsApplicable: false,
    tdsSection: '',
    tdsRate: '0',
    isActive: true
  });

  const apGroup = useMemo(() => {
    return accountGroups.find(
      g => {
        const name = g.name?.toLowerCase() || '';
        return name === 'accounts payable' || name.includes('payable') || name.includes('creditor') || name === 'sundry creditors';
      }
    );
  }, [accountGroups]);

  const payableAccounts = useMemo(() => {
    const gstKeywords = ['cgst', 'sgst', 'igst', 'cess', 'output gst', 'input gst', 'gst payable', 'gst receivable'];
    
    return accounts.filter(acc => {
      // Exclude non-posting accounts (e.g. parent groups like "200001 - Accounts Payable")
      if (acc.postingAllowed === false) return false;
      
      const name = (acc.accountName || '').toLowerCase();
      
      // Exclude GST tax accounts explicitly
      if (gstKeywords.some(kw => name.includes(kw))) return false;

      // Check group name for payable/creditor classification
      const accGroup = accountGroups.find(g => g.id === acc.groupId);
      const groupName = (accGroup?.name || acc.group?.name || '').toLowerCase();
      
      const inPayableGroup = groupName.includes('payable') || groupName.includes('creditor') || groupName.includes('sundry');
      const hasPayableName = name.includes('payable') || name.includes('creditor') || name.includes('vendor');
      
      if (inPayableGroup || hasPayableName) return true;
      
      // Fallback: Allow any valid CREDIT or LIABILITY account
      if (acc.accountType === 'CREDIT' || acc.accountNature === 'LIABILITY') {
        return true;
      }
      
      return false;
    });
  }, [accounts, accountGroups]);

  // Load all accounts from Chart of Accounts
  const loadAccounts = useCallback(async (searchQuery = '') => {
    setIsLoadingAccounts(true);
    try {
      const params = {
        page: 0,
        size: 1000,
        sortBy: 'accountCode',
        sortDir: 'asc',
        companyId
      };
      if (searchQuery.trim()) {
        params.searchKey = searchQuery.trim();
      }
      const res = await chartOfAccountsApi.getList(params);
      const body = res?.data ?? res;
      const list = body?.content ?? body?.items ?? body?.data ?? (Array.isArray(body) ? body : (Array.isArray(res) ? res : []));

      setAccounts(prevAccounts => {
        if (!searchQuery.trim()) return list;
        const map = new Map();
        prevAccounts.forEach(a => map.set(a.id, a));
        list.forEach(a => map.set(a.id, a));
        return Array.from(map.values());
      });
    } catch (err) {
      console.error("Failed to load accounts", err);
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [companyId]);

  const loadAccountGroups = useCallback(async () => {
    try {
      const res = await accountGroupsApi.getList({ params: { size: 1000, companyId } });
      const body = res?.data ?? res;
      const list = body?.content ?? body?.items ?? body?.data ?? (Array.isArray(body) ? body : (Array.isArray(res) ? res : []));
      setAccountGroups(list);
    } catch (err) {
      console.error("Failed to load account groups", err);
    }
  }, [companyId]);

  useEffect(() => {
    if (isOpen) {
      loadAccounts();
      loadAccountGroups();
    }
  }, [isOpen, loadAccounts, loadAccountGroups]);

  // Pre-fill only once when modal opens or initialData changes
  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      initializedKeyRef.current = null;
      return;
    }

    const dataKey = initialData?.id || 'create';
    if (wasOpenRef.current && initializedKeyRef.current === dataKey) {
      return;
    }

    if (initialData) {
      setFormData({
        vendorCode: initialData.vendorCode || '',
        vendorName: initialData.vendorName || '',
        gstin: initialData.gstin || '',
        panNo: initialData.panNo || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        addressLine1: initialData.addressLine1 || '',
        city: initialData.city || '',
        state: initialData.state || '',
        country: initialData.country || '',
        pinCode: initialData.pinCode || '',
        creditLimit: initialData.creditLimit !== undefined ? String(initialData.creditLimit) : '',
        payableAccountId: initialData.payableAccountId || '',
        openingBalance: initialData.openingBalance !== undefined ? String(initialData.openingBalance) : '0',
        openingBalanceDate: initialData.openingBalanceDate ? initialData.openingBalanceDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
        paymentTermDays: initialData.paymentTermDays !== undefined ? String(initialData.paymentTermDays) : '0',
        defaultCurrency: initialData.defaultCurrency || JSON.parse(localStorage.getItem('selected_company'))?.baseCurrency || 'INR',
        tdsApplicable: Boolean(initialData.tdsApplicable),
        tdsSection: initialData.tdsSection || '',
        tdsRate: initialData.tdsRate !== undefined ? String(initialData.tdsRate) : '0',
        isActive: initialData.isActive ?? true
      });
    } else {
      setFormData({
        vendorCode: '',
        vendorName: '',
        gstin: '',
        panNo: '',
        email: '',
        phone: '',
        addressLine1: '',
        city: '',
        state: '',
        country: '',
        pinCode: '',
        creditLimit: '',
        payableAccountId: '',
        openingBalance: '0',
        openingBalanceDate: new Date().toISOString().slice(0, 10),
        paymentTermDays: '0',
        defaultCurrency: JSON.parse(localStorage.getItem('selected_company'))?.baseCurrency || 'INR',
        tdsApplicable: false,
        tdsSection: '',
        tdsRate: '0',
        isActive: true
      });
    }

    wasOpenRef.current = true;
    initializedKeyRef.current = dataKey;
  }, [isOpen, initialData]);

  const createMutation = useApiMutation(vendorsApi.createVendor);
  const updateMutation = useApiMutation(vendorsApi.updateVendor);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCreateAccountSubmit = async (payload) => {
    try {
      const finalPayload = {
        ...payload,
        groupId: payload.groupId || apGroup?.id || null
      };

      const res = await chartOfAccountsApi.create(finalPayload);
      dispatch(addAlert({ type: 'success', message: 'Payable account created successfully' }));

      const createdAccount = res?.data || res;
      const newAccountId = createdAccount?.id;

      await loadAccounts();

      if (newAccountId) {
        setFormData(prev => ({ ...prev, payableAccountId: newAccountId }));
      }
      setIsAccountModalOpen(false);
      return res;
    } catch (err) {
      console.error("Failed to create account", err);
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.vendorName || !formData.vendorName.trim()) {
      dispatch(addAlert({ type: 'error', message: 'Vendor Name is required' }));
      return;
    }
    if (formData.vendorName.length > 255) {
      dispatch(addAlert({ type: 'error', message: 'Vendor Name cannot exceed 255 characters' }));
      return;
    }

    if (formData.vendorCode && formData.vendorCode.length > 50) {
      dispatch(addAlert({ type: 'error', message: 'Vendor Code cannot exceed 50 characters' }));
      return;
    }

    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        dispatch(addAlert({ type: 'error', message: 'Valid email address required' }));
        return;
      }
    }

    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^\+?[0-9\- ]{7,20}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        dispatch(addAlert({ type: 'error', message: 'Invalid phone format (7-20 digits/characters)' }));
        return;
      }
    }

    if (formData.gstin && formData.gstin.trim()) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Zz][0-9A-Z]{1}$/i;
      if (formData.gstin.length > 15 || !gstinRegex.test(formData.gstin.trim().toUpperCase())) {
        dispatch(addAlert({ type: 'error', message: 'Must be a valid 15-character GSTIN' }));
        return;
      }
    }

    if (formData.panNo && formData.panNo.trim()) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
      if (formData.panNo.length > 10 || !panRegex.test(formData.panNo.trim().toUpperCase())) {
        dispatch(addAlert({ type: 'error', message: 'Must be a valid 10-character PAN' }));
        return;
      }
    }

    if (formData.addressLine1 && formData.addressLine1.length > 500) {
      dispatch(addAlert({ type: 'error', message: 'Address Line 1 cannot exceed 500 characters' }));
      return;
    }
    if (formData.city && formData.city.length > 100) {
      dispatch(addAlert({ type: 'error', message: 'City cannot exceed 100 characters' }));
      return;
    }
    if (formData.state && formData.state.length > 100) {
      dispatch(addAlert({ type: 'error', message: 'State cannot exceed 100 characters' }));
      return;
    }
    if (formData.country && formData.country.length > 100) {
      dispatch(addAlert({ type: 'error', message: 'Country cannot exceed 100 characters' }));
      return;
    }
    if (formData.pinCode && formData.pinCode.length > 10) {
      dispatch(addAlert({ type: 'error', message: 'Pin Code cannot exceed 10 characters' }));
      return;
    }

    if (!formData.payableAccountId) {
      dispatch(addAlert({ type: 'error', message: 'Payable Account is required' }));
      return;
    }

    if (formData.creditLimit === '' || formData.creditLimit === null || formData.creditLimit === undefined) {
      dispatch(addAlert({ type: 'error', message: 'Credit Limit is required' }));
      return;
    }

    const valCreditLimit = parseFloat(formData.creditLimit);
    if (isNaN(valCreditLimit) || valCreditLimit < 0) {
      dispatch(addAlert({ type: 'error', message: 'Credit Limit must be a valid non-negative number' }));
      return;
    }

    let valOpeningBalance = 0;
    if (formData.openingBalance !== '' && formData.openingBalance !== null && formData.openingBalance !== undefined) {
      valOpeningBalance = parseFloat(formData.openingBalance);
      if (isNaN(valOpeningBalance) || valOpeningBalance < 0) {
        dispatch(addAlert({ type: 'error', message: 'Opening Balance must be a valid non-negative number' }));
        return;
      }
    }

    let valPaymentTermDays = 0;
    if (formData.paymentTermDays !== '' && formData.paymentTermDays !== null && formData.paymentTermDays !== undefined) {
      valPaymentTermDays = parseInt(formData.paymentTermDays, 10);
      if (isNaN(valPaymentTermDays) || valPaymentTermDays < 0) {
        dispatch(addAlert({ type: 'error', message: 'Payment Term Days must be a valid non-negative integer' }));
        return;
      }
    }

    if (formData.defaultCurrency && formData.defaultCurrency.trim()) {
      if (!/^[A-Z]{3}$/.test(formData.defaultCurrency.trim())) {
        dispatch(addAlert({ type: 'error', message: 'Currency must be exactly 3 uppercase letters' }));
        return;
      }
    }

    if (formData.tdsSection && formData.tdsSection.length > 30) {
      dispatch(addAlert({ type: 'error', message: 'TDS Section cannot exceed 30 characters' }));
      return;
    }

    let valTdsRate = 0;
    if (formData.tdsRate !== '' && formData.tdsRate !== null && formData.tdsRate !== undefined) {
      valTdsRate = parseFloat(formData.tdsRate);
      if (isNaN(valTdsRate) || valTdsRate < 0) {
        dispatch(addAlert({ type: 'error', message: 'TDS Rate must be a valid non-negative number' }));
        return;
      }
      if (valTdsRate > 100) {
        dispatch(addAlert({ type: 'error', message: 'TDS Rate cannot exceed 100%' }));
        return;
      }
    }

    if (formData.tdsApplicable && valTdsRate <= 0) {
      dispatch(addAlert({ type: 'error', message: 'TDS rate must be greater than zero when TDS applies' }));
      return;
    }

    const payload = {
      companyId: companyId,
      vendorCode: formData.vendorCode ? formData.vendorCode.trim() : null,
      vendorName: formData.vendorName.trim(),
      gstin: formData.gstin ? formData.gstin.trim().toUpperCase() : null,
      panNo: formData.panNo ? formData.panNo.trim().toUpperCase() : null,
      email: formData.email ? formData.email.trim() : null,
      phone: formData.phone ? formData.phone.trim() : null,
      addressLine1: formData.addressLine1 ? formData.addressLine1.trim() : null,
      city: formData.city ? formData.city.trim() : null,
      state: formData.state ? formData.state.trim() : null,
      country: formData.country ? formData.country.trim() : null,
      pinCode: formData.pinCode ? formData.pinCode.trim() : null,
      creditLimit: valCreditLimit,
      payableAccountId: formData.payableAccountId,
      openingBalance: valOpeningBalance,
      openingBalanceDate: formData.openingBalanceDate || null,
      paymentTermDays: valPaymentTermDays,
      defaultCurrency: formData.defaultCurrency ? formData.defaultCurrency.trim().toUpperCase() : 'INR',
      tdsApplicable: Boolean(formData.tdsApplicable),
      tdsSection: formData.tdsApplicable && formData.tdsSection ? formData.tdsSection.trim() : null,
      tdsRate: formData.tdsApplicable ? valTdsRate : 0,
      isActive: Boolean(formData.isActive)
    };


    try {
      if (isEditing) {
        const response = await updateMutation.mutateAsync({ id: initialData.id, ...payload });
        dispatch(addAlert({ type: 'success', message: 'Vendor updated successfully' }));
        onSuccess?.(response?.data || response);
      } else {
        const response = await createMutation.mutateAsync(payload);
        dispatch(addAlert({ type: 'success', message: 'Vendor created successfully' }));
        onSuccess?.(response?.data || response);
      }
      onClose();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to save vendor' }));
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex justify-center items-center z-[400] p-4">
        <div className="bg-white dark:bg-[#161922] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl animate-slide-up border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden rounded-md">
        
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/80 dark:bg-[#1D212C] shrink-0">
          <h2 className="text-base font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight">
            {isEditing ? 'Edit Vendor' : 'Create New Vendor'}
          </h2>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-[#2A2F3D] rounded-md transition-colors">
            <X size={18} className="stroke-[2.5]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar bg-white dark:bg-[#161922]">
          <form id="vendor-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
            
            <div className="space-y-6">
              {/* Basic Information */}
            <div>
              <h3 className="text-xs font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider mb-3 pb-2 border-b border-zinc-100 dark:border-[#2A2F3D]">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                <div className="space-y-1.5 max-w-md">
                  <label className="text-[9.6px] font-semibold text-zinc-700 dark:text-[#A0A6B5]">Vendor Code</label>
                  <input type="text" name="vendorCode" value={formData.vendorCode} onChange={handleInputChange} className="w-full h-9 px-3 bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] font-medium text-zinc-900 dark:text-[#E6E8EE] focus:bg-white dark:focus:bg-[#161922] focus:border-zinc-900 dark:focus:border-blue-500 focus:ring-0 outline-none transition-all uppercase placeholder:normal-case placeholder:text-zinc-400" />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <label className="text-[9.6px] font-semibold text-zinc-700 dark:text-[#A0A6B5]">Vendor Name <span className="text-red-500">*</span></label>
                  <input type="text" name="vendorName" value={formData.vendorName} onChange={handleInputChange} className="w-full h-9 px-3 bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] font-medium text-zinc-900 dark:text-[#E6E8EE] focus:bg-white dark:focus:bg-[#161922] focus:border-zinc-900 dark:focus:border-blue-500 focus:ring-0 outline-none transition-all placeholder:text-zinc-400" required />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <label className="text-[9.6px] font-semibold text-zinc-700 dark:text-[#A0A6B5]">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full h-9 px-3 bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] font-medium text-zinc-900 dark:text-[#E6E8EE] focus:bg-white dark:focus:bg-[#161922] focus:border-zinc-900 dark:focus:border-blue-500 focus:ring-0 outline-none transition-all placeholder:text-zinc-400" />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <label className="text-[9.6px] font-semibold text-zinc-700 dark:text-[#A0A6B5]">Phone</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full h-9 px-3 bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] font-medium text-zinc-900 dark:text-[#E6E8EE] focus:bg-white dark:focus:bg-[#161922] focus:border-zinc-900 dark:focus:border-blue-500 focus:ring-0 outline-none transition-all placeholder:text-zinc-400" />
                </div>
              </div>
            </div>

            {/* Address Details */}
            <div>
              <h3 className="text-xs font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider mb-3 pb-2 border-b border-zinc-100 dark:border-[#2A2F3D]">Address Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[9.6px] font-semibold text-zinc-700 dark:text-[#A0A6B5]">Address Line 1</label>
                  <input type="text" name="addressLine1" value={formData.addressLine1} onChange={handleInputChange} className="w-full h-9 px-3 bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] font-medium text-zinc-900 dark:text-[#E6E8EE] focus:bg-white dark:focus:bg-[#161922] focus:border-zinc-900 dark:focus:border-blue-500 focus:ring-0 outline-none transition-all placeholder:text-zinc-400" />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <label className="text-[9.6px] font-semibold text-zinc-700 dark:text-[#A0A6B5]">City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full h-9 px-3 bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] font-medium text-zinc-900 dark:text-[#E6E8EE] focus:bg-white dark:focus:bg-[#161922] focus:border-zinc-900 dark:focus:border-blue-500 focus:ring-0 outline-none transition-all placeholder:text-zinc-400" />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <label className="text-[9.6px] font-semibold text-zinc-700 dark:text-[#A0A6B5]">State</label>
                  <input type="text" name="state" value={formData.state} onChange={handleInputChange} className="w-full h-9 px-3 bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] font-medium text-zinc-900 dark:text-[#E6E8EE] focus:bg-white dark:focus:bg-[#161922] focus:border-zinc-900 dark:focus:border-blue-500 focus:ring-0 outline-none transition-all placeholder:text-zinc-400" />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <label className="text-[9.6px] font-semibold text-zinc-700 dark:text-[#A0A6B5]">Country</label>
                  <input type="text" name="country" value={formData.country} onChange={handleInputChange} className="w-full h-9 px-3 bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] font-medium text-zinc-900 dark:text-[#E6E8EE] focus:bg-white dark:focus:bg-[#161922] focus:border-zinc-900 dark:focus:border-blue-500 focus:ring-0 outline-none transition-all placeholder:text-zinc-400" />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <label className="text-[9.6px] font-semibold text-zinc-700 dark:text-[#A0A6B5]">Pin Code</label>
                  <input type="text" name="pinCode" value={formData.pinCode} onChange={handleInputChange} className="w-full h-9 px-3 bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] font-medium text-zinc-900 dark:text-[#E6E8EE] focus:bg-white dark:focus:bg-[#161922] focus:border-zinc-900 dark:focus:border-blue-500 focus:ring-0 outline-none transition-all placeholder:text-zinc-400" />
                </div>
              </div>
            </div>
          </div>
            
          <div className="space-y-6">
              {/* Financial Details */}
            <div>
              <h3 className="text-xs font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider mb-3 pb-2 border-b border-zinc-100 dark:border-[#2A2F3D]">Financial Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                <div className="space-y-1.5 max-w-md">
                  <label className="text-[9.6px] font-semibold text-zinc-700 dark:text-[#A0A6B5]">Payable Account <span className="text-red-500">*</span></label>
                  <SearchableAccountSelect
                    accounts={payableAccounts}
                    apGroup={apGroup}
                    value={formData.payableAccountId}
                    onChange={handleInputChange}
                    onCreateNew={(name) => {
                      setNewAccountName(name || '');
                      setIsAccountModalOpen(true);
                    }}
                    isLoading={isLoadingAccounts}
                    onSearch={loadAccounts}
                    required
                  />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <label className="text-[9.6px] font-semibold text-zinc-700 dark:text-[#A0A6B5]">Credit Limit (₹) <span className="text-red-500">*</span></label>
                  <input type="number" step="0.01" name="creditLimit" value={formData.creditLimit} onChange={handleInputChange} className="w-full h-9 px-3 bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] font-medium text-zinc-900 dark:text-[#E6E8EE] focus:bg-white dark:focus:bg-[#161922] focus:border-zinc-900 dark:focus:border-blue-500 focus:ring-0 outline-none transition-all placeholder:text-zinc-400" />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <label className="text-[9.6px] font-semibold text-zinc-700 dark:text-[#A0A6B5]">Opening Balance</label>
                  <input type="number" step="0.01" name="openingBalance" value={formData.openingBalance} onChange={handleInputChange} className="w-full h-9 px-3 bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] font-medium text-zinc-900 dark:text-[#E6E8EE] focus:bg-white dark:focus:bg-[#161922] focus:border-zinc-900 dark:focus:border-blue-500 focus:ring-0 outline-none transition-all placeholder:text-zinc-400" />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <label className="text-[9.6px] font-semibold text-zinc-700 dark:text-[#A0A6B5]">Opening Balance Date</label>
                  <input type="date" name="openingBalanceDate" value={formData.openingBalanceDate} onChange={handleInputChange} className="w-full h-9 px-3 bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] font-medium text-zinc-900 dark:text-[#E6E8EE] focus:bg-white dark:focus:bg-[#161922] focus:border-zinc-900 dark:focus:border-blue-500 focus:ring-0 outline-none transition-all placeholder:text-zinc-400" />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <label className="text-[9.6px] font-semibold text-zinc-700 dark:text-[#A0A6B5]">Payment Term (Days)</label>
                  <input type="number" name="paymentTermDays" value={formData.paymentTermDays} onChange={handleInputChange} className="w-full h-9 px-3 bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] font-medium text-zinc-900 dark:text-[#E6E8EE] focus:bg-white dark:focus:bg-[#161922] focus:border-zinc-900 dark:focus:border-blue-500 focus:ring-0 outline-none transition-all placeholder:text-zinc-400" />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <label className="text-[9.6px] font-semibold text-zinc-700 dark:text-[#A0A6B5]">Default Currency</label>
                  <div className="h-9 flex items-center px-3 text-[10.4px] font-medium text-zinc-800 bg-zinc-50/50 rounded-md">
                    {formData.defaultCurrency} - Company Currency
                  </div>
                </div>
              </div>
            </div>

            {/* Tax & Compliance */}
            <div>
              <h3 className="text-xs font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider mb-3 pb-2 border-b border-zinc-100 dark:border-[#2A2F3D]">Tax & Compliance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                <div className="space-y-1.5 max-w-md">
                  <label className="text-[9.6px] font-semibold text-zinc-700 dark:text-[#A0A6B5]">GSTIN</label>
                  <input type="text" name="gstin" value={formData.gstin} onChange={handleInputChange} className="w-full h-9 px-3 bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] font-medium text-zinc-900 dark:text-[#E6E8EE] focus:bg-white dark:focus:bg-[#161922] focus:border-zinc-900 dark:focus:border-blue-500 focus:ring-0 outline-none transition-all uppercase placeholder:normal-case placeholder:text-zinc-400" />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <label className="text-[9.6px] font-semibold text-zinc-700 dark:text-[#A0A6B5]">PAN Number</label>
                  <input type="text" name="panNo" value={formData.panNo} onChange={handleInputChange} className="w-full h-9 px-3 bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] font-medium text-zinc-900 dark:text-[#E6E8EE] focus:bg-white dark:focus:bg-[#161922] focus:border-zinc-900 dark:focus:border-blue-500 focus:ring-0 outline-none transition-all uppercase placeholder:normal-case placeholder:text-zinc-400" />
                </div>
                
                <div className="md:col-span-2 pt-2 flex flex-row items-center gap-8 pb-1">
                  <label className="flex items-center gap-2.5 cursor-pointer group w-max">
                    <input 
                      type="checkbox" 
                      id="tdsApplicable" 
                      name="tdsApplicable" 
                      checked={Boolean(formData.tdsApplicable)} 
                      onChange={handleInputChange} 
                      className="w-4 h-4 rounded-md border-zinc-300 text-zinc-900 focus:ring-0 focus:ring-offset-0 cursor-pointer transition-colors" 
                    />
                    <span className="text-[10.4px] font-bold text-zinc-700 select-none group-hover:text-zinc-900 dark:text-[#E6E8EE] dark:group-hover:text-white transition-colors">TDS Applicable</span>
                  </label>
                  
                  <label className="flex items-center gap-2.5 cursor-pointer group w-max">
                    <input 
                      type="checkbox" 
                      id="isActive" 
                      name="isActive" 
                      checked={Boolean(formData.isActive)} 
                      onChange={handleInputChange} 
                      className="w-4 h-4 rounded-md border-zinc-300 text-zinc-900 focus:ring-0 focus:ring-offset-0 cursor-pointer transition-colors" 
                    />
                    <span className="text-[10.4px] font-bold text-zinc-700 select-none group-hover:text-zinc-900 dark:text-[#E6E8EE] dark:group-hover:text-white transition-colors">Active Vendor <span className="text-red-500">*</span></span>
                  </label>
                </div>

                {Boolean(formData.tdsApplicable) && (
                  <>
                    <div className="space-y-1.5 max-w-md">
                      <label className="text-[9.6px] font-semibold text-zinc-700 dark:text-[#A0A6B5]">TDS Section</label>
                      <CustomSelect 
                        name="tdsSection" 
                        value={formData.tdsSection} 
                        onChange={handleInputChange} 
                        className="w-full h-9 px-3 bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] font-medium text-zinc-900 dark:text-[#E6E8EE] focus:bg-white dark:focus:bg-[#161922] focus:border-zinc-900 dark:focus:border-blue-500 focus:ring-0 outline-none transition-all"
                      >
                        <option value="">— Select Section —</option>
                        <option value="194C">194C - Payments to Contractors</option>
                        <option value="194J">194J - Professional / Technical Services</option>
                        <option value="194H">194H - Commission or Brokerage</option>
                        <option value="194I">194I - Rent</option>
                        <option value="194Q">194Q - Purchase of Goods</option>
                        <option value="194A">194A - Interest</option>
                      </CustomSelect>
                    </div>
                    <div className="space-y-1.5 max-w-md">
                      <label className="text-[9.6px] font-semibold text-zinc-700 dark:text-[#A0A6B5]">TDS Rate (%)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        max="100"
                        name="tdsRate" 
                        value={formData.tdsRate} 
                        onChange={handleInputChange} 
                        className="w-full h-9 px-3 bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] font-medium text-zinc-900 dark:text-[#E6E8EE] focus:bg-white dark:focus:bg-[#161922] focus:border-zinc-900 dark:focus:border-blue-500 focus:ring-0 outline-none transition-all placeholder:text-zinc-400" 
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 gap-3 border-t border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/80 dark:bg-[#1D212C] px-5 py-4 justify-end">
          <button type="button" onClick={onClose} className="px-5 py-2 text-[10.4px] font-bold text-zinc-700 dark:text-[#A0A6B5] hover:text-zinc-900 dark:hover:text-[#E6E8EE] hover:bg-zinc-200/50 dark:hover:bg-[#2A2F3D] bg-white dark:bg-[#161922] border border-zinc-300 dark:border-[#2A2F3D] rounded-md transition-all active:scale-95">
            Cancel
          </button>
          <button type="submit" form="vendor-form" className="flex items-center justify-center gap-2 px-5 py-2 text-[10.4px] font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none" disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Vendor'}
          </button>
        </div>

        </div>
      </div>

      {/* Create Account Modal */}
      <ChartOfAccountsModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        mode="create"
        account={{ groupId: apGroup?.id, accountType: 'CREDIT', accountName: newAccountName }}
        groups={accountGroups}
        allAccounts={accounts}
        createAccount={handleCreateAccountSubmit}
      />
    </>
  );
}
