import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layers, Plus, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';
import { PageHeader } from '../../../components/common';
import { useGetCrmPipelinesQuery } from '../../../api/sales-crm/crm.api';
import PipelineFormModal from '../components/PipelineFormModal';

export default function PipelinesPage() {
  const { companyId } = useParams();
  const navigate = useNavigate();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: pipelinesRes, isLoading, refetch } = useGetCrmPipelinesQuery(companyId);
  const pipelines = pipelinesRes?.data || [];

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/sales-crm/opportunities')}
          className="p-1.5 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] text-zinc-600 dark:text-[#A0A6B5] hover:bg-zinc-100 dark:hover:bg-[#1C202B]"
        >
          <ArrowLeft size={14} />
        </button>
        <span className="text-xs text-zinc-500">Back to Opportunities Board</span>
      </div>

      <PageHeader
        title="Sales Pipelines & Stage Progression"
        subtitle="Configure deal progression funnels, probability weights, and stage sequences."
        actions={
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5"
          >
            <Plus size={14} /> New Pipeline
          </button>
        }
      />

      <div className="space-y-4">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-zinc-400">Loading pipelines...</div>
        ) : pipelines.length === 0 ? (
          <div className="p-10 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl text-center space-y-2">
            <Layers size={32} className="mx-auto text-zinc-400" />
            <p className="text-sm font-semibold text-zinc-700 dark:text-[#E6E8EE]">No pipelines configured</p>
            <button onClick={() => setIsCreateOpen(true)} className="btn-primary text-xs px-3 py-1.5">
              Create First Pipeline
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

