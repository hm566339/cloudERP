import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Briefcase,
  Users,
  ShieldCheck,
  Globe,
  Bell,
  SlidersHorizontal,
  Palette,
  CreditCard,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  CheckCircle2,
  Activity,
  Layers,
  Key,
  Calendar,
  Sparkles,
} from 'lucide-react';
import PageHeader from '../../../../components/common/PageHeader';

export default function OrgOverviewView({
  organization,
  user,
  companies = [],
  membersCount = 0,
  planName = 'Standard Plan',
  isTrial = false,
  twoFactorRequired = false,
  sessionTimeout = '60',
  currency = 'INR',
  timezone = 'Asia/Kolkata (IST)',
  enabledModules = [],
  loginUrl = '',
  onNavigateSection,
}) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const orgId = organization?.id || '';
  const orgName = organization?.name || organization?.code || 'My Organization';
  const orgCode = (organization?.code || '').toUpperCase();
  const status = organization?.status || 'ACTIVE';

  const handleCopyId = () => {
    if (!orgId) return;
    navigator.clipboard.writeText(orgId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyUrl = () => {
    if (!loginUrl) return;
    navigator.clipboard.writeText(loginUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // KPI Metrics matching Customer Management card styling
  const kpiCards = [
    {
      title: 'Total Companies',
      value: `${companies.length} / 4`,
      subtitle: `${Math.max(0, 4 - companies.length)} remaining in subscription tier`,
      icon: Briefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/40',
      section: 'companies',
    },
    {
      title: 'Total Members',
      value: membersCount || companies.length || '1',
      subtitle: 'Active user accounts',
      icon: Users,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
      section: 'users',
    },
    {
      title: 'Configured Roles',
      value: '6 Roles',
      subtitle: 'System & custom role templates',
      icon: ShieldCheck,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
      section: 'roles',
    },
    {
      title: 'Provisioned Modules',
      value: `${enabledModules.length || 6} Modules`,
      subtitle: 'Accounts, Inventory, CRM, Purchases...',
      icon: Layers,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/40',
      section: 'portal-access',
    },
  ];

  // Recent Organization Activities
  const recentActivities = [
    {
      id: 'act-1',
      action: 'Role Template Deployed',
      detail: 'Template "Finance Manager" synchronized to all operating companies',
      time: '10 minutes ago',
      user: 'Owner Admin',
      status: 'Success',
    },
    {
      id: 'act-2',
      action: 'Member Invited',
      detail: 'Sent multi-company membership invitation to mohit@example.com',
      time: '1 hour ago',
      user: 'Owner Admin',
      status: 'Completed',
    },
    {
      id: 'act-3',
      action: 'Security Policy Updated',
      detail: 'Enforced Two-Factor Authentication across all organization logins',
      time: 'Yesterday',
      user: 'Security System',
      status: 'Enforced',
    },
    {
      id: 'act-4',
      action: 'Operating Company Verified',
      detail: 'Verified GSTIN and business address details for Primary Company',
      time: '2 days ago',
      user: 'Compliance Agent',
      status: 'Verified',
    },
  ];

  return (
              <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
                <PageHeader
                  title="Overview"
                  description="Organization summary, operational metrics, and workspace status"
                >
                  <div className="flex items-center gap-2">
                    {orgCode && (
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
              {orgCode}
            </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                    <CheckCircle2 size={13} />
                    <span>Active Subscription</span>
                  </span>
              </div>
        </PageHeader>

            {/* Main Content Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiCards.map((kpi) => {
                  const Icon = kpi.icon;
                  return (
                    <div
                      key={kpi.title}
                      onClick={() => onNavigateSection && onNavigateSection(kpi.section)}
                      className="bg-white dark:bg-[#161922] p-5 rounded-2xl border border-zinc-200 dark:border-[#2A2F3D] shadow-xs hover:border-zinc-300 dark:hover:border-zinc-600 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          {kpi.title}
                        </span>
                        <div className={`p-2 rounded-xl ${kpi.bgColor} ${kpi.color}`}>
                          <Icon size={18} />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        {kpi.value}
                      </div>
                      <div className="flex items-center justify-between mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        <span>{kpi.subtitle}</span>
                        <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                      </div>
                    </div>
                  );
                })}
              </div>

                    {/* 2-Column Split: Organization Information & Recent Activities */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Organization Details (2 Cols) */}
                      <div className="lg:col-span-2 bg-white dark:bg-[#161922] p-6 rounded-2xl border border-zinc-200 dark:border-[#2A2F3D] shadow-xs space-y-5">
                        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                              <Building2 size={22} />
                            </div>
                            <div>
                              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                                Organization Information
                              </h3>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Primary multi-company tenant entity metadata and identifiers
                              </p>
                            </div>
                          </div>

                          {onNavigateSection && (
                            <button
                              type="button"
                              onClick={() => onNavigateSection('profile')}
                              className="text-xs font-semibold text-primary hover:underline"
                            >
                              Edit Profile &rarr;
                            </button>
                          )}
                        </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl space-y-1">
                              <span className="font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                Organization Name
                              </span>
                              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{orgName}</p>
                            </div>

                            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl space-y-1">
                              <span className="font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                Organization Identifier
                              </span>
                              <div className="flex items-center justify-between">
                                <p className="font-mono text-zinc-800 dark:text-zinc-200 truncate max-w-[180px]">
                                  {orgId || '—'}
                                </p>
                                {orgId && (
                                  <button
                                    type="button"
                                    onClick={handleCopyId}
                                    className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 p-1"
                                    title="Copy ID"
                                  >
                                    {copiedId ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl space-y-1">
                              <span className="font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                Subscription Tier
                              </span>
                              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                {planName} {isTrial ? '(Trial Mode)' : '(Active)'}
                              </p>
                            </div>

                            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl space-y-1">
                              <span className="font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                Regional Defaults
                              </span>
                              <p className="text-zinc-800 dark:text-zinc-200 font-medium">
                                {currency} &bull; {timezone}
                              </p>
                            </div>

                            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl space-y-1 md:col-span-2">
                              <span className="font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                Branded Login Portal URL
                              </span>
                              <div className="flex items-center justify-between">
                                <a
                                  href={loginUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-mono text-xs text-primary hover:underline truncate max-w-[320px]"
                                >
                                  {loginUrl}
                                </a>
                                <button
                                  type="button"
                                  onClick={handleCopyUrl}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100"
                                >
                                  {copiedUrl ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                  <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                            {/* Recent Administrative Activities (1 Col) */}
                            <div className="bg-white dark:bg-[#161922] p-6 rounded-2xl border border-zinc-200 dark:border-[#2A2F3D] shadow-xs space-y-4 flex flex-col">
                              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center gap-2">
                                  <Activity size={18} className="text-zinc-600 dark:text-zinc-400" />
                                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                    Recent Activities
                                  </h3>
                                </div>
                                <span className="text-[11px] text-zinc-400">Live Audit</span>
                              </div>

                                        <div className="flex-1 space-y-3.5 overflow-y-auto">
                                          {recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {act.action}
                    </span>
                    <span className="text-[10px] text-zinc-400">{act.time}</span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-[11px]">
                    {act.detail}
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[10px] text-zinc-500">
                    <span>By: {act.user}</span>
                    <span className="text-emerald-600 font-medium">{act.status}</span>
                  </div>
                </div>
              ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
    </div>
                          );
}
