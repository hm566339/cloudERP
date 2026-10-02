import React from 'react';

export function SettingsCard({ title, description, children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 ${className}`}>
      {(title || description) && (
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          {title && <h2 className="text-lg font-semibold text-slate-900">{title}</h2>}
          {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
