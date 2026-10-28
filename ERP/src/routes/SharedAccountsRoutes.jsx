import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PurchaseModuleLayout from '../components/common/PurchaseModuleLayout';
import SalesOrderDetails from '../features/sales/pages/SalesOrderDetails';

// Lazy loaded components (imported where used, but for shared routes we can import them)
import { lazy } from 'react';
const AccountDashboard = lazy(() => import("../features/account/pages/AccountDashboard"));
const FiscalYears = lazy(() => import("../features/finance/pages/FiscalYears"));
const FiscalYearDetails = lazy(() => import("../features/finance/pages/FiscalYearDetails"));
const AccountingPeriods = lazy(() => import("../features/finance/pages/AccountingPeriods"));
const AccountingPeriodDetails = lazy(() => import("../features/finance/pages/AccountingPeriodDetails"));
const ChartOfAccounts = lazy(() => import("../features/finance/pages/ChartOfAccounts"));
const LedgerDetails = lazy(() => import("../features/finance/pages/LedgerDetails"));
const CustomerManagement = lazy(() => import("../features/account/pages/CustomerManagement"));
const CustomerDetails = lazy(() => import("../features/account/pages/CustomerDetails"));
const VendorManagement = lazy(() => import("../features/account/pages/VendorManagement"));
const VendorDetails = lazy(() => import("../features/account/pages/VendorDetails"));
const BankAccounts = lazy(() => import("../features/account/pages/BankAccountsManagement"));
const BankAccountDetails = lazy(() => import("../features/finance/pages/BankAccountDetails"));
const AccountCategories = lazy(() => import("../features/finance/pages/AccountCategories"));
const AccountCategoryDetails = lazy(() => import("../features/finance/pages/AccountCategoryDetails"));
const AccountGroups = lazy(() => import("../features/finance/pages/AccountGroups"));
const AccountGroupDetails = lazy(() => import("../features/finance/pages/AccountGroupDetails"));
const GstSlabs = lazy(() => import("../features/finance/pages/GstSlabs"));
const GstSlabDetails = lazy(() => import("../features/finance/pages/GstSlabDetails"));
const HsnSac = lazy(() => import("../features/finance/pages/HsnSac"));
const HsnSacDetails = lazy(() => import("../features/finance/pages/HsnSacDetails"));
const ExpenseCategoriesManagement = lazy(() => import("../features/account/pages/ExpenseCategoriesManagement"));
const ExpenseCategoryDetails = lazy(() => import("../features/account/pages/ExpenseCategoryDetails"));

