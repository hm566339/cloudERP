import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { BarChart3, Bell, Search, ChevronRight, Settings } from 'lucide-react'
import BackendStatusIndicator from "../common/BackendStatusIndicator";
import { SettingsSidebar } from '../settings';

// Helper to format url segments into readable labels
const formatLabel = (segment) => {
  if (!segment) return '';
  // If it's a UUID (heuristic: long string with hyphens, skip or truncate)
  if (segment.length > 20 && segment.includes('-')) return 'Details';
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function Header({ company = null }) {
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  // Build breadcrumbs dynamically
  const dynamicBreadcrumbs = pathSegments.map((segment, index) => {
    const href = '/' + pathSegments.slice(0, index + 1).join('/');
    return {
      label: formatLabel(segment),
      href: index === pathSegments.length - 1 ? null : href
    };
  }).filter(b => b.label !== 'Details'); // Hide raw UUIDs in breadcrumbs

  // Prepend Home
  if (dynamicBreadcrumbs.length > 0 && dynamicBreadcrumbs[0].label !== 'Home') {
    dynamicBreadcrumbs.unshift({ label: 'Home', href: '/' });
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 glass border-b border-zinc-200/80">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-sm">
                <BarChart3 size={16} className="text-white" />
              </div>
              <span className="font-700 text-zinc-900 text-sm hidden sm:block">
                FinanceOS
              </span>
            </Link>

            {/* Breadcrumbs */}
            {dynamicBreadcrumbs.length > 0 && (
              <nav className="hidden md:flex items-center gap-1 text-sm text-zinc-500 flex-1 min-w-0 ml-4">
                {dynamicBreadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <ChevronRight size={14} className="text-zinc-300 shrink-0" />}
                    {crumb.href ? (
                      <Link
                        to={crumb.href}
                        className="hover:text-primary transition-colors truncate font-medium"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-zinc-800 font-medium truncate">{crumb.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            )}

            {/* Right actions */}
            <div className="flex items-center gap-2 shrink-0">
              <BackendStatusIndicator />
              {company && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-50 rounded-xl border border-zinc-200">
                  <div className="w-5 h-5 bg-gradient-to-br from-primary-400 to-primary-600 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold text-[7.2px]">
                      {company.companyName?.charAt(0) || 'C'}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-zinc-700 max-w-[96px] truncate">
                    {company.companyName}
                  </span>
                </div>
              )}

              <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 transition-colors">
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary/10 rounded-full" />
              </button>

              <button
                type="button"
                aria-label="Settings"
                title="Settings"
                onClick={() => setSettingsOpen(true)}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 transition-colors group"
              >
                <Settings size={18} className="transition-transform duration-300 group-hover:rotate-45" />
              </button>

              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-700 flex items-center justify-center shadow-sm cursor-pointer">
                <span className="text-white font-semibold text-xs">JD</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <SettingsSidebar
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  )
}

