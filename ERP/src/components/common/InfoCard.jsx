import React from 'react';

/**
 * Generic reusable InfoCard component.
 *
 * A clean card with an optional icon-badge header and arbitrary content slot.
 * Replaces the repeated inline card-header pattern across detail pages.
 *
 * Works for:
 *   - Customer Details, Vendor Details, Employee Details
 *   - Billing Address, Shipping Address
 *   - Contact Information, Bank Information
 *   - Tax Information, Company Info
 *   - Any key/value information section
 *
 * Props:
 *   title          string              — card heading text
 *   icon           LucideIcon          — icon component rendered in badge
 *   iconBg         string              — Tailwind bg class for icon badge (default: 'bg-zinc-100')
 *   iconColor      string              — Tailwind text class for icon (default: 'text-zinc-500')
 *   action         ReactNode           — optional element rendered at top-right (e.g. edit button)
 *   children       ReactNode           — card body content
 *   className      string              — additional classes on root element
 *   bodyClassName  string              — additional classes on body wrapper
 *   noPadding      boolean             — skip body padding (for full-bleed content)
 *
 * Usage:
 *   <InfoCard title="Customer Details" icon={User} iconBg="bg-blue-50" iconColor="text-blue-600">
 *     <InfoField label="Email" value={customer.email} />
 *   </InfoCard>
 *
 *   <InfoCard title="Billing Address" icon={MapPin} iconBg="bg-amber-50" iconColor="text-amber-600">
 *     <p className="text-sm text-zinc-900">{customer.city}</p>
 *   </InfoCard>
 */
export default function InfoCard({
  title,
  icon: Icon,
  iconBg = 'bg-zinc-100',
  iconColor = 'text-zinc-500',
  action,
  children,
  className = '',
  bodyClassName = '',
  noPadding = false,
}) {
  return (
    <div
      className={`bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden ${className}`}
    >
      {/* Card header */}
      {(title || Icon || action) && (
        <div className="px-4 py-3.5 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C] flex items-center justify-between gap-3">
          <h3 className="font-bold text-zinc-800 dark:text-[#E6E8EE] text-[13.5px] tracking-tight">{title}</h3>
          {(Icon || action) && (
            <div className="flex items-center gap-2 shrink-0">
              {action}
              {Icon && (
                <span
                  className={`p-1.5 rounded-lg ${iconBg} ${iconColor} dark:bg-[#161922] dark:text-[#4C8DFF] flex items-center justify-center`}
                >
                  <Icon size={15} />
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Card body */}
      <div className={noPadding ? '' : `p-5 ${bodyClassName}`}>{children}</div>
    </div>
  );
}

/**
 * InfoField — companion helper for key/value rows inside InfoCard.
 *
 * Props:
 *   label      string
 *   value      ReactNode
 *   mono       boolean   — render value in monospace (codes, IDs, etc.)
 *   highlight  boolean   — render value with subtle zinc-100 pill background
 *   className  string
 */
export function InfoField({ label, value, mono = false, highlight = false, className = '' }) {
  return (
    <div className={className}>
      <p className="text-[8.5px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184] mb-0.5">
        {label}
      </p>
      <p
        className={`text-sm font-semibold text-zinc-900 dark:text-[#E6E8EE] mt-0.5 ${
          mono ? 'font-mono' : ''
        } ${
          highlight
            ? 'bg-zinc-100 dark:bg-[#1D212C] px-2 py-0.5 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] text-zinc-900 dark:text-[#E6E8EE] inline-block'
            : ''
        }`}
      >
        {value ?? '—'}
      </p>
    </div>
  );
}