const SalesInvoices = lazy(() => import("../features/sales/pages/SalesInvoices"));
const SalesInvoiceDetails = lazy(() => import("../features/sales/pages/SalesInvoiceDetails"));
const InvoicePreviewPage = lazy(() => import("../features/sales/pages/InvoicePreviewPage"));
const QuotationsPage = lazy(() => import("../features/sales/pages/QuotationsPage"));
const QuotationDetails = lazy(() => import("../features/sales/pages/QuotationDetails"));
const ProformaInvoicesPage = lazy(() => import("../features/sales/pages/ProformaInvoicesPage"));
const ProformaInvoiceDetails = lazy(() => import("../features/sales/pages/ProformaInvoiceDetails"));
const DeliveryChallansPage = lazy(() => import("../features/sales/pages/DeliveryChallansPage"));
const SalesOrdersPage = lazy(() => import("../features/sales/pages/SalesOrdersPage"));
const BudgetHeaders = lazy(() => import("../features/finance/pages/BudgetHeaders"));
const BudgetHeaderDetails = lazy(() => import("../features/finance/pages/BudgetHeaderDetails"));
const BudgetLines = lazy(() => import("../features/finance/pages/BudgetLines"));
const BudgetLineDetails = lazy(() => import("../features/finance/pages/BudgetLineDetails"));
const APInvoices = lazy(() => import("../features/purchase/pages/APInvoices"));
const APInvoiceDetails = lazy(() => import("../features/purchase/pages/APInvoiceDetails"));
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
const JournalEntries = lazy(() => import("../features/finance/pages/JournalEntries"));
const JournalEntryDetails = lazy(() => import("../features/finance/pages/JournalEntryDetails"));
const JournalLines = lazy(() => import("../features/finance/pages/JournalLines"));
const JournalLineDetails = lazy(() => import("../features/finance/pages/JournalLineDetails"));
const JournalLinesByJournal = lazy(() => import("../features/finance/pages/JournalLinesByJournal"));
const JournalLinesByAccount = lazy(() => import("../features/finance/pages/JournalLinesByAccount"));
const PaymentVouchers = lazy(() => import("../features/purchase/pages/PaymentVouchers"));
const PaymentVoucherDetails = lazy(() => import("../features/purchase/pages/PaymentVoucherDetails"));
const ReceiptVouchers = lazy(() => import("../features/finance/pages/ReceiptVouchers"));
const ReceiptVoucherDetails = lazy(() => import("../features/finance/pages/ReceiptVoucherDetails"));
const CreditNotes = lazy(() => import("../features/finance/pages/CreditNotes"));
const CreditNoteDetails = lazy(() => import("../features/finance/pages/CreditNoteDetails"));
const DebitNotes = lazy(() => import("../features/finance/pages/DebitNotes"));
const DebitNoteDetails = lazy(() => import("../features/finance/pages/DebitNoteDetails"));
const BankTransactions = lazy(() => import("../features/account/pages/BankTransactionsManagement"));
const BankTransactionDetails = lazy(() => import("../features/finance/pages/BankTransactionDetails"));
const ApPayments = lazy(() => import("../features/finance/pages/ApPayments"));
const ApPaymentDetails = lazy(() => import("../features/finance/pages/ApPaymentDetails"));
const BankReconciliation = lazy(() => import("../features/finance/pages/BankReconciliation"));


const TrialBalance = lazy(() => import("../features/finance/pages/TrialBalance"));
const HsnReport = lazy(() => import("../features/finance/pages/HsnReport"));
const GstReports = lazy(() => import("../features/reports/pages/GstReports"));
const BudgetVarianceReport = lazy(() => import("../features/finance/pages/BudgetVarianceReport"));
const SacReport = lazy(() => import("../features/finance/pages/SacReport"));
const GeneralLedger = lazy(() => import("../features/finance/pages/GeneralLedger"));
const BankLedger = lazy(() => import("../features/finance/pages/BankLedger"));
const LedgerView = lazy(() => import("../features/finance/pages/LedgerView"));
const ProfitLoss = lazy(() => import("../features/finance/pages/ProfitLoss"));
const BalanceSheet = lazy(() => import("../features/finance/pages/BalanceSheet"));
const CashFlow = lazy(() => import("../features/finance/pages/CashFlow"));
const GstReportPage = lazy(() => import("../features/gst-reports/pages/GstReportPage"));
const ExportReportsPage = lazy(() => import("../features/gst-reports/pages/ExportReportsPage"));
const Gstr2bHistoryPage = lazy(() => import("../features/gst-reports/pages/Gstr2bHistoryPage"));


const GstStateMaster = lazy(() => import("../features/finance/pages/GstStateMaster"));
const GstStateMasterDetails = lazy(() => import("../features/finance/pages/GstStateMasterDetails"));
const GstRegistrations = lazy(() => import("../features/finance/pages/GstRegistrations"));
const GstRegistrationsDetails = lazy(() => import("../features/finance/pages/GstRegistrationsDetails"));
const BudgetManagement = lazy(() => import("../features/finance/pages/BudgetManagement"));
const ApprovalWorkflow = lazy(() => import("../features/purchase/pages/ApprovalWorkflow"));
const AuditLogsPage = lazy(() => import("../features/audit/pages/AuditLogsPage"));
const SalesSettings = lazy(() => import("../features/finance/pages/SalesSettings"));
const ExpenseTracking = lazy(() => import("../features/finance/pages/ExpenseTracking"));

