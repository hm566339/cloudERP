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
    <section id="features" className="scroll-mt-24 py-20 sm:py-28 bg-[#E8E9DF] border-t border-[#D5D8CA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCE2CF] border border-[#D5D8CA] text-[#2E3D28] text-xs font-bold uppercase tracking-wider mb-3">
            Core Architecture Benefits
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-[#2E3D28] tracking-tight">
            Engineered for Modern Enterprise Scale
          </h2>
          <p className="text-sm sm:text-base text-[#485942] mt-4 leading-relaxed">
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
                className="group p-6 rounded-3xl border border-[#D5D8CA] bg-[#F7F7F0] hover:bg-[#FFFFFF] hover:border-[#A9B887] hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-[#2E3D28] text-white flex items-center justify-center font-bold text-xs mb-4 transition-colors">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-base font-bold text-[#2E3D28] mb-2 group-hover:text-[#243320] transition-colors">
                    {benefit.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#485942] leading-relaxed">
                    {benefit.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#D5D8CA] flex items-center justify-between text-[11px] font-mono text-[#7A8A6E]">
                  <span>Advantage #{i + 1}</span>
                  <span className="text-[#2E3D28] font-semibold">Included</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
