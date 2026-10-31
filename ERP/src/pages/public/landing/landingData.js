import {
  Building2,
  Box,
  ShoppingCart,
  Briefcase,
  Banknote,
  Shield,
  ShieldCheck,
  BarChart3,
  Key,
  Lock,
  GitBranch,
  Truck,
  FileCheck2,
  CheckCircle2,
  Receipt,
  Users2,
  Boxes,
  Database,
  ArrowRightLeft,
  Sparkles,
  ClipboardList,
  Factory,
  Store,
  Wrench,
  CreditCard,
  FileSpreadsheet,
  Printer,
  Calculator,
  Clock,
  Coins,
  TrendingUp,
  Layers,
  Cpu,
  FileText
} from 'lucide-react';

// ==============================================================================
// 1. Comprehensive ERP Modules based on actual codebase capabilities
// ==============================================================================
export const ERP_MODULES = [
  {
    id: 'finance',
    name: 'Finance & Core Accounting',
    shortName: 'Accounts',
    description: 'Double-entry general ledger, customizable chart of accounts, journal entries, bank reconciliations, cash flow, and financial year closing.',
    icon: Banknote,
    badge: 'Core Accounting',
    highlightMetric: '100% Balanced Ledger',
    features: [
      'Multi-tier Chart of Accounts (Assets, Liabilities, Equity, P&L)',
      'General Ledger & Journal Vouchers (JVs) with auto-balance rules',
      'Bank Reconciliation, Cash Book & Payment Vouchers',
      'Real-time Trial Balance, Profit & Loss, and Balance Sheet'
    ],
  },
  {
    id: 'sales',
    name: 'Sales & Revenue Operations',
    shortName: 'Sales',
    description: 'Streamline the full revenue cycle: customer inquiries, quote approvals, proforma invoices, sales orders, delivery challans, and GST tax invoices.',
    icon: ShoppingCart,
    badge: 'Revenue Engine',
    highlightMetric: 'Zero Re-keying',
    features: [
      'Quotation to Sales Order conversion with 1-click generation',
      'Multi-warehouse Delivery Challan & Dispatch confirmation',
      'GST Tax Invoicing with HSN/SAC breakdown & payment terms',
      'Customer Outstanding Ledger, Credit Limits & Credit Notes'
    ],
  },
  {
    id: 'purchase',
    name: 'Procurement & Vendor Management',
    shortName: 'Procurement',
    description: 'Automate procure-to-pay pipelines: internal purchase requisitions, supplier RFQ tenders, purchase orders, 3-way matching, and AP bills.',
    icon: Briefcase,
    badge: 'Procurement',
    highlightMetric: '3-Way Matching',
    features: [
      'Purchase Requisitions (PR) with department approval rules',
      'RFQ Supplier Bidding, Price Quotation & Rate Comparison',
      'Binding Purchase Orders (PO) & Goods Receipts (GRN)',
      'Vendor AP Invoices, Tax Deduction at Source & Debit Notes'
    ],
  },
  {
    id: 'inventory',
    name: 'Multi-Warehouse Inventory',
    shortName: 'Inventory',
    description: 'Real-time stock tracking across regional warehouses and bin locations, batch/lot tracking, serial numbers, transfer orders, and FIFO valuation.',
    icon: Box,
    badge: 'Supply Chain',
    highlightMetric: 'Live Stock Visibility',
    features: [
      'Multi-Warehouse & Bin Location Visibility across all plants',
      'Batch Number & Serial Number Tracking with expiry controls',
      'Inter-Warehouse Stock Transfer Orders with in-transit tracking',
      'Automated Low Stock Alerts & FIFO Cost Layer Valuation'
    ],
  },
  {
    id: 'gst',
    name: 'Statutory GST & Tax Compliance',
    shortName: 'GST Compliance',
    description: 'Automated GST computation (CGST, SGST, IGST) based on place of supply, tax slab masters, HSN code lookups, and statutory return filing.',
    icon: ShieldCheck,
    badge: 'Tax Compliance',
    highlightMetric: 'India GST Ready',
    features: [
      'Automated GSTR-1 Sales Invoices outward supply summary',
      'GSTR-3B Return Tax Liability & Input Tax Credit calculation',
      'GSTR-2B Input Tax Credit (ITC) reconciliation log',
      'Central HSN / SAC Code Master & State Tax Slabs'
    ],
  },
  {
    id: 'workflows',
    name: 'Workflows & Approval Hierarchy',
    shortName: 'Governance',
    description: 'Enterprise governance with multi-level approval hierarchies for high-value purchase orders, sales quotations, credit notes, and budget lines.',
    icon: GitBranch,
    badge: 'Governance',
    highlightMetric: 'Immutable Audit Trail',
    features: [
      'Configurable Multi-Stage Approval Rules by document value',
      'Role-based Task Assignment & Live Approvals Inbox',
      'Document Rejection Reason Tracking & Return for revision',
      'Immutable Audit Trail capturing user, timestamp & previous state'
    ],
  },
];

