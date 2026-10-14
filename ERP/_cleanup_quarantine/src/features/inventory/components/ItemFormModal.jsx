
import CustomSelect from '../../../components/common/CustomSelect';
import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useParams } from 'react-router-dom'

export default function ItemFormModal({ isOpen, onClose, onSubmit, initialName = '' }) {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;

  const [name, setName] = useState(initialName)
  const [category, setCategory] = useState('Raw Material')
  const [inStock, setInStock] = useState('')
  const [reorderLevel, setReorderLevel] = useState('')
  const [unit, setUnit] = useState('Kg')

  useEffect(() => {
    if (isOpen) {
      setName(initialName || '')
      setCategory('Raw Material')
      setInStock('')
      setReorderLevel('')
      setUnit('Kg')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      companyId,
      name,
      category,
      inStock: parseFloat(inStock) || 0,
      reorderLevel: parseFloat(reorderLevel) || 0,
      unit,
      status: parseFloat(inStock) > parseFloat(reorderLevel) ? 'In Stock' : (parseFloat(inStock) > 0 ? 'Low Stock' : 'Out of Stock')
    })
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
      <div className="card w-full max-w-md animate-slide-up flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-zinc-100">
          <h2 className="text-xl font-bold text-zinc-800">Add New Inventory Item</h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-50 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Item Name</label>
            <input 
              type="text" 
              className="input-field" 
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Category</label>
              <CustomSelect 
                className="input-field" 
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                <option value="Raw Material">Raw Material</option>
                <option value="Finished Goods">Finished Goods</option>
                <option value="Packaging">Packaging</option>
                <option value="Flavoring">Flavoring</option>
              </CustomSelect>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Unit</label>
              <CustomSelect 
                className="input-field" 
                value={unit}
                onChange={e => setUnit(e.target.value)}
              >
                <option value="Kg">Kg</option>
                <option value="Liters">Liters</option>
                <option value="Tubs">Tubs</option>
                <option value="Boxes">Boxes</option>
                <option value="pcs">pcs</option>
              </CustomSelect>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Opening Stock</label>
              <input 
                type="number" 
                min="0"
                step="0.01"
                className="input-field" 
                value={inStock}
                onChange={e => setInStock(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Reorder Level</label>
              <input 
                type="number" 
                min="0"
                step="0.01"
                className="input-field" 
                value={reorderLevel}
                onChange={e => setReorderLevel(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Item</button>
          </div>
        </form>
      </div>
    </div>
  )
}

