import React, { useState } from 'react';
import { Modal, FormField, Input, Select, Button } from '../../../components/common';
import { Megaphone, AlertCircle } from 'lucide-react';
import { useCreateCrmCampaignMutation } from '../../../api/sales-crm/crm.api';

export default function CampaignFormModal({
  isOpen,
  onClose,
  companyId,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'SEARCH',
    channel: 'GOOGLE_ADS',
    budget: 50000,
    targetRevenue: 250000,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
    utmSource: 'google',
    utmMedium: 'cpc',
    utmCampaign: '',
  });

  const [errorMsg, setErrorMsg] = useState(null);
  const [createCampaign, { isLoading }] = useCreateCrmCampaignMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Campaign name is required.');
      return;
    }

    try {
      setErrorMsg(null);
      await createCampaign({
        companyId,
        data: {
          name: formData.name.trim(),
          code: formData.code.trim() || formData.name.trim().toUpperCase().replace(/\s+/g, '_'),
          type: formData.type,
          channel: formData.channel,
          budget: Number(formData.budget) || 0,
          targetRevenue: Number(formData.targetRevenue) || 0,
          startDate: formData.startDate ? `${formData.startDate}T00:00:00Z` : null,
          endDate: formData.endDate ? `${formData.endDate}T23:59:59Z` : null,
          utmSource: formData.utmSource,
          utmMedium: formData.utmMedium,
          utmCampaign: formData.utmCampaign || formData.name.toLowerCase().replace(/\s+/g, '-'),
        },
      }).unwrap();
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMsg(err?.data?.message || err.message || 'Failed to create campaign');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Marketing Campaign"
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
          <FormField label="Campaign Name" required>
            <Input
              type="text"
              required
              placeholder="e.g. Q4 IndiaMART B2B Lead Gen"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </FormField>

          <FormField label="Campaign Code">
            <Input
              type="text"
              placeholder="e.g. CMP-2026-Q4"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="uppercase"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Campaign Type">
            <Select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="SEARCH">Search Engine Ads</option>
              <option value="SOCIAL">Social Media Campaign</option>
              <option value="EMAIL">Email Marketing Newsletter</option>
              <option value="MARKETPLACE">B2B Portal (IndiaMART/TradeIndia)</option>
              <option value="EVENT">Trade Show / Expo</option>
              <option value="REFERRAL">Referral Program</option>
            </Select>
          </FormField>

          <FormField label="Channel">
            <Select
              value={formData.channel}
              onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
            >
              <option value="GOOGLE_ADS">Google Ads</option>
              <option value="META_ADS">Meta (Facebook / Instagram)</option>
              <option value="LINKEDIN">LinkedIn B2B</option>
              <option value="INDIAMART">IndiaMART Portal</option>
              <option value="TRADEINDIA">TradeIndia</option>
              <option value="WHATSAPP">WhatsApp Broadcast</option>
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Budget Allocated (₹)">
            <Input
              type="number"
              min="0"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              className="font-mono"
            />
          </FormField>

          <FormField label="Target Revenue (₹)">
            <Input
              type="number"
              min="0"
              value={formData.targetRevenue}
              onChange={(e) => setFormData({ ...formData, targetRevenue: e.target.value })}
              className="font-mono"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Start Date">
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </FormField>

          <FormField label="End Date">
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </FormField>
        </div>

        {/* UTM Tracking Params */}
        <div className="p-3 bg-zinc-50 dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg">
          <p className="text-xs font-semibold text-zinc-800 dark:text-[#E6E8EE] mb-2">UTM Attribution Tags</p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-zinc-500 uppercase block mb-1">utm_source</label>
              <Input
                size="sm"
                type="text"
                value={formData.utmSource}
                onChange={(e) => setFormData({ ...formData, utmSource: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 uppercase block mb-1">utm_medium</label>
              <Input
                size="sm"
                type="text"
                value={formData.utmMedium}
                onChange={(e) => setFormData({ ...formData, utmMedium: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 uppercase block mb-1">utm_campaign</label>
              <Input
                size="sm"
                type="text"
                value={formData.utmCampaign}
                placeholder="optional"
                onChange={(e) => setFormData({ ...formData, utmCampaign: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-[#2A2F3D]">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={isLoading}
            icon={Megaphone}
          >
            Launch Campaign
          </Button>
        </div>
      </form>
    </Modal>
  );
}

