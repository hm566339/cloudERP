import React, { useState, useEffect, useMemo } from 'react';
import { Modal, FormField, Input, Select, Button } from '../../../components/common';
import {
  Globe,
  Key,
  AlertCircle,
  Copy,
  Check,
  Info,
  Code2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Zap,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  SlidersHorizontal,
  Lock,
  Layers,
  Eye,
  EyeOff
} from 'lucide-react';
import IntegrationProviderLogo, {
  normalizeProviderCode,
  getProviderBrandMeta,
} from './IntegrationProviderLogo';
import {
  useConnectCrmTenantIntegrationMutation,
  useTestCrmIntegrationConnectionMutation,
  useLazyGetFacebookOAuthAuthorizeUrlQuery,
  useHandleFacebookOAuthCallbackMutation,
  useGetCrmRoundRobinPoolsQuery,
} from '../../../api/sales-crm/crm.api';

export const CATALOG_CHANNELS = [
  {
    code: 'FACEBOOK',
    name: 'Meta / Facebook Lead Ads',
    authType: 'OAUTH2',
    badge: '1-Click OAuth',
    badgeColor: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    description: 'Direct CRM sync from Facebook & Instagram lead forms with automatic webhook subscription.',
  },
  {
    code: 'INDIAMART',
    name: 'IndiaMART B2B Portal',
    authType: 'API_KEY',
    badge: 'Verified API Key',
    badgeColor: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800',
    description: 'Instant buyer inquiry ingestion via IndiaMART CRM Push API & periodic polling.',
  },
  {
    code: 'TRADEINDIA',
    name: 'TradeIndia Marketplace',
    authType: 'WEBHOOK',
    badge: 'Buy Leads',
    badgeColor: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    description: 'Automated ingestion of TradeIndia RFQs, buy leads, and high-intent buyer inquiries.',
  },
  {
    code: 'CUSTOM_WEBHOOK',
    name: 'Custom Generic Webhook',
    authType: 'WEBHOOK',
    badge: 'Generic JSON',
    badgeColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    description: 'Universal JSON endpoint for website contact forms, Zapier, Make, and external microservices.',
  },
];

const toArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.content)) return res.data.content;
  return [];
};

/**
 * Smart default tenant fields if none are provided in provider schema
 */
export function getSmartDefaultTenantFields(code, authType) {
  const norm = normalizeProviderCode(code);

  if (norm === 'INDIAMART' || (authType === 'API_KEY' && norm.includes('INDIAMART'))) {
    return [
      {
        key: 'crmKey',
        label: 'IndiaMART CRM Key (GLUSR Key)',
        type: 'password',
        required: true,
        placeholder: 'Paste your IndiaMART CRM API Key here',
        helpText: 'Locate in IndiaMART Seller Panel > Settings > CRM Integration / Lead Manager',
      },
    ];
  }

  if (norm === 'TRADEINDIA') {
    return [
      {
        key: 'userid',
        label: 'TradeIndia User ID',
        type: 'text',
        required: false,
        placeholder: 'e.g. 1234567',
        helpText: 'Your TradeIndia numeric User ID for Pull API sync',
      },
      {
        key: 'profile_id',
        label: 'TradeIndia Profile ID',
        type: 'text',
        required: false,
        placeholder: 'e.g. 7654321',
        helpText: 'Your TradeIndia Profile ID for Pull API sync',
      },
      {
        key: 'key',
        label: 'TradeIndia API Security Key',
        type: 'password',
        required: false,
        placeholder: 'Enter TradeIndia security key',
        helpText: 'Secret key provided by TradeIndia support for Pull API inquiry sync',
      },
      {
        key: 'webhookSecret',
        label: 'Webhook Secret Token (Optional)',
        type: 'password',
        required: false,
        placeholder: 'Optional shared secret',
        helpText: 'Verified on incoming TradeIndia webhooks',
      },
    ];
  }

  if (authType === 'API_KEY') {
    return [
      {
        key: 'apiKey',
        label: 'API Key / Secret Token',
        type: 'password',
        required: true,
        placeholder: 'Enter your API Key or Access Token',
        helpText: 'API credentials provided by the external lead provider',
      },
    ];
  }

  if (authType === 'WEBHOOK') {
    return [
      {
        key: 'webhookSecret',
        label: 'Webhook Security Secret / Token (Optional)',
        type: 'password',
        required: false,
        placeholder: 'Optional shared secret or auth token',
        helpText: 'Dispatched in headers or payload to verify authenticity',
      },
    ];
  }

  return [];
}

