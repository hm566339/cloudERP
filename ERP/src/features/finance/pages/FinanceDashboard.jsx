import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  RefreshCw, TrendingUp, TrendingDown, Wallet, AlertTriangle, 
  Calendar, Clock, DollarSign, User, Shield, Key, LayoutGrid,
  PieChart, Activity, Bell, FileText, CheckCircle2, Navigation,
  BookOpen
} from 'lucide-react';
import { dashboardFinanceApi } from '../../../api/account/dashboard';
import { FinanceDashboardSkeleton } from '../../../components/common/SkeletonLoader';
import StatCard from '../../../components/common/StatCard';
import ErrorState from '../../../components/common/ErrorState';
import PageHeader from '../../../components/common/PageHeader';
import ChartCard from '../../../components/reports/ChartCard';
import DashboardSection from '../../../components/common/DashboardSection';
import ActivityList from '../../../components/common/ActivityList';
import ApprovalList from '../../../components/common/ApprovalList';
import AlertList from '../../../components/common/AlertList';
import NavigationCard from '../../../components/common/NavigationCard';

import { formatCurrency } from '../../../utils/formatters';
import { useAppSelector } from '../../../app/hooks';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import { resolveRolePermissions } from '../../../config/rbacConfig';
import { useRoutePath } from '../../../hooks/useRoutePath';

const CHART_DATA_KEYS = ['value'];
const FINANCIAL_POSITION_COLORS = ['#2E3D28', '#C66B62', '#A9B887'];
const EMPTY_ARRAY = [];

