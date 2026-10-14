import React, { lazy } from 'react';
import { Route, Navigate, Outlet } from 'react-router-dom';
import PurchaseModuleLayout from '../components/common/PurchaseModuleLayout';

const InventoryWrapper = () => (
  <div className="p-4 sm:p-6 lg:p-8 max-w-[1280px] mx-auto w-full">
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
  return (
    <>
      {/* HR & Employee */}
      <Route path={`${prefix}hr`} element={<Navigate to={`${prefix}hr/dashboard`} replace />} />
      <Route path={`${prefix}hr/dashboard`} element={<HRDashboard />} />
      <Route path={`${prefix}hr/profile`} element={<EmployeeProfile />} />
      <Route path={`${prefix}hr/employees`} element={<EmployeeList />} />
      <Route path={`${prefix}hr/attendance`} element={<AttendancePage />} />
      <Route path={`${prefix}hr/leave`} element={<LeaveManagement />} />
      <Route path={`${prefix}hr/payroll`} element={<PayrollPage />} />
      <Route path={`${prefix}hr/recruitment`} element={<RecruitmentPage />} />
      <Route path={`${prefix}hr/performance`} element={<PerformanceReview />} />
      <Route path={`${prefix}hr/shifts`} element={<ShiftScheduling />} />
      <Route
        path={`${prefix}hr/audit`}
        element={<AuditLogsPage moduleFilter="HR" />}
      />

      {/* Inventory */}
      <Route element={<InventoryWrapper />}>
        <Route path={`${prefix}inventory`} element={<Navigate to={`${prefix}inventory/dashboard`} replace />} />
        <Route path={`${prefix}inventory/dashboard`} element={<InventoryDashboard />} />
        <Route path={`${prefix}inventory/unit-of-measures`} element={<UnitOfMeasureManagement />} />
        <Route path={`${prefix}inventory/unit-of-measures/:id`} element={<GenericEntityDetails endpoint="/api/inventory/unit-of-measures" entityName="Unit of Measure" />} />
        <Route path={`${prefix}inventory/warehouse`} element={<WarehouseManagement />} />
        <Route path={`${prefix}inventory/warehouse/:id`} element={<WarehouseDetails />} />
        <Route path={`${prefix}inventory/warehouse-locations`} element={<WarehouseLocationManagementPage />} />
        <Route path={`${prefix}inventory/cost-layers`} element={<InventoryCostLayerManagement />} />
        <Route path={`${prefix}inventory/cost-layers/:id`} element={<GenericEntityDetails endpoint="/api/inventory/inventory-cost-layers" entityName="Cost Layer" />} />
        <Route path={`${prefix}inventory/periods`} element={<InventoryPeriodManagement />} />
        <Route path={`${prefix}inventory/periods/:id`} element={<GenericEntityDetails endpoint="/api/inventory/inventory-periods" entityName="Inventory Period" />} />
        <Route path={`${prefix}inventory/snapshots`} element={<InventorySnapshotManagement />} />
        <Route path={`${prefix}inventory/snapshots/:id`} element={<GenericEntityDetails endpoint="/api/inventory/inventory-snapshots" entityName="Inventory Snapshot" />} />
        <Route path={`${prefix}inventory/valuations`} element={<InventoryValuationManagement />} />
        <Route path={`${prefix}inventory/valuations/:id`} element={<GenericEntityDetails endpoint="/api/inventory/inventory-valuations" entityName="Inventory Valuation" />} />
        <Route path={`${prefix}inventory/opening-stocks`} element={<OpeningStockManagement />} />
        <Route path={`${prefix}inventory/opening-stocks/:id`} element={<OpeningStockDetails />} />
        <Route path={`${prefix}inventory/stock-movements`} element={<StockMovementManagement />} />
        <Route path={`${prefix}inventory/stock-movements/:id`} element={<GenericEntityDetails endpoint="/api/inventory/stock-movements" entityName="Stock Movement" />} />
        <Route path={`${prefix}inventory/stock-movement-lines`} element={<StockMovementLineManagement />} />
        <Route path={`${prefix}inventory/stock-movement-lines/:id`} element={<GenericEntityDetails endpoint="/api/inventory/stock-movement-lines" entityName="Stock Movement Line" />} />
        <Route path={`${prefix}inventory/stock-reservations`} element={<StockReservationManagement />} />
        <Route path={`${prefix}inventory/stock-reservations/:id`} element={<GenericEntityDetails endpoint="/api/inventory/stock-reservations" entityName="Stock Reservation" />} />
        <Route path={`${prefix}inventory/stock-transfers`} element={<StockTransferManagement />} />
        <Route path={`${prefix}inventory/stock-transfers/:id`} element={<StockTransferDetails />} />
        <Route path={`${prefix}inventory/stock-adjustments`} element={<StockAdjustmentManagement />} />
        <Route path={`${prefix}inventory/stock-adjustments/:id`} element={<StockAdjustmentDetails />} />
        <Route path={`${prefix}inventory/product-batches`} element={<ProductBatchManagement />} />
        <Route path={`${prefix}inventory/product-batches/:id`} element={<GenericEntityDetails endpoint="/api/inventory/product-batches" entityName="Product Batch" />} />
        <Route path={`${prefix}inventory/products`} element={<ProductManagement />} />
        <Route path={`${prefix}inventory/products/:id`} element={<GenericEntityDetails endpoint="/api/inventory/products" entityName="Product" />} />
        <Route path={`${prefix}inventory/product-categories`} element={<ProductCategoryManagement />} />
        <Route path={`${prefix}inventory/product-categories/:id`} element={<GenericEntityDetails endpoint="/api/inventory/product-categories" entityName="Product Category" />} />
        <Route path={`${prefix}inventory/product-prices`} element={<ProductPriceManagement />} />
        <Route path={`${prefix}inventory/product-prices/:id`} element={<GenericEntityDetails endpoint="/api/inventory/product-prices" entityName="Product Price" />} />
        <Route path={`${prefix}inventory/product-serials`} element={<ProductSerialManagement />} />
        <Route path={`${prefix}inventory/product-serials/:id`} element={<GenericEntityDetails endpoint="/api/inventory/product-serials" entityName="Product Serial" />} />
        <Route path={`${prefix}inventory/product-uoms`} element={<ProductUomManagement />} />
        <Route path={`${prefix}inventory/product-uoms/:id`} element={<GenericEntityDetails endpoint="/api/inventory/product-uoms" entityName="Product UOM" />} />

        {/* Inventory convenience aliases */}
        <Route path={`${prefix}inventory/movements`} element={<Navigate to={`../${prefix}inventory/stock-movements`} replace />} />
        <Route path={`${prefix}inventory/adjustments`} element={<Navigate to={`../${prefix}inventory/stock-adjustments`} replace />} />
        <Route path={`${prefix}inventory/transfers`} element={<Navigate to={`../${prefix}inventory/stock-transfers`} replace />} />
        <Route path={`${prefix}inventory/valuation`} element={<Navigate to={`../${prefix}inventory/valuations`} replace />} />
        <Route path={`${prefix}inventory/warehouses`} element={<Navigate to={`../${prefix}inventory/warehouse`} replace />} />
      </Route>

      {/* Sales & CRM */}
      <Route path={`${prefix}sales`} element={<Navigate to={`${prefix}sales-crm/dashboard`} replace />} />
      <Route path={`${prefix}sales/quotations`} element={<Navigate to={`../${prefix}sales-crm/quotations`} replace />} />
      <Route path={`${prefix}sales/orders`} element={<Navigate to={`../${prefix}sales-crm/orders`} replace />} />
      <Route path={`${prefix}sales/delivery-challans`} element={<Navigate to={`../accounts/transactions/delivery-challans`} replace />} />
      <Route path={`${prefix}sales/invoices`} element={<Navigate to={`../${prefix}sales-crm/invoices`} replace />} />
      <Route path={`${prefix}sales-crm`} element={<Navigate to={`${prefix}sales-crm/dashboard`} replace />} />
      <Route path={`${prefix}sales-crm/dashboard`} element={<SalesCRMDashboard />} />
      <Route path={`${prefix}sales-crm/customers`} element={<CustomerManagement />} />
      <Route path={`${prefix}sales-crm/customers/:id`} element={<CustomerDetails />} />
      <Route path={`${prefix}sales-crm/leads`} element={<LeadTracking />} />
      <Route path={`${prefix}sales-crm/quotations`} element={<QuotationsPage />} />
      <Route path={`${prefix}sales-crm/quotations/:id`} element={<QuotationDetails />} />
      <Route path={`${prefix}sales-crm/orders`} element={<SalesOrders />} />
      <Route
        path={`${prefix}sales-crm/communication`}
        element={<CustomerCommunication />}
      />
      <Route path={`${prefix}sales-crm/analytics`} element={<SalesAnalytics />} />
      <Route path={`${prefix}sales-crm/invoices`} element={<SalesInvoices />} />
      <Route
        path={`${prefix}sales-crm/invoices/create-from-order/:salesOrderId`}
        element={<InvoicePreviewPage />}
      />
      <Route
        path={`${prefix}sales-crm/invoices/:id`}
        element={<SalesInvoiceDetails />}
      />
      <Route
        path={`${prefix}sales-crm/audit`}
        element={<AuditLogsPage moduleFilter="Sales" />}
      />

      {/* Purchase Management */}
      <Route path={`${prefix}purchase`} element={<Navigate to={`${prefix}purchases/dashboard`} replace />} />
      <Route path={`${prefix}purchase/requisitions`} element={<Navigate to={`../${prefix}purchases/requisitions`} replace />} />
      <Route path={`${prefix}purchase/rfqs`} element={<Navigate to={`../${prefix}purchases/rfqs`} replace />} />
      <Route path={`${prefix}purchase/orders`} element={<Navigate to={`../${prefix}purchases/purchase-orders`} replace />} />
      <Route path={`${prefix}purchase/grn`} element={<Navigate to={`../${prefix}purchases/goods-receipts`} replace />} />
      <Route path={`${prefix}purchase/invoices`} element={<Navigate to={`../${prefix}purchases/invoices`} replace />} />
      <Route path={`${prefix}purchase/payments`} element={<Navigate to={`../${prefix}purchases/payments`} replace />} />
      <Route path={`${prefix}purchases`} element={<Navigate to={`${prefix}purchases/dashboard`} replace />} />
      <Route path={`${prefix}purchases/dashboard`} element={<PurchaseDashboard />} />
      <Route path={`${prefix}purchases/vendors`} element={<VendorManagement />} />
      <Route element={<PurchaseModuleLayout />}>
        <Route path={`${prefix}purchases/requisitions`} element={<PurchaseRequests />} />
        <Route path={`${prefix}purchases/purchase-requisitions`} element={<PurchaseRequests />} />
        <Route path={`${prefix}purchases/purchase-requisitions/new`} element={<PurchaseRequisitionForm />} />
        <Route path={`${prefix}purchases/purchase-requisitions/:id`} element={<PurchaseRequisitionDetail />} />
        <Route path={`${prefix}purchases/purchase-requisitions/:id/edit`} element={<PurchaseRequisitionForm />} />
        <Route path={`${prefix}purchases/rfqs`} element={<RFQs />} />
        <Route path={`${prefix}purchases/rfqs/new`} element={<RFQForm />} />
        <Route path={`${prefix}purchases/rfqs/:id`} element={<RFQDetail />} />
        <Route path={`${prefix}purchases/rfqs/:id/edit`} element={<RFQForm />} />
        <Route path={`${prefix}purchases/purchase-orders`} element={<PurchaseOrders />} />
        <Route path={`${prefix}purchases/orders`} element={<PurchaseOrders />} />
        <Route path={`${prefix}purchases/purchase-orders/new`} element={<PurchaseOrderCreate />} />
        <Route path={`${prefix}purchases/purchase-orders/:id`} element={<PurchaseOrderDetails />} />
        <Route path={`${prefix}purchases/goods-receipts`} element={<GoodsReceipts />} />
        <Route path={`${prefix}purchases/payments`} element={<APPayments />} />
        <Route path={`${prefix}purchases/quotations`} element={<SupplierQuotations />} />
        <Route path={`${prefix}purchases/supplier-quotes`} element={<SupplierQuotations />} />
        <Route path={`${prefix}purchases/supplier-quotations`} element={<SupplierQuotations />} />
        <Route path={`${prefix}purchases/supplier-quotations/new`} element={<SupplierQuotationForm />} />
        <Route path={`${prefix}purchases/supplier-quotations/:id`} element={<SupplierQuotationDetail />} />
        <Route path={`${prefix}purchases/supplier-quotations/:id/edit`} element={<SupplierQuotationForm />} />
        <Route path={`${prefix}purchases/supplier-quotations/compare/:rfqId`} element={<QuotationComparison />} />
        <Route path={`${prefix}purchases/invoices`} element={<APInvoices />} />
        <Route path={`${prefix}purchases/invoices/:id`} element={<APInvoiceDetails />} />
        <Route path={`${prefix}purchases/purchase-invoices`} element={<APInvoices />} />
      </Route>

      {/* Manufacturing */}
      <Route path={`${prefix}manufacturing`} element={<Navigate to={`${prefix}manufacturing/dashboard`} replace />} />
      <Route path={`${prefix}manufacturing/dashboard`} element={<ManufacturingDashboard />} />
      <Route path={`${prefix}manufacturing/production`} element={<ProductionPage />} />
      <Route path={`${prefix}manufacturing/batches`} element={<BatchesPage />} />

      {/* Administration */}
      <Route path={`${prefix}workflows`} element={<WorkflowManagementPage />} />
      <Route path={`${prefix}workflows/approvals`} element={<ApprovalRequestsPage />} />
      <Route path={`${prefix}workflows/transactions/:transactionId`} element={<DynamicWorkflowPage />} />
      <Route path={`${prefix}workflows/document/:documentType/:documentId`} element={<DynamicWorkflowPage />} />
      <Route path={`${prefix}workflow`} element={<Navigate to={`${prefix}workflows`} replace />} />
      <Route path={`${prefix}workflow/approvals`} element={<Navigate to={`${prefix}workflows/approvals`} replace />} />
    </>
  );
}
