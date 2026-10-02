import React from 'react';
import { Trash2 } from 'lucide-react';
import HsnSacSelect from '../../../components/common/HsnSacSelect';

export const SupplierQuotationLineItemRow = ({
  item,
  products,
  currency,
  onUpdate,
  onRemove,
  canRemove,
  gridTemplateColumns
}) => {
  return (
    <div className="grid gap-1 w-full bg-white hover:bg-zinc-50/50 min-w-0 border-b border-zinc-100 last:border-0 box-border" style={{ gridTemplateColumns: gridTemplateColumns || 'repeat(9, minmax(90px, 1fr))' }}>
      
      {/* Product Name / Code (Read Only from RFQ) */}
      <div className="p-1 pt-2 min-w-0 flex items-center">
        <span className="text-[10px] font-semibold text-zinc-800 truncate">
          {item.itemName || item.product?.name || 'Unknown Product'}
        </span>
      </div>

      {/* HSN/SAC */}
      <div className="p-1 pt-2 min-w-0">
        <HsnSacSelect
          value={item.hsnSacId || item.hsnSacCode}
          onChange={(e, selectedHsn) => {
            if (selectedHsn) {
              onUpdate(item.id, 'hsnSacData', selectedHsn);
              onUpdate(item.id, 'hsnSacId', selectedHsn.id);
              onUpdate(item.id, 'hsnSacCode', selectedHsn.code);
              onUpdate(item.id, 'cgstRate', selectedHsn.cgstRate || 0);
              onUpdate(item.id, 'sgstRate', selectedHsn.sgstRate || 0);
              onUpdate(item.id, 'igstRate', selectedHsn.igstRate || 0);
            }
          }}
          buttonClassName="w-full h-8 border border-zinc-200 rounded-md text-[8.8px] bg-white"
          placeholder="Select HSN"
          preSelectedCode={item.hsnSacCode}
        />
      </div>

      {/* Description */}
      <div className="p-1 pt-2 min-w-0">
        <input
          type="text"
          className="w-full h-8 px-2 border border-zinc-200 rounded-md text-[8.8px] bg-white"
          value={item.description || ''}
          onChange={e => onUpdate(item.id, 'description', e.target.value)}
          placeholder="Description"
        />
      </div>

      {/* QTY */}
      <div className="p-1 pt-2 min-w-0 flex items-center justify-end text-[10px] font-semibold text-zinc-700">
        {item.quantity} {item.unit || 'NOS'}
      </div>

      {/* Price */}
      <div className="p-1 pt-2 min-w-0">
        <input
          type="number"
          min="0"
          className="w-full h-8 px-2 border border-zinc-200 rounded-md text-right text-[8.8px] bg-white"
          value={item.unitPrice || 0}
          onChange={e => onUpdate(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
        />
      </div>

      {/* Discount */}
      <div className="p-1 pt-2 min-w-0">
        <input
          type="number"
          min="0"
          max="100"
          className="w-full h-8 px-2 border border-zinc-200 rounded-md text-right text-[8.8px] bg-white"
          value={item.discountPercentage || 0}
          onChange={e => onUpdate(item.id, 'discountPercentage', parseFloat(e.target.value) || 0)}
        />
      </div>

      {/* Tax */}
      <div className="p-1 pt-2 min-w-0 flex items-center justify-end text-[9px] text-zinc-600 truncate">
        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR' }).format(item.taxAmount || 0)}
      </div>

      {/* Total */}
      <div className="p-1 pt-2 min-w-0 flex items-center justify-end text-[10px] font-bold text-zinc-900 truncate">
        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR' }).format(item.totalAmount || 0)}
      </div>

      {/* Action */}
      <div className="p-1 pt-2 pb-2 min-w-0 flex items-center justify-center">
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          disabled={!canRemove}
          className={`p-1.5 rounded-md transition-colors ${!canRemove
              ? 'text-zinc-300 cursor-not-allowed'
              : 'text-zinc-400 hover:text-red-500 hover:bg-red-50'
            }`}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default SupplierQuotationLineItemRow;
