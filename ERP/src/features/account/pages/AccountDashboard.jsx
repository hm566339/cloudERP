import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRoutePath } from "../../../hooks/useRoutePath";
import { useLazyGetMeQuery } from '../../../features/auth/services/authApi';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAppSelector } from '../../../app/hooks';

import { dashboardApi } from '../../../api/account';
import { resolveRolePermissions } from '../../../config/rbacConfig';
import { getCookie, setCookie } from '../../../utils/cookieHelper';
import {
  User, Shield, Building2, Key, Activity, Users,
  LayoutGrid, PieChart, CheckCircle2, AlertCircle,
  RefreshCw, TrendingUp, TrendingDown, ChevronRight,
  Clock, Bell, Zap, BarChart3, Eye, ArrowUpRight,
  FileText, Wallet, CreditCard, Receipt, BookOpen,
  DollarSign, Landmark, Scale, ShieldCheck, Briefcase,
  CircleDollarSign, Navigation
} from 'lucide-react';

import PageHeader from '../../../components/common/PageHeader';
import StatCard from '../../../components/common/StatCard';
import ChartCard from '../../../components/reports/ChartCard';
import DashboardSection from '../../../components/common/DashboardSection';
import ActivityList from '../../../components/common/ActivityList';
import ApprovalList from '../../../components/common/ApprovalList';
import AlertList from '../../../components/common/AlertList';
import NavigationCard from '../../../components/common/NavigationCard';

// ──────────────────────────────────────────────────────────────────
// Icon mapping for dynamic widgets coming from the backend
// ──────────────────────────────────────────────────────────────────
const ICON_MAP = {
  'customers': Users,
  'vendors': Briefcase,
  'sales': DollarSign,
  'purchase': CreditCard,
  'receivables': TrendingUp,
  'payables': TrendingDown,
  'cash': Wallet,
  'bank': Landmark,
  'budget': Scale,
  'gl': BookOpen,
  'journal': FileText,
  'receipt': Receipt,
  'payment': CircleDollarSign,
  'gst': ShieldCheck,
  'tax': ShieldCheck,
  'audit': Eye,
  'default': BarChart3
};

function getIconForWidget(widget) {
  if (!widget) return ICON_MAP.default;
  const id = (widget.id || widget.title || '').toLowerCase();
  for (const [key, Icon] of Object.entries(ICON_MAP)) {
    if (id.includes(key)) return Icon;
  }
  return ICON_MAP.default;
}

// ──────────────────────────────────────────────────────────────────
// Quick Action Helper
// ──────────────────────────────────────────────────────────────────
function getMappedPath(title, originalPath) {
  const t = title?.toLowerCase() || '';
  if (t.includes('sales invoice')) return 'accounts/sales/invoices/new';
  if (t.includes('purchase invoice')) return 'accounts/purchases/invoices/new';
  if (t.includes('journal')) return 'accounts/transactions/journal/new';
  if (t.includes('customer')) return 'accounts/masters/customers/new';
  if (t.includes('vendor')) return 'accounts/masters/vendors/new';
  if (t.includes('receipt')) return 'accounts/transactions/receipts/new';
  if (t.includes('payment')) return 'accounts/transactions/payments/new';
  if (t.includes('report')) return 'accounts/reports/ledger';

  if (originalPath && originalPath !== '#' && !originalPath.startsWith('/api')) {
    if (originalPath.startsWith('/')) {
      return `accounts${originalPath}`;
    }
    return `accounts/${originalPath}`;
  }
  return '#';
}

const CHART_DATA_KEYS = ['value'];
const EXPENSE_CHART_COLORS = ['#ef4444'];
const DEFAULT_CHART_COLORS = ['#3b82f6'];

