import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useParams } from 'react-router-dom'
import CustomSelect from '../../../components/common/CustomSelect'
import { useGetBomsQuery, useGetWarehousesQuery } from '../../../api/inventory'

export default function ProductionOrderFormModal({ isOpen, onClose, onSubmit }) {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
  
  const { data: boms = [], isLoading: isLoadingBoms } = useGetBomsQuery(companyId, { skip: !isOpen })
  const { data: warehouses = [], isLoading: isLoadingWarehouses } = useGetWarehousesQuery(companyId, { skip: !isOpen })

  const [bomId, setBomId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [plannedQuantity, setPlannedQuantity] = useState('')
  const [plannedStartDate, setPlannedStartDate] = useState(new Date().toISOString().split('T')[0])
  const [plannedEndDate, setPlannedEndDate] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (isOpen) {
      setBomId('')
      setWarehouseId('')
      setPlannedQuantity('')
      setPlannedStartDate(new Date().toISOString().split('T')[0])
      setPlannedEndDate('')
      setPriority('MEDIUM')
      setNotes('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()

    onSubmit({
      companyId,
      bomId,
      warehouseId,
      plannedQuantity: parseFloat(plannedQuantity) || 0,
      plannedStartDate: plannedStartDate || undefined,
      plannedEndDate: plannedEndDate || undefined,
      priority: priority || 'MEDIUM',
      notes: notes.trim() || undefined
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
      <div className="card w-full max-w-lg animate-slide-up flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-[#2A2F3D]">
          <div>
            <h2 className="text-xl font-bold text-zinc-800">New Production Order</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Create a work order based on an approved Bill of Materials</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">
              Bill of Materials (BOM) <span className="text-rose-500">*</span>
            </label>
            <CustomSelect 
              className="input-field" 
              value={bomId}
              onChange={e => setBomId(e.target.value)}
              required
            >
              <option value="">{isLoadingBoms ? 'Loading BOMs...' : 'Select Bill of Materials...'}</option>
              {boms.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.bomNumber || 'Standard'}) - Rev {b.currentRevision || 1}
                </option>
              ))}
            </CustomSelect>
            {!isLoadingBoms && boms.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No BOMs found. Please create a Bill of Materials first.</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">
              Target Warehouse <span className="text-rose-500">*</span>
            </label>
            <CustomSelect 
              className="input-field" 
              value={warehouseId}
              onChange={e => setWarehouseId(e.target.value)}
              required
            >
              <option value="">{isLoadingWarehouses ? 'Loading Warehouses...' : 'Select Warehouse...'}</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.code ? `(${w.code})` : ''}
                </option>
              ))}
            </CustomSelect>
            {!isLoadingWarehouses && warehouses.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No warehouses found in inventory.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">
                Planned Quantity <span className="text-rose-500">*</span>
              </label>
              <input 
                type="number" 
                step="any"
                min="0.000001"
                className="input-field" 
                value={plannedQuantity}
                onChange={e => setPlannedQuantity(e.target.value)}
                placeholder="e.g. 100"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Priority</label>
              <CustomSelect
                className="input-field"
                value={priority}
                onChange={e => setPriority(e.target.value)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </CustomSelect>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Planned Start Date</label>
              <input 
                type="date" 
                className="input-field" 
                value={plannedStartDate}
                onChange={e => setPlannedStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Planned Completion Date</label>
              <input 
                type="date" 
                className="input-field" 
                value={plannedEndDate}
                onChange={e => setPlannedEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Notes / Instructions</label>
            <textarea
              className="input-field min-h-[60px]"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional production notes..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={!bomId || !warehouseId || !plannedQuantity} className="btn-primary">
              Create Production Order
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
