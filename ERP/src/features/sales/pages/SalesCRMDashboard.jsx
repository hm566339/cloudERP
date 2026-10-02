import React from 'react'
import { TrendingUp, Users, FileText, ShoppingCart, MessageSquare, LineChart } from 'lucide-react'

export default function SalesCRMDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Sales & CRM Dashboard
          </h1>
          <p className="text-xs text-zinc-500">
            Overview of customer relationships, sales pipelines, and performance analytics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Customers */}
        <div className="card p-4 -500">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">
              Total Customers
            </span>
            <Users size={16} className="text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-zinc-900">
            1,248
          </p>
        </div>

        {/* Active Leads */}
        <div className="card p-4 -500">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">
              Active Leads
            </span>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-zinc-900">
            342
          </p>
        </div>

        {/* Total Sales */}
        <div className="card p-4 -500">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">
              Sales Volume (MTD)
            </span>
            <ShoppingCart size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-zinc-900"> ₹45,200
          </p>
        </div>
      </div>

      <div className="card p-4 min-h-[240px]">
        <h3 className="text-sm font-bold text-zinc-800 mb-4">Pipeline Analytics</h3>
        <div className="flex items-center justify-center h-[160px] border border-dashed border-zinc-200 rounded-lg bg-zinc-50">
           <p className="text-zinc-400 text-sm flex items-center gap-2">
             <LineChart size={18} />
             Analytics Chart Placeholder
           </p>
        </div>
      </div>
    </div>
  )
}
