import React from 'react';
import {
  Flame,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Building2,
  FileText,
  DollarSign,
  Briefcase,
  HelpCircle,
} from 'lucide-react';
import CrmTabCard from '../CrmTabCard';
import InfoCard, { InfoField } from '../../../../../components/common/InfoCard';

/**
 * Overview section for Lead Details.
 * Displays Score & Rating Breakdown, Qualification & Inquiry details,
 * and Business Profile / Demographics.
 */
export default function LeadOverviewSection({ lead, onEditInquiry }) {
  if (!lead) return null;

  const score = Number(lead.leadScore) || 50;
  const isHot = score >= 80;
  const isWarm = score >= 50 && score < 80;
  const scoreRating = isHot ? 'HOT' : isWarm ? 'WARM' : 'COLD';
  const scoreColor = isHot
    ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60'
    : isWarm
    ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60'
    : 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60';

  const progressBg = isHot ? 'bg-rose-500' : isWarm ? 'bg-amber-500' : 'bg-blue-500';

  return (
    <div className="space-y-5 animate-fade-in">
      {/* 1. Lead Score & Qualification Health */}
      <div className="bg-white dark:bg-[#161922] p-6 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-zinc-800 dark:text-[#E6E8EE] flex items-center gap-2">
            <Flame size={16} className={isHot ? 'text-rose-500' : 'text-amber-500'} />
            Lead Quality & Engagement Score
          </h3>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${scoreColor}`}
          >
            {scoreRating} LEAD ({score}/100)
          </span>
        </div>

        {/* Score Progress Bar */}
        <div className="relative">
          <div className="overflow-hidden h-3 rounded-full bg-zinc-100 dark:bg-[#1D212C]">
            <div
              style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
              className={`h-full ${progressBg} rounded-full transition-all duration-1000`}
            />
          </div>
          <div className="flex justify-between text-[10px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider mt-1.5">
            <span>0 Cold</span>
            <span>50 Warm</span>
            <span>80+ Hot Deal</span>
          </div>
        </div>

        {/* Qualification Criteria Checklist */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-5 border-t border-zinc-100 dark:border-[#2A2F3D]">
          <div className="space-y-1">
            <p className="text-[8.5px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">
              Contact Verified
            </p>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-[#E6E8EE]">
              {lead.phone || lead.email ? (
                <>
                  <CheckCircle2 size={14} className="text-emerald-500" /> Verified Channel
                </>
              ) : (
                <>
                  <AlertCircle size={14} className="text-amber-500" /> Pending Verification
                </>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[8.5px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">
              Company Profile
            </p>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-[#E6E8EE]">
              {lead.organizationName ? (
                <>
                  <CheckCircle2 size={14} className="text-emerald-500" /> Organization Linked
                </>
              ) : (
                <>
                  <HelpCircle size={14} className="text-zinc-400" /> Individual Prospect
                </>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[8.5px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">
              Qualification Stage
            </p>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-[#E6E8EE]">
              <span className="w-2 h-2 rounded-full bg-primary" />
              {lead.leadStage || 'RAW'}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[8.5px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">
              Next Follow-Up
            </p>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-[#E6E8EE]">
              <Clock size={14} className="text-zinc-400" />
              {lead.nextFollowUpDate
                ? new Date(lead.nextFollowUpDate).toLocaleDateString()
                : 'Not Scheduled'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Inquiry & Customer Requirement Details */}
      <CrmTabCard
        title="Customer Inquiry & Requirements"
        action={
          onEditInquiry && (
            <button
              onClick={onEditInquiry}
              className="text-xs text-primary font-semibold hover:underline"
            >
              Update Notes
            </button>
          )
        }
      >
        <div className="space-y-4">
          <div>
            <p className="text-[8.5px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184] mb-1.5">
              Inquiry / Requirement Notes
            </p>
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200/70 dark:border-[#2A2F3D] text-sm text-zinc-700 dark:text-[#E6E8EE] whitespace-pre-wrap leading-relaxed font-sans">
              {lead.notes ||
                lead.inquiryDetails ||
                'No specific inquiry notes recorded yet. Log an activity or edit the lead to record prospect requirements.'}
            </div>
          </div>

          {/* Business Demographics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3">
            <InfoField label="Industry Sector" value={lead.industry} />
            <InfoField
              label="Annual Revenue"
              value={lead.annualRevenue ? `₹${Number(lead.annualRevenue).toLocaleString()}` : null}
            />
            <InfoField label="Company Size" value={lead.companySize} />
            <InfoField label="Designation" value={lead.designation} />
          </div>
        </div>
      </CrmTabCard>

      {/* 3. Tax & Commercial Profile */}
      <CrmTabCard title="Tax & Commercial Information">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoField label="GSTIN Number" value={lead.gstin} mono highlight />
          <InfoField label="PAN Number" value={lead.pan} mono highlight />
          <InfoField
            label="Compliance Status"
            value={lead.gstin ? 'Verified Business Entity' : 'Unregistered / Individual'}
          />
        </div>
      </CrmTabCard>
    </div>
  );
}
