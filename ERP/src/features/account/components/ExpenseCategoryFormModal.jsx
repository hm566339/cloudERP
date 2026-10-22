import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Check } from 'lucide-react'
import { useParams } from 'react-router-dom'

export default function ExpenseCategoryFormModal({ isOpen, onClose, onSubmit, initialData }) {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;

  const [categoryName, setCategoryName] = useState('')
  const [categoryCode, setCategoryCode] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setCategoryName(initialData.categoryName || '')
        setCategoryCode(initialData.categoryCode || '')
        setDescription(initialData.description || '')
        setIsActive(initialData.isActive ?? true)
      } else {
        setCategoryName('')
        setCategoryCode('')
        setDescription('')
        setIsActive(true)
      }
    }
  }, [isOpen, initialData])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const payload = {
      companyId,
      id: initialData?.id,
      categoryName,
      categoryCode: categoryCode || null,
      description: description || null,
      isActive: isActive
    }

    if (!payload.id) {
      delete payload.id
    }

    onSubmit(payload)
  }

  return createPortal(
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-card-dark w-full max-w-2xl max-h-[90vh] rounded-md shadow-2xl flex flex-col overflow-hidden animate-slide-up border border-zinc-200 dark:border-border-dark">
        
        {/* Header - Sticky */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-zinc-200 bg-zinc-50/80 shrink-0">
          <h2 className="text-base font-bold text-zinc-900 tracking-tight">
            {initialData?.id ? 'Edit Expense Category' : 'Add New Expense Category'}
          </h2>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors active:scale-95"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body - Overflow handling */}
        <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar bg-white dark:bg-card-dark">
          <form id="expense-category-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Basic Info */}
            <div>
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-3 pb-2 border-b border-zinc-100 dark:border-[#2A2F3D]">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                <div className="space-y-1.5 max-w-md">
                  <label className="text-[9.6px] font-semibold text-zinc-700">Category Code</label>
                  <input 
                    type="text" 
                    className="w-full h-9 px-3 bg-zinc-50 dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-md text-[10.4px] font-medium text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-card-dark focus:border-zinc-900 focus:ring-0 outline-none transition-all uppercase placeholder:normal-case placeholder:text-zinc-400"
                    value={categoryCode}
                    onChange={e => setCategoryCode(e.target.value.toUpperCase())}
                    placeholder="e.g. TRAV-01"
                  />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <label className="text-[9.6px] font-semibold text-zinc-700">Category Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    className="w-full h-9 px-3 bg-zinc-50 dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-md text-[10.4px] font-medium text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-card-dark focus:border-zinc-900 focus:ring-0 outline-none transition-all placeholder:text-zinc-400"
                    value={categoryName}
                    onChange={e => setCategoryName(e.target.value)}
                    placeholder="e.g. Travel Expenses"
                    required
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[9.6px] font-semibold text-zinc-700">Description</label>
                  <textarea 
                    className="w-full min-h-[64px] p-3 bg-zinc-50 dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-md text-[10.4px] font-medium text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-card-dark focus:border-zinc-900 focus:ring-0 outline-none transition-all placeholder:text-zinc-400 resize-y"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Brief description of this expense category..."
                  />
                </div>
              </div>
            </div>

            {/* Account Settings */}
            <div>
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-3 pb-2 border-b border-zinc-100 dark:border-[#2A2F3D]">Status Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                <div className="flex items-center pb-1.5">
                  <label className="flex items-center gap-2.5 cursor-pointer group w-max">
                    <input 
                      type="checkbox" 
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded-md border-zinc-300 text-zinc-900 focus:ring-0 focus:ring-offset-0 cursor-pointer transition-colors"
                    />
                    <span className="text-[10.4px] font-bold text-zinc-700 select-none group-hover:text-zinc-900 transition-colors">
                      Active Category
                    </span>
                  </label>
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer - Sticky */}
        <div className="flex justify-end items-center gap-3 px-5 py-4 border-t border-zinc-200 bg-zinc-50/80 shrink-0">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-5 py-2 text-[10.4px] font-bold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200/50 bg-white dark:bg-surface-dark border border-zinc-300 dark:border-border-dark text-zinc-700 dark:text-zinc-300 rounded-md transition-all active:scale-95"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="expense-category-form"
            className="flex items-center gap-2 px-5 py-2 text-[10.4px] font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-all active:scale-95"
          >
            <Check size={16} strokeWidth={2.5} />
            {initialData?.id ? 'Save Changes' : 'Create Category'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
