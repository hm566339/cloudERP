import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshCw,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import { selectAuthContext } from '../../../features/auth/authSlice';
import { addAlert } from '../../../features/notifications/notificationSlice';
import SettingsNavbar from '../../../components/settings/SettingsNavbar';
import {
  getOrganizationProfile,
  updateOrganizationProfile,
  getLoginPortal,
  getRegionalSettings,
  updateRegionalSettings,
  getSecuritySettings,
  updateSecuritySettings,
  getOrganizationCompanies,
  getOrganizationSubscription,
  getOrganizationModules,
} from '../../../api/sso/organizationSettings.api.js';

export default function OrganizationSettingsPage() {
  const dispatch = useAppDispatch();
  const authContext = useAppSelector(selectAuthContext);

  const {
    organization: authOrg,
    user: authUser,
    companies: authCompanies = [],
    subscription: authSubscription,
    modules: authModules = [],
  } = authContext || {};

  // Form & Settings States
  const [name, setName] = useState(authOrg?.name || authOrg?.code || 'My Organization');
  const [contactEmail, setContactEmail] = useState(authUser?.email || authOrg?.email || '');
  const [orgCode, setOrgCode] = useState((authOrg?.code || '').toUpperCase());
  const [orgId, setOrgId] = useState(authOrg?.id || '');
  const [accessMode, setAccessMode] = useState(authOrg?.accessMode || 'FULL');
  const [status, setStatus] = useState(authOrg?.status || 'ACTIVE');

  // Regional & Fiscal Defaults
  const [currency, setCurrency] = useState('INR');
  const [timezone, setTimezone] = useState('Asia/Kolkata (IST)');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [timeFormat, setTimeFormat] = useState('12h');
  const [fiscalYearStart, setFiscalYearStart] = useState('April');

  // Security Policies
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('60');

  // Multi-Company, Subscription & Modules
  const [registeredCompanies, setRegisteredCompanies] = useState(authCompanies || []);
  const [companiesCount, setCompaniesCount] = useState(authCompanies.length);
  const [subscriptionPlanName, setSubscriptionPlanName] = useState(authSubscription?.planCode || 'Standard Plan');
  const [isTrial, setIsTrial] = useState(Boolean(authSubscription?.trialing));
  const [enabledModules, setEnabledModules] = useState([
    'Finance & Accounts',
    'Inventory',
    'Sales & CRM',
    'Purchasing',
    'Workflow Automation',
    'SSO Admin',
  ]);

  // UI Interactive States
  const [loginUrl, setLoginUrl] = useState(() => {
    const code = (authOrg?.code || '').toLowerCase();
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/erp/o/${code}/login`;
    }
    return `https://app.mark2erp.com/erp/o/${code}/login`;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // ───────────────────────────────────────────────────────────────────────────
  // Fetch Saved Settings From Backend
  // ───────────────────────────────────────────────────────────────────────────

  const loadSettingsData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const results = await Promise.allSettled([
        getOrganizationProfile(),
        getLoginPortal(),
        getRegionalSettings(),
        getSecuritySettings(),
        getOrganizationCompanies(),
        getOrganizationSubscription(),
        getOrganizationModules(),
      ]);

      // 1. Profile
      if (results[0].status === 'fulfilled' && results[0].value) {
        const p = results[0].value;
        if (p.name) setName(p.name);
        if (p.primaryEmail) setContactEmail(p.primaryEmail);
        if (p.code) setOrgCode(p.code.toUpperCase());
        if (p.id) setOrgId(p.id);
        if (p.status) setStatus(p.status);
        if (p.accessMode) setAccessMode(p.accessMode);
      }

      // 2. Login Portal
      if (results[1].status === 'fulfilled' && results[1].value) {
        const portal = results[1].value;
        if (portal.loginUrl) setLoginUrl(portal.loginUrl);
        if (portal.organizationCode) setOrgCode(portal.organizationCode.toUpperCase());
      }

      // 3. Regional Settings
      if (results[2].status === 'fulfilled' && results[2].value) {
        const reg = results[2].value;
        if (reg.currency) setCurrency(reg.currency);
        if (reg.timezone) setTimezone(reg.timezone);
        if (reg.fiscalYearStartMonth) setFiscalYearStart(reg.fiscalYearStartMonth);
        if (reg.dateFormat) setDateFormat(reg.dateFormat);
        if (reg.timeFormat) setTimeFormat(reg.timeFormat);
      }

      // 4. Security Settings
      if (results[3].status === 'fulfilled' && results[3].value) {
        const sec = results[3].value;
        if (sec.enforce2FA !== undefined) setTwoFactorRequired(Boolean(sec.enforce2FA));
        if (sec.sessionTimeoutMinutes) setSessionTimeout(String(sec.sessionTimeoutMinutes));
      }

      // 5. Registered Companies List & Count
      if (results[4].status === 'fulfilled' && results[4].value) {
        const comps = results[4].value;
          let list = [];
          if (Array.isArray(comps)) {
            list = comps;
          } else if (Array.isArray(comps.companies)) {
            list = comps.companies;
          } else if (Array.isArray(comps.data)) {
            list = comps.data;
          } else if (Array.isArray(comps.content)) {
            list = comps.content;
          }
          if (list.length > 0) {
            setRegisteredCompanies(list);
            setCompaniesCount(list.length);
          } else if (typeof comps.activeCount === 'number') {
            setCompaniesCount(comps.activeCount);
          }
        }

        // 6. Subscription
        if (results[5].status === 'fulfilled' && results[5].value) {
          const sub = results[5].value;
          if (sub.planName) setSubscriptionPlanName(sub.planName);
          else if (sub.planCode) setSubscriptionPlanName(sub.planCode);
          if (sub.trialPeriod !== undefined) setIsTrial(Boolean(sub.trialPeriod));
        }

        // 7. Entitled Modules
        if (results[6].status === 'fulfilled' && results[6].value) {
          const modData = results[6].value;
          if (Array.isArray(modData.modules)) {
            const names = modData.modules
              .filter((m) => m.enabled)
              .map((m) => m.name || m.key);
            if (names.length > 0) setEnabledModules(names);
          }
        }
      } catch (err) {
        console.warn('Organization settings initial load notice:', err?.message || err);
        setLoadError(err?.message || 'Failed to load organization settings.');
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    loadSettingsData();
  }, [loadSettingsData]);

  // ───────────────────────────────────────────────────────────────────────────
  // Clipboard Actions
  // ───────────────────────────────────────────────────────────────────────────

  const handleCopyId = () => {
    if (!orgId) return;
    navigator.clipboard.writeText(orgId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyLoginUrl = () => {
    if (!loginUrl) return;
    navigator.clipboard.writeText(loginUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Save Settings Handlers
  // ───────────────────────────────────────────────────────────────────────────

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!name || !name.trim()) {
      dispatch(
        addAlert({
          type: 'error',
          message: 'Organization name cannot be blank.',
        })
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!contactEmail || !emailRegex.test(contactEmail.trim())) {
      dispatch(
        addAlert({
          type: 'error',
          message: 'Please provide a valid primary organization email address.',
        })
      );
      return;
    }

    setIsSaving(true);
    try {
      // 1. Update Profile
      await updateOrganizationProfile({
        name: name.trim(),
        primaryEmail: contactEmail.trim(),
      });

      // 2. Update Regional & Fiscal Defaults
      await updateRegionalSettings({
        currency,
        timezone,
        fiscalYearStartMonth: fiscalYearStart,
        dateFormat,
        timeFormat,
      });

      // 3. Update Security & Compliance
      await updateSecuritySettings({
        enforce2FA: twoFactorRequired,
        sessionTimeoutMinutes: parseInt(sessionTimeout, 10) || 60,
      });

      setSavedSuccess(true);
      dispatch(
        addAlert({
          type: 'success',
          message: 'Organization profile, regional defaults, and security policies updated successfully.',
        })
      );

      setTimeout(() => setSavedSuccess(false), 3000);
      loadSettingsData();
    } catch (err) {
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to update organization settings. Please verify inputs and permissions.';
      dispatch(
        addAlert({
          type: 'error',
          message: errMsg,
        })
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 w-full space-y-6 animate-fade-in font-sans">
      {/* ── Reusable Settings Navigation Bar ── */}
      <div className="shrink-0">
        <SettingsNavbar activeTab="organization" />
      </div>

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-zinc-200/80 dark:border-[#2A2F3D]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#2E3D28] dark:bg-primary text-white shadow-sm">
              <Building2 size={20} />
            </span>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2E3D28] dark:text-[#E6E8EE]">
                  Organization Management
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
                Manage organization-wide profiles, registered companies, defaults, security policies, and workspace parameters.
              </p>
            </div>
          </div>
        </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={loadSettingsData}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl hover:bg-zinc-50 dark:hover:bg-[#222736] transition-all shadow-xs"
              title="Refresh organization settings"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link
              to="/owner/companies"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl hover:bg-zinc-50 dark:hover:bg-[#222736] hover:border-zinc-300 dark:hover:border-zinc-600 transition-all shadow-xs"
            >
              <Building2 size={14} className="text-[#485942] dark:text-[#A0A6B5]" />
              Manage Companies ({companiesCount})
            </Link>
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#2E3D28] dark:bg-primary hover:bg-[#3C4E34] active:bg-[#243320] dark:hover:bg-primary-600 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 active:scale-[0.98]"
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

        {loadError && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-200">
            <span>Failed to load fresh organization data: {loadError}</span>
            <button
              type="button"
              onClick={loadSettingsData}
              className="font-semibold underline ml-2 hover:text-amber-950 dark:hover:text-amber-100"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Organization Info Card ── */}
        <div className="bg-[#F7F7F0] dark:bg-[#161922] rounded-2xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#D5D8CA] dark:border-[#2A2F3D]">
            <div>
              <h2 className="text-base font-semibold text-[#2E3D28] dark:text-[#E6E8EE] flex items-center gap-2">
                <Building2 size={18} className="text-[#485942] dark:text-[#A0A6B5]" />
                Organization Profile
              </h2>
              <p className="text-xs text-[#485942] dark:text-[#A0A6B5] mt-0.5">
                Primary identification and registration details for this organization entity.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] mb-1.5">
                Organization Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-primary/20 focus:border-zinc-900 dark:focus:border-primary transition-all text-zinc-900 dark:text-[#E6E8EE] font-medium"
                placeholder="e.g. Acme Corp Holdings"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] mb-1.5">
                Organization Code
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={orgCode}
                  readOnly
                  className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl text-[#2E3D28] dark:text-[#E6E8EE] font-mono font-semibold cursor-not-allowed select-all"
                />
                <span className="text-[11px] font-medium text-[#485942] dark:text-[#A0A6B5] whitespace-nowrap px-2 py-1 bg-zinc-100 dark:bg-[#222736] rounded-lg border border-zinc-200/60 dark:border-[#2A2F3D]">
                  Immutable
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 dark:text-[#A0A6B5] mt-1">
                Used in vanity URLs and multi-tenant domain routing.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] mb-1.5">
                Primary Organization Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2 text-sm bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-primary/20 focus:border-zinc-900 dark:focus:border-primary transition-all text-zinc-900 dark:text-[#E6E8EE]"
                  placeholder="billing@organization.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] mb-1.5">
                Organization UUID
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={orgId}
                  readOnly
                  className="w-full px-3.5 py-2 text-xs bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl text-[#485942] dark:text-[#A0A6B5] font-mono select-all truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] hover:bg-zinc-50 dark:hover:bg-[#222736] hover:border-zinc-300 dark:hover:border-zinc-600 rounded-xl text-[#2E3D28] dark:text-[#E6E8EE] transition-all shadow-2xs whitespace-nowrap active:scale-95"
                >
                  {copiedId ? (
                    <>
                      <Check size={13} className="text-emerald-600 dark:text-emerald-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={13} className="text-[#485942] dark:text-[#A0A6B5]" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Registered Companies Section ── */}
        <div className="bg-[#F7F7F0] dark:bg-[#161922] rounded-2xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D5D8CA] dark:border-[#2A2F3D] gap-2">
            <div>
              <h2 className="text-base font-semibold text-[#2E3D28] dark:text-[#E6E8EE] flex items-center gap-2">
                <Building2 size={18} className="text-[#485942] dark:text-[#A0A6B5]" />
                Registered Companies
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EDEEE4] dark:bg-[#1D212C] text-[#2E3D28] dark:text-[#E6E8EE] border border-[#D5D8CA] dark:border-[#2A2F3D]">
                  {registeredCompanies.length}
                </span>
              </h2>
              <p className="text-xs text-[#485942] dark:text-[#A0A6B5] mt-0.5">
                All active business companies and operating legal workspaces registered under {name}.
              </p>
            </div>
            <Link
              to="/owner/companies"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] bg-white dark:bg-[#161922] border border-[#D5D8CA] dark:border-[#2A2F3D] hover:bg-[#EDEEE4] dark:hover:bg-[#222736] rounded-xl transition-all shadow-2xs shrink-0 self-start sm:self-auto"
            >
              <span>Company Directory</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {registeredCompanies.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400 dark:text-[#6B7184] bg-white/50 dark:bg-[#1D212C]/40 rounded-xl border border-dashed border-[#D5D8CA] dark:border-[#2A2F3D] space-y-2">
              <Building2 size={24} className="mx-auto text-zinc-300 dark:text-[#4B5267]" />
              <p>No companies currently registered under this organization.</p>
              <Link
                to="/owner/companies"
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-[#2E3D28] hover:bg-[#3C4E34] rounded-lg shadow-2xs"
              >
                <span>Create Company</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#D5D8CA] dark:border-[#2A2F3D] bg-white dark:bg-[#161922]">
              <table className="w-full text-left text-xs min-w-[560px]">
                <thead className="bg-[#F7F7F0] dark:bg-[#1D212C] border-b border-[#D5D8CA] dark:border-[#2A2F3D] text-[10px] font-bold text-[#485942] dark:text-[#A0A6B5] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Company Name</th>
                    <th className="py-2.5 px-4">Code</th>
                    <th className="py-2.5 px-4">Currency</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D5D8CA] dark:divide-[#2A2F3D]">
                  {registeredCompanies.map((c) => (
                    <tr key={c.id || c.code} className="hover:bg-[#EDEEE4]/50 dark:hover:bg-[#222736]/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#2E3D28] dark:text-[#E6E8EE]">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-[#EDEEE4] dark:bg-[#1D212C] text-[#2E3D28] dark:text-[#A0A6B5] flex items-center justify-center shrink-0">
                            <Building2 size={13} />
                          </div>
                          <div>
                            <Link
                              to={`/company/${c.id}/dashboard`}
                              className="hover:underline text-[#2E3D28] dark:text-[#E6E8EE]"
                            >
                              {c.name || c.legalName || 'Company'}
                            </Link>
                            {c.legalName && c.legalName !== c.name && (
                              <div className="text-[10px] text-[#485942] dark:text-[#6B7184] font-normal">{c.legalName}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[11px] text-[#2E3D28] dark:text-[#E6E8EE]">
                        <span className="bg-[#EDEEE4] dark:bg-[#1D212C] px-1.5 py-0.5 rounded border border-[#D5D8CA] dark:border-transparent">
                          {c.code || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[#485942] dark:text-[#A0A6B5]">
                        {c.currency || currency || 'INR'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{c.status || 'Active'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <Link
                            to={`/company/${c.id}/dashboard`}
                            className="px-2.5 py-1 text-[11px] font-semibold text-[#2E3D28] dark:text-[#E6E8EE] bg-[#EDEEE4] dark:bg-[#1D212C] hover:bg-[#DCE2CF] dark:hover:bg-[#222736] rounded-md transition-colors"
                          >
                            Open
                          </Link>
                          <Link
                            to={`/owner/companies/${c.id}`}
                            className="px-2.5 py-1 text-[11px] font-semibold text-[#485942] dark:text-[#A0A6B5] hover:text-[#2E3D28] dark:hover:text-[#E6E8EE] rounded-md transition-colors"
                          >
                            Manage
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Organization Sign-in & Domain URL ── */}
        <div className="bg-[#F7F7F0] dark:bg-[#161922] rounded-2xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#D5D8CA] dark:border-[#2A2F3D]">
            <div>
              <h2 className="text-base font-semibold text-[#2E3D28] dark:text-[#E6E8EE] flex items-center gap-2">
                <Globe size={18} className="text-[#485942] dark:text-[#A0A6B5]" />
                Dedicated Organization Login Portal
              </h2>
              <p className="text-xs text-[#485942] dark:text-[#A0A6B5] mt-0.5">
                Share this dedicated URL with team members to sign in directly to your organization workspace.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3.5 bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200/80 dark:border-[#2A2F3D] rounded-xl">
            <span className="font-mono text-xs sm:text-sm text-zinc-800 dark:text-[#E6E8EE] select-all truncate flex-1">
              {loginUrl}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyLoginUrl}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] hover:bg-zinc-100 dark:hover:bg-[#222736] rounded-lg text-[#2E3D28] dark:text-[#E6E8EE] transition-all shadow-2xs active:scale-95"
              >
                {copiedUrl ? (
                  <>
                    <Check size={13} className="text-emerald-600 dark:text-emerald-400" />
                    Copied Link
                  </>
                ) : (
                  <>
                    <Copy size={13} className="text-[#485942] dark:text-[#A0A6B5]" />
                    Copy Link
                  </>
                )}
              </button>
              <a
                href={loginUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] hover:bg-zinc-100 dark:hover:bg-[#222736] rounded-lg text-[#2E3D28] dark:text-[#E6E8EE] transition-all shadow-2xs"
              >
                <ExternalLink size={13} className="text-[#485942] dark:text-[#A0A6B5]" />
                Preview
              </a>
            </div>
          </div>
        </div>

        {/* ── Regional & Fiscal Defaults ── */}
        <div className="bg-[#F7F7F0] dark:bg-[#161922] rounded-2xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#D5D8CA] dark:border-[#2A2F3D]">
            <div>
              <h2 className="text-base font-semibold text-[#2E3D28] dark:text-[#E6E8EE] flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-[#485942] dark:text-[#A0A6B5]" />
                Regional & Fiscal Defaults
              </h2>
              <p className="text-xs text-[#485942] dark:text-[#A0A6B5] mt-0.5">
                Default formatting and calendar preferences inherited by new companies and branches.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] mb-1.5">
                Default Operating Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-primary/20 focus:border-zinc-900 dark:focus:border-primary text-zinc-900 dark:text-[#E6E8EE] font-medium"
              >
                <option value="INR">INR — Indian Rupee (₹)</option>
                <option value="USD">USD — US Dollar ($)</option>
                <option value="EUR">EUR — Euro (€)</option>
                <option value="GBP">GBP — British Pound (£)</option>
                <option value="AED">AED — UAE Dirham</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] mb-1.5">
                Organization Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-primary/20 focus:border-zinc-900 dark:focus:border-primary text-zinc-900 dark:text-[#E6E8EE] font-medium"
              >
                <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST, UTC+05:30)</option>
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York (EST)">America/New_York (EST/EDT)</option>
                <option value="Europe/London (GMT)">Europe/London (GMT/BST)</option>
                <option value="Asia/Dubai (GST)">Asia/Dubai (GST, UTC+04:00)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] mb-1.5">
                Fiscal Year Start Month
              </label>
              <select
                value={fiscalYearStart}
                onChange={(e) => setFiscalYearStart(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-primary/20 focus:border-zinc-900 dark:focus:border-primary text-zinc-900 dark:text-[#E6E8EE] font-medium"
              >
                <option value="April">April (e.g. India standard: Apr 1 - Mar 31)</option>
                <option value="January">January (e.g. Calendar year: Jan 1 - Dec 31)</option>
                <option value="July">July (e.g. Australia / US fiscal)</option>
                <option value="October">October (e.g. Federal US)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] mb-1.5">
                Date Format
              </label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-primary/20 focus:border-zinc-900 dark:focus:border-primary text-zinc-900 dark:text-[#E6E8EE] font-medium"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (15/10/2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (10/15/2026)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (2026-10-15)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] mb-1.5">
                Time Format
              </label>
              <select
                value={timeFormat}
                onChange={(e) => setTimeFormat(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-primary/20 focus:border-zinc-900 dark:focus:border-primary text-zinc-900 dark:text-[#E6E8EE] font-medium"
              >
                <option value="12h">12-Hour (e.g. 02:45 PM)</option>
                <option value="24h">24-Hour (e.g. 14:45)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Security & Authentication Policies ── */}
        <div className="bg-[#F7F7F0] dark:bg-[#161922] rounded-2xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#D5D8CA] dark:border-[#2A2F3D]">
            <div>
              <h2 className="text-base font-semibold text-[#2E3D28] dark:text-[#E6E8EE] flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#485942] dark:text-[#A0A6B5]" />
                Organization Security & Compliance
              </h2>
              <p className="text-xs text-[#485942] dark:text-[#A0A6B5] mt-0.5">
                Enforce security baselines across all company workspaces in this organization.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-zinc-50/70 dark:bg-[#1D212C]/60 border border-zinc-200/70 dark:border-[#2A2F3D]">
              <div>
                <h3 className="text-sm font-semibold text-[#2E3D28] dark:text-[#E6E8EE]">
                  Enforce Multi-Factor Authentication (2FA)
                </h3>
                <p className="text-xs text-[#485942] dark:text-[#A0A6B5] mt-0.5">
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
                <div className="w-11 h-6 bg-zinc-200 dark:bg-[#2A2F3D] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 dark:after:border-zinc-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900 dark:peer-checked:bg-primary" />
              </label>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-50/70 dark:bg-[#1D212C]/60 border border-zinc-200/70 dark:border-[#2A2F3D]">
              <div>
                <h3 className="text-sm font-semibold text-[#2E3D28] dark:text-[#E6E8EE]">
                  Automatic Inactivity Session Timeout
                </h3>
                <p className="text-xs text-[#485942] dark:text-[#A0A6B5] mt-0.5">
                  Automatically sign out idle users after a specified duration of inactivity.
                </p>
              </div>
              <select
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="px-3.5 py-1.5 text-xs font-semibold bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-zinc-800 dark:text-[#E6E8EE] focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-primary/20 shrink-0"
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
          <div className="bg-[#F7F7F0] dark:bg-[#161922] rounded-2xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-xs p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#2E3D28] dark:text-[#E6E8EE] flex items-center gap-2">
                  <CreditCard size={16} className="text-[#485942] dark:text-[#A0A6B5]" />
                  Subscription Plan
                </h3>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  {subscriptionPlanName}
                </span>
              </div>
              <p className="text-xs text-[#485942] dark:text-[#A0A6B5] mb-4">
                Your organization plan governs multi-company provisioning, storage limits, and module access.
              </p>
              <div className="space-y-2 text-xs text-[#485942] dark:text-[#A0A6B5]">
                <div className="flex items-center justify-between py-1 border-b border-[#D5D8CA] dark:border-[#2A2F3D]">
                  <span>Active Companies</span>
                  <span className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">{companiesCount}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#D5D8CA] dark:border-[#2A2F3D]">
                  <span>Status</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
                    {isTrial ? 'Trial Period' : 'Active'}
                  </span>
                </div>
              </div>
            </div>
            <Link
              to="/subscription"
              className="mt-5 inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 text-xs font-semibold text-zinc-800 dark:text-[#E6E8EE] bg-zinc-100 dark:bg-[#1D212C] hover:bg-zinc-200 dark:hover:bg-[#222736] rounded-xl transition-all"
            >
              Manage Organization Subscription
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="bg-[#F7F7F0] dark:bg-[#161922] rounded-2xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-xs p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#2E3D28] dark:text-[#E6E8EE] flex items-center gap-2">
                  <Sparkles size={16} className="text-[#485942] dark:text-[#A0A6B5]" />
                  Entitled Modules
                </h3>
                <span className="text-xs font-bold text-zinc-700 dark:text-[#A0A6B5] bg-zinc-100 dark:bg-[#1D212C] px-2.5 py-0.5 rounded-full border border-zinc-200/60 dark:border-[#2A2F3D]">
                  {enabledModules.length > 0 ? `${enabledModules.length} Enabled` : 'All Standard'}
                </span>
              </div>
              <p className="text-xs text-[#485942] dark:text-[#A0A6B5] mb-4">
                Business applications activated for your organization's companies.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {enabledModules.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-zinc-50 dark:bg-[#1D212C] text-[#2E3D28] dark:text-[#E6E8EE] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg"
                  >
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    {m}
                  </span>
                ))}
              </div>
            </div>
            <Link
              to="/owner/companies"
              className="mt-5 inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 text-xs font-semibold text-zinc-800 dark:text-[#E6E8EE] bg-zinc-100 dark:bg-[#1D212C] hover:bg-zinc-200 dark:hover:bg-[#222736] rounded-xl transition-all"
            >
              Assign Modules to Companies
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
      );
}
