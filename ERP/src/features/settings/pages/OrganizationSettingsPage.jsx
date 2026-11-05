import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  RefreshCw,
  Menu,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import { selectAuthContext } from '../../../features/auth/authSlice';
import { addAlert } from '../../../features/notifications/notificationSlice';
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

import OrganizationSubSidebar, { ORG_NAV_ITEMS } from '../components/OrganizationSubSidebar';
import OrgOverviewView from '../components/organization/OrgOverviewView';
import OrgProfileView from '../components/organization/OrgProfileView';
import OrgCompaniesView from '../components/organization/OrgCompaniesView';
import OrgUsersView from '../components/organization/OrgUsersView';
import OrgSecurityView from '../components/organization/OrgSecurityView';
import OrgLoginPortalView from '../components/organization/OrgLoginPortalView';
import OrgNotificationsView from '../components/organization/OrgNotificationsView';
import OrgLocalizationView from '../components/organization/OrgLocalizationView';
import OrgAppearanceView from '../components/organization/OrgAppearanceView';

/**
 * OrganizationSettingsPage
 *
 * Enterprise Organization Management console featuring a dedicated VERTICAL SUB-SIDEBAR
 * with 9 distinct submenu sections:
 * 1. Overview
 * 2. Organization Profile
 * 3. Companies Management
 * 4. Users & Permissions
 * 5. Security & Authentication
 * 6. Organization Login Portal
 * 7. Notifications
 * 8. Localization & Formats
 * 9. Appearance & Themes
 */
