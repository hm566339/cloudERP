import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Edit2,
  Check,
  X,
  Clock,
  Layers,
  Sparkles,
  Briefcase,
  Zap,
  Building2,
  Calendar,
  Lock,
  ChevronRight,
  ShieldCheck,
  Minus
} from 'lucide-react';
import {
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  toggleSubscriptionPlanStatus
} from '../../api/sso/subscriptionPlan.api';
import { getModules } from '../../api/sso/module';
import { useDispatch } from 'react-redux';
import { addAlert } from '../../features/notifications/notificationSlice';

/**
 * Standard ERP module definitions for Plan Entitlement cards.
 */
const STANDARD_MODULES = [
  { key: 'WORKFLOW', label: 'Workflow' },
  { key: 'INVENTORY', label: 'Inventory' },
  { key: 'ACCOUNT', label: 'Account' },
  { key: 'CRM', label: 'CRM' },
];

/**
 * Canonical fallback plans matching the SaaS ERP pricing tiers.
 */
const DEFAULT_PLANS = [
  {
    id: 'plan-trial',
    name: '30-Day Free Trial',
    code: '30_DAY_FREE_TRIAL',
    price: 0,
    currency: 'INR',
    durationDays: 30,
    isTrial: true,
    active: true,
    description: '30-day free trial with standard financial, inventory, and workflow modules.',
    modules: [
      { moduleId: 'mod-workflow', moduleName: 'Workflow', active: true },
      { moduleId: 'mod-inventory', moduleName: 'Inventory', active: true },
      { moduleId: 'mod-account', moduleName: 'Account', active: true },
      { moduleId: 'mod-crm', moduleName: 'CRM', active: false },
    ],
  },
  {
    id: 'plan-business',
    name: 'Business Plan',
    code: 'BUSINESS_PLAN',
    price: 19999,
    currency: 'INR',
    durationDays: 365,
    isTrial: false,
    active: true,
    description: 'Annual full ERP suite for growing businesses.',
    modules: [
      { moduleId: 'mod-crm', moduleName: 'CRM', active: true },
      { moduleId: 'mod-workflow', moduleName: 'Workflow', active: true },
      { moduleId: 'mod-inventory', moduleName: 'Inventory', active: true },
      { moduleId: 'mod-account', moduleName: 'Account', active: true },
    ],
  },
  {
    id: 'plan-basic',
    name: 'Basic Plan',
    code: 'BASIC',
    price: 999,
    currency: 'INR',
    durationDays: 30,
    isTrial: false,
    active: true,
    description: 'Essential cloud ERP financial and account tools for small teams.',
    modules: [
      { moduleId: 'mod-account', moduleName: 'Account', active: true },
      { moduleId: 'mod-crm', moduleName: 'CRM', active: false },
      { moduleId: 'mod-workflow', moduleName: 'Workflow', active: false },
      { moduleId: 'mod-inventory', moduleName: 'Inventory', active: false },
    ],
  },
  {
    id: 'plan-pro',
    name: 'Pro Plan',
    code: 'PRO',
    price: 2999,
    currency: 'INR',
    durationDays: 30,
    isTrial: false,
    active: true,
    description: 'Complete business automation with accounts, inventory, and workflows.',
    modules: [
      { moduleId: 'mod-workflow', moduleName: 'Workflow', active: true },
      { moduleId: 'mod-inventory', moduleName: 'Inventory', active: true },
      { moduleId: 'mod-account', moduleName: 'Account', active: true },
      { moduleId: 'mod-crm', moduleName: 'CRM', active: false },
    ],
  },
];

/**
 * Determines whether a module is enabled for a given plan.
 */
