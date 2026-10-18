import React, { lazy } from 'react';
import { Route, Navigate, Outlet } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PurchaseModuleLayout from '../components/common/PurchaseModuleLayout';

const InventoryWrapper = () => (
  <div className="flex-1 min-h-0 min-w-0 flex flex-col w-full h-full">
    <Outlet />
  </div>
);

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


// ─── Sales & CRM ────────────────────────────────────────────────────────
const SalesCRMDashboard = lazy(() => import('../features/sales/pages/SalesCRMDashboard'));
const CustomerManagement = lazy(() => import("../features/account/pages/CustomerManagement"));
const CustomerDetails = lazy(() => import("../features/account/pages/CustomerDetails"));
const LeadTracking = lazy(() => import('../features/sales/pages/LeadTracking'));
const QuotationsPage = lazy(() => import('../features/sales/pages/QuotationsPage'));
const QuotationDetails = lazy(() => import('../features/sales/pages/QuotationDetails'));
const SalesOrders = lazy(() => import("../features/sales/pages/SalesOrdersPage"));
const CustomerCommunication = lazy(() => import('../features/sales/pages/CustomerCommunication'));
const SalesAnalytics = lazy(() => import('../features/sales/pages/SalesAnalytics'));
const SalesInvoices = lazy(() => import('../features/sales/pages/SalesInvoices'));
const SalesInvoiceDetails = lazy(() => import('../features/sales/pages/SalesInvoiceDetails'));
const InvoicePreviewPage = lazy(() => import('../features/sales/pages/InvoicePreviewPage'));

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

// ─── Audit ──────────────────────────────────────────────────────────────
const AuditLogsPage = lazy(() => import('../features/audit/pages/AuditLogsPage'));
const WorkflowManagementPage = lazy(() => import('../features/workflows/pages/WorkflowManagementPage'));
const ApprovalRequestsPage = lazy(() => import('../features/workflows/pages/ApprovalRequestsPage'));
const DynamicWorkflowPage = lazy(() => import('../features/workflows/pages/DynamicWorkflowPage'));

