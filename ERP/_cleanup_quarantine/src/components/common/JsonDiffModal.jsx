import React from 'react'
import { X, ArrowRight } from 'lucide-react'

export default function JsonDiffModal({ isOpen, onClose, oldValue, newValue, title = "Data Changes" }) {
  if (!isOpen) return null

  // Helper to safely parse JSON strings
  const parseJsonSafe = (str) => {
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch (e) {
      return str; // Return raw string if not valid JSON
    }
  }

  const oldData = parseJsonSafe(oldValue)
  const newData = parseJsonSafe(newValue)

  const renderValue = (val) => {
    if (val === null || val === undefined) return <span className="text-zinc-400 italic">null</span>;
    if (typeof val === 'object') return <pre className="text-xs">{JSON.stringify(val, null, 2)}</pre>;
    return String(val);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-950/60 backdrop-blur-sm px-3 py-6 sm:px-4 sm:py-8">
      <div className="card my-auto w-full max-w-4xl animate-slide-up flex flex-col max-h-[calc(100vh-3rem)] sm:max-h-[calc(100vh-4rem)] overflow-hidden bg-white shadow-xl">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 bg-zinc-50 rounded-t-xl">
          <h2 className="text-xl font-bold text-zinc-800">{title}</h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-white transition-colors shadow-sm bg-zinc-100">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-white rounded-b-xl flex-1 min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Old Value */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-rose-600 uppercase tracking-wider flex items-center gap-2">
                Previous State
              </h3>
              <div className="bg-rose-50/50 border border-rose-100 rounded-lg p-4 h-full min-h-[240px] overflow-x-auto text-sm font-mono text-zinc-700">
                {oldData ? renderValue(oldData) : <span className="text-zinc-400 italic">No previous data</span>}
              </div>
            </div>

            {/* New Value */}
            <div className="space-y-3 relative">
              <div className="absolute top-1/2 -left-6 -translate-y-1/2 bg-white rounded-full p-1 shadow-sm border border-zinc-100 hidden md:block">
                <ArrowRight size={16} className="text-zinc-400" />
              </div>
              <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider">
                New State
              </h3>
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-4 h-full min-h-[240px] overflow-x-auto text-sm font-mono text-zinc-700">
                {newData ? renderValue(newData) : <span className="text-zinc-400 italic">No new data</span>}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
