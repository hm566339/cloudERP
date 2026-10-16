import React, { useMemo, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Clock, ShoppingCart, Truck, Receipt, ClipboardList, FileSearch, CreditCard, BarChart3, Book, BookMarked, FileMinus, FilePlus, FileSpreadsheet, Scale, TrendingUp, Wallet, Users, ShieldAlert, Key, Layout, Shield } from 'lucide-react';
import { useRoutePath } from '../../hooks/useRoutePath';
import { documentFlowApi } from '../../api/common/documentFlow.api';

export const salesTabs = [
  {
    key: 'quotations',
    label: 'Quotations',
    icon: FileText,
    path: '/accounts/transactions/quotations'
  },
  {
    key: 'proforma',
    label: 'Proforma Invoices (PI)',
    icon: Clock,
    path: '/accounts/transactions/proforma-invoices'
  },
  {
    key: 'orders',
    label: 'Sales Orders',
    icon: ShoppingCart,
    path: '/accounts/transactions/sales-orders'
  },
  {
    key: 'delivery-challans',
    label: 'Delivery Challans',
    icon: Truck,
    path: '/accounts/transactions/delivery-challans'
  },
  {
    key: 'sales-invoices',
    label: 'Sales Invoices',
    icon: FileText,
    path: '/accounts/transactions/sales'
  },
  {
    key: 'receipt-vouchers',
    label: 'Receipt Vouchers',
    icon: Receipt,
    path: '/accounts/transactions/receipts'
  }
];

export const purchaseTabs = [
  {
    key: 'requisitions',
    label: 'Purchase Requisitions',
    icon: ClipboardList,
    path: '/accounts/transactions/purchase-requisitions',
    aliases: ['/purchase-requisitions', '/purchases/requisitions']
  },
  {
    key: 'rfqs',
    label: 'RFQs',
    icon: FileSearch,
    path: '/accounts/transactions/rfqs',
    aliases: ['/rfqs', '/purchases/rfqs']
  },
  {
    key: 'supplier-quotes',
    label: 'Supplier Quotes',
    icon: FileText,
    path: '/accounts/transactions/purchase-quotations',
    aliases: ['/supplier-quotes', '/supplier-quotations', '/purchases/quotations', '/purchases/supplier-quotations']
  },
  {
    key: 'purchase-orders',
    label: 'Purchase Orders',
    icon: ShoppingCart,
    path: '/accounts/transactions/purchase-orders',
    aliases: ['/purchase-orders', '/purchases/purchase-orders', '/purchases/orders']
  },
  {
    key: 'goods-receipts',
    label: 'Goods Receipts',
    icon: Truck,
    path: '/accounts/transactions/goods-receipts',
    aliases: ['/goods-receipts', '/purchases/goods-receipts']
  },
  {
    key: 'purchase-invoices',
    label: 'Purchase Invoices',
    icon: Receipt,
    path: '/accounts/transactions/purchase',
    aliases: ['/purchase-invoices', '/purchases/invoices']
  },
  {
    key: 'payments',
    label: 'Payments',
    icon: CreditCard,
    path: '/accounts/transactions/payments',
    aliases: ['/payments', '/purchases/payments']
  }
];

export const expenseTabs = [
  {
    key: 'requests',
    label: 'Expense Requests',
    icon: ClipboardList,
    path: '/accounts/transactions/expenses/requests',
    aliases: [
      '/accounts/transactions/expenses/requests',
      '/accounts/transactions/expense-requests',
      '/transactions/expense-requests',
      '/expense-requests',
      '/finance/expenses/requests'
    ]
  },
  {
    key: 'expenses',
    label: 'Expenses',
    icon: Receipt,
    path: '/accounts/transactions/expenses/expenses',
    aliases: [
      '/accounts/transactions/expenses',
      '/accounts/transactions/expenses/expenses',
      '/accounts/transactions/expenses/expense-claims',
      '/transactions/expenses',
      '/finance/expenses',
      '/finance/expenses/expenses'
    ]
  },
  {
    key: 'reimbursements',
    label: 'Reimbursements',
    icon: CreditCard,
    path: '/accounts/transactions/expenses/reimbursements',
    aliases: [
      '/accounts/transactions/expenses/reimbursements',
      '/accounts/transactions/reimbursements',
      '/transactions/reimbursements',
      '/reimbursements',
      '/finance/expenses/reimbursements'
    ]
  },
  {
    key: 'reports',
    label: 'Reports',
    icon: BarChart3,
    path: '/accounts/transactions/expenses/reports',
    aliases: [
      '/accounts/transactions/expenses/reports',
      '/accounts/transactions/expense-reports',
      '/transactions/expense-reports',
      '/expense-reports',
      '/finance/expenses/reports',
      '/finance/expenses/analytics',
      '/accounts/transactions/expenses/analytics'
    ]
  }
];

