import React, { lazy, Suspense, useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import AuthLayout from "../layouts/AuthLayout";
import CompanyLayout from "../layouts/CompanyLayout";
import AccountantLayout from "../layouts/AccountantLayout";
import OwnerLayout from "../layouts/OwnerLayout";
import PurchaseModuleLayout from "../components/common/PurchaseModuleLayout";
import { SharedAccountsRoutes } from "./SharedAccountsRoutes";
import { SharedInventoryRoutes } from "./SharedInventoryRoutes";
import SharedCompanyRoutes from "./SharedCompanyRoutes";
import { getModuleDashboardPath, getPostLoginRedirectPath } from "../utils/moduleAccess";
import { useRBAC, parseJwt, extractRoleFromToken } from "../utils/rbac";
import { getCookie } from "../utils/cookieHelper";
import { PageLoader } from "../components/common/SkeletonLoader";
import { useAppSelector, useAppDispatch } from "../app/hooks";
import { selectIsRehydrated } from "../features/hydration/hydrationSlice";
import { selectIsAuthenticated, selectCurrentUser, selectSessionStatus, selectAuthContext, setCredentials } from "../features/auth/authSlice";
import { setSelectedCompany } from "../features/company-management/companySlice";
import { useGetMeQuery, useSsoGetMeQuery } from "../features/auth/services/authApi";
import WorkspaceLandingRedirect from "./WorkspaceLandingRedirect";
import { getEntitledModules } from "../utils/moduleNormalization";

// Helper component to catch backend redirects to /account and map them to /accounts
const AccountRedirectHandler = () => {
  const location = useLocation();
  const newPath = location.pathname.replace(/^\/account(\/|$)/, '/accounts$1');
  return <Navigate to={newPath + location.search + location.hash} replace />;
};

function RouteLoading() {
  return <PageLoader message="Loading page…" />;
}



// ─── Auth Pages ───────────────────────────────────────────────────────────────
const Login = lazy(() => import("../features/auth/pages/Login"));
const ModuleSelection = lazy(
  () => import("../features/auth/pages/ModuleSelection"),
);
const AdminLogin = lazy(() => import("../features/auth/pages/AdminLogin"));
const ForgotPassword = lazy(
  () => import("../features/auth/pages/ForgotPassword"),
);
const ResetPassword = lazy(
  () => import("../features/auth/pages/ResetPassword"),
);
const VerifyEmail = lazy(() => import("../features/auth/pages/VerifyEmail"));
const Register = lazy(() => import("../features/auth/pages/Register"));
const AuthCallback = lazy(() => import("../features/auth/pages/AuthCallback"));
const QuotationAcceptancePage = lazy(() => import("../features/sales/pages/QuotationAcceptancePage"));
const NotAuthorized = lazy(() => import("../pages/NotAuthorized"));

// ─── Public Landing & SaaS Trial ──────────────────────────────────────────────
const LandingPage = lazy(() => import("../pages/public/LandingPage"));
const TrialSignupPage = lazy(() => import("../pages/public/TrialSignupPage"));
const SubscriptionPage = lazy(() => import("../pages/subscription/SubscriptionPage"));

// ─── Company Selection ────────────────────────────────────────────────────────
const CompanySelect = lazy(
  () => import("../features/company-management/pages/CompanySelect"),
);

// ─── Super Admin ──────────────────────────────────────────────────────────────
const CompanyList = lazy(
  () => import("../features/company-management/pages/CompanyList"),
);
const CompanyModules = lazy(
  () => import("../features/company-management/pages/CompanyModules"),
);
const CompanyModuleManagement = lazy(
  () => import("../features/company-management/pages/CompanyModuleManagement"),
);
const CompanyModuleDetailsPage = lazy(
  () => import("../features/company-management/pages/CompanyModuleDetails"),
);

// ─── Organization Management (Super Admin) ────────────────────────────────────
const OrganizationList = lazy(
  () => import("../features/super-admin/pages/OrganizationList"),
);
const OrganizationDetails = lazy(
  () => import("../features/super-admin/pages/OrganizationDetails"),
);
const ProvisionOrganization = lazy(
  () => import("../features/super-admin/pages/ProvisionOrganization"),
);

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = lazy(() => import("../features/dashboard/pages/Dashboard"));
const SuperAdminDashboard = lazy(
  () => import("../features/dashboard/pages/SuperAdminDashboard"),
);
const AccountDashboard = lazy(
  () => import("../features/account/pages/AccountDashboard"),
);
const AdminDashboard = lazy(
  () => import("../features/admin/pages/AdminDashboard"),
);
const OwnerDashboard = lazy(
  () => import("../features/dashboard/pages/OwnerDashboard"),
);
const SystemLogsPage = lazy(
  () => import("../features/admin/pages/SystemLogsPage"),
);

// ─── Users / Roles / Modules / Sessions / Portal ─────────────────────────────
const UserList = lazy(() => import("../features/users/pages/UserList"));
const UserDetails = lazy(() => import("../features/users/pages/UserDetails"));
const RoleList = lazy(() => import("../features/roles/pages/RoleList"));
const ModuleList = lazy(() => import("../features/modules/pages/ModuleList"));
const FeatureList = lazy(() => import("../features/modules/pages/FeatureList"));
const PermissionList = lazy(() => import("../features/modules/pages/PermissionList"));
const RolePermissionsSettings = lazy(() => import("../pages/settings/RolePermissionsSettings"));
const UserPermissionsSettings = lazy(() => import("../pages/settings/UserPermissionsSettings"));
const ModuleDetails = lazy(
  () => import("../features/modules/pages/ModuleDetails"),
);
const ModuleRoutesList = lazy(
  () => import("../features/modules/pages/ModuleRoutesList"),
);

const PortalAccess = lazy(
  () => import("../features/portal-access/pages/PortalAccessList"),
);

// ─── Company Management ───────────────────────────────────────────────────────
const CompanyDashboard = lazy(
  () => import("../features/company-management/pages/CompanyDashboard"),
);
const CompanyDetails = lazy(
  () => import("../features/company-management/pages/CompanyDetails"),
);

// ─── Finance & Accounting ─────────────────────────────────────────────────────
const FinanceDashboard = lazy(
  () => import("../features/finance/pages/FinanceDashboard"),
);
const GeneralLedger = lazy(
  () => import("../features/finance/pages/GeneralLedger"),
);
const AccountsPayable = lazy(
  () => import("../features/finance/pages/AccountsPayable"),
);
const ExpenseTracking = lazy(
  () => import("../features/finance/pages/ExpenseTracking"),
);
const BudgetManagement = lazy(
  () => import("../features/finance/pages/BudgetManagement"),
);
const GstReportPage = lazy(
  () => import("../features/gst-reports/pages/GstReportPage"),
);
const ExportReportsPage = lazy(
  () => import("../features/gst-reports/pages/ExportReportsPage"),
);
const Gstr2bHistoryPage = lazy(
  () => import("../features/gst-reports/pages/Gstr2bHistoryPage"),
);
const FinancialReports = lazy(
  () => import("../features/finance/pages/FinancialReports"),
);

const CreditNotes = lazy(() => import("../features/finance/pages/CreditNotes"));
const CreditNoteDetails = lazy(
  () => import("../features/finance/pages/CreditNoteDetails"),
);
const DebitNotes = lazy(() => import("../features/finance/pages/DebitNotes"));
const DebitNoteDetails = lazy(
  () => import("../features/finance/pages/DebitNoteDetails"),
);
const ReceiptVouchers = lazy(
  () => import("../features/finance/pages/ReceiptVouchers"),
);
const ReceiptVoucherDetails = lazy(
  () => import("../features/finance/pages/ReceiptVoucherDetails"),
);
const AccountCategories = lazy(() => import("../features/finance/pages/AccountCategories"));
const AccountCategoryDetails = lazy(() => import("../features/finance/pages/AccountCategoryDetails"));
const AccountGroups = lazy(() => import("../features/finance/pages/AccountGroups"));
const AccountGroupDetails = lazy(() => import("../features/finance/pages/AccountGroupDetails"));
const ChartOfAccounts = lazy(
  () => import("../features/finance/pages/ChartOfAccounts"),
);
const LedgerDetails = lazy(
  () => import("../features/finance/pages/LedgerDetails"),
);
const TrialBalance = lazy(
  () => import("../features/finance/pages/TrialBalance"),
);
const ProfitLoss = lazy(() => import("../features/finance/pages/ProfitLoss"));
const BalanceSheet = lazy(
  () => import("../features/finance/pages/BalanceSheet"),
);

const JournalEntries = lazy(() => import("../features/finance/pages/JournalEntries"));
const JournalEntryDetails = lazy(() => import("../features/finance/pages/JournalEntryDetails"));
const JournalLines = lazy(() => import("../features/finance/pages/JournalLines"));
const JournalLineDetails = lazy(() => import("../features/finance/pages/JournalLineDetails"));
const JournalLinesByJournal = lazy(() => import("../features/finance/pages/JournalLinesByJournal"));
const JournalLinesByAccount = lazy(() => import("../features/finance/pages/JournalLinesByAccount"));
const LedgerView = lazy(() => import("../features/finance/pages/LedgerView"));
const BankAccounts = lazy(
  () => import("../features/finance/pages/BankAccounts"),
);
const BankAccountDetails = lazy(
  () => import("../features/finance/pages/BankAccountDetails"),
);
const BankTransactions = lazy(
  () => import("../features/finance/pages/BankTransactions"),
);
const BankTransactionDetails = lazy(
  () => import("../features/finance/pages/BankTransactionDetails"),
);
const ApPayments = lazy(
  () => import("../features/finance/pages/ApPayments"),
);
const ApPaymentDetails = lazy(
  () => import("../features/finance/pages/ApPaymentDetails"),
);
const BankReconciliation = lazy(
  () => import("../features/finance/pages/BankReconciliation"),
);
const BankLedger = lazy(
  () => import("../features/finance/pages/BankLedger"),
);
const BudgetHeaders = lazy(
  () => import("../features/finance/pages/BudgetHeaders"),
);
const BudgetLines = lazy(() => import("../features/finance/pages/BudgetLines"));

const FiscalYears = lazy(() => import("../features/finance/pages/FiscalYears"));
const AccountingPeriods = lazy(() => import("../features/finance/pages/AccountingPeriods"));
const AccountingPeriodDetails = lazy(() => import("../features/finance/pages/AccountingPeriodDetails"));
const GstSlabs = lazy(() => import("../features/finance/pages/GstSlabs"));
const GstSlabDetails = lazy(() => import("../features/finance/pages/GstSlabDetails"));
const HsnSac = lazy(() => import("../features/finance/pages/HsnSac"));
const HsnSacDetails = lazy(() => import("../features/finance/pages/HsnSacDetails"));
const FiscalYearDetails = lazy(() => import("../features/finance/pages/FiscalYearDetails"));
const BudgetHeaderDetails = lazy(() => import("../features/finance/pages/BudgetHeaderDetails"));
const BudgetLineDetails = lazy(() => import("../features/finance/pages/BudgetLineDetails"));
const BudgetVarianceReport = lazy(() => import("../features/finance/pages/BudgetVarianceReport"));
const HsnReport = lazy(() => import("../features/finance/pages/HsnReport"));
const SacReport = lazy(() => import("../features/finance/pages/SacReport"));
const GstStateMaster = lazy(() => import("../features/finance/pages/GstStateMaster"));
const GstStateMasterDetails = lazy(() => import("../features/finance/pages/GstStateMasterDetails"));
const GstRegistrations = lazy(() => import("../features/finance/pages/GstRegistrations"));
const GstRegistrationsDetails = lazy(() => import("../features/finance/pages/GstRegistrationsDetails"));

// ─── HR & Employee ────────────────────────────────────────────────────────────
const HRDashboard = lazy(() => import("../features/hr/pages/HRDashboard"));
const EmployeeProfile = lazy(
  () => import("../features/hr/pages/EmployeeProfile"),
);
const EmployeeList = lazy(() => import("../features/hr/pages/EmployeeList"));
const AttendancePage = lazy(
  () => import("../features/hr/pages/AttendancePage"),
);
const LeaveManagement = lazy(
  () => import("../features/hr/pages/LeaveManagement"),
);
const PayrollPage = lazy(() => import("../features/hr/pages/PayrollPage"));
const RecruitmentPage = lazy(
  () => import("../features/hr/pages/RecruitmentPage"),
);
const PerformanceReview = lazy(
  () => import("../features/hr/pages/PerformanceReview"),
);
const ShiftScheduling = lazy(
  () => import("../features/hr/pages/ShiftScheduling"),
);



// ─── Inventory Management ─────────────────────────────────────────────────────
// All inventory routes are registered in SharedCompanyRoutes.jsx and rendered
// under both the tenant ("/") and super-admin ("/company/:companyId") layouts.
// No direct lazy imports are needed here.

// ─── Sales & CRM ──────────────────────────────────────────────────────────────
const SalesCRMDashboard = lazy(
  () => import("../features/sales/pages/SalesCRMDashboard"),
);
const CustomerManagement = lazy(
  () => import("../features/account/pages/CustomerManagement"),
);
const CustomerDetails = lazy(
  () => import("../features/account/pages/CustomerDetails"),
);
const LeadTracking = lazy(() => import("../features/sales/pages/LeadTracking"));
const QuotationsPage = lazy(
  () => import("../features/sales/pages/QuotationsPage"),
);
const QuotationDetails = lazy(
  () => import("../features/sales/pages/QuotationDetails"),
);
const SalesOrders = lazy(
  () => import("../features/sales/pages/SalesOrdersPage"),
);
const CustomerCommunication = lazy(
  () => import("../features/sales/pages/CustomerCommunication"),
);
const SalesAnalytics = lazy(
  () => import("../features/sales/pages/SalesAnalytics"),
);
const SalesInvoices = lazy(
  () => import("../features/sales/pages/SalesInvoices"),
);
const SalesInvoiceDetails = lazy(
  () => import("../features/sales/pages/SalesInvoiceDetails"),
);

// ─── Purchase Management ──────────────────────────────────────────────────────
const PurchaseDashboard = lazy(
  () => import("../features/purchase/pages/PurchaseDashboard"),
);
const VendorManagement = lazy(
  () => import("../features/account/pages/VendorManagement"),
);
const VendorDetails = lazy(
  () => import("../features/account/pages/VendorDetails"),
);
const PurchaseRequests = lazy(
  () => import("../features/purchase/pages/PurchaseRequests"),
);
const PurchaseRequisitionDetail = lazy(
  () => import("../features/purchase/pages/PurchaseRequisitionDetail"),
);
const PurchaseRequisitionForm = lazy(
  () => import("../features/purchase/pages/PurchaseRequisitionForm"),
);
const PurchaseRequisitionStandalone = lazy(
  () => import("../features/purchase/pages/PurchaseRequisitionStandalone"),
);
const RFQs = lazy(() => import("../features/purchase/pages/RFQs"));
const RFQForm = lazy(() => import("../features/purchase/pages/RFQForm"));
const RFQDetail = lazy(() => import("../features/purchase/pages/RFQDetail"));
const PurchaseOrders = lazy(
  () => import("../features/purchase/pages/PurchaseOrders"),
);
const PurchaseOrderCreate = lazy(
  () => import("../features/purchase/pages/PurchaseOrderCreate"),
);
const PurchaseOrderDetails = lazy(
  () => import("../features/purchase/pages/PurchaseOrderDetails"),
);
const SupplierQuotations = lazy(
  () => import("../features/purchase/pages/SupplierQuotations"),
);
const SupplierQuotationForm = lazy(
  () => import("../features/purchase/pages/SupplierQuotationForm"),
);
const SupplierQuotationStandalone = lazy(
  () => import("../features/purchase/pages/SupplierQuotationStandalone"),
);
const SupplierQuotationDetail = lazy(
  () => import("../features/purchase/pages/SupplierQuotationDetail"),
);
const QuotationComparison = lazy(
  () => import("../features/purchase/pages/QuotationComparison"),
);
const GoodsReceipts = lazy(
  () => import("../features/purchase/pages/GoodsReceipts"),
);
const ApprovalWorkflow = lazy(
  () => import("../features/purchase/pages/ApprovalWorkflow"),
);
const PaymentVouchers = lazy(
  () => import("../features/purchase/pages/PaymentVouchers"),
);
const PaymentVoucherDetails = lazy(
  () => import("../features/purchase/pages/PaymentVoucherDetails"),
);
const APInvoices = lazy(() => import("../features/purchase/pages/APInvoices"));
const APInvoiceDetails = lazy(
  () => import("../features/purchase/pages/APInvoiceDetails"),
);
const APPayments = lazy(() => import("../features/purchase/pages/APPayments"));

// ─── Manufacturing (Keep unchanged) ───────────────────────────────────────────
const ManufacturingDashboard = lazy(
  () => import("../features/manufacturing/pages/ManufacturingDashboard"),
);
const ProductionPage = lazy(
  () => import("../features/manufacturing/pages/ProductionPage"),
);
const BatchesPage = lazy(
  () => import("../features/manufacturing/pages/BatchesPage"),
);

// ─── Reports & Utility ────────────────────────────────────────────────────────
const ReportsPage = lazy(() => import("../features/reports/pages/ReportsPage"));
const ReceivablesReport = lazy(
  () => import("../features/reports/pages/ReceivablesReport"),
);
const PayablesReport = lazy(
  () => import("../features/reports/pages/PayablesReport"),
);
const CashFlow = lazy(() => import("../features/finance/pages/CashFlow"));
const GstReports = lazy(() => import("../features/reports/pages/GstReports"));

const SettingsPage = lazy(
  () => import("../features/settings/pages/SettingsPage"),
);
const AccountWorkflow = lazy(
  () => import("../features/settings/pages/AccountWorkflow"),
);
const ProfilePage = lazy(() => import("../features/profile/pages/ProfilePage"));
const AuditLogsPage = lazy(
  () => import("../features/audit/pages/AuditLogsPage"),
);

// ─── System Admin Settings Pages ──────────────────────────────────────────────
const GeneralSettings = lazy(() => import("../pages/settings/GeneralSettings"));
const SecuritySettings = lazy(() => import("../pages/settings/SecuritySettings"));
const NotificationsSettings = lazy(() => import("../pages/settings/NotificationsSettings"));
const IntegrationsSettings = lazy(() => import("../pages/settings/IntegrationsSettings"));
const AuditLogsSettings = lazy(() => import("../pages/settings/AuditLogsSettings"));
const PreferencesSettings = lazy(() => import("../pages/settings/PreferencesSettings"));
const SubscriptionPlansSettings = lazy(() => import("../pages/settings/SubscriptionPlansSettings"));

export default function AppRoutes() {
  const isRehydrated = useAppSelector(selectIsRehydrated);
  const sessionStatus = useAppSelector(state => state.auth.sessionStatus);
  const currentUser = useAppSelector(selectCurrentUser);
  const dispatch = useAppDispatch();

  // Trigger getMe when rehydrated to validate httpOnly session
  const cookieToken = getCookie('ACCESS_TOKEN') || getCookie('auth_token') || getCookie('access_token');

  // Decode credentials from ACCESS_TOKEN cookie on startup if currentUser is null
  React.useEffect(() => {
    if (isRehydrated && !currentUser && cookieToken) {
      const decoded = parseJwt(cookieToken);
      if (decoded) {
        const role = extractRoleFromToken(cookieToken, decoded);
        const user = { ...decoded, role };
        dispatch(setCredentials({
          user,
        }));
        if (decoded.companyCode || decoded.companyId) {
          dispatch(setSelectedCompany({
            id: decoded.companyCode || decoded.companyId,
            name: decoded.companyName || 'Assigned Company',
            code: decoded.companyCode || decoded.companyId
          }));
        }
      }
    }
  }, [isRehydrated, currentUser, cookieToken, dispatch]);

  const location = useLocation();
  // Normalize current pathname relative to router basename (/erp)
  const rawPath = location.pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
  const currentPath = rawPath.replace(/^\/erp(\/|$)/, '/$1');

  // Any route that is not explicitly public is treated as protected
  const isPublicPage =
    currentPath === '/' ||
    currentPath === '/landing' ||
    currentPath === '/try-free' ||
    currentPath === '/modules' ||
    currentPath === '/admin-login' ||
    currentPath === '/403' ||
    currentPath.includes('/login') ||
    currentPath.includes('/callback') ||
    currentPath.startsWith('/forgot-password') ||
    currentPath.startsWith('/reset-password') ||
    currentPath.startsWith('/verify-email') ||
    currentPath.startsWith('/register') ||
    currentPath.startsWith('/quotation/accept');

  const isOnProtectedPage = !isPublicPage;

  // Global ERP Shell auth: always use SSO /me as the single canonical auth source.
  const hasAuthToken = !!cookieToken || !!currentUser;
  const shouldSkipSso = !isRehydrated || (isPublicPage && !hasAuthToken && sessionStatus === 'unauthenticated');

  const { isLoading: isSsoLoading, isFetching: isSsoFetching } = useSsoGetMeQuery(undefined, {
    skip: shouldSkipSso,
  });

  // Never render routes or route guards while auth initialization is in progress on PROTECTED pages.
  // On PUBLIC pages (e.g. /login, /o/:organizationCode/login), the page MUST render immediately.
  const isAuthWaiting = !isRehydrated || (isOnProtectedPage && (isSsoLoading || isSsoFetching || sessionStatus === 'checking' || sessionStatus === 'idle'));

  if (isAuthWaiting) {
    return <RouteLoading />;
  }

  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        {/* ── PUBLIC SAAS LANDING & TRIAL SIGNUP ── */}
        <Route path="/" element={<RootIndexHandler />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/try-free" element={<TrialSignupPage />} />

        {/* ── PUBLIC (Auth Layout) ── */}
        <Route element={<AuthLayout />}>
          <Route path="/modules" element={<ModuleSelection />} />
          <Route path="/login" element={<Login />} />
          <Route path="/:moduleCode/login" element={<Login />} />
          <Route path="/o/:organizationCode/login" element={<Login />} />
          <Route path="/o/:organizationCode" element={<Navigate to="login" replace />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/account/callback" element={<AuthCallback />} />
          <Route path="/accounts/callback" element={<AuthCallback />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/forgot-password/:token" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/register" element={<Register />} />
          <Route path="/quotation/accept/:token" element={<QuotationAcceptancePage />} />
          <Route path="/403" element={<NotAuthorized />} />
        </Route>

        {/* ── STANDALONE FULL-SCREEN: New Purchase Requisition (no app shell) ── */}
        <Route
          path="/purchase-requisitions/new"
          element={
            <ProtectedRoute requireCompany={false}>
              <PurchaseRequisitionStandalone />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts/transactions/purchase-requisitions/new"
          element={
            <ProtectedRoute requireCompany={false}>
              <PurchaseRequisitionStandalone />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts/purchase-requisitions/new"
          element={
            <ProtectedRoute requireCompany={false}>
              <PurchaseRequisitionStandalone />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions/purchase-requisitions/new"
          element={
            <ProtectedRoute requireCompany={false}>
              <PurchaseRequisitionStandalone />
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchases/purchase-requisitions/new"
          element={
            <ProtectedRoute requireCompany={false}>
              <PurchaseRequisitionStandalone />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company/:companyId/accounts/transactions/purchase-requisitions/new"
          element={
            <ProtectedRoute requireCompany={true}>
              <PurchaseRequisitionStandalone />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company/:companyId/accounts/purchase-requisitions/new"
          element={
            <ProtectedRoute requireCompany={true}>
              <PurchaseRequisitionStandalone />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company/:companyId/purchases/purchase-requisitions/new"
          element={
            <ProtectedRoute requireCompany={true}>
              <PurchaseRequisitionStandalone />
            </ProtectedRoute>
          }
        />

        {/* ── STANDALONE FULL-SCREEN: New Supplier Quotation (no app shell) ── */}
        <Route
          path="/supplier-quotations/new"
          element={
            <ProtectedRoute requireCompany={false}>
              <SupplierQuotationStandalone />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts/transactions/supplier-quotations/new"
          element={
            <ProtectedRoute requireCompany={false}>
              <SupplierQuotationStandalone />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts/supplier-quotations/new"
          element={
            <ProtectedRoute requireCompany={false}>
              <SupplierQuotationStandalone />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions/supplier-quotations/new"
          element={
            <ProtectedRoute requireCompany={false}>
              <SupplierQuotationStandalone />
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchases/supplier-quotations/new"
          element={
            <ProtectedRoute requireCompany={false}>
              <SupplierQuotationStandalone />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company/:companyId/accounts/transactions/supplier-quotations/new"
          element={
            <ProtectedRoute requireCompany={true}>
              <SupplierQuotationStandalone />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company/:companyId/accounts/supplier-quotations/new"
          element={
            <ProtectedRoute requireCompany={true}>
              <SupplierQuotationStandalone />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company/:companyId/purchases/supplier-quotations/new"
          element={
            <ProtectedRoute requireCompany={true}>
              <SupplierQuotationStandalone />
            </ProtectedRoute>
          }
        />

        {/* ── COMPANY SELECTION ── */}
        <Route
          path="/company-select"
          element={
            <CompanySelect />
          }
        />

        {/* ── WORKSPACE (Common ERP Shell) ─────────────────────────────────
            Landing route dynamically derived from SSO /me authorization context.
            If 0 modules: NoModuleAccessView.
            If 1 module: direct open inside shell.
            If multiple modules: primary authorized module inside shell.
        ── */}
        <Route
          path="/workspace"
          element={
            <ProtectedRoute requireCompany={false}>
              <WorkspaceLandingRedirect />
            </ProtectedRoute>
          }
        />

        {/* ── ORGANIZATION OWNER WORKSPACE & DASHBOARD ─────────────────── */}
        <Route
          path="/owner"
          element={
            <ProtectedRoute requireCompany={false}>
              <OwnerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/owner/dashboard" replace />} />
          <Route path="dashboard" element={<OwnerDashboard />} />
          <Route path="companies" element={<Navigate to="/company-select" replace />} />
          <Route path="companies/:companyId" element={<CompanyEntryRedirect />} />
          <Route path="users" element={<Navigate to="/users" replace />} />
          <Route path="modules" element={<Navigate to="/owner/dashboard" replace />} />
          <Route path="modules/finance" element={<Navigate to="/accounts/dashboard" replace />} />
          <Route path="modules/inventory" element={<Navigate to="/inventory/dashboard" replace />} />
          <Route path="modules/sales" element={<Navigate to="/crm/dashboard" replace />} />
          <Route path="modules/purchasing" element={<Navigate to="/purchase-requisitions" replace />} />
          <Route path="settings" element={<Navigate to="/accounts/settings" replace />} />
          <Route path="settings/organization" element={<Navigate to="/accounts/settings" replace />} />
          <Route path="subscription" element={<SubscriptionPage />} />
          <Route path="settings/subscription" element={<Navigate to="/subscription" replace />} />
          <Route path="profile" element={<Navigate to="/profile" replace />} />
        </Route>
        <Route
          path="/organization/dashboard"
          element={<Navigate to="/owner/dashboard" replace />}
        />

        {/* ── ACCOUNTANT / USER ROUTES (Module Guard: ACCOUNT) ── */}
        <Route
          path="/accounts"
          element={
            <ProtectedRoute requireCompany={false} module="ACCOUNT">
              <AccountantLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/accounts/dashboard" replace />} />
          {SharedAccountsRoutes({ prefix: "" })}
          {/* Profile & utility */}
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/accounts/dashboard" replace />} />
        </Route>

        {/* ── INVENTORY ROUTES (Module Guard: INVENTORY) ── */}
        <Route
          path="/inventory"
          element={
            <ProtectedRoute requireCompany={false} module="INVENTORY">
              <AccountantLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/inventory/dashboard" replace />} />
          {SharedInventoryRoutes({ prefix: "" })}
        </Route>

        {/* ── CRM ROUTES (Module Guard: CRM) ── */}
        <Route
          path="/crm"
          element={
            <ProtectedRoute requireCompany={false} module="CRM">
              <AccountantLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/crm/dashboard" replace />} />
          <Route path="dashboard" element={<SalesCRMDashboard />} />
          <Route path="customers" element={<CustomerManagement />} />
          <Route path="customers/:id" element={<CustomerDetails />} />
          <Route path="leads" element={<LeadTracking />} />
          <Route path="quotations" element={<QuotationsPage />} />
          <Route path="quotations/:id" element={<QuotationDetails />} />
          <Route path="orders" element={<SalesOrders />} />
          <Route path="communication" element={<CustomerCommunication />} />
          <Route path="analytics" element={<SalesAnalytics />} />
          <Route path="invoices" element={<SalesInvoices />} />
          <Route path="invoices/:id" element={<SalesInvoiceDetails />} />
          <Route path="audit" element={<AuditLogsPage />} />
          <Route path="*" element={<Navigate to="/crm/dashboard" replace />} />
        </Route>

        {/* Alias /sales-crm to /crm */}
        <Route path="/sales-crm/*" element={<Navigate to="/crm" replace />} />
        <Route path="/sales-crm" element={<Navigate to="/crm/dashboard" replace />} />

        {/* Alias /account/* to /accounts/* to handle legacy bookmarks & backend redirects */}
        <Route path="/account/*" element={<AccountRedirectHandler />} />
        <Route path="/account" element={<Navigate to="/accounts/dashboard" replace />} />

        {/* ── DIRECT PROCUREMENT ROUTES (Expected URLs) ── */}
        <Route
          element={
            <ProtectedRoute requireCompany={false}>
              <AccountantLayout />
            </ProtectedRoute>
          }
        >
          <Route element={<PurchaseModuleLayout />}>
            <Route path="/purchase-requisitions" element={<PurchaseRequests />} />
            <Route path="/purchase-requisitions/new" element={<PurchaseRequisitionForm />} />
            <Route path="/purchase-requisitions/:id" element={<PurchaseRequisitionDetail />} />
            <Route path="/purchase-requisitions/:id/edit" element={<PurchaseRequisitionForm />} />
            <Route path="/rfqs" element={<RFQs />} />
            <Route path="/rfqs/new" element={<RFQForm />} />
            <Route path="/rfqs/:id" element={<RFQDetail />} />
            <Route path="/rfqs/:id/edit" element={<RFQForm />} />
            <Route path="/supplier-quotes" element={<SupplierQuotations />} />
            <Route path="/purchase-quotations" element={<SupplierQuotations />} />
            <Route path="/supplier-quotations" element={<SupplierQuotations />} />
            <Route path="/supplier-quotations/new" element={<SupplierQuotationForm />} />
            <Route path="/supplier-quotations/:id" element={<SupplierQuotationDetail />} />
            <Route path="/supplier-quotations/:id/edit" element={<SupplierQuotationForm />} />
            <Route path="/supplier-quotations/compare/:rfqId" element={<QuotationComparison />} />
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/purchase-orders/new" element={<PurchaseOrderCreate />} />
            <Route path="/purchase-orders/:id" element={<PurchaseOrderDetails />} />
            <Route path="/goods-receipts" element={<GoodsReceipts />} />
            <Route path="/purchase-invoices" element={<APInvoices />} />
            <Route path="/purchase-invoices/:id" element={<APInvoiceDetails />} />
            <Route path="/payments" element={<APPayments />} />
          </Route>
        </Route>


        {/* ── COMPANY TENANT ROUTES (NO COMPANY ID IN URL) ── */}
        <Route
          element={
            <ProtectedRoute requireCompany={false}>
              <CompanyLayout />
            </ProtectedRoute>
          }
        >
          <Route path="modules" element={<CompanyModules />} />
          <Route path="modules/:id" element={<ModuleDetails />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="company-dashboard" element={<CompanyDashboard />} />
          <Route path="subscription" element={<SubscriptionPage />} />

          {/* Finance & Accounts Module (Tenant) */}
          {SharedAccountsRoutes({ prefix: "accounts/" })}

          {/* All other modules (HR, Inventory, Sales, etc.) */}
          {SharedCompanyRoutes({ prefix: "" })}
        </Route>

        {/* ── SUPERADMIN COMPANY ROUTES ── */}
        <Route
          path="/company/:companyId"
          element={
            <ProtectedRoute requireCompany={true}>
              <CompanyLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CompanyEntryRedirect />} />
          <Route path="modules" element={<CompanyModules />} />
          <Route path="modules/:id" element={<ModuleDetails />} />
          <Route path="dashboard" element={<Dashboard />} />

          <Route path="company-dashboard" element={<CompanyDashboard />} />
          <Route path="subscription" element={<SubscriptionPage />} />

          {/* Finance & Accounts Module (Replacing Legacy Finance/Accounting) */}
          {SharedAccountsRoutes({ prefix: "accounts/" })}

          {/* Accounts Masters */}
          {/* Accounts Reports */}
          {/* Legacy Links (To prevent breaking bookmarks / external references) */}
          <Route path="finance/expenses" element={<ExpenseTracking />} />
          <Route
            path="finance/journal-lines"
            element={
              <ProtectedRoute module="GL_JOURNALS">
                <JournalLines />
              </ProtectedRoute>
            }
          />
          <Route
            path="finance/budget-lines"
            element={
              <ProtectedRoute module="BUDGET_HEADERS">
                <BudgetLines />
              </ProtectedRoute>
            }
          />
          <Route path="accounting/sales-orders" element={<SalesOrders />} />

          {SharedCompanyRoutes({ prefix: "" })}
          <Route
            path="manufacturing/audit"
            element={<AuditLogsPage moduleFilter="Manufacturing" />}
          />

          {/* Admin-only sections */}
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/system-logs" element={<SystemLogsPage />} />
          <Route path="users" element={<UserList />} />
          <Route path="users/:id" element={<UserDetails />} />
          <Route path="roles" element={<RoleList />} />
          <Route path="portal-access" element={<PortalAccess />} />

          {/* Reports */}
          <Route path="reports" element={<FinancialReports />} />
          <Route path="reports/receivables" element={<ReceivablesReport />} />
          <Route path="reports/payables" element={<PayablesReport />} />
          <Route path="reports/tb" element={<TrialBalance />} />
          <Route path="reports/pl" element={<ProfitLoss />} />
          <Route path="reports/bs" element={<BalanceSheet />} />

          {/* Utility */}
          <Route path="settings" element={<SettingsPage />} />
          <Route path="settings/security" element={<SecuritySettings />} />
          <Route path="settings/security/features" element={<FeatureList />} />
          <Route path="settings/security/permissions" element={<PermissionList />} />
          <Route path="settings/notifications" element={<NotificationsSettings />} />
          <Route path="settings/security/roles" element={<RolePermissionsSettings />} />
          <Route path="settings/security/users" element={<UserPermissionsSettings />} />
          <Route path="settings/plans" element={<SubscriptionPlansSettings />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<CompanyEntryRedirect />} />
        </Route>

        {/* 🏢 SUPER ADMIN ROUTES 🏢 */}
        <Route
          path="/super-admin"
          element={
            <ProtectedRoute requireCompany={false}>
              <RoleRoute allowedRoles={["super_admin"]}>
                <CompanyLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/super-admin/dashboard" replace />} />
          <Route path="dashboard" element={<SuperAdminDashboard />} />

          {/* ── Organization Routes (Organization-first architecture) ── */}
          <Route path="organizations" element={<OrganizationList />} />
          <Route path="organizations/provision" element={<ProvisionOrganization />} />
          <Route path="organizations/:organizationId" element={<OrganizationDetails />} />
          {/* Companies nested under organization (org-scoped view) */}
          <Route path="organizations/:organizationId/companies" element={<CompanyList />} />
          <Route path="organizations/:organizationId/companies/:id" element={<CompanyDetails />} />

          {/* ── Legacy Company Routes (preserved for backward compatibility) ── */}
          <Route path="companies" element={<CompanyList />} />
          <Route path="companies/:id" element={<CompanyDetails />} />
          <Route path="company-modules" element={<CompanyModuleManagement />} />
          <Route path="company-modules/:id" element={<CompanyModuleDetailsPage />} />

          {/* ── Users / Roles / Modules ── */}
          <Route path="users" element={<UserList />} />
          <Route path="users/:id" element={<UserDetails />} />
          <Route path="roles" element={<RoleList />} />
          <Route path="modules" element={<ModuleList />} />
          <Route path="modules/:id" element={<ModuleDetails />} />
          <Route path="module-routes" element={<ModuleRoutesList />} />

          <Route path="reports" element={<FinancialReports />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* ⚙️ SYSTEM ADMIN SETTINGS ROUTES ⚙️ */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute requireCompany={false}>
              <RoleRoute allowedRoles={["super_admin"]}>
                <CompanyLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/settings/general" replace />} />
          <Route path="general" element={<GeneralSettings />} />
          <Route path="security" element={<SecuritySettings />} />
          <Route path="security/features" element={<FeatureList />} />
          <Route path="security/permissions" element={<PermissionList />} />
          <Route path="security/roles" element={<RolePermissionsSettings />} />
          <Route path="security/users" element={<UserPermissionsSettings />} />
          <Route path="notifications" element={<NotificationsSettings />} />
          <Route path="integrations" element={<IntegrationsSettings />} />
          <Route path="audit-logs" element={<AuditLogsSettings />} />
          <Route path="preferences" element={<PreferencesSettings />} />
          <Route path="plans" element={<SubscriptionPlansSettings />} />
        </Route>

        {/* ── Fallback ── */}
        <Route path="*" element={<SmartRedirect />} />
      </Routes>
    </Suspense>
  );
}

function RootIndexHandler() {
  const [searchParams] = useSearchParams();
  const authenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);
  const cookieToken = getCookie("ACCESS_TOKEN") || getCookie("auth_token");

  const urlToken = searchParams.get("token") || searchParams.get("accessToken");
  if (urlToken) {
    return <Navigate to={`/accounts/dashboard?token=${encodeURIComponent(urlToken)}`} replace />;
  }

  if (authenticated && user) {
    return <Navigate to={getPostLoginRedirectPath({ user })} replace />;
  }

  if (cookieToken && user) {
    return <Navigate to={getPostLoginRedirectPath({ user })} replace />;
  }

  return <LandingPage />;
}

function SmartRedirect() {
  const [searchParams] = useSearchParams();
  const authenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);

  const urlToken = searchParams.get("token") || searchParams.get("accessToken");
  if (urlToken) {
    return <Navigate to={`/accounts/dashboard?token=${encodeURIComponent(urlToken)}`} replace />;
  }

  if (authenticated && user) {
    return <Navigate to={getPostLoginRedirectPath({ user: user })} replace />;
  }

  return <Navigate to="/" replace />;
}

function CompanyEntryRedirect() {
  const { companyId } = useParams();
  const { accessLoading = false } = useOutletContext() || {};
  const authContext = useAppSelector(selectAuthContext);
  const user = authContext.user;

  if (accessLoading) {
    return <RouteLoading />;
  }

  const isAdmin = user?.role === 'super_admin';

  // Admins get the general overview dashboard
  if (isAdmin) {
    return <Navigate to={`/company/${companyId}/dashboard`} replace />;
  }

  // Regular users get redirected to the first canonical entitled module
  const entitledModules = getEntitledModules(authContext);

  if (entitledModules.includes('ACCOUNT')) {
    return <Navigate to="/accounts/dashboard" replace />;
  }
  if (entitledModules.includes('INVENTORY')) {
    return <Navigate to="/inventory/dashboard" replace />;
  }
  if (entitledModules.includes('CRM')) {
    return <Navigate to="/crm/dashboard" replace />;
  }

  // Fallback if no modules matched
  return <Navigate to={`/company/${companyId}/dashboard`} replace />;
}
