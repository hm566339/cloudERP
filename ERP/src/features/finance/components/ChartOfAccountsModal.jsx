import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import CustomSelect from '../../../components/common/CustomSelect';
import Modal from '../../../components/common/Modal';
import { AccountNature } from '../../../constants/accountingEnums';
import { chartOfAccountsApi } from '../../../api/account';
import AccountGroupForm from './AccountGroupForm';
import { accountGroupsApi } from '../../../api/account/accountGroups';
import { useApiMutation } from '../../../hooks/useApi';
import { Plus, X } from 'lucide-react';

export default function ChartOfAccountsModal({
  isOpen,
  onClose,
  mode, // 'create', 'edit', 'view'
  account, // null or account object
  groups = [],
  allAccounts = [],
  companyId,
  createAccount,
  updateAccount,
  isCreating,
  isUpdating,
  canEdit,
  onSwitchToEdit,
  onSuccess
}) {
  const [formData, setFormData] = useState({
    accountCode: '',
    accountName: '',
    groupId: '',
    parentAccountId: '',
    accountType: 'DEBIT',
    postingAllowed: true,
    isActive: true,
    openingBalance: ''
  });

  const [apiParentAccounts, setApiParentAccounts] = useState([]);
  const [isLoadingParents, setIsLoadingParents] = useState(false);

  // Fetch parent accounts (postingAllowed = false) from backend API
  const loadParentAccounts = useCallback(async () => {
    setIsLoadingParents(true);
    try {
      const res = await chartOfAccountsApi.getList({
        size: 1000,
        sortBy: 'accountCode',
        sortDir: 'asc'
      });
      const body = res?.data ?? res;
      const list = body?.content ?? body?.items ?? body?.data ?? (Array.isArray(body) ? body : (Array.isArray(res) ? res : []));
      setApiParentAccounts(list);
    } catch (err) {
      console.error("Failed to load parent accounts from API", err);
    } finally {
      setIsLoadingParents(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadParentAccounts();
      if (account && (mode === 'edit' || mode === 'view')) {
        setFormData({
          accountCode: account.accountCode || '',
          accountName: account.accountName || '',
          groupId: account.groupId || (account.group?.id || ''),
          parentAccountId: account.parentAccountId || (account.parentAccount?.id || ''),
          accountType: account.accountType || 'DEBIT',
          postingAllowed: account.postingAllowed ?? true,
          isActive: account.isActive ?? true,
          openingBalance: account.openingBalance || 0
        });
      } else {
        setFormData({
          accountCode: account?.accountCode || '',
          accountName: account?.accountName || '',
          groupId: account?.groupId || '',
          parentAccountId: account?.parentAccountId || '',
          accountType: account?.accountType || 'DEBIT',
          postingAllowed: account?.postingAllowed ?? true,
          isActive: account?.isActive ?? true,
          openingBalance: '0'
        });
      }
    }
  }, [isOpen, account, mode, loadParentAccounts]);

  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);
  const [initialGroupData, setInitialGroupData] = useState(null);
  const [newlyCreatedGroups, setNewlyCreatedGroups] = useState([]);

  // Combine groups
  const displayGroups = useMemo(() => {
    const existing = groups || [];
    const existingIds = new Set(existing.map(g => g.id));
    const newG = newlyCreatedGroups.filter(g => !existingIds.has(g.id));
    return [...existing, ...newG];
  }, [groups, newlyCreatedGroups]);

  const { mutateAsync: createGroupAsync, isLoading: isCreatingGroup } = useApiMutation(accountGroupsApi.create);

  const handleCreateGroupSubmit = async (data) => {
    try {
      const res = await createGroupAsync(data);
      const createdGroup = res.data || data; 
      setNewlyCreatedGroups(prev => [...prev, createdGroup]);
      setFormData(prev => ({ ...prev, groupId: createdGroup.id }));
      setIsGroupFormOpen(false);
    } catch (err) {
      console.error('Failed to create group', err);
    }
  };

  const handleInputChange = (e) => {
    if (mode === 'view') return;
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const [isParentAccountFormOpen, setIsParentAccountFormOpen] = useState(false);
  const [initialParentAccountData, setInitialParentAccountData] = useState(null);
  const [newlyCreatedParentAccounts, setNewlyCreatedParentAccounts] = useState([]);

  // Combine API loaded accounts and passed allAccounts prop, filtering strictly for postingAllowed === false
  const eligibleParentAccounts = useMemo(() => {
    // Prefer backend API results, fall back to allAccounts prop
    const sourceList = apiParentAccounts.length > 0 ? apiParentAccounts : (allAccounts || []);
    
    // Add newly created parent accounts
    const existingIds = new Set(sourceList.map(a => a.id));
    const newA = newlyCreatedParentAccounts.filter(a => !existingIds.has(a.id));
    const combinedList = [...sourceList, ...newA];

    return combinedList.filter(a => {
      // Exclude self when editing to avoid circular parent references
      const isNotSelf = mode !== 'edit' || String(a.id) !== String(account?.id);
      return isNotSelf;
    });
  }, [apiParentAccounts, allAccounts, newlyCreatedParentAccounts, mode, account]);

  // Construct options with '-- No Parent (Root) --' at the top and format 'Account Code - Account Name'
  const parentAccountOptions = useMemo(() => {
    const rootOption = { value: "", label: "-- No Parent (Root) --" };
    
    const accountOptions = eligibleParentAccounts.map(a => ({
      value: a.id,
      label: a.accountCode ? `${a.accountCode} - ${a.accountName}` : a.accountName,
      accountCode: a.accountCode,
      accountName: a.accountName
    }));

    return [rootOption, ...accountOptions];
  }, [eligibleParentAccounts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'view') {
      onClose();
      return;
    }

    try {
      const rawPayload = {
        accountCode: formData.accountCode || undefined,
        accountName: formData.accountName,
        groupId: formData.groupId || null,
        parentAccountId: formData.parentAccountId || null,
        accountType: formData.accountType,
        postingAllowed: formData.postingAllowed,
        isActive: formData.isActive,
        openingBalance: parseFloat(formData.openingBalance) || 0
      };

      let result;
      if (mode === 'edit' && account) {
        result = await updateAccount({ id: account.id, ...rawPayload });
      } else {
        result = await createAccount(rawPayload);
      }

      if (result && result.success === false) {
        throw new Error(result.message || 'Failed to save account');
      }
      if (onSuccess) {
        onSuccess(result?.data);
      }
      onClose();
    } catch (err) {
      const responseData = err?.response?.data || err?.data;
      const fieldErrors = responseData?.errors && Array.isArray(responseData.errors)
        ? responseData.errors.join(', ')
        : responseData?.data && typeof responseData.data === 'object'
          ? Object.entries(responseData.data).map(([field, message]) => `${field}: ${message}`).join(', ')
          : '';
      const message = fieldErrors || responseData?.message || err?.message || 'Unknown error';
      alert(`Error saving account: ${message}`);
    }
  };

  const title = mode === 'create' ? 'Create Account' : mode === 'edit' ? 'Edit Account' : 'View Account';
  const isReadOnly = mode === 'view';

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-md shadow-2xl flex flex-col overflow-hidden animate-slide-up border border-zinc-200">
        
        {/* Header - Sticky */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-zinc-200 bg-zinc-50/80 shrink-0">
          <h2 className="text-base font-bold text-zinc-900 tracking-tight">
            {title}
          </h2>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Body - Overflow handling */}
        <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar bg-white">
          <form id="chart-of-accounts-form" onSubmit={handleSubmit} className="flex flex-col gap-y-6">

        {isReadOnly && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-wrap gap-4 justify-between items-center mb-6">
            <div className="text-sm">
              <span className="text-slate-500 font-medium">Created: </span>
              <span className="text-slate-900 font-semibold">{account?.createdAt ? new Date(account.createdAt).toLocaleString() : 'N/A'}</span>
            </div>
            <div className="text-sm">
              <span className="text-slate-500 font-medium">Updated: </span>
              <span className="text-slate-900 font-semibold">{account?.updatedAt ? new Date(account.updatedAt).toLocaleString() : 'N/A'}</span>
            </div>
          </div>
        )}

          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-3 pb-2 border-b border-zinc-100">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5 max-w-md">
            <label className="text-sm font-semibold text-zinc-700">Account Code</label>
            <input
              type="text"
              name="accountCode"
              value={formData.accountCode}
              onChange={handleInputChange}
              className={`input-field w-full font-mono ${isReadOnly ? 'bg-zinc-50 opacity-80 cursor-not-allowed' : ''}`}
              readOnly={isReadOnly}
              placeholder="e.g. 1000"
              pattern="^[a-zA-Z0-9\-]+$"
              title="Account code can only contain letters, numbers, and dashes"
              maxLength={20}
            />
          </div>
          <div className="space-y-1.5 max-w-md">
            <label className="text-sm font-semibold text-zinc-700">Account Name *</label>
            <input
              type="text"
              name="accountName"
              value={formData.accountName}
              onChange={handleInputChange}
              className={`input-field w-full ${isReadOnly ? 'bg-zinc-50 opacity-80 cursor-not-allowed' : ''}`}
              required
              readOnly={isReadOnly}
              placeholder="e.g. Cash in Hand"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5 max-w-md">
            <label className="text-sm font-semibold text-zinc-700">Account Type *</label>
            <CustomSelect
              required
              name="accountType"
              value={formData.accountType}
              onChange={handleInputChange}
              placeholder="Select Type"
              disabled={isReadOnly}
              searchable={false}
              options={AccountNature}
            />
          </div>
          <div className="space-y-1.5 max-w-md">
            <label className="text-sm font-semibold text-zinc-700">Account Group *</label>
            <CustomSelect
              required
              name="groupId"
              value={formData.groupId}
              onChange={handleInputChange}
              placeholder="Select Group"
              disabled={isReadOnly}
              searchable={true}
              options={displayGroups.map(g => ({ value: g.id, label: g.name }))}
              bottomAction={({ searchTerm, closeDropdown }) => {
                const noData = displayGroups.length === 0;
                if (!searchTerm && !noData) return null;
                
                return (
                  <button
                    type="button"
                    onClick={() => {
                      closeDropdown();
                      setInitialGroupData(searchTerm ? { name: searchTerm } : null);
                      setIsGroupFormOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-[10.4px] text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors flex items-center gap-2"
                  >
                    <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <Plus size={14} className="text-primary" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold truncate">Create {searchTerm ? `"${searchTerm}"` : 'New Account Group'}</span>
                      <span className="text-[8.8px] text-zinc-500">Add as new account group</span>
                    </div>
                  </button>
                );
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5 max-w-md">
            <label className="text-sm font-semibold text-zinc-700">Parent Account</label>
            <CustomSelect
              name="parentAccountId"
              value={formData.parentAccountId}
              onChange={handleInputChange}
              placeholder="-- No Parent (Root) --"
              emptyMessage="No parent accounts available."
              disabled={isReadOnly}
              searchable={true}
              isLoading={isLoadingParents}
              options={parentAccountOptions}
              bottomAction={({ searchTerm, closeDropdown }) => {
                const noData = eligibleParentAccounts.length === 0;
                if (!searchTerm && !noData) return null;
                
                return (
                  <button
                    type="button"
                    onClick={() => {
                      closeDropdown();
                      setInitialParentAccountData(searchTerm ? { accountName: searchTerm, postingAllowed: false } : { postingAllowed: false });
                      setIsParentAccountFormOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-[10.4px] text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors flex items-center gap-2"
                  >
                    <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <Plus size={14} className="text-primary" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold truncate">Create {searchTerm ? `"${searchTerm}"` : 'New Parent Account'}</span>
                      <span className="text-[8.8px] text-zinc-500">Add as new parent account</span>
                    </div>
                  </button>
                );
              }}
            />
          </div>
          <div className="space-y-1.5 max-w-md">
            <label className="text-sm font-semibold text-zinc-700">Opening Balance</label>
            <input
              type="number"
              step="0.01"
              name="openingBalance"
              value={formData.openingBalance}
              onChange={handleInputChange}
              placeholder="e.g. 0.00"
              readOnly={isReadOnly}
              className={`input-field w-full text-right font-mono ${isReadOnly ? 'bg-zinc-50 opacity-80 cursor-not-allowed' : ''}`}
            />
          </div>
        </div>

        <div className="flex gap-8 pt-4 pb-2 mt-5">
          <label className={`flex items-center gap-2.5 group ${isReadOnly ? 'cursor-default opacity-80' : 'cursor-pointer'}`}>
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                disabled={isReadOnly}
                className="peer sr-only"
              />
              <div className="w-5 h-5 rounded-[4.8px] border-2 border-zinc-300 bg-white peer-checked:bg-primary peer-checked:border-primary transition-all"></div>
              <div className="absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <span className="text-sm font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">Active Account</span>
          </label>

          <label className={`flex items-center gap-2.5 group ${isReadOnly ? 'cursor-default opacity-80' : 'cursor-pointer'}`}>
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                name="postingAllowed"
                checked={formData.postingAllowed}
                onChange={handleInputChange}
                disabled={isReadOnly}
                className="peer sr-only"
              />
              <div className="w-5 h-5 rounded-[4.8px] border-2 border-zinc-300 bg-white peer-checked:bg-primary peer-checked:border-primary transition-all"></div>
              <div className="absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <span className="text-sm font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">Posting Allowed</span>
          </label>
        </div>
      </div>
    </div>
  </form>
        </div>

        {/* Footer - Sticky */}
        <div className="flex justify-end items-center gap-3 px-5 py-4 border-t border-zinc-200 bg-zinc-50/80 shrink-0">
          {isReadOnly ? (
            <>
              {canEdit && (
                <button type="button" onClick={onSwitchToEdit} className="btn-secondary">
                  Edit Account
                </button>
              )}
              <button type="button" onClick={onClose} className="btn-primary">
                Close
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={onClose} className="px-5 py-2 text-[10.4px] font-bold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200/50 bg-white border border-zinc-300 rounded-md transition-all active:scale-95">
                Cancel
              </button>
              <button type="submit" form="chart-of-accounts-form" className="flex items-center gap-2 px-5 py-2 text-[10.4px] font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-all active:scale-95" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? 'Saving...' : 'Save Account'}
              </button>
            </>
          )}
        </div>
      </div>

      {isGroupFormOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] rounded-md shadow-2xl flex flex-col overflow-hidden animate-slide-up border border-zinc-200">
            <div className="flex justify-between items-center px-5 py-4 border-b border-zinc-200 bg-zinc-50/80 shrink-0">
              <h2 className="text-base font-bold text-zinc-900 tracking-tight">Create Account Group</h2>
              <button 
                type="button" 
                onClick={() => setIsGroupFormOpen(false)} 
                className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors active:scale-95"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar bg-white">
              <AccountGroupForm
                initialData={initialGroupData}
                onSubmit={handleCreateGroupSubmit}
                onCancel={() => setIsGroupFormOpen(false)}
                isLoading={isCreatingGroup}
              />
            </div>
          </div>
        </div>
      )}

      {isParentAccountFormOpen && (
        <ChartOfAccountsModal
          isOpen={isParentAccountFormOpen}
          onClose={() => setIsParentAccountFormOpen(false)}
          mode="create"
          account={initialParentAccountData}
          groups={displayGroups}
          allAccounts={allAccounts}
          companyId={companyId}
          createAccount={async (data) => {
            const res = await createAccount(data);
            const createdAcc = res?.data || data;
            setNewlyCreatedParentAccounts(prev => [...prev, createdAcc]);
            setFormData(prev => ({ ...prev, parentAccountId: createdAcc.id }));
            setIsParentAccountFormOpen(false);
            return res;
          }}
          isCreating={isCreating}
        />
      )}
    </div>,
    document.body
  );
}
