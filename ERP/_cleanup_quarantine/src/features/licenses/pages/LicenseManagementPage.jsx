import React from 'react'
import { Key, Plus, ShieldCheck, Search, Activity, Building2 } from 'lucide-react'

export default function LicenseManagementPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="page-header border-none mb-0 pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Key className="text-indigo-600" size={24} />
            License Management
          </h1>
          <p className="page-subtitle">Generate, assign, and track multi-tenant licenses and limits.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-primary">
            <Plus size={16} /> Generate License
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-semibold text-zinc-800">Active Licenses</h3>
          </div>
          <p className="text-3xl font-display font-bold text-zinc-900 mt-4">14</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <Activity size={20} />
            </div>
            <h3 className="font-semibold text-zinc-800">Expiring Soon</h3>
          </div>
          <p className="text-3xl font-display font-bold text-zinc-900 mt-4">2</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Building2 size={20} />
            </div>
            <h3 className="font-semibold text-zinc-800">Total Provisioned</h3>
          </div>
          <p className="text-3xl font-display font-bold text-zinc-900 mt-4">25</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-zinc-900">License Allocation</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              type="text" 
              placeholder="Search licenses..." 
              className="pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>

        <div className="text-center py-12 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50">
          <Key className="mx-auto text-zinc-300 mb-3" size={32} />
          <h3 className="text-sm font-semibold text-zinc-700">No active licenses found</h3>
          <p className="text-xs text-zinc-500 mt-1">Generate a new license key to get started.</p>
          <button className="mt-4 btn-primary mx-auto">
            <Plus size={16} /> Generate License
          </button>
        </div>
      </div>
    </div>
  )
}
