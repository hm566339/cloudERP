import React, { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';

export default function UnitOfMeasureForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading 
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    decimalPlaces: initialData?.decimalPlaces !== undefined ? initialData.decimalPlaces : 0,
    isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (formData.decimalPlaces < 0 || formData.decimalPlaces > 6) {
      newErrors.decimalPlaces = 'Decimal places must be between 0 and 6';
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
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {/* Name Field */}
        <div>
          <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
            Unit Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Kilograms, Pieces"
            className={`w-full h-9 px-3 rounded-md border text-[10.4px] bg-white transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
              errors.name ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
            }`}
            autoFocus
          />
          {errors.name && (
            <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
              <AlertCircle size={12} /> {errors.name}
            </p>
          )}
        </div>

        {/* Decimal Places Field */}
        <div>
          <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
            Decimal Places <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            name="decimalPlaces"
            value={formData.decimalPlaces}
            onChange={handleChange}
            min={0}
            max={6}
            className={`w-full h-9 px-3 rounded-md border text-[10.4px] bg-white transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
              errors.decimalPlaces ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
            }`}
          />
          <p className="text-[8.8px] text-zinc-500 mt-1">Number of decimal places allowed (e.g. 2 for 1.50 Kg).</p>
          {errors.decimalPlaces && (
            <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
              <AlertCircle size={12} /> {errors.decimalPlaces}
            </p>
          )}
        </div>

        {/* Status Field */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer mt-4">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-4 h-4 rounded border-zinc-300 text-primary focus:ring-primary/30"
            />
            <span className="text-[10.4px] font-semibold text-zinc-700">Active</span>
          </label>
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
          {initialData ? 'Update UOM' : 'Create UOM'}
        </button>
      </div>
    </form>
  );
}
