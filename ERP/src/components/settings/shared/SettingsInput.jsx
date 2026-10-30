import React from 'react';

export function SettingsInput({ label, id, description, ...props }) {
  return (
    <div className="mb-5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-[#2E3D28] dark:text-[#E6E8EE] mb-1.5">
          {label}
        </label>
      )}
      <input
        id={id}
        className="w-full px-4 py-2 border border-[#D5D8CA] dark:border-[#2A2F3D] rounded-xl focus:ring-2 focus:ring-[#2E3D28]/15 focus:border-[#2E3D28] outline-none transition-colors text-[#2E3D28] dark:text-[#E6E8EE] bg-white dark:bg-[#1D212C] placeholder:text-[#7A8A6E] dark:placeholder:text-[#6B7184]"
        {...props}
      />
      {description && <p className="text-xs text-[#485942] dark:text-[#A0A6B5] mt-1.5">{description}</p>}
    </div>
  );
}
