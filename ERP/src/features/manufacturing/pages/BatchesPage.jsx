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
import { getSerialNumber } from '../../../utils/serialNumberHelper'

export default function BatchesPage() {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
  const { filterBarProps, paginationProps, sortBy, setSortBy, sortOrder, setSortOrder, filters, page, pageSize, handleColumnSort } = useApiFilters(FILTER_CONFIGS.batches, { defaultPageSize: 10, defaultSortBy: 'id-desc' });

  const search = filterBarProps.searchTerm || '';
  const statusFilter = filters.status || '';
  
  const { data: batches = [], isLoading, refetch } = useGetBatchesQuery(companyId)

  const filtered = batches.filter(b => {
    const batchNum = b.batchNumber || b.id || '';
    const prod = b.product || b.productId || '';
    const matchesSearch = prod.toLowerCase().includes(search.toLowerCase()) || batchNum.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? (b.status === statusFilter || b.qualityStatus === statusFilter) : true;
    return matchesSearch && matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    const getVal = (item, field) => {
      if (field === 'product') return item.product || item.productId || '';
      return item.batchNumber || item.id || '';
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
    if (s === 'ACTIVE' || s === 'PASSED' || s === 'AVAILABLE') return 'badge-success'
    if (s === 'EXPIRED' || s === 'REJECTED') return 'badge-danger bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
    return 'badge-warning'
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Batch Tracking & QC</h1>
          <p className="page-subtitle">Track inventory batches, manufacturing lots, and quality status</p>
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
                  <SortableHeader field="product" label="Product / Item" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
                  <th>Mfg Date</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="staggered-list">
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="p-8 text-center border-2 border-dashed border-zinc-200 dark:border-border-dark m-4 rounded-xl">
                        <PackageOpen className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3" size={28} />
                        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">No batches found</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">No batches recorded for this company in inventory.</p>
                      </div>
                    </td>
                  </tr>
                )}
                {paginated.map((b, index) => {
                  const batchNo = b.batchNumber || b.id
                  const productLabel = b.product || b.productId || 'Stock Item'
                  const mfgDate = b.manufacturingDate || (b.createdAt ? b.createdAt.substring(0, 10) : '-')
                  const expDate = b.expiryDate || '-'
                  const status = b.status || b.qualityStatus || 'ACTIVE'

                  return (
                    <tr key={b.id || index}>
                      <td className="text-center font-medium text-zinc-500 dark:text-zinc-400 tabular-nums">
                        {getSerialNumber({ page, pageSize, rowIndex: index, pageBase: 0 })}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <PackageOpen size={14} className="text-zinc-400 dark:text-zinc-500" />
                          <span className="font-mono text-xs font-semibold text-primary dark:text-blue-400">{batchNo}</span>
                        </div>
                      </td>
                      <td className="font-medium text-zinc-800 dark:text-zinc-200">{productLabel}</td>
                      <td className="text-zinc-500 dark:text-zinc-400 text-xs">{mfgDate}</td>
                      <td className="text-zinc-500 dark:text-zinc-400 text-xs">{expDate}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(status)}`}>
                          {status}
                        </span>
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
              itemName="batches"
            />
          </div>
        )}
      </div>
    </div>
  )
}
