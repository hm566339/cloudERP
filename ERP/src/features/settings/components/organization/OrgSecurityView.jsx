import React, { useState } from 'react';
import {
  ShieldCheck,
  Key,
  Clock,
  Lock,
  Save,
  RotateCcw,
  AlertTriangle,
  Globe,
  Radio,
  CheckCircle,
  XCircle,
  Trash2,
  Activity,
  Users,
} from 'lucide-react';
import { useAppDispatch } from '../../../../app/hooks';
import { addAlert } from '../../../notifications/notificationSlice';
import PageHeader from '../../../../components/common/PageHeader';
import { confirmDialog } from '../../../../utils/confirmDialog';

export default function OrgSecurityView({
  initialTwoFactor = false,
  initialTimeout = '60',
  onSaveSecurity,
  isSaving = false,
}) {
  const dispatch = useAppDispatch();

  // State
  const [twoFactorRequired, setTwoFactorRequired] = useState(initialTwoFactor);
  const [sessionTimeout, setSessionTimeout] = useState(initialTimeout);
  const [minPasswordLength, setMinPasswordLength] = useState('8');
  const [passwordExpiry, setPasswordExpiry] = useState('90');
  const [loginAttemptLimit, setLoginAttemptLimit] = useState('5');
  const [lockoutDuration, setLockoutDuration] = useState('30');
  const [requireSpecialChar, setRequireSpecialChar] = useState(true);
  const [requireNumbers, setRequireNumbers] = useState(true);
  const [requireMixedCase, setRequireMixedCase] = useState(true);
  const [ipRestrictions, setIpRestrictions] = useState('');

  // Mock Active Sessions
  const [activeSessions, setActiveSessions] = useState([
    {
      id: 'sess-1',
      user: 'Mohit Sharma (Owner)',
      email: 'mohit@example.com',
      ip: '103.21.244.2',
      device: 'Chrome / Windows 11',
      lastActive: 'Just now',
      isCurrent: true,
    },
    {
      id: 'sess-2',
      user: 'Finance Manager',
      email: 'finance@example.com',
      ip: '182.74.12.89',
      device: 'Firefox / macOS',
      lastActive: '12 mins ago',
      isCurrent: false,
    },
    {
      id: 'sess-3',
      user: 'Inventory Lead',
      email: 'inventory@example.com',
      ip: '49.36.120.45',
      device: 'Safari / iPhone 15',
      lastActive: '45 mins ago',
      isCurrent: false,
    },
  ]);

  const handleRevokeSession = (sessionId) => {
    confirmDialog(
      'Revoke Active Session',
      'Are you sure you want to terminate this user session? The user will be logged out immediately.',
      () => {
        setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId));
        dispatch(addAlert({ type: 'success', message: 'User session revoked successfully' }));
      }
    );
  };

  const handleReset = () => {
    setTwoFactorRequired(false);
    setSessionTimeout('60');
    setMinPasswordLength('8');
    setPasswordExpiry('90');
    setLoginAttemptLimit('5');
    setLockoutDuration('30');
    setRequireSpecialChar(true);
    setRequireNumbers(true);
    setRequireMixedCase(true);
    setIpRestrictions('');
    dispatch(addAlert({ type: 'info', message: 'Security settings reset to standard defaults' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSaveSecurity) {
      await onSaveSecurity({
        twoFactorRequired,
        sessionTimeout,
        minPasswordLength,
        passwordExpiry,
        loginAttemptLimit,
        lockoutDuration,
        requireSpecialChar,
        requireNumbers,
        requireMixedCase,
        ipRestrictions,
      });
    } else {
      dispatch(addAlert({ type: 'success', message: 'Security policies updated successfully' }));
    }
  };

  return (
          <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
            <PageHeader
              title="Security & Authentication"
              description="Configure organization password policies, session lifetimes, and two-factor authentication"
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5"
                >
                  <RotateCcw size={14} />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save size={16} />
                  <span>{isSaving ? 'Saving...' : 'Save Policies'}</span>
                </button>
              </div>
        </PageHeader>

                  {/* Main Content Area */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-6 w-full">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Policy 1: Two-Factor Authentication Card */}
                      <div className="bg-white dark:bg-[#161922] p-6 rounded-2xl border border-zinc-200 dark:border-[#2A2F3D] shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
                              <ShieldCheck size={22} />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                                Two-Factor Authentication (2FA)
                              </h3>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Require multi-factor TOTP verification for all members logging into this organization.
                              </p>
                            </div>
                          </div>

                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={twoFactorRequired}
                              onChange={(e) => setTwoFactorRequired(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
          </div>

                      {/* Policy 2: Password Policy Card */}
                      <div className="bg-white dark:bg-[#161922] p-6 rounded-2xl border border-zinc-200 dark:border-[#2A2F3D] shadow-xs space-y-4">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider pb-3 border-b border-zinc-100 dark:border-zinc-800">
                          Password Policy & Complexity
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                              Minimum Password Length
                            </label>
                            <select
                              value={minPasswordLength}
                              onChange={(e) => setMinPasswordLength(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                            >
                              <option value="8">8 Characters (Standard)</option>
                              <option value="10">10 Characters (Enhanced)</option>
                              <option value="12">12 Characters (Strict)</option>
                              <option value="14">14 Characters (High Security)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                              Password Expiration Cycle
                            </label>
                            <select
                              value={passwordExpiry}
                              onChange={(e) => setPasswordExpiry(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                            >
                              <option value="0">Never Expire</option>
                              <option value="30">Every 30 Days</option>
                              <option value="60">Every 60 Days</option>
                              <option value="90">Every 90 Days</option>
                              <option value="180">Every 180 Days</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2">
                          <span className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                            Complexity Rules
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                              <input
                                type="checkbox"
                                checked={requireMixedCase}
                                onChange={(e) => setRequireMixedCase(e.target.checked)}
                                className="rounded border-zinc-300 text-primary"
                              />
                              <span>Mixed Case (A-z)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                              <input
                                type="checkbox"
                                checked={requireNumbers}
                                onChange={(e) => setRequireNumbers(e.target.checked)}
                                className="rounded border-zinc-300 text-primary"
                              />
                              <span>Numbers (0-9)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                              <input
                                type="checkbox"
                                checked={requireSpecialChar}
                                onChange={(e) => setRequireSpecialChar(e.target.checked)}
                                className="rounded border-zinc-300 text-primary"
                              />
                              <span>Special Characters (!@#$)</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Policy 3: Session & Lockout Card */}
                      <div className="bg-white dark:bg-[#161922] p-6 rounded-2xl border border-zinc-200 dark:border-[#2A2F3D] shadow-xs space-y-4">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider pb-3 border-b border-zinc-100 dark:border-zinc-800">
                          Session Lifetime & Account Lockout
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                              Session Inactivity Timeout
                            </label>
                            <select
                              value={sessionTimeout}
                              onChange={(e) => setSessionTimeout(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                            >
                              <option value="15">15 Minutes</option>
                              <option value="30">30 Minutes</option>
                              <option value="60">60 Minutes (Default)</option>
                              <option value="120">2 Hours</option>
                              <option value="480">8 Hours</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                              Login Attempt Limit
                            </label>
                            <select
                              value={loginAttemptLimit}
                              onChange={(e) => setLoginAttemptLimit(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                            >
                              <option value="3">3 Failed Attempts</option>
                              <option value="5">5 Failed Attempts</option>
                              <option value="10">10 Failed Attempts</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                              Lockout Duration
                            </label>
                            <select
                              value={lockoutDuration}
                              onChange={(e) => setLockoutDuration(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                            >
                              <option value="15">15 Minutes</option>
                              <option value="30">30 Minutes</option>
                              <option value="60">60 Minutes</option>
                              <option value="1440">24 Hours</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                            IP Address Restrictions (CIDR / Whitelist)
                          </label>
                          <textarea
                            rows={2}
                            value={ipRestrictions}
                            onChange={(e) => setIpRestrictions(e.target.value)}
                            placeholder="Leave blank to allow all IP addresses, or enter comma-separated IPs (e.g. 192.168.1.0/24, 103.21.244.2)"
                            className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                          />
                      </div>
                  </div>

                      {/* Active Sessions List */}
                      <div className="bg-white dark:bg-[#161922] p-6 rounded-2xl border border-zinc-200 dark:border-[#2A2F3D] shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                          <div className="flex items-center gap-2">
                              <Activity size={18} className="text-zinc-600 dark:text-zinc-400" />
                              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                                Active Sessions ({activeSessions.length})
                              </h3>
                          </div>
                          <span className="text-xs text-zinc-500">Live multi-company sessions</span>
                        </div>

                          <div className="space-y-2">
                            {activeSessions.map((sess) => (
                              <div
                                key={sess.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{sess.user}</span>
                                    {sess.isCurrent && (
                                      <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                                        Current Session
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-zinc-500 dark:text-zinc-400 font-mono">
                                    {sess.ip} &bull; {sess.device} &bull; Active: {sess.lastActive}
                                  </div>
                                </div>

                                {!sess.isCurrent && (
                                  <button
                                    type="button"
                                    onClick={() => handleRevokeSession(sess.id)}
                                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors border border-rose-200 dark:border-rose-900/50 self-start sm:self-auto"
                                  >
                                    Revoke
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                  </form>
                </div>
              </div>
              );
}
