import React, { useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
import { useLogoutApiMutation, authApi } from '../features/auth/services/authApi';
import { removeCookie } from '../utils/cookieHelper';
import ThemeToggle from '../components/common/ThemeToggle';

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
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const getBreadcrumbLabel = () => {
    const stripped = location.pathname.replace(/^\/company\/[^/]+/, '');
    if (location.pathname.startsWith('/owner/companies') || location.pathname.includes('companies')) return 'Companies';
    if (location.pathname.startsWith('/subscription') || stripped.startsWith('/subscription')) return 'Subscription';
    if (location.pathname.startsWith('/profile') || stripped.startsWith('/profile')) return 'Profile';
    if (location.pathname.includes('/settings') || stripped.startsWith('/settings')) return 'Settings';
    if (stripped.startsWith('/accounts') || stripped.startsWith('/finance') || stripped.startsWith('/accounting')) return 'Finance & Accounts';
    if (stripped.startsWith('/inventory')) return 'Inventory';
    if (stripped.startsWith('/crm') || stripped.startsWith('/sales')) return 'Sales & CRM';
    if (stripped.startsWith('/purchases') || stripped.startsWith('/purchase-requisitions')) return 'Purchases';
    if (stripped.startsWith('/workflows') || stripped.startsWith('/workflow')) return 'Workflows';
    if (stripped.startsWith('/admin') || stripped.startsWith('/users') || stripped.startsWith('/roles')) return 'SSO & Admin';
    if (stripped === '/modules') return 'Dashboard';
    return 'Dashboard';
  };

  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [logoutApi] = useLogoutApiMutation();

  const orgName = organization?.name || organization?.code || 'Organization';
  const orgCode = (organization?.code || '').toUpperCase();
  const ownerName = user?.fullName || user?.username || 'Organization Owner';
  const ownerEmail = user?.email || user?.username || '';
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      if (q.includes('compan') || q.includes('org')) navigate('/owner/companies');
      else if (q.includes('finance') || q.includes('account')) navigate(activeCompanyId ? `/company/${activeCompanyId}/accounts/dashboard` : '/accounts/dashboard');
      else if (q.includes('inventor') || q.includes('stock')) navigate(activeCompanyId ? `/company/${activeCompanyId}/inventory/dashboard` : '/inventory/dashboard');
      else if (q.includes('crm') || q.includes('sale') || q.includes('customer')) navigate(activeCompanyId ? `/company/${activeCompanyId}/crm/dashboard` : '/crm/dashboard');
      else if (q.includes('purchas') || q.includes('rfq') || q.includes('procure')) navigate(activeCompanyId ? `/company/${activeCompanyId}/purchases` : '/purchase-requisitions');
      else if (q.includes('workflow') || q.includes('approv')) navigate(activeCompanyId ? `/company/${activeCompanyId}/workflows` : '/workflows');
      else if (q.includes('subscript') || q.includes('plan') || q.includes('bill')) navigate('/subscription');
      else if (q.includes('setting')) navigate('/owner/settings');
      else if (q.includes('profile') || q.includes('user')) navigate('/profile');
      else navigate('/owner/dashboard');
    }
  };

  const handleSelectCompany = (comp) => {
    dispatch(
      setSelectedCompany({
        id: comp.id,
        code: comp.code,
        name: comp.name || comp.legalName,
      })
    );
    // Refresh the complete authorization context for the selected company
    dispatch(authApi.endpoints.ssoGetMe.initiate(comp.id, { subscribe: false, forceRefetch: true }));
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
      navigate('/', { replace: true });
    }
  }, [logoutApi, dispatch, navigate]);

  return (
    <header className="h-[56px] flex-none bg-[var(--color-surface)]/90 backdrop-blur-md border-b border-[var(--color-border)] px-3 sm:px-6 sticky top-0 z-50 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] flex items-center justify-between gap-2 sm:gap-4">
      {/* ── Left: Hamburger + Collapse Toggle + Breadcrumbs ── */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onMobileOpen}
          className="lg:hidden p-2 rounded-xl text-zinc-500 dark:text-[#A0A6B5] hover:text-zinc-800 dark:hover:text-[#E6E8EE] hover:bg-zinc-100 dark:hover:bg-[#222736] transition-colors focus:outline-hidden"
          aria-label="Open sidebar menu"
        >
          <Menu size={20} />
        </button>

        {/* Desktop Collapse Toggle Button */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-xl text-zinc-400 dark:text-[#6B7184] hover:text-zinc-700 dark:hover:text-[#E6E8EE] hover:bg-zinc-100 dark:hover:bg-[#222736] transition-colors focus:outline-hidden"
            title={isCollapsed ? 'Expand sidebar (⌘B)' : 'Collapse sidebar (⌘B)'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 sm:gap-2 text-[10.4px] text-zinc-500 dark:text-[#A0A6B5] font-medium min-w-0">
          <Link
            to="/owner/dashboard"
            className="hover:text-primary transition-colors flex items-center gap-1.5 bg-[var(--color-surface-2)] px-2 sm:px-2.5 py-1 rounded-md border border-[var(--color-border)] shadow-sm shrink-0"
          >
            <LayoutDashboard size={14} className="text-zinc-400 dark:text-[#6B7184] shrink-0" />
            <strong className="capitalize text-[var(--color-text-primary)] truncate max-w-[80px] xs:max-w-[120px] sm:max-w-none">
              {orgName}
            </strong>
          </Link>
          <ChevronRight size={14} className="text-[var(--color-text-muted)] shrink-0 hidden xs:inline" />
          <span className="text-[var(--color-text-primary)] font-bold bg-[var(--color-surface-2)] px-2 py-1 rounded-md truncate max-w-[100px] sm:max-w-none hidden xs:inline">
            {getBreadcrumbLabel()}
          </span>
        </nav>
      </div>

      {/* ── Center: Search Bar ── */}
      <div className="hidden md:flex items-center flex-1 max-w-sm mx-4">
        <div className="relative w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-[#6B7184] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search modules, companies, settings..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-[#1D212C] border border-[var(--color-border)] rounded-xl placeholder:text-[var(--color-text-muted)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] dark:focus:bg-[#1D212C] transition-all shadow-xs"
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
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-emerald-50 dark:bg-[#34C38F]/15 hover:bg-emerald-100 dark:hover:bg-[#34C38F]/25 text-emerald-700 dark:text-[#34C38F] border border-emerald-200/80 dark:border-[#34C38F]/30 transition-colors shrink-0 shadow-sm"
          >
            <Clock size={12} className="text-emerald-600 dark:text-[#34C38F]" />
            <span className="hidden sm:inline">Trial • {daysRemaining !== null ? `${daysRemaining} days left` : 'Active'}</span>
            <span className="sm:hidden">Trial • {daysRemaining !== null ? `${daysRemaining}d` : 'Active'}</span>
          </Link>
        )}
        {isReadOnly && (
          <Link
            to="/subscription"
            title="Trial Expired • Read-Only Mode"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-amber-50 dark:bg-[#F5B544]/15 hover:bg-amber-100 dark:hover:bg-[#F5B544]/25 text-amber-800 dark:text-[#F5B544] border border-amber-200 dark:border-[#F5B544]/30 transition-colors shrink-0 shadow-sm"
          >
            <AlertTriangle size={12} className="text-amber-600 dark:text-[#F5B544]" />
            <span className="hidden sm:inline">Trial Expired • Read-Only</span>
            <span className="sm:hidden">Read-Only</span>
          </Link>
        )}
        {isActive && !isTrial && (
          <Link
            to="/subscription"
            title="Subscription Active — All Modules Enabled"
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-emerald-50 dark:bg-[#34C38F]/15 hover:bg-emerald-100 dark:hover:bg-[#34C38F]/25 text-emerald-700 dark:text-[#34C38F] border border-emerald-200/80 dark:border-[#34C38F]/30 transition-all shrink-0 shadow-sm"
          >
            <CheckCircle2 size={12} className="text-emerald-600 dark:text-[#34C38F]" />
            <span>Active Plan</span>
          </Link>
        )}

        {/* Single Company Workspace Context Indicator */}
        {companies.length === 1 && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] text-xs font-semibold">
            <Building2 size={13} className="text-zinc-500 dark:text-[#A0A6B5] shrink-0" />
            <span className="max-w-[130px] truncate" title={activeCompanyName}>{activeCompanyName}</span>
          </div>
        )}

        {/* Company Quick-Switch Dropdown (if multiple companies) */}
        {companies.length > 1 && (
          <div className="relative hidden lg:block">
            <button
              type="button"
              onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] hover:bg-[var(--color-sidebar-hover-bg)] text-[var(--color-text-primary)] text-xs font-semibold transition-colors"
              aria-expanded={companyDropdownOpen}
              aria-label="Switch company"
            >
              <Building2 size={13} className="text-zinc-500 dark:text-[#A0A6B5] shrink-0" />
              <span className="max-w-[110px] truncate">{activeCompanyName}</span>
              <ChevronDown size={12} className="text-zinc-400 dark:text-[#6B7184] shrink-0" />
            </button>

            {companyDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setCompanyDropdownOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl dark:shadow-2xl py-2 z-50 animate-slide-up origin-top-right">
                  <div className="px-3 py-1.5 border-b border-[var(--color-border)] text-[9.5px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
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
                          className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-[#EDEEE4] dark:hover:bg-[#222736] transition-colors ${
                            isCurrent ? 'font-bold text-[#2E3D28] dark:text-[#4C8DFF] bg-[#EDEEE4] dark:bg-[#4C8DFF]/15' : 'text-[#485942] dark:text-[#E6E8EE]'
                          }`}
                        >
                          <div className="truncate mr-2">
                            <div className="truncate">{comp.name || comp.legalName}</div>
                            {comp.code && (
                              <div className="text-[10px] font-mono text-[#7A8A6E] dark:text-[#A0A6B5] uppercase">
                                {comp.code}
                              </div>
                            )}
                          </div>
                          {isCurrent && (
                            <Check size={14} className="text-emerald-600 dark:text-[#34C38F] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {activeCompanyId && (
                    <div className="p-2 border-t border-[#D5D8CA] dark:border-[#2A2F3D] bg-[#EDEEE4]/50 dark:bg-[#161922]">
                      <button
                        type="button"
                        onClick={() => {
                          setCompanyDropdownOpen(false);
                          navigate(`/company/${activeCompanyId}/dashboard`);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] text-white text-[11px] font-semibold transition-colors shadow-xs focus:ring-2 focus:ring-[var(--color-primary)]/15"
                      >
                        <Building2 size={13} />
                        <span>Open {activeCompanyName} Workspace</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Notifications Icon Button */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-[#222736] text-zinc-500 dark:text-[#A0A6B5] hover:text-zinc-700 dark:hover:text-[#E6E8EE] transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-[#2A2F3D]"
        >
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white dark:border-[#161922] rounded-full shadow-xs" />
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Settings Icon Button */}
        <Link
          to="/owner/settings"
          aria-label="Organization Settings"
          title="Organization Settings"
          className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-[#222736] text-zinc-500 dark:text-[#A0A6B5] hover:text-zinc-700 dark:hover:text-[#E6E8EE] transition-colors group border border-transparent hover:border-zinc-200 dark:hover:border-[#2A2F3D]"
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
            className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-[#222736] rounded-xl transition-all duration-200 border border-transparent hover:border-zinc-200 dark:hover:border-[#2A2F3D] hover:shadow-xs group"
          >
            <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-[10.5px] shadow-xs group-hover:shadow transition-all">
              {ownerName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-[11px] font-bold text-[var(--color-text-primary)] leading-none truncate max-w-[120px]">{ownerName}</p>
              <p className="text-[8.5px] font-semibold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wide mt-0.5">Owner</p>
            </div>
            <ChevronDown size={14} className="text-zinc-400 dark:text-[#6B7184] hidden md:block ml-0.5 group-hover:text-zinc-600 dark:group-hover:text-[#E6E8EE] transition-colors" />
          </button>

          {profileDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setProfileDropdownOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 top-[110%] w-72 bg-[var(--color-surface)] backdrop-blur-xl border border-[var(--color-border)] rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-2xl py-2 z-40 animate-slide-up origin-top-right">
                {/* User Info Header */}
                <div className="px-4 py-3.5 border-b border-[var(--color-border)] mb-2 bg-[var(--color-surface-2)] mx-2 rounded-xl space-y-1">
                  <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">{ownerName}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-emerald-700 dark:text-[#34C38F] bg-emerald-50 dark:bg-[#34C38F]/15 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-[#34C38F]/30">
                      Owner
                    </span>
                    {orgCode && (
                      <span className="text-[9.5px] font-mono text-zinc-500 dark:text-[#A0A6B5] font-bold uppercase">
                        {orgCode}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-medium text-zinc-400 dark:text-[#6B7184] truncate">{ownerEmail}</p>
                </div>

                {/* Quick Organization Summary */}
                <div className="px-4 py-2 mx-2 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] space-y-1.5 mb-2 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#485942] dark:text-[#6B7184] uppercase text-[9px]">Organization</span>
                    <span className="font-medium text-[#2E3D28] dark:text-[#E6E8EE] truncate max-w-[120px]">{orgName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#485942] dark:text-[#6B7184] uppercase text-[9px]">Currency</span>
                    <span className="font-mono font-medium text-[#2E3D28] dark:text-[#E6E8EE]">{organization?.currency || 'INR'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#485942] dark:text-[#6B7184] uppercase text-[9px]">Status</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-[#34C38F] bg-emerald-50 dark:bg-[#34C38F]/15 px-1.5 py-0.2 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#34C38F]"></span>
                      Active
                    </span>
                  </div>
                </div>

                {/* Menu Links */}
                <Link
                  to="/profile"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-[11px] font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] transition-colors mx-1 rounded-lg"
                >
                  <User size={15} />
                  Owner Profile
                </Link>
                <Link
                  to="/company-select"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-[11px] font-semibold text-[#2E3D28] dark:text-[#E6E8EE] hover:bg-[#EDEEE4] dark:hover:bg-[#222736] hover:text-[#2E3D28] dark:hover:text-[#E6E8EE] transition-colors mx-1 rounded-lg"
                >
                  <Building2 size={15} />
                  Company Directory
                </Link>
                <Link
                  to="/subscription"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-[11px] font-semibold text-[#2E3D28] dark:text-[#E6E8EE] hover:bg-[#EDEEE4] dark:hover:bg-[#222736] hover:text-[#2E3D28] dark:hover:text-[#E6E8EE] transition-colors mx-1 rounded-lg"
                >
                  <CreditCard size={15} />
                  Subscription & Billing
                </Link>
                <Link
                  to="/owner/settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-[11px] font-semibold text-[#2E3D28] dark:text-[#E6E8EE] hover:bg-[#EDEEE4] dark:hover:bg-[#222736] hover:text-[#2E3D28] dark:hover:text-[#E6E8EE] transition-colors mx-1 rounded-lg"
                >
                  <Settings size={15} />
                  Organization Settings
                </Link>

                <div className="my-1 border-t border-zinc-100 dark:border-[#2A2F3D]" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-[11px] font-semibold text-rose-600 dark:text-[#F0616D] hover:bg-rose-50 dark:hover:bg-[#F0616D]/15 transition-colors mx-1 rounded-lg text-left"
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
