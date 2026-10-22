import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { getSerialNumber } from "../../../utils/serialNumberHelper";
import {
  Package, AlertTriangle, Barcode, QrCode, Plus,
  TrendingUp, TrendingDown, Activity, RefreshCw,
  ShoppingCart, Boxes, Warehouse, ArrowLeftRight, MapPin,
  Building, CircleDollarSign, ChevronDown, ChevronRight, Printer, X
} from "lucide-react";
import { useAppDispatch } from "../../../app/hooks";
import { useRBAC } from "../../../utils/rbac";
import PageHeader from "../../../components/common/PageHeader";
import CustomSelect from "../../../components/common/CustomSelect";
import {
  DataTablePagination,
  DataTableLoading,
  DataTableEmptyState
} from "../../../components/data-table";
import ExpandedRowDetails from "../components/ExpandedRowDetails";
import {
  useGetInventoryDashboardQuery,
  useGetStocksQuery,
} from "../../../api/inventory";

const ICON_MAP = {
  package: Package,
  boxes: Boxes,
  warehouse: Warehouse,
  alert: AlertTriangle,
  trending_up: TrendingUp,
  trending_down: TrendingDown,
  activity: Activity,
  cart: ShoppingCart,
  transfer: ArrowLeftRight,
  map: MapPin,
  building: Building,
  money: CircleDollarSign,
  default: Activity,
};

function resolveIcon(iconStr) {
  if (!iconStr) return ICON_MAP.default;
  const key = String(iconStr).toLowerCase().replace(/[^a-z_]/g, "");
  return ICON_MAP[key] || ICON_MAP.default;
}

function MetricCard({ label, value, type, icon }) {
  const Icon = resolveIcon(icon);

  const displayValue = type === 'currency'
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
    : value !== null && value !== undefined ? String(value) : "—";

  return (
    <div className="bg-white dark:bg-[#161922] p-5 rounded-xl border border-zinc-200/80 dark:border-[#2A2F3D] shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between w-full">
        <p className="text-[10px] font-bold text-zinc-500 dark:text-[#A0A6B5] tracking-wider uppercase truncate">{label}</p>
        <div className="w-9 h-9 rounded-lg bg-zinc-50 dark:bg-[#1D212C] flex items-center justify-center shrink-0 border border-zinc-200/60 dark:border-[#2A2F3D] text-zinc-600 dark:text-[#A0A6B5]">
          <Icon size={18} />
        </div>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight leading-none font-mono">{displayValue}</p>
      </div>
    </div>
  );
}

