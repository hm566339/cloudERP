import React from 'react'
import { ChevronDown } from 'lucide-react'
import { useAppSelector } from '../../../app/hooks'
import { selectAccountSelectedCompany, selectAccountCompanyLoading } from '../store/accountCompanySlice'
import { selectSelectedCompany } from '../../company-management/companySlice'
import { selectCurrentCompany } from '../../auth/authSlice'

export default function WorkspaceCard({ onClick, isOpen }) {
  const accountCompany = useAppSelector(selectAccountSelectedCompany)
  const reduxCompany = useAppSelector(selectSelectedCompany)
  const currentCompany = useAppSelector(selectCurrentCompany)
  const loading = useAppSelector(selectAccountCompanyLoading)

  const company = accountCompany || reduxCompany || currentCompany

  if (loading && !company) {
    return (
      <div className="flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D]/60 animate-pulse">
        <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-[#222736] shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-24 bg-zinc-100 dark:bg-[#222736] rounded" />
          <div className="h-3 w-16 bg-zinc-100 dark:bg-[#222736] rounded" />
        </div>
      </div>
    )
  }

  if (!company) return null

  const displayName = company.companyName || company.name || company.legalName || 'Active Workspace'
  const displayCode = company.companyCode || company.code || company.id || '—'
  const initials = displayName.charAt(0).toUpperCase()
  const logoUrl = company.logoUrl || company.logo

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 p-2 rounded-xl bg-[var(--color-surface)] dark:bg-[#161922] border border-[var(--color-border)] dark:border-[#2A2F3D]/60 hover:border-[var(--color-border-hover)] dark:hover:border-[#3A4154] hover:shadow-xs transition-all duration-200 text-left active:scale-[0.98] cursor-pointer"
    >
      <div className="w-9 h-9 bg-[var(--color-surface-2)] dark:from-[#1D212C] dark:to-[#222736] border border-[var(--color-border)] dark:border-[#2A2F3D] text-[var(--color-text-primary)] dark:text-[#E6E8EE] rounded-lg flex items-center justify-center font-bold text-sm shrink-0 shadow-inner overflow-hidden">
        {logoUrl ? (
          <img src={logoUrl} alt={displayName} className="w-full h-full object-contain" />
        ) : (
          initials
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10.4px] font-bold text-[var(--color-text-primary)] dark:text-[#E6E8EE] truncate">{displayName}</p>
        <p className="text-[8.8px] font-medium text-[var(--color-text-secondary)] dark:text-[#A0A6B5] truncate">ID: {displayCode}</p>
      </div>
      <ChevronDown
        size={16}
        className={`text-zinc-400 dark:text-[#A0A6B5] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
      />
    </button>
  )
}
