import React, { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';

export default function ProductBatchForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading 
}) {
  const [formData, setFormData] = useState({
    productId: initialData?.productId || '',
    batchNumber: initialData?.batchNumber || '',
    manufacturingDate: initialData?.manufacturingDate ? initialData.manufacturingDate.split('T')[0] : '',
    expiryDate: initialData?.expiryDate ? initialData.expiryDate.split('T')[0] : '',
    supplierId: initialData?.supplierId || '',
    status: initialData?.status || 'ACTIVE',
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
    if (!formData.productId.trim()) newErrors.productId = 'Product ID is required';
    if (!formData.batchNumber.trim()) newErrors.batchNumber = 'Batch Number is required';
    if (!formData.manufacturingDate) newErrors.manufacturingDate = 'Manufacturing Date is required';
    if (!formData.expiryDate) newErrors.expiryDate = 'Expiry Date is required';
    
    // Check logical dates
    if (formData.manufacturingDate && formData.expiryDate) {
      if (new Date(formData.manufacturingDate) > new Date(formData.expiryDate)) {
        newErrors.expiryDate = 'Expiry Date must be after Mfg Date';
      }
    }

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
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        
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
              autoFocus
            />
            {errors.productId && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.productId}
              </p>
            )}
          </div>

          {/* Batch Number */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
              Batch Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="batchNumber"
              value={formData.batchNumber}
              onChange={handleChange}
              placeholder="e.g. BATCH-2026-A"
              className={`w-full h-9 px-3 rounded-md border text-[10.4px] bg-white transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                errors.batchNumber ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
              }`}
            />
            {errors.batchNumber && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.batchNumber}
              </p>
            )}
          </div>

          {/* Supplier ID */}
          <div className="sm:col-span-2">
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Supplier ID</label>
            <input
              type="text"
              name="supplierId"
              value={formData.supplierId}
              onChange={handleChange}
              className="w-full h-9 px-3 rounded-md border border-zinc-200 text-[10.4px] bg-white transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Manufacturing Date */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
              Manufacturing Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              name="manufacturingDate"
              value={formData.manufacturingDate}
              onChange={handleChange}
              className={`w-full h-9 px-3 rounded-md border text-[10.4px] bg-white transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                errors.manufacturingDate ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
              }`}
            />
            {errors.manufacturingDate && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.manufacturingDate}
              </p>
            )}
          </div>

          {/* Expiry Date */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
              Expiry Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              className={`w-full h-9 px-3 rounded-md border text-[10.4px] bg-white transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                errors.expiryDate ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
              }`}
            />
            {errors.expiryDate && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.expiryDate}
              </p>
            )}
          </div>

          {/* Status */}
          <div className="sm:col-span-2 border-t border-zinc-100 pt-4 mt-2">
            <label className="text-[9.6px] font-bold text-zinc-700 mb-2 block">Batch Status</label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="ACTIVE"
                  checked={formData.status === 'ACTIVE'}
                  onChange={handleChange}
                  className="w-4 h-4 text-emerald-600 border-zinc-300 focus:ring-emerald-600"
                />
                <span className="text-[10.4px] font-medium text-zinc-700">Active</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="EXPIRED"
                  checked={formData.status === 'EXPIRED'}
                  onChange={handleChange}
                  className="w-4 h-4 text-rose-600 border-zinc-300 focus:ring-rose-600"
                />
                <span className="text-[10.4px] font-medium text-zinc-700">Expired</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="QUARANTINE"
                  checked={formData.status === 'QUARANTINE'}
                  onChange={handleChange}
                  className="w-4 h-4 text-amber-600 border-zinc-300 focus:ring-amber-600"
                />
                <span className="text-[10.4px] font-medium text-zinc-700">Quarantine</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="RECALLED"
                  checked={formData.status === 'RECALLED'}
                  onChange={handleChange}
                  className="w-4 h-4 text-rose-800 border-zinc-300 focus:ring-rose-800"
                />
                <span className="text-[10.4px] font-medium text-zinc-700">Recalled</span>
              </label>
            </div>
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
          {initialData ? 'Update Batch' : 'Create Batch'}
        </button>
      </div>
    </form>
  );
}
