import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Settings,
  Save,
  Plus,
  Tag,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Shield,
  Layers
} from 'lucide-react';
import PageHeader from '../../../components/common/PageHeader';
import {
  useGetCrmCompanySettingsQuery,
  useUpdateCrmCompanySettingsMutation,
  useGetCrmLeadSourcesQuery,
  useGetCrmLeadStatusesQuery,
  useGetCrmLostReasonsQuery,
  useGetCrmTagsQuery,
} from '../../../api/sales-crm/crm.api';
import TaxonomyModal from '../components/TaxonomyModal';

export default function CrmSettingsPage() {
  const { companyId } = useParams();
  const [activeTab, setActiveTab] = useState('general');
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const { data: settingsRes, refetch: refetchSettings } = useGetCrmCompanySettingsQuery(companyId);
  const [updateSettings, { isLoading: isSaving }] = useUpdateCrmCompanySettingsMutation();

  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.content)) return res.data.content;
    return [];
  };

  const { data: sourcesRes } = useGetCrmLeadSourcesQuery(companyId);
  const { data: statusesRes } = useGetCrmLeadStatusesQuery(companyId);
  const { data: reasonsRes } = useGetCrmLostReasonsQuery(companyId);
  const { data: tagsRes, refetch: refetchTags } = useGetCrmTagsQuery(companyId);

  const sources = toArray(sourcesRes);
  const statuses = toArray(statusesRes);
  const reasons = toArray(reasonsRes);
  const tags = toArray(tagsRes);

  const [formData, setFormData] = useState({
    defaultQuotationValidityDays: 30,
    leadQualificationScoreThreshold: 50,
    autoConvertOnApproval: true,
    strictSlaHours: 24,
    enableRoundRobinAutoRouting: true,
  });

  useEffect(() => {
    if (settingsRes?.data) {
      setFormData({
        defaultQuotationValidityDays: settingsRes.data.defaultQuotationValidityDays ?? 30,
        leadQualificationScoreThreshold: settingsRes.data.leadQualificationScoreThreshold ?? 50,
        autoConvertOnApproval: settingsRes.data.autoConvertOnApproval ?? true,
        strictSlaHours: settingsRes.data.strictSlaHours ?? 24,
        enableRoundRobinAutoRouting: settingsRes.data.enableRoundRobinAutoRouting ?? true,
      });
    }
  }, [settingsRes]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setErrorMsg(null);
      await updateSettings({
        companyId,
        data: formData,
      }).unwrap();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      refetchSettings();
    } catch (err) {
      setErrorMsg(err?.data?.message || err.message || 'Failed to save settings');
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <PageHeader
        title="CRM Configuration & Master Taxonomy"
        description="Operational defaults, SLA thresholds, and lead qualification scoring rules"
      />

      {/* Tabs strip */}
      <div className="px-6 py-2.5 bg-white dark:bg-[#161922] border-b border-zinc-200 dark:border-[#2A2F3D] flex items-center gap-2 shrink-0">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'general'
              ? 'bg-primary text-white shadow-sm'
              : 'text-zinc-600 dark:text-[#A0A6B5] hover:bg-zinc-100 dark:hover:bg-[#1C202B]'
          }`}
        >
          <Sliders size={13} /> Operational Defaults & SLAs
        </button>
        <button
          onClick={() => setActiveTab('taxonomy')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'taxonomy'
              ? 'bg-primary text-white shadow-sm'
              : 'text-zinc-600 dark:text-[#A0A6B5] hover:bg-zinc-100 dark:hover:bg-[#1C202B]'
          }`}
        >
          <Tag size={13} /> Sources, Statuses & Tags
        </button>
      </div>

      <div className="flex-1 p-6 overflow-auto flex flex-col">
        {activeTab === 'general' && (
          <form onSubmit={handleSaveSettings} className="bg-white dark:bg-[#161922] p-6 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm space-y-6">
            {savedSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 border border-emerald-200 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle2 size={15} />
                <span>CRM operational settings updated successfully!</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-700 border border-rose-200 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-zinc-50 dark:bg-[#1C202B] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5] flex items-center gap-1.5">
                  <Sliders size={13} /> Quotation & Deal Rules
                </h2>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
                    Default Quotation Validity (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={formData.defaultQuotationValidityDays}
                    onChange={(e) => setFormData({ ...formData, defaultQuotationValidityDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="autoConvert"
                    checked={formData.autoConvertOnApproval}
                    onChange={(e) => setFormData({ ...formData, autoConvertOnApproval: e.target.checked })}
                    className="rounded border-zinc-300 dark:border-[#2A2F3D] text-primary"
                  />
                  <label htmlFor="autoConvert" className="text-xs text-zinc-700 dark:text-[#A0A6B5] cursor-pointer">
                    Auto-convert approved quotations into booked Sales Orders
                  </label>
                </div>
              </div>

              <div className="p-5 bg-zinc-50 dark:bg-[#1C202B] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5] flex items-center gap-1.5">
                  <Shield size={13} /> SLA & Lead Qualification
                </h2>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
                    Lead Qualification Score Threshold (0 - 100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.leadQualificationScoreThreshold}
                    onChange={(e) => setFormData({ ...formData, leadQualificationScoreThreshold: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
                  />
                  <span className="text-[10px] text-zinc-400 mt-1 block">Leads with scores at or above this threshold qualify automatically</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
                    First Touch SLA Deadline (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={formData.strictSlaHours}
                    onChange={(e) => setFormData({ ...formData, strictSlaHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-100 dark:border-[#2A2F3D]">
              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary inline-flex items-center gap-1.5 text-xs font-semibold"
              >
                <Save size={13} />
                {isSaving ? 'Saving Settings...' : 'Save Settings'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'taxonomy' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Custom Tags */}
            <div className="bg-white dark:bg-[#161922] p-6 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Custom Lead & Deal Tags</h2>
                  <p className="text-xs text-zinc-500">Universal classification badges</p>
                </div>
                <button
                  onClick={() => setIsTagModalOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 border border-zinc-300 dark:border-[#2A2F3D] text-zinc-700 dark:text-[#E6E8EE] hover:bg-zinc-100 dark:hover:bg-[#1C202B] text-xs font-semibold rounded-lg shadow-sm transition-all"
                >
                  <Plus size={12} /> Add Tag
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {tags.length === 0 ? (
                  <p className="text-xs text-zinc-400">No custom tags created yet.</p>
                ) : (
                  tags.map((tg) => (
                    <span
                      key={tg.id}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold text-white inline-flex items-center gap-1 shadow-sm"
                      style={{ backgroundColor: tg.colorCode || '#6366F1' }}
                    >
                      <Tag size={11} /> {tg.tagName}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Lead Statuses */}
            <div className="bg-white dark:bg-[#161922] p-6 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Active Lead Statuses</h2>
              <div className="divide-y divide-zinc-200 dark:divide-[#2A2F3D] text-xs">
                {statuses.map((s) => (
                  <div key={s.id} className="py-2.5 flex items-center justify-between">
                    <span className="font-semibold text-zinc-800 dark:text-[#E6E8EE]">{s.statusName}</span>
                    <span className="text-[11px] font-mono text-zinc-400 uppercase">{s.category}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <TaxonomyModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        companyId={companyId}
        onSuccess={() => refetchTags()}
      />
    </div>
  );
}
