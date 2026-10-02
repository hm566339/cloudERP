import React from 'react'
import { Search, X } from 'lucide-react'

export default function SearchBar({ value, onChange, placeholder = 'Search...', className = '' }) {
 return (
 <div className={`relative ${className}`}>
 <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
 <Search size={16} className="text-zinc-400" />
 </div>
 <input
 type="text"
 value={value}
 onChange={(e) => onChange(e.target.value)}
 placeholder={placeholder}
 className="input-field pl-10 pr-10"
 />
 {value && (
 <button
 onClick={() => onChange('')}
 className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600 transition-colors"
 >
 <X size={15} />
 </button>
 )}
 </div>
 )
}
