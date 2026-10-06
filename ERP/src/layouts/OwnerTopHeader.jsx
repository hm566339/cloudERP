import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
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
  Search,
  Bell,
} from 'lucide-react';
import { useAppDispatch } from '../app/hooks';
import { setSelectedCompany } from '../features/company-management/companySlice';
import { logout as logoutAction } from '../features/auth/authSlice';
import { useLogoutApiMutation } from '../features/auth/services/authApi';
import { removeCookie } from '../utils/cookieHelper';

/**
 * Top Header component for Owner Dashboard Layout matching Company Dashboard visual system.
 * Structure:
 * - Left: Hamburger menu, Desktop collapse toggle, Breadcrumb (Owner / Dashboard)
 * - Center: Compact search bar
 * - Right: Trial/Subscription pill, Notifications, Settings trigger, Owner profile menu
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
  const [searchQuery, setSearchQuery] = useState('');

  const [logoutApi] = useLogoutApiMutation();

  const orgName = organization?.name || organization?.code || 'Organization';
  const orgCode = (organization?.code || '').toUpperCase();
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
    <header className="h-[56px] sm:h-16 flex-none bg-white/90 backdrop-blur-md border-b border-zinc-200/80 px-4 sm:px-6 sticky top-0 z-20 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] flex items-center justify-between gap-4">
      {/* ── Left: Hamburger + Collapse Toggle + Breadcrumbs ── */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onMobileOpen}
          className="lg:hidden p-2 rounded-xl text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors focus:outline-hidden"
          aria-label="Open sidebar menu"
        >
          <Menu size={20} />
        </button>

        {/* Desktop Collapse Toggle Button */}
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

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-[11px] text-zinc-500 font-medium">
          <Link
            to="/owner/dashboard"
            className="hover:text-primary transition-colors flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1 rounded-md border border-zinc-200/60 shadow-2xs"
          >
            <LayoutDashboard size={14} className="text-zinc-400" />
            <span className="capitalize font-bold text-zinc-800 truncate max-w-[140px] sm:max-w-none">
              {orgName}
            </span>
          </Link>
          <ChevronRight size={14} className="text-zinc-300 shrink-0" />
          <span className="text-zinc-900 font-bold bg-zinc-100/70 px-2 py-0.5 rounded-md">
            Dashboard
          </span>
        </nav>
      </div>

      {/* ── Center: Search Bar ── */}
      <div className="hidden md:flex items-center flex-1 max-w-sm mx-4">
        <div className="relative w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search modules, companies, settings..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50/80 border border-zinc-200/80 rounded-xl placeholder:text-zinc-400 text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:bg-white transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* ── Right: Subscription Status + Actions + Profile ── */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Subscription Status Pill */}
        {isTrial && (
          <Link
            to="/subscription"
            title="View Subscription Details"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition-colors shrink-0 shadow-2xs"
          >
            <Clock size={12} className="text-emerald-600" />
            <span className="hidden sm:inline">Trial • {daysRemaining !== null ? `${daysRemaining} days left` : 'Active'}</span>
            <span className="sm:hidden">Trial • {daysRemaining !== null ? `${daysRemaining}d` : 'Active'}</span>
          </Link>
        )}
        {isReadOnly && (
          <Link
            to="/subscription"
            title="Trial Expired • Read-Only Mode"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors shrink-0 shadow-2xs"
          >
            <AlertTriangle size={12} className="text-amber-600" />
            <span className="hidden sm:inline">Trial Expired • Read-Only</span>
            <span className="sm:hidden">Read-Only</span>
          </Link>
        )}
        {isActive && !isTrial && (
          <Link
            to="/subscription"
            title="Subscription Active — All Modules Enabled"
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition-all shrink-0 shadow-2xs"
          >
            <CheckCircle2 size={12} className="text-emerald-600" />
            <span>Active Plan</span>
          </Link>
        )}

        {/* Company Quick-Switch Dropdown (if multiple companies) */}
        {companies.length > 1 && (
          <div className="relative hidden xl:block">
            <button
              type="button"
              onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-200/80 bg-zinc-50/70 hover:bg-zinc-100 text-zinc-700 text-xs font-semibold transition-colors"
              aria-expanded={companyDropdownOpen}
              aria-label="Switch company"
            >
              <Building2 size={13} className="text-zinc-500 shrink-0" />
              <span className="max-w-[110px] truncate">{activeCompanyName}</span>
              <ChevronDown size={12} className="text-zinc-400 shrink-0" />
            </button>

            {companyDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setCompanyDropdownOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-zinc-200 rounded-2xl shadow-xl py-2 z-50 animate-slide-up origin-top-right">
                  <div className="px-3 py-1.5 border-b border-zinc-100 text-[9.5px] font-bold text-zinc-400 uppercase tracking-wider">
                    Switch Workspace
                  </div>
                  <div className="max-h-56 overflow-y-auto py-1">
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

        {/* Notifications Icon Button */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 transition-colors border border-transparent hover:border-zinc-200"
        >
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full shadow-2xs" />
        </button>

        {/* Settings Icon Button */}
        <Link
          to="/accounts/settings"
          aria-label="Organization Settings"
          title="Organization Settings"
          className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 transition-colors group border border-transparent hover:border-zinc-200"
        >
          <Settings size={18} className="transition-transform duration-300 group-hover:rotate-45" />
        </Link>

        {/* Owner Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            aria-label="User menu"
            aria-expanded={profileDropdownOpen}
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-zinc-50 rounded-xl transition-all duration-200 border border-transparent hover:border-zinc-200 hover:shadow-2xs group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-700 text-white font-bold flex items-center justify-center text-[10.5px] shadow-2xs group-hover:shadow transition-all">
              {ownerName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-[11px] font-bold text-zinc-800 leading-none truncate max-w-[120px]">{ownerName}</p>
              <p className="text-[8.5px] font-semibold text-zinc-400 uppercase tracking-wide mt-0.5">Owner</p>
            </div>
            <ChevronDown size={14} className="text-zinc-400 hidden md:block ml-0.5 group-hover:text-zinc-600 transition-colors" />
          </button>

          {profileDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setProfileDropdownOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 top-[110%] w-72 bg-white/95 backdrop-blur-xl border border-zinc-200/80 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] py-2 z-40 animate-slide-up origin-top-right">
                {/* User Info Header */}
                <div className="px-4 py-3.5 border-b border-zinc-100/80 mb-2 bg-zinc-50/50 mx-2 rounded-xl space-y-1">
                  <p className="text-sm font-bold text-zinc-900 truncate">{ownerName}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                      Owner
                    </span>
                    {orgCode && (
                      <span className="text-[9.5px] font-mono text-zinc-500 font-bold uppercase">
                        {orgCode}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-medium text-zinc-400 truncate">{ownerEmail}</p>
                </div>

                {/* Quick Organization Summary */}
                <div className="px-4 py-2 mx-2 rounded-xl bg-zinc-50/80 border border-zinc-100/60 space-y-1.5 mb-2 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-400 uppercase text-[9px]">Organization</span>
                    <span className="font-medium text-zinc-800 truncate max-w-[120px]">{orgName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-400 uppercase text-[9px]">Currency</span>
                    <span className="font-mono font-medium text-zinc-800">{organization?.currency || 'INR'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-400 uppercase text-[9px]">Status</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Active
                    </span>
                  </div>
                </div>

                {/* Menu Links */}
                <Link
                  to="/profile"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors mx-1 rounded-lg"
                >
                  <User size={15} />
                  Owner Profile
                </Link>
                <Link
                  to="/company-select"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors mx-1 rounded-lg"
                >
                  <Building2 size={15} />
                  Company Directory
                </Link>
                <Link
                  to="/subscription"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors mx-1 rounded-lg"
                >
                  <CreditCard size={15} />
                  Subscription & Billing
                </Link>
                <Link
                  to="/accounts/settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors mx-1 rounded-lg"
                >
                  <Settings size={15} />
                  Organization Settings
                </Link>

                <div className="my-1 border-t border-zinc-100" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 transition-colors mx-1 rounded-lg text-left"
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
