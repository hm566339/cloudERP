import {
  LayoutDashboard, Building2, Users, ShieldCheck, Layers, Activity, Globe,
  Settings, LineChart, IndianRupee, UserCheck, Package, ShoppingCart, Store,
  TrendingUp, UserPlus, Clock, BadgeCheck, Truck, ClipboardCheck, Cog, ScrollText,
  Network, BookOpen, Calendar, ArrowLeftRight, PieChart, FileText, CreditCard,
  Tag, User, Target, Warehouse, ScanLine, Factory, PackageOpen, ClipboardList, Boxes,
  ArrowDownCircle, ArrowUpCircle, Calculator, BarChart3, Shield, Database, Box,
  Receipt, FileSpreadsheet, Landmark, Download, Scale3d, ArrowRightLeft, BoxSelect, Lock,
  UserCog, Workflow, FolderTree, MessageSquare
} from 'lucide-react';

import {
  CANONICAL_MODULES,
  normalizeModuleName,
  normalizeFeatureCode,
  getEntitledModules,
  hasModule,
  hasFeature,
  hasPermission as checkHasPermission,
  isSystemAdminUser,
  buildAuthContext,
} from '../utils/moduleNormalization.js';

/**
 * Reusable permission check.
 * Supports:
 *   hasPermission(authContext, featureCode, action, moduleName)
 *   hasPermission(featureCode, action) (when context is omitted or bound)
 */
export function hasPermission(authContextOrFeature, featureNameOrAction, actionOrModule, maybeModule) {
  return checkHasPermission(authContextOrFeature, featureNameOrAction, actionOrModule, maybeModule);
}

/**
 * Centralized UI metadata and default navigation configurations for all canonical ERP modules.
 */
export const MODULE_UI_METADATA = {
  [CANONICAL_MODULES.ACCOUNT]: {
    id: 'accounts',
    label: 'Accounts',
    icon: Calculator,
    defaultPath: (base) => `${base}/accounts/dashboard`,
  },
  [CANONICAL_MODULES.INVENTORY]: {
    id: 'inventory',
    label: 'Inventory Management',
    icon: Boxes,
    defaultPath: (base) => `${base}/inventory/dashboard`,
  },
  [CANONICAL_MODULES.CRM]: {
    id: 'sales-crm',
    label: 'Sales & CRM',
    icon: TrendingUp,
    defaultPath: (base) => `${base}/crm/dashboard`,
  },
  [CANONICAL_MODULES.WORKFLOW]: {
    id: 'workflow',
    label: 'Workflow & Approvals',
    icon: Workflow,
    defaultPath: (base) => `/workflows`,
  },
  [CANONICAL_MODULES.SSO]: {
    id: 'admin',
    label: 'SSO & Administration',
    icon: ShieldCheck,
    defaultPath: (base) => `${base}/admin`,
  },
  [CANONICAL_MODULES.PURCHASES]: {
    id: 'purchases',
    label: 'Purchase Management',
    icon: Store,
    defaultPath: (base) => `${base}/purchases`,
  },
  [CANONICAL_MODULES.HR]: {
    id: 'hr',
    label: 'HR & Employees',
    icon: Users,
    defaultPath: (base) => `${base}/hr`,
  },
  [CANONICAL_MODULES.MANUFACTURING]: {
    id: 'manufacturing',
    label: 'Manufacturing',
    icon: Factory,
    defaultPath: (base) => `${base}/manufacturing`,
  },
};

/**
 * System Admin (platform-administration) navigation items.
 * Preserved exactly as existing platform admin layout.
 */