export const accountingTabs = [
  {
    key: 'journal',
    label: 'Journal Entries',
    icon: Book,
    path: '/accounts/transactions/journal',
    aliases: [
      '/accounts/transactions/journal',
      '/transactions/journal',
      '/journal',
      '/finance/journal'
    ]
  },
  {
    key: 'journal-lines',
    label: 'GL Journal Lines',
    icon: FileSpreadsheet,
    path: '/accounts/transactions/journal-lines',
    aliases: [
      '/accounts/transactions/journal-lines',
      '/transactions/journal-lines',
      '/journal-lines',
      '/finance/journal-lines'
    ]
  },
  {
    key: 'credit-notes',
    label: 'Credit Notes',
    icon: FileMinus,
    path: '/accounts/transactions/credit-notes',
    aliases: [
      '/accounts/transactions/credit-notes',
      '/transactions/credit-notes',
      '/credit-notes',
      '/finance/credit-notes'
    ]
  },
  {
    key: 'debit-notes',
    label: 'Debit Notes',
    icon: FilePlus,
    path: '/accounts/transactions/debit-notes',
    aliases: [
      '/accounts/transactions/debit-notes',
      '/transactions/debit-notes',
      '/debit-notes',
      '/finance/debit-notes'
    ]
  },
  {
    key: 'general-ledger',
    label: 'General Ledger',
    icon: BookMarked,
    path: '/accounts/reports/ledger',
    aliases: [
      '/accounts/reports/ledger',
      '/reports/ledger',
      '/general-ledger',
      '/ledger',
      '/finance/ledger',
      '/finance/general-ledger'
    ]
  },
  {
    key: 'trial-balance',
    label: 'Trial Balance',
    icon: Scale,
    path: '/accounts/reports/trial-balance',
    aliases: [
      '/accounts/reports/trial-balance',
      '/reports/trial-balance',
      '/finance/reports/trial-balance',
      '/reports/tb'
    ]
  },
  {
    key: 'profit-loss',
    label: 'Profit & Loss',
    icon: TrendingUp,
    path: '/accounts/reports/profit-loss',
    aliases: [
      '/accounts/reports/profit-loss',
      '/reports/profit-loss',
      '/finance/reports/profit-loss'
    ]
  },
  {
    key: 'balance-sheet',
    label: 'Balance Sheet',
    icon: FileSpreadsheet,
    path: '/accounts/reports/balance-sheet',
    aliases: [
      '/accounts/reports/balance-sheet',
      '/reports/balance-sheet',
      '/finance/reports/balance-sheet'
    ]
  },
  {
    key: 'cash-flow',
    label: 'Cash Flow',
    icon: Wallet,
    path: '/accounts/reports/cash-flow',
    aliases: [
      '/accounts/reports/cash-flow',
      '/reports/cash-flow',
      '/finance/reports/cash-flow'
    ]
  }
];

export const securityTabs = [
  {
    key: 'security-overview',
    label: 'Security Settings',
    icon: Shield,
    path: '/settings/security'
  },
  {
    key: 'feature-permissions',
    label: 'Feature Permissions',
    icon: Layout,
    path: '/settings/security/features'
  },
  {
    key: 'user-permissions',
    label: 'User Permissions',
    icon: Key,
    path: '/settings/security/permissions'
  }
];

