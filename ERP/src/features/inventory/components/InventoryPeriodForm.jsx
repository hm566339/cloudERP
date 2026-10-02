import React, { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';

export default function InventoryPeriodForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading 
}) {
  const [formData, setFormData] = useState({
    periodName: initialData?.periodName || '',
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    status: initialData?.status || 'Open',
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
    if (!formData.periodName.trim()) newErrors.periodName = 'Period name is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    
    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
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
        
        {/* Period Name */}
        <div>
          <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
            Period Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="periodName"
            value={formData.periodName}
            onChange={handleChange}
            placeholder="e.g. Q1 2026, March 2026"
            className={`w-full h-9 px-3 rounded-md border text-[10.4px] bg-white transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
              errors.periodName ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
            }`}
            autoFocus
          />
          {errors.periodName && (
            <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
              <AlertCircle size={12} /> {errors.periodName}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Start Date */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
              Start Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className={`w-full h-9 px-3 rounded-md border text-[10.4px] bg-white transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                errors.startDate ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
              }`}
            />
            {errors.startDate && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.startDate}
              </p>
            )}
          </div>

          {/* End Date */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
              End Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className={`w-full h-9 px-3 rounded-md border text-[10.4px] bg-white transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                errors.endDate ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
              }`}
            />
            {errors.endDate && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.endDate}
              </p>
            )}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full h-9 px-3 rounded-md border border-zinc-200 text-[10.4px] bg-white transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
          </select>
          <p className="text-[8.8px] text-zinc-500 mt-1">
            Closing a period prevents any new inventory transactions for those dates.
          </p>
        </div>

        {/* Closed At/By (Read Only) */}
        {initialData?.closedAt && (
          <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100 space-y-2 mt-4">
            <h4 className="text-[8.8px] font-bold text-zinc-600 uppercase tracking-wider">System Information</h4>
            <div className="grid grid-cols-2 gap-2 text-[9.6px]">
              <div>
                <span className="text-zinc-500 block mb-0.5">Closed At</span>
                <span className="font-medium text-zinc-800">{new Date(initialData.closedAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-zinc-500 block mb-0.5">Closed By (User ID)</span>
                <span className="font-mono text-zinc-600">{initialData.closedBy || 'System'}</span>
              </div>
            </div>
          </div>
        )}

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
          {initialData ? 'Update Period' : 'Create Period'}
        </button>
      </div>
    </form>
  );
}
