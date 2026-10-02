import React from 'react';
import { X } from 'lucide-react';
import TransactionFormField from './TransactionFormField';

export default function TransactionFormHeader({ config, values, errors, onChange, onClose, disabled, context }) {
  const header = config.header || {};
  return <header className="flex flex-wrap xl:flex-nowrap items-center gap-4 p-3 border-b border-zinc-100 bg-zinc-50/50">
    <div className="flex flex-col flex-none min-w-0">
      <h1 className="text-base font-bold text-zinc-800 truncate">{header.title || config.title}</h1>
      {(header.subtitle || config.subtitle) && <p className="text-[8px] text-zinc-500 font-medium truncate">{header.subtitle || config.subtitle}</p>}
    </div>
    <div className="flex flex-wrap items-center gap-3 flex-1 xl:justify-end">
      {(header.fields || []).map(field => <div key={field.key} className="min-w-[80px]"><TransactionFormField field={{ ...field, className: 'flex items-center gap-1.5' }} value={values[field.key]} error={errors?.[field.key]} onChange={onChange} disabled={disabled} context={context} /></div>)}
      {header.actions?.({ values, onChange, disabled, context })}
    </div>
    {onClose && <button type="button" onClick={onClose} disabled={disabled} className="p-1.5 flex-none text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 transition-colors ml-auto xl:ml-0" aria-label="Close"><X size={16} /></button>}
  </header>;
}