export function getSystemAdminNavigation() {
  return [
    {
      id: 'sa-dashboard',
      label: 'Dashboard',
      path: '/super-admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'sa-organizations',
      label: 'Organizations',
      icon: Building2,
      path: '/super-admin/organizations',
      children: [
        {
          id: 'sa-orgs-all',
          label: 'All Organizations',
          path: '/super-admin/organizations',
          icon: Building2,
        },
      ],
    },
    {
      id: 'sa-org-management',
      label: 'Org Management',
      icon: UserCog,
      path: '/super-admin/companies',
      children: [
        {
          id: 'sa-org-companies',
          label: 'Companies',
          path: '/super-admin/companies',
          icon: Building2,
        },
      ],
    },
    {
      id: 'sa-platform',
      label: 'Platform',
      icon: Globe,
      path: '/super-admin/modules',
      children: [
        {
          id: 'sa-plat-modules',
          label: 'Modules',
          path: '/super-admin/modules',
          icon: Box,
        },
        {
          id: 'sa-plat-routes',
          label: 'Module Routes',
          path: '/super-admin/module-routes',
          icon: Layers,
        },
      ],
    },
    {
      id: 'sa-plans',
      label: 'Subscriptions',
      icon: CreditCard,
      path: '/super-admin/plans',
      children: [
        {
          id: 'sa-plans-catalog',
          label: 'Subscription Plans',
          path: '/super-admin/plans',
          icon: CreditCard,
        },
      ],
    },
    {
      id: 'sa-system-logs',
      label: 'System Logs',
      icon: Activity,
      path: '/super-admin/system-logs',
      children: [
        {
          id: 'sa-logs-view',
          label: 'System Logs',
          path: '/super-admin/system-logs',
          icon: ScrollText,
        },
      ],
    },
  ];
}

/**
 * Raw blueprint generator for each module.
 */
