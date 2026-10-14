import React, { useState, useCallback } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  User,
  FileText,
  ShoppingCart,
  CreditCard,
  Book,
  FilePlus,
  Layers,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowLeft,
  PieChart,
  BarChart3,
  Box,
  Truck,
  Activity,
  UserPlus
} from 'lucide-react'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  {
    id: 'masters',
    label: 'Masters',
    icon: Users,
    children: [
      { id: 'customers', label: 'Customers', path: '/customers', icon: User },
      { id: 'vendors', label: 'Vendors', path: '/vendors', icon: Truck },
      { id: 'gst', label: 'GST Slabs', path: '/masters/gst-slabs', icon: FileText },
      { id: 'hsn', label: 'HSN/SAC', path: '/masters/hsn', icon: Book },
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: ShoppingCart,
    children: [
      { id: 'sales_dashboard', label: 'Sales Overview', path: '/sales', icon: BarChart3 },
      { id: 'quotations', label: 'Quotations', path: '/sales/quotations', icon: FileText },
      { id: 'sales_orders', label: 'Sales Orders', path: '/sales/orders', icon: ShoppingCart },
      { id: 'sales_invoices', label: 'Sales Invoices', path: '/sales/invoices', icon: FileText },
      { id: 'invoice_taxes', label: 'Invoice Taxes', path: '/sales/taxes', icon: FileText },
    ],
  },
  {
    id: 'purchases',
    label: 'Purchases',
    icon: FilePlus,
    children: [
      { id: 'purchase_dashboard', label: 'Purchases Overview', path: '/purchases', icon: BarChart3 },
      { id: 'purchase_orders', label: 'Purchase Orders', path: '/purchases/purchase-orders', icon: ShoppingCart },
      { id: 'purchase_approvals', label: 'Approvals', path: '/purchases/approvals', icon: UserPlus },
      { id: 'ap_invoices', label: 'AP Invoices', path: '/purchases/ap-invoices', icon: FileText },
      { id: 'payment_vouchers', label: 'Payment Vouchers', path: '/purchases/vouchers', icon: CreditCard },
    ],
  },
  {
    id: 'banking',
    label: 'Banking',
    icon: CreditCard,
    children: [
      { id: 'bank_accounts', label: 'Bank Accounts', path: '/banking/accounts', icon: CreditCard },
      { id: 'bank_transactions', label: 'Bank Transactions', path: '/banking/transactions', icon: ArrowLeft },
    ],
  },
  {
    id: 'finance_accounting',
    label: 'Finance & Accounting',
    icon: Book,
    children: [
      { id: 'finance_dashboard', label: 'Finance Dashboard', path: '/finance', icon: BarChart3 },
      { id: 'general_ledger', label: 'General Ledger', path: '/finance/ledger', icon: Book },
      { id: 'expenses', label: 'Expenses', path: '/finance/expenses', icon: FileText },
      { id: 'journal_entries', label: 'Journal Entries', path: '/accounting/journals', icon: FileText },
      { id: 'journal_lines', label: 'Journal Lines', path: '/accounting/journal-lines', icon: Layers },
      { id: 'account_categories', label: 'Account Categories', path: '/accounting/categories', icon: PieChart },
      { id: 'account_groups', label: 'Account Groups', path: '/accounting/groups', icon: BarChart3 },
      { id: 'fin_sales_orders', label: 'Sales Orders', path: '/finance/sales-orders', icon: ShoppingCart },
      { id: 'fin_sales_invoices', label: 'Sales Invoices', path: '/finance/sales-invoices', icon: FileText },
      { id: 'fin_ap_invoices', label: 'AP Invoices', path: '/finance/ap-invoices', icon: FileText },
      { id: 'fin_payment_vouchers', label: 'Payment Vouchers', path: '/finance/payment-vouchers', icon: CreditCard },
      { id: 'fin_vendors', label: 'Vendors', path: '/finance/vendors', icon: Truck },
      { id: 'fin_customers', label: 'Customers', path: '/finance/customers', icon: User },
    ]
  },
  {
    id: 'budgeting',
    label: 'Budgeting',
    icon: Layers,
    children: [
      { id: 'budget_headers', label: 'Budget Headers', path: '/accounts/budget/budget-headers', icon: FileText },
      { id: 'budget_lines', label: 'Budget Lines', path: '/accounts/budget/budget-lines', icon: FileText },
    ],
  },
  {
    id: 'periods',
    label: 'Financial Periods',
    icon: Calendar,
    children: [
      { id: 'fiscal_years', label: 'Fiscal Years', path: '/periods/fiscal-years', icon: Calendar },
      { id: 'accounting_periods', label: 'Accounting Periods', path: '/periods/accounting-periods', icon: Calendar },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Box,
    children: [
      { id: 'inv_dashboard', label: 'Inventory Dashboard', path: '/inventory', icon: BarChart3 },
      { id: 'stocks', label: 'Stocks', path: '/inventory/stocks', icon: Box },
      { id: 'warehouse', label: 'Warehouses', path: '/inventory/warehouse', icon: Box },
      { id: 'transfers', label: 'Transfers', path: '/inventory/transfers', icon: ArrowLeft },
    ]
  },
  {
    id: 'manufacturing',
    label: 'Manufacturing',
    icon: Activity,
    children: [
      { id: 'mfg_dashboard', label: 'Manufacturing Dashboard', path: '/manufacturing', icon: BarChart3 },
      { id: 'production', label: 'Production', path: '/manufacturing/production', icon: Activity },
      { id: 'batches', label: 'Batches', path: '/manufacturing/batches', icon: Layers },
    ]
  },
  {
    id: 'hr',
    label: 'HR / Payroll',
    icon: Users,
    children: [
      { id: 'hr_dashboard', label: 'HR Dashboard', path: '/hr', icon: BarChart3 },
      { id: 'employees', label: 'Employees', path: '/hr/employees', icon: Users },
      { id: 'attendance', label: 'Attendance', path: '/hr/attendance', icon: Calendar },
      { id: 'leave', label: 'Leave', path: '/hr/leave', icon: Calendar },
      { id: 'payroll', label: 'Payroll', path: '/hr/payroll', icon: FileText },
    ]
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: PieChart,
    children: [
      { id: 'reports_dash', label: 'All Reports', path: '/reports', icon: PieChart },
      { id: 'receivables', label: 'Receivables', path: '/reports/receivables', icon: BarChart3 },
      { id: 'payables', label: 'Payables', path: '/reports/payables', icon: BarChart3 },
      { id: 'pl', label: 'Profit & Loss', path: '/reports/pl', icon: BarChart3 },
      { id: 'bs', label: 'Balance Sheet', path: '/reports/bs', icon: BarChart3 },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    icon: Settings,
    children: [
      { id: 'users', label: 'Users', path: '/users', icon: Users },
      { id: 'roles', label: 'Roles', path: '/roles', icon: Users },
      { id: 'modules', label: 'Modules', path: '/modules', icon: Box },
      { id: 'sessions', label: 'Sessions', path: '/sessions', icon: Activity },
      { id: 'sessions_all', label: 'All Sessions', path: '/sessions/all', icon: Activity },
      { id: 'portal', label: 'Portal Access', path: '/portal-access', icon: UserPlus },
    ]
  },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
]

export default function Sidebar({ companyId, mobileOpen = false, onMobileClose }) {
  const [collapsed, setCollapsed] = useState(false)
  const [openSections, setOpenSections] = useState(() => new Set(['masters']))
  const navigate = useNavigate()
  const location = useLocation()

  const resolvePath = useCallback((path) => {
    if (!path) return ''
    if (!companyId) return path
    return `/company/${companyId}${path}`
  }, [companyId])

  const toggleCollapse = useCallback(() => setCollapsed((v) => !v), [])

  const toggleSection = useCallback((id) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const isActivePath = useCallback((path) => {
    if (!path) return false
    const resolved = resolvePath(path)
    return location.pathname === resolved || location.pathname.startsWith(resolved + '/')
  }, [location.pathname, resolvePath])

  const SidebarHeader = () => (
    <div className={`flex items-center gap-3 px-4 h-16 border-b border-zinc-200/60 shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
      {!collapsed && (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gradient-to-br from-primary-600 to-primary-500 rounded-lg flex items-center justify-center shadow-md">
            <BarChart3 size={14} className="text-white" />
          </div>
          <span className="font-display font-bold text-zinc-900 text-[12px] tracking-tight">FinanceOS</span>
        </div>
      )}

      {mobileOpen && (
        <button onClick={onMobileClose} className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg hover:bg-zinc-100 transition-colors">
          <X size={18} />
        </button>
      )}

      {!mobileOpen && (
        <button onClick={toggleCollapse} className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-zinc-700 rounded-md hover:bg-zinc-100 transition-colors">
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      )}
    </div>
  )

  const NavSection = ({ section }) => {
    const hasChildren = Array.isArray(section.children) && section.children.length > 0
    const opened = openSections.has(section.id)
    const active = isActivePath(section.path)

    return (
      <div className="mb-1">
        <button
          onClick={() => {
            if (hasChildren) {
              toggleSection(section.id)
            } else if (section.path) {
              navigate(resolvePath(section.path))
            }
          }}
          className={`sidebar-item ${active ? 'sidebar-item-active' : 'sidebar-item-inactive'} ${collapsed ? 'justify-center !px-0' : ''}`}
          title={collapsed ? section.label : undefined}
        >
          <section.icon size={18} className={`shrink-0 ${active ? 'text-primary' : 'text-zinc-500'}`} />
          {!collapsed && <span className="flex-1 text-left tracking-wide">{section.label}</span>}
          {!collapsed && hasChildren && (
            <ChevronRight size={14} className={`transform transition-transform text-zinc-400 ${opened ? 'rotate-90' : ''}`} />
          )}
        </button>

        {/* Children */}
        {hasChildren && opened && !collapsed && (
          <div className="mt-1 space-y-0.5 pl-9 pr-1">
            {section.children.map((ch) => {
              const chHasChildren = Array.isArray(ch.children) && ch.children.length > 0
              const chOpened = openSections.has(ch.id)
              
              if (chHasChildren) {
                return (
                  <div key={ch.id} className="mb-0.5">
                    <button
                      onClick={() => toggleSection(ch.id)}
                      className={`w-full flex items-center justify-between sidebar-child-item ${chOpened ? 'sidebar-child-active' : 'sidebar-child-inactive'}`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {ch.icon ? <ch.icon size={14} className="shrink-0 opacity-70" /> : <div className="w-[11.2px] shrink-0" />}
                        <span className="truncate text-left">{ch.label}</span>
                      </div>
                      <ChevronRight size={14} className={`shrink-0 transform transition-transform opacity-50 ${chOpened ? 'rotate-90' : ''}`} />
                    </button>
                    {chOpened && (
                      <div className="mt-0.5 space-y-0.5 pl-4">
                        {ch.children.map((sub) => (
                          <NavLink
                            key={sub.id}
                            to={resolvePath(sub.path)}
                            onClick={() => mobileOpen && onMobileClose && onMobileClose()}
                            className={({ isActive }) => `sidebar-child-item ${isActive ? 'sidebar-child-active' : 'sidebar-child-inactive'}`}
                          >
                            {sub.icon ? <sub.icon size={14} className="shrink-0 opacity-70" /> : <div className="w-[11.2px] h-[11.2px] shrink-0 rounded-full border-[1.2px] border-zinc-300 opacity-70" />}
                            <span className="truncate">{sub.label}</span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <NavLink
                  key={ch.id}
                  to={resolvePath(ch.path)}
                  onClick={() => mobileOpen && onMobileClose && onMobileClose()}
                  className={({ isActive }) => `sidebar-child-item ${isActive ? 'sidebar-child-active' : 'sidebar-child-inactive'}`}
                >
                  {ch.icon ? <ch.icon size={14} className="shrink-0 opacity-70" /> : <div className="w-[11.2px] shrink-0" />}
                  <span className="truncate">{ch.label}</span>
                </NavLink>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white/80 backdrop-blur-xl border-r border-zinc-200/60 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out shrink-0 ${collapsed ? 'w-[57.6px]' : 'w-[224px]'}`}
        style={{ minHeight: '100vh' }}
      >
        <SidebarHeader />

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto no-scrollbar">
          {NAV.map((section) => (
            <div key={section.id}>
              <NavSection section={section} />
            </div>
          ))}
        </nav>

        <div className="px-3 pb-5 border-t border-zinc-200/60 pt-4 shrink-0 bg-zinc-50/50">
          <button
            onClick={() => navigate('/')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-white border border-zinc-200/60 shadow-sm transition-all duration-200 ${collapsed ? 'justify-center !px-0' : ''}`}
            title={collapsed ? 'All Companies' : undefined}
          >
            <ArrowLeft size={18} className="shrink-0" />
            {!collapsed && <span>All Companies</span>}
          </button>
        </div>
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-zinc-900/30 backdrop-blur-sm transition-opacity" onClick={onMobileClose} />
          <aside className="relative flex flex-col w-[224px] bg-white/95 backdrop-blur-xl h-full shadow-2xl border-r border-white/60">
            <SidebarHeader />
            <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto no-scrollbar">
              {NAV.map((section) => (
                <div key={section.id}>
                  <NavSection section={section} />
                </div>
              ))}
            </nav>
            <div className="px-3 pb-5 border-t border-zinc-200/60 pt-4 shrink-0 bg-zinc-50/50">
               <button
                 onClick={() => navigate('/')}
                 className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-white border border-zinc-200/60 shadow-sm transition-all duration-200"
               >
                 <ArrowLeft size={18} className="shrink-0" />
                 <span>All Companies</span>
               </button>
             </div>
          </aside>
        </div>
      )}
    </>
  )
}
