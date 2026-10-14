
import CustomSelect from '../../../components/common/CustomSelect';
import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useParams } from 'react-router-dom'

export default function ExpenseFormModal({ isOpen, onClose, onSubmit }) {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;

  const [category, setCategory] = useState('Travel')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (isOpen) {
      setCategory('Travel')
      setDescription('')
      setAmount('')
      setDate(new Date().toISOString().split('T')[0])
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()

    onSubmit({
      companyId,
      category,
      description,
      amount: parseFloat(amount) || 0,
      date
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-950/60 backdrop-blur-sm px-3 py-6 sm:px-4 sm:py-8">
      <div className="card my-auto w-full max-w-md max-h-[calc(100vh-3rem)] sm:max-h-[calc(100vh-4rem)] overflow-hidden animate-slide-up flex flex-col bg-white shadow-xl">
        <div className="flex justify-between items-center p-6 border-b border-zinc-100">
          <h2 className="text-xl font-bold text-zinc-800">Add New Expense</h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-50 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 flex-1 min-h-0 overflow-y-auto">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Category</label>
            <CustomSelect 
              className="input-field" 
              value={category}
              onChange={e => setCategory(e.target.value)}
              required
            >
              <option value="Travel">Travel</option>
              <option value="Software Subscriptions">Software Subscriptions</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Utilities">Utilities</option>
              <option value="Marketing">Marketing</option>
              <option value="Other">Other</option>
            </CustomSelect>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Description</label>
            <input 
              type="text" 
              className="input-field" 
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Amount (₹)</label>
              <input 
                type="number" 
                min="0.01"
                step="0.01"
                className="input-field" 
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Date</label>
              <input 
                type="date" 
                className="input-field" 
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Record Expense</button>
          </div>
        </form>
      </div>
    </div>
  )
}

