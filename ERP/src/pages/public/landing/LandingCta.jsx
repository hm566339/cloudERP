import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function LandingCta({ onOpenSignIn }) {
  return (
    <section className="py-20 bg-[#E8E9DF] dark:bg-[#101411] border-t border-[#D5D8CA] dark:border-[#263328] relative transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-[#2E3D28] dark:bg-[#0A120B] text-white rounded-3xl p-7 sm:p-12 md:p-16 relative overflow-hidden shadow-2xl border border-[#243320] dark:border-[#1E2D22]">
          {/* Subtle ambient lighting */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#A9B887]/15 dark:bg-[#10B981]/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#DCE2CF]/10 dark:bg-[#00F2AA]/15 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#3C4E34] dark:bg-[#16241A] text-[#DCE2CF] dark:text-[#A3B5A5] border border-[#A9B887]/30 dark:border-[#34D399]/30 text-xs font-semibold">
              <Sparkles size={13} className="text-[#A9B887] dark:text-[#34D399]" />
              <span>Self-Provision in Under 60 Seconds</span>
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight text-white">
              Launch Your 30-Day Enterprise Free Trial
            </h2>

            <p className="text-sm text-[#E8E9DF] dark:text-[#A3B5A5] leading-relaxed max-w-xl mx-auto">
              No credit card required. Experience unified accounts, order-to-cash, procure-to-pay,
              multi-warehouse stock, and Indian statutory GST compliance today.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/try-free"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 h-12 rounded-xl bg-[#F7F7F0] dark:bg-[#10B981] text-[#2E3D28] dark:text-[#051A0E] text-sm font-bold hover:bg-white dark:hover:bg-[#34D399] active:bg-[#EDEEE4] transition-all duration-150 active:scale-[0.98] shadow-md dark:shadow-[0_0_25px_rgba(16,185,129,0.3)] group animate-cta-glow"
              >
                <span>Start Free Trial</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              {onOpenSignIn ? (
                <button
                  type="button"
                  onClick={onOpenSignIn}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 h-12 rounded-xl border border-[#A9B887] dark:border-[#34D399]/60 text-white text-sm font-semibold hover:bg-[#3C4E34] dark:hover:bg-[#1A281E] transition-colors active:scale-[0.98]"
                >
                  <span>Sign In to Portal</span>
                </button>
              ) : (
                <Link
                  to="/"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 h-12 rounded-xl border border-[#A9B887] dark:border-[#34D399]/60 text-white text-sm font-semibold hover:bg-[#3C4E34] dark:hover:bg-[#1A281E] transition-colors active:scale-[0.98]"
                >
                  <span>Sign In</span>
                </Link>
              )}
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-[11px] text-[#DCE2CF] dark:text-[#A3B5A5]">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={13} className="text-[#A9B887] dark:text-[#34D399]" /> Up to 4 companies on trial
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 size={13} className="text-[#A9B887] dark:text-[#34D399]" /> 10 users per company
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <ShieldCheck size={13} className="text-[#A9B887] dark:text-[#34D399]" /> Strict multi-tenant isolation
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
