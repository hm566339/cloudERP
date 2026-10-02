import React, { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';

export default function InventoryCostLayerForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading 
}) {
  const [formData, setFormData] = useState({
    productId: initialData?.productId || '',
    warehouseId: initialData?.warehouseId || '',
    batchId: initialData?.batchId || '',
    sourceMovementId: initialData?.sourceMovementId || '',
    sourceMovementLineId: initialData?.sourceMovementLineId || '',
    receivedQuantity: initialData?.receivedQuantity || 0,
    remainingQuantity: initialData?.remainingQuantity || 0,
    unitCost: initialData?.unitCost || 0,
    totalCost: initialData?.totalCost || 0,
    consumedCost: initialData?.consumedCost || 0,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.productId.trim()) newErrors.productId = 'Product ID is required';
    if (!formData.warehouseId.trim()) newErrors.warehouseId = 'Warehouse ID is required';
    
    if (formData.receivedQuantity < 0) newErrors.receivedQuantity = 'Cannot be negative';
    if (formData.remainingQuantity < 0) newErrors.remainingQuantity = 'Cannot be negative';
    if (formData.unitCost < 0) newErrors.unitCost = 'Cannot be negative';
    
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
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Product ID */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
              Product ID <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="productId"
              value={formData.productId}
              onChange={handleChange}
              className={`w-full h-9 px-3 rounded-md border text-[10.4px] bg-white transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                errors.productId ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
              }`}
            />
            {errors.productId && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.productId}
              </p>
            )}
          </div>

          {/* Warehouse ID */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
              Warehouse ID <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="warehouseId"
              value={formData.warehouseId}
              onChange={handleChange}
              className={`w-full h-9 px-3 rounded-md border text-[10.4px] bg-white transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                errors.warehouseId ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
              }`}
            />
            {errors.warehouseId && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.warehouseId}
              </p>
            )}
          </div>

          {/* Batch ID */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Batch ID</label>
            <input
              type="text"
              name="batchId"
              value={formData.batchId}
              onChange={handleChange}
              className="w-full h-9 px-3 rounded-md border border-zinc-200 text-[10.4px] bg-white transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Source Movement ID */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Source Movement ID</label>
            <input
              type="text"
              name="sourceMovementId"
              value={formData.sourceMovementId}
              onChange={handleChange}
              className="w-full h-9 px-3 rounded-md border border-zinc-200 text-[10.4px] bg-white transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <hr className="border-zinc-100" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Received Quantity */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Received Quantity</label>
            <input
              type="number"
              step="any"
              name="receivedQuantity"
              value={formData.receivedQuantity}
              onChange={handleChange}
              className={`w-full h-9 px-3 rounded-md border text-[10.4px] bg-white transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                errors.receivedQuantity ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
              }`}
            />
            {errors.receivedQuantity && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.receivedQuantity}
              </p>
            )}
          </div>

          {/* Remaining Quantity */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Remaining Quantity</label>
            <input
              type="number"
              step="any"
              name="remainingQuantity"
              value={formData.remainingQuantity}
              onChange={handleChange}
              className={`w-full h-9 px-3 rounded-md border text-[10.4px] bg-white transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                errors.remainingQuantity ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
              }`}
            />
            {errors.remainingQuantity && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.remainingQuantity}
              </p>
            )}
          </div>

          {/* Unit Cost */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Unit Cost</label>
            <input
              type="number"
              step="any"
              name="unitCost"
              value={formData.unitCost}
              onChange={handleChange}
              className={`w-full h-9 px-3 rounded-md border text-[10.4px] bg-white transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                errors.unitCost ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
              }`}
            />
            {errors.unitCost && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.unitCost}
              </p>
            )}
          </div>

          {/* Total Cost */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Total Cost</label>
            <input
              type="number"
              step="any"
              name="totalCost"
              value={formData.totalCost}
              onChange={handleChange}
              className="w-full h-9 px-3 rounded-md border border-zinc-200 text-[10.4px] bg-white transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-zinc-100 bg-zinc-50/50 mt-auto shrink-0">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-[10.4px] font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 hover:text-zinc-900 transition-colors disabled:opacity-50"
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
          {initialData ? 'Update Cost Layer' : 'Create Cost Layer'}
        </button>
      </div>
    </form>
  );
}