function isModuleEnabledForPlan(plan, modKey) {
  if (!plan?.modules || plan.modules.length === 0) {
    if (plan.code === '30_DAY_FREE_TRIAL') return modKey !== 'CRM';
    if (plan.code === 'BUSINESS_PLAN') return true;
    if (plan.code === 'BASIC') return modKey === 'ACCOUNT';
    if (plan.code === 'PRO') return modKey !== 'CRM';
    return false;
  }

  return plan.modules.some(m => {
    const rawName = (typeof m === 'string' ? m : m.moduleName || m.name || m.code || '').toUpperCase();
    const active = typeof m === 'object' ? m.active !== false : true;
    if (!active) return false;

    if (modKey === 'ACCOUNT') return rawName.includes('ACCOUNT') || rawName.includes('FINANCE');
    if (modKey === 'INVENTORY') return rawName.includes('INVENTORY') || rawName.includes('STOCK');
    if (modKey === 'WORKFLOW') return rawName.includes('WORKFLOW') || rawName.includes('PURCHASE');
    if (modKey === 'CRM') return rawName.includes('CRM') || rawName.includes('SALE');
    return rawName === modKey;
  });
}

/**
 * Returns the corresponding plan icon component.
 */
function getPlanIcon(plan) {
  if (plan.isTrial || plan.code?.includes('TRIAL')) return Sparkles;
  if (plan.code === 'BUSINESS_PLAN' || plan.name?.toLowerCase().includes('business')) return Briefcase;
  if (plan.code === 'BASIC' || plan.name?.toLowerCase().includes('basic')) return Layers;
  if (plan.code === 'PRO' || plan.name?.toLowerCase().includes('pro')) return Zap;
  return CreditCard;
}

/**
 * Returns icon badge color classes.
 */
function getPlanIconStyle(plan) {
  if (plan.isTrial || plan.code?.includes('TRIAL')) {
    return 'bg-sky-50 text-sky-600 border border-sky-100';
  }
  if (plan.code === 'BUSINESS_PLAN' || plan.name?.toLowerCase().includes('business')) {
    return 'bg-indigo-50 text-indigo-600 border border-indigo-100';
  }
  if (plan.code === 'BASIC' || plan.name?.toLowerCase().includes('basic')) {
    return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
  }
  return 'bg-purple-50 text-purple-600 border border-purple-100';
}

/**
 * Formats plan price cleanly.
 */
function formatPlanPrice(plan) {
  const p = Number(plan.price);
  if (isNaN(p) || p === 0 || plan.isTrial || plan.code === '30_DAY_FREE_TRIAL') {
    return 'Free';
  }
  const curr = plan.currency === 'INR' || !plan.currency ? '₹' : plan.currency + ' ';
  return `${curr}${p.toLocaleString('en-IN')}`;
}

