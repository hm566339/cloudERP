import {
  LayoutDashboard, Database, Activity, ScanLine,
  Warehouse, Landmark, LineChart, RefreshCw,
  Package, Layers, ArrowLeftRight, BoxSelect,
  Scale, Tag, Lock, Camera, FolderTree
} from 'lucide-react'

/**
 * Recursively filters a sidebar config tree using a hasAccess callback.
 * Identical to buildFilteredSidebar in financeSidebarConfig.js.
 */
function filterItem(item, hasAccess) {
  if (item.children) {
    const filtered = item.children
      .map((child) => filterItem(child, hasAccess))
      .filter(Boolean)
    if (filtered.length === 0) return null
    return { ...item, children: filtered }
  }
  if (item.module && !hasAccess(item.module, item.action)) return null
  return item
}

export function buildFilteredSidebar(config, hasAccess) {
  return config
    .map((item) => filterItem(item, hasAccess))
    .filter(Boolean)
}

/**
 * INVENTORY_SIDEBAR — the declarative menu tree for Inventory.
 *
 * Every leaf item has a `module` property that maps 1-to-1 to a module name
 * from application-rbac.yml.  The sidebar is filtered at runtime by
 * buildFilteredSidebar + canAccess (which checks canViewModule).
 *
 * Group nodes (Masters, Operations, etc.) have NO module — they appear
 * whenever at least one child survives filtering.
 */
export const INVENTORY_SIDEBAR = [
  { id: 'inv-dashboard', label: 'Dashboard', path: '/inventory/dashboard', icon: LayoutDashboard },
  {
    id: 'inv-products-group',
    label: 'Products',
    icon: Package,
    children: [
      { id: 'inv-products', label: 'Products', path: '/inventory/products', module: 'PRODUCTS' },
      { id: 'inv-product-categories', label: 'Categories', path: '/inventory/product-categories', module: 'PRODUCT_CATEGORIES' },
      { id: 'inv-unit-of-measures', label: 'Units of Measure', path: '/inventory/unit-of-measures', module: 'UNIT_OF_MEASURES' },
      { id: 'inv-product-prices', label: 'Product Prices', path: '/inventory/product-prices', module: 'PRODUCT_PRICES' },
      { id: 'inv-product-batches', label: 'Product Batches', path: '/inventory/product-batches', module: 'PRODUCT_BATCHES' },
      { id: 'inv-product-serials', label: 'Product Serials', path: '/inventory/product-serials', module: 'PRODUCT_SERIALS' },
    ],
  },
  {
    id: 'inv-warehouse-group',
    label: 'Warehouses',
    icon: Warehouse,
    children: [
      { id: 'inv-warehouses', label: 'Warehouses', path: '/inventory/warehouses', module: 'WAREHOUSES' },
      { id: 'inv-warehouse-locations', label: 'Warehouse Locations', path: '/inventory/warehouse-locations', module: 'WAREHOUSE_LOCATIONS' },
    ],
  },
  {
    id: 'inv-stock-ops-group',
    label: 'Stock Operations',
    icon: Activity,
    children: [
      { id: 'inv-current-stock', label: 'Current Stock', path: '/inventory/stock', module: 'STOCK' },
      { id: 'inv-stock-movements', label: 'Stock Movements', path: '/inventory/stock-movements', module: 'STOCK_MOVEMENTS' },
      { id: 'inv-stock-transfers', label: 'Stock Transfers', path: '/inventory/stock-transfers', module: 'STOCK_TRANSFERS' },
      { id: 'inv-stock-reservations', label: 'Stock Reservations', path: '/inventory/stock-reservations', module: 'STOCK_RESERVATIONS' },
      { id: 'inv-stock-adjustments', label: 'Stock Adjustments', path: '/inventory/stock-adjustments', module: 'STOCK_ADJUSTMENTS' },
      { id: 'inv-opening-stock', label: 'Opening Stock', path: '/inventory/opening-stock', module: 'OPENING_STOCK' },
    ],
  },
  {
    id: 'inv-control-group',
    label: 'Inventory Control',
    icon: Landmark,
    children: [
      { id: 'inv-inventory-valuation', label: 'Inventory Valuation', path: '/inventory/valuations', module: 'INVENTORY_VALUATION' },
      { id: 'inv-inventory-reports', label: 'Inventory Reports', path: '/inventory/reports', module: 'INVENTORY_REPORTS' },
      { id: 'inv-inventory-posting', label: 'Inventory Posting', path: '/inventory/inventory-posting', module: 'INVENTORY_POSTING' },
    ],
  },
]
