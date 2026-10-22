import React from 'react';
import TransactionFormSection from './TransactionFormSection';

export default function TransactionFormSidebar({ config, values, errors, onChange, disabled, context }) {
  return (
    <aside className="w-full lg:w-[320px] xl:w-[340px] flex-none p-2.5 sm:p-3 bg-zinc-50/40 dark:bg-[#161922]/60 overflow-y-auto overflow-x-hidden sm:grid sm:grid-cols-2 lg:flex lg:flex-col gap-2.5 sm:gap-3">
      {(config.sidebar?.sections || []).map(section => (
        <TransactionFormSection
          key={section.id || section.title}
          section={section}
          values={values}
          errors={errors}
          onChange={onChange}
          disabled={disabled}
          context={context}
        />
      ))}
    </aside>
  );
}
