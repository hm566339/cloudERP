import React, { useState } from 'react';
import { Filter, X, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import CustomSelect from '../../../components/common/CustomSelect';

export default function ChartOfAccountsFilterPanel({
  filters,
  setFilter,
  resetFilters,
  groups,
  allAccounts,
  isOpen,
  setIsOpen
}) {
  const accountTypesList = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE', 'INCOME'];

  // Handle multi-select for account types
  const handleAccountTypeChange = (type) => {
    const currentTypes = filters.accountTypes ? filters.accountTypes.split(',') : [];
    let newTypes;
    if (currentTypes.includes(type)) {
      newTypes = currentTypes.filter(t => t !== type);
    } else {
      newTypes = [...currentTypes, type];
    }
    setFilter('accountTypes', newTypes.join(','));
  };

  const currentAccountTypes = filters.accountTypes ? filters.accountTypes.split(',') : [];

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Filter size={18} className="text-indigo-500" />
            Advanced Filters
          </h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 custom-scrollbar">
          
          {/* Basic Identifiers */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Identifiers</h4>
            <div>
              <label className="text-xs font-semibold text-zinc-700 mb-1.5 block">Account Code</label>
              <input 
                type="text" 
                value={filters.accountCode || ''}
                onChange={(e) => setFilter('accountCode', e.target.value)}
                className="input-field w-full text-sm py-1.5"
                placeholder="e.g. 1000"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 mb-1.5 block">Account Name</label>
              <input 
                type="text" 
                value={filters.accountName || ''}
                onChange={(e) => setFilter('accountName', e.target.value)}
                className="input-field w-full text-sm py-1.5"
                placeholder="e.g. Cash"
              />
            </div>
          </div>

          {/* Hierarchy & Classification */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hierarchy</h4>
            <div>
              <label className="text-xs font-semibold text-zinc-700 mb-1.5 block">Group Name</label>
              <CustomSelect
                value={filters.groupName || ''}
                onChange={(e) => setFilter('groupName', e.target.value)}
                options={[
                  { value: '', label: 'All Groups' },
                  ...(groups || []).map(g => ({ value: g.name, label: g.name }))
                ]}
                className="py-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 mb-1.5 block">Parent Account Code</label>
              <CustomSelect
                value={filters.parentAccountCode || ''}
                onChange={(e) => setFilter('parentAccountCode', e.target.value)}
                options={[
                  { value: '', label: 'All Parents' },
                  ...(allAccounts || []).filter(a => a.accountCode).map(a => ({ value: a.accountCode, label: `${a.accountCode} - ${a.accountName}` }))
                ]}
                className="py-1"
              />
            </div>
          </div>

          {/* Dropdowns */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Attributes</h4>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs font-semibold text-zinc-700 mb-1.5 block">Posting Allowed</label>
                <CustomSelect
                  value={filters.postingAllowed || ''}
                  onChange={(e) => setFilter('postingAllowed', e.target.value)}
                  options={[
                    { value: '', label: 'All' },
                    { value: 'true', label: 'Yes' },
                    { value: 'false', label: 'No' }
                  ]}
                  className="py-1"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-zinc-700 mb-1.5 block">Status</label>
                <CustomSelect
                  value={filters.isActive || ''}
                  onChange={(e) => setFilter('isActive', e.target.value)}
                  options={[
                    { value: '', label: 'All' },
                    { value: 'true', label: 'Active' },
                    { value: 'false', label: 'Inactive' }
                  ]}
                  className="py-1"
                />
              </div>
            </div>
          </div>

          {/* Balance Range */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Opening Balance</h4>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs font-semibold text-zinc-700 mb-1.5 block">Min</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={filters.minOpeningBalance || ''}
                  onChange={(e) => setFilter('minOpeningBalance', e.target.value)}
                  className="input-field w-full text-sm py-1.5 font-mono text-right"
                  placeholder="0.00"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-zinc-700 mb-1.5 block">Max</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={filters.maxOpeningBalance || ''}
                  onChange={(e) => setFilter('maxOpeningBalance', e.target.value)}
                  className="input-field w-full text-sm py-1.5 font-mono text-right"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
          
          {/* Date Ranges */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Created Date Range</h4>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs font-semibold text-zinc-700 mb-1.5 block">From</label>
                <input 
                  type="date" 
                  value={filters.createdFrom || ''}
                  onChange={(e) => setFilter('createdFrom', e.target.value)}
                  className="input-field w-full text-sm py-1.5"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-zinc-700 mb-1.5 block">To</label>
                <input 
                  type="date" 
                  value={filters.createdTo || ''}
                  onChange={(e) => setFilter('createdTo', e.target.value)}
                  className="input-field w-full text-sm py-1.5"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Updated Date Range</h4>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs font-semibold text-zinc-700 mb-1.5 block">From</label>
                <input 
                  type="date" 
                  value={filters.updatedFrom || ''}
                  onChange={(e) => setFilter('updatedFrom', e.target.value)}
                  className="input-field w-full text-sm py-1.5"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-zinc-700 mb-1.5 block">To</label>
                <input 
                  type="date" 
                  value={filters.updatedTo || ''}
                  onChange={(e) => setFilter('updatedTo', e.target.value)}
                  className="input-field w-full text-sm py-1.5"
                />
              </div>
            </div>
          </div>

          {/* Account Type Multi Select */}
          <div className="space-y-4 pt-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Account Types (Multi-Select)</h4>
            <div className="flex flex-wrap gap-2">
              {accountTypesList.map(type => (
                <label key={type} className="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors">
                  <input 
                    type="checkbox"
                    checked={currentAccountTypes.includes(type)}
                    onChange={() => handleAccountTypeChange(type)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-300"
                  />
                  <span className="text-sm font-medium text-slate-700">{type}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
