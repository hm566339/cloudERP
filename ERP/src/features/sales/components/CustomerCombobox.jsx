import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Check, ChevronsUpDown, Search, Plus, User, Building2, Phone, Mail, Loader2, X } from 'lucide-react';
import { useSearchCustomersQuery, useGetActiveCustomersQuery } from '../../../api/sales-crm';
import { useParams } from 'react-router-dom';

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function CustomerCombobox({ value, onChange, onAddNewCustomer, error }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef(null);
  
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
  
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data: searchData, isFetching: isSearching } = useSearchCustomersQuery(
    { companyId, search: debouncedSearch, size: 50 },
    { skip: !isOpen || debouncedSearch.trim() === '' }
  );
  
  const { data: activeCustomersData, isFetching: isActiveFetching } = useGetActiveCustomersQuery(
    { companyId },
    { skip: !isOpen && !value } // Need it for initial value display
  );

  const activeCustomers = Array.isArray(activeCustomersData) ? activeCustomersData : activeCustomersData?.data || activeCustomersData?.content || [];
  const searchResults = Array.isArray(searchData) ? searchData : searchData?.data || searchData?.content || [];

  // Determine which list to show: locally filter activeCustomers and merge with any API search results
  const displayCustomers = useMemo(() => {
    if (!debouncedSearch.trim()) return activeCustomers;
    const term = debouncedSearch.trim().toLowerCase();
    const localFiltered = activeCustomers.filter(c => {
      const name = (c.customerName || c.companyName || c.name || '').toLowerCase();
      const code = (c.customerCode || c.code || '').toLowerCase();
      const phone = (c.phone || c.mobile || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      return name.includes(term) || code.includes(term) || phone.includes(term) || email.includes(term);
    });
    const map = new Map();
    [...localFiltered, ...searchResults].forEach(c => {
      if (c && c.id) map.set(c.id, c);
    });
    return Array.from(map.values());
  }, [activeCustomers, searchResults, debouncedSearch]);

  const isFetching = isSearching || (debouncedSearch.trim() === '' && isActiveFetching);

  // Find selected customer for display
  const selectedCustomer = useMemo(() => {
    if (!value) return null;
    return activeCustomers.find(c => c.id === value) || searchResults.find(c => c.id === value);
  }, [value, activeCustomers, searchResults]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        if (selectedCustomer) {
          setSearchTerm(selectedCustomer.customerName || selectedCustomer.companyName || selectedCustomer.name || '');
        } else {
          setSearchTerm('');
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedCustomer]);

  useEffect(() => {
    if (selectedCustomer && !isOpen) {
      setSearchTerm(selectedCustomer.customerName || selectedCustomer.companyName || selectedCustomer.name || '');
    } else if (!value && !isOpen) {
      setSearchTerm('');
    }
  }, [selectedCustomer, value, isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < displayCustomers.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < displayCustomers.length) {
        onChange(displayCustomers[activeIndex].id, displayCustomers[activeIndex]);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  useEffect(() => {
    setActiveIndex(-1);
  }, [debouncedSearch, displayCustomers.length]);

  return (
    <div className={`relative w-full group ${isOpen ? 'z-50' : 'z-10'}`} ref={dropdownRef}>
      {/* Trigger Input */}
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Select Customer..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
            if (e.target.value === '') {
              onChange('');
            }
          }}
          onFocus={() => {
            setIsOpen(true);
            if (value && selectedCustomer) {
              // Select all text on focus for easy replacement
              setSearchTerm(selectedCustomer.customerName || selectedCustomer.companyName || selectedCustomer.name || '');
            }
          }}
          className={`w-full h-8 pl-8 pr-8 bg-white border rounded-md text-[10px] text-zinc-800 placeholder-zinc-400 focus:outline-none transition-all ${
            error ? 'border-red-500 focus:ring-1 focus:ring-red-500 focus:border-red-500' : 'border-zinc-200 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10'
          }`}
          onKeyDown={handleKeyDown}
        />
        {isFetching && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
          </div>
        )}
        {searchTerm && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
              setSearchTerm('');
              setIsOpen(true);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors focus:outline-none"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-full sm:min-w-[260px] max-w-[calc(100vw-2rem)] rounded-xl border border-zinc-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-100 overflow-hidden flex flex-col">


          {/* Customer List (Scrollable) */}
          <div className="max-h-[240px] overflow-y-auto overflow-x-hidden p-1">
            {displayCustomers.length === 0 && !isFetching && !searchTerm && (
              <div className="py-6 text-center text-sm text-zinc-500">
                <p className="text-base mb-1">😕</p>
                No customer found
              </div>
            )}
            
            {displayCustomers.map((customer, index) => {
              const isSelected = value === customer.id;
              const isHighlighted = activeIndex === index;
              const cName = customer.customerName || customer.companyName || customer.name;
              const contactInfo = customer.mobile || customer.phone || customer.email;
              const isMobile = !!(customer.mobile || customer.phone);
              const isCompany = !!customer.companyName;

              return (
                <div
                  key={customer.id}
                  onClick={() => {
                    onChange(customer.id, customer);
                    setIsOpen(false);
                  }}
                  className={`relative flex w-full cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm outline-none transition-colors
                    ${isHighlighted ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-700'}
                    ${isSelected ? 'bg-primary/5 font-medium text-primary' : 'hover:bg-zinc-100 hover:text-zinc-900'}
                  `}
                >
                  <div className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                    {isCompany ? <Building2 size={14} /> : <User size={14} />}
                  </div>
                  
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className={`truncate ${isSelected ? 'font-bold' : 'font-semibold'}`}>
                      {cName}
                    </span>
                    {contactInfo && (
                      <span className="flex items-center gap-1 text-[8.8px] text-zinc-500 truncate mt-0.5">
                        {isMobile ? <Phone size={10} /> : <Mail size={10} />}
                        {contactInfo}
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <Check className="ml-auto h-4 w-4 text-primary shrink-0" />
                  )}
                </div>
              );
            })}

            {/* Dynamic Create Button */}
            {(!searchTerm || !displayCustomers.some(c => (c.customerName || c.companyName || c.name || '').toLowerCase() === searchTerm.toLowerCase())) && (
              <>
                {displayCustomers.length > 0 && <div className="h-px bg-zinc-100 my-1"></div>}
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    if(onAddNewCustomer) onAddNewCustomer(searchTerm);
                  }}
                  className="w-full flex items-start gap-3 p-3 hover:bg-zinc-50 text-left transition-colors rounded-lg"
                >
                  <Plus size={16} className="text-zinc-600 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-zinc-900 text-[10.4px] truncate">
                      {searchTerm ? `Create "${searchTerm}"` : 'Add New Customer'}
                    </div>
                    {searchTerm && (
                      <div className="text-[8.8px] text-zinc-500 mt-0.5 truncate">
                        Add New Customer
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
