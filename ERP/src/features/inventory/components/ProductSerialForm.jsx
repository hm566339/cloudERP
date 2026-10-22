import React, { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';

export default function ProductSerialForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading 
}) {
  const [formData, setFormData] = useState({
    productId: initialData?.productId || '',
    batchId: initialData?.batchId || '',
    serialNumber: initialData?.serialNumber || '',
    purchaseDate: initialData?.purchaseDate ? initialData.purchaseDate.split('T')[0] : '',
    warrantyStartDate: initialData?.warrantyStartDate ? initialData.warrantyStartDate.split('T')[0] : '',
    warrantyEndDate: initialData?.warrantyEndDate ? initialData.warrantyEndDate.split('T')[0] : '',
    status: initialData?.status || 'AVAILABLE',
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
    if (!formData.serialNumber.trim()) newErrors.serialNumber = 'Serial Number is required';
    
    if (formData.warrantyStartDate && formData.warrantyEndDate) {
      if (new Date(formData.warrantyStartDate) > new Date(formData.warrantyEndDate)) {
        newErrors.warrantyEndDate = 'Warranty End Date must be after Start Date';
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
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white dark:bg-card-dark">
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
              className={`w-full h-9 px-3 rounded-md border dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
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

          {/* Batch ID */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Batch ID</label>
            <input
              type="text"
              name="batchId"
              value={formData.batchId}
              onChange={handleChange}
              placeholder="Optional"
              className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Serial Number */}
          <div className="sm:col-span-2">
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
              Serial Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="serialNumber"
              value={formData.serialNumber}
              onChange={handleChange}
              placeholder="e.g. SN-928374-X"
              className={`w-full h-9 px-3 rounded-md border dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                errors.serialNumber ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
              }`}
            />
            {errors.serialNumber && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.serialNumber}
              </p>
            )}
          </div>

          {/* Purchase Date */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Purchase Date</label>
            <input
              type="date"
              name="purchaseDate"
              value={formData.purchaseDate}
              onChange={handleChange}
              className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Spacer */}
          <div className="hidden sm:block"></div>

          {/* Warranty Start Date */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Warranty Start Date</label>
            <input
              type="date"
              name="warrantyStartDate"
              value={formData.warrantyStartDate}
              onChange={handleChange}
              className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Warranty End Date */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Warranty End Date</label>
            <input
              type="date"
              name="warrantyEndDate"
              value={formData.warrantyEndDate}
              onChange={handleChange}
              className={`w-full h-9 px-3 rounded-md border dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                errors.warrantyEndDate ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
              }`}
            />
            {errors.warrantyEndDate && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.warrantyEndDate}
              </p>
            )}
          </div>

          {/* Status */}
          <div className="sm:col-span-2 border-t border-zinc-100 pt-4 mt-2">
            <label className="text-[9.6px] font-bold text-zinc-700 mb-2 block">Serial Status</label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="AVAILABLE"
                  checked={formData.status === 'AVAILABLE'}
                  onChange={handleChange}
                  className="w-4 h-4 text-emerald-600 border-zinc-300 focus:ring-emerald-600"
                />
                <span className="text-[10.4px] font-medium text-zinc-700">Available</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="RESERVED"
                  checked={formData.status === 'RESERVED'}
                  onChange={handleChange}
                  className="w-4 h-4 text-amber-600 border-zinc-300 focus:ring-amber-600"
                />
                <span className="text-[10.4px] font-medium text-zinc-700">Reserved</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="SOLD"
                  checked={formData.status === 'SOLD'}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-zinc-300 focus:ring-zinc-900/10"
                />
                <span className="text-[10.4px] font-medium text-zinc-700">Sold</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="DEFECTIVE"
                  checked={formData.status === 'DEFECTIVE'}
                  onChange={handleChange}
                  className="w-4 h-4 text-rose-600 border-zinc-300 focus:ring-rose-600"
                />
                <span className="text-[10.4px] font-medium text-zinc-700">Defective</span>
              </label>
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
          {initialData ? 'Update Serial' : 'Create Serial'}
        </button>
      </div>
    </form>
  );
}
