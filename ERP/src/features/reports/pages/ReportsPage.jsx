import React, { useState, useEffect } from 'react'
import { FileText, Download, TrendingUp, Users, IndianRupee, Calendar, ExternalLink } from 'lucide-react'
import { useParams, Link } from 'react-router-dom'
import { useRoutePath } from '../../../hooks/useRoutePath'
import { reportsApi } from '../../../api/account'

export default function ReportsPage() {
  const { buildPath } = useRoutePath();

  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyId;
  const [reports, setReports] = useState(null)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await reportsApi.getFinancialReports(companyId)
        setReports(data)
      } catch (error) {
        console.error('API getFinancialReports failed', error)
      }
    }
    fetchReports()
  }, [companyId])
  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header mb-0">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Generate and download system-wide reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Finance Reports */}
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee size={20} />
            </div>
            <h3 className="font-bold text-zinc-900">Finance & Accounting</h3>
          </div>
          <div className="space-y-2">
            <Link to={buildPath('/accounts/reports/tb')} className="flex justify-between items-center p-3 hover:bg-zinc-50 rounded-lg border border-transparent hover:border-zinc-100 transition-colors group">
              <div className="flex items-center gap-3"><FileText size={16} className="text-zinc-400" /><span className="text-sm font-medium text-zinc-700">Trial Balance</span></div>
              <ExternalLink size={16} className="text-zinc-300 group-hover:text-primary transition-colors" />
            </Link>
            <Link to={buildPath('/accounts/finance/ledger')} className="flex justify-between items-center p-3 hover:bg-zinc-50 rounded-lg border border-transparent hover:border-zinc-100 transition-colors group">
              <div className="flex items-center gap-3"><FileText size={16} className="text-zinc-400" /><span className="text-sm font-medium text-zinc-700">General Ledger</span></div>
              <ExternalLink size={16} className="text-zinc-300 group-hover:text-primary transition-colors" />
            </Link>
            <Link to={buildPath('/accounts/reports/pl')} className="flex justify-between items-center p-3 hover:bg-zinc-50 rounded-lg border border-transparent hover:border-zinc-100 transition-colors group">
              <div className="flex items-center gap-3"><FileText size={16} className="text-zinc-400" /><span className="text-sm font-medium text-zinc-700">Profit & Loss Statement (YTD)</span></div>
              <ExternalLink size={16} className="text-zinc-300 group-hover:text-primary transition-colors" />
            </Link>
            <Link to={buildPath('/accounts/reports/bs')} className="flex justify-between items-center p-3 hover:bg-zinc-50 rounded-lg border border-transparent hover:border-zinc-100 transition-colors group">
              <div className="flex items-center gap-3"><FileText size={16} className="text-zinc-400" /><span className="text-sm font-medium text-zinc-700">Balance Sheet</span></div>
              <ExternalLink size={16} className="text-zinc-300 group-hover:text-primary transition-colors" />
            </Link>
            <Link to={buildPath('/accounts/reports/receivables')} className="flex justify-between items-center p-3 hover:bg-zinc-50 rounded-lg border border-transparent hover:border-zinc-100 transition-colors group">
              <div className="flex items-center gap-3"><FileText size={16} className="text-zinc-400" /><span className="text-sm font-medium text-zinc-700">A/R Aging Report</span></div>
              <ExternalLink size={16} className="text-zinc-300 group-hover:text-primary transition-colors" />
            </Link>
            <Link to={buildPath('/accounts/reports/payables')} className="flex justify-between items-center p-3 hover:bg-zinc-50 rounded-lg border border-transparent hover:border-zinc-100 transition-colors group">
              <div className="flex items-center gap-3"><FileText size={16} className="text-zinc-400" /><span className="text-sm font-medium text-zinc-700">A/P Aging Report</span></div>
              <ExternalLink size={16} className="text-zinc-300 group-hover:text-primary transition-colors" />
            </Link>
          </div>
        </div>

        {/* HR Reports */}
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={20} />
            </div>
            <h3 className="font-bold text-zinc-900">HR & Payroll</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 hover:bg-zinc-50 rounded-lg border border-transparent hover:border-zinc-100 transition-colors">
              <div className="flex items-center gap-3"><FileText size={16} className="text-zinc-400" /><span className="text-sm font-medium text-zinc-700">Payroll Disbursement Report</span></div>
              <button className="text-primary hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors"><Download size={16} /></button>
            </div>
            <div className="flex justify-between items-center p-3 hover:bg-zinc-50 rounded-lg border border-transparent hover:border-zinc-100 transition-colors">
              <div className="flex items-center gap-3"><FileText size={16} className="text-zinc-400" /><span className="text-sm font-medium text-zinc-700">Employee Attendance Summary</span></div>
              <button className="text-primary hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors"><Download size={16} /></button>
            </div>
          </div>
        </div>

        {/* Sales Reports */}
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <h3 className="font-bold text-zinc-900">Sales & CRM</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 hover:bg-zinc-50 rounded-lg border border-transparent hover:border-zinc-100 transition-colors">
              <div className="flex items-center gap-3"><FileText size={16} className="text-zinc-400" /><span className="text-sm font-medium text-zinc-700">Sales Order Pipeline</span></div>
              <button className="text-primary hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors"><Download size={16} /></button>
            </div>
            <div className="flex justify-between items-center p-3 hover:bg-zinc-50 rounded-lg border border-transparent hover:border-zinc-100 transition-colors">
              <div className="flex items-center gap-3"><FileText size={16} className="text-zinc-400" /><span className="text-sm font-medium text-zinc-700">Customer Lifetime Value (LTV) Analysis</span></div>
              <button className="text-primary hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors"><Download size={16} /></button>
            </div>
          </div>
        </div>

        {/* Manufacturing Reports */}
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar size={20} />
            </div>
            <h3 className="font-bold text-zinc-900">Manufacturing & Inventory</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 hover:bg-zinc-50 rounded-lg border border-transparent hover:border-zinc-100 transition-colors">
              <div className="flex items-center gap-3"><FileText size={16} className="text-zinc-400" /><span className="text-sm font-medium text-zinc-700">OEE Performance Analytics</span></div>
              <button className="text-primary hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors"><Download size={16} /></button>
            </div>
            <div className="flex justify-between items-center p-3 hover:bg-zinc-50 rounded-lg border border-transparent hover:border-zinc-100 transition-colors">
              <div className="flex items-center gap-3"><FileText size={16} className="text-zinc-400" /><span className="text-sm font-medium text-zinc-700">Low Stock / Reorder Point Alert Report</span></div>
              <button className="text-primary hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors"><Download size={16} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

