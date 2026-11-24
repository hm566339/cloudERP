import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightLeft,
  Building2,
  UserCheck,
  TrendingUp,
  CheckCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import CrmTabCard from '../CrmTabCard';
import { InfoField } from '../../../../../components/common/InfoCard';

/**
 * Deal Conversion & Linked Records Section for Lead Details.
 */
export default function LeadConversionSection({ lead, companyId, onOpenConvert }) {
  const navigate = useNavigate();
  const crmBase = companyId ? `/company/${companyId}/sales-crm` : '/sales-crm';

  if (!lead) return null;

  const isConverted = lead.isConverted;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Conversion Status Banner */}
      {isConverted ? (
        <div className="p-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-xs">
              <CheckCircle size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                Lead Successfully Converted
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                Converted on{' '}
                {lead.convertedAt ? new Date(lead.convertedAt).toLocaleDateString() : 'Record'}
                {lead.convertedByUserName && ` by ${lead.convertedByUserName}`}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded-lg self-start sm:self-center">
            ACTIVE DEAL
          </span>
        </div>
      ) : (
        <div className="p-6 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-[#1D212C] dark:to-[#161922] border border-blue-200/80 dark:border-[#2A2F3D] flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xs">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE]">
                Ready to Convert this Qualified Prospect?
              </h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-[#A0A6B5] leading-relaxed">
              Converting this lead will promote it from a raw inquiry to an institutional
              <strong> Account</strong>, create a primary <strong>Contact</strong>, and initiate an active sales <strong>Opportunity</strong> deal.
            </p>
          </div>

          <button
            onClick={onOpenConvert}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0"
          >
            <ArrowRightLeft size={15} /> Convert Lead to Deal
          </button>
        </div>
      )}

      {/* Linked Converted Entities */}
      <CrmTabCard title="Downstream Linked Records & ERP Entities">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Linked Account */}
          <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5] flex items-center gap-1.5">
                <Building2 size={14} className="text-primary" /> Customer Account
              </span>
              {lead.convertedAccountId && (
                <button
                  onClick={() => navigate(`${crmBase}/accounts/${lead.convertedAccountId}`)}
                  className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
                >
                  View <ExternalLink size={11} />
                </button>
              )}
            </div>
            <p className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE]">
              {lead.convertedAccountName || lead.organizationName || 'No Linked Account'}
            </p>
            <p className="text-[11px] text-zinc-400 font-mono">
              ID: {lead.convertedAccountId || 'Not Converted'}
            </p>
          </div>

          {/* Linked Contact */}
          <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5] flex items-center gap-1.5">
                <UserCheck size={14} className="text-emerald-500" /> Primary Contact
              </span>
              {lead.convertedContactId && (
                <button
                  onClick={() => navigate(`${crmBase}/contacts/${lead.convertedContactId}`)}
                  className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
                >
                  View <ExternalLink size={11} />
                </button>
              )}
            </div>
            <p className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE]">
              {lead.convertedContactName || lead.displayName || 'No Linked Contact'}
            </p>
            <p className="text-[11px] text-zinc-400 font-mono">
              ID: {lead.convertedContactId || 'Not Converted'}
            </p>
          </div>

          {/* Linked Opportunity Deal */}
          <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5] flex items-center gap-1.5">
                <TrendingUp size={14} className="text-amber-500" /> Sales Opportunity
              </span>
              {lead.convertedOpportunityId && (
                <button
                  onClick={() => navigate(`${crmBase}/opportunities/${lead.convertedOpportunityId}`)}
                  className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
                >
                  View <ExternalLink size={11} />
                </button>
              )}
            </div>
            <p className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE]">
              {lead.convertedOpportunityName || (isConverted ? 'Enterprise Deal' : 'No Active Opportunity')}
            </p>
            <p className="text-[11px] text-zinc-400 font-mono">
              ID: {lead.convertedOpportunityId || 'Not Converted'}
            </p>
          </div>
        </div>
      </CrmTabCard>
    </div>
  );
}
