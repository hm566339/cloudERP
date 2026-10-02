import React, { useState } from "react"
import {
  Package, AlertTriangle, Barcode, QrCode, Plus,
  TrendingUp, TrendingDown, Activity, RefreshCw,
  ShoppingCart, Boxes, Warehouse, ArrowLeftRight, MapPin,
  Building, CircleDollarSign, ChevronDown, ChevronRight
} from "lucide-react"
import { useParams } from "react-router-dom"
import { useAppDispatch } from "../../../app/hooks"
import { useRBAC } from "../../../utils/rbac"
import { addAlert } from "../../notifications/notificationSlice"
import { TableSkeleton } from "../../../components/common/SkeletonLoader"
import CustomSelect from "../../../components/common/CustomSelect"
import Pagination from "../../../components/common/Pagination"
import ExpandedRowDetails from "../components/ExpandedRowDetails"
import {
  useGetInventoryDashboardQuery,
  useGetStocksQuery,
} from "../../../api/inventory"

const ICON_MAP = {
  package: Package, boxes: Boxes, warehouse: Warehouse,
  alert: AlertTriangle, trending_up: TrendingUp, trending_down: TrendingDown,
  activity: Activity, cart: ShoppingCart, transfer: ArrowLeftRight,
  map: MapPin, building: Building, money: CircleDollarSign, default: Activity,
}
function resolveIcon(iconStr) {
  if (!iconStr) return ICON_MAP.default
  const key = String(iconStr).toLowerCase().replace(/[^a-z_]/g, "")
  return ICON_MAP[key] || ICON_MAP.default
}

function MetricCard({ label, value, type, icon }) {
  const Icon = resolveIcon(icon)
  
  const displayValue = type === 'currency'
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
    : value !== null && value !== undefined ? String(value) : "—"

  return (
    <div className="bg-white p-6 rounded-2xl border border-zinc-200 flex flex-col gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.04)] transition-all duration-300">
      <div className="flex items-center justify-between w-full">
        <p className="text-[10.4px] font-semibold text-zinc-500 tracking-wide uppercase">{label}</p>
        <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center shrink-0 border border-zinc-100">
          <Icon size={18} className="text-zinc-600" />
        </div>
      </div>
      <div>
        <p className="text-[25.6px] font-bold text-zinc-900 tracking-tight leading-none mt-2">{displayValue}</p>
      </div>
    </div>
  )
}

