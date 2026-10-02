import React from 'react';
import { 
  X, Tag, CalendarDays, Coins, Info, CheckCircle2, 
  AlertCircle, Edit2, Layers, Clock, ShieldCheck 
} from 'lucide-react';

export default function ViewProductPriceModal({
  price,
  product,
  isOpen,
  onClose,
  onEdit,
}) {
  if (!isOpen || !price) return null;

  const formatDisplayDate = (dateStr, fallback = 'Indefinite') => {
    if (!dateStr) return fallback;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return fallback;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      return fallback;
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleString();
    } catch (e) {
      return '-';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-zinc-200">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-200 bg-zinc-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-sm">
              <Tag size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                Product Price Details
              </h2>
              <p className="text-[11px] text-zinc-500 font-mono">
                ID: {price.id}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white">
          
          {/* Top Overview Box */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-zinc-50 to-zinc-100/50 border border-zinc-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[9.6px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                Product
              </span>
              <h3 className="text-base font-bold text-zinc-900 leading-tight">
                {product?.productName || 'Product Name Not Available'}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1 font-mono text-[11px] text-zinc-600">
                {product?.sku && (
                  <span className="bg-white px-2 py-0.5 rounded border border-zinc-200 text-zinc-700">
                    SKU: {product.sku}
                  </span>
                )}
                {product?.productCode && (
                  <span className="bg-white px-2 py-0.5 rounded border border-zinc-200 text-zinc-700">
                    Code: {product.productCode}
                  </span>
                )}
              </div>
            </div>

            <div className="sm:text-right shrink-0">
              <span className="text-[9.6px] font-bold text-zinc-500 uppercase tracking-wider block mb-0.5">
                Rate & Currency
              </span>
              <div className="text-xl font-black text-zinc-900">
                {price.currencyCode || 'INR'} {Number(price.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 bg-zinc-200 text-zinc-800 rounded">
                {price.priceType}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Status */}
            <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/30">
              <span className="text-[9.6px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                Status
              </span>
              <div className="flex items-center gap-2 mt-1">
                {price.status === 'ACTIVE' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 size={13} /> ACTIVE
                  </span>
                ) : price.status === 'INACTIVE' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-rose-100 text-rose-800">
                    <AlertCircle size={13} /> INACTIVE
                  </span>
                ) : price.status === 'DRAFT' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-blue-100 text-blue-800">
                    <Clock size={13} /> DRAFT
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-zinc-100 text-zinc-700">
                    {price.status}
                  </span>
                )}
              </div>
            </div>

            {/* Constraints */}
            <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/30">
              <span className="text-[9.6px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                Quantity Constraints
              </span>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800 mt-1">
                <Info size={15} className="text-zinc-400" />
                <span>Min Quantity:</span>
                <span className="font-bold text-zinc-900">{price.minQuantity !== undefined ? Number(price.minQuantity) : 1}</span>
                {product?.baseUomCode && (
                  <span className="text-zinc-500 font-normal text-xs">({product.baseUomCode})</span>
                )}
              </div>
            </div>

            {/* Effective From */}
            <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/30">
              <span className="text-[9.6px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                Effective From
              </span>
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800 mt-1">
                <CalendarDays size={16} className="text-emerald-600" />
                <span>{formatDisplayDate(price.effectiveFrom, 'Not set')}</span>
              </div>
            </div>

            {/* Effective To */}
            <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/30">
              <span className="text-[9.6px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                Effective To (Validity End)
              </span>
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800 mt-1">
                <CalendarDays size={16} className={price.effectiveTo ? "text-rose-500" : "text-zinc-400"} />
                <span className={price.effectiveTo ? "text-zinc-800" : "text-zinc-500 italic"}>
                  {formatDisplayDate(price.effectiveTo, 'Indefinite')}
                </span>
              </div>
            </div>

          </div>

          {/* Audit & Technical Information */}
          <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200/80 space-y-2">
            <span className="text-[9.6px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">
              System References
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-zinc-400 font-medium">Product UUID:</span>
                <p className="font-mono text-zinc-700 text-[11px] truncate" title={price.productId}>
                  {price.productId || '-'}
                </p>
              </div>
              <div>
                <span className="text-zinc-400 font-medium">Price Record ID:</span>
                <p className="font-mono text-zinc-700 text-[11px] truncate" title={price.id}>
                  {price.id || '-'}
                </p>
              </div>
              {price.createdAt && (
                <div>
                  <span className="text-zinc-400 font-medium">Created At:</span>
                  <p className="text-zinc-700 text-[11px]">
                    {formatDateTime(price.createdAt)}
                  </p>
                </div>
              )}
              {price.updatedAt && (
                <div>
                  <span className="text-zinc-400 font-medium">Last Updated:</span>
                  <p className="text-zinc-700 text-[11px]">
                    {formatDateTime(price.updatedAt)}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-zinc-200 bg-zinc-50/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[11px] font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
          >
            Close
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(price);
              }}
              className="px-4 py-2 text-[11px] font-semibold text-white bg-zinc-900 border border-transparent rounded-md hover:bg-zinc-800 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Edit2 size={14} />
              Edit Price
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
