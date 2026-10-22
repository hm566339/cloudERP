import React from 'react';
import {
  Check,
  Eye,
  Edit2,
  CreditCard,
  Trash2,
} from 'lucide-react';
import { formatPlanLimit } from '../../utils/subscriptionPlanHelper';
import { isCurrentPlan } from '../../utils/subscriptionCheckoutHelper';
import { formatPlanPrice } from './planUiUtils';

export default function PlanTable({
  plans,
  effectiveActiveSub,
  canManageCatalog,
  canUpgradeSubscription,
  onOpenDetails,
  onOpenEdit,
  onCheckout,
  onDelete,
}) {
  return (
    <div className="bg-white dark:bg-[#161922] rounded-2xl border border-zinc-200/80 dark:border-[#2A2F3D] shadow-2xs overflow-hidden max-w-full min-w-0">
      <div className="overflow-x-auto min-w-0 max-w-full custom-scrollbar">
        <table className="w-full min-w-[760px] text-left border-collapse text-xs md:text-sm" aria-label="Subscription Plans Table">
          <thead>
            <tr className="bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-xs font-semibold text-zinc-600 dark:text-[#A0A6B5] uppercase tracking-wider sticky top-0 z-10">
              <th scope="col" className="py-3.5 px-4">Plan Name</th>
              <th scope="col" className="py-3.5 px-4">Code</th>
              <th scope="col" className="py-3.5 px-4">Duration</th>
              <th scope="col" className="py-3.5 px-4">Max Companies</th>
              <th scope="col" className="py-3.5 px-4">Max Users / Co.</th>
              <th scope="col" className="py-3.5 px-4">Price</th>
              <th scope="col" className="py-3.5 px-4">Modules</th>
              <th scope="col" className="py-3.5 px-4">Status</th>
              <th scope="col" className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D] text-zinc-800 dark:text-[#E6E8EE]">
            {plans.map((plan) => {
              const priceDisplay = formatPlanPrice(plan);
              const activeModulesList = (plan.modules || []).filter((m) => m.active !== false);

              return (
                <tr key={plan.id || plan.code} className="hover:bg-zinc-50/60 dark:hover:bg-[#1D212C]/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-zinc-900 dark:text-[#E6E8EE]">{plan.name}</div>
                    {plan.isTrial && (
                      <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800/50 mt-0.5">
                        Trial
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-zinc-500 dark:text-[#6B7184]">
                    {plan.code}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-zinc-600 dark:text-[#A0A6B5]">
                    {plan.durationDays || 30} days
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-zinc-100 dark:bg-[#1D212C] text-zinc-800 dark:text-[#E6E8EE] border border-zinc-200/60 dark:border-[#2A2F3D]"
                    >
                      {formatPlanLimit(plan.maxCompanies)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-zinc-100 dark:bg-[#1D212C] text-zinc-800 dark:text-[#E6E8EE] border border-zinc-200/60 dark:border-[#2A2F3D]"
                    >
                      {formatPlanLimit(plan.maxUsersPerCompany)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-zinc-900 dark:text-[#E6E8EE]">
                    {priceDisplay}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-zinc-700 dark:text-[#A0A6B5]">
                        {activeModulesList.length} modules
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                        plan.active
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                          : 'bg-zinc-100 dark:bg-[#1D212C] text-zinc-500 dark:text-[#6B7184] border border-zinc-200 dark:border-[#2A2F3D]'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${plan.active ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                      <span>{plan.active ? 'Active' : 'Inactive'}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenDetails(plan)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:text-[#A0A6B5] dark:hover:text-[#E6E8EE] rounded-lg hover:bg-zinc-100 dark:hover:bg-[#1D212C] transition-colors"
                        title="View Plan Details"
                      >
                        <Eye size={14} />
                      </button>
                      {canManageCatalog && (
                        <button
                          type="button"
                          onClick={() => onOpenEdit(plan)}
                          className="p-1.5 text-zinc-600 hover:text-zinc-900 dark:text-[#A0A6B5] dark:hover:text-[#E6E8EE] rounded-lg hover:bg-zinc-100 dark:hover:bg-[#1D212C] transition-colors"
                          title="Edit Plan"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      {canManageCatalog && onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(plan)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Delete / Deactivate Plan"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      {canUpgradeSubscription && !canManageCatalog && (
                        isCurrentPlan(plan, effectiveActiveSub) ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50">
                            <Check size={10} className="text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                            <span>Current</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onCheckout(plan)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-[#4C8DFF] dark:hover:bg-[#3B7AE8] transition-colors shadow-2xs"
                            title="Upgrade to this plan"
                          >
                            <CreditCard size={12} />
                            <span>Upgrade</span>
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
