import React from 'react'
import { ChevronDown } from 'lucide-react'
import { useAppSelector } from '../../../app/hooks'
import { selectAccountSelectedCompany, selectAccountCompanyLoading } from '../store/accountCompanySlice'

export default function WorkspaceCard({ onClick, isOpen }) {
  const company = useAppSelector(selectAccountSelectedCompany)
  const loading = useAppSelector(selectAccountCompanyLoading)

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-zinc-200/60 animate-pulse">
        <div className="w-9 h-9 rounded-lg bg-zinc-100 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-24 bg-zinc-100 rounded" />
          <div className="h-3 w-16 bg-zinc-100 rounded" />
        </div>
      </div>
    )
  }

  if (!company) return null

  const initials = company.companyName.charAt(0).toUpperCase()
  const displayName = company.companyName
  const displayCode = company.companyCode

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-2 rounded-xl bg-white border border-zinc-200/60 hover:border-zinc-300 hover:shadow-sm transition-all duration-200 text-left active:scale-[0.98]"
    >
      <div className="w-9 h-9 bg-gradient-to-br from-zinc-100 to-zinc-50 border border-zinc-200/50 text-zinc-700 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 shadow-inner overflow-hidden">
        {company.logoUrl ? (
          <img src={company.logoUrl} alt={displayName} className="w-full h-full object-contain" />
        ) : (
          initials
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10.4px] font-bold text-zinc-800 truncate">{displayName}</p>
        <p className="text-[8.8px] font-medium text-zinc-400 truncate">ID: {displayCode}</p>
      </div>
      <ChevronDown
        size={16}
        className={`text-zinc-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
      />
    </button>
  )
}
