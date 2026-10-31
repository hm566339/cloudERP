import React from 'react';
import { Check, ArrowRight, Layers, Sparkles } from 'lucide-react';
import { ERP_MODULES } from './landingData';
import { Link } from 'react-router-dom';

export default function LandingModules() {
  return (
    <section
      id="modules"
      className="scroll-mt-24 py-20 sm:py-28 bg-[#E8E9DF] dark:bg-[#101411] border-t border-[#D5D8CA] dark:border-[#263328] relative transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCE2CF] dark:bg-[#18221A] border border-[#D5D8CA] dark:border-[#2E3D31] text-[#2E3D28] dark:text-[#34D399] text-xs font-bold uppercase tracking-wider mb-3">
            <Layers size={13} className="text-[#2E3D28] dark:text-[#34D399]" />
            <span>Integrated Capabilities</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-[#2E3D28] dark:text-white tracking-tight">
            Complete Enterprise Stack, Zero Silos
          </h2>
          <p className="text-sm sm:text-base text-[#485942] dark:text-[#A3B5A5] mt-4 leading-relaxed">
            Every business pillar connects to the same real-time general ledger, customer records, and item masters.
            Experience total organizational consensus without fragile third-party integrations.
          </p>
        </div>

        {/* 6 Modules Grid with Micro-Interactions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {ERP_MODULES.map((mod) => {
            const Icon = mod.icon;

            return (
              <div
                key={mod.id}
                className="group bg-[#F7F7F0] dark:bg-[#161D17] rounded-3xl border border-[#D5D8CA] dark:border-[#263328] p-6 sm:p-7 shadow-xs dark:shadow-none hover:shadow-2xl dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] hover:border-[#A9B887] dark:hover:border-[#34D399]/60 hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
              >
                {/* Top decorative accent line that expands on hover */}
                <div className="absolute top-0 left-0 h-1.5 bg-[#2E3D28] dark:bg-[#34D399] w-0 group-hover:w-full transition-all duration-300 ease-out" />

                <div>
                  {/* Card Header: Icon + Badge */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#DCE2CF] dark:bg-[#1F2C21] text-[#2E3D28] dark:text-[#34D399] border border-[#A9B887]/40 dark:border-[#2E3D31] flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-2xs">
                      <Icon size={24} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#D5D8CA] dark:border-[#2E3D31] bg-[#EDEEE4] dark:bg-[#1F2C21] text-[#2E3D28] dark:text-[#ECF2EC] font-mono group-hover:border-[#A9B887] dark:group-hover:border-[#34D399]/50 transition-colors">
                        {mod.highlightMetric}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg sm:text-xl font-bold text-[#2E3D28] dark:text-[#ECF2EC] mb-2 group-hover:text-[#243320] dark:group-hover:text-white transition-colors">
                    {mod.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#485942] dark:text-[#A3B5A5] leading-relaxed mb-6">
                    {mod.description}
                  </p>
                </div>

                {/* Feature Bullet List */}
                <div className="pt-4 border-t border-[#D5D8CA] dark:border-[#263328] space-y-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A8A6E] dark:text-[#889B89]">
                      Verified Capabilities
                    </span>
                    <span className="flex h-1.5 w-1.5 rounded-full bg-[#16A34A] dark:bg-[#34D399] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {mod.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5 text-xs text-[#2E3D28] dark:text-[#DCE2CF]">
                      <div className="w-4 h-4 rounded-full bg-[#DCE2CF] dark:bg-[#1F2C21] text-[#2E3D28] dark:text-[#34D399] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#A9B887] dark:group-hover:bg-[#273B2B] transition-colors">
                        <Check size={11} className="stroke-[3]" />
                      </div>
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Module Inclusions Banner */}
        <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-[#F7F7F0] dark:bg-[#161D17] border border-[#D5D8CA] dark:border-[#263328] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-xs dark:shadow-none">
          <div>
            <h4 className="text-base font-bold text-[#2E3D28] dark:text-white flex items-center justify-center sm:justify-start gap-2">
              <Sparkles size={16} className="text-[#A9B887] dark:text-[#34D399]" />
              <span>All 6 Core Modules Are Included in Your 30-Day Free Trial</span>
            </h4>
            <p className="text-xs sm:text-sm text-[#485942] dark:text-[#A3B5A5] mt-0.5">
              No artificial feature gates or hidden add-on fees. Provision your trial workspace and evaluate with your real business operations.
            </p>
          </div>
          <Link
            to="/try-free"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2E3D28] dark:bg-[#10B981] text-white dark:text-[#051A0E] text-xs font-bold hover:bg-[#3C4E34] dark:hover:bg-[#34D399] transition-colors shrink-0 shadow-xs group"
          >
            <span>Start Free Trial</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
