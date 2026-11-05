import React, { useState } from 'react';
import {
  Building2,
  Mail,
  Copy,
  Check,
  Save,
  Shield,
  Key,
  Info,
} from 'lucide-react';

export default function OrgProfileView({
  organization,
  initialName = '',
  initialEmail = '',
  onSaveProfile,
  isSaving = false,
}) {
  const [name, setName] = useState(initialName || organization?.name || '');
  const [email, setEmail] = useState(initialEmail || organization?.email || organization?.primaryEmail || '');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const orgCode = (organization?.code || '').toUpperCase();
  const orgId = organization?.id || '';
  const status = organization?.status || 'ACTIVE';
  const accessMode = organization?.accessMode || 'FULL';

  const handleCopyId = () => {
    if (!orgId) return;
    navigator.clipboard.writeText(orgId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyCode = () => {
    if (!orgCode) return;
    navigator.clipboard.writeText(orgCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSaveProfile) {
      onSaveProfile({ name: name.trim(), email: email.trim() });
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#D5D8CA] dark:border-[#2A2F3D] gap-2">
        <div>
          <h1 className="text-xl font-bold text-[#2E3D28] dark:text-[#E6E8EE] flex items-center gap-2">
            <Building2 size={22} className="text-[#485942] dark:text-[#A0A6B5]" />
            Organization Profile
          </h1>
          <p className="text-xs text-[#485942] dark:text-[#A0A6B5] mt-1">
            Primary identification, corporate registration details, and administrative email address.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {status}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-[#1D212C] text-zinc-700 dark:text-[#A0A6B5] border border-zinc-200/60 dark:border-[#2A2F3D] uppercase">
            {accessMode} ACCESS
          </span>
        </div>
      </div>

      {/* ── Form Card ── */}
      <form onSubmit={handleSubmit} className="bg-[#F7F7F0] dark:bg-[#161922] rounded-2xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-xs p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Organization Name */}
          <div>
            <label className="block text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] mb-1.5">
              Organization Legal Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E3D28]/20 dark:focus:ring-primary/20 focus:border-[#2E3D28] dark:focus:border-primary text-zinc-900 dark:text-[#E6E8EE] font-medium"
              placeholder="e.g. Acme Enterprise Holdings Ltd."
            />
            <p className="text-[11px] text-[#485942] dark:text-[#A0A6B5] mt-1">
              Displayed on invoices, customer reports, and the navigation sidebar.
            </p>
          </div>

          {/* Organization Code (Immutable) */}
          <div>
            <label className="block text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] mb-1.5">
              Organization Code
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={orgCode}
                className="w-full px-3.5 py-2 text-sm bg-zinc-100 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl text-[#2E3D28] dark:text-[#E6E8EE] font-mono font-bold cursor-not-allowed select-all"
              />
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] hover:bg-zinc-50 dark:hover:bg-[#222736] rounded-xl text-[#2E3D28] dark:text-[#E6E8EE] transition-all shrink-0"
              >
                {copiedCode ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                <span>Copy</span>
              </button>
            </div>
            <p className="text-[11px] text-[#485942] dark:text-[#A0A6B5] mt-1">
              Immutable unique namespace used in vanity URLs and SSO routing.
            </p>
          </div>

          {/* Primary Organization Email */}
          <div>
            <label className="block text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] mb-1.5">
              Primary Administrative Email *
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 text-sm bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E3D28]/20 dark:focus:ring-primary/20 focus:border-[#2E3D28] dark:focus:border-primary text-zinc-900 dark:text-[#E6E8EE]"
                placeholder="admin@organization.com"
              />
            </div>
            <p className="text-[11px] text-[#485942] dark:text-[#A0A6B5] mt-1">
              Receives critical security alerts, billing invoices, and membership notices.
            </p>
          </div>

          {/* Organization UUID (Immutable) */}
          <div>
            <label className="block text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] mb-1.5">
              Organization System UUID
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={orgId}
                className="w-full px-3.5 py-2 text-xs bg-zinc-100 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl text-[#485942] dark:text-[#A0A6B5] font-mono select-all truncate cursor-not-allowed"
              />
              <button
                type="button"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] hover:bg-zinc-50 dark:hover:bg-[#222736] rounded-xl text-[#2E3D28] dark:text-[#E6E8EE] transition-all shrink-0"
              >
                {copiedId ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                <span>Copy UUID</span>
              </button>
            </div>
            <p className="text-[11px] text-[#485942] dark:text-[#A0A6B5] mt-1">
              Internal multi-tenant UUID for database entity foreign keys.
            </p>
          </div>
        </div>

        {/* Informational Callout */}
        <div className="flex items-start gap-3 p-3.5 bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200/70 dark:border-[#2A2F3D] rounded-xl text-xs text-[#485942] dark:text-[#A0A6B5]">
          <Info size={16} className="text-[#2E3D28] dark:text-primary shrink-0 mt-0.5" />
          <p>
            Modifying your organization profile will update the legal entity header on future invoices, reports, and team invitation communications across all registered companies.
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#2E3D28] dark:bg-primary hover:bg-[#3C4E34] dark:hover:bg-primary-600 rounded-xl shadow-xs transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

