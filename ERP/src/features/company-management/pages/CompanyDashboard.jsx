import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Users, Layers, ShieldCheck, Activity, Globe, KeyRound, AlertCircle
} from 'lucide-react';
import { getDashboard } from '../../../api/sso/dashboard';
import { useAppSelector } from '../../../app/hooks';
import DashboardHeader from '../../dashboard/components/DashboardHeader';
import StatsCard from '../../dashboard/components/StatsCard';
import ChartCard from '../../dashboard/components/ChartCard';
import { RoleTable, PortalAccessTable } from '../../dashboard/components/DashboardTables';

export default function CompanyDashboard() {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
  
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    if (!companyId || companyId === '000000') return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboard(companyId);
      setMetrics(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading && !metrics) {
    return (
      <div className="space-y-6">
        <div className="h-24 bg-zinc-200/50 rounded-2xl animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 bg-zinc-200/50 rounded-2xl animate-pulse"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-zinc-200/50 rounded-2xl animate-pulse"></div>
          <div className="h-80 bg-zinc-200/50 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-12 text-center bg-white rounded-xl shadow-sm border border-rose-200 mt-10">
        <AlertCircle size={48} className="mx-auto text-rose-400 mb-4" />
        <h2 className="text-xl font-bold text-rose-700">Failed to Load Dashboard</h2>
        <p className="text-rose-600/80 mt-2 max-w-md mx-auto mb-6">
          {error || 'An unexpected error occurred while fetching dashboard metrics.'}
        </p>
        <button onClick={fetchDashboardData} className="btn-primary bg-rose-600 hover:bg-rose-700">
          Try Again
        </button>
      </div>
    );
  }

  const {
    companyName,
    modules = {},
    roles = {},
    users = {},
    sessions = {},
    portalAccess = {},
    authorizationCodes = {}
  } = metrics;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <DashboardHeader 
        companyName={companyName} 
        onRefresh={fetchDashboardData} 
        loading={loading} 
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard 
          title="Total Users" 
          icon={Users} 
          total={users.total} 
          active={users.active} 
          inactive={users.inactive} 
          blocked={users.blocked}
          unverified={users.unverified}
          colorClass="text-blue-500" 
          bgClass="bg-blue-50" 
        />
        <StatsCard 
          title="Active Sessions" 
          icon={Activity} 
          total={sessions.total} 
          active={sessions.active} 
          expired={sessions.expired} 
          activeLabel="Live"
          colorClass="text-emerald-500" 
          bgClass="bg-emerald-50" 
        />
        <StatsCard 
          title="Provisioned Modules" 
          icon={Layers} 
          total={modules.total} 
          active={modules.active} 
          inactive={modules.inactive} 
          colorClass="text-orange-500" 
          bgClass="bg-orange-50" 
        />
        <StatsCard 
          title="Portal Accesses" 
          icon={Globe} 
          total={portalAccess.total} 
          active={portalAccess.active} 
          inactive={portalAccess.inactive} 
          activeLabel="Granted"
          colorClass="text-purple-500" 
          bgClass="bg-purple-50" 
        />
        <StatsCard 
          title="Authorization Codes" 
          icon={KeyRound} 
          total={authorizationCodes.total} 
          active={authorizationCodes.active} 
          used={authorizationCodes.used}
          expired={authorizationCodes.expired}
          activeLabel="Valid"
          colorClass="text-rose-500" 
          bgClass="bg-rose-50" 
        />
        <StatsCard 
          title="Configured Roles" 
          icon={ShieldCheck} 
          total={roles.total} 
          colorClass="text-zinc-500" 
          bgClass="bg-zinc-100" 
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard 
          title="User Account Status"
          data={[
            { name: 'Active', value: users.active || 0 },
            { name: 'Inactive', value: users.inactive || 0 },
            { name: 'Blocked', value: users.blocked || 0 },
            { name: 'Unverified', value: users.unverified || 0 }
          ]}
          colors={['#10b981', '#9ca3af', '#ef4444', '#f59e0b']}
        />
        <ChartCard 
          title="Session Lifecycle"
          data={[
            { name: 'Active', value: sessions.active || 0 },
            { name: 'Expired', value: sessions.expired || 0 }
          ]}
          colors={['#10b981', '#f43f5e']}
        />
        <ChartCard 
          title="Auth Code Status"
          data={[
            { name: 'Active', value: authorizationCodes.active || 0 },
            { name: 'Used', value: authorizationCodes.used || 0 },
            { name: 'Expired', value: authorizationCodes.expired || 0 }
          ]}
          colors={['#10b981', '#8b5cf6', '#f43f5e']}
        />
      </div>

      {/* Distribution Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RoleTable roles={roles} />
        <PortalAccessTable portalAccess={portalAccess} />
      </div>
    </div>
  );
}