function getModuleNavigationBlueprint(moduleName, base) {
  switch (moduleName) {
    case CANONICAL_MODULES.ACCOUNT:
      return [
        {
          id: 'acc-dash',
          label: 'Dashboard',
          path: `${base}/accounts/dashboard`,
          icon: LayoutDashboard,
          featureCode: 'DASHBOARD',
          action: 'READ',
        },
        {
          id: 'acc-masters',
          label: 'Masters',
          icon: Database,
          children: [
            { id: 'acc-cust', label: 'Customers', path: `${base}/accounts/masters/customers`, icon: UserCheck, featureCode: 'CUSTOMERS', action: 'READ' },
            { id: 'acc-vend', label: 'Vendors', path: `${base}/accounts/masters/vendors`, icon: Truck, featureCode: 'VENDORS', action: 'READ' },
            { id: 'acc-coa', label: 'Chart of Accounts', path: `${base}/accounts/masters/ledgers`, icon: BookOpen, featureCode: 'CHART_OF_ACCOUNTS', action: 'READ' },
            { id: 'acc-ag', label: 'Account Groups', path: `${base}/accounts/masters/account-groups`, icon: Network, featureCode: 'ACCOUNT_GROUPS', action: 'READ' },
            { id: 'acc-ac', label: 'Account Categories', path: `${base}/accounts/masters/account-categories`, icon: Layers, featureCode: 'ACCOUNT_CATEGORIES', action: 'READ' },
            { id: 'acc-ap', label: 'Accounting Periods', path: `${base}/accounts/organization/accounting-periods`, icon: Clock, featureCode: 'ACCOUNTING_PERIODS', action: 'READ' },
            { id: 'acc-fy', label: 'Fiscal Years', path: `${base}/accounts/organization/financial-years`, icon: Calendar, featureCode: 'FISCAL_YEARS', action: 'READ' },
            { id: 'acc-ec', label: 'Expense Categories', path: `${base}/accounts/masters/expense-categories`, icon: Tag, featureCode: 'EXPENSES', action: 'READ' },
          ],
        },
        {
          id: 'acc-txn',
          label: 'Transactions',
          icon: TrendingUp,
          children: [
            { id: 'acc-txn-sales', label: 'Sales Invoices', path: `${base}/accounts/transactions/sales`, icon: FileText, featureCode: 'SALES_INVOICES', action: 'READ' },
            { id: 'acc-txn-pur', label: 'Purchase Invoices', path: `${base}/accounts/transactions/purchase`, icon: FileText, featureCode: 'PURCHASE_INVOICES', action: 'READ' },
            { id: 'acc-txn-exp', label: 'Expense', path: `${base}/accounts/transactions/expenses`, icon: Receipt, featureCode: 'EXPENSES', action: 'READ' },
            { id: 'acc-txn-pay', label: 'Payment Vouchers', path: `${base}/accounts/transactions/payments`, icon: CreditCard, featureCode: 'PAYMENT_VOUCHERS', action: 'READ' },
            { id: 'acc-txn-cn', label: 'Credit Notes', path: `${base}/accounts/transactions/credit-notes`, icon: ArrowDownCircle, featureCode: 'CREDIT_NOTES', action: 'READ' },
            { id: 'acc-txn-dn', label: 'Debit Notes', path: `${base}/accounts/transactions/debit-notes`, icon: ArrowUpCircle, featureCode: 'DEBIT_NOTES', action: 'READ' },
            { id: 'acc-txn-jour', label: 'GL Journals', path: `${base}/accounts/transactions/journal`, icon: BookOpen, featureCode: 'GL_JOURNALS', action: 'READ' },
            { id: 'acc-txn-jour-lines', label: 'GL Journal Lines', path: `${base}/accounts/transactions/journal-lines`, icon: FileSpreadsheet, featureCode: 'GL_JOURNAL_LINES', action: 'READ' },
          ],
        },
        {
          id: 'acc-tax',
          label: 'Tax',
          icon: BadgeCheck,
          children: [
            { id: 'acc-tax-gst-state', label: 'GST State Master', path: `${base}/accounts/tax/gst-state-master`, icon: Tag, featureCode: 'GST_MASTER', action: 'READ' },
            { id: 'acc-tax-gst-reg', label: 'GST Registrations', path: `${base}/accounts/tax/gst-registrations`, icon: Tag, featureCode: 'GST_MASTER', action: 'READ' },
            { id: 'acc-tax-gst', label: 'GST Slabs', path: `${base}/accounts/masters/gst-slabs`, icon: BadgeCheck, featureCode: 'GST_SLABS', action: 'READ' },
            { id: 'acc-tax-hsn', label: 'HSN / SAC', path: `${base}/accounts/masters/hsn-sac`, icon: Tag, featureCode: 'HSN_SAC', action: 'READ' },
          ],
        },
        {
          id: 'acc-bank',
          label: 'Bank',
          icon: Building2,
          children: [
            { id: 'acc-bnk-acc', label: 'Bank Accounts', path: `${base}/accounts/masters/bank-accounts`, icon: Building2, featureCode: 'BANK_ACCOUNTS', action: 'READ' },
            { id: 'acc-bnk-txns', label: 'Bank Transactions', path: `${base}/accounts/transactions/banking`, icon: ArrowLeftRight, featureCode: 'BANK_TRANSACTIONS', action: 'READ' },
            { id: 'acc-bnk-rec', label: 'Bank Reconciliation', path: `${base}/accounts/transactions/bank-reconciliation`, icon: ClipboardCheck, featureCode: 'BANK_RECONCILIATION', action: 'READ' },
          ],
        },
        {
          id: 'acc-budget',
          label: 'Budget',
          icon: PieChart,
          children: [
            { id: 'acc-bud-hdr', label: 'Budget Headers', path: `${base}/accounts/budget/budget-headers`, icon: Layers, featureCode: 'BUDGET_HEADERS', action: 'READ' },
            { id: 'acc-bud-lin', label: 'Budget Lines', path: `${base}/accounts/budget/budget-lines`, icon: Network, featureCode: 'BUDGET_LINES', action: 'READ' },
          ],
        },
        {
          id: 'acc-reports',
          label: 'Reports',
          icon: LineChart,
          children: [
            { id: 'acc-rep-led', label: 'General Ledger', path: `${base}/accounts/reports/ledger`, icon: BookOpen, featureCode: 'GENERAL_LEDGER', action: 'READ' },
            { id: 'acc-rep-tb', label: 'Trial Balance', path: `${base}/accounts/reports/trial-balance`, icon: FileText, featureCode: 'REPORTS', action: 'READ' },
            { id: 'acc-rep-pl', label: 'Profit & Loss', path: `${base}/accounts/reports/profit-loss`, icon: TrendingUp, featureCode: 'REPORTS', action: 'READ' },
            { id: 'acc-rep-bs', label: 'Balance Sheet', path: `${base}/accounts/reports/balance-sheet`, icon: PieChart, featureCode: 'REPORTS', action: 'READ' },
            { id: 'acc-rep-cf', label: 'Cash Flow', path: `${base}/accounts/reports/cash-flow`, icon: Activity, featureCode: 'REPORTS', action: 'READ' },
            {
              id: 'acc-rep-gst',
              label: 'GST Reports',
              icon: BarChart3,
              path: `${base}/accounts/reports/gst`,
              children: [
                { id: 'acc-rep-gst-summary', label: 'GST Summary', path: `${base}/accounts/reports/gst/summary`, icon: LayoutDashboard, featureCode: 'GST_REPORTS', action: 'READ' },
                { id: 'acc-rep-gst-gstr1', label: 'GSTR-1', path: `${base}/accounts/reports/gst/gstr1`, icon: FileText, featureCode: 'GST_REPORTS', action: 'READ' },
                { id: 'acc-rep-gst-gstr3b', label: 'GSTR-3B', path: `${base}/accounts/reports/gst/gstr3b`, icon: Receipt, featureCode: 'GST_REPORTS', action: 'READ' },
                { id: 'acc-rep-gst-hsn', label: 'HSN Summary', path: `${base}/accounts/reports/gst/hsn-summary`, icon: FileSpreadsheet, featureCode: 'GST_REPORTS', action: 'READ' },
                { id: 'acc-rep-gst-itc', label: 'ITC Report', path: `${base}/accounts/reports/gst/itc`, icon: Landmark, featureCode: 'GST_REPORTS', action: 'READ' },
                { id: 'acc-rep-gst-gstr2b', label: 'GSTR-2B', path: `${base}/accounts/reports/gst/gstr2b`, icon: FileSpreadsheet, featureCode: 'GST_REPORTS', action: 'READ' },
                { id: 'acc-rep-gst-export', label: 'Export Reports', path: `${base}/accounts/reports/gst/export`, icon: Download, featureCode: 'GST_REPORTS', action: 'EXPORT' },
              ],
            },
          ],
        },
        {
          id: 'acc-settings',
          label: 'Settings',
          icon: Settings,
          children: [
            { id: 'acc-set-aud', label: 'Audit Logs', path: `${base}/accounts/settings/audit-logs`, icon: ScrollText, featureCode: 'AUDIT_LOGS', action: 'READ' },
            { id: 'acc-set-sales', label: 'Sales Settings', path: `${base}/accounts/settings/sales`, icon: Settings, featureCode: 'SETTINGS', action: 'READ' },
          ],
        },
      ];

    case CANONICAL_MODULES.INVENTORY:
      return [
        {
          id: 'inv-dashboard',
          label: 'Dashboard',
          path: `${base}/inventory/dashboard`,
          icon: LayoutDashboard,
          featureCode: 'DASHBOARD',
          action: 'READ',
        },
        {
          id: 'inv-products-group',
          label: 'Products',
          icon: Package,
          children: [
            { id: 'inv-products', label: 'Products', path: `${base}/inventory/products`, icon: Package, featureCode: 'PRODUCTS', action: 'READ' },
            { id: 'inv-product-categories', label: 'Categories', path: `${base}/inventory/product-categories`, icon: FolderTree, featureCode: 'PRODUCT_CATEGORIES', action: 'READ' },
            { id: 'inv-product-uoms', label: 'Units of Measure', path: `${base}/inventory/unit-of-measures`, icon: Scale3d, featureCode: 'UNIT_OF_MEASURES', action: 'READ' },
            { id: 'inv-product-prices', label: 'Product Prices', path: `${base}/inventory/product-prices`, icon: Tag, featureCode: 'PRODUCT_PRICES', action: 'READ' },
            { id: 'inv-product-batches', label: 'Product Batches', path: `${base}/inventory/product-batches`, icon: Box, featureCode: 'PRODUCT_BATCHES', action: 'READ' },
            { id: 'inv-product-serials', label: 'Product Serials', path: `${base}/inventory/product-serials`, icon: ScanLine, featureCode: 'PRODUCT_SERIALS', action: 'READ' },
          ],
        },
        {
          id: 'inv-warehouse-group',
          label: 'Warehouses',
          icon: Warehouse,
          children: [
            { id: 'inv-warehouse', label: 'Warehouses', path: `${base}/inventory/warehouses`, icon: Warehouse, featureCode: 'WAREHOUSES', action: 'READ' },
            { id: 'inv-warehouse-locations', label: 'Warehouse Locations', path: `${base}/inventory/warehouse-locations`, icon: Store, featureCode: 'WAREHOUSE_LOCATIONS', action: 'READ' },
          ],
        },
        {
          id: 'inv-stock-ops-group',
          label: 'Stock Operations',
          icon: Activity,
          children: [
            { id: 'inv-current-stock', label: 'Current Stock', path: `${base}/inventory/stock`, icon: Boxes, featureCode: 'STOCK', action: 'READ' },
            { id: 'inv-stock-movements', label: 'Stock Movements', path: `${base}/inventory/stock-movements`, icon: BoxSelect, featureCode: 'STOCK_MOVEMENTS', action: 'READ' },
            { id: 'inv-transfer', label: 'Stock Transfers', path: `${base}/inventory/stock-transfers`, icon: ArrowLeftRight, featureCode: 'STOCK_TRANSFERS', action: 'READ' },
            { id: 'inv-stock-reservations', label: 'Stock Reservations', path: `${base}/inventory/stock-reservations`, icon: Lock, featureCode: 'STOCK_RESERVATIONS', action: 'READ' },
            { id: 'inv-stock-adjustments', label: 'Stock Adjustments', path: `${base}/inventory/stock-adjustments`, icon: ArrowRightLeft, featureCode: 'STOCK_ADJUSTMENTS', action: 'READ' },
            { id: 'inv-opening-stock', label: 'Opening Stock', path: `${base}/inventory/opening-stock`, icon: PackageOpen, featureCode: 'OPENING_STOCK', action: 'READ' },
          ],
        },
        {
          id: 'inv-control-group',
          label: 'Inventory Control',
          icon: Landmark,
          children: [
            { id: 'inv-valuations', label: 'Inventory Valuation', path: `${base}/inventory/valuations`, icon: Landmark, featureCode: 'INVENTORY_VALUATION', action: 'READ' },
            { id: 'inv-reports', label: 'Inventory Reports', path: `${base}/inventory/reports`, icon: FileText, featureCode: 'INVENTORY_REPORTS', action: 'READ' },
            { id: 'inv-posting', label: 'Inventory Posting', path: `${base}/inventory/inventory-posting`, icon: Receipt, featureCode: 'INVENTORY_POSTING', action: 'READ' },
          ],
        },
      ];

    case CANONICAL_MODULES.CRM:
      return [
        {
          id: 'crm-dashboard',
          label: 'Dashboard',
          path: `${base}/crm/dashboard`,
          icon: LayoutDashboard,
          featureCode: 'DASHBOARD',
          action: 'READ',
        },
        {
          id: 'crm-customers',
          label: 'Customer Management',
          path: `${base}/crm/customers`,
          icon: UserCheck,
          featureCode: 'CUSTOMERS',
          action: 'READ',
        },
        {
          id: 'crm-leads',
          label: 'Lead Tracking',
          path: `${base}/crm/leads`,
          icon: UserPlus,
          featureCode: 'LEADS',
          action: 'READ',
        },
        {
          id: 'crm-quotations',
          label: 'Quotations',
          path: `${base}/crm/quotations`,
          icon: FileText,
          featureCode: 'QUOTATIONS',
          action: 'READ',
        },
        {
          id: 'crm-orders',
          label: 'Sales Orders',
          path: `${base}/crm/orders`,
          icon: ShoppingCart,
          featureCode: 'ORDERS',
          action: 'READ',
        },
        {
          id: 'crm-comms',
          label: 'Customer Communication',
          path: `${base}/crm/communication`,
          icon: MessageSquare,
          featureCode: 'COMMUNICATION',
          action: 'READ',
        },
        {
          id: 'crm-analytics',
          label: 'Sales Analytics',
          path: `${base}/crm/analytics`,
          icon: LineChart,
          featureCode: 'ANALYTICS',
          action: 'READ',
        },
        {
          id: 'crm-invoices',
          label: 'Invoices',
          path: `${base}/crm/invoices`,
          icon: Receipt,
          featureCode: 'SALES_INVOICES',
          action: 'READ',
        },
        {
          id: 'crm-audit',
          label: 'Audit Logs',
          path: `${base}/crm/audit`,
          icon: ScrollText,
          featureCode: 'AUDIT_LOGS',
          action: 'READ',
        },
      ];

    case CANONICAL_MODULES.WORKFLOW:
      return [
        {
          id: 'workflow-definitions',
          label: 'Workflow Definitions',
          path: `/workflows`,
          icon: Workflow,
          featureCode: 'WORKFLOW_DEFINITIONS',
          action: 'READ',
        },
        {
          id: 'workflow-approvals',
          label: 'Workflow & Approvals',
          path: `/workflows`,
          icon: ClipboardCheck,
          featureCode: 'WORKFLOW_DEFINITIONS',
          action: 'READ',
        },
        {
          id: 'workflow-approval-requests',
          label: 'Approval Requests',
          path: `/workflows/approvals`,
          icon: ClipboardCheck,
          featureCode: 'WORKFLOW_TASKS',
          action: 'READ',
        },
        {
          id: 'workflow-settings',
          label: 'Workflow Settings',
          path: `/settings/workflow`,
          icon: Settings,
          featureCode: 'WORKFLOW_DEFINITIONS',
          action: 'READ',
        },
      ];

    case CANONICAL_MODULES.SSO:
      return [
        {
          id: 'admin-dashboard',
          label: 'Admin Dashboard',
          path: `${base}/admin`,
          icon: LayoutDashboard,
          featureCode: 'DASHBOARD',
          action: 'READ',
        },
        {
          id: 'users',
          label: 'User Management',
          path: `${base}/users`,
          icon: Users,
          featureCode: 'USER_MANAGEMENT',
          action: 'READ',
        },
        {
          id: 'roles',
          label: 'Role Management',
          path: `${base}/roles`,
          icon: ShieldCheck,
          featureCode: 'ROLE_MANAGEMENT',
          action: 'READ',
        },
        {
          id: 'portal-access',
          label: 'Portal Access',
          path: `${base}/portal-access`,
          icon: Globe,
          featureCode: 'PORTAL_ACCESS',
          action: 'READ',
        },
        {
          id: 'sessions',
          label: 'Session Management',
          path: `${base}/sessions`,
          icon: Activity,
          featureCode: 'SESSION_MANAGEMENT',
          action: 'READ',
        },
        {
          id: 'workflow-approval-requests',
          label: 'Approval Requests',
          path: `/workflows/approvals`,
          icon: ClipboardCheck,
          featureCode: 'WORKFLOW_TASKS',
          action: 'READ',
        },
        {
          id: 'workflow-approvals',
          label: 'Workflow & Approvals',
          path: `/workflows`,
          icon: ClipboardCheck,
          featureCode: 'WORKFLOW_DEFINITIONS',
          action: 'READ',
        },
        {
          id: 'sso-org',
          label: 'Organization Management',
          path: `/settings/organization`,
          icon: Building2,
          featureCode: 'ORGANIZATION',
          action: 'READ',
        },
        {
          id: 'sso-subscription',
          label: 'Subscription Management',
          path: `/subscription`,
          icon: CreditCard,
          featureCode: 'SUBSCRIPTION',
          action: 'READ',
        },
        {
          id: 'system-logs',
          label: 'System Logs',
          path: `${base}/admin/system-logs`,
          icon: ScrollText,
          featureCode: 'AUDIT_LOGS',
          action: 'READ',
        },
      ];

    case CANONICAL_MODULES.PURCHASES:
      return [
        { id: 'pur-dashboard', label: 'Purchase Dashboard', path: `${base}/purchases`, icon: LayoutDashboard, featureCode: 'DASHBOARD', action: 'READ' },
        { id: 'pur-requests', label: 'Purchase Requests', path: `/purchase-requisitions`, icon: ClipboardList, featureCode: 'PURCHASE_REQUESTS', action: 'READ' },
        { id: 'pur-orders', label: 'Purchase Orders', path: `/purchase-orders`, icon: ShoppingCart, featureCode: 'PURCHASE_ORDERS', action: 'READ' },
        { id: 'pur-quotes', label: 'Supplier Quotations', path: `/supplier-quotes`, icon: FileText, featureCode: 'SUPPLIER_QUOTATIONS', action: 'READ' },
        { id: 'pur-receipts', label: 'Goods Receipts', path: `/goods-receipts`, icon: ClipboardCheck, featureCode: 'GOODS_RECEIPTS', action: 'READ' },
      ];

    default:
      return [];
  }
}