// ==============================================================================
// 2. Connected End-to-End Business Lifecycles
// ==============================================================================
export const BUSINESS_PIPELINES = [
  {
    id: 'o2c',
    title: 'Order-to-Cash Cycle (Sales)',
    subtitle: 'From Customer Inquiry to Bank Settlement',
    description: 'Automated document transitions with zero manual re-entry from quotation approval through delivery dispatch and bank reconciliation.',
    steps: [
      {
        name: 'Quotation',
        code: 'QT',
        icon: ClipboardList,
        detail: 'Sales quotation drafted with customer discount and approved by Sales Manager.',
        metric: 'Price Verified'
      },
      {
        name: 'Sales Order',
        code: 'SO',
        icon: ShoppingCart,
        detail: 'Binding sales order created; allocated inventory reserved automatically in warehouse.',
        metric: 'Stock Reserved'
      },
      {
        name: 'Delivery Challan',
        code: 'DC',
        icon: Truck,
        detail: 'Physical stock picked from bin location, dispatched with packing slip & delivery challan.',
        metric: 'Dispatched'
      },
      {
        name: 'Tax Invoice',
        code: 'INV',
        icon: Receipt,
        detail: 'Statutory GST tax invoice generated; automatic journal entry posted to Accounts Receivable.',
        metric: 'Posted to GL'
      },
      {
        name: 'Receipt Voucher',
        code: 'RV',
        icon: Banknote,
        detail: 'Customer payment recorded via bank transfer/cheque; customer ledger updated in real time.',
        metric: 'Settled'
      },
    ]
  },
  {
    id: 'p2p',
    title: 'Procure-to-Pay Cycle (Purchasing)',
    subtitle: 'From Internal Requisition to Vendor Payment',
    description: 'Audited 3-way matching seamlessly connecting internal purchase requisitions, supplier quotes, purchase orders, goods receipts, and vendor payouts.',
    steps: [
      {
        name: 'Requisition (PR)',
        code: 'PR',
        icon: FileCheck2,
        detail: 'Internal departmental purchase request submitted with required date and budget line.',
        metric: 'Budget Checked'
      },
      {
        name: 'RFQ & Bidding',
        code: 'RFQ',
        icon: ArrowRightLeft,
        detail: 'Request for Quotation broadcast to multiple vendors; compare rates side-by-side.',
        metric: 'Best Bid Selected'
      },
      {
        name: 'Purchase Order',
        code: 'PO',
        icon: Briefcase,
        detail: 'Formal PO authorized by Purchase Head and dispatched electronically to vendor.',
        metric: 'PO Dispatched'
      },
      {
        name: 'Goods Receipt (GRN)',
        code: 'GRN',
        icon: Box,
        detail: 'Warehouse receives shipment, conducts quality inspection & logs inward stock journal.',
        metric: 'Stock Inwarded'
      },
      {
        name: 'Payment Voucher',
        code: 'PV',
        icon: Banknote,
        detail: 'Vendor AP bill matched against PO and GRN; payment voucher posted to General Ledger.',
        metric: '3-Way Cleared'
      },
    ]
  }
];

// ==============================================================================
// 3. Multi-Company & Enterprise Security Architecture
// ==============================================================================
export const SECURITY_FEATURES = [
  {
    title: 'Organization Tenant Segregation',
    description: 'Complete database and architectural tenant boundary isolation preventing cross-organization leakage.',
    icon: Building2,
    tag: 'Data Isolation'
  },
  {
    title: 'Company Scoped Authorization',
    description: 'Server-side validated company scoping on every API request prevents unauthorized cross-subsidiary queries.',
    icon: Shield,
    tag: 'Strict Boundary'
  },
  {
    title: 'Granular RBAC & FBAC Policies',
    description: 'Fine-grained policy enforcement across Owners, Company Admins, Accountants, Sales, Purchase, and Warehouse staff.',
    icon: Key,
    tag: 'Role Security'
  },
  {
    title: 'Cryptographic SSO Authentication',
    description: 'HttpOnly secure cookies, single-flight token refresh queues, dynamic session timeouts, and 2FA support.',
    icon: Lock,
    tag: 'Enterprise SSO'
  },
];

