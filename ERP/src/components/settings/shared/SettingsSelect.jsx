import React from 'react';
import CustomSelect from '../../common/CustomSelect';

export function SettingsSelect({ label, id, description, options = [], value, onChange, disabled, className = '', ...props }) {
  return (
    <div className={`mb-5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-[#2E3D28] dark:text-zinc-300 mb-1.5">
          {label}
        </label>
      )}
      <CustomSelect
        id={id}
        options={options}
        value={value}
        onChange={onChange}
        disabled={disabled}
        size="md"
        {...props}
      />
      {description && <p className="text-xs text-[#485942] dark:text-zinc-400 mt-1.5">{description}</p>}
    </div>
  );
}
