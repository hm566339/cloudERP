import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import StatusBadge from './StatusBadge';
import RequirePermission from './RequirePermission';

/**
 * Generic reusable EntityHeader for detail pages.
 *
 * Works for: Customer, Vendor, Product, Invoice, Sales Order,
 *            Purchase Order, Employee, Company — any entity detail page.
 *
 * Layout (sticky):
 *   [← Back]  Title  <StatusBadge>
 *              # CODE · Company · Updated date
 *                                        [Edit] [Delete] [More Actions ▾]
 *   ─────────────────────────────────────────────────────────────────────
 *   bottomSlot  (e.g. KPI card strip)
 *
 * Props:
 *   onBack       () => void            — back button handler
 *   title        string                — entity name
 *   badge        { label, isActive, isDeleted, isClosed, status }
 *                  — forwarded to <StatusBadge>; if omitted no badge shown
 *   metadata     Array<{ icon: LucideIcon, label: string }>
 *                  — small info chips below the title
 *   actions      Array<ActionItem>     — header action buttons
 *   bottomSlot   ReactNode            — rendered below the divider (KPI strip)
 *   sticky       boolean (default true)
 *   className    string
 *
 * ActionItem shape:
 *   { label, icon?, onClick?, variant?, type?, items?,
 *     permission?: { module, action, behavior? } }
 *
 *   type = 'button'   (default) — renders a plain button
 *   type = 'dropdown' — renders a dropdown; requires `items[]`
 *
 *   variant = 'primary' | 'secondary' (default) | 'danger'
 *
 *   permission — wraps with <RequirePermission> when provided
 */
export default function EntityHeader({
  onBack,
  title,
  badge,
  metadata = [],
  actions = [],
  bottomSlot,
  sticky = true,
  className = '',
}) {
  const stickyClass = sticky ? 'sticky top-0 z-40' : '';

  return (
    <div
      className={`bg-white border-b border-zinc-200 shadow-sm pt-4 pb-0 ${stickyClass} ${className}`}
    >
      <div className="max-w-[1280px] mx-auto px-4 md:px-8">
        {/* Top row: identity + actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          {/* Left: back + title + metadata */}
          <div className="flex items-center gap-4 min-w-0">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2.5 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200 rounded-lg transition-colors shrink-0"
                title="Go Back"
                aria-label="Go back"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="min-w-0">
              {/* Title + badge */}
              <div className="flex items-center gap-3 flex-wrap">
                {title && (
                  <h1 className="text-2xl font-black text-zinc-900 tracking-tight truncate">
                    {title}
                  </h1>
                )}
                {badge && <StatusBadge {...badge} />}
              </div>
              {/* Metadata chips */}
              {metadata.length > 0 && (
                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1 text-sm font-medium text-zinc-500">
                  {metadata.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <React.Fragment key={i}>
                        {i > 0 && (
                          <span className="w-1 h-1 rounded-full bg-zinc-300 shrink-0" />
                        )}
                        <span className="flex items-center gap-1.5 whitespace-nowrap">
                          {Icon && <Icon size={13} className="shrink-0" />}
                          {item.label}
                        </span>
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: action buttons */}
          {actions.length > 0 && (
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
              {actions.map((action, i) =>
                action.type === 'dropdown' ? (
                  <DropdownAction key={i} action={action} />
                ) : (
                  <ButtonAction key={i} action={action} />
                )
              )}
            </div>
          )}
        </div>

        {/* Bottom slot (KPI strip, tabs, etc.) */}
        {bottomSlot && <div>{bottomSlot}</div>}
      </div>
    </div>
  );
}

/* ── Internal: standard button action ───────────────────────────────────── */
function ButtonAction({ action }) {
  const { label, icon: Icon, onClick, variant = 'secondary', permission, disabled } = action;

  const variantClass =
    variant === 'danger'
      ? 'bg-white border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 focus:ring-rose-200'
      : variant === 'primary'
      ? 'bg-zinc-900 border-zinc-900 text-white hover:bg-zinc-800 focus:ring-zinc-900'
      : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 focus:ring-zinc-200';

  const btn = (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-bold shadow-sm transition-all focus:ring-2 focus:outline-none disabled:opacity-50 disabled:pointer-events-none ${variantClass}`}
    >
      {Icon && <Icon size={15} />}
      {label}
    </button>
  );

  if (permission) {
    return (
      <RequirePermission
        module={permission.module}
        action={permission.action}
        behavior={permission.behavior ?? (variant === 'danger' ? 'hide' : 'disable')}
      >
        {btn}
      </RequirePermission>
    );
  }
  return btn;
}

/* ── Internal: dropdown action ──────────────────────────────────────────── */
function DropdownAction({ action }) {
  const { label, icon: Icon, items = [], variant = 'primary' } = action;
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const variantClass =
    variant === 'primary'
      ? 'bg-zinc-900 border-zinc-900 text-white hover:bg-zinc-800'
      : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-bold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-zinc-900 ${variantClass}`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {Icon && <Icon size={15} />}
        {label}
        <ChevronDown
          size={15}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-zinc-200 z-50 overflow-hidden animate-fade-in">
          <div className="p-1.5 space-y-0.5">
            {items.map((item, i) => {
              if (item.type === 'divider') {
                return <div key={i} className="h-px bg-zinc-100 my-1 mx-2" />;
              }
              const ItemIcon = item.icon;
              const content = (
                <button
                  key={i}
                  onClick={() => { item.onClick?.(); setOpen(false); }}
                  disabled={item.disabled}
                  className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-2.5 transition-colors disabled:opacity-40 disabled:pointer-events-none ${
                    item.variant === 'danger'
                      ? 'text-rose-600 hover:bg-rose-50'
                      : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900'
                  }`}
                >
                  {ItemIcon && <ItemIcon size={15} />}
                  {item.label}
                </button>
              );
              if (item.permission) {
                return (
                  <RequirePermission
                    key={i}
                    module={item.permission.module}
                    action={item.permission.action}
                    behavior={item.permission.behavior ?? 'hide'}
                  >
                    {content}
                  </RequirePermission>
                );
              }
              return content;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