export const SharedAccountsRoutes = ({ prefix = '' }) => {
  const toPath = (sub) => ('/' + prefix + sub).replace(/\/{2,}/g, '/');

  return (
    <>
      <Route
        path={`${prefix}masters/bank-accounts/:id/ledger`}
        element={
          <ProtectedRoute module="BANK_ACCOUNTS">
            <BankLedger />
          </ProtectedRoute>
        }
      />
      <Route path={`${prefix}dashboard`} element={<AccountDashboard />} />
      <Route
        path={`${prefix}organization/financial-years`}
        element={
          <ProtectedRoute module="FISCAL_YEARS">
            <FiscalYears />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}organization/financial-years/:id`}
        element={
          <ProtectedRoute module="FISCAL_YEARS">
            <FiscalYearDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}organization/accounting-periods`}
        element={
          <ProtectedRoute module="ACCOUNTING_PERIODS">
            <AccountingPeriods />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}organization/accounting-periods/:id`}
        element={
          <ProtectedRoute module="ACCOUNTING_PERIODS">
            <AccountingPeriodDetails />
          </ProtectedRoute>
        }
      />
      {/* Aliases for direct convenience paths */}
      <Route path={`${prefix}chart-of-accounts`} element={<Navigate to={toPath('masters/ledgers')} replace />} />
      <Route path={`${prefix}customers`} element={<Navigate to={toPath('masters/customers')} replace />} />
      <Route path={`${prefix}vendors`} element={<Navigate to={toPath('masters/vendors')} replace />} />
      <Route path={`${prefix}fiscal-years`} element={<Navigate to={toPath('organization/financial-years')} replace />} />
      <Route path={`${prefix}accounting-periods`} element={<Navigate to={toPath('organization/accounting-periods')} replace />} />
      <Route path={`${prefix}bank-accounts`} element={<Navigate to={toPath('masters/bank-accounts')} replace />} />

      {/* Masters */}
      <Route
        path={`${prefix}masters/ledgers`}
        element={
          <ProtectedRoute module="CHART_OF_ACCOUNTS">
            <ChartOfAccounts />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}masters/ledgers/:id`}
        element={
          <ProtectedRoute module="CHART_OF_ACCOUNTS">
            <LedgerDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}masters/chart-of-accounts`}
        element={
          <ProtectedRoute module="CHART_OF_ACCOUNTS">
            <ChartOfAccounts />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}masters/chart-of-accounts/:id`}
        element={
          <ProtectedRoute module="CHART_OF_ACCOUNTS">
            <LedgerDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}masters/customers`}
        element={
          <ProtectedRoute module="CUSTOMERS">
            <CustomerManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}masters/customers/:id`}
        element={
          <ProtectedRoute module="CUSTOMERS">
            <CustomerDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}masters/vendors`}
        element={
          <ProtectedRoute module="VENDORS">
            <VendorManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}masters/vendors/:id`}
        element={
          <ProtectedRoute module="VENDORS">
            <VendorDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}masters/bank-accounts`}
        element={
          <ProtectedRoute module="BANK_ACCOUNTS">
            <BankAccounts />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}masters/bank-accounts/:id`}
        element={
          <ProtectedRoute module="BANK_ACCOUNTS">
            <BankAccountDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}masters/expense-categories`}
        element={
          <ProtectedRoute module="EXPENSES">
            <ExpenseCategoriesManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}masters/expense-categories/:id`}
        element={
          <ProtectedRoute module="EXPENSES">
            <ExpenseCategoryDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}masters/account-categories`}
        element={
          <ProtectedRoute module="ACCOUNT_CATEGORIES">
            <AccountCategories />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}masters/account-categories/:id`}
        element={
          <ProtectedRoute module="ACCOUNT_CATEGORIES">
            <AccountCategoryDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}masters/account-groups`}
        element={
          <ProtectedRoute module="ACCOUNT_GROUPS">
            <AccountGroups />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}masters/account-groups/:id`}
        element={
          <ProtectedRoute module="ACCOUNT_GROUPS">
            <AccountGroupDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}masters/gst-slabs`}
        element={
          <ProtectedRoute module="GST_SLABS">
            <GstSlabs />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}masters/gst-slabs/:id`}
        element={
          <ProtectedRoute module="GST_SLABS">
            <GstSlabDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}masters/hsn-sac`}
        element={
          <ProtectedRoute module="HSN_SAC">
            <HsnSac />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}masters/hsn-sac/:id`}
        element={
          <ProtectedRoute module="HSN_SAC">
            <HsnSacDetails />
          </ProtectedRoute>
        }
      />

      {/* Transactions */}
      <Route
        path={`${prefix}transactions/sales`}
        element={
          <ProtectedRoute module="SALES_INVOICES">
            <SalesInvoices />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}transactions/sales/create-from-order/:salesOrderId`}
        element={
          <ProtectedRoute module="SALES_INVOICES">
            <InvoicePreviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}transactions/quotations`}
        element={
          <ProtectedRoute module="QUOTATIONS">
            <QuotationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}transactions/proforma-invoices`}
        element={
          <ProtectedRoute module="QUOTATIONS">
            <ProformaInvoicesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}transactions/proforma-invoices/:id`}
        element={
          <ProtectedRoute module="QUOTATIONS">
            <ProformaInvoiceDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}transactions/sales-orders`}
        element={
          <ProtectedRoute module="QUOTATIONS">
            <SalesOrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}transactions/sales-orders/:id`}
        element={
          <ProtectedRoute module="QUOTATIONS">
            <SalesOrderDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}transactions/delivery-challans`}
        element={
          <ProtectedRoute module="QUOTATIONS">
            <DeliveryChallansPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}transactions/quotations/:id`}
        element={
          <ProtectedRoute module="QUOTATIONS">
            <QuotationDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}transactions/sales/:id`}
        element={
          <ProtectedRoute module="SALES_INVOICES">
            <SalesInvoiceDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}sales/invoices`}
        element={
          <ProtectedRoute module="SALES_INVOICES">
            <SalesInvoices />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}sales/invoices/create-from-order/:salesOrderId`}
        element={
          <ProtectedRoute module="SALES_INVOICES">
            <InvoicePreviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}sales/invoices/:id`}
        element={
          <ProtectedRoute module="SALES_INVOICES">
            <SalesInvoiceDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}sales/invoices/:invoiceId`}
        element={
          <ProtectedRoute module="SALES_INVOICES">
            <SalesInvoiceDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}budget/budget-headers`}
        element={
          <ProtectedRoute module="BUDGET_HEADERS">
            <BudgetHeaders />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}budget/budget-headers/:id`}
        element={
          <ProtectedRoute module="BUDGET_HEADERS">
            <BudgetHeaderDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}budget/budget-lines`}
        element={
          <ProtectedRoute module="BUDGET_LINES">
            <BudgetLines />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}budget/budget-lines/:id`}
        element={
          <ProtectedRoute module="BUDGET_LINES">
            <BudgetLineDetails />
          </ProtectedRoute>
        }
      />
      {/* Procurement Routes (Under transactions) */}
      <Route element={<PurchaseModuleLayout />}>
        <Route
          path={`${prefix}transactions/purchase-requisitions`}
          element={
            <ProtectedRoute module="PURCHASE_REQUISITIONS">
              <PurchaseRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}transactions/purchase-requisitions/new`}
          element={
            <ProtectedRoute module="PURCHASE_REQUISITIONS">
              <PurchaseRequisitionForm />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}transactions/purchase-requisitions/:id`}
          element={
            <ProtectedRoute module="PURCHASE_REQUISITIONS">
              <PurchaseRequisitionDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}transactions/purchase-requisitions/:id/edit`}
          element={
            <ProtectedRoute module="PURCHASE_REQUISITIONS">
              <PurchaseRequisitionForm />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}transactions/rfqs`}
          element={
            <ProtectedRoute module="PURCHASE_ORDERS">
              <RFQs />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}transactions/rfqs/new`}
          element={
            <ProtectedRoute module="PURCHASE_ORDERS">
              <RFQForm />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}transactions/rfqs/:id`}
          element={
            <ProtectedRoute module="PURCHASE_ORDERS">
              <RFQDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}transactions/rfqs/:id/edit`}
          element={
            <ProtectedRoute module="PURCHASE_ORDERS">
              <RFQForm />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}transactions/purchase-quotations`}
          element={
            <ProtectedRoute module="PURCHASE_ORDERS">
              <SupplierQuotations />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}transactions/supplier-quotes`}
          element={
            <ProtectedRoute module="PURCHASE_ORDERS">
              <SupplierQuotations />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}transactions/supplier-quotations`}
          element={
            <ProtectedRoute module="PURCHASE_ORDERS">
              <SupplierQuotations />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}transactions/supplier-quotations/new`}
          element={
            <ProtectedRoute module="PURCHASE_ORDERS">
              <SupplierQuotationForm />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}transactions/supplier-quotations/:id`}
          element={
            <ProtectedRoute module="PURCHASE_ORDERS">
              <SupplierQuotationDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}transactions/supplier-quotations/:id/edit`}
          element={
            <ProtectedRoute module="PURCHASE_ORDERS">
              <SupplierQuotationForm />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}transactions/supplier-quotations/compare/:rfqId`}
          element={
            <ProtectedRoute module="PURCHASE_ORDERS">
              <QuotationComparison />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}transactions/purchase-orders`}
          element={
            <ProtectedRoute module="PURCHASE_ORDERS">
              <PurchaseOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}transactions/purchase-orders/new`}
          element={
            <ProtectedRoute module="PURCHASE_ORDERS">
              <PurchaseOrderCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}transactions/purchase-orders/:id`}
          element={
            <ProtectedRoute module="PURCHASE_ORDERS">
              <PurchaseOrderDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}transactions/goods-receipts`}
          element={
            <ProtectedRoute module="GOODS_RECEIPTS">
              <GoodsReceipts />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}transactions/payments`}
          element={
            <ProtectedRoute module="PAYMENT_VOUCHERS">
              <APPayments />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}transactions/purchase`}
          element={
            <ProtectedRoute module="PURCHASE_INVOICES">
              <APInvoices />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}transactions/purchase-invoices`}
          element={
            <ProtectedRoute module="PURCHASE_INVOICES">
              <APInvoices />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}transactions/purchase/:id`}
          element={
            <ProtectedRoute module="PURCHASE_INVOICES">
              <APInvoiceDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}transactions/purchase-invoices/:id`}
          element={
            <ProtectedRoute module="PURCHASE_INVOICES">
              <APInvoiceDetails />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Procurement Direct Routes */}
      <Route element={<PurchaseModuleLayout />}>
        <Route
          path={`${prefix}purchase-requisitions`}
          element={
            <ProtectedRoute module="PURCHASE_REQUISITIONS">
              <PurchaseRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}purchase-requisitions/new`}
          element={
            <ProtectedRoute module="PURCHASE_REQUISITIONS">
              <PurchaseRequisitionForm />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}purchase-requisitions/:id`}
          element={
            <ProtectedRoute module="PURCHASE_REQUISITIONS">
              <PurchaseRequisitionDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}purchase-requisitions/:id/edit`}
          element={
            <ProtectedRoute module="PURCHASE_REQUISITIONS">
              <PurchaseRequisitionForm />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}rfqs`}
          element={
            <ProtectedRoute module="PURCHASE_ORDERS">
              <RFQs />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}rfqs/new`}
          element={
            <ProtectedRoute module="PURCHASE_ORDERS">
              <RFQForm />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}rfqs/:id`}
          element={
            <ProtectedRoute module="PURCHASE_ORDERS">
              <RFQDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}rfqs/:id/edit`}
          element={
            <ProtectedRoute module="PURCHASE_ORDERS">
              <RFQForm />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}supplier-quotes`}
          element={
            <ProtectedRoute module="PURCHASE_ORDERS">
              <SupplierQuotations />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}purchase-quotations`}
          element={
            <ProtectedRoute module="PURCHASE_ORDERS">
              <SupplierQuotations />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}supplier-quotations`}
          element={
            <ProtectedRoute module="PURCHASE_ORDERS">
              <SupplierQuotations />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}supplier-quotations/new`}
          element={
            <ProtectedRoute module="PURCHASE_ORDERS">
              <SupplierQuotationForm />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}supplier-quotations/:id`}
          element={
            <ProtectedRoute module="PURCHASE_ORDERS">
              <SupplierQuotationDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}supplier-quotations/:id/edit`}
          element={
            <ProtectedRoute module="PURCHASE_ORDERS">
              <SupplierQuotationForm />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}supplier-quotations/compare/:rfqId`}
          element={
            <ProtectedRoute module="PURCHASE_ORDERS">
              <QuotationComparison />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}purchase-orders`}
          element={
            <ProtectedRoute module="PURCHASE_ORDERS">
              <PurchaseOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}purchase-orders/new`}
          element={
            <ProtectedRoute module="PURCHASE_ORDERS">
              <PurchaseOrderCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}purchase-orders/:id`}
          element={
            <ProtectedRoute module="PURCHASE_ORDERS">
              <PurchaseOrderDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}goods-receipts`}
          element={
            <ProtectedRoute module="GOODS_RECEIPTS">
              <GoodsReceipts />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}purchase-invoices`}
          element={
            <ProtectedRoute module="PURCHASE_INVOICES">
              <APInvoices />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}purchase-invoices/:id`}
          element={
            <ProtectedRoute module="PURCHASE_INVOICES">
              <APInvoiceDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}payments`}
          element={
            <ProtectedRoute module="PAYMENT_VOUCHERS">
              <APPayments />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route
        path={`${prefix}transactions/expenses`}
        element={
          <ProtectedRoute module="EXPENSES">
            <ExpenseTracking />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}transactions/expenses/:tab`}
        element={
          <ProtectedRoute module="EXPENSES">
            <ExpenseTracking />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}transactions/expense-requests`}
        element={
          <ProtectedRoute module="EXPENSES">
            <ExpenseTracking forcedTab="requests" />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}transactions/reimbursements`}
        element={
          <ProtectedRoute module="EXPENSES">
            <ExpenseTracking forcedTab="reimbursements" />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}transactions/expense-reports`}
        element={
          <ProtectedRoute module="EXPENSES">
            <ExpenseTracking forcedTab="reports" />
          </ProtectedRoute>
        }
      />
      <Route element={<PurchaseModuleLayout />}>
        <Route
          path={`${prefix}purchases/invoices`}
          element={
            <ProtectedRoute module="PURCHASE_INVOICES">
              <APInvoices />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}purchases/invoices/:id`}
          element={
            <ProtectedRoute module="PURCHASE_INVOICES">
              <APInvoiceDetails />
            </ProtectedRoute>
          }
        />
      </Route>
      {/* Journal Aliases */}
      <Route path={`${prefix}transactions/journal-entries`} element={<Navigate to={toPath('transactions/journal')} replace />} />
      <Route path={`${prefix}transactions/journals`} element={<Navigate to={toPath('transactions/journal')} replace />} />

      <Route
        path={`${prefix}transactions/journal`}
        element={
          <ProtectedRoute module="GL_JOURNALS">
            <JournalEntries />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}transactions/journal/:id`}
        element={
          <ProtectedRoute module="GL_JOURNALS">
            <JournalEntryDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}transactions/journal-lines`}
        element={
          <ProtectedRoute module="GL_JOURNALS">
            <JournalLines />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}transactions/journal-lines/:id`}
        element={
          <ProtectedRoute module="GL_JOURNALS">
            <JournalLineDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}transactions/journal-lines/journal/:journalId`}
        element={
          <ProtectedRoute module="GL_JOURNALS">
            <JournalLinesByJournal />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}transactions/journal-lines/account/:accountId`}
        element={
          <ProtectedRoute module="GL_JOURNALS">
            <JournalLinesByAccount />
          </ProtectedRoute>
        }
      />
      <Route element={<PurchaseModuleLayout />}>
        <Route
          path={`${prefix}transactions/payments`}
          element={
            <ProtectedRoute module="PAYMENT_VOUCHERS">
              <PaymentVouchers />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}transactions/payments/:id`}
          element={
            <ProtectedRoute module="PAYMENT_VOUCHERS">
              <PaymentVoucherDetails />
            </ProtectedRoute>
          }
        />
        <Route path={`${prefix}transactions/payment-vouchers`} element={<Navigate to={toPath('transactions/payments')} replace />} />
      </Route>
      <Route path={`${prefix}transactions/sales-invoices`} element={<Navigate to={toPath('transactions/sales')} replace />} />
      <Route path={`${prefix}transactions/receipt-vouchers`} element={<Navigate to={toPath('transactions/receipts')} replace />} />
      <Route
        path={`${prefix}transactions/receipts`}
        element={
          <ProtectedRoute module="RECEIPTS">
            <ReceiptVouchers />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}transactions/receipts/:id`}
        element={
          <ProtectedRoute module="RECEIPTS">
            <ReceiptVoucherDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}transactions/credit-notes`}
        element={
          <ProtectedRoute module="CREDIT_NOTES">
            <CreditNotes />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}transactions/credit-notes/:id`}
        element={
          <ProtectedRoute module="CREDIT_NOTES">
            <CreditNoteDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}transactions/debit-notes`}
        element={
          <ProtectedRoute module="DEBIT_NOTES">
            <DebitNotes />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}transactions/debit-notes/:id`}
        element={
          <ProtectedRoute module="DEBIT_NOTES">
            <DebitNoteDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}transactions/banking`}
        element={
          <ProtectedRoute module="BANK_TRANSACTIONS">
            <BankTransactions />
          </ProtectedRoute>
        }
      />
      <Route
        path={`${prefix}transactions/banking/:id`}
        element={
          <ProtectedRoute module="BANK_TRANSACTIONS">
            <BankTransactionDetails />
          </ProtectedRoute>
        }
      />
      <Route element={<PurchaseModuleLayout />}>
        <Route
          path={`${prefix}transactions/ap-payments`}
          element={
            <ProtectedRoute module="AP_PAYMENTS">
              <ApPayments />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${prefix}transactions/ap-payments/:id`}
          element={
            <ProtectedRoute module="AP_PAYMENTS">
              <ApPaymentDetails />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route
        path={`${prefix}transactions/bank-reconciliation`}
        element={
          <ProtectedRoute module="BANK_TRANSACTIONS">
            <BankReconciliation />
          </ProtectedRoute>
        }
      />


      {/* Reports */}
      <Route path={`${prefix}reports/trial-balance`} element={<ProtectedRoute module="REPORTS"><TrialBalance /></ProtectedRoute>} />
      <Route path={`${prefix}reports/hsn-report`} element={<ProtectedRoute module="REPORTS"><HsnReport /></ProtectedRoute>} />
      <Route path={`${prefix}reports/tax-reports`} element={<ProtectedRoute module="TAX_REPORTS"><GstReports /></ProtectedRoute>} />
      <Route path={`${prefix}reports/budget-variance`} element={<ProtectedRoute module="BUDGET_HEADERS"><BudgetVarianceReport /></ProtectedRoute>} />
      <Route path={`${prefix}reports/sac-report`} element={<ProtectedRoute module="REPORTS"><SacReport /></ProtectedRoute>} />
      <Route path={`${prefix}reports/ledger`} element={<ProtectedRoute module="REPORTS"><GeneralLedger /></ProtectedRoute>} />
      <Route path={`${prefix}reports/bank-ledger`} element={<ProtectedRoute module="REPORTS"><BankLedger /></ProtectedRoute>} />
      <Route path={`${prefix}reports/ledger/:accountId`} element={<ProtectedRoute module="REPORTS"><LedgerView /></ProtectedRoute>} />
      <Route path={`${prefix}reports/profit-loss`} element={<ProtectedRoute module="REPORTS"><ProfitLoss /></ProtectedRoute>} />
      <Route path={`${prefix}reports/balance-sheet`} element={<ProtectedRoute module="REPORTS"><BalanceSheet /></ProtectedRoute>} />
      <Route path={`${prefix}reports/cash-flow`} element={<ProtectedRoute module="REPORTS"><CashFlow /></ProtectedRoute>} />
      <Route path={`${prefix}reports/gst`} element={<ProtectedRoute module="GST_REPORTS"><Navigate to={toPath('reports/gst/gstr1')} replace /></ProtectedRoute>} />
      <Route path={`${prefix}reports/gst/gstr1`} element={<ProtectedRoute module="GST_REPORTS"><GstReportPage reportType="gstr1" /></ProtectedRoute>} />
      <Route path={`${prefix}reports/gst/gstr3b`} element={<ProtectedRoute module="GST_REPORTS"><GstReportPage reportType="gstr3b" /></ProtectedRoute>} />
      <Route path={`${prefix}reports/gst/hsn-summary`} element={<ProtectedRoute module="GST_REPORTS"><GstReportPage reportType="hsn-summary" /></ProtectedRoute>} />
      <Route path={`${prefix}reports/gst/itc`} element={<ProtectedRoute module="GST_REPORTS"><GstReportPage reportType="itc" /></ProtectedRoute>} />
      <Route path={`${prefix}reports/gst/export`} element={<ProtectedRoute module="GST_REPORTS"><ExportReportsPage /></ProtectedRoute>} />
      <Route path={`${prefix}reports/gst/gstr2b`} element={<ProtectedRoute module="GST_REPORTS"><Gstr2bHistoryPage /></ProtectedRoute>} />


      {/* Tax */}
      <Route path={`${prefix}tax/gst-state-master`} element={<ProtectedRoute module="FINANCE"><GstStateMaster /></ProtectedRoute>} />
      <Route path={`${prefix}tax/gst-state-master/:id`} element={<ProtectedRoute module="FINANCE"><GstStateMasterDetails /></ProtectedRoute>} />
      <Route path={`${prefix}tax/gst-registrations`} element={<ProtectedRoute module="FINANCE"><GstRegistrations /></ProtectedRoute>} />
      <Route path={`${prefix}tax/gst-registrations/:id`} element={<ProtectedRoute module="FINANCE"><GstRegistrationsDetails /></ProtectedRoute>} />

      {/* Budget */}
      <Route path={`${prefix}budget`} element={<ProtectedRoute module="BUDGET_HEADERS"><BudgetManagement /></ProtectedRoute>} />

      {/* Settings */}
      <Route path={`${prefix}settings/sales`} element={<ProtectedRoute module="FINANCE"><SalesSettings /></ProtectedRoute>} />
      <Route path={`${prefix}settings/workflow`} element={<ProtectedRoute module="APPROVALS"><ApprovalWorkflow /></ProtectedRoute>} />
      <Route path={`${prefix}settings/audit-logs`} element={<ProtectedRoute module="AUDIT_LOGS"><AuditLogsPage moduleFilter="Accounts" /></ProtectedRoute>} />

    </>
  );
};
