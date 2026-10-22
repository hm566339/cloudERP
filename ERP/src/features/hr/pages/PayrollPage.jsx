import { TableRowSkeleton, TableSkeleton, ListSkeleton } from '../../../components/common/SkeletonLoader';
import React, { useState } from 'react'
import { Download, Search, IndianRupee } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useGetPayrollQuery, useProcessPayrollMutation } from '../../../api/hr'
import ProcessPayrollModal from '../components/ProcessPayrollModal'
import DataDetailsModal from '../../../components/common/DataDetailsModal'
import FilterBar from '../../../components/common/FilterBar'
import ApiFilterBar from '../../../components/common/ApiFilterBar'
import SortableHeader from '../../../components/common/SortableHeader'
import Pagination from '../../../components/common/Pagination'
import useApiFilters from '../../../hooks/useApiFilters'
import FILTER_CONFIGS from '../../../constants/filterConfigs'
import { getSerialNumber } from '../../../utils/serialNumberHelper'
import { useAppDispatch } from '../../../app/hooks'
import { addAlert } from '../../notifications/notificationSlice'

export default function PayrollPage() {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
  const { filterBarProps, paginationProps, sortBy, setSortBy, sortOrder, setSortOrder, filters, page, pageSize, handleColumnSort } = useApiFilters(FILTER_CONFIGS.payroll, { defaultPageSize: 10, defaultSortBy: 'name-asc' });

  const search = filterBarProps.searchTerm || '';
  const statusFilter = filters.status || '';
  
  
  const dispatch = useAppDispatch()
  
  const { data: payroll = [], isLoading, refetch } = useGetPayrollQuery(companyId)
  const [processPayroll] = useProcessPayrollMutation()
  const [isProcessOpen, setIsProcessOpen] = useState(false)
  const [viewingPayroll, setViewingPayroll] = useState(null)

  const handleProcessPayroll = async (data) => {
    await processPayroll(data)
    setIsProcessOpen(false)
    dispatch(addAlert({ type: 'success', message: 'Payroll processed successfully for all active employees.' }))
  }

  const filtered = payroll.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? p.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    const valA = sortBy === 'name' ? a.name : (sortBy === 'net' ? a.net : a.department);
    const valB = sortBy === 'name' ? b.name : (sortBy === 'net' ? b.net : b.department);
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
 <h1 className="page-title">Payroll Management</h1>
 <p className="page-subtitle">Process and view employee salaries (May 2026)</p>
 </div>
 <div className="flex items-center gap-2">
 <button className="btn-secondary"><Download size={15} /> Download Payslips</button>
 <button onClick={() => setIsProcessOpen(true)} className="btn-primary"><IndianRupee size={15} /> Process Payroll</button>
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
 <th>Department</th>
 <th className="text-right">Basic (₹)</th>
 <th className="text-right">Allowances (₹)</th>
 <th className="text-right">Deductions (₹)</th>
 <SortableHeader field="net" label="Net Salary (₹)" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
 <th>Status</th>
 <th></th>
 </tr>
 </thead>
 <tbody className="staggered-list">
 {paginated.length === 0 && (
   <tr>
     <td colSpan={9}>
       <div className="p-8 text-center border-2 border-dashed border-zinc-200 dark:border-border-dark m-4 rounded-xl">
         <IndianRupee className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3" size={28} />
         <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">No payroll records found</p>
         <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Adjust filters or process payroll.</p>
       </div>
     </td>
   </tr>
 )}
 {paginated.map((p, index) => (
 <tr key={p.id}>
                    <td className="text-center font-medium text-zinc-500 dark:text-zinc-400 tabular-nums">{getSerialNumber({ page, pageSize, rowIndex: index, pageBase: 0 })}</td>
 <td className="font-medium text-zinc-800 dark:text-zinc-200">{p.name}</td>
 <td className="text-zinc-600 dark:text-zinc-300">{p.department}</td>
 <td className="text-right text-zinc-600 dark:text-zinc-300">{p.basic.toLocaleString()}</td>
 <td className="text-right text-emerald-600 dark:text-emerald-400">+{p.allowances.toLocaleString()}</td>
 <td className="text-right text-red-500 dark:text-red-400">-{p.deductions.toLocaleString()}</td>
 <td className="text-right font-bold text-zinc-900 dark:text-zinc-100">₹{p.net.toLocaleString()}</td>
 <td>
 <span className={`badge ${p.status === 'Processed' ? 'badge-success' : 'badge-warning'}`}>
 {p.status}
 </span>
 </td>
 <td><button onClick={() => setViewingPayroll(p)} className="text-xs text-primary dark:text-blue-400 hover:underline font-medium">Details</button></td>
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
       itemName="payroll records"
     />
   </div>
 )}
 </div>
 <ProcessPayrollModal 
   isOpen={isProcessOpen} 
   onClose={() => setIsProcessOpen(false)} 
   onSubmit={handleProcessPayroll} 
 />
 <DataDetailsModal 
   isOpen={!!viewingPayroll} 
   onClose={() => setViewingPayroll(null)} 
   data={viewingPayroll} 
   title="Payroll Details" 
 />
 </div>
 )
}

