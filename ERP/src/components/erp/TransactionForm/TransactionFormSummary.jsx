import React from 'react';
import TransactionFormField from './TransactionFormField';

export default function TransactionFormSummary({ config, values, errors, onChange, disabled, context }) {
  const summary = config.summary || {};
  return <section className="m-2 border border-zinc-200 rounded-lg p-3 bg-white"><h2 className="pb-2 mb-1 border-b border-zinc-100 text-[9px] font-bold uppercase tracking-wider text-zinc-800">{summary.title || 'Summary'}</h2><div className="space-y-1.5">{(summary.rows || []).map(row => <div key={row.key} className={`flex items-center justify-between gap-3 text-[10px] ${row.emphasis ? 'pt-2 mt-2 border-t border-zinc-200 font-bold text-zinc-900' : 'text-zinc-600'}`}><span>{row.label}</span><div className="w-40"><TransactionFormField field={{ ...row, label: undefined, className: 'text-right' }} value={values[row.key]} error={errors?.[row.key]} onChange={onChange} disabled={disabled || row.readOnly} context={context} /></div></div>)}</div></section>;
}
