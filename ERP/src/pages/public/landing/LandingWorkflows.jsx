import React, { useState } from 'react';
import {
  BUSINESS_PIPELINES
} from './landingData';
import {
  ArrowRight,
  CheckCircle2,
  GitBranch,
  ShieldAlert,
  Clock,
  Sparkles,
  ArrowRightLeft,
  ChevronRight
} from 'lucide-react';

export default function LandingWorkflows() {
  const [activePipeline, setActivePipeline] = useState(0);

  const currentPipeline = BUSINESS_PIPELINES[activePipeline] || BUSINESS_PIPELINES[0];

  return (
    <section id="workflows" className="scroll-mt-24 py-20 sm:py-28 bg-zinc-900 text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
            <GitBranch size={13} />
            <span>End-to-End Enterprise Automation</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight text-white">
            Connected Pipelines with Built-in Governance
          </h2>
          <p className="mt-4 text-sm sm:text-base text-zinc-300 leading-relaxed">
            Eliminate double data-entry and operational blindspots. Documents flow seamlessly across sales,
            inventory, procurement, and accounting with immutable audit trails.
          </p>
        </div>

        {/* Pipeline Tab Switcher */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1.5 rounded-2xl bg-zinc-800/90 border border-zinc-700/80 shadow-inner">
            {BUSINESS_PIPELINES.map((pipe, idx) => (
              <button
                key={pipe.title}
                type="button"
                onClick={() => setActivePipeline(idx)}
                className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-micro ease-enter ${
                  activePipeline === idx
                    ? 'bg-emerald-500 text-zinc-950 shadow-md font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                }`}
              >
                {pipe.title}
              </button>
            ))}
          </div>
        </div>

        {/* Pipeline Flow Visualizer */}
        <div className="bg-zinc-800/60 rounded-3xl border border-zinc-700/80 p-6 sm:p-10 shadow-2xl backdrop-blur-sm">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-700/70 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                {currentPipeline.title}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">{currentPipeline.description}</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-lg self-start sm:self-auto">
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
                  className="group relative bg-zinc-900/80 rounded-2xl border border-zinc-700/80 p-5 hover:border-emerald-500/50 hover:bg-zinc-900 transition-all duration-standard ease-enter flex flex-col justify-between"
                >
                  <div>
                    {/* Step Number & Connector */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-8 h-8 rounded-xl bg-zinc-800 group-hover:bg-emerald-500/20 text-zinc-300 group-hover:text-emerald-400 border border-zinc-700 group-hover:border-emerald-500/30 flex items-center justify-center transition-colors">
                        <StepIcon size={16} />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-zinc-500 group-hover:text-emerald-400 transition-colors">
                        0{idx + 1}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-1.5 group-hover:text-emerald-300 transition-colors">
                      {step.name}
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                      {step.detail}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-zinc-800 text-[10px] text-zinc-500 flex items-center justify-between font-mono">
                    <span>STATUS</span>
                    <span className="text-emerald-400 font-semibold">Ready</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Workflow Governance Highlight Box */}
          <div className="mt-8 rounded-2xl bg-gradient-to-r from-zinc-900/90 to-zinc-900/60 border border-zinc-700/90 p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Configurable Multi-Tier Approval Gates</h4>
                <p className="text-xs text-zinc-300 mt-1 max-w-2xl leading-relaxed">
                  High-value transactions (e.g. Purchase Orders &gt; ₹1,00,000 or Credit Notes) automatically require
                  departmental manager sign-off before vendor dispatch or financial ledger commitment.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0">
              <span className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 font-mono text-[11px] border border-zinc-700">
                Rule: PO &gt; ₹1L &rarr; Finance Head
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