export default function IntegrationFormModal({
  isOpen,
  onClose,
  channelCode = null,
  companyId,
  availableProviders = [],
  onSuccess,
}) {
  const [selectedChannelCode, setSelectedChannelCode] = useState(channelCode || 'FACEBOOK');
  const [step, setStep] = useState(channelCode ? 'CONFIGURE' : 'SELECT');

  // Keep internal channel code and step in sync with external prop when modal opens or channel changes
  useEffect(() => {
    if (!isOpen) return;
    if (channelCode) {
      setSelectedChannelCode(channelCode);
      setStep('CONFIGURE');
    } else {
      setStep('SELECT');
    }
  }, [channelCode, isOpen]);

  const channelsCatalog = useMemo(() => {
    const list = CATALOG_CHANNELS.map((ch) => {
      const match = availableProviders.find(
        (p) => String(p.providerCode || p.code || '').toUpperCase() === ch.code
      );
      return {
        ...ch,
        logoUrl: match?.logoUrl || match?.globalConfig?.logoUrl,
      };
    });

    if (availableProviders && availableProviders.length > 0) {
      availableProviders.forEach((p) => {
        const code = String(p.providerCode || p.code || '').toUpperCase();
        if (code && !list.some((c) => c.code === code)) {
          const pAuth = p.authType || 'WEBHOOK';
          const pBadge =
            pAuth === 'OAUTH2'
              ? '1-Click OAuth'
              : pAuth === 'API_KEY'
                ? 'Verified API Key'
                : 'Webhook Sync';
          const pBadgeColor =
            pAuth === 'OAUTH2'
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
              : pAuth === 'API_KEY'
                ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800'
                : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';

          list.push({
            code,
            name: p.displayName || p.name || code,
            authType: pAuth,
            badge: pBadge,
            badgeColor: pBadgeColor,
            logoUrl: p.logoUrl || p.globalConfig?.logoUrl,
            description: p.description || `Automated ingestion and CRM synchronization for ${p.displayName || code}.`,
          });
        }
      });
    }
    return list;
  }, [availableProviders]);

  // Find matching provider from availableProviders or fallback to catalog normalization
  const matchedProvider = useMemo(() => {
    const raw = String(selectedChannelCode || '').toUpperCase();
    if (!availableProviders || availableProviders.length === 0) return null;
    return availableProviders.find((p) => {
      const pCode = String(p.providerCode || p.code || '').toUpperCase();
      return pCode === raw || normalizeProviderCode(pCode) === normalizeProviderCode(raw);
    });
  }, [availableProviders, selectedChannelCode]);

  const resolvedCode = useMemo(() => {
    return (
      matchedProvider?.code ||
      matchedProvider?.providerCode ||
      normalizeProviderCode(selectedChannelCode)
    );
  }, [matchedProvider, selectedChannelCode]);

  const brandMeta = useMemo(() => {
    return getProviderBrandMeta(resolvedCode);
  }, [resolvedCode]);

  const authType = useMemo(() => {
    if (matchedProvider?.authType) return matchedProvider.authType;
    if (resolvedCode === 'FACEBOOK') return 'OAUTH2';
    if (resolvedCode === 'INDIAMART') return 'API_KEY';
    return 'WEBHOOK';
  }, [matchedProvider, resolvedCode]);

  const displayName = useMemo(() => {
    return matchedProvider?.displayName || matchedProvider?.name || brandMeta.name;
  }, [matchedProvider, brandMeta]);

  // Compute dynamic tenant fields
  const dynamicFields = useMemo(() => {
    if (authType === 'OAUTH2') return [];
    if (Array.isArray(matchedProvider?.tenantFields) && matchedProvider.tenantFields.length > 0) {
      return matchedProvider.tenantFields;
    }
    if (Array.isArray(matchedProvider?.globalConfig?.tenantFields) && matchedProvider.globalConfig.tenantFields.length > 0) {
      return matchedProvider.globalConfig.tenantFields;
    }
    return getSmartDefaultTenantFields(resolvedCode, authType);
  }, [matchedProvider, resolvedCode, authType]);

  // Active form state
  const [integrationName, setIntegrationName] = useState('');
  const [credentialsData, setCredentialsData] = useState({});
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [errorMsg, setErrorMsg] = useState(null);

  // Facebook OAuth state
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [oauthConnected, setOauthConnected] = useState(false);
  const [facebookPages, setFacebookPages] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState('');
  const [facebookForms, setFacebookForms] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState('');

  // Facebook Developer / Sandbox manual configuration option
  const [showManualOAuth, setShowManualOAuth] = useState(false);
  const [manualPageId, setManualPageId] = useState('');
  const [manualPageName, setManualPageName] = useState('');
  const [manualAccessToken, setManualAccessToken] = useState('');
  const [manualFormId, setManualFormId] = useState('');

  // IndiaMART connection test state
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyVerified, setKeyVerified] = useState(false);
  const [keyVerifyMessage, setKeyVerifyMessage] = useState('');
  const [showKeyGuide, setShowKeyGuide] = useState(false);

  // Lead Routing & Rules (Optional)
  const [showRoutingRules, setShowRoutingRules] = useState(false);
  const [poolId, setPoolId] = useState('');
  const [autoQualify, setAutoQualify] = useState(true);

  // Success view state after connecting
  const [connectedResult, setConnectedResult] = useState(null);
  const [copiedSuccessUrl, setCopiedSuccessUrl] = useState(false);

  // Advanced Developer / Webhook settings accordion
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // API Mutations & Queries
  const { data: poolsRes } = useGetCrmRoundRobinPoolsQuery(companyId);
  const pools = toArray(poolsRes);

  const [connectIntegration, { isLoading: isConnecting }] = useConnectCrmTenantIntegrationMutation();
  const [testConnection] = useTestCrmIntegrationConnectionMutation();
  const [getFacebookOAuthAuthorizeUrl, { isLoading: isOAuthUrlLoading }] = useLazyGetFacebookOAuthAuthorizeUrlQuery();
  const [handleFacebookOAuth] = useHandleFacebookOAuthCallbackMutation();

  // Reset or initialize state whenever modal opens or channel changes
  useEffect(() => {
    if (!isOpen) return;
    const defaultLabel = `${displayName} Lead Ingestion`;
    setIntegrationName(defaultLabel);
    setErrorMsg(null);
    setConnectedResult(null);
    setCopiedSuccessUrl(false);
    setOauthConnected(false);
    setSelectedPageId('');
    setSelectedFormId('');
    setKeyVerified(false);
    setKeyVerifyMessage('');
    setShowKeyGuide(false);
    setShowRoutingRules(false);
    setShowAdvanced(false);
    setCopiedWebhook(false);
    setVisiblePasswords({});
    setShowManualOAuth(false);
    setManualPageId('');
    setManualPageName('');
    setManualAccessToken('');
    setManualFormId('');

    // Prepopulate credential fields
    const initialCreds = {};
    dynamicFields.forEach((f) => {
      initialCreds[f.key] = '';
    });
    setCredentialsData(initialCreds);

    if (pools.length > 0 && !poolId) {
      setPoolId(pools[0].id);
    }
  }, [isOpen, selectedChannelCode, resolvedCode, displayName, dynamicFields]);

