import React from 'react';

export function SettingsLayout({ children }) {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full animate-fade-in">
      {children}
    </div>
  );
}
