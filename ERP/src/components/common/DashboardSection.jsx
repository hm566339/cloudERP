import React from 'react';

function DashboardSection({ title, icon: Icon, description, action, children, className = '' }) {
  return (
    <div className={`mb-5 min-w-0 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
        <div>
          <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
            {Icon && <Icon size={18} className="text-blue-500" />}
            {title}
          </h2>
          {description && <p className="text-sm text-zinc-500 mt-1">{description}</p>}
        </div>
        {action && (
          <div className="mt-3 sm:mt-0 flex-shrink-0">
            {action}
          </div>
        )}
      </div>
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}

export default React.memo(DashboardSection);
