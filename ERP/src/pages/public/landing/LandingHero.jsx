import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Building2, Calculator, Layers, Zap } from 'lucide-react';
import { scrollToSection } from './landingData';

export default function LandingHero({ children, onOpenSignIn }) {
  const handleScrollToRoi = (e) => {
    scrollToSection(e, 'roi-calculator');
  };

  return (
    <section
      id="overview"
      className="scroll-mt-24 relative pt-32 pb-20 sm:pt-40 sm:pb-28 lg:pt-44 lg:pb-32 overflow-hidden bg-[#E8E9DF] dark:bg-[#071209] text-[#2E3D28] dark:text-white transition-colors duration-300"
      style={{
        background: 'var(--hero-bg, radial-gradient(ellipse 90% 80% at 50% -10%, var(--hero-radial-1, #D8DFC8) 0%, var(--hero-radial-2, #E8E9DF) 55%, var(--hero-radial-3, #EDEEE4) 100%))'
      }}
    >
      {/* Dynamic Theme Styles for Hero Background */}
      <style>{`
        .dark #overview {
          --hero-bg: radial-gradient(ellipse 90% 80% at 50% -10%, #15321B 0%, #0D2013 45%, #071209 80%, #040A05 100%);
        }
      `}</style>

      {/* ── 1. BACKGROUND MOVING DOT-GRID ── */}
      <div className="absolute inset-0 hero-dot-grid opacity-30 dark:opacity-35 pointer-events-none z-0 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_35%,black_40%,transparent_100%)]" />

      {/* ── 2. ATMOSPHERIC EMERALD & MINT AMBIENT MIST (BLOOMARTS AESTHETIC) ── */}
      <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-full max-w-7xl h-[850px] pointer-events-none z-0 overflow-hidden">
        {/* Giant Soft Ambient Bloom on Right-Center */}
        <div className="absolute top-[5%] right-[10%] lg:right-[15%] w-[480px] sm:w-[650px] h-[550px] bg-[#A9B887]/35 dark:bg-[#10B981]/25 rounded-full blur-[140px] animate-ambient-glow" />

        {/* Soft Left Ambient Glow for Balance */}
        <div className="absolute top-[20%] left-[5%] w-[380px] sm:w-[500px] h-[450px] bg-[#DCE2CF]/50 dark:bg-[#00F2AA]/10 rounded-full blur-[130px] animate-ambient-glow" style={{ animationDelay: '4s' }} />
      </div>

      {/* ── 3. DRAMATIC VERTICAL LIGHT BEAM (BLOOMARTS REFERENCE INSPIRATION) ── */}
      {/* Positioned on right-center, casting an intense beam downwards onto the floating dashboard */}
      <div className="absolute top-0 right-[15%] sm:right-[22%] lg:right-[26%] w-[280px] sm:w-[380px] h-[780px] pointer-events-none z-0 overflow-hidden">
        {/* Soft Volumetric Outer Beam */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-[#10B981]/35 via-[#00F2AA]/18 to-transparent blur-[70px] animate-light-beam" />

        {/* Ultra-intense Tapered Core Ray */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[3px] sm:w-[5px] h-[550px] bg-gradient-to-b from-white via-[#6EE7B7] to-transparent blur-[1.5px] opacity-95" />

        {/* Core Ray Corona Halo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40px] sm:w-[70px] h-[500px] bg-gradient-to-b from-white/70 via-[#34D399]/40 to-transparent blur-[18px] opacity-85" />

        {/* Radiant Flare / Bloom Explosion where beam kisses dashboard top edge */}
        <div className="absolute bottom-[80px] left-1/2 -translate-x-1/2 w-[220px] sm:w-[320px] h-[160px] bg-gradient-to-t from-[#00F2AA]/45 via-[#10B981]/30 to-transparent rounded-full blur-[45px] animate-beam-flare" />
      </div>

      {/* ── 4. SUBTLE DRIFTING PARTICLES & SPARKLES ── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute top-[22%] left-[16%] w-1.5 h-1.5 rounded-full bg-[#16A34A] dark:bg-[#34D399] shadow-[0_0_8px_#34D399]"
          style={{ animation: 'particleFloat 7s ease-in-out infinite' }}
        />
        <div
          className="absolute top-[35%] right-[20%] w-1 h-1 rounded-full bg-[#10B981] dark:bg-[#00F2AA] shadow-[0_0_6px_#00F2AA]"
          style={{ animation: 'particleFloat 8.5s ease-in-out infinite 1.5s' }}
        />
        <div
          className="absolute top-[52%] left-[26%] w-1.5 h-1.5 rounded-full bg-[#A9B887] shadow-[0_0_8px_#A9B887]"
          style={{ animation: 'particleFloat 6s ease-in-out infinite 2.5s' }}
        />
        <div
          className="absolute top-[68%] right-[14%] w-1 h-1 rounded-full bg-[#16A34A] dark:bg-[#34D399] shadow-[0_0_6px_#34D399]"
          style={{ animation: 'particleFloat 9s ease-in-out infinite 3.5s' }}
        />
      </div>

      {/* ── 5. MAIN HERO CONTENT ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto animate-hero-fade-up">
          {/* Eyebrow Pill with Pulsing Emerald Radar Dot */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F7F7F0] dark:bg-[#112415]/90 border border-[#D5D8CA] dark:border-[#10B981]/40 text-[#2E3D28] dark:text-[#DCE2CF] text-xs font-semibold mb-6 shadow-sm dark:shadow-[0_0_20px_rgba(16,185,129,0.15)] backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-radar-pulse absolute inline-flex h-full w-full rounded-full bg-[#16A34A] dark:bg-[#10B981] opacity-80" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16A34A] dark:bg-[#10B981]" />
            </span>
            <span className="text-[#2E3D28] dark:text-[#F7F7F0]">Multi-Company Enterprise Cloud ERP</span>
            <span className="text-[#16A34A] dark:text-[#34D399]">•</span>
            <span className="text-[#485942] dark:text-[#A9B887]">India GST Ready</span>
            <span className="hidden sm:inline text-[#D5D8CA] dark:text-[#10B981]/60">•</span>
            <span className="hidden sm:inline text-[#7A8A6E] dark:text-[#DCE2CF] font-mono text-[10px]">v2.4 Enterprise</span>
          </div>

          {/* Premium Headline (Inspired by BloomArts High-Impact Layout) */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-black tracking-tight text-[#2E3D28] dark:text-white leading-[1.12] sm:leading-[1.08]">
            <span className="block text-[#2E3D28] dark:text-[#F7F7F0]">Unify Your Business.</span>
            <span className="block mt-1 bg-gradient-to-r from-[#2E3D28] via-[#16A34A] to-[#10B981] dark:from-white dark:via-[#6EE7B7] dark:to-[#10B981] bg-clip-text text-transparent">
              Control Every Operation.
            </span>
          </h1>

          {/* Supporting Text Explaining Mark2 ERP */}
          <p className="mt-5 sm:mt-6 text-sm sm:text-base lg:text-lg text-[#485942] dark:text-[#DCE2CF] max-w-3xl mx-auto font-normal leading-relaxed text-balance">
            One unified enterprise platform for accounting, sales, procurement, multi-warehouse inventory and Indian GST compliance.
          </p>

          {/* Primary & Secondary Call to Actions */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              to="/try-free"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 h-12 rounded-xl bg-[#10B981] text-[#051A0E] text-sm font-bold hover:bg-[#34D399] active:bg-[#059669] transition-all duration-150 active:scale-[0.98] animate-cta-glow group shadow-md"
            >
              <Sparkles size={16} className="text-[#051A0E]" />
              <span>Start 30-Day Free Trial</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            <a
              href="#roi-calculator"
              onClick={handleScrollToRoi}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 h-12 rounded-xl bg-[#F7F7F0] dark:bg-white/5 text-[#2E3D28] dark:text-[#F7F7F0] text-sm font-semibold border border-[#D5D8CA] dark:border-white/20 hover:bg-white dark:hover:bg-white/10 hover:border-[#10B981]/50 transition-all cursor-pointer shadow-xs backdrop-blur-sm"
            >
              <Calculator size={16} className="text-[#16A34A] dark:text-[#34D399]" />
              <span>Calculate Your Savings</span>
            </a>
          </div>

          {/* Micro Trust Details */}
          <div className="mt-7 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2.5 sm:gap-5 text-xs text-[#485942] dark:text-[#A9B887] font-medium">
            <span className="flex items-center gap-1.5 text-[#2E3D28] dark:text-[#DCE2CF]">
              <CheckCircle2 size={14} className="text-[#16A34A] dark:text-[#10B981] shrink-0" /> Full 30-day access to all 6 modules
            </span>
            <span className="hidden sm:inline text-[#D5D8CA] dark:text-white/20">•</span>
            <span className="flex items-center gap-1.5 text-[#2E3D28] dark:text-[#DCE2CF]">
              <CheckCircle2 size={14} className="text-[#16A34A] dark:text-[#10B981] shrink-0" /> No credit card required
            </span>
            <span className="hidden sm:inline text-[#D5D8CA] dark:text-white/20">•</span>
            <span className="flex items-center gap-1.5 text-[#2E3D28] dark:text-[#DCE2CF]">
              <Building2 size={14} className="text-[#16A34A] dark:text-[#10B981] shrink-0" /> Up to 4 companies on trial
            </span>
            <span className="hidden sm:inline text-[#D5D8CA] dark:text-white/20">•</span>
            <span className="flex items-center gap-1.5 text-[#2E3D28] dark:text-[#DCE2CF]">
              <ShieldCheck size={14} className="text-[#16A34A] dark:text-[#10B981] shrink-0" /> Strict tenant isolation
            </span>
          </div>
        </div>

        {/* ── 6. LARGE FLOATING ERP DASHBOARD PREVIEW ── */}
        <div className="mt-12 sm:mt-16 animate-float-gentle">
          {children}
        </div>
      </div>
    </section>
  );
}
