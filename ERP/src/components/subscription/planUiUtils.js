import React from 'react';
import {
  CreditCard,
  Sparkles,
  Briefcase,
  Zap,
  Layers,
} from 'lucide-react';

/**
 * Standard fallback module icons/colors mapping.
 */
export const MODULE_ICON_MAP = {
  ACCOUNT: { label: 'Account & Finance', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  INVENTORY: { label: 'Inventory & Stock', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  CRM: { label: 'Sales & CRM', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  WORKFLOW: { label: 'Workflow & Automation', color: 'bg-purple-50 text-purple-700 border-purple-200' },
};

export function formatModuleName(rawName) {
  if (!rawName) return 'Module';
  const upper = String(rawName).trim().toUpperCase();
  return MODULE_ICON_MAP[upper]?.label || upper.replace(/_/g, ' ');
}

export function getPlanIcon(plan) {
  if (plan?.isTrial || plan?.code?.includes('TRIAL')) return Sparkles;
  if (plan?.code === 'BUSINESS_PLAN' || plan?.name?.toLowerCase().includes('business')) return Briefcase;
  if (plan?.code === 'ENTERPRISE' || plan?.name?.toLowerCase().includes('enterprise')) return Zap;
  if (plan?.code === 'BASIC' || plan?.name?.toLowerCase().includes('basic')) return Layers;
  if (plan?.code === 'PRO' || plan?.name?.toLowerCase().includes('pro')) return Zap;
  return CreditCard;
}

export function getPlanIconStyle(plan) {
  if (plan?.isTrial || plan?.code?.includes('TRIAL')) {
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200/80';
  }
  return 'bg-zinc-100 text-zinc-800 border border-zinc-200/80';
}

export function formatPlanPrice(plan) {
  const p = Number(plan?.price);
  if (isNaN(p) || p === 0 || plan?.isTrial || plan?.code === '30_DAY_FREE_TRIAL') {
    return 'Free';
  }
  const curr = plan?.currency === 'INR' || !plan?.currency ? '₹' : plan?.currency + ' ';
  return `${curr}${p.toLocaleString('en-IN')}`;
}
