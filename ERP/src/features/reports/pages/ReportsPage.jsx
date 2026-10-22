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
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <IndianRupee size={20} />
            </div>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Finance & Accounting</h3>
          </div>
          <div className="space-y-2">
            <Link to={buildPath('/accounts/reports/tb')} className="flex justify-between items-center p-3 hover:bg-zinc-50 dark:hover:bg-hover-dark/40 rounded-lg border border-transparent hover:border-zinc-100 dark:hover:border-border-dark transition-colors group">
              <div className="flex items-center gap-3"><FileText size={16} className="text-zinc-400 dark:text-zinc-500" /><span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Trial Balance</span></div>
              <ExternalLink size={16} className="text-zinc-300 dark:text-zinc-600 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors" />
            </Link>
            <Link to={buildPath('/accounts/finance/ledger')} className="flex justify-between items-center p-3 hover:bg-zinc-50 dark:hover:bg-hover-dark/40 rounded-lg border border-transparent hover:border-zinc-100 dark:hover:border-border-dark transition-colors group">
              <div className="flex items-center gap-3"><FileText size={16} className="text-zinc-400 dark:text-zinc-500" /><span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">General Ledger</span></div>
              <ExternalLink size={16} className="text-zinc-300 dark:text-zinc-600 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors" />
            </Link>
            <Link to={buildPath('/accounts/reports/pl')} className="flex justify-between items-center p-3 hover:bg-zinc-50 dark:hover:bg-hover-dark/40 rounded-lg border border-transparent hover:border-zinc-100 dark:hover:border-border-dark transition-colors group">
              <div className="flex items-center gap-3"><FileText size={16} className="text-zinc-400 dark:text-zinc-500" /><span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Profit & Loss Statement (YTD)</span></div>
              <ExternalLink size={16} className="text-zinc-300 dark:text-zinc-600 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors" />
            </Link>
            <Link to={buildPath('/accounts/reports/bs')} className="flex justify-between items-center p-3 hover:bg-zinc-50 dark:hover:bg-hover-dark/40 rounded-lg border border-transparent hover:border-zinc-100 dark:hover:border-border-dark transition-colors group">
              <div className="flex items-center gap-3"><FileText size={16} className="text-zinc-400 dark:text-zinc-500" /><span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Balance Sheet</span></div>
              <ExternalLink size={16} className="text-zinc-300 dark:text-zinc-600 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors" />
            </Link>
            <Link to={buildPath('/accounts/reports/receivables')} className="flex justify-between items-center p-3 hover:bg-zinc-50 dark:hover:bg-hover-dark/40 rounded-lg border border-transparent hover:border-zinc-100 dark:hover:border-border-dark transition-colors group">
              <div className="flex items-center gap-3"><FileText size={16} className="text-zinc-400 dark:text-zinc-500" /><span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">A/R Aging Report</span></div>
              <ExternalLink size={16} className="text-zinc-300 dark:text-zinc-600 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors" />
            </Link>
            <Link to={buildPath('/accounts/reports/payables')} className="flex justify-between items-center p-3 hover:bg-zinc-50 dark:hover:bg-hover-dark/40 rounded-lg border border-transparent hover:border-zinc-100 dark:hover:border-border-dark transition-colors group">
              <div className="flex items-center gap-3"><FileText size={16} className="text-zinc-400 dark:text-zinc-500" /><span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">A/P Aging Report</span></div>
              <ExternalLink size={16} className="text-zinc-300 dark:text-zinc-600 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors" />
            </Link>
          </div>
        </div>

        {/* HR Reports */}
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users size={20} />
            </div>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">HR & Payroll</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 hover:bg-zinc-50 dark:hover:bg-hover-dark/40 rounded-lg border border-transparent hover:border-zinc-100 dark:hover:border-border-dark transition-colors">
              <div className="flex items-center gap-3"><FileText size={16} className="text-zinc-400 dark:text-zinc-500" /><span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Payroll Disbursement Report</span></div>
              <button className="text-primary dark:text-blue-400 hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"><Download size={16} /></button>
            </div>
            <div className="flex justify-between items-center p-3 hover:bg-zinc-50 dark:hover:bg-hover-dark/40 rounded-lg border border-transparent hover:border-zinc-100 dark:hover:border-border-dark transition-colors">
              <div className="flex items-center gap-3"><FileText size={16} className="text-zinc-400 dark:text-zinc-500" /><span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Employee Attendance Summary</span></div>
              <button className="text-primary dark:text-blue-400 hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"><Download size={16} /></button>
            </div>
          </div>
        </div>

        {/* Sales Reports */}
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Sales & CRM</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 hover:bg-zinc-50 dark:hover:bg-hover-dark/40 rounded-lg border border-transparent hover:border-zinc-100 dark:hover:border-border-dark transition-colors">
              <div className="flex items-center gap-3"><FileText size={16} className="text-zinc-400 dark:text-zinc-500" /><span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Sales Order Pipeline</span></div>
              <button className="text-primary dark:text-blue-400 hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"><Download size={16} /></button>
            </div>
            <div className="flex justify-between items-center p-3 hover:bg-zinc-50 dark:hover:bg-hover-dark/40 rounded-lg border border-transparent hover:border-zinc-100 dark:hover:border-border-dark transition-colors">
              <div className="flex items-center gap-3"><FileText size={16} className="text-zinc-400 dark:text-zinc-500" /><span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Customer Lifetime Value (LTV) Analysis</span></div>
              <button className="text-primary dark:text-blue-400 hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"><Download size={16} /></button>
            </div>
          </div>
        </div>

        {/* Manufacturing Reports */}
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Calendar size={20} />
            </div>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Manufacturing & Inventory</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 hover:bg-zinc-50 dark:hover:bg-hover-dark/40 rounded-lg border border-transparent hover:border-zinc-100 dark:hover:border-border-dark transition-colors">
              <div className="flex items-center gap-3"><FileText size={16} className="text-zinc-400 dark:text-zinc-500" /><span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">OEE Performance Analytics</span></div>
              <button className="text-primary dark:text-blue-400 hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"><Download size={16} /></button>
            </div>
            <div className="flex justify-between items-center p-3 hover:bg-zinc-50 dark:hover:bg-hover-dark/40 rounded-lg border border-transparent hover:border-zinc-100 dark:hover:border-border-dark transition-colors">
              <div className="flex items-center gap-3"><FileText size={16} className="text-zinc-400 dark:text-zinc-500" /><span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Low Stock / Reorder Point Alert Report</span></div>
              <button className="text-primary dark:text-blue-400 hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"><Download size={16} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

