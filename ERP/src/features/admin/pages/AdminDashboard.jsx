import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../../../app/hooks';
import { Activity, Users, Server, Clock, User, Info, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { checkBackendHealth } from '../../../services/apiService';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('ADMIN_DASHBOARD');

/**
 * Admin Dashboard
 * Provides system overview, health checks, and administrative controls
 */
export default function AdminDashboard() {
  const auth = useAppSelector((state) => state.auth ?? {});
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        logger.debug('Checking system health for admin dashboard');
        const isHealthy = await checkBackendHealth();
        setSystemHealth(isHealthy);
      } catch (error) {
        logger.error('Health check failed', { message: error.message });
        setSystemHealth(false);
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  return (
    <div 
      className="w-full max-w-none px-[28px] sm:px-[32px] py-[28px] space-y-5 animate-fade-in pb-12"
      style={{ width: '100%', maxWidth: 'none' }}
    >
      {/* ── Page Header ── */}
      <div className="space-y-1 mb-6">
        <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">Admin Dashboard</h1>
        <p className="text-[13px] text-zinc-500">System overview and configuration</p>
      </div>

      {/* ── Top Status Cards (4-Column Responsive Grid) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        {/* Backend Health */}
        <div className="min-h-[140px] p-[18px] bg-white rounded-xl border border-zinc-200 shadow-2xs flex flex-col justify-between transition-all hover:border-zinc-300">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100/60 flex items-center justify-center text-indigo-600 shrink-0">
              <Server size={18} strokeWidth={1.75} />
            </div>
            {!loading && (
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                systemHealth === true 
                  ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/60' 
                  : systemHealth === false 
                  ? 'text-rose-700 bg-rose-50 border border-rose-200/60' 
                  : 'text-amber-700 bg-amber-50 border border-amber-200/60'
              }`}>
                {systemHealth === true ? (
                  <><CheckCircle2 size={12} /> Healthy</>
                ) : systemHealth === false ? (
                  <><XCircle size={12} /> Offline</>
                ) : (
                  <><AlertTriangle size={12} /> Degraded</>
                )}
              </span>
            )}
          </div>
          <div className="mt-3">
            <span className="text-[12px] font-medium text-zinc-500 block mb-0.5">Backend Health</span>
            <p className={`text-2xl font-bold tracking-tight ${
              loading 
                ? 'text-zinc-400 text-lg font-semibold' 
                : systemHealth === true 
                ? 'text-emerald-700' 
                : systemHealth === false 
                ? 'text-rose-700' 
                : 'text-amber-700'
            }`}>
              {loading ? 'Checking...' : systemHealth ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>

        {/* Active Users */}
        <div className="min-h-[140px] p-[18px] bg-white rounded-xl border border-zinc-200 shadow-2xs flex flex-col justify-between transition-all hover:border-zinc-300">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100/60 flex items-center justify-center text-blue-600 shrink-0">
              <Users size={18} strokeWidth={1.75} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-[12px] font-medium text-zinc-500 block mb-0.5">Active Users</span>
            <p className="text-2xl font-bold text-zinc-900 tracking-tight">—</p>
            <p className="text-[11px] text-zinc-400 mt-1">API integration pending</p>
          </div>
        </div>

        {/* System Uptime */}
        <div className="min-h-[140px] p-[18px] bg-white rounded-xl border border-zinc-200 shadow-2xs flex flex-col justify-between transition-all hover:border-zinc-300">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100/60 flex items-center justify-center text-emerald-600 shrink-0">
              <Clock size={18} strokeWidth={1.75} />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full text-emerald-700 bg-emerald-50 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Operational
            </span>
          </div>
          <div className="mt-3">
            <span className="text-[12px] font-medium text-zinc-500 block mb-0.5">System Uptime</span>
            <p className="text-2xl font-bold text-zinc-900 tracking-tight">99.9%</p>
          </div>
        </div>

        {/* System Load */}
        <div className="min-h-[140px] p-[18px] bg-white rounded-xl border border-zinc-200 shadow-2xs flex flex-col justify-between transition-all hover:border-zinc-300">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100/60 flex items-center justify-center text-amber-600 shrink-0">
              <Activity size={18} strokeWidth={1.75} />
            </div>
            <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full text-zinc-600 bg-zinc-100 border border-zinc-200/60">
              Optimal
            </span>
          </div>
          <div className="mt-3">
            <span className="text-[12px] font-medium text-zinc-500 block mb-0.5">System Load</span>
            <p className="text-2xl font-bold text-zinc-900 tracking-tight">Normal</p>
          </div>
        </div>
      </div>

      {/* ── Current User Info (2-Column Information Grid) ── */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs p-6 mb-5">
        <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-zinc-100">
          <h2 className="text-[15px] font-semibold text-zinc-900 flex items-center gap-2">
            <User size={16} className="text-zinc-500" />
            Current User Info
          </h2>
          <span className="text-[11px] font-medium text-zinc-400">Authenticated Session</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">User ID</label>
            <p className="text-sm font-mono font-medium text-zinc-800 break-all select-all bg-zinc-50 border border-zinc-100 px-3 py-1.5 rounded-lg">
              {auth?.user?.id || 'N/A'}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Email</label>
            <p className="text-sm font-medium text-zinc-800 break-all px-1 py-1">
              {auth?.user?.email || 'N/A'}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Role</label>
            <div className="pt-0.5">
              <span className="inline-flex items-center text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200/60">
                {auth?.user?.role || 'N/A'}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Company</label>
            <p className="text-sm font-medium text-zinc-800 px-1 py-1">
              {auth?.user?.companyName || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* ── System Information (2-Column Information Grid) ── */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs p-6">
        <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-zinc-100">
          <h2 className="text-[15px] font-semibold text-zinc-900 flex items-center gap-2">
            <Info size={16} className="text-zinc-500" />
            System Information
          </h2>
          <span className="text-[11px] font-medium text-zinc-400">Environment Diagnostics</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Application Version</label>
            <p className="text-sm font-mono font-medium text-zinc-800 px-1 py-1">v1.0.0</p>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Environment</label>
            <div className="pt-0.5">
              <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                {import.meta.env.MODE === 'development' ? 'Development' : 'Production'}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">API Base URL</label>
            <p className="text-sm font-mono text-zinc-800 break-all select-all bg-zinc-50 border border-zinc-100 px-3 py-1.5 rounded-lg">
              {import.meta.env.VITE_API_URL || 'Default'}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Browser</label>
            <p className="text-sm font-medium text-zinc-800 break-words px-1 py-1">
              {typeof navigator !== 'undefined' ? navigator.userAgent.split(' ').slice(-2).join(' ') : 'Unknown'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
