import React, { useState } from 'react';
import { BUSINESS_PIPELINES } from './landingData';
import { GitBranch, CheckCircle2 } from 'lucide-react';

export default function LandingWorkflows() {
  const [activePipeline, setActivePipeline] = useState(0);

  const currentPipeline = BUSINESS_PIPELINES[activePipeline] || BUSINESS_PIPELINES[0];

  return (
    <section id="workflows" className="scroll-mt-24 py-20 sm:py-28 bg-[#2E3D28] text-white relative overflow-hidden border-t border-[#243320]">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#A9B887]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#DCE2CF]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3C4E34] border border-[#A9B887]/30 text-[#DCE2CF] text-xs font-semibold mb-3">
            <GitBranch size={13} className="text-[#A9B887]" />
            <span>End-to-End Enterprise Automation</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight text-white">
            Connected Pipelines with Built-in Governance
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#E8E9DF] leading-relaxed">
            Eliminate double data-entry and operational blindspots. Documents flow seamlessly across sales,
            inventory, procurement, and accounting with immutable audit trails.
          </p>
        </div>

        {/* Pipeline Tab Switcher */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1.5 rounded-2xl bg-[#243320] border border-[#3C4E34] shadow-inner">
            {BUSINESS_PIPELINES.map((pipe, idx) => (
              <button
                key={pipe.title}
                type="button"
                onClick={() => setActivePipeline(idx)}
                className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 ${
                  activePipeline === idx
                    ? 'bg-[#A9B887] text-[#2E3D28] shadow-md font-bold'
                    : 'text-[#DCE2CF] hover:text-white hover:bg-[#3C4E34]/50'
                }`}
              >
                {pipe.title}
              </button>
            ))}
          </div>
        </div>

        {/* Pipeline Flow Visualizer */}
        <div className="bg-[#243320]/95 rounded-3xl border border-[#3C4E34] p-6 sm:p-10 shadow-2xl backdrop-blur-sm">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#3C4E34] pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#A9B887]" />
                {currentPipeline.title}
              </h3>
              <p className="text-xs text-[#DCE2CF] mt-1">{currentPipeline.description}</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#A9B887] bg-[#2E3D28] border border-[#A9B887]/40 px-2.5 py-1 rounded-lg self-start sm:self-auto">
              <CheckCircle2 size={12} /> Auto-Ledger Posting Enabled
            </span>
          </div>

          {/* Steps Timeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {currentPipeline.steps.map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.name}
                  className="group relative bg-[#2E3D28] rounded-2xl border border-[#3C4E34] p-5 hover:border-[#A9B887] transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    {/* Step Number & Connector */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-8 h-8 rounded-xl bg-[#3C4E34] text-[#A9B887] border border-[#A9B887]/30 flex items-center justify-center transition-colors">
                        <StepIcon size={16} />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-[#A9B887] transition-colors">
                        0{idx + 1}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-1.5 transition-colors">
                      {step.name}
                    </h4>
                    <p className="text-xs text-[#DCE2CF] leading-relaxed">
                      {step.detail}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[#3C4E34] flex items-center justify-between text-[10px] font-mono text-[#A9B887]">
                    <span>Phase 0{idx + 1}</span>
                    <span className="inline-flex items-center gap-1 text-[#DCE2CF]">
                      <CheckCircle2 size={10} className="text-[#A9B887]" /> Verified
                    </span>
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
