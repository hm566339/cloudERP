import React from 'react';
import { X, MapPin } from 'lucide-react';
import { useWarehouseLocationDetail } from '../../../api/inventory/hooks/useWarehouseLocation';

export default function WarehouseLocationDetailsModal({ isOpen, onClose, locationId }) {
  const { location, isLoading } = useWarehouseLocationDetail(locationId, {
    enabled: isOpen && !!locationId
  });

  if (!isOpen || !locationId) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-md shadow-2xl flex flex-col overflow-hidden animate-slide-up border border-zinc-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3 border-b border-zinc-200 bg-zinc-50/80 shrink-0">
          <h2 className="text-base font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <MapPin size={16} className="text-zinc-500" /> Location Details
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
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-white">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex justify-between border-b border-zinc-100 pb-3">
                  <div className="h-3 bg-zinc-200 rounded w-24"></div>
                  <div className="h-3 bg-zinc-200 rounded w-32"></div>
                </div>
              ))}
            </div>
          ) : location ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-zinc-100">
                <div>
                  <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Location Code</p>
                  <p className="text-sm font-semibold text-zinc-900">{location.locationCode}</p>
                </div>
                <div>
                  <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Status</p>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${
                    location.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {location.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-zinc-100">
                <div>
                  <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Location Name</p>
                  <p className="text-sm font-semibold text-zinc-900">{location.locationName}</p>
                </div>
                <div>
                  <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Type</p>
                  <span className="inline-flex px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                    {location.locationType}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 pb-4 border-b border-zinc-100">
                <div>
                  <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Warehouse</p>
                  <p className="text-sm font-medium text-zinc-800">{location.warehouseName || location.warehouseId}</p>
                </div>
              </div>

              {location.parentLocationId && (
                <div className="grid grid-cols-1 gap-4 pb-4 border-b border-zinc-100">
                  <div>
                    <p className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Parent Location</p>
                    <p className="text-sm font-medium text-zinc-800">{location.parentLocationName || location.parentLocationId}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-center text-zinc-500 py-4">Location not found.</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-zinc-50/80 border-t border-zinc-200 shrink-0 flex items-center justify-end">
          <button type="button" onClick={onClose} className="px-5 py-2 text-[10.4px] font-bold text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-md transition-colors shadow-sm">
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
