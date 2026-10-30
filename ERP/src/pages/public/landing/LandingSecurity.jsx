import React from 'react';
import { SECURITY_FEATURES } from './landingData';
import { Layers, CheckCircle2 } from 'lucide-react';

export default function LandingSecurity() {
  return (
    <section id="security" className="scroll-mt-24 py-20 sm:py-28 bg-[#EDEEE4] border-t border-[#D5D8CA] text-[#2E3D28] relative overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCE2CF] border border-[#D5D8CA] text-[#2E3D28] text-xs font-bold uppercase tracking-wider mb-3">
            Multi-Tenant & Security Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-[#2E3D28] tracking-tight">
            Enterprise Multi-Company Isolation & Governance
          </h2>
          <p className="text-sm sm:text-base text-[#485942] mt-4 leading-relaxed">
            Architected specifically for conglomerates, holding corporations, and growing multi-branch enterprises.
            Operate distinct legal entities with total data confidentiality.
          </p>
        </div>

        {/* Multi-Company Visual Showcase Card */}
        <div className="mb-14 rounded-3xl bg-[#F7F7F0] border border-[#D5D8CA] p-6 sm:p-10 shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Explanation */}
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#DCE2CF] text-[#2E3D28] text-xs font-mono font-medium border border-[#A9B887]/40">
                <Layers size={14} className="text-[#2E3D28]" />
                <span>One Tenant, Multiple Legal Entities</span>
              </div>
              <h3 className="text-2xl font-bold text-[#2E3D28] tracking-tight">
                Consolidated Holding Group Architecture
              </h3>
              <p className="text-xs sm:text-sm text-[#485942] leading-relaxed">
                Empower group executives to switch between sister corporations, production plants, and regional
                sales subsidiaries in a single click—without multiple logins or disconnected spreadsheets.
              </p>

              <div className="space-y-2.5 pt-2 text-xs text-[#2E3D28]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-[#2E3D28] shrink-0" />
                  <span>Independent Chart of Accounts & Financial Year books</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-[#2E3D28] shrink-0" />
                  <span>Isolated GSTIN profiles with state-specific place-of-supply rules</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-[#2E3D28] shrink-0" />
                  <span>Role permissions customized per subsidiary per user</span>
                </div>
              </div>
            </div>

            {/* Right: Visual Company Entity Hierarchy Tree */}
            <div className="lg:col-span-7 bg-[#EDEEE4] rounded-2xl border border-[#D5D8CA] p-5 sm:p-6 space-y-3">
              <div className="text-[11px] font-mono text-[#485942] uppercase tracking-wider pb-2 border-b border-[#D5D8CA] flex items-center justify-between">
                <span>Enterprise Tenant Boundary</span>
                <span className="text-[#2E3D28] font-bold">Organization: APEX-HOLDINGS</span>
              </div>

              {/* Parent Holding */}
              <div className="p-3.5 rounded-xl bg-[#F7F7F0] border-2 border-[#2E3D28] flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#2E3D28] text-white flex items-center justify-center font-bold text-xs">
                    HQ
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#2E3D28]">Apex Holdings Group Pvt Ltd</div>
                    <div className="text-[10px] text-[#485942] font-mono">Consolidated Financials • Multi-Entity Ledger</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#2E3D28] bg-[#DCE2CF] px-2 py-0.5 rounded border border-[#A9B887]">
                  Parent Holding
                </span>
              </div>

              {/* Subsidiaries Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 pl-4 sm:pl-6 border-l-2 border-[#A9B887]">
                <div className="p-3 rounded-xl bg-[#F7F7F0] border border-[#D5D8CA] flex flex-col justify-between">
                  <div className="text-xs font-semibold text-[#2E3D28]">Apex Precision Engineering</div>
                  <div className="text-[10px] font-mono text-[#485942] mt-1">GSTIN: 27AABCA1234F1Z5 • Maharashtra</div>
                  <div className="mt-2 text-[10px] text-[#2E3D28] font-mono bg-[#DCE2CF] px-2 py-0.5 rounded self-start">3 Warehouses • Active</div>
                </div>

                <div className="p-3 rounded-xl bg-[#F7F7F0] border border-[#D5D8CA] flex flex-col justify-between">
                  <div className="text-xs font-semibold text-[#2E3D28]">Apex Logistics & Distribution</div>
                  <div className="text-[10px] font-mono text-[#485942] mt-1">GSTIN: 29AABCA1234F2Z4 • Karnataka</div>
                  <div className="mt-2 text-[10px] text-[#2E3D28] font-mono bg-[#DCE2CF] px-2 py-0.5 rounded self-start">Transit Hub • Active</div>
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
                className="rounded-2xl bg-[#F7F7F0] border border-[#D5D8CA] p-6 flex flex-col justify-between hover:border-[#A9B887] hover:shadow-md transition-all duration-200 group"
              >
                <div>
                  <div className="w-11 h-11 rounded-xl bg-[#DCE2CF] text-[#2E3D28] border border-[#A9B887]/40 flex items-center justify-center mb-4 transition-colors">
                    <Icon size={22} />
                  </div>
                  <h3 className="text-sm font-bold text-[#2E3D28] mb-2 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#485942] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#D5D8CA] text-[10px] font-mono text-[#7A8A6E] flex items-center justify-between">
                  <span>Standard</span>
                  <span className="text-[#2E3D28] font-semibold">Enforced</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
