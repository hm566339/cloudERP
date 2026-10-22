
import CustomSelect from '../../../components/common/CustomSelect';
import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useParams } from 'react-router-dom'

export default function LeadFormModal({ isOpen, onClose, onSubmit }) {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;

  const [company, setCompany] = useState('')
  const [contact, setContact] = useState('')
  const [source, setSource] = useState('Website')
  const [value, setValue] = useState('')

  useEffect(() => {
    if (isOpen) {
      setCompany('')
      setContact('')
      setSource('Website')
      setValue('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      companyId,
      company,
      contact,
      source,
      value: parseFloat(value) || 0
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-950/60 backdrop-blur-sm px-3 py-6 sm:px-4 sm:py-8">
      <div className="card my-auto w-full max-w-lg max-h-[calc(100vh-3rem)] sm:max-h-[calc(100vh-4rem)] overflow-hidden animate-slide-up flex flex-col bg-white dark:bg-[#161922] border border-transparent dark:border-[#2A2F3D] shadow-xl">
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-[#2A2F3D]">
          <h2 className="text-xl font-bold text-zinc-800 dark:text-[#E6E8EE]">Add New Lead</h2>
          <button onClick={onClose} className="p-2 text-zinc-400 dark:text-[#6B7184] hover:text-zinc-600 dark:hover:text-[#E6E8EE] rounded-full hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 flex-1 min-h-0 overflow-y-auto">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider">Company Name</label>
            <input 
              type="text" 
              className="input-field" 
              value={company}
              onChange={e => setCompany(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider">Contact Person</label>
            <input 
              type="text" 
              className="input-field" 
              value={contact}
              onChange={e => setContact(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider">Source</label>
              <CustomSelect 
                className="input-field" 
                value={source}
                onChange={e => setSource(e.target.value)}
              >
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="Trade Show">Trade Show</option>
                <option value="Cold Call">Cold Call</option>
              </CustomSelect>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 dark:text-[#A0A6B5] uppercase tracking-wider">Estimated Value (₹)</label>
              <input 
                type="number" 
                min="0"
                className="input-field" 
                value={value}
                onChange={e => setValue(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-[#2A2F3D]">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Lead</button>
          </div>
        </form>
      </div>
    </div>
  )
}

