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
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight flex items-center gap-2.5">
            <Building2 size={24} className="text-zinc-800 dark:text-[#E6E8EE]" />
            <span>{!isAdmin ? 'Welcome back, ' + (currentUser?.name || 'User') : (selectedCompany?.name || 'Company Dashboard')}</span>
          </h1>
          <p className="text-sm text-zinc-500 dark:text-[#A0A6B5] mt-1">
            {!isAdmin ? 'Access your assigned modules and daily tasks.' : 'Performance analytics & operations summary'}
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          {isSuperAdmin && (
            <Link 
              to={buildPath('/super-admin/dashboard')} 
              className="h-9 px-3.5 text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 dark:hover:bg-[#222736] transition-all flex items-center gap-2 shadow-2xs"
            >
              <ShieldCheck size={15} className="text-zinc-500 dark:text-[#A0A6B5]" />
              <span>Global Admin</span>
            </Link>
          )}
          {isAdmin && (
            <Link 
              to={buildPath('accounts/dashboard')} 
              className="h-9 px-3.5 text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 dark:hover:bg-[#222736] transition-all flex items-center gap-2 shadow-2xs"
            >
              <IndianRupee size={15} className="text-zinc-500 dark:text-[#A0A6B5]" />
              <span>Finance Center</span>
            </Link>
          )}
        </div>
      </div>

      {!isAdmin ? (
        <div className="space-y-6">
          {allowedModules.length > 1 && (
            <div className="border-b border-zinc-200 dark:border-[#2A2F3D] mb-6">
              <nav className="flex gap-6 -mb-px overflow-x-auto">
                {allowedModules.map((mod) => (
                  <button
                    key={mod.id}
                    onClick={() => setActiveModule(mod.id)}
                    className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${activeModule === mod.id
                      ? 'border-primary dark:border-[#4C8DFF] text-primary dark:text-[#4C8DFF]'
                      : 'border-transparent text-zinc-400 dark:text-[#6B7184] hover:text-zinc-600 dark:hover:text-[#E6E8EE]'
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
            <div className="bg-white dark:bg-[#161922] rounded-xl border border-dashed border-zinc-300 dark:border-[#2A2F3D] p-12 text-center flex flex-col items-center justify-center">
              <ShieldCheck size={48} className="text-zinc-300 dark:text-[#6B7184] mb-4" />
              <h3 className="text-base font-bold text-zinc-800 dark:text-[#E6E8EE]">No Modules Assigned</h3>
              <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] mt-2 max-w-sm">You currently do not have access to any modules. Please contact your company administrator to assign permissions to your account.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── 4 Stat Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Total Users */}
            <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200/90 dark:border-[#2A2F3D] shadow-2xs p-4 sm:p-5 transition-all hover:border-zinc-300 dark:hover:border-[#3A4154]">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">Total Users</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Users size={16} />
                </div>
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight">{coData?.users?.total ?? 0}</p>
              <div className="mt-2.5 flex items-center gap-1.5 text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60 px-2 py-0.5 rounded-full w-fit">
                <CheckCircle2 size={11} />
                <span>{coData?.users?.active ?? 0} Active accounts</span>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200/90 dark:border-[#2A2F3D] shadow-2xs p-4 sm:p-5 transition-all hover:border-zinc-300 dark:hover:border-[#3A4154]">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">Active Sessions</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Activity size={16} />
                </div>
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight">{coData?.sessions?.active ?? 0}</p>
              <div className="mt-2.5 flex items-center gap-1.5 text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60 px-2 py-0.5 rounded-full w-fit">
                <ArrowUpRight size={11} />
                <span>Live Currently online</span>
              </div>
            </div>

            {/* Assigned Roles */}
            <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200/90 dark:border-[#2A2F3D] shadow-2xs p-4 sm:p-5 transition-all hover:border-zinc-300 dark:hover:border-[#3A4154]">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">Assigned Roles</span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                  <UserCheck size={16} />
                </div>
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight">{coData?.roles?.total ?? 0}</p>
              <div className="mt-2.5 flex items-center gap-1.5 text-[9px] font-semibold text-zinc-600 dark:text-[#A0A6B5] bg-zinc-100 dark:bg-[#1D212C] border border-zinc-200/60 dark:border-[#2A2F3D] px-2 py-0.5 rounded-full w-fit">
                <span>Total configured roles</span>
              </div>
            </div>

            {/* Active Modules */}
            <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200/90 dark:border-[#2A2F3D] shadow-2xs p-4 sm:p-5 transition-all hover:border-zinc-300 dark:hover:border-[#3A4154]">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">Active Modules</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <Layers size={16} />
                </div>
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight">{coData?.modules?.active ?? 0}</p>
              <div className="mt-2.5 flex items-center gap-1.5 text-[9px] font-semibold text-zinc-600 dark:text-[#A0A6B5] bg-zinc-100 dark:bg-[#1D212C] border border-zinc-200/60 dark:border-[#2A2F3D] px-2 py-0.5 rounded-full w-fit">
                <span>Out of {coData?.modules?.total ?? 0} provisioned</span>
              </div>
            </div>
          </div>

          {/* ── Available Modules Section ── */}
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight">Available Modules</h3>
              <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] mt-0.5">Select a module to access its dashboard and capabilities.</p>
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
                  color: 'text-zinc-500 dark:text-[#A0A6B5]',
                  bg: 'bg-zinc-50 dark:bg-[#1D212C]',
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
                    <span className={`text-xs font-semibold text-center leading-snug line-clamp-2 ${isActive ? 'text-zinc-800 dark:text-[#E6E8EE]' : 'text-zinc-400 dark:text-[#6B7184]'}`}>
                      {config.name}
                    </span>
                    <div className={`mt-2.5 flex items-center gap-1 text-[8.5px] font-semibold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60'
                        : 'text-zinc-500 dark:text-[#A0A6B5] bg-zinc-100 dark:bg-[#1D212C] border border-zinc-200/60 dark:border-[#2A2F3D]'
                    }`}>
                      {isActive ? <><CheckCircle2 size={10} /> Active</> : <><Lock size={10} /> Locked</>}
                    </div>
                  </>
                );

                const cardCls = `flex flex-col items-center justify-center p-4 bg-white dark:bg-[#161922] rounded-xl border transition-all ${
                  isCurrentPage 
                    ? 'border-indigo-300 dark:border-indigo-500/60 ring-2 ring-indigo-500/10 dark:ring-indigo-500/30 shadow-2xs' 
                    : isActive 
                    ? 'border-zinc-200/90 dark:border-[#2A2F3D] shadow-2xs hover:border-zinc-300 dark:hover:border-[#3A4154] hover:shadow-sm cursor-pointer' 
                    : 'border-zinc-200/60 dark:border-[#2A2F3D] bg-zinc-50/60 dark:bg-[#1D212C]/40 opacity-65 grayscale cursor-not-allowed'
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
              <h3 className="text-base font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight">Business Metrics Overview</h3>
              <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] mt-0.5">Financial performance and inventory health summary.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Financial Snapshot */}
              <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200/90 dark:border-[#2A2F3D] shadow-2xs p-5 flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-4 text-zinc-900 dark:text-[#E6E8EE]">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Banknote size={16} />
                  </div>
                  <h4 className="text-sm font-bold tracking-tight">Financial Snapshot</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="p-3.5 bg-zinc-50/80 dark:bg-[#1D212C] rounded-xl border border-zinc-200/80 dark:border-[#2A2F3D]">
                    <p className="text-[10px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider mb-1">Cash Balance</p>
                    <p className="text-xl font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight">
                      {financeLoading ? '...' : formatCurrency(financeData?.cashBalance)}
                    </p>
                  </div>

                  <div className="p-3.5 bg-zinc-50/80 dark:bg-[#1D212C] rounded-xl border border-zinc-200/80 dark:border-[#2A2F3D]">
                    <p className="text-[10px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider mb-1">Runway</p>
                    <p className="text-xl font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight">
                      {financeLoading ? '...' : `${(financeData?.monthsOfCash || 0).toFixed(1)} Mo`}
                    </p>
                  </div>

                  <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50">
                    <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Receivables</p>
                    <p className="text-xl font-bold text-blue-900 dark:text-[#E6E8EE] tracking-tight">
                      {financeLoading ? '...' : formatCurrency(financeData?.totalReceivables)}
                    </p>
                    {financeData?.overdueReceivables > 0 && (
                      <p className="text-[9px] font-semibold text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1">
                        <AlertTriangle size={11} /> {formatCurrency(financeData.overdueReceivables)} overdue
                      </p>
                    )}
                  </div>

                  <div className="p-3.5 bg-orange-50/60 dark:bg-orange-950/30 rounded-xl border border-orange-100 dark:border-orange-900/50">
                    <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1">Payables</p>
                    <p className="text-xl font-bold text-orange-900 dark:text-[#E6E8EE] tracking-tight">
                      {financeLoading ? '...' : formatCurrency(financeData?.totalPayables)}
                    </p>
                    {financeData?.overduePayables > 0 && (
                      <p className="text-[9px] font-semibold text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1">
                        <AlertTriangle size={11} /> {formatCurrency(financeData.overduePayables)} overdue
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Inventory Snapshot */}
              <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200/90 dark:border-[#2A2F3D] shadow-2xs p-5 flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-4 text-zinc-900 dark:text-[#E6E8EE]">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Package size={16} />
                  </div>
                  <h4 className="text-sm font-bold tracking-tight">Inventory Snapshot</h4>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="col-span-2 flex items-center justify-between p-3.5 bg-zinc-50/80 dark:bg-[#1D212C] rounded-xl border border-zinc-200/80 dark:border-[#2A2F3D]">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider mb-1">Total Items</p>
                      <p className="text-2xl font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight">
                        {inventoryLoading ? '...' : totalItemsVal}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-white dark:bg-[#161922] rounded-lg flex items-center justify-center border border-zinc-200 dark:border-[#2A2F3D] shadow-2xs">
                      <Boxes size={20} className="text-zinc-400 dark:text-[#6B7184]" />
                    </div>
                  </div>
                  
                  <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/50">
                    <p className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <AlertTriangle size={12} className="text-amber-600 dark:text-amber-400" />
                      <span>Low Stock</span>
                    </p>
                    <p className="text-xl font-bold text-amber-950 dark:text-[#E6E8EE] tracking-tight">
                      {inventoryLoading ? '...' : lowStockVal}
                    </p>
                    <p className="text-[9px] text-amber-700 dark:text-amber-400 font-medium mt-1">Needs restock</p>
                  </div>
                  
                  <div className="p-3.5 bg-rose-50/60 dark:bg-rose-950/30 rounded-xl border border-rose-100 dark:border-rose-900/50">
                    <p className="text-[10px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <TrendingDown size={12} className="text-rose-600 dark:text-rose-400" />
                      <span>Out of Stock</span>
                    </p>
                    <p className="text-xl font-bold text-rose-950 dark:text-[#E6E8EE] tracking-tight">
                      {inventoryLoading ? '...' : outOfStockVal}
                    </p>
                    <p className="text-[9px] text-rose-700 dark:text-rose-400 font-medium mt-1">Zero quantity</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Lower Section: Roles & Assignments + Organization Profile ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Roles & Assignments */}
            <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200/90 dark:border-[#2A2F3D] shadow-2xs flex flex-col overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Briefcase size={15} />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight">Roles & Assignments</h3>
                </div>
                <span className="px-2.5 py-1 text-[10px] font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/60">
                  {coData?.roles?.total ?? 0} Total Roles
                </span>
              </div>
              <div className="p-0 flex-1 flex flex-col justify-center">
                {coData?.roles?.items?.length > 0 ? (
                  <ul className="divide-y divide-zinc-100 dark:divide-[#2A2F3D] max-h-[220px] overflow-y-auto">
                    {coData.roles.items.map((role, idx) => (
                      <li key={idx} className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50/80 dark:hover:bg-[#222736] transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-zinc-800 dark:text-[#E6E8EE] font-mono">{role.roleName}</span>
                        </div>
                        <span className="text-xs font-medium text-zinc-500 dark:text-[#A0A6B5] bg-zinc-100 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] px-2 py-0.5 rounded-md">
                          {role.assignedUsers} Users
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-8 text-center text-xs text-zinc-500 dark:text-[#A0A6B5]">No roles configured yet.</div>
                )}
              </div>
            </div>

            {/* Organization Profile */}
            <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200/90 dark:border-[#2A2F3D] shadow-2xs p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Building2 size={15} />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight">Organization Profile</h3>
                </div>
                <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] mb-4 leading-relaxed">
                  This overview dashboard provides a centralized view of your enterprise ecosystem.
                  Use the module portals above to access specific applications, configure roles, or manage users across the organization.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-2.5 bg-zinc-50/80 dark:bg-[#1D212C] rounded-lg border border-zinc-200/80 dark:border-[#2A2F3D]">
                  <span className="text-xs font-medium text-zinc-600 dark:text-[#A0A6B5]">Primary Domain</span>
                  <span className="text-xs font-semibold text-zinc-900 dark:text-[#E6E8EE]">{selectedCompany?.domain || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-zinc-50/80 dark:bg-[#1D212C] rounded-lg border border-zinc-200/80 dark:border-[#2A2F3D]">
                  <span className="text-xs font-medium text-zinc-600 dark:text-[#A0A6B5]">Company Code</span>
                  <span className="text-xs font-bold font-mono text-indigo-600 dark:text-[#4C8DFF]">{selectedCompany?.code || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-zinc-50/80 dark:bg-[#1D212C] rounded-lg border border-zinc-200/80 dark:border-[#2A2F3D]">
                  <span className="text-xs font-medium text-zinc-600 dark:text-[#A0A6B5]">Global ID</span>
                  <span className="text-[11px] font-mono text-zinc-400 dark:text-[#6B7184] truncate max-w-[200px]" title={selectedCompany?.id}>
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

