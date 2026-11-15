import React, { useState } from 'react';
import { Modal } from '../../../components/common';
import { Plus, Trash2, Layers } from 'lucide-react';
import { useCreateCrmPipelineMutation } from '../../../api/sales-crm/crm.api';

const DEFAULT_STAGES = [
  { stageName: 'Prospecting', category: 'LEAD', defaultProbability: 10, displayOrder: 1 },
  { stageName: 'Qualification', category: 'CONTACTED', defaultProbability: 25, displayOrder: 2 },
  { stageName: 'Proposal / Quote', category: 'PROPOSAL', defaultProbability: 50, displayOrder: 3 },
  { stageName: 'Negotiation', category: 'NEGOTIATION', defaultProbability: 75, displayOrder: 4 },
  { stageName: 'Closed Won', category: 'WON', defaultProbability: 100, displayOrder: 5 },
  { stageName: 'Closed Lost', category: 'LOST', defaultProbability: 0, displayOrder: 6 },
];

export default function PipelineFormModal({
  isOpen,
  onClose,
  companyId,
  onSuccess,
}) {
  const [pipelineName, setPipelineName] = useState('');
  const [pipelineCode, setPipelineCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [stages, setStages] = useState(DEFAULT_STAGES);
  const [errorMsg, setErrorMsg] = useState(null);

  const [createPipeline, { isLoading }] = useCreateCrmPipelineMutation();

  const handleStageChange = (index, field, value) => {
    const updated = [...stages];
    updated[index] = { ...updated[index], [field]: value };
    setStages(updated);
  };

  const addStage = () => {
    setStages([
      ...stages,
      {
        stageName: 'New Stage',
        category: 'PROPOSAL',
        defaultProbability: 50,
        displayOrder: stages.length + 1,
      },
    ]);
  };

  const removeStage = (index) => {
    if (stages.length <= 2) {
      setErrorMsg('A pipeline requires at least 2 stages.');
      return;
    }
    const updated = stages.filter((_, i) => i !== index).map((s, i) => ({ ...s, displayOrder: i + 1 }));
    setStages(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pipelineName.trim()) {
      setErrorMsg('Pipeline name is required.');
      return;
    }

    try {
      setErrorMsg(null);
      await createPipeline({
        companyId,
        data: {
          name: pipelineName.trim(),
          code: pipelineCode.trim() || pipelineName.trim().toUpperCase().replace(/\s+/g, '_'),
          isDefault,
          stages,
        },
      }).unwrap();
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMsg(err?.data?.message || err.message || 'Failed to create sales pipeline.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Sales Pipeline"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-400">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
              Pipeline Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Enterprise Sales"
              value={pipelineName}
              onChange={(e) => setPipelineName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
              Pipeline Code
            </label>
            <input
              type="text"
              placeholder="e.g. ENTERPRISE_B2B"
              value={pipelineCode}
              onChange={(e) => setPipelineCode(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white uppercase focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isDefaultPipeline"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="rounded border-zinc-300 dark:border-[#2A2F3D] text-primary"
          />
          <label htmlFor="isDefaultPipeline" className="text-xs text-zinc-700 dark:text-[#A0A6B5] cursor-pointer">
            Set as default pipeline for new deals
          </label>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] flex items-center gap-1.5">
              <Layers size={14} /> Pipeline Stages ({stages.length})
            </label>
            <button
              type="button"
              onClick={addStage}
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              <Plus size={13} /> Add Stage
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {stages.map((stg, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg"
              >
                <span className="text-[11px] font-mono font-bold text-zinc-400 w-5">
                  #{idx + 1}
                </span>
                <input
                  type="text"
                  required
                  placeholder="Stage Name"
                  value={stg.stageName}
                  onChange={(e) => handleStageChange(idx, 'stageName', e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs rounded border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1C202B] text-zinc-800 dark:text-[#E6E8EE]"
                />
                <select
                  value={stg.category}
                  onChange={(e) => handleStageChange(idx, 'category', e.target.value)}
                  className="w-32 px-2 py-1.5 text-xs rounded border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1C202B] text-zinc-800 dark:text-[#E6E8EE]"
                >
                  <option value="LEAD">Lead</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="PROPOSAL">Proposal</option>
                  <option value="NEGOTIATION">Negotiation</option>
                  <option value="WON">Won (100%)</option>
                  <option value="LOST">Lost (0%)</option>
                </select>
                <div className="flex items-center gap-1 w-20">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={stg.defaultProbability}
                    onChange={(e) => handleStageChange(idx, 'defaultProbability', Number(e.target.value))}
                    className="w-14 px-2 py-1.5 text-xs rounded border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1C202B] text-zinc-800 dark:text-[#E6E8EE] text-center"
                  />
                  <span className="text-xs text-zinc-500">%</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeStage(idx)}
                  className="p-1.5 text-zinc-400 hover:text-rose-500 transition-colors"
                  title="Remove stage"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
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
            className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5"
          >
            {isLoading ? 'Saving...' : 'Save Pipeline'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