// ══════════════════════════════════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ══════════════════════════════════════════════════════════════════
function AccountDashboard() {
  const { buildPath } = useRoutePath();
  const currentUser = useAppSelector(selectCurrentUser);
  const [triggerGetMe, { isLoading: loading }] = useLazyGetMeQuery();
  const selectedCompany = useAppSelector((s) => s.company.selectedCompany);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── RBAC Context ──
  const rbac = useMemo(() => {
    const role = currentUser?.role || 'viewer';
    return resolveRolePermissions(role);
  }, [currentUser?.role]);

  // ── Dashboard State ──
  const [cards, setCards] = useState([]);
  const [charts, setCharts] = useState([]);
  const [quickActions, setQuickActions] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [navigation, setNavigation] = useState([]);

  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [isLoadingQuickActions, setIsLoadingQuickActions] = useState(false);
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(false);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // ── Token Handling (OAuth callback) ──
  const urlToken = searchParams.get('token') || searchParams.get('accessToken');

  useEffect(() => {
    if (urlToken) {
      setCookie('auth_token', urlToken);
      setCookie('ACCESS_TOKEN', urlToken);
      searchParams.delete('token');
      searchParams.delete('accessToken');
      setSearchParams(searchParams, { replace: true });
      triggerGetMe();
    }
  }, [urlToken, searchParams, setSearchParams, triggerGetMe]);

  // ── Fetch Dashboard APIs ──
  const companyId = selectedCompany?.id;
  const hasUser = Boolean(currentUser);
  const canApprove = Boolean(rbac.permissions?.includes('APPROVE'));

  const fetchAll = useCallback(async () => {
    if (!hasUser || !companyId) return;

    const params = { companyId };

    setIsLoadingCards(true);
    setIsLoadingQuickActions(true);
    if (canApprove) setIsLoadingApprovals(true);
    setIsLoadingAlerts(true);
    setIsLoadingActivities(true);

    try {
      const res = await dashboardApi.getDashboard(params);
      const data = res?.data || res || {};
      setCards(data.cards || []);
      setCharts(data.charts || []);
      setQuickActions(data.quickActions || []);
      setApprovals(canApprove ? (data.approvals || []) : []);
      setAlerts(data.alerts || []);
      setActivities(data.activities || []);
      setNavigation(data.navigation || []);
    } catch (err) {
      setCards([]);
      setCharts([]);
      setQuickActions([]);
      setApprovals([]);
      setAlerts([]);
      setActivities([]);
      setNavigation([]);
    } finally {
      setIsLoadingCards(false);
      setIsLoadingQuickActions(false);
      setIsLoadingApprovals(false);
      setIsLoadingAlerts(false);
      setIsLoadingActivities(false);
    }
  }, [companyId, hasUser, canApprove, refreshKey]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleRefresh = useCallback(() => setRefreshKey(prev => prev + 1), []);

  // ── Loading State ──
  if (!currentUser && loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] animate-fade-in">
        <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin mb-3" />
        <p className="text-zinc-500 text-sm font-medium">Completing secure login...</p>
      </div>
    );
  }

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const roleLabel = (currentUser?.role || 'viewer').replace(/_/g, ' ');

  // ── Map API Data to Component Formats ──
  const mappedNavigation = useMemo(() => {
    return navigation.map(nav => ({
      id: nav.id,
      title: nav.title,
      path: buildPath(nav.data?.path || nav.api || '#'),
      icon: getIconForWidget(nav)
    }));
  }, [navigation, buildPath]);

  const mappedActivities = useMemo(() => {
    return activities.map(act => ({
      id: act.id,
      title: act.title || act.data?.description || 'Activity',
      description: act.data?.user || act.module,
      timestamp: act.data?.createdAt,
      icon: Activity
    }));
  }, [activities]);

  const mappedAlerts = useMemo(() => {
    return alerts.map(alert => ({
      id: alert.id,
      title: alert.title,
      message: alert.data?.message,
      severity: alert.data?.severity || 'INFO'
    }));
  }, [alerts]);

  const mappedApprovals = useMemo(() => {
    return approvals.map(app => ({
      id: app.id,
      title: app.title || app.data?.reference || 'Pending Approval',
      module: app.module,
      status: app.data?.status || 'PENDING',
      amount: app.data?.amount
    }));
  }, [approvals]);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      {/* ────────── Page Header ────────── */}
      <PageHeader
        title={isSuperAdmin ? 'Super Admin Dashboard' : 'Account Dashboard'}
        description={`Role-based overview for ${roleLabel} • ${selectedCompany?.name || 'Company'}`}
        icon={LayoutGrid}
      >
        <div className="flex items-center gap-3">
          {isSuperAdmin && (
            <Link to={buildPath('/super-admin/dashboard')} className="btn-secondary flex items-center gap-2">
              <ShieldCheck size={14} />
              Admin Panel
            </Link>
          )}
          <button onClick={handleRefresh} className="btn-secondary flex items-center gap-2" disabled={isLoadingCards}>
            <RefreshCw size={14} className={isLoadingCards ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </PageHeader>

      <div className="flex-1 overflow-auto space-y-4 p-4">
        {/* Profile + Security Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm md:col-span-2 overflow-hidden min-w-0">
            <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 shrink-0">
                <User size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Personal Information</h3>
                <p className="text-xs text-zinc-500">Your profile details</p>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Full Name</label>
                  <p className="text-sm font-semibold text-zinc-900 mt-1">
                    {currentUser?.fullName || currentUser?.name || currentUser?.displayName || (currentUser?.firstName || currentUser?.lastName ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() : null) || currentUser?.username || 'Unknown'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Email Address</label>
                  <p className="text-sm font-semibold text-zinc-900 mt-1 truncate">{currentUser?.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Role</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${isSuperAdmin ? 'bg-sky-100 text-sky-800' : 'bg-blue-100 text-blue-800'}`}>
                      {roleLabel}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Modules</label>
                  <p className="text-sm font-semibold text-zinc-900 mt-1">{rbac.modules.length} accessible</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden min-w-0">
            <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <Shield size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Security Status</h3>
                <p className="text-xs text-zinc-500">Account protection</p>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
                <span className="text-sm font-semibold text-zinc-800">Account is secure</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-5">
                {rbac.permissions.slice(0, 3).map(p => (
                  <span key={p} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                    {p}
                  </span>
                ))}
                {rbac.permissions.length > 3 && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                    +{rbac.permissions.length - 3} MORE
                  </span>
                )}
              </div>
              <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-zinc-300 shadow-sm text-sm font-medium rounded-md text-zinc-700 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900/10 transition-colors">
                <Key size={14} className="mr-2 text-zinc-400" />
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* ────────── Dashboard Cards (KPIs) ────────── */}
        {companyId ? (
          <>
            <DashboardSection 
              title="Key Metrics" 
              icon={BarChart3} 
              description="Real-time financial indicators."
            >
              {isLoadingCards ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <StatCard key={i} loading={true} />
                  ))}
                </div>
              ) : cards.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {cards.map((card, idx) => {
                    const val = card.data?.value ?? card.data ?? 0;
                    const trend = card.data?.trend;
                    const trendDir = trend?.direction === 'UP' ? 'up' : trend?.direction === 'DOWN' ? 'down' : 'neutral';
                    const variant = trendDir === 'up' ? 'success' : trendDir === 'down' ? 'danger' : 'default';

                    return (
                      <StatCard 
                        key={card.id || idx}
                        title={card.title}
                        value={typeof val === 'number' ? val.toLocaleString('en-IN') : val}
                        icon={getIconForWidget(card)}
                        trend={trend ? trendDir : null}
                        trendValue={trend ? `${trend.value}%` : null}
                        variant={variant}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-8 text-center flex flex-col items-center justify-center">
                  <BarChart3 className="mx-auto text-zinc-300 mb-2" size={32} />
                  <p className="text-sm text-zinc-500 font-medium">No metric cards available for your role.</p>
                </div>
              )}
            </DashboardSection>

            {/* ────────── Charts Row ────────── */}
            {isLoadingCards || (loading && charts.length === 0) ? (
              <DashboardSection 
                title="Analytics & Trends" 
                icon={PieChart} 
                description="Visualized financial insights."
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="h-[240px] bg-white border border-zinc-200 rounded-xl p-5 animate-pulse flex flex-col justify-between">
                    <div className="h-4 bg-zinc-100 rounded w-1/3" />
                    <div className="h-32 bg-zinc-50 rounded-lg" />
                  </div>
                  <div className="h-[240px] bg-white border border-zinc-200 rounded-xl p-5 animate-pulse flex flex-col justify-between">
                    <div className="h-4 bg-zinc-100 rounded w-1/3" />
                    <div className="h-32 bg-zinc-50 rounded-lg" />
                  </div>
                </div>
              </DashboardSection>
            ) : charts && charts.length > 0 ? (
              <DashboardSection 
                title="Analytics & Trends" 
                icon={PieChart} 
                description="Visualized financial insights."
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {charts.map((chart, idx) => {
                    const isExpense = chart.id?.includes('expense') || chart.id?.includes('payable');
                    return (
                      <ChartCard 
                        key={chart.id || idx}
                        title={chart.title}
                        type="area"
                        data={Array.isArray(chart.data) ? chart.data : []}
                        dataKeys={CHART_DATA_KEYS}
                        xAxisKey="label"
                        colors={isExpense ? EXPENSE_CHART_COLORS : DEFAULT_CHART_COLORS}
                      />
                    );
                  })}
                </div>
              </DashboardSection>
            ) : null}

            {/* ────────── Approvals, Alerts, Activities Row ────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Approvals */}
              {rbac.permissions.includes('APPROVE') && (
                <DashboardSection title="Pending Approvals" icon={CheckCircle2} className="mb-0">
                  <ApprovalList approvals={mappedApprovals} loading={isLoadingApprovals} />
                </DashboardSection>
              )}

              {/* Alerts */}
              {(!rbac.permissions.includes('APPROVE') || alerts.length > 0) && (
                <DashboardSection title="Alerts" icon={Bell} className="mb-0">
                  <AlertList alerts={mappedAlerts} loading={isLoadingAlerts} />
                </DashboardSection>
              )}

              {/* Activities */}
              <DashboardSection 
                title="Recent Activity" 
                icon={Activity} 
                className={`mb-0 ${(!rbac.permissions.includes('APPROVE') && alerts.length === 0) ? 'lg:col-span-2' : ''}`}
              >
                <ActivityList activities={mappedActivities} loading={isLoadingActivities} />
              </DashboardSection>
            </div>

            {/* ────────── Module Navigation ────────── */}
            {navigation.length > 0 && (
              <DashboardSection 
                title="Module Navigation" 
                icon={Navigation} 
                description="Quick access to key areas."
              >
                <NavigationCard items={mappedNavigation} />
              </DashboardSection>
            )}

          </>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-zinc-300 mb-4" />
            <h3 className="text-base font-bold text-zinc-900">No company selected</h3>
            <p className="text-sm text-zinc-500 mt-1">Please select a company to view its accounting dashboard.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(AccountDashboard);