function AlertBanner({ label, value, type }) {
  const colorMap = {
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    danger:  "bg-rose-50  border-rose-200  text-rose-800",
    info:    "bg-sky-50   border-sky-200   text-sky-800",
    default: "bg-zinc-50  border-zinc-200  text-zinc-700",
  }
  const cls = colorMap[type] || colorMap.default
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-medium ${cls}`}>
      <span className="flex items-center gap-2">
        <AlertTriangle size={13} />{label}
      </span>
      <span className="font-bold font-mono">{value !== null && value !== undefined ? String(value) : "—"}</span>
    </div>
  )
}

export default function InventoryDashboard() {
  const [expandedRowId, setExpandedRowId] = React.useState(null);
  const { companyId } = useParams()
  const resolvedCompanyId = companyId
    || JSON.parse(localStorage.getItem("selected_company") || "null")?.id
    || JSON.parse(localStorage.getItem("auth_user") || "null")?.companyCode

  const dispatch = useAppDispatch()
  const { canCreate, canViewModule, roleName } = useRBAC()
  const backendRole = roleName ? String(roleName).toUpperCase() : "EMPLOYEE"

  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    isFetching: dashboardFetching,
    refetch: refetchDashboard,
  } = useGetInventoryDashboardQuery(
    { companyId: resolvedCompanyId, role: backendRole },
    { skip: !resolvedCompanyId }
  )

  const { data: stock = [], isLoading: stockLoading } = useGetStocksQuery(resolvedCompanyId, {
    skip: !resolvedCompanyId,
  })

  const [activeWarehouse, setActiveWarehouse] = useState("all")
  const [selectedBarcodeItem, setSelectedBarcodeItem] = useState(null)

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const metrics = dashboardData?.metrics || []
  const alerts  = dashboardData?.alerts  || []
  const lowStockItems = stock.filter(i => {
    const qty = i.inStock ?? i.availableQuantity ?? i.quantity ?? 0;
    const min = i.reorderLevel ?? i.reorderPoint ?? 10;
    return qty <= min;
  })
  
  const filteredStock = activeWarehouse === "all" ? stock : stock.filter(i => (i.warehouse || i.warehouseId) === activeWarehouse)
  const isLoading = dashboardLoading || stockLoading

  const displayedStock = filteredStock.slice(page * pageSize, (page + 1) * pageSize)
  const totalPages = Math.ceil(filteredStock.length / pageSize)

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Inventory &amp; Warehouse</h1>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">Track stock items, warehouse locations, transactions and replenishment alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refetchDashboard} disabled={dashboardFetching} className="btn-secondary" title="Refresh">
            <RefreshCw size={14} className={dashboardFetching ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map((i, index) => <div key={i} className="card p-4 h-20 animate-pulse bg-zinc-100 rounded-2xl" />)}
        </div>
      ) : metrics.length > 0 ? (
        <div className={`grid gap-4 ${metrics.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}>
          {metrics.map((m, i) => <MetricCard key={i} label={m.label} value={m.value} type={m.type} icon={m.icon} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Total Items" value={stock.length} type="info" icon="boxes" />
          <MetricCard label="Low Stock" value={lowStockItems.length} type={lowStockItems.length > 0 ? "warning" : "success"} icon="alert" />
          <MetricCard label="In Stock" value={stock.filter(s => (s.inStock ?? s.availableQuantity ?? s.quantity ?? 0) > (s.reorderLevel ?? s.reorderPoint ?? 10)).length} type="success" icon="package" />
          <MetricCard label="Out of Stock" value={stock.filter(s => (s.inStock ?? s.availableQuantity ?? s.quantity ?? 0) === 0).length} type="danger" icon="trending_down" />
        </div>
      )}

      {/* Backend Alert Banners */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">Alerts</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {alerts.map((a, i) => <AlertBanner key={i} label={a.label} value={a.value} type={a.type} />)}
          </div>
        </div>
      )}

      {/* Fallback low-stock warnings */}
      {alerts.length === 0 && (canViewModule("inv_alerts") || canViewModule("inventory")) && lowStockItems.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-rose-800">
            <AlertTriangle size={18} className="shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Low Stock Warnings ({lowStockItems.length})</h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {lowStockItems.map((item, index) => {
              const itemName = item.productName || item.name || item.productId || 'Unknown Product';
              const qty = item.inStock ?? item.availableQuantity ?? item.quantity ?? 0;
              const min = item.reorderLevel ?? item.reorderPoint ?? 10;
              return (
                <div key={item.id} className="text-xs flex items-center justify-between bg-white p-2.5 rounded-xl border border-rose-100">
                  <span className="font-bold text-zinc-800 truncate max-w-[160px]">{itemName}</span>
                  <span className="text-[8px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-mono font-bold">
                    QTY: {qty} / Min: {min}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stock Registry + Barcode */}
      {(canViewModule("inv_tracking") || canViewModule("inventory")) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] lg:col-span-2 flex flex-col overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-zinc-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-zinc-50/30">
              <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider">Stock Registry</h3>
              <CustomSelect value={activeWarehouse} onChange={e => { setActiveWarehouse(e.target.value); setPage(0); }}
                className="px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 focus:outline-none focus:border-zinc-400">
                <option value="all">All Warehouses</option>
                <option value="Primary Warehouse A">Primary Warehouse A</option>
                <option value="Warehouse B Depot">Warehouse B Depot</option>
              </CustomSelect>
            </div>
            <div className="overflow-x-auto relative">
              {stockLoading && <div className="p-6 w-full"><TableSkeleton columns={4} rows={4} /></div>}
              {!stockLoading && (
                <table className="erp-table">
                  <thead>
                    <tr>
                    <th className="w-16">S.No.</th>
                      <th>Item Name / SKU</th>
                      <th>Warehouse</th>
                      <th className="text-right">Quantity</th>
                      <th className="text-center">Label</th>
                    </tr>
                  </thead>
                  <tbody className="staggered-list">
                    {displayedStock.length === 0 ? (
                      <tr><td colSpan={5}>
                        <div className="p-10 text-center text-zinc-400">
                          <Boxes size={28} className="mx-auto mb-2 opacity-40" />
                          <p className="text-xs font-medium">No stock items found</p>
                        </div>
                      </td></tr>
                    ) : displayedStock.map((item, index) => {
                      const qty = item.inStock ?? item.availableQuantity ?? item.quantity ?? 0;
                      const min = item.reorderLevel ?? item.reorderPoint ?? 10;
                      const isLow = qty <= min;
                      const itemName = item.productName || item.name || item.productId || 'Unknown Product';
                      const itemSku = item.sku || item.itemCode || item.batchId || (item.id && item.id.substring(0,8)) || '-';
                      const warehouseName = item.warehouseName || item.warehouse || item.warehouseId || '-';

                      return (
                        <React.Fragment key={item.id}>
                          <tr 
                            className="group cursor-pointer hover:bg-zinc-50/50 transition-colors"
                            onClick={() => setExpandedRowId(expandedRowId === item.id ? null : item.id)}
                          >
                            <td className="text-zinc-500 font-medium">
                              <div className="flex items-center gap-2">
                                <button 
                                  className="text-zinc-400 hover:text-zinc-600 focus:outline-none p-0.5 rounded hover:bg-zinc-200"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedRowId(expandedRowId === item.id ? null : item.id);
                                  }}
                                >
                                  {expandedRowId === item.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </button>
                                <span>{page * pageSize + index + 1}</span>
                              </div>
                            </td>
                          <td>
                            <div className="flex flex-col gap-1">
                              <span className="font-bold text-zinc-900 text-sm">{itemName}</span>
                              <span className="text-[8.8px] text-zinc-500 font-mono">SKU: {itemSku}</span>
                            </div>
                          </td>
                          <td>
                            <div className="text-[8.8px] font-mono font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200/50 inline-block">
                              {warehouseName}
                            </div>
                          </td>
                          <td className="text-right font-mono text-sm">
                            <span className={isLow ? "text-rose-600 font-bold" : "text-emerald-700 font-bold"}>{qty}</span>
                          </td>
                          <td className="text-center">
                            <button onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBarcodeItem({ ...item, name: itemName, sku: itemSku });
                            }}
                              className="p-1.5 bg-white border border-zinc-200 hover:bg-indigo-50 rounded text-zinc-500 hover:text-indigo-600 hover:border-indigo-200 transition-colors inline-flex active:scale-95" title="Generate Label">
                              <Barcode size={16} />
                            </button>
                          </td>
                        </tr>
                        {expandedRowId === item.id && (
                          <ExpandedRowDetails data={item} colSpan={5} />
                        )}
                      </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
            {filteredStock.length > 0 && (
              <div className="p-4 border-t border-zinc-100">
                <Pagination
                  page={page}
                  onPageChange={setPage}
                  totalPages={totalPages}
                  totalElements={filteredStock.length}
                  pageSize={pageSize}
                  onPageSizeChange={(newSize) => {
                    setPageSize(newSize)
                    setPage(0)
                  }}
                />
              </div>
            )}
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-zinc-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-5 flex flex-col">
            <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
              <QrCode size={16} className="text-zinc-500" /> Barcode / QR Utility
            </h3>
            {selectedBarcodeItem ? (
              <div className="border border-zinc-100 p-6 rounded-2xl bg-gradient-to-b from-white to-zinc-50/50 text-center space-y-5 animate-fade-in shadow-sm">
                <div>
                  <p className="text-sm font-bold text-zinc-900">{selectedBarcodeItem.name}</p>
                  <p className="text-[8px] text-zinc-500 uppercase font-mono mt-1 bg-zinc-100 inline-block px-2 py-0.5 rounded">SKU: {selectedBarcodeItem.sku}</p>
                </div>
                <div className="bg-white p-4 rounded-xl inline-block border border-zinc-200 shadow-sm">
                  <div className="flex gap-[1.6px] h-14 w-48 items-center justify-center p-1">
                    {[1,3,2,1,4,2,1,3,1,2,4,1,2].map((w,i) => <div key={i} style={{width:`${w}px`}} className="h-full bg-zinc-900 rounded-sm" />)}
                  </div>
                  <span className="text-[7.2px] font-mono tracking-widest mt-2 block text-zinc-500">{selectedBarcodeItem.sku}-*BAR*</span>
                </div>
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-xl inline-block border border-zinc-200 shadow-sm">
                    <div className="w-24 h-24 p-1 flex flex-col justify-between">
                      <div className="flex justify-between">
                        <div className="w-6 h-6 border-[2.4px] border-zinc-900 flex items-center justify-center rounded-sm"><div className="w-2 h-2 bg-zinc-900 rounded-sm" /></div>
                        <div className="w-6 h-6 border-[2.4px] border-zinc-900 flex items-center justify-center rounded-sm"><div className="w-2 h-2 bg-zinc-900 rounded-sm" /></div>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="w-6 h-6 border-[2.4px] border-zinc-900 flex items-center justify-center rounded-sm"><div className="w-2 h-2 bg-zinc-900 rounded-sm" /></div>
                        <div className="w-4 h-4 bg-zinc-900 rounded-sm" />
                      </div>
                    </div>
                    <span className="text-[7.2px] font-mono tracking-wide mt-2 block text-zinc-500">Scan QR to verify</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-zinc-200 bg-zinc-50/50 rounded-2xl">
                <QrCode size={40} className="text-zinc-300 mx-auto mb-3" />
                <p className="text-xs text-zinc-500 max-w-[160px] mx-auto leading-relaxed">Click the barcode icon next to any inventory item to generate label tags.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