// ==============================================================================
// 3b. Core Architectural Benefits
// ==============================================================================
export const BUSINESS_BENEFITS = [
  {
    title: 'Multi-Company Architecture',
    desc: 'Manage unlimited subsidiaries, branches, and sister organizations from a single centralized executive login.',
  },
  {
    title: 'Indian Statutory GST Engine',
    desc: 'Built-in place-of-supply tax logic, reverse charge mechanism (RCM), and export GST reports for instant filing.',
  },
  {
    title: 'Real-time General Ledger',
    desc: 'Automated journal posting from invoices, payments, and receipts ensures your Trial Balance is always balanced.',
  },
  {
    title: 'Multi-Warehouse Control',
    desc: 'Track live stock across regional plants and transit locations with batch expiration and serial tracking.',
  },
  {
    title: 'Multi-Level Approval Rules',
    desc: 'Ensure no high-value purchase order or quotation leaves your company without multi-step stakeholder sign-off.',
  },
  {
    title: 'Audited Financial Reports',
    desc: 'One-click generation of Trial Balance, Profit & Loss, Balance Sheet, Aging Receivables, and Cash Flow statements.',
  },
  {
    title: 'Role-Based Workspace Isolation',
    desc: 'Tailored views for Accountants, Warehouse Managers, Procurement Officers, and Sales Executives with no clutter.',
  },
  {
    title: 'Zero Software Installation',
    desc: '100% cloud-hosted SaaS accessible on any device with responsive layouts and subpath reverse-proxy support.',
  },
];

// ==============================================================================
// 4. Ground-Truth SaaS Pricing Plans (Matches SubscriptionPlanBootstrap.java)
// ==============================================================================
export const PRICING_PLANS = [
  {
    id: 'trial',
    code: '30_DAY_FREE_TRIAL',
    name: '30-Day Free Trial',
    badge: 'Most Popular for Evaluation',
    tagline: 'Full enterprise capabilities for evaluation with zero risk.',
    monthlyPrice: 0,
    annualPrice: 0,
    periodLabel: 'for 30 days',
    popular: true,
    limits: {
      companies: 'Up to 4 Companies',
      users: '10 Users per Company',
      storage: 'Standard Storage',
      support: 'Standard Community & Email'
    },
    features: [
      'All 6 Core Modules (Finance, Sales, Purchase, Inventory, GST, Workflows)',
      'Manage up to 4 Subsidiaries / Legal Entities',
      '10 Team Members per Company with RBAC',
      'Statutory Indian GST & GSTR-1/2B/3B reports',
      'Double-entry General Ledger & Vouchers',
      'Quotation, Sales Order & Invoicing cycle',
      'Requisitions, RFQs & PO 3-way matching',
      'Multi-warehouse inventory & batch tracking',
      'Export ledgers and reports to Excel & PDF',
      'Dedicated organization login portal slug'
    ],
    ctaText: 'Start 30-Day Free Trial',
    ctaLink: '/try-free',
    ctaVariant: 'primary'
  },
  {
    id: 'basic',
    code: 'BASIC',
    name: 'Basic Plan',
    badge: 'Solo Business',
    tagline: 'Essential financial accounting and ledger tools for small business.',
    monthlyPrice: 999,
    annualPrice: 849, // ~15% discount
    periodLabel: '/ month',
    popular: false,
    limits: {
      companies: '1 Legal Entity',
      users: 'Up to 5 Users',
      storage: '10 GB Cloud Storage',
      support: 'Standard Email Support'
    },
    features: [
      'Core Finance & General Ledger module',
      'Single company ledger management',
      'Up to 5 User accounts with standard roles',
      'Journal Vouchers, Cash & Bank Ledger',
      'Trial Balance, P&L, and Balance Sheet',
      'Basic GST invoice generation',
      'Standard data backups',
      'Community & email technical support'
    ],
    ctaText: 'Choose Basic',
    ctaLink: '/try-free',
    ctaVariant: 'secondary'
  },
  {
    id: 'pro',
    code: 'PRO',
    name: 'Pro Plan',
    badge: 'Growing SME',
    tagline: 'Complete operational suite for fast-growing multi-warehouse companies.',
    monthlyPrice: 2999,
    annualPrice: 2499,
    periodLabel: '/ month',
    popular: false,
    limits: {
      companies: 'Up to 5 Companies',
      users: '25 Users per Company',
      storage: '50 GB Cloud Storage',
      support: 'Priority Support (8hr SLA)'
    },
    features: [
      'Everything in Basic Plan, plus:',
      'All 6 Core Modules: Finance, Sales, Purchase, Inventory, GST, Workflows',
      'Manage up to 5 Companies / Subsidiaries',
      '25 Users per Company with Custom Role Matrices',
      'Multi-Warehouse Inventory with Bin Locations',
      'Full Procure-to-Pay & Order-to-Cash pipelines',
      'Multi-level Approval Workflows with Audit Trail',
      'GSTR-1, GSTR-2B, and GSTR-3B filing summaries',
      'Priority email & ticket support'
    ],
    ctaText: 'Choose Pro',
    ctaLink: '/try-free',
    ctaVariant: 'secondary'
  },
  {
    id: 'business',
    code: 'BUSINESS_PLAN',
    name: 'Enterprise Plan',
    badge: 'Holding Groups',
    tagline: 'High-scale multi-company ERP with dedicated holding hierarchy and manufacturing.',
    monthlyPrice: 19999,
    annualPrice: 16999,
    periodLabel: '/ year (Annual)',
    popular: false,
    limits: {
      companies: '10+ Companies (Expandable)',
      users: '50+ Users per Company',
      storage: 'Unlimited Storage',
      support: 'Dedicated Account Manager'
    },
    features: [
      'Everything in Pro Plan, plus:',
      '10+ Legal Entities with Consolidated Group Reporting',
      '50+ Users per Company with Enterprise RBAC',
      'Manufacturing Module (BOM, Work Orders, Operations)',
      'Custom Approval Hierarchy Matrices with amount limits',
      'Dedicated Organization Login Portal & Custom Appearance',
      'Custom Session Timeouts & 2FA Enforcement',
      'Razorpay Automated Subscription Billing',
      'Dedicated Technical Account Manager & SLA'
    ],
    ctaText: 'Contact Enterprise',
    ctaLink: '/try-free',
    ctaVariant: 'secondary'
  }
];

// ==============================================================================
// 5. Industry-Specific Use Cases (Backed by Verified Capabilities)
// ==============================================================================
export const INDUSTRY_USE_CASES = [
  {
    id: 'distribution',
    title: 'Trading & Wholesale Distribution',
    icon: Store,
    badge: 'Wholesale & Retail',
    description: 'Manage high-volume sales orders across multi-state transit hubs, enforce customer credit limits, and dispatch goods with accurate delivery challans.',
    bulletPoints: [
      'Multi-warehouse stock reservation on confirmed sales order',
      'State-wise GST tax computation and e-invoice ready printouts',
      'Customer outstanding ledger with aging analysis and credit terms',
      'Fast delivery challan conversion into GST tax invoice'
    ]
  },
  {
    id: 'manufacturing',
    title: 'Discrete Manufacturing & Assembly',
    icon: Factory,
    badge: 'Production & Assembly',
    description: 'Track raw material procurement with 3-way matching, maintain multi-level Bills of Materials (BOM), and monitor finished goods inventory.',
    bulletPoints: [
      'Purchase Requisitions with engineering and finance sign-offs',
      'Supplier RFQ comparison to secure best raw material rates',
      'Goods Receipt (GRN) with batch and lot tracking for traceability',
      'FIFO cost valuation protecting gross manufacturing margins'
    ]
  },
  {
    id: 'holding',
    title: 'Conglomerates & Holding Companies',
    icon: Building2,
    badge: 'Multi-Subsidiary Groups',
    description: 'Run multiple legal entities under one organization umbrella. Switch between sister companies in one click while keeping accounting ledgers isolated.',
    bulletPoints: [
      'Independent Chart of Accounts and GSTINs per subsidiary',
      'Single centralized user login with per-company role assignment',
      'Unified executive visibility across all operational branches',
      'Tenant isolation preventing cross-subsidiary data leakage'
    ]
  }
];

// ==============================================================================
// 6. Real Verified Integrations & Technical Signals
// ==============================================================================
export const REAL_INTEGRATIONS = [
  {
    name: 'Razorpay Payment Gateway',
    category: 'Billing & Checkout',
    icon: CreditCard,
    description: 'Native Razorpay checkout integration supporting debit/credit cards, UPI, net banking, and automatic subscription order verification.'
  },
  {
    name: 'Indian GSTN Compliant Exports',
    category: 'Tax Compliance',
    icon: FileText,
    description: 'Statutory GSTR-1, GSTR-2B, and GSTR-3B summary reports formatted for direct reconciliation with the Goods and Services Tax Network.'
  },
  {
    name: 'Spreadsheet & PDF Reporting',
    category: 'Data Portability',
    icon: FileSpreadsheet,
    description: 'One-click export of Trial Balance, Profit & Loss, Balance Sheet, Ledger statements, and invoices into Excel, CSV, and formatted PDF.'
  },
  {
    name: 'Local & Network Printing',
    category: 'Dispatch & POS',
    icon: Printer,
    description: 'Integrated local print service supporting delivery challans, tax invoices, and warehouse packing slips.'
  }
];

// ==============================================================================
// 7. Frequently Asked Questions
// ==============================================================================
export const FAQ_ITEMS = [
  {
    question: 'What is included in the 30-Day Free Trial?',
    answer: 'You receive full enterprise access to all 6 core modules: Finance & Core Accounting, Sales & Revenue, Procurement, Multi-Warehouse Inventory, Statutory GST, and Approval Workflows. You can invite team members and evaluate with demonstration or real business transactions.'
  },
  {
    question: 'Is a credit card required to start the trial?',
    answer: 'No credit card, debit card, or payment commitment is required to start your 30-day evaluation. You can provision your dedicated organization tenant and create your initial subsidiary company in less than 60 seconds.'
  },
  {
    question: 'How does Mark2 ERP support multiple companies under one tenant?',
    answer: 'Mark2 ERP is architected natively for holding groups and multi-branch companies. A single parent Organization holds multiple independent Company subsidiaries. Each subsidiary maintains its own Chart of Accounts, GSTIN, currency, fiscal year, and warehouses, while sharing common executive logins and permissions.'
  },
  {
    question: 'How does the statutory GST engine calculate taxes on invoices?',
    answer: 'The system automatically compares the company state against the customer/vendor place of supply. For intra-state transactions, CGST and SGST are applied; for inter-state transactions, IGST is computed automatically based on the HSN/SAC master rate.'
  },
  {
    question: 'Can I export my financial statements and audit reports?',
    answer: 'Yes! All financial statements (Trial Balance, P&L, Balance Sheet, General Ledger, Aging Schedules, and GSTR summaries) can be exported to Excel, CSV, or formatted PDF ready for tax consultants and auditors.'
  },
  {
    question: 'What happens when my 30-day trial expires?',
    answer: 'Your data remains safe and preserved. You can subscribe to the Basic, Pro, or Enterprise plan via Razorpay to continue operations smoothly with zero data loss or downtime.'
  },
  {
    question: 'How do users sign in to their company or organization portal?',
    answer: 'Every organization receives a dedicated secure login portal URL (e.g. /o/apex/login). Users simply navigate to their portal, select their active company subsidiary, and authenticate with their credentials.'
  }
];

// ==============================================================================
// 8. Programmatic Smooth Scrolling Utility
// ==============================================================================
export function scrollToSection(e, targetId) {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }
  if (typeof document === 'undefined') return;
  const element = document.getElementById(targetId);
  if (element) {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    element.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start'
    });

    if (typeof window !== 'undefined' && window.history && window.history.pushState) {
      window.history.pushState(null, '', `#${targetId}`);
    }
  }
}

// ==============================================================================
// 9. Live Business Operations Simulation Data (Clearly Labelled Demo Data)
// ==============================================================================
export const LIVE_DEMO_OPERATIONS = [
  {
    id: 'sim-so-01',
    category: 'sales',
    categoryLabel: 'Sales & Dispatch',
    code: 'SO-2026-0343',
    title: 'Sales Order Confirmed',
    entity: 'Apex Precision Engineering (MH)',
    details: 'Bharat Heavy Motors confirmed order for 80 units Hydraulic Cylinder 40mm.',
    action: 'Inventory auto-allocated in Bhiwandi Hub (Bin A-04).',
    impact: 'Pipeline +₹4,80,000 • Stock Reserved',
    status: 'Confirmed',
    statusColor: '#16A34A',
    icon: ShoppingCart,
    moduleTab: 'sales'
  },
  {
    id: 'sim-inv-02',
    category: 'finance',
    categoryLabel: 'Finance & AR',
    code: 'INV-2026-105',
    title: 'Tax Invoice Payment Settled',
    entity: 'Apex Holdings HQ',
    details: '₹3,42,000 received via HDFC Direct NEFT from Southern Aerospace Corp.',
    action: 'Status updated from "Pending" to "Paid". Balanced JV auto-posted.',
    impact: 'Cash A/c +₹3,42,000 • AR Balanced',
    status: 'Paid in Full',
    statusColor: '#16A34A',
    icon: Banknote,
    moduleTab: 'finance'
  },
  {
    id: 'sim-inv-03',
    category: 'inventory',
    categoryLabel: 'Warehouse Stock',
    code: 'GRN-2026-0418',
    title: 'Stock Replenishment & Bin Allocation',
    entity: 'Bangalore Plant (KA)',
    details: '120 units Precision Roller Bearings inwarded against PO-2026-0513.',
    action: 'QC Inspection 100% Passed. Allocated to Bin C-12.',
    impact: 'Stock: 420 Units • FIFO Layer ₹650',
    status: 'Inwarded & Verified',
    statusColor: '#2E3D28',
    icon: Box,
    moduleTab: 'inventory'
  },
  {
    id: 'sim-po-04',
    category: 'purchase',
    categoryLabel: 'Procurement Gate',
    code: 'PO-2026-0514',
    title: 'Purchase Order Approved',
    entity: 'Apex Logistics & Distribution',
    details: 'Purchase Order for ₹4,80,000 high-grade steel approved by Purchase Head.',
    action: 'Budget checked. EDI acknowledgment sent to Tata Steel Alloy Div.',
    impact: '3-Way Match Armed • AP Accrued',
    status: 'Approved & Transmitted',
    statusColor: '#2E3D28',
    icon: Briefcase,
    moduleTab: 'purchase'
  },
  {
    id: 'sim-gst-05',
    category: 'gst',
    categoryLabel: 'Statutory GST',
    code: 'GSTR-1 RECON',
    title: 'Outward Supplies Reconciled',
    entity: 'Apex Holdings Multi-Entity',
    details: '42 B2B invoices reconciled against HSN/SAC master rates.',
    action: 'IGST (₹4.41L) + CGST/SGST (₹3.30L) liability accounts credited.',
    impact: 'GSTR-3B Auto-Generated • 100% Validated',
    status: 'Reconciled',
    statusColor: '#16A34A',
    icon: ShieldCheck,
    moduleTab: 'gst'
  },
  {
    id: 'sim-wh-06',
    category: 'inventory',
    categoryLabel: 'Inter-Warehouse Transfer',
    code: 'TR-2026-0891',
    title: 'Transit Movement Completed',
    entity: 'Bhiwandi Hub → Pune Transit',
    details: 'Inter-branch stock transfer of 50 units Precision Roller Bearings.',
    action: 'Delivery Challan confirmed. Receiving location bin updated.',
    impact: 'Zero Stock Discrepancy • Transit Cleared',
    status: 'Delivered',
    statusColor: '#16A34A',
    icon: Truck,
    moduleTab: 'inventory'
  }
];

// ==============================================================================
// 10. Multi-Company Hierarchy Simulation Signals
// ==============================================================================
export const INTER_COMPANY_SIGNALS = [
  {
    id: 'sig-01',
    from: 'Parent HQ (Apex Holdings)',
    to: 'Apex Precision Engineering (MH)',
    label: 'Master Chart of Accounts & FY 2026-27 Policy Synced',
    type: 'broadcast',
    badge: 'Master Data Sync'
  },
  {
    id: 'sig-02',
    from: 'Apex Precision Engineering (MH)',
    to: 'Parent HQ (Apex Holdings)',
    label: 'Consolidated Trial Balance & EBITDA Roll-up Transmitted',
    type: 'rollup',
    badge: 'Financial Roll-Up'
  },
  {
    id: 'sig-03',
    from: 'Parent HQ (Apex Holdings)',
    to: 'Apex Logistics & Distribution (KA)',
    label: 'Statutory GSTIN Cross-State Transfer Policy Approved',
    type: 'policy',
    badge: 'Governance Policy'
  },
  {
    id: 'sig-04',
    from: 'Apex Logistics & Distribution (KA)',
    to: 'Parent HQ (Apex Holdings)',
    label: 'Inter-Company Billing Voucher IC-804 Reconciled',
    type: 'settlement',
    badge: 'Inter-Entity Voucher'
  }
];

// ==============================================================================
// 11. Helper: Check if client prefers reduced motion
// ==============================================================================
export function checkPrefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

