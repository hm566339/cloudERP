import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function ErrorState({
 title = 'Something went wrong',
 message = 'An error occurred while loading data. Please try again.',
 onRetry = null,
}) {
 return (
 <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
 <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
 <AlertCircle size={28} className="text-red-400" />
 </div>
 <h3 className="font-semibold text-zinc-700 text-base mb-1.5">{title}</h3>
 <p className="text-sm text-zinc-400 max-w-xs mb-5">{message}</p>
 {onRetry && (
 <button onClick={onRetry} className="btn-secondary">
 <RefreshCw size={14} />
 Try again
 </button>
 )}
 </div>
 )
}
