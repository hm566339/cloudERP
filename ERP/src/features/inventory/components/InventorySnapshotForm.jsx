import React, { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';

export default function InventorySnapshotForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading 
}) {
  const [formData, setFormData] = useState({
    snapshotScope: initialData?.snapshotScope || '',
    snapshotDate: initialData?.snapshotDate ? initialData.snapshotDate.split('T')[0] : '',
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
    if (!formData.snapshotScope.trim()) newErrors.snapshotScope = 'Snapshot scope is required';
    if (!formData.snapshotDate) newErrors.snapshotDate = 'Snapshot date is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        ...formData,
        // Ensure date is ISO string as per swagger spec
        snapshotDate: new Date(formData.snapshotDate).toISOString()
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        
        <div className="p-3 bg-blue-50 text-blue-800 rounded-lg border border-blue-100 text-[9.6px] mb-4">
          <p className="font-semibold mb-1">Creating a Snapshot</p>
          <p>
            When you create a snapshot, the system captures current stock levels, reservations, and average costs across all warehouses for the specified date and scope.
          </p>
        </div>

        {/* Snapshot Scope */}
        <div>
          <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
            Snapshot Scope <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="snapshotScope"
            value={formData.snapshotScope}
            onChange={handleChange}
            placeholder="e.g. EOM_MARCH_2026, AUDIT_Q1"
            className={`w-full h-9 px-3 rounded-md border text-[10.4px] bg-white transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
              errors.snapshotScope ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
            }`}
            autoFocus
          />
          {errors.snapshotScope && (
            <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
              <AlertCircle size={12} /> {errors.snapshotScope}
            </p>
          )}
        </div>

        {/* Snapshot Date */}
        <div>
          <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
            Snapshot Date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            name="snapshotDate"
            value={formData.snapshotDate}
            onChange={handleChange}
            className={`w-full h-9 px-3 rounded-md border text-[10.4px] bg-white transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
              errors.snapshotDate ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
            }`}
          />
          {errors.snapshotDate && (
            <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
              <AlertCircle size={12} /> {errors.snapshotDate}
            </p>
          )}
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
          {initialData ? 'Update Snapshot Metadata' : 'Generate Snapshot'}
        </button>
      </div>
    </form>
  );
}
