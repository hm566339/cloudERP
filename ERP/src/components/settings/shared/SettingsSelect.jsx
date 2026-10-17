import React from 'react';
import CustomSelect from '../../common/CustomSelect';

export function SettingsSelect({ label, id, description, options = [], value, onChange, disabled, className = '', ...props }) {
  return (
    <div className={`mb-5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-zinc-700 mb-1.5">
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
      {description && <p className="text-xs text-zinc-500 mt-1.5">{description}</p>}
    </div>
  );
}
