import React from 'react';

export function SettingsPageHeader({ title, description }) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-[#2E3D28] dark:text-[#E6E8EE] mb-2">{title}</h1>
      {description && <p className="text-[#485942] dark:text-[#A0A6B5] text-sm">{description}</p>}
    </div>
  );
}