export const userTabs = [
  {
    key: 'users',
    label: 'Users',
    icon: Users,
    path: '/users',
    aliases: ['/super-admin/users', '/admin/users']
  },
  {
    key: 'roles',
    label: 'Roles',
    icon: ShieldAlert,
    path: '/roles',
    aliases: ['/super-admin/roles', '/admin/roles']
  },
  {
    key: 'portal-access',
    label: 'Feature Management',
    icon: Layout,
    path: '/portal-access',
    aliases: ['/super-admin/portal-access', '/admin/portal-access', '/portal-access', '/settings/security/features', '/security/features', '/features']
  },
  {
    key: 'role-permissions',
    label: 'Role & Permissions',
    icon: Key,
    path: '/settings/security/roles',
    aliases: ['/security/roles']
  },
  {
    key: 'user-permissions',
    label: 'User Permissions',
    icon: Users,
    path: '/settings/security/users',
    aliases: ['/security/users', '/settings/security/permissions', '/security/permissions']
  }
];

const DOC_TYPE_TO_KEY = {
  QUOTATION: 'quotations',
  PROFORMA_INVOICE: 'proforma',
  SALES_ORDER: 'orders',
  DELIVERY_CHALLAN: 'delivery-challans',
  SALES_INVOICE: 'sales-invoices',
  RECEIPT_VOUCHER: 'receipt-vouchers',
  PURCHASE_REQUISITION: 'requisitions',
  RFQ: 'rfqs',
  SUPPLIER_QUOTATION: 'supplier-quotes',
  PURCHASE_ORDER: 'purchase-orders',
  GOODS_RECEIPT: 'goods-receipts',
  AP_INVOICE: 'purchase-invoices',
  AP_PAYMENT: 'payments',
  PAYMENT_VOUCHER: 'payments',
  CREDIT_NOTE: 'credit-notes',
  DEBIT_NOTE: 'debit-notes',
  JOURNAL_ENTRY: 'journal',
  EXPENSE_REQUEST: 'requests',
  EXPENSE: 'expenses'
};

function detectModuleFromTabs(tabs) {
  if (!Array.isArray(tabs) || tabs.length === 0) return null;
  const keys = new Set(tabs.map((t) => (t.key || '').toLowerCase()));
  if (keys.has('quotations') || keys.has('orders') || keys.has('delivery-challans')) return 'SALES';
  if (keys.has('requisitions') || keys.has('rfqs') || keys.has('purchase-orders')) return 'PURCHASE';
  if (keys.has('requests') || keys.has('reimbursements')) return 'EXPENSES';
  if (keys.has('journal') || keys.has('credit-notes') || keys.has('debit-notes')) return 'ACCOUNT';
  return null;
}

