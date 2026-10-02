import React, { useState, useEffect } from 'react';
import { X, SlidersHorizontal, Search, RefreshCw, XCircle } from 'lucide-react';
import useUrlFilters from '../../../hooks/useUrlFilters';

export default function CustomerFilterPanel({ isOpen, onClose }) {
  const { filters, setFilter, resetFilters, searchTerm, setSearchTerm } = useUrlFilters();
  const [localSearch, setLocalSearch] = useState(searchTerm);
  
  // Local state for all fields so we don't spam the URL on every keystroke for complex forms
  const [localFilters, setLocalFilters] = useState({
    customerCode: filters.customerCode || '',
    customerName: filters.customerName || '',
    email: filters.email || '',
    phone: filters.phone || '',
    gstin: filters.gstin || '',
    pan: filters.pan || '',
    city: filters.city || '',
    state: filters.state || '',
    country: filters.country || '',
    isActive: filters.isActive || '',
    minCreditLimit: filters.minCreditLimit || '',
    maxCreditLimit: filters.maxCreditLimit || '',
    createdFrom: filters.createdFrom || '',
    createdTo: filters.createdTo || '',
    updatedFrom: filters.updatedFrom || '',
    updatedTo: filters.updatedTo || '',
    ids: filters.ids || '',
  });

  // Sync local search when URL changes
  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  // Sync local filters when URL changes
  useEffect(() => {
    setLocalFilters({
      customerCode: filters.customerCode || '',
      customerName: filters.customerName || '',
      email: filters.email || '',
      phone: filters.phone || '',
      gstin: filters.gstin || '',
      pan: filters.pan || '',
      city: filters.city || '',
      state: filters.state || '',
      country: filters.country || '',
      isActive: filters.isActive || '',
      minCreditLimit: filters.minCreditLimit || '',
      maxCreditLimit: filters.maxCreditLimit || '',
      createdFrom: filters.createdFrom || '',
      createdTo: filters.createdTo || '',
      updatedFrom: filters.updatedFrom || '',
      updatedTo: filters.updatedTo || '',
      ids: filters.ids || '',
    });
  }, [filters]);

  const activeFilterCount = Object.values(localFilters).filter(val => val !== '').length + (localSearch ? 1 : 0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApply = () => {
    // Search
    if (localSearch !== searchTerm) {
      setSearchTerm(localSearch);
    }
    // Filters
    Object.entries(localFilters).forEach(([key, value]) => {
      setFilter(key, value || undefined);
    });
    if (window.innerWidth < 1024) onClose();
  };

  const handleClear = () => {
    setLocalSearch('');
    resetFilters();
    setLocalFilters({
      customerCode: '', customerName: '', email: '', phone: '',
      gstin: '', pan: '', city: '', state: '', country: '',
      isActive: '', minCreditLimit: '', maxCreditLimit: '',
      createdFrom: '', createdTo: '', updatedFrom: '', updatedTo: '',
      ids: ''
    });
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Filter Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 right-0 z-50
        w-[272px] bg-white border-l border-zinc-200
        transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 lg:hidden'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-white border border-zinc-200 rounded-lg shadow-sm">
              <SlidersHorizontal className="w-4 h-4 text-zinc-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-zinc-900">Filters</h3>
              <p className="text-xs text-zinc-500 font-medium">{activeFilterCount} active filter{activeFilterCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 rounded-lg transition-colors lg:hidden text-zinc-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          
          {/* Global Search inside Panel */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold tracking-wider text-zinc-500 uppercase">Global Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text"
                placeholder="Search anything..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleApply()}
              />
              {localSearch && (
                <button onClick={() => setLocalSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="h-px bg-zinc-100" />

          {/* Identification */}
          <div className="space-y-4">
            <label className="text-xs font-bold tracking-wider text-zinc-500 uppercase">Identification</label>
            <div className="space-y-3">
              <input type="text" name="customerName" value={localFilters.customerName} onChange={handleInputChange} placeholder="Customer Name" className="input-field w-full" />
              <input type="text" name="customerCode" value={localFilters.customerCode} onChange={handleInputChange} placeholder="Customer Code" className="input-field w-full font-mono text-sm" />
              <input type="text" name="ids" value={localFilters.ids} onChange={handleInputChange} placeholder="Customer IDs (comma-separated)" className="input-field w-full font-mono text-sm" />
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <label className="text-xs font-bold tracking-wider text-zinc-500 uppercase">Contact</label>
            <div className="space-y-3">
              <input type="email" name="email" value={localFilters.email} onChange={handleInputChange} placeholder="Email Address" className="input-field w-full" />
              <input type="text" name="phone" value={localFilters.phone} onChange={handleInputChange} placeholder="Phone Number" className="input-field w-full font-mono text-sm" />
            </div>
          </div>

          {/* Tax & Legal */}
          <div className="space-y-4">
            <label className="text-xs font-bold tracking-wider text-zinc-500 uppercase">Tax & Legal</label>
            <div className="space-y-3">
              <input type="text" name="gstin" value={localFilters.gstin} onChange={handleInputChange} placeholder="GSTIN" className="input-field w-full uppercase" />
              <input type="text" name="pan" value={localFilters.pan} onChange={handleInputChange} placeholder="PAN" className="input-field w-full uppercase" />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <label className="text-xs font-bold tracking-wider text-zinc-500 uppercase">Location</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" name="city" value={localFilters.city} onChange={handleInputChange} placeholder="City" className="input-field w-full" />
              <input type="text" name="state" value={localFilters.state} onChange={handleInputChange} placeholder="State" className="input-field w-full" />
              <input type="text" name="country" value={localFilters.country} onChange={handleInputChange} placeholder="Country" className="input-field w-full col-span-2" />
            </div>
          </div>

          <div className="h-px bg-zinc-100" />

          {/* Status */}
          <div className="space-y-3">
            <label className="text-xs font-bold tracking-wider text-zinc-500 uppercase">Status</label>
            <div className="grid grid-cols-3 gap-2">
              {['', 'true', 'false'].map((status) => (
                <button
                  key={status}
                  onClick={() => setLocalFilters(prev => ({ ...prev, isActive: status }))}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all border ${
                    localFilters.isActive === status
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  {status === '' ? 'All' : status === 'true' ? 'Active' : 'Inactive'}
                </button>
              ))}
            </div>
          </div>

          {/* Financials */}
          <div className="space-y-3">
            <label className="text-xs font-bold tracking-wider text-zinc-500 uppercase">Credit Limit (₹)</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" step="0.01" name="minCreditLimit" value={localFilters.minCreditLimit} onChange={handleInputChange} placeholder="Min" className="input-field w-full text-sm font-mono" />
              <input type="number" step="0.01" name="maxCreditLimit" value={localFilters.maxCreditLimit} onChange={handleInputChange} placeholder="Max" className="input-field w-full text-sm font-mono" />
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-3">
            <label className="text-xs font-bold tracking-wider text-zinc-500 uppercase">Created Date</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" name="createdFrom" value={localFilters.createdFrom} onChange={handleInputChange} className="input-field w-full text-sm" />
              <input type="date" name="createdTo" value={localFilters.createdTo} onChange={handleInputChange} className="input-field w-full text-sm" />
            </div>
          </div>
          <div className="space-y-3 pb-4">
            <label className="text-xs font-bold tracking-wider text-zinc-500 uppercase">Updated Date</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" name="updatedFrom" value={localFilters.updatedFrom} onChange={handleInputChange} className="input-field w-full text-sm" />
              <input type="date" name="updatedTo" value={localFilters.updatedTo} onChange={handleInputChange} className="input-field w-full text-sm" />
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-100 bg-white grid grid-cols-2 gap-3 shrink-0">
          <button 
            onClick={handleClear}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-50 text-zinc-600 rounded-xl font-semibold text-sm hover:bg-zinc-100 hover:text-zinc-900 transition-colors border border-zinc-200"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </button>
          <button 
            onClick={handleApply}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
