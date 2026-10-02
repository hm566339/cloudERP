
import CustomSelect from '../../../components/common/CustomSelect';
import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useGetStocksQuery } from '../../../api/inventory'

export default function ProductionOrderFormModal({ isOpen, onClose, onSubmit }) {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
  
  const { data: stocks = [] } = useGetStocksQuery(companyId)

  const [product, setProduct] = useState('')
  const [targetQty, setTargetQty] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [estCompletion, setEstCompletion] = useState('')

  useEffect(() => {
    if (isOpen) {
      setProduct('')
      setTargetQty('')
      setStartDate(new Date().toISOString().split('T')[0])
      setEstCompletion('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()

    onSubmit({
      companyId,
      product,
      targetQty: parseInt(targetQty) || 0,
      startDate,
      estCompletion,
      date: new Date().toISOString().split('T')[0]
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
      <div className="card w-full max-w-md animate-slide-up flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-zinc-100">
          <h2 className="text-xl font-bold text-zinc-800">New Production Order</h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-50 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Product to Manufacture</label>
            <CustomSelect 
              className="input-field" 
              value={product}
              onChange={e => setProduct(e.target.value)}
              required
            >
              <option value="">Select Finished Good...</option>
              {stocks.filter(s => s.category === 'Finished Goods').map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
              {/* Fallback in case no finished goods found */}
              <option value="Vanilla Ice Cream Tub 1L">Vanilla Ice Cream Tub 1L</option>
              <option value="Chocolate Fudge Popsicle">Chocolate Fudge Popsicle</option>
            </CustomSelect>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Target Quantity</label>
            <input 
              type="number" 
              min="1"
              className="input-field" 
              value={targetQty}
              onChange={e => setTargetQty(e.target.value)}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Start Date</label>
              <input 
                type="date" 
                className="input-field" 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Est. Completion</label>
              <input 
                type="date" 
                className="input-field" 
                value={estCompletion}
                onChange={e => setEstCompletion(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create Order</button>
          </div>
        </form>
      </div>
    </div>
  )
}

