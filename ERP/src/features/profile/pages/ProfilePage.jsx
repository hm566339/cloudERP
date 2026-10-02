import React, { useMemo } from 'react';
import { useAppSelector } from '../../../app/hooks';
import { useGetMeQuery, useSsoGetMeQuery } from '../../../features/auth/services/authApi';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import { User, Mail, Briefcase, Building2, Shield, Globe, Monitor, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDate } from '../../../utils/dateFormatter';

export default function ProfilePage() {
  const user = useAppSelector(selectCurrentUser);
  const isSuperAdmin = user?.role === 'super_admin';
  const { data: getMeData, isLoading: accountLoading } = useGetMeQuery(undefined, { skip: isSuperAdmin });
  const { data: ssoData, isLoading: ssoLoading } = useSsoGetMeQuery(undefined, { skip: !isSuperAdmin });
  const data = isSuperAdmin ? ssoData : getMeData;
  const loading = accountLoading || ssoLoading;
  const roles = data?.roles || [];
  const portalAccess = data?.portalAccess || [];
  const sessions = data?.sessions || [];

  const getStatusBadge = (status, type) => {
    let colorClass = 'bg-zinc-100 text-zinc-800';
    if (type === 'email') {
      colorClass = status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200';
    } else if (type === 'account') {
      colorClass = status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200';
    } else if (type === 'boolean') {
      colorClass = status ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-zinc-100 text-zinc-700 border border-zinc-200';
    }
    const label = type === 'boolean' ? (status ? 'Active' : 'Inactive') : status;
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${colorClass}`}>{label}</span>;
  };

  const getSessionRowClass = (tokenValidTill) => {
    if (!tokenValidTill) return 'bg-white';
    const expiry = new Date(tokenValidTill).getTime();
    const now = Date.now();
    const timeDiff = expiry - now;

    if (timeDiff <= 0) return 'bg-red-50/50'; // Expired
    if (timeDiff <= 15 * 60 * 1000) return 'bg-amber-50/50'; // Soon expiring (<= 15 mins)
    return 'bg-white'; // Active
  };

  const getSessionStatusLabel = (tokenValidTill) => {
    if (!tokenValidTill) return { label: 'Unknown', icon: <Monitor size={14} className="text-zinc-400" /> };
    const expiry = new Date(tokenValidTill).getTime();
    const now = Date.now();
    const timeDiff = expiry - now;

    if (timeDiff <= 0) return { label: 'Expired', icon: <XCircle size={14} className="text-red-500" /> };
    if (timeDiff <= 15 * 60 * 1000) return { label: 'Expiring Soon', icon: <Clock size={14} className="text-amber-500" /> };
    return { label: 'Active', icon: <CheckCircle size={14} className="text-emerald-500" /> };
  };

  if (loading || !user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Generate avatar initials
  const initials = (user.fullName || user.username || 'U').substring(0, 2).toUpperCase();

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 px-4 md:px-6 lg:px-8">
      <div className="flex items-center space-x-4 mb-6 bg-white p-5 md:p-6 rounded-xl shadow-sm border border-zinc-200">
        <div className="h-16 w-16 rounded-full bg-zinc-900 flex items-center justify-center text-white text-2xl font-bold shadow-sm shrink-0">
          {initials}
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-zinc-900">{user.fullName || user.username}</h1>
          <p className="text-sm text-zinc-500 flex items-center mt-1 font-medium">
            <Building2 size={15} className="mr-1.5 text-zinc-400" />
            Company Code: <span className="font-mono ml-1.5 px-2 py-0.5 bg-zinc-100 rounded text-zinc-700 text-xs">{user.companyCode}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information & Account */}
        <div className="space-y-6 lg:col-span-1">

          <div className="bg-white p-5 md:p-6 rounded-xl border border-zinc-200 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-5">
              <User size={18} className="text-zinc-400" />
              <h3 className="text-[13px] font-bold text-zinc-800 uppercase tracking-wide">Personal Information</h3>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Full Name</span>
                <span className="text-sm font-semibold text-zinc-900">{user.fullName || user.name || user.displayName || (user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : null) || user.username || '-'}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Username</span>
                <span className="text-sm font-semibold text-zinc-900">{user.username || '-'}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Employee ID</span>
                <span className="text-sm font-semibold text-zinc-900">{user.empId || '-'}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center mb-1">
                  <Mail size={12} className="mr-1" /> Email
                </span>
                <span className="text-sm font-semibold text-zinc-900">{user.email || '-'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-xl border border-zinc-200 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-5">
              <Shield size={18} className="text-zinc-400" />
              <h3 className="text-[13px] font-bold text-zinc-800 uppercase tracking-wide">Account Status</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-zinc-50/50 p-3 rounded-lg border border-zinc-100">
                <span className="text-xs font-semibold text-zinc-600">Email Verification</span>
                {getStatusBadge(user.emailStatus, 'email')}
              </div>
              <div className="flex justify-between items-center bg-zinc-50/50 p-3 rounded-lg border border-zinc-100">
                <span className="text-xs font-semibold text-zinc-600">Account Standing</span>
                {getStatusBadge(user.accountStatus, 'account')}
              </div>
            </div>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-xl border border-zinc-200 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-5">
              <Briefcase size={18} className="text-zinc-400" />
              <h3 className="text-[13px] font-bold text-zinc-800 uppercase tracking-wide">Assigned Roles</h3>
            </div>
            <div className="space-y-3">
              {roles.length === 0 ? (
                <p className="text-sm text-zinc-500 italic">No roles assigned.</p>
              ) : (
                roles.map((role, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                    <span className="text-sm font-semibold text-zinc-900">{role.name}</span>
                    {getStatusBadge(role.status, 'boolean')}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Portal Access & Sessions */}
        <div className="space-y-6 lg:col-span-2">

          <div className="bg-white p-5 md:p-6 rounded-xl border border-zinc-200 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-5">
              <Globe size={18} className="text-zinc-400" />
              <h3 className="text-[13px] font-bold text-zinc-800 uppercase tracking-wide">Portal Access</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {portalAccess.length === 0 ? (
                <p className="text-sm text-zinc-500 italic col-span-2">No portal access granted.</p>
              ) : (
                portalAccess.map((portal, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border ${portal.status ? 'border-zinc-200 bg-white shadow-sm' : 'border-zinc-200 bg-zinc-50 opacity-75'}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-sm font-bold text-zinc-900">{portal.moduleName}</h4>
                      {getStatusBadge(portal.status, 'boolean')}
                    </div>
                    <div className="text-[13px] text-zinc-600 space-y-1.5">
                      <p><span className="font-semibold text-zinc-500">Host:</span> {portal.host}</p>
                      <p><span className="font-semibold text-zinc-500">Username:</span> {portal.username}</p>
                    </div>
                    {portal.status && (
                      <a
                        href={portal.host}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center text-xs font-semibold text-zinc-700 hover:text-zinc-900 transition-colors bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-200"
                      >
                        Open Portal &rarr;
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden">
            <div className="p-5 md:p-6 border-b border-zinc-100 flex items-center gap-2">
              <Monitor size={18} className="text-zinc-400" />
              <h3 className="text-[13px] font-bold text-zinc-800 uppercase tracking-wide">Active Sessions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50/80">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Module / Username</th>
                    <th className="px-6 py-3.5 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider">IP / Browser</th>
                    <th className="px-6 py-3.5 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Login Time</th>
                    <th className="px-6 py-3.5 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Expires</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-zinc-100">
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-sm text-zinc-500 italic">No active sessions</td>
                    </tr>
                  ) : (
                    sessions.map((session, idx) => {
                      const status = getSessionStatusLabel(session.accessTokenValidTill);
                      return (
                        <tr key={idx} className={`${getSessionRowClass(session.accessTokenValidTill)} hover:bg-zinc-50/50 transition-colors`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-1.5">
                              {status.icon}
                              <span className="text-xs font-semibold text-zinc-700">{status.label}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-zinc-900">{session.moduleName || '-'}</div>
                            <div className="text-[11px] text-zinc-500 font-medium mt-0.5">{session.username}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-zinc-800">{session.ipAddress || '-'}</div>
                            <div className="text-[11px] text-zinc-500 mt-0.5 truncate max-w-[150px]" title={session.userAgent}>{session.userAgent || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium text-zinc-600">
                            {session.createdAt ? formatDate(session.createdAt) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium text-zinc-600">
                            {session.accessTokenValidTill ? formatDate(session.accessTokenValidTill) : '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
