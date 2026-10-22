import React from 'react'
import { TrendingUp, Users, FileText, ShoppingCart, MessageSquare, LineChart } from 'lucide-react'

export default function SalesCRMDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-[#E6E8EE]">
            Sales & CRM Dashboard
          </h1>
          <p className="text-xs text-zinc-500 dark:text-[#A0A6B5]">
            Overview of customer relationships, sales pipelines, and performance analytics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Customers */}
        <div className="card dark:bg-[#161922] dark:border-[#2A2F3D] p-4 -500">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-widest">
              Total Customers
            </span>
            <Users size={16} className="text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-[#E6E8EE]">
            1,248
          </p>
        </div>

        {/* Active Leads */}
        <div className="card dark:bg-[#161922] dark:border-[#2A2F3D] p-4 -500">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-widest">
              Active Leads
            </span>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-[#E6E8EE]">
            342
          </p>
        </div>

        {/* Total Sales */}
        <div className="card dark:bg-[#161922] dark:border-[#2A2F3D] p-4 -500">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-widest">
              Sales Volume (MTD)
            </span>
            <ShoppingCart size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-[#E6E8EE]"> ₹45,200
          </p>
        </div>
      </div>

      <div className="card dark:bg-[#161922] dark:border-[#2A2F3D] p-4 min-h-[240px]">
        <h3 className="text-sm font-bold text-zinc-800 dark:text-[#E6E8EE] mb-4">Pipeline Analytics</h3>
        <div className="flex items-center justify-center h-[160px] border border-dashed border-zinc-200 dark:border-[#2A2F3D] rounded-lg bg-zinc-50 dark:bg-[#1D212C]">
           <p className="text-zinc-400 dark:text-[#A0A6B5] text-sm flex items-center gap-2">
             <LineChart size={18} />
             Analytics Chart Placeholder
           </p>
        </div>
      </div>
    </div>
  )
}
