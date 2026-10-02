import React, { useState, useEffect } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import ComboBox from '../../../components/common/ComboBox';
import { useProductList } from '../../../api/inventory/hooks/useProduct';
import { useWarehouseList } from '../../../api/inventory/hooks/useWarehouse';
import { useWarehouseLocationList } from '../../../api/inventory/hooks/useWarehouseLocation';
import { useProductBatchList } from '../../../api/inventory/hooks/useProductBatch';

export default function InventoryStockForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading 
}) {
  const [formData, setFormData] = useState({
    productId: initialData?.productId || '',
    warehouseId: initialData?.warehouseId || '',
    locationId: initialData?.locationId || '',
    batchId: initialData?.batchId || '',
    quantity: initialData?.quantity || 0,
    reservedQuantity: initialData?.reservedQuantity || 0,
    availableQuantity: initialData?.availableQuantity || 0,
    averageCost: initialData?.averageCost || 0,
    stockValue: initialData?.stockValue || 0,
    uomId: initialData?.uomId || '',
  });

  const [errors, setErrors] = useState({});

  // Search states
  const [productSearch, setProductSearch] = useState('');
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [batchSearch, setBatchSearch] = useState('');

  // Debounced search states
  const [debouncedProductSearch, setDebouncedProductSearch] = useState('');
  const [debouncedWarehouseSearch, setDebouncedWarehouseSearch] = useState('');
  const [debouncedLocationSearch, setDebouncedLocationSearch] = useState('');
  const [debouncedBatchSearch, setDebouncedBatchSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedProductSearch(productSearch), 300);
    return () => clearTimeout(t);
  }, [productSearch]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedWarehouseSearch(warehouseSearch), 300);
    return () => clearTimeout(t);
  }, [warehouseSearch]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedLocationSearch(locationSearch), 300);
    return () => clearTimeout(t);
  }, [locationSearch]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedBatchSearch(batchSearch), 300);
    return () => clearTimeout(t);
  }, [batchSearch]);

  // API Queries
  const { products } = useProductList(
    { searchKey: debouncedProductSearch }, 
    { size: 20 }
  );

  const { warehouses } = useWarehouseList(
    { searchKey: debouncedWarehouseSearch }, 
    { size: 20 }
  );

  const { locations } = useWarehouseLocationList(
    { searchKey: debouncedLocationSearch, warehouseId: formData.warehouseId || undefined }, 
    { size: 20 }
  );

  const { batches } = useProductBatchList(
    { searchKey: debouncedBatchSearch, productId: formData.productId || undefined }, 
    { size: 20 }
  );

  // Auto-calculate availableQuantity and stockValue
  useEffect(() => {
    const qty = Number(formData.quantity) || 0;
    const reserved = Number(formData.reservedQuantity) || 0;
    const cost = Number(formData.averageCost) || 0;

    setFormData(prev => ({
      ...prev,
      availableQuantity: qty - reserved,
      stockValue: qty * cost
    }));
  }, [formData.quantity, formData.reservedQuantity, formData.averageCost]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    // Don't allow editing of calculated fields
    if (name === 'availableQuantity' || name === 'stockValue') return;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSelectChange = (name, value, option = null) => {
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'warehouseId') {
        next.locationId = ''; // Clear location if warehouse changes
      }
      if (name === 'productId' && option) {
        next.uomId = option.uomId; // Store uomId from selected product
      }
      return next;
    });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.productId?.trim()) newErrors.productId = 'Product is required';
    if (!formData.warehouseId?.trim()) newErrors.warehouseId = 'Warehouse is required';
    if (!formData.locationId?.trim()) newErrors.locationId = 'Location is required';
    
    if (formData.quantity <= 0) newErrors.quantity = 'Must be greater than 0';
    if (formData.reservedQuantity < 0) newErrors.reservedQuantity = 'Cannot be negative';
    if (formData.reservedQuantity > formData.quantity) newErrors.reservedQuantity = 'Cannot exceed physical quantity';
    if (formData.averageCost < 0) newErrors.averageCost = 'Cannot be negative';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        
        <div className="p-3 bg-amber-50 text-amber-800 rounded-lg border border-amber-100 text-[9.6px] mb-4">
          <p className="font-semibold mb-1 flex items-center gap-1.5"><AlertCircle size={14}/> Manual Adjustment Warning</p>
          <p>
            You are manually modifying the live stock ledger. This action bypasses standard inventory movements (GRN, Transfers) and should only be used for corrections or initial imports.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Product ID */}
          <div>
            <ComboBox
              label="Product"
              value={formData.productId}
              onChange={(val) => {
                const opt = products?.find(p => p.id === val);
                handleSelectChange('productId', val, opt ? { uomId: opt.baseUomId } : null);
              }}
              onSearchChange={setProductSearch}
              options={products?.map(p => ({
                value: p.id,
                label: p.productName,
                subLabel: p.productCode || p.sku,
                uomId: p.baseUomId
              }))}
              placeholder="Search product..."
              required={true}
              serverSideSearch={true}
              inputClassName={`w-full h-9 pl-8 pr-8 rounded-md border text-[10.4px] transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                initialData?.productId ? 'bg-zinc-100 text-zinc-500 border-zinc-200 pointer-events-none' : 'bg-white border-zinc-200 focus:border-primary'
              } ${errors.productId ? 'border-rose-300 focus:border-rose-500' : ''}`}
            />
            {errors.productId && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.productId}
              </p>
            )}
          </div>

          {/* Warehouse ID */}
          <div>
            <ComboBox
              label="Warehouse"
              value={formData.warehouseId}
              onChange={(val) => handleSelectChange('warehouseId', val)}
              onSearchChange={setWarehouseSearch}
              options={warehouses?.map(w => ({
                value: w.id,
                label: w.warehouseName,
                subLabel: w.warehouseCode
              }))}
              placeholder="Search warehouse..."
              required={true}
              serverSideSearch={true}
              inputClassName={`w-full h-9 pl-8 pr-8 rounded-md border text-[10.4px] transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                initialData?.id ? 'bg-zinc-100 text-zinc-500 border-zinc-200 pointer-events-none' : 'bg-white border-zinc-200 focus:border-primary'
              } ${errors.warehouseId ? 'border-rose-300 focus:border-rose-500' : ''}`}
            />
            {errors.warehouseId && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.warehouseId}
              </p>
            )}
          </div>

          {/* Location ID */}
          <div>
            <ComboBox
              label="Location"
              value={formData.locationId}
              onChange={(val) => handleSelectChange('locationId', val)}
              onSearchChange={setLocationSearch}
              options={locations?.map(l => ({
                value: l.id,
                label: l.locationName,
                subLabel: l.locationCode
              }))}
              placeholder="Search location..."
              serverSideSearch={true}
              inputClassName={`w-full h-9 pl-8 pr-8 rounded-md border border-zinc-200 text-[10.4px] transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                initialData?.id ? 'bg-zinc-100 text-zinc-500 pointer-events-none' : 'bg-white'
              }`}
            />
          </div>

          {/* Batch ID */}
          <div>
            <ComboBox
              label="Batch"
              value={formData.batchId}
              onChange={(val) => handleSelectChange('batchId', val)}
              onSearchChange={setBatchSearch}
              options={batches?.map(b => ({
                value: b.id,
                label: b.batchNumber,
                subLabel: `Expires: ${b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : 'N/A'}`
              }))}
              placeholder="Search batch..."
              serverSideSearch={true}
              inputClassName={`w-full h-9 pl-8 pr-8 rounded-md border border-zinc-200 text-[10.4px] transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                initialData?.id ? 'bg-zinc-100 text-zinc-500 pointer-events-none' : 'bg-white'
              }`}
            />
          </div>
        </div>

        <hr className="border-zinc-100" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Quantity */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Physical Quantity</label>
            <input
              type="number"
              step="any"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              className={`w-full h-9 px-3 rounded-md border text-[10.4px] bg-white transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                errors.quantity ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
              }`}
            />
            {errors.quantity && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.quantity}
              </p>
            )}
          </div>

          {/* Reserved Quantity */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Reserved Quantity</label>
            <input
              type="number"
              step="any"
              name="reservedQuantity"
              value={formData.reservedQuantity}
              onChange={handleChange}
              className={`w-full h-9 px-3 rounded-md border text-[10.4px] bg-white transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                errors.reservedQuantity ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
              }`}
            />
            {errors.reservedQuantity && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.reservedQuantity}
              </p>
            )}
          </div>

          {/* Available Quantity */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Available Quantity</label>
            <input
              type="number"
              step="any"
              name="availableQuantity"
              value={formData.availableQuantity}
              readOnly
              className="w-full h-9 px-3 rounded-md border border-zinc-200 text-[10.4px] bg-zinc-100 text-zinc-500 cursor-not-allowed outline-none"
            />
          </div>
        </div>

        <hr className="border-zinc-100" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Average Cost */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Average Cost</label>
            <input
              type="number"
              step="any"
              name="averageCost"
              value={formData.averageCost}
              onChange={handleChange}
              className={`w-full h-9 px-3 rounded-md border text-[10.4px] bg-white transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                errors.averageCost ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
              }`}
            />
            {errors.averageCost && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.averageCost}
              </p>
            )}
          </div>

          {/* Stock Value */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Total Stock Value</label>
            <input
              type="number"
              step="any"
              name="stockValue"
              value={formData.stockValue}
              readOnly
              className="w-full h-9 px-3 rounded-md border border-zinc-200 text-[10.4px] bg-zinc-100 text-zinc-500 cursor-not-allowed outline-none"
            />
          </div>
        </div>

      </div>

      <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-zinc-100 bg-zinc-50/50 mt-auto shrink-0">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-[10.4px] font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 hover:text-zinc-900 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-[10.4px] font-semibold text-white bg-zinc-900 border border-transparent rounded-md hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {initialData ? 'Update Balances' : 'Initialize Stock'}
        </button>
      </div>
    </form>
  );
}
