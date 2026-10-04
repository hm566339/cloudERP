import React, { useState, useEffect } from 'react';
import {
  SettingsLayout,
  SettingsPageHeader,
  SettingsCard
} from '../../components/settings/shared';
import {
  CreditCard,
  Plus,
  Edit2,
  CheckCircle,
  XCircle,
  Clock,
  Check,
  Shield,
  Layers,
  Sparkles,
  AlertCircle
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

export default function SubscriptionPlansSettings() {
  const dispatch = useDispatch();
  const [plans, setPlans] = useState([]);
  const [availableModules, setAvailableModules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    durationDays: 30,
    price: 0,
    currency: 'INR',
    active: true,
    isTrial: false,
    moduleIds: []
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [plansData, modulesData] = await Promise.all([
        getSubscriptionPlans(),
        getModules({ pageSize: 100 })
      ]);
      setPlans(Array.isArray(plansData) ? plansData : []);
      const mods = Array.isArray(modulesData)
        ? modulesData
        : (modulesData?.modules || modulesData?.content || []);
      // Filter out SYSTEM_ADMIN
      setAvailableModules(mods.filter(m => !'SYSTEM_ADMIN'.equalsIgnoreCase?.(m.name) && m.name !== 'SYSTEM_ADMIN'));
    } catch (err) {
      console.error('Failed to load subscription plans or modules', err);
      dispatch(addAlert({ type: 'error', message: 'Failed to load subscription plans' }));
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
      moduleIds: []
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plan) => {
    setEditingPlan(plan);
    const selectedModIds = (plan.modules || [])
      .filter(m => m.active !== false)
      .map(m => m.moduleId);
    setFormData({
      code: plan.code,
      name: plan.name,
      description: plan.description || '',
      durationDays: plan.durationDays || 30,
      price: plan.price || 0,
      currency: plan.currency || 'INR',
      active: plan.active !== false,
      isTrial: plan.isTrial || false,
      moduleIds: selectedModIds
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
          : [...prev.moduleIds, moduleId]
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
      fetchData();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: 'Failed to update plan status' }));
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
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to save subscription plan';
      dispatch(addAlert({ type: 'error', message: errMsg }));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 relative">
      <div className="flex-1 overflow-y-auto">
        <SettingsLayout>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <SettingsPageHeader
              title="Subscription Plans & Module Entitlements"
              description="Configure SaaS pricing plans, trial periods, and define which ERP modules belong to each plan."
            />
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors whitespace-nowrap"
            >
              <Plus size={16} /> Create Plan
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-zinc-200 p-8 shadow-sm">
              <CreditCard className="mx-auto text-zinc-300 mb-3" size={40} />
              <h3 className="text-base font-semibold text-zinc-800">No subscription plans found</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Create your first plan to start managing module entitlements and automatic company provisioning.
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
              >
                <Plus size={16} /> Create Plan
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {plans.map(plan => {
                  const planModuleNames = (plan.modules || [])
                    .filter(m => m.active !== false)
                    .map(m => m.moduleName?.toUpperCase());

                  return (
                    <div
                      key={plan.id}
                      className={`bg-white rounded-xl border ${
                        plan.isTrial ? 'border-amber-300 ring-1 ring-amber-200' : 'border-zinc-200'
                      } p-6 shadow-sm flex flex-col justify-between transition-all hover:shadow-md`}
                    >
                      <div>
                        {/* Header Badges */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-lg font-bold text-zinc-900">{plan.name}</h3>
                              {plan.isTrial && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                  <Sparkles size={12} /> Free Trial
                                </span>
                              )}
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  plan.active
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                                }`}
                              >
                                {plan.active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 font-mono mt-0.5">Code: {plan.code}</p>
                          </div>

                          <div className="text-right">
                            <span className="text-xl font-extrabold text-zinc-900">
                              {plan.price === 0 || plan.price === '0' || plan.price === '0.00'
                                ? 'Free'
                                : `${plan.currency === 'INR' ? '₹' : plan.currency} ${Number(plan.price).toLocaleString()}`}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-zinc-500 justify-end mt-0.5">
                              <Clock size={12} /> {plan.durationDays} Days
                            </div>
                          </div>
                        </div>

                        {plan.description && (
                          <p className="text-xs text-zinc-600 mb-4 line-clamp-2">{plan.description}</p>
                        )}

                        <div className="border-t border-zinc-100 my-4"></div>

                        {/* Modules Entitlement Grid */}
                        <div className="space-y-2">
                          <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Layers size={13} className="text-indigo-600" /> Included Modules ({planModuleNames.length})
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                            {availableModules.map(mod => {
                              const isIncluded = planModuleNames.includes(mod.name?.toUpperCase());
                              return (
                                <div
                                  key={mod.id}
                                  className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium border ${
                                    isIncluded
                                      ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
                                      : 'bg-zinc-50 border-zinc-200 text-zinc-400 opacity-60'
                                  }`}
                                >
                                  {isIncluded ? (
                                    <Check size={14} className="text-indigo-600 font-bold shrink-0" />
                                  ) : (
                                    <span className="w-3.5 h-3.5 rounded-full border border-zinc-300 shrink-0 inline-block" />
                                  )}
                                  <span className="truncate">{mod.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between border-t border-zinc-100 pt-4 mt-6">
                        <button
                          onClick={() => handleToggleStatus(plan)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-md border transition-colors ${
                            plan.active
                              ? 'text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                              : 'text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                          }`}
                        >
                          {plan.active ? 'Deactivate' : 'Activate Plan'}
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(plan)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors"
                        >
                          <Edit2 size={13} /> Edit Plan
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </SettingsLayout>
      </div>

      {/* Create / Edit Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">
                  {editingPlan ? `Edit Plan: ${editingPlan.name}` : 'Create Subscription Plan'}
                </h3>
                <p className="text-xs text-zinc-500">
                  Configure plan parameters, pricing, and module entitlements.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 rounded-lg p-1 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Plan Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Business Plan, 30-Day Free Trial"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Plan Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                    placeholder="e.g. 30_DAY_FREE_TRIAL"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short description of this subscription plan..."
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Duration (Days) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.durationDays}
                    onChange={e => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={e => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-6 py-2 border-y border-zinc-100">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-zinc-700 select-none">
                  <input
                    type="checkbox"
                    checked={formData.isTrial}
                    onChange={e => setFormData({ ...formData, isTrial: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500"
                  />
                  <span>Is Free Trial Plan</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-zinc-700 select-none">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={e => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500"
                  />
                  <span>Plan Active</span>
                </label>
              </div>

              {/* Module Checkbox Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    Select Plan Modules ({formData.moduleIds.length} selected)
                  </label>
                  <div className="space-x-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, moduleIds: availableModules.map(m => m.id) })}
                      className="text-indigo-600 hover:underline"
                    >
                      Select All
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, moduleIds: [] })}
                      className="text-zinc-500 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-2 bg-zinc-50 border border-zinc-200 rounded-lg">
                  {availableModules.map(mod => {
                    const isChecked = formData.moduleIds.includes(mod.id);
                    return (
                      <label
                        key={mod.id}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer select-none transition-colors ${
                          isChecked
                            ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950 font-medium'
                            : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleModule(mod.id)}
                          className="w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500"
                        />
                        <div className="truncate">
                          <div className="text-xs font-semibold">{mod.name}</div>
                          {mod.host && <div className="text-[10px] text-zinc-400 font-mono truncate">{mod.host}</div>}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-zinc-300 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
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
