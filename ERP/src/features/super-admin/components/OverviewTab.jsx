import React from 'react';
import {
  Info,
  Check,
  Copy,
  Activity,
  Zap,
  Building2,
  Users,
  Layers,
  ShieldCheck,
  ScrollText,
  ChevronRight,
} from 'lucide-react';
import DetailItem from './DetailItem';

export default function OverviewTab({
  org,
  organizationId,
  linkedCompanies,
  handleTabChange,
  handleCopyId,
  copiedId,
  buildPath,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Organization Details Card (7 cols) */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
              <Info size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
                Organization Profile & Identity
              </h3>
              <p className="text-xs text-zinc-500">Core parameters and regional localization defaults</p>
            </div>
          </div>
        </div>

        {/* Categorized Profile Fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailItem label="Tenant Name" value={org?.name} />
            <DetailItem label="Tenant Slug / Code" value={org?.code} isMono />

            <div className="sm:col-span-2">
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Tenant UUID</div>
              <div className="flex items-center justify-between bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/80">
                <span className="font-mono text-xs text-zinc-700 break-all">{organizationId}</span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="shrink-0 ml-2 p-1.5 rounded-md hover:bg-zinc-200 text-zinc-500 transition-colors"
                  title="Copy UUID"
                >
                  {copiedId ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <DetailItem
              label="Operational Status"
              value={
                org?.status === 'ACTIVE' || org?.active ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> ACTIVE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> SUSPENDED
                  </span>
                )
              }
            />

            <DetailItem label="Default Currency" value={org?.currency || 'INR (₹)'} isMono />
            <DetailItem label="Country / Region" value={org?.country || 'India (IN)'} />
            <DetailItem label="Timezone" value={org?.timezone || 'Asia/Kolkata (IST)'} />
            <DetailItem label="Official Email" value={org?.email || 'admin@' + (org?.code || 'erp') + '.local'} />
            <DetailItem label="Support Phone" value={org?.phone || 'Not configured'} />

            <DetailItem
              label="Created Date"
              value={org?.createdAt ? new Date(org.createdAt).toLocaleString() : '—'}
            />
            <DetailItem
              label="Last Synchronized"
              value={org?.updatedAt ? new Date(org.updatedAt).toLocaleString() : new Date().toLocaleDateString()}
            />
          </div>
        </div>
      </div>

      {/* Right Column: Platform Architecture & Quick Actions (5 cols) */}
      <div className="lg:col-span-5 space-y-6">
        {/* Tenant Architecture Telemetry Card */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                <Activity size={15} />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Tenant Architecture</h3>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Multi-Tenant Active
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 bg-zinc-50/70 rounded-xl border border-zinc-100 flex items-center justify-between">
              <span className="text-zinc-600 font-medium">Database Isolation</span>
              <span className="font-semibold text-zinc-800">PostgreSQL Schema Isolated</span>
            </div>
            <div className="p-3 bg-zinc-50/70 rounded-xl border border-zinc-100 flex items-center justify-between">
              <span className="text-zinc-600 font-medium">Service Gateway</span>
              <span className="font-mono text-[11px] font-semibold text-emerald-700">Port 8080 (Operational)</span>
            </div>
            <div className="p-3 bg-zinc-50/70 rounded-xl border border-zinc-100 flex items-center justify-between">
              <span className="text-zinc-600 font-medium">SSO Authentication Mesh</span>
              <span className="font-semibold text-zinc-800">JWT Bearer Enabled</span>
            </div>
          </div>
        </div>

        {/* Quick Tabs Navigation Card */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-5 space-y-3.5">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
                <Zap size={15} />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Organization Actions</h3>
            </div>
          </div>

          <div className="space-y-1.5">
            {[
              { label: 'Manage Companies & Workspaces', tab: 'companies', icon: Building2, color: 'bg-blue-50 text-blue-600 border-blue-100' },
              { label: 'Manage Team Members & Users', tab: 'members', icon: Users, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
              { label: 'Review Assigned Modules', tab: 'modules', icon: Layers, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
              { label: 'View Roles & Access Policies', tab: 'roles', icon: ShieldCheck, color: 'bg-violet-50 text-violet-600 border-violet-100' },
              { label: 'Security & Audit Logs', tab: 'audit', icon: ScrollText, color: 'bg-amber-50 text-amber-600 border-amber-100' },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.tab}
                  type="button"
                  onClick={() => handleTabChange(action.tab)}
                  className="w-full flex items-center justify-between h-11 px-3 rounded-xl border border-transparent hover:border-zinc-200 hover:bg-zinc-50 transition-all text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${action.color} group-hover:scale-105 transition-transform`}>
                      <Icon size={14} />
                    </div>
                    <span className="text-xs font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">
                      {action.label}
                    </span>
                  </div>
                  <ChevronRight size={14} className="text-zinc-400 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition-all" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
