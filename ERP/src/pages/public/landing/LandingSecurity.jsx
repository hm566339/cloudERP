import React from 'react';
import { SECURITY_FEATURES } from './landingData';
import { Building2, ShieldCheck, Key, Lock, Layers, CheckCircle2, ChevronRight } from 'lucide-react';

export default function LandingSecurity() {
  return (
    <section id="security" className="scroll-mt-24 py-20 sm:py-28 bg-zinc-950 text-white relative overflow-hidden">
      {/* Background radial effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-500/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:20px_20px] opacity-30 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
            Multi-Tenant & Security Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-white tracking-tight">
            Enterprise Multi-Company Isolation & Governance
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 mt-4 leading-relaxed">
            Architected specifically for conglomerates, holding corporations, and growing multi-branch enterprises.
            Operate distinct legal entities with total data confidentiality.
          </p>
        </div>

        {/* Multi-Company Visual Showcase Card */}
        <div className="mb-14 rounded-3xl bg-zinc-900/90 border border-zinc-800 p-6 sm:p-10 shadow-2xl backdrop-blur-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Explanation */}
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-mono font-medium">
                <Layers size={14} className="text-emerald-400" />
                <span>One Tenant, Multiple Legal Entities</span>
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                Consolidated Holding Group Architecture
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Empower group executives to switch between sister corporations, production plants, and regional
                sales subsidiaries in a single click—without multiple logins or disconnected spreadsheets.
              </p>

              <div className="space-y-2.5 pt-2 text-xs text-zinc-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>Independent Chart of Accounts & Financial Year books</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>Isolated GSTIN profiles with state-specific place-of-supply rules</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>Role permissions customized per subsidiary per user</span>
                </div>
              </div>
            </div>

            {/* Right: Visual Company Entity Hierarchy Tree */}
            <div className="lg:col-span-7 bg-zinc-950/80 rounded-2xl border border-zinc-800/90 p-5 sm:p-6 space-y-3">
              <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider pb-2 border-b border-zinc-800/80 flex items-center justify-between">
                <span>Enterprise Tenant Boundary</span>
                <span className="text-emerald-400 font-semibold">Organization: APEX-HOLDINGS</span>
              </div>

              {/* Parent Holding */}
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    HQ
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Apex Holdings Group Pvt Ltd</div>
                    <div className="text-[10px] text-zinc-400 font-mono">Consolidated Financials • Multi-Entity Ledger</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Parent Holding
                </span>
              </div>

              {/* Subsidiaries Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 pl-4 sm:pl-6 border-l-2 border-emerald-500/20">
                <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between">
                  <div className="text-xs font-semibold text-zinc-200">Apex Precision Engineering</div>
                  <div className="text-[10px] font-mono text-zinc-500 mt-1">GSTIN: 27AABCA1234F1Z5 • Maharashtra</div>
                  <div className="mt-2 text-[10px] text-emerald-400 font-mono">3 Warehouses • Active</div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between">
                  <div className="text-xs font-semibold text-zinc-200">Apex Logistics & Distribution</div>
                  <div className="text-[10px] font-mono text-zinc-500 mt-1">GSTIN: 29AABCA1234F2Z4 • Karnataka</div>
                  <div className="mt-2 text-[10px] text-emerald-400 font-mono">Transit Hub • Active</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Pillars of Security Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SECURITY_FEATURES.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-6 flex flex-col justify-between hover:border-emerald-500/40 hover:bg-zinc-900 transition-all duration-standard ease-enter group"
              >
                <div>
                  <div className="w-11 h-11 rounded-xl bg-zinc-800 text-emerald-400 group-hover:bg-emerald-500/20 flex items-center justify-center mb-4 transition-colors">
                    <Icon size={22} />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-zinc-800/80 text-[10px] font-mono text-zinc-500 flex items-center justify-between">
                  <span>Standard</span>
                  <span className="text-emerald-400 font-semibold">Enforced</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
