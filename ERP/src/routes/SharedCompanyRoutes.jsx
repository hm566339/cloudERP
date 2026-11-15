import React, { lazy } from 'react';
import { Route, Navigate, Outlet, useParams } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PurchaseModuleLayout from '../components/common/PurchaseModuleLayout';
import { SharedCrmRoutes } from './SharedCrmRoutes';

const InventoryWrapper = () => (
  <div className="flex-1 min-h-0 min-w-0 flex flex-col w-full h-full">
    <Outlet />
  </div>
);

/**
 * Company-aware redirect component.
 * Preserves the /company/:companyId context when nested under CompanyLayout,
 * and falls back to root-relative path when at top-level.
 */
function CompanyRedirect({ to }) {
  const { companyId } = useParams();
  const clean = to.replace(/^\//, '');
  const destination = companyId ? `/company/${encodeURIComponent(companyId)}/${clean}` : `/${clean}`;
  return <Navigate to={destination} replace />;
}

// ─── HR ────────────────────────────────────────────────────────────────
const HRDashboard = lazy(() => import('../features/hr/pages/HRDashboard'));
const EmployeeProfile = lazy(() => import('../features/hr/pages/EmployeeProfile'));
const EmployeeList = lazy(() => import('../features/hr/pages/EmployeeList'));
const AttendancePage = lazy(() => import('../features/hr/pages/AttendancePage'));
const LeaveManagement = lazy(() => import('../features/hr/pages/LeaveManagement'));
const PayrollPage = lazy(() => import('../features/hr/pages/PayrollPage'));
const RecruitmentPage = lazy(() => import('../features/hr/pages/RecruitmentPage'));
const PerformanceReview = lazy(() => import('../features/hr/pages/PerformanceReview'));
const ShiftScheduling = lazy(() => import('../features/hr/pages/ShiftScheduling'));

// ─── Inventory ──────────────────────────────────────────────────────────
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

// ─── Purchase Management ────────────────────────────────────────────────
const PurchaseDashboard = lazy(() => import('../features/purchase/pages/PurchaseDashboard'));
const VendorManagement = lazy(() => import('../features/account/pages/VendorManagement'));
const PurchaseRequests = lazy(() => import('../features/purchase/pages/PurchaseRequests'));
const PurchaseRequisitionDetail = lazy(() => import('../features/purchase/pages/PurchaseRequisitionDetail'));
const PurchaseRequisitionForm = lazy(() => import('../features/purchase/pages/PurchaseRequisitionForm'));
const RFQs = lazy(() => import('../features/purchase/pages/RFQs'));
const RFQForm = lazy(() => import('../features/purchase/pages/RFQForm'));
const RFQDetail = lazy(() => import('../features/purchase/pages/RFQDetail'));
const PurchaseOrders = lazy(() => import('../features/purchase/pages/PurchaseOrders'));
const SupplierQuotations = lazy(() => import('../features/purchase/pages/SupplierQuotations'));
const SupplierQuotationForm = lazy(() => import('../features/purchase/pages/SupplierQuotationForm'));
const SupplierQuotationDetail = lazy(() => import('../features/purchase/pages/SupplierQuotationDetail'));
const QuotationComparison = lazy(() => import('../features/purchase/pages/QuotationComparison'));
const PurchaseOrderCreate = lazy(() => import('../features/purchase/pages/PurchaseOrderCreate'));
const PurchaseOrderDetails = lazy(() => import('../features/purchase/pages/PurchaseOrderDetails'));
const APPayments = lazy(() => import('../features/purchase/pages/APPayments'));
const GoodsReceipts = lazy(() => import('../features/purchase/pages/GoodsReceipts'));
const APInvoices = lazy(() => import('../features/purchase/pages/APInvoices'));
const APInvoiceDetails = lazy(() => import('../features/purchase/pages/APInvoiceDetails'));

// ─── Manufacturing ──────────────────────────────────────────────────────
const ManufacturingDashboard = lazy(() => import('../features/manufacturing/pages/ManufacturingDashboard'));
const ProductionPage = lazy(() => import('../features/manufacturing/pages/ProductionPage'));
const BatchesPage = lazy(() => import('../features/manufacturing/pages/BatchesPage'));

// ─── Audit & Workflows ──────────────────────────────────────────────────
const AuditLogsPage = lazy(() => import('../features/audit/pages/AuditLogsPage'));
const WorkflowManagementPage = lazy(() => import('../features/workflows/pages/WorkflowManagementPage'));
const ApprovalRequestsPage = lazy(() => import('../features/workflows/pages/ApprovalRequestsPage'));
const DynamicWorkflowPage = lazy(() => import('../features/workflows/pages/DynamicWorkflowPage'));

export default function SharedCompanyRoutes({ prefix = "" }) {
  return (
    <>
      {/* HR & Employee */}
      <Route path={`${prefix}hr`} element={<CompanyRedirect to="hr/dashboard" />} />
      <Route path={`${prefix}hr/dashboard`} element={<ProtectedRoute module="HR"><HRDashboard /></ProtectedRoute>} />
      <Route path={`${prefix}hr/profile`} element={<ProtectedRoute module="HR"><EmployeeProfile /></ProtectedRoute>} />
      <Route path={`${prefix}hr/employees`} element={<ProtectedRoute module="HR"><EmployeeList /></ProtectedRoute>} />
      <Route path={`${prefix}hr/attendance`} element={<ProtectedRoute module="HR"><AttendancePage /></ProtectedRoute>} />
      <Route path={`${prefix}hr/leave`} element={<ProtectedRoute module="HR"><LeaveManagement /></ProtectedRoute>} />
      <Route path={`${prefix}hr/payroll`} element={<ProtectedRoute module="HR"><PayrollPage /></ProtectedRoute>} />
      <Route path={`${prefix}hr/recruitment`} element={<ProtectedRoute module="HR"><RecruitmentPage /></ProtectedRoute>} />
      <Route path={`${prefix}hr/performance`} element={<ProtectedRoute module="HR"><PerformanceReview /></ProtectedRoute>} />
      <Route path={`${prefix}hr/shifts`} element={<ProtectedRoute module="HR"><ShiftScheduling /></ProtectedRoute>} />
      <Route
        path={`${prefix}hr/audit`}
        element={<ProtectedRoute module="HR"><AuditLogsPage moduleFilter="HR" /></ProtectedRoute>}
      />

      {/* Inventory */}
      <Route element={<InventoryWrapper />}>
        <Route path={`${prefix}inventory`} element={<CompanyRedirect to="inventory/dashboard" />} />
        <Route path={`${prefix}inventory/dashboard`} element={<ProtectedRoute module="INVENTORY"><InventoryDashboard /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/unit-of-measures`} element={<ProtectedRoute module="PRODUCT_UOMS"><UnitOfMeasureManagement /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/unit-of-measures/:id`} element={<ProtectedRoute module="PRODUCT_UOMS"><GenericEntityDetails endpoint="/api/inventory/unit-of-measures" entityName="Unit of Measure" /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/warehouse`} element={<ProtectedRoute module="WAREHOUSES"><WarehouseManagement /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/warehouse/:id`} element={<ProtectedRoute module="WAREHOUSES"><WarehouseDetails /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/warehouse-locations`} element={<ProtectedRoute module="WAREHOUSE_LOCATIONS"><WarehouseLocationManagementPage /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/cost-layers`} element={<ProtectedRoute module="INVENTORY_VALUATION"><InventoryCostLayerManagement /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/cost-layers/:id`} element={<ProtectedRoute module="INVENTORY_VALUATION"><GenericEntityDetails endpoint="/api/inventory/inventory-cost-layers" entityName="Cost Layer" /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/periods`} element={<ProtectedRoute module="INVENTORY_VALUATION"><InventoryPeriodManagement /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/periods/:id`} element={<ProtectedRoute module="INVENTORY_VALUATION"><GenericEntityDetails endpoint="/api/inventory/inventory-periods" entityName="Inventory Period" /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/snapshots`} element={<ProtectedRoute module="INVENTORY_VALUATION"><InventorySnapshotManagement /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/snapshots/:id`} element={<ProtectedRoute module="INVENTORY_VALUATION"><GenericEntityDetails endpoint="/api/inventory/inventory-snapshots" entityName="Inventory Snapshot" /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/valuations`} element={<ProtectedRoute module="INVENTORY_VALUATION"><InventoryValuationManagement /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/valuations/:id`} element={<ProtectedRoute module="INVENTORY_VALUATION"><GenericEntityDetails endpoint="/api/inventory/inventory-valuations" entityName="Inventory Valuation" /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/opening-stock`} element={<ProtectedRoute module="OPENING_STOCK"><OpeningStockManagement /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/opening-stocks`} element={<ProtectedRoute module="OPENING_STOCK"><OpeningStockManagement /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/opening-stocks/:id`} element={<ProtectedRoute module="OPENING_STOCK"><OpeningStockDetails /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/stock`} element={<ProtectedRoute module="STOCK"><StockTracking /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/stocks`} element={<ProtectedRoute module="STOCK"><StockTracking /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/current-stock`} element={<ProtectedRoute module="STOCK"><StockTracking /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/stock-movements`} element={<ProtectedRoute module="STOCK_MOVEMENTS"><StockMovementManagement /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/stock-movements/:id`} element={<ProtectedRoute module="STOCK_MOVEMENTS"><GenericEntityDetails endpoint="/api/inventory/stock-movements" entityName="Stock Movement" /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/stock-movement-lines`} element={<ProtectedRoute module="STOCK_MOVEMENTS"><StockMovementLineManagement /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/stock-movement-lines/:id`} element={<ProtectedRoute module="STOCK_MOVEMENTS"><GenericEntityDetails endpoint="/api/inventory/stock-movement-lines" entityName="Stock Movement Line" /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/stock-reservations`} element={<ProtectedRoute module="STOCK_RESERVATIONS"><StockReservationManagement /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/stock-reservations/:id`} element={<ProtectedRoute module="STOCK_RESERVATIONS"><GenericEntityDetails endpoint="/api/inventory/stock-reservations" entityName="Stock Reservation" /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/stock-transfers`} element={<ProtectedRoute module="STOCK_TRANSFERS"><StockTransferManagement /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/stock-transfers/:id`} element={<ProtectedRoute module="STOCK_TRANSFERS"><StockTransferDetails /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/stock-adjustments`} element={<ProtectedRoute module="STOCK_ADJUSTMENTS"><StockAdjustmentManagement /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/stock-adjustments/:id`} element={<ProtectedRoute module="STOCK_ADJUSTMENTS"><StockAdjustmentDetails /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/product-batches`} element={<ProtectedRoute module="PRODUCT_BATCHES"><ProductBatchManagement /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/product-batches/:id`} element={<ProtectedRoute module="PRODUCT_BATCHES"><GenericEntityDetails endpoint="/api/inventory/product-batches" entityName="Product Batch" /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/products`} element={<ProtectedRoute module="PRODUCTS"><ProductManagement /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/products/:id`} element={<ProtectedRoute module="PRODUCTS"><GenericEntityDetails endpoint="/api/inventory/products" entityName="Product" /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/product-categories`} element={<ProtectedRoute module="PRODUCT_CATEGORIES"><ProductCategoryManagement /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/product-categories/:id`} element={<ProtectedRoute module="PRODUCT_CATEGORIES"><GenericEntityDetails endpoint="/api/inventory/product-categories" entityName="Product Category" /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/product-prices`} element={<ProtectedRoute module="PRODUCT_PRICES"><ProductPriceManagement /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/product-prices/:id`} element={<ProtectedRoute module="PRODUCT_PRICES"><GenericEntityDetails endpoint="/api/inventory/product-prices" entityName="Product Price" /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/product-serials`} element={<ProtectedRoute module="PRODUCT_SERIALS"><ProductSerialManagement /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/product-serials/:id`} element={<ProtectedRoute module="PRODUCT_SERIALS"><GenericEntityDetails endpoint="/api/inventory/product-serials" entityName="Product Serial" /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/product-uoms`} element={<ProtectedRoute module="PRODUCT_UOMS"><ProductUomManagement /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/product-uoms/:id`} element={<ProtectedRoute module="PRODUCT_UOMS"><GenericEntityDetails endpoint="/api/inventory/product-uoms" entityName="Product UOM" /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/reports`} element={<ProtectedRoute module="INVENTORY_REPORTS"><InventorySnapshotManagement /></ProtectedRoute>} />
        <Route path={`${prefix}inventory/inventory-posting`} element={<ProtectedRoute module="INVENTORY_POSTING"><InventoryDashboard /></ProtectedRoute>} />

        {/* Inventory convenience aliases */}
        <Route path={`${prefix}inventory/movements`} element={<CompanyRedirect to="inventory/stock-movements" />} />
        <Route path={`${prefix}inventory/adjustments`} element={<CompanyRedirect to="inventory/stock-adjustments" />} />
        <Route path={`${prefix}inventory/transfers`} element={<CompanyRedirect to="inventory/stock-transfers" />} />
        <Route path={`${prefix}inventory/valuation`} element={<CompanyRedirect to="inventory/valuations" />} />
        <Route path={`${prefix}inventory/warehouses`} element={<ProtectedRoute module="WAREHOUSES"><WarehouseManagement /></ProtectedRoute>} />
      </Route>

      {/* ─── Sales & CRM Module ─── */}
      {/* Convenience redirects & aliases */}
      <Route path={`${prefix}sales`} element={<CompanyRedirect to="sales-crm/dashboard" />} />
      <Route path={`${prefix}sales-crm`} element={<CompanyRedirect to="sales-crm/dashboard" />} />
      <Route path={`${prefix}crm`} element={<CompanyRedirect to="sales-crm/dashboard" />} />
      <Route path={`${prefix}sales/quotations`} element={<CompanyRedirect to="sales-crm/quotations" />} />
      <Route path={`${prefix}sales/orders`} element={<CompanyRedirect to="sales-crm/orders" />} />
      <Route path={`${prefix}sales/invoices`} element={<CompanyRedirect to="sales-crm/invoices" />} />
      <Route path={`${prefix}sales/delivery-challans`} element={<CompanyRedirect to="accounts/transactions/delivery-challans" />} />

      {/* Unified Enterprise Sales & CRM routes for /sales-crm/* and /crm/* */}
      {SharedCrmRoutes({ prefix: `${prefix}sales-crm/` })}
      {SharedCrmRoutes({ prefix: `${prefix}crm/` })}

      {/* Purchase Management */}
      <Route path={`${prefix}purchase`} element={<CompanyRedirect to="purchases/dashboard" />} />
      <Route path={`${prefix}purchase/requisitions`} element={<CompanyRedirect to="purchases/requisitions" />} />
      <Route path={`${prefix}purchase/rfqs`} element={<CompanyRedirect to="purchases/rfqs" />} />
      <Route path={`${prefix}purchase/orders`} element={<CompanyRedirect to="purchases/purchase-orders" />} />
      <Route path={`${prefix}purchase/grn`} element={<CompanyRedirect to="purchases/goods-receipts" />} />
      <Route path={`${prefix}purchase/invoices`} element={<CompanyRedirect to="purchases/invoices" />} />
      <Route path={`${prefix}purchase/payments`} element={<CompanyRedirect to="purchases/payments" />} />
      <Route path={`${prefix}purchases`} element={<CompanyRedirect to="purchases/dashboard" />} />
      <Route path={`${prefix}purchases/dashboard`} element={<ProtectedRoute module="PURCHASES"><PurchaseDashboard /></ProtectedRoute>} />
      <Route path={`${prefix}purchases/vendors`} element={<ProtectedRoute module="VENDORS"><VendorManagement /></ProtectedRoute>} />
      <Route element={<PurchaseModuleLayout />}>
        <Route path={`${prefix}purchases/requisitions`} element={<ProtectedRoute module="PURCHASE_REQUISITIONS"><PurchaseRequests /></ProtectedRoute>} />
        <Route path={`${prefix}purchases/purchase-requisitions`} element={<ProtectedRoute module="PURCHASE_REQUISITIONS"><PurchaseRequests /></ProtectedRoute>} />
        <Route path={`${prefix}purchases/purchase-requisitions/new`} element={<ProtectedRoute module="PURCHASE_REQUISITIONS"><PurchaseRequisitionForm /></ProtectedRoute>} />
        <Route path={`${prefix}purchases/purchase-requisitions/:id`} element={<ProtectedRoute module="PURCHASE_REQUISITIONS"><PurchaseRequisitionDetail /></ProtectedRoute>} />
        <Route path={`${prefix}purchases/purchase-requisitions/:id/edit`} element={<ProtectedRoute module="PURCHASE_REQUISITIONS"><PurchaseRequisitionForm /></ProtectedRoute>} />
        <Route path={`${prefix}purchases/rfqs`} element={<ProtectedRoute module="PURCHASE_ORDERS"><RFQs /></ProtectedRoute>} />
        <Route path={`${prefix}purchases/rfqs/new`} element={<ProtectedRoute module="PURCHASE_ORDERS"><RFQForm /></ProtectedRoute>} />
        <Route path={`${prefix}purchases/rfqs/:id`} element={<ProtectedRoute module="PURCHASE_ORDERS"><RFQDetail /></ProtectedRoute>} />
        <Route path={`${prefix}purchases/rfqs/:id/edit`} element={<ProtectedRoute module="PURCHASE_ORDERS"><RFQForm /></ProtectedRoute>} />
        <Route path={`${prefix}purchases/purchase-orders`} element={<ProtectedRoute module="PURCHASE_ORDERS"><PurchaseOrders /></ProtectedRoute>} />
        <Route path={`${prefix}purchases/orders`} element={<ProtectedRoute module="PURCHASE_ORDERS"><PurchaseOrders /></ProtectedRoute>} />
        <Route path={`${prefix}purchases/purchase-orders/new`} element={<ProtectedRoute module="PURCHASE_ORDERS"><PurchaseOrderCreate /></ProtectedRoute>} />
        <Route path={`${prefix}purchases/purchase-orders/:id`} element={<ProtectedRoute module="PURCHASE_ORDERS"><PurchaseOrderDetails /></ProtectedRoute>} />
        <Route path={`${prefix}purchases/goods-receipts`} element={<ProtectedRoute module="GOODS_RECEIPTS"><GoodsReceipts /></ProtectedRoute>} />
        <Route path={`${prefix}purchases/payments`} element={<ProtectedRoute module="PAYMENT_VOUCHERS"><APPayments /></ProtectedRoute>} />
        <Route path={`${prefix}purchases/quotations`} element={<ProtectedRoute module="PURCHASE_ORDERS"><SupplierQuotations /></ProtectedRoute>} />
        <Route path={`${prefix}purchases/supplier-quotes`} element={<ProtectedRoute module="PURCHASE_ORDERS"><SupplierQuotations /></ProtectedRoute>} />
        <Route path={`${prefix}purchases/supplier-quotations`} element={<ProtectedRoute module="PURCHASE_ORDERS"><SupplierQuotations /></ProtectedRoute>} />
        <Route path={`${prefix}purchases/supplier-quotations/new`} element={<ProtectedRoute module="PURCHASE_ORDERS"><SupplierQuotationForm /></ProtectedRoute>} />
        <Route path={`${prefix}purchases/supplier-quotations/:id`} element={<ProtectedRoute module="PURCHASE_ORDERS"><SupplierQuotationDetail /></ProtectedRoute>} />
        <Route path={`${prefix}purchases/supplier-quotations/:id/edit`} element={<ProtectedRoute module="PURCHASE_ORDERS"><SupplierQuotationForm /></ProtectedRoute>} />
        <Route path={`${prefix}purchases/supplier-quotations/compare/:rfqId`} element={<ProtectedRoute module="PURCHASE_ORDERS"><QuotationComparison /></ProtectedRoute>} />
        <Route path={`${prefix}purchases/invoices`} element={<ProtectedRoute module="PURCHASE_INVOICES"><APInvoices /></ProtectedRoute>} />
        <Route path={`${prefix}purchases/invoices/:id`} element={<ProtectedRoute module="PURCHASE_INVOICES"><APInvoiceDetails /></ProtectedRoute>} />
        <Route path={`${prefix}purchases/purchase-invoices`} element={<ProtectedRoute module="PURCHASE_INVOICES"><APInvoices /></ProtectedRoute>} />
      </Route>

      {/* Manufacturing */}
      <Route path={`${prefix}manufacturing`} element={<CompanyRedirect to="manufacturing/dashboard" />} />
      <Route path={`${prefix}manufacturing/dashboard`} element={<ProtectedRoute module="MANUFACTURING"><ManufacturingDashboard /></ProtectedRoute>} />
      <Route path={`${prefix}manufacturing/production`} element={<ProtectedRoute module="MANUFACTURING"><ProductionPage /></ProtectedRoute>} />
      <Route path={`${prefix}manufacturing/batches`} element={<ProtectedRoute module="MANUFACTURING"><BatchesPage /></ProtectedRoute>} />

      {/* Administration */}
      <Route path={`${prefix}workflows`} element={<ProtectedRoute module="WORKFLOW"><WorkflowManagementPage /></ProtectedRoute>} />
      <Route path={`${prefix}workflows/approvals`} element={<ProtectedRoute module="WORKFLOW"><ApprovalRequestsPage /></ProtectedRoute>} />
      <Route path={`${prefix}workflows/transactions/:transactionId`} element={<ProtectedRoute module="WORKFLOW"><DynamicWorkflowPage /></ProtectedRoute>} />
      <Route path={`${prefix}workflows/document/:documentType/:documentId`} element={<ProtectedRoute module="WORKFLOW"><DynamicWorkflowPage /></ProtectedRoute>} />
      <Route path={`${prefix}workflow`} element={<CompanyRedirect to="workflows" />} />
      <Route path={`${prefix}workflow/approvals`} element={<CompanyRedirect to="workflows/approvals" />} />
    </>
  );
}
