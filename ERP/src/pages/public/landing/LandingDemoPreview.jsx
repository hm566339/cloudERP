import React, { useState, useEffect, useRef } from 'react';
import {
  Banknote,
  ShoppingCart,
  Briefcase,
  Box,
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowRight,
  Truck,
  Receipt,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  Building2,
  Activity,
  FileCheck2,
  Search,
  Filter
} from 'lucide-react';
import { LIVE_DEMO_OPERATIONS, checkPrefersReducedMotion } from './landingData';

/**
 * Animated Number Counter component
 * Smoothly interpolates numeric values with Indian currency / unit formatting
 */
function AnimatedCounter({ value, prefix = '', suffix = '', duration = 1200 }) {
  const [displayValue, setDisplayValue] = useState(0);
  const numericTarget = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, '')) || 0;

  useEffect(() => {
    if (checkPrefersReducedMotion()) {
      setDisplayValue(numericTarget);
      return;
    }

    let startTimestamp = null;
    let animationFrameId = null;
    const startVal = displayValue;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (numericTarget - startVal) * eased);
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [numericTarget, duration]);

  const formatted = displayValue.toLocaleString('en-IN');
  return (
    <span>
      {prefix}{formatted}{suffix}
    </span>
  );
}

export default function LandingDemoPreview() {
  const [previewTab, setPreviewTab] = useState('finance');
  const [activeSimIndex, setActiveSimIndex] = useState(0);
  const [isSimPaused, setIsSimPaused] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const [tilt, setTilt] = useState({ rx: 1.2, ry: -0.6 });
  const containerRef = useRef(null);

  const activeSimEvent = LIVE_DEMO_OPERATIONS[activeSimIndex] || LIVE_DEMO_OPERATIONS[0];

  // 1. Live Operations Simulation Timer (4.5s cadence)
  useEffect(() => {
    if (isSimPaused || checkPrefersReducedMotion()) return;

    const intervalTime = 4500;
    const stepTime = 50;
    const stepDelta = (stepTime / intervalTime) * 100;

    const timer = setInterval(() => {
      setSimProgress((prev) => {
        if (prev >= 100) {
          setActiveSimIndex((curr) => (curr + 1) % LIVE_DEMO_OPERATIONS.length);
          return 0;
        }
        return prev + stepDelta;
      });
    }, stepTime);

    return () => clearInterval(timer);
  }, [isSimPaused]);

  // 2. Subtle 3D Perspective Mouse Interaction (Desktop only)
  const handleMouseMove = (e) => {
    if (checkPrefersReducedMotion() || typeof window === 'undefined' || window.innerWidth < 1024) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rx = ((y - centerY) / centerY) * -2.5; // max ±2.5 deg tilt
    const ry = ((x - centerX) / centerX) * 2.5;

    setTilt({ rx: parseFloat(rx.toFixed(2)), ry: parseFloat(ry.toFixed(2)) });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 1.2, ry: -0.6 });
  };

  return (
    <div className="max-w-5xl mx-auto relative group">
      {/* Subtle Floating Satellite Card 1 - Top Right */}
      <div className="hidden lg:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#F7F7F0] dark:bg-[#161D17] border border-[#D5D8CA] dark:border-[#2E3D31] shadow-md dark:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] absolute -top-5 -right-4 z-20 animate-float-card-1 backdrop-blur-xs text-xs text-[#2E3D28] dark:text-[#ECF2EC] font-semibold transition-colors">
        <span className="w-2 h-2 rounded-full bg-[#16A34A] dark:bg-[#34D399] animate-pulse" />
        <span className="font-mono text-[11px] text-[#485942] dark:text-[#A3B5A5]">Real-Time General Ledger:</span>
        <span className="text-[#2E3D28] dark:text-[#34D399] font-bold">100% Balanced</span>
      </div>

      {/* Subtle Floating Satellite Card 2 - Bottom Left */}
      <div className="hidden lg:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#F7F7F0] dark:bg-[#161D17] border border-[#D5D8CA] dark:border-[#2E3D31] shadow-md dark:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] absolute -bottom-4 -left-4 z-20 animate-float-card-2 backdrop-blur-xs text-xs text-[#2E3D28] dark:text-[#ECF2EC] font-semibold transition-colors">
        <ShieldCheck size={14} className="text-[#16A34A] dark:text-[#34D399]" />
        <span className="font-mono text-[11px] text-[#485942] dark:text-[#A3B5A5]">Statutory Engine:</span>
        <span className="text-[#2E3D28] dark:text-[#34D399] font-bold">GSTR-1 & 3B Reconciled</span>
      </div>

      {/* 3D Perspective Outer Container: Adapts between Light Mode (Warm Cream) and Dark Mode (Cinematic Dark Forest) */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `perspective(1200px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition: 'transform 0.25s cubic-bezier(0.2, 0.8, 0.4, 1)'
        }}
        className="rounded-3xl border border-[#D5D8CA] dark:border-[#2E3D31] dark:border-t-[#34D399]/70 bg-[#F7F7F0] dark:bg-[#121813] p-3 sm:p-5 shadow-[0_25px_70px_-15px_rgba(46,61,40,0.18)] dark:shadow-[0_30px_90px_-20px_rgba(0,0,0,0.85),0_0_50px_rgba(16,185,129,0.12)] text-left transition-colors duration-300"
      >
        {/* Window Header Mock */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-[#D5D8CA] dark:border-[#2E3D31] text-xs gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#E57373]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFB74D]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#81C784]" />
            <span className="ml-2 font-mono text-[11px] text-[#485942] dark:text-[#A3B5A5]">
              Mark2 ERP Cloud Workspace
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EDEEE4] dark:bg-[#1E2720] text-[#485942] dark:text-[#A3B5A5] border border-[#D5D8CA] dark:border-[#2E3D31]">
              Live Interactive Preview
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-2.5 py-0.5 rounded-md bg-[#EDEEE4] dark:bg-[#1E2720] text-[#2E3D28] dark:text-[#ECF2EC] font-bold font-mono border border-[#D5D8CA] dark:border-[#2E3D31]">
              Company: APEX INDUSTRIAL HQ
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#DCE2CF] dark:bg-[#162719] text-[#2E3D28] dark:text-[#34D399] font-bold border border-[#A9B887]/50 dark:border-[#10B981]/40 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-radar-pulse absolute inline-flex h-full w-full rounded-full bg-[#16A34A] dark:bg-[#34D399] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16A34A] dark:bg-[#34D399]" />
              </span>
              <span>Tenant Active</span>
            </span>
          </div>
        </div>

        {/* ── LIVE BUSINESS OPERATIONS SIMULATION TICKER ── */}
        <div className="my-2.5 p-2.5 sm:p-3 rounded-2xl bg-[#EDEEE4] dark:bg-[#18221A] border border-[#D5D8CA] dark:border-[#2E3D31] relative overflow-hidden transition-colors">
          {/* Progress Bar for Current Simulation Step */}
          <div
            className="absolute bottom-0 left-0 h-0.5 bg-[#2E3D28] dark:bg-[#34D399] transition-all duration-75"
            style={{ width: `${simProgress}%` }}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-start sm:items-center gap-2.5">
              {/* Radar Pulsing Live Indicator */}
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#F7F7F0] dark:bg-[#121813] border border-[#D5D8CA] dark:border-[#2E3D31] shrink-0 shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-radar-pulse absolute inline-flex h-full w-full rounded-full bg-[#16A34A] dark:bg-[#34D399] opacity-80" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16A34A] dark:bg-[#34D399]" />
                </span>
                <span className="font-mono text-[10px] font-bold text-[#16A34A] dark:text-[#34D399] uppercase tracking-wide">
                  Live Demo Simulation
                </span>
              </div>

              {/* Dynamic Animated Event Content */}
              <div key={activeSimEvent.id} className="animate-live-ticker flex flex-wrap items-center gap-1.5">
                <span className="font-mono font-bold text-[#2E3D28] dark:text-[#34D399] bg-[#DCE2CF] dark:bg-[#1E2C20] px-2 py-0.5 rounded text-[11px] border border-[#A9B887]/40 dark:border-[#2E3D31]">
                  {activeSimEvent.code}
                </span>
                <span className="font-bold text-[#2E3D28] dark:text-[#ECF2EC]">
                  {activeSimEvent.title}:
                </span>
                <span className="text-[#485942] dark:text-[#A3B5A5] hidden md:inline">
                  {activeSimEvent.details}
                </span>
                <span className="font-mono text-[10px] text-[#2E3D28] dark:text-[#34D399] font-semibold bg-[#F7F7F0] dark:bg-[#121813] px-2 py-0.5 rounded border border-[#D5D8CA] dark:border-[#2E3D31]">
                  {activeSimEvent.impact}
                </span>
              </div>
            </div>

            {/* Simulation Controls: Pause/Resume & Quick Tab Jump */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setPreviewTab(activeSimEvent.moduleTab)}
                className="text-[10px] font-mono font-bold text-[#2E3D28] dark:text-[#34D399] hover:underline flex items-center gap-1"
                title={`Inspect in ${activeSimEvent.categoryLabel} tab`}
              >
                Inspect Module &rarr;
              </button>
              <button
                type="button"
                onClick={() => setIsSimPaused(!isSimPaused)}
                className="p-1 rounded-md bg-[#F7F7F0] dark:bg-[#121813] border border-[#D5D8CA] dark:border-[#2E3D31] text-[#485942] dark:text-[#A3B5A5] hover:text-[#2E3D28] dark:hover:text-white transition-colors"
                title={isSimPaused ? 'Resume live simulation' : 'Pause live simulation'}
                aria-label={isSimPaused ? 'Resume simulation' : 'Pause simulation'}
              >
                {isSimPaused ? <Play size={12} /> : <Pause size={12} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── 5 CORE TABS: FINANCE, SALES, INVENTORY, PROCUREMENT, WORKFLOWS (+ GST) ── */}
        <div className="flex items-center gap-1.5 py-2.5 border-b border-[#D5D8CA] dark:border-[#2E3D31] overflow-x-auto text-xs scrollbar-none">
          <button
            type="button"
            onClick={() => setPreviewTab('finance')}
            className={`px-3.5 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              previewTab === 'finance'
                ? 'bg-[#2E3D28] dark:bg-[#34D399] text-white dark:text-[#051A0E] shadow-xs'
                : 'text-[#485942] dark:text-[#A3B5A5] hover:bg-[#EDEEE4] dark:hover:bg-[#1E2720] hover:text-[#2E3D28] dark:hover:text-white'
            }`}
          >
            <Banknote size={14} /> Finance & Ledgers
          </button>
          <button
            type="button"
            onClick={() => setPreviewTab('sales')}
            className={`px-3.5 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              previewTab === 'sales'
                ? 'bg-[#2E3D28] dark:bg-[#34D399] text-white dark:text-[#051A0E] shadow-xs'
                : 'text-[#485942] dark:text-[#A3B5A5] hover:bg-[#EDEEE4] dark:hover:bg-[#1E2720] hover:text-[#2E3D28] dark:hover:text-white'
            }`}
          >
            <ShoppingCart size={14} /> Sales & Invoices
          </button>
          <button
            type="button"
            onClick={() => setPreviewTab('inventory')}
            className={`px-3.5 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              previewTab === 'inventory'
                ? 'bg-[#2E3D28] dark:bg-[#34D399] text-white dark:text-[#051A0E] shadow-xs'
                : 'text-[#485942] dark:text-[#A3B5A5] hover:bg-[#EDEEE4] dark:hover:bg-[#1E2720] hover:text-[#2E3D28] dark:hover:text-white'
            }`}
          >
            <Box size={14} /> Multi-Warehouse Stock
          </button>
          <button
            type="button"
            onClick={() => setPreviewTab('purchase')}
            className={`px-3.5 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              previewTab === 'purchase'
                ? 'bg-[#2E3D28] dark:bg-[#34D399] text-white dark:text-[#051A0E] shadow-xs'
                : 'text-[#485942] dark:text-[#A3B5A5] hover:bg-[#EDEEE4] dark:hover:bg-[#1E2720] hover:text-[#2E3D28] dark:hover:text-white'
            }`}
          >
            <Briefcase size={14} /> Procurement
          </button>
          <button
            type="button"
            onClick={() => setPreviewTab('workflows')}
            className={`px-3.5 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              previewTab === 'workflows'
                ? 'bg-[#2E3D28] dark:bg-[#34D399] text-white dark:text-[#051A0E] shadow-xs'
                : 'text-[#485942] dark:text-[#A3B5A5] hover:bg-[#EDEEE4] dark:hover:bg-[#1E2720] hover:text-[#2E3D28] dark:hover:text-white'
            }`}
          >
            <GitBranch size={14} /> Approval Workflows
          </button>
          <button
            type="button"
            onClick={() => setPreviewTab('gst')}
            className={`px-3.5 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              previewTab === 'gst'
                ? 'bg-[#2E3D28] dark:bg-[#34D399] text-white dark:text-[#051A0E] shadow-xs'
                : 'text-[#485942] dark:text-[#A3B5A5] hover:bg-[#EDEEE4] dark:hover:bg-[#1E2720] hover:text-[#2E3D28] dark:hover:text-white'
            }`}
          >
            <ShieldCheck size={14} /> Statutory GST
          </button>
        </div>

        {/* ── TAB 1: FINANCE PREVIEW WITH ANIMATED COUNTERS & PROGRESSIVE REVENUE GRAPH ── */}
        {previewTab === 'finance' && (
          <div className="pt-4 space-y-4">
            {/* 4 Animated KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="p-3.5 rounded-2xl border border-[#D5D8CA] dark:border-[#2E3D31] bg-white dark:bg-[#181E19] shadow-2xs hover:shadow-sm transition-all">
                <div className="text-[11px] text-[#485942] dark:text-[#A3B5A5] mb-1">Monthly Sales Revenue</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28] dark:text-[#ECF2EC]">
                  <AnimatedCounter value={4285600} prefix="₹ " />
                </div>
                <div className="text-[10px] text-[#16A34A] dark:text-[#34D399] font-semibold mt-0.5 flex items-center gap-1">
                  <TrendingUp size={11} /> +14.2% vs last month
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-[#D5D8CA] dark:border-[#2E3D31] bg-white dark:bg-[#181E19] shadow-2xs hover:shadow-sm transition-all">
                <div className="text-[11px] text-[#485942] dark:text-[#A3B5A5] mb-1">Accounts Receivable (AR)</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28] dark:text-[#ECF2EC]">
                  <AnimatedCounter value={1840200} prefix="₹ " />
                </div>
                <div className="text-[10px] text-[#485942] dark:text-[#A3B5A5] mt-0.5">88% within credit period</div>
              </div>

              <div className="p-3.5 rounded-2xl border border-[#D5D8CA] dark:border-[#2E3D31] bg-white dark:bg-[#181E19] shadow-2xs hover:shadow-sm transition-all">
                <div className="text-[11px] text-[#485942] dark:text-[#A3B5A5] mb-1">Accounts Payable (AP)</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28] dark:text-[#ECF2EC]">
                  <AnimatedCounter value={915400} prefix="₹ " />
                </div>
                <div className="text-[10px] text-[#485942] dark:text-[#A3B5A5] mt-0.5">PO 3-way matched</div>
              </div>

              <div className="p-3.5 rounded-2xl border border-[#D5D8CA] dark:border-[#2E3D31] bg-white dark:bg-[#181E19] shadow-2xs hover:shadow-sm transition-all">
                <div className="text-[11px] text-[#485942] dark:text-[#A3B5A5] mb-1">Cash & Bank Balances</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28] dark:text-[#ECF2EC]">
                  <AnimatedCounter value={2672000} prefix="₹ " />
                </div>
                <div className="text-[10px] text-[#16A34A] dark:text-[#34D399] font-semibold mt-0.5">HDFC & ICICI reconciled</div>
              </div>
            </div>

            {/* Progressive Revenue SVG Graph Preview */}
            <div className="p-4 rounded-2xl border border-[#D5D8CA] dark:border-[#2E3D31] bg-white dark:bg-[#181E19] transition-colors">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#D5D8CA]/60 dark:border-[#2E3D31] text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#2E3D28] dark:text-[#ECF2EC]">Progressive Revenue Trajectory (FY 2026-27)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#EDEEE4] dark:bg-[#202922] text-[#485942] dark:text-[#A3B5A5]">
                    Drawing Live Trend
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#2E3D28] dark:text-[#34D399] font-bold">
                  Peak: ₹ 42.85 Lakhs (Current)
                </span>
              </div>

              <div className="h-28 w-full relative flex items-center justify-center">
                <svg viewBox="0 0 700 120" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="revenueGradLight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid Guidelines */}
                  <line x1="0" y1="20" x2="700" y2="20" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" className="text-[#D5D8CA] dark:text-[#2E3D31]" />
                  <line x1="0" y1="60" x2="700" y2="60" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" className="text-[#D5D8CA] dark:text-[#2E3D31]" />
                  <line x1="0" y1="100" x2="700" y2="100" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" className="text-[#D5D8CA] dark:text-[#2E3D31]" />

                  {/* Shaded Area Under Line */}
                  <polygon
                    points="0,110 0,95 120,80 240,65 360,72 480,45 600,28 700,16 700,110"
                    fill="url(#revenueGradLight)"
                  />

                  {/* Animated Progressive Line */}
                  <polyline
                    points="0,95 120,80 240,65 360,72 480,45 600,28 700,16"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data Points */}
                  <circle cx="120" cy="80" r="4" fill="#10B981" />
                  <circle cx="240" cy="65" r="4" fill="#10B981" />
                  <circle cx="360" cy="72" r="4" fill="#10B981" />
                  <circle cx="480" cy="45" r="4" fill="#10B981" />
                  <circle cx="600" cy="28" r="4" fill="#10B981" />

                  {/* Current Active Point with Radar Pulse Ring */}
                  <circle cx="700" cy="16" r="5" fill="#34D399" />
                  <circle cx="700" cy="16" r="10" fill="none" stroke="#34D399" strokeWidth="2" opacity="0.6" className="animate-ping" />
                </svg>
              </div>

              {/* Month Markers */}
              <div className="flex justify-between text-[10px] font-mono text-[#7A8A6E] dark:text-[#708573] pt-1 border-t border-[#D5D8CA]/40 dark:border-[#2E3D31]">
                <span>Nov 25 (₹26.4L)</span>
                <span>Dec 25 (₹29.1L)</span>
                <span>Jan 26 (₹32.8L)</span>
                <span>Feb 26 (₹30.5L)</span>
                <span>Mar 26 (₹37.2L)</span>
                <span className="font-bold text-[#2E3D28] dark:text-[#34D399]">Apr 26 (₹42.85L • Active)</span>
              </div>
            </div>

            {/* General Ledger Transactions Mock Table with Staggered Entrance */}
            <div className="rounded-2xl border border-[#D5D8CA] dark:border-[#2E3D31] bg-white dark:bg-[#181E19] overflow-hidden shadow-2xs">
              <div className="px-4 py-2.5 bg-[#EDEEE4] dark:bg-[#202922] border-b border-[#D5D8CA] dark:border-[#2E3D31] flex items-center justify-between text-xs">
                <span className="font-bold text-[#2E3D28] dark:text-[#ECF2EC]">Real-time General Ledger Entries</span>
                <span className="text-[10px] text-[#485942] dark:text-[#A3B5A5] font-mono">Double-Entry Validated</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F7F7F0] dark:bg-[#151B16] text-[#485942] dark:text-[#A3B5A5] border-b border-[#D5D8CA] dark:border-[#2E3D31] text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3.5 font-semibold">Voucher #</th>
                      <th className="py-2.5 px-3.5 font-semibold">Account Title</th>
                      <th className="py-2.5 px-3.5 font-semibold">Debit (₹)</th>
                      <th className="py-2.5 px-3.5 font-semibold">Credit (₹)</th>
                      <th className="py-2.5 px-3.5 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D5D8CA]/60 dark:divide-[#2E3D31] text-[#2E3D28] dark:text-[#ECF2EC]">
                    <tr className="hover:bg-[#F2F3EC] dark:hover:bg-[#202922] transition-colors">
                      <td className="py-2.5 px-3.5 font-mono text-[11px]">JV-2026-0891</td>
                      <td className="py-2.5 px-3.5 font-medium">HDFC Bank Operating A/c &bull; Customer Payment</td>
                      <td className="py-2.5 px-3.5 font-mono font-semibold">₹ 4,50,000</td>
                      <td className="py-2.5 px-3.5 font-mono text-[#7A8A6E] dark:text-[#708573]">-</td>
                      <td className="py-2.5 px-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCE2CF] dark:bg-[#1E2C20] text-[#2E3D28] dark:text-[#34D399] inline-flex items-center gap-1">
                          <CheckCircle2 size={10} className="text-[#16A34A] dark:text-[#34D399]" />
                          Balanced &bull; Posted
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#F2F3EC] dark:hover:bg-[#202922] transition-colors">
                      <td className="py-2.5 px-3.5 font-mono text-[11px]">JV-2026-0892</td>
                      <td className="py-2.5 px-3.5 font-medium">Acme Enterprises &bull; Accounts Receivable Tally</td>
                      <td className="py-2.5 px-3.5 font-mono text-[#7A8A6E] dark:text-[#708573]">-</td>
                      <td className="py-2.5 px-3.5 font-mono font-semibold">₹ 4,50,000</td>
                      <td className="py-2.5 px-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCE2CF] dark:bg-[#1E2C20] text-[#2E3D28] dark:text-[#34D399] inline-flex items-center gap-1">
                          <CheckCircle2 size={10} className="text-[#16A34A] dark:text-[#34D399]" />
                          Balanced &bull; Posted
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#F2F3EC] dark:hover:bg-[#202922] transition-colors">
                      <td className="py-2.5 px-3.5 font-mono text-[11px]">SINV-2026-104</td>
                      <td className="py-2.5 px-3.5 font-medium">IGST Output Tax Liability A/c (18%)</td>
                      <td className="py-2.5 px-3.5 font-mono text-[#7A8A6E] dark:text-[#708573]">-</td>
                      <td className="py-2.5 px-3.5 font-mono font-semibold">₹ 81,000</td>
                      <td className="py-2.5 px-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EDEEE4] dark:bg-[#202922] text-[#2E3D28] dark:text-[#A3B5A5]">
                          Statutory Tax Accrued
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: SALES PREVIEW ── */}
        {previewTab === 'sales' && (
          <div className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="p-3.5 rounded-2xl border border-[#D5D8CA] dark:border-[#2E3D31] bg-white dark:bg-[#181E19] shadow-2xs">
                <div className="text-[11px] text-[#485942] dark:text-[#A3B5A5] mb-1">Approved Quotations</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28] dark:text-[#ECF2EC]">
                  <AnimatedCounter value={18} suffix=" Quotes" />
                </div>
                <div className="text-[10px] text-[#16A34A] dark:text-[#34D399] font-semibold mt-0.5">₹ 62.4 Lakhs pipeline</div>
              </div>
              <div className="p-3.5 rounded-2xl border border-[#D5D8CA] dark:border-[#2E3D31] bg-white dark:bg-[#181E19] shadow-2xs">
                <div className="text-[11px] text-[#485942] dark:text-[#A3B5A5] mb-1">Confirmed Sales Orders</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28] dark:text-[#ECF2EC]">
                  <AnimatedCounter value={34} suffix=" Active Orders" />
                </div>
                <div className="text-[10px] text-[#485942] dark:text-[#A3B5A5] mt-0.5">Stock reserved in warehouse</div>
              </div>
              <div className="p-3.5 rounded-2xl border border-[#D5D8CA] dark:border-[#2E3D31] bg-white dark:bg-[#181E19] shadow-2xs">
                <div className="text-[11px] text-[#485942] dark:text-[#A3B5A5] mb-1">Delivery Challans</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28] dark:text-[#ECF2EC]">
                  <AnimatedCounter value={12} suffix=" Dispatched" />
                </div>
                <div className="text-[10px] text-[#16A34A] dark:text-[#34D399] font-semibold mt-0.5">Bin picking completed</div>
              </div>
              <div className="p-3.5 rounded-2xl border border-[#D5D8CA] dark:border-[#2E3D31] bg-white dark:bg-[#181E19] shadow-2xs">
                <div className="text-[11px] text-[#485942] dark:text-[#A3B5A5] mb-1">Tax Invoices Generated</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28] dark:text-[#ECF2EC]">
                  <AnimatedCounter value={3840000} prefix="₹ " />
                </div>
                <div className="text-[10px] text-[#485942] dark:text-[#A3B5A5] mt-0.5">100% GSTR-1 reconciled</div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#D5D8CA] dark:border-[#2E3D31] bg-white dark:bg-[#181E19] overflow-hidden shadow-2xs">
              <div className="px-4 py-2.5 bg-[#EDEEE4] dark:bg-[#202922] border-b border-[#D5D8CA] dark:border-[#2E3D31] flex items-center justify-between text-xs">
                <span className="font-bold text-[#2E3D28] dark:text-[#ECF2EC]">Order-to-Cash Live Registry</span>
                <span className="text-[10px] text-[#485942] dark:text-[#A3B5A5] font-mono">1-Click Document Conversion</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F7F7F0] dark:bg-[#151B16] text-[#485942] dark:text-[#A3B5A5] border-b border-[#D5D8CA] dark:border-[#2E3D31] text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3.5 font-semibold">Order #</th>
                      <th className="py-2.5 px-3.5 font-semibold">Customer & State</th>
                      <th className="py-2.5 px-3.5 font-semibold">Taxable Amount</th>
                      <th className="py-2.5 px-3.5 font-semibold">GST Component</th>
                      <th className="py-2.5 px-3.5 font-semibold">Fulfillment Stage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D5D8CA]/60 dark:divide-[#2E3D31] text-[#2E3D28] dark:text-[#ECF2EC]">
                    <tr className="hover:bg-[#F2F3EC] dark:hover:bg-[#202922] transition-colors">
                      <td className="py-2.5 px-3.5 font-mono text-[11px]">SO-2026-0341</td>
                      <td className="py-2.5 px-3.5 font-medium">Bharat Heavy Motors Ltd &bull; 27 Maharashtra</td>
                      <td className="py-2.5 px-3.5 font-mono">₹ 5,80,000</td>
                      <td className="py-2.5 px-3.5 font-mono">CGST + SGST (₹ 1,04,400)</td>
                      <td className="py-2.5 px-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCE2CF] dark:bg-[#1E2C20] text-[#2E3D28] dark:text-[#34D399]">
                          Challan Dispatched
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#F2F3EC] dark:hover:bg-[#202922] transition-colors">
                      <td className="py-2.5 px-3.5 font-mono text-[11px]">SO-2026-0342</td>
                      <td className="py-2.5 px-3.5 font-medium">Southern Aerospace Corp &bull; 29 Karnataka</td>
                      <td className="py-2.5 px-3.5 font-mono">₹ 12,40,000</td>
                      <td className="py-2.5 px-3.5 font-mono">IGST (₹ 2,23,200)</td>
                      <td className="py-2.5 px-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EDEEE4] dark:bg-[#202922] text-[#2E3D28] dark:text-[#A3B5A5]">
                          Tax Invoice Ready
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: MULTI-WAREHOUSE INVENTORY PREVIEW ── */}
        {previewTab === 'inventory' && (
          <div className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="p-3.5 rounded-2xl border border-[#D5D8CA] dark:border-[#2E3D31] bg-white dark:bg-[#181E19] shadow-2xs">
                <div className="text-[11px] text-[#485942] dark:text-[#A3B5A5] mb-1">Total Stock Items</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28] dark:text-[#ECF2EC]">
                  <AnimatedCounter value={2450} suffix=" SKUs" />
                </div>
                <div className="text-[10px] text-[#16A34A] dark:text-[#34D399] font-semibold mt-0.5">Active catalog</div>
              </div>
              <div className="p-3.5 rounded-2xl border border-[#D5D8CA] dark:border-[#2E3D31] bg-white dark:bg-[#181E19] shadow-2xs">
                <div className="text-[11px] text-[#485942] dark:text-[#A3B5A5] mb-1">Total Valuation (FIFO)</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28] dark:text-[#ECF2EC]">
                  <AnimatedCounter value={18245000} prefix="₹ " />
                </div>
                <div className="text-[10px] text-[#485942] dark:text-[#A3B5A5] mt-0.5">Cost layer verified</div>
              </div>
              <div className="p-3.5 rounded-2xl border border-[#D5D8CA] dark:border-[#2E3D31] bg-white dark:bg-[#181E19] shadow-2xs">
                <div className="text-[11px] text-[#485942] dark:text-[#A3B5A5] mb-1">Regional Warehouses</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28] dark:text-[#ECF2EC]">
                  <AnimatedCounter value={4} suffix=" Locations" />
                </div>
                <div className="text-[10px] text-[#485942] dark:text-[#A3B5A5] mt-0.5">Bhiwandi, BLR, Delhi, Pune</div>
              </div>
              <div className="p-3.5 rounded-2xl border border-[#D5D8CA] dark:border-[#2E3D31] bg-white dark:bg-[#181E19] shadow-2xs">
                <div className="text-[11px] text-[#485942] dark:text-[#A3B5A5] mb-1">Low Stock Alerts</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28] dark:text-[#ECF2EC]">
                  <AnimatedCounter value={3} suffix=" Items Reorder" />
                </div>
                <div className="text-[10px] text-[#485942] dark:text-[#A3B5A5] mt-0.5">Auto-PR triggered</div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#D5D8CA] dark:border-[#2E3D31] bg-white dark:bg-[#181E19] overflow-hidden shadow-2xs">
              <div className="px-4 py-2.5 bg-[#EDEEE4] dark:bg-[#202922] border-b border-[#D5D8CA] dark:border-[#2E3D31] flex items-center justify-between text-xs">
                <span className="font-bold text-[#2E3D28] dark:text-[#ECF2EC]">Multi-Location Inventory Registry</span>
                <span className="text-[10px] text-[#485942] dark:text-[#A3B5A5] font-mono">Bin Level Precision</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F7F7F0] dark:bg-[#151B16] text-[#485942] dark:text-[#A3B5A5] border-b border-[#D5D8CA] dark:border-[#2E3D31] text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3.5 font-semibold">SKU / Item</th>
                      <th className="py-2.5 px-3.5 font-semibold">Warehouse & Bin</th>
                      <th className="py-2.5 px-3.5 font-semibold">Batch / Serial</th>
                      <th className="py-2.5 px-3.5 font-semibold">Available Qty</th>
                      <th className="py-2.5 px-3.5 font-semibold">Valuation (FIFO)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D5D8CA]/60 dark:divide-[#2E3D31] text-[#2E3D28] dark:text-[#ECF2EC]">
                    <tr className="hover:bg-[#F2F3EC] dark:hover:bg-[#202922] transition-colors">
                      <td className="py-2.5 px-3.5 font-medium">Alloy Hydraulic Cylinder 40mm</td>
                      <td className="py-2.5 px-3.5 text-[#485942] dark:text-[#A3B5A5]">Bhiwandi Central &bull; Bin A-04</td>
                      <td className="py-2.5 px-3.5 font-mono text-[11px]">BT-2026-A12</td>
                      <td className="py-2.5 px-3.5 font-mono font-bold">140 Units</td>
                      <td className="py-2.5 px-3.5 font-mono">₹ 4,48,000</td>
                    </tr>
                    <tr className="hover:bg-[#F2F3EC] dark:hover:bg-[#202922] transition-colors">
                      <td className="py-2.5 px-3.5 font-medium">Precision Roller Bearing 6204</td>
                      <td className="py-2.5 px-3.5 text-[#485942] dark:text-[#A3B5A5]">Bangalore Plant &bull; Bin C-12</td>
                      <td className="py-2.5 px-3.5 font-mono text-[11px]">SN-9844-019</td>
                      <td className="py-2.5 px-3.5 font-mono font-bold">420 Units</td>
                      <td className="py-2.5 px-3.5 font-mono">₹ 2,73,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: PROCUREMENT & 3-WAY MATCH PREVIEW ── */}
        {previewTab === 'purchase' && (
          <div className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="p-3.5 rounded-2xl border border-[#D5D8CA] dark:border-[#2E3D31] bg-white dark:bg-[#181E19] shadow-2xs">
                <div className="text-[11px] text-[#485942] dark:text-[#A3B5A5] mb-1">Purchase Requisitions</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28] dark:text-[#ECF2EC]">
                  <AnimatedCounter value={6} suffix=" Pending" />
                </div>
                <div className="text-[10px] text-[#485942] dark:text-[#A3B5A5] mt-0.5">Budget authorization required</div>
              </div>
              <div className="p-3.5 rounded-2xl border border-[#D5D8CA] dark:border-[#2E3D31] bg-white dark:bg-[#181E19] shadow-2xs">
                <div className="text-[11px] text-[#485942] dark:text-[#A3B5A5] mb-1">Active RFQ Tenders</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28] dark:text-[#ECF2EC]">
                  <AnimatedCounter value={4} suffix=" Bidding" />
                </div>
                <div className="text-[10px] text-[#16A34A] dark:text-[#34D399] font-semibold mt-0.5">3+ vendor quotes compared</div>
              </div>
              <div className="p-3.5 rounded-2xl border border-[#D5D8CA] dark:border-[#2E3D31] bg-white dark:bg-[#181E19] shadow-2xs">
                <div className="text-[11px] text-[#485942] dark:text-[#A3B5A5] mb-1">Binding Purchase Orders</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28] dark:text-[#ECF2EC]">
                  <AnimatedCounter value={15} suffix=" Active POs" />
                </div>
                <div className="text-[10px] text-[#485942] dark:text-[#A3B5A5] mt-0.5">Vendor acknowledgments logged</div>
              </div>
              <div className="p-3.5 rounded-2xl border border-[#D5D8CA] dark:border-[#2E3D31] bg-white dark:bg-[#181E19] shadow-2xs">
                <div className="text-[11px] text-[#485942] dark:text-[#A3B5A5] mb-1">3-Way Match Verified</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28] dark:text-[#ECF2EC]">
                  <AnimatedCounter value={1420000} prefix="₹ " />
                </div>
                <div className="text-[10px] text-[#16A34A] dark:text-[#34D399] font-semibold mt-0.5">PO &bull; GRN &bull; Invoice matched</div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#D5D8CA] dark:border-[#2E3D31] bg-white dark:bg-[#181E19] overflow-hidden shadow-2xs">
              <div className="px-4 py-2.5 bg-[#EDEEE4] dark:bg-[#202922] border-b border-[#D5D8CA] dark:border-[#2E3D31] flex items-center justify-between text-xs">
                <span className="font-bold text-[#2E3D28] dark:text-[#ECF2EC]">Procure-to-Pay 3-Way Match Audit</span>
                <span className="text-[10px] text-[#485942] dark:text-[#A3B5A5] font-mono">Zero Discrepancy Gate</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F7F7F0] dark:bg-[#151B16] text-[#485942] dark:text-[#A3B5A5] border-b border-[#D5D8CA] dark:border-[#2E3D31] text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3.5 font-semibold">PO #</th>
                      <th className="py-2.5 px-3.5 font-semibold">Vendor Name</th>
                      <th className="py-2.5 px-3.5 font-semibold">PO Qty</th>
                      <th className="py-2.5 px-3.5 font-semibold">GRN Inward Qty</th>
                      <th className="py-2.5 px-3.5 font-semibold">Invoice Qty & Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D5D8CA]/60 dark:divide-[#2E3D31] text-[#2E3D28] dark:text-[#ECF2EC]">
                    <tr className="hover:bg-[#F2F3EC] dark:hover:bg-[#202922] transition-colors">
                      <td className="py-2.5 px-3.5 font-mono text-[11px]">PO-2026-0512</td>
                      <td className="py-2.5 px-3.5 font-medium">Tata Steel Alloy Division</td>
                      <td className="py-2.5 px-3.5 font-mono">500 Units</td>
                      <td className="py-2.5 px-3.5 font-mono">500 Units (Pass)</td>
                      <td className="py-2.5 px-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCE2CF] dark:bg-[#1E2C20] text-[#2E3D28] dark:text-[#34D399]">
                          3-Way Cleared &bull; Ready to Pay
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#F2F3EC] dark:hover:bg-[#202922] transition-colors">
                      <td className="py-2.5 px-3.5 font-mono text-[11px]">PO-2026-0513</td>
                      <td className="py-2.5 px-3.5 font-medium">Precision Bearings India Pvt Ltd</td>
                      <td className="py-2.5 px-3.5 font-mono">250 Units</td>
                      <td className="py-2.5 px-3.5 font-mono">250 Units (Pass)</td>
                      <td className="py-2.5 px-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCE2CF] dark:bg-[#1E2C20] text-[#2E3D28] dark:text-[#34D399]">
                          Payment Voucher Posted
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: APPROVAL WORKFLOWS PREVIEW ── */}
        {previewTab === 'workflows' && (
          <div className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="p-3.5 rounded-2xl border border-[#D5D8CA] dark:border-[#2E3D31] bg-white dark:bg-[#181E19] shadow-2xs">
                <div className="text-[11px] text-[#485942] dark:text-[#A3B5A5] mb-1">Active Enterprise Pipelines</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28] dark:text-[#ECF2EC]">
                  <AnimatedCounter value={2} suffix=" Core Workflows" />
                </div>
                <div className="text-[10px] text-[#16A34A] dark:text-[#34D399] font-semibold mt-0.5">Order-to-Cash & Procure-to-Pay</div>
              </div>
              <div className="p-3.5 rounded-2xl border border-[#D5D8CA] dark:border-[#2E3D31] bg-white dark:bg-[#181E19] shadow-2xs">
                <div className="text-[11px] text-[#485942] dark:text-[#A3B5A5] mb-1">Approval Stage Automation</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28] dark:text-[#ECF2EC]">
                  <AnimatedCounter value={100} suffix="% Audited" />
                </div>
                <div className="text-[10px] text-[#485942] dark:text-[#A3B5A5] mt-0.5">Strict role-based gates</div>
              </div>
              <div className="p-3.5 rounded-2xl border border-[#D5D8CA] dark:border-[#2E3D31] bg-white dark:bg-[#181E19] shadow-2xs">
                <div className="text-[11px] text-[#485942] dark:text-[#A3B5A5] mb-1">Cross-Module Document Flow</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28] dark:text-[#ECF2EC]">
                  <AnimatedCounter value={5} suffix=" Sequential Steps" />
                </div>
                <div className="text-[10px] text-[#16A34A] dark:text-[#34D399] font-semibold mt-0.5">1-Click Conversion active</div>
              </div>
              <div className="p-3.5 rounded-2xl border border-[#D5D8CA] dark:border-[#2E3D31] bg-white dark:bg-[#181E19] shadow-2xs">
                <div className="text-[11px] text-[#485942] dark:text-[#A3B5A5] mb-1">Ledger Auto-Posting Gate</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28] dark:text-[#ECF2EC]">
                  <AnimatedCounter value={0} prefix="₹ " suffix=".00 Discrepancy" />
                </div>
                <div className="text-[10px] text-[#16A34A] dark:text-[#34D399] font-semibold mt-0.5">Synchronized upon approval</div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#D5D8CA] dark:border-[#2E3D31] bg-white dark:bg-[#181E19] overflow-hidden shadow-2xs">
              <div className="px-4 py-2.5 bg-[#EDEEE4] dark:bg-[#202922] border-b border-[#D5D8CA] dark:border-[#2E3D31] flex items-center justify-between text-xs">
                <span className="font-bold text-[#2E3D28] dark:text-[#ECF2EC]">Automated Workflow Execution Registry</span>
                <span className="text-[10px] text-[#485942] dark:text-[#A3B5A5] font-mono">Immutable Audit Trail</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F7F7F0] dark:bg-[#151B16] text-[#485942] dark:text-[#A3B5A5] border-b border-[#D5D8CA] dark:border-[#2E3D31] text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3.5 font-semibold">Instance #</th>
                      <th className="py-2.5 px-3.5 font-semibold">Pipeline Type</th>
                      <th className="py-2.5 px-3.5 font-semibold">Current Phase & Gate</th>
                      <th className="py-2.5 px-3.5 font-semibold">Automated Accounting Effect</th>
                      <th className="py-2.5 px-3.5 font-semibold">Governance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D5D8CA]/60 dark:divide-[#2E3D31] text-[#2E3D28] dark:text-[#ECF2EC]">
                    <tr className="hover:bg-[#F2F3EC] dark:hover:bg-[#202922] transition-colors">
                      <td className="py-2.5 px-3.5 font-mono text-[11px]">O2C-2026-0343</td>
                      <td className="py-2.5 px-3.5 font-medium">Order-to-Cash &bull; SO &rarr; Challan</td>
                      <td className="py-2.5 px-3.5">
                        <span className="text-xs font-semibold text-[#2E3D28] dark:text-[#ECF2EC]">Phase 03: Delivery Challan</span>
                        <div className="text-[10px] text-[#485942] dark:text-[#A3B5A5]">Bin Picking & Dispatch Confirmed</div>
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-[#2E3D28] dark:text-[#34D399]">
                        Inventory Reserved (Bhiwandi Hub Bin A-04)
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCE2CF] dark:bg-[#1E2C20] text-[#2E3D28] dark:text-[#34D399] inline-flex items-center gap-1">
                          <CheckCircle2 size={10} className="text-[#16A34A] dark:text-[#34D399]" />
                          Ready for Invoice
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#F2F3EC] dark:hover:bg-[#202922] transition-colors">
                      <td className="py-2.5 px-3.5 font-mono text-[11px]">P2P-2026-0514</td>
                      <td className="py-2.5 px-3.5 font-medium">Procure-to-Pay &bull; RFQ &rarr; PO</td>
                      <td className="py-2.5 px-3.5">
                        <span className="text-xs font-semibold text-[#2E3D28] dark:text-[#ECF2EC]">Phase 03: Purchase Order Binding</span>
                        <div className="text-[10px] text-[#485942] dark:text-[#A3B5A5]">Purchase Head Signature Logged</div>
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-[#2E3D28] dark:text-[#34D399]">
                        Budget Checked &bull; 3-Way Match Armed
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCE2CF] dark:bg-[#1E2C20] text-[#2E3D28] dark:text-[#34D399] inline-flex items-center gap-1">
                          <CheckCircle2 size={10} className="text-[#16A34A] dark:text-[#34D399]" />
                          EDI Transmitted
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#F2F3EC] dark:hover:bg-[#202922] transition-colors">
                      <td className="py-2.5 px-3.5 font-mono text-[11px]">O2C-2026-0341</td>
                      <td className="py-2.5 px-3.5 font-medium">Order-to-Cash &bull; Challan &rarr; Tax Invoice</td>
                      <td className="py-2.5 px-3.5">
                        <span className="text-xs font-semibold text-[#2E3D28] dark:text-[#ECF2EC]">Phase 04: Tax Invoice</span>
                        <div className="text-[10px] text-[#485942] dark:text-[#A3B5A5]">CGST+SGST Breakdown Verified</div>
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-[#2E3D28] dark:text-[#34D399]">
                        Debit Customer A/c &bull; Credit Sales & Tax
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EDEEE4] dark:bg-[#202922] text-[#2E3D28] dark:text-[#A3B5A5] inline-flex items-center gap-1">
                          <CheckCircle2 size={10} className="text-[#16A34A] dark:text-[#34D399]" />
                          Awaiting Payment
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 6: STATUTORY GST REPORTS PREVIEW ── */}
        {previewTab === 'gst' && (
          <div className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="p-3.5 rounded-2xl border border-[#D5D8CA] dark:border-[#2E3D31] bg-white dark:bg-[#181E19] shadow-2xs">
                <div className="text-[11px] text-[#485942] dark:text-[#A3B5A5] mb-1">GSTR-1 Outward Supplies</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28] dark:text-[#ECF2EC]">
                  <AnimatedCounter value={771408} prefix="₹ " />
                </div>
                <div className="text-[10px] text-[#16A34A] dark:text-[#34D399] font-semibold mt-0.5">B2B + B2C tax liability</div>
              </div>
              <div className="p-3.5 rounded-2xl border border-[#D5D8CA] dark:border-[#2E3D31] bg-white dark:bg-[#181E19] shadow-2xs">
                <div className="text-[11px] text-[#485942] dark:text-[#A3B5A5] mb-1">GSTR-2B Eligible ITC</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28] dark:text-[#ECF2EC]">
                  <AnimatedCounter value={284300} prefix="₹ " />
                </div>
                <div className="text-[10px] text-[#16A34A] dark:text-[#34D399] font-semibold mt-0.5">Auto-reconciled with vendor bills</div>
              </div>
              <div className="p-3.5 rounded-2xl border border-[#D5D8CA] dark:border-[#2E3D31] bg-white dark:bg-[#181E19] shadow-2xs">
                <div className="text-[11px] text-[#485942] dark:text-[#A3B5A5] mb-1">GSTR-3B Net Cash Liability</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28] dark:text-[#ECF2EC]">
                  <AnimatedCounter value={487108} prefix="₹ " />
                </div>
                <div className="text-[10px] text-[#485942] dark:text-[#A3B5A5] mt-0.5">Net tax payable before 20th</div>
              </div>
              <div className="p-3.5 rounded-2xl border border-[#D5D8CA] dark:border-[#2E3D31] bg-white dark:bg-[#181E19] shadow-2xs">
                <div className="text-[11px] text-[#485942] dark:text-[#A3B5A5] mb-1">HSN/SAC Validation Rate</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28] dark:text-[#ECF2EC]">
                  <AnimatedCounter value={100} suffix="% Validated" />
                </div>
                <div className="text-[10px] text-[#16A34A] dark:text-[#34D399] font-semibold mt-0.5">Zero mismatched codes</div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#D5D8CA] dark:border-[#2E3D31] bg-white dark:bg-[#181E19] overflow-hidden shadow-2xs">
              <div className="px-4 py-2.5 bg-[#EDEEE4] dark:bg-[#202922] border-b border-[#D5D8CA] dark:border-[#2E3D31] flex items-center justify-between text-xs">
                <span className="font-bold text-[#2E3D28] dark:text-[#ECF2EC]">Monthly Statutory Tax Liability Summary (GSTR-3B)</span>
                <span className="text-[10px] text-[#485942] dark:text-[#A3B5A5] font-mono">Place of Supply Derived</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F7F7F0] dark:bg-[#151B16] text-[#485942] dark:text-[#A3B5A5] border-b border-[#D5D8CA] dark:border-[#2E3D31] text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3.5 font-semibold">Tax Component</th>
                      <th className="py-2.5 px-3.5 font-semibold">Total Taxable Value (₹)</th>
                      <th className="py-2.5 px-3.5 font-semibold">Outward Tax (₹)</th>
                      <th className="py-2.5 px-3.5 font-semibold">ITC Claimed (₹)</th>
                      <th className="py-2.5 px-3.5 font-semibold">Net Payable (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D5D8CA]/60 dark:divide-[#2E3D31] text-[#2E3D28] dark:text-[#ECF2EC]">
                    <tr className="hover:bg-[#F2F3EC] dark:hover:bg-[#202922] transition-colors">
                      <td className="py-2.5 px-3.5 font-semibold">Integrated Tax (IGST)</td>
                      <td className="py-2.5 px-3.5 font-mono">₹ 24,50,000</td>
                      <td className="py-2.5 px-3.5 font-mono">₹ 4,41,000</td>
                      <td className="py-2.5 px-3.5 font-mono">₹ 1,52,000</td>
                      <td className="py-2.5 px-3.5 font-mono font-bold">₹ 2,89,000</td>
                    </tr>
                    <tr className="hover:bg-[#F2F3EC] dark:hover:bg-[#202922] transition-colors">
                      <td className="py-2.5 px-3.5 font-semibold">Central Tax (CGST)</td>
                      <td className="py-2.5 px-3.5 font-mono">₹ 18,35,600</td>
                      <td className="py-2.5 px-3.5 font-mono">₹ 1,65,204</td>
                      <td className="py-2.5 px-3.5 font-mono">₹ 66,150</td>
                      <td className="py-2.5 px-3.5 font-mono font-bold">₹ 99,054</td>
                    </tr>
                    <tr className="hover:bg-[#F2F3EC] dark:hover:bg-[#202922] transition-colors">
                      <td className="py-2.5 px-3.5 font-semibold">State Tax (SGST)</td>
                      <td className="py-2.5 px-3.5 font-mono">₹ 18,35,600</td>
                      <td className="py-2.5 px-3.5 font-mono">₹ 1,65,204</td>
                      <td className="py-2.5 px-3.5 font-mono">₹ 66,150</td>
                      <td className="py-2.5 px-3.5 font-mono font-bold">₹ 99,054</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
