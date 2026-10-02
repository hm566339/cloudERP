import { useRef, useEffect, useState } from 'react'
import { BadgeCheck, AlertCircle } from 'lucide-react'
import { useAppSelector } from '../../../app/hooks'
import { selectAccountSelectedCompany } from '../store/accountCompanySlice'

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[8.8px] font-semibold text-zinc-400 uppercase whitespace-nowrap">{label}</span>
      <span className="text-xs font-medium text-zinc-800 text-right truncate max-w-[112px]">{value || '—'}</span>
    </div>
  )
}

export default function CompanyDetailsPopup({ open }) {
  const company = useAppSelector(selectAccountSelectedCompany)
  const ref = useRef(null)
  const [render, setRender] = useState(false)

  useEffect(() => {
    if (open) {
      setRender(true)
    } else {
      const timer = setTimeout(() => setRender(false), 200)
      return () => clearTimeout(timer)
    }
  }, [open])

  if (!render || !company) return null

  return (
    <div
      ref={ref}
      className={`absolute bottom-full left-0 right-0 mb-2 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 transition-all duration-200 ease-in-out ${
        open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'
      }`}
    >
      <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-zinc-900 truncate">{company.companyName}</span>
        <span
          className={`shrink-0 inline-flex items-center gap-1 text-[8.8px] font-semibold px-2 py-0.5 rounded-full ${
            company.active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {company.active ? <BadgeCheck size={12} /> : <AlertCircle size={12} />}
          {company.active ? 'Active' : 'Inactive'}
        </span>
      </div>
      <div className="p-4 space-y-2.5">
        <Row label="Company Code" value={company.companyCode} />
        <Row label="GSTIN" value={company.gstin} />
        <Row label="Email" value={company.email} />
        <Row label="Phone" value={company.phone} />
        <Row label="Address" value={[company.addressLine1, company.addressLine2, company.city, company.state, company.country, company.postalCode].filter(Boolean).join(', ') || company.address} />
      </div>
    </div>
  )
}
