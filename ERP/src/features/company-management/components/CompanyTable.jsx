import React, { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, BarChart2, Building2, Calendar, Hash } from 'lucide-react'

const SKELETON_ROWS = 6

function SkeletonRow() {
 return (
 <tr className="border-b border-zinc-100">
 {[...Array(7)].map((_, i) => (
 <td key={i} className="px-4 py-4">
 <div className={`skeleton h-4 rounded-lg ${i === 0 ? 'w-36' : i === 6 ? 'w-20' : 'w-24'}`} />
 </td>
 ))}
 </tr>
 )
}

function CompanyRow({ company }) {
 const navigate = useNavigate()

 const handleViewDetails = useCallback(
 () => navigate(`/company/${company.id}`),
 [navigate, company.id]
 )
 const handleFinance = useCallback(
 () => navigate(`/finance/${company.id}`),
 [navigate, company.id]
 )

 const formattedDate = company.createdAt
 ? new Date(company.createdAt).toLocaleDateString('en-IN', {
 day: '2-digit',
 month: 'short',
 year: 'numeric',
 })
 : '—'

 return (
 <tr className="border-b border-zinc-100 hover:bg-zinc-50/70 transition-colors group animate-fade-in">
                    <td className="text-center font-medium text-zinc-500">{i + 1}</td>
 <td className="px-4 py-4">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-sm shrink-0">
 <span className="text-white font-bold text-xs">
 {company.companyName?.charAt(0)?.toUpperCase() || 'C'}
 </span>
 </div>
 <div>
 <p className="text-sm font-semibold text-zinc-800 leading-tight">
 {company.companyName || '—'}
 </p>
 <p className="text-xs text-zinc-400 mt-0.5">{company.id?.slice(0, 8)}…</p>
 </div>
 </div>
 </td>

 <td className="px-4 py-4">
 <code className="text-xs font-mono bg-zinc-100 text-zinc-700 px-2 py-1 rounded-lg">
 {company.companyCode || '—'}
 </code>
 </td>

 <td className="px-4 py-4">
 <span className="text-sm text-zinc-600 font-mono">
 {company.gstin || '—'}
 </span>
 </td>

 <td className="px-4 py-4">
 <span className="text-sm text-zinc-600 font-mono">
 {company.panNo || '—'}
 </span>
 </td>

 <td className="px-4 py-4">
 <span className="badge badge-success font-semibold">
 {company.baseCurrency || '—'}
 </span>
 </td>

 <td className="px-4 py-4">
 <div className="flex items-center gap-1.5 text-sm text-zinc-500">
 <Calendar size={13} className="text-zinc-400" />
 {formattedDate}
 </div>
 </td>

 <td className="px-4 py-4">
 <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
 <button
 onClick={handleViewDetails}
 title="View Details"
 className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-all duration-150 hover:border-zinc-300"
 >
 <Eye size={13} />
 Details
 </button>
 <button
 onClick={handleFinance}
 title="Finance Dashboard"
 className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/10 border border-primary/50 rounded-lg transition-all duration-150"
 >
 <BarChart2 size={13} />
 Finance
 </button>
 </div>
 </td>
 </tr>
 )
}

// Mobile card view
function CompanyCard({ company }) {
 const navigate = useNavigate()

 return (
 <div className="card p-4 animate-slide-up">
 <div className="flex items-start justify-between mb-3">
 <div className="flex items-center gap-2.5">
 <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-sm">
 <span className="text-white font-bold text-sm">
 {company.companyName?.charAt(0)?.toUpperCase() || 'C'}
 </span>
 </div>
 <div>
 <p className="font-semibold text-zinc-800 text-sm leading-tight">
 {company.companyName}
 </p>
 <code className="text-xs text-zinc-500 font-mono">{company.companyCode}</code>
 </div>
 </div>
 <span className="badge badge-success font-semibold text-xs">
 {company.baseCurrency}
 </span>
 </div>

 <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
 <div>
 <p className="text-zinc-400 mb-0.5">GSTIN</p>
 <p className="font-mono text-zinc-600">{company.gstin || '—'}</p>
 </div>
 <div>
 <p className="text-zinc-400 mb-0.5">PAN</p>
 <p className="font-mono text-zinc-600">{company.panNo || '—'}</p>
 </div>
 </div>

 <div className="flex gap-2">
 <button
 onClick={() => navigate(`/company/${company.id}`)}
 className="flex-1 btn-secondary text-xs py-2 justify-center"
 >
 <Eye size={13} /> Details
 </button>
 <button
 onClick={() => navigate(`/finance/${company.id}`)}
 className="flex-1 btn-primary text-xs py-2 justify-center"
 >
 <BarChart2 size={13} /> Finance
 </button>
 </div>
 </div>
 )
}

export default function CompanyTable({ companies = [], loading = false }) {
 return (
 <>
 {/* Desktop table */}
 <div className="hidden md:block erp-table-container">
 <table className="erp-table">
 <thead>
 <tr className="bg-zinc-50/80 border-b border-zinc-200">
                <th className="w-12 text-center">S.No.</th>
 <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
 Company
 </th>
 <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
 Code
 </th>
 <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
 GSTIN
 </th>
 <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
 PAN No.
 </th>
 <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
 Currency
 </th>
 <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
 Created
 </th>
 <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
 Actions
 </th>
 </tr>
 </thead>
 <tbody>
 {loading
 ? [...Array(SKELETON_ROWS)].map((_, i) => <SkeletonRow key={i} />)
 : companies.map((company) => (
 <CompanyRow key={company.id} company={company} />
 ))}
 </tbody>
 </table>
 </div>

 {/* Mobile cards */}
 <div className="md:hidden space-y-3 p-4">
 {loading
 ? [...Array(4)].map((_, i) => (
 <div key={i} className="card p-4">
 <div className="flex gap-3 mb-3">
 <div className="skeleton w-9 h-9 rounded-xl" />
 <div className="flex-1">
 <div className="skeleton h-4 w-32 rounded-lg mb-1.5" />
 <div className="skeleton h-3 w-20 rounded-lg" />
 </div>
 </div>
 <div className="skeleton h-8 w-full rounded-xl" />
 </div>
 ))
 : companies.map((company) => (
 <CompanyCard key={company.id} company={company} />
 ))}
 </div>
 </>
 )
}
