import React from 'react';
import TransactionFormSection from './TransactionFormSection';

export default function TransactionFormSidebar({ config, values, errors, onChange, disabled, context }) {
  return <aside className="w-full lg:w-[256px] flex-none p-2 bg-zinc-50/40 overflow-y-auto overflow-x-hidden flex flex-col gap-2">
    {(config.sidebar?.sections || []).map(section => <TransactionFormSection key={section.id || section.title} section={section} values={values} errors={errors} onChange={onChange} disabled={disabled} context={context} />)}
  </aside>;
}
