import React from 'react'

const STATUS_STYLES = {
 active: 'badge-success border border-emerald-200',
 inactive: 'badge-danger border border-rose-200',
}

export default function CustomerStatusBadge({ status }) {
 const normalized = status?.toString().toLowerCase()
 const style = STATUS_STYLES[normalized] || 'bg-zinc-100 text-zinc-700 border border-zinc-200'

 return (
 <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${style}`}>
 {normalized === 'active' ? 'Active' : normalized === 'inactive' ? 'Inactive' : 'Unknown'}
 </span>
 )
}
