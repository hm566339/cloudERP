import React from 'react';
import { FileText, CreditCard, Truck } from 'lucide-react';

export default function CommercialTerms({ commercial }) {
  if (!commercial) return null;

  const hasData = commercial.paymentTerms || commercial.deliveryTerms || commercial.notes;
  if (!hasData) return null;

  return (
    <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm h-full flex flex-col">
      <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2 mb-4 pb-3 border-b border-zinc-100">
        <FileText size={16} className="text-indigo-500" />
        Commercial Terms & Notes
      </h2>
      
      <div className="space-y-4 flex-1">
        {commercial.paymentTerms && (
          <div>
            <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-1.5">
              <CreditCard size={12} />
              Payment Terms
            </p>
            <p className="text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed">{commercial.paymentTerms}</p>
          </div>
        )}
        
        {commercial.deliveryTerms && (
          <div>
            <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-1.5">
              <Truck size={12} />
              Delivery Terms
            </p>
            <p className="text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed">{commercial.deliveryTerms}</p>
          </div>
        )}
        
        {commercial.notes && (
          <div>
            <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-1.5">
              <FileText size={12} />
              Notes / Remarks
            </p>
            <p className="text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed bg-zinc-50 p-3 rounded-lg border border-zinc-100">{commercial.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
