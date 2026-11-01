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
function enrichNodeWithMetadata(item, defaultModuleCode) {
  const modCode = item.moduleCode || defaultModuleCode;
  const featCode = item.featureCode || null;
  const action = item.action || (Array.isArray(item.children) && item.children.length > 0 ? null : 'READ');
  const requiredPermission = item.requiredPermission || (featCode && action ? `${featCode}:${action}` : null);
  const enriched = {
    ...item,
    moduleCode: modCode,
    featureCode: featCode,
    action: action,
    requiredPermission: requiredPermission,
  };
  if (Array.isArray(item.children)) {
    enriched.children = item.children.map((child) => enrichNodeWithMetadata(child, modCode));
  }
  return enriched;
}

function getRawModuleNavigationBlueprint(moduleName, base, authContext) {
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
            { id: 'acc-ec', label: 'Expense Categories', path: `${base}/accounts/masters/expense-categories`, icon: Tag, featureCode: 'EXPENSE_CATEGORIES', action: 'READ' },
          ],
        },
        {
          id: 'acc-txn',
          label: 'Transactions',
          icon: TrendingUp,
          children: [
            { id: 'acc-txn-sales', label: 'Sales', path: `${base}/accounts/transactions/quotations`, icon: FileText, featureCode: 'SALES_INVOICES', action: 'READ' },
            { id: 'acc-txn-pur', label: 'Purchase', path: `${base}/accounts/transactions/purchase-requisitions`, icon: FileText, featureCode: 'PURCHASE_INVOICES', action: 'READ' },
            { id: 'acc-txn-exp', label: 'Expense', path: `${base}/accounts/transactions/expenses/requests`, icon: Receipt, featureCode: 'EXPENSES', action: 'READ' },
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
            { id: 'acc-tax-gst-master', label: 'GST Master', path: `${base}/accounts/tax/gst-master`, icon: Tag, featureCode: 'GST_MASTER', action: 'READ' },
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

    default: {
      const dynamicFeatures = (authContext?.features || []).filter((f) => {
        const mod = typeof f === 'object' ? normalizeModuleName(f.moduleName) : '';
        return mod === normalizeModuleName(moduleName) && f.active !== false;
      });
      if (dynamicFeatures.length > 0) {
        return dynamicFeatures.map((f) => {
          const featCode = typeof f === 'string' ? f : (f.featureCode || f.featureName || f.code);
          const featLabel = typeof f === 'object' && f.featureName ? f.featureName : featCode.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
          return {
            id: `${normalizeModuleName(moduleName).toLowerCase()}-${featCode.toLowerCase().replace(/_/g, '-')}`,
            label: featLabel,
            path: `${base}/${normalizeModuleName(moduleName).toLowerCase()}/${featCode.toLowerCase().replace(/_/g, '-')}`,
            icon: Package,
            featureCode: featCode,
            action: 'READ',
          };
        });
      }
      return [];
    }
  }
}

