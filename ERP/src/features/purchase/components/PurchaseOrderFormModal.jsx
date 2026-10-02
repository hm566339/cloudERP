
import CustomSelect from '../../../components/common/CustomSelect';
import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useGetActiveVendorsQuery } from '../../../api/purchase'

export default function PurchaseOrderFormModal({ isOpen, onClose, onSubmit }) {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
  const { data: vendors = [] } = useGetActiveVendorsQuery(companyId)

  const [vendorId, setVendorId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [expectedDate, setExpectedDate] = useState('')
  
  const [items, setItems] = useState([
    { id: Date.now(), name: '', qty: 1, rate: '' }
  ])

  useEffect(() => {
    if (isOpen) {
      setVendorId('')
      setDate(new Date().toISOString().split('T')[0])
      setExpectedDate('')
      setItems([{ id: Date.now(), name: '', qty: 1, rate: '' }])
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), name: '', qty: 1, rate: '' }])
  }

  const handleRemoveItem = (id) => {
    setItems(items.filter(item => item.id !== id))
  }

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const subtotal = items.reduce((acc, item) => acc + ((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)), 0)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!vendorId) return alert('Please select a vendor')
    if (items.some(i => !i.name || i.qty <= 0 || i.rate < 0)) return alert('Please fill item details correctly')

    const vendor = vendors.find(v => v.id === vendorId)

    onSubmit({
      companyId,
      vendorId,
      vendor: vendor?.vendorName || vendor?.companyName || 'Unknown Vendor',
      date,
      expectedDate,
      items: items.map(item => ({
        ...item,
        qty: parseFloat(item.qty) || 0,
        rate: parseFloat(item.rate) || 0
      }))
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-950/60 backdrop-blur-sm px-3 py-6 sm:px-4 sm:py-8">
      <div className="card my-auto w-full max-w-3xl max-h-[calc(100vh-3rem)] sm:max-h-[calc(100vh-4rem)] overflow-hidden animate-slide-up flex flex-col bg-white shadow-xl">
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-zinc-800">Create Purchase Order</h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-50 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 flex-1 min-h-0 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Vendor</label>
              <CustomSelect 
                className="input-field" 
                value={vendorId} 
                onChange={e => setVendorId(e.target.value)}
                required
              >
                <option value="">Select Vendor...</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.vendorName || v.companyName}</option>
                ))}
              </CustomSelect>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Order Date</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Expected Delivery</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={expectedDate}
                  onChange={e => setExpectedDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-zinc-700">Order Items</h3>
              <button type="button" onClick={handleAddItem} className="btn-secondary text-xs py-1.5 px-3">
                <Plus size={14} /> Add Item
              </button>
            </div>

            <div className="border border-zinc-200 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-xs uppercase">
                  <tr>
                <th className="w-12 text-center">S.No.</th>
                    <th className="p-3 font-semibold">Item Details</th>
                    <th className="p-3 font-semibold w-24">Qty</th>
                    <th className="p-3 font-semibold w-32">Rate (₹)</th>
                    <th className="p-3 font-semibold w-32 text-right">Amount</th>
                    <th className="p-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 staggered-list">
                  {items.map((item, index) => (
                    <tr key={item.id} className="bg-white">
                    <td className="text-center font-medium text-zinc-500">{index + 1}</td>
                      <td className="p-2">
                        <input 
                          type="text" 
                          placeholder="Item name" 
                          className="input-field py-2" 
                          value={item.name}
                          onChange={e => handleItemChange(item.id, 'name', e.target.value)}
                          required
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="number" 
                          min="1"
                          className="input-field py-2 text-center" 
                          value={item.qty}
                          onChange={e => handleItemChange(item.id, 'qty', e.target.value)}
                          required
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="number" 
                          min="0"
                          className="input-field py-2 text-right" 
                          value={item.rate}
                          onChange={e => handleItemChange(item.id, 'rate', e.target.value)}
                          required
                        />
                      </td>
                      <td className="p-2 text-right font-medium text-zinc-700">
                        ₹{((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)).toLocaleString()}
                      </td>
                      <td className="p-2 text-center">
                        <button 
                          type="button" 
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                          disabled={items.length === 1}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-100">
            <div className="flex justify-between text-lg font-bold text-primary w-full max-w-xs">
              <span>Estimated Total:</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create Purchase Order</button>
          </div>
        </form>
      </div>
    </div>
  )
}

