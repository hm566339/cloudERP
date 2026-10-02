import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Box,
  ShoppingCart,
  Briefcase,
  Banknote,
  Shield,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  FileText,
  Lock,
  BarChart3,
  Layers,
  Sparkles,
  ChevronRight,
  Globe2,
  Key,
  Menu,
  X,
  Activity,
  Boxes,
  Clock,
  ArrowUpRight,
  Zap,
  Check,
  Package,
  Layers3
} from 'lucide-react';
import { useAppSelector } from '../../app/hooks';
import { selectIsAuthenticated, selectCurrentUser } from '../../features/auth/authSlice';

// ERP Modules Data based on real system capabilities
const ERP_MODULES = [
  {
    id: 'finance',
    name: 'Finance & Accounts',
    description: 'Chart of accounts, general ledger, journal vouchers, bank reconciliation, and cash flow tracking.',
    icon: Banknote,
    badge: 'Core Accounting',
    features: ['General Ledger & Journals', 'Bank Reconciliation', 'Receipt & Payment Vouchers', 'Cash Flow Analysis'],
  },
  {
    id: 'sales',
    name: 'Sales & Invoicing',
    description: 'Lead tracking, quotation lifecycle, proforma invoices, sales orders, and GST compliant tax invoices.',
    icon: ShoppingCart,
    badge: 'Revenue Engine',
    features: ['Quotations & Approvals', 'Sales Orders & Dispatch', 'GST Tax Invoices', 'Customer Balances'],
  },
  {
    id: 'purchase',
    name: 'Procurement & Purchase',
    description: 'Complete procurement pipeline from purchase requisitions and RFQs to supplier quotes and POs.',
    icon: Briefcase,
    badge: 'Procurement',
    features: ['Purchase Requisitions', 'RFQ & Supplier Comparison', 'Purchase Orders', 'Vendor Bill Management'],
  },
  {
    id: 'inventory',
    name: 'Inventory & Warehousing',
    description: 'Multi-warehouse stock visibility, batch tracking, serial numbers, transfer orders, and stock adjustments.',
    icon: Box,
    badge: 'Supply Chain',
    features: ['Multi-Warehouse Tracking', 'Batch & Serial Numbers', 'Stock Movement Logs', 'Low Stock Thresholds'],
  },
  {
    id: 'gst',
    name: 'GST & Compliance',
    description: 'Automated GST calculations, tax slabs, HSN/SAC master database, and GSTR-1, 2B, 3B preparation.',
    icon: ShieldCheck,
    badge: 'Tax Compliance',
    features: ['GSTR-1 & 3B Reports', 'GSTR-2B Reconciliation', 'HSN / SAC Master', 'State Master & Tax Slabs'],
  },
  {
    id: 'reports',
    name: 'Financial Reports',
    description: 'Instant trial balance generation, balance sheet, profit & loss statements, receivables and payables.',
    icon: BarChart3,
    badge: 'Intelligence',
    features: ['Real-Time Trial Balance', 'Profit & Loss Statement', 'Balance Sheet', 'Aging Receivables & Payables'],
  },
];

// Actual backend security & architecture features
const SECURITY_FEATURES = [
  {
    title: 'Organization Isolation',
    description: 'Strict organizational tenant boundaries guarantee complete data segregation between independent organizations.',
    icon: Building2,
  },
  {
    title: 'Company-Level Authorization',
    description: 'Server-side validated company authorization preventing unauthorized cross-company transactions.',
    icon: Shield,
  },
  {
    title: 'Role-Based Permissions',
    description: 'Granular access control enforcing role policies across accounting, procurement, sales, and warehouse teams.',
    icon: Key,
  },
  {
    title: 'Secure SSO Authentication',
    description: 'Cryptographic session tokens with automatic refresh cycles, secure cookies, and controlled API boundaries.',
    icon: Lock,
  },
];

