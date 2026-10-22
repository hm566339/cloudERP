import React from 'react';
import {
  Check,
  Sparkles,
  Clock,
  Building2,
  Users,
  Layers,
  Eye,
  Edit2,
  CheckCircle2,
  CreditCard,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { formatPlanLimit } from '../../utils/subscriptionPlanHelper';
import { isCurrentPlan } from '../../utils/subscriptionCheckoutHelper';
import {
  getPlanIcon,
  getPlanIconStyle,
  formatPlanPrice,
} from './planUiUtils';

export default function PlanCard({
  plan,
  effectiveActiveSub,
  canManageCatalog,
  canUpgradeSubscription,
  onToggleStatus,
  onOpenDetails,
  onOpenEdit,
  onCheckout,
  onDelete,
}) {
  const Icon = getPlanIcon(plan);
  const iconStyle = getPlanIconStyle(plan);
  const priceDisplay = formatPlanPrice(plan);
  const isFreeTrial = plan.isTrial || plan.code === '30_DAY_FREE_TRIAL';
  const isCurrent = isCurrentPlan(plan, effectiveActiveSub);

  const activeModulesList = (plan.modules || []).filter((m) => m.active !== false);

  return (
    <div
      className={`bg-white dark:bg-[#161922] rounded-2xl border p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-md ${
        isCurrent
          ? 'border-emerald-300 dark:border-emerald-500/50 ring-2 ring-emerald-500/15 shadow-xs'
          : 'border-zinc-200/80 dark:border-[#2A2F3D] shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-600'
      }`}
    >
      <div className="space-y-4">
        {/* Top: Icon, Name, Code, Badges, Price */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${iconStyle}`}>
              <Icon size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
                  {plan.name}
                </h3>
                {isCurrent && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shadow-2xs">
                    <Check size={11} className="text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                    <span>Current Plan</span>
                  </span>
                )}
                {isFreeTrial && !isCurrent && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shadow-2xs">
                    <Sparkles size={11} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Free Trial</span>
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    plan.active
                      ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${plan.active ? 'bg-emerald-500' : 'bg-zinc-400 dark:bg-zinc-500'}`} />
                  <span>{plan.active ? 'Active' : 'Inactive'}</span>
                </span>
              </div>

              <div className="font-mono text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1">
                {plan.code}
              </div>
            </div>
          </div>

          {/* Right: Price & Duration */}
          <div className="text-right shrink-0">
            <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              {priceDisplay}
            </div>
            <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 flex items-center justify-end gap-1 mt-0.5">
              <Clock size={12} className="text-zinc-400 dark:text-zinc-500" />
              <span>{plan.durationDays || 30} Days</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal min-h-[36px]">
          {plan.description || 'Configured SaaS subscription plan with quota limits and modular access.'}
        </p>

        {/* ── PLAN RULES & LIMITS HIGHLIGHT BAR ── */}
        <div className="bg-zinc-50/80 dark:bg-[#1D212C] rounded-xl p-3 border border-zinc-200/60 dark:border-[#2A2F3D] grid grid-cols-2 gap-3 text-xs">
          {/* Max Companies Quota */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-[10.5px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              <Building2 size={12} className="text-zinc-700 dark:text-zinc-300" />
              <span>Companies Limit</span>
            </div>
            <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
              {formatPlanLimit(plan.maxCompanies, 'companies')}
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
              {plan.maxCompanies === null || plan.maxCompanies === undefined
                ? 'No limit configured'
                : 'Active organizations'}
            </p>
          </div>

          {/* Max Users / Company Quota */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-[10.5px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              <Users size={12} className="text-zinc-700 dark:text-zinc-300" />
              <span>Users / Company</span>
            </div>
            <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
              {formatPlanLimit(plan.maxUsersPerCompany, 'users')}
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
              {plan.maxUsersPerCompany === null || plan.maxUsersPerCompany === undefined
                ? 'No limit configured'
                : 'Per legal company'}
            </p>
          </div>
        </div>

        {/* ── Modules Entitlement Section ── */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Layers size={13} className="text-zinc-700 dark:text-zinc-300" />
              <span>INCLUDED MODULES ({activeModulesList.length})</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {activeModulesList.length > 0 ? (
              activeModulesList.map((m, idx) => (
                <span
                  key={m.moduleId || m.id || idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-100/90 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 shadow-2xs"
                >
                  <Check size={11} className="text-zinc-700 dark:text-zinc-300 stroke-[2.5]" />
                  <span>{m.moduleName || m.name || 'Module'}</span>
                </span>
              ))
            ) : (
              <span className="text-xs text-zinc-400 dark:text-zinc-500 italic">No modules assigned</span>
            )}
          </div>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="flex items-center justify-between border-t border-zinc-100 dark:border-[#2A2F3D] pt-4 mt-6">
        {canManageCatalog ? (
          <button
            type="button"
            onClick={() => onToggleStatus(plan)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors ${
              plan.active
                ? 'text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-[#2A2F3D] hover:bg-zinc-50 dark:hover:bg-[#1D212C] hover:text-zinc-900 dark:hover:text-zinc-100'
                : 'text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25'
            }`}
          >
            {plan.active ? 'Deactivate' : 'Activate Plan'}
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenDetails(plan)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-[#2A2F3D] hover:bg-zinc-50 dark:hover:bg-[#1D212C] px-3 py-1.5 rounded-xl transition-colors shadow-2xs"
          >
            <Eye size={13} />
            <span>Details</span>
          </button>

          {canManageCatalog && (
            <button
              type="button"
              onClick={() => onOpenEdit(plan)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 border border-zinc-200/80 dark:border-zinc-700 px-3.5 py-1.5 rounded-xl transition-colors shadow-2xs active:scale-95"
            >
              <Edit2 size={13} />
              <span>Edit</span>
            </button>
          )}

          {canManageCatalog && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(plan)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/15 border border-rose-200/80 dark:border-rose-500/30 px-3 py-1.5 rounded-xl transition-colors shadow-2xs active:scale-95"
              title="Deactivate and remove plan from catalog"
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>
          )}

          {/* Upgrade / Choose Plan Button for Owner / Subscriber */}
          {canUpgradeSubscription && !canManageCatalog && (
            isCurrent ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/80 dark:border-emerald-500/30 px-3.5 py-1.5 rounded-xl shadow-2xs cursor-default">
                <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span>Current Plan</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onCheckout(plan)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-zinc-900 dark:bg-blue-600 hover:bg-zinc-800 dark:hover:bg-blue-500 border border-zinc-900 dark:border-blue-600 px-3.5 py-1.5 rounded-xl transition-all shadow-2xs active:scale-95 hover:shadow-xs"
              >
                <CreditCard size={13} />
                <span>{plan.isTrial ? 'Choose Trial' : 'Upgrade Plan'}</span>
                <ArrowRight size={13} />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
