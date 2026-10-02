import React from 'react';
import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';

function NavigationCard({ items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {items.map((nav, idx) => {
        const Icon = nav.icon || Layers;
        return (
          <Link
            key={nav.id || idx}
            to={nav.path || '#'}
            className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all group active:scale-[0.98] min-w-0"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors shrink-0">
              <Icon size={16} />
            </div>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 line-clamp-2">
              {nav.title}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export default React.memo(NavigationCard);
