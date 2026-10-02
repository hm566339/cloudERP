import React, { useState, useEffect } from 'react'
import { useParams, Link, useOutletContext } from 'react-router-dom'
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Boxes,
  Users,
  IndianRupee,
  Briefcase,
  Layers,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  FileText,
  UserCheck,
  PlusCircle,
  Package,
  ShoppingCart,
  MoreHorizontal,
  ArrowRight,
  Clock,
  CheckCircle2,
  Box,
  Factory,
  Banknote,
  Lock
} from 'lucide-react'

import { useAppSelector } from '../../../app/hooks'
import { useRBAC } from '../../../utils/rbac'
import {
  useGetDashboardMetricsQuery,
} from '../../../api/sso'

// Import Dashboards
import FinanceDashboard from "../../finance/pages/FinanceDashboard";
import HRDashboard from '../../hr/pages/HRDashboard'
import InventoryDashboard from '../../inventory/pages/InventoryDashboard'
import SalesDashboard from '../../sales/pages/SalesDashboard'
import PurchaseDashboard from '../../purchase/pages/PurchaseDashboard'
import ManufacturingDashboard from '../../manufacturing/pages/ManufacturingDashboard'
import { useRoutePath } from "../../../hooks/useRoutePath";
import { dashboardFinanceApi } from '../../../api/account/dashboard/finance';
import { useGetInventoryDashboardQuery } from '../../../api/inventory';
import { formatCurrency } from '../../../utils/formatters';

