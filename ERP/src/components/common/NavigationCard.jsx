import React from 'react';
import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';

function NavigationCard({ items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 3xl:grid-cols-8 gap-3">
      {items.map((nav, idx) => {
        const Icon = nav.icon || Layers;
        return (
          <Link
            key={nav.id || idx}
            to={nav.path || '#'}
            className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface)] dark:bg-[#161922] border border-[var(--color-border)] dark:border-[#2A2F3D] hover:border-[var(--color-border-hover)] dark:hover:border-zinc-600 hover:bg-[var(--color-surface-2)] dark:hover:bg-[#1D212C] hover:shadow-xs transition-all group active:scale-[0.98] min-w-0"
          >
            <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-2)] dark:bg-[#1D212C] border border-[var(--color-border)] dark:border-[#2A2F3D] flex items-center justify-center text-[var(--color-text-primary)] dark:text-[#A0A6B5] group-hover:bg-[var(--color-sidebar-hover-bg)] group-hover:text-[var(--color-text-primary)] group-hover:border-[var(--color-border-hover)] transition-colors shrink-0">
              <Icon size={16} />
            </div>
            <span className="text-sm font-semibold text-[var(--color-text-primary)] dark:text-[#E6E8EE] group-hover:text-[var(--color-text-primary)] dark:group-hover:text-white line-clamp-2">
              {nav.title}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export default React.memo(NavigationCard);
