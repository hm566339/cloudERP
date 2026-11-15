import React, { useState } from 'react';
import { Modal } from '../../../components/common';
import { Globe, Key, AlertCircle, Copy, Check } from 'lucide-react';
import { useCreateCrmTenantIntegrationMutation } from '../../../api/sales-crm/crm.api';

export default function IntegrationFormModal({
  isOpen,
  onClose,
  companyId,
  pools = [],
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    channelCode: 'INDIAMART',
    integrationName: 'IndiaMART B2B Ingestion',
    apiKey: '',
    webhookSecret: '',
    autoQualify: true,
    roundRobinPoolId: '',
  });

  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [createIntegration, { isLoading }] = useCreateCrmTenantIntegrationMutation();

  const generatedSlug = (formData.integrationName || 'webhook')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 32);

  const webhookUrl = `https://www.mark2.in/api/crm/integrations/webhook/${generatedSlug}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setErrorMsg(null);
      await createIntegration({
        companyId,
        data: {
          channelCode: formData.channelCode,
          integrationName: formData.integrationName.trim(),
          webhookSlug: generatedSlug,
          apiKey: formData.apiKey || null,
          webhookSecret: formData.webhookSecret || null,
          autoQualify: formData.autoQualify,
          roundRobinPoolId: formData.roundRobinPoolId || null,
        },
      }).unwrap();
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMsg(err?.data?.message || err.message || 'Failed to configure integration');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configure Lead Ingestion Channel"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
              Channel Platform *
            </label>
            <select
              value={formData.channelCode}
              onChange={(e) => setFormData({ ...formData, channelCode: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
            >
              <option value="INDIAMART">IndiaMART Inbound Push</option>
              <option value="TRADEINDIA">TradeIndia Webhook</option>
              <option value="JUSTDIAL">Justdial Leads</option>
              <option value="META_LEAD_ADS">Meta / Facebook Lead Ads</option>
              <option value="CUSTOM_WEBHOOK">Custom Generic JSON Webhook</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
              Integration Name *
            </label>
            <input
              type="text"
              required
              value={formData.integrationName}
              onChange={(e) => setFormData({ ...formData, integrationName: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
            Generated Webhook Endpoint
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={webhookUrl}
              className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#161922] text-zinc-800 dark:text-[#E6E8EE]"
            />
            <button
              type="button"
              onClick={copyToClipboard}
              className="p-2 border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-zinc-600 dark:text-[#A0A6B5] hover:bg-zinc-100 dark:hover:bg-[#1C202B]"
              title="Copy URL"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
              API Key / CRM Key (Optional)
            </label>
            <input
              type="password"
              placeholder="IndiaMART GLUSR_MOBILE_KEY or Token"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
              Webhook Secret / Token
            </label>
            <input
              type="password"
              placeholder="HMAC secret for request verification"
              value={formData.webhookSecret}
              onChange={(e) => setFormData({ ...formData, webhookSecret: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
            Auto Route Inbound Leads to Pool
          </label>
          <select
            value={formData.roundRobinPoolId}
            onChange={(e) => setFormData({ ...formData, roundRobinPoolId: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
          >
            <option value="">Default Assignment</option>
            {pools.map((p) => (
              <option key={p.id} value={p.id}>
                {p.poolName} ({p.routingStrategy})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="autoQualifyLead"
            checked={formData.autoQualify}
            onChange={(e) => setFormData({ ...formData, autoQualify: e.target.checked })}
            className="rounded border-zinc-300 dark:border-[#2A2F3D] text-primary"
          />
          <label htmlFor="autoQualifyLead" className="text-xs text-zinc-700 dark:text-[#A0A6B5] cursor-pointer">
            Automatically mark incoming verified marketplace inquiries as Qualified
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-[#2A2F3D]">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs px-3.5 py-1.5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5"
          >
            <Globe size={13} />
            {isLoading ? 'Connecting...' : 'Connect Channel'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

