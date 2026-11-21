import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Key,
  Globe,
  Check,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  Lock,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sliders,
  Cable,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Info,
  Plus
} from 'lucide-react';
import PageHeader from '../../../components/common/PageHeader';
import { useRBAC } from '../../../utils/rbac';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../../features/notifications/notificationSlice';
import {
  useGetAdminIntegrationProvidersQuery,
  useUpdateAdminIntegrationProviderMutation,
} from '../../../api/sales-crm/crm.api';
import IntegrationProviderLogo from '../components/IntegrationProviderLogo';
import AddProviderModal from '../components/AddProviderModal';
import TenantFieldsBuilder, { getSmartDefaultTenantFields } from '../components/TenantFieldsBuilder';

const DEFAULT_REDIRECT_URI = 'https://www.mark2.in/api/crm/integrations/oauth/FACEBOOK/callback';
const DEFAULT_META_BASE_URL = 'https://graph.facebook.com/v19.0';

const PROVIDER_METAS = [
  {
    code: 'FACEBOOK',
    name: 'Meta / Facebook Lead Ads',
    authType: 'OAUTH2',
    tagline: 'Platform OAuth 2.0 Client Credentials & Webhooks',
    badge: 'OAuth 2.0',
    color: 'text-blue-600 dark:text-blue-400',
    bgBadge: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    description:
      'Global Meta App ID and App Secret used by all tenant organizations to ingest Facebook and Instagram Lead Ad forms.',
  },
  {
    code: 'INDIAMART',
    name: 'IndiaMART B2B Portal',
    authType: 'API_KEY',
    tagline: 'Buyer Inquiry Ingestion & CRM Push API',
    badge: 'API Key',
    color: 'text-teal-600 dark:text-teal-400',
    bgBadge: 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800',
    description:
      'Global endpoint and polling parameters for IndiaMART buyer RFQs and verified business leads.',
  },
  {
    code: 'TRADEINDIA',
    name: 'TradeIndia Marketplace',
    authType: 'WEBHOOK',
    tagline: 'TradeIndia RFQs & High-Intent Inquiries',
    badge: 'Webhook',
    color: 'text-amber-600 dark:text-amber-400',
    bgBadge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    description:
      'Platform webhook receiver parameters for TradeIndia push inquiries and catalog buy leads.',
  },
  {
    code: 'CUSTOM_WEBHOOK',
    name: 'Custom Generic Webhook',
    authType: 'WEBHOOK',
    tagline: 'Universal JSON Lead Ingestion',
    badge: 'Webhook',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgBadge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    description:
      'Universal incoming webhook listener for landing pages, Zapier, Make, and external microservices.',
  },
];

