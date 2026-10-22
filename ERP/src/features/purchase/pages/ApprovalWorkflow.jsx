import { TableRowSkeleton, TableSkeleton, ListSkeleton } from '../../../components/common/SkeletonLoader';
import React from 'react'
import Pagination from '../../../components/common/Pagination'
import useUrlFilters from '../../../hooks/useUrlFilters'
import { Search, Check, X, Clock } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useGetApprovalsQuery } from '../../../api/purchase'
import SortableHeader from '../../../components/common/SortableHeader'
import { useRoutePath } from "../../../hooks/useRoutePath";
import { getSerialNumber } from '../../../utils/serialNumberHelper';

export default function ApprovalsPage() {
  const { buildPath } = useRoutePath();

 const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
  const { 
    page, setPage, pageSize,
    searchTerm: search, setSearchTerm: setSearch, debouncedSearch,
    sortBy, sortOrder, handleColumnSort
  } = useUrlFilters({ defaultPageSize: 10 });

 const { data: approvals = [], isLoading } = useGetApprovalsQuery(companyId)

  let filtered = approvals.filter(a => 
  a.requestor?.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
  a.item?.toLowerCase().includes(debouncedSearch.toLowerCase())
  )

 if (sortBy) {
   filtered.sort((a, b) => {
     const valA = a[sortBy] ?? '';
     const valB = b[sortBy] ?? '';
     if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
     if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
     return 0;
   });
 }

 const displayedData = filtered.slice(page * pageSize, (page + 1) * pageSize)
 const totalPages = Math.ceil(filtered.length / pageSize)

 return (
 <div className="animate-fade-in">
 <div className="page-header">
 <div>
 <h1 className="page-title">Purchase Approvals</h1>
 <p className="page-subtitle">Review and authorize internal purchase requisitions</p>
 </div>
 </div>

 <div className="erp-table-container">
 <div className="p-4 border-b border-zinc-100 dark:border-[#2A2F3D] flex gap-3 items-center">
 <div className="relative flex-1 min-w-[160px]">
 <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
 <input
 className="input-field pl-9"
 placeholder="Search by requestor or item…"
 value={search}
 onChange={e => setSearch(e.target.value)}
 />
 </div>
 </div>

 {isLoading ? (
 <div className="p-6 w-full"><TableSkeleton columns={5} rows={3} /></div>
 ) : (
 <div className="overflow-x-auto">
 <table className="erp-table">
 <thead>
 <tr>
 <th className="w-12 text-center">S.No.</th>
 <SortableHeader field="id" label="Requisition ID" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
 <SortableHeader field="requestor" label="Requestor / Dept" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
 <SortableHeader field="item" label="Requested Item" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
 <SortableHeader field="qty" label="Qty" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
 <SortableHeader field="total" label="Est. Total (₹)" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} className="text-right" />
 <SortableHeader field="date" label="Date" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
 <th className="text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="staggered-list">
 {displayedData.map((a, index) => (
 <tr key={a.id}>
 <td className="text-center font-medium text-zinc-500 tabular-nums">{getSerialNumber({ page, pageSize, rowIndex: index, pageBase: 0 })}</td>
 <td>
 <span className="font-mono text-xs font-semibold text-amber-600 flex items-center gap-1.5">
 <Clock size={14} /> {a.id}
 </span>
 </td>
 <td>
 <div className="font-medium text-zinc-900">{a.requestor}</div>
 <div className="text-xs text-zinc-500">{a.department}</div>
 </td>
 <td className="font-medium text-zinc-700">{a.item}</td>
 <td className="text-zinc-600">{a.qty}</td>
 <td className="text-right font-bold text-zinc-800"> ₹{a.total.toLocaleString()}
 </td>
 <td className="text-zinc-500">{a.date}</td>
 <td className="text-right">
 <div className="flex justify-end gap-2">
 <button className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors" title="Approve">
 <Check size={16} />
 </button>
 <button className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors" title="Reject">
 <X size={16} />
 </button>
 </div>
 </td>
 </tr>
 ))}
 {filtered.length === 0 && (
 <tr>
 <td colSpan={8} className="text-center py-8 text-zinc-500">No pending approvals</td>
 </tr>
 )}
 </tbody>
 </table>
 <Pagination 
    page={page} 
    onPageChange={setPage} 
    totalPages={totalPages}
    totalElements={filtered.length}
    pageSize={pageSize}
    onPageSizeChange={() => {}} 
  />
 </div>
 )}
 </div>
 </div>
 )
}
