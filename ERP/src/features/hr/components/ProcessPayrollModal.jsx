import React, { useState } from 'react'
import { X, IndianRupee, AlertCircle } from 'lucide-react'
import { useParams } from 'react-router-dom'

export default function ProcessPayrollModal({ isOpen, onClose, onSubmit }) {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM
  const [notes, setNotes] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      companyId,
      period,
      notes
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
      <div className="card w-full max-w-md animate-slide-up flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-zinc-100">
          <h2 className="text-xl font-bold text-zinc-800">Process Payroll</h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-50 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-amber-50 text-amber-800 p-4 rounded-xl flex gap-3 text-sm border border-amber-100">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="font-bold mb-1">Confirm Processing</p>
              <p>This will calculate salaries, deduct taxes, apply allowances, and generate payslips for all active employees for the selected period.</p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Payroll Period</label>
            <input 
              type="month" 
              className="input-field" 
              value={period}
              onChange={e => setPeriod(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Processing Notes (Optional)</label>
            <textarea 
              className="input-field min-h-[64px]" 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="E.g., Includes annual bonus payout"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20">
              <IndianRupee size={16} /> Run Payroll
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

