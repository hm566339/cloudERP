import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CreditCard,
  Plus,
  Layers,
  Building2,
  Users,
  LayoutGrid,
  Table as TableIcon,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Clock,
  Sparkles,
  X,
} from 'lucide-react';
import {
  getSubscriptionPlans,
  toggleSubscriptionPlanStatus,
  getOrganizationSubscription,
  getCompanySubscription,
  deleteSubscriptionPlan,
} from '../../api/sso/subscriptionPlan.api';
import { getModules } from '../../api/sso/module';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../../app/hooks';
import { selectAuthContext } from '../../features/auth/authSlice';
import { addAlert } from '../../features/notifications/notificationSlice';
import { getSafeErrorMessage } from '../../utils/apiErrorHelper';
import { formatPlanLimit } from '../../utils/subscriptionPlanHelper';
import { isCurrentPlan } from '../../utils/subscriptionCheckoutHelper';
import { confirmDialog } from '../../utils/confirmDialog';
import {
  isSystemAdmin,
  canBuySubscription,
  canViewPlans as checkCanViewPlans,
  getBuyDisabledReason,
} from '../../utils/subscriptionPermissions';
import PlanCard from '../../components/subscription/PlanCard';
import PlanTable from '../../components/subscription/PlanTable';
import PlanDetailsModal from '../../components/subscription/PlanDetailsModal';
import PlanFormModal from '../../components/subscription/PlanFormModal';
import SubscriptionCheckoutModal from '../../components/subscription/SubscriptionCheckoutModal';

export { isCurrentPlan };

