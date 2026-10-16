import React from 'react';

export function SettingsCard({ title, description, children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden mb-6 ${className}`}>
      {(title || description) && (
        <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
          {title && <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>}
          {description && <p className="text-sm text-zinc-500 mt-1">{description}</p>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
