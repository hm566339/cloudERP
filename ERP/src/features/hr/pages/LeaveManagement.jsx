import { TableRowSkeleton, TableSkeleton, ListSkeleton } from '../../../components/common/SkeletonLoader';
import React, { useState } from 'react'
import { Check, X, Search } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useGetLeaveRequestsQuery } from '../../../api/hr'
import ApiFilterBar from '../../../components/common/ApiFilterBar'
import SortableHeader from '../../../components/common/SortableHeader'
import Pagination from '../../../components/common/Pagination'
import useApiFilters from '../../../hooks/useApiFilters'
import FILTER_CONFIGS from '../../../constants/filterConfigs'
import { getSerialNumber } from '../../../utils/serialNumberHelper'

export default function LeavePage() {
 const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
  const { filterBarProps, paginationProps, sortBy, setSortBy, sortOrder, setSortOrder, filters, page, pageSize, handleColumnSort } = useApiFilters(FILTER_CONFIGS.leaveRequests, { defaultPageSize: 10, defaultSortBy: 'employee-asc' });

  const search = filterBarProps.searchTerm || '';
  const statusFilter = filters.status || '';
  const typeFilter = filters.type || '';
  
  

 const { data: requests = [], isLoading, refetch } = useGetLeaveRequestsQuery(companyId)

 const filtered = requests.filter(l => {
   const matchesSearch = l.employee?.toLowerCase().includes(search.toLowerCase());
   const matchesStatus = statusFilter ? l.status === statusFilter : true;
   const matchesType = typeFilter ? l.type === typeFilter : true;
   return matchesSearch && matchesStatus && matchesType;
 });

  const sorted = [...filtered].sort((a, b) => {
    const valA = sortBy === 'employee' ? a.employee : (sortBy === 'days' ? parseFloat(a.days || 0) : a.from);
    const valB = sortBy === 'employee' ? b.employee : (sortBy === 'days' ? parseFloat(b.days || 0) : b.from);
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

 const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
 const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);

 return (
 <div className="animate-fade-in">
 <div className="page-header">
 <div>
 <h1 className="page-title">Leave Requests</h1>
 <p className="page-subtitle">Manage employee leave applications</p>
 </div>
 </div>

 <div className="erp-table-container">
 <ApiFilterBar 
    {...filterBarProps}
    onRefresh={refetch}
    isLoading={isLoading}
  />
 {isLoading ? (
 <div className="p-6 w-full"><TableSkeleton columns={5} rows={3} /></div>
 ) : (
 <div className="overflow-x-auto">
 <table className="erp-table">
 <thead>
 <tr>
                <th className="w-12 text-center">S.No.</th>
 <SortableHeader field="employee" label="Employee" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
 <th>Leave Type</th>
 <th>Duration</th>
 <SortableHeader field="days" label="Days" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
 <th>Reason</th>
 <th>Status</th>
 <th className="text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="staggered-list">
 {paginated.length === 0 && (
   <tr>
     <td colSpan={8}>
       <div className="p-8 text-center border-2 border-dashed border-zinc-200 m-4 rounded-xl">
         <Check className="mx-auto text-zinc-300 mb-3" size={28} />
         <p className="text-sm font-medium text-zinc-600">No leave requests found</p>
         <p className="text-xs text-zinc-400 mt-1">Adjust your filters to see more results.</p>
       </div>
     </td>
   </tr>
 )}
 {paginated.map((l, index) => (
 <tr key={l.id}>
                    <td className="text-center font-medium text-zinc-500 tabular-nums">{getSerialNumber({ page, pageSize, rowIndex: index, pageBase: 0 })}</td>
 <td className="font-medium text-zinc-800">{l.employee}</td>
 <td className="text-zinc-600">{l.type}</td>
 <td className="text-zinc-500 text-xs">
 {l.from} <br />to {l.to}
 </td>
 <td className="font-medium">{l.days}</td>
 <td className="text-zinc-500 truncate max-w-[120px]" title={l.reason}>{l.reason}</td>
 <td>
 <span className={`badge ${
 l.status === 'Approved' ? 'badge-success' :
 l.status === 'Rejected' ? 'badge-danger' : 'badge-warning'
 }`}>{l.status}</span>
 </td>
 <td className="text-right">
 {l.status === 'Pending' && (
 <div className="flex items-center justify-end gap-2">
 <button className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors" title="Approve">
 <Check size={16} />
 </button>
 <button className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors" title="Reject">
 <X size={16} />
 </button>
 </div>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 {!isLoading && (
   <div className="p-4 border-t border-zinc-100 bg-white rounded-b-xl">
      <Pagination
        {...paginationProps}
        totalPages={totalPages}
        totalElements={filtered.length}
        itemName="leave requests"
      />
   </div>
 )}
 </div>
 </div>
 )

}
