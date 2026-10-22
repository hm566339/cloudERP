import React from 'react';
import { Printer } from 'lucide-react';

export default function TransactionFormFooter({ config, values, onChange, onCancel, onPrint, loading, disabled }) {
  const renderAction = action => {
    if (action.type === 'checkbox') return <label key={action.key} className="flex items-center gap-1.5 text-[9px] text-zinc-600 dark:text-[#A0A6B5]"><input type="checkbox" checked={Boolean(values[action.key])} disabled={disabled || loading} onChange={e => onChange(action.key, e.target.checked)} />{action.label}</label>;
    const isSubmit = action.type === 'submit';
    const onClick = action.key === 'cancel' ? onCancel : action.key === 'print' ? onPrint : action.onClick;
    return <button key={action.key} type={isSubmit ? 'submit' : 'button'} onClick={onClick} disabled={disabled || loading} className={`h-8 px-3 rounded-md text-[9px] font-semibold flex items-center gap-1.5 ${action.variant === 'primary' ? 'bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-[#4C8DFF] dark:hover:bg-[#6AA1FF]' : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50 dark:bg-[#1D212C] dark:text-[#E6E8EE] dark:border-[#2A2F3D] dark:hover:bg-[#222736]'}`}>{action.icon === 'print' && <Printer size={12} />}{action.label}</button>;
  };
  return (
    <footer className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 p-2.5 border-t border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/80 dark:bg-[#161922]">
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
        {(config.footer?.leftActions || []).map(renderAction)}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {(config.footer?.rightActions || []).map(renderAction)}
      </div>
    </footer>
  );
}
