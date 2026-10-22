import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function WarehouseLocationConfirmModal({ isOpen, onClose, onConfirm, warehouse }) {
  const [formData, setFormData] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: '',
    pinCode: '',
  });

  useEffect(() => {
    if (isOpen && warehouse) {
      setFormData({
        addressLine1: warehouse.addressLine1 || '',
        addressLine2: warehouse.addressLine2 || '',
        city: warehouse.city || '',
        state: warehouse.state || '',
        country: warehouse.country || '',
        pinCode: warehouse.pinCode || '',
      });
    }
  }, [isOpen, warehouse]);

  if (!isOpen || !warehouse) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(formData);
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-card-dark w-full max-w-4xl max-h-[90vh] rounded-md shadow-2xl flex flex-col overflow-hidden animate-slide-up border border-zinc-200 dark:border-border-dark">
        
        {/* Header - Sticky */}
        <div className="flex justify-between items-center px-5 py-3 border-b border-zinc-200 bg-zinc-50/80 shrink-0">
          <h2 className="text-base font-bold text-zinc-900 tracking-tight">
            Confirm Warehouse Location
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
          <form id="location-confirm-form" onSubmit={handleSubmit} className="space-y-5">
            
            {/* Warehouse Summary */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Warehouse Name</p>
                <p className="text-[11.2px] font-semibold text-zinc-900">{warehouse.warehouseName}</p>
              </div>
              <div>
                <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Type</p>
                <p className="text-[10.4px] font-medium text-zinc-700">{warehouse.warehouseType}</p>
              </div>
              <div>
                <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Status</p>
                <span className={`px-2 py-0.5 rounded text-[8.8px] font-bold ${warehouse.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {warehouse.status}
                </span>
              </div>
            </div>

            {/* Location Details */}
            <div>
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2.5 pb-2 border-b border-zinc-100 dark:border-[#2A2F3D]">Location Details</h3>
              <p className="text-[9.6px] text-zinc-500 mb-4">Please confirm or edit the address before finalizing the warehouse location creation.</p>
              
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
          <button type="submit" form="location-confirm-form" className="px-6 py-2 text-[10.4px] font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-colors shadow-sm">
            Confirm Location
          </button>
        </div>

      </div>
    </div>
  );
}
