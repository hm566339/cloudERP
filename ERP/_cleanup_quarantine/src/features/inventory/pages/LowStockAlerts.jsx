import { TableRowSkeleton, TableSkeleton, ListSkeleton } from '../../../components/common/SkeletonLoader';
import React from 'react';
import ExpandedRowDetails from '../components/ExpandedRowDetails';
import { AlertTriangle, TrendingDown, ArrowRight, PackageX, ShoppingCart } from 'lucide-react';
import { useGetStocksQuery } from '../../../api/inventory';
import ApiFilterBar from '../../../components/common/ApiFilterBar';
import useApiFilters from '../../../hooks/useApiFilters';
import FILTER_CONFIGS from '../../../constants/filterConfigs';
import Pagination from '../../../components/common/Pagination';
import { useState } from 'react';
export default function LowStockAlerts() {
  const [expandedRowId, setExpandedRowId] = React.useState(null);
  const { data: stocksData, isLoading, refetch } = useGetStocksQuery({ page: 1, limit: 500 });
  const allStocks = stocksData?.items || [];
  
  const { filterBarProps, sortBy, setSortBy, sortOrder, handleColumnSort } = useApiFilters(FILTER_CONFIGS.lowStockAlerts, { defaultSortBy: 'quantity-asc' });
  const search = filterBarProps.searchTerm || '';

  // Filter for alerts where stock is below or exactly at reorder point
  const criticalItems = allStocks.filter(item => {
    const isCritical = item.quantity <= (item.reorderPoint || 0) * 0.5;
    const matchesSearch = !search || item.name?.toLowerCase().includes(search.toLowerCase()) || (item.sku || item.itemCode)?.toLowerCase().includes(search.toLowerCase());
    return isCritical && matchesSearch;
  }).sort((a, b) => {
    const valA = sortBy === 'name' ? a.name : a.quantity;
    const valB = sortBy === 'name' ? b.name : b.quantity;
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const warningItems = allStocks.filter(item => {
    const rp = item.reorderPoint || 0;
    const isWarning = item.quantity > rp * 0.5 && item.quantity <= rp;
    const matchesSearch = !search || item.name?.toLowerCase().includes(search.toLowerCase()) || (item.sku || item.itemCode)?.toLowerCase().includes(search.toLowerCase());
    return isWarning && matchesSearch;
  }).sort((a, b) => {
    const valA = sortBy === 'name' ? a.name : a.quantity;
    const valB = sortBy === 'name' ? b.name : b.quantity;
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const [criticalPage, setCriticalPage] = useState(0);
  const [warningPage, setWarningPage] = useState(0);
  const pageSize = 5; // Smaller page size for dashboard-like alerts

  const displayedCritical = criticalItems.slice(criticalPage * pageSize, (criticalPage + 1) * pageSize);
  const totalCriticalPages = Math.ceil(criticalItems.length / pageSize);

  const displayedWarning = warningItems.slice(warningPage * pageSize, (warningPage + 1) * pageSize);
  const totalWarningPages = Math.ceil(warningItems.length / pageSize);

  return (
    <div className="space-y-6 animate-fade-in p-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">
            <AlertTriangle className="text-amber-500" />
            Low Stock Alerts
          </h1>
          <p className="text-xs text-zinc-500">Monitor items falling below reorder thresholds and generate purchase orders.</p>
        </div>
      </div>
      <div className="card mb-6">
        <ApiFilterBar 
          {...filterBarProps}
          onRefresh={refetch}
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-4 border-t-4 border-t-rose-500">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
                <PackageX className="text-rose-500" size={18} /> Critical Shortages
              </h2>
              <p className="text-xs text-zinc-500">Items that are dangerously low or out of stock.</p>
            </div>
            <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2.5 py-1 rounded-full">{criticalItems.length} Items</span>
          </div>

          <div className="space-y-4">
            {isLoading ? (
               <div className="w-full"><ListSkeleton items={3} /></div>
            ) : criticalItems.length === 0 ? (
               <p className="text-xs text-zinc-400 text-center py-4">No critical shortages.</p>
            ) : (
              displayedCritical.map((alert, index) => (
                <div key={alert.id} className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-zinc-900">{alert.name}</h3>
                      <p className="text-[8px] text-zinc-500 font-mono mt-0.5">{alert.sku || alert.itemCode}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-rose-600 leading-none">{alert.quantity}</p>
                      <p className="text-[8px] text-rose-500 font-semibold mt-1">Below {alert.reorderPoint || 0} limit</p>
                    </div>
                  </div>
                  <button className="w-full btn-primary bg-rose-600 hover:bg-rose-700 focus:ring-rose-200 justify-center text-xs py-2">
                    <ShoppingCart size={14} /> Create PO Now
                  </button>
                </div>
              ))
            )}
          </div>
          {criticalItems.length > 0 && (
            <div className="mt-4">
              <Pagination
                page={criticalPage}
                onPageChange={setCriticalPage}
                totalPages={totalCriticalPages}
                totalElements={criticalItems.length}
                pageSize={pageSize}
                onPageSizeChange={() => {}}
              />
            </div>
          )}
        </div>

        <div className="card p-4 border-t-4 border-t-amber-500">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
                <TrendingDown className="text-amber-500" size={18} /> Approaching Reorder Point
              </h2>
              <p className="text-xs text-zinc-500">Items that will need restocking soon.</p>
            </div>
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">{warningItems.length} Items</span>
          </div>

          <div className="space-y-3">
            {isLoading ? (
               <div className="w-full"><ListSkeleton items={3} /></div>
            ) : warningItems.length === 0 ? (
               <p className="text-xs text-zinc-400 text-center py-4">No stock warnings.</p>
            ) : (
              displayedWarning.map((alert, index) => (
                <div key={alert.id} className="p-3 border border-zinc-100 rounded-xl flex items-center justify-between hover:bg-zinc-50 transition-colors">
                  <div>
                    <h3 className="font-bold text-zinc-800 text-sm">{alert.name}</h3>
                    <p className="text-[8px] text-zinc-500 font-mono mt-0.5">{alert.sku || alert.itemCode}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-amber-600">{alert.quantity} <span className="text-xs text-zinc-400 font-normal">/ {alert.reorderPoint || 0}</span></p>
                    </div>
                    <button className="p-1.5 text-zinc-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          {warningItems.length > 0 && (
            <div className="mt-4">
              <Pagination
                page={warningPage}
                onPageChange={setWarningPage}
                totalPages={totalWarningPages}
                totalElements={warningItems.length}
                pageSize={pageSize}
                onPageSizeChange={() => {}}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
