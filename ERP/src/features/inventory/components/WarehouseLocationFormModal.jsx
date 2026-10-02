import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import CustomSelect from '../../../components/common/CustomSelect';
import { useWarehouseLocationList } from '../../../api/inventory/hooks/useWarehouseLocation';

const LOCATION_TYPES = [
  { value: 'ZONE', label: 'Zone' },
  { value: 'RACK', label: 'Rack' },
  { value: 'SHELF', label: 'Shelf' },
  { value: 'BIN', label: 'Bin' },
  { value: 'RECEIVING', label: 'Receiving' },
  { value: 'PICKING', label: 'Picking' },
  { value: 'PACKING', label: 'Packing' },
  { value: 'DISPATCH', label: 'Dispatch' },
  { value: 'QUARANTINE', label: 'Quarantine' },
  { value: 'STAGE', label: 'Stage' },
  { value: 'VIRTUAL', label: 'Virtual' }
];

export default function WarehouseLocationFormModal({ isOpen, onClose, onSubmit, warehouse }) {
  const [formData, setFormData] = useState({
    locationName: '',
    locationType: '',
    parentLocationId: '',
    isActive: true
  });

  const { locations, isLoading: isLoadingLocations } = useWarehouseLocationList(
    { warehouseId: warehouse?.id },
    { size: 100, sort: ['locationName,asc'] },
    { skip: !isOpen || !warehouse?.id }
  );

  useEffect(() => {
    if (isOpen) {
      setFormData({
        locationName: '',
        locationType: '',
        parentLocationId: '',
        isActive: true
      });
    }
  }, [isOpen]);

  if (!isOpen || !warehouse) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      warehouseId: warehouse.id,
      locationName: formData.locationName,
      locationType: formData.locationType,
      parentLocationId: formData.parentLocationId || null,
      isActive: formData.isActive
    });
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-md shadow-2xl flex flex-col overflow-hidden animate-slide-up border border-zinc-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3 border-b border-zinc-200 bg-zinc-50/80 shrink-0">
          <h2 className="text-base font-bold text-zinc-900 tracking-tight">
            Add New Location
          </h2>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors active:scale-95"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 bg-white">
          <form id="location-sub-form" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Context */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-md p-3 mb-4 flex flex-col gap-1">
              <p className="text-[8.8px] font-bold text-blue-600 uppercase tracking-wider">Warehouse</p>
              <p className="text-[10.4px] font-semibold text-zinc-900">{warehouse.warehouseName}</p>
            </div>

            <div className="space-y-1">
              <label className="text-[9.6px] font-semibold text-zinc-700">Location Name <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="locationName"
                className="w-full h-8 px-3 bg-zinc-50 border border-zinc-200 rounded-md text-[10.4px] font-medium text-zinc-900 focus:bg-white focus:border-zinc-900 focus:ring-0 outline-none transition-all placeholder:text-zinc-400"
                value={formData.locationName}
                onChange={handleChange}
                placeholder="e.g., Zone A, Rack 1"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9.6px] font-semibold text-zinc-700">Location Type <span className="text-red-500">*</span></label>
              <CustomSelect
                name="locationType"
                value={formData.locationType}
                onChange={handleChange}
                className="w-full h-8 px-3 bg-zinc-50 border border-zinc-200 rounded-md text-[10.4px] font-medium text-zinc-900 focus:bg-white focus:border-zinc-900 focus:ring-0 outline-none transition-all"
                required
              >
                <option value="" disabled>Select Type</option>
                {LOCATION_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </CustomSelect>
            </div>

            <div className="space-y-1">
              <label className="text-[9.6px] font-semibold text-zinc-700">Parent Location (Optional)</label>
              <CustomSelect
                name="parentLocationId"
                value={formData.parentLocationId}
                onChange={handleChange}
                className="w-full h-8 px-3 bg-zinc-50 border border-zinc-200 rounded-md text-[10.4px] font-medium text-zinc-900 focus:bg-white focus:border-zinc-900 focus:ring-0 outline-none transition-all"
                disabled={isLoadingLocations}
              >
                <option value="">None (Top-Level Location)</option>
                {locations?.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.locationName} ({loc.locationType})
                  </option>
                ))}
              </CustomSelect>
              {isLoadingLocations && <p className="text-[8px] text-zinc-500 mt-1">Loading locations...</p>}
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center w-4 h-4">
                  <input
                    type="checkbox"
                    name="isActive"
                    className="peer appearance-none w-4 h-4 border border-zinc-300 rounded bg-white checked:bg-zinc-900 checked:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 transition-all cursor-pointer"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />
                  <svg className="absolute w-2.5 h-2.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white transition-opacity" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-[10.4px] font-medium text-zinc-700 group-hover:text-zinc-900 transition-colors select-none">
                  Active Status
                </span>
              </label>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-zinc-50/80 border-t border-zinc-200 shrink-0 flex items-center justify-end gap-3 rounded-b-md">
          <button type="button" onClick={onClose} className="px-4 py-2 text-[10.4px] font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors">
            Cancel
          </button>
          <button type="submit" form="location-sub-form" className="px-6 py-2 text-[10.4px] font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-colors shadow-sm">
            Save Location
          </button>
        </div>

      </div>
    </div>
  );
}
