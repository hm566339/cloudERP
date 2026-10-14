import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  X,
  RefreshCw,
  AlertTriangle,
  Info,
  Building2,
  Sparkles,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  createSubscriptionPlan,
  updateSubscriptionPlan,
} from '../../api/sso/subscriptionPlan.api';
import { addAlert } from '../../features/notifications/notificationSlice';
import { getSafeErrorMessage } from '../../utils/apiErrorHelper';
import {
  normalizePlanCode,
  validatePlanFormData,
  preparePlanPayload,
} from '../../utils/subscriptionPlanHelper';
import ModuleSelector from './ModuleSelector';

const initialFormState = {
  code: '',
  name: '',
  description: '',
  durationDays: 30,
  price: 0,
  currency: 'INR',
  active: true,
  isTrial: false,
  isUnlimitedCompanies: false,
  maxCompanies: 4,
  isUnlimitedUsers: false,
  maxUsersPerCompany: 10,
  moduleIds: [],
};

export default function PlanFormModal({
  isOpen,
  editingPlan,
  availableModules = [],
  onClose,
  onSuccess,
}) {
  const dispatch = useDispatch();

  const [formData, setFormData] = useState(initialFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [formValidationErrors, setFormValidationErrors] = useState({});
  const [serverFormError, setServerFormError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    setServerFormError(null);
    setFormValidationErrors({});

    if (editingPlan) {
      const selectedModIds = (editingPlan.modules || [])
        .filter((m) => m.active !== false)
        .map((m) => m.moduleId || m.id)
        .filter(Boolean);

      const isUnlimitedComp = editingPlan.maxCompanies === null || editingPlan.maxCompanies === undefined;
      const isUnlimitedUsers = editingPlan.maxUsersPerCompany === null || editingPlan.maxUsersPerCompany === undefined;

      setFormData({
        code: editingPlan.code || '',
        name: editingPlan.name || '',
        description: editingPlan.description || '',
        durationDays: editingPlan.durationDays ?? 30,
        price: editingPlan.price ?? 0,
        currency: editingPlan.currency || 'INR',
        active: editingPlan.active !== false,
        isTrial: Boolean(editingPlan.isTrial),
        isUnlimitedCompanies: isUnlimitedComp,
        maxCompanies: isUnlimitedComp ? '' : editingPlan.maxCompanies,
        isUnlimitedUsers: isUnlimitedUsers,
        maxUsersPerCompany: isUnlimitedUsers ? '' : editingPlan.maxUsersPerCompany,
        moduleIds: selectedModIds,
      });
    } else {
      const defaultModIds = availableModules.map((m) => m.id);
      setFormData({
        ...initialFormState,
        moduleIds: defaultModIds,
      });
    }
  }, [isOpen, editingPlan, availableModules]);

  if (!isOpen) return null;

  const handleToggleModule = (moduleId) => {
    setFormData((prev) => {
      const exists = prev.moduleIds.includes(moduleId);
      return {
        ...prev,
        moduleIds: exists
          ? prev.moduleIds.filter((id) => id !== moduleId)
          : [...prev.moduleIds, moduleId],
      };
    });
    if (formValidationErrors.moduleIds) {
      setFormValidationErrors((prev) => ({ ...prev, moduleIds: undefined }));
    }
  };

  const handleSelectAllModules = () => {
    setFormData((prev) => ({ ...prev, moduleIds: availableModules.map((m) => m.id) }));
    if (formValidationErrors.moduleIds) {
      setFormValidationErrors((prev) => ({ ...prev, moduleIds: undefined }));
    }
  };

  const handleClearAllModules = () => {
    setFormData((prev) => ({ ...prev, moduleIds: [] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerFormError(null);

    const validation = validatePlanFormData(formData);
    if (!validation.isValid) {
      setFormValidationErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0];
      dispatch(addAlert({ type: 'error', message: firstError }));
      return;
    }
    setFormValidationErrors({});

    const payload = preparePlanPayload(formData, editingPlan);

    setIsSaving(true);
    try {
      if (editingPlan) {
        await updateSubscriptionPlan(editingPlan.id, payload);
        dispatch(addAlert({ type: 'success', message: `Subscription plan '${payload.name}' updated successfully` }));
      } else {
        await createSubscriptionPlan(payload);
        dispatch(addAlert({ type: 'success', message: `Subscription plan '${payload.name}' created successfully` }));
      }
      onClose();
      onSuccess?.();
    } catch (err) {
      console.error('Error saving subscription plan:', err);
      const safeMsg = getSafeErrorMessage(err, 'Failed to save subscription plan. Please verify requirements and try again.');
      setServerFormError(safeMsg);
      dispatch(addAlert({ type: 'error', message: safeMsg }));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-up my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
          <div>
            <h3 className="text-base font-bold font-display text-zinc-900">
              {editingPlan ? `Edit Subscription Plan: ${editingPlan.name}` : 'Create Subscription Plan'}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Configure plan identity, duration, company & user quotas, and module entitlements.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 rounded-lg p-1.5 hover:bg-zinc-100 transition-colors"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body & Live Preview 2-Column Layout */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Main Form (7 Cols on desktop) */}
          <form id="plan-form" onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
            {serverFormError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertTriangle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                <span>{serverFormError}</span>
              </div>
            )}

            {/* SECTION 1: BASIC INFORMATION */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-zinc-100">
                <Info size={14} className="text-zinc-700" />
                <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Basic Information
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Plan Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        name: val,
                        code: editingPlan ? prev.code : prev.code === '' ? normalizePlanCode(val) : prev.code,
                      }));
                      if (formValidationErrors.name) {
                        setFormValidationErrors((prev) => ({ ...prev, name: undefined }));
                      }
                    }}
                    placeholder="e.g. 30 Day Free Trial, Pro Plan"
                    className={`w-full px-3 py-2 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 ${
                      formValidationErrors.name ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-300 focus:border-zinc-900'
                    }`}
                  />
                  {formValidationErrors.name && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{formValidationErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Plan Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => {
                      setFormData({ ...formData, code: normalizePlanCode(e.target.value) });
                      if (formValidationErrors.code) {
                        setFormValidationErrors((prev) => ({ ...prev, code: undefined }));
                      }
                    }}
                    placeholder="e.g. 30_DAY_FREE_TRIAL"
                    className={`w-full px-3 py-2 border rounded-xl text-xs sm:text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-zinc-900/10 ${
                      formValidationErrors.code ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-300 focus:border-zinc-900'
                    }`}
                  />
                  {formValidationErrors.code && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{formValidationErrors.code}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summary of modules and entitlements included in this tier..."
                  className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Duration (Days) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={formData.durationDays}
                    onChange={(e) => {
                      setFormData({ ...formData, durationDays: e.target.value });
                      if (formValidationErrors.durationDays) {
                        setFormValidationErrors((prev) => ({ ...prev, durationDays: undefined }));
                      }
                    }}
                    placeholder="30"
                    className={`w-full px-3 py-2 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 ${
                      formValidationErrors.durationDays ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-300 focus:border-zinc-900'
                    }`}
                  />
                  {formValidationErrors.durationDays && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{formValidationErrors.durationDays}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-700 select-none">
                  <input
                    type="checkbox"
                    checked={formData.isTrial}
                    onChange={(e) => setFormData({ ...formData, isTrial: e.target.checked })}
                    className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-zinc-900 accent-zinc-900"
                  />
                  <span>Is Free Trial Tier</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-700 select-none">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-zinc-900 accent-zinc-900"
                  />
                  <span>Active</span>
                </label>
              </div>
            </div>

            {/* SECTION 2: LIMITS / RULES */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-zinc-700" />
                  <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                    Plan Limits & Quotas
                  </h4>
                </div>
                <span className="text-[10.5px] font-medium text-zinc-400">
                  NULL in backend = Unlimited
                </span>
              </div>

              {/* 1. Maximum Companies */}
              <div className="p-4 bg-zinc-50/80 rounded-xl border border-zinc-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-zinc-900 block">
                      Maximum Companies
                    </label>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Maximum number of active companies allowed for this organization.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-semibold text-zinc-700 bg-white p-1 rounded-lg border border-zinc-200 shadow-2xs">
                    <label className="flex items-center gap-1.5 cursor-pointer px-2 py-0.5 rounded select-none">
                      <input
                        type="radio"
                        name="company-limit-mode"
                        checked={!formData.isUnlimitedCompanies}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            isUnlimitedCompanies: false,
                            maxCompanies: prev.maxCompanies || 4,
                          }));
                        }}
                        className="text-zinc-900 focus:ring-zinc-900 accent-zinc-900"
                      />
                      <span>Limited</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer px-2 py-0.5 rounded select-none">
                      <input
                        type="radio"
                        name="company-limit-mode"
                        checked={formData.isUnlimitedCompanies}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            isUnlimitedCompanies: true,
                          }));
                          if (formValidationErrors.maxCompanies) {
                            setFormValidationErrors((prev) => ({ ...prev, maxCompanies: undefined }));
                          }
                        }}
                        className="text-zinc-900 focus:ring-zinc-900 accent-zinc-900"
                      />
                      <span className="font-bold text-zinc-900">Unlimited</span>
                    </label>
                  </div>
                </div>

                {formData.isUnlimitedCompanies ? (
                  <div className="p-2.5 rounded-lg bg-zinc-100/90 border border-zinc-200 text-zinc-800 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Unlimited active companies allowed. Backend limit check bypassed.</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required={!formData.isUnlimitedCompanies}
                        value={formData.maxCompanies}
                        onChange={(e) => {
                          setFormData({ ...formData, maxCompanies: e.target.value });
                          if (formValidationErrors.maxCompanies) {
                            setFormValidationErrors((prev) => ({ ...prev, maxCompanies: undefined }));
                          }
                        }}
                        placeholder="e.g. 4"
                        className={`w-full px-3 py-2 border rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 ${
                          formValidationErrors.maxCompanies ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-300 focus:border-zinc-900'
                        }`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">
                        companies
                      </span>
                    </div>
                    {formValidationErrors.maxCompanies && (
                      <p className="text-[11px] text-rose-600 font-medium">{formValidationErrors.maxCompanies}</p>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Maximum Users Per Company */}
              <div className="p-4 bg-zinc-50/80 rounded-xl border border-zinc-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-zinc-900 block">
                      Maximum Users Per Company
                    </label>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Maximum number of active users allowed in each company workspace.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-semibold text-zinc-700 bg-white p-1 rounded-lg border border-zinc-200 shadow-2xs">
                    <label className="flex items-center gap-1.5 cursor-pointer px-2 py-0.5 rounded select-none">
                      <input
                        type="radio"
                        name="user-limit-mode"
                        checked={!formData.isUnlimitedUsers}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            isUnlimitedUsers: false,
                            maxUsersPerCompany: prev.maxUsersPerCompany || 10,
                          }));
                        }}
                        className="text-zinc-900 focus:ring-zinc-900 accent-zinc-900"
                      />
                      <span>Limited</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer px-2 py-0.5 rounded select-none">
                      <input
                        type="radio"
                        name="user-limit-mode"
                        checked={formData.isUnlimitedUsers}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            isUnlimitedUsers: true,
                          }));
                          if (formValidationErrors.maxUsersPerCompany) {
                            setFormValidationErrors((prev) => ({ ...prev, maxUsersPerCompany: undefined }));
                          }
                        }}
                        className="text-zinc-900 focus:ring-zinc-900 accent-zinc-900"
                      />
                      <span className="font-bold text-zinc-900">Unlimited</span>
                    </label>
                  </div>
                </div>

                {formData.isUnlimitedUsers ? (
                  <div className="p-2.5 rounded-lg bg-zinc-100/90 border border-zinc-200 text-zinc-800 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Unlimited active users per company allowed.</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required={!formData.isUnlimitedUsers}
                        value={formData.maxUsersPerCompany}
                        onChange={(e) => {
                          setFormData({ ...formData, maxUsersPerCompany: e.target.value });
                          if (formValidationErrors.maxUsersPerCompany) {
                            setFormValidationErrors((prev) => ({ ...prev, maxUsersPerCompany: undefined }));
                          }
                        }}
                        placeholder="e.g. 10"
                        className={`w-full px-3 py-2 border rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 ${
                          formValidationErrors.maxUsersPerCompany ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-300 focus:border-zinc-900'
                        }`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">
                        users/co.
                      </span>
                    </div>
                    {formValidationErrors.maxUsersPerCompany && (
                      <p className="text-[11px] text-rose-600 font-medium">{formValidationErrors.maxUsersPerCompany}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 3: PLAN MODULES */}
            <ModuleSelector
              availableModules={availableModules}
              selectedModuleIds={formData.moduleIds}
              onToggleModule={handleToggleModule}
              onSelectAll={handleSelectAllModules}
              onClearAll={handleClearAllModules}
              error={formValidationErrors.moduleIds}
            />
          </form>

          {/* Right / Live Plan Preview Panel (5 Cols on desktop) */}
          <div className="lg:col-span-5 bg-zinc-50/80 rounded-2xl p-5 border border-zinc-200/80 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60">
                <span className="text-[10.5px] font-extrabold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={12} className="text-zinc-600" />
                  <span>LIVE PREVIEW</span>
                </span>
                <span className="text-[10px] font-semibold text-zinc-400 bg-white px-2 py-0.5 rounded-full border border-zinc-200">
                  UI Preview
                </span>
              </div>

              {/* Card Simulation */}
              <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 tracking-tight">
                      {formData.name || 'Untitled Plan'}
                    </h4>
                    <span className="font-mono text-[10.5px] font-semibold text-zinc-400 uppercase">
                      {formData.code || 'PLAN_CODE'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black text-zinc-900 font-mono">
                      {formData.price > 0
                        ? `${formData.currency === 'INR' ? '₹' : formData.currency + ' '}${Number(formData.price).toLocaleString('en-IN')}`
                        : 'Free'}
                    </div>
                    <span className="text-[10px] text-zinc-400">
                      {formData.durationDays || 30} days
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-500 line-clamp-2">
                  {formData.description || 'Configured SaaS subscription plan with modular application access.'}
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 text-xs">
                  <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                    <span className="text-[9.5px] font-bold text-zinc-400 uppercase block">Companies</span>
                    <span className="font-bold text-zinc-900">
                      {formData.isUnlimitedCompanies ? 'Unlimited' : `${formData.maxCompanies || 0}`}
                    </span>
                  </div>
                  <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                    <span className="text-[9.5px] font-bold text-zinc-400 uppercase block">Users/Co.</span>
                    <span className="font-bold text-zinc-900">
                      {formData.isUnlimitedUsers ? 'Unlimited' : `${formData.maxUsersPerCompany || 0}`}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                    Modules ({formData.moduleIds.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {formData.moduleIds.slice(0, 6).map((id) => {
                      const m = availableModules.find((mod) => mod.id === id);
                      return (
                        <span key={id} className="text-[9.5px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800 font-medium border border-zinc-200/60">
                          {m?.name || 'MOD'}
                        </span>
                      );
                    })}
                    {formData.moduleIds.length > 6 && (
                      <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-semibold">
                        +{formData.moduleIds.length - 6} more
                      </span>
                    )}
                    {formData.moduleIds.length === 0 && (
                      <span className="text-[10.5px] text-rose-500 italic">No modules selected</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-zinc-200/70 text-[11px] text-zinc-500 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-zinc-700">
                <HelpCircle size={13} className="text-zinc-600" />
                <span>Contract Notes</span>
              </div>
              <p className="leading-relaxed">
                Limits are submitted directly to the backend subscription service. Unlimited limits are sent as <code>null</code>.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 border border-zinc-200 hover:bg-zinc-100 rounded-xl text-xs font-semibold text-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="plan-form"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            {isSaving ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : editingPlan ? (
              'Update Plan'
            ) : (
              'Create Plan'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
