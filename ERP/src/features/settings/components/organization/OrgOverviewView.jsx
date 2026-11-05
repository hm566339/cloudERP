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
  Sparkles,
} from 'lucide-react';

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
  const accessMode = organization?.accessMode || 'FULL';

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

  const tiles = [
    {
      id: 'profile',
      label: 'Organization Profile',
      icon: Building2,
      desc: 'Name, legal entity details, primary email, and immutable code',
      meta: orgCode ? `Code: ${orgCode}` : 'Profile configured',
    },
    {
      id: 'companies',
      label: 'Companies Management',
      icon: Briefcase,
      desc: 'Operating companies, branch entities, and workspace routing',
      meta: `${companies.length} active company workspaces`,
    },
    {
      id: 'users',
      label: 'Users & Permissions',
      icon: Users,
      desc: 'Single user ID architecture with independent company-wise roles',
      meta: `${membersCount || companies.length} registered members`,
    },
    {
      id: 'security',
      label: 'Security & Authentication',
      icon: ShieldCheck,
      desc: 'Organization-wide 2FA policy, password requirements & idle timeouts',
      meta: twoFactorRequired ? '2FA Enforced' : '2FA Optional',
    },
    {
      id: 'login-portal',
      label: 'Organization Login Portal',
      icon: Globe,
      desc: 'Dedicated vanity URL for organization direct user sign-in',
      meta: orgCode ? `/erp/o/${orgCode.toLowerCase()}/login` : 'Portal active',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      desc: 'Alert routing, security emails, and critical system notices',
      meta: 'Email alerts active',
    },
    {
      id: 'localization',
      label: 'Localization & Formats',
      icon: SlidersHorizontal,
      desc: 'Base operating currency, timezone, and fiscal calendar year',
      meta: `${currency} • ${timezone.split(' ')[0]}`,
    },
    {
      id: 'appearance',
      label: 'Appearance & Themes',
      icon: Palette,
      desc: 'Theme presets, corporate palette, typography & layout density',
      meta: 'Sage Nature Theme',
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Organization Banner & Identity ── */}
      <div className="bg-[#F7F7F0] dark:bg-[#161922] rounded-2xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-xs p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span className="p-3 rounded-2xl bg-[#2E3D28] dark:bg-primary text-white shadow-sm mt-0.5">
              <Building2 size={24} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2E3D28] dark:text-[#E6E8EE]">
                  {orgName}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {status}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-[#1D212C] text-zinc-700 dark:text-[#A0A6B5] border border-zinc-200/60 dark:border-[#2A2F3D] uppercase">
                  {accessMode} ACCESS
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#485942] dark:text-[#A0A6B5] mt-1">
                Centralized Organization Management console. Manage multi-company access, company-wise roles, security policies, and workspace parameters.
              </p>
            </div>
          </div>

          {/* Org UUID & Copy */}
          {orgId && (
            <div className="flex items-center gap-2 self-start md:self-auto bg-white dark:bg-[#1D212C] px-3 py-1.5 rounded-xl border border-[#D5D8CA] dark:border-[#2A2F3D]">
              <span className="text-[11px] font-mono text-[#485942] dark:text-[#A0A6B5] max-w-[140px] truncate" title={orgId}>
                {orgId}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="text-[11px] font-semibold text-[#2E3D28] dark:text-[#E6E8EE] hover:underline inline-flex items-center gap-1"
              >
                {copiedId ? (
                  <>
                    <Check size={12} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy ID</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Key Metrics Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Companies */}
        <div className="bg-[#F7F7F0] dark:bg-[#161922] p-4 rounded-xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[#485942] dark:text-[#A0A6B5]">
              <span className="text-xs font-medium uppercase tracking-wider">Registered Companies</span>
              <Briefcase size={16} />
            </div>
            <div className="text-2xl font-bold text-[#2E3D28] dark:text-[#E6E8EE] mt-2">
              {companies.length}
              <span className="text-xs font-normal text-[#485942] dark:text-[#A0A6B5] ml-1.5">/ 4 max</span>
            </div>
            <p className="text-[11px] text-[#485942] dark:text-[#A0A6B5] mt-1">
              Independent operating workspaces
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateSection && onNavigateSection('companies')}
            className="mt-3 text-xs font-semibold text-[#2E3D28] dark:text-primary hover:underline inline-flex items-center gap-1"
          >
            <span>Manage Companies</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {/* Metric 2: Users & Members */}
        <div className="bg-[#F7F7F0] dark:bg-[#161922] p-4 rounded-xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[#485942] dark:text-[#A0A6B5]">
              <span className="text-xs font-medium uppercase tracking-wider">Organization Members</span>
              <Users size={16} />
            </div>
            <div className="text-2xl font-bold text-[#2E3D28] dark:text-[#E6E8EE] mt-2">
              {membersCount || companies.length}
            </div>
            <p className="text-[11px] text-[#485942] dark:text-[#A0A6B5] mt-1">
              Reusable single-ID user accounts
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateSection && onNavigateSection('users')}
            className="mt-3 text-xs font-semibold text-[#2E3D28] dark:text-primary hover:underline inline-flex items-center gap-1"
          >
            <span>Users & Permissions</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {/* Metric 3: Security Status */}
        <div className="bg-[#F7F7F0] dark:bg-[#161922] p-4 rounded-xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[#485942] dark:text-[#A0A6B5]">
              <span className="text-xs font-medium uppercase tracking-wider">Security Baseline</span>
              <ShieldCheck size={16} />
            </div>
            <div className="text-sm font-bold text-[#2E3D28] dark:text-[#E6E8EE] mt-2 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${twoFactorRequired ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{twoFactorRequired ? '2FA Enforced' : 'Standard MFA'}</span>
            </div>
            <p className="text-[11px] text-[#485942] dark:text-[#A0A6B5] mt-1">
              Timeout: {sessionTimeout} minutes idle
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateSection && onNavigateSection('security')}
            className="mt-3 text-xs font-semibold text-[#2E3D28] dark:text-primary hover:underline inline-flex items-center gap-1"
          >
            <span>Security Settings</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {/* Metric 4: Subscription Plan */}
        <div className="bg-[#F7F7F0] dark:bg-[#161922] p-4 rounded-xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[#485942] dark:text-[#A0A6B5]">
              <span className="text-xs font-medium uppercase tracking-wider">Plan & Entitlements</span>
              <CreditCard size={16} />
            </div>
            <div className="text-base font-bold text-emerald-700 dark:text-emerald-400 mt-2 truncate">
              {planName}
            </div>
            <p className="text-[11px] text-[#485942] dark:text-[#A0A6B5] mt-1 capitalize">
              {isTrial ? 'Trial Period' : 'Active Subscription'}
            </p>
          </div>
          <Link
            to="/subscription"
            className="mt-3 text-xs font-semibold text-[#2E3D28] dark:text-primary hover:underline inline-flex items-center gap-1"
          >
            <span>Subscription Console</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* ── Direct Submenu Navigation Tiles (8 modules) ── */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#485942] dark:text-[#A0A6B5] mb-3">
          Organization Modules & Administration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiles.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onNavigateSection && onNavigateSection(t.id)}
                className="group text-left p-4 rounded-xl bg-white dark:bg-[#161922] border border-[#D5D8CA] dark:border-[#2A2F3D] hover:border-[#2E3D28] dark:hover:border-primary hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-lg bg-[#EDEEE4] dark:bg-[#1D212C] text-[#2E3D28] dark:text-primary group-hover:scale-105 transition-transform">
                      <Icon size={18} />
                    </span>
                    <ArrowRight size={14} className="text-[#485942] dark:text-[#A0A6B5] group-hover:translate-x-1 group-hover:text-[#2E3D28] dark:group-hover:text-white transition-all" />
                  </div>
                  <h3 className="text-sm font-bold text-[#2E3D28] dark:text-[#E6E8EE]">
                    {t.label}
                  </h3>
                  <p className="text-[11px] text-[#485942] dark:text-[#A0A6B5] mt-1 leading-relaxed line-clamp-2">
                    {t.desc}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-[#2A2F3D]/60 text-[10px] font-semibold text-[#485942] dark:text-[#A0A6B5] truncate">
                  {t.meta}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Organization Entitled Modules ── */}
      <div className="bg-[#F7F7F0] dark:bg-[#161922] rounded-2xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-xs p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#2E3D28] dark:text-primary" />
            <h2 className="text-sm font-bold text-[#2E3D28] dark:text-[#E6E8EE]">
              Entitled Business Applications
            </h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EDEEE4] dark:bg-[#1D212C] text-[#2E3D28] dark:text-[#E6E8EE] border border-[#D5D8CA] dark:border-[#2A2F3D]">
            {enabledModules.length} Modules Active
          </span>
        </div>
        <p className="text-xs text-[#485942] dark:text-[#A0A6B5]">
          Applications available for deployment and cross-company assignment across all registered companies.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {enabledModules.map((mod) => (
            <span
              key={mod}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-[#1D212C] text-[#2E3D28] dark:text-[#E6E8EE] border border-[#D5D8CA] dark:border-[#2A2F3D] rounded-xl shadow-2xs"
            >
              <CheckCircle2 size={13} className="text-emerald-500" />
              {mod}
            </span>
          ))}
        </div>
      </div>

      {/* ── Dedicated Organization Sign-in URL ── */}
      {loginUrl && (
        <div className="bg-[#F7F7F0] dark:bg-[#161922] rounded-2xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-xs p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-[#2E3D28] dark:text-primary" />
              <h2 className="text-sm font-bold text-[#2E3D28] dark:text-[#E6E8EE]">
                Dedicated Organization Login Portal
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigateSection && onNavigateSection('login-portal')}
              className="text-xs font-semibold text-[#2E3D28] dark:text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>Portal Details</span>
              <ArrowRight size={12} />
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-3 bg-white dark:bg-[#1D212C] border border-[#D5D8CA] dark:border-[#2A2F3D] rounded-xl">
            <span className="font-mono text-xs text-zinc-800 dark:text-[#E6E8EE] select-all truncate flex-1">
              {loginUrl}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyUrl}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-[#EDEEE4] dark:bg-[#222736] hover:bg-[#DCE2CF] rounded-lg text-[#2E3D28] dark:text-[#E6E8EE] transition-all"
              >
                {copiedUrl ? (
                  <>
                    <Check size={12} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy</span>
                  </>
                )}
              </button>
              <a
                href={loginUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-[#EDEEE4] dark:bg-[#222736] hover:bg-[#DCE2CF] rounded-lg text-[#2E3D28] dark:text-[#E6E8EE] transition-all"
              >
                <ExternalLink size={12} />
                <span>Open</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