export default function OrganizationSettingsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const authContext = useAppSelector(selectAuthContext);

  const {
    organization: authOrg,
    user: authUser,
    companies: authCompanies = [],
    subscription: authSubscription,
    modules: authModules = [],
  } = authContext || {};

  // Resolve base path (/settings/organization or /owner/settings)
  const basePath = useMemo(() => {
    return location.pathname.startsWith('/settings/organization')
      ? '/settings/organization'
      : '/owner/settings';
  }, [location.pathname]);

  // Resolve active section from URL params or pathname
  const activeSection = useMemo(() => {
    if (params.section) {
      const sec = params.section.toLowerCase();
      const match = ORG_NAV_ITEMS.find((item) => item.id === sec);
      if (match) return match.id;
    }

    const path = location.pathname;
    if (path.includes('/profile')) return 'profile';
    if (path.includes('/companies')) return 'companies';
    if (path.includes('/users')) return 'users';
    if (path.includes('/security')) return 'security';
    if (path.includes('/login-portal')) return 'login-portal';
    if (path.includes('/notifications')) return 'notifications';
    if (path.includes('/localization')) return 'localization';
    if (path.includes('/appearance')) return 'appearance';
    return 'overview';
  }, [params.section, location.pathname]);

  // Mobile drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

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
  const [subscriptionPlanName, setSubscriptionPlanName] = useState(
    authSubscription?.planCode || authSubscription?.planName || 'Standard Plan'
  );
  const [isTrial, setIsTrial] = useState(Boolean(authSubscription?.trialing));
  const [enabledModules, setEnabledModules] = useState([
    'Finance & Accounts',
    'Inventory',
    'Sales & CRM',
    'Purchasing',
    'Workflow Automation',
    'SSO Admin',
  ]);

  // Login Portal URL
  const [loginUrl, setLoginUrl] = useState(() => {
    const code = (authOrg?.code || '').toLowerCase();
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/erp/o/${code}/login`;
    }
    return `https://www.mark2.in/erp/o/${code}/login`;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // ───────────────────────────────────────────────────────────────────────────
  // Fetch Saved Settings Data
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

      // 5. Registered Companies
      if (results[4].status === 'fulfilled' && results[4].value) {
        const comps = results[4].value;
        let list = [];
        if (Array.isArray(comps)) {
          list = comps;
        } else if (Array.isArray(comps?.companies)) {
          list = comps.companies;
        } else if (Array.isArray(comps?.data)) {
          list = comps.data;
        } else if (Array.isArray(comps?.content)) {
          list = comps.content;
        }
          if (list.length > 0) {
            setRegisteredCompanies(list);
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
  console.warn('Organization settings load notice:', err?.message || err);
  setLoadError(err?.message || 'Failed to load organization settings.');
} finally {
  setIsLoading(false);
}
  }, []);

useEffect(() => {
  loadSettingsData();
}, [loadSettingsData]);

  // Navigate to another section
  const handleNavigateSection = (sectionId) => {
    const targetPath = sectionId === 'overview' ? basePath : `${basePath}/${sectionId}`;
    navigate(targetPath);
    setMobileDrawerOpen(false);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Save Handlers
  // ───────────────────────────────────────────────────────────────────────────

    const handleSaveProfile = async ({ name: newName, email: newEmail }) => {
      if (!newName || !newName.trim()) {
        dispatch(addAlert({ type: 'error', message: 'Organization name cannot be blank.' }));
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!newEmail || !emailRegex.test(newEmail.trim())) {
        dispatch(addAlert({ type: 'error', message: 'Please provide a valid organization email address.' }));
        return;
      }

        setIsSaving(true);
        try {
          await updateOrganizationProfile({
            name: newName.trim(),
            primaryEmail: newEmail.trim(),
          });
          setName(newName.trim());
          setContactEmail(newEmail.trim());
          dispatch(
            addAlert({
              type: 'success',
              message: 'Organization profile updated successfully.',
            })
          );
        } catch (err) {
          dispatch(
            addAlert({
              type: 'error',
              message: err?.response?.data?.message || err?.message || 'Failed to update organization profile.',
            })
          );
        } finally {
          setIsSaving(false);
        }
      };

        const handleSaveSecurity = async ({ twoFactorRequired: new2FA, sessionTimeout: newTimeout }) => {
          setIsSaving(true);
          try {
            await updateSecuritySettings({
              enforce2FA: new2FA,
              sessionTimeoutMinutes: parseInt(newTimeout, 10) || 60,
            });
            setTwoFactorRequired(new2FA);
            setSessionTimeout(newTimeout);
            dispatch(
              addAlert({
                type: 'success',
                message: 'Organization security policies updated successfully.',
              })
            );
          } catch (err) {
            dispatch(
              addAlert({
                type: 'error',
                message: err?.response?.data?.message || err?.message || 'Failed to update security policies.',
              })
            );
          } finally {
            setIsSaving(false);
          }
        };

        const handleSaveRegional = async (regionalPayload) => {
          setIsSaving(true);
          try {
            await updateRegionalSettings(regionalPayload);
            if (regionalPayload.currency) setCurrency(regionalPayload.currency);
            if (regionalPayload.timezone) setTimezone(regionalPayload.timezone);
            if (regionalPayload.fiscalYearStartMonth) setFiscalYearStart(regionalPayload.fiscalYearStartMonth);
            if (regionalPayload.dateFormat) setDateFormat(regionalPayload.dateFormat);
            if (regionalPayload.timeFormat) setTimeFormat(regionalPayload.timeFormat);
            dispatch(
              addAlert({
                type: 'success',
                message: 'Regional and fiscal defaults updated successfully.',
              })
            );
          } catch (err) {
            dispatch(
              addAlert({
                type: 'error',
                message: err?.response?.data?.message || err?.message || 'Failed to update regional settings.',
              })
            );
          } finally {
            setIsSaving(false);
          }
        };

        // Current active section label
        const activeSectionMeta = ORG_NAV_ITEMS.find((item) => item.id === activeSection) || ORG_NAV_ITEMS[0];

        // Organization summary object
        const orgSummary = useMemo(() => ({
          id: orgId || authOrg?.id,
          name,
          code: orgCode || authOrg?.code,
          email: contactEmail || authOrg?.email,
          primaryEmail: contactEmail,
          status,
          accessMode,
        }), [orgId, authOrg, name, orgCode, contactEmail, status, accessMode]);

        return (
            <div className="flex flex-col lg:flex-row min-h-screen w-full bg-[#E8E9DF] dark:bg-[#0F1117] text-zinc-900 dark:text-[#E6E8EE]">
              {/* ── Vertical Sub-Sidebar ── */}
              <OrganizationSubSidebar
                organization={orgSummary}
                activeSection={activeSection}
                onSelectSection={handleNavigateSection}
                mobileOpen={mobileDrawerOpen}
                onCloseMobile={() => setMobileDrawerOpen(false)}
                companiesCount={registeredCompanies.length}
              />

                  {/* ── Main Content Area ── */}
                  <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                    {/* Mobile Submenu Header */}
                    <div className="lg:hidden flex items-center justify-between p-4 bg-[#F7F7F0] dark:bg-[#161922] border-b border-[#D5D8CA] dark:border-[#2A2F3D] shrink-0">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setMobileDrawerOpen(true)}
                          className="p-2 rounded-xl bg-white dark:bg-[#1D212C] border border-[#D5D8CA] dark:border-[#2A2F3D] text-[#2E3D28] dark:text-[#E6E8EE] shadow-2xs"
                          aria-label="Open Organization Submenu"
                        >
                          <Menu size={18} />
                        </button>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#485942] dark:text-[#A0A6B5] block">
                            Organization Management
                          </span>
                          <span className="text-xs font-bold text-[#2E3D28] dark:text-[#E6E8EE] truncate block">
                            {activeSectionMeta.label}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={loadSettingsData}
                        disabled={isLoading}
                        className="p-2 rounded-xl bg-white dark:bg-[#1D212C] border border-[#D5D8CA] dark:border-[#2A2F3D] text-[#2E3D28] dark:text-[#E6E8EE]"
                        title="Refresh"
                      >
                        <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
                      </button>
                    </div>

                        {/* Global Breadcrumbs & Quick Bar */}
                        <div className="hidden lg:flex items-center justify-between px-6 py-3 bg-[#F7F7F0]/60 dark:bg-[#161922]/60 border-b border-[#D5D8CA] dark:border-[#2A2F3D] text-xs">
                          <div className="flex items-center gap-1.5 text-[#485942] dark:text-[#A0A6B5]">
                            <Link to="/owner/dashboard" className="hover:text-[#2E3D28] dark:hover:text-[#E6E8EE] font-medium">
                              Owner Dashboard
                            </Link>
                            <ChevronRight size={13} className="text-[#8B9382] dark:text-[#6B7184]" />
                            <Link to={basePath} className="hover:text-[#2E3D28] dark:hover:text-[#E6E8EE] font-medium">
                              Organization Management
                            </Link>
                            <ChevronRight size={13} className="text-[#8B9382] dark:text-[#6B7184]" />
                            <span className="text-[#2E3D28] dark:text-[#E6E8EE] font-bold">
                              {activeSectionMeta.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={loadSettingsData}
                              disabled={isLoading}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] bg-white dark:bg-[#1D212C] border border-[#D5D8CA] dark:border-[#2A2F3D] hover:bg-[#EDEEE4] dark:hover:bg-[#222736] rounded-lg transition-all shadow-2xs"
                            >
                              <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                              <span>Refresh</span>
                            </button>
                          </div>
                          </div>

                                {/* Section View Container */}
                                <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full min-w-0">
                                  {loadError && (
                                    <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between">
                                      <span>Failed to load fresh organization data: {loadError}</span>
                                      <button
                                        type="button"
                                        onClick={loadSettingsData}
                                        className="font-bold underline hover:text-amber-950 dark:hover:text-amber-100"
                                      >
                                        Retry
                                      </button>
                                    </div>
          )}

                                {/* 1. Overview */}
                                {activeSection === 'overview' && (
                                  <OrgOverviewView
                                    organization={orgSummary}
                                    user={authUser}
                                    companies={registeredCompanies}
                                    membersCount={registeredCompanies.length}
                                    planName={subscriptionPlanName}
                                    isTrial={isTrial}
                                    twoFactorRequired={twoFactorRequired}
                                    sessionTimeout={sessionTimeout}
                                    currency={currency}
                                    timezone={timezone}
                                    enabledModules={enabledModules}
                                    loginUrl={loginUrl}
                                    onNavigateSection={handleNavigateSection}
                                  />
                                )}

                                  {/* 2. Organization Profile */}
                                  {activeSection === 'profile' && (
                                    <OrgProfileView
                                      organization={orgSummary}
                                      initialName={name}
                                      initialEmail={contactEmail}
                                      onSaveProfile={handleSaveProfile}
                                      isSaving={isSaving}
                                    />
                                  )}

                                  {/* 3. Companies Management */}
                                  {activeSection === 'companies' && (
                                    <OrgCompaniesView
                                      companies={registeredCompanies}
                                      organization={orgSummary}
                                      maxCapacity={4}
                                    />
                                  )}

                                  {/* 4. Users & Permissions */}
                                  {activeSection === 'users' && (
                                    <OrgUsersView
                                      organization={orgSummary}
                                      companies={registeredCompanies}
                                    />
                                  )}

                                  {/* 5. Security & Authentication */}
                                  {activeSection === 'security' && (
                                    <OrgSecurityView
                                      initialTwoFactor={twoFactorRequired}
                                      initialTimeout={sessionTimeout}
                                      onSaveSecurity={handleSaveSecurity}
                                      isSaving={isSaving}
                                    />
                                  )}

                              {/* 6. Organization Login Portal */}
                              {activeSection === 'login-portal' && (
                                <OrgLoginPortalView
                                  organization={orgSummary}
                                  loginUrl={loginUrl}
                                />
                              )}

                                {/* 7. Notifications */}
                                {activeSection === 'notifications' && (
                                  <OrgNotificationsView
                                    organization={orgSummary}
                                  />
                                )}

                                  {/* 8. Localization & Formats */}
                                  {activeSection === 'localization' && (
                                    <OrgLocalizationView
                                      initialCurrency={currency}
                                      initialTimezone={timezone}
                                      initialFiscalYear={fiscalYearStart}
                                      initialDateFormat={dateFormat}
                                      initialTimeFormat={timeFormat}
                                      onSaveLocalization={handleSaveRegional}
                                      isSaving={isSaving}
                                    />
                                  )}

                                {/* 9. Appearance & Themes */}
                                {activeSection === 'appearance' && (
                                  <OrgAppearanceView
                                    organization={orgSummary}
                                  />
                                )}
                              </div>
                          </main>
                        </div>
                        );
}