/**
 * Filter an item or recursive group node.
 * Returns null if the item or group is unauthorized or has no surviving children.
 */
function filterNavigationNode(item, authContext, moduleName, canAccessCustom) {
  // 1. Group Node (has children)
  if (Array.isArray(item.children) && item.children.length > 0) {
    const filteredChildren = item.children
      .map((child) => filterNavigationNode(child, authContext, moduleName, canAccessCustom))
      .filter(Boolean);

    // Prune empty parent menu
    if (filteredChildren.length === 0) {
      return null;
    }

    return {
      ...item,
      children: filteredChildren,
    };
  }

  // 2. Leaf item authorization check
  const action = item.action || 'READ';
  const featureCode = item.featureCode;

  // Custom checker if supplied
  if (typeof canAccessCustom === 'function') {
    const customAllowed = canAccessCustom(featureCode || moduleName, action, moduleName);
    if (!customAllowed) return null;
  }

  // System admin bypass
  if (isSystemAdminUser(authContext)) {
    return item;
  }

  // Root module dashboards (e.g. admin-dashboard, acc-dash, inv-dashboard, crm-dashboard)
  // If DASHBOARD permission is defined in user permissions, enforce DASHBOARD:READ.
  // Otherwise, if module itself is entitled, allow access to its primary dashboard.
  if (item.id === 'admin-dashboard' || item.id === 'acc-dash' || item.id === 'inv-dashboard' || item.id === 'crm-dashboard') {
    const hasExplicitDashPerm = checkHasPermission(authContext, 'DASHBOARD', 'READ') ||
      checkHasPermission(authContext, `${moduleName}_DASHBOARD`, 'READ') ||
      checkHasPermission(authContext, moduleName, 'READ') ||
      checkHasPermission(authContext, 'ALL', 'READ') ||
      checkHasPermission(authContext, 'ALL_MODULES', 'READ');

    const hasAnyDashboardInPerms = (authContext?.permissions || []).some((p) => {
      const code = typeof p === 'string' ? p : (p?.featureCode || p?.permissionCode || '');
      return String(code).toUpperCase().includes('DASHBOARD');
    });

    if (hasAnyDashboardInPerms && !hasExplicitDashPerm) {
      return null;
    }
    return item;
  }

  // If a feature code is specified, enforce feature assignment & permission check
  if (featureCode) {
    // A) If features[] is explicitly populated in session, feature must be present and active
    const featuresList = authContext?.features || [];
    if (featuresList.length > 0) {
      const hasFeat = hasFeature(authContext, featureCode, moduleName) ||
        (item.id?.startsWith('workflow-') && (
          hasFeature(authContext, featureCode, CANONICAL_MODULES.WORKFLOW) ||
          hasFeature(authContext, featureCode)
        ));
      if (!hasFeat) return null;
    }

    // B) Permission check: user MUST have explicit or wildcard permission for this action
    // "Follow the application's established permission semantics. Do not assume that WRITE or DELETE implies READ."
    // "A user missing PRODUCTS:READ cannot see the Products menu item."
    const hasPerm = checkHasPermission(authContext, featureCode, action, moduleName) ||
      (item.id?.startsWith('workflow-') && (
        checkHasPermission(authContext, featureCode, action, CANONICAL_MODULES.WORKFLOW) ||
        checkHasPermission(authContext, featureCode, action)
      ));
    if (!hasPerm) {
      // Special aliases for workflow & administration modules
      if (moduleName === CANONICAL_MODULES.WORKFLOW || item.id?.startsWith('workflow-')) {
        const hasWorkflowGeneral =
          checkHasPermission(authContext, 'WORKFLOW', 'READ') ||
          checkHasPermission(authContext, 'APPROVALS', 'READ') ||
          checkHasPermission(authContext, 'WORKFLOW_APPROVALS', 'READ') ||
          checkHasPermission(authContext, 'WORKFLOW_DEFINITIONS', 'READ') ||
          checkHasPermission(authContext, 'WORKFLOW_TASKS', 'READ');
        if (!hasWorkflowGeneral) return null;
      } else if (moduleName === CANONICAL_MODULES.SSO && (featureCode === 'USER_MANAGEMENT' || featureCode === 'ROLE_MANAGEMENT')) {
        const shortCode = featureCode === 'USER_MANAGEMENT' ? 'USER' : 'ROLE';
        const hasShortPerm = checkHasPermission(authContext, shortCode, action, moduleName);
        if (!hasShortPerm) return null;
      } else {
        return null;
      }
    }
  } else {
    // No specific featureCode on leaf: check parent module read access
    const hasModRead = checkHasPermission(authContext, moduleName, 'READ', moduleName) ||
      checkHasPermission(authContext, 'ALL', 'READ') ||
      checkHasPermission(authContext, 'ALL_MODULES', 'READ');
    if (!hasModRead && (authContext?.permissions || []).length > 0) {
      return null;
    }
  }

  return item;
}