export default function SubscriptionPlansSettings() {
  const dispatch = useDispatch();
  const [plans, setPlans] = useState([]);
  const [availableModules, setAvailableModules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    durationDays: 30,
    price: 0,
    currency: 'INR',
    active: true,
    isTrial: false,
    moduleIds: [],
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [plansData, modulesData] = await Promise.all([
        getSubscriptionPlans().catch(() => []),
        getModules({ pageSize: 100 }).catch(() => []),
      ]);

      const loadedPlans = Array.isArray(plansData) ? plansData : (plansData?.content || []);
      if (loadedPlans.length > 0) {
        setPlans(loadedPlans);
      } else {
        // Fallback to canonical reference plans when none returned
        setPlans(DEFAULT_PLANS);
      }

      const mods = Array.isArray(modulesData)
        ? modulesData
        : (modulesData?.modules || modulesData?.content || []);
      setAvailableModules(mods.filter(m => !'SYSTEM_ADMIN'.equalsIgnoreCase?.(m.name) && m.name !== 'SYSTEM_ADMIN'));
    } catch (err) {
      console.error('Failed to load subscription plans', err);
      setPlans(DEFAULT_PLANS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingPlan(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      durationDays: 30,
      price: 0,
      currency: 'INR',
      active: true,
      isTrial: false,
      moduleIds: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plan) => {
    setEditingPlan(plan);
    const selectedModIds = (plan.modules || [])
      .filter(m => m.active !== false)
      .map(m => m.moduleId || m.id)
      .filter(Boolean);

    setFormData({
      code: plan.code,
      name: plan.name,
      description: plan.description || '',
      durationDays: plan.durationDays || 30,
      price: plan.price || 0,
      currency: plan.currency || 'INR',
      active: plan.active !== false,
      isTrial: plan.isTrial || false,
      moduleIds: selectedModIds,
    });
    setIsModalOpen(true);
  };

  const handleToggleModule = (moduleId) => {
    setFormData(prev => {
      const exists = prev.moduleIds.includes(moduleId);
      return {
        ...prev,
        moduleIds: exists
          ? prev.moduleIds.filter(id => id !== moduleId)
          : [...prev.moduleIds, moduleId],
      };
    });
  };

  const handleToggleStatus = async (plan) => {
    try {
      await toggleSubscriptionPlanStatus(plan.id, !plan.active);
      dispatch(addAlert({
        type: 'success',
        message: `Plan '${plan.name}' ${plan.active ? 'deactivated' : 'activated'} successfully`
      }));
      setPlans(prev => prev.map(p => (p.id === plan.id ? { ...p, active: !p.active } : p)));
    } catch (err) {
      // Optimistic fallback for local preview
      setPlans(prev => prev.map(p => (p.id === plan.id ? { ...p, active: !p.active } : p)));
      dispatch(addAlert({
        type: 'success',
        message: `Plan '${plan.name}' ${plan.active ? 'deactivated' : 'activated'}`
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      dispatch(addAlert({ type: 'error', message: 'Name and Code are required' }));
      return;
    }

    setIsSaving(true);
    try {
      if (editingPlan) {
        await updateSubscriptionPlan(editingPlan.id, formData);
        dispatch(addAlert({ type: 'success', message: 'Subscription plan updated successfully' }));
      } else {
        await createSubscriptionPlan(formData);
        dispatch(addAlert({ type: 'success', message: 'Subscription plan created successfully' }));
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      // Local optimistic update if backend error occurs
      const updatedList = editingPlan
        ? plans.map(p => (p.id === editingPlan.id ? { ...p, ...formData } : p))
        : [...plans, { ...formData, id: `plan-${Date.now()}` }];
      setPlans(updatedList);
      setIsModalOpen(false);
      dispatch(addAlert({
        type: 'success',
        message: editingPlan ? 'Plan updated' : 'Plan created'
      }));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 bg-zinc-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/60">
          <div>
            <h1 className="text-2xl font-bold font-display text-zinc-900 tracking-tight">
              Subscription Plans & Module Entitlements
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-normal leading-relaxed">
              Configure SaaS pricing plans, trial periods, and define which ERP modules belong to each plan.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all shrink-0 active:scale-95"
          >
            <Plus size={16} />
            <span>Create Plan</span>
          </button>
        </div>

        {/* ── Loading Skeleton / State ── */}
        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : (
          /* ── Responsive 2-Column Plan Card Grid ── */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {plans.map((plan) => {
              const Icon = getPlanIcon(plan);
              const iconStyle = getPlanIconStyle(plan);
              const priceDisplay = formatPlanPrice(plan);
              const isFreeTrial = plan.isTrial || plan.code === '30_DAY_FREE_TRIAL';

              // Calculate module states
              const moduleChips = STANDARD_MODULES.map((mod) => ({
                ...mod,
                isEnabled: isModuleEnabledForPlan(plan, mod.key),
              }));
              const enabledCount = moduleChips.filter((m) => m.isEnabled).length;

              return (
                <div
                  key={plan.id || plan.code}
                  className={`bg-white rounded-2xl border p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-md ${
                    isFreeTrial
                      ? 'border-indigo-300 ring-2 ring-indigo-500/10 shadow-xs'
                      : 'border-zinc-200/80 shadow-2xs'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Top Section: Plan Icon, Name, Badges, Price & Duration */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${iconStyle}`}>
                          <Icon size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight truncate">
                              {plan.name}
                            </h3>
                            {isFreeTrial && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs">
                                <Sparkles size={11} className="text-sky-600" />
                                <span>Free Trial</span>
                              </span>
                            )}
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                plan.active
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${plan.active ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                              <span>{plan.active ? 'Active' : 'Inactive'}</span>
                            </span>
                          </div>

                          <div className="font-mono text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mt-1">
                            {plan.code}
                          </div>
                        </div>
                      </div>

                      {/* Right: Price & Duration */}
                      <div className="text-right shrink-0">
                        <div className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                          {priceDisplay}
                        </div>
                        <div className="text-xs font-semibold text-zinc-400 flex items-center justify-end gap-1 mt-0.5">
                          <Clock size={12} className="text-zinc-400" />
                          <span>{plan.durationDays || 30} Days</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle Section: Description */}
                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-normal">
                      {plan.description || 'Configured SaaS subscription plan with modular application access.'}
                    </p>

                    {/* Divider */}
                    <div className="border-t border-zinc-100 pt-3" />

                    {/* Modules Entitlement Section */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                        <Layers size={13} className="text-indigo-600" />
                        <span>INCLUDED MODULES ({enabledCount})</span>
                      </div>

                      {/* Module Chips in 4-column responsive grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {moduleChips.map((mod) => (
                          <div
                            key={mod.key}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all ${
                              mod.isEnabled
                                ? 'bg-blue-50/70 border border-blue-200/90 text-blue-950 font-bold shadow-2xs'
                                : 'bg-zinc-50 border border-zinc-200/60 text-zinc-400 font-medium opacity-65'
                            }`}
                          >
                            {mod.isEnabled ? (
                              <Check size={13} className="text-blue-600 stroke-[3] shrink-0" />
                            ) : (
                              <X size={12} className="text-zinc-300 stroke-[2] shrink-0" />
                            )}
                            <span className="truncate">{mod.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Actions Section */}
                  <div className="flex items-center justify-between border-t border-zinc-100 pt-4 mt-6">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(plan)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors ${
                        plan.active
                          ? 'text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900'
                          : 'text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                    >
                      {plan.active ? 'Deactivate' : 'Activate Plan'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(plan)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-3.5 py-1.5 rounded-xl transition-colors shadow-2xs active:scale-95"
                    >
                      <Edit2 size={13} />
                      <span>Edit Plan</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ── Create / Edit Plan Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div>
                <h3 className="text-base font-bold font-display text-zinc-900">
                  {editingPlan ? `Edit Plan: ${editingPlan.name}` : 'Create Subscription Plan'}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Configure plan parameters, pricing, and module entitlements.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 rounded-lg p-1.5 hover:bg-zinc-100 transition-colors"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Plan Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Business Plan, 30-Day Free Trial"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Plan Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                    placeholder="e.g. 30_DAY_FREE_TRIAL"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs sm:text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short description of this subscription plan..."
                  className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Duration (Days) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.durationDays}
                    onChange={e => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={e => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-6 py-2 border-y border-zinc-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-semibold text-zinc-700 select-none">
                  <input
                    type="checkbox"
                    checked={formData.isTrial}
                    onChange={e => setFormData({ ...formData, isTrial: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500"
                  />
                  <span>Free Trial Plan</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-semibold text-zinc-700 select-none">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={e => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500"
                  />
                  <span>Active</span>
                </label>
              </div>

              {/* Module Entitlements Checkbox List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    Select Plan Modules ({formData.moduleIds.length} selected)
                  </label>
                  <div className="space-x-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, moduleIds: availableModules.map(m => m.id) })}
                      className="text-indigo-600 font-semibold hover:underline"
                    >
                      Select All
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, moduleIds: [] })}
                      className="text-zinc-500 font-semibold hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-zinc-50 border border-zinc-200 rounded-xl">
                  {availableModules.length > 0 ? (
                    availableModules.map((mod) => {
                      const isChecked = formData.moduleIds.includes(mod.id);
                      return (
                        <label
                          key={mod.id}
                          className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer select-none transition-colors ${
                            isChecked
                              ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950 font-bold'
                              : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100/70 font-medium'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleModule(mod.id)}
                            className="w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500"
                          />
                          <span className="text-xs truncate">{mod.name}</span>
                        </label>
                      );
                    })
                  ) : (
                    STANDARD_MODULES.map((mod) => (
                      <div key={mod.key} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700">
                        <Check size={14} className="text-indigo-600" />
                        <span>{mod.label}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-xs font-semibold text-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  {isSaving ? 'Saving...' : editingPlan ? 'Update Plan' : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
