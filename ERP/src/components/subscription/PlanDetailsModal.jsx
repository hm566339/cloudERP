import React from 'react';
import {
  X,
  Check,
  Building2,
  Edit2,
  CreditCard,
} from 'lucide-react';
import { formatPlanLimit } from '../../utils/subscriptionPlanHelper';
import { isCurrentPlan } from '../../utils/subscriptionCheckoutHelper';
import {
  getPlanIcon,
  getPlanIconStyle,
  formatPlanPrice,
} from './planUiUtils';

export default function PlanDetailsModal({
  isOpen,
  plan,
  effectiveActiveSub,
  canManageCatalog,
  canUpgradeSubscription,
  onClose,
  onEdit,
  onSubscribe,
}) {
  if (!isOpen || !plan) return null;

  const Icon = getPlanIcon(plan);
  const iconStyle = getPlanIconStyle(plan);
  const activeModules = (plan.modules || []).filter((m) => m.active !== false);
  const isCurrent = isCurrentPlan(plan, effectiveActiveSub);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconStyle}`}>
              <Icon size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-zinc-900">
                {plan.name}
              </h3>
              <span className="font-mono text-[11px] font-semibold text-zinc-400 uppercase">
                {plan.code}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 rounded-lg p-1.5 hover:bg-zinc-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-zinc-700">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Description
            </span>
            <p className="text-zinc-700 leading-relaxed bg-zinc-50 p-3 rounded-xl border border-zinc-100">
              {plan.description || 'No detailed description provided.'}
            </p>
          </div>

          {/* Key Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-0.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block">Duration</span>
              <span className="text-sm font-bold text-zinc-900">{plan.durationDays || 30} Days</span>
            </div>
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-0.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block">Price</span>
              <span className="text-sm font-bold text-zinc-900 font-mono">{formatPlanPrice(plan)}</span>
            </div>
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-0.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase block">Status</span>
              <span className={`inline-flex items-center gap-1 font-bold ${plan.active ? 'text-emerald-700' : 'text-zinc-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${plan.active ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                <span>{plan.active ? 'Active' : 'Inactive'}</span>
              </span>
            </div>
          </div>

          {/* Rules & Limits Breakdown */}
          <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-3">
            <div className="text-[11px] font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 size={13} className="text-zinc-700" />
              <span>Enforced Limits</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10.5px] font-semibold text-zinc-500 block">Companies Quota</span>
                <span className="text-sm font-black text-zinc-900">
                  {formatPlanLimit(plan.maxCompanies, 'companies')}
                </span>
              </div>
              <div>
                <span className="text-[10.5px] font-semibold text-zinc-500 block">Users / Company Quota</span>
                <span className="text-sm font-black text-zinc-900">
                  {formatPlanLimit(plan.maxUsersPerCompany, 'users')}
                </span>
              </div>
            </div>
          </div>

          {/* Modules List */}
          <div className="space-y-2">
            <span className="text-[10.5px] font-bold text-zinc-400 uppercase tracking-wider block">
              Entitled Modules ({activeModules.length})
            </span>
            <div className="grid grid-cols-2 gap-2">
              {activeModules.map((m, idx) => (
                <div
                  key={m.id || idx}
                  className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-800"
                >
                  <Check size={12} className="text-zinc-700 stroke-[3]" />
                  <span className="truncate">{m.moduleName || 'Module'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
          <div>
            {canManageCatalog ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(plan);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-700 hover:text-zinc-900"
              >
                <Edit2 size={13} />
                <span>Edit This Plan</span>
              </button>
            ) : canUpgradeSubscription && !isCurrent ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSubscribe(plan);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-700 hover:text-zinc-900"
              >
                <CreditCard size={13} />
                <span>Subscribe to This Plan</span>
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
