import { TableRowSkeleton, TableSkeleton, ListSkeleton } from '../../../components/common/SkeletonLoader';
import React, { useState } from 'react'
import { Search, PackageOpen } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useGetBatchesQuery } from '../../../api/inventory'
import ApiFilterBar from '../../../components/common/ApiFilterBar'
import SortableHeader from '../../../components/common/SortableHeader'
import Pagination from '../../../components/common/Pagination'
import useApiFilters from '../../../hooks/useApiFilters'
import FILTER_CONFIGS from '../../../constants/filterConfigs'

export default function BatchesPage() {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
  const { filterBarProps, paginationProps, sortBy, setSortBy, sortOrder, setSortOrder, filters, page, pageSize, handleColumnSort } = useApiFilters(FILTER_CONFIGS.batches, { defaultPageSize: 10, defaultSortBy: 'id-desc' });

  const search = filterBarProps.searchTerm || '';
  const statusFilter = filters.status || '';
  
  
  const { data: batches = [], isLoading, refetch } = useGetBatchesQuery(companyId)

  const filtered = batches.filter(b => {
    const matchesSearch = b.product?.toLowerCase().includes(search.toLowerCase()) || b.id?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? b.qualityStatus === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    const valA = sortBy === 'product' ? a.product : (sortBy === 'stage' ? a.stage : a.id);
    const valB = sortBy === 'product' ? b.product : (sortBy === 'stage' ? b.stage : b.id);
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
 <h1 className="page-title">Batch Tracking & QC</h1>
 <p className="page-subtitle">Track manufacturing lots and quality control status</p>
 </div>
 </div>

 <ApiFilterBar 
    {...filterBarProps}
    onRefresh={refetch}
    isLoading={isLoading}
  />

 <div className="erp-table-container">
 {isLoading ? (
 <div className="p-6 w-full"><TableSkeleton columns={5} rows={3} /></div>
 ) : (
 <div className="overflow-x-auto">
 <table className="erp-table">
 <thead>
 <tr>
                <th className="w-12 text-center">S.No.</th>
 <SortableHeader field="id" label="Batch Number" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
 <SortableHeader field="product" label="Product" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
 <SortableHeader field="stage" label="Stage" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
 <th>Operator</th>
 <th>Time</th>
 <th>QC Status</th>
 <th></th>
 </tr>
 </thead>
 <tbody className="staggered-list">
 {paginated.length === 0 && (
   <tr>
     <td colSpan={8}>
       <div className="p-8 text-center border-2 border-dashed border-zinc-200 m-4 rounded-xl">
         <PackageOpen className="mx-auto text-zinc-300 mb-3" size={28} />
         <p className="text-sm font-medium text-zinc-600">No batches found</p>
         <p className="text-xs text-zinc-400 mt-1">Adjust your filters or create a new batch.</p>
       </div>
     </td>
   </tr>
 )}
 {paginated.map((b, index) => (
 <tr key={b.id}>
                    <td className="text-center font-medium text-zinc-500">{(page * (pageSize || 10)) + index + 1}</td>
 <td>
 <div className="flex items-center gap-2">
 <PackageOpen size={14} className="text-zinc-400" />
 <span className="font-mono text-xs font-semibold text-primary">{b.id}</span>
 </div>
 </td>
 <td className="font-medium">{b.product}</td>
 <td className="text-zinc-500">{b.stage}</td>
 <td className="font-medium text-zinc-700">{b.operator}</td>
 <td className="text-xs font-mono text-zinc-500 bg-zinc-50 px-2 py-1 rounded inline-block">{b.timestamp}</td>
 <td>
 <span className={`badge ${
 b.qualityStatus === 'Passed' ? 'badge-success' :
 b.qualityStatus === 'Rejected' ? 'badge-danger' : 'badge-warning'
 }`}>
 {b.qualityStatus}
 </span>
 </td>
 <td>
 <button className="text-xs text-primary hover:underline font-medium">QC Report</button>
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
       itemName="batches"
     />
   </div>
 )}
 </div>
 </div>
 )

}