export default function GlobalIntegrationProvidersPage() {
  const { isSuperAdmin, isOwner, user } = useRBAC();
  const dispatch = useAppDispatch();

  // Strict Layer 1 SystemAdmin check
  const isSystemAdmin = useMemo(() => {
    if (isSuperAdmin) return true;
    const roles = Array.isArray(user?.roles) ? user.roles : [user?.role];
    return roles.some((r) => {
      const s = String(r?.name || r || '').toUpperCase();
      return s.includes('SYSTEM_ADMIN') || s.includes('SUPER_ADMIN');
    });
  }, [isSuperAdmin, user]);

  const { data: providersRes, isLoading, isFetching, refetch } = useGetAdminIntegrationProvidersQuery(undefined, {
    skip: !isSystemAdmin,
  });
  const [updateProvider, { isLoading: isUpdating }] = useUpdateAdminIntegrationProviderMutation();

  const providers = useMemo(() => {
    if (Array.isArray(providersRes)) return providersRes;
    if (Array.isArray(providersRes?.data)) return providersRes.data;
    return [];
  }, [providersRes]);

  const [activeCode, setActiveCode] = useState('FACEBOOK');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedRedirect, setCopiedRedirect] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    displayName: '',
    authType: 'OAUTH2',
    logoUrl: '',
    isEnabled: true,
    clientId: '',
    clientSecret: '',
    apiBaseUrl: '',
    redirectUri: '',
    authorizeUrl: '',
    tokenUrl: '',
    scopes: '',
    authHeaderTemplate: '',
    pullApiUrl: '',
    tenantFields: [],
  });

  const mergedProviderList = useMemo(() => {
    const list = [...PROVIDER_METAS];
    providers.forEach((p) => {
      const existing = list.find((m) => m.code === p.code);
      if (existing) {
        existing.logoUrl = p.logoUrl || p.globalConfig?.logoUrl;
      } else {
        list.push({
          code: p.code,
          name: p.displayName || p.code,
          authType: p.authType || 'WEBHOOK',
          logoUrl: p.logoUrl || p.globalConfig?.logoUrl,
          tagline: `${p.displayName || p.code} Ingestion Connector`,
          badge: p.authType || 'Custom',
          color: 'text-indigo-600 dark:text-indigo-400',
          bgBadge: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 border-indigo-200',
          description: `Custom ${p.authType} integration for ${p.displayName || p.code}.`,
        });
      }
    });
    return list;
  }, [providers]);

  const activeProvider = useMemo(() => {
    return providers.find((p) => p.code === activeCode) || null;
  }, [providers, activeCode]);

  const activeMeta = useMemo(() => {
    return mergedProviderList.find((m) => m.code === activeCode) || mergedProviderList[0];
  }, [activeCode, mergedProviderList]);

  const activeConfig = useMemo(() => {
    return activeProvider?.globalConfig || {};
  }, [activeProvider]);

  const hasSavedSecret = Boolean(
    activeConfig?.hasClientSecret ||
    (activeConfig?.clientSecret && String(activeConfig.clientSecret).includes('••••'))
  );

  // Sync form data when active provider or fetched providers change
  useEffect(() => {
    const currentAuthType = activeProvider?.authType || activeMeta?.authType || 'WEBHOOK';
    const initialFields =
      activeConfig?.tenantFields && Array.isArray(activeConfig.tenantFields) && activeConfig.tenantFields.length > 0
        ? activeConfig.tenantFields
        : getSmartDefaultTenantFields(currentAuthType, activeCode);

    if (activeProvider) {
      setFormData({
        displayName: activeProvider.displayName || activeMeta.name,
        authType: currentAuthType,
        logoUrl: activeProvider.logoUrl || activeConfig.logoUrl || '',
        isEnabled: activeProvider.isEnabled ?? true,
        clientId: activeConfig.clientId || '',
        clientSecret: '', // always empty on UI load for security
        apiBaseUrl: activeConfig.apiBaseUrl || (activeCode === 'FACEBOOK' ? DEFAULT_META_BASE_URL : ''),
        redirectUri: activeConfig.redirectUri || (activeCode === 'FACEBOOK' ? DEFAULT_REDIRECT_URI : ''),
        authorizeUrl: activeConfig.authorizeUrl || '',
        tokenUrl: activeConfig.tokenUrl || '',
        scopes: activeConfig.scopes || '',
        authHeaderTemplate: activeConfig.authHeaderTemplate || '',
        pullApiUrl: activeConfig.pullApiUrl || '',
        tenantFields: initialFields,
      });
      setShowSecret(false);
      setSuccessMsg(null);
      setErrorMsg(null);
    } else {
      // Default fallback if not yet seeded
      setFormData({
        displayName: activeMeta?.name || activeCode,
        authType: currentAuthType,
        logoUrl: activeMeta?.logoUrl || '',
        isEnabled: true,
        clientId: '',
        clientSecret: '',
        apiBaseUrl: activeCode === 'FACEBOOK' ? DEFAULT_META_BASE_URL : '',
        redirectUri: activeCode === 'FACEBOOK' ? DEFAULT_REDIRECT_URI : '',
        authorizeUrl: '',
        tokenUrl: '',
        scopes: '',
        authHeaderTemplate: '',
        pullApiUrl: '',
        tenantFields: initialFields,
      });
    }
  }, [activeCode, activeProvider, activeConfig, activeMeta]);

const handleCopyRedirect = () => {
  const uri = formData.redirectUri.trim() || DEFAULT_REDIRECT_URI;
  navigator.clipboard.writeText(uri);
  setCopiedRedirect(true);
  dispatch(
    addAlert({
      type: 'info',
      message: 'OAuth Redirect URI copied to clipboard!',
    })
  );
  setTimeout(() => setCopiedRedirect(false), 2200);
};

