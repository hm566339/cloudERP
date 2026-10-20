import React from 'react';
import TransactionFormField from './TransactionFormField';

export default function TransactionFormSummary({ config, values, errors, onChange, disabled, context }) {
  const summary = config.summary || {};
  return (
    <div className="p-2.5 sm:p-3 flex justify-end bg-zinc-50/20">
      <section className="w-full sm:max-w-md border border-zinc-200 rounded-xl p-3 sm:p-3.5 bg-white shadow-2xs">
        <h2 className="pb-2 mb-2 border-b border-zinc-100 text-[9px] font-bold uppercase tracking-wider text-zinc-800 flex items-center justify-between">
          <span>{summary.title || 'Summary'}</span>
        </h2>
        <div className="space-y-2">
          {(summary.rows || []).map(row => (
            <div
              key={row.key}
              className={`flex items-center justify-between gap-3 text-[10px] ${
                row.emphasis ? 'pt-2 mt-2 border-t border-zinc-200 font-bold text-zinc-900' : 'text-zinc-600'
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
