import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common';
import { Globe, Key, AlertCircle, Copy, Check, Info, Code2, ChevronDown, ChevronRight, ShieldCheck, Zap } from 'lucide-react';
import { useCreateCrmTenantIntegrationMutation } from '../../../api/sales-crm/crm.api';

const CHANNEL_CONFIGS = {
  INDIAMART: {
    label: 'IndiaMART B2B Portal',
    defaultName: 'IndiaMART Inbound Push',
    apiKeyPlaceholder: 'GLUSR_MOBILE_KEY or Token (Optional for pull)',
    secretPlaceholder: 'CRM API Secret / Auth Token (Optional)',
    guide: 'Paste the Generated Webhook Endpoint into IndiaMART Seller Panel > Lead Manager > CRM Integration > Push Service URL. Provide your GLUSR_MOBILE_KEY if you want periodic pull sync.',
    sampleJson: `{
  "UNIQUEQUERYID": "IM-99887766",
  "SENDER_NAME": "Amit Shah",
  "SENDER_MOBILE": "+91-9820098200",
  "SENDER_EMAIL": "amit@shahinfratech.com",
  "SENDER_COMPANY": "Shah Infratech Ltd",
  "SENDER_CITY": "Mumbai",
  "SENDER_STATE": "Maharashtra",
  "QUERY_PRODUCT_NAME": "Industrial Water Purifier 500 LPH",
  "QUERY_MESSAGE": "Looking for heavy duty water purifier for factory use."
}`
  },
  TRADEINDIA: {
    label: 'TradeIndia Marketplace',
    defaultName: 'TradeIndia Webhook',
    apiKeyPlaceholder: 'TradeIndia User ID / Profile ID',
    secretPlaceholder: 'TradeIndia Webhook Secret Token',
    guide: 'Configure this Webhook Endpoint in TradeIndia seller portal under Inquiries & Buy Leads Webhook settings. Inquiries will immediately trigger verified leads in CRM.',
    sampleJson: `{
  "r_id": "TI-12345",
  "sender_name": "Vikram Singh",
  "sender_mobile": "9876512345",
  "sender_email": "vikram@singhengineering.in",
  "sender_co": "Singh Engineering Works",
  "sender_city": "Ludhiana",
  "sender_state": "Punjab",
  "subject": "Inquiry for High Tensile Fasteners",
  "message": "Requirement of 5000 pcs of M12 bolts."
}`
  },
  META_LEAD_ADS: {
    label: 'Meta Lead Ads (Facebook & Instagram)',
    defaultName: 'Meta Ads Ingestion',
    apiKeyPlaceholder: 'Facebook Page Access Token (Optional)',
    secretPlaceholder: 'Webhook Verify Token (Required for hub.challenge)',
    guide: 'In Meta App Dashboard > Webhooks > Page Leadgen, paste this Webhook Endpoint and enter your chosen Webhook Secret as Verify Token. Mark2 automatically answers the GET hub.challenge handshake!',
    sampleJson: `{
  "leadgen_id": "928374928172938",
  "form_id": "18293847592817",
  "campaign_name": "Manufacturing ERP Campaign",
  "field_data": [
    { "name": "full_name", "values": ["Priya Sharma"] },
    { "name": "email", "values": ["priya.sharma@technocraft.com"] },
    { "name": "phone_number", "values": ["+919811223344"] },
    { "name": "company_name", "values": ["Technocraft Solutions"] },
    { "name": "city", "values": ["Bengaluru"] },
    { "name": "state", "values": ["Karnataka"] }
  ]
}`
  },
  JUSTDIAL: {
    label: 'Justdial Inquiries',
    defaultName: 'Justdial Lead Push',
    apiKeyPlaceholder: 'Justdial Lead API Key',
    secretPlaceholder: 'Lead Auth Token (Optional)',
    guide: 'Submit the Webhook Endpoint to your Justdial account manager or paste it into Justdial CRM connector preferences.',
    sampleJson: `{
  "lead_id": "JD-776655",
  "name": "Kavita Verma",
  "mobile": "9833445566",
  "email": "kavita@vermaenterprises.com",
  "company": "Verma Enterprises",
  "city": "Pune",
  "query": "Inquiry for commercial solar panel installation"
}`
  },
  CUSTOM_WEBHOOK: {
    label: 'Custom Generic JSON Webhook',
    defaultName: 'Custom Inbound Webhook',
    apiKeyPlaceholder: 'Sender Identifier / System Tag (Optional)',
    secretPlaceholder: 'Secret Token / Signature Key (Optional)',
    guide: 'Send HTTP POST requests with any JSON payload containing name, phone, email, company, and inquiry notes from your website contact forms, Zapier, Make, or custom apps.',
    sampleJson: `{
  "name": "Suresh Patel",
  "phone": "9825012345",
  "email": "suresh@pateltrading.com",
  "company": "Patel Trading Corp",
  "city": "Surat",
  "product": "Industrial Solar Inverters",
  "notes": "Need 10 units for factory installation"
}`
  }
};

