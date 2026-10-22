import React from 'react'
import { SearchX, Building2, Plus } from 'lucide-react'

export default function EmptyState({
  title = 'No results found',
  description = 'There is no data to display here yet.',
  icon: Icon = SearchX,
  action = null,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in w-full">
      <div className="w-16 h-16 bg-zinc-50 dark:bg-[#1D212C] border border-zinc-100 dark:border-[#2A2F3D] rounded-full flex items-center justify-center mb-4 shadow-sm ring-4 ring-zinc-50/50 dark:ring-[#1D212C]/50">
        <Icon size={28} className="text-zinc-400 dark:text-[#A0A6B5]" />
      </div>
      <h3 className="font-bold text-zinc-800 dark:text-[#E6E8EE] text-lg mb-1 tracking-tight">{title}</h3>
      <p className="text-sm text-zinc-500 dark:text-[#A0A6B5] max-w-xs">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
