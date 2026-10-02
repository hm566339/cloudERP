import React from 'react';
import TransactionFormField from './TransactionFormField';

export default function TransactionFormSection({ section, values, errors, onChange, disabled, context }) {
  return (
    <section className="border border-zinc-200 rounded-lg p-2.5 bg-white shadow-2xs space-y-2">
      <div className="pb-1.5 border-b border-zinc-100">
        <h3 className="text-[8px] font-bold text-zinc-800 uppercase tracking-wider">{section.title}</h3>
        {section.description && <p className="mt-1 text-[8px] text-zinc-400">{section.description}</p>}
      </div>
      <div className={section.gridClassName || 'grid grid-cols-1 gap-2'}>
        {(section.fields || []).filter(field => !(typeof field.hidden === 'function' ? field.hidden({ values, context }) : field.hidden)).map(field => <TransactionFormField key={field.key} field={field} value={values[field.key]} error={errors?.[field.key]} onChange={onChange} disabled={disabled} context={{ ...context, values, errors }} />)}
      </div>
    </section>
  );
}
