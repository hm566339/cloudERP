import React from 'react';
import { MapPin } from 'lucide-react';

export default function AddressSection({ addresses }) {
  if (!addresses || (!addresses.billing && !addresses.delivery)) return null;

  const parseAddress = (addressStr) => {
    if (!addressStr) return null;
    try {
      const parsed = JSON.parse(addressStr);
      if (typeof parsed === 'object') return parsed;
    } catch (e) {
      // Return as simple string if not valid JSON
    }
    return { addressLine1: addressStr };
  };

  const renderAddressObj = (obj) => {
    if (!obj) return <p className="text-sm text-zinc-500 italic">Not provided</p>;
    return (
      <div className="text-sm text-zinc-800 space-y-0.5">
        {obj.attention && <p className="font-semibold text-zinc-900">{obj.attention}</p>}
        {obj.addressLine1 && <p>{obj.addressLine1}</p>}
        {obj.addressLine2 && <p>{obj.addressLine2}</p>}
        <p>
          {[obj.city, obj.state, obj.zipCode].filter(Boolean).join(', ')}
        </p>
        {obj.country && <p>{obj.country}</p>}
        {obj.phone && <p className="pt-1 text-zinc-600">Tel: {obj.phone}</p>}
        {obj.email && <p className="text-zinc-600">Email: {obj.email}</p>}
      </div>
    );
  };

  const billing = parseAddress(addresses.billing);
  const delivery = parseAddress(addresses.delivery);

  return (
    <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm h-full">
      <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2 mb-4 pb-3 border-b border-zinc-100">
        <MapPin size={16} className="text-indigo-500" />
        Addresses
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Billing Address</h3>
          <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
            {renderAddressObj(billing)}
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Delivery Address</h3>
          <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
            {renderAddressObj(delivery)}
          </div>
        </div>
      </div>
    </div>
  );
}
