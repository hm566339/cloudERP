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
  Receipt,
  Users2,
  Boxes,
  Database,
  ArrowRightLeft,
  Sparkles,
  ClipboardList
} from 'lucide-react';

// Comprehensive ERP Modules based on actual codebase capabilities
export const ERP_MODULES = [
  {
    id: 'finance',
    name: 'Finance & Core Accounting',
    description: 'Double-entry general ledger, customizable chart of accounts, journal entries, bank reconciliations, cash flow, and financial year closing.',
    icon: Banknote,
    badge: 'Core Accounting',
    color: 'emerald',
    features: [
      'Multi-tier Chart of Accounts & Groups',
      'General Ledger & Journal Vouchers (JVs)',
      'Bank Reconciliation & Cash Book',
      'Real-time Trial Balance, P&L, Balance Sheet'
    ],
  },
  {
    id: 'sales',
    name: 'Sales & Revenue Operations',
    description: 'Streamline the full revenue cycle: customer inquiries, quote approvals, proforma invoices, sales orders, delivery challans, and GST tax invoices.',
    icon: ShoppingCart,
    badge: 'Revenue Engine',
    color: 'blue',
    features: [
      'Quotation to Sales Order conversion',
      'Multi-warehouse Delivery Challan & Dispatch',
      'GST Tax Invoicing with HSN/SAC breakdown',
      'Customer Outstanding Ledger & Credit Notes'
    ],
  },
  {
    id: 'purchase',
    name: 'Procurement & Vendor Management',
    description: 'Automate procure-to-pay pipelines: internal purchase requisitions, supplier RFQ tenders, purchase orders, 3-way matching, and AP bills.',
    icon: Briefcase,
    badge: 'Procurement',
    color: 'amber',
    features: [
      'Purchase Requisitions (PR) with Approvals',
      'RFQ Supplier Bidding & Price Comparison',
      'Purchase Orders (PO) & Goods Receipts (GRN)',
      'Vendor AP Invoices, Payments & Debit Notes'
    ],
  },
  {
    id: 'inventory',
    name: 'Multi-Warehouse Inventory',
    description: 'Real-time stock tracking across regional warehouses and bin locations, batch/lot tracking, serial numbers, transfer orders, and FIFO valuation.',
    icon: Box,
    badge: 'Supply Chain',
    color: 'indigo',
    features: [
      'Multi-Warehouse & Bin Location Visibility',
      'Batch Number & Serial Number Tracking',
      'Inter-Warehouse Stock Transfer Orders',
      'Automated Low Stock & Replenishment Alerts'
    ],
  },
  {
    id: 'gst',
    name: 'Statutory GST & Tax Compliance',
    description: 'Automated GST computation (CGST, SGST, IGST) based on place of supply, tax slab masters, HSN code lookups, and statutory return filing.',
    icon: ShieldCheck,
    badge: 'Tax Compliance',
    color: 'emerald',
    features: [
      'Automated GSTR-1 Sales Invoices Summary',
      'GSTR-3B Return Tax Liability Breakdown',
      'GSTR-2B Input Tax Credit (ITC) Reconciliation',
      'HSN / SAC Code Master & State Tax Slabs'
    ],
  },
  {
    id: 'workflows',
    name: 'Workflows & Approval Hierarchy',
    description: 'Enterprise governance with multi-level approval hierarchies for high-value purchase orders, sales quotations, credit notes, and budget lines.',
    icon: GitBranch,
    badge: 'Governance',
    color: 'purple',
    features: [
      'Configurable Multi-Stage Approval Rules',
      'Role-based Task Assignment & Live Inbox',
      'Document Rejection Reason Tracking',
      'Immutable Audit Trail for Regulatory Review'
    ],
  },
];

