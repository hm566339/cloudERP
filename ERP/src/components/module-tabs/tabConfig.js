import {
  FileText, Clock, ShoppingCart, Truck, Receipt, ClipboardList, FileSearch,
  CreditCard, BarChart3, Book, BookMarked, FileMinus, FilePlus, FileSpreadsheet,
  Scale, TrendingUp, Wallet, Users, ShieldAlert, Key, Layout, Shield, Download,
  Globe, Megaphone, PieChart, CheckSquare, Calendar
} from 'lucide-react';

export const salesTabs = [
  {
    key: 'quotations',
    label: 'Quotations',
    icon: FileText,
    path: '/accounts/transactions/quotations',
    aliases: ['/quotations', '/sales-crm/quotations', '/accounts/transactions/sales/quotations']
  },
  {
    key: 'proforma',
    label: 'Proforma Invoices (PI)',
    icon: Clock,
    path: '/accounts/transactions/proforma-invoices',
    aliases: ['/proforma-invoices', '/sales-crm/proforma', '/accounts/transactions/sales/proforma']
  },
  {
    key: 'orders',
    label: 'Sales Orders',
    icon: ShoppingCart,
    path: '/accounts/transactions/sales-orders',
    aliases: ['/sales-orders', '/orders', '/sales-crm/orders', '/accounts/transactions/sales/orders']
  },
  {
    key: 'delivery-challans',
    label: 'Delivery Challans',
    icon: Truck,
    path: '/accounts/transactions/delivery-challans',
    aliases: ['/delivery-challans', '/challans', '/sales-crm/challans', '/accounts/transactions/sales/challans']
  },
  {
    key: 'sales-invoices',
    label: 'Sales Invoices',
    icon: FileText,
    path: '/accounts/transactions/sales',
    aliases: ['/accounts/sales/invoices', '/sales/invoices', '/sales-crm/invoices', '/accounts/transactions/sales-invoices']
  },
  {
    key: 'receipt-vouchers',
    label: 'Receipt Vouchers',
    icon: Receipt,
    path: '/accounts/transactions/receipts',
    aliases: ['/receipt-vouchers', '/receipts', '/accounts/transactions/receipt-vouchers']
  }
];

