import React, { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';
import CustomSelect from '../../../components/common/CustomSelect';
import { WAREHOUSE_TYPES } from '../../../api/inventory';

export default function WarehouseFormModal({ isOpen, onClose, onSubmit, initialData = null }) {
  const [formData, setFormData] = useState({
    warehouseName: '',
    warehouseType: 'MAIN',
    status: 'ACTIVE',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: '',
    pinCode: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          warehouseName: initialData.warehouseName || '',
          warehouseType: initialData.warehouseType || 'MAIN',
          status: initialData.status || 'ACTIVE',
          addressLine1: initialData.addressLine1 || '',
          addressLine2: initialData.addressLine2 || '',
          city: initialData.city || '',
          state: initialData.state || '',
          country: initialData.country || '',
          pinCode: initialData.pinCode || '',
        });
      } else {
        setFormData({
          warehouseName: '',
          warehouseType: 'MAIN',
          status: 'ACTIVE',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          country: '',
          pinCode: '',
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (initialData?.id) {
      onSubmit({ id: initialData.id, ...formData });
    } else {
      onSubmit(formData);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-card-dark w-full max-w-4xl max-h-[90vh] rounded-md shadow-2xl flex flex-col overflow-hidden animate-slide-up border border-zinc-200 dark:border-border-dark">
        
        {/* Header - Sticky */}
        <div className="flex justify-between items-center px-5 py-3 border-b border-zinc-200 bg-zinc-50/80 shrink-0">
          <h2 className="text-base font-bold text-zinc-900 tracking-tight">
            {initialData ? 'Edit Warehouse' : 'Add New Warehouse'}
            {initialData && <span className="ml-2 text-xs text-zinc-500 font-mono font-medium">({initialData.warehouseCode})</span>}
          </h2>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors active:scale-95"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 bg-white dark:bg-card-dark">
          <form id="warehouse-form" onSubmit={handleSubmit} className="space-y-5">
            
            {/* Basic Information */}
            <div>
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2.5 pb-2 border-b border-zinc-100 dark:border-[#2A2F3D]">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3">
                <div className="space-y-1">
                  <label className="text-[9.6px] font-semibold text-zinc-700">Warehouse Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="warehouseName"
                    className="w-full h-8 px-3 bg-zinc-50 dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-md text-[10.4px] font-medium text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-card-dark focus:border-zinc-900 focus:ring-0 outline-none transition-all placeholder:text-zinc-400"
                    value={formData.warehouseName}
                    onChange={handleChange}
                    placeholder="e.g. Central Hub"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9.6px] font-semibold text-zinc-700">Warehouse Type <span className="text-red-500">*</span></label>
                  <select 
                    name="warehouseType"
                    className="w-full h-8 px-3 bg-zinc-50 dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-md text-[10.4px] font-medium text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-card-dark focus:border-zinc-900 focus:ring-0 outline-none transition-all"
                    value={formData.warehouseType}
                    onChange={handleChange}
                    required
                  >
                    {WAREHOUSE_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9.6px] font-semibold text-zinc-700">Status</label>
                  <select 
                    name="status"
                    className="w-full h-8 px-3 bg-zinc-50 dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-md text-[10.4px] font-medium text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-card-dark focus:border-zinc-900 focus:ring-0 outline-none transition-all"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Location Details */}
            <div>
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2.5 pb-2 border-b border-zinc-100 dark:border-[#2A2F3D]">Location Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[9.6px] font-semibold text-zinc-700">Address Line 1 <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="addressLine1"
                    className="w-full h-8 px-3 bg-zinc-50 dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-md text-[10.4px] font-medium text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-card-dark focus:border-zinc-900 focus:ring-0 outline-none transition-all placeholder:text-zinc-400"
                    value={formData.addressLine1}
                    onChange={handleChange}
                    placeholder="Street address, P.O. box, etc."
                    required
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[9.6px] font-semibold text-zinc-700">Address Line 2</label>
                  <input 
                    type="text" 
                    name="addressLine2"
                    className="w-full h-8 px-3 bg-zinc-50 dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-md text-[10.4px] font-medium text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-card-dark focus:border-zinc-900 focus:ring-0 outline-none transition-all placeholder:text-zinc-400"
                    value={formData.addressLine2}
                    onChange={handleChange}
                    placeholder="Apartment, suite, unit, building, floor, etc."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9.6px] font-semibold text-zinc-700">City <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="city"
                    className="w-full h-8 px-3 bg-zinc-50 dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-md text-[10.4px] font-medium text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-card-dark focus:border-zinc-900 focus:ring-0 outline-none transition-all"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9.6px] font-semibold text-zinc-700">State / Province <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="state"
                    className="w-full h-8 px-3 bg-zinc-50 dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-md text-[10.4px] font-medium text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-card-dark focus:border-zinc-900 focus:ring-0 outline-none transition-all"
                    value={formData.state}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9.6px] font-semibold text-zinc-700">Country <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="country"
                    className="w-full h-8 px-3 bg-zinc-50 dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-md text-[10.4px] font-medium text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-card-dark focus:border-zinc-900 focus:ring-0 outline-none transition-all"
                    value={formData.country}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9.6px] font-semibold text-zinc-700">PIN / Zip Code <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="pinCode"
                    className="w-full h-8 px-3 bg-zinc-50 dark:bg-surface-dark border border-zinc-200 dark:border-border-dark rounded-md text-[10.4px] font-medium text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-card-dark focus:border-zinc-900 focus:ring-0 outline-none transition-all"
                    value={formData.pinCode}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer - Sticky */}
        <div className="px-5 py-3 bg-zinc-50/80 border-t border-zinc-200 shrink-0 flex items-center justify-end gap-3 rounded-b-md">
          <button type="button" onClick={onClose} className="px-4 py-2 text-[10.4px] font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors">
            Cancel
          </button>
          <button type="submit" form="warehouse-form" className="px-6 py-2 text-[10.4px] font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-colors shadow-sm">
            {initialData ? 'Update Warehouse' : 'Save Warehouse'}
          </button>
        </div>

      </div>
    </div>
  );
}
