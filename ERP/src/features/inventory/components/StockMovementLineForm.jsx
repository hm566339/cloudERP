import React, { useState } from 'react';
import { Save, AlertCircle, ArrowRightLeft } from 'lucide-react';

export default function StockMovementLineForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading 
}) {
  const [formData, setFormData] = useState({
    stockMovementId: initialData?.stockMovementId || '',
    productId: initialData?.productId || '',
    sourceWarehouseId: initialData?.sourceWarehouseId || '',
    sourceLocationId: initialData?.sourceLocationId || '',
    destinationWarehouseId: initialData?.destinationWarehouseId || '',
    destinationLocationId: initialData?.destinationLocationId || '',
    batchId: initialData?.batchId || '',
    serialId: initialData?.serialId || '',
    uomId: initialData?.uomId || '',
    quantity: initialData?.quantity || 0,
    unitCost: initialData?.unitCost || 0,
    totalCost: initialData?.totalCost || 0,
    quantityBefore: initialData?.quantityBefore || 0,
    quantityAfter: initialData?.quantityAfter || 0,
    referenceLineId: initialData?.referenceLineId || '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let parsedValue = value;
    
    if (type === 'number') {
      parsedValue = value === '' ? '' : Number(value);
    }
    
    setFormData((prev) => {
      const next = { ...prev, [name]: parsedValue };
      // Auto-calc total cost
      if (name === 'quantity' || name === 'unitCost') {
        const q = name === 'quantity' ? parsedValue : prev.quantity;
        const c = name === 'unitCost' ? parsedValue : prev.unitCost;
        next.totalCost = Number(q) * Number(c);
      }
      return next;
    });
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.stockMovementId.trim()) newErrors.stockMovementId = 'Movement ID is required';
    if (!formData.productId.trim()) newErrors.productId = 'Product ID is required';
    if (formData.quantity <= 0) newErrors.quantity = 'Quantity must be positive';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white dark:bg-card-dark">
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Identifiers */}
        <div className="space-y-4">
          <h3 className="text-[10.4px] font-bold text-zinc-800 border-b border-zinc-100 dark:border-[#2A2F3D] pb-2">Core Identifiers</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
                Stock Movement ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="stockMovementId"
                value={formData.stockMovementId}
                onChange={handleChange}
                className={`w-full h-9 px-3 rounded-md border dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.stockMovementId ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
                }`}
                autoFocus
              />
              {errors.stockMovementId && (
                <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle size={12} /> {errors.stockMovementId}
                </p>
              )}
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
                Product ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="productId"
                value={formData.productId}
                onChange={handleChange}
                className={`w-full h-9 px-3 rounded-md border dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.productId ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
                }`}
              />
              {errors.productId && (
                <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle size={12} /> {errors.productId}
                </p>
              )}
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Batch ID</label>
              <input
                type="text"
                name="batchId"
                value={formData.batchId}
                onChange={handleChange}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            
            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Serial ID</label>
              <input
                type="text"
                name="serialId"
                value={formData.serialId}
                onChange={handleChange}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Source & Destination */}
        <div className="space-y-4">
          <h3 className="text-[10.4px] font-bold text-zinc-800 border-b border-zinc-100 dark:border-[#2A2F3D] pb-2">Source & Destination</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50/50 p-4 rounded-lg border border-zinc-100">
            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Source Warehouse ID</label>
              <input
                type="text"
                name="sourceWarehouseId"
                value={formData.sourceWarehouseId}
                onChange={handleChange}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            
            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Dest. Warehouse ID</label>
              <input
                type="text"
                name="destinationWarehouseId"
                value={formData.destinationWarehouseId}
                onChange={handleChange}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Source Location ID</label>
              <input
                type="text"
                name="sourceLocationId"
                value={formData.sourceLocationId}
                onChange={handleChange}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Dest. Location ID</label>
              <input
                type="text"
                name="destinationLocationId"
                value={formData.destinationLocationId}
                onChange={handleChange}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Quantities & Costs */}
        <div className="space-y-4">
          <h3 className="text-[10.4px] font-bold text-zinc-800 border-b border-zinc-100 dark:border-[#2A2F3D] pb-2">Metrics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
                Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className={`w-full h-9 px-3 rounded-md border dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.quantity ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
                }`}
              />
              {errors.quantity && (
                <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle size={12} /> {errors.quantity}
                </p>
              )}
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Unit Cost</label>
              <input
                type="number"
                name="unitCost"
                value={formData.unitCost}
                onChange={handleChange}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Total Cost</label>
              <input
                type="number"
                name="totalCost"
                value={formData.totalCost}
                readOnly
                className="w-full h-9 px-3 rounded-md border border-zinc-200 text-[10.4px] bg-zinc-50 outline-none text-zinc-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Qty Before</label>
              <input
                type="number"
                name="quantityBefore"
                value={formData.quantityBefore}
                onChange={handleChange}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Qty After</label>
              <input
                type="number"
                name="quantityAfter"
                value={formData.quantityAfter}
                onChange={handleChange}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            
            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">UOM ID</label>
              <input
                type="text"
                name="uomId"
                value={formData.uomId}
                onChange={handleChange}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            
          </div>
        </div>

      </div>

      <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1D212C]/50 mt-auto shrink-0">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-[10.4px] font-semibold text-zinc-600 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md hover:bg-zinc-50 hover:text-zinc-900 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-[10.4px] font-semibold text-white bg-zinc-900 border border-transparent rounded-md hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {initialData ? 'Update Line' : 'Save Line'}
        </button>
      </div>
    </form>
  );
}
