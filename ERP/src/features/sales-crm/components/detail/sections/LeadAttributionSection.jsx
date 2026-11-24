import React from 'react';
import {
  Globe,
  Share2,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Megaphone,
  Check,
  X,
  Calendar,
} from 'lucide-react';
import CrmTabCard from '../CrmTabCard';
import { InfoField } from '../../../../../components/common/InfoCard';

/**
 * Lead Source & Attribution Section.
 * Shows original acquisition channel, campaign attribution, external lead ads references,
 * consent trail, and communication opt-out compliance preferences.
 */
export default function LeadAttributionSection({ lead }) {
  if (!lead) return null;

  const sourceName = lead.leadSource?.sourceName || lead.leadSourceId || 'Direct / Organic';
  const campaignName = lead.campaign?.campaignName || lead.campaignId || 'Default Organic Campaign';

  return (
    <div className="space-y-5 animate-fade-in">
      {/* 1. Acquisition Channel & Campaign Attribution */}
      <CrmTabCard title="Acquisition Source & Campaign Attribution">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200/70 dark:border-[#2A2F3D] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">
              <Share2 size={14} className="text-primary" />
              Lead Source
            </div>
            <p className="text-base font-bold text-zinc-900 dark:text-[#E6E8EE]">
              {sourceName}
            </p>
            <p className="text-[11px] text-zinc-500">
              Provider / Channel ID: <span className="font-mono">{lead.leadSourceId || 'N/A'}</span>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200/70 dark:border-[#2A2F3D] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">
              <Megaphone size={14} className="text-purple-600" />
              Marketing Campaign
            </div>
            <p className="text-base font-bold text-zinc-900 dark:text-[#E6E8EE]">
              {campaignName}
            </p>
            <p className="text-[11px] text-zinc-500">
              Campaign ID: <span className="font-mono">{lead.campaignId || 'N/A'}</span>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200/70 dark:border-[#2A2F3D] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">
              <Globe size={14} className="text-blue-600" />
              External Integration Reference
            </div>
            <p className="text-base font-mono font-bold text-zinc-900 dark:text-[#E6E8EE] truncate">
              {lead.externalLeadId || 'None'}
            </p>
            {lead.externalLeadUrl ? (
              <a
                href={lead.externalLeadUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
              >
                Open External Ad / Lead <ExternalLink size={12} />
              </a>
            ) : (
              <p className="text-[11px] text-zinc-500">Native CRM Inbound</p>
            )}
          </div>
        </div>
      </CrmTabCard>

      {/* 2. Consent & Communication Preferences */}
      <CrmTabCard title="Consent & Regulatory Compliance">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200/70 dark:border-[#2A2F3D]">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  lead.consentGiven
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40'
                    : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'
                }`}
              >
                {lead.consentGiven ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE]">
                  Customer Consent Status: {lead.consentGiven ? 'Granted' : 'Explicit Consent Not Recorded'}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-[#A0A6B5]">
                  Source: {lead.consentSource || 'Direct Inbound Form'}
                  {lead.consentTimestamp && ` · ${new Date(lead.consentTimestamp).toLocaleString()}`}
                </p>
              </div>
            </div>

            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                lead.consentGiven
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                  : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
              }`}
            >
              {lead.consentGiven ? 'Opted In' : 'No Consent'}
            </span>
          </div>

          {/* Channel-Specific Opt-Outs */}
          <div className="pt-2">
            <p className="text-[8.5px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184] mb-3">
              Channel Opt-Out Preferences
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Voice Calls', optedOut: lead.optOutCall },
                { label: 'Email Marketing', optedOut: lead.optOutEmail },
                { label: 'SMS Notifications', optedOut: lead.optOutSms },
                { label: 'WhatsApp', optedOut: lead.optOutWhatsapp },
              ].map((ch) => (
                <div
                  key={ch.label}
                  className="flex items-center justify-between p-3 rounded-lg border border-zinc-200/80 dark:border-[#2A2F3D] bg-white dark:bg-[#161922]"
                >
                  <span className="text-xs font-medium text-zinc-800 dark:text-[#E6E8EE]">
                    {ch.label}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      ch.optedOut
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                    }`}
                  >
                    {ch.optedOut ? (
                      <>
                        <X size={12} /> Opted Out
                      </>
                    ) : (
                      <>
                        <Check size={12} /> Allowed
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CrmTabCard>
    </div>
  );
}
