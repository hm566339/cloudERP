import React, { useState } from 'react';
import { Modal } from '../../../components/common';
import { useConvertLeadMutation } from '../../../api/sales-crm/crm.api';

export default function LeadConvertModal({
  isOpen,
  onClose,
  lead,
  companyId,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    createOpportunity: true,
    opportunityName: lead ? `${lead.organizationName || lead.displayName} - Deal` : '',
    dealValue: '100000',
    accountName: lead?.organizationName || lead?.displayName || '',
  });

  const [convertLead, { isLoading }] = useConvertLeadMutation();

  React.useEffect(() => {
    if (lead) {
      setFormData({
        createOpportunity: true,
        opportunityName: `${lead.organizationName || lead.displayName} - Enterprise Deal`,
        dealValue: '100000',
        accountName: lead.organizationName || lead.displayName || '',
      });
    }
  }, [lead, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lead?.id) return;

    try {
      await convertLead({
        id: lead.id,
        data: {
          createOpportunity: formData.createOpportunity,
          opportunityName: formData.opportunityName,
          dealValue: Number(formData.dealValue) || 0,
          accountName: formData.accountName,
        },
        companyId,
      }).unwrap();
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to convert lead:', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Convert Lead to Account & Opportunity"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-zinc-600 dark:text-[#A0A6B5]">
          Converting <strong className="text-zinc-900 dark:text-white">{lead?.displayName}</strong> will create a new
          B2B Account and primary Contact in your CRM directory.
        </p>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
            Account / Company Name
          </label>
          <input
            type="text"
            required
            value={formData.accountName}
            onChange={(e) => setFormData((p) => ({ ...p, accountName: e.target.value }))}
            className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="createOpp"
            checked={formData.createOpportunity}
            onChange={(e) => setFormData((p) => ({ ...p, createOpportunity: e.target.checked }))}
            className="rounded border-zinc-300 text-primary focus:ring-primary"
          />
          <label htmlFor="createOpp" className="text-xs font-semibold text-zinc-800 dark:text-[#E6E8EE]">
            Create a sales opportunity immediately
          </label>
        </div>

        {formData.createOpportunity && (
          <div className="p-3 bg-zinc-50 dark:bg-[#161922] rounded-lg border border-zinc-200 dark:border-[#2A2F3D] space-y-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
                Opportunity / Deal Name
              </label>
              <input
                type="text"
                required={formData.createOpportunity}
                value={formData.opportunityName}
                onChange={(e) => setFormData((p) => ({ ...p, opportunityName: e.target.value }))}
                className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
                Estimated Deal Value (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                required={formData.createOpportunity}
                value={formData.dealValue}
                onChange={(e) => setFormData((p) => ({ ...p, dealValue: e.target.value }))}
                className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
              />
            </div>
          </div>
        )}

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
            className="btn-primary text-xs px-4 py-1.5"
          >
            {isLoading ? 'Converting...' : 'Convert Lead'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