export default function Dashboard() {
  const { buildPath } = useRoutePath();

  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
  const { accessibleModuleKeys = [] } = useOutletContext() || {}
  const currentUser = useAppSelector((state) => state.auth?.user ?? null)
  const selectedCompany = useAppSelector((state) => state.company.selectedCompany)

  const isSSOAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'company_admin'

  const { data: coData } = useGetDashboardMetricsQuery(
    companyId,
    { skip: !companyId || companyId === '000000' || !isSSOAdmin }
  )

  const isSuperAdmin = currentUser?.role === 'super_admin' || (typeof currentUser?.role === 'string' && currentUser.role.toLowerCase().includes('super'))

  const { canViewModule, isAdmin, isAccountant, isAuditor } = useRBAC()

  // --- New Finance Data ---
  const [financeData, setFinanceData] = useState(null)
  const [financeLoading, setFinanceLoading] = useState(false)
  useEffect(() => {
    if (isAdmin && companyId && companyId !== '000000') {
      const fetchFinance = async () => {
        setFinanceLoading(true)
        try {
          const res = await dashboardFinanceApi.getFinanceDashboard()
          if (res.success) {
            setFinanceData(res.data)
          }
        } catch (err) {
          console.error("Failed to fetch finance dashboard", err)
        } finally {
          setFinanceLoading(false)
        }
      }
      fetchFinance()
    }
  }, [isAdmin, companyId])

  // --- New Inventory Data ---
  const { data: inventoryData, isLoading: inventoryLoading } = useGetInventoryDashboardQuery(
    { companyId, role: typeof currentUser?.role === 'string' ? currentUser.role.toUpperCase() : 'EMPLOYEE' },
    { skip: !isAdmin || !companyId || companyId === '000000' }
  )
  
  const invMetrics = inventoryData?.metrics || []
  const totalItemsVal = invMetrics.find(m => m.label.toLowerCase().includes('total'))?.value || 0
  const lowStockVal = invMetrics.find(m => m.label.toLowerCase().includes('low'))?.value || 0
  const outOfStockVal = invMetrics.find(m => m.label.toLowerCase().includes('out'))?.value || 0

  const allModules = [
    { id: 'finance', name: 'Finance & Accounts', icon: Banknote, color: 'text-emerald-500', bg: 'bg-emerald-50', path: buildPath('accounts/dashboard') },
    { id: 'hr', name: 'HR & Employees', icon: Building2, color: 'text-purple-500', bg: 'bg-purple-50', path: buildPath('hr') },
    { id: 'inventory', name: 'Inventory Management', icon: Box, color: 'text-amber-500', bg: 'bg-amber-50', path: buildPath('inventory') },
    { id: 'sales', name: 'Sales & CRM', icon: ShoppingCart, color: 'text-indigo-500', bg: 'bg-indigo-50', path: buildPath('sales-crm') },
    { id: 'crm', name: 'Sales & CRM', icon: ShoppingCart, color: 'text-indigo-500', bg: 'bg-indigo-50', path: buildPath('sales-crm') },
    { id: 'purchase', name: 'Purchase Management', icon: Briefcase, color: 'text-rose-500', bg: 'bg-rose-50', path: buildPath('purchases') },
    { id: 'manufacturing', name: 'Manufacturing', icon: Factory, color: 'text-orange-500', bg: 'bg-orange-50', path: buildPath('manufacturing') },
  ]

  // Filter out duplicates (e.g. sales and crm map to same path)
  const allowedModules = allModules.filter(m => canViewModule(m.id)).filter((v, i, a) => a.findIndex(t => (t.path === v.path)) === i)

  const [activeModule, setActiveModule] = useState(null)

  useEffect(() => {
    if (allowedModules.length > 0 && !activeModule) {
      setActiveModule(allowedModules[0].id)
    }
  }, [allowedModules, activeModule])

  return (
    <div className="w-full px-6 lg:px-8 py-6 space-y-6 animate-fade-in pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2.5">
            <Building2 size={24} className="text-zinc-800" />
            <span>{!isAdmin ? 'Welcome back, ' + (currentUser?.name || 'User') : (selectedCompany?.name || 'Company Dashboard')}</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {!isAdmin ? 'Access your assigned modules and daily tasks.' : 'Performance analytics & operations summary'}
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          {isSuperAdmin && (
            <Link 
              to={buildPath('/super-admin/dashboard')} 
              className="h-9 px-3.5 text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all flex items-center gap-2 shadow-2xs"
            >
              <ShieldCheck size={15} className="text-zinc-500" />
              <span>Global Admin</span>
            </Link>
          )}
          {isAdmin && (
            <Link 
              to={buildPath('accounts/dashboard')} 
              className="h-9 px-3.5 text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all flex items-center gap-2 shadow-2xs"
            >
              <IndianRupee size={15} className="text-zinc-500" />
              <span>Finance Center</span>
            </Link>
          )}
        </div>
      </div>

      {!isAdmin ? (
        <div className="space-y-6">
          {allowedModules.length > 1 && (
            <div className="border-b border-zinc-200 mb-6">
              <nav className="flex gap-6 -mb-px overflow-x-auto">
                {allowedModules.map((mod) => (
                  <button
                    key={mod.id}
                    onClick={() => setActiveModule(mod.id)}
                    className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${activeModule === mod.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-zinc-400 hover:text-zinc-600'
                      }`}
                  >
                    {mod.name}
                  </button>
                ))}
              </nav>
            </div>
          )}

          <div className="mt-4">
            {activeModule === 'finance' && <FinanceDashboard />}
            {activeModule === 'hr' && <HRDashboard />}
            {activeModule === 'inventory' && <InventoryDashboard />}
            {(activeModule === 'sales' || activeModule === 'crm') && <SalesDashboard />}
            {activeModule === 'purchase' && <PurchaseDashboard />}
            {activeModule === 'manufacturing' && <ManufacturingDashboard />}
          </div>

          {allowedModules.length === 0 && (
            <div className="bg-white rounded-xl border border-dashed border-zinc-300 p-12 text-center flex flex-col items-center justify-center">
              <ShieldCheck size={48} className="text-zinc-300 mb-4" />
              <h3 className="text-base font-bold text-zinc-800">No Modules Assigned</h3>
              <p className="text-xs text-zinc-500 mt-2 max-w-sm">You currently do not have access to any modules. Please contact your company administrator to assign permissions to your account.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── 4 Stat Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Total Users */}
            <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs p-4 sm:p-5 transition-all hover:border-zinc-300">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Total Users</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  <Users size={16} />
                </div>
              </div>
              <p className="text-2xl font-bold text-zinc-900 tracking-tight">{coData?.users?.total ?? 0}</p>
              <div className="mt-2.5 flex items-center gap-1.5 text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full w-fit">
                <CheckCircle2 size={11} />
                <span>{coData?.users?.active ?? 0} Active accounts</span>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs p-4 sm:p-5 transition-all hover:border-zinc-300">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Active Sessions</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <Activity size={16} />
                </div>
              </div>
              <p className="text-2xl font-bold text-zinc-900 tracking-tight">{coData?.sessions?.active ?? 0}</p>
              <div className="mt-2.5 flex items-center gap-1.5 text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full w-fit">
                <ArrowUpRight size={11} />
                <span>Live Currently online</span>
              </div>
            </div>

            {/* Assigned Roles */}
            <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs p-4 sm:p-5 transition-all hover:border-zinc-300">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Assigned Roles</span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                  <UserCheck size={16} />
                </div>
              </div>
              <p className="text-2xl font-bold text-zinc-900 tracking-tight">{coData?.roles?.total ?? 0}</p>
              <div className="mt-2.5 flex items-center gap-1.5 text-[9px] font-semibold text-zinc-600 bg-zinc-100 border border-zinc-200/60 px-2 py-0.5 rounded-full w-fit">
                <span>Total configured roles</span>
              </div>
            </div>

            {/* Active Modules */}
            <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs p-4 sm:p-5 transition-all hover:border-zinc-300">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Active Modules</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <Layers size={16} />
                </div>
              </div>
              <p className="text-2xl font-bold text-zinc-900 tracking-tight">{coData?.modules?.active ?? 0}</p>
              <div className="mt-2.5 flex items-center gap-1.5 text-[9px] font-semibold text-zinc-600 bg-zinc-100 border border-zinc-200/60 px-2 py-0.5 rounded-full w-fit">
                <span>Out of {coData?.modules?.total ?? 0} provisioned</span>
              </div>
            </div>
          </div>

          {/* ── Available Modules Section ── */}
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-bold text-zinc-900 tracking-tight">Available Modules</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Select a module to access its dashboard and capabilities.</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-3.5">
              {Array.from(new Set([
                'dashboard',
                ...allModules.map(m => m.id).filter(id => id !== 'crm'),
                ...accessibleModuleKeys.map(k => (k === 'account' || k === 'accounting') ? 'finance' : k)
              ])).map((modKey) => {
                const knownMod = allModules.find(m => m.id === modKey);
                const config = knownMod || {
                  name: modKey === 'dashboard' ? 'Company Dashboard' : (modKey?.charAt(0)?.toUpperCase() + modKey?.slice(1) || ''),
                  icon: Layers,
                  color: 'text-zinc-500',
                  bg: 'bg-zinc-50',
                  path: modKey === 'dashboard' ? buildPath('company-dashboard') : buildPath('dashboard')
                };
                const Icon = config.icon;
                const isCurrentPage = modKey === 'dashboard';
                const isActive = isCurrentPage || accessibleModuleKeys.includes(modKey) ||
                  (modKey === 'finance' && (accessibleModuleKeys.includes('account') || accessibleModuleKeys.includes('accounting')));

                const cardInner = (
                  <>
                    <div className={`w-10 h-10 ${config.bg} rounded-xl flex items-center justify-center mb-2.5 transition-all shadow-2xs`}>
                      <Icon className={config.color} size={18} strokeWidth={1.75} />
                    </div>
                    <span className={`text-xs font-semibold text-center leading-snug line-clamp-2 ${isActive ? 'text-zinc-800' : 'text-zinc-400'}`}>
                      {config.name}
                    </span>
                    <div className={`mt-2.5 flex items-center gap-1 text-[8.5px] font-semibold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/60'
                        : 'text-zinc-500 bg-zinc-100 border border-zinc-200/60'
                    }`}>
                      {isActive ? <><CheckCircle2 size={10} /> Active</> : <><Lock size={10} /> Locked</>}
                    </div>
                  </>
                );

                const cardCls = `flex flex-col items-center justify-center p-4 bg-white rounded-xl border transition-all ${
                  isCurrentPage 
                    ? 'border-indigo-300 ring-2 ring-indigo-500/10 shadow-2xs' 
                    : isActive 
                    ? 'border-zinc-200/90 shadow-2xs hover:border-zinc-300 hover:shadow-sm cursor-pointer' 
                    : 'border-zinc-200/60 bg-zinc-50/60 opacity-65 grayscale cursor-not-allowed'
                }`;

                if (isActive && config.path) {
                  return (
                    <Link key={modKey} to={config.path} className={cardCls}>
                      {cardInner}
                    </Link>
                  );
                }

                return (
                  <div key={modKey} className={cardCls}>
                    {cardInner}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Business Metrics Overview ── */}
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-bold text-zinc-900 tracking-tight">Business Metrics Overview</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Financial performance and inventory health summary.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Financial Snapshot */}
              <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs p-5 flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-4 text-zinc-900">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Banknote size={16} />
                  </div>
                  <h4 className="text-sm font-bold tracking-tight">Financial Snapshot</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="p-3.5 bg-zinc-50/80 rounded-xl border border-zinc-200/80">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Cash Balance</p>
                    <p className="text-xl font-bold text-zinc-900 tracking-tight">
                      {financeLoading ? '...' : formatCurrency(financeData?.cashBalance)}
                    </p>
                  </div>

                  <div className="p-3.5 bg-zinc-50/80 rounded-xl border border-zinc-200/80">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Runway</p>
                    <p className="text-xl font-bold text-zinc-900 tracking-tight">
                      {financeLoading ? '...' : `${(financeData?.monthsOfCash || 0).toFixed(1)} Mo`}
                    </p>
                  </div>

                  <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Receivables</p>
                    <p className="text-xl font-bold text-blue-900 tracking-tight">
                      {financeLoading ? '...' : formatCurrency(financeData?.totalReceivables)}
                    </p>
                    {financeData?.overdueReceivables > 0 && (
                      <p className="text-[9px] font-semibold text-rose-600 mt-1.5 flex items-center gap-1">
                        <AlertTriangle size={11} /> {formatCurrency(financeData.overdueReceivables)} overdue
                      </p>
                    )}
                  </div>

                  <div className="p-3.5 bg-orange-50/60 rounded-xl border border-orange-100">
                    <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1">Payables</p>
                    <p className="text-xl font-bold text-orange-900 tracking-tight">
                      {financeLoading ? '...' : formatCurrency(financeData?.totalPayables)}
                    </p>
                    {financeData?.overduePayables > 0 && (
                      <p className="text-[9px] font-semibold text-rose-600 mt-1.5 flex items-center gap-1">
                        <AlertTriangle size={11} /> {formatCurrency(financeData.overduePayables)} overdue
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Inventory Snapshot */}
              <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs p-5 flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-4 text-zinc-900">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Package size={16} />
                  </div>
                  <h4 className="text-sm font-bold tracking-tight">Inventory Snapshot</h4>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="col-span-2 flex items-center justify-between p-3.5 bg-zinc-50/80 rounded-xl border border-zinc-200/80">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Items</p>
                      <p className="text-2xl font-bold text-zinc-900 tracking-tight">
                        {inventoryLoading ? '...' : totalItemsVal}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-zinc-200 shadow-2xs">
                      <Boxes size={20} className="text-zinc-400" />
                    </div>
                  </div>
                  
                  <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-100">
                    <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <AlertTriangle size={12} className="text-amber-600" />
                      <span>Low Stock</span>
                    </p>
                    <p className="text-xl font-bold text-amber-950 tracking-tight">
                      {inventoryLoading ? '...' : lowStockVal}
                    </p>
                    <p className="text-[9px] text-amber-700 font-medium mt-1">Needs restock</p>
                  </div>
                  
                  <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-100">
                    <p className="text-[10px] font-bold text-rose-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <TrendingDown size={12} className="text-rose-600" />
                      <span>Out of Stock</span>
                    </p>
                    <p className="text-xl font-bold text-rose-950 tracking-tight">
                      {inventoryLoading ? '...' : outOfStockVal}
                    </p>
                    <p className="text-[9px] text-rose-700 font-medium mt-1">Zero quantity</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Lower Section: Roles & Assignments + Organization Profile ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Roles & Assignments */}
            <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs flex flex-col overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Briefcase size={15} />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Roles & Assignments</h3>
                </div>
                <span className="px-2.5 py-1 text-[10px] font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  {coData?.roles?.total ?? 0} Total Roles
                </span>
              </div>
              <div className="p-0 flex-1 flex flex-col justify-center">
                {coData?.roles?.items?.length > 0 ? (
                  <ul className="divide-y divide-zinc-100 max-h-[220px] overflow-y-auto">
                    {coData.roles.items.map((role, idx) => (
                      <li key={idx} className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50/80 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-zinc-800 font-mono">{role.roleName}</span>
                        </div>
                        <span className="text-xs font-medium text-zinc-500 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-md">
                          {role.assignedUsers} Users
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-8 text-center text-xs text-zinc-500">No roles configured yet.</div>
                )}
              </div>
            </div>

            {/* Organization Profile */}
            <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Building2 size={15} />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Organization Profile</h3>
                </div>
                <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                  This overview dashboard provides a centralized view of your enterprise ecosystem.
                  Use the module portals above to access specific applications, configure roles, or manage users across the organization.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-2.5 bg-zinc-50/80 rounded-lg border border-zinc-200/80">
                  <span className="text-xs font-medium text-zinc-600">Primary Domain</span>
                  <span className="text-xs font-semibold text-zinc-900">{selectedCompany?.domain || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-zinc-50/80 rounded-lg border border-zinc-200/80">
                  <span className="text-xs font-medium text-zinc-600">Company Code</span>
                  <span className="text-xs font-bold font-mono text-indigo-600">{selectedCompany?.code || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-zinc-50/80 rounded-lg border border-zinc-200/80">
                  <span className="text-xs font-medium text-zinc-600">Global ID</span>
                  <span className="text-[11px] font-mono text-zinc-400 truncate max-w-[200px]" title={selectedCompany?.id}>
                    {selectedCompany?.id || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

