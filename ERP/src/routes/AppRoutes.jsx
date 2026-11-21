import React, { lazy, Suspense, useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import AuthLayout from "../layouts/AuthLayout";
import CompanyLayout from "../layouts/CompanyLayout";
import AccountantLayout from "../layouts/AccountantLayout";
import OwnerLayout from "../layouts/OwnerLayout";
import AppShellLayout from "../layouts/AppShellLayout";
import PurchaseModuleLayout from "../components/common/PurchaseModuleLayout";
import { SharedAccountsRoutes } from "./SharedAccountsRoutes";
import { SharedInventoryRoutes } from "./SharedInventoryRoutes";
import { SharedCrmRoutes } from "./SharedCrmRoutes";
import SharedCompanyRoutes from "./SharedCompanyRoutes";
import { getModuleDashboardPath, getPostLoginRedirectPath } from "../utils/moduleAccess";
import { useRBAC, parseJwt, extractRoleFromToken } from "../utils/rbac";
import { getCookie } from "../utils/cookieHelper";
import { useAppSelector, useAppDispatch } from "../app/hooks";
import { selectIsRehydrated } from "../features/hydration/hydrationSlice";
import { selectIsAuthenticated, selectCurrentUser, selectSessionStatus, selectAuthContext, setCredentials, setSessionStatus, selectOrganization } from "../features/auth/authSlice";
import { setSelectedCompany } from "../features/company-management/companySlice";
import { useGetMeQuery, useSsoGetMeQuery } from "../features/auth/services/authApi";
import { useGetOrganizationAppearanceQuery } from "../features/theme/services/themeApi";
import { setOrganizationId, applyAllAppearanceSettings } from "../features/theme/themeSlice";
import { applyLandingSageTheme, isPublicLandingPath } from "../features/theme/themePresets";
import WorkspaceLandingRedirect from "./WorkspaceLandingRedirect";
import AccountRedirectHandler from "./AccountRedirectHandler";
import RouteLoading from "./RouteLoading";
import ScrollToTop from "./ScrollToTop";
import { RootIndexHandler, CompanyEntryRedirect } from "./RouteRedirects";
import { SidebarProvider } from "../layouts/SidebarContext";




// ─── Auth Pages ───────────────────────────────────────────────────────────────
const Login = lazy(() => import("../features/auth/pages/Login"));
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
const NotFound = lazy(() => import("../pages/NotFound"));

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
const PlatformWorkflowTemplatesPage = lazy(
  () => import("../features/super-admin/pages/PlatformWorkflowTemplatesPage"),
);
const GlobalIntegrationProvidersPage = lazy(
  () => import("../features/sales-crm/pages/GlobalIntegrationProvidersPage"),
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
const SessionList = lazy(
  () => import("../features/sessions/pages/SessionList"),
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



// ─── Workflow & Approvals ─────────────────────────────────────────────────────
const WorkflowManagementPage = lazy(
  () => import("../features/workflows/pages/WorkflowManagementPage"),
);
const ApprovalRequestsPage = lazy(
  () => import("../features/workflows/pages/ApprovalRequestsPage"),
);
const DynamicWorkflowPage = lazy(
  () => import("../features/workflows/pages/DynamicWorkflowPage"),
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
const OrganizationSettingsPage = lazy(
  () => import("../features/settings/pages/OrganizationSettingsPage"),
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
const AppearanceSettings = lazy(() => import("../pages/settings/AppearanceSettings"));
const SubscriptionPlansSettings = lazy(() => import("../pages/settings/SubscriptionPlansSettings"));
const InventorySettingsPage = lazy(() => import("../pages/settings/InventorySettingsPage"));
const WorkflowSettingsPage = lazy(() => import("../pages/settings/WorkflowSettingsPage"));
const CrmSettingsPage = lazy(() => import("../pages/settings/CrmSettingsPage"));
const SalesSettings = lazy(() => import("../features/finance/pages/SalesSettings"));


function OrgRedirect() {
  const { organizationCode } = useParams();
  return <Navigate to={`/o/${encodeURIComponent(organizationCode || '')}/login`} replace />;
}

function CompanyRedirect() {
  const { companyCode } = useParams();
  return <Navigate to={`/c/${encodeURIComponent(companyCode || '')}/login`} replace />;
}

function CompanyGstRedirect() {
  const { companyId } = useParams();
  return <Navigate to={`/company/${encodeURIComponent(companyId || '')}/accounts/reports/gst/gstr1`} replace />;
}

function CompanyWorkflowRedirect() {
  const { companyId } = useParams();
  return <Navigate to={`/company/${encodeURIComponent(companyId || '')}/workflows`} replace />;
}

function CompanyWorkflowApprovalsRedirect() {
  const { companyId } = useParams();
  return <Navigate to={`/company/${encodeURIComponent(companyId || '')}/workflows/approvals`} replace />;
}

function CompanyProfileRedirect() {
  const { companyId } = useParams();
  return <Navigate to={`/company/${encodeURIComponent(companyId || '')}/profile`} replace />;
}

export default function AppRoutes() {
  const isRehydrated = useAppSelector(selectIsRehydrated);
  const sessionStatus = useAppSelector(state => state.auth.sessionStatus);
  const currentUser = useAppSelector(selectCurrentUser);
  const dispatch = useAppDispatch();

  // Trigger getMe when rehydrated to validate httpOnly session
  const cookieToken = getCookie('ACCESS_TOKEN') || getCookie('auth_token') || getCookie('access_token') || (typeof localStorage !== 'undefined' ? (localStorage.getItem('ACCESS_TOKEN') || localStorage.getItem('auth_token')) : null);

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
  const currentPath = rawPath.replace(/^(\/erp)+/i, '') || '/';

  // Any route that is not explicitly public is treated as protected
  const isPublicPage =
    currentPath === '/' ||
    currentPath === '/landing' ||
    currentPath === '/try-free' ||
    currentPath === '/modules' ||
    currentPath === '/admin-login' ||
    currentPath === '/403' ||
    currentPath.startsWith('/o/') ||
    currentPath.startsWith('/c/') ||
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
  const shouldSkipSso = !isRehydrated || (isPublicPage && !hasAuthToken);

  // If rehydration finished on a public page with no tokens, mark unauthenticated cleanly
  React.useEffect(() => {
    if (isRehydrated && !hasAuthToken && sessionStatus === 'idle') {
      dispatch(setSessionStatus('unauthenticated'));
    }
  }, [isRehydrated, hasAuthToken, sessionStatus, dispatch]);

  const { isLoading: isSsoLoading, isFetching: isSsoFetching } = useSsoGetMeQuery(undefined, {
    skip: shouldSkipSso,
  });

  // Global Organization Appearance Synchronization (Multi-Tenant Theme Isolation)
  const currentOrg = useAppSelector(selectOrganization);
  const activeOrgId = currentOrg?.id;

  const shouldSkipAppearance = !activeOrgId || isPublicPage;
  const { data: orgAppearance } = useGetOrganizationAppearanceQuery(
    activeOrgId ? { organizationId: activeOrgId } : undefined,
    {
      skip: shouldSkipAppearance,
    }
  );

  React.useEffect(() => {
    if (activeOrgId && !isPublicPage) {
      if (orgAppearance) {
        dispatch(applyAllAppearanceSettings({ ...orgAppearance, orgId: activeOrgId }));
      } else {
        dispatch(setOrganizationId(activeOrgId));
      }
    } else if (isPublicPage && isPublicLandingPath(currentPath)) {
      applyLandingSageTheme();
    }
  }, [activeOrgId, isPublicPage, currentPath, orgAppearance, dispatch]);

  const [authTimedOut, setAuthTimedOut] = React.useState(false);

  // Fallback safety timeout: If waiting for auth exceeds 10 seconds, timeout and release gate
  React.useEffect(() => {
    let timer;
    if (isOnProtectedPage && (isSsoLoading || isSsoFetching || sessionStatus === 'checking' || sessionStatus === 'idle')) {
      timer = setTimeout(() => {
        setAuthTimedOut(true);
      }, 10000);
    } else {
      setAuthTimedOut(false);
    }
    return () => clearTimeout(timer);
  }, [isOnProtectedPage, isSsoLoading, isSsoFetching, sessionStatus]);

  // Never render routes or route guards while auth initialization is in progress on PROTECTED pages.
  // On PUBLIC pages (e.g. /login, /o/:organizationCode/login), the page MUST render immediately.
  const isAuthWaiting = !authTimedOut && (!isRehydrated || (isOnProtectedPage && (isSsoLoading || isSsoFetching || sessionStatus === 'checking' || sessionStatus === 'idle')));

  if (isAuthWaiting) {
    return <RouteLoading />;
  }

  return (
    <Suspense fallback={<RouteLoading />}>
      <ScrollToTop />
      <SidebarProvider>
        <Routes>
          {/* ── PUBLIC SAAS LANDING & TRIAL SIGNUP ── */}
          <Route path="/" element={<RootIndexHandler />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/try-free" element={<TrialSignupPage />} />

          {/* ── PUBLIC (Auth Layout) ── */}
          <Route element={<AuthLayout />}>
            <Route path="/o/:organizationCode/login" element={<Login />} />
            <Route path="/o/:organizationCode" element={<OrgRedirect />} />
            <Route path="/c/:companyCode/login" element={<Login />} />
            <Route path="/c/:companyCode" element={<CompanyRedirect />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/modules" element={<Navigate to="/" replace />} />
            <Route path="/:moduleCode/login" element={<Navigate to="/" replace />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/account/callback" element={<AuthCallback />} />
            <Route path="/accounts/callback" element={<AuthCallback />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/forgot-password/:token" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/set-password" element={<ResetPassword />} />
            <Route path="/set-password/:token" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/register" element={<Register />} />
            <Route path="/403" element={<NotAuthorized />} />
          </Route>

          {/* ── STANDALONE FULL-SCREEN: Public Quotation Acceptance & Verification ── */}
          <Route path="/quotation/accept/:token" element={<QuotationAcceptancePage />} />

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

          {/* ── UNIFIED APP SHELL ROUTES (Persistent Layout: Owner / Accountant / Tenant) ── */}
          <Route
            element={
              <ProtectedRoute requireCompany={false}>
                <AppShellLayout />
              </ProtectedRoute>
            }
          >
            {/* Owner workspace routes */}
            <Route path="/owner" element={<Navigate to="/owner/dashboard" replace />} />
            <Route path="/owner/dashboard" element={<OwnerDashboard />} />
            <Route path="/owner/companies" element={<CompanyList />} />
            <Route path="/owner/companies/:id" element={<CompanyDetails />} />
            <Route path="/owner/users" element={<Navigate to="/users" replace />} />
            <Route path="/owner/modules" element={<Navigate to="/owner/dashboard" replace />} />
            <Route path="/owner/modules/finance" element={<Navigate to="/accounts/dashboard" replace />} />
            <Route path="/owner/modules/inventory" element={<Navigate to="/inventory/dashboard" replace />} />
            <Route path="/owner/modules/sales" element={<Navigate to="/crm/dashboard" replace />} />
            <Route path="/owner/modules/purchasing" element={<Navigate to="/purchase-requisitions" replace />} />
            <Route path="/owner/workflows" element={<Navigate to="/workflows" replace />} />
            <Route path="/owner/workflow" element={<Navigate to="/workflows" replace />} />
            <Route path="/owner/settings" element={<OrganizationSettingsPage />} />
            <Route path="/owner/settings/:section" element={<OrganizationSettingsPage />} />
            <Route path="/owner/settings/organization" element={<OrganizationSettingsPage />} />
            <Route path="/owner/organization" element={<OrganizationSettingsPage />} />
            <Route path="/organization/settings" element={<OrganizationSettingsPage />} />
            <Route path="/owner/subscription" element={<SubscriptionPage />} />
            <Route path="/owner/settings/appearance" element={<OrganizationSettingsPage />} />
            <Route path="/owner/appearance" element={<Navigate to="/owner/settings/appearance" replace />} />
            <Route path="/owner/roles" element={<Navigate to="/owner/settings/roles" replace />} />
            <Route path="/owner/permissions" element={<Navigate to="/owner/settings/permissions" replace />} />
            <Route path="/owner/settings/subscription" element={<Navigate to="/subscription" replace />} />
            <Route path="/owner/profile" element={<Navigate to="/profile" replace />} />
            <Route path="/organization/dashboard" element={<Navigate to="/owner/dashboard" replace />} />

            {/* Accounts & Finance */}
            <Route path="/accounts" element={<Navigate to="/accounts/dashboard" replace />} />
            <Route path="/accounts/dashboard" element={<ProtectedRoute module="ACCOUNTS"><AccountDashboard /></ProtectedRoute>} />
            {SharedAccountsRoutes({ prefix: "accounts/" })}
            {SharedAccountsRoutes({ prefix: "" })}
            <Route path="/accounts/profile" element={<ProfilePage />} />
            <Route path="/accounts/settings" element={<SettingsPage />} />
            <Route path="/account/*" element={<AccountRedirectHandler />} />
            <Route path="/account" element={<Navigate to="/accounts/dashboard" replace />} />

            {/* Inventory */}
            <Route path="/inventory" element={<Navigate to="/inventory/dashboard" replace />} />
            {SharedInventoryRoutes({ prefix: "" })}
            {SharedInventoryRoutes({ prefix: "inventory/" })}


            {/* Direct Procurement Routes */}
            <Route element={<PurchaseModuleLayout />}>
              <Route path="/purchase-requisitions" element={<ProtectedRoute module="PURCHASE_REQUISITIONS"><PurchaseRequests /></ProtectedRoute>} />
              <Route path="/purchase-requisitions/new" element={<ProtectedRoute module="PURCHASE_REQUISITIONS"><PurchaseRequisitionForm /></ProtectedRoute>} />
              <Route path="/purchase-requisitions/:id" element={<ProtectedRoute module="PURCHASE_REQUISITIONS"><PurchaseRequisitionDetail /></ProtectedRoute>} />
              <Route path="/purchase-requisitions/:id/edit" element={<ProtectedRoute module="PURCHASE_REQUISITIONS"><PurchaseRequisitionForm /></ProtectedRoute>} />
              <Route path="/rfqs" element={<ProtectedRoute module="PURCHASE_ORDERS"><RFQs /></ProtectedRoute>} />
              <Route path="/rfqs/new" element={<ProtectedRoute module="PURCHASE_ORDERS"><RFQForm /></ProtectedRoute>} />
              <Route path="/rfqs/:id" element={<ProtectedRoute module="PURCHASE_ORDERS"><RFQDetail /></ProtectedRoute>} />
              <Route path="/rfqs/:id/edit" element={<ProtectedRoute module="PURCHASE_ORDERS"><RFQForm /></ProtectedRoute>} />
              <Route path="/supplier-quotes" element={<ProtectedRoute module="PURCHASE_ORDERS"><SupplierQuotations /></ProtectedRoute>} />
              <Route path="/purchase-quotations" element={<ProtectedRoute module="PURCHASE_ORDERS"><SupplierQuotations /></ProtectedRoute>} />
              <Route path="/supplier-quotations" element={<ProtectedRoute module="PURCHASE_ORDERS"><SupplierQuotations /></ProtectedRoute>} />
              <Route path="/supplier-quotations/new" element={<ProtectedRoute module="PURCHASE_ORDERS"><SupplierQuotationForm /></ProtectedRoute>} />
              <Route path="/supplier-quotations/:id" element={<ProtectedRoute module="PURCHASE_ORDERS"><SupplierQuotationDetail /></ProtectedRoute>} />
              <Route path="/supplier-quotations/:id/edit" element={<ProtectedRoute module="PURCHASE_ORDERS"><SupplierQuotationForm /></ProtectedRoute>} />
              <Route path="/supplier-quotations/compare/:rfqId" element={<ProtectedRoute module="PURCHASE_ORDERS"><QuotationComparison /></ProtectedRoute>} />
              <Route path="/purchase-orders" element={<ProtectedRoute module="PURCHASE_ORDERS"><PurchaseOrders /></ProtectedRoute>} />
              <Route path="/purchase-orders/new" element={<ProtectedRoute module="PURCHASE_ORDERS"><PurchaseOrderCreate /></ProtectedRoute>} />
              <Route path="/purchase-orders/:id" element={<ProtectedRoute module="PURCHASE_ORDERS"><PurchaseOrderDetails /></ProtectedRoute>} />
              <Route path="/goods-receipts" element={<ProtectedRoute module="GOODS_RECEIPTS"><GoodsReceipts /></ProtectedRoute>} />
              <Route path="/purchase-invoices" element={<ProtectedRoute module="PURCHASE_INVOICES"><APInvoices /></ProtectedRoute>} />
              <Route path="/purchase-invoices/:id" element={<ProtectedRoute module="PURCHASE_INVOICES"><APInvoiceDetails /></ProtectedRoute>} />
              <Route path="/payments" element={<ProtectedRoute module="PAYMENT_VOUCHERS"><APPayments /></ProtectedRoute>} />
            </Route>

            {/* Direct Workflow & Approvals Routes */}
            <Route path="/workflows" element={<ProtectedRoute module="WORKFLOW"><WorkflowManagementPage /></ProtectedRoute>} />
            <Route path="/workflows/approvals" element={<ProtectedRoute module="APPROVAL_REQUESTS"><ApprovalRequestsPage /></ProtectedRoute>} />
            <Route path="/workflows/transactions/:transactionId" element={<ProtectedRoute module="WORKFLOW"><DynamicWorkflowPage /></ProtectedRoute>} />
            <Route path="/workflows/document/:documentType/:documentId" element={<ProtectedRoute module="WORKFLOW"><DynamicWorkflowPage /></ProtectedRoute>} />
            <Route path="/workflow" element={<Navigate to="/workflows" replace />} />
            <Route path="/workflow/approvals" element={<Navigate to="/workflows/approvals" replace />} />

            {/* Tenant Core Pages */}
            <Route path="/modules" element={<CompanyModules />} />
            <Route path="/modules/:id" element={<ModuleDetails />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/company-dashboard" element={<CompanyDashboard />} />
            <Route path="/subscription" element={<SubscriptionPage />} />

            {/* All other shared company routes (HR, Manufacturing, etc.) */}
            {SharedCompanyRoutes({ prefix: "" })}

            {/* SSO & Administration */}
            <Route path="/admin" element={<ProtectedRoute module="SSO"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/system-logs" element={<ProtectedRoute module="SSO"><SystemLogsPage /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute module="USER"><UserList /></ProtectedRoute>} />
            <Route path="/users/:id" element={<ProtectedRoute module="USER"><UserDetails /></ProtectedRoute>} />
            <Route path="/roles" element={<ProtectedRoute module="ROLE"><RoleList /></ProtectedRoute>} />
            <Route path="/portal-access" element={<ProtectedRoute module="PORTAL_ACCESS"><PortalAccess /></ProtectedRoute>} />
            <Route path="/sessions" element={<ProtectedRoute module="SESSION"><SessionList /></ProtectedRoute>} />
            <Route path="/security/roles" element={<ProtectedRoute module="ROLE"><RolePermissionsSettings /></ProtectedRoute>} />
            <Route path="/roles/permissions" element={<ProtectedRoute module="ROLE"><RolePermissionsSettings /></ProtectedRoute>} />
            <Route path="/security/users" element={<ProtectedRoute module="USER"><Navigate to="/settings/security/roles" replace /></ProtectedRoute>} />
            <Route path="/security/features" element={<ProtectedRoute module="FEATURE"><FeatureList /></ProtectedRoute>} />
            <Route path="/security/permissions" element={<ProtectedRoute module="PERMISSION"><PermissionList /></ProtectedRoute>} />
            <Route path="/features" element={<ProtectedRoute module="FEATURE"><FeatureList /></ProtectedRoute>} />

            {/* Settings */}
            <Route path="/settings" element={<Navigate to="/settings/general" replace />} />
            <Route path="/settings/general" element={<GeneralSettings />} />
            <Route path="/settings/security" element={<SecuritySettings />} />
            <Route path="/settings/security/features" element={<FeatureList />} />
            <Route path="/settings/security/permissions" element={<PermissionList />} />
            <Route path="/settings/security/roles" element={<RolePermissionsSettings />} />
            <Route path="/settings/security/users" element={<Navigate to="/settings/security/roles" replace />} />
            <Route path="/settings/notifications" element={<NotificationsSettings />} />
            <Route path="/settings/integrations" element={<IntegrationsSettings />} />
            <Route path="/settings/audit-logs" element={<AuditLogsSettings />} />
            <Route path="/settings/preferences" element={<PreferencesSettings />} />
            <Route path="/settings/appearance" element={<AppearanceSettings />} />
            <Route path="/settings/themes" element={<Navigate to="/settings/appearance" replace />} />
            <Route path="/settings/appearance-themes" element={<Navigate to="/settings/appearance" replace />} />
            <Route path="/settings/plans" element={<SubscriptionPlansSettings />} />
            <Route path="/settings/roles" element={<Navigate to="/settings/security/roles" replace />} />
            <Route path="/settings/users" element={<Navigate to="/settings/security/roles" replace />} />
            <Route path="/settings/features" element={<Navigate to="/settings/security/features" replace />} />
            <Route path="/settings/permissions" element={<Navigate to="/settings/security/permissions" replace />} />
            <Route path="/settings/sales" element={<SalesSettings />} />
            <Route path="/settings/account" element={<SalesSettings />} />
            <Route path="/settings/inventory" element={<InventorySettingsPage />} />
            <Route path="/settings/workflow" element={<WorkflowSettingsPage />} />
            <Route path="/settings/crm" element={<CrmSettingsPage />} />
            <Route path="/settings/organization" element={<OrganizationSettingsPage />} />
            <Route path="/settings/organization/:section" element={<OrganizationSettingsPage />} />
            <Route path="/settings/my-account" element={<Navigate to="/profile" replace />} />
            <Route path="/profile" element={<ProfilePage />} />
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
            <Route path="gst-reports/*" element={<CompanyGstRedirect />} />

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
            <Route path="workflows" element={<ProtectedRoute module="WORKFLOW"><WorkflowManagementPage /></ProtectedRoute>} />
            <Route path="workflows/approvals" element={<ProtectedRoute module="WORKFLOW_TASKS"><ApprovalRequestsPage /></ProtectedRoute>} />
            <Route path="workflow" element={<CompanyWorkflowRedirect />} />
            <Route path="workflow/approvals" element={<CompanyWorkflowApprovalsRedirect />} />
            <Route
              path="manufacturing/audit"
              element={<AuditLogsPage moduleFilter="Manufacturing" />}
            />

            {/* Admin-only sections */}
            <Route path="admin" element={<ProtectedRoute module="SSO"><AdminDashboard /></ProtectedRoute>} />
            <Route path="admin/system-logs" element={<ProtectedRoute module="SSO"><SystemLogsPage /></ProtectedRoute>} />
            <Route path="users" element={<ProtectedRoute module="USER"><UserList /></ProtectedRoute>} />
            <Route path="users/:id" element={<ProtectedRoute module="USER"><UserDetails /></ProtectedRoute>} />
            <Route path="roles" element={<ProtectedRoute module="ROLE"><RoleList /></ProtectedRoute>} />
            <Route path="portal-access" element={<ProtectedRoute module="PORTAL_ACCESS"><PortalAccess /></ProtectedRoute>} />
            <Route path="sessions" element={<ProtectedRoute module="SESSION"><SessionList /></ProtectedRoute>} />
            <Route path="security/roles" element={<ProtectedRoute module="ROLE"><RolePermissionsSettings /></ProtectedRoute>} />
            <Route path="roles/permissions" element={<RolePermissionsSettings />} />
            <Route path="security/users" element={<Navigate to="/settings/security/roles" replace />} />
            <Route path="security/features" element={<FeatureList />} />
            <Route path="security/permissions" element={<PermissionList />} />
            <Route path="features" element={<FeatureList />} />

            {/* Reports */}
            <Route path="reports" element={<FinancialReports />} />
            <Route path="reports/receivables" element={<ReceivablesReport />} />
            <Route path="reports/payables" element={<PayablesReport />} />
            <Route path="reports/tb" element={<TrialBalance />} />
            <Route path="reports/pl" element={<ProfitLoss />} />
            <Route path="reports/bs" element={<BalanceSheet />} />

            {/* Utility */}
            <Route path="settings" element={<Navigate to="general" replace />} />
            <Route path="settings/general" element={<GeneralSettings />} />
            <Route path="settings/security" element={<SecuritySettings />} />
            <Route path="settings/security/features" element={<FeatureList />} />
            <Route path="settings/security/permissions" element={<PermissionList />} />
            <Route path="settings/notifications" element={<NotificationsSettings />} />
            <Route path="settings/security/roles" element={<RolePermissionsSettings />} />
            <Route path="settings/security/users" element={<Navigate to="/settings/security/roles" replace />} />
            <Route path="settings/integrations" element={<IntegrationsSettings />} />
            <Route path="settings/audit-logs" element={<AuditLogsSettings />} />
            <Route path="settings/preferences" element={<PreferencesSettings />} />
            <Route path="settings/appearance" element={<AppearanceSettings />} />
            <Route path="settings/themes" element={<Navigate to="settings/appearance" replace />} />
            <Route path="settings/appearance-themes" element={<Navigate to="settings/appearance" replace />} />
            <Route path="settings/plans" element={<SubscriptionPlansSettings />} />
            <Route path="settings/sales" element={<SalesSettings />} />
            <Route path="settings/account" element={<SalesSettings />} />
            <Route path="settings/inventory" element={<InventorySettingsPage />} />
            <Route path="settings/workflow" element={<WorkflowSettingsPage />} />
            <Route path="settings/crm" element={<CrmSettingsPage />} />
            <Route path="settings/organization" element={<OrganizationSettingsPage />} />
            <Route path="settings/organization/:section" element={<OrganizationSettingsPage />} />
            <Route path="settings/my-account" element={<CompanyProfileRedirect />} />
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
            <Route path="workflow-templates" element={<PlatformWorkflowTemplatesPage />} />
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
            <Route path="crm-integrations" element={<GlobalIntegrationProvidersPage />} />
            <Route path="integrations" element={<GlobalIntegrationProvidersPage />} />
            <Route path="integrations/providers" element={<GlobalIntegrationProvidersPage />} />

            <Route path="reports" element={<FinancialReports />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* ── Catch-all 404 Route ── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </SidebarProvider>
    </Suspense>
  );
}
