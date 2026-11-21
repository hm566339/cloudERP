import React, { useState } from 'react';
import { Modal, FormField, Input, Select, Button } from '../../../components/common';
import { Shield, Key, Globe, Check, AlertCircle, RefreshCw, Sliders, Lock, Image } from 'lucide-react';
import IntegrationProviderLogo from './IntegrationProviderLogo';
import {
  useGetAdminIntegrationProvidersQuery,
  useUpdateAdminIntegrationProviderMutation,
} from '../../../api/sales-crm/crm.api';

const toArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

export default function SystemAdminProvidersModal({ isOpen, onClose }) {
  const { data: providersRes, isLoading, refetch } = useGetAdminIntegrationProvidersQuery(undefined, {
    skip: !isOpen,
  });
  const [updateProvider, { isLoading: isUpdating }] = useUpdateAdminIntegrationProviderMutation();

  const providers = toArray(providersRes);
  const [selectedCode, setSelectedCode] = useState('FACEBOOK');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Selected provider configuration
  const currentProvider = providers.find((p) => p.code === selectedCode) || providers[0] || {};
  const currentConfig = currentProvider.globalConfig || {};

  const [formData, setFormData] = useState({
    displayName: '',
    authType: 'OAUTH2',
    isEnabled: true,
    logoUrl: '',
    clientId: '',
    clientSecret: '',
    apiBaseUrl: '',
    redirectUri: '',
  });

  // Populate form on selection
  React.useEffect(() => {
    if (currentProvider && currentProvider.code) {
      setFormData({
        displayName: currentProvider.displayName || '',
        authType: currentProvider.authType || 'API_KEY',
        isEnabled: currentProvider.isEnabled ?? true,
        logoUrl: currentProvider.logoUrl || currentConfig.logoUrl || '',
        clientId: currentConfig.clientId || '',
        clientSecret: currentConfig.clientSecret || '',
        apiBaseUrl: currentConfig.apiBaseUrl || '',
        redirectUri: currentConfig.redirectUri || '',
      });
      setSuccessMsg('');
      setErrorMsg('');
    }
  }, [selectedCode, currentProvider]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const payload = {
        displayName: formData.displayName,
        authType: formData.authType,
        logoUrl: formData.logoUrl.trim() || null,
        isEnabled: Boolean(formData.isEnabled),
        globalConfig: {
          ...currentConfig,
          logoUrl: formData.logoUrl.trim() || null,
          clientId: formData.clientId.trim(),
          clientSecret: formData.clientSecret.trim(),
          apiBaseUrl: formData.apiBaseUrl.trim(),
          redirectUri: formData.redirectUri.trim(),
        },
      };

      await updateProvider({ code: selectedCode, data: payload }).unwrap();
      setSuccessMsg(`Global defaults for ${selectedCode} updated successfully.`);
      refetch();
    } catch (err) {
      setErrorMsg(err?.data?.message || err?.message || 'Failed to update provider defaults.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-bold text-zinc-900 dark:text-white">
              SystemAdmin: Global Provider Configuration (Layer 1)
            </span>
            <p className="text-[11px] text-zinc-500 font-normal">
              Configure OAuth Client ID, Secret, and Redirect URIs once for all tenants
            </p>
          </div>
        </div>
      }
      size="xl"
    >
      <div className="space-y-4">
        {successMsg && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-rose-700 dark:text-rose-400 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Provider Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-[#2A2F3D] pb-2 overflow-x-auto">
          {Array.from(new Set(['FACEBOOK', 'INDIAMART', 'TRADEINDIA', 'CUSTOM_WEBHOOK', ...providers.map((p) => p.code).filter(Boolean)])).map((code) => {
            const p = providers.find((item) => item.code === code);
            const tabLogo = p?.logoUrl || p?.globalConfig?.logoUrl;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setSelectedCode(code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  selectedCode === code
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-zinc-600 dark:text-[#A0A6B5] hover:bg-zinc-100 dark:hover:bg-[#1C202B]'
                }`}
              >
                <IntegrationProviderLogo code={code} logoUrl={tabLogo} size="xs" />
                <span>{code}</span>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-zinc-400">Loading global provider configs...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField label="Display Name" required>
                <Input
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="text-xs"
                  required
                />
              </FormField>

              <FormField label="Auth Architecture" required>
                <Select
                  value={formData.authType}
                  onChange={(e) => setFormData({ ...formData, authType: e.target.value })}
                  className="text-xs"
                >
                  <option value="OAUTH2">OAuth 2.0 (Facebook/Meta)</option>
                  <option value="API_KEY">API Key / Token (IndiaMART)</option>
                  <option value="WEBHOOK">Inbound Webhook (TradeIndia / Custom)</option>
                </Select>
              </FormField>
            </div>

            {/* Provider Brand Logo */}
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
                  code={selectedCode}
                  logoUrl={formData.logoUrl}
                  size="md"
                  className="shadow-xs shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <Input
                    type="url"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    placeholder="https://example.com/logo.png or SVG/WebP URL"
                    className="w-full text-xs font-mono"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Direct image URL (PNG, SVG, JPG, WebP). Saved in database to render custom brand logo across catalog cards and forms.
                  </p>
                </div>
              </div>
            </div>

            {selectedCode === 'FACEBOOK' && (
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#161922] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-white">
                  <Lock className="w-4 h-4 text-blue-600" />
                  <span>Meta App OAuth Credentials</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField label="OAuth App ID (Client ID)" required>
                    <Input
                      name="metaAppId"
                      autoComplete="off"
                      value={formData.clientId}
                      onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                      placeholder="e.g. 192837492817293"
                      className="text-xs font-mono"
                    />
                  </FormField>

                  <FormField label="OAuth App Secret (Client Secret)" required>
                    <Input
                      type="password"
                      name="metaAppSecret"
                      autoComplete="new-password"
                      value={formData.clientSecret}
                      onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                      placeholder="e.g. a8f9e0b1c2d3..."
                      className="text-xs font-mono"
                    />
                  </FormField>
                </div>

                <FormField label="OAuth Redirect URI">
                  <Input
                    value={formData.redirectUri}
                    onChange={(e) => setFormData({ ...formData, redirectUri: e.target.value })}
                    placeholder="https://www.mark2.in/erp/sales-crm/integrations"
                    className="text-xs font-mono"
                  />
                </FormField>
              </div>
            )}

            <FormField label="Base API URL">
              <Input
                value={formData.apiBaseUrl}
                onChange={(e) => setFormData({ ...formData, apiBaseUrl: e.target.value })}
                placeholder="https://mapi.indiamart.com or https://graph.facebook.com"
                className="text-xs font-mono"
              />
            </FormField>

            <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-[#E6E8EE] cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={formData.isEnabled}
                onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                className="rounded border-zinc-300 text-primary focus:ring-primary h-4 w-4"
              />
              <span className="font-semibold">Globally Enable this Provider for Tenants</span>
            </label>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-200 dark:border-[#2A2F3D]">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-xs font-semibold px-4 py-2"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="btn-primary text-xs font-semibold px-5 py-2 flex items-center gap-2"
              >
                {isUpdating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isUpdating ? 'Saving Defaults...' : 'Save Global Provider'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
