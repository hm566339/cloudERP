import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Users,
  Eye,
  LayoutGrid,
  Table as TableIcon,
  Search,
  RefreshCw,
  AlertTriangle,
  Info,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  ArrowRight
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
import { getSafeErrorMessage } from '../../utils/apiErrorHelper';
import {
  formatPlanLimit,
  normalizePlanCode,
  validatePlanFormData,
  preparePlanPayload
} from '../../utils/subscriptionPlanHelper';

/**
 * Standard fallback module icons/colors mapping.
 */
const MODULE_ICON_MAP = {
  ACCOUNT: { label: 'Account & Finance', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  INVENTORY: { label: 'Inventory & Stock', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  CRM: { label: 'Sales & CRM', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  WORKFLOW: { label: 'Workflow & Automation', color: 'bg-purple-50 text-purple-700 border-purple-200' },
};

function formatModuleName(rawName) {
  if (!rawName) return 'Module';
  const upper = String(rawName).trim().toUpperCase();
  return MODULE_ICON_MAP[upper]?.label || upper.replace(/_/g, ' ');
}

function getPlanIcon(plan) {
  if (plan?.isTrial || plan?.code?.includes('TRIAL')) return Sparkles;
  if (plan?.code === 'BUSINESS_PLAN' || plan?.name?.toLowerCase().includes('business')) return Briefcase;
  if (plan?.code === 'ENTERPRISE' || plan?.name?.toLowerCase().includes('enterprise')) return Zap;
  if (plan?.code === 'BASIC' || plan?.name?.toLowerCase().includes('basic')) return Layers;
  if (plan?.code === 'PRO' || plan?.name?.toLowerCase().includes('pro')) return Zap;
  return CreditCard;
}

function getPlanIconStyle(plan) {
  if (plan?.isTrial || plan?.code?.includes('TRIAL')) {
    return 'bg-sky-50 text-sky-600 border border-sky-100';
  }
  if (plan?.code === 'BUSINESS_PLAN' || plan?.name?.toLowerCase().includes('business')) {
    return 'bg-indigo-50 text-indigo-600 border border-indigo-100';
  }
  if (plan?.code === 'BASIC' || plan?.name?.toLowerCase().includes('basic')) {
    return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
  }
  return 'bg-purple-50 text-purple-600 border border-purple-100';
}

function formatPlanPrice(plan) {
  const p = Number(plan?.price);
  if (isNaN(p) || p === 0 || plan?.isTrial || plan?.code === '30_DAY_FREE_TRIAL') {
    return 'Free';
  }
  const curr = plan?.currency === 'INR' || !plan?.currency ? '₹' : plan?.currency + ' ';
  return `${curr}${p.toLocaleString('en-IN')}`;
}

export default function SubscriptionPlansSettings() {
  const dispatch = useDispatch();

  // Page state
  const [plans, setPlans] = useState([]);
  const [availableModules, setAvailableModules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // View preferences
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [viewingPlan, setViewingPlan] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formValidationErrors, setFormValidationErrors] = useState({});
  const [serverFormError, setServerFormError] = useState(null);

  // Create / Edit Form State
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

  const [formData, setFormData] = useState(initialFormState);

  // Fetch plans & modules
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [plansData, modulesData] = await Promise.all([
        getSubscriptionPlans({ active: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE' }),
        getModules({ pageSize: 200, status: true }).catch(() => ({ modules: [] })),
      ]);

      const loadedPlans = Array.isArray(plansData) ? plansData : (plansData?.content || plansData?.data || []);
      setPlans(loadedPlans);

      const mods = Array.isArray(modulesData)
        ? modulesData
        : (modulesData?.modules || modulesData?.content || modulesData?.data || []);
      
      const filteredMods = mods.filter(m => {
        const name = (m.name || '').toUpperCase();
        return name !== 'SYSTEM_ADMIN' && m.moduleStatus !== false;
      });
      setAvailableModules(filteredMods);
    } catch (err) {
      console.error('Failed to load subscription plans', err);
      const msg = getSafeErrorMessage(err, 'Unable to load subscription plans from the server.');
      setErrorMessage(msg);
      dispatch(addAlert({ type: 'error', message: msg }));
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered plans list
  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      if (statusFilter === 'ACTIVE' && !p.active) return false;
      if (statusFilter === 'INACTIVE' && p.active) return false;
      if (searchFilter.trim()) {
        const query = searchFilter.trim().toLowerCase();
        const nameMatch = p.name?.toLowerCase().includes(query);
        const codeMatch = p.code?.toLowerCase().includes(query);
        const descMatch = p.description?.toLowerCase().includes(query);
        return nameMatch || codeMatch || descMatch;
      }
      return true;
    });
  }, [plans, searchFilter, statusFilter]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingPlan(null);
    setServerFormError(null);
    setFormValidationErrors({});
    
    // Default to all active modules pre-selected for convenience
    const defaultModIds = availableModules.map(m => m.id);
    
    setFormData({
      ...initialFormState,
      moduleIds: defaultModIds,
    });
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (plan) => {
    setEditingPlan(plan);
    setServerFormError(null);
    setFormValidationErrors({});

    const selectedModIds = (plan.modules || [])
      .filter(m => m.active !== false)
      .map(m => m.moduleId || m.id)
      .filter(Boolean);

    // Backend NULL represents Unlimited
    const isUnlimitedComp = plan.maxCompanies === null || plan.maxCompanies === undefined;
    const isUnlimitedUsers = plan.maxUsersPerCompany === null || plan.maxUsersPerCompany === undefined;

    setFormData({
      code: plan.code || '',
      name: plan.name || '',
      description: plan.description || '',
      durationDays: plan.durationDays ?? 30,
      price: plan.price ?? 0,
      currency: plan.currency || 'INR',
      active: plan.active !== false,
      isTrial: Boolean(plan.isTrial),
      isUnlimitedCompanies: isUnlimitedComp,
      maxCompanies: isUnlimitedComp ? '' : plan.maxCompanies,
      isUnlimitedUsers: isUnlimitedUsers,
      maxUsersPerCompany: isUnlimitedUsers ? '' : plan.maxUsersPerCompany,
      moduleIds: selectedModIds,
    });
    setIsFormModalOpen(true);
  };

  // Open Details Modal
  const handleOpenDetailsModal = (plan) => {
    setViewingPlan(plan);
    setIsDetailsModalOpen(true);
  };

  // Toggle Module Selection in Form
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
    // Clear module validation error if any
    if (formValidationErrors.moduleIds) {
      setFormValidationErrors(prev => ({ ...prev, moduleIds: undefined }));
    }
  };

  // Select all / clear all modules
  const handleSelectAllModules = () => {
    setFormData(prev => ({ ...prev, moduleIds: availableModules.map(m => m.id) }));
    if (formValidationErrors.moduleIds) {
      setFormValidationErrors(prev => ({ ...prev, moduleIds: undefined }));
    }
  };

  const handleClearAllModules = () => {
    setFormData(prev => ({ ...prev, moduleIds: [] }));
  };

  // Activate / Deactivate plan toggle
  const handleToggleStatus = async (plan) => {
    const newStatus = !plan.active;
    try {
      await toggleSubscriptionPlanStatus(plan.id, newStatus);
      dispatch(addAlert({
        type: 'success',
        message: `Plan '${plan.name}' ${newStatus ? 'activated' : 'deactivated'} successfully`
      }));
      setPlans(prev => prev.map(p => (p.id === plan.id ? { ...p, active: newStatus } : p)));
    } catch (err) {
      const msg = getSafeErrorMessage(err, `Failed to update status for plan '${plan.name}'`);
      dispatch(addAlert({ type: 'error', message: msg }));
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerFormError(null);

    // 1. Frontend validation
    const validation = validatePlanFormData(formData);
    if (!validation.isValid) {
      setFormValidationErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0];
      dispatch(addAlert({ type: 'error', message: firstError }));
      return;
    }
    setFormValidationErrors({});

    // 2. Prepare payload matching backend DTO contract
    const payload = preparePlanPayload(formData, editingPlan);

    // 3. Submit request with double-submission prevention
    setIsSaving(true);
    try {
      if (editingPlan) {
        await updateSubscriptionPlan(editingPlan.id, payload);
        dispatch(addAlert({ type: 'success', message: `Subscription plan '${payload.name}' updated successfully` }));
      } else {
        await createSubscriptionPlan(payload);
        dispatch(addAlert({ type: 'success', message: `Subscription plan '${payload.name}' created successfully` }));
      }
      setIsFormModalOpen(false);
      fetchData();
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
    <div className="flex-1 bg-zinc-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">

        {/* ── Page Header ── */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
              <CreditCard size={14} className="text-indigo-600" />
              <span>Subscription & Licensing Architecture</span>
            </div>
            <h1 className="text-2xl font-bold font-display text-zinc-900 tracking-tight">
              Subscription Plans & Entitlement Rules
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              Configure SaaS subscription tiers, active duration, company and user quotas, and modular access rights.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={fetchData}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
              title="Refresh plans from server"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all shrink-0 active:scale-95"
            >
              <Plus size={15} />
              <span>Create Plan</span>
            </button>
          </div>
        </div>

        {/* ── Filters & View Switcher ── */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search plans by name, code or description..."
              className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 rounded"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl text-xs font-semibold text-zinc-600">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-zinc-900 shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                All ({plans.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('INACTIVE')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === 'INACTIVE'
                    ? 'bg-white text-zinc-700 shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Inactive
              </button>
            </div>

            {/* Grid vs Table View Switcher */}
            <div className="flex items-center border border-zinc-200 rounded-xl p-0.5 bg-zinc-50">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
                title="Grid Card View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
                title="Table View"
              >
                <TableIcon size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Error Banner (if error occurred during load) ── */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 shadow-2xs">
            <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <h4 className="font-bold text-rose-900">Failed to communicate with plan service</h4>
              <p className="mt-0.5 text-rose-800">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={fetchData}
              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Loading Skeleton / Content ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-2xs space-y-4 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-200 rounded-xl" />
                    <div>
                      <div className="h-5 bg-zinc-200 rounded w-36 mb-2" />
                      <div className="h-3 bg-zinc-100 rounded w-24" />
                    </div>
                  </div>
                  <div className="h-6 bg-zinc-200 rounded-full w-20" />
                </div>
                <div className="h-4 bg-zinc-100 rounded w-full" />
                <div className="grid grid-cols-2 gap-3 py-3 border-y border-zinc-100">
                  <div className="h-8 bg-zinc-100 rounded" />
                  <div className="h-8 bg-zinc-100 rounded" />
                </div>
                <div className="h-10 bg-zinc-100 rounded" />
              </div>
            ))}
          </div>
        ) : filteredPlans.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center space-y-4 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
              <Layers size={24} />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-zinc-900">No subscription plans found</h3>
              <p className="text-xs text-zinc-500">
                {searchFilter
                  ? `No subscription plans matching "${searchFilter}". Try adjusting your filters.`
                  : 'Get started by creating your first subscription plan with customized company and user quotas.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Plus size={15} />
              <span>Create First Plan</span>
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* ── GRID CARDS VIEW ── */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPlans.map((plan) => {
              const Icon = getPlanIcon(plan);
              const iconStyle = getPlanIconStyle(plan);
              const priceDisplay = formatPlanPrice(plan);
              const isFreeTrial = plan.isTrial || plan.code === '30_DAY_FREE_TRIAL';

              const activeModulesList = (plan.modules || []).filter(m => m.active !== false);

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
                    {/* Top: Icon, Name, Code, Badges, Price */}
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

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-normal min-h-[36px]">
                      {plan.description || 'Configured SaaS subscription plan with quota limits and modular access.'}
                    </p>

                    {/* ── PLAN RULES & LIMITS HIGHLIGHT BAR ── */}
                    <div className="bg-zinc-50/80 rounded-xl p-3 border border-zinc-200/60 grid grid-cols-2 gap-3 text-xs">
                      {/* Max Companies Quota */}
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-[10.5px] font-bold text-zinc-500 uppercase tracking-wider">
                          <Building2 size={12} className="text-indigo-600" />
                          <span>Companies Limit</span>
                        </div>
                        <div className="text-sm font-extrabold text-zinc-900">
                          {formatPlanLimit(plan.maxCompanies, 'companies')}
                        </div>
                        <p className="text-[10px] text-zinc-400">
                          {plan.maxCompanies === null || plan.maxCompanies === undefined
                            ? 'No limit configured'
                            : 'Active organizations'}
                        </p>
                      </div>

                      {/* Max Users / Company Quota */}
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-[10.5px] font-bold text-zinc-500 uppercase tracking-wider">
                          <Users size={12} className="text-indigo-600" />
                          <span>Users / Company</span>
                        </div>
                        <div className="text-sm font-extrabold text-zinc-900">
                          {formatPlanLimit(plan.maxUsersPerCompany, 'users')}
                        </div>
                        <p className="text-[10px] text-zinc-400">
                          {plan.maxUsersPerCompany === null || plan.maxUsersPerCompany === undefined
                            ? 'No limit configured'
                            : 'Per legal company'}
                        </p>
                      </div>
                    </div>

                    {/* ── Modules Entitlement Section ── */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <Layers size={13} className="text-indigo-600" />
                          <span>INCLUDED MODULES ({activeModulesList.length})</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {activeModulesList.length > 0 ? (
                          activeModulesList.map((m, idx) => (
                            <span
                              key={m.moduleId || m.id || idx}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-50/80 border border-indigo-100 text-indigo-900 shadow-2xs"
                            >
                              <Check size={11} className="text-indigo-600 stroke-[3]" />
                              <span>{m.moduleName || m.name || 'Module'}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-zinc-400 italic">No modules assigned</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
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

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenDetailsModal(plan)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-zinc-900 border border-zinc-200 hover:bg-zinc-50 px-3 py-1.5 rounded-xl transition-colors shadow-2xs"
                      >
                        <Eye size={13} />
                        <span>Details</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(plan)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-3.5 py-1.5 rounded-xl transition-colors shadow-2xs active:scale-95"
                      >
                        <Edit2 size={13} />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── TABLE VIEW ── */
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50/80 border-b border-zinc-200/80 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Plan Name</th>
                    <th className="py-3.5 px-4">Code</th>
                    <th className="py-3.5 px-4">Duration</th>
                    <th className="py-3.5 px-4">Max Companies</th>
                    <th className="py-3.5 px-4">Max Users / Co.</th>
                    <th className="py-3.5 px-4">Price</th>
                    <th className="py-3.5 px-4">Modules</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-800">
                  {filteredPlans.map((plan) => {
                    const priceDisplay = formatPlanPrice(plan);
                    const activeModulesList = (plan.modules || []).filter(m => m.active !== false);

                    return (
                      <tr key={plan.id || plan.code} className="hover:bg-zinc-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-zinc-900">{plan.name}</div>
                          {plan.isTrial && (
                            <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 mt-0.5">
                              Trial
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-zinc-500">
                          {plan.code}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-zinc-600">
                          {plan.durationDays || 30} days
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              plan.maxCompanies === null || plan.maxCompanies === undefined
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-zinc-100 text-zinc-800'
                            }`}
                          >
                            {formatPlanLimit(plan.maxCompanies)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              plan.maxUsersPerCompany === null || plan.maxUsersPerCompany === undefined
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-zinc-100 text-zinc-800'
                            }`}
                          >
                            {formatPlanLimit(plan.maxUsersPerCompany)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-zinc-900">
                          {priceDisplay}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-zinc-700">
                              {activeModulesList.length} modules
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                              plan.active
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
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
                              onClick={() => handleOpenDetailsModal(plan)}
                              className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors"
                              title="View Plan Details"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(plan)}
                              className="p-1.5 text-indigo-600 hover:text-indigo-800 rounded-lg hover:bg-indigo-50 transition-colors"
                              title="Edit Plan"
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ── CREATE / EDIT PLAN MODAL WITH LIVE PREVIEW ── */}
      {isFormModalOpen && (
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
                onClick={() => setIsFormModalOpen(false)}
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

                {/* Server error alert if any */}
                {serverFormError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                    <AlertTriangle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                    <span>{serverFormError}</span>
                  </div>
                )}

                {/* ── SECTION 1: BASIC INFORMATION ── */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-zinc-100">
                    <Info size={14} className="text-indigo-600" />
                    <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                      Basic Information
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Plan Name */}
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
                          setFormData(prev => ({
                            ...prev,
                            name: val,
                            // Auto-suggest code if creating new plan and code is empty or touched
                            code: editingPlan ? prev.code : (prev.code === '' ? normalizePlanCode(val) : prev.code),
                          }));
                          if (formValidationErrors.name) {
                            setFormValidationErrors(prev => ({ ...prev, name: undefined }));
                          }
                        }}
                        placeholder="e.g. 30 Day Free Trial, Pro Plan"
                        className={`w-full px-3 py-2 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                          formValidationErrors.name ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-300 focus:border-indigo-500'
                        }`}
                      />
                      {formValidationErrors.name && (
                        <p className="text-[11px] text-rose-600 mt-1 font-medium">{formValidationErrors.name}</p>
                      )}
                    </div>

                    {/* Plan Code */}
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
                            setFormValidationErrors(prev => ({ ...prev, code: undefined }));
                          }
                        }}
                        placeholder="e.g. 30_DAY_FREE_TRIAL"
                        className={`w-full px-3 py-2 border rounded-xl text-xs sm:text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                          formValidationErrors.code ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-300 focus:border-indigo-500'
                        }`}
                      />
                      {formValidationErrors.code && (
                        <p className="text-[11px] text-rose-600 mt-1 font-medium">{formValidationErrors.code}</p>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Summary of modules and entitlements included in this tier..."
                      className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  {/* Duration, Price, Currency */}
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
                            setFormValidationErrors(prev => ({ ...prev, durationDays: undefined }));
                          }
                        }}
                        placeholder="30"
                        className={`w-full px-3 py-2 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                          formValidationErrors.durationDays ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-300 focus:border-indigo-500'
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
                        className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Currency</label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                  </div>

                  {/* Free trial and active status toggles */}
                  <div className="flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-700 select-none">
                      <input
                        type="checkbox"
                        checked={formData.isTrial}
                        onChange={(e) => setFormData({ ...formData, isTrial: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500"
                      />
                      <span>Is Free Trial Tier</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-700 select-none">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500"
                      />
                      <span>Active</span>
                    </label>
                  </div>
                </div>

                {/* ── SECTION 2: LIMITS / RULES (WITH EXPLICIT UNLIMITED UX) ── */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-indigo-600" />
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

                      {/* Limited vs Unlimited Radio Buttons */}
                      <div className="flex items-center gap-3 text-xs font-semibold text-zinc-700 bg-white p-1 rounded-lg border border-zinc-200 shadow-2xs">
                        <label className="flex items-center gap-1.5 cursor-pointer px-2 py-0.5 rounded select-none">
                          <input
                            type="radio"
                            name="company-limit-mode"
                            checked={!formData.isUnlimitedCompanies}
                            onChange={() => {
                              setFormData(prev => ({
                                ...prev,
                                isUnlimitedCompanies: false,
                                maxCompanies: prev.maxCompanies || 4,
                              }));
                            }}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Limited</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer px-2 py-0.5 rounded select-none">
                          <input
                            type="radio"
                            name="company-limit-mode"
                            checked={formData.isUnlimitedCompanies}
                            onChange={() => {
                              setFormData(prev => ({
                                ...prev,
                                isUnlimitedCompanies: true,
                              }));
                              if (formValidationErrors.maxCompanies) {
                                setFormValidationErrors(prev => ({ ...prev, maxCompanies: undefined }));
                              }
                            }}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="font-bold text-indigo-700">Unlimited</span>
                        </label>
                      </div>
                    </div>

                    {formData.isUnlimitedCompanies ? (
                      <div className="p-2.5 rounded-lg bg-indigo-50/80 border border-indigo-100 text-indigo-900 text-xs font-medium flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-indigo-600 shrink-0" />
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
                                setFormValidationErrors(prev => ({ ...prev, maxCompanies: undefined }));
                              }
                            }}
                            placeholder="e.g. 4"
                            className={`w-full px-3 py-2 border rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                              formValidationErrors.maxCompanies ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-300 focus:border-indigo-500'
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

                      {/* Limited vs Unlimited Radio Buttons */}
                      <div className="flex items-center gap-3 text-xs font-semibold text-zinc-700 bg-white p-1 rounded-lg border border-zinc-200 shadow-2xs">
                        <label className="flex items-center gap-1.5 cursor-pointer px-2 py-0.5 rounded select-none">
                          <input
                            type="radio"
                            name="user-limit-mode"
                            checked={!formData.isUnlimitedUsers}
                            onChange={() => {
                              setFormData(prev => ({
                                ...prev,
                                isUnlimitedUsers: false,
                                maxUsersPerCompany: prev.maxUsersPerCompany || 10,
                              }));
                            }}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Limited</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer px-2 py-0.5 rounded select-none">
                          <input
                            type="radio"
                            name="user-limit-mode"
                            checked={formData.isUnlimitedUsers}
                            onChange={() => {
                              setFormData(prev => ({
                                ...prev,
                                isUnlimitedUsers: true,
                              }));
                              if (formValidationErrors.maxUsersPerCompany) {
                                setFormValidationErrors(prev => ({ ...prev, maxUsersPerCompany: undefined }));
                              }
                            }}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="font-bold text-indigo-700">Unlimited</span>
                        </label>
                      </div>
                    </div>

                    {formData.isUnlimitedUsers ? (
                      <div className="p-2.5 rounded-lg bg-indigo-50/80 border border-indigo-100 text-indigo-900 text-xs font-medium flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-indigo-600 shrink-0" />
                        <span>Unlimited active users allowed per company.</span>
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
                                setFormValidationErrors(prev => ({ ...prev, maxUsersPerCompany: undefined }));
                              }
                            }}
                            placeholder="e.g. 10"
                            className={`w-full px-3 py-2 border rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                              formValidationErrors.maxUsersPerCompany ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-300 focus:border-indigo-500'
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

                {/* ── SECTION 3: PLAN MODULES ── */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                      <Layers size={14} className="text-indigo-600" />
                      <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                        Included Modules ({formData.moduleIds.length} selected)
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={handleSelectAllModules}
                        className="text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-zinc-300">•</span>
                      <button
                        type="button"
                        onClick={handleClearAllModules}
                        className="text-zinc-500 hover:text-zinc-700 hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  {formValidationErrors.moduleIds && (
                    <p className="text-[11px] text-rose-600 font-medium">{formValidationErrors.moduleIds}</p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1">
                    {availableModules.length > 0 ? (
                      availableModules.map((mod) => {
                        const isChecked = formData.moduleIds.includes(mod.id);
                        return (
                          <label
                            key={mod.id}
                            className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                              isChecked
                                ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950 font-bold shadow-2xs'
                                : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-medium'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleModule(mod.id)}
                              className="w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="text-xs block truncate">{formatModuleName(mod.name)}</span>
                              <span className="font-mono text-[10px] text-zinc-400 block uppercase">{mod.name}</span>
                            </div>
                          </label>
                        );
                      })
                    ) : (
                      <div className="col-span-2 text-center py-4 text-xs text-zinc-400">
                        Loading active modules from server...
                      </div>
                    )}
                  </div>
                </div>

              </form>

              {/* Right / Live Plan Preview Panel (5 Cols on desktop) */}
              <div className="lg:col-span-5 bg-zinc-50/80 rounded-2xl p-5 border border-zinc-200/80 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60">
                    <span className="text-[10.5px] font-extrabold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={12} className="text-indigo-600" />
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
                          const m = availableModules.find(mod => mod.id === id);
                          return (
                            <span key={id} className="text-[9.5px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">
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
                    <HelpCircle size={13} className="text-indigo-600" />
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
                onClick={() => setIsFormModalOpen(false)}
                disabled={isSaving}
                className="px-4 py-2 border border-zinc-200 hover:bg-zinc-100 rounded-xl text-xs font-semibold text-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="plan-form"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
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
      )}

      {/* ── PLAN DETAILS VIEW MODAL ── */}
      {isDetailsModalOpen && viewingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${getPlanIconStyle(viewingPlan)}`}>
                  {React.createElement(getPlanIcon(viewingPlan), { size: 16 })}
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-zinc-900">
                    {viewingPlan.name}
                  </h3>
                  <span className="font-mono text-[11px] font-semibold text-zinc-400 uppercase">
                    {viewingPlan.code}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
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
                  {viewingPlan.description || 'No detailed description provided.'}
                </p>
              </div>

              {/* Key Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-0.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block">Duration</span>
                  <span className="text-sm font-bold text-zinc-900">{viewingPlan.durationDays || 30} Days</span>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-0.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block">Price</span>
                  <span className="text-sm font-bold text-zinc-900 font-mono">{formatPlanPrice(viewingPlan)}</span>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-0.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block">Status</span>
                  <span className={`inline-flex items-center gap-1 font-bold ${viewingPlan.active ? 'text-emerald-700' : 'text-zinc-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${viewingPlan.active ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                    <span>{viewingPlan.active ? 'Active' : 'Inactive'}</span>
                  </span>
                </div>
              </div>

              {/* Rules & Limits Breakdown */}
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/80 space-y-3">
                <div className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={13} className="text-indigo-600" />
                  <span>Enforced Limits</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10.5px] font-semibold text-zinc-500 block">Companies Quota</span>
                    <span className="text-sm font-black text-zinc-900">
                      {formatPlanLimit(viewingPlan.maxCompanies, 'companies')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10.5px] font-semibold text-zinc-500 block">Users / Company Quota</span>
                    <span className="text-sm font-black text-zinc-900">
                      {formatPlanLimit(viewingPlan.maxUsersPerCompany, 'users')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modules List */}
              <div className="space-y-2">
                <span className="text-[10.5px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Entitled Modules ({(viewingPlan.modules || []).filter(m => m.active !== false).length})
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(viewingPlan.modules || []).filter(m => m.active !== false).map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-800"
                    >
                      <Check size={12} className="text-indigo-600 stroke-[3]" />
                      <span className="truncate">{m.moduleName || 'Module'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  handleOpenEditModal(viewingPlan);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900"
              >
                <Edit2 size={13} />
                <span>Edit This Plan</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
