import React from 'react';

/**
 * Generic reusable QuickActionsCard.
 *
 * A card that displays a list of clickable actions, each with an icon,
 * label, and optional trailing icon.
 *
 * Works for:
 *   - Customer: Create Invoice / Record Receipt / View Ledger
 *   - Vendor:   Create Bill / Record Payment / View Ledger
 *   - Product:  Edit Product / Adjust Stock / View Transactions
 *   - Employee: Create Leave Request / View Payslip / etc.
 *   - Any entity detail page
 *
 * Props:
 *   title      string         — card heading (default: 'Quick Actions')
 *   actions    Array<ActionItem>
 *   className  string
 *
 * ActionItem shape:
 *   {
 *     label:        string              required
 *     icon:         LucideIcon          required
 *     iconBg?:      string              Tailwind class (default: 'bg-zinc-100')
 *     iconColor?:   string              Tailwind class (default: 'text-zinc-700')
 *     iconHoverBg?: string              Tailwind class (default: iconBg + darker shade)
 *     trailingIcon?: LucideIcon         icon shown on the right (e.g. Plus, ExternalLink)
 *     trailingColor?: string            Tailwind text class for trailing icon hover
 *     onClick?:     () => void
 *     disabled?:    boolean
 *   }
 *
 * Usage:
 *   <QuickActionsCard
 *     title="Quick Actions"
 *     actions={[
 *       { label: "Create Invoice", icon: FileText, iconBg: "bg-blue-50", iconColor: "text-blue-600", trailingIcon: Plus, onClick: ... },
 *       { label: "Record Receipt", icon: Receipt, iconBg: "bg-emerald-50", iconColor: "text-emerald-600", trailingIcon: Plus, onClick: ... },
 *       { label: "View Ledger", icon: BookOpen, iconBg: "bg-purple-50", iconColor: "text-purple-600", trailingIcon: ExternalLink, onClick: ... },
 *     ]}
 *   />
 */
export default function QuickActionsCard({ title = 'Quick Actions', actions = [], className = '' }) {
  if (!actions.length) return null;

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-zinc-100 bg-zinc-50/50">
        <h3 className="font-bold text-zinc-800 text-[13.5px] tracking-tight">{title}</h3>
      </div>

      {/* Actions list */}
      <div className="p-2">
        {actions.map((action, i) => {
          const {
            label,
            icon: Icon,
            iconBg = 'bg-zinc-100',
            iconColor = 'text-zinc-700',
            iconHoverBg,
            trailingIcon: TrailingIcon,
            trailingColor = 'text-zinc-400',
            onClick,
            disabled = false,
          } = action;

          // Derive hover bg for icon: strip 50 → 100, or append /70
          const hoverIconBg = iconHoverBg
            ? iconHoverBg
            : iconBg.replace('-50', '-100').replace('bg-zinc-100', 'bg-zinc-200');

          return (
            <button
              key={i}
              onClick={onClick}
              disabled={disabled}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-zinc-50 rounded-xl transition-colors group disabled:opacity-40 disabled:pointer-events-none"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg transition-colors ${iconBg} ${iconColor} group-hover:${hoverIconBg}`}
                >
                  {Icon && <Icon size={16} />}
                </div>
                <span className="text-sm font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">
                  {label}
                </span>
              </div>
              {TrailingIcon && (
                <TrailingIcon
                  size={15}
                  className={`shrink-0 transition-colors ${trailingColor} group-hover:${iconColor}`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
