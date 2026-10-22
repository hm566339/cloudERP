import { TableRowSkeleton, TableSkeleton, ListSkeleton } from '../../../components/common/SkeletonLoader';
import React from 'react'
import { Factory, Cog, Activity, AlertTriangle } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useGetProductionSchedulesQuery } from '../../../api/inventory'
import { useRBAC } from '../../../utils/rbac'

export default function ManufacturingDashboard() {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
  const { canViewModule } = useRBAC()
  const { data: schedules = [], isLoading } = useGetProductionSchedulesQuery(companyId)

  const activeOrders = schedules.filter(s => {
    const st = (s.status || '').toUpperCase()
    return st === 'IN_PROGRESS' || st === 'IN PROGRESS' || st === 'RELEASED'
  }).length

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header mb-0">
        <div>
          <h1 className="page-title">Manufacturing Dashboard</h1>
          <p className="page-subtitle">Overview of production lines and overall equipment effectiveness (OEE)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="kpi-card flex items-center justify-between p-4">
          <div>
            <p className="kpi-label">Active Orders</p>
            <p className="kpi-value text-2xl mt-1">{activeOrders}</p>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Factory size={24} />
          </div>
        </div>
        <div className="kpi-card flex items-center justify-between p-4">
          <div>
            <p className="kpi-label">OEE Rating</p>
            <p className="kpi-value text-2xl mt-1 text-emerald-600 dark:text-emerald-400">87.5%</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Cog size={24} />
          </div>
        </div>
        <div className="kpi-card flex items-center justify-between p-4">
          <div>
            <p className="kpi-label">Production Yield</p>
            <p className="kpi-value text-2xl mt-1 text-blue-600 dark:text-blue-400">96.2%</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Activity size={24} />
          </div>
        </div>
        <div className="kpi-card flex items-center justify-between p-4">
          <div>
            <p className="kpi-label">Equipment Issues</p>
            <p className="kpi-value text-2xl mt-1 text-amber-600 dark:text-amber-400">2</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(canViewModule('mfg_production') || canViewModule('manufacturing')) && (
          <div className="card dark:bg-[#161922] dark:border-[#2A2F3D] p-4 lg:col-span-2">
            <h3 className="font-bold text-zinc-900 dark:text-[#E6E8EE] mb-4">Active Production Lines</h3>
            <div className="space-y-4 relative min-h-[80px]">
              {isLoading && <div className="p-6 w-full"><TableSkeleton columns={5} rows={3} /></div>}
              {schedules.filter(s => {
                const st = (s.status || '').toUpperCase()
                return st === 'IN_PROGRESS' || st === 'IN PROGRESS' || st === 'RELEASED'
              }).map((line, i) => {
                const prod = line.producedQuantity !== undefined ? Number(line.producedQuantity) : (Number(line.produced) || 0)
                const target = line.plannedQuantity !== undefined ? Number(line.plannedQuantity) : (Number(line.targetQty) || 0)
                const progress = target > 0 ? Math.min(Math.round((prod / target) * 100), 100) : 0
                const productName = line.bom?.name || line.product || line.productionOrderNo || 'Production Line'
                return (
                  <div key={i} className="p-4 border border-zinc-100 dark:border-[#2A2F3D] rounded-lg bg-zinc-50/40 dark:bg-[#1D212C]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-zinc-800 dark:text-[#E6E8EE]">{productName}</span>
                      <span className="badge badge-success">Running</span>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-500 dark:text-[#A0A6B5] mb-1">
                      <span>Progress</span>
                      <span className="font-medium text-zinc-700 dark:text-[#E6E8EE]">{progress}%</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-[#2A2F3D] rounded-full h-1.5">
                      <div className="bg-primary/10 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {(canViewModule('mfg_audit') || canViewModule('manufacturing')) && (
          <div className="card p-4 bg-zinc-50 dark:bg-[#161922] dark:border-[#2A2F3D] lg:col-span-1">
            <h3 className="font-bold text-zinc-900 dark:text-[#E6E8EE] mb-4">Maintenance Alerts</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-white dark:bg-[#1D212C] rounded-lg shadow-sm border border-rose-100 dark:border-rose-900/40">
                <AlertTriangle size={18} className="text-rose-500 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-[#E6E8EE]">Conveyor Belt B3</p>
                  <p className="text-xs text-zinc-500 dark:text-[#A0A6B5]">Vibration threshold exceeded</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white dark:bg-[#1D212C] rounded-lg shadow-sm border border-amber-100 dark:border-amber-900/40">
                <AlertTriangle size={18} className="text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-[#E6E8EE]">Oven T2 Filtration</p>
                  <p className="text-xs text-zinc-500 dark:text-[#A0A6B5]">Routine filter replacement due</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

