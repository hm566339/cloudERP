import React from 'react';
import { Plus, Trash2, Key, Sliders, Info, ShieldCheck } from 'lucide-react';

export const FIELD_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'password', label: 'Password / Secret Key' },
  { value: 'number', label: 'Number' },
];

export const getSmartDefaultTenantFields = (authType, code = '') => {
  const norm = String(code).toUpperCase();
  if (norm.includes('META') || norm.includes('FACEBOOK') || authType === 'OAUTH2') {
    return [];
  }
  if (norm.includes('INDIAMART') || (authType === 'API_KEY' && norm.includes('INDIA'))) {
    return [
      {
        key: 'crmKey',
        label: 'IndiaMART CRM API Key (GLUSR Key)',
        type: 'password',
        required: true,
        placeholder: 'Paste your IndiaMART CRM API Key here',
        helpText: 'Found in IndiaMART Seller Panel > Settings > CRM Integration',
      },
    ];
  }
  if (norm.includes('TRADEINDIA')) {
    return [
      {
        key: 'userid',
        label: 'TradeIndia User ID (userid)',
        type: 'text',
        required: true,
        placeholder: 'e.g. 31914156',
        helpText: 'Your TradeIndia numeric user identifier',
      },
      {
        key: 'profile_id',
        label: 'TradeIndia Profile ID (profile_id)',
        type: 'text',
        required: true,
        placeholder: 'e.g. 173150148',
        helpText: 'Your company profile id',
      },
      {
        key: 'key',
        label: 'TradeIndia Inquiry Key (key)',
        type: 'password',
        required: true,
        placeholder: 'e.g. 0826fdde3c5cc99ac4fb2390f5ffeffa',
        helpText: 'Generated secret key for TradeIndia Inquiry API',
      },
      {
        key: 'webhookSecret',
        label: 'Webhook Security Secret (Optional)',
        type: 'password',
        required: false,
        placeholder: 'Optional validation secret token',
        helpText: 'Secret token used to verify inbound webhook signatures',
      },
    ];
  }
  if (authType === 'API_KEY') {
    return [
      {
        key: 'apiKey',
        label: 'API Key / Access Token',
        type: 'password',
        required: true,
        placeholder: 'Enter client API Key',
        helpText: 'API authentication token provided by the third-party platform',
      },
    ];
  }
  return [
    {
      key: 'webhookSecret',
      label: 'Webhook Security Secret (Optional)',
      type: 'password',
      required: false,
      placeholder: 'Optional validation secret token',
      helpText: 'Secret token used to verify inbound webhook notifications',
    },
  ];
};

export default function TenantFieldsBuilder({ fields = [], onChange, authType = 'API_KEY' }) {
  const handleAddField = () => {
    const newField = {
      key: `field_${Date.now().toString().slice(-4)}`,
      label: 'New Credential Field',
      type: 'text',
      required: true,
      placeholder: '',
      helpText: '',
    };
    onChange([...fields, newField]);
  };

  const handleUpdateField = (index, key, value) => {
    const updated = fields.map((f, i) => (i === index ? { ...f, [key]: value } : f));
    onChange(updated);
  };

  const handleRemoveField = (index) => {
    const updated = fields.filter((_, i) => i !== index);
    onChange(updated);
  };

  if (authType === 'OAUTH2') {
    return (
      <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20 text-xs text-blue-900 dark:text-blue-200 space-y-2">
        <div className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-300">
          <ShieldCheck className="w-4 h-4" />
          <span>OAuth 2.0 Client Connection Flow</span>
        </div>
        <p className="text-[11px] text-blue-700 dark:text-blue-300/80 leading-relaxed">
          Tenants connect using a seamless <b>1-Click OAuth</b> authorization dialog. No manual API keys or secrets are required from the client.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/40 dark:bg-[#161922]">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-indigo-500" />
            <span>Client (Tenant) Connection Form Fields Schema</span>
          </h4>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Configure the input fields clients must enter when connecting this provider in their CRM.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddField}
          className="btn-secondary text-[11px] font-semibold flex items-center gap-1 px-2.5 py-1"
        >
          <Plus size={13} />
          <span>Add Input Field</span>
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="p-4 text-center border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-500 text-xs">
          No tenant connection fields defined. Clients will connect without credential inputs.
        </div>
      ) : (
        <div className="space-y-2.5">
          {fields.map((field, idx) => (
            <div
              key={idx}
              className="p-3 bg-white dark:bg-[#1C202B] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg shadow-xs space-y-2"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className="sm:col-span-3">
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase block mb-1">
                    Field Key (JSON ID)
                  </label>
                  <input
                    type="text"
                    value={field.key}
                    onChange={(e) =>
                      handleUpdateField(idx, 'key', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))
                    }
                    placeholder="e.g. userid"
                    required
                    className="w-full text-xs font-mono px-2 py-1.5 rounded border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#12141a] text-zinc-800 dark:text-zinc-200"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase block mb-1">
                    Field Label (Shown in Modal)
                  </label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => handleUpdateField(idx, 'label', e.target.value)}
                    placeholder="e.g. TradeIndia User ID"
                    required
                    className="w-full text-xs px-2 py-1.5 rounded border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase block mb-1">
                    Input Type
                  </label>
                  <select
                    value={field.type || 'text'}
                    onChange={(e) => handleUpdateField(idx, 'type', e.target.value)}
                    className="w-full text-xs px-2 py-1.5 rounded border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 flex items-center gap-1.5 pt-3 sm:pt-4">
                  <input
                    type="checkbox"
                    id={`req_${idx}`}
                    checked={Boolean(field.required)}
                    onChange={(e) => handleUpdateField(idx, 'required', e.target.checked)}
                    className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor={`req_${idx}`} className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Required
                  </label>
                </div>

                <div className="sm:col-span-1 flex justify-end pt-3 sm:pt-4">
                  <button
                    type="button"
                    onClick={() => handleRemoveField(idx)}
                    className="text-zinc-400 hover:text-rose-500 p-1 rounded transition-colors"
                    title="Remove field"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Optional Placeholder & Help Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                <input
                  type="text"
                  value={field.placeholder || ''}
                  onChange={(e) => handleUpdateField(idx, 'placeholder', e.target.value)}
                  placeholder="Placeholder hint (e.g. 31914156)"
                  className="text-[11px] px-2 py-1 rounded border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#12141a] text-zinc-600 dark:text-zinc-400"
                />
                <input
                  type="text"
                  value={field.helpText || ''}
                  onChange={(e) => handleUpdateField(idx, 'helpText', e.target.value)}
                  placeholder="Help text (e.g. Found in Seller Panel > Settings)"
                  className="text-[11px] px-2 py-1 rounded border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#12141a] text-zinc-600 dark:text-zinc-400"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
