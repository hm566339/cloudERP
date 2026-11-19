import React, { useState, useEffect, useMemo } from 'react';
import { Modal, FormField, Input, Select, Button } from '../../../components/common';
import {
  useCreateCrmOpportunityMutation,
  useGetCrmPipelinesQuery,
  useGetCrmAccountsQuery,
} from '../../../api/sales-crm/crm.api';

const DEFAULT_STAGES = [
  { id: 'QUALIFICATION', stageName: 'Qualification', winProbabilityPct: 10 },
  { id: 'NEEDS_ANALYSIS', stageName: 'Needs Analysis', winProbabilityPct: 25 },
  { id: 'PROPOSAL', stageName: 'Proposal / Quote', winProbabilityPct: 50 },
  { id: 'NEGOTIATION', stageName: 'Negotiation', winProbabilityPct: 75 },
  { id: 'CLOSED_WON', stageName: 'Closed Won', winProbabilityPct: 100 },
  { id: 'CLOSED_LOST', stageName: 'Closed Lost', winProbabilityPct: 0 },
];

const DEFAULT_PIPELINES = [
  { id: 'STANDARD', pipelineName: 'Standard Sales Pipeline', stages: DEFAULT_STAGES },
];

const EMPTY_ARRAY = [];

const toArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.content)) return res.data.content;
  return EMPTY_ARRAY;
};

export default function OpportunityFormModal({
  isOpen,
  onClose,
  initialStageId = null,
  initialAccountId = null,
  companyId,
  pipelines = EMPTY_ARRAY,
  accounts = EMPTY_ARRAY,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    opportunityName: '',
    pipelineId: '',
    currentStageId: '',
    accountId: initialAccountId || '',
    dealValue: '250000',
    dealType: 'NEW_BUSINESS',
    expectedCloseDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    winProbabilityPct: 30,
    lossReason: '',
    notes: '',
  });

  const { data: fetchedPipelinesRes } = useGetCrmPipelinesQuery(companyId, { skip: !isOpen });
  const { data: fetchedAccountsRes } = useGetCrmAccountsQuery(
    { companyId, page: 0, size: 100 },
    { skip: !isOpen }
  );

  const availablePipelines = useMemo(() => {
    const fromProps = toArray(pipelines);
    if (fromProps.length > 0) return fromProps;
    const fromApi = toArray(fetchedPipelinesRes);
    if (fromApi.length > 0) return fromApi;
    return DEFAULT_PIPELINES;
  }, [pipelines, fetchedPipelinesRes]);

  const availableAccounts = useMemo(() => {
    const fromProps = toArray(accounts);
    if (fromProps.length > 0) return fromProps;
    const fromApi = toArray(fetchedAccountsRes);
    if (fromApi.length > 0) return fromApi;
    return EMPTY_ARRAY;
  }, [accounts, fetchedAccountsRes]);

  const [createOpportunity, { isLoading }] = useCreateCrmOpportunityMutation();

  const selectedPipeline =
    availablePipelines.find((p) => p.id === formData.pipelineId) || availablePipelines[0];
  const stages = selectedPipeline?.stages?.length > 0 ? selectedPipeline.stages : DEFAULT_STAGES;

  useEffect(() => {
    if (!isOpen) return;

    if (availablePipelines.length > 0) {
      const defaultPipeline = availablePipelines[0];
      const defaultStage =
        initialStageId || defaultPipeline.stages?.[0]?.id || DEFAULT_STAGES[0].id;
      setFormData((p) => {
        const nextPipelineId = p.pipelineId || defaultPipeline.id || '';
        const nextStageId = p.currentStageId || defaultStage || '';
        const nextAccountId = p.accountId || initialAccountId || availableAccounts[0]?.id || '';
        if (
          p.pipelineId === nextPipelineId &&
          p.currentStageId === nextStageId &&
          p.accountId === nextAccountId
        ) {
          return p;
        }
        return {
          ...p,
          pipelineId: nextPipelineId,
          currentStageId: nextStageId,
          accountId: nextAccountId,
        };
      });
    }
  }, [availablePipelines, initialStageId, initialAccountId, availableAccounts, isOpen]);

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
        <FormField label="Opportunity / Deal Name" required>
          <Input
            type="text"
            name="opportunityName"
            required
            value={formData.opportunityName}
            onChange={handleChange}
            placeholder="e.g. Enterprise Cloud ERP Implementation"
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Account / Client" required>
            <Select
              name="accountId"
              required
              value={formData.accountId}
              onChange={handleChange}
            >
              <option value="">Select Account...</option>
              {availableAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountName || acc.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Deal Type">
            <Select
              name="dealType"
              value={formData.dealType}
              onChange={handleChange}
            >
              <option value="NEW_BUSINESS">New Business</option>
              <option value="EXPANSION">Expansion / Upsell</option>
              <option value="RENEWAL">Renewal</option>
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Pipeline Funnel">
            <Select
              name="pipelineId"
              value={formData.pipelineId}
              onChange={(e) => {
                const pipe = availablePipelines.find((p) => p.id === e.target.value);
                setFormData((p) => ({
                  ...p,
                  pipelineId: e.target.value,
                  currentStageId: pipe?.stages?.[0]?.id || DEFAULT_STAGES[0].id,
                }));
              }}
            >
              {availablePipelines.map((pipe) => (
                <option key={pipe.id} value={pipe.id}>
                  {pipe.pipelineName}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Sales Stage" required>
            <Select
              name="currentStageId"
              required
              value={formData.currentStageId}
              onChange={handleChange}
            >
              {stages.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.stageName} ({st.winProbabilityPct || 0}%)
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Estimated Deal Value (₹)" required>
            <Input
              type="number"
              min="0"
              name="dealValue"
              required
              value={formData.dealValue}
              onChange={handleChange}
            />
          </FormField>
          <FormField label="Expected Closing Date">
            <Input
              type="date"
              name="expectedCloseDate"
              value={formData.expectedCloseDate}
              onChange={handleChange}
            />
          </FormField>
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
          >
            Create Opportunity
          </Button>
        </div>
      </form>
    </Modal>
  );
}

