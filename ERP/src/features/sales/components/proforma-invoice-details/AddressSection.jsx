import React from 'react';

export default function AddressSection({ billingAddress, deliveryAddress }) {
  if (!billingAddress && !deliveryAddress) return null;
  
  const parseAddress = (snapshot) => {
    if (!snapshot) return 'Not provided.';
    try {
      // If it's a JSON string
      const parsed = JSON.parse(snapshot);
      if (typeof parsed === 'object' && parsed !== null) {
        // Construct a clean string if it's an object with known keys like street, city, state, zip
        const parts = [
          parsed.street1,
          parsed.street2,
          parsed.city,
          parsed.state,
          parsed.country,
          parsed.zipCode || parsed.pincode
        ].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : snapshot;
      }
      return snapshot;
    } catch {
      // Not JSON, just return the string
      return snapshot;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden mb-6">
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Billing Address</span>
          <p className="text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed bg-zinc-50 p-4 rounded-lg border border-zinc-100 min-h-[64px]">
            {parseAddress(billingAddress)}
          </p>
        </div>
        <div>
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Delivery Address</span>
          <p className="text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed bg-zinc-50 p-4 rounded-lg border border-zinc-100 min-h-[64px]">
            {parseAddress(deliveryAddress)}
          </p>
        </div>
      </div>
    </div>
  );
}
