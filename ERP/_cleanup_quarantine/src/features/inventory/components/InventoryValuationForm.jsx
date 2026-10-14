import React, { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';

export default function InventoryValuationForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading 
}) {
  const [formData, setFormData] = useState({
    stockMovementId: initialData?.stockMovementId || '',
    stockMovementLineId: initialData?.stockMovementLineId || '',
    productId: initialData?.productId || '',
    warehouseId: initialData?.warehouseId || '',
    locationId: initialData?.locationId || '',
    batchId: initialData?.batchId || '',
    valuationDate: initialData?.valuationDate ? initialData.valuationDate.split('T')[0] : '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.stockMovementId.trim()) newErrors.stockMovementId = 'Movement ID is required';
    if (!formData.productId.trim()) newErrors.productId = 'Product ID is required';
    if (!formData.warehouseId.trim()) newErrors.warehouseId = 'Warehouse ID is required';
    if (!formData.valuationDate) newErrors.valuationDate = 'Valuation Date is required';
    
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
        
        <div className="p-3 bg-blue-50 text-blue-800 rounded-lg border border-blue-100 text-[9.6px] mb-4">
          <p className="font-semibold mb-1">Triggering Financial Valuation</p>
          <p>
            This action creates or updates the financial ledger entry (COGS, Average Cost, Stock Value) for a specific physical stock movement. The system will automatically compute financial metrics and prepare GL entries based on your costing method (e.g., FIFO, Weighted Average).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Stock Movement ID */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
              Stock Movement ID <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="stockMovementId"
              value={formData.stockMovementId}
              onChange={handleChange}
              className={`w-full h-9 px-3 rounded-md border text-[10.4px] bg-white transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
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

          {/* Stock Movement Line ID */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Movement Line ID</label>
            <input
              type="text"
              name="stockMovementLineId"
              value={formData.stockMovementLineId}
              onChange={handleChange}
              className="w-full h-9 px-3 rounded-md border border-zinc-200 text-[10.4px] bg-white transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

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

          {/* Valuation Date */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
              Valuation Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              name="valuationDate"
              value={formData.valuationDate}
              onChange={handleChange}
              className={`w-full h-9 px-3 rounded-md border text-[10.4px] bg-white transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                errors.valuationDate ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
              }`}
            />
            {errors.valuationDate && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.valuationDate}
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

          {/* Location ID */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Location ID</label>
            <input
              type="text"
              name="locationId"
              value={formData.locationId}
              onChange={handleChange}
              className="w-full h-9 px-3 rounded-md border border-zinc-200 text-[10.4px] bg-white transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
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
          {initialData ? 'Update Metadata' : 'Trigger Valuation'}
        </button>
      </div>
    </form>
  );
}
