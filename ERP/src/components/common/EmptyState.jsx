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
      <div className="w-16 h-16 bg-zinc-50 border border-zinc-100 rounded-full flex items-center justify-center mb-4 shadow-sm ring-4 ring-zinc-50/50">
        <Icon size={28} className="text-zinc-400" />
      </div>
      <h3 className="font-bold text-zinc-800 text-lg mb-1 tracking-tight">{title}</h3>
      <p className="text-sm text-zinc-500 max-w-xs">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