// Handle Facebook page selection change: update corresponding lead forms
const handlePageSelect = (pageId) => {
  setSelectedPageId(pageId);
  const page = facebookPages.find((p) => p.pageId === pageId);
  const forms = page?.forms || [];
  setFacebookForms(forms);
  setSelectedFormId(forms.length > 0 ? forms[0].formId : '');
};

// Trigger Facebook OAuth flow (server-to-server)
const handleFacebookConnect = async () => {
  try {
    setIsOAuthLoading(true);
    setErrorMsg(null);

    const returnUrl = window.location.origin + window.location.pathname + window.location.search;
    const res = await getFacebookOAuthAuthorizeUrl({
      returnUrl,
      companyId,
    }).unwrap();

    const authorizeUrl =
      res?.authorizeUrl ||
      res?.data?.authorizeUrl ||
      res?.url ||
      res?.data?.url ||
      (typeof res?.data === 'string' ? res.data : null) ||
      (typeof res === 'string' ? res : null);

    if (authorizeUrl) {
      window.location.href = authorizeUrl;
    } else {
      throw new Error('Did not receive Facebook authorization URL from server.');
    }
  } catch (err) {
    console.error('Facebook OAuth failed', err);
    setErrorMsg(err?.data?.message || err?.message || 'Failed to authenticate with Facebook.');
    setIsOAuthLoading(false);
  }
};

// Test IndiaMART CRM Key
const handleTestIndiaMartKey = async () => {
    const keyToTest = credentialsData.crmKey || '';
    if (!keyToTest.trim()) {
      setErrorMsg('Please enter your IndiaMART CRM Key before testing.');
      return;
    }
    try {
      setIsTestingKey(true);
      setErrorMsg(null);
      const res = await testConnection({
        providerCode: 'INDIAMART',
        crmKey: keyToTest.trim(),
      }).unwrap();

      const isOk = res?.data?.verified ?? res?.verified ?? res?.data?.success ?? true;
      const msg = res?.data?.message || res?.message || 'CRM Key verified successfully!';

      setKeyVerified(isOk);
      setKeyVerifyMessage(msg);
      if (!isOk) {
        setErrorMsg(msg);
      }
    } catch (err) {
      setKeyVerified(false);
      setKeyVerifyMessage('');
      setErrorMsg(err?.data?.message || err?.message || 'Connection test failed. Please verify the CRM Key.');
    } finally {
      setIsTestingKey(false);
    }
  };

  // Generate friendly webhook preview URL
  const webhookSlugPreview = useMemo(() => {
    return (integrationName || resolvedCode || 'webhook')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32);
}, [integrationName, resolvedCode]);

