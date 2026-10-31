import React, { useState } from 'react';
import { INDUSTRY_USE_CASES, REAL_INTEGRATIONS } from './landingData';
import { CheckCircle2, Cpu, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Industry-Specific Capabilities & Verified Integrations
 * Highlights tangible operational workflows for trading, manufacturing, and holding companies
 * without making fictional claims or inventing non-existent features.
 */
export default function LandingIndustryUseCases() {
  const [selectedIndustry, setSelectedIndustry] = useState(0);

  const activeCase = INDUSTRY_USE_CASES[selectedIndustry] || INDUSTRY_USE_CASES[0];
  const ActiveIcon = activeCase.icon;

  return (
    <section
      id="industries"
      className="scroll-mt-24 py-20 sm:py-28 bg-[#E8E9DF] dark:bg-[#101411] border-t border-[#D5D8CA] dark:border-[#263328] relative transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCE2CF] dark:bg-[#18261B] border border-[#D5D8CA] dark:border-[#2E3D31] text-[#2E3D28] dark:text-[#34D399] text-xs font-bold uppercase tracking-wider mb-3">
            <Cpu size={13} className="text-[#2E3D28] dark:text-[#34D399]" />
            <span>Targeted Industry Workflows</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-[#2E3D28] dark:text-white tracking-tight">
            Built for High-Growth Indian & Global Enterprises
          </h2>
          <p className="text-sm sm:text-base text-[#485942] dark:text-[#A3B5A5] mt-4 leading-relaxed">
            Whether managing multi-state distribution centers, factory procurement, or conglomerate holding structures,
            Mark2 ERP delivers pre-configured operational workflows.
          </p>
        </div>

        {/* Industry Switcher Buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {INDUSTRY_USE_CASES.map((item, idx) => {
            const Icon = item.icon;
            const isSelected = selectedIndustry === idx;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedIndustry(idx)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${
                  isSelected
                    ? 'bg-[#2E3D28] dark:bg-[#34D399] text-white dark:text-[#051A0E] shadow-md font-bold'
                    : 'bg-[#F7F7F0] dark:bg-[#161D17] text-[#485942] dark:text-[#A3B5A5] border border-[#D5D8CA] dark:border-[#26382B] hover:bg-[#FFFFFF] dark:hover:bg-[#1C261E] hover:text-[#2E3D28] dark:hover:text-white'
                }`}
              >
                <Icon size={16} className={isSelected ? 'text-[#A9B887] dark:text-[#051A0E]' : 'text-[#7A8A6E] dark:text-[#889B89]'} />
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Industry Card Preview */}
        <div className="bg-[#F7F7F0] dark:bg-[#161D17] rounded-3xl border border-[#D5D8CA] dark:border-[#26382B] p-6 sm:p-10 shadow-lg dark:shadow-none max-w-4xl mx-auto mb-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#D5D8CA] dark:border-[#26382B]">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#DCE2CF] dark:bg-[#1F2C21] text-[#2E3D28] dark:text-[#34D399] flex items-center justify-center shrink-0 border border-[#A9B887]/40 dark:border-[#2E3D31]">
                <ActiveIcon size={24} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A8A6E] dark:text-[#889B89] font-mono">
                  {activeCase.badge}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-[#2E3D28] dark:text-[#ECF2EC]">
                  {activeCase.title}
                </h3>
              </div>
            </div>
            <Link
              to="/try-free"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2E3D28] dark:bg-[#10B981] text-white dark:text-[#051A0E] text-xs font-semibold hover:bg-[#3C4E34] dark:hover:bg-[#34D399] transition-colors self-start sm:self-auto shadow-xs"
            >
              <span>Explore in Trial</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <p className="text-xs sm:text-sm text-[#485942] dark:text-[#A3B5A5] mt-5 mb-6 leading-relaxed">
            {activeCase.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {activeCase.bulletPoints.map((bullet, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FFFFFF] dark:bg-[#1B251D] border border-[#D5D8CA] dark:border-[#28382B] text-xs text-[#2E3D28] dark:text-[#ECF2EC]">
                <CheckCircle2 size={16} className="text-[#16A34A] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span className="leading-snug">{bullet}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Verified Integrations Banner */}
        <div className="border-t border-[#D5D8CA] dark:border-[#263328] pt-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[11px] font-bold text-[#7A8A6E] dark:text-[#889B89] uppercase tracking-wider block mb-1">
              Architecture & Integrations
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-[#2E3D28] dark:text-white">
              Verified Platform Integrations
            </h3>
            <p className="text-xs sm:text-sm text-[#485942] dark:text-[#A3B5A5] mt-2">
              Every integration advertised is backed by concrete backend services and statutory data compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {REAL_INTEGRATIONS.map((int, i) => {
              const Icon = int.icon;
              return (
                <div key={i} className="p-5 rounded-2xl bg-[#F7F7F0] dark:bg-[#161D17] border border-[#D5D8CA] dark:border-[#26382B] hover:border-[#A9B887] dark:hover:border-[#34D399]/60 hover:shadow-xs transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-[#2E3D28] dark:bg-[#1F2C21] text-white dark:text-[#34D399] border dark:border-[#2E3D31] flex items-center justify-center">
                        <Icon size={18} />
                      </div>
                      <span className="text-[10px] font-mono font-semibold text-[#7A8A6E] dark:text-[#889B89] bg-[#EDEEE4] dark:bg-[#202E23] px-2 py-0.5 rounded border dark:border-[#2E3D31]">
                        {int.category}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-[#2E3D28] dark:text-[#ECF2EC] mb-1.5">{int.name}</h4>
                    <p className="text-xs text-[#485942] dark:text-[#A3B5A5] leading-relaxed">{int.description}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#D5D8CA] dark:border-[#26382B] text-[10px] text-[#2E3D28] dark:text-[#34D399] font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-[#16A34A] dark:text-[#34D399]" />
                    <span>Production Verified</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
