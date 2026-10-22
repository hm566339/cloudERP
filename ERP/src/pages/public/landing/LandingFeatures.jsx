import React from 'react';
import { BUSINESS_BENEFITS } from './landingData';
import {
  Building2,
  ShieldCheck,
  Banknote,
  Box,
  GitBranch,
  FileSpreadsheet,
  Users2,
  Cloud
} from 'lucide-react';

const BENEFIT_ICONS = [
  Building2,
  ShieldCheck,
  Banknote,
  Box,
  GitBranch,
  FileSpreadsheet,
  Users2,
  Cloud
];

export default function LandingFeatures() {
  return (
    <section id="features" className="scroll-mt-24 py-20 sm:py-28 bg-white dark:bg-[#0F1117] border-t border-zinc-200/80 dark:border-[#2A2F3D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-[#1D212C] text-zinc-700 dark:text-[#A0A6B5] text-xs font-bold uppercase tracking-wider mb-3">
            Core Architecture Benefits
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-zinc-900 dark:text-[#E6E8EE] tracking-tight">
            Engineered for Modern Enterprise Scale
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-[#A0A6B5] mt-4 leading-relaxed">
            Eliminate fragile third-party connectors and manual reconciliations.
            Mark2 ERP delivers instant financial consensus across all business branches.
          </p>
        </div>

        {/* 8-Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {BUSINESS_BENEFITS.map((benefit, i) => {
            const Icon = BENEFIT_ICONS[i % BENEFIT_ICONS.length];
            return (
              <div
                key={i}
                className="group p-6 rounded-3xl border border-zinc-200/80 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#161922] hover:bg-white dark:hover:bg-[#1D212C] hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-xl transition-all duration-standard ease-enter flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white group-hover:bg-emerald-600 flex items-center justify-center font-bold text-xs mb-4 transition-colors duration-micro">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-[#E6E8EE] mb-2 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">
                    {benefit.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-[#A0A6B5] leading-relaxed">
                    {benefit.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between text-[11px] font-mono text-zinc-400 dark:text-[#6B7184]">
                  <span>Advantage #{i + 1}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Included</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
