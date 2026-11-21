import React, { useState, useEffect } from 'react';
import { Modal, FormField, Input, Select, Button } from '../../../components/common';
import { Shield, Key, Globe, Layers, Plus, Check, Copy, AlertCircle, RefreshCw, Image } from 'lucide-react';
import TenantFieldsBuilder, { getSmartDefaultTenantFields } from './TenantFieldsBuilder';
import IntegrationProviderLogo from './IntegrationProviderLogo';
import { useCreateAdminIntegrationProviderMutation } from '../../../api/sales-crm/crm.api';

const DEFAULT_WEBHOOK_PREFIX = 'https://www.mark2.in/api/crm/integrations/webhook/';
const DEFAULT_REDIRECT_URI = 'https://www.mark2.in/api/crm/integrations/oauth/';

export default function AddProviderModal({ isOpen, onClose, onSuccess }) {
  const [createProvider, { isLoading: isCreating }] = useCreateAdminIntegrationProviderMutation();

  const [code, setCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authType, setAuthType] = useState('WEBHOOK');
  const [logoUrl, setLogoUrl] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);

  // Admin Config
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [authorizeUrl, setAuthorizeUrl] = useState('');
  const [tokenUrl, setTokenUrl] = useState('');
  const [scopes, setScopes] = useState('');
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [authHeaderTemplate, setAuthHeaderTemplate] = useState('');
  const [pullApiUrl, setPullApiUrl] = useState('');

  // Tenant Fields Schema
  const [tenantFields, setTenantFields] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  // When authType or code changes, pre-populate smart defaults
  useEffect(() => {
    if (!isOpen) return;
    const defaults = getSmartDefaultTenantFields(authType, code);
    setTenantFields(defaults);

    if (authType === 'OAUTH2') {
      const c = code ? code.trim().toUpperCase() : 'FACEBOOK';
      setRedirectUri(`${DEFAULT_REDIRECT_URI}${c}/callback`);
      setScopes('leads_retrieval,pages_show_list,pages_read_engagement,pages_manage_metadata');
    } else if (authType === 'API_KEY') {
      setApiBaseUrl('https://mapi.indiamart.com/wservce/enquiry/listing/GLUSR_MOBILE_KEY/');
    } else if (authType === 'WEBHOOK') {
      if (code && code.toUpperCase().includes('TRADEINDIA')) {
        setPullApiUrl('https://www.tradeindia.com/utils/my_inquiry.html');
      }
    }
  }, [authType, isOpen]);

  const handleCodeChange = (e) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    setCode(raw);
    if (!displayName || displayName === code) {
      setDisplayName(raw.replace(/_/g, ' '));
    }
    if (authType === 'OAUTH2') {
      setRedirectUri(`${DEFAULT_REDIRECT_URI}${raw}/callback`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!code.trim()) {
      setErrorMsg('Provider code is required.');
      return;
    }
    if (!displayName.trim()) {
      setErrorMsg('Display name is required.');
      return;
    }

    try {
      const globalConfig = {
        tenantFields,
      };

      if (authType === 'OAUTH2') {
        globalConfig.clientId = clientId.trim();
        globalConfig.clientSecret = clientSecret.trim();
        globalConfig.redirectUri = redirectUri.trim();
        if (authorizeUrl.trim()) globalConfig.authorizeUrl = authorizeUrl.trim();
        if (tokenUrl.trim()) globalConfig.tokenUrl = tokenUrl.trim();
        if (scopes.trim()) globalConfig.scopes = scopes.trim();
      } else if (authType === 'API_KEY') {
        globalConfig.apiBaseUrl = apiBaseUrl.trim();
        if (authHeaderTemplate.trim()) globalConfig.authHeaderTemplate = authHeaderTemplate.trim();
      } else if (authType === 'WEBHOOK') {
        globalConfig.webhookPrefix = DEFAULT_WEBHOOK_PREFIX;
        if (pullApiUrl.trim()) globalConfig.pullApiUrl = pullApiUrl.trim();
      }

      const payload = {
        code: code.trim(),
        displayName: displayName.trim(),
        authType,
        logoUrl: logoUrl.trim() || null,
        isEnabled: Boolean(isEnabled),
        globalConfig: {
          ...globalConfig,
          logoUrl: logoUrl.trim() || null,
        },
      };

      await createProvider(payload).unwrap();
      if (onSuccess) onSuccess(code.trim());
      onClose();
    } catch (err) {
      console.error('Failed to create provider', err);
      setErrorMsg(err?.data?.message || err?.message || 'Failed to create global provider.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-bold text-zinc-900 dark:text-white">
              SystemAdmin: Add Global Integration Provider
            </span>
            <p className="text-[11px] text-zinc-500 font-normal">
              Register a marketplace or webhook provider and define its client connection fields
            </p>
          </div>
        </div>
      }
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 py-1">
        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2 text-rose-700 dark:text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* 1. Basic Identity */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              Provider Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="e.g. JUSTDIAL, TRADEINDIA"
              required
              className="w-full text-xs font-mono uppercase px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
            />
            <p className="text-[10px] text-zinc-400 mt-1">Unique uppercase code (e.g. JUSTDIAL)</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              Display Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Justdial B2B Inquiries"
              required
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
            />
            <p className="text-[10px] text-zinc-400 mt-1">Catalog name shown to clients</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              Authorization Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={authType}
              onChange={(e) => setAuthType(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white font-semibold"
            >
              <option value="WEBHOOK">WEBHOOK (Inbound &amp; Pull Sync)</option>
              <option value="API_KEY">API_KEY (Direct REST Key)</option>
              <option value="OAUTH2">OAUTH2 (1-Click OAuth Flow)</option>
            </select>
            <p className="text-[10px] text-zinc-400 mt-1">Auth mechanism for lead ingestion</p>
          </div>
        </div>

        {/* 1.5 Provider Brand Logo */}
        <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#161922] space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5 text-indigo-500" />
              <span>Provider Brand Logo URL (Optional)</span>
            </label>
            <span className="text-[10px] text-zinc-400">Live Preview</span>
          </div>
          <div className="flex items-center gap-3">
            <IntegrationProviderLogo
              code={code || 'CUSTOM_WEBHOOK'}
              logoUrl={logoUrl}
              size="lg"
              className="shadow-xs shrink-0"
            />
            <div className="flex-1 min-w-0">
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png or SVG/WebP URL"
                className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#12141a] text-zinc-900 dark:text-white"
              />
              <p className="text-[10px] text-zinc-400 mt-1">
                Direct image URL (PNG, SVG, JPG, WebP). Saved in database to render custom brand logo across catalog cards and forms.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Dynamic Admin Config based on Auth Type */}
        {authType === 'OAUTH2' && (
          <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/20 dark:bg-blue-950/20 space-y-3">
            <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-blue-600" />
              <span>OAuth 2.0 Global Server Credentials</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  OAuth Client ID / App ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="e.g. 159283948192038"
                  required
                  className="w-full text-xs font-mono px-2.5 py-1.5 rounded border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  OAuth Client Secret <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Enter secret (encrypted at rest AES-256)"
                  required
                  className="w-full text-xs font-mono px-2.5 py-1.5 rounded border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Valid OAuth Redirect URI
              </label>
              <input
                type="text"
                value={redirectUri}
                onChange={(e) => setRedirectUri(e.target.value)}
                placeholder="https://www.mark2.in/api/crm/integrations/oauth/PROVIDER/callback"
                className="w-full text-xs font-mono px-2.5 py-1.5 rounded border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Authorize Dialog URL (Optional)
                </label>
                <input
                  type="text"
                  value={authorizeUrl}
                  onChange={(e) => setAuthorizeUrl(e.target.value)}
                  placeholder="https://www.facebook.com/v19.0/dialog/oauth"
                  className="w-full text-xs font-mono px-2.5 py-1.5 rounded border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Token Exchange URL (Optional)
                </label>
                <input
                  type="text"
                  value={tokenUrl}
                  onChange={(e) => setTokenUrl(e.target.value)}
                  placeholder="https://graph.facebook.com/v19.0/oauth/access_token"
                  className="w-full text-xs font-mono px-2.5 py-1.5 rounded border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {authType === 'API_KEY' && (
          <div className="p-4 rounded-xl border border-teal-200 dark:border-teal-900/50 bg-teal-50/20 dark:bg-teal-950/20 space-y-3">
            <h4 className="text-xs font-bold text-teal-900 dark:text-teal-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-teal-600" />
              <span>API Key REST Configuration</span>
            </h4>
            <div>
              <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                API Base URL (e.g. IndiaMART Listing Endpoint)
              </label>
              <input
                type="text"
                value={apiBaseUrl}
                onChange={(e) => setApiBaseUrl(e.target.value)}
                placeholder="https://mapi.indiamart.com/wservce/enquiry/listing/GLUSR_MOBILE_KEY/"
                className="w-full text-xs font-mono px-2.5 py-1.5 rounded border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Auth Header or Path Template (Optional)
              </label>
              <input
                type="text"
                value={authHeaderTemplate}
                onChange={(e) => setAuthHeaderTemplate(e.target.value)}
                placeholder="e.g. Bearer {apiKey} or /GLUSR_MOBILE_KEY/{crmKey}/"
                className="w-full text-xs font-mono px-2.5 py-1.5 rounded border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {authType === 'WEBHOOK' && (
          <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/20 space-y-3">
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>Webhook Receiver &amp; Pull API Parameters</span>
            </h4>
            <div>
              <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Webhook Listener Prefix
              </label>
              <input
                type="text"
                readOnly
                value={DEFAULT_WEBHOOK_PREFIX}
                className="w-full text-xs font-mono px-2.5 py-1.5 rounded border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-100 dark:bg-[#12141a] text-zinc-500 cursor-not-allowed"
              />
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Each connecting client receives a dedicated slug: <code>/api/crm/integrations/webhook/{'{slug}'}</code>
              </p>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Optional Pull API URL (e.g. TradeIndia Inquiry API)
              </label>
              <input
                type="text"
                value={pullApiUrl}
                onChange={(e) => setPullApiUrl(e.target.value)}
                placeholder="https://www.tradeindia.com/utils/my_inquiry.html"
                className="w-full text-xs font-mono px-2.5 py-1.5 rounded border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
              />
              <p className="text-[10px] text-zinc-400 mt-0.5">
                If provided, scheduled &amp; manual CRM sync will pull inquiries in addition to receiving real-time webhooks.
              </p>
            </div>
          </div>
        )}

        {/* 3. Tenant Fields Schema Builder */}
        <TenantFieldsBuilder
          fields={tenantFields}
          onChange={setTenantFields}
          authType={authType}
        />

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-200 dark:border-[#2A2F3D]">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs font-semibold px-4 py-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isCreating}
            className="btn-primary text-xs font-semibold px-5 py-2 flex items-center gap-2"
          >
            {isCreating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{isCreating ? 'Creating Provider...' : 'Create & Save Provider'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