// Connected End-to-End Business Lifecycles
export const BUSINESS_PIPELINES = [
  {
    title: 'Order-to-Cash Cycle (Sales)',
    description: 'Seamless document transitions with zero re-keying from quote to payment collection.',
    steps: [
      { name: 'Quotation', icon: ClipboardList, detail: 'Quote approved by Sales Manager' },
      { name: 'Sales Order', icon: ShoppingCart, detail: 'Confirmed order with reserved stock' },
      { name: 'Delivery Challan', icon: Truck, detail: 'Warehouse dispatch & location scan' },
      { name: 'Tax Invoice', icon: Receipt, detail: 'GST compliant invoice posted to GL' },
      { name: 'Receipt Voucher', icon: Banknote, detail: 'Bank settlement & ledger tally' },
    ]
  },
  {
    title: 'Procure-to-Pay Cycle (Purchasing)',
    description: 'Audited 3-way matching connecting requisitions, vendor bills, and bank payments.',
    steps: [
      { name: 'Requisition (PR)', icon: FileCheck2, detail: 'Departmental purchase request' },
      { name: 'RFQ & Tender', icon: ArrowRightLeft, detail: 'Compare quotes from 3+ suppliers' },
      { name: 'Purchase Order', icon: Briefcase, detail: 'Binding agreement issued to vendor' },
      { name: 'GRN Inward', icon: Box, detail: 'Physical inspection & stock inward' },
      { name: 'Payment Voucher', icon: Banknote, detail: 'AP bill cleared with tax deduction' },
    ]
  }
];

// Security and Multi-Tenant Architecture
export const SECURITY_FEATURES = [
  {
    title: 'Organization Tenant Segregation',
    description: 'Complete database and architectural tenant boundary isolation preventing cross-organization leakage.',
    icon: Building2,
  },
  {
    title: 'Company Context Authorization',
    description: 'Server-side validated company scoping on every API request prevents unauthorized cross-subsidiary queries.',
    icon: Shield,
  },
  {
    title: 'Granular Role-Based Permissions (RBAC)',
    description: 'Fine-grained policy enforcement across Owners, Company Admins, Accountants, Sales, Purchase, and Warehouse staff.',
    icon: Key,
  },
  {
    title: 'Cryptographic SSO Authentication',
    description: 'HttpOnly secure cookies, single-flight token refresh queues, and automated session revocation protect data integrity.',
    icon: Lock,
  },
];

// Core Value Propositions
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

// Frequently Asked Questions
export const FAQ_ITEMS = [
  {
    question: 'What is included in the 30-Day Free Trial?',
    answer: 'You receive full enterprise access to all 6 modules: Finance & Accounts, Sales, Procurement, Multi-Warehouse Inventory, GST Reports, and Workflows. You can invite team members and test with demonstration or real business data.',
  },
  {
    question: 'Is a credit card required to start?',
    answer: 'No credit card or payment information is required to start your 30-day evaluation. You can provision your organization and create your first company in less than 60 seconds.',
  },
  {
    question: 'Does Mark2 ERP support multiple companies under one tenant?',
    answer: 'Yes! Mark2 ERP is designed natively for multi-company holding groups. You can manage multiple legal entities, each with its own Chart of Accounts, GSTIN, currency, and warehouses, while sharing common user logins.',
  },
  {
    question: 'How does GST calculation work in sales and purchase invoices?',
    answer: 'The system automatically checks your company state against the customer/vendor place of supply. For intra-state transactions, CGST and SGST are applied; for inter-state transactions, IGST is computed automatically based on the HSN/SAC master rate.',
  },
  {
    question: 'Can I export my financial statements and audit reports?',
    answer: 'Yes. All financial statements (Trial Balance, P&L, Balance Sheet, Ledger statements, GSTR summaries) can be exported to Excel, CSV, or formatted PDF ready for tax consultants and auditors.',
  },
];

/**
 * Programmatic smooth scroll to target section ID with offset for sticky header
 */
export function scrollToSection(e, targetId) {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }
  const element = document.getElementById(targetId);
  if (element) {
    const prefersReducedMotion = typeof window !== 'undefined' &&
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
