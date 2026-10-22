import React from 'react';
import { Edit2, Trash2, Globe, Building2 } from 'lucide-react';
import StatusBadge from './StatusBadge';
import StatusToggle from './StatusToggle';

export default function CompanyModuleTable({ 
  data, 
  onEdit, 
  onDelete, 
  onToggleStatus 
}) {
  return (
    <div className="overflow-x-auto bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D]">
      <table className="w-full text-left text-sm text-zinc-600 dark:text-[#A0A6B5]">
        <thead className="text-xs text-zinc-500 dark:text-[#A0A6B5] bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] uppercase">
          <tr>
            <th className="px-6 py-4 font-bold">Company</th>
            <th className="px-6 py-4 font-bold">Module</th>
            <th className="px-6 py-4 font-bold">Module Status</th>
            <th className="px-6 py-4 font-bold">Assignment Status</th>
            <th className="px-6 py-4 font-bold hidden md:table-cell">Dates</th>
            <th className="px-6 py-4 font-bold text-right sticky right-0 bg-zinc-50 dark:bg-[#1D212C]">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-[#2A2F3D]">
          {data?.map((item) => (
            <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-[#1D212C]/60 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary dark:text-[#4C8DFF] flex items-center justify-center shrink-0">
                    {item.company?.logoUrl ? (
                      <img src={item.company.logoUrl} alt={item.company.companyName} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Building2 size={20} />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-zinc-900 dark:text-[#E6E8EE]">{item.company?.companyName}</div>
                    <div className="text-xs text-zinc-500 dark:text-[#A0A6B5] font-medium">Code: {item.company?.companyCode}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Globe size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-zinc-900 dark:text-[#E6E8EE]">{item.module?.name}</div>
                    <div className="text-xs text-zinc-500 dark:text-[#A0A6B5] font-medium">{item.module?.host}</div>
                    <div className="text-[8px] text-zinc-400 dark:text-[#6B7184]">Client ID: {item.module?.clientId}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <StatusBadge active={item.module?.moduleStatus} activeText="Enabled" inactiveText="Disabled" />
              </td>
              <td className="px-6 py-4">
                <StatusToggle 
                  active={item.active} 
                  onChange={(newStatus) => onToggleStatus(item, newStatus)} 
                />
              </td>
              <td className="px-6 py-4 hidden md:table-cell text-xs font-medium text-zinc-600 dark:text-[#A0A6B5]">
                <div>Created: {new Date(item.createdAt).toLocaleDateString()}</div>
                <div>Updated: {new Date(item.updatedAt).toLocaleDateString()}</div>
              </td>
              <td className="px-6 py-4 text-right sticky right-0 bg-white dark:bg-[#161922] group-hover:bg-zinc-50 dark:group-hover:bg-[#1D212C]">
                <div className="flex items-center justify-end gap-2">
                  <button 
                    onClick={() => onEdit(item)}
                    className="p-2 text-zinc-400 hover:text-primary dark:hover:text-[#4C8DFF] bg-white dark:bg-transparent hover:bg-primary/5 dark:hover:bg-primary/10 rounded-lg border border-transparent hover:border-primary/20 transition-all"
                    title="Edit Assignment"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => onDelete(item)}
                    className="p-2 text-zinc-400 hover:text-red-500 bg-white dark:bg-transparent hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-200 transition-all"
                    title="Delete Assignment"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {(!data || data.length === 0) && (
        <div className="p-8 text-center text-zinc-500 dark:text-[#A0A6B5]">
          No company module assignments found.
        </div>
      )}
    </div>
  );
}
