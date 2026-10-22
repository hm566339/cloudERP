import { TableRowSkeleton, TableSkeleton, ListSkeleton } from '../../../components/common/SkeletonLoader';
import React, { useState } from 'react'
import { Calendar as CalendarIcon, Download, Search, CheckCircle, XCircle } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useGetAttendanceQuery } from '../../../api/hr'
import ApiFilterBar from '../../../components/common/ApiFilterBar'
import ExportModal from '../../../components/common/ExportModal'
import SortableHeader from '../../../components/common/SortableHeader'
import Pagination from '../../../components/common/Pagination'
import useApiFilters from '../../../hooks/useApiFilters'
import FILTER_CONFIGS from '../../../constants/filterConfigs'
import { getSerialNumber } from '../../../utils/serialNumberHelper'

export default function AttendancePage() {
 const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
  const { filterBarProps, paginationProps, sortBy, setSortBy, sortOrder, setSortOrder, filters, page, pageSize, handleColumnSort } = useApiFilters(FILTER_CONFIGS.attendance, { defaultPageSize: 10, defaultSortBy: 'name-asc' });

  const search = filterBarProps.searchTerm || '';
  const statusFilter = filters.status || '';
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  
 const { data: attendance = [], isLoading, refetch } = useGetAttendanceQuery(companyId)

 const filtered = attendance.filter(a => {
   const matchesSearch = a.name?.toLowerCase().includes(search.toLowerCase()) || a.id?.toLowerCase().includes(search.toLowerCase());
   const matchesStatus = statusFilter ? a.status === statusFilter : true;
   return matchesSearch && matchesStatus;
 });

  const sorted = [...filtered].sort((a, b) => {
    const valA = sortBy === 'name' ? a.name : (sortBy === 'hours' ? parseFloat(a.hours || 0) : a.checkIn);
    const valB = sortBy === 'name' ? b.name : (sortBy === 'hours' ? parseFloat(b.hours || 0) : b.checkIn);
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
 <h1 className="page-title">Daily Attendance</h1>
 <p className="page-subtitle">Track employee check-ins and check-outs</p>
 </div>
 <div className="flex items-center gap-2">
 <button className="btn-secondary"><CalendarIcon size={15} /> Select Date</button>
 <button onClick={() => setIsExportModalOpen(true)} className="btn-secondary"><Download size={15} /> Export</button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
 <div className="kpi-card">
 <p className="kpi-label mb-1">Total Employees</p>
 <p className="kpi-value">124</p>
 </div>
 <div className="kpi-card">
 <p className="kpi-label mb-1">Present</p>
 <p className="kpi-value text-emerald-600 dark:text-emerald-400">112</p>
 </div>
 <div className="kpi-card">
 <p className="kpi-label mb-1">Absent</p>
 <p className="kpi-value text-red-600 dark:text-red-400">8</p>
 </div>
 <div className="kpi-card">
 <p className="kpi-label mb-1">On Leave</p>
 <p className="kpi-value text-amber-600 dark:text-amber-400">4</p>
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
 <SortableHeader field="name" label="Employee" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
 <th>Status</th>
 <SortableHeader field="checkIn" label="Check In" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
 <th>Check Out</th>
 <SortableHeader field="hours" label="Total Hours" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
 </tr>
 </thead>
 <tbody className="staggered-list">
 {paginated.length === 0 && (
   <tr>
     <td colSpan={6}>
       <div className="p-8 text-center border-2 border-dashed border-zinc-200 dark:border-border-dark m-4 rounded-xl">
         <CalendarIcon className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3" size={28} />
         <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">No attendance records found</p>
         <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Adjust your filters or select a different date.</p>
       </div>
     </td>
   </tr>
 )}
 {paginated.map((a, index) => (
 <tr key={a.id}>
                    <td className="text-center font-medium text-zinc-500 dark:text-zinc-400 tabular-nums">{getSerialNumber({ page, pageSize, rowIndex: index, pageBase: 0 })}</td>
 <td className="font-medium">
 <div className="flex items-center gap-2">
 <span className="text-zinc-800 dark:text-zinc-200">{a.name}</span>
 <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">({a.id})</span>
 </div>
 </td>
 <td>
 <span className={`badge ${
 a.status === 'Present' ? 'badge-success' :
 a.status === 'Absent' ? 'badge-danger' : 'badge-warning'
 }`}>
 {a.status === 'Present' ? <CheckCircle size={12} className="mr-1" /> : null}
 {a.status === 'Absent' ? <XCircle size={12} className="mr-1" /> : null}
 {a.status}
 </span>
 </td>
 <td className="text-zinc-500 dark:text-zinc-400">{a.checkIn}</td>
 <td className="text-zinc-500 dark:text-zinc-400">{a.checkOut}</td>
 <td className="font-medium text-zinc-700 dark:text-zinc-300">{a.hours}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 {!isLoading && (
   <div className="p-4 border-t border-zinc-100 dark:border-border-dark bg-white dark:bg-card-dark rounded-b-xl">
      <Pagination
        {...paginationProps}
        totalPages={totalPages}
        totalElements={filtered.length}
        itemName="attendance records"
      />
   </div>
 )}
 </div>
  <ExportModal
    isOpen={isExportModalOpen}
    onClose={() => setIsExportModalOpen(false)}
    reportName="attendance-report"
  />
 </div>
 )

}
