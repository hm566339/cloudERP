import React from 'react';
import { X } from 'lucide-react';
import TransactionFormField from './TransactionFormField';

export default function TransactionFormHeader({ config, values, errors, onChange, onClose, disabled, context }) {
  const header = config.header || {};
  return (
    <header className="flex flex-col sm:flex-row flex-wrap xl:flex-nowrap items-stretch sm:items-center justify-between gap-3 p-2.5 sm:p-3 border-b border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/70 dark:bg-[#161922]">
      <div className="flex items-center justify-between gap-3 min-w-0">
        <div className="flex flex-col min-w-0">
          <h1 className="text-sm sm:text-base font-bold text-zinc-800 dark:text-[#E6E8EE] truncate">{header.title || config.title}</h1>
          {(header.subtitle || config.subtitle) && (
            <p className="text-[9px] text-zinc-500 dark:text-[#A0A6B5] font-medium truncate">{header.subtitle || config.subtitle}</p>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            disabled={disabled}
            className="sm:hidden p-1.5 flex-none text-zinc-400 dark:text-[#A0A6B5] hover:text-zinc-600 dark:hover:text-[#E6E8EE] rounded-full hover:bg-zinc-200/60 dark:hover:bg-[#222736] transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 flex-1 xl:justify-end min-w-0">
        {(header.fields || []).map(field => (
          <div key={field.key} className="min-w-[80px]">
            <TransactionFormField
              field={{ ...field, className: 'flex items-center gap-1.5' }}
              value={values[field.key]}
              error={errors?.[field.key]}
              onChange={onChange}
              disabled={disabled}
              context={context}
            />
          </div>
        ))}
        {header.actions?.({ values, onChange, disabled, context })}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          disabled={disabled}
          className="hidden sm:inline-flex p-1.5 flex-none text-zinc-400 dark:text-[#A0A6B5] hover:text-zinc-600 dark:hover:text-[#E6E8EE] rounded-full hover:bg-zinc-200/60 dark:hover:bg-[#222736] transition-colors ml-auto xl:ml-0"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      )}
    </header>
  );
}