const handleSave = async (e) => {
  e.preventDefault();
  setSuccessMsg(null);
  setErrorMsg(null);

  try {
    const payload = {
      displayName: formData.displayName.trim(),
      authType: formData.authType,
      logoUrl: formData.logoUrl.trim() || null,
      isEnabled: Boolean(formData.isEnabled),
      globalConfig: {
        clientId: formData.clientId.trim(),
        clientSecret: formData.clientSecret.trim(), // if empty, backend preserves existing DB secret
        apiBaseUrl: formData.apiBaseUrl.trim(),
        redirectUri: formData.redirectUri.trim(),
        authorizeUrl: formData.authorizeUrl.trim(),
        tokenUrl: formData.tokenUrl.trim(),
        scopes: formData.scopes.trim(),
        authHeaderTemplate: formData.authHeaderTemplate.trim(),
        pullApiUrl: formData.pullApiUrl.trim(),
        tenantFields: formData.tenantFields,
        logoUrl: formData.logoUrl.trim() || null,
      },
    };

    await updateProvider({ code: activeCode, data: payload }).unwrap();

    const successText = `Global configuration for ${formData.displayName || activeCode} saved successfully.`;
    setSuccessMsg(successText);
    dispatch(
      addAlert({
        type: 'success',
        message: successText,
      })
    );
    // Clear password field after save
    setFormData((prev) => ({ ...prev, clientSecret: '' }));
    refetch();
  } catch (err) {
    const msg = err?.data?.message || err?.message || 'Failed to update global provider credentials.';
    setErrorMsg(msg);
    dispatch(
      addAlert({
        type: 'error',
        message: msg,
      })
    );
  }
};

// RBAC Barrier
if (!isSystemAdmin) {
  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117] p-8">
      <PageHeader
        title="Global Integration Providers"
        description="SystemAdmin Layer 1 Configuration"
      />
      <div className="mt-8 max-w-xl mx-auto p-6 rounded-2xl bg-white dark:bg-[#161922] border border-amber-200 dark:border-amber-900/50 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-zinc-900 dark:text-white">
          System Administrator Access Required
        </h2>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          This module manages platform-wide OAuth client credentials, secrets, and redirect URIs. Only users with the <span className="font-semibold text-zinc-900 dark:text-zinc-200">ROLE_SYSTEM_ADMIN</span> role are authorized to view or edit these settings.
        </p>
      </div>
    </div>
  );
}

