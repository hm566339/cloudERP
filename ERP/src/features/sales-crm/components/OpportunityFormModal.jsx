import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common';
import { useCreateCrmOpportunityMutation } from '../../../api/sales-crm/crm.api';

export default function OpportunityFormModal({
  isOpen,
  onClose,
  initialStageId = null,
  companyId,
  pipelines = [],
  accounts = [],
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    opportunityName: '',
    pipelineId: '',
    currentStageId: '',
    accountId: '',
    dealValue: '250000',
    dealType: 'NEW_BUSINESS',
    expectedCloseDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    winProbabilityPct: 30,
    lossReason: '',
    notes: '',
  });

  const [createOpportunity, { isLoading }] = useCreateCrmOpportunityMutation();

  const selectedPipeline = pipelines.find((p) => p.id === formData.pipelineId) || pipelines[0];
  const stages = selectedPipeline?.stages || [];

  useEffect(() => {
    if (pipelines.length > 0) {
      const defaultPipeline = pipelines[0];
      const defaultStage = initialStageId || defaultPipeline.stages?.[0]?.id || '';
      setFormData((p) => ({
        ...p,
        pipelineId: defaultPipeline.id,
        currentStageId: defaultStage,
        accountId: accounts[0]?.id || '',
      }));
    }
  }, [pipelines, initialStageId, accounts, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createOpportunity({
        data: {
          ...formData,
          dealValue: Number(formData.dealValue) || 0,
        },
        companyId,
      }).unwrap();
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to save opportunity:', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Sales Opportunity"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
            Opportunity / Deal Name *
          </label>
          <input
            type="text"
            name="opportunityName"
            required
            value={formData.opportunityName}
            onChange={handleChange}
            placeholder="e.g. Enterprise Cloud ERP Implementation"
            className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
              Account / Client *
            </label>
            <select
              name="accountId"
              required
              value={formData.accountId}
              onChange={handleChange}
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
            >
              <option value="">Select Account...</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
              Deal Type
            </label>
            <select
              name="dealType"
              value={formData.dealType}
              onChange={handleChange}
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
            >
              <option value="NEW_BUSINESS">New Business</option>
              <option value="EXPANSION">Expansion / Upsell</option>
              <option value="RENEWAL">Renewal</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
              Pipeline Funnel
            </label>
            <select
              name="pipelineId"
              value={formData.pipelineId}
              onChange={(e) => {
                const pipe = pipelines.find((p) => p.id === e.target.value);
                setFormData((p) => ({
                  ...p,
                  pipelineId: e.target.value,
                  currentStageId: pipe?.stages?.[0]?.id || '',
                }));
              }}
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
            >
              {pipelines.map((pipe) => (
                <option key={pipe.id} value={pipe.id}>
                  {pipe.pipelineName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
              Sales Stage *
            </label>
            <select
              name="currentStageId"
              required
              value={formData.currentStageId}
              onChange={handleChange}
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
            >
              {stages.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.stageName} ({st.winProbabilityPct || 0}%)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
              Estimated Deal Value (₹) *
            </label>
            <input
              type="number"
              min="0"
              name="dealValue"
              required
              value={formData.dealValue}
              onChange={handleChange}
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
              Expected Closing Date
            </label>
            <input
              type="date"
              name="expectedCloseDate"
              value={formData.expectedCloseDate}
              onChange={handleChange}
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
          </div>
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
            className="btn-primary text-xs px-4 py-1.5"
          >
            {isLoading ? 'Creating...' : 'Create Opportunity'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

