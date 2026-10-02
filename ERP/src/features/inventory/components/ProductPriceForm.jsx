import React, { useState, useMemo } from 'react';
import { Save, AlertCircle, Info, Tag } from 'lucide-react';
import { useProductList } from '../../../api/inventory/hooks/useProduct';

const PRICE_TYPES = [
  { value: 'PURCHASE', label: 'Purchase' },
  { value: 'SELLING', label: 'Selling' },
  { value: 'MRP', label: 'MRP' },
  { value: 'WHOLESALE', label: 'Wholesale' },
  { value: 'RETAIL', label: 'Retail' },
  { value: 'STANDARD', label: 'Standard' },
];

const COMMON_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'CAD', 'AUD', 'JPY'];

export default function ProductPriceForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading 
}) {
  const { products, isLoading: isLoadingProducts } = useProductList({}, { page: 0, size: 500 });

  // Format initial dates to YYYY-MM-DD for standard date input
  const parseDateForInput = (dateVal) => {
    if (!dateVal) return '';
    try {
      return dateVal.split('T')[0];
    } catch (e) {
      return '';
    }
  };

  const isHistorical = useMemo(() => {
    if (!initialData?.id || !initialData?.effectiveFrom) return false;
    try {
      const fromDate = new Date(initialData.effectiveFrom);
      return fromDate < new Date();
    } catch (e) {
      return false;
    }
  }, [initialData]);

  const [formData, setFormData] = useState({
    productId: initialData?.productId || '',
    priceType: initialData?.priceType || 'PURCHASE',
    price: initialData?.price !== undefined && initialData?.price !== null ? initialData.price : '',
    currencyCode: initialData?.currencyCode || 'INR',
    minQuantity: initialData?.minQuantity !== undefined && initialData?.minQuantity !== null ? initialData.minQuantity : 1,
    effectiveFrom: parseDateForInput(initialData?.effectiveFrom),
    effectiveTo: parseDateForInput(initialData?.effectiveTo),
    status: initialData?.status || 'ACTIVE',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let parsedValue = value;
    
    if (type === 'number') {
      parsedValue = value === '' ? '' : Number(value);
    }
    
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.productId || !String(formData.productId).trim()) {
      newErrors.productId = 'Product is required';
    }
    if (formData.price === '' || formData.price === null || isNaN(formData.price)) {
      newErrors.price = 'Price is required';
    } else if (Number(formData.price) < 0) {
      newErrors.price = 'Price cannot be negative';
    }
    if (formData.minQuantity === '' || formData.minQuantity === null || isNaN(formData.minQuantity)) {
      newErrors.minQuantity = 'Min Quantity is required';
    } else if (Number(formData.minQuantity) < 0) {
      newErrors.minQuantity = 'Min Quantity cannot be negative';
    }
    if (!formData.effectiveFrom) {
      newErrors.effectiveFrom = 'Effective From date is required';
    }
    if (!formData.currencyCode || !formData.currencyCode.trim()) {
      newErrors.currencyCode = 'Currency is required';
    }
    
    if (formData.effectiveFrom && formData.effectiveTo) {
      if (new Date(formData.effectiveFrom) > new Date(formData.effectiveTo)) {
        newErrors.effectiveTo = 'Effective To date must be on or after Effective From date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const payload = {
        productId: formData.productId,
        priceType: formData.priceType,
        price: Number(formData.price),
        currencyCode: formData.currencyCode.trim().toUpperCase(),
        minQuantity: Number(formData.minQuantity),
        effectiveFrom: formData.effectiveFrom,
        effectiveTo: formData.effectiveTo ? formData.effectiveTo : null,
        status: formData.status,
      };
      onSubmit(payload);
    }
  };

  // Find selected product info for display
  const selectedProduct = useMemo(() => {
    if (!formData.productId || !products) return null;
    return products.find(p => p.id === formData.productId) || null;
  }, [formData.productId, products]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 custom-scrollbar">
        
        {isHistorical && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2.5">
            <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Historical Price Record</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                This price became effective in the past. To comply with financial and audit rules, core rate fields are locked. You can modify the Validity End Date and Status.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Product Selector */}
          <div className="sm:col-span-2">
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
              Product <span className="text-rose-500">*</span>
            </label>
            <select
              name="productId"
              value={formData.productId}
              onChange={handleChange}
              disabled={isHistorical}
              className={`w-full h-9 px-3 rounded-md border text-[11px] bg-white transition-all outline-none focus:ring-2 focus:ring-zinc-900/10 ${
                errors.productId ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-zinc-400'
              } ${isHistorical ? 'bg-zinc-100 text-zinc-500 cursor-not-allowed' : 'cursor-pointer'}`}
              autoFocus={!initialData}
            >
              <option value="">{isLoadingProducts ? 'Loading products...' : '-- Select a Product --'}</option>
              {products?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.productName} {p.sku ? `(${p.sku})` : p.productCode ? `(${p.productCode})` : ''}
                </option>
              ))}
              {formData.productId && !products?.some(p => p.id === formData.productId) && (
                <option value={formData.productId}>
                  {formData.productId} (Current Product ID)
                </option>
              )}
            </select>
            {selectedProduct && (
              <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1 font-mono">
                <Tag size={11} className="text-zinc-400" />
                <span>SKU: {selectedProduct.sku || 'N/A'}</span>
                <span className="mx-1">•</span>
                <span>Base UOM: {selectedProduct.baseUomCode || 'Units'}</span>
              </p>
            )}
            {errors.productId && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.productId}
              </p>
            )}
          </div>

          {/* Price Type */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
              Price Type <span className="text-rose-500">*</span>
            </label>
            <select
              name="priceType"
              value={formData.priceType}
              onChange={handleChange}
              disabled={isHistorical}
              className={`w-full h-9 px-3 rounded-md border border-zinc-200 text-[11px] bg-white transition-all outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 ${
                isHistorical ? 'bg-zinc-100 text-zinc-500 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {PRICE_TYPES.map((pt) => (
                <option key={pt.value} value={pt.value}>
                  {pt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Currency Code */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
              Currency <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={COMMON_CURRENCIES.includes(formData.currencyCode) ? formData.currencyCode : 'OTHER'}
                onChange={(e) => {
                  if (e.target.value !== 'OTHER') {
                    setFormData(prev => ({ ...prev, currencyCode: e.target.value }));
                    if (errors.currencyCode) setErrors(prev => ({ ...prev, currencyCode: null }));
                  }
                }}
                disabled={isHistorical}
                className={`w-28 h-9 px-2.5 rounded-md border border-zinc-200 text-[11px] bg-white transition-all outline-none focus:border-zinc-400 ${
                  isHistorical ? 'bg-zinc-100 text-zinc-500 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                {COMMON_CURRENCIES.map((curr) => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
                {!COMMON_CURRENCIES.includes(formData.currencyCode) && (
                  <option value="OTHER">Other</option>
                )}
              </select>
              <input
                type="text"
                name="currencyCode"
                value={formData.currencyCode}
                onChange={handleChange}
                maxLength={10}
                disabled={isHistorical}
                placeholder="e.g. INR"
                className={`flex-1 h-9 px-3 rounded-md border uppercase text-[11px] bg-white transition-all outline-none focus:ring-2 focus:ring-zinc-900/10 ${
                  errors.currencyCode ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-zinc-400'
                } ${isHistorical ? 'bg-zinc-100 text-zinc-500 cursor-not-allowed' : ''}`}
              />
            </div>
            {errors.currencyCode && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.currencyCode}
              </p>
            )}
          </div>

          {/* Price */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
              Price Amount <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-[10px] font-semibold text-zinc-400">
                {formData.currencyCode || 'INR'}
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                name="price"
                value={formData.price}
                onChange={handleChange}
                disabled={isHistorical}
                placeholder="0.00"
                className={`w-full h-9 pl-12 pr-3 rounded-md border text-[11px] font-medium bg-white transition-all outline-none focus:ring-2 focus:ring-zinc-900/10 ${
                  errors.price ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-zinc-400'
                } ${isHistorical ? 'bg-zinc-100 text-zinc-500 cursor-not-allowed' : ''}`}
              />
            </div>
            {errors.price && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.price}
              </p>
            )}
          </div>

          {/* Min Quantity */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
              Minimum Quantity <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="1"
              min="0"
              name="minQuantity"
              value={formData.minQuantity}
              onChange={handleChange}
              disabled={isHistorical}
              placeholder="1"
              className={`w-full h-9 px-3 rounded-md border text-[11px] bg-white transition-all outline-none focus:ring-2 focus:ring-zinc-900/10 ${
                errors.minQuantity ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-zinc-400'
              } ${isHistorical ? 'bg-zinc-100 text-zinc-500 cursor-not-allowed' : ''}`}
            />
            {errors.minQuantity && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.minQuantity}
              </p>
            )}
          </div>

          {/* Effective From */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
              Effective From <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              name="effectiveFrom"
              value={formData.effectiveFrom}
              onChange={handleChange}
              disabled={isHistorical}
              className={`w-full h-9 px-3 rounded-md border text-[11px] bg-white transition-all outline-none focus:ring-2 focus:ring-zinc-900/10 ${
                errors.effectiveFrom ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-zinc-400'
              } ${isHistorical ? 'bg-zinc-100 text-zinc-500 cursor-not-allowed' : 'cursor-pointer'}`}
            />
            {errors.effectiveFrom && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.effectiveFrom}
              </p>
            )}
          </div>

          {/* Effective To */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[9.6px] font-bold text-zinc-700 block">
                Effective To
              </label>
              <span className="text-[9px] text-zinc-400 font-normal">Leave blank for Indefinite</span>
            </div>
            <input
              type="date"
              name="effectiveTo"
              value={formData.effectiveTo}
              onChange={handleChange}
              className={`w-full h-9 px-3 rounded-md border text-[11px] bg-white transition-all outline-none focus:ring-2 focus:ring-zinc-900/10 cursor-pointer ${
                errors.effectiveTo ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-zinc-400'
              }`}
            />
            {errors.effectiveTo && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.effectiveTo}
              </p>
            )}
          </div>

          {/* Status */}
          <div className="sm:col-span-2 border-t border-zinc-100 pt-4 mt-2">
            <label className="text-[9.6px] font-bold text-zinc-700 mb-2 block">Price Status</label>
            <div className="flex flex-wrap gap-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="ACTIVE"
                  checked={formData.status === 'ACTIVE'}
                  onChange={handleChange}
                  className="w-4 h-4 text-emerald-600 border-zinc-300 focus:ring-emerald-600 cursor-pointer"
                />
                <span className="text-[11px] font-medium text-zinc-700">Active</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="INACTIVE"
                  checked={formData.status === 'INACTIVE'}
                  onChange={handleChange}
                  className="w-4 h-4 text-rose-600 border-zinc-300 focus:ring-rose-600 cursor-pointer"
                />
                <span className="text-[11px] font-medium text-zinc-700">Inactive</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="DRAFT"
                  checked={formData.status === 'DRAFT'}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-zinc-300 focus:ring-blue-600 cursor-pointer"
                />
                <span className="text-[11px] font-medium text-zinc-700">Draft</span>
              </label>
            </div>
          </div>

        </div>
      </div>

      <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-zinc-100 bg-zinc-50/50 mt-auto shrink-0">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-[11px] font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 hover:text-zinc-900 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-[11px] font-semibold text-white bg-zinc-900 border border-transparent rounded-md hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={15} />
          )}
          {initialData ? 'Update Price' : 'Create Price'}
        </button>
      </div>
    </form>
  );
}
