import React, { createContext, useContext } from 'react';

const TabsContext = createContext(null);

/**
 * Standard Tabs component.
 * Follows ERP design tokens: zinc palette, crisp active indicator, accessible keyboard/click.
 *
 * Supports both simple declarative prop mode and compound components:
 * Mode 1: <Tabs tabs={[{ key: 'all', label: 'All' }]} value={tab} onChange={setTab} />
 * Mode 2: <Tabs value={tab} onChange={setTab}><TabsList><TabsTrigger value="1">Tab 1</TabsTrigger></TabsList>...</Tabs>
 */
export function Tabs({
  value,
  onChange,
  tabs,
  variant = 'pill', // 'pill' | 'underline'
  children,
  className = '',
}) {
  return (
    <TabsContext.Provider value={{ value, onChange, variant }}>
      <div className={`w-full ${className}`}>
        {tabs && Array.isArray(tabs) ? (
          <TabsList variant={variant}>
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.key || tab.id || tab.value}
                value={tab.key || tab.id || tab.value}
                icon={tab.icon}
                badge={tab.badge || tab.count}
              >
                {tab.label || tab.title}
              </TabsTrigger>
            ))}
          </TabsList>
        ) : (
          children
        )}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, variant: propVariant, className = '' }) {
  const ctx = useContext(TabsContext);
  const variant = propVariant || ctx?.variant || 'pill';

  const variantClasses = {
    pill: 'bg-zinc-100/70 p-1 rounded-xl border border-zinc-200/60 inline-flex items-center gap-1 overflow-x-auto hide-scrollbar max-w-full',
    underline:
      'border-b border-zinc-200 flex items-center gap-6 overflow-x-auto hide-scrollbar w-full',
  };

  return (
    <div
      role="tablist"
      className={`${variantClasses[variant] || variantClasses.pill} ${className}`}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  icon: Icon,
  badge,
  children,
  className = '',
  disabled = false,
}) {
  const ctx = useContext(TabsContext);
  const isActive = ctx?.value === value;
  const variant = ctx?.variant || 'pill';

  const handleClick = () => {
    if (!disabled && ctx?.onChange) {
      ctx.onChange(value);
    }
  };

  if (variant === 'underline') {
    return (
      <button
        type="button"
        role="tab"
        aria-selected={isActive}
        disabled={disabled}
        onClick={handleClick}
        className={`pb-3 pt-2 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
          isActive
            ? 'border-zinc-900 text-zinc-900'
            : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300'
        } ${className}`}
      >
        {Icon && (
          <span className="shrink-0">
            {React.isValidElement(Icon) ? Icon : <Icon size={14} />}
          </span>
        )}
        <span>{children}</span>
        {badge !== undefined && (
          <span
            className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
              isActive
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-200 text-zinc-600'
            }`}
          >
            {badge}
          </span>
        )}
      </button>
    );
  }

  // Pill variant (default)
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={handleClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed ${
        isActive
          ? 'bg-white text-zinc-900 shadow-2xs border border-zinc-200/80'
          : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
      } ${className}`}
    >
      {Icon && (
        <span className="shrink-0">
          {React.isValidElement(Icon) ? Icon : <Icon size={14} />}
        </span>
      )}
      <span>{children}</span>
      {badge !== undefined && (
        <span
          className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
            isActive
              ? 'bg-zinc-100 text-zinc-900 border border-zinc-200'
              : 'bg-zinc-200/80 text-zinc-600'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

export function TabsContent({ value, children, className = '' }) {
  const ctx = useContext(TabsContext);
  if (ctx?.value !== value) return null;

  return (
    <div role="tabpanel" className={`mt-4 ${className}`}>
      {children}
    </div>
  );
}

export default Tabs;
