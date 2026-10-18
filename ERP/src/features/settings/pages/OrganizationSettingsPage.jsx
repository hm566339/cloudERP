import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  ShieldCheck,
  Globe,
  CreditCard,
  Copy,
  Check,
  Save,
  ExternalLink,
  Users,
  Calendar,
  Sparkles,
  SlidersHorizontal,
  Clock,
  ArrowRight,
  Mail,
  Hash,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import { selectAuthContext } from '../../../features/auth/authSlice';
import { addAlert } from '../../../features/notifications/notificationSlice';

export default function OrganizationSettingsPage() {
  const dispatch = useAppDispatch();
  const authContext = useAppSelector(selectAuthContext);

  const {
    organization,
    user,
    companies = [],
    subscription,
    modules = [],
  } = authContext || {};

  const orgName = organization?.name || organization?.code || 'My Organization';
  const orgCode = (organization?.code || '').toUpperCase();
  const orgId = organization?.id || '';
  const accessMode = organization?.accessMode || 'FULL';
  const status = organization?.status || 'ACTIVE';

  // Form states
  const [name, setName] = useState(orgName);
  const [contactEmail, setContactEmail] = useState(user?.email || organization?.email || '');
  const [currency, setCurrency] = useState('INR');
  const [timezone, setTimezone] = useState('Asia/Kolkata (IST)');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [timeFormat, setTimeFormat] = useState('12h');
  const [fiscalYearStart, setFiscalYearStart] = useState('April');
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('60');

  const [copiedId, setCopiedId] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loginUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/erp/`
    : `https://app.mark2erp.com/erp/`;

  const handleCopyId = () => {
    if (!orgId) return;
    navigator.clipboard.writeText(orgId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyLoginUrl = () => {
    navigator.clipboard.writeText(loginUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSavedSuccess(true);
      dispatch(
        addAlert({
          type: 'success',
          message: 'Organization settings and preferences updated successfully.',
        })
      );
      setTimeout(() => setSavedSuccess(false), 3000);
    }, 600);
  };

  return (
    <div className="p-4 sm:p-6 w-full space-y-6 animate-fade-in font-sans">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-zinc-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-zinc-900 text-white shadow-sm">
              <Building2 size={20} />
            </span>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
                  Organization Settings
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {status}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200/60 uppercase">
                  {accessMode} ACCESS
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                Manage organization-wide profiles, defaults, security policies, and workspace parameters.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/owner/companies"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-xs"
          >
            <Building2 size={14} className="text-zinc-500" />
            Manage Companies ({companies.length})
          </Link>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {isSaving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : savedSuccess ? (
              <>
                <Check size={14} className="text-emerald-400" />
                Saved
              </>
            ) : (
              <>
                <Save size={14} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Organization Info Card ── */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
              <Building2 size={18} className="text-zinc-600" />
              Organization Profile
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Primary identification and registration details for this organization entity.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Organization Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all text-zinc-900 font-medium"
              placeholder="e.g. Acme Corp Holdings"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Organization Code
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={orgCode}
                readOnly
                className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-700 font-mono font-semibold cursor-not-allowed select-all"
              />
              <span className="text-[11px] font-medium text-zinc-500 whitespace-nowrap px-2 py-1 bg-zinc-100 rounded-lg border border-zinc-200/60">
                Immutable
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Used in vanity URLs and multi-tenant domain routing.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Primary Organization Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all text-zinc-900"
                placeholder="billing@organization.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Organization UUID
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={orgId}
                readOnly
                className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-600 font-mono select-all truncate"
              />
              <button
                type="button"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 rounded-xl text-zinc-700 transition-all shadow-2xs whitespace-nowrap active:scale-95"
              >
                {copiedId ? (
                  <>
                    <Check size={13} className="text-emerald-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={13} className="text-zinc-500" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Organization Sign-in & Domain URL ── */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
              <Globe size={18} className="text-zinc-600" />
              Dedicated Organization Login Portal
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Share this dedicated URL with team members to access your organization workspace.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-xl">
          <span className="font-mono text-xs sm:text-sm text-zinc-800 select-all truncate flex-1">
            {loginUrl}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyLoginUrl}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-white border border-zinc-200 hover:bg-zinc-100 rounded-lg text-zinc-700 transition-all shadow-2xs active:scale-95"
            >
              {copiedUrl ? (
                <>
                  <Check size={13} className="text-emerald-600" />
                  Copied Link
                </>
              ) : (
                <>
                  <Copy size={13} className="text-zinc-500" />
                  Copy Link
                </>
              )}
            </button>
            <a
              href={loginUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white border border-zinc-200 hover:bg-zinc-100 rounded-lg text-zinc-700 transition-all shadow-2xs"
            >
              <ExternalLink size={13} className="text-zinc-500" />
              Preview
            </a>
          </div>
        </div>
      </div>

      {/* ── Regional & Fiscal Defaults ── */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
              <SlidersHorizontal size={18} className="text-zinc-600" />
              Regional & Fiscal Defaults
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Default formatting and calendar preferences inherited by new companies and branches.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Default Operating Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 text-zinc-900 font-medium"
            >
              <option value="INR">INR — Indian Rupee (₹)</option>
              <option value="USD">USD — US Dollar ($)</option>
              <option value="EUR">EUR — Euro (€)</option>
              <option value="GBP">GBP — British Pound (£)</option>
              <option value="AED">AED — UAE Dirham</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Organization Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 text-zinc-900 font-medium"
            >
              <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST, UTC+05:30)</option>
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="America/New_York (EST)">America/New_York (EST/EDT)</option>
              <option value="Europe/London (GMT)">Europe/London (GMT/BST)</option>
              <option value="Asia/Dubai (GST)">Asia/Dubai (GST, UTC+04:00)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Fiscal Year Start Month
            </label>
            <select
              value={fiscalYearStart}
              onChange={(e) => setFiscalYearStart(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 text-zinc-900 font-medium"
            >
              <option value="April">April (e.g. India standard: Apr 1 - Mar 31)</option>
              <option value="January">January (e.g. Calendar year: Jan 1 - Dec 31)</option>
              <option value="July">July (e.g. Australia / US fiscal)</option>
              <option value="October">October (e.g. Federal US)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Date Format
            </label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 text-zinc-900 font-medium"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (15/10/2026)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (10/15/2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (2026-10-15)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Time Format
            </label>
            <select
              value={timeFormat}
              onChange={(e) => setTimeFormat(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 text-zinc-900 font-medium"
            >
              <option value="12h">12-Hour (e.g. 02:45 PM)</option>
              <option value="24h">24-Hour (e.g. 14:45)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Security & Authentication Policies ── */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
              <ShieldCheck size={18} className="text-zinc-600" />
              Organization Security & Compliance
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Enforce security baselines across all company workspaces in this organization.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-zinc-50/70 border border-zinc-200/70">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">
                Enforce Multi-Factor Authentication (2FA)
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Require all organization members and company users to set up two-factor verification.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={twoFactorRequired}
                onChange={(e) => setTwoFactorRequired(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900" />
            </label>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-50/70 border border-zinc-200/70">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">
                Automatic Inactivity Session Timeout
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Automatically sign out idle users after a specified duration of inactivity.
              </p>
            </div>
            <select
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(e.target.value)}
              className="px-3.5 py-1.5 text-xs font-semibold bg-white border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 shrink-0"
            >
              <option value="15">15 Minutes</option>
              <option value="30">30 Minutes</option>
              <option value="60">60 Minutes (Standard)</option>
              <option value="120">2 Hours</option>
              <option value="480">8 Hours</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Organization Modules & Subscription Overview ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                <CreditCard size={16} className="text-zinc-600" />
                Subscription Plan
              </h3>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {subscription?.planCode || 'Standard Plan'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mb-4">
              Your organization plan governs multi-company provisioning, storage limits, and module access.
            </p>
            <div className="space-y-2 text-xs text-zinc-600">
              <div className="flex items-center justify-between py-1 border-b border-zinc-100">
                <span>Active Companies</span>
                <span className="font-semibold text-zinc-900">{companies.length}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-zinc-100">
                <span>Status</span>
                <span className="font-semibold text-emerald-600 capitalize">
                  {subscription?.trialing ? 'Trial Period' : 'Active'}
                </span>
              </div>
            </div>
          </div>
          <Link
            to="/subscription"
            className="mt-5 inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-all"
          >
            Manage Organization Subscription
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                <Sparkles size={16} className="text-zinc-600" />
                Entitled Modules
              </h3>
              <span className="text-xs font-bold text-zinc-700 bg-zinc-100 px-2.5 py-0.5 rounded-full border border-zinc-200/60">
                {modules.length > 0 ? `${modules.length} Enabled` : 'All Standard'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mb-4">
              Business applications activated for your organization's companies.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {['Finance & Accounts', 'Inventory', 'Sales & CRM', 'Purchasing', 'Workflow Automation', 'SSO Admin'].map(
                (m) => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-zinc-50 text-zinc-700 border border-zinc-200 rounded-lg"
                  >
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    {m}
                  </span>
                )
              )}
            </div>
          </div>
          <Link
            to="/owner/companies"
            className="mt-5 inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-all"
          >
            Assign Modules to Companies
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
