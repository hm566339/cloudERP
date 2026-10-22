import { TableRowSkeleton, TableSkeleton, ListSkeleton } from '../../../components/common/SkeletonLoader';
import React, { useState } from 'react'
import { Search, Plus, Play, Square, Pause, Filter, Send, CheckCircle2 } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { 
  useGetProductionSchedulesQuery, 
  useCreateProductionScheduleMutation, 
  useSubmitProductionOrderMutation,
  useReleaseProductionOrderMutation,
  useUpdateProductionScheduleStatusMutation 
} from '../../../api/inventory'
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
  const [submitProductionOrder] = useSubmitProductionOrderMutation()
  const [releaseProductionOrder] = useReleaseProductionOrderMutation()
  const [updateProductionScheduleStatus] = useUpdateProductionScheduleStatusMutation()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [viewingOrder, setViewingOrder] = useState(null)

  const handleCreateOrder = async (payload) => {
    try {
      await createProductionSchedule(payload).unwrap()
      setIsFormOpen(false)
      dispatch(addAlert({ type: 'success', message: 'Production order created successfully' }))
      refetch()
    } catch (err) {
      const errMsg = err?.data?.message || err?.error || 'Failed to create production order'
      dispatch(addAlert({ type: 'error', message: errMsg }))
    }
  }

  const handleSubmitForApproval = async (id) => {
    try {
      await submitProductionOrder({ id }).unwrap()
      dispatch(addAlert({ type: 'success', message: 'Order submitted for approval' }))
      refetch()
    } catch (err) {
      const errMsg = err?.data?.message || err?.error || 'Failed to submit order'
      dispatch(addAlert({ type: 'error', message: errMsg }))
    }
  }

  const handleReleaseOrder = async (id) => {
    try {
      await releaseProductionOrder(id).unwrap()
      dispatch(addAlert({ type: 'success', message: 'Order released to production' }))
      refetch()
    } catch (err) {
      const errMsg = err?.data?.message || err?.error || 'Failed to release order'
      dispatch(addAlert({ type: 'error', message: errMsg }))
    }
  }

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateProductionScheduleStatus({ id, status }).unwrap()
      dispatch(addAlert({ type: 'success', message: `Order status updated to ${status}` }))
      refetch()
    } catch (err) {
      const errMsg = err?.data?.message || err?.error || 'Failed to update order status'
      dispatch(addAlert({ type: 'error', message: errMsg }))
    }
  }

  const filtered = orders.filter(o => {
    const orderNo = o.productionOrderNo || o.id || '';
    const prodName = o.bom?.name || o.product || '';
    const matchesSearch = prodName.toLowerCase().includes(search.toLowerCase()) || orderNo.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? (o.status === statusFilter || (o.status || '').toLowerCase() === statusFilter.toLowerCase()) : true;
    return matchesSearch && matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    const getVal = (item, field) => {
      if (field === 'product') return item.bom?.name || item.product || '';
      if (field === 'startDate') return item.plannedStartDate || item.startDate || '';
      return item.productionOrderNo || item.id || '';
    };
    const valA = getVal(a, sortBy);
    const valB = getVal(b, sortBy);
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase()
    switch(s) {
      case 'COMPLETED': return 'badge-success'
      case 'RELEASED':
      case 'IN_PROGRESS':
      case 'IN PROGRESS': return 'badge-primary bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400'
      case 'APPROVED': return 'badge-info bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
      case 'SUBMITTED':
      case 'PENDING_APPROVAL':
      case 'PAUSED': return 'badge-warning'
      case 'CANCELLED':
      case 'REJECTED': return 'badge-danger bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
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
                  <SortableHeader field="product" label="Product / BOM" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
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
                      <div className="p-8 text-center border-2 border-dashed border-zinc-200 dark:border-border-dark m-4 rounded-xl">
                        <Play className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3" size={28} />
                        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">No production orders found</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Adjust your filters or create a new order.</p>
                      </div>
                    </td>
                  </tr>
                )}
                {paginated.map(o => {
                  const produced = o.producedQuantity !== undefined ? Number(o.producedQuantity) : (Number(o.produced) || 0)
                  const planned = o.plannedQuantity !== undefined ? Number(o.plannedQuantity) : (Number(o.targetQty) || 0)
                  const progress = planned > 0 ? Math.min(Math.round((produced / planned) * 100), 100) : 0
                  const displayId = o.productionOrderNo || o.id
                  const displayProduct = o.bom?.name || o.product || 'Standard Assembly'
                  const displayStart = o.plannedStartDate || o.startDate || '-'
                  const displayEnd = o.plannedEndDate || o.estCompletion || '-'

                  return (
                    <tr key={o.id}>
                      <td><span className="font-mono text-xs font-semibold text-primary dark:text-blue-400">{displayId}</span></td>
                      <td className="font-medium text-zinc-800 dark:text-zinc-200">{displayProduct}</td>
                      <td className="text-zinc-500 dark:text-zinc-400 text-xs">{displayStart}</td>
                      <td className="text-zinc-500 dark:text-zinc-400 text-xs">{displayEnd}</td>
                      <td>
                        <div className="flex flex-col gap-1 w-full max-w-[110px]">
                          <div className="flex justify-between text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                            <span>{produced} / {planned}</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full bg-zinc-100 dark:bg-surface-dark rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${progress}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td><span className={`badge ${getStatusBadge(o.status)}`}>{o.status}</span></td>
                      <td className="text-right">
                        <div className="flex justify-end items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
                          {o.status === 'DRAFT' && (
                            <button onClick={() => handleSubmitForApproval(o.id)} className="btn-secondary text-xs py-1 px-2 text-primary hover:text-primary flex items-center gap-1" title="Submit for Approval">
                              <Send size={12} /> Submit
                            </button>
                          )}
                          {o.status === 'APPROVED' && (
                            <button onClick={() => handleReleaseOrder(o.id)} className="btn-secondary text-xs py-1 px-2 text-emerald-600 hover:text-emerald-700 flex items-center gap-1" title="Release to Production">
                              <CheckCircle2 size={12} /> Release
                            </button>
                          )}
                          {(o.status === 'RELEASED' || o.status === 'IN_PROGRESS' || o.status === 'In Progress') && (
                            <button onClick={() => handleUpdateStatus(o.id, 'COMPLETED')} className="hover:text-zinc-900 dark:hover:text-zinc-100 p-1" title="Complete Order">
                              <Square size={15} />
                            </button>
                          )}
                          <button onClick={() => setViewingOrder(o)} className="text-xs text-primary dark:text-blue-400 hover:underline font-medium ml-1">
                            View
                          </button>
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
          <div className="p-4 border-t border-zinc-100 dark:border-border-dark bg-white dark:bg-card-dark rounded-b-xl">
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
        data={viewingOrder ? {
          "Order ID": viewingOrder.productionOrderNo || viewingOrder.id,
          "BOM Name": viewingOrder.bom?.name || viewingOrder.product || 'Standard Assembly',
          "Status": viewingOrder.status,
          "Planned Quantity": viewingOrder.plannedQuantity,
          "Produced Quantity": viewingOrder.producedQuantity,
          "Scrap Quantity": viewingOrder.scrapQuantity,
          "Start Date": viewingOrder.plannedStartDate || viewingOrder.startDate || '-',
          "End Date": viewingOrder.plannedEndDate || viewingOrder.estCompletion || '-',
          "Priority": viewingOrder.priority || 'MEDIUM',
          "Notes": viewingOrder.notes || 'None'
        } : {}}
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
