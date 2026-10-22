import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { ERP_MODULES } from './landingData';

// Color map tailored to website theme tokens
const COLOR_THEMES = {
  emerald: {
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-600',
    dot: 'bg-emerald-500',
  },
  blue: {
    badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/30',
    iconBg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
    hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-600',
    dot: 'bg-blue-500',
  },
  amber: {
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30',
    iconBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
    hoverBorder: 'hover:border-amber-300 dark:hover:border-amber-600',
    dot: 'bg-amber-500',
  },
  indigo: {
    badge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20 dark:border-indigo-500/30',
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400',
    hoverBorder: 'hover:border-indigo-300 dark:hover:border-indigo-600',
    dot: 'bg-indigo-500',
  },
  purple: {
    badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20 dark:border-purple-500/30',
    iconBg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400',
    hoverBorder: 'hover:border-purple-300 dark:hover:border-purple-600',
    dot: 'bg-purple-500',
  },
};

export default function LandingModules() {
  return (
    <section id="modules" className="scroll-mt-24 py-20 sm:py-28 bg-zinc-50/80 dark:bg-[#0F1117] border-t border-zinc-200/80 dark:border-[#2A2F3D] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-200/70 dark:bg-[#1D212C] text-zinc-700 dark:text-[#A0A6B5] text-xs font-bold uppercase tracking-wider mb-3">
            Integrated Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-zinc-900 dark:text-[#E6E8EE] tracking-tight">
            Complete Enterprise Stack, Zero Silos
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-[#A0A6B5] mt-4 leading-relaxed">
            Every business pillar connects to the same real-time general ledger and customer/item masters.
            Experience total visibility without third-party integration overhead.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {ERP_MODULES.map((mod) => {
            const Icon = mod.icon;
            const theme = COLOR_THEMES[mod.color] || COLOR_THEMES.emerald;

            return (
              <div
                key={mod.id}
                className={`group bg-white dark:bg-[#161922] rounded-2xl sm:rounded-3xl border border-zinc-200/90 dark:border-[#2A2F3D] p-6 sm:p-7 shadow-sm hover:shadow-xl ${theme.hoverBorder} transition-all duration-standard ease-enter flex flex-col justify-between relative overflow-hidden`}
              >
                {/* Top subtle decorative accent line */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${theme.dot} opacity-0 group-hover:opacity-100 transition-opacity duration-standard`} />

                <div>
                  {/* Card Header: Icon + Badge */}
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-12 h-12 rounded-2xl ${theme.iconBg} flex items-center justify-center transition-transform group-hover:scale-105 duration-micro`}>
                      <Icon size={24} />
                    </div>
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${theme.badge}`}>
                      {mod.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-[#E6E8EE] mb-2 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">
                    {mod.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-[#A0A6B5] leading-relaxed mb-6">
                    {mod.description}
                  </p>
                </div>

                {/* Feature Bullet List */}
                <div className="pt-4 border-t border-zinc-100 dark:border-[#2A2F3D] space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184] block mb-1">
                    Core Inclusions
                  </span>
                  {mod.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5 text-xs text-zinc-700 dark:text-[#E6E8EE]">
                      <div className="w-4 h-4 rounded-full bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check size={11} className="stroke-[3]" />
                      </div>
                      <span className="font-medium">{feat}</span>
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