/**
 * Builds the fully dynamic role-based ERP sidebar navigation tree.
 * Sourced directly from the authenticated user's API response.
 *
 * @param {Object} options
 * @param {Object} options.authContext - Normalized or raw auth context from Redux/SSO
 * @param {string} [options.userRole] - User role
 * @param {string|number} [options.companyId] - Currently selected company ID
 * @param {boolean} [options.isSuperAdminGlobal] - Whether user is in Super Admin global console
 * @param {Function} [options.canAccess] - Optional custom permission evaluator
 * @param {Array} [options.permissions] - Optional permissions override
 * @returns {Array} List of top-level navigation sections with authorized child items
 */
export function buildDynamicSidebar({
  authContext = {},
  userRole = null,
  companyId = null,
  isSuperAdminGlobal = false,
  canAccess = null,
  permissions = null,
} = {}) {
  // ── 1. System Admin Global Console Exception ──────────────────────────────
  const normalizedContext = buildAuthContext(authContext);
  if (permissions && Array.isArray(permissions)) {
    normalizedContext.permissions = permissions;
  }

  const isSysAdmin = isSystemAdminUser(normalizedContext);
  if (isSuperAdminGlobal && isSysAdmin) {
    return getSystemAdminNavigation();
  }

  // ── 2. Guard against missing or blocked session ────────────────────────────
  if (normalizedContext.accessMode === 'BLOCKED') {
    return [];
  }

  // ── 3. Identify active entitled modules from API response ──────────────────
  const entitledModules = getEntitledModules(normalizedContext);
  if (!entitledModules || entitledModules.length === 0) {
    return [];
  }

  const base = companyId ? `/company/${companyId}` : '';
  const links = [];

  // Deduplicate and preserve order
  const uniqueModules = Array.from(new Set(entitledModules));

  for (const moduleName of uniqueModules) {
    // Workflow & Approvals should not appear as a top-level item in the main sidebar for regular organization roles
    if (moduleName === CANONICAL_MODULES.WORKFLOW || normalizeModuleName(moduleName) === CANONICAL_MODULES.WORKFLOW) {
      continue;
    }

    const meta = MODULE_UI_METADATA[moduleName];
    if (!meta) continue;

    const blueprint = getModuleNavigationBlueprint(moduleName, base);
    if (!blueprint || blueprint.length === 0) continue;

    const filteredChildren = blueprint
      .map((item) => filterNavigationNode(item, normalizedContext, moduleName, canAccess))
      .filter(Boolean);

    // "Do not show empty parent menus after filtering."
    // If a module has no authorized child navigation items, omit the entire module.
    if (filteredChildren.length === 0) {
      continue;
    }

    links.push({
      id: meta.id,
      label: meta.label,
      icon: meta.icon,
      path: meta.defaultPath(base),
      children: filteredChildren,
    });
  }

  return links;
}

/**
 * Reusable utility to obtain authorized navigation tree for any authenticated context.
 */
export function getAuthorizedNavigation(authContext = {}, options = {}) {
  const currentCompany = authContext?.currentCompany || options?.currentCompany;
  const companyId = options?.companyId || currentCompany?.id || currentCompany?.code || null;
  const userRole = options?.userRole || authContext?.user?.role || 'employee';
  const isSuperAdminGlobal = Boolean(options?.isSuperAdminGlobal);

  return buildDynamicSidebar({
    authContext,
    userRole,
    companyId,
    isSuperAdminGlobal,
    canAccess: options?.canAccess,
    permissions: options?.permissions || authContext?.permissions,
  });
}
