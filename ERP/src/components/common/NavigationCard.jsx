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
            className="flex items-center gap-3 p-3 rounded-xl bg-white border border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition-all group active:scale-[0.98] min-w-0"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-500 group-hover:bg-zinc-100 group-hover:text-zinc-900 group-hover:border-zinc-200 transition-colors shrink-0">
              <Icon size={16} />
            </div>
            <span className="text-sm font-semibold text-zinc-700 group-hover:text-zinc-900 line-clamp-2">
              {nav.title}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export default React.memo(NavigationCard);
