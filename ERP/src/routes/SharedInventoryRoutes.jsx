import React, { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';

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
      <Route path={`${prefix}dashboard`} element={<InventoryDashboard />} />
      <Route path={`${prefix}unit-of-measures`} element={<UnitOfMeasureManagement />} />
      <Route path={`${prefix}unit-of-measures/:id`} element={<GenericEntityDetails endpoint="/api/inventory/unit-of-measures" entityName="Unit of Measure" />} />
      <Route path={`${prefix}warehouses`} element={<WarehouseManagement />} />
      <Route path={`${prefix}warehouse`} element={<WarehouseManagement />} />
      <Route path={`${prefix}warehouse/:id`} element={<WarehouseDetails />} />
      <Route path={`${prefix}warehouse-locations`} element={<WarehouseLocationManagementPage />} />
      <Route path={`${prefix}cost-layers`} element={<InventoryCostLayerManagement />} />
      <Route path={`${prefix}cost-layers/:id`} element={<GenericEntityDetails endpoint="/api/inventory/inventory-cost-layers" entityName="Cost Layer" />} />
      <Route path={`${prefix}periods`} element={<InventoryPeriodManagement />} />
      <Route path={`${prefix}periods/:id`} element={<GenericEntityDetails endpoint="/api/inventory/inventory-periods" entityName="Inventory Period" />} />
      <Route path={`${prefix}snapshots`} element={<InventorySnapshotManagement />} />
      <Route path={`${prefix}snapshots/:id`} element={<GenericEntityDetails endpoint="/api/inventory/inventory-snapshots" entityName="Inventory Snapshot" />} />
      <Route path={`${prefix}valuations`} element={<InventoryValuationManagement />} />
      <Route path={`${prefix}valuations/:id`} element={<GenericEntityDetails endpoint="/api/inventory/inventory-valuations" entityName="Inventory Valuation" />} />
      <Route path={`${prefix}opening-stock`} element={<OpeningStockManagement />} />
      <Route path={`${prefix}opening-stocks`} element={<OpeningStockManagement />} />
      <Route path={`${prefix}opening-stocks/:id`} element={<OpeningStockDetails />} />
      <Route path={`${prefix}stock`} element={<StockTracking />} />
      <Route path={`${prefix}stock-movements`} element={<StockMovementManagement />} />
      <Route path={`${prefix}stock-movements/:id`} element={<GenericEntityDetails endpoint="/api/inventory/stock-movements" entityName="Stock Movement" />} />
      <Route path={`${prefix}stock-movement-lines`} element={<StockMovementLineManagement />} />
      <Route path={`${prefix}stock-movement-lines/:id`} element={<GenericEntityDetails endpoint="/api/inventory/stock-movement-lines" entityName="Stock Movement Line" />} />
      <Route path={`${prefix}stock-reservations`} element={<StockReservationManagement />} />
      <Route path={`${prefix}stock-reservations/:id`} element={<GenericEntityDetails endpoint="/api/inventory/stock-reservations" entityName="Stock Reservation" />} />
      <Route path={`${prefix}stock-transfers`} element={<StockTransferManagement />} />
      <Route path={`${prefix}stock-transfers/:id`} element={<StockTransferDetails />} />
      <Route path={`${prefix}stock-adjustments`} element={<StockAdjustmentManagement />} />
      <Route path={`${prefix}stock-adjustments/:id`} element={<StockAdjustmentDetails />} />
      <Route path={`${prefix}product-batches`} element={<ProductBatchManagement />} />
      <Route path={`${prefix}product-batches/:id`} element={<GenericEntityDetails endpoint="/api/inventory/product-batches" entityName="Product Batch" />} />
      <Route path={`${prefix}products`} element={<ProductManagement />} />
      <Route path={`${prefix}products/:id`} element={<GenericEntityDetails endpoint="/api/inventory/products" entityName="Product" />} />
      <Route path={`${prefix}product-categories`} element={<ProductCategoryManagement />} />
      <Route path={`${prefix}product-categories/:id`} element={<GenericEntityDetails endpoint="/api/inventory/product-categories" entityName="Product Category" />} />
      <Route path={`${prefix}product-prices`} element={<ProductPriceManagement />} />
      <Route path={`${prefix}product-prices/:id`} element={<GenericEntityDetails endpoint="/api/inventory/product-prices" entityName="Product Price" />} />
      <Route path={`${prefix}product-serials`} element={<ProductSerialManagement />} />
      <Route path={`${prefix}product-serials/:id`} element={<GenericEntityDetails endpoint="/api/inventory/product-serials" entityName="Product Serial" />} />
      <Route path={`${prefix}product-uoms`} element={<ProductUomManagement />} />
      <Route path={`${prefix}product-uoms/:id`} element={<GenericEntityDetails endpoint="/api/inventory/product-uoms" entityName="Product UOM" />} />
      <Route path={`${prefix}reports`} element={<InventorySnapshotManagement />} />
      <Route path={`${prefix}integration/sales-invoice`} element={<InventoryDashboard />} />
      <Route path={`${prefix}integration/purchase-invoice`} element={<InventoryDashboard />} />
      <Route path={`${prefix}integration/stock`} element={<InventoryDashboard />} />
      <Route path={`${prefix}inventory-posting`} element={<InventoryDashboard />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </>
  );
}

export default SharedInventoryRoutes;
