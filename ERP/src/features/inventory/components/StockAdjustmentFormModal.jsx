import React, { useState, useEffect } from 'react';
import { X, Calculator } from 'lucide-react';
import CustomSelect from '../../../components/common/CustomSelect';
import { useWarehouseList } from '../../../api/inventory/hooks/useWarehouse';
import { useWarehouseLocationList } from '../../../api/inventory/hooks/useWarehouseLocation';
import { useProductList } from '../../../api/inventory/hooks/useProduct';
import { useStockAdjustmentCreate } from '../../../api/inventory/hooks/useStockAdjustment';

const ADJUSTMENT_REASONS = [
  'Stock Correction',
  'Damage',
  'Theft',
  'Expiry',
  'Promotional Use',
  'Internal Consumption',
  'Found in Warehouse',
  'Other'
];

export default function StockAdjustmentFormModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    adjustmentNo: '',
    adjustmentDate: new Date().toISOString().split('T')[0],
    warehouseId: '',
    locationId: '',
    reason: 'Stock Correction',
    remarks: '',
    status: 'APPROVED',
    
    // Line details
    productId: '',
    batchId: '',
    serialId: '',
    adjustmentType: 'ADJUSTMENT_IN',
    quantity: 1,
    unitCost: 0
  });

  const { warehouses, isLoading: isLoadingWarehouses } = useWarehouseList(
    { status: 'ACTIVE' },
    { size: 100, sort: ['warehouseName,asc'] },
    { skip: !isOpen }
  );

  const { locations, isLoading: isLoadingLocations } = useWarehouseLocationList(
    { warehouseId: formData.warehouseId, isActive: true },
    { size: 100, sort: ['locationName,asc'] },
    { skip: !isOpen || !formData.warehouseId }
  );

  const { products, isLoading: isLoadingProducts } = useProductList(
    { status: 'ACTIVE' },
    { size: 200, sort: ['productName,asc'] },
    { skip: !isOpen }
  );

  const createMutation = useStockAdjustmentCreate();

  useEffect(() => {
    if (isOpen) {
      setFormData({
        adjustmentNo: '',
        adjustmentDate: new Date().toISOString().split('T')[0],
        warehouseId: '',
        locationId: '',
        reason: 'Stock Correction',
        remarks: '',
        status: 'APPROVED',
        productId: '',
        batchId: '',
        serialId: '',
        adjustmentType: 'ADJUSTMENT_IN',
        quantity: 1,
        unitCost: 0
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let parsedValue = value;
    
    if (type === 'number') {
      parsedValue = value === '' ? '' : Number(value);
    }
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: parsedValue,
      ...(name === 'warehouseId' && { locationId: '' }), // reset location if warehouse changes
      ...(name === 'productId' && { unitCost: products?.find(p => p.id === value)?.standardCost || 0 }) // auto-fill cost
    }));
  };

  const adjustmentValue = (formData.quantity || 0) * (formData.unitCost || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      adjustmentNo: formData.adjustmentNo || null,
      adjustmentDate: formData.adjustmentDate ? new Date(formData.adjustmentDate).toISOString() : null,
      warehouseId: formData.warehouseId,
      locationId: formData.locationId,
      reason: formData.reason,
      remarks: formData.remarks,
      status: formData.status,
      lines: [
        {
          productId: formData.productId,
          batchId: formData.batchId || null,
          serialId: formData.serialId || null,
          adjustmentType: formData.adjustmentType,
          quantity: formData.quantity,
          unitCost: formData.unitCost,
          adjustmentValue: adjustmentValue
        }
      ]
    };

    try {
      await createMutation.mutateAsync(payload);
      onSuccess();
    } catch (error) {
      // Error is handled in the component calling this or globally, 
      // but we throw to let the parent component know it failed if needed
      console.error('Failed to create adjustment', error);
      throw error;
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4 sm:p-6 overflow-hidden">
      <div 
        className="bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200"
        style={{ width: '1150px', maxWidth: 'calc(100vw - 56px)', maxHeight: 'calc(100vh - 90px)' }}
      >
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-200 shrink-0 bg-white">
          <h2 className="text-[14.4px] font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            Create Stock Adjustment
          </h2>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors active:scale-95"
            disabled={createMutation.isLoading}
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 bg-white flex-1">
          <form id="adjustment-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* LEFT COLUMN: Header Info */}
            <div>
              <h3 className="text-[9.6px] font-bold text-zinc-800 uppercase tracking-wider mb-3 border-b border-zinc-200 pb-2">Document Details</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div className="space-y-1">
                  <label className="text-[10.4px] font-semibold text-zinc-700">Adjustment No.</label>
                  <input 
                    type="text" 
                    name="adjustmentNo"
                    className="w-full h-9 px-3 bg-white border border-zinc-300 rounded-md text-[10.4px] text-zinc-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-zinc-400"
                    value={formData.adjustmentNo}
                    onChange={handleChange}
                    placeholder="Auto-generated if left blank"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10.4px] font-semibold text-zinc-700">Date <span className="text-rose-500">*</span></label>
                  <input 
                    type="date" 
                    name="adjustmentDate"
                    className="w-full h-9 px-3 bg-white border border-zinc-300 rounded-md text-[10.4px] text-zinc-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    value={formData.adjustmentDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10.4px] font-semibold text-zinc-700">Warehouse <span className="text-rose-500">*</span></label>
                  <CustomSelect
                    name="warehouseId"
                    value={formData.warehouseId}
                    onChange={handleChange}
                    className="w-full h-9 px-3 bg-white border border-zinc-300 rounded-md text-[10.4px] transition-all hover:border-zinc-400"
                    required
                    disabled={isLoadingWarehouses}
                  >
                    <option value="" disabled>Select Warehouse</option>
                    {warehouses?.map(w => (
                      <option key={w.id} value={w.id}>{w.warehouseName}</option>
                    ))}
                  </CustomSelect>
                </div>

                <div className="space-y-1">
                  <label className="text-[10.4px] font-semibold text-zinc-700">Location <span className="text-rose-500">*</span></label>
                  <CustomSelect
                    name="locationId"
                    value={formData.locationId}
                    onChange={handleChange}
                    className="w-full h-9 px-3 bg-white border border-zinc-300 rounded-md text-[10.4px] transition-all hover:border-zinc-400"
                    required
                    disabled={!formData.warehouseId || isLoadingLocations}
                  >
                    <option value="" disabled>Select Location</option>
                    {locations?.map(l => (
                      <option key={l.id} value={l.id}>{l.locationName}</option>
                    ))}
                  </CustomSelect>
                </div>

                <div className="space-y-1">
                  <label className="text-[10.4px] font-semibold text-zinc-700">Reason <span className="text-rose-500">*</span></label>
                  <CustomSelect
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    className="w-full h-9 px-3 bg-white border border-zinc-300 rounded-md text-[10.4px] transition-all hover:border-zinc-400"
                    required
                  >
                    {ADJUSTMENT_REASONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </CustomSelect>
                </div>

                <div className="space-y-1">
                  <label className="text-[10.4px] font-semibold text-zinc-700">Status <span className="text-rose-500">*</span></label>
                  <CustomSelect
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full h-9 px-3 bg-white border border-zinc-300 rounded-md text-[10.4px] transition-all hover:border-zinc-400"
                    required
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="APPROVED">Approved</option>
                  </CustomSelect>
                </div>
                
                <div className="col-span-2 space-y-1">
                  <label className="text-[10.4px] font-semibold text-zinc-700">Remarks</label>
                  <textarea 
                    name="remarks"
                    className="w-full p-2 bg-white border border-zinc-300 rounded-md text-[10.4px] text-zinc-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-zinc-400 resize-none"
                    value={formData.remarks}
                    onChange={handleChange}
                    placeholder="Optional remarks..."
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Line Details */}
            <div>
              <h3 className="text-[9.6px] font-bold text-zinc-800 uppercase tracking-wider mb-3 border-b border-zinc-200 pb-2">Adjustment Line</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                
                <div className="col-span-2 space-y-1">
                  <label className="text-[10.4px] font-semibold text-zinc-700">Product <span className="text-rose-500">*</span></label>
                  <CustomSelect
                    name="productId"
                    value={formData.productId}
                    onChange={handleChange}
                    className="w-full h-9 px-3 bg-white border border-zinc-300 rounded-md text-[10.4px] transition-all hover:border-zinc-400"
                    required
                    disabled={isLoadingProducts}
                    searchable={true}
                  >
                    <option value="" disabled>Select Product</option>
                    {products?.map(p => (
                      <option key={p.id} value={p.id}>{p.productName} {p.sku ? `(${p.sku})` : ''}</option>
                    ))}
                  </CustomSelect>
                </div>

                <div className="space-y-1">
                  <label className="text-[10.4px] font-semibold text-zinc-700">Batch / Lot (Optional)</label>
                  <input 
                    type="text" 
                    name="batchId"
                    className="w-full h-9 px-3 bg-white border border-zinc-300 rounded-md text-[10.4px] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-zinc-400"
                    value={formData.batchId}
                    onChange={handleChange}
                    placeholder="Batch No..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10.4px] font-semibold text-zinc-700">Serial (Optional)</label>
                  <input 
                    type="text" 
                    name="serialId"
                    className="w-full h-9 px-3 bg-white border border-zinc-300 rounded-md text-[10.4px] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-zinc-400"
                    value={formData.serialId}
                    onChange={handleChange}
                    placeholder="Serial No..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10.4px] font-semibold text-zinc-700">Adjustment Type <span className="text-rose-500">*</span></label>
                  <CustomSelect
                    name="adjustmentType"
                    value={formData.adjustmentType}
                    onChange={handleChange}
                    className="w-full h-9 px-3 bg-white border border-zinc-300 rounded-md text-[10.4px] transition-all hover:border-zinc-400"
                    required
                  >
                    <option value="ADJUSTMENT_IN">Adjustment In (+)</option>
                    <option value="ADJUSTMENT_OUT">Adjustment Out (-)</option>
                  </CustomSelect>
                </div>

                <div className="space-y-1">
                  <label className="text-[10.4px] font-semibold text-zinc-700">Quantity <span className="text-rose-500">*</span></label>
                  <input 
                    type="number" 
                    name="quantity"
                    min="1"
                    step="0.01"
                    className="w-full h-9 px-3 bg-white border border-zinc-300 rounded-md text-[10.4px] text-zinc-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10.4px] font-semibold text-zinc-700">Unit Cost <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[10.4px]">$</span>
                    <input 
                      type="number" 
                      name="unitCost"
                      min="0"
                      step="0.01"
                      className="w-full h-9 pl-7 pr-3 bg-white border border-zinc-300 rounded-md text-[10.4px] text-zinc-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={formData.unitCost}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10.4px] font-semibold text-zinc-700">Total Value</label>
                  <div className="w-full h-9 px-3 bg-zinc-50 border border-zinc-300 rounded-md text-[10.4px] font-medium text-zinc-900 flex items-center gap-2">
                    <Calculator size={14} className="text-zinc-500" />
                    <span>₹{adjustmentValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 shrink-0 flex items-center justify-end gap-3 bg-white rounded-b-xl">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-5 py-2.5 text-[10.4px] font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors"
            disabled={createMutation.isLoading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="adjustment-form" 
            className="px-6 py-2.5 text-[10.4px] font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-colors shadow-sm flex items-center justify-center min-w-[112px]"
            disabled={createMutation.isLoading}
          >
            {createMutation.isLoading ? 'Creating...' : 'Create Adjustment'}
          </button>
        </div>

      </div>
    </div>
  );
}