return (
  <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117] overflow-hidden">
    <PageHeader
      title="Global Integration Providers"
      description="Layer 1: SystemAdmin configuration for OAuth credentials, API secrets, and marketplace webhooks"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5"
        >
          <Plus size={14} />
          <span>+ Add Provider</span>
        </button>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#1C202B] transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>
    </PageHeader>

    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Banner */}
      <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
          <Shield className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Platform-Wide 2-Tier Architecture</span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold">
              ROLE_SYSTEM_ADMIN
            </span>
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
            Configure OAuth Client ID, Client Secret, and Redirect URIs once here in the database (AES-256 encrypted at rest). Authorized tenant users will only see a clean 1-click &quot;Continue with Facebook&quot; authorization button and will never be exposed to raw API secrets.
          </p>
        </div>
      </div>

      {/* Channel Selection Cards / Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {
            mergedProviderList.map((item) => {
              const isSelected = item.code === activeCode;
              const provInDb = providers.find((p) => p.code === item.code);
              const isEnabledInDb = provInDb ? provInDb.isEnabled : true;

              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setActiveCode(item.code)}
                  className={`relative p-4 rounded-xl text-left border transition-all flex flex-col justify-between ${isSelected
                    ? 'border-indigo-500 bg-white dark:bg-[#161922] shadow-sm ring-2 ring-indigo-500/20'
                    : 'border-zinc-200 dark:border-[#2A2F3D] bg-white/70 dark:bg-[#161922]/70 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <IntegrationProviderLogo code={item.code} logoUrl={item.logoUrl} size="sm" />
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold ${isEnabledInDb
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-zinc-400 dark:text-zinc-500'
                          }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isEnabledInDb ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
                        {isEnabledInDb ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white line-clamp-1">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                      {item.tagline}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-[#202533] flex items-center justify-between text-[11px]">
                    <span className="font-mono text-[10px] text-zinc-400">{item.code}</span>
                    {isSelected && (
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">Active Tab</span>
                    )}
                  </div>
                </button>
              );
            })
          }
        </div>

      {/* Configuration Form Card */}
      <div className="bg-white dark:bg-[#161922] rounded-2xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-zinc-200 dark:border-[#2A2F3D] flex items-center justify-between bg-zinc-50/50 dark:bg-[#1C202B]/40">
          <div className="flex items-center gap-3">
            <IntegrationProviderLogo code={activeCode} logoUrl={formData.logoUrl} size="md" />
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <span>{activeMeta.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-[#202533] text-zinc-600 dark:text-zinc-400 font-normal">
                  {activeCode}
                </span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {activeMeta.description}
              </p>
            </div>
          </div>

          {/* Global Enable / Disable Toggle */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Provider Status:
            </span>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isEnabled: !formData.isEnabled })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.isEnabled ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.isEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
              />
            </button>
            <span className={`text-xs font-bold ${formData.isEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`}>
              {formData.isEnabled ? 'Enabled Globally' : 'Disabled'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} autoComplete="off" className="p-6 space-y-6">
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 flex items-center gap-2.5 text-rose-700 dark:text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {/* Provider Display Name & Logo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1.5">
                Display Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="e.g. Meta / Facebook Lead Ads"
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Name displayed to CRM users in the Integrations Catalog.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1.5">
                Authorization Type
              </label>
              <input
                type="text"
                value={formData.authType}
                disabled
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-100 dark:bg-[#1C202B] text-zinc-500 font-mono"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Protocol used by this integration channel (OAUTH2, API_KEY, WEBHOOK).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1.5">
                Brand Logo URL (Optional)
              </label>
              <div className="flex items-center gap-2">
                <IntegrationProviderLogo code={activeCode} logoUrl={formData.logoUrl} size="sm" className="shrink-0" />
                <input
                  type="url"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Custom brand icon URL saved to database.
              </p>
            </div>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* AUTH TYPE SPECIFIC SETTINGS                                 */}
          {/* ----------------------------------------------------------- */}

            {/* 1. OAUTH2 SPECIFIC SETTINGS */ }
              {formData.authType === 'OAUTH2' && (
            <div className="p-5 rounded-xl border border-blue-200/80 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/10 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-blue-200/60 dark:border-blue-900/40">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-300">
                  <Key className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>OAuth 2.0 Credentials &amp; Redirect Callback</span>
                </div>
                {hasSavedSecret && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <Lock className="w-3 h-3" />
                    Client Secret Active in Database (AES-256)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Client ID / App ID */}
                <div>
                  <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1.5">
                    Client ID / App ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="clientId"
                    autoComplete="off"
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    placeholder="e.g. 159283948192038"
                    required
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Client Secret / App Secret */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Client Secret
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-semibold"
                    >
                      {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showSecret ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      name="clientSecret"
                      autoComplete="new-password"
                      value={formData.clientSecret}
                      onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                      placeholder={
                        hasSavedSecret
                          ? '•••••••••••••••• (Leave blank to keep existing secret)'
                              : 'Enter Client Secret'
                          }
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    {hasSavedSecret
                      ? 'Leave blank to preserve the encrypted secret currently stored in database.'
                      : 'Required to perform server-to-server OAuth token exchanges.'}
                  </p>
                </div>
              </div>

              {/* OAuth Redirect URI */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1.5">
                  OAuth Redirect URI (Valid OAuth Redirect URI)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.redirectUri}
                    onChange={(e) => setFormData({ ...formData, redirectUri: e.target.value })}
                    placeholder={DEFAULT_REDIRECT_URI}
                    className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleCopyRedirect}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm shrink-0 active:scale-95"
                  >
                    {copiedRedirect ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedRedirect ? 'Copied!' : 'Copy URI'}</span>
                  </button>
                </div>
              </div>

                  {/* Authorize & Token URLs & Scopes */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1.5">
                        Authorize Dialog URL
                      </label>
                      <input
                        type="text"
                        value={formData.authorizeUrl}
                        onChange={(e) => setFormData({ ...formData, authorizeUrl: e.target.value })}
                        placeholder="https://www.facebook.com/v19.0/dialog/oauth"
                        className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1.5">
                        Token Exchange URL
                      </label>
                      <input
                        type="text"
                        value={formData.tokenUrl}
                        onChange={(e) => setFormData({ ...formData, tokenUrl: e.target.value })}
                        placeholder="https://graph.facebook.com/v19.0/oauth/access_token"
                        className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1.5">
                        OAuth Scopes
                      </label>
                      <input
                        type="text"
                        value={formData.scopes}
                        onChange={(e) => setFormData({ ...formData, scopes: e.target.value })}
                        placeholder="leads_retrieval,pages_show_list,..."
                        className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

                  {/* 2. API_KEY SPECIFIC SETTINGS */ }
              {formData.authType === 'API_KEY' && (
                  <div className="p-5 rounded-xl border border-teal-200/80 dark:border-teal-900/50 bg-teal-50/30 dark:bg-teal-950/10 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-teal-900 dark:text-teal-300 pb-3 border-b border-teal-200/60 dark:border-teal-900/40">
                      <Globe className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <span>API Key / REST Polling Configuration</span>
                    </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1.5">
                            API Base URL
                          </label>
                          <input
                            type="text"
                            value={formData.apiBaseUrl}
                            onChange={(e) => setFormData({ ...formData, apiBaseUrl: e.target.value })}
                            placeholder="https://mapi.indiamart.com/wservce/enquiry/listing/GLUSR_MOBILE_KEY/"
                            className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
                          />
                          <p className="text-[11px] text-zinc-500 mt-1">
                            Endpoint called by CRM background sync.
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1.5">
                            Auth Header / Path Template (Optional)
                          </label>
                          <input
                            type="text"
                            value={formData.authHeaderTemplate}
                            onChange={(e) => setFormData({ ...formData, authHeaderTemplate: e.target.value })}
                            placeholder="e.g. Bearer {apiKey} or /GLUSR_MOBILE_KEY/{crmKey}/"
                            className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
              )}

                      {/* 3. WEBHOOK SPECIFIC SETTINGS */ }
              {formData.authType === 'WEBHOOK' && (
                      <div className="p-5 rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/10 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300 pb-3 border-b border-amber-200/60 dark:border-amber-900/40">
                          <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>Webhook Receiver &amp; Pull API Settings</span>
                        </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                Webhook Listener Prefix
                              </label>
                              <input
                                type="text"
                                readOnly
                                value="https://www.mark2.in/api/crm/integrations/webhook/"
                                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-100 dark:bg-[#1C202B] text-zinc-500 cursor-not-allowed"
                              />
                              <p className="text-[11px] text-zinc-500 mt-1">
                                Each connecting client gets a unique slug under this path.
                              </p>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                Optional Pull API URL (e.g. TradeIndia Inquiry API)
                              </label>
                              <input
                                type="text"
                                value={formData.pullApiUrl}
                                onChange={(e) => setFormData({ ...formData, pullApiUrl: e.target.value })}
                                placeholder="https://www.tradeindia.com/utils/my_inquiry.html"
                                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
                              />
                              <p className="text-[11px] text-zinc-500 mt-1">
                                Endpoint used for scheduled/manual pull inquiries.
                              </p>
                            </div>
                          </div>
                        </div>
              )}

                        {/* ----------------------------------------------------------- */}
                        {/* TENANT FIELDS BUILDER (DYNAMIC FIELDS SCHEMA)               */}
                        {/* ----------------------------------------------------------- */}
                        <TenantFieldsBuilder
                          fields={formData.tenantFields || []}
                          onChange={(newFields) => setFormData((prev) => ({ ...prev, tenantFields: newFields }))}
                          authType={formData.authType}
                        />

                        {/* Actions */}
                        <div className="pt-4 border-t border-zinc-200 dark:border-[#2A2F3D] flex items-center justify-between">
                          <span className="text-[11px] text-zinc-500">
                            All changes apply immediately across all tenant workspaces.
                          </span>
                          <button
                            type="submit"
                            disabled={isUpdating}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover active:bg-primary text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50 active:scale-95"
                          >
                            {isUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>{isUpdating ? 'Saving Defaults...' : 'Save Configuration'}</span>
                          </button>
                        </div>
                      </form>
        </div>
      </div>

              <AddProviderModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={(newCode) => {
                  refetch();
                  setActiveCode(newCode);
                }}
              />
            </div>
          );
}
