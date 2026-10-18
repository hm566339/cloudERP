import React, { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// ─── Inventory Pages ────────────────────────────────────────────────────────
const InventoryDashboard = lazy(() => import('../features/inventory/pages/InventoryDashboard'));
const UnitOfMeasureManagement = lazy(() => import('../features/inventory/pages/UnitOfMeasureManagement'));
const WarehouseManagement = lazy(() => import('../features/inventory/pages/WarehouseManagement'));
const WarehouseDetails = lazy(() => import('../features/inventory/pages/WarehouseDetails'));
const InventoryCostLayerManagement = lazy(() => import('../features/inventory/pages/InventoryCostLayerManagement'));
const InventoryPeriodManagement = lazy(() => import('../features/inventory/pages/InventoryPeriodManagement'));
const InventorySnapshotManagement = lazy(() => import('../features/inventory/pages/InventorySnapshotManagement'));
const InventoryValuationManagement = lazy(() => import('../features/inventory/pages/InventoryValuationManagement'));
const OpeningStockManagement = lazy(() => import('../features/inventory/pages/OpeningStockManagement'));
const OpeningStockDetails = lazy(() => import('../features/inventory/pages/OpeningStockDetails'));
const StockMovementLineManagement = lazy(() => import('../features/inventory/pages/StockMovementLineManagement'));
const StockMovementManagement = lazy(() => import('../features/inventory/pages/StockMovementManagement'));
const StockReservationManagement = lazy(() => import('../features/inventory/pages/StockReservationManagement'));
const StockTransferManagement = lazy(() => import('../features/inventory/pages/StockTransferManagement'));
const StockTransferDetails = lazy(() => import('../features/inventory/pages/StockTransferDetails'));
const ProductBatchManagement = lazy(() => import('../features/inventory/pages/ProductBatchManagement'));
const StockAdjustmentManagement = lazy(() => import('../features/inventory/pages/StockAdjustmentManagement'));
const StockAdjustmentDetails = lazy(() => import('../features/inventory/pages/StockAdjustmentDetails'));
const ProductManagement = lazy(() => import('../features/inventory/pages/ProductManagement'));
const ProductCategoryManagement = lazy(() => import('../features/inventory/pages/ProductCategoryManagement'));
const ProductPriceManagement = lazy(() => import('../features/inventory/pages/ProductPriceManagement'));
const ProductSerialManagement = lazy(() => import('../features/inventory/pages/ProductSerialManagement'));
const ProductUomManagement = lazy(() => import('../features/inventory/pages/ProductUomManagement'));
const GenericEntityDetails = lazy(() => import('../features/inventory/pages/GenericEntityDetails'));
const WarehouseLocationManagementPage = lazy(() => import('../features/inventory/pages/WarehouseLocationManagementPage'));
const StockTracking = lazy(() => import('../features/inventory/pages/StockTracking'));

/**
 * Shared Inventory routes — can be mounted inside any layout.
 * @param {{ prefix: string }} options  e.g. { prefix: "" } when mounted under /inventory
 */
export function SharedInventoryRoutes({ prefix = "" }) {
  return (
    <>
      <Route path={`${prefix}dashboard`} element={<ProtectedRoute module="INVENTORY"><InventoryDashboard /></ProtectedRoute>} />
      <Route path={`${prefix}unit-of-measures`} element={<ProtectedRoute module="PRODUCT_UOMS"><UnitOfMeasureManagement /></ProtectedRoute>} />
      <Route path={`${prefix}unit-of-measures/:id`} element={<ProtectedRoute module="PRODUCT_UOMS"><GenericEntityDetails endpoint="/api/inventory/unit-of-measures" entityName="Unit of Measure" /></ProtectedRoute>} />
      <Route path={`${prefix}warehouses`} element={<ProtectedRoute module="WAREHOUSES"><WarehouseManagement /></ProtectedRoute>} />
      <Route path={`${prefix}warehouse`} element={<ProtectedRoute module="WAREHOUSES"><WarehouseManagement /></ProtectedRoute>} />
      <Route path={`${prefix}warehouse/:id`} element={<ProtectedRoute module="WAREHOUSES"><WarehouseDetails /></ProtectedRoute>} />
      <Route path={`${prefix}warehouse-locations`} element={<ProtectedRoute module="WAREHOUSE_LOCATIONS"><WarehouseLocationManagementPage /></ProtectedRoute>} />
      <Route path={`${prefix}cost-layers`} element={<ProtectedRoute module="INVENTORY_VALUATION"><InventoryCostLayerManagement /></ProtectedRoute>} />
      <Route path={`${prefix}cost-layers/:id`} element={<ProtectedRoute module="INVENTORY_VALUATION"><GenericEntityDetails endpoint="/api/inventory/inventory-cost-layers" entityName="Cost Layer" /></ProtectedRoute>} />
      <Route path={`${prefix}periods`} element={<ProtectedRoute module="INVENTORY_VALUATION"><InventoryPeriodManagement /></ProtectedRoute>} />
      <Route path={`${prefix}periods/:id`} element={<ProtectedRoute module="INVENTORY_VALUATION"><GenericEntityDetails endpoint="/api/inventory/inventory-periods" entityName="Inventory Period" /></ProtectedRoute>} />
      <Route path={`${prefix}snapshots`} element={<ProtectedRoute module="INVENTORY_VALUATION"><InventorySnapshotManagement /></ProtectedRoute>} />
      <Route path={`${prefix}snapshots/:id`} element={<ProtectedRoute module="INVENTORY_VALUATION"><GenericEntityDetails endpoint="/api/inventory/inventory-snapshots" entityName="Inventory Snapshot" /></ProtectedRoute>} />
      <Route path={`${prefix}valuations`} element={<ProtectedRoute module="INVENTORY_VALUATION"><InventoryValuationManagement /></ProtectedRoute>} />
      <Route path={`${prefix}valuations/:id`} element={<ProtectedRoute module="INVENTORY_VALUATION"><GenericEntityDetails endpoint="/api/inventory/inventory-valuations" entityName="Inventory Valuation" /></ProtectedRoute>} />
      <Route path={`${prefix}opening-stock`} element={<ProtectedRoute module="OPENING_STOCK"><OpeningStockManagement /></ProtectedRoute>} />
      <Route path={`${prefix}opening-stocks`} element={<ProtectedRoute module="OPENING_STOCK"><OpeningStockManagement /></ProtectedRoute>} />
      <Route path={`${prefix}opening-stocks/:id`} element={<ProtectedRoute module="OPENING_STOCK"><OpeningStockDetails /></ProtectedRoute>} />
      <Route path={`${prefix}stock`} element={<ProtectedRoute module="STOCK"><StockTracking /></ProtectedRoute>} />
      <Route path={`${prefix}stocks`} element={<ProtectedRoute module="STOCK"><StockTracking /></ProtectedRoute>} />
      <Route path={`${prefix}current-stock`} element={<ProtectedRoute module="STOCK"><StockTracking /></ProtectedRoute>} />
      <Route path={`${prefix}stock-movements`} element={<ProtectedRoute module="STOCK_MOVEMENTS"><StockMovementManagement /></ProtectedRoute>} />
      <Route path={`${prefix}stock-movements/:id`} element={<ProtectedRoute module="STOCK_MOVEMENTS"><GenericEntityDetails endpoint="/api/inventory/stock-movements" entityName="Stock Movement" /></ProtectedRoute>} />
      <Route path={`${prefix}stock-movement-lines`} element={<ProtectedRoute module="STOCK_MOVEMENTS"><StockMovementLineManagement /></ProtectedRoute>} />
      <Route path={`${prefix}stock-movement-lines/:id`} element={<ProtectedRoute module="STOCK_MOVEMENTS"><GenericEntityDetails endpoint="/api/inventory/stock-movement-lines" entityName="Stock Movement Line" /></ProtectedRoute>} />
      <Route path={`${prefix}stock-reservations`} element={<ProtectedRoute module="STOCK_RESERVATIONS"><StockReservationManagement /></ProtectedRoute>} />
      <Route path={`${prefix}stock-reservations/:id`} element={<ProtectedRoute module="STOCK_RESERVATIONS"><GenericEntityDetails endpoint="/api/inventory/stock-reservations" entityName="Stock Reservation" /></ProtectedRoute>} />
      <Route path={`${prefix}stock-transfers`} element={<ProtectedRoute module="STOCK_TRANSFERS"><StockTransferManagement /></ProtectedRoute>} />
      <Route path={`${prefix}stock-transfers/:id`} element={<ProtectedRoute module="STOCK_TRANSFERS"><StockTransferDetails /></ProtectedRoute>} />
      <Route path={`${prefix}stock-adjustments`} element={<ProtectedRoute module="STOCK_ADJUSTMENTS"><StockAdjustmentManagement /></ProtectedRoute>} />
      <Route path={`${prefix}stock-adjustments/:id`} element={<ProtectedRoute module="STOCK_ADJUSTMENTS"><StockAdjustmentDetails /></ProtectedRoute>} />
      <Route path={`${prefix}product-batches`} element={<ProtectedRoute module="PRODUCT_BATCHES"><ProductBatchManagement /></ProtectedRoute>} />
      <Route path={`${prefix}product-batches/:id`} element={<ProtectedRoute module="PRODUCT_BATCHES"><GenericEntityDetails endpoint="/api/inventory/product-batches" entityName="Product Batch" /></ProtectedRoute>} />
      <Route path={`${prefix}products`} element={<ProtectedRoute module="PRODUCTS"><ProductManagement /></ProtectedRoute>} />
      <Route path={`${prefix}products/:id`} element={<ProtectedRoute module="PRODUCTS"><GenericEntityDetails endpoint="/api/inventory/products" entityName="Product" /></ProtectedRoute>} />
      <Route path={`${prefix}product-categories`} element={<ProtectedRoute module="PRODUCT_CATEGORIES"><ProductCategoryManagement /></ProtectedRoute>} />
      <Route path={`${prefix}product-categories/:id`} element={<ProtectedRoute module="PRODUCT_CATEGORIES"><GenericEntityDetails endpoint="/api/inventory/product-categories" entityName="Product Category" /></ProtectedRoute>} />
      <Route path={`${prefix}product-prices`} element={<ProtectedRoute module="PRODUCT_PRICES"><ProductPriceManagement /></ProtectedRoute>} />
      <Route path={`${prefix}product-prices/:id`} element={<ProtectedRoute module="PRODUCT_PRICES"><GenericEntityDetails endpoint="/api/inventory/product-prices" entityName="Product Price" /></ProtectedRoute>} />
      <Route path={`${prefix}product-serials`} element={<ProtectedRoute module="PRODUCT_SERIALS"><ProductSerialManagement /></ProtectedRoute>} />
      <Route path={`${prefix}product-serials/:id`} element={<ProtectedRoute module="PRODUCT_SERIALS"><GenericEntityDetails endpoint="/api/inventory/product-serials" entityName="Product Serial" /></ProtectedRoute>} />
      <Route path={`${prefix}product-uoms`} element={<ProtectedRoute module="PRODUCT_UOMS"><ProductUomManagement /></ProtectedRoute>} />
      <Route path={`${prefix}product-uoms/:id`} element={<ProtectedRoute module="PRODUCT_UOMS"><GenericEntityDetails endpoint="/api/inventory/product-uoms" entityName="Product UOM" /></ProtectedRoute>} />
      <Route path={`${prefix}reports`} element={<ProtectedRoute module="INVENTORY_REPORTS"><InventorySnapshotManagement /></ProtectedRoute>} />
      <Route path={`${prefix}integration/sales-invoice`} element={<ProtectedRoute module="INVENTORY_POSTING"><InventoryDashboard /></ProtectedRoute>} />
      <Route path={`${prefix}integration/purchase-invoice`} element={<ProtectedRoute module="INVENTORY_POSTING"><InventoryDashboard /></ProtectedRoute>} />
      <Route path={`${prefix}integration/stock`} element={<ProtectedRoute module="INVENTORY_POSTING"><InventoryDashboard /></ProtectedRoute>} />
      <Route path={`${prefix}inventory-posting`} element={<ProtectedRoute module="INVENTORY_POSTING"><InventoryDashboard /></ProtectedRoute>} />
    </>
  );
}

export default SharedInventoryRoutes;
