import { TableRowSkeleton, TableSkeleton, ListSkeleton } from '../../../components/common/SkeletonLoader';
import React, { useState } from 'react';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { MessageSquare, Mail, Phone, Calendar as CalIcon, Search, Send, Plus, User, AlertCircle } from 'lucide-react';
import { useGetActiveCustomersQuery } from '../../../api/sales-crm';
import Pagination from '../../../components/common/Pagination';

export default function CustomerCommunication() {
  const { data: customersData, isLoading } = useGetActiveCustomersQuery({ page: 1, limit: 100 });
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const { page, setPage, pageSize, searchTerm: search, setSearchTerm: setSearch, debouncedSearch } = useUrlFilters({ defaultPageSize: 10 });

  const customers = Array.isArray(customersData) ? customersData : customersData?.data || customersData?.content || customersData?.items || [];
  
  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );


  const displayedCustomers = filteredCustomers.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filteredCustomers.length / pageSize);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <div className="space-y-6 animate-fade-in p-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">
            <MessageSquare className="text-indigo-500" />
            Customer Communication
          </h1>
          <p className="text-xs text-zinc-500">Unified inbox for client emails, call logs, and meeting notes.</p>
        </div>
        <button className="btn-primary">
          <Plus size={16} /> New Message
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[480px]">
        {/* Inbox List */}
        <div className="w-full lg:w-1/3 card overflow-hidden flex flex-col">
          <div className="p-4 border-b border-zinc-100 shrink-0">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search customers..." 
                className="input-field pl-10 w-full bg-zinc-50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="w-full"><ListSkeleton items={3} /></div>
            ) : filteredCustomers.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-6">No customers found.</p>
            ) : (
              displayedCustomers.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => setSelectedCustomerId(c.id)}
                  className={`p-4 border-b border-zinc-100 cursor-pointer transition-colors ${selectedCustomerId === c.id ? 'bg-indigo-50/50 border-l-4 border-l-indigo-500' : 'hover:bg-zinc-50'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-sm font-semibold text-zinc-700 truncate pr-2">{c.name}</h3>
                    <span className="text-[8px] text-zinc-400 shrink-0 whitespace-nowrap">
                      {c.status === 'ACTIVE' ? <span className="text-emerald-500 font-bold">Active</span> : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-[8px] text-zinc-500 font-medium mb-1.5 flex items-center gap-1.5 truncate">
                    <Mail size={10} className="shrink-0" /> {c.email || 'No email provided'}
                  </p>
                  <p className="text-xs truncate text-zinc-500 flex items-center gap-1">
                    <Phone size={10} className="shrink-0" /> {c.phone || c.mobile || 'No phone provided'}
                  </p>
                </div>
              ))
            )}
          </div>
          {filteredCustomers.length > 0 && (
            <div className="mt-2 px-2 pb-2">
              <Pagination
                page={page}
                onPageChange={setPage}
                totalPages={totalPages}
                totalElements={filteredCustomers.length}
                pageSize={pageSize}
                onPageSizeChange={() => {}}
              />
            </div>
          )}
        </div>

        {/* Chat / Detail View */}
        <div className="w-full lg:w-2/3 card flex flex-col overflow-hidden">
          {!selectedCustomer ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 bg-zinc-50/30">
              <MessageSquare size={48} className="mb-4 text-zinc-300" />
              <p className="text-sm font-bold text-zinc-600">Select a Customer</p>
              <p className="text-xs mt-1 max-w-[200px] text-center">Click a customer from the sidebar to view contact details and log communications.</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-zinc-100 shrink-0 flex items-center justify-between bg-zinc-50/50">
                <div>
                  <h2 className="font-bold text-zinc-900">{selectedCustomer.name}</h2>
                  <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                    <User size={12} /> {selectedCustomer.contactPerson || 'Primary Contact'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-zinc-400 hover:text-indigo-600 btn-secondary tooltip" title="Log Call">
                    <Phone size={16} />
                  </button>
                  <button className="p-2 text-zinc-400 hover:text-amber-600 btn-secondary tooltip" title="Schedule Meeting">
                    <CalIcon size={16} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/30 flex flex-col justify-end">
                 <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <AlertCircle size={32} className="text-zinc-300 mx-auto mb-3" />
                      <p className="text-sm font-bold text-zinc-600">No Communication History</p>
                      <p className="text-xs text-zinc-500 mt-1 max-w-[240px]">
                        Communication history (emails, call logs) is currently not tracked in the backend for this customer.
                      </p>
                    </div>
                 </div>
              </div>

              <div className="p-4 border-t border-zinc-100 shrink-0 bg-white">
                <div className="flex items-center gap-3">
                  <button className="p-2 text-zinc-400 hover:text-zinc-600">
                    <Plus size={20} />
                  </button>
                  <input type="text" placeholder="Type your message or log note..." className="flex-1 input-field bg-zinc-50" />
                  <button className="p-2.5 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 shadow-sm transition-colors">
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