export default function ModuleTabs({ tabs = salesTabs, module, activeKey, activeTab, onTabChange }) {
  const location = useLocation();
  const { buildPath } = useRoutePath();

  const detectedModule = module || detectModuleFromTabs(tabs);
  const [dynamicTabs, setDynamicTabs] = useState(null);

  useEffect(() => {
    if (!detectedModule) return;
    let isMounted = true;
    documentFlowApi.getTabs(detectedModule)
      .then((data) => {
        if (!isMounted) return;
        const flowTabs = data?.tabs || [];
        if (flowTabs.length > 0) {
          const tabMap = new Map();
          tabs.forEach((t) => {
            tabMap.set(t.key, t);
          });

          const ordered = [];
          flowTabs.forEach((item) => {
            if (item.isActive === false) return;
            const mappedKey = DOC_TYPE_TO_KEY[item.documentType] || item.key;
            const existing = tabMap.get(mappedKey);
            if (existing) {
              ordered.push({
                ...existing,
                label: item.label || existing.label,
                orderIndex: item.orderIndex
              });
              tabMap.delete(mappedKey);
            }
          });

          // Append any non-document tabs that remain in tabMap (e.g. analytical/reporting tabs)
          tabMap.forEach((v) => ordered.push(v));

          if (ordered.length > 0) {
            setDynamicTabs(ordered);
          }
        }
      })
      .catch(() => {
        // Fallback gracefully to default static tabs on network error or missing config
      });
    return () => {
      isMounted = false;
    };
  }, [detectedModule, tabs]);

  const effectiveTabs = dynamicTabs || tabs;

  const currentPath = (location.pathname || '').replace(/\/+$/, '').toLowerCase();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const queryTab = searchParams.get('tab')?.toLowerCase();

  // Strip company prefix for clean normalized comparison: /company/[id]/path -> /path
  const stripCompanyPrefix = (p) => (p ? p.replace(/^\/company\/[^/]+/, '') : '');
  const cleanCurrentPath = stripCompanyPrefix(currentPath);

  // Compute the single best active tab key
  const activeItemKey = useMemo(() => {
    // 1. Explicit prop passed
    const explicit = activeKey || activeTab;
    if (explicit) {
      const match = effectiveTabs.find((t) => (t.key || t.label)?.toLowerCase() === explicit.toLowerCase());
      if (match) return match.key || match.label;
    }

    // 2. Query param matching (e.g. ?tab=reports)
    if (queryTab) {
      const match = effectiveTabs.find((t) => t.key?.toLowerCase() === queryTab || t.label?.toLowerCase() === queryTab);
      if (match) return match.key || match.label;
    }

    // 3. Path segment / route matching with specific scoring
    let bestKey = null;
    let highestScore = -1;

    effectiveTabs.forEach((item) => {
      const key = item.key || item.label;
      const targetPath = buildPath(item.path);
      const allPaths = [
        item.path,
        targetPath,
        stripCompanyPrefix(item.path),
        stripCompanyPrefix(targetPath),
        ...(item.aliases || []),
        ...(item.aliases ? item.aliases.map((a) => buildPath(a)) : []),
        ...(item.aliases ? item.aliases.map((a) => stripCompanyPrefix(a)) : [])
      ].filter(Boolean);

      allPaths.forEach((p) => {
        const norm = p.replace(/\/+$/, '').toLowerCase();
        if (!norm) return;

        // Exact match
        if (currentPath === norm || cleanCurrentPath === norm) {
          const score = 1000 + norm.length;
          if (score > highestScore) {
            highestScore = score;
            bestKey = key;
          }
        }
        // Sub-path match: currentPath starts with norm + '/'
        else if (currentPath.startsWith(`${norm}/`) || cleanCurrentPath.startsWith(`${norm}/`)) {
          const isGenericParent =
            norm === '/accounts/transactions/expenses' ||
            norm.endsWith('/transactions/expenses') ||
            norm === '/finance/expenses' ||
            norm.endsWith('/finance/expenses');
          const score = isGenericParent ? 10 : 200 + norm.length;
          if (score > highestScore) {
            highestScore = score;
            bestKey = key;
          }
        }
        // Tab key segment match
        else if (
          item.key &&
          (cleanCurrentPath.endsWith(`/${item.key.toLowerCase()}`) ||
            cleanCurrentPath.includes(`/${item.key.toLowerCase()}/`))
        ) {
          const score = 500 + item.key.length;
          if (score > highestScore) {
            highestScore = score;
            bestKey = key;
          }
        }
      });
    });

    // 4. Default fallback: if in expenses module but on base route, default to first tab (requests)
    if (!bestKey && effectiveTabs.length > 0 && cleanCurrentPath.includes('expenses')) {
      return effectiveTabs[0].key || effectiveTabs[0].label;
    }

    return bestKey;
  }, [effectiveTabs, currentPath, cleanCurrentPath, queryTab, activeKey, activeTab, buildPath]);

  return (
    <div className="bg-white/80 backdrop-blur-md border-b border-zinc-200 px-6 py-2.5 overflow-x-auto hide-scrollbar shrink-0 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-1 min-w-max">
        {effectiveTabs.map((item) => {
          const Icon = item.icon;
          const targetPath = buildPath(item.path);
          const itemKey = item.key || item.label;
          const isActive = itemKey === activeItemKey;

          const tabClassName = `flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10.4px] font-semibold transition-all duration-200 ${
            isActive
              ? 'bg-zinc-900 text-white shadow-xs border border-zinc-900'
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 border border-transparent'
          }`;

          if (onTabChange) {
            return (
              <button
                key={itemKey}
                type="button"
                onClick={() => onTabChange(itemKey)}
                className={tabClassName}
                aria-current={isActive ? 'page' : undefined}
              >
                {Icon && <Icon size={14} className={isActive ? 'text-white' : 'text-zinc-400'} />}
                {item.label}
              </button>
            );
          }

          return (
            <Link
              key={itemKey}
              to={targetPath}
              className={tabClassName}
              aria-current={isActive ? 'page' : undefined}
            >
              {Icon && <Icon size={14} className={isActive ? 'text-white' : 'text-zinc-400'} />}
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
