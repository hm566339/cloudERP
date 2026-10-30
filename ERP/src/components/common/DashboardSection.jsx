import React from 'react';

function DashboardSection({ title, icon: Icon, description, action, children, className = '' }) {
  return (
    <div className={`mb-5 min-w-0 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
        <div>
          <h2 className="text-base font-bold text-[#2E3D28] dark:text-[#E6E8EE] flex items-center gap-2">
            {Icon && <Icon size={18} className="text-[#2E3D28]" />}
            {title}
          </h2>
          {description && <p className="text-sm text-[#485942] dark:text-[#A0A6B5] mt-1">{description}</p>}
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
