import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import EntityHeader from '../../../../components/common/EntityHeader';
import CrmDetailTabs from './CrmDetailTabs';
import CrmDetailSkeleton from './CrmDetailSkeleton';

/**
 * Reusable layout shell for Sales & CRM entity detail views (Leads, Contacts, Accounts, Opportunities, Quotations).
 * Mirrors the exact outer container max-width (1280px), vertical rhythm, header sticky positioning,
 * KPI slot, 30%/70% two-column split, and tab navigation from CustomerDetails.jsx in Accounts.
 *
 * Props:
 *   loading        boolean
 *   error          string | null
 *   notFound       boolean
 *   notFoundTitle  string
 *   notFoundMessage string
 *   onBack         () => void
 *   backUrl        string (fallback if onBack not supplied)
 *   backLabel      string (for not-found state action button)
 *   title          string (Entity name/code)
 *   badge          object (Forwarded to StatusBadge via EntityHeader)
 *   metadata       Array<{ icon: LucideIcon, label: string }>
 *   actions        Array<ActionItem> (Header buttons / dropdowns)
 *   kpiStrip       ReactNode (Rendered in EntityHeader bottomSlot)
 *   sidebar        ReactNode (Left 30% column: InfoCards, QuickActionsCard)
 *   tabs           Array<{ id: string, label: string, icon: LucideIcon, count?: number }>
 *   activeTab      string
 *   onTabChange    (tabId: string) => void
 *   children       ReactNode (Right 70% column active tab content)
 *   modals         ReactNode (Modal dialogs)
 *   className      string
 */
export default function CrmDetailShell({
  loading = false,
  error = null,
  notFound = false,
  notFoundTitle = 'Record Not Found',
  notFoundMessage = "We couldn't find the requested CRM record.",
  onBack,
  backUrl,
  backLabel = 'Go Back',
  title,
  badge,
  metadata = [],
  actions = [],
  kpiStrip,
  sidebar,
  tabs = [],
  activeTab,
  onTabChange,
  children,
  modals,
  className = '',
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backUrl) {
      navigate(backUrl);
    } else {
      navigate(-1);
    }
  };

  /* ── 1. Loading State ── */
  if (loading) {
    return <CrmDetailSkeleton />;
  }

  /* ── 2. Error / Not-Found State ── */
  if (error || notFound) {
    return (
      <div className="animate-fade-in pb-12 bg-zinc-50/30 dark:bg-[#0F1117] min-h-screen pt-12">
        <div className="p-8 max-w-lg mx-auto bg-white dark:bg-[#161922] rounded-xl border border-rose-200 dark:border-rose-800/40 shadow-sm text-center">
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-[#E6E8EE] mb-2">
            {error || notFoundTitle}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-[#A0A6B5] mb-6">
            {notFoundMessage}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 rounded-lg text-sm font-semibold transition-colors"
            >
              <ArrowLeft size={16} />
              {backLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── 3. Detail Page Layout ── */
  return (
    <div className={`animate-fade-in pb-12 bg-zinc-50/30 dark:bg-[#0F1117] min-h-screen ${className}`}>
      {/* Sticky Header with Identity + Actions + KPI Strip */}
      <EntityHeader
        onBack={handleBack}
        title={title}
        badge={badge}
        metadata={metadata}
        actions={actions}
        bottomSlot={kpiStrip}
        sticky
      />

      {/* Page Body Container (1280px max-width, matching Accounts) */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 mt-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar (30%) */}
          <div className="w-full lg:w-[30%] space-y-5">
            {sidebar}
          </div>

          {/* Right Content Area (70%) */}
          <div className="w-full lg:w-[70%] space-y-5">
            {/* Sticky Tab Navigation */}
            {tabs.length > 0 && (
              <CrmDetailTabs
                tabs={tabs}
                activeTab={activeTab}
                onChange={onTabChange}
              />
            )}

            {/* Tab Content Panels */}
            <div className="min-h-[400px] space-y-5">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Modals & Dialogs Slot */}
      {modals}
    </div>
  );
}
