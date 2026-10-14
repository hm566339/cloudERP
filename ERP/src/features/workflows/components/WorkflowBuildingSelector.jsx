import React from 'react';
import { Building2, ChevronDown } from 'lucide-react';

export default function WorkflowBuildingSelector({ companies, selectedCompany, companyId, onChange }) {
  const options = companies.length ? companies : [{ id: companyId, name: selectedCompany?.name || 'Current company' }];
  return (
    <label className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-700 hover:border-zinc-300 focus-within:border-zinc-900 focus-within:ring-1 focus-within:ring-zinc-900 transition-all shadow-sm cursor-pointer">
      <Building2 size={13} className="text-zinc-500 shrink-0" />
      <span className="hidden text-[10px] font-bold uppercase tracking-wider text-zinc-400 sm:inline">Company:</span>
      <select
        aria-label="Selected company"
        value={companyId || ''}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-[140px] sm:max-w-[180px] border-0 bg-transparent p-0 text-xs font-semibold text-zinc-800 outline-none truncate cursor-pointer"
      >
        {options.map((company) => (
          <option key={company.id || company.companyId || company.code} value={company.id || company.companyId || company.code}>
            {company.name || company.companyName || company.code || company.id}
          </option>
        ))}
      </select>
      <ChevronDown size={12} className="text-zinc-400 shrink-0" />
    </label>
  );
}