export function getModuleNavigationBlueprint(moduleName, base, normalizedContext) {
  const rawBlueprint = getRawModuleNavigationBlueprint(moduleName, base, normalizedContext);
  return (rawBlueprint || []).map((node) => enrichNodeWithMetadata(node, moduleName));
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
        let hasFeat = hasFeature(authContext, featureCode, moduleName) ||
          (item.id?.startsWith('workflow-') && (
            hasFeature(authContext, featureCode, CANONICAL_MODULES.WORKFLOW) ||
            hasFeature(authContext, featureCode)
          ));
      if (!hasFeat && (featureCode === 'SALES_INVOICES' || featureCode === 'QUOTATIONS')) {
        hasFeat = hasFeature(authContext, 'SALES_INVOICES', moduleName) ||
          hasFeature(authContext, 'QUOTATIONS', moduleName) ||
          hasFeature(authContext, 'SALES', moduleName) ||
          hasFeature(authContext, 'SALES_ORDERS', moduleName);
      }
      if (!hasFeat && (featureCode === 'PURCHASE_INVOICES' || featureCode === 'PURCHASE_REQUISITIONS')) {
        hasFeat = hasFeature(authContext, 'PURCHASE_INVOICES', moduleName) ||
          hasFeature(authContext, 'PURCHASE_REQUISITIONS', moduleName) ||
          hasFeature(authContext, 'PURCHASE_REQUESTS', moduleName) ||
          hasFeature(authContext, 'PURCHASE', moduleName) ||
          hasFeature(authContext, 'PURCHASE_ORDERS', moduleName);
      }
      if (!hasFeat && (featureCode === 'EXPENSES' || featureCode === 'EXPENSE_REQUESTS')) {
        hasFeat = hasFeature(authContext, 'EXPENSES', moduleName) ||
          hasFeature(authContext, 'EXPENSE_REQUESTS', moduleName) ||
          hasFeature(authContext, 'EXPENSE', moduleName);
      }
      if (!hasFeat) return null;
    }

    // B) Permission check: user MUST have explicit or wildcard permission for this action
    // "Follow the application's established permission semantics. Do not assume that WRITE or DELETE implies READ."
    // "A user missing PRODUCTS:READ cannot see the Products menu item."
    let hasPerm = checkHasPermission(authContext, featureCode, action, moduleName) ||
      (item.id?.startsWith('workflow-') && (
        checkHasPermission(authContext, featureCode, action, CANONICAL_MODULES.WORKFLOW) ||
        checkHasPermission(authContext, featureCode, action)
      ));
    if (!hasPerm) {
        if (featureCode === 'SALES_INVOICES' || featureCode === 'QUOTATIONS') {
          hasPerm = checkHasPermission(authContext, 'SALES_INVOICES', action, moduleName) ||
            checkHasPermission(authContext, 'QUOTATIONS', action, moduleName) ||
            checkHasPermission(authContext, 'SALES', action, moduleName) ||
            checkHasPermission(authContext, 'SALES_ORDERS', action, moduleName);
        } else if (featureCode === 'PURCHASE_INVOICES' || featureCode === 'PURCHASE_REQUISITIONS') {
          hasPerm = checkHasPermission(authContext, 'PURCHASE_INVOICES', action, moduleName) ||
            checkHasPermission(authContext, 'PURCHASE_REQUISITIONS', action, moduleName) ||
            checkHasPermission(authContext, 'PURCHASE_REQUESTS', action, moduleName) ||
            checkHasPermission(authContext, 'PURCHASE', action, moduleName) ||
            checkHasPermission(authContext, 'PURCHASE_ORDERS', action, moduleName);
        } else if (featureCode === 'EXPENSES' || featureCode === 'EXPENSE_REQUESTS') {
          hasPerm = checkHasPermission(authContext, 'EXPENSES', action, moduleName) ||
            checkHasPermission(authContext, 'EXPENSE_REQUESTS', action, moduleName) ||
            checkHasPermission(authContext, 'EXPENSE', action, moduleName);
        } else if (featureCode === 'EXPENSE_CATEGORIES') {
          hasPerm = checkHasPermission(authContext, 'EXPENSES', action, moduleName);
        } else if (featureCode === 'GST_STATE_MASTER' || featureCode === 'GST_REGISTRATIONS') {
          hasPerm = checkHasPermission(authContext, 'GST_MASTER', action, moduleName);
        } else if (featureCode === 'ORDERS') {
          hasPerm = checkHasPermission(authContext, 'SALES_ORDERS', action, moduleName);
        } else if (featureCode === 'SALES_ORDERS') {
          hasPerm = checkHasPermission(authContext, 'ORDERS', action, moduleName);
        } else if (featureCode === 'UNIT_OF_MEASURES') {
          hasPerm = checkHasPermission(authContext, 'PRODUCT_UOMS', action, moduleName);
        } else if (featureCode === 'PRODUCT_UOMS') {
          hasPerm = checkHasPermission(authContext, 'UNIT_OF_MEASURES', action, moduleName);
        } else if (featureCode === 'PURCHASE_REQUESTS') {
          hasPerm = checkHasPermission(authContext, 'PURCHASE_REQUISITIONS', action, moduleName);
        } else if (featureCode === 'PURCHASE_REQUISITIONS') {
          hasPerm = checkHasPermission(authContext, 'PURCHASE_REQUESTS', action, moduleName);
        } else if (featureCode === 'WORKFLOW_TASKS' || item.id === 'workflow-approval-requests') {
          hasPerm = checkHasPermission(authContext, 'WORKFLOW_TASKS', action, CANONICAL_MODULES.WORKFLOW) ||
            checkHasPermission(authContext, 'APPROVAL_REQUESTS', action, CANONICAL_MODULES.WORKFLOW) ||
            checkHasPermission(authContext, 'APPROVALS', action, CANONICAL_MODULES.WORKFLOW) ||
            checkHasPermission(authContext, 'WORKFLOW_TASKS', 'APPROVE', CANONICAL_MODULES.WORKFLOW) ||
            checkHasPermission(authContext, 'APPROVAL_REQUESTS', 'APPROVE', CANONICAL_MODULES.WORKFLOW) ||
            checkHasPermission(authContext, 'WORKFLOW_APPROVE', 'APPROVE', CANONICAL_MODULES.WORKFLOW);
        } else if (featureCode === 'WORKFLOW_DEFINITIONS' || item.id === 'workflow-approvals') {
          hasPerm = checkHasPermission(authContext, 'WORKFLOW_DEFINITIONS', action, CANONICAL_MODULES.WORKFLOW) ||
            checkHasPermission(authContext, 'WORKFLOW', action, CANONICAL_MODULES.WORKFLOW) ||
            checkHasPermission(authContext, 'WORKFLOW_APPROVALS', action, CANONICAL_MODULES.WORKFLOW) ||
            checkHasPermission(authContext, 'WORKFLOW_VIEW', 'READ', CANONICAL_MODULES.WORKFLOW);
        } else if (moduleName === CANONICAL_MODULES.SSO && (featureCode === 'USER_MANAGEMENT' || featureCode === 'ROLE_MANAGEMENT')) {
          const shortCode = featureCode === 'USER_MANAGEMENT' ? 'USER' : 'ROLE';
          hasPerm = checkHasPermission(authContext, shortCode, action, moduleName);
        }
      }

      if (!hasPerm) {
        return null;
      }
    } else {
      // No specific featureCode on leaf: check parent module read access
      const hasModRead = checkHasPermission(authContext, moduleName, 'READ', moduleName) ||
        checkHasPermission(authContext, 'ALL', 'READ') ||
        checkHasPermission(authContext, 'ALL_MODULES', 'READ');
      if (!hasModRead) {
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

      const meta = MODULE_UI_METADATA[moduleName] || {
        id: moduleName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        label: moduleName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        icon: Layers,
        defaultPath: (b) => `${b}/${moduleName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      };

      const blueprint = getModuleNavigationBlueprint(moduleName, base, normalizedContext);
      if (!blueprint || blueprint.length === 0) continue;

      const filteredChildren = blueprint
        .map((item) => filterNavigationNode(item, normalizedContext, moduleName, canAccess))
        .filter(Boolean);

      // "Do not show empty parent menus after filtering."
      // If a module has no authorized child navigation items, omit the entire module.
      if (filteredChildren.length === 0) {
        continue;
      }

      // If the only surviving child is the generic root dashboard and user has no explicit DASHBOARD permission,
      // the parent module must not appear because all its children/features are inaccessible (Rule 4).
      const isOnlyRootDashboard = filteredChildren.length === 1 &&
        (filteredChildren[0].id === 'admin-dashboard' || filteredChildren[0].id === 'acc-dash' || filteredChildren[0].id === 'inv-dashboard' || filteredChildren[0].id === 'crm-dashboard');
      if (isOnlyRootDashboard) {
        const hasExplicitDash = checkHasPermission(normalizedContext, 'DASHBOARD', 'READ') ||
          checkHasPermission(normalizedContext, `${moduleName}_DASHBOARD`, 'READ') ||
          checkHasPermission(normalizedContext, moduleName, 'READ') ||
          checkHasPermission(normalizedContext, 'ALL', 'READ') ||
          checkHasPermission(normalizedContext, 'ALL_MODULES', 'READ');
        if (!hasExplicitDash) {
          continue;
        }
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
