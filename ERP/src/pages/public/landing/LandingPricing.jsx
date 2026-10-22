import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, CheckCircle2, ArrowRight, HelpCircle, ChevronDown, Building, ShieldCheck } from 'lucide-react';
import { FAQ_ITEMS } from './landingData';

export default function LandingPricing() {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <section id="pricing" className="scroll-mt-24 py-20 sm:py-28 bg-zinc-50/70 dark:bg-[#0F1117] border-t border-zinc-200/80 dark:border-[#2A2F3D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-200/70 dark:bg-[#1D212C] text-zinc-700 dark:text-[#A0A6B5] text-xs font-bold uppercase tracking-wider mb-3">
            Transparent Evaluation
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-zinc-900 dark:text-[#E6E8EE] tracking-tight">
            Start Free, Scale Without Surprises
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-[#A0A6B5] mt-4 leading-relaxed">
            Provision your own dedicated organization tenant with complete access to all 6 enterprise modules.
            No credit card, no artificial feature locks.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto items-stretch mb-20">
          {/* Card 1: 30-Day Free Trial (Highlighted) */}
          <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#161922] border-2 border-zinc-900 dark:border-[#4C8DFF] p-7 sm:p-10 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-zinc-900 dark:bg-[#4C8DFF] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-bl-xl">
              Recommended
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-4">
                <Sparkles size={12} className="text-emerald-600 dark:text-emerald-400" />
                <span>Full Enterprise Plan Access</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-[#E6E8EE]">30-Day Free Trial</h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-[#A0A6B5] mt-1">
                Ideal for evaluation, testing with live ledgers, and team onboarding.
              </p>

              <div className="mt-6 mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-extrabold text-zinc-900 dark:text-[#E6E8EE]">₹0</span>
                  <span className="text-sm font-semibold text-zinc-500 dark:text-[#A0A6B5]">for the first 30 days</span>
                </div>
                <span className="text-xs text-zinc-500 dark:text-[#A0A6B5]">No credit card or payment commitment required</span>
              </div>

              <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-[#2A2F3D] text-xs sm:text-sm text-zinc-700 dark:text-[#E6E8EE]">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>All 6 Core Modules</strong>: Finance, Sales, Procurement, Inventory, GST, Workflows</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Multi-Company Support</strong>: Configure parent holding and branch subsidiaries</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Statutory GST Engine</strong>: GSTR-1, GSTR-2B ITC reco, and GSTR-3B liability reports</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Unlimited Team Invites</strong>: Role-based permissions for all staff</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Data Portability</strong>: Export financial statements to Excel, CSV, and PDF</span>
                </div>
              </div>
            </div>

            <div className="pt-8 mt-6 border-t border-zinc-100 dark:border-[#2A2F3D]">
              <Link
                to="/try-free"
                className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-zinc-900 dark:bg-[#4C8DFF] text-white text-sm font-bold hover:bg-zinc-800 dark:hover:bg-[#6AA1FF] transition-colors active:scale-[0.98] shadow-md group"
              >
                <span>Launch Free Trial Workspace</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="text-center mt-2.5 text-[11px] text-zinc-500 dark:text-[#A0A6B5]">
                Self-provisioning takes under 60 seconds
              </div>
            </div>
          </div>

          {/* Card 2: Custom Enterprise */}
          <div className="lg:col-span-5 rounded-3xl bg-zinc-900 text-white p-7 sm:p-10 shadow-lg flex flex-col justify-between border border-zinc-800">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-semibold mb-4">
                <Building size={12} className="text-emerald-400" />
                <span>Large Groups & Manufacturing</span>
              </div>

              <h3 className="text-2xl font-bold text-white">Enterprise Custom</h3>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                For organizations with multi-warehouse supply chains, ERP legacy migrations, or high volume.
              </p>

              <div className="mt-6 mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white">Custom</span>
                  <span className="text-xs text-zinc-400">tailored to company size</span>
                </div>
                <span className="text-xs text-zinc-400">Flexible annual licensing</span>
              </div>

              <div className="space-y-3 pt-4 border-t border-zinc-800 text-xs sm:text-sm text-zinc-300">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>Dedicated Database Tenant & SLA guarantee</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>Legacy Tally / SAP / Excel Chart of Accounts migration</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>Custom Approval Hierarchy workflows & threshold rules</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>Priority 24/7 SLA & dedicated account manager</span>
                </div>
              </div>
            </div>

            <div className="pt-8 mt-6 border-t border-zinc-800">
              <Link
                to="/try-free"
                className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold transition-colors active:scale-[0.98] border border-zinc-700"
              >
                <span>Request Enterprise Consultation</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* Interactive FAQ Section */}
        <div className="max-w-4xl mx-auto pt-10">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-[#1D212C] text-zinc-600 dark:text-[#A0A6B5] text-xs font-bold uppercase tracking-wider mb-2">
              <HelpCircle size={13} />
              <span>Questions & Answers</span>
            </span>
            <h3 className="text-2xl sm:text-3xl font-display font-black text-zinc-900 dark:text-[#E6E8EE] tracking-tight">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="space-y-3.5">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] overflow-hidden transition-all duration-micro"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-bold text-zinc-900 dark:text-[#E6E8EE] text-sm sm:text-base hover:bg-zinc-50/80 dark:hover:bg-[#1D212C] transition-colors"
                  >
                    <span>{item.question}</span>
                    <ChevronDown
                      size={18}
                      className={`text-zinc-500 dark:text-[#A0A6B5] shrink-0 transition-transform duration-standard ${
                        isOpen ? 'rotate-180 text-zinc-900 dark:text-white' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-zinc-600 dark:text-[#A0A6B5] leading-relaxed border-t border-zinc-100 dark:border-[#2A2F3D] animate-fade-in">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
