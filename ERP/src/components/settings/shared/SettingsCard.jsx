import React from 'react';

export function SettingsCard({ title, description, children, className = "" }) {
  return (
    <div className={`bg-[var(--color-surface)] rounded-xl shadow-sm border border-[var(--color-border)] overflow-hidden mb-6 ${className}`}>
      {(title || description) && (
        <div className="p-6 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]/60">
          {title && <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h2>}
          {description && <p className="text-sm text-[var(--color-text-secondary)] mt-1">{description}</p>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