export default function SharedCompanyRoutes({ prefix = "" }) {
  const toPath = (sub) => ('/' + prefix + sub).replace(/\/{2,}/g, '/');

  return (
    <>
      {/* HR & Employee */}
      <Route path={`${prefix}hr`} element={<Navigate to={toPath('hr/dashboard')} replace />} />
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
        <Route path={`${prefix}inventory`} element={<Navigate to={toPath('inventory/dashboard')} replace />} />
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
        <Route path={`${prefix}inventory/movements`} element={<Navigate to={toPath('inventory/stock-movements')} replace />} />
        <Route path={`${prefix}inventory/adjustments`} element={<Navigate to={toPath('inventory/stock-adjustments')} replace />} />
        <Route path={`${prefix}inventory/transfers`} element={<Navigate to={toPath('inventory/stock-transfers')} replace />} />
        <Route path={`${prefix}inventory/valuation`} element={<Navigate to={toPath('inventory/valuations')} replace />} />
        <Route path={`${prefix}inventory/warehouses`} element={<ProtectedRoute module="WAREHOUSES"><WarehouseManagement /></ProtectedRoute>} />
      </Route>

      {/* Sales & CRM */}
      <Route path={`${prefix}sales`} element={<Navigate to={toPath('sales-crm/dashboard')} replace />} />
      <Route path={`${prefix}sales/quotations`} element={<Navigate to={toPath('sales-crm/quotations')} replace />} />
      <Route path={`${prefix}sales/orders`} element={<Navigate to={toPath('sales-crm/orders')} replace />} />
      <Route path={`${prefix}sales/delivery-challans`} element={<Navigate to={toPath('accounts/transactions/delivery-challans')} replace />} />
      <Route path={`${prefix}sales/invoices`} element={<Navigate to={toPath('sales-crm/invoices')} replace />} />
      <Route path={`${prefix}sales-crm`} element={<Navigate to={toPath('sales-crm/dashboard')} replace />} />
      <Route path={`${prefix}sales-crm/dashboard`} element={<ProtectedRoute module="CRM"><SalesCRMDashboard /></ProtectedRoute>} />
      <Route path={`${prefix}sales-crm/customers`} element={<ProtectedRoute module="CUSTOMERS"><CustomerManagement /></ProtectedRoute>} />
      <Route path={`${prefix}sales-crm/customers/:id`} element={<ProtectedRoute module="CUSTOMERS"><CustomerDetails /></ProtectedRoute>} />
      <Route path={`${prefix}sales-crm/leads`} element={<ProtectedRoute module="LEADS"><LeadTracking /></ProtectedRoute>} />
      <Route path={`${prefix}sales-crm/quotations`} element={<ProtectedRoute module="QUOTATIONS"><QuotationsPage /></ProtectedRoute>} />
      <Route path={`${prefix}sales-crm/quotations/:id`} element={<ProtectedRoute module="QUOTATIONS"><QuotationDetails /></ProtectedRoute>} />
      <Route path={`${prefix}sales-crm/orders`} element={<ProtectedRoute module="SALES_ORDERS"><SalesOrders /></ProtectedRoute>} />
      <Route
        path={`${prefix}sales-crm/communication`}
        element={<ProtectedRoute module="COMMUNICATION"><CustomerCommunication /></ProtectedRoute>}
      />
      <Route path={`${prefix}sales-crm/analytics`} element={<ProtectedRoute module="ANALYTICS"><SalesAnalytics /></ProtectedRoute>} />
      <Route path={`${prefix}sales-crm/invoices`} element={<ProtectedRoute module="SALES_INVOICES"><SalesInvoices /></ProtectedRoute>} />
      <Route
        path={`${prefix}sales-crm/invoices/create-from-order/:salesOrderId`}
        element={<ProtectedRoute module="SALES_INVOICES"><InvoicePreviewPage /></ProtectedRoute>}
      />
      <Route
        path={`${prefix}sales-crm/invoices/:id`}
        element={<ProtectedRoute module="SALES_INVOICES"><SalesInvoiceDetails /></ProtectedRoute>}
      />
      <Route
        path={`${prefix}sales-crm/audit`}
        element={<ProtectedRoute module="AUDIT_LOGS"><AuditLogsPage moduleFilter="Sales" /></ProtectedRoute>}
      />

      {/* Purchase Management */}
      <Route path={`${prefix}purchase`} element={<Navigate to={toPath('purchases/dashboard')} replace />} />
      <Route path={`${prefix}purchase/requisitions`} element={<Navigate to={toPath('purchases/requisitions')} replace />} />
      <Route path={`${prefix}purchase/rfqs`} element={<Navigate to={toPath('purchases/rfqs')} replace />} />
      <Route path={`${prefix}purchase/orders`} element={<Navigate to={toPath('purchases/purchase-orders')} replace />} />
      <Route path={`${prefix}purchase/grn`} element={<Navigate to={toPath('purchases/goods-receipts')} replace />} />
      <Route path={`${prefix}purchase/invoices`} element={<Navigate to={toPath('purchases/invoices')} replace />} />
      <Route path={`${prefix}purchase/payments`} element={<Navigate to={toPath('purchases/payments')} replace />} />
      <Route path={`${prefix}purchases`} element={<Navigate to={toPath('purchases/dashboard')} replace />} />
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
      <Route path={`${prefix}manufacturing`} element={<Navigate to={toPath('manufacturing/dashboard')} replace />} />
      <Route path={`${prefix}manufacturing/dashboard`} element={<ProtectedRoute module="MANUFACTURING"><ManufacturingDashboard /></ProtectedRoute>} />
      <Route path={`${prefix}manufacturing/production`} element={<ProtectedRoute module="MANUFACTURING"><ProductionPage /></ProtectedRoute>} />
      <Route path={`${prefix}manufacturing/batches`} element={<ProtectedRoute module="MANUFACTURING"><BatchesPage /></ProtectedRoute>} />

      {/* Administration */}
      <Route path={`${prefix}workflows`} element={<ProtectedRoute module="WORKFLOW"><WorkflowManagementPage /></ProtectedRoute>} />
      <Route path={`${prefix}workflows/approvals`} element={<ProtectedRoute module="WORKFLOW"><ApprovalRequestsPage /></ProtectedRoute>} />
      <Route path={`${prefix}workflows/transactions/:transactionId`} element={<ProtectedRoute module="WORKFLOW"><DynamicWorkflowPage /></ProtectedRoute>} />
      <Route path={`${prefix}workflows/document/:documentType/:documentId`} element={<ProtectedRoute module="WORKFLOW"><DynamicWorkflowPage /></ProtectedRoute>} />
      <Route path={`${prefix}workflow`} element={<Navigate to={toPath('workflows')} replace />} />
      <Route path={`${prefix}workflow/approvals`} element={<Navigate to={toPath('workflows/approvals')} replace />} />
    </>
  );
}
