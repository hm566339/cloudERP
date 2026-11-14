import React, { useState } from 'react';
import {
  X, Play, ShieldAlert, CheckCircle2, Building2, AlertTriangle,
  ArrowRight, Check, RefreshCw
} from 'lucide-react';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { platformWorkflowTemplatesApi } from '../../../api/account/workflowDefinitions';

export default function PlatformWorkflowRolloutModal({ isOpen, onClose, template, onSuccess }) {
  const dispatch = useAppDispatch();
  const [rolloutMode, setRolloutMode] = useState('NON_CUSTOMIZED');
  const [propagateToCompanies, setPropagateToCompanies] = useState(true);
  const [forceConfirmed, setForceConfirmed] = useState(false);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen || !template) return null;

  const handleExecute = async () => {
    if (rolloutMode === 'FORCE_ALL' && !forceConfirmed) {
      dispatch(addAlert({ type: 'error', message: 'Please confirm force overwrite by ticking the checkbox' }));
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await platformWorkflowTemplatesApi.rollout(template.id, {
        rolloutMode,
        propagateToCompanies,
        comment: comment.trim() || `Rollout executed for template ${template.templateCode} (v${template.version || 1})`
      });

      setResult(response);
      dispatch(addAlert({ type: 'success', message: 'Rollout executed successfully!' }));
      onSuccess?.();
    } catch (err) {
      dispatch(addAlert({
        type: 'error',
        message: err?.response?.data?.message || err?.message || 'Rollout failed'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#161922] rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-scale-up border border-zinc-200 dark:border-[#2A2F3D] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#11131a]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Play size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-[#E6E8EE]">
                Rollout Workflow Template
              </h2>
              <p className="text-xs text-zinc-500 dark:text-[#A0A6B5]">
                {template.templateName} ({template.templateCode}) • v{template.version || 1}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 dark:text-[#A0A6B5] hover:text-zinc-600 dark:hover:text-[#E6E8EE] hover:bg-zinc-100 dark:hover:bg-[#222736] rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Result Alert if just finished */}
          {result && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                <CheckCircle2 size={18} />
                <span>Rollout Completed Successfully</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                <div className="p-2 rounded bg-white/60 dark:bg-[#161922]/60">
                  <span className="block text-zinc-500 dark:text-[#A0A6B5]">Organizations</span>
                  <span className="font-bold text-base text-zinc-900 dark:text-white">
                    {result.affectedOrganizationsCount ?? 0}
                  </span>
                </div>
                <div className="p-2 rounded bg-white/60 dark:bg-[#161922]/60">
                  <span className="block text-zinc-500 dark:text-[#A0A6B5]">Companies</span>
                  <span className="font-bold text-base text-zinc-900 dark:text-white">
                    {result.affectedCompaniesCount ?? 0}
                  </span>
                </div>
                <div className="p-2 rounded bg-white/60 dark:bg-[#161922]/60">
                  <span className="block text-zinc-500 dark:text-[#A0A6B5]">Status</span>
                  <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 block mt-1">
                    {result.status || 'COMPLETED'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Rollout Mode Selection */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-[#E6E8EE] mb-2 uppercase tracking-wider">
              Select Rollout Scope <span className="text-rose-500">*</span>
            </label>

            <div className="space-y-2.5">
              {/* Option 1: NON_CUSTOMIZED */}
              <div
                onClick={() => setRolloutMode('NON_CUSTOMIZED')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                  rolloutMode === 'NON_CUSTOMIZED'
                    ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 dark:border-indigo-500'
                    : 'border-zinc-200 dark:border-[#2A2F3D] hover:bg-zinc-50 dark:hover:bg-[#1a1e29]'
                }`}
              >
                <div className={`mt-0.5 p-1.5 rounded-lg ${
                  rolloutMode === 'NON_CUSTOMIZED'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                }`}>
                  <CheckCircle2 size={16} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE]">
                      Non-Customized Organizations
                    </span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 font-semibold px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] mt-1">
                    Updates existing organizations using standard defaults. Safely preserves organizations with customized workflow modifications.
                  </p>
                </div>
              </div>

              {/* Option 2: NEW_ORGS_ONLY */}
              <div
                onClick={() => setRolloutMode('NEW_ORGS_ONLY')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                  rolloutMode === 'NEW_ORGS_ONLY'
                    ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 dark:border-indigo-500'
                    : 'border-zinc-200 dark:border-[#2A2F3D] hover:bg-zinc-50 dark:hover:bg-[#1a1e29]'
                }`}
              >
                <div className={`mt-0.5 p-1.5 rounded-lg ${
                  rolloutMode === 'NEW_ORGS_ONLY'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                }`}>
                  <Building2 size={16} />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE]">
                    New Organizations Only
                  </span>
                  <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] mt-1">
                    Only applies to future newly created organizations during signup. Zero disruption to existing organizations.
                  </p>
                </div>
              </div>

              {/* Option 3: FORCE_ALL */}
              <div
                onClick={() => setRolloutMode('FORCE_ALL')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                  rolloutMode === 'FORCE_ALL'
                    ? 'border-rose-600 bg-rose-50/40 dark:bg-rose-950/20 dark:border-rose-500'
                    : 'border-zinc-200 dark:border-[#2A2F3D] hover:bg-zinc-50 dark:hover:bg-[#1a1e29]'
                }`}
              >
                <div className={`mt-0.5 p-1.5 rounded-lg ${
                  rolloutMode === 'FORCE_ALL'
                    ? 'bg-rose-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                }`}>
                  <ShieldAlert size={16} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE]">
                      Force Overwrite All Organizations
                    </span>
                    <span className="text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 font-semibold px-2 py-0.5 rounded-full">
                      Dangerous
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] mt-1">
                    Forces replacement across ALL organizations and their companies, resetting custom stages or approver chains.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Propagate to Companies Toggle */}
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#11131a] border border-zinc-200/60 dark:border-[#2A2F3D]">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={propagateToCompanies}
                onChange={(e) => setPropagateToCompanies(e.target.checked)}
                className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <div>
                <span className="text-xs font-bold text-zinc-800 dark:text-[#E6E8EE] block uppercase tracking-wider">
                  Propagate to Company Instances
                </span>
                <span className="text-xs text-zinc-500 dark:text-[#A0A6B5]">
                  Automatically synchronizes company workflow definitions under eligible organizations.
                </span>
              </div>
            </label>
          </div>

          {/* Force confirmation banner */}
          {rolloutMode === 'FORCE_ALL' && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={18} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed font-medium">
                  <strong>Warning:</strong> Force mode will replace custom approval stages and approver roles configured by organization administrators.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={forceConfirmed}
                  onChange={(e) => setForceConfirmed(e.target.checked)}
                  className="rounded border-rose-400 text-rose-600 focus:ring-rose-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-rose-800 dark:text-rose-300">
                  I understand and wish to proceed with force overwrite
                </span>
              </label>
            </div>
          )}

          {/* Audit comment */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-[#E6E8EE] mb-1.5 uppercase tracking-wider">
              Rollout Audit Note (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="e.g. Scheduled rollout of 2026 fiscal year policy updates..."
              className="input-field text-xs resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-[#2A2F3D] flex justify-end gap-3 bg-white dark:bg-[#161922]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn-secondary"
          >
            {result ? 'Close' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleExecute}
            disabled={isSubmitting || (rolloutMode === 'FORCE_ALL' && !forceConfirmed)}
            className={`btn-primary flex items-center gap-2 ${
              rolloutMode === 'FORCE_ALL' ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-200' : ''
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Executing...</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>{rolloutMode === 'FORCE_ALL' ? 'Force Rollout' : 'Execute Rollout'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

