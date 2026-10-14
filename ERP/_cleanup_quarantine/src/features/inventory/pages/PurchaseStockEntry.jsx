import { TableRowSkeleton, TableSkeleton, ListSkeleton } from '../../../components/common/SkeletonLoader';
import React, { useState } from 'react';
import ExpandedRowDetails from '../components/ExpandedRowDetails';
import { PackagePlus, Search, Check, Save, FileText, AlertCircle } from 'lucide-react';
import { useGetPurchaseOrdersQuery } from '../../../api/purchase';
import useUrlFilters from '../../../hooks/useUrlFilters';
import Pagination from '../../../components/common/Pagination';

export default function PurchaseStockEntry() {
  const { data: poData, isLoading } = useGetPurchaseOrdersQuery({ page: 1, limit: 100 });
  const [selectedPoId, setSelectedPoId] = useState(null);
  
  const {
    page, setPage, pageSize,
    searchTerm: search,
    setSearchTerm: setSearch,
    debouncedSearch
  } = useUrlFilters({ defaultPageSize: 10 });

  const pendingOrders = (poData?.items || poData?.data?.content || poData?.content || poData || []).filter(po => 
    (po.status === 'APPROVED' || po.status === 'PARTIAL') && 
    (!debouncedSearch || po.poNumber?.toLowerCase().includes(debouncedSearch.toLowerCase()) || po.vendor?.name?.toLowerCase().includes(debouncedSearch.toLowerCase()))
  );
  

  const displayedOrders = pendingOrders.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(pendingOrders.length / pageSize);

  const selectedOrder = pendingOrders.find(po => po.id === selectedPoId);

  return (
    <div className="space-y-6 animate-fade-in p-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">
            <PackagePlus className="text-emerald-500" />
            Purchase Stock Entry
          </h1>
          <p className="text-xs text-zinc-500">Receive goods against Purchase Orders and update inventory counts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-4 lg:col-span-1 space-y-4">
          <h3 className="text-sm font-bold text-zinc-800 border-b border-zinc-100 pb-2">Pending Purchase Orders</h3>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search PO number..." 
              className="input-field pl-10 w-full" 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-3 mt-4 h-[320px] overflow-y-auto pr-2">
            {isLoading ? (
              <div className="w-full"><ListSkeleton items={3} /></div>
            ) : pendingOrders.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-4">No pending POs found.</p>
            ) : (
              displayedOrders.map((order, index) => (
                <div 
                  key={order.id} 
                  onClick={() => setSelectedPoId(order.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors group ${selectedPoId === order.id ? 'border-primary bg-primary/10 shadow-sm' : 'border-zinc-200 hover:border-primary'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono text-xs font-bold text-primary">{order.poNumber}</span>
                    <span className="text-[8px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded font-bold">{order.items?.length || 0} Items</span>
                  </div>
                  <p className="text-sm font-bold text-zinc-800 truncate">{order.vendor?.name || 'Unknown Vendor'}</p>
                  <p className="text-[8px] text-amber-600 mt-1 font-semibold">{order.status}</p>
                </div>
              ))
            )}
          </div>
          {pendingOrders.length > 0 && (
            <div className="mt-2">
              <Pagination
                page={page}
                onPageChange={setPage}
                totalPages={totalPages}
                totalElements={pendingOrders.length}
                pageSize={pageSize}
                onPageSizeChange={() => {}}
              />
            </div>
          )}
        </div>

        <div className="card p-4 lg:col-span-2 flex flex-col">
          {!selectedOrder ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 min-h-[320px]">
              <PackagePlus size={48} className="mb-4 text-zinc-300" />
              <p className="text-sm font-bold text-zinc-600">Select a Purchase Order</p>
              <p className="text-xs mt-1">Click a pending PO from the list to begin receiving stock.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                    Receiving: {selectedOrder.poNumber}
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Vendor: {selectedOrder.vendor?.name || 'Unknown'}</p>
                </div>
                <span className="badge bg-blue-50 text-blue-700 border-blue-200 font-bold text-xs">
                  <FileText size={12} className="mr-1" /> View Original PO
                </span>
              </div>

              <div className="erp-table-container mb-6 flex-1">
                <table className="erp-table w-full text-left">
                  <thead>
                    <tr>
                    <th className="w-16">S.No.</th>
                <th className="w-12 text-center">S.No.</th>
                      <th>Product Details</th>
                      <th>Ordered</th>
                      <th>Already Received</th>
                      <th>Receiving Now</th>
                    </tr>
                  </thead>
                  <tbody className="staggered-list">
                    {(selectedOrder.items || []).length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-4 text-xs text-zinc-400">No line items in this PO.</td></tr>
                    ) : (
                      selectedOrder.items.map((lineItem, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50">
                      <td className="text-zinc-500 font-medium">{typeof page !== 'undefined' && typeof size !== 'undefined' ? (page * size) + index + 1 : index + 1}</td>
                    <td className="text-center font-medium text-zinc-500">{idx + 1}</td>
                          <td>
                            <p className="font-bold text-zinc-800 text-sm">{lineItem.item?.name || lineItem.description || 'Unknown Item'}</p>
                            <p className="text-xs text-zinc-500 font-mono">SKU: {lineItem.item?.sku || lineItem.itemCode || 'N/A'}</p>
                          </td>
                          <td className="font-bold">{lineItem.quantity}</td>
                          <td className="text-zinc-500">{lineItem.receivedQuantity || 0}</td>
                          <td>
                            <input 
                              type="number" 
                              defaultValue={Math.max(0, lineItem.quantity - (lineItem.receivedQuantity || 0))} 
                              max={lineItem.quantity - (lineItem.receivedQuantity || 0)} 
                              min="0" 
                              className="input-field w-24 text-center font-bold" 
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200 mb-6 shrink-0">
                <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  Ensure physical stock matches the quantities entered above. Once saved, the inventory valuation and stock levels will be updated immediately.
                </p>
              </div>

              <div className="flex justify-end gap-3 shrink-0">
                <button className="btn-secondary" onClick={() => setSelectedPoId(null)}>Cancel</button>
                <button className="btn-primary">
                  <Save size={16} /> Save Receipt & Update Stock
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
