import React from 'react';
import { Check } from 'lucide-react';
import { ERP_MODULES } from './landingData';

export default function LandingModules() {
  return (
    <section id="modules" className="scroll-mt-24 py-20 sm:py-28 bg-[#E8E9DF] border-t border-[#D5D8CA] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCE2CF] border border-[#D5D8CA] text-[#2E3D28] text-xs font-bold uppercase tracking-wider mb-3">
            Integrated Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-[#2E3D28] tracking-tight">
            Complete Enterprise Stack, Zero Silos
          </h2>
          <p className="text-sm sm:text-base text-[#485942] mt-4 leading-relaxed">
            Every business pillar connects to the same real-time general ledger and customer/item masters.
            Experience total visibility without third-party integration overhead.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {ERP_MODULES.map((mod) => {
            const Icon = mod.icon;

            return (
              <div
                key={mod.id}
                className="group bg-[#F7F7F0] rounded-2xl sm:rounded-3xl border border-[#D5D8CA] p-6 sm:p-7 shadow-xs hover:shadow-lg hover:border-[#A9B887] transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
              >
                {/* Top decorative accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#2E3D28] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                <div>
                  {/* Card Header: Icon + Badge */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#DCE2CF] text-[#2E3D28] border border-[#A9B887]/40 flex items-center justify-center transition-transform group-hover:scale-105 duration-150">
                      <Icon size={24} />
                    </div>
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full border border-[#D5D8CA] bg-[#EDEEE4] text-[#2E3D28]">
                      {mod.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-[#2E3D28] mb-2 group-hover:text-[#243320] transition-colors">
                    {mod.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#485942] leading-relaxed mb-6">
                    {mod.description}
                  </p>
                </div>

                {/* Feature Bullet List */}
                <div className="pt-4 border-t border-[#D5D8CA] space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A8A6E] block mb-1">
                    Core Inclusions
                  </span>
                  {mod.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5 text-xs text-[#2E3D28]">
                      <div className="w-4 h-4 rounded-full bg-[#DCE2CF] text-[#2E3D28] flex items-center justify-center shrink-0 mt-0.5">
                        <Check size={11} className="stroke-[3]" />
                      </div>
                      <span className="leading-tight">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
