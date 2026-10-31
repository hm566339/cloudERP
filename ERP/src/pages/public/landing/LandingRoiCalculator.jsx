import React, { useState, useId } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, ArrowRight, TrendingUp, Clock, Coins, ShieldCheck } from 'lucide-react';

/**
 * Interactive Business ROI & Efficiency Calculator
 * Allows prospective buyers to calculate estimated time and financial savings
 * based on their monthly transaction volume, team size, and company entities.
 */
export default function LandingRoiCalculator() {
  const [invoicesCount, setInvoicesCount] = useState(350);
  const [teamSize, setTeamSize] = useState(6);
  const [companiesCount, setCompaniesCount] = useState(2);

  const invoiceSliderId = useId();
  const teamSliderId = useId();
  const companySliderId = useId();

  // Mathematical Model for Operational Savings:
  // 1. Time saved per invoice lifecycle (Quote -> SO -> Challan -> Invoice -> GL): ~18 mins = 0.3 hrs
  // 2. Month-end book close & GST reco saved per company: ~28 hrs/month
  const hoursSavedPerMonth = Math.round((invoicesCount * 0.3) + (companiesCount * 28));

  // Blended average professional rate (Accountant / Ops Specialist in India): ~₹450/hr
  const monthlyCostSaved = Math.round(hoursSavedPerMonth * 450);
  const annualCostSaved = monthlyCostSaved * 12;

  // Faster cash collection estimate (Days Sales Outstanding reduction): 9 to 14 days
  const dsoReductionDays = Math.min(14, Math.max(7, Math.round(7 + (companiesCount * 1.5))));

  // ROI vs Mark2 Pro Plan (₹2,999/mo = ₹35,988/yr)
  const annualErpCost = companiesCount <= 1 ? 11988 : (companiesCount <= 5 ? 35988 : 199990);
  const netRoiMultiplier = Math.max(4, Math.round(annualCostSaved / Math.max(annualErpCost, 1)));

  return (
    <section
      id="roi-calculator"
      className="scroll-mt-24 py-20 sm:py-28 bg-[#F7F7F0] dark:bg-[#101411] border-t border-[#D5D8CA] dark:border-[#263328] relative transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCE2CF] dark:bg-[#18261B] border border-[#D5D8CA] dark:border-[#2E3D31] text-[#2E3D28] dark:text-[#34D399] text-xs font-bold uppercase tracking-wider mb-3">
            <Calculator size={13} className="text-[#2E3D28] dark:text-[#34D399]" />
            <span>Interactive Value Assessment</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-[#2E3D28] dark:text-white tracking-tight">
            Calculate Your Return on Investment
          </h2>
          <p className="text-sm sm:text-base text-[#485942] dark:text-[#A3B5A5] mt-4 leading-relaxed">
            Eliminate double data-entry, manual invoice reconciliations, and month-end closing chaos.
            See how much time and operational expenditure your business can reclaim with Mark2 ERP.
          </p>
        </div>

        {/* Calculator Main Box */}
        <div className="rounded-3xl bg-[#E8E9DF] dark:bg-[#141C16] border border-[#D5D8CA] dark:border-[#26382B] p-6 sm:p-10 shadow-lg dark:shadow-none max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* LEFT: Sliders Form */}
            <div className="lg:col-span-7 space-y-6">
              {/* Slider 1: Monthly Invoices */}
              <div className="bg-[#F7F7F0] dark:bg-[#19241B] p-5 rounded-2xl border border-[#D5D8CA] dark:border-[#28382B] shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor={invoiceSliderId} className="text-xs font-bold text-[#2E3D28] dark:text-[#ECF2EC] cursor-pointer">
                    Monthly Invoices & Bills Processed
                  </label>
                  <span className="font-mono text-sm font-extrabold text-[#2E3D28] dark:text-[#34D399] bg-[#DCE2CF] dark:bg-[#202E23] px-2.5 py-0.5 rounded-lg border border-[#A9B887]/40 dark:border-[#34D399]/40">
                    {invoicesCount.toLocaleString()} / mo
                  </span>
                </div>
                <input
                  id={invoiceSliderId}
                  type="range"
                  min="50"
                  max="2500"
                  step="50"
                  value={invoicesCount}
                  onChange={(e) => setInvoicesCount(Number(e.target.value))}
                  className="w-full h-2 bg-[#D5D8CA] dark:bg-[#2E3D31] rounded-lg appearance-none cursor-pointer accent-[#2E3D28] dark:accent-[#34D399]"
                  aria-label="Monthly Invoices and Bills"
                />
                <div className="flex justify-between text-[10px] text-[#7A8A6E] dark:text-[#889B89] font-mono mt-1">
                  <span>50 invoices</span>
                  <span>1,200</span>
                  <span>2,500+ invoices</span>
                </div>
              </div>

              {/* Slider 2: Operations Team Size */}
              <div className="bg-[#F7F7F0] dark:bg-[#19241B] p-5 rounded-2xl border border-[#D5D8CA] dark:border-[#28382B] shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor={teamSliderId} className="text-xs font-bold text-[#2E3D28] dark:text-[#ECF2EC] cursor-pointer">
                    Finance, Operations & Warehouse Staff
                  </label>
                  <span className="font-mono text-sm font-extrabold text-[#2E3D28] dark:text-[#34D399] bg-[#DCE2CF] dark:bg-[#202E23] px-2.5 py-0.5 rounded-lg border border-[#A9B887]/40 dark:border-[#34D399]/40">
                    {teamSize} People
                  </span>
                </div>
                <input
                  id={teamSliderId}
                  type="range"
                  min="2"
                  max="40"
                  step="1"
                  value={teamSize}
                  onChange={(e) => setTeamSize(Number(e.target.value))}
                  className="w-full h-2 bg-[#D5D8CA] dark:bg-[#2E3D31] rounded-lg appearance-none cursor-pointer accent-[#2E3D28] dark:accent-[#34D399]"
                  aria-label="Operations Team Size"
                />
                <div className="flex justify-between text-[10px] text-[#7A8A6E] dark:text-[#889B89] font-mono mt-1">
                  <span>2 members</span>
                  <span>20 members</span>
                  <span>40+ members</span>
                </div>
              </div>

              {/* Slider 3: Operating Companies */}
              <div className="bg-[#F7F7F0] dark:bg-[#19241B] p-5 rounded-2xl border border-[#D5D8CA] dark:border-[#28382B] shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor={companySliderId} className="text-xs font-bold text-[#2E3D28] dark:text-[#ECF2EC] cursor-pointer">
                    Legal Entities & Subsidiary Companies
                  </label>
                  <span className="font-mono text-sm font-extrabold text-[#2E3D28] dark:text-[#34D399] bg-[#DCE2CF] dark:bg-[#202E23] px-2.5 py-0.5 rounded-lg border border-[#A9B887]/40 dark:border-[#34D399]/40">
                    {companiesCount} {companiesCount === 1 ? 'Company' : 'Companies'}
                  </span>
                </div>
                <input
                  id={companySliderId}
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={companiesCount}
                  onChange={(e) => setCompaniesCount(Number(e.target.value))}
                  className="w-full h-2 bg-[#D5D8CA] dark:bg-[#2E3D31] rounded-lg appearance-none cursor-pointer accent-[#2E3D28] dark:accent-[#34D399]"
                  aria-label="Operating Companies"
                />
                <div className="flex justify-between text-[10px] text-[#7A8A6E] dark:text-[#889B89] font-mono mt-1">
                  <span>1 entity</span>
                  <span>5 entities</span>
                  <span>10+ entities</span>
                </div>
              </div>
            </div>

            {/* RIGHT: Results Display Panel */}
            <div className="lg:col-span-5 bg-[#2E3D28] dark:bg-[#0F1711] rounded-3xl p-6 sm:p-8 text-white flex flex-col justify-between border border-[#243320] dark:border-[#223326] shadow-xl">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#3C4E34] dark:border-[#223326] text-xs">
                  <span className="text-[#DCE2CF] dark:text-[#A3B5A5] font-semibold flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-[#A9B887] dark:text-[#34D399]" />
                    Projected Value Reclaimed
                  </span>
                  <span className="bg-[#3C4E34] dark:bg-[#1B281E] text-[#A9B887] dark:text-[#34D399] px-2 py-0.5 rounded-full font-mono font-bold text-[10px] border dark:border-[#34D399]/30">
                    {netRoiMultiplier}x Est. ROI
                  </span>
                </div>

                {/* Primary Metric: Annual Savings */}
                <div className="mt-5 mb-6">
                  <div className="text-xs text-[#DCE2CF] dark:text-[#A3B5A5] font-medium">Estimated Annual Financial Impact</div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-white mt-1 tracking-tight font-display">
                    ₹ {annualCostSaved.toLocaleString('en-IN')}
                    <span className="text-xs text-[#A9B887] dark:text-[#34D399] font-normal ml-1">/ year</span>
                  </div>
                  <div className="text-[11px] text-[#DCE2CF] dark:text-[#A3B5A5] mt-1 font-mono">
                    ≈ ₹ {monthlyCostSaved.toLocaleString('en-IN')} / month saved in operational overhead
                  </div>
                </div>

                {/* Secondary Key Metric Cards */}
                <div className="space-y-3 pt-4 border-t border-[#3C4E34] dark:border-[#223326]">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#243320] dark:bg-[#152017] border border-[#3C4E34] dark:border-[#223326]">
                    <div className="flex items-center gap-2.5">
                      <Clock size={16} className="text-[#A9B887] dark:text-[#34D399] shrink-0" />
                      <span className="text-xs text-[#DCE2CF] dark:text-[#A3B5A5]">Hours Saved Monthly</span>
                    </div>
                    <span className="font-mono text-sm font-bold text-white">
                      {hoursSavedPerMonth} hrs / mo
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#243320] dark:bg-[#152017] border border-[#3C4E34] dark:border-[#223326]">
                    <div className="flex items-center gap-2.5">
                      <Coins size={16} className="text-[#A9B887] dark:text-[#34D399] shrink-0" />
                      <span className="text-xs text-[#DCE2CF] dark:text-[#A3B5A5]">DSO Cash Acceleration</span>
                    </div>
                    <span className="font-mono text-sm font-bold text-[#A9B887] dark:text-[#34D399]">
                      {dsoReductionDays} Days Faster
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#243320] dark:bg-[#152017] border border-[#3C4E34] dark:border-[#223326]">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck size={16} className="text-[#A9B887] dark:text-[#34D399] shrink-0" />
                      <span className="text-xs text-[#DCE2CF] dark:text-[#A3B5A5]">GST Filing Time</span>
                    </div>
                    <span className="font-mono text-sm font-bold text-white">
                      80% Faster
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom CTA Button */}
              <div className="mt-6 pt-5 border-t border-[#3C4E34] dark:border-[#223326]">
                <Link
                  to="/try-free"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#F7F7F0] dark:bg-[#10B981] text-[#2E3D28] dark:text-[#051A0E] text-xs font-bold hover:bg-white dark:hover:bg-[#34D399] active:bg-[#EDEEE4] transition-colors shadow-xs group"
                >
                  <span>Experience These Savings in Free Trial</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <div className="text-center text-[10px] text-[#DCE2CF] dark:text-[#A3B5A5] mt-2">
                  Full access for 30 days • No credit card required
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