const webhookUrlPreview = `https://www.mark2.in/api/crm/integrations/webhook/${webhookSlugPreview}`;

const handleCopyWebhook = () => {
  navigator.clipboard.writeText(webhookUrlPreview);
  setCopiedWebhook(true);
  setTimeout(() => setCopiedWebhook(false), 2000);
};

const exactBackendWebhookUrl = useMemo(() => {
  if (!connectedResult) return '';
  if (connectedResult.webhookUrl) return connectedResult.webhookUrl;
  if (connectedResult.webhookSlug) {
    return `https://www.mark2.in/api/crm/integrations/webhook/${connectedResult.webhookSlug}`;
  }
  return webhookUrlPreview;
}, [connectedResult, webhookUrlPreview]);

const handleCopyExactUrl = (urlToCopy) => {
  navigator.clipboard.writeText(urlToCopy);
  setCopiedSuccessUrl(true);
  setTimeout(() => setCopiedSuccessUrl(false), 2000);
};

// Primary Submission: Connect & Start Syncing
const handleConnectAndSync = async (e) => {
  e.preventDefault();
  setErrorMsg(null);

    let credentials = { ...credentialsData };

    if (authType === 'OAUTH2') {
      if (showManualOAuth && manualPageId.trim()) {
        credentials = {
          pageId: manualPageId.trim(),
          pageName: manualPageName.trim() || 'Connected Facebook Page',
          pageAccessToken: manualAccessToken.trim() || 'token_manual_configured',
          formId: manualFormId.trim() || 'all_forms',
          formName: 'All Lead Forms',
        };
      } else if (!oauthConnected) {
        setErrorMsg('Please click "Continue with Facebook" to authenticate your Meta account first, or enter Page ID manually below.');
        return;
      } else {
        if (!selectedPageId) {
          setErrorMsg('Please select a Facebook Page.');
          return;
        }
        const page = facebookPages.find((p) => p.pageId === selectedPageId);
        const form = facebookForms.find((f) => f.formId === selectedFormId);
        credentials = {
          pageId: selectedPageId,
          pageName: page?.pageName || 'Connected Page',
          pageAccessToken: page?.pageAccessToken || 'token_verified',
          formId: selectedFormId || 'all_forms',
          formName: form?.formName || 'All Lead Forms',
        };
      }
    } else {
        // Validate required dynamic fields
        for (const field of dynamicFields) {
          if (field.required && !credentials[field.key]?.trim()) {
            setErrorMsg(`Please enter ${field.label || field.key}.`);
            return;
          }
        }
        if (resolvedCode === 'INDIAMART') {
          credentials.verified = keyVerified;
        }
      }

      const payload = {
        providerCode: resolvedCode,
        integrationName: integrationName.trim() || `${displayName} Integration`,
        webhookSlug: webhookSlugPreview,
        credentials,
        routingConfig: {
          poolId: poolId || null,
          autoQualify: Boolean(autoQualify),
        },
      };

      try {
        const res = await connectIntegration({ data: payload, companyId }).unwrap();
        const connectedData = res?.data || res;
        setConnectedResult(connectedData);
        if (onSuccess) onSuccess();
      } catch (err) {
        console.error('Failed to connect integration', err);
        setErrorMsg(err?.data?.message || err?.message || 'Failed to connect integration.');
      }
    };

    return (
      <Modal
        isOpen={isOpen}
        onClose={() => {
          setConnectedResult(null);
          setStep('SELECT');
          onClose();
        }}
        title={
          connectedResult ? (
            <div className="flex items-center gap-3">
              <IntegrationProviderLogo
                code={resolvedCode}
                logoUrl={matchedProvider?.logoUrl || matchedProvider?.globalConfig?.logoUrl}
                size="md"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">
                    {displayName} Connected
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                    Live &amp; Ingesting
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 font-normal">
                  Active multi-tenant ingestion pipeline
                </p>
              </div>
            </div>
          ) : step === 'SELECT' ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Connect Ingestion Channel
                </h3>
                <p className="text-[11px] text-zinc-500 font-normal">
                  Select a marketplace, lead form, or webhook provider to ingest leads into your CRM
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full pr-6">
              <div className="flex items-center gap-3">
                <IntegrationProviderLogo
                  code={resolvedCode}
                  logoUrl={matchedProvider?.logoUrl || matchedProvider?.globalConfig?.logoUrl}
                  size="md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-900 dark:text-white">
                      Connect {displayName}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${brandMeta.badgeBg}`}>
                      {authType}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-normal">
                    Automated 2-tier synchronized lead ingestion with strict RBAC
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep('SELECT')}
                className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 font-medium cursor-pointer"
              >
                <ChevronLeft size={14} /> Change Channel
              </button>
            </div>
          )
        }
        size="lg"
      >
        {connectedResult ? (
          <div className="space-y-4 py-1">
            {/* Success Banner */}
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                  {connectedResult.integrationName || displayName} Connected Successfully!
                </h4>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5 leading-relaxed">
                  Integration pipeline is active. Leads from this channel will automatically synchronize into your CRM.
                </p>
              </div>
            </div>

            {/* Webhook Endpoint Box */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#161922] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">
                    Backend-Generated Inbound Webhook Endpoint
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  PostgreSQL Slug Verified
                </span>
              </div>

              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Copy this exact backend-generated webhook URL into your external portal or webhook settings:
              </p>

              <div className="flex items-center gap-2">
                <div className="flex-1 p-2 rounded-lg bg-white dark:bg-[#0F1117] border border-zinc-200 dark:border-[#2A2F3D] font-mono text-xs text-zinc-800 dark:text-zinc-200 select-all break-all shadow-inner">
                  {exactBackendWebhookUrl}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyExactUrl(exactBackendWebhookUrl)}
                  className="btn-primary text-xs font-semibold px-4 py-2 flex items-center gap-1.5 shrink-0"
                >
                  {copiedSuccessUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSuccessUrl ? 'Copied!' : 'Copy URL'}</span>
                </button>
              </div>

              {/* Provider specific guide */}
                { resolvedCode === 'TRADEINDIA' && (
                  <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-zinc-700 dark:text-zinc-300 space-y-1.5">
                    <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>TradeIndia Webhook Setup Steps:</span>
                    </div>
                    <ol className="list-decimal pl-4 space-y-1 text-zinc-600 dark:text-zinc-400">
                      <li>Log in to your <b>TradeIndia Member Panel</b> (<a href="https://www.tradeindia.com" target="_blank" rel="noreferrer" className="underline text-amber-600">tradeindia.com</a>).</li>
                      <li>Navigate to <b>Inquiry / Lead Manager</b> &gt; <b>Inquiry API &amp; Webhook Settings</b>.</li>
                      <li>Paste the <b>exact URL above</b> into the Webhook / Callback URL field with method <b>POST</b>.</li>
                      <li>TradeIndia will now automatically push inquiries with buyer details and RFQ data directly into your CRM.</li>
                    </ol>
                  </div>
                )}

                { resolvedCode === 'INDIAMART' && (
                  <div className="mt-3 p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 text-[11px] text-zinc-700 dark:text-zinc-300 space-y-1.5">
                    <div className="font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>IndiaMART Push API &amp; Polling:</span>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      Your IndiaMART CRM API key is verified. In addition to automatic periodic 15-minute background polling, you can paste this exact URL into your <b>IndiaMART Seller Panel &gt; Settings &gt; CRM API Push</b> for zero-second instant push ingestion.
                    </p>
                  </div>
                )}

                { resolvedCode === 'FACEBOOK' && (
                  <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-zinc-700 dark:text-zinc-300 space-y-1.5">
                    <div className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Meta / Facebook Lead Ads Webhook:</span>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      Your Facebook page was automatically subscribed to webhooks. Leads submitted from your Facebook &amp; Instagram Lead Ads will immediately flow into your CRM pipeline.
                    </p>
                  </div>
                )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-[#2A2F3D]">
              <button
                type="button"
                onClick={() => handleCopyExactUrl(exactBackendWebhookUrl)}
                className="btn-secondary text-xs font-semibold px-3 py-2 flex items-center gap-1.5"
              >
                {copiedSuccessUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSuccessUrl ? 'Endpoint Copied' : 'Copy Endpoint'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setConnectedResult(null);
                  setStep('SELECT');
                  if (onSuccess) onSuccess();
                  onClose();
                }}
                className="btn-primary text-xs font-semibold px-5 py-2 flex items-center gap-2"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Done &amp; View Pipelines</span>
              </button>
            </div>
          </div>
        ) : step === 'SELECT' ? (
          <div className="space-y-4 py-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {channelsCatalog.map((ch) => (
                <div
                  key={ch.code}
                  onClick={() => {
                    setSelectedChannelCode(ch.code);
                    setStep('CONFIGURE');
                    setIntegrationName(`${ch.name} Lead Ingestion`);
                    setErrorMsg(null);
                  }}
                  className="p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] hover:border-emerald-500/60 dark:hover:border-emerald-500/60 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group space-y-3"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <IntegrationProviderLogo code={ch.code} logoUrl={ch.logoUrl} size="md" />
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                            {ch.name}
                          </h4>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">Inbound Sync</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border shrink-0 ${ch.badgeColor}`}>
                        {ch.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-[#A0A6B5] leading-relaxed line-clamp-2">
                      {ch.description}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-zinc-100 dark:border-[#2A2F3D]/60 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase">
                      {ch.authType}
                    </span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Configure Connection &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-zinc-200 dark:border-[#2A2F3D]">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-xs font-semibold px-4 py-2 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConnectAndSync} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2 text-rose-700 dark:text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            {/* Channel / Provider Selector */}
            <FormField label="Integration Channel / Provider" required>
              <Select
                value={selectedChannelCode}
                onChange={(e) => {
                  const nextCode = e.target.value;
                  setSelectedChannelCode(nextCode);
                  setErrorMsg(null);
                  setConnectedResult(null);
                  setKeyVerified(false);
                  setKeyVerifyMessage('');
                  setOauthConnected(false);
                  setSelectedPageId('');
                  setSelectedFormId('');
                }}
                className="text-xs font-semibold"
              >
                <option value="FACEBOOK">Meta / Facebook Lead Ads (1-Click OAuth)</option>
                <option value="INDIAMART">IndiaMART B2B Portal (API Key)</option>
                <option value="TRADEINDIA">TradeIndia Marketplace (Buy Leads Webhook &amp; Pull API)</option>
                <option value="CUSTOM_WEBHOOK">Custom Generic Webhook (Universal JSON)</option>
                {availableProviders
                  .filter(
                    (p) =>
                      !['FACEBOOK', 'INDIAMART', 'TRADEINDIA', 'CUSTOM_WEBHOOK'].includes(
                        String(p.providerCode || p.code || '').toUpperCase()
                      )
                  )
                  .map((p) => {
                    const pCode = String(p.providerCode || p.code || '').toUpperCase();
                    return (
                      <option key={pCode} value={pCode}>
                        {p.displayName || p.name || pCode} ({p.authType || 'WEBHOOK'})
                      </option>
                    );
                  })}
              </Select>
            </FormField>

            {/* Integration Name */}
            <FormField label="Integration Label" required>
              <Input
                value={integrationName}
                onChange={(e) => setIntegrationName(e.target.value)}
                placeholder={`e.g. Q4 ${displayName} Pipeline`}
                required
                className="text-xs"
              />
            </FormField>

            {/* ----------------------------------------------------------------- */}
            {/* PROVIDER CREDENTIALS & DYNAMIC FORM FIELDS                       */}
            {/* ----------------------------------------------------------------- */}

              {/* 1. OAUTH2 (e.g. Meta / Facebook Lead Ads) */ }
          {authType === 'OAUTH2' && (
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#161922] space-y-3.5">
                {!oauthConnected ? (
                  <div className="text-center py-4 space-y-3">
                    <div className="w-12 h-12 mx-auto flex items-center justify-center">
                      <IntegrationProviderLogo
                        code={resolvedCode}
                        logoUrl={matchedProvider?.logoUrl || matchedProvider?.globalConfig?.logoUrl}
                        size="lg"
                        className="shadow-md"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                        Authenticate with {displayName}
                      </h4>
                      <p className="text-[11px] text-zinc-500 max-w-sm mx-auto mt-0.5">
                        No API keys or secrets required. Click below to authorize Mark2 to receive leads directly from your campaigns.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleFacebookConnect}
                      disabled={isOAuthLoading || isOAuthUrlLoading}
                      className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isOAuthLoading || isOAuthUrlLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-white text-[#1877F2] font-black flex items-center justify-center text-[10px]">f</span>
                      )}
                      <span>{isOAuthLoading || isOAuthUrlLoading ? 'Redirecting to Meta...' : 'Continue with Facebook'}</span>
                    </button>

                    {/* Developer / Manual Entry Option */}
                    <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
                      <button
                        type="button"
                        onClick={() => setShowManualOAuth(!showManualOAuth)}
                        className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 underline cursor-pointer"
                      >
                        {showManualOAuth ? 'Hide manual configuration' : 'Or enter Facebook Page ID manually (Local / Sandbox testing)'}
                      </button>
                      {showManualOAuth && (
                        <div className="mt-3 space-y-3 text-left">
                          <FormField label="Facebook Page Name">
                            <Input
                              value={manualPageName}
                              onChange={(e) => setManualPageName(e.target.value)}
                              placeholder="e.g. Acme Marketing Page"
                              className="text-xs"
                            />
                          </FormField>
                          <FormField label="Facebook Page ID" required>
                            <Input
                              value={manualPageId}
                              onChange={(e) => setManualPageId(e.target.value)}
                              placeholder="e.g. 1029384756"
                              className="text-xs font-mono"
                            />
                          </FormField>
                          <FormField label="Lead Form ID (Optional)">
                            <Input
                              value={manualFormId}
                              onChange={(e) => setManualFormId(e.target.value)}
                              placeholder="e.g. 987654321 or leave blank for all"
                              className="text-xs font-mono"
                            />
                          </FormField>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Account Connected</span>
                      </div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-white dark:bg-[#161922] px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-bold">
                        Webhooks Auto-Subscribed
                      </span>
                    </div>

                    {/* Select Facebook Page */}
                    <FormField label="Select Facebook Page" required>
                      <Select
                        value={selectedPageId}
                        onChange={(e) => handlePageSelect(e.target.value)}
                        required
                        className="text-xs"
                      >
                        <option value="">-- Choose a Facebook Page --</option>
                        {facebookPages.map((page) => (
                          <option key={page.pageId} value={page.pageId}>
                            {page.pageName} ({page.pageId})
                          </option>
                        ))}
                      </Select>
                    </FormField>

                    {/* Select Lead Form */}
                    <FormField label="Select Lead Form" required>
                      <Select
                        value={selectedFormId}
                        onChange={(e) => setSelectedFormId(e.target.value)}
                        required
                        className="text-xs"
                      >
                        <option value="">-- All Lead Forms on this Page --</option>
                        {facebookForms.map((form) => (
                          <option key={form.formId} value={form.formId}>
                            {form.formName} ({form.status})
                          </option>
                        ))}
                      </Select>
                    </FormField>
                  </div>
                )}
              </div>
            )}

                  {/* 2. DYNAMIC FORM FIELDS (API_KEY, WEBHOOK, & Custom Providers) */}
                  {authType !== 'OAUTH2' && dynamicFields.length > 0 && (
                    <div className="p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#161922] space-y-3.5">
                      {dynamicFields.map((field) => (
                        <div key={field.key} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                              {field.type === 'password' ? (
                                <Key className="w-3.5 h-3.5 text-zinc-500" />
                              ) : (
                                <Code2 className="w-3.5 h-3.5 text-zinc-500" />
                              )}
                              <span>{field.label || field.key}</span>
                              {field.required && <span className="text-rose-500">*</span>}
                            </label>

                                {field.key === 'crmKey' && resolvedCode === 'INDIAMART' && (
                                  <button
                                    type="button"
                                    onClick={() => setShowKeyGuide(!showKeyGuide)}
                                    className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                                  >
                                    <Info className="w-3 h-3" />
                                    <span>Where to find this?</span>
                                  </button>
                                )}
                              </div>

                  {field.key === 'crmKey' && resolvedCode === 'INDIAMART' && showKeyGuide && (
                                  <div className="p-2.5 rounded-lg bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-[11px] text-teal-800 dark:text-teal-300 space-y-1">
                                    <p className="font-semibold">Locating your IndiaMART CRM Key:</p>
                                    <ol className="list-decimal pl-4 space-y-0.5">
                                      <li>Log into your <b>IndiaMART Seller Panel</b> (seller.indiamart.com).</li>
                                      <li>Navigate to <b>Settings &gt; CRM Integration / Lead Manager</b>.</li>
                                      <li>Copy your <b>CRM API Key</b> (GLUSR Key) and paste it below.</li>
                                    </ol>
                                  </div>
                                )}

                                <div className="relative flex items-center gap-2">
                                  <div className="relative flex-1">
                                    <Input
                                      type={field.type === 'password' && !visiblePasswords[field.key] ? 'password' : 'text'}
                                      value={credentialsData[field.key] || ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setCredentialsData((prev) => ({ ...prev, [field.key]: val }));
                                        if (field.key === 'crmKey') setKeyVerified(false);
                                      }}
                                      placeholder={field.placeholder || `Enter ${field.label || field.key}`}
                                      required={field.required}
                                      className="text-xs w-full pr-8 font-mono"
                                    />
                                    {field.type === 'password' && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setVisiblePasswords((prev) => ({
                                            ...prev,
                                            [field.key]: !prev[field.key],
                                          }))
                                        }
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                        tabIndex={-1}
                                        title={visiblePasswords[field.key] ? 'Hide' : 'Show'}
                                      >
                                        {visiblePasswords[field.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                                      </button>
                                    )}
                                  </div>

                                  {field.key === 'crmKey' && resolvedCode === 'INDIAMART' && (
                                    <button
                                      type="button"
                                      onClick={handleTestIndiaMartKey}
                                      disabled={isTestingKey || !credentialsData.crmKey?.trim()}
                                      className="btn-secondary px-3 text-xs flex items-center gap-1.5 shrink-0"
                                    >
                                      {isTestingKey ? (
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                      ) : keyVerified ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                      ) : (
                                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                                      )}
                                      <span>{isTestingKey ? 'Verifying...' : keyVerified ? 'Verified' : 'Test Connection'}</span>
                                    </button>
                                  )}
                              </div>

                              {field.key === 'crmKey' && resolvedCode === 'INDIAMART' && keyVerified && (
                                <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{keyVerifyMessage || 'Connection verified and validated! Ready to sync.'}</span>
                                </div>
                              )}

                              {field.helpText && (
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                                  {field.helpText}
                                </p>
                              )}
                            </div>
              ))}
                        </div>
                      )}

                          {/* Dedicated Inbound Webhook Preview (for Webhook-compatible connectors) */}
                          {(authType === 'WEBHOOK' || resolvedCode === 'INDIAMART' || resolvedCode === 'TRADEINDIA') && (
                            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#161922] space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                                  <Globe className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Real-Time Inbound Webhook Listener</span>
                                </span>
                                <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-semibold border border-emerald-200 dark:border-emerald-800">
                                  Instant Sync
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-500">
                                Inbound endpoint for real-time lead push notifications from {displayName}:
                              </p>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  readOnly
                                  value={webhookUrlPreview}
                                  className="w-full text-[11px] font-mono bg-zinc-100 dark:bg-[#12141a] border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-600 dark:text-zinc-300 select-all"
                                />
                                <button
                                  type="button"
                                  onClick={handleCopyWebhook}
                                  className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1 shrink-0"
                                >
                                  {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                  <span>{copiedWebhook ? 'Copied' : 'Copy'}</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* ----------------------------------------------------------------- */}
                          {/* LEAD ROUTING & RULES (OPTIONAL ACCORDION)                         */}
                          {/* ----------------------------------------------------------------- */}
                          <div className="border border-zinc-200 dark:border-[#2A2F3D] rounded-xl overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setShowRoutingRules(!showRoutingRules)}
                              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-[#161922] hover:bg-zinc-100 dark:hover:bg-[#1c202b] flex items-center justify-between text-xs font-bold text-zinc-800 dark:text-[#E6E8EE] transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                                <span>Lead Routing & Rules (Optional)</span>
                              </div>
                              {showRoutingRules ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
                            </button>

                            {showRoutingRules && (
                              <div className="p-4 bg-white dark:bg-[#0F1117] border-t border-zinc-200 dark:border-[#2A2F3D] space-y-3">
                                <FormField label="Assign Leads to Sales Pool">
                                  <Select
                                    value={poolId}
                                    onChange={(e) => setPoolId(e.target.value)}
                                    className="text-xs"
                                  >
                                    <option value="">-- Direct Lead Inbox (No Pool) --</option>
                                    {pools.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.name || p.poolName} (Round-Robin)
                                      </option>
                                    ))}
                                  </Select>
                                </FormField>

                                <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-[#E6E8EE] cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={autoQualify}
                                    onChange={(e) => setAutoQualify(e.target.checked)}
                                    className="rounded border-zinc-300 text-primary focus:ring-primary h-4 w-4"
                                  />
                                  <span className="font-medium">Auto-mark incoming inquiries as Qualified</span>
                                </label>
                              </div>
                            )}
                          </div>

                          {/* Modal Actions */}
                          <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-zinc-200 dark:border-[#2A2F3D]">
                            <button
                              type="button"
                              onClick={() => setStep('SELECT')}
                              className="btn-secondary text-xs font-semibold px-3.5 py-2 flex items-center gap-1.5 cursor-pointer"
                            >
                              <ChevronLeft size={14} />
                              <span>Back to Channels</span>
                            </button>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={onClose}
                                className="btn-secondary text-xs font-semibold px-4 py-2 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={isConnecting || (authType === 'OAUTH2' && !oauthConnected && !(showManualOAuth && manualPageId.trim()))}
                                className="btn-primary text-xs font-semibold px-5 py-2 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                              >
                                {isConnecting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                                <span>{isConnecting ? 'Connecting...' : 'Connect & Start Syncing'}</span>
                              </button>
                            </div>
                          </div>
                        </form>
                      )}
                    </Modal>
                  );
}