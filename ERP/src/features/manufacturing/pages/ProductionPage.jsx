import { TableRowSkeleton, TableSkeleton, ListSkeleton } from '../../../components/common/SkeletonLoader';
import React, { useState } from 'react'
import { Search, Plus, Play, Square, Pause, Filter } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useGetProductionSchedulesQuery, useCreateProductionScheduleMutation, useUpdateProductionScheduleStatusMutation } from '../../../api/inventory'
import ProductionOrderFormModal from '../components/ProductionOrderFormModal'
import DataDetailsModal from '../../../components/common/DataDetailsModal'
import WorkflowActionButtons from '../../workflows/components/WorkflowActionButtons'
import ApiFilterBar from '../../../components/common/ApiFilterBar'
import SortableHeader from '../../../components/common/SortableHeader'
import Pagination from '../../../components/common/Pagination'
import useApiFilters from '../../../hooks/useApiFilters'
import FILTER_CONFIGS from '../../../constants/filterConfigs'
import { useAppDispatch } from '../../../app/hooks'
import { addAlert } from '../../notifications/notificationSlice'

export default function ProductionPage() {

  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
  const { filterBarProps, paginationProps, sortBy, setSortBy, sortOrder, setSortOrder, filters, page, pageSize, handleColumnSort } = useApiFilters(FILTER_CONFIGS.productionOrders, { defaultPageSize: 10, defaultSortBy: 'id-desc' });

  const search = filterBarProps.searchTerm || '';
  const statusFilter = filters.status || '';
  
  
  const dispatch = useAppDispatch()
  
  const { data: orders = [], isLoading, refetch } = useGetProductionSchedulesQuery(companyId)
  const [createProductionSchedule] = useCreateProductionScheduleMutation()
  const [updateProductionScheduleStatus] = useUpdateProductionScheduleStatusMutation()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [viewingOrder, setViewingOrder] = useState(null)

  const handleCreateOrder = async (data) => {
    await createProductionSchedule(data)
    setIsFormOpen(false)
    dispatch(addAlert({ type: 'success', message: 'Production order created successfully' }))
  }

  const handleUpdateStatus = async (id, status) => {
    await updateProductionScheduleStatus({ id, status })
    dispatch(addAlert({ type: 'success', message: `Order status changed to ${status}` }))
  }

  const filtered = orders.filter(o => {
    const matchesSearch = o.product?.toLowerCase().includes(search.toLowerCase()) || o.id?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? o.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    const valA = sortBy === 'product' ? a.product : (sortBy === 'startDate' ? a.startDate : a.id);
    const valB = sortBy === 'product' ? b.product : (sortBy === 'startDate' ? b.startDate : b.id);
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

 const getStatusBadge = (status) => {
 switch(status) {
 case 'Completed': return 'badge-success'
 case 'In Progress': return 'badge-primary bg-primary/10 text-primary'
 case 'Paused': return 'badge-warning'
 default: return 'badge-draft'
 }
 }

 return (
 <div className="animate-fade-in">
 <div className="page-header">
 <div>
 <h1 className="page-title">Production Orders</h1>
 <p className="page-subtitle">Manage and track active manufacturing orders</p>
 </div>
 <div className="flex items-center gap-2">
 <button className="btn-secondary"><Filter size={15} /> Filter</button>
 <button onClick={() => setIsFormOpen(true)} className="btn-primary"><Plus size={15} /> Create Order</button>
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
 <SortableHeader field="id" label="Order ID" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
 <SortableHeader field="product" label="Product" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
 <SortableHeader field="startDate" label="Start Date" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
 <th>Est. Completion</th>
 <th>Progress (Qty)</th>
 <th>Status</th>
 <th className="text-right">Controls</th>
 </tr>
 </thead>
 <tbody className="staggered-list">
 {paginated.length === 0 && (
   <tr>
     <td colSpan="7">
       <div className="p-8 text-center border-2 border-dashed border-zinc-200 m-4 rounded-xl">
         <Play className="mx-auto text-zinc-300 mb-3" size={28} />
         <p className="text-sm font-medium text-zinc-600">No production orders found</p>
         <p className="text-xs text-zinc-400 mt-1">Adjust your filters or create a new order.</p>
       </div>
     </td>
   </tr>
 )}
 {paginated.map(o => {
 const progress = (o.produced / o.targetQty) * 100
 return (
 <tr key={o.id}>
 <td><span className="font-mono text-xs font-semibold text-primary">{o.id}</span></td>
 <td className="font-medium">{o.product}</td>
 <td className="text-zinc-500">{o.startDate}</td>
 <td className="text-zinc-500">{o.estCompletion}</td>
 <td>
 <div className="flex flex-col gap-1 w-full max-w-[96px]">
 <div className="flex justify-between text-[8px] font-medium text-zinc-600">
 <span>{o.produced} / {o.targetQty}</span>
 <span>{progress.toFixed(0)}%</span>
 </div>
 <div className="w-full bg-zinc-100 rounded-full h-1.5">
 <div className={`h-1.5 rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-primary/10'}`} style={{ width: `${progress}%` }}></div>
 </div>
 </div>
 </td>
 <td><span className={`badge ${getStatusBadge(o.status)}`}>{o.status}</span></td>
 <td className="text-right">
 <div className="flex justify-end gap-1 text-zinc-400">
 {o.status === 'Not Started' && <button onClick={() => handleUpdateStatus(o.id, 'In Progress')} className="hover:text-emerald-600 p-1" title="Start Production"><Play size={16} /></button>}
 {o.status === 'In Progress' && <button onClick={() => handleUpdateStatus(o.id, 'Paused')} className="hover:text-amber-600 p-1" title="Pause"><Pause size={16} /></button>}
 {o.status === 'In Progress' && <button onClick={() => handleUpdateStatus(o.id, 'Completed')} className="hover:text-zinc-900 p-1" title="Complete"><Square size={16} /></button>}
 {o.status === 'Paused' && <button onClick={() => handleUpdateStatus(o.id, 'In Progress')} className="hover:text-emerald-600 p-1" title="Resume"><Play size={16} /></button>}
 <button onClick={() => setViewingOrder(o)} className="text-xs text-primary hover:underline font-medium ml-2">View</button>
 </div>
 </td>
 </tr>
 )
 })}
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
        itemName="production orders"
      />
   </div>
 )}
 </div>
 <ProductionOrderFormModal 
   isOpen={isFormOpen} 
   onClose={() => setIsFormOpen(false)} 
   onSubmit={handleCreateOrder} 
 />
 <DataDetailsModal 
   isOpen={!!viewingOrder} 
   onClose={() => setViewingOrder(null)} 
   data={viewingOrder} 
   title="Production Order Details"
   actions={
     viewingOrder && (
       <WorkflowActionButtons
         module="MANUFACTURING"
         documentType="PRODUCTION_ORDER"
         documentId={viewingOrder.id}
         documentStatus={viewingOrder.status}
         onActionComplete={() => {
           refetch?.();
           setViewingOrder(null);
         }}
       />
     )
   }
 />
 </div>
 )
}