const BUSINESS_BENEFITS = [
  {
    title: 'Multi-Company Management',
    desc: 'Manage multiple companies, subsidiaries, and corporate branches under a single centralized organization.',
  },
  {
    title: 'Organization-Based Tenancy',
    desc: 'Complete architectural isolation between distinct organizations with dedicated company code namespaces.',
  },
  {
    title: 'Role-Based Access Control',
    desc: 'Assign fine-grained read and write permissions tailored precisely to each team member’s operational responsibilities.',
  },
  {
    title: 'Company-Level Authorization',
    desc: 'All API requests strictly verify current company context on the backend, ensuring zero cross-tenant contamination.',
  },
  {
    title: 'Centralized Business Data',
    desc: 'Eliminate disconnected spreadsheets with unified real-time ledgers, sales orders, purchase bills, and inventory logs.',
  },
  {
    title: 'Inventory & Stock Visibility',
    desc: 'Monitor real-time warehouse inventory, reserved stocks, dispatch quantities, and threshold replenishment alerts.',
  },
  {
    title: 'Sales & Purchase Workflows',
    desc: 'Integrated order-to-cash and procure-to-pay pipelines connecting quotes, purchase orders, GRNs, and invoices.',
  },
  {
    title: 'Audited Financial Reporting',
    desc: 'Generate balanced Trial Balance, Profit & Loss, Balance Sheet, and statutory GST return reports on demand.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const currentUser = useAppSelector(selectCurrentUser);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState('finance'); // 'finance' | 'sales' | 'inventory' | 'purchase'

  // Set document title & meta tags for SEO
  useEffect(() => {
    document.title = 'Mark2 ERP — Run Your Business Smarter with One Powerful ERP';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Mark2 ERP connects sales, procurement, inventory, and accounting in one secure multi-tenant platform. Start your 30-day free trial today.'
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-zinc-900 selection:bg-primary/20 selection:text-zinc-900 overflow-x-hidden">
      {/* ── Top Announcement Bar ── */}
      <div className="bg-zinc-900 text-white text-xs py-2 px-4 text-center font-medium border-b border-zinc-800 flex items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide">
          <Sparkles size={11} /> 30-Day Free Trial
        </span>
        <span className="text-zinc-300">
          Experience full multi-company ERP capabilities for 30 days. No credit card required to get started.
        </span>
        <Link to="/try-free" className="text-white underline hover:text-emerald-400 font-semibold ml-1">
          Start Trial &rarr;
        </Link>
      </div>

      {/* ── Header / Navigation ── */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* LEFT: Existing ERP Logo & Product Name */}
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/ChatGPT Image Sep 11, 2026, 03_03_31 AM.png"
              alt="Mark2 ERP Logo"
              className="h-9 w-auto object-contain"
            />
            <div className="flex flex-col">
              <span className="font-bold text-sm text-zinc-900 tracking-tight leading-none">
                Mark2 ERP
              </span>
              <span className="text-[10px] text-zinc-500 font-medium">Enterprise Cloud</span>
            </div>
          </Link>

          {/* CENTER: Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-zinc-600">
            <a href="#features" className="hover:text-zinc-900 transition-colors">
              Features
            </a>
            <a href="#modules" className="hover:text-zinc-900 transition-colors">
              Modules
            </a>
            <a href="#security" className="hover:text-zinc-900 transition-colors">
              Security
            </a>
            <a href="#pricing" className="hover:text-zinc-900 transition-colors">
              Pricing/Trial
            </a>
          </nav>

          {/* RIGHT: Header Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => navigate('/company-select')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition-all shadow-sm"
              >
                <span>Go to Workspace</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <>
                <Link
                  to="/modules"
                  className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/try-free"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition-all shadow-sm"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight size={14} />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-zinc-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-slide-up">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-zinc-700 hover:text-zinc-900"
            >
              Features
            </a>
            <a
              href="#modules"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-zinc-700 hover:text-zinc-900"
            >
              Modules
            </a>
            <a
              href="#security"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-zinc-700 hover:text-zinc-900"
            >
              Security
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-zinc-700 hover:text-zinc-900"
            >
              Pricing/Trial
            </a>
            <div className="pt-3 border-t border-zinc-100 flex flex-col gap-2">
              <Link
                to="/modules"
                className="w-full text-center py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-800"
              >
                Sign In
              </Link>
              <Link
                to="/try-free"
                className="w-full text-center py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold shadow-sm"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden bg-gradient-to-b from-slate-50/80 via-white to-white">
        {/* Soft Background Accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-5%] left-[20%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute top-[10%] right-[15%] w-[450px] h-[450px] bg-blue-500/5 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200/80 text-zinc-700 text-xs font-semibold mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Multi-Company Enterprise Cloud ERP</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight text-zinc-900 max-w-4xl mx-auto leading-[1.15]">
            Run Your Business Smarter with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-600">
              One Powerful ERP
            </span>
          </h1>

          {/* Supporting Text */}
          <p className="mt-5 text-base sm:text-lg text-zinc-600 max-w-3xl mx-auto font-normal leading-relaxed">
            Unify your multi-company business operations across finance, sales, purchase procurement, multi-warehouse
            inventory, GST compliance, and real-time reporting in a centralized, secure platform.
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/try-free"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 transition-all shadow-md group"
            >
              <span>Start 30-Day Free Trial</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/modules"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-white border border-zinc-200 text-zinc-800 text-sm font-semibold hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-sm"
            >
              <span>Sign In</span>
            </Link>
          </div>

          {/* Micro Trust Details */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-500 font-medium">
            <span className="flex items-center gap-1">
              <CheckCircle2 size={14} className="text-emerald-600" /> 30-day full access trial
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={14} className="text-emerald-600" /> No credit card required to get started
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={14} className="text-emerald-600" /> Instant organization setup
            </span>
          </div>

          {/* ── REAL ERP PRODUCT PREVIEW (Interactive Demonstration) ── */}
          <div className="mt-14 max-w-5xl mx-auto">
            <div className="rounded-2xl border border-zinc-200/90 bg-white p-3 sm:p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] text-left">
              {/* Window Header Mock */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-zinc-100 text-xs gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="ml-2 font-mono text-[11px] text-zinc-400">
                    Mark2 ERP Workspace
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-zinc-600">
                    Interactive Workspace Preview (Demonstration Data)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-semibold font-mono">
                    Company: APEX-INDIA
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold">
                    Active Session
                  </span>
                </div>
              </div>

              {/* Module Switcher Tabs for Preview */}
              <div className="flex items-center gap-1 py-3 border-b border-zinc-100 overflow-x-auto text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewTab('finance')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${previewTab === 'finance' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
                >
                  <Banknote size={14} /> Finance & Accounts
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('sales')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${previewTab === 'sales' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
                >
                  <ShoppingCart size={14} /> Sales & Invoices
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('purchase')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${previewTab === 'purchase' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
                >
                  <Briefcase size={14} /> Procurement & POs
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('inventory')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${previewTab === 'inventory' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
                >
                  <Box size={14} /> Inventory & Stock
                </button>
              </div>

              {/* Tab 1: Finance Preview */}
              {previewTab === 'finance' && (
                <div className="pt-4 space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                      <div className="text-[11px] text-zinc-500 mb-1">Monthly Sales Revenue</div>
                      <div className="text-lg font-bold text-zinc-900">₹ 42,85,600</div>
                      <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">+14.2% from last period</div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                      <div className="text-[11px] text-zinc-500 mb-1">Accounts Receivable</div>
                      <div className="text-lg font-bold text-zinc-900">₹ 8,90,400</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">18 open customer balances</div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                      <div className="text-[11px] text-zinc-500 mb-1">Accounts Payable</div>
                      <div className="text-lg font-bold text-zinc-900">₹ 6,15,000</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">9 vendor bills pending</div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                      <div className="text-[11px] text-zinc-500 mb-1">General Ledger Tally</div>
                      <div className="text-lg font-bold text-emerald-600">Balanced</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">Trial Balance in equilibrium</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 sm:p-4 text-xs">
                    <div className="flex items-center justify-between font-semibold text-zinc-700 pb-2 mb-2 border-b border-zinc-200">
                      <span className="flex items-center gap-1.5"><Activity size={14} className="text-zinc-500" /> Recent General Ledger Journal Entries</span>
                      <span className="text-[10px] font-mono text-zinc-400">Sample Records</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between py-1 border-b border-zinc-200/50 text-[11px]">
                        <span className="font-mono font-medium text-zinc-800">JV-2026-00102</span>
                        <span className="text-zinc-600">Depreciation Provision — Equipment</span>
                        <span className="font-semibold text-zinc-900">₹ 45,000</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-zinc-200 text-zinc-700">Posted</span>
                      </div>
                      <div className="flex items-center justify-between py-1 text-[11px]">
                        <span className="font-mono font-medium text-zinc-800">RV-2026-00088</span>
                        <span className="text-zinc-600">Customer Receipt — Bharat Precision Ltd</span>
                        <span className="font-semibold text-zinc-900">₹ 3,45,000</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700">Reconciled</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Sales Preview */}
              {previewTab === 'sales' && (
                <div className="pt-4 space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                      <div className="text-[11px] text-zinc-500 mb-1">Active Quotations</div>
                      <div className="text-lg font-bold text-zinc-900">24</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">8 awaiting acceptance</div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                      <div className="text-[11px] text-zinc-500 mb-1">Sales Orders in Fulfillment</div>
                      <div className="text-lg font-bold text-zinc-900">16</div>
                      <div className="text-[10px] text-blue-600 font-semibold mt-0.5">Delivery challans active</div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                      <div className="text-[11px] text-zinc-500 mb-1">Invoices Issued (Month)</div>
                      <div className="text-lg font-bold text-zinc-900">86</div>
                      <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">GST tax invoices verified</div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                      <div className="text-[11px] text-zinc-500 mb-1">Average Turnaround</div>
                      <div className="text-lg font-bold text-zinc-900">1.8 Days</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">Quote to order conversion</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 sm:p-4 text-xs">
                    <div className="flex items-center justify-between font-semibold text-zinc-700 pb-2 mb-2 border-b border-zinc-200">
                      <span className="flex items-center gap-1.5"><ShoppingCart size={14} className="text-zinc-500" /> Recent Sales Invoices & Orders</span>
                      <span className="text-[10px] font-mono text-zinc-400">Sample Records</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between py-1 border-b border-zinc-200/50 text-[11px]">
                        <span className="font-mono font-medium text-zinc-800">INV-2026-089</span>
                        <span className="text-zinc-600">Bharat Precision Tools</span>
                        <span className="font-semibold text-zinc-900">₹ 3,45,000</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700">Paid</span>
                      </div>
                      <div className="flex items-center justify-between py-1 text-[11px]">
                        <span className="font-mono font-medium text-zinc-800">SO-2026-112</span>
                        <span className="text-zinc-600">Apex Automotive Components</span>
                        <span className="font-semibold text-zinc-900">₹ 8,12,000</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700">Dispatched</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Procurement Preview */}
              {previewTab === 'purchase' && (
                <div className="pt-4 space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                      <div className="text-[11px] text-zinc-500 mb-1">Open Requisitions</div>
                      <div className="text-lg font-bold text-zinc-900">7</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">3 pending approval</div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                      <div className="text-[11px] text-zinc-500 mb-1">RFQs in Tender</div>
                      <div className="text-lg font-bold text-zinc-900">4</div>
                      <div className="text-[10px] text-blue-600 font-semibold mt-0.5">Supplier bids compared</div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                      <div className="text-[11px] text-zinc-500 mb-1">Open Purchase Orders</div>
                      <div className="text-lg font-bold text-zinc-900">₹ 18,24,350</div>
                      <div className="text-[10px] text-amber-600 font-semibold mt-0.5">12 orders awaiting GRN</div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                      <div className="text-[11px] text-zinc-500 mb-1">Verified GRNs</div>
                      <div className="text-lg font-bold text-emerald-600">98.5%</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">Inspection match rate</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 sm:p-4 text-xs">
                    <div className="flex items-center justify-between font-semibold text-zinc-700 pb-2 mb-2 border-b border-zinc-200">
                      <span className="flex items-center gap-1.5"><Briefcase size={14} className="text-zinc-500" /> Active Purchase Orders & Goods Receipts</span>
                      <span className="text-[10px] font-mono text-zinc-400">Sample Records</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between py-1 border-b border-zinc-200/50 text-[11px]">
                        <span className="font-mono font-medium text-zinc-800">PO-2026-044</span>
                        <span className="text-zinc-600">Apex Steel Suppliers Ltd</span>
                        <span className="font-semibold text-zinc-900">₹ 6,80,000</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700">GRN Inward</span>
                      </div>
                      <div className="flex items-center justify-between py-1 text-[11px]">
                        <span className="font-mono font-medium text-zinc-800">PR-2026-019</span>
                        <span className="text-zinc-600">Hydraulic Seals & Bearings</span>
                        <span className="font-semibold text-zinc-900">₹ 1,20,000</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700">RFQ Sent</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Inventory Preview */}
              {previewTab === 'inventory' && (
                <div className="pt-4 space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                      <div className="text-[11px] text-zinc-500 mb-1">Total SKU Items</div>
                      <div className="text-lg font-bold text-zinc-900">3,420</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">Across 5 regional warehouses</div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                      <div className="text-[11px] text-zinc-500 mb-1">Stock Valuation</div>
                      <div className="text-lg font-bold text-zinc-900">₹ 1,18,50,000</div>
                      <div className="text-[10px] text-blue-600 font-semibold mt-0.5">FIFO valuation method</div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                      <div className="text-[11px] text-zinc-500 mb-1">Low Stock Alerts</div>
                      <div className="text-lg font-bold text-amber-600">3 SKUs</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">Under reorder threshold</div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                      <div className="text-[11px] text-zinc-500 mb-1">Warehouse Transfer Orders</div>
                      <div className="text-lg font-bold text-zinc-900">4 Active</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">Inter-facility transit</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 sm:p-4 text-xs">
                    <div className="flex items-center justify-between font-semibold text-zinc-700 pb-2 mb-2 border-b border-zinc-200">
                      <span className="flex items-center gap-1.5"><Box size={14} className="text-zinc-500" /> Multi-Warehouse Stock Positions</span>
                      <span className="text-[10px] font-mono text-zinc-400">Sample Records</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between py-1 border-b border-zinc-200/50 text-[11px]">
                        <span className="font-mono font-medium text-zinc-800">SKU-7721 (CNC Bit)</span>
                        <span className="text-zinc-600">Central Warehouse (Bhiwandi)</span>
                        <span className="font-semibold text-zinc-900">840 units</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700">Optimal</span>
                      </div>
                      <div className="flex items-center justify-between py-1 text-[11px]">
                        <span className="font-mono font-medium text-zinc-800">SKU-1094 (Seal Rings)</span>
                        <span className="text-zinc-600">North Plant Warehouse</span>
                        <span className="font-semibold text-zinc-900">45 units</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700">Reorder Level</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── ERP MODULES SECTION ── */}
      <section id="modules" className="py-20 bg-slate-50 border-t border-zinc-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">
              Integrated Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-zinc-900 tracking-tight">
              Enterprise ERP Modules Built for Growth
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 mt-3 leading-relaxed">
              Every major operational capability united under a single permission-governed architecture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ERP_MODULES.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.id}
                  className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-800">
                        <Icon size={20} />
                      </div>
                      <span className="text-[11px] font-semibold text-zinc-500 bg-zinc-100 px-2.5 py-0.5 rounded-full">
                        {mod.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-zinc-900 mb-2">{mod.name}</h3>
                    <p className="text-xs text-zinc-600 leading-relaxed mb-4">{mod.description}</p>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 space-y-1.5">
                    {mod.features.map((feat) => (
                      <div key={feat} className="flex items-center gap-2 text-[11px] text-zinc-600">
                        <Check size={13} className="text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── BUSINESS BENEFITS / FEATURES SECTION ── */}
      <section id="features" className="py-20 bg-white border-t border-zinc-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">
              Enterprise Value
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-zinc-900 tracking-tight">
              Why Businesses Scale with Mark2 ERP
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 mt-3 leading-relaxed">
              Consolidate multi-company accounting, procurement pipelines, and warehouse operations with verifiable governance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {BUSINESS_BENEFITS.map((benefit, i) => (
              <div key={i} className="p-5 rounded-2xl border border-zinc-200/80 bg-zinc-50/40 hover:bg-zinc-50 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-xs mb-3">
                  {i + 1}
                </div>
                <h3 className="text-sm font-bold text-zinc-900 mb-1.5">{benefit.title}</h3>
                <p className="text-xs text-zinc-600 leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECURITY SECTION ── */}
      <section id="security" className="py-20 bg-zinc-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10 mix-blend-overlay" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-2">
              Security Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight">
              Enterprise Security & Tenant Isolation
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 mt-3 leading-relaxed">
              Strict multi-tenant boundaries, cryptographic session management, and server-side authorization protect all business data.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SECURITY_FEATURES.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="rounded-2xl bg-zinc-800/80 border border-zinc-700/80 p-6 flex flex-col justify-between"
                >
                  <div className="w-10 h-10 rounded-xl bg-zinc-700/80 text-emerald-400 flex items-center justify-center mb-4">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PRICING / TRIAL SECTION ── */}
      <section id="pricing" className="py-20 bg-slate-50 border-t border-zinc-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">
              Evaluation & Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-zinc-900 tracking-tight">
              Simple, Transparent 30-Day Evaluation
            </h2>
            <p className="text-sm text-zinc-600 mt-2">
              Experience the entire enterprise platform in your own dedicated organization tenant.
            </p>
          </div>

          {/* Pricing Card */}
          <div className="max-w-xl mx-auto rounded-3xl bg-white border border-zinc-200 p-8 sm:p-10 shadow-lg text-center relative overflow-hidden">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-semibold mb-4">
              <Sparkles size={12} className="text-emerald-600" />
              <span>Full Enterprise Plan Access</span>
            </div>

            <h3 className="text-2xl font-bold text-zinc-900">30-Day Free Trial</h3>
            <div className="mt-4 mb-2">
              <span className="text-4xl sm:text-5xl font-extrabold text-zinc-900">₹0</span>
              <span className="text-sm text-zinc-500 ml-2 font-medium">for 30 days</span>
            </div>
            <p className="text-xs text-zinc-500 mb-8">
              No credit card required to get started. Cancel or upgrade anytime.
            </p>

            <div className="space-y-3 text-left max-w-md mx-auto mb-8 text-xs text-zinc-700">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Full access to all 6 core ERP modules</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Multi-company management & tenant isolation</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Role-based permissions & audit trails</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Real-time GST & tax compliance reporting</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Instant provisioning with your custom company code</span>
              </div>
            </div>

            <Link
              to="/try-free"
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 transition-all shadow-sm group"
            >
              <span>Start Free Trial</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FINAL CALL TO ACTION ── */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white border-t border-zinc-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-zinc-950 text-white rounded-3xl p-8 sm:p-14 relative overflow-hidden shadow-xl">
            <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <Sparkles size={13} />
                <span>Setup in 60 Seconds</span>
              </span>

              <h2 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-white">
                Start your 30-day free trial
              </h2>

              <p className="text-sm text-zinc-400 leading-relaxed">
                No credit card required to get started. Empower your team with unified multi-company operations,
                inventory visibility, and audited financial statements.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/try-free"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 h-12 rounded-xl bg-white text-zinc-900 text-sm font-semibold hover:bg-zinc-100 transition-all shadow-md group"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/modules"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 h-12 rounded-xl border border-zinc-700 text-white text-sm font-semibold hover:bg-zinc-800 transition-all"
                >
                  <span>Sign In</span>
                </Link>
              </div>

              <p className="text-[11px] text-zinc-500 pt-2">
                No credit card required to get started • Full feature access • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-zinc-200 bg-white py-12 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/ChatGPT Image Sep 11, 2026, 03_03_31 AM.png"
              alt="Mark2 ERP Logo"
              className="h-7 w-auto object-contain"
            />
            <span>© {new Date().getFullYear()} Mark2 ERP Platform. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 font-medium text-zinc-600">
            <a href="#features" className="hover:text-zinc-900 transition-colors">
              Features
            </a>
            <a href="#modules" className="hover:text-zinc-900 transition-colors">
              Modules
            </a>
            <a href="#security" className="hover:text-zinc-900 transition-colors">
              Security
            </a>
            <a href="#pricing" className="hover:text-zinc-900 transition-colors">
              Pricing
            </a>
            <Link to="/try-free" className="hover:text-zinc-900 transition-colors">
              Free Trial
            </Link>
            <Link to="/modules" className="hover:text-zinc-900 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
