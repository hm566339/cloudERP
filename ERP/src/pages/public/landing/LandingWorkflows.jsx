import React, { useState, useEffect } from 'react';
import { BUSINESS_PIPELINES, checkPrefersReducedMotion } from './landingData';
import { GitBranch, CheckCircle2, ArrowRight, Play, Pause } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingWorkflows() {
  const [activePipeline, setActivePipeline] = useState(0);
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [stepProgress, setStepProgress] = useState(0);

  const currentPipeline = BUSINESS_PIPELINES[activePipeline] || BUSINESS_PIPELINES[0];
  const activeStep = currentPipeline.steps[selectedStepIndex] || currentPipeline.steps[0];
  const StepIcon = activeStep.icon;

  // Auto-advance lifecycle simulation (4.5s per phase)
  useEffect(() => {
    if (!isAutoPlaying || checkPrefersReducedMotion()) return;

    const intervalTime = 4500;
    const stepInterval = 50;
    const progressDelta = (stepInterval / intervalTime) * 100;

    const interval = setInterval(() => {
      setStepProgress((prev) => {
        if (prev >= 100) {
          setSelectedStepIndex((curr) => (curr + 1) % currentPipeline.steps.length);
          return 0;
        }
        return prev + progressDelta;
      });
    }, stepInterval);

    return () => clearInterval(interval);
  }, [isAutoPlaying, currentPipeline.steps.length]);

  const handlePipelineSwitch = (idx) => {
    setActivePipeline(idx);
    setSelectedStepIndex(0);
    setStepProgress(0);
  };

  const handleStepClick = (idx) => {
    setSelectedStepIndex(idx);
    setStepProgress(0);
    // Pause briefly for 10 seconds if user interacts manually
    setIsAutoPlaying(false);
    setTimeout(() => {
      setIsAutoPlaying(true);
    }, 10000);
  };

  return (
    <section
      id="workflows"
      className="scroll-mt-24 py-20 sm:py-28 bg-[#2E3D28] dark:bg-[#0A120B] text-white relative overflow-hidden border-t border-[#243320] dark:border-[#172319] transition-colors duration-300"
    >
      {/* Background ambient lighting with soft breathing motion */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#A9B887]/15 dark:bg-[#10B981]/15 rounded-full blur-[140px] pointer-events-none animate-ambient-glow" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#DCE2CF]/10 dark:bg-[#00F2AA]/10 rounded-full blur-[140px] pointer-events-none animate-ambient-glow" style={{ animationDelay: '4s' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3C4E34] dark:bg-[#162319] border border-[#A9B887]/30 dark:border-[#34D399]/30 text-[#DCE2CF] dark:text-[#A3B5A5] text-xs font-semibold mb-3">
            <GitBranch size={13} className="text-[#A9B887] dark:text-[#34D399]" />
            <span>End-to-End Enterprise Automation</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight text-white">
            Connected Pipelines with Built-in Governance
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#E8E9DF] dark:text-[#A3B5A5] leading-relaxed">
            Eliminate double data-entry and operational blindspots. Documents flow seamlessly across sales,
            inventory, procurement, and accounting with immutable audit trails.
          </p>
        </div>

        {/* Pipeline Tab Switcher */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1.5 rounded-2xl bg-[#243320] dark:bg-[#111A13] border border-[#3C4E34] dark:border-[#223326] shadow-inner">
            {BUSINESS_PIPELINES.map((pipe, idx) => (
              <button
                key={pipe.id || pipe.title}
                type="button"
                onClick={() => handlePipelineSwitch(idx)}
                className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 ${
                  activePipeline === idx
                    ? 'bg-[#A9B887] dark:bg-[#34D399] text-[#2E3D28] dark:text-[#051A0E] shadow-md font-bold'
                    : 'text-[#DCE2CF] dark:text-[#A3B5A5] hover:text-white hover:bg-[#3C4E34]/50 dark:hover:bg-[#1A261D]'
                }`}
              >
                {pipe.title}
              </button>
            ))}
          </div>
        </div>

        {/* Pipeline Flow Visualizer Card */}
        <div className="bg-[#243320]/95 dark:bg-[#121A14]/95 rounded-3xl border border-[#3C4E34] dark:border-[#26382B] p-6 sm:p-10 shadow-2xl backdrop-blur-sm">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3C4E34] dark:border-[#26382B] pb-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#A9B887] dark:bg-[#34D399]" />
                {currentPipeline.title}
              </h3>
              <p className="text-xs text-[#DCE2CF] dark:text-[#A3B5A5] mt-1">{currentPipeline.description}</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Simulation status pill */}
              <div className="inline-flex items-center gap-2 text-xs font-mono text-[#A9B887] dark:text-[#34D399] bg-[#2E3D28] dark:bg-[#1A261D] border border-[#A9B887]/40 dark:border-[#34D399]/40 px-3 py-1.5 rounded-xl shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-radar-pulse absolute inline-flex h-full w-full rounded-full bg-[#A9B887] dark:bg-[#34D399] opacity-80" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A9B887] dark:bg-[#34D399]" />
                </span>
                <span>Lifecycle Simulation Active</span>
                <button
                  type="button"
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className="ml-1 text-[#DCE2CF] dark:text-[#A3B5A5] hover:text-white"
                  aria-label={isAutoPlaying ? 'Pause workflow simulation' : 'Play workflow simulation'}
                >
                  {isAutoPlaying ? <Pause size={12} /> : <Play size={12} />}
                </button>
              </div>

              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-[#DCE2CF] dark:text-[#A3B5A5] bg-[#2E3D28] dark:bg-[#1A261D] border border-[#3C4E34] dark:border-[#26382B] px-3 py-1.5 rounded-xl">
                <CheckCircle2 size={13} className="text-[#A9B887] dark:text-[#34D399]" /> Auto-Ledger Posting
              </span>
            </div>
          </div>

          {/* Connected SVG Flow Line between Pipeline Steps (Desktop View) */}
          <div className="hidden md:block relative mb-3">
            <svg className="w-full h-8 overflow-visible" viewBox="0 0 1000 32">
              <defs>
                <linearGradient id="streamGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3C4E34" />
                  <stop offset="50%" stopColor="#34D399" />
                  <stop offset="100%" stopColor="#3C4E34" />
                </linearGradient>
              </defs>

              {/* Background connector track */}
              <line x1="80" y1="16" x2="920" y2="16" stroke="#2E3D31" strokeWidth="2.5" />

              {/* Animated streaming dashes flow line */}
              <line
                x1="80"
                y1="16"
                x2="920"
                y2="16"
                stroke="url(#streamGrad)"
                strokeWidth="2.5"
                className="animate-stream-dashes"
              />

              {/* Dynamic traveling pulse point aligned to selected phase */}
              <circle
                cx={100 + selectedStepIndex * 200}
                cy="16"
                r="6"
                fill="#34D399"
                className="transition-all duration-500 ease-out"
              />
              <circle
                cx={100 + selectedStepIndex * 200}
                cy="16"
                r="12"
                fill="none"
                stroke="#34D399"
                strokeWidth="2"
                opacity="0.5"
                className="animate-ping"
              />
            </svg>
          </div>

          {/* Interactive 5-Step Pipeline Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 mb-8">
            {currentPipeline.steps.map((step, idx) => {
              const Icon = step.icon;
              const isSelected = selectedStepIndex === idx;

              return (
                <button
                  key={step.name}
                  type="button"
                  onClick={() => handleStepClick(idx)}
                  className={`text-left p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-[#3C4E34] dark:bg-[#1E2D22] border-[#A9B887] dark:border-[#34D399] shadow-xl ring-2 ring-[#A9B887]/50 dark:ring-[#34D399]/50 scale-[1.03]'
                      : 'bg-[#2E3D28] dark:bg-[#162018] border-[#3C4E34] dark:border-[#26382B] hover:border-[#A9B887]/60 dark:hover:border-[#34D399]/60 hover:bg-[#34442E] dark:hover:bg-[#1B261D]'
                  }`}
                >
                  {/* Subtle top progress bar if currently active */}
                  {isSelected && isAutoPlaying && (
                    <div
                      className="absolute top-0 left-0 h-1 bg-[#A9B887] dark:bg-[#34D399] transition-all duration-75"
                      style={{ width: `${stepProgress}%` }}
                    />
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-transform ${
                        isSelected
                          ? 'bg-[#A9B887] dark:bg-[#34D399] text-[#2E3D28] dark:text-[#051A0E] border-[#A9B887] dark:border-[#34D399] scale-110'
                          : 'bg-[#3C4E34] dark:bg-[#1E2D22] text-[#A9B887] dark:text-[#34D399] border-[#A9B887]/30 dark:border-[#34D399]/30'
                      }`}>
                        <Icon size={16} />
                      </div>
                      <span className="font-mono text-xs font-bold text-[#A9B887] dark:text-[#34D399]">
                        0{idx + 1}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-1">
                      {step.name}
                    </h4>
                    <span className="text-[10px] font-mono text-[#DCE2CF] dark:text-[#A3B5A5] block">
                      Code: {step.code}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#3C4E34]/80 dark:border-[#26382B] flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#A9B887] dark:text-[#34D399] font-semibold">{step.metric}</span>
                    <span className={`text-[#DCE2CF] dark:text-[#A3B5A5] transition-transform ${isSelected ? 'translate-x-1 text-[#A9B887] dark:text-[#34D399]' : ''}`}>
                      &rarr;
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Step Deep-Dive Inspector */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#2E3D28] dark:bg-[#162018] border border-[#3C4E34] dark:border-[#26382B] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-[#3C4E34] dark:bg-[#1E2D22] text-[#A9B887] dark:text-[#34D399] flex items-center justify-center shrink-0 border border-[#A9B887]/40 dark:border-[#34D399]/40 shadow-xs">
                <StepIcon size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-[#A9B887] dark:text-[#34D399]">
                    Phase 0{selectedStepIndex + 1} &bull; {activeStep.code}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#3C4E34] dark:bg-[#1E2D22] text-[#DCE2CF] dark:text-[#ECF2EC] border border-[#A9B887]/30 dark:border-[#34D399]/30">
                    Automated Step
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#243320] dark:bg-[#121A14] text-[#A9B887] dark:text-[#34D399] border border-[#A9B887]/20 dark:border-[#34D399]/20">
                    Audited
                  </span>
                </div>
                <h4 className="text-base font-bold text-white mb-1">
                  {activeStep.name}: {activeStep.metric}
                </h4>
                <p className="text-xs text-[#DCE2CF] dark:text-[#A3B5A5] leading-relaxed max-w-2xl">
                  {activeStep.detail} All financial allocations update the central ledger automatically upon confirmation, ensuring zero data discrepancies.
                </p>
              </div>
            </div>

            <Link
              to="/try-free"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#A9B887] dark:bg-[#10B981] text-[#2E3D28] dark:text-[#051A0E] text-xs font-bold hover:bg-[#B8C896] dark:hover:bg-[#34D399] transition-colors shrink-0 shadow-xs"
            >
              <span>Test This Pipeline</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
