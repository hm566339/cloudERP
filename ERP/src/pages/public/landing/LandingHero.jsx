import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function LandingHero({ children }) {
  return (
    <section id="overview" className="scroll-mt-24 relative pt-28 pb-16 sm:pt-36 sm:pb-24 lg:pt-40 lg:pb-28 overflow-hidden bg-[#E8E9DF]">
      {/* Soft Ambient Sage Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-5%] left-[20%] w-[500px] h-[500px] bg-[#A9B887]/20 rounded-full blur-[120px]" />
        <div className="absolute top-[10%] right-[15%] w-[450px] h-[450px] bg-[#DCE2CF]/40 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F7F7F0] border border-[#D5D8CA] text-[#2E3D28] text-xs font-semibold mb-6 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#2E3D28] animate-pulse" />
          <span>Multi-Company Enterprise Cloud ERP • India Ready</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight text-[#2E3D28] max-w-4xl mx-auto leading-[1.18] sm:leading-[1.12]">
          Unify Your Accounts, Supply Chain & Taxes in{' '}
          <span className="text-[#2E3D28]">
            One Intelligent ERP
          </span>
        </h1>

        {/* Supporting Proposition */}
        <p className="mt-4 sm:mt-5 text-sm sm:text-base lg:text-lg text-[#485942] max-w-3xl mx-auto font-normal leading-relaxed">
          Manage multiple companies with shared master records, audited general ledgers, end-to-end order-to-cash,
          procure-to-pay pipelines, multi-warehouse stock, and automated GSTR-1, 2B, 3B compliance.
        </p>

        {/* Primary & Secondary CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/try-free"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-[#2E3D28] text-white text-sm font-semibold hover:bg-[#3C4E34] active:bg-[#243320] transition-colors active:scale-[0.98] shadow-md group"
          >
            <span>Start 30-Day Free Trial</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Micro Trust Details */}
        <div className="mt-6 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-xs text-[#485942] font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-[#2E3D28] shrink-0" /> Full 30-day access to all modules
          </span>
          <span className="hidden sm:inline text-[#D5D8CA]">•</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-[#2E3D28] shrink-0" /> No credit card required
          </span>
          <span className="hidden sm:inline text-[#D5D8CA]">•</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-[#2E3D28] shrink-0" /> Strict tenant isolation & encrypted sessions
          </span>
        </div>

        {/* Real ERP Interactive Demonstration Window */}
        {children}
      </div>
    </section>
  );
}
