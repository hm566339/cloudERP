import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Building2,
  Check,
  CreditCard,
  Settings,
  LogOut,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
} from 'lucide-react';
import { useAppDispatch } from '../app/hooks';
import { setSelectedCompany } from '../features/company-management/companySlice';
import { logout as logoutAction } from '../features/auth/authSlice';
import { useLogoutApiMutation } from '../features/auth/services/authApi';
import { removeCookie } from '../utils/cookieHelper';

/**
 * Top Header component for Owner Dashboard Layout.
 * Contains:
 * - Mobile drawer trigger (hamburger)
 * - Desktop sidebar collapse toggle
 * - Active Company Switcher dropdown
 * - Subscription status indicator
 * - Owner user profile & logout dropdown
 */
export default function OwnerTopHeader({
  organization,
  user,
  companies = [],
  activeCompanyId,
  activeCompanyCode,
  activeCompanyName,
  isTrial = false,
  isActive = false,
  isReadOnly = false,
  daysRemaining = null,
  isCollapsed = false,
  onToggleCollapse,
  onMobileOpen,
}) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const [logoutApi] = useLogoutApiMutation();

  const orgName = organization?.name || organization?.code || 'Organization';
  const ownerName = user?.fullName || user?.username || 'Organization Owner';
  const ownerEmail = user?.email || user?.username || '';

  const handleSelectCompany = (comp) => {
    dispatch(
      setSelectedCompany({
        id: comp.id,
        code: comp.code,
        name: comp.name || comp.legalName,
      })
    );
    setCompanyDropdownOpen(false);
  };

  const handleLogout = useCallback(async () => {
    try {
      await logoutApi().unwrap();
    } catch {
      // Ignore API logout error and proceed with local cleanup
    } finally {
      removeCookie('ACCESS_TOKEN');
      removeCookie('ACCESS_TOKEN_REFRESH');
      removeCookie('auth_token');
      localStorage.clear();
      sessionStorage.clear();
      dispatch(logoutAction());
      navigate('/login', { replace: true });
    }
  }, [logoutApi, dispatch, navigate]);

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 shadow-2xs transition-all h-16 shrink-0">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger + Desktop collapse toggle + Breadcrumb / Title */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={onMobileOpen}
            className="lg:hidden p-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors focus:outline-hidden"
            aria-label="Open sidebar menu"
          >
            <Menu size={20} />
          </button>

          {/* Desktop collapse toggle button */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors focus:outline-hidden"
              title={isCollapsed ? 'Expand sidebar (⌘B)' : 'Collapse sidebar (⌘B)'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          )}

          {/* Breadcrumb / Title */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-display font-black text-zinc-900 tracking-tight">
              Owner Dashboard
            </span>
            <span className="hidden sm:inline-block text-xs font-semibold text-zinc-300">/</span>
            <span className="hidden sm:inline-block text-xs font-medium text-zinc-500 truncate max-w-[180px]">
              {activeCompanyName}
            </span>
          </div>
        </div>

        {/* Right: Subscription badge + Company Switcher + User Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Subtle Subscription Status Pill */}
          {isTrial && (
            <Link
              to="/subscription"
              title="Subscription Details"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition-colors shadow-2xs"
            >
              <Clock size={12} className="text-emerald-600" />
              <span>Trial • {daysRemaining !== null ? `${daysRemaining}d remaining` : 'Active'}</span>
            </Link>
          )}
          {isReadOnly && (
            <Link
              to="/subscription"
              title="Trial Expired • Read-Only Mode"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors shadow-2xs"
            >
              <AlertTriangle size={12} className="text-amber-600" />
              <span>Read-Only Mode</span>
            </Link>
          )}
          {isActive && !isTrial && (
            <Link
              to="/subscription"
              title="Active Subscription"
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 transition-colors shadow-2xs"
            >
              <CheckCircle2 size={12} className="text-blue-600" />
              <span>Active Plan</span>
            </Link>
          )}

          {/* Active Company Switcher */}
          {companies.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold shadow-2xs transition-colors"
                aria-expanded={companyDropdownOpen}
                aria-label="Switch active company"
              >
                <Building2 size={14} className="text-zinc-500 shrink-0" />
                <span className="max-w-[120px] sm:max-w-[160px] truncate">{activeCompanyName}</span>
                <ChevronDown size={13} className="text-zinc-400 shrink-0" />
              </button>

              {companyDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setCompanyDropdownOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-zinc-200 rounded-2xl shadow-xl py-2 z-50 animate-scale-up origin-top-right">
                    <div className="px-3 py-1.5 border-b border-zinc-100 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Switch Company
                    </div>
                    <div className="max-h-60 overflow-y-auto py-1">
                      {companies.map((comp) => {
                        const isCurrent =
                          comp.id === activeCompanyId || comp.code === activeCompanyCode;
                        return (
                          <button
                            key={comp.id || comp.code}
                            type="button"
                            onClick={() => handleSelectCompany(comp)}
                            className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-zinc-50 transition-colors ${
                              isCurrent ? 'font-bold text-zinc-900 bg-zinc-50/80' : 'text-zinc-600'
                            }`}
                          >
                            <div className="truncate mr-2">
                              <div className="truncate">{comp.name || comp.legalName}</div>
                              {comp.code && (
                                <div className="text-[10px] font-mono text-zinc-400 uppercase">
                                  {comp.code}
                                </div>
                              )}
                            </div>
                            {isCurrent && (
                              <Check size={14} className="text-emerald-600 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* User Profile & Logout Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-zinc-200/90 hover:bg-zinc-50 bg-white transition-all shadow-2xs group"
              aria-expanded={profileDropdownOpen}
              aria-label="User profile menu"
            >
              <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {ownerName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left text-xs leading-tight">
                <span className="font-bold text-zinc-800 block truncate max-w-[120px]">
                  {ownerName}
                </span>
                <span className="text-[10px] text-zinc-400 font-medium">Owner</span>
              </div>
              <ChevronDown
                size={13}
                className="text-zinc-400 group-hover:text-zinc-600 transition-colors"
              />
            </button>

            {profileDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileDropdownOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 top-full mt-1.5 w-72 bg-white border border-zinc-200 rounded-2xl shadow-xl py-2 z-50 animate-scale-up origin-top-right">
                  <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50/50 rounded-t-xl mb-1">
                    <p className="text-xs font-bold text-zinc-900 truncate">{ownerName}</p>
                    <p className="text-[11px] text-zinc-500 font-medium truncate">{ownerEmail}</p>
                    <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Organization Owner
                    </div>
                  </div>

                  <div className="px-2 py-1 space-y-0.5">
                    <Link
                      to="/subscription"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 rounded-xl transition-colors"
                    >
                      <CreditCard size={14} className="text-zinc-500" />
                      <span>Subscription & Plan</span>
                    </Link>

                    <Link
                      to="/accounts/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 rounded-xl transition-colors"
                    >
                      <Settings size={14} className="text-zinc-500" />
                      <span>Company Settings</span>
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 rounded-xl transition-colors"
                    >
                      <User size={14} className="text-zinc-500" />
                      <span>My Profile</span>
                    </Link>
                  </div>

                  <div className="border-t border-zinc-100 mt-1 pt-1 px-2">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left"
                    >
                      <LogOut size={14} className="text-rose-500" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
