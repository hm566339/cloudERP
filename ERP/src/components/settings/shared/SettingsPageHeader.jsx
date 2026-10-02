import React from 'react';

export function SettingsPageHeader({ title, description }) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>
      {description && <p className="text-slate-500 text-sm">{description}</p>}
    </div>
  );
}