export default function SubscriptionPlansSettings() {
  const dispatch = useDispatch();
  const authContext = useAppSelector(selectAuthContext);
  const { user, organization, currentCompany, membership, subscription: reduxSubscription } = authContext;

  // Active Company / Organization Subscription state
  const [activeSubData, setActiveSubData] = useState(reduxSubscription);
  const [isSubLoading, setIsSubLoading] = useState(false);

  // Selected plan for checkout / payment modal
  const [checkoutPlan, setCheckoutPlan] = useState(null);

  // Role & Permission Resolution strictly derived from backend SSO /me identity
  const isSuperAdmin = isSystemAdmin(authContext);
  const canManageCatalog = isSuperAdmin; // Only SYSTEM_ADMIN can create, edit, toggle, or delete plans
  const canUpgradeSubscription = canBuySubscription(authContext); // OWNER or ADMIN
  const canViewPlans = checkCanViewPlans(authContext);

  // Catalog State
  const [plans, setPlans] = useState([]);
  const [availableModules, setAvailableModules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // View & Filter states
  const [viewMode, setViewMode] = useState('grid');
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [viewingPlan, setViewingPlan] = useState(null);

  // Fetch active company / organization subscription
  const fetchActiveSubscription = useCallback(async () => {
    const orgId = organization?.id || user?.organizationId;
    const compId = currentCompany?.id || user?.companyId;
    if (!orgId && !compId) return;

    setIsSubLoading(true);
    try {
      let sub = null;
      if (orgId) {
        try {
          sub = await getOrganizationSubscription(orgId);
        } catch {
          // fallback to company subscription
        }
      }
      if (!sub && compId) {
        try {
          sub = await getCompanySubscription(compId);
        } catch {
          // fallback
        }
      }
      if (sub) {
        setActiveSubData(sub);
      }
    } catch {
      // ignore
    } finally {
      setIsSubLoading(false);
    }
  }, [organization?.id, user?.organizationId, currentCompany?.id, user?.companyId]);

  // Fetch all catalog plans and system modules
  const fetchData = useCallback(async () => {
    if (!canViewPlans) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [plansRes, modulesRes] = await Promise.allSettled([
        getSubscriptionPlans(),
        getModules(),
      ]);

      if (plansRes.status === 'fulfilled') {
        const raw = plansRes.value;
        const list = Array.isArray(raw)
          ? raw
          : raw?.data && Array.isArray(raw.data)
          ? raw.data
          : raw?.plans && Array.isArray(raw.plans)
          ? raw.plans
          : [];
        setPlans(list);
      } else {
        const isForbidden = plansRes.reason?.response?.status === 403;
        const msg = isForbidden
          ? 'Access denied: Subscription plans catalog requires elevated administrative permissions (SUBSCRIPTION_PLAN:READ).'
          : getSafeErrorMessage(plansRes.reason, 'Failed to fetch subscription plans catalog.');
        setErrorMessage(msg);
        if (!isForbidden) {
          dispatch(addAlert({ type: 'error', message: msg }));
        }
      }

      if (modulesRes.status === 'fulfilled') {
        const rawMods = modulesRes.value;
        const modList = Array.isArray(rawMods)
          ? rawMods
          : rawMods?.data && Array.isArray(rawMods.data)
          ? rawMods.data
          : [];
        setAvailableModules(modList);
      }
    } catch (err) {
      const msg = getSafeErrorMessage(err, 'Failed to connect to subscription service');
      setErrorMessage(msg);
      dispatch(addAlert({ type: 'error', message: msg }));
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchActiveSubscription();
    fetchData();
  }, [fetchActiveSubscription, fetchData]);

  const effectiveActiveSub = activeSubData || reduxSubscription;

  // Filtered plans list
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      if (statusFilter === 'ACTIVE' && !plan.active) return false;
      if (statusFilter === 'INACTIVE' && plan.active) return false;

      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase().trim();
        const matchesName = (plan.name || '').toLowerCase().includes(q);
        const matchesCode = (plan.code || '').toLowerCase().includes(q);
        const matchesDesc = (plan.description || '').toLowerCase().includes(q);
        return matchesName || matchesCode || matchesDesc;
      }
      return true;
    });
  }, [plans, searchFilter, statusFilter]);

  const handleOpenCreateModal = () => {
    if (!canManageCatalog) {
      dispatch(addAlert({ type: 'error', message: 'You do not have permission to create subscription plans in the catalog.' }));
      return;
    }
    setEditingPlan(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (plan) => {
    if (!canManageCatalog) {
      dispatch(addAlert({ type: 'error', message: 'You do not have permission to modify subscription plans in the catalog.' }));
      return;
    }
    setEditingPlan(plan);
    setIsFormModalOpen(true);
  };

  const handleOpenDetailsModal = (plan) => {
    setViewingPlan(plan);
    setIsDetailsModalOpen(true);
  };

  const handleToggleStatus = async (plan) => {
    if (!canManageCatalog) {
      dispatch(addAlert({ type: 'error', message: 'You do not have permission to change subscription plan status in the catalog.' }));
      return;
    }

    const newStatus = !plan.active;
    try {
      await toggleSubscriptionPlanStatus(plan.id, newStatus);
      dispatch(addAlert({
        type: 'success',
        message: `Plan '${plan.name}' ${newStatus ? 'activated' : 'deactivated'} successfully`,
      }));
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, active: newStatus } : p)));
    } catch (err) {
      const msg = getSafeErrorMessage(err, `Failed to update status for plan '${plan.name}'`);
      dispatch(addAlert({ type: 'error', message: msg }));
    }
  };

  const handleDeletePlan = async (plan) => {
    if (!canManageCatalog) {
      dispatch(addAlert({ type: 'error', message: 'Only System Administrators can delete subscription plans.' }));
      return;
    }

    const confirmed = await confirmDialog({
      title: `Delete Plan "${plan.name}"?`,
      message: `Are you sure you want to deactivate and remove "${plan.name}" (${plan.code}) from the active catalog? Existing subscribers will retain access until period end.`,
      confirmLabel: 'Confirm Delete',
      isDestructive: true,
    });

    if (!confirmed) return;

    try {
      await deleteSubscriptionPlan(plan.id);
      dispatch(addAlert({
        type: 'success',
        message: `Plan '${plan.name}' removed from catalog successfully`,
      }));
      fetchData();
    } catch (err) {
      const msg = getSafeErrorMessage(err, `Failed to delete plan '${plan.name}'`);
      dispatch(addAlert({ type: 'error', message: msg }));
    }
  };

  // Active subscription display variables
  const activePlanName = effectiveActiveSub?.planName || effectiveActiveSub?.name || (effectiveActiveSub?.trialing ? '30-Day Free Trial' : 'Current Subscription');
  const subStatus = effectiveActiveSub?.status || 'ACTIVE';
  const effectiveAccessMode = effectiveActiveSub?.accessMode || organization?.accessMode || 'FULL';
  const isTrial = effectiveActiveSub?.trialing || String(subStatus).toUpperCase() === 'TRIALING' || String(effectiveActiveSub?.planCode).includes('TRIAL');
  const daysRemaining = effectiveActiveSub?.daysRemaining;
  const orgName = organization?.name || organization?.code || 'Organization';
  const companyName = currentCompany?.name || currentCompany?.legalName || orgName;
  const companiesCount = authContext?.companies?.length || 1;
  const maxCompaniesQuota = effectiveActiveSub?.maxCompanies ?? effectiveActiveSub?.plan?.maxCompanies ?? 4;
  const maxUsersQuota = effectiveActiveSub?.maxUsersPerCompany ?? effectiveActiveSub?.plan?.maxUsersPerCompany ?? 10;

  return (
    <div className="flex-1 bg-zinc-50/50 min-h-screen">
      <div className="w-full p-4 sm:p-6 space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
              <CreditCard size={14} className="text-zinc-700" />
              <span>Subscription & Licensing Architecture</span>
            </div>
            <h1 className="text-2xl font-bold font-display text-zinc-900 tracking-tight">
              Subscription Plans & Entitlement Rules
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              {canManageCatalog
                ? 'Configure SaaS subscription tiers, active duration, company and user quotas, and modular access rights.'
                : 'Review available subscription tiers, manage your organization plan, and upgrade capacity for your company.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                fetchActiveSubscription();
                fetchData();
              }}
              disabled={isLoading || isSubLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
              title="Refresh plans and active subscription"
            >
              <RefreshCw size={13} className={isLoading || isSubLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {canManageCatalog && (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all shrink-0 active:scale-95"
              >
                <Plus size={15} />
                <span>Create Plan</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Company Subscription Overview Banner */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-zinc-100">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-zinc-800 shrink-0 shadow-2xs">
                <Building2 size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10.5px] font-bold text-zinc-400 uppercase tracking-wider">
                    Company Active Subscription
                  </span>
                  <span className="text-zinc-300">•</span>
                  <span className="font-mono text-xs font-bold text-zinc-700">
                    {currentCompany?.code || organization?.code || 'COMPANY'}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold font-display text-zinc-900 tracking-tight">
                    {activePlanName}
                  </h2>
                  {isTrial ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                      <Sparkles size={11} className="text-emerald-600" />
                      <span>Free Trial {daysRemaining !== null && daysRemaining !== undefined ? `(${daysRemaining}d left)` : ''}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                      <CheckCircle2 size={11} className="text-emerald-600" />
                      <span>{subStatus || 'Active'}</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Organization: <strong className="text-zinc-800">{orgName}</strong>
                  {currentCompany?.name && (
                    <>
                      {' '}&bull; Legal Entity: <strong className="text-zinc-800">{companyName}</strong>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {canUpgradeSubscription && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>Owner Subscription Authority</span>
                </span>
              )}
            </div>
          </div>

          {/* Allocation & Quota Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-zinc-50/80 p-3 rounded-xl border border-zinc-100 space-y-0.5">
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-zinc-400 uppercase tracking-wider">
                <Lock size={12} className={effectiveAccessMode === 'FULL' ? 'text-emerald-600' : 'text-amber-600'} />
                <span>Access Mode</span>
              </div>
              <div className="text-sm font-black text-zinc-900">{effectiveAccessMode}</div>
              <p className="text-[10px] text-zinc-400">All features operational</p>
            </div>

            <div className="bg-zinc-50/80 p-3 rounded-xl border border-zinc-100 space-y-0.5">
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-zinc-400 uppercase tracking-wider">
                <Clock size={12} className="text-zinc-700" />
                <span>Validity / Cycle</span>
              </div>
              <div className="text-sm font-black text-zinc-900">
                {daysRemaining !== null && daysRemaining !== undefined ? `${daysRemaining} Days Left` : '30-Day Billing Cycle'}
              </div>
              <p className="text-[10px] text-zinc-400">
                {effectiveActiveSub?.validUntil ? `Valid until ${new Date(effectiveActiveSub.validUntil).toLocaleDateString()}` : 'Standard active period'}
              </p>
            </div>

            <div className="bg-zinc-50/80 p-3 rounded-xl border border-zinc-100 space-y-0.5">
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-zinc-400 uppercase tracking-wider">
                <Building2 size={12} className="text-zinc-700" />
                <span>Companies Quota</span>
              </div>
              <div className="text-sm font-black text-zinc-900">
                {companiesCount} / {formatPlanLimit(maxCompaniesQuota, 'companies')}
              </div>
              <p className="text-[10px] text-zinc-400">Active legal companies</p>
            </div>

            <div className="bg-zinc-50/80 p-3 rounded-xl border border-zinc-100 space-y-0.5">
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-zinc-400 uppercase tracking-wider">
                <Users size={12} className="text-zinc-700" />
                <span>Users / Company</span>
              </div>
              <div className="text-sm font-black text-zinc-900">
                {formatPlanLimit(maxUsersQuota, 'users')}
              </div>
              <p className="text-[10px] text-zinc-400">Seats per company workspace</p>
            </div>
          </div>
        </div>

        {/* Filters & View Switcher */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search plans by name, code or description..."
              className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 focus:bg-white transition-all shadow-2xs"
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
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl text-xs font-semibold text-zinc-600">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-zinc-900 font-bold shadow-2xs'
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
                    ? 'bg-white text-emerald-700 font-bold shadow-2xs'
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
                    ? 'bg-white text-zinc-800 font-bold shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Inactive
              </button>
            </div>

            <div className="flex items-center border border-zinc-200 rounded-xl p-0.5 bg-zinc-50">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-zinc-900 font-bold shadow-2xs'
                    : 'text-zinc-400 hover:text-zinc-700'
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
                    ? 'bg-white text-zinc-900 font-bold shadow-2xs'
                    : 'text-zinc-400 hover:text-zinc-700'
                }`}
                title="Table View"
              >
                <TableIcon size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Error Banner */}
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

        {/* Loading Skeleton / Content */}
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
          <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center space-y-4 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-700 mx-auto flex items-center justify-center">
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
            {canManageCatalog && (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                <Plus size={15} />
                <span>Create First Plan</span>
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPlans.map((plan) => (
              <PlanCard
                key={plan.id || plan.code}
                plan={plan}
                effectiveActiveSub={effectiveActiveSub}
                canManageCatalog={canManageCatalog}
                canUpgradeSubscription={canUpgradeSubscription}
                onToggleStatus={handleToggleStatus}
                onOpenDetails={handleOpenDetailsModal}
                onOpenEdit={handleOpenEditModal}
                onCheckout={setCheckoutPlan}
                onDelete={handleDeletePlan}
              />
            ))}
          </div>
        ) : (
          <PlanTable
            plans={filteredPlans}
            effectiveActiveSub={effectiveActiveSub}
            canManageCatalog={canManageCatalog}
            canUpgradeSubscription={canUpgradeSubscription}
            onOpenDetails={handleOpenDetailsModal}
            onOpenEdit={handleOpenEditModal}
            onCheckout={setCheckoutPlan}
            onDelete={handleDeletePlan}
          />
        )}
      </div>

      {/* Form Modal */}
      <PlanFormModal
        isOpen={isFormModalOpen}
        editingPlan={editingPlan}
        availableModules={availableModules}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={fetchData}
      />

      {/* Details View Modal */}
      <PlanDetailsModal
        isOpen={isDetailsModalOpen}
        plan={viewingPlan}
        effectiveActiveSub={effectiveActiveSub}
        canManageCatalog={canManageCatalog}
        canUpgradeSubscription={canUpgradeSubscription}
        onClose={() => setIsDetailsModalOpen(false)}
        onEdit={handleOpenEditModal}
        onSubscribe={setCheckoutPlan}
      />

      {/* Razorpay Subscription Checkout & Payment Modal */}
      <SubscriptionCheckoutModal
        isOpen={Boolean(checkoutPlan)}
        onClose={() => setCheckoutPlan(null)}
        selectedPlan={checkoutPlan}
        organization={organization}
        user={user}
        onSuccess={(updatedSub) => {
          if (updatedSub) {
            setActiveSubData(updatedSub);
          }
          fetchActiveSubscription();
          fetchData();
        }}
      />
    </div>
  );
}
