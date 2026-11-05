import React, { useState } from 'react';
import {
  Globe,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';

export default function OrgLoginPortalView({
  organization,
  loginUrl: passedLoginUrl = '',
}) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const orgCode = (organization?.code || '').toLowerCase();
  const orgCodeUpper = (organization?.code || '').toUpperCase();
  const orgName = organization?.name || 'Organization';

  const defaultUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/erp/o/${orgCode}/login`
    : `https://www.mark2.in/erp/o/${orgCode}/login`;

  const loginUrl = passedLoginUrl || defaultUrl;

  const handleCopyUrl = () => {
    if (!loginUrl) return;
    navigator.clipboard.writeText(loginUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyCode = () => {
    if (!orgCodeUpper) return;
    navigator.clipboard.writeText(orgCodeUpper);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#D5D8CA] dark:border-[#2A2F3D] gap-2">
        <div>
          <h1 className="text-xl font-bold text-[#2E3D28] dark:text-[#E6E8EE] flex items-center gap-2">
            <Globe size={22} className="text-[#485942] dark:text-[#A0A6B5]" />
            Organization Login Portal
          </h1>
          <p className="text-xs text-[#485942] dark:text-[#A0A6B5] mt-1">
            Dedicated vanity login portal URL and tenant sign-in access point for {orgName}.
          </p>
        </div>
      </div>

      {/* ── Vanity URL Card ── */}
      <div className="bg-[#F7F7F0] dark:bg-[#161922] rounded-2xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-xs p-6 space-y-5">
        <div>
          <h2 className="text-sm font-bold text-[#2E3D28] dark:text-[#E6E8EE]">
            Dedicated Organization Portal URL
          </h2>
          <p className="text-xs text-[#485942] dark:text-[#A0A6B5] mt-0.5">
            Share this dedicated URL with team members to sign in directly to your organization.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 bg-white dark:bg-[#1D212C] border border-[#D5D8CA] dark:border-[#2A2F3D] rounded-xl shadow-2xs">
          <span className="font-mono text-xs sm:text-sm text-zinc-800 dark:text-[#E6E8EE] select-all truncate flex-1 font-semibold">
            {loginUrl}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyUrl}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#EDEEE4] dark:bg-[#222736] hover:bg-[#DCE2CF] dark:hover:bg-[#2A2F3D] rounded-xl text-[#2E3D28] dark:text-[#E6E8EE] transition-all active:scale-95 shadow-2xs"
            >
              {copiedUrl ? (
                <>
                  <Check size={13} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Copied Link</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copy Link</span>
                </>
              )}
            </button>
            <a
              href={loginUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#2E3D28] dark:bg-primary hover:bg-[#3C4E34] text-white rounded-xl transition-all shadow-2xs"
            >
              <ExternalLink size={13} />
              <span>Preview Portal</span>
            </a>
          </div>
        </div>

        {/* Organization Vanity Code */}
        <div className="p-4 bg-white dark:bg-[#1D212C] border border-[#D5D8CA] dark:border-[#2A2F3D] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE]">
              Organization Namespace Identifier
            </div>
            <div className="text-[11px] text-[#485942] dark:text-[#A0A6B5] mt-0.5">
              Unique vanity token resolved at authentication time to route requests to this organization's database partition.
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-xs font-bold px-3 py-1 bg-[#EDEEE4] dark:bg-[#161922] text-[#2E3D28] dark:text-[#E6E8EE] rounded-lg border border-[#D5D8CA] dark:border-[#2A2F3D]">
              {orgCodeUpper || 'ORG'}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-1.5 text-xs text-[#485942] hover:text-[#2E3D28] dark:text-[#A0A6B5] dark:hover:text-[#E6E8EE] bg-[#EDEEE4] dark:bg-[#222736] rounded-lg"
              title="Copy code"
            >
              {copiedCode ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Employee Onboarding Instructions ── */}
      <div className="bg-[#F7F7F0] dark:bg-[#161922] rounded-2xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-xs p-6 space-y-4">
        <h2 className="text-sm font-bold text-[#2E3D28] dark:text-[#E6E8EE] flex items-center gap-2">
          <Shield size={16} className="text-[#485942] dark:text-[#A0A6B5]" />
          How Organization Sign-in Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-white dark:bg-[#1D212C] border border-[#D5D8CA] dark:border-[#2A2F3D] space-y-1.5">
            <div className="w-6 h-6 rounded-full bg-[#EDEEE4] dark:bg-[#222736] text-[#2E3D28] dark:text-[#E6E8EE] font-bold text-xs flex items-center justify-center">
              1
            </div>
            <h3 className="text-xs font-bold text-[#2E3D28] dark:text-[#E6E8EE]">
              Direct Tenant Scoping
            </h3>
            <p className="text-[11px] text-[#485942] dark:text-[#A0A6B5] leading-relaxed">
              When members open the dedicated URL, the organization context is locked in. Employees simply enter their email and password.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#1D212C] border border-[#D5D8CA] dark:border-[#2A2F3D] space-y-1.5">
            <div className="w-6 h-6 rounded-full bg-[#EDEEE4] dark:bg-[#222736] text-[#2E3D28] dark:text-[#E6E8EE] font-bold text-xs flex items-center justify-center">
              2
            </div>
            <h3 className="text-xs font-bold text-[#2E3D28] dark:text-[#E6E8EE]">
              Company Selection
            </h3>
            <p className="text-[11px] text-[#485942] dark:text-[#A0A6B5] leading-relaxed">
              Users with access to multiple companies can choose which company workspace to enter or switch companies dynamically from the header.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#1D212C] border border-[#D5D8CA] dark:border-[#2A2F3D] space-y-1.5">
            <div className="w-6 h-6 rounded-full bg-[#EDEEE4] dark:bg-[#222736] text-[#2E3D28] dark:text-[#E6E8EE] font-bold text-xs flex items-center justify-center">
              3
            </div>
            <h3 className="text-xs font-bold text-[#2E3D28] dark:text-[#E6E8EE]">
              Independent Roles
            </h3>
            <p className="text-[11px] text-[#485942] dark:text-[#A0A6B5] leading-relaxed">
              Each user operates strictly within the permissions and role assigned to them for their active company workspace.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

