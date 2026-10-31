import React, { useState, useEffect } from 'react';
import { SECURITY_FEATURES, INTER_COMPANY_SIGNALS, checkPrefersReducedMotion } from './landingData';
import { Layers, CheckCircle2, Shield, ArrowRightLeft } from 'lucide-react';

export default function LandingSecurity() {
  const [activeSignalIndex, setActiveSignalIndex] = useState(0);

  // Cycle through inter-company live transaction signals
  useEffect(() => {
    if (checkPrefersReducedMotion()) return;

    const timer = setInterval(() => {
      setActiveSignalIndex((prev) => (prev + 1) % INTER_COMPANY_SIGNALS.length);
    }, 4200);

    return () => clearInterval(timer);
  }, []);

  const activeSignal = INTER_COMPANY_SIGNALS[activeSignalIndex] || INTER_COMPANY_SIGNALS[0];

  return (
    <section
      id="security"
      className="scroll-mt-24 py-20 sm:py-28 bg-[#EDEEE4] dark:bg-[#0E1510] border-t border-[#D5D8CA] dark:border-[#223326] text-[#2E3D28] dark:text-[#ECF2EC] relative overflow-hidden transition-colors duration-300"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCE2CF] dark:bg-[#18261B] border border-[#D5D8CA] dark:border-[#2E3D31] text-[#2E3D28] dark:text-[#34D399] text-xs font-bold uppercase tracking-wider mb-3">
            <Shield size={13} className="text-[#2E3D28] dark:text-[#34D399]" />
            <span>Multi-Tenant & Security Architecture</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-[#2E3D28] dark:text-white tracking-tight">
            Enterprise Multi-Company Isolation & Governance
          </h2>
          <p className="text-sm sm:text-base text-[#485942] dark:text-[#A3B5A5] mt-4 leading-relaxed">
            Architected specifically for conglomerates, holding corporations, and growing multi-branch enterprises.
            Operate distinct legal entities with total data confidentiality.
          </p>
        </div>

        {/* Multi-Company Visual Hierarchy Card with Animated Cross-Entity Synchronization */}
        <div className="mb-16 rounded-3xl bg-[#F7F7F0] dark:bg-[#141C16] border border-[#D5D8CA] dark:border-[#26382B] p-6 sm:p-10 shadow-lg dark:shadow-none">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Explanation */}
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#DCE2CF] dark:bg-[#1B271E] text-[#2E3D28] dark:text-[#34D399] text-xs font-mono font-medium border border-[#A9B887]/40 dark:border-[#2E3D31]">
                <Layers size={14} className="text-[#2E3D28] dark:text-[#34D399]" />
                <span>One Tenant, Multiple Legal Entities</span>
              </div>
              <h3 className="text-2xl font-bold text-[#2E3D28] dark:text-white tracking-tight">
                Consolidated Holding Group Architecture
              </h3>
              <p className="text-xs sm:text-sm text-[#485942] dark:text-[#A3B5A5] leading-relaxed">
                Empower group executives to switch between sister corporations, production plants, and regional
                sales subsidiaries in a single click—without multiple logins or disconnected spreadsheets.
              </p>

              <div className="space-y-2.5 pt-2 text-xs text-[#2E3D28] dark:text-[#DCE2CF]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-[#16A34A] dark:text-[#34D399] shrink-0" />
                  <span>Independent Chart of Accounts & Financial Year books</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-[#16A34A] dark:text-[#34D399] shrink-0" />
                  <span>Isolated GSTIN profiles with state-specific place-of-supply rules</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-[#16A34A] dark:text-[#34D399] shrink-0" />
                  <span>Role permissions customized per subsidiary per user</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-[#16A34A] dark:text-[#34D399] shrink-0" />
                  <span>Configurable session timeouts (5 to 720 mins) & Two-Factor Authentication</span>
                </div>
              </div>
            </div>

            {/* Right: Visual Entity Tree Hierarchy with Animated Stream Connectors */}
            <div className="lg:col-span-7 bg-[#EDEEE4] dark:bg-[#101712] rounded-2xl border border-[#D5D8CA] dark:border-[#26382B] p-5 sm:p-6 space-y-4">
              <div className="text-[11px] font-mono text-[#485942] dark:text-[#A3B5A5] uppercase tracking-wider pb-2 border-b border-[#D5D8CA] dark:border-[#223326] flex items-center justify-between">
                <span>Enterprise Tenant Boundary</span>
                <span className="text-[#2E3D28] dark:text-[#34D399] font-bold flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-radar-pulse absolute inline-flex h-full w-full rounded-full bg-[#16A34A] dark:bg-[#34D399] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16A34A] dark:bg-[#34D399]" />
                  </span>
                  <span>Scope: APEX-HOLDINGS</span>
                </span>
              </div>

              {/* Parent Holding Node */}
              <div className="p-4 rounded-xl bg-[#F7F7F0] dark:bg-[#18231B] border-2 border-[#2E3D28] dark:border-[#34D399]/70 flex items-center justify-between shadow-xs relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#2E3D28] dark:bg-[#34D399] text-white dark:text-[#051A0E] flex items-center justify-center font-bold text-xs shrink-0">
                    HQ
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-[#2E3D28] dark:text-white">Apex Holdings Group Pvt Ltd</div>
                    <div className="text-[10px] text-[#485942] dark:text-[#A3B5A5] font-mono">Consolidated Financials &bull; Multi-Entity Master</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#2E3D28] dark:text-[#34D399] bg-[#DCE2CF] dark:bg-[#202E23] px-2.5 py-1 rounded-lg border border-[#A9B887] dark:border-[#34D399]/40 font-bold shrink-0">
                  Parent Tenant
                </span>
              </div>

              {/* Animated Connecting Streams (SVG Connectors) */}
              <div className="relative py-1 px-4">
                <svg className="w-full h-8 overflow-visible" viewBox="0 0 400 32">
                  <line x1="200" y1="0" x2="200" y2="16" stroke="#2E3D31" strokeWidth="2" />
                  <line x1="100" y1="16" x2="300" y2="16" stroke="#2E3D31" strokeWidth="2" />
                  <line x1="100" y1="16" x2="100" y2="32" stroke="#2E3D31" strokeWidth="2" />
                  <line x1="300" y1="16" x2="300" y2="32" stroke="#2E3D31" strokeWidth="2" />

                  {/* Flowing Animated Dashes */}
                  <line
                    x1="200"
                    y1="0"
                    x2="200"
                    y2="16"
                    stroke="#34D399"
                    strokeWidth="2.5"
                    className="animate-stream-dashes"
                  />
                  <line
                    x1="100"
                    y1="16"
                    x2="300"
                    y2="16"
                    stroke="#34D399"
                    strokeWidth="2.5"
                    className="animate-stream-dashes"
                  />
                  <line
                    x1="100"
                    y1="16"
                    x2="100"
                    y2="32"
                    stroke="#34D399"
                    strokeWidth="2.5"
                    className="animate-stream-dashes"
                  />
                  <line
                    x1="300"
                    y1="16"
                    x2="300"
                    y2="32"
                    stroke="#34D399"
                    strokeWidth="2.5"
                    className="animate-stream-dashes"
                  />
                </svg>
              </div>

              {/* Subsidiaries Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#F7F7F0] dark:bg-[#18231B] border border-[#D5D8CA] dark:border-[#26382B] flex flex-col justify-between hover:border-[#2E3D28] dark:hover:border-[#34D399] transition-colors shadow-2xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-bold text-[#2E3D28] dark:text-[#ECF2EC]">Apex Precision Engineering</div>
                      <span className="w-2 h-2 rounded-full bg-[#16A34A] dark:bg-[#34D399]" title="Tenant active" />
                    </div>
                    <div className="text-[10px] font-mono text-[#485942] dark:text-[#A3B5A5]">GSTIN: 27AABCA1234F1Z5 &bull; Maharashtra</div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-[#2E3D28] dark:text-[#34D399] font-mono bg-[#DCE2CF] dark:bg-[#202E23] px-2 py-0.5 rounded font-semibold border dark:border-[#2E3D31]">
                      3 Warehouses &bull; Active
                    </span>
                    <span className="text-[9px] font-mono text-[#7A8A6E] dark:text-[#889B89]">Entity ID: 101</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F7F7F0] dark:bg-[#18231B] border border-[#D5D8CA] dark:border-[#26382B] flex flex-col justify-between hover:border-[#2E3D28] dark:hover:border-[#34D399] transition-colors shadow-2xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-bold text-[#2E3D28] dark:text-[#ECF2EC]">Apex Logistics & Distribution</div>
                      <span className="w-2 h-2 rounded-full bg-[#16A34A] dark:bg-[#34D399]" title="Tenant active" />
                    </div>
                    <div className="text-[10px] font-mono text-[#485942] dark:text-[#A3B5A5]">GSTIN: 29AABCA1234F2Z4 &bull; Karnataka</div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-[#2E3D28] dark:text-[#34D399] font-mono bg-[#DCE2CF] dark:bg-[#202E23] px-2 py-0.5 rounded font-semibold border dark:border-[#2E3D31]">
                      Transit Hub &bull; Active
                    </span>
                    <span className="text-[9px] font-mono text-[#7A8A6E] dark:text-[#889B89]">Entity ID: 102</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Live Inter-Entity Signal Banner */}
              <div className="p-3 rounded-xl bg-[#F7F7F0] dark:bg-[#18231B] border border-[#D5D8CA] dark:border-[#26382B] text-xs flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-[#DCE2CF] dark:bg-[#202E23] text-[#2E3D28] dark:text-[#34D399] flex items-center justify-center shrink-0">
                    <ArrowRightLeft size={13} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono font-bold text-[#2E3D28] dark:text-[#ECF2EC] flex items-center gap-1.5">
                      <span className="px-1.5 py-0.2 rounded bg-[#EDEEE4] dark:bg-[#26382B] text-[#485942] dark:text-[#A3B5A5]">
                        {activeSignal.badge}
                      </span>
                      <span className="truncate">{activeSignal.from} &rarr; {activeSignal.to}</span>
                    </div>
                    <div className="text-[11px] text-[#485942] dark:text-[#A3B5A5] truncate font-medium mt-0.5">
                      {activeSignal.label}
                    </div>
                  </div>
                </div>
                <span className="font-mono text-[9px] text-[#16A34A] dark:text-[#34D399] bg-[#DCE2CF] dark:bg-[#202E23] px-2 py-0.5 rounded border border-[#A9B887]/50 dark:border-[#34D399]/40 font-bold shrink-0">
                  Encrypted &bull; 0ms Leakage
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Security Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SECURITY_FEATURES.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="group p-6 rounded-3xl bg-[#F7F7F0] dark:bg-[#141C16] border border-[#D5D8CA] dark:border-[#26382B] flex flex-col justify-between hover:border-[#A9B887] dark:hover:border-[#34D399]/60 hover:shadow-lg dark:hover:shadow-[0_15px_35px_rgba(0,0,0,0.5)] hover:-translate-y-1 transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-[#2E3D28] dark:bg-[#1F2C21] text-white dark:text-[#34D399] border dark:border-[#2E3D31] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon size={20} />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#2E3D28] dark:text-[#34D399] bg-[#DCE2CF] dark:bg-[#202E23] px-2.5 py-0.5 rounded-full border dark:border-[#2E3D31]">
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-[#2E3D28] dark:text-[#ECF2EC] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#485942] dark:text-[#A3B5A5] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#D5D8CA] dark:border-[#26382B] text-[10px] text-[#2E3D28] dark:text-[#34D399] font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-[#16A34A] dark:text-[#34D399]" />
                  <span>Production Enforced</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
