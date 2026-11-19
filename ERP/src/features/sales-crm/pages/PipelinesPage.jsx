import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layers, Plus, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';
import PageHeader from '../../../components/common/PageHeader';
import Button from '../../../components/common/Button';
import { useGetCrmPipelinesQuery } from '../../../api/sales-crm/crm.api';
import PipelineFormModal from '../components/PipelineFormModal';

export default function PipelinesPage() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const crmBase = companyId ? `/company/${companyId}/sales-crm` : '/sales-crm';

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.content)) return res.data.content;
    return [];
  };

  const { data: pipelinesRes, isLoading, refetch } = useGetCrmPipelinesQuery(companyId);
  const pipelines = toArray(pipelinesRes);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <PageHeader
        title="Sales Pipelines & Stage Progression"
        description="Configure deal progression funnels, probability weights, and stage sequences"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`${crmBase}/opportunities`)}
            className="btn-secondary flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Opportunities Board</span>
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn-primary flex items-center gap-2 text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Pipeline</span>
          </button>
        </div>
      </PageHeader>

      <div className="flex-1 p-6 overflow-auto flex flex-col space-y-4">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-zinc-400">Loading pipelines...</div>
        ) : pipelines.length === 0 ? (
          <div className="p-12 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl text-center space-y-3">
            <Layers size={36} className="mx-auto text-zinc-400" />
            <p className="text-sm font-semibold text-zinc-700 dark:text-[#E6E8EE]">No pipelines configured</p>
            <p className="text-xs text-zinc-500">Create a sales pipeline to structure stages and probabilities for your deals.</p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="btn-primary inline-flex items-center gap-1.5 text-xs font-semibold"
            >
              <Plus size={13} />
              <span>Create First Pipeline</span>
            </button>
          </div>
        ) : (
          pipelines.map((pipe) => (
            <div
              key={pipe.id}
              className="p-5 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-zinc-900 dark:text-white">{pipe.name}</h2>
                    {pipe.isDefault && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 font-mono">Code: {pipe.code}</p>
                </div>
              </div>

              {/* Stages Ribbon */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {(pipe.stages || []).map((stg, idx) => (
                  <React.Fragment key={stg.id || idx}>
                    <div className="p-2.5 bg-zinc-50 dark:bg-[#1C202B] rounded-lg border border-zinc-200 dark:border-[#2A2F3D] text-xs space-y-0.5 min-w-[130px]">
                      <span className="text-[10px] font-mono font-bold text-zinc-400 block">
                        #{stg.displayOrder || idx + 1}
                      </span>
                      <span className="font-semibold text-zinc-800 dark:text-[#E6E8EE] block truncate">
                        {stg.stageName}
                      </span>
                      <span className="text-[11px] font-mono text-primary font-bold">
                        {stg.defaultProbability}% Prob.
                      </span>
                    </div>
                    {idx < (pipe.stages || []).length - 1 && (
                      <ChevronRight size={14} className="text-zinc-400 shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <PipelineFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        companyId={companyId}
        onSuccess={() => refetch()}
      />
    </div>
  );
}


