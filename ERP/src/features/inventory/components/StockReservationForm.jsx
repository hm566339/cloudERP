import React, { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';

export default function StockReservationForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading 
}) {
  const [formData, setFormData] = useState({
    reservationNo: initialData?.reservationNo || '',
    productId: initialData?.productId || '',
    warehouseId: initialData?.warehouseId || '',
    locationId: initialData?.locationId || '',
    batchId: initialData?.batchId || '',
    referenceType: initialData?.referenceType || 'MANUAL',
    referenceId: initialData?.referenceId || '',
    referenceLineId: initialData?.referenceLineId || '',
    reservedQuantity: initialData?.reservedQuantity || 0,
    releasedQuantity: initialData?.releasedQuantity || 0,
    status: initialData?.status || 'ACTIVE',
    expiresAt: initialData?.expiresAt ? new Date(initialData.expiresAt).toISOString().split('T')[0] : '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let parsedValue = value;
    
    if (type === 'number') {
      parsedValue = value === '' ? '' : Number(value);
    }
    
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.reservationNo.trim()) newErrors.reservationNo = 'Reservation No is required';
    if (!formData.productId.trim()) newErrors.productId = 'Product ID is required';
    if (!formData.warehouseId.trim()) newErrors.warehouseId = 'Warehouse ID is required';
    if (formData.reservedQuantity <= 0) newErrors.reservedQuantity = 'Reserved quantity must be positive';

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
        
        {/* Reservation Info */}
        <div className="space-y-4">
          <h3 className="text-[10.4px] font-bold text-zinc-800 border-b border-zinc-100 dark:border-[#2A2F3D] pb-2">Reservation Info</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
                Reservation No <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="reservationNo"
                value={formData.reservationNo}
                onChange={handleChange}
                disabled={!!initialData}
                className={`w-full h-9 px-3 rounded-md border dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.reservationNo ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
                } disabled:bg-zinc-50 disabled:text-zinc-500`}
                autoFocus={!initialData}
              />
              {errors.reservationNo && (
                <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle size={12} /> {errors.reservationNo}
                </p>
              )}
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="ACTIVE">Active</option>
                <option value="CONSUMED">Consumed</option>
                <option value="RELEASED">Released</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
            
            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Expires At</label>
              <input
                type="date"
                name="expiresAt"
                value={formData.expiresAt}
                onChange={handleChange}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Location & Product */}
        <div className="space-y-4">
          <h3 className="text-[10.4px] font-bold text-zinc-800 border-b border-zinc-100 dark:border-[#2A2F3D] pb-2">Target Stock</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50/50 p-4 rounded-lg border border-zinc-100">
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
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
                Warehouse ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="warehouseId"
                value={formData.warehouseId}
                onChange={handleChange}
                className={`w-full h-9 px-3 rounded-md border dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.warehouseId ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
                }`}
              />
              {errors.warehouseId && (
                <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle size={12} /> {errors.warehouseId}
                </p>
              )}
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Location ID</label>
              <input
                type="text"
                name="locationId"
                value={formData.locationId}
                onChange={handleChange}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Quantities & References */}
        <div className="space-y-4">
          <h3 className="text-[10.4px] font-bold text-zinc-800 border-b border-zinc-100 dark:border-[#2A2F3D] pb-2">Quantities & Reference</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
                Reserved Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                name="reservedQuantity"
                value={formData.reservedQuantity}
                onChange={handleChange}
                className={`w-full h-9 px-3 rounded-md border dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.reservedQuantity ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
                }`}
              />
              {errors.reservedQuantity && (
                <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle size={12} /> {errors.reservedQuantity}
                </p>
              )}
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Released/Consumed Qty</label>
              <input
                type="number"
                name="releasedQuantity"
                value={formData.releasedQuantity}
                readOnly
                className="w-full h-9 px-3 rounded-md border border-zinc-200 text-[10.4px] bg-zinc-50 outline-none text-zinc-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Reference Type</label>
              <select
                name="referenceType"
                value={formData.referenceType}
                onChange={handleChange}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="MANUAL">Manual</option>
                <option value="SALES_ORDER">Sales Order</option>
                <option value="PRODUCTION_ORDER">Production Order</option>
              </select>
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Reference ID (UUID)</label>
              <input
                type="text"
                name="referenceId"
                value={formData.referenceId}
                onChange={handleChange}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            
            <div className="sm:col-span-2">
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Reference Line ID</label>
              <input
                type="text"
                name="referenceLineId"
                value={formData.referenceLineId}
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
          {initialData ? 'Update Reservation' : 'Save Reservation'}
        </button>
      </div>
    </form>
  );
}
