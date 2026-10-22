import React, { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';

export default function WarehouseLocationForm({ 
  initialData, 
  warehouseId,
  parentLocations = [], 
  onSubmit, 
  onCancel, 
  isLoading 
}) {
  const [formData, setFormData] = useState({
    locationName: initialData?.locationName || '',
    parentLocationId: initialData?.parentLocationId || '',
    isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.locationName.trim()) {
      newErrors.locationName = 'Location Name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        ...formData,
        warehouseId,
        parentLocationId: formData.parentLocationId || null,
      });
    }
  };

  // Filter out the current location and its descendants from parent options
  // to prevent circular references (only strictly filtering the exact item for now).
  const validParents = parentLocations.filter(loc => loc.id !== initialData?.id);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white dark:bg-card-dark">
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {/* Name Field */}
        <div>
          <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
            Location Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="locationName"
            value={formData.locationName}
            onChange={handleChange}
            placeholder="e.g. Zone A, Rack 1"
            className={`w-full h-9 px-3 rounded-md border dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
              errors.locationName ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
            }`}
            autoFocus
          />
          {errors.locationName && (
            <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
              <AlertCircle size={12} /> {errors.locationName}
            </p>
          )}
        </div>

        {/* Parent Location Field */}
        <div>
          <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Parent Location</label>
          <select
            name="parentLocationId"
            value={formData.parentLocationId}
            onChange={handleChange}
            className="w-full h-9 px-3 rounded-md border border-zinc-200 text-[10.4px] text-zinc-800 bg-white transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">No Parent (Root Location)</option>
            {validParents.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.locationName} {loc.locationCode ? `(${loc.locationCode})` : ''}
              </option>
            ))}
          </select>
          <p className="text-[8.8px] text-zinc-500 mt-1">Select a parent location to nest this location within it.</p>
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
          {initialData ? 'Update Location' : 'Create Location'}
        </button>
      </div>
    </form>
  );
}