function AlertBanner({ label, value, type }) {
  const colorMap = {
    warning: "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-800/40 text-amber-900 dark:text-amber-300",
    danger:  "bg-rose-50/70 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-800/40 text-rose-900 dark:text-rose-300",
    info:    "bg-sky-50/70 dark:bg-sky-950/30 border-sky-200/80 dark:border-sky-800/40 text-sky-900 dark:text-sky-300",
    default: "bg-zinc-50 dark:bg-[#1D212C] border-zinc-200 dark:border-[#2A2F3D] text-zinc-800 dark:text-[#E6E8EE]",
  };
  const cls = colorMap[type] || colorMap.default;
  return (
    <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs font-medium shadow-2xs ${cls}`}>
      <span className="flex items-center gap-2 font-semibold">
        <AlertTriangle size={14} className="shrink-0" />
        <span className="truncate">{label}</span>
      </span>
      <span className="font-bold font-mono px-2 py-0.5 rounded-md bg-white dark:bg-[#161922] border border-current/20 shadow-2xs shrink-0 ml-2">
        {value !== null && value !== undefined ? String(value) : "—"}
      </span>
    </div>
  );
}

export default function InventoryDashboard() {
  const [expandedRowId, setExpandedRowId] = useState(null);
  const { companyId } = useParams();
  const resolvedCompanyId = companyId
    || JSON.parse(localStorage.getItem("selected_company") || "null")?.id
    || JSON.parse(localStorage.getItem("auth_user") || "null")?.companyCode;

  const dispatch = useAppDispatch();
  const { canCreate, canViewModule, roleName } = useRBAC();
  const backendRole = roleName ? String(roleName).toUpperCase() : "EMPLOYEE";

  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    isFetching: dashboardFetching,
    refetch: refetchDashboard,
  } = useGetInventoryDashboardQuery(
    { companyId: resolvedCompanyId, role: backendRole },
    { skip: !resolvedCompanyId }
  );

  const { data: stock = [], isLoading: stockLoading } = useGetStocksQuery(resolvedCompanyId, {
    skip: !resolvedCompanyId,
  });

  const [activeWarehouse, setActiveWarehouse] = useState("all");
  const [selectedBarcodeItem, setSelectedBarcodeItem] = useState(null);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const metrics = dashboardData?.metrics || [];
  const alerts  = dashboardData?.alerts  || [];

  const lowStockItems = useMemo(() => {
    return stock.filter(i => {
      const qty = i.inStock ?? i.availableQuantity ?? i.quantity ?? 0;
      const min = i.reorderLevel ?? i.reorderPoint ?? 10;
      return qty <= min;
    });
  }, [stock]);

  const inStockCount = useMemo(() => {
    return stock.filter(s => {
      const qty = s.inStock ?? s.availableQuantity ?? s.quantity ?? 0;
      const min = s.reorderLevel ?? s.reorderPoint ?? 10;
      return qty > min;
    }).length;
  }, [stock]);

  const outOfStockCount = useMemo(() => {
    return stock.filter(s => (s.inStock ?? s.availableQuantity ?? s.quantity ?? 0) === 0).length;
  }, [stock]);

  const uniqueWarehousesCount = useMemo(() => {
    const s = new Set();
    stock.forEach(i => {
      const w = i.warehouseName || i.warehouse || i.warehouseId;
      if (w) s.add(w);
    });
    return s.size;
  }, [stock]);

  // Dynamically build warehouse select options from stock records
  const warehouseSelectOptions = useMemo(() => {
    const list = [{ value: "all", label: "All Warehouses" }];
    const known = new Set();

    stock.forEach(item => {
      const name = item.warehouseName || item.warehouse || item.warehouseId;
      if (name && !known.has(name)) {
        known.add(name);
        list.push({ value: name, label: name });
      }
    });

    // Ensure fallback standard warehouse options are available
    ["Primary Warehouse A", "Warehouse B Depot"].forEach(w => {
      if (!known.has(w)) {
        known.add(w);
        list.push({ value: w, label: w });
      }
    });

    return list;
  }, [stock]);

  // Compute 4 responsive summary cards matching design system
  const computedMetricCards = useMemo(() => {
    if (metrics.length === 0) {
      return [
        { label: "Total Items", value: stock.length, type: "info", icon: "boxes" },
        { label: "In Stock", value: inStockCount, type: "success", icon: "package" },
        { label: "Low Stock", value: lowStockItems.length, type: lowStockItems.length > 0 ? "warning" : "success", icon: "alert" },
        { label: "Out of Stock", value: outOfStockCount, type: outOfStockCount > 0 ? "danger" : "default", icon: "trending_down" },
      ];
    }
    if (metrics.length === 1) {
      return [
        metrics[0],
        { label: "In Stock Items", value: inStockCount, type: "success", icon: "package" },
        { label: "Low Stock Items", value: lowStockItems.length, type: lowStockItems.length > 0 ? "warning" : "success", icon: "alert" },
        { label: "Active Warehouses", value: uniqueWarehousesCount || 1, type: "info", icon: "warehouse" },
      ];
    }
    return metrics;
  }, [metrics, stock.length, inStockCount, lowStockItems.length, outOfStockCount, uniqueWarehousesCount]);

  const filteredStock = useMemo(() => {
    if (activeWarehouse === "all") return stock;
    return stock.filter(item => {
      const w = item.warehouseName || item.warehouse || item.warehouseId;
      return w === activeWarehouse;
    });
  }, [stock, activeWarehouse]);

  const isLoading = dashboardLoading || stockLoading;

  const displayedStock = useMemo(() => {
    const start = page * pageSize;
    return filteredStock.slice(start, start + pageSize);
  }, [filteredStock, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredStock.length / pageSize));

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      {/* Top PageHeader matching Account Groups standard */}
      <PageHeader
        title="Inventory & Warehouse"
        description="Track stock items, warehouse locations, transactions and replenishment alerts"
        icon={Package}
      >
        <button
          type="button"
          onClick={refetchDashboard}
          disabled={dashboardFetching}
          className="btn-secondary flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C] text-zinc-700 dark:text-[#E6E8EE] hover:bg-zinc-50 dark:hover:bg-[#222736] shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          title="Refresh inventory data"
        >
          <RefreshCw size={14} className={dashboardFetching ? "animate-spin text-zinc-500 dark:text-[#A0A6B5]" : "text-zinc-500 dark:text-[#A0A6B5]"} />
          <span>Refresh</span>
        </button>
      </PageHeader>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
        {/* Metric Cards Section */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-[#161922] p-5 rounded-xl border border-zinc-200/80 dark:border-[#2A2F3D] h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {computedMetricCards.map((m, i) => (
              <MetricCard key={i} label={m.label} value={m.value} type={m.type} icon={m.icon} />
            ))}
          </div>
        )}

        {/* Backend Alert Banners */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">Alerts</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
              {alerts.map((a, i) => (
                <AlertBanner key={i} label={a.label} value={a.value} type={a.type} />
              ))}
            </div>
          </div>
        )}

        {/* Fallback low-stock warnings when no backend alerts array */}
        {alerts.length === 0 && (canViewModule("inv_alerts") || canViewModule("inventory")) && lowStockItems.length > 0 && (
          <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/40 p-4 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-rose-800 dark:text-rose-400">
              <AlertTriangle size={16} className="shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Low Stock Warnings ({lowStockItems.length})</h3>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {lowStockItems.map((item) => {
                const itemName = item.productName || item.name || item.productId || 'Unknown Product';
                const qty = item.inStock ?? item.availableQuantity ?? item.quantity ?? 0;
                const min = item.reorderLevel ?? item.reorderPoint ?? 10;
                return (
                  <div key={item.id} className="text-xs flex items-center justify-between bg-white dark:bg-[#161922] px-3 py-2 rounded-lg border border-rose-100 dark:border-rose-900/40 shadow-2xs">
                    <span className="font-semibold text-zinc-800 dark:text-[#E6E8EE] truncate mr-2">{itemName}</span>
                    <span className="text-[9px] bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded font-mono font-bold shrink-0">
                      QTY: {qty} / Min: {min}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stock Registry + Barcode / QR Utility Split Layout */}
        {(canViewModule("inv_tracking") || canViewModule("inventory")) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Stock Registry Table Card (2 cols on lg) */}
            <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200/80 dark:border-[#2A2F3D] shadow-2xs lg:col-span-2 flex flex-col overflow-hidden">
              {/* Toolbar */}
              <div className="px-5 py-3.5 border-b border-zinc-200/80 dark:border-[#2A2F3D] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/50 dark:bg-[#161922]">
                <div className="flex items-center gap-2">
                  <Boxes size={16} className="text-zinc-600 dark:text-[#A0A6B5]" />
                  <h3 className="text-xs font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider">Stock Registry</h3>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-zinc-200/70 dark:bg-[#1D212C] text-zinc-700 dark:text-[#A0A6B5]">
                    {filteredStock.length}
                  </span>
                </div>
                <div className="w-full sm:w-64">
                  <CustomSelect
                    value={activeWarehouse}
                    onChange={(e) => {
                      const val = e?.target?.value !== undefined ? e.target.value : e;
                      setActiveWarehouse(val);
                      setPage(0);
                    }}
                    options={warehouseSelectOptions}
                    size="sm"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Table Body */}
              <div className="overflow-x-auto relative">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-[#A0A6B5] select-none">
                      <th scope="col" className="w-16 p-3.5 sm:p-4 text-center">S.No.</th>
                      <th scope="col" className="p-3.5 sm:p-4">Item Name / SKU</th>
                      <th scope="col" className="p-3.5 sm:p-4">Warehouse</th>
                      <th scope="col" className="p-3.5 sm:p-4 text-right">Quantity</th>
                      <th scope="col" className="w-20 p-3.5 sm:p-4 text-center">Label</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D] bg-white dark:bg-[#161922]">
                    {stockLoading ? (
                      <DataTableLoading columnCount={5} rowCount={4} />
                    ) : displayedStock.length === 0 ? (
                      <DataTableEmptyState
                        colSpan={5}
                        message="No stock items found"
                        description={activeWarehouse !== 'all' ? `No items found matching warehouse "${activeWarehouse}".` : "No inventory stock items recorded yet."}
                        onReset={activeWarehouse !== 'all' ? () => { setActiveWarehouse('all'); setPage(0); } : undefined}
                      />
                    ) : (
                      displayedStock.map((item, index) => {
                        const qty = item.inStock ?? item.availableQuantity ?? item.quantity ?? 0;
                        const min = item.reorderLevel ?? item.reorderPoint ?? 10;
                        const isLow = qty <= min;
                        const itemName = item.productName || item.name || item.productId || 'Unknown Product';
                        const itemSku = item.sku || item.itemCode || item.batchId || (item.id && String(item.id).substring(0, 8)) || '-';
                        const warehouseName = item.warehouseName || item.warehouse || item.warehouseId || '-';
                        const isExpanded = expandedRowId === item.id;

                        return (
                          <React.Fragment key={item.id || index}>
                            <tr
                              className={`group cursor-pointer transition-colors ${isExpanded ? 'bg-zinc-50/80 dark:bg-[#1D212C]' : 'hover:bg-zinc-50/70 dark:hover:bg-[#222736]'}`}
                              onClick={() => setExpandedRowId(isExpanded ? null : item.id)}
                            >
                              <td className="p-3.5 sm:p-4 text-zinc-500 dark:text-[#A0A6B5] font-medium">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    className="text-zinc-400 hover:text-zinc-700 dark:text-[#6B7184] dark:hover:text-[#E6E8EE] focus:outline-none p-1 rounded hover:bg-zinc-200/60 dark:hover:bg-[#222736] transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedRowId(isExpanded ? null : item.id);
                                    }}
                                    title={isExpanded ? "Collapse row" : "Expand row"}
                                  >
                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                  </button>
                                  <span className="tabular-nums font-mono text-xs">
                                    {getSerialNumber({ page, pageSize, rowIndex: index, pageBase: 0 })}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3.5 sm:p-4">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-bold text-zinc-900 dark:text-[#E6E8EE] group-hover:text-indigo-600 dark:group-hover:text-[#4C8DFF] transition-colors">
                                    {itemName}
                                  </span>
                                  <span className="text-[10px] text-zinc-500 dark:text-[#A0A6B5] font-mono tracking-wide">
                                    SKU: {itemSku}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3.5 sm:p-4">
                                <span className="text-[11px] font-medium text-zinc-700 dark:text-[#A0A6B5] bg-zinc-100 dark:bg-[#1D212C] px-2.5 py-1 rounded-md border border-zinc-200/60 dark:border-[#2A2F3D] inline-flex items-center gap-1.5">
                                  <Warehouse size={12} className="text-zinc-400 dark:text-[#6B7184]" />
                                  <span>{warehouseName}</span>
                                </span>
                              </td>
                              <td className="p-3.5 sm:p-4 text-right font-mono text-sm">
                                <span className={isLow ? "text-rose-600 dark:text-rose-400 font-bold" : "text-emerald-700 dark:text-emerald-400 font-bold"}>
                                  {qty}
                                </span>
                              </td>
                              <td className="p-3.5 sm:p-4 text-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBarcodeItem({ ...item, name: itemName, sku: itemSku, warehouseName });
                                  }}
                                  className="p-1.5 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] hover:bg-indigo-50 dark:hover:bg-[#222736] rounded-lg text-zinc-500 dark:text-[#A0A6B5] hover:text-indigo-600 dark:hover:text-[#4C8DFF] hover:border-indigo-200 dark:hover:border-[#4C8DFF]/40 transition-all inline-flex items-center justify-center active:scale-95 shadow-2xs"
                                  title="Generate Barcode / QR Label"
                                >
                                  <Barcode size={16} />
                                </button>
                              </td>
                            </tr>
                            {isExpanded && (
                              <ExpandedRowDetails data={item} colSpan={5} />
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer matching Account Groups */}
              {filteredStock.length > 0 && (
                <DataTablePagination
                  pagination={{
                    page,
                    pageSize,
                    totalPages,
                    totalElements: filteredStock.length
                  }}
                  pageIndexBase={0}
                  onPageChange={setPage}
                  onPageSizeChange={(newSize) => {
                    setPageSize(newSize);
                    setPage(0);
                  }}
                  itemName="stock items"
                />
              )}
            </div>

            {/* Barcode / QR Utility Panel Card (1 col on lg) */}
            <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200/80 dark:border-[#2A2F3D] shadow-2xs lg:col-span-1 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="px-5 py-3.5 border-b border-zinc-200/80 dark:border-[#2A2F3D] flex items-center justify-between bg-zinc-50/50 dark:bg-[#161922]">
                <div className="flex items-center gap-2">
                  <QrCode size={16} className="text-zinc-600 dark:text-[#A0A6B5]" />
                  <h3 className="text-xs font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider">Barcode / QR Utility</h3>
                </div>
                {selectedBarcodeItem && (
                  <button
                    type="button"
                    onClick={() => setSelectedBarcodeItem(null)}
                    className="text-xs font-medium text-zinc-500 dark:text-[#A0A6B5] hover:text-zinc-800 dark:hover:text-[#E6E8EE] transition-colors flex items-center gap-1"
                    title="Clear selection"
                  >
                    <X size={13} />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {/* Body */}
              {selectedBarcodeItem ? (
                <div className="p-6 space-y-5 animate-fade-in flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE]">{selectedBarcodeItem.name}</p>
                      <span className="text-[10px] text-zinc-600 dark:text-[#A0A6B5] uppercase font-mono mt-1 bg-zinc-100 dark:bg-[#1D212C] inline-block px-2.5 py-0.5 rounded-md border border-zinc-200/60 dark:border-[#2A2F3D] font-semibold">
                        SKU: {selectedBarcodeItem.sku}
                      </span>
                      {selectedBarcodeItem.warehouseName && (
                        <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] mt-1 font-medium">{selectedBarcodeItem.warehouseName}</p>
                      )}
                    </div>

                    {/* Barcode Visualization */}
                    <div className="bg-white dark:bg-[#1D212C] p-4 rounded-xl border border-zinc-200/80 dark:border-[#2A2F3D] shadow-2xs text-center">
                      <div className="flex gap-0.5 h-12 w-48 mx-auto items-center justify-center p-1">
                        {[1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 2].map((w, i) => (
                          <div key={i} style={{ width: `${w}px` }} className="h-full bg-zinc-900 dark:bg-[#E6E8EE] rounded-xs" />
                        ))}
                      </div>
                      <span className="text-[9px] font-mono tracking-widest mt-2 block text-zinc-500 dark:text-[#A0A6B5] font-semibold">
                        {selectedBarcodeItem.sku}-*BAR*
                      </span>
                    </div>

                    {/* QR Code Visualization */}
                    <div className="bg-white dark:bg-[#1D212C] p-4 rounded-xl border border-zinc-200/80 dark:border-[#2A2F3D] shadow-2xs text-center flex flex-col items-center">
                      <div className="w-24 h-24 p-1.5 flex flex-col justify-between border border-zinc-100 dark:border-[#2A2F3D] rounded-lg bg-zinc-50/50 dark:bg-[#161922]">
                        <div className="flex justify-between">
                          <div className="w-6 h-6 border-[2.4px] border-zinc-900 dark:border-[#E6E8EE] flex items-center justify-center rounded-xs">
                            <div className="w-2 h-2 bg-zinc-900 dark:bg-[#E6E8EE] rounded-xs" />
                          </div>
                          <div className="w-6 h-6 border-[2.4px] border-zinc-900 dark:border-[#E6E8EE] flex items-center justify-center rounded-xs">
                            <div className="w-2 h-2 bg-zinc-900 dark:bg-[#E6E8EE] rounded-xs" />
                          </div>
                        </div>
                        <div className="flex justify-between items-end">
                          <div className="w-6 h-6 border-[2.4px] border-zinc-900 dark:border-[#E6E8EE] flex items-center justify-center rounded-xs">
                            <div className="w-2 h-2 bg-zinc-900 dark:bg-[#E6E8EE] rounded-xs" />
                          </div>
                          <div className="w-4 h-4 bg-zinc-900 dark:bg-[#E6E8EE] rounded-xs" />
                        </div>
                      </div>
                      <span className="text-[9px] font-mono tracking-wide mt-2 block text-zinc-500 dark:text-[#A0A6B5] font-semibold">
                        Scan QR to verify
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="btn-secondary w-full flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C] text-zinc-700 dark:text-[#E6E8EE] hover:bg-zinc-50 dark:hover:bg-[#222736] shadow-2xs transition-colors cursor-pointer"
                    >
                      <Printer size={14} />
                      <span>Print Label</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center flex-1 flex flex-col items-center justify-center min-h-[300px]">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200/60 dark:border-[#2A2F3D] flex items-center justify-center mb-3 text-zinc-400 dark:text-[#6B7184]">
                    <QrCode size={28} />
                  </div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-[#A0A6B5] max-w-[200px] leading-relaxed">
                    Click the barcode icon next to any inventory item to generate label tags.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