function FinanceDashboard() {
  const { buildPath } = useRoutePath();
  const currentUser = useAppSelector(selectCurrentUser);
  const selectedCompany = useAppSelector((state) => state.company.selectedCompany);
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardFinanceApi.getFinanceDashboard();
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      setError(err.message || 'An error occurred fetching dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const rbac = resolveRolePermissions(currentUser?.role || 'viewer');
  const roleLabel = (currentUser?.role || 'viewer').replace(/_/g, ' ');

  // Transform existing API data for the new Generic Chart component
  const chartData = useMemo(() => {
    if (!data) return EMPTY_ARRAY;
    return [
      { name: 'Receivables', value: data.totalReceivables || 0 },
      { name: 'Payables', value: data.totalPayables || 0 },
      { name: 'Cash', value: data.cashBalance || 0 },
    ];
  }, [data?.totalReceivables, data?.totalPayables, data?.cashBalance]);

  // Map top counterparties to activity-like list to reuse ActivityList (since we don't have real activities)
  const counterpartiesActivities = useMemo(() => {
    if (!data?.topCounterparties) return EMPTY_ARRAY;
    return data.topCounterparties.map((item, idx) => ({
      id: `cp-${idx}`,
      title: `Transaction with ${item.name}`,
      description: `Type: ${item.type} | Amount: ${formatCurrency(item.amount)}`,
      icon: DollarSign
    }));
  }, [data?.topCounterparties]);

  const alerts = useMemo(() => {
    if (!data) return EMPTY_ARRAY;
    const list = [];
    if (data.overdueReceivables > 0) {
      list.push({ id: 1, title: 'Overdue Receivables', message: `${formatCurrency(data.overdueReceivables)} overdue`, severity: 'HIGH' });
    }
    if (data.overduePayables > 0) {
      list.push({ id: 2, title: 'Overdue Payables', message: `${formatCurrency(data.overduePayables)} overdue`, severity: 'MEDIUM' });
    }
    return list;
  }, [data?.overdueReceivables, data?.overduePayables]);

  const navItems = useMemo(() => [
    { title: 'Revenue Management', path: buildPath('accounts/sales/invoices'), icon: TrendingUp },
    { title: 'Expense Management', path: buildPath('accounts/purchases/invoices'), icon: TrendingDown },
    { title: 'Journal Entries', path: buildPath('accounts/transactions/journal'), icon: FileText },
    { title: 'General Ledger', path: buildPath('accounts/reports/ledger'), icon: BookOpen },
    { title: 'Bank Accounts', path: buildPath('accounts/banking/bank-accounts'), icon: Wallet },
    { title: 'Chart of Accounts', path: buildPath('accounts/masters/coa'), icon: LayoutGrid },
  ], [buildPath]);

  if (loading && !data) return <div className="p-6"><FinanceDashboardSkeleton /></div>;
  if (error && !data) return <ErrorState message={error} onRetry={fetchDashboard} />;
  if (!data) return null;

  return (
    <div className="flex flex-col h-full bg-[#E8E9DF] dark:bg-[#0F1117]">
      <PageHeader
        title="Finance Dashboard"
        description={`Role-based overview for ${roleLabel} • ${selectedCompany?.name || 'Company'}`}
        icon={LayoutGrid}
      >
        <button
          onClick={fetchDashboard}
          disabled={loading}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </PageHeader>

      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto space-y-8">
        
        {/* Section 1: Personal Info & Security Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[var(--color-surface)] dark:bg-[#161922] rounded-xl border border-[var(--color-border)] dark:border-[#2A2F3D] shadow-sm md:col-span-2 overflow-hidden min-w-0">
            <div className="px-5 py-4 border-b border-[var(--color-border)] dark:border-[#2A2F3D] bg-[var(--color-surface-2)]/50 dark:bg-[#1D212C] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-2)] dark:bg-[#161922] border border-[var(--color-border)] dark:border-[#2A2F3D] flex items-center justify-center text-[var(--color-primary)] dark:text-[#A0A6B5]">
                <User size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#2E3D28] dark:text-[#E6E8EE]">Personal Information</h3>
                <p className="text-xs text-[#485942] dark:text-[#A0A6B5]">Your profile details</p>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-[#485942] dark:text-[#6B7184] uppercase tracking-wider">Full Name</label>
                  <p className="text-sm font-semibold text-[#2E3D28] dark:text-[#E6E8EE] mt-1">{currentUser?.fullName || currentUser?.name || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#485942] dark:text-[#6B7184] uppercase tracking-wider">Email Address</label>
                  <p className="text-sm font-semibold text-[#2E3D28] dark:text-[#E6E8EE] mt-1 truncate">{currentUser?.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#485942] dark:text-[#6B7184] uppercase tracking-wider">Role</label>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 capitalize">
                      {roleLabel}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#485942] dark:text-[#6B7184] uppercase tracking-wider">Modules</label>
                  <p className="text-sm font-semibold text-[#2E3D28] dark:text-[#E6E8EE] mt-1">{rbac.modules.length} accessible</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#F7F7F0] dark:bg-[#161922] rounded-xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-sm overflow-hidden min-w-0">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1D212C] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Shield size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#2E3D28] dark:text-[#E6E8EE]">Security Status</h3>
                <p className="text-xs text-[#485942] dark:text-[#A0A6B5]">Account protection</p>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-900/40" />
                <span className="text-sm font-semibold text-zinc-800 dark:text-[#E6E8EE]">Account is secure</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-5">
                {rbac.permissions.slice(0, 3).map(p => (
                  <span key={p} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-[#EDEEE4] dark:bg-[#1D212C] text-[#2E3D28] dark:text-[#A0A6B5] border border-[#D5D8CA] dark:border-[#2A2F3D]">
                    {p}
                  </span>
                ))}
                {rbac.permissions.length > 3 && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-[#EDEEE4] dark:bg-[#1D212C] text-[#2E3D28] dark:text-[#A0A6B5] border border-[#D5D8CA] dark:border-[#2A2F3D]">
                    +{rbac.permissions.length - 3} MORE
                  </span>
                )}
              </div>
              <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-sm text-sm font-medium rounded-md text-[#2E3D28] dark:text-[#E6E8EE] bg-white dark:bg-[#1D212C] hover:bg-[#EDEEE4] dark:hover:bg-[#222736] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2E3D28]/15 transition-colors">
                <Key size={14} className="mr-2 text-zinc-400 dark:text-[#6B7184]" />
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Key Metrics */}
        <DashboardSection 
          title="Key Metrics" 
          icon={Activity} 
          description="Financial performance and health summary."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Cash Balance"
              value={formatCurrency(data.cashBalance)}
              icon={Wallet}
              variant="success"
            />
            <StatCard
              title="Total Receivables"
              value={formatCurrency(data.totalReceivables)}
              icon={TrendingUp}
              variant="info"
            />
            <StatCard
              title="Total Payables"
              value={formatCurrency(data.totalPayables)}
              icon={TrendingDown}
              variant="warning"
            />
            <StatCard
              title="Cash Runway"
              value={`${(data.monthsOfCash || 0).toFixed(1)} Months`}
              icon={Calendar}
              variant="default"
            />
            
            {/* Mocked/Empty Metrics as per instructions */}
            <StatCard title="Revenue" value="No Data" icon={DollarSign} variant="default" subtitle="Data unavailable" />
            <StatCard title="Expenses" value="No Data" icon={FileText} variant="default" subtitle="Data unavailable" />
            <StatCard title="Sales Invoices" value="No Data" icon={FileText} variant="default" subtitle="Data unavailable" />
            <StatCard title="Pending Approvals" value="No Data" icon={Clock} variant="default" subtitle="Data unavailable" />
          </div>
        </DashboardSection>

        {/* Section 3: Analytics & Trends */}
        <DashboardSection 
          title="Analytics & Trends" 
          icon={PieChart}
          description="Visualized financial insights."
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard 
              title="Financial Position" 
              type="bar"
              data={chartData} 
              dataKeys={CHART_DATA_KEYS} 
              colors={FINANCIAL_POSITION_COLORS} 
            />
            <ChartCard 
              title="Revenue Trend" 
              description="Data missing from API"
              type="area"
              data={EMPTY_ARRAY} 
            />
            <ChartCard 
              title="Cash Flow" 
              description="Data missing from API"
              type="line"
              data={EMPTY_ARRAY} 
            />
            <ChartCard 
              title="Receivable Aging" 
              description="Data missing from API"
              type="bar"
              data={EMPTY_ARRAY} 
            />
          </div>
        </DashboardSection>

        {/* Sections 4, 5, 6: Approvals, Alerts, Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <DashboardSection title="Pending Approvals" icon={CheckCircle2} className="mb-0">
            {/* The current API doesn't return approvals. Show empty state. */}
            <ApprovalList approvals={EMPTY_ARRAY} />
          </DashboardSection>

          <DashboardSection title="Alerts" icon={Bell} className="mb-0">
            {/* The current API doesn't return generic alerts, but we can map overdues to alerts */}
            <AlertList alerts={alerts} />
          </DashboardSection>

          <DashboardSection title="Recent Activity" icon={Activity} className="mb-0">
            {/* The current API doesn't return activities, use top counterparties as a proxy for now */}
            <ActivityList activities={counterpartiesActivities} emptyMessage="No recent activities recorded." />
          </DashboardSection>
        </div>

        {/* Section 7: Module Navigation */}
        <DashboardSection 
          title="Module Navigation" 
          icon={Navigation}
          description="Quick access to key financial areas."
        >
          <NavigationCard items={navItems} />
        </DashboardSection>

      </div>
    </div>
  );
}

export default React.memo(FinanceDashboard);


