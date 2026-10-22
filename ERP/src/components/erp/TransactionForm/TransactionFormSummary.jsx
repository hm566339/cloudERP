import React from 'react';
import TransactionFormField from './TransactionFormField';

export default function TransactionFormSummary({ config, values, errors, onChange, disabled, context }) {
  const summary = config.summary || {};
  return (
    <div className="p-2.5 sm:p-3 flex justify-end bg-zinc-50/20 dark:bg-[#161922]/40">
      <section className="w-full sm:max-w-md border border-zinc-200 dark:border-[#2A2F3D] rounded-xl p-3 sm:p-3.5 bg-white dark:bg-[#1D212C] shadow-2xs">
        <h2 className="pb-2 mb-2 border-b border-zinc-100 dark:border-[#2A2F3D] text-[9px] font-bold uppercase tracking-wider text-zinc-800 dark:text-[#E6E8EE] flex items-center justify-between">
          <span>{summary.title || 'Summary'}</span>
        </h2>
        <div className="space-y-2">
          {(summary.rows || []).map(row => (
            <div
              key={row.key}
              className={`flex items-center justify-between gap-3 text-[10px] ${
                row.emphasis ? 'pt-2 mt-2 border-t border-zinc-200 dark:border-[#2A2F3D] font-bold text-zinc-900 dark:text-[#E6E8EE]' : 'text-zinc-600 dark:text-[#A0A6B5]'
              }`}
            >
              <span className="shrink-0">{row.label}</span>
              <div className="w-36 sm:w-44 flex justify-end">
                <TransactionFormField
                  field={{ ...row, label: undefined, className: 'text-right' }}
                  value={values[row.key]}
                  error={errors?.[row.key]}
                  onChange={onChange}
                  disabled={disabled || row.readOnly}
                  context={context}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