export const purchaseTabs = [
  {
    key: 'requisitions',
    label: 'Purchase Requisitions',
    icon: ClipboardList,
    path: '/accounts/transactions/purchase-requisitions',
    aliases: ['/purchase-requisitions', '/purchases/requisitions', '/transactions/purchase-requisitions']
  },
  {
    key: 'rfqs',
    label: 'RFQs',
    icon: FileSearch,
    path: '/accounts/transactions/rfqs',
    aliases: ['/rfqs', '/purchases/rfqs', '/transactions/rfqs']
  },
  {
    key: 'supplier-quotes',
    label: 'Supplier Quotes',
    icon: FileText,
    path: '/accounts/transactions/purchase-quotations',
    aliases: ['/supplier-quotes', '/supplier-quotations', '/purchases/quotations', '/purchases/supplier-quotations', '/transactions/purchase-quotations', '/transactions/supplier-quotes', '/accounts/transactions/supplier-quotes']
  },
  {
    key: 'purchase-orders',
    label: 'Purchase Orders',
    icon: ShoppingCart,
    path: '/accounts/transactions/purchase-orders',
    aliases: ['/purchase-orders', '/purchases/purchase-orders', '/purchases/orders', '/transactions/purchase-orders']
  },
  {
    key: 'goods-receipts',
    label: 'Goods Receipts',
    icon: Truck,
    path: '/accounts/transactions/goods-receipts',
    aliases: ['/goods-receipts', '/purchases/goods-receipts', '/transactions/goods-receipts']
  },
  {
    key: 'purchase-invoices',
    label: 'Purchase Invoices',
    icon: Receipt,
    path: '/accounts/transactions/purchase',
    aliases: ['/purchase-invoices', '/purchases/invoices', '/accounts/transactions/purchase-invoices', '/transactions/purchase', '/transactions/purchase-invoices', '/accounts/purchase/invoices']
  },
  {
    key: 'payments',
    label: 'Payments',
    icon: CreditCard,
    path: '/accounts/transactions/payments',
    aliases: ['/payments', '/purchases/payments', '/transactions/payments']
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
      '/finance/expenses/requests',
      '/accounts/transactions/expenses',
      '/transactions/expenses',
      '/finance/expenses'
    ]
  },
  {
    key: 'expenses',
    label: 'Expenses',
    icon: Receipt,
    path: '/accounts/transactions/expenses/expenses',
    aliases: [
      '/accounts/transactions/expenses/expenses',
      '/accounts/transactions/expenses/expense-claims',
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

export const crmIntegrationsCampaignsTabs = [
  {
    key: 'integrations',
    label: 'Integrations',
    icon: Globe,
    path: '/sales-crm/integrations',
    aliases: [
      '/sales-crm/integrations',
      '/crm/integrations',
      '/integrations'
    ]
  },
  {
    key: 'campaigns',
    label: 'Campaigns',
    icon: Megaphone,
    path: '/sales-crm/campaigns',
    aliases: [
      '/sales-crm/campaigns',
      '/crm/campaigns',
      '/campaigns'
    ]
  },
  {
    key: 'attribution',
    label: 'Attribution',
    icon: PieChart,
    path: '/sales-crm/attribution',
    aliases: [
      '/sales-crm/attribution',
      '/crm/attribution',
      '/attribution'
    ]
  }
];

export const crmTasksActivitiesTabs = [
  {
    key: 'tasks',
    label: 'Tasks',
    icon: CheckSquare,
    path: '/sales-crm/tasks',
    aliases: [
      '/sales-crm/tasks',
      '/crm/tasks',
      '/tasks'
    ]
  },
  {
    key: 'activities',
    label: 'Activities',
    icon: Calendar,
    path: '/sales-crm/activities',
    aliases: [
      '/sales-crm/activities',
      '/crm/activities',
      '/activities'
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
  }
];

export const gstTabs = [
  {
    key: 'gstr1',
    label: 'GSTR-1',
    icon: FileText,
    path: '/accounts/reports/gst/gstr1',
    aliases: ['/accounts/reports/gst/gstr1', '/reports/gst/gstr1', '/gst-reports/gstr1']
  },
  {
    key: 'gstr3b',
    label: 'GSTR-3B',
    icon: FileSpreadsheet,
    path: '/accounts/reports/gst/gstr3b',
    aliases: ['/accounts/reports/gst/gstr3b', '/reports/gst/gstr3b', '/gst-reports/gstr3b']
  },
  {
    key: 'hsn-summary',
    label: 'HSN Summary',
    icon: BookMarked,
    path: '/accounts/reports/gst/hsn-summary',
    aliases: ['/accounts/reports/gst/hsn-summary', '/reports/gst/hsn-summary', '/gst-reports/hsn-summary']
  },
  {
    key: 'itc',
    label: 'ITC Report',
    icon: TrendingUp,
    path: '/accounts/reports/gst/itc',
    aliases: ['/accounts/reports/gst/itc', '/reports/gst/itc', '/gst-reports/itc']
  },
  {
    key: 'gstr2b',
    label: 'GSTR-2B',
    icon: Scale,
    path: '/accounts/reports/gst/gstr2b',
    aliases: ['/accounts/reports/gst/gstr2b', '/reports/gst/gstr2b', '/gst-reports/gstr2b']
  },
  {
    key: 'export',
    label: 'Export Returns',
    icon: Download,
    path: '/accounts/reports/gst/export',
    aliases: ['/accounts/reports/gst/export', '/reports/gst/export', '/gst-reports/export']
  }
];

export const DOC_TYPE_TO_KEY = {
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

export function detectModuleFromTabs(tabs) {
  if (!Array.isArray(tabs) || tabs.length === 0) return null;
  const keys = new Set(tabs.map((t) => (t.key || '').toLowerCase()));
  if (keys.has('quotations') || keys.has('orders') || keys.has('delivery-challans')) return 'SALES';
  if (keys.has('requisitions') || keys.has('rfqs') || keys.has('purchase-orders')) return 'PURCHASE';
  if (keys.has('requests') || keys.has('reimbursements')) return 'EXPENSES';
  if (keys.has('journal') || keys.has('credit-notes') || keys.has('debit-notes')) return 'ACCOUNT';
  if (keys.has('gstr1') || keys.has('gstr3b') || keys.has('hsn-summary') || keys.has('itc')) return 'GST_REPORTS';
  return null;
}

