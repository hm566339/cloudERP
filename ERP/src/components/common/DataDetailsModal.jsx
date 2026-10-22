import React from 'react'
import { X, Edit, Trash2 } from 'lucide-react'

export default function DataDetailsModal({ isOpen, onClose, data, title, onEdit, onDelete, actions }) {
  if (!isOpen || !data) return null

  // Function to format keys nicely (e.g. "customerName" -> "Customer Name")
  const formatKey = (key) => {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
  }

  // Define keys we don't want to show
  const hiddenKeys = ['id', 'companyId', 'isDeleted', 'items']

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-950/60 backdrop-blur-sm px-3 py-6 sm:px-4 sm:py-8">
      <div className="card my-auto w-full max-w-2xl animate-slide-up flex flex-col max-h-[calc(100vh-3rem)] sm:max-h-[calc(100vh-4rem)] overflow-hidden bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] shadow-xl dark:shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-[#2A2F3D] shrink-0 bg-zinc-50/50 dark:bg-[#161922]">
          <h2 className="text-xl font-bold text-zinc-800 dark:text-[#E6E8EE]">{title || 'Details'}</h2>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button onClick={() => onEdit(data)} className="p-2 text-primary dark:text-[#4C8DFF] hover:bg-primary/10 dark:hover:bg-[#4C8DFF]/15 rounded-full transition-colors" title="Edit">
                <Edit size={18} />
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(data.id)} className="p-2 text-red-500 dark:text-[#F0616D] hover:bg-red-50 dark:hover:bg-[#F0616D]/15 rounded-full transition-colors" title="Delete">
                <Trash2 size={18} />
              </button>
            )}
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 dark:text-[#6B7184] dark:hover:text-[#E6E8EE] rounded-full hover:bg-zinc-100 dark:hover:bg-[#222736] transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto bg-white dark:bg-[#1D212C]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {Object.entries(data).map(([key, value]) => {
              if (hiddenKeys.includes(key) || typeof value === 'object') return null
              
              return (
                <div key={key} className="space-y-1">
                  <div className="text-xs font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider">{formatKey(key)}</div>
                  <div className="text-sm font-medium text-zinc-800 dark:text-[#E6E8EE]">
                    {value === null || value === undefined || value === '' ? '-' : String(value)}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Render Items if present (common in orders/invoices) */}
          {data.items && Array.isArray(data.items) && data.items.length > 0 && (
            <div className="mt-8 border-t border-zinc-100 dark:border-[#2A2F3D] pt-6">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-[#E6E8EE] mb-4 uppercase tracking-wider">Line Items</h3>
              <div className="bg-zinc-50 dark:bg-[#161922] rounded-lg border border-zinc-100 dark:border-[#2A2F3D] overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-100 dark:bg-[#161922] text-zinc-500 dark:text-[#A0A6B5] text-xs">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Item / Description</th>
                      <th className="px-4 py-3 font-semibold text-right">Qty</th>
                      <th className="px-4 py-3 font-semibold text-right">Rate</th>
                      <th className="px-4 py-3 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
                    {data.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-zinc-100/50 dark:hover:bg-[#222736]/40 transition-colors">
                        <td className="px-4 py-3 font-medium text-zinc-700 dark:text-[#E6E8EE]">{item.name || item.description || item.product || `Item ${idx+1}`}</td>
                        <td className="px-4 py-3 text-right text-zinc-600 dark:text-[#A0A6B5]">{item.qty || item.quantity || 1}</td>
                        <td className="px-4 py-3 text-right text-zinc-600 dark:text-[#A0A6B5]">₹{parseFloat(item.rate || item.price || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-medium text-zinc-800 dark:text-[#E6E8EE]">₹{((item.qty || item.quantity || 1) * (item.rate || item.price || 0)).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between shrink-0 bg-zinc-50/50 dark:bg-[#161922]">
          <div>{actions}</div>
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>

      </div>
    </div>
  )
}
