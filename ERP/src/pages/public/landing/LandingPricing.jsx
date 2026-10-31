import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, HelpCircle, ChevronDown, Check } from 'lucide-react';
import { FAQ_ITEMS, PRICING_PLANS } from './landingData';

export default function LandingPricing() {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [isAnnual, setIsAnnual] = useState(false);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <section
      id="pricing"
      className="scroll-mt-24 py-20 sm:py-28 bg-[#E8E9DF] dark:bg-[#101411] border-t border-[#D5D8CA] dark:border-[#263328] transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCE2CF] dark:bg-[#18261B] border border-[#D5D8CA] dark:border-[#2E3D31] text-[#2E3D28] dark:text-[#34D399] text-xs font-bold uppercase tracking-wider mb-3">
            <span>Transparent Evaluation</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-[#2E3D28] dark:text-white tracking-tight">
            Start Free, Scale Without Surprises
          </h2>
          <p className="text-sm sm:text-base text-[#485942] dark:text-[#A3B5A5] mt-4 leading-relaxed">
            Provision your own dedicated organization tenant with complete access to all 6 enterprise modules.
            No credit card, no artificial feature locks.
          </p>

          {/* Billing Interval Switcher */}
          <div className="mt-8 inline-flex items-center gap-3 p-1.5 rounded-2xl bg-[#F7F7F0] dark:bg-[#161D17] border border-[#D5D8CA] dark:border-[#26382B] shadow-2xs">
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                !isAnnual
                  ? 'bg-[#2E3D28] dark:bg-[#34D399] text-white dark:text-[#051A0E] shadow-xs'
                  : 'text-[#485942] dark:text-[#A3B5A5] hover:text-[#2E3D28] dark:hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isAnnual
                  ? 'bg-[#2E3D28] dark:bg-[#34D399] text-white dark:text-[#051A0E] shadow-xs'
                  : 'text-[#485942] dark:text-[#A3B5A5] hover:text-[#2E3D28] dark:hover:text-white'
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#A9B887] dark:bg-[#202E23] text-[#2E3D28] dark:text-[#34D399]">
                Save 15%
              </span>
            </button>
          </div>
        </div>

        {/* 4 Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch mb-24">
          {PRICING_PLANS.map((plan) => {
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            const isTrial = plan.id === 'trial';
            const isEnterprise = plan.id === 'business';

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 relative ${
                  isTrial
                    ? 'bg-[#F7F7F0] dark:bg-[#161D17] border-2 border-[#2E3D28] dark:border-[#34D399] shadow-xl dark:shadow-[0_20px_45px_rgba(0,0,0,0.6)] lg:-translate-y-2'
                    : isEnterprise
                    ? 'bg-[#2E3D28] dark:bg-[#0F1711] text-white border border-[#243320] dark:border-[#223326] shadow-lg'
                    : 'bg-[#F7F7F0] dark:bg-[#161D17] border border-[#D5D8CA] dark:border-[#26382B] shadow-xs hover:border-[#A9B887] dark:hover:border-[#34D399]/60 hover:shadow-md'
                }`}
              >
                {/* Popular Pill */}
                {isTrial && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#2E3D28] dark:bg-[#34D399] text-white dark:text-[#051A0E] text-[10px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-xs whitespace-nowrap">
                    Recommended for Evaluation
                  </div>
                )}

                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${
                      isEnterprise
                        ? 'bg-[#3C4E34] dark:bg-[#1C281F] text-[#A9B887] dark:text-[#34D399] border-[#A9B887]/30 dark:border-[#34D399]/30'
                        : 'bg-[#EDEEE4] dark:bg-[#1F2C21] text-[#2E3D28] dark:text-[#ECF2EC] border-[#D5D8CA] dark:border-[#2E3D31]'
                    }`}>
                      {plan.badge}
                    </span>
                  </div>

                  <h3 className={`text-xl font-bold mb-1 ${isEnterprise ? 'text-white' : 'text-[#2E3D28] dark:text-[#ECF2EC]'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-xs mb-5 leading-relaxed min-h-[32px] ${isEnterprise ? 'text-[#DCE2CF] dark:text-[#A3B5A5]' : 'text-[#485942] dark:text-[#A3B5A5]'}`}>
                    {plan.tagline}
                  </p>

                  {/* Price */}
                  <div className="mb-6 pb-5 border-b border-[#D5D8CA]/60 dark:border-[#26382B]">
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isEnterprise ? 'text-white' : 'text-[#2E3D28] dark:text-white'}`}>
                        ₹{price.toLocaleString('en-IN')}
                      </span>
                      <span className={`text-xs font-medium ${isEnterprise ? 'text-[#DCE2CF] dark:text-[#A3B5A5]' : 'text-[#485942] dark:text-[#A3B5A5]'}`}>
                        {isTrial ? 'for 30 days' : isEnterprise ? '/ yr' : '/ mo'}
                      </span>
                    </div>
                    <div className={`text-[11px] mt-1 ${isEnterprise ? 'text-[#A9B887] dark:text-[#34D399]' : 'text-[#7A8A6E] dark:text-[#889B89]'}`}>
                      {isTrial ? 'No credit card required' : plan.limits.companies}
                    </div>
                  </div>

                  {/* Limits Badge Grid */}
                  <div className="space-y-2 mb-5 text-xs">
                    <div className={`flex items-center justify-between p-2 rounded-lg ${
                      isEnterprise ? 'bg-[#3C4E34] dark:bg-[#18231B]' : 'bg-[#EDEEE4] dark:bg-[#1F2C21]'
                    }`}>
                      <span className={isEnterprise ? 'text-[#DCE2CF] dark:text-[#A3B5A5]' : 'text-[#485942] dark:text-[#A3B5A5]'}>Companies:</span>
                      <span className={`font-mono font-bold ${isEnterprise ? 'text-white' : 'text-[#2E3D28] dark:text-[#ECF2EC]'}`}>
                        {plan.limits.companies}
                      </span>
                    </div>
                    <div className={`flex items-center justify-between p-2 rounded-lg ${
                      isEnterprise ? 'bg-[#3C4E34] dark:bg-[#18231B]' : 'bg-[#EDEEE4] dark:bg-[#1F2C21]'
                    }`}>
                      <span className={isEnterprise ? 'text-[#DCE2CF] dark:text-[#A3B5A5]' : 'text-[#485942] dark:text-[#A3B5A5]'}>Team Users:</span>
                      <span className={`font-mono font-bold ${isEnterprise ? 'text-white' : 'text-[#2E3D28] dark:text-[#ECF2EC]'}`}>
                        {plan.limits.users}
                      </span>
                    </div>
                  </div>

                  {/* Key Feature Inclusions */}
                  <div className="space-y-2.5 pt-2 text-xs">
                    <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${
                      isEnterprise ? 'text-[#A9B887] dark:text-[#34D399]' : 'text-[#7A8A6E] dark:text-[#889B89]'
                    }`}>
                      Inclusions
                    </span>
                    {plan.features.slice(0, 6).map((feat, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check size={14} className={`shrink-0 mt-0.5 ${
                          isEnterprise ? 'text-[#A9B887] dark:text-[#34D399]' : 'text-[#16A34A] dark:text-[#34D399]'
                        }`} />
                        <span className={`leading-snug ${isEnterprise ? 'text-[#E8E9DF] dark:text-[#DCE2CF]' : 'text-[#2E3D28] dark:text-[#DCE2CF]'}`}>
                          {feat}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Action */}
                <div className="mt-7 pt-5 border-t border-[#D5D8CA]/60 dark:border-[#26382B]">
                  <Link
                    to={plan.ctaLink}
                    className={`w-full inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-xs group ${
                      isTrial
                        ? 'bg-[#2E3D28] dark:bg-[#10B981] text-white dark:text-[#051A0E] hover:bg-[#3C4E34] dark:hover:bg-[#34D399]'
                        : isEnterprise
                        ? 'bg-[#A9B887] dark:bg-[#10B981] text-[#2E3D28] dark:text-[#051A0E] hover:bg-[#B8C896] dark:hover:bg-[#34D399]'
                        : 'bg-[#EDEEE4] dark:bg-[#1F2C21] text-[#2E3D28] dark:text-[#ECF2EC] hover:bg-[#DCE2CF] dark:hover:bg-[#28392B] border border-[#D5D8CA] dark:border-[#2E3D31]'
                    }`}
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* ==================================================================== */}
        {/* Frequently Asked Questions Accordion Section                        */}
        {/* ==================================================================== */}
        <div className="max-w-4xl mx-auto pt-6">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#DCE2CF] dark:bg-[#18261B] border border-[#D5D8CA] dark:border-[#2E3D31] text-[#2E3D28] dark:text-[#34D399] text-xs font-bold uppercase tracking-wider mb-2">
              <HelpCircle size={13} className="text-[#2E3D28] dark:text-[#34D399]" />
              <span>Questions & Answers</span>
            </span>
            <h3 className="text-2xl sm:text-3xl font-display font-black text-[#2E3D28] dark:text-white tracking-tight">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaqIndex === index;
              const faqButtonId = `faq-btn-${index}`;
              const faqContentId = `faq-content-${index}`;

              return (
                <div
                  key={index}
                  className="rounded-2xl border border-[#D5D8CA] dark:border-[#26382B] bg-[#F7F7F0] dark:bg-[#161D17] overflow-hidden transition-all duration-150"
                >
                  <button
                    id={faqButtonId}
                    type="button"
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isOpen}
                    aria-controls={faqContentId}
                    className="w-full text-left px-5 sm:px-6 py-4 flex items-center justify-between gap-4 font-bold text-sm text-[#2E3D28] dark:text-[#ECF2EC] hover:bg-[#FFFFFF] dark:hover:bg-[#1B251D] transition-colors"
                  >
                    <span className="leading-snug">{item.question}</span>
                    <span className={`w-7 h-7 rounded-xl bg-[#EDEEE4] dark:bg-[#202E23] flex items-center justify-center shrink-0 text-[#2E3D28] dark:text-[#34D399] transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-[#DCE2CF] dark:bg-[#283B2C]' : ''
                    }`}>
                      <ChevronDown size={16} />
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      id={faqContentId}
                      role="region"
                      aria-labelledby={faqButtonId}
                      className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-[#485942] dark:text-[#A3B5A5] leading-relaxed border-t border-[#D5D8CA]/60 dark:border-[#26382B] animate-fade-in"
                    >
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