export default function IntegrationFormModal({
  isOpen,
  onClose,
  companyId,
  pools = [],
  onSuccess,
  initialChannel = 'INDIAMART',
}) {
  const [formData, setFormData] = useState({
    channelCode: initialChannel || 'INDIAMART',
    integrationName: CHANNEL_CONFIGS[initialChannel]?.defaultName || 'Inbound Lead Ingestion',
    apiKey: '',
    webhookSecret: '',
    autoQualify: true,
    roundRobinPoolId: '',
  });

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const [createIntegration, { isLoading }] = useCreateCrmTenantIntegrationMutation();

  useEffect(() => {
    if (initialChannel && CHANNEL_CONFIGS[initialChannel]) {
      setFormData((prev) => ({
        ...prev,
        channelCode: initialChannel,
        integrationName: CHANNEL_CONFIGS[initialChannel].defaultName,
      }));
    }
  }, [initialChannel, isOpen]);

  const generatedSlug = (formData.integrationName || 'webhook')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);

  const webhookUrl = `https://www.mark2.in/api/crm/integrations/webhook/${generatedSlug}`;
  const currentConfig = CHANNEL_CONFIGS[formData.channelCode] || CHANNEL_CONFIGS.CUSTOM_WEBHOOK;

  const handleChannelChange = (newChannel) => {
    const config = CHANNEL_CONFIGS[newChannel] || CHANNEL_CONFIGS.CUSTOM_WEBHOOK;
    setFormData((prev) => ({
      ...prev,
      channelCode: newChannel,
      integrationName: config.defaultName,
    }));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const copyCurlCommand = () => {
    const curl = `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -d '${currentConfig.sampleJson.replace(/\n/g, ' ')}'`;
    navigator.clipboard.writeText(curl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setErrorMsg(null);
      await createIntegration({
        companyId,
        data: {
          channelCode: formData.channelCode,
          connectionName: formData.integrationName.trim(),
          integrationName: formData.integrationName.trim(),
          webhookSlug: generatedSlug,
          apiKey: formData.apiKey ? formData.apiKey.trim() : null,
          webhookSecret: formData.webhookSecret ? formData.webhookSecret.trim() : null,
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
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
              Channel Platform *
            </label>
            <select
              value={formData.channelCode}
              onChange={(e) => handleChannelChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="INDIAMART">IndiaMART Inbound Push</option>
              <option value="TRADEINDIA">TradeIndia Marketplace</option>
              <option value="META_LEAD_ADS">Meta / Facebook & Instagram Ads</option>
              <option value="JUSTDIAL">Justdial Leads</option>
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
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Channel setup guidance badge */}
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5">
          <Info size={16} className="text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-700 dark:text-[#D1D5DB] leading-relaxed">
            {currentConfig.guide}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE]">
              Public Inbound Webhook Endpoint
            </label>
            <span className="text-[11px] text-zinc-500 font-mono">Accepts POST / GET</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={webhookUrl}
              className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#161922] text-zinc-800 dark:text-[#E6E8EE] select-all"
            />
            <button
              type="button"
              onClick={copyToClipboard}
              className="px-3 py-2 border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs font-medium text-zinc-700 dark:text-[#E6E8EE] hover:bg-zinc-100 dark:hover:bg-[#1C202B] flex items-center gap-1.5 transition-colors"
              title="Copy URL"
            >
              {copiedUrl ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
              API Key / CRM Key (Optional)
            </label>
            <input
              type="password"
              placeholder={currentConfig.apiKeyPlaceholder}
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
              Webhook Secret / Verify Token
            </label>
            <input
              type="password"
              placeholder={currentConfig.secretPlaceholder}
              value={formData.webhookSecret}
              onChange={(e) => setFormData({ ...formData, webhookSecret: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
            Auto Route Inbound Leads to Pool (Optional)
          </label>
          <select
            value={formData.roundRobinPoolId}
            onChange={(e) => setFormData({ ...formData, roundRobinPoolId: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Default System Lead Queue</option>
            {pools.map((p) => (
              <option key={p.id} value={p.id}>
                {p.poolName} ({p.routingStrategy})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="autoQualifyLead"
            checked={formData.autoQualify}
            onChange={(e) => setFormData({ ...formData, autoQualify: e.target.checked })}
            className="rounded border-zinc-300 dark:border-[#2A2F3D] text-emerald-600 focus:ring-emerald-500"
          />
          <label htmlFor="autoQualifyLead" className="text-xs text-zinc-700 dark:text-[#A0A6B5] cursor-pointer">
            Automatically mark incoming marketplace inquiries as Qualified
          </label>
        </div>

        {/* Collapsible Sample Payload / cURL Preview */}
        <div className="border border-zinc-200 dark:border-[#2A2F3D] rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setShowSample(!showSample)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#161922] hover:bg-zinc-100 dark:hover:bg-[#1C202B] flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-[#E6E8EE] transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Code2 size={14} className="text-emerald-500" />
              Sample Inbound Payload & cURL Test
            </span>
            {showSample ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {showSample && (
            <div className="p-3 bg-zinc-900 text-zinc-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 font-mono">{formData.channelCode} Expected JSON</span>
                <button
                  type="button"
                  onClick={copyCurlCommand}
                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-[11px] text-zinc-200 flex items-center gap-1 transition-colors"
                >
                  {copiedCurl ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedCurl ? 'cURL Copied' : 'Copy cURL'}</span>
                </button>
              </div>
              <pre className="p-2.5 bg-black/50 rounded font-mono text-[11px] overflow-x-auto max-h-40 text-emerald-400">
                {currentConfig.sampleJson}
              </pre>
            </div>
          )}
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
            {isLoading ? 'Connecting Channel...' : 'Save & Activate Integration'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
