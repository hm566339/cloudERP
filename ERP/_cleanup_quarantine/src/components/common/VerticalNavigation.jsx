import React from 'react';

/**
 * Enterprise-grade, generic reusable VerticalNavigation component.
 *
 * Visual Specifications:
 * - Extremely compact left-side navigation list
 * - Small vertical item height: ~36-38px
 * - Minimal top/bottom spacing (gap-0.5 to gap-1)
 * - Clean ~12-14px horizontal padding (px-3.5)
 * - Font size ~14px (text-sm), clean and readable
 * - Inactive items: clean, no visible border or background, hover subtly
 * - Active item: thin dark/neutral border, rounded corners around 8px (rounded-lg),
 *   clean white/neutral background with subtle highlight border matching the reference
 * - Accessible: semantic `<nav>`, `<button>` with `aria-current="page"`, visible focus ring
 * - Responsive: vertical stack on desktop, horizontal scrollable on mobile without extra height
 * - Data-driven: accepts any dynamic array of navigation items
 */
export default function VerticalNavigation({
  items = [],
  activeItem,
  onItemChange,
  className = '',
  itemClassName = '',
  activeItemClassName = '',
  inactiveItemClassName = '',
  ariaLabel = 'Section Navigation',
}) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label={ariaLabel}
      className={`flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible hide-scrollbar p-1 shrink-0 ${className}`}
    >
      {items.map((item, index) => {
        if (!item) return null;

        const value = item.value !== undefined ? item.value : (item.id || item.key || index);
        const label = item.label || item.name || item.title || value;
        const Icon = item.icon;
        const isDisabled = Boolean(item.disabled);
        const isActive = activeItem !== undefined && (activeItem === value || activeItem === item.id || activeItem === item.key);

        const handleClick = (e) => {
          e.preventDefault();
          if (isDisabled) return;
          if (onItemChange) {
            onItemChange(value, item);
          }
        };

        // Styling:
        // Active item: clean white/neutral bg, thin dark/neutral border (border-zinc-900 / border-zinc-300), rounded ~8px
        // Inactive item: no visible border or bg, subtle hover
        const activeStyles = `bg-white text-zinc-900 font-semibold border border-zinc-300/90 shadow-2xs ${activeItemClassName}`;
        const inactiveStyles = `bg-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/60 border border-transparent font-medium ${inactiveItemClassName}`;
        const disabledStyles = `opacity-40 cursor-not-allowed pointer-events-none`;

        return (
          <button
            key={value || index}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-current={isActive ? 'page' : undefined}
            disabled={isDisabled}
            onClick={handleClick}
            className={`group relative flex items-center gap-2.5 px-3.5 h-[36px] md:h-[38px] text-[13.5px] tracking-tight rounded-lg transition-all duration-150 select-none whitespace-nowrap text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 focus-visible:border-zinc-400 ${
              isActive ? activeStyles : inactiveStyles
            } ${isDisabled ? disabledStyles : 'cursor-pointer'} ${itemClassName}`}
          >
            {Icon && (
              <span
                className={`shrink-0 flex items-center justify-center transition-colors ${
                  isActive ? 'text-zinc-900' : 'text-zinc-400 group-hover:text-zinc-700'
                }`}
              >
                {React.isValidElement(Icon) ? Icon : <Icon size={16} />}
              </span>
            )}
            <span className="truncate flex-1">{label}</span>
            {item.badge !== undefined && item.badge !== null && (
              <span
                className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200 group-hover:text-zinc-700'
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
