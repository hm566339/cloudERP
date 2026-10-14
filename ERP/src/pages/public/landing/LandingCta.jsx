import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function LandingCta() {
  return (
    <section className="py-20 bg-gradient-to-b from-slate-50 to-white border-t border-zinc-200/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-zinc-950 text-white rounded-3xl p-6 sm:p-10 md:p-14 relative overflow-hidden shadow-xl">
          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Sparkles size={13} />
              <span>Setup in 60 Seconds</span>
            </span>

            <h2 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-white">
              Start your 30-day free trial
            </h2>

            <p className="text-sm text-zinc-400 leading-relaxed">
              No credit card required to get started. Empower your team with unified multi-company operations,
              inventory visibility, and audited financial statements.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/try-free"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 h-12 rounded-xl bg-white text-zinc-900 text-sm font-semibold hover:bg-zinc-100 transition-colors active:scale-[0.98] shadow-md group"
              >
                <span>Start Free Trial</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 h-12 rounded-xl border border-zinc-700 text-white text-sm font-semibold hover:bg-zinc-800 transition-colors active:scale-[0.98]"
              >
                <span>Sign In</span>
              </Link>
            </div>

            <p className="text-[11px] text-zinc-500 pt-2">
              No credit card required to get started • Full feature access • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
