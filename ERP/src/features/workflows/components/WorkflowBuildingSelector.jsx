import React from 'react';
import { Building2 } from 'lucide-react';
import CustomSelect from '../../../components/common/CustomSelect';

export default function WorkflowBuildingSelector({ companies = [], selectedCompany, companyId, onChange }) {
  const options = companies.length
    ? companies.map((c) => ({
        value: String(c.id || c.companyId || c.code),
        label: c.name || c.companyName || c.code || c.id,
        subLabel: c.code ? `Code: ${c.code}` : undefined,
      }))
    : [
        {
          value: String(companyId || ''),
          label: selectedCompany?.name || 'Current company',
          subLabel: companyId ? `ID: ${companyId}` : undefined,
        },
      ];

  const handleCompanyChange = (e, val) => {
    const selectedVal = val !== undefined ? val : e?.target?.value;
    if (selectedVal && onChange) {
      onChange(String(selectedVal));
    }
  };

  return (
    <div className="flex items-center gap-1.5 min-w-[180px] sm:min-w-[220px]">
      <CustomSelect
        aria-label="Selected company"
        size="sm"
        searchable
        icon={<Building2 size={13} className="text-zinc-500 shrink-0" />}
        value={String(companyId || '')}
        onChange={handleCompanyChange}
        options={options}
        placeholder="Select company"
        className="w-full"
        buttonClassName="h-8 px-2.5 text-xs font-semibold text-zinc-800 dark:text-[#E6E8EE] bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg hover:border-zinc-300 dark:hover:border-zinc-600 shadow-2xs"
      />
    </div>
  );
}
