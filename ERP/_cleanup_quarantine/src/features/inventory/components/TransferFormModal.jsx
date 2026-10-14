
import CustomSelect from '../../../components/common/CustomSelect';
import React, { useState, useEffect } from 'react'
import { X, ArrowRightLeft } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useGetWarehousesQuery, useGetStocksQuery } from '../../../api/inventory'

export default function TransferFormModal({ isOpen, onClose, onSubmit }) {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
  
  const { data: warehouses = [] } = useGetWarehousesQuery(companyId)
  const { data: stocks = [] } = useGetStocksQuery(companyId)

  const [fromWarehouse, setFromWarehouse] = useState('')
  const [toWarehouse, setToWarehouse] = useState('')
  const [itemId, setItemId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (isOpen) {
      setFromWarehouse('')
      setToWarehouse('')
      setItemId('')
      setQuantity('')
      setDate(new Date().toISOString().split('T')[0])
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (fromWarehouse === toWarehouse) return alert('Source and Destination warehouses cannot be the same')
    
    const item = stocks.find(i => i.id === itemId)
    const from = warehouses.find(w => w.id === fromWarehouse)
    const to = warehouses.find(w => w.id === toWarehouse)

    onSubmit({
      companyId,
      from: from?.name || 'Unknown',
      to: to?.name || 'Unknown',
      item: item?.name || 'Unknown Item',
      quantity: `${quantity} ${item?.unit || ''}`,
      date
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
      <div className="card w-full max-w-md animate-slide-up flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-zinc-100">
          <h2 className="text-xl font-bold text-zinc-800">New Stock Transfer</h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-50 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">From Warehouse</label>
              <CustomSelect 
                className="input-field" 
                value={fromWarehouse}
                onChange={e => setFromWarehouse(e.target.value)}
                required
              >
                <option value="">Select...</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </CustomSelect>
            </div>
            
            <div className="mb-3 text-zinc-300">
              <ArrowRightLeft size={20} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">To Warehouse</label>
              <CustomSelect 
                className="input-field" 
                value={toWarehouse}
                onChange={e => setToWarehouse(e.target.value)}
                required
              >
                <option value="">Select...</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </CustomSelect>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Item to Transfer</label>
            <CustomSelect 
              className="input-field" 
              value={itemId}
              onChange={e => setItemId(e.target.value)}
              required
            >
              <option value="">Select Item...</option>
              {stocks.map(s => <option key={s.id} value={s.id}>{s.name} ({s.inStock} {s.unit} avail)</option>)}
            </CustomSelect>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Quantity</label>
              <input 
                type="number" 
                min="0.01"
                step="0.01"
                className="input-field" 
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
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
            <button type="submit" className="btn-primary">Initiate Transfer</button>
          </div>
        </form>
      </div>
    </div>
  )
}

