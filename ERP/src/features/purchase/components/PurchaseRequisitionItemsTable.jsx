import React from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import CustomSelect from '../../../components/common/CustomSelect';

export default function PurchaseRequisitionItemsTable({
  items,
  errors,
  addItem,
  removeItem,
  handleItemChange,
  handleProductSelect,
  handleProductSearch,
  setProductSearchTerm,
  productSearchResults,
  initialProducts,
  isSearchingProducts,
  handleOpenCreateProduct,
  handleUomSearch,
  isSearchingUoms,
  uomSearchResults,
  handleWarehouseSearch,
  isSearchingWarehouses,
  warehouseSearchResults,
  handleLocationSearch,
  isSearchingLocations,
  locationSearchResults,
  setLocationSearchResults,
  locationsByWarehouseIdRef,
  fetchLocationsForWarehouse,
}) {
  const colTemplate = 'grid-cols-[3%_13%_11%_8%_8%_8%_11%_10%_10%_12%_6%]';
  const field = (hasErr = false) =>
    `input-field w-full h-8 text-[8.8px] text-zinc-700 dark:text-zinc-200 bg-white dark:bg-surface-dark ${hasErr ? 'border-rose-300' : ''}`;
  const errText = 'text-[7.2px] text-rose-600 mt-0.5 font-medium';

  return (
    <>
      {errors.items && (
        <div className="p-3 bg-rose-50 border-b border-rose-200 flex items-center gap-2 text-rose-700 text-xs font-medium">
          <AlertCircle size={14} />
          {errors.items}
        </div>
      )}

      {/* 1. Requested Items Section Header */}
      <div className="px-4 py-2.5 bg-zinc-50/80 border-b border-zinc-200 flex justify-between items-center flex-none sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Requested Items</h3>
          <span className="text-[8.8px] font-medium text-zinc-500 dark:text-zinc-400 bg-white dark:bg-surface-dark px-2 py-0.5 rounded-full border border-zinc-200 dark:border-border-dark">
            {items.length} {items.length === 1 ? 'item' : 'items'} requested
          </span>
        </div>
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-md shadow-xs hover:bg-primary/90 transition-colors"
        >
          <Plus size={13} strokeWidth={2.5} />
          <span>Add Item</span>
        </button>
      </div>

      {/* 2. Requested Items Table (full right-column width, horizontally scrollable) */}
      <div className="overflow-x-auto">
        <div className="min-w-[1040px]">
          {/* Table Header */}
          <div className="w-full text-left bg-zinc-100 text-zinc-600 border-b border-zinc-200 flex-none pr-1">
            <div className={`grid ${colTemplate} w-full min-w-0`}>
              <div className="p-1.5 font-semibold truncate text-[11px] text-center">#</div>
              <div className="p-1.5 font-semibold truncate text-[11px]">Item Name *</div>
              <div className="p-1.5 font-semibold truncate text-[11px]">Description</div>
              <div className="p-1.5 font-semibold truncate text-[11px] text-center">Item Type</div>
              <div className="p-1.5 font-semibold truncate text-[11px] text-center">Quantity *</div>
              <div className="p-1.5 font-semibold truncate text-[11px] text-center">Unit *</div>
              <div className="p-1.5 font-semibold truncate text-[11px] text-center">Required Date *</div>
              <div className="p-1.5 font-semibold truncate text-[11px]">Warehouse</div>
              <div className="p-1.5 font-semibold truncate text-[11px]">Location</div>
              <div className="p-1.5 font-semibold truncate text-[11px]">Remarks</div>
              <div className="p-1.5 text-center flex items-center justify-center font-semibold text-[11px]">
                Action
              </div>
            </div>
          </div>

          {/* Table Body */}
          <div className="flex flex-col divide-y divide-zinc-100">
            {items.map((item, idx) => (
              <div key={idx} className={`grid ${colTemplate} w-full bg-white dark:bg-card-dark hover:bg-zinc-50/50 dark:hover:bg-hover-dark/40 min-w-0 border-b border-zinc-100 dark:border-[#2A2F3D] last:border-0 box-border`}>
                {/* # */}
                <div className="p-1 pt-2 pb-2 min-w-0 flex items-center justify-center text-[8.8px] text-zinc-400 font-medium">
                  {idx + 1}
                </div>
                {/* ITEM NAME */}
                <div className="p-1 pt-2 min-w-0">
                  <CustomSelect
                    className="input-field w-full h-8 text-[8.8px] text-zinc-700 dark:text-zinc-200 bg-white dark:bg-surface-dark"
                    value={item.productId || item.itemId || ''}
                    onChange={(e) => handleProductSelect(idx, e.target.value)}
                    searchable={true}
                    comboInput={true}
                    onSearch={handleProductSearch}
                    onSearchChange={(term) => {
                      setProductSearchTerm(term);
                      if (!term || !term.trim()) {
                        setProductSearchResults(initialProducts);
                      }
                    }}
                    isLoading={isSearchingProducts}
                    emptyMessage="No products found"
                    placeholder="Search product..."
                    error={errors[`item_${idx}_itemName`]}
                    bottomAction={({ closeDropdown, searchTerm }) => {
                      const exactMatch = productSearchResults.find(p =>
                        (p.productName || '').toLowerCase() === (searchTerm || '').toLowerCase()
                      );
                      if (searchTerm && !exactMatch) {
                        return (
                          <button
                            type="button"
                            onClick={() => { closeDropdown(); handleOpenCreateProduct(searchTerm); }}
                            className="w-full text-left px-3 py-2 text-[9.6px] text-primary hover:bg-zinc-50 flex items-center gap-1 font-medium"
                          >
                            <Plus size={14} /> Create New Product "{searchTerm}"
                          </button>
                        );
                      }
                      return null;
                    }}
                  >
                    <option value="">Select Product</option>
                    {productSearchResults.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.productName}{p.sku ? ` (${p.sku})` : ''}
                      </option>
                    ))}
                  </CustomSelect>
                  {errors[`item_${idx}_itemName`] && <p className={errText}>{errors[`item_${idx}_itemName`]}</p>}
                </div>
                {/* DESCRIPTION */}
                <div className="p-1 pt-2 min-w-0">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                    placeholder="Description"
                    className={field()}
                  />
                </div>
                {/* ITEM TYPE */}
                <div className="p-1 pt-2 min-w-0">
                  <CustomSelect
                    value={item.itemType}
                    onChange={(e) => handleItemChange(idx, 'itemType', e.target.value)}
                    className={field()}
                  >
                    <option value="PRODUCT">Product</option>
                    <option value="SERVICE">Service</option>
                  </CustomSelect>
                </div>
                {/* QUANTITY */}
                <div className="p-1 pt-2 min-w-0">
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    value={item.requestedQuantity}
                    onChange={(e) => handleItemChange(idx, 'requestedQuantity', e.target.value)}
                    placeholder="0"
                    className={field(errors[`item_${idx}_requestedQuantity`])}
                  />
                  {errors[`item_${idx}_requestedQuantity`] && <p className={errText}>{errors[`item_${idx}_requestedQuantity`]}</p>}
                </div>
                {/* UNIT */}
                <div className="p-1 pt-2 min-w-0">
                  <CustomSelect
                    className="input-field w-full h-8 text-[8.8px] text-zinc-700 dark:text-zinc-200 bg-white dark:bg-surface-dark"
                    value={item.unit || ''}
                    onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                    searchable={true}
                    comboInput={true}
                    onSearch={handleUomSearch}
                    isLoading={isSearchingUoms}
                    emptyMessage="No units found"
                    placeholder="Search UOM..."
                    error={errors[`item_${idx}_unit`]}
                  >
                    <option value="">Select Unit</option>
                    {uomSearchResults.map(uom => (
                      <option key={uom.id} value={uom.uomCode || uom.code || uom.name}>
                        {uom.uomName || uom.name} ({uom.uomCode || uom.code})
                      </option>
                    ))}
                  </CustomSelect>
                  {errors[`item_${idx}_unit`] && <p className={errText}>{errors[`item_${idx}_unit`]}</p>}
                </div>
                {/* REQUIRED DATE */}
                <div className="p-1 pt-2 min-w-0">
                  <input
                    type="date"
                    value={item.requiredDate}
                    onChange={(e) => handleItemChange(idx, 'requiredDate', e.target.value)}
                    className={field(errors[`item_${idx}_requiredDate`])}
                  />
                  {errors[`item_${idx}_requiredDate`] && <p className={errText}>{errors[`item_${idx}_requiredDate`]}</p>}
                </div>
                {/* WAREHOUSE */}
                <div className="p-1 pt-2 min-w-0">
                  <CustomSelect
                    className="input-field w-full h-8 text-[8.8px] text-zinc-700 dark:text-zinc-200 bg-white dark:bg-surface-dark"
                    value={item.warehouseId || ''}
                    onChange={(e) => {
                      const newWarehouseId = e.target.value;
                      handleItemChange(idx, 'warehouseId', newWarehouseId);
                      handleItemChange(idx, 'locationId', '');
                      if (newWarehouseId) {
                        if (locationsByWarehouseIdRef.current[newWarehouseId]) {
                          setLocationSearchResults(locationsByWarehouseIdRef.current[newWarehouseId]);
                        } else {
                          fetchLocationsForWarehouse(newWarehouseId);
                        }
                      }
                    }}
                    searchable={true}
                    comboInput={true}
                    onSearch={handleWarehouseSearch}
                    isLoading={isSearchingWarehouses}
                    emptyMessage="No warehouses found"
                    placeholder="Search warehouse..."
                  >
                    <option value="">Select Warehouse</option>
                    {warehouseSearchResults.map(wh => (
                      <option key={wh.id} value={wh.id}>
                        {wh.warehouseName}
                      </option>
                    ))}
                  </CustomSelect>
                </div>
                {/* LOCATION */}
                <div className="p-1 pt-2 min-w-0">
                  <CustomSelect
                    className="input-field w-full h-8 text-[8.8px] text-zinc-700 dark:text-zinc-200 bg-white dark:bg-surface-dark"
                    value={item.locationId || ''}
                    onChange={(e) => handleItemChange(idx, 'locationId', e.target.value)}
                    searchable={true}
                    comboInput={true}
                    onSearch={(term) => handleLocationSearch(term, item.warehouseId)}
                    isLoading={isSearchingLocations}
                    emptyMessage={item.warehouseId ? "No locations found" : "Select warehouse first"}
                    placeholder={item.warehouseId ? "Search location..." : "Select warehouse first"}
                    disabled={!item.warehouseId}
                  >
                    <option value="">Select Location</option>
                    {locationSearchResults
                      .filter(loc => !item.warehouseId || loc.warehouseId === item.warehouseId)
                      .map(loc => (
                        <option key={loc.id} value={loc.id}>
                          {loc.locationName}
                        </option>
                      ))}
                  </CustomSelect>
                </div>
                {/* REMARKS */}
                <div className="p-1 pt-2 min-w-0">
                  <input
                    type="text"
                    value={item.remarks}
                    onChange={(e) => handleItemChange(idx, 'remarks', e.target.value)}
                    placeholder="Item remarks/specification"
                    className={field()}
                  />
                </div>
                {/* ACTION */}
                <div className="p-1 pt-2 pb-2 min-w-0 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    disabled={items.length <= 1}
                    title="Remove item"
                    className={`p-1.5 rounded-md transition-colors ${items.length <= 1
                      ? 'text-zinc-300 cursor-not-allowed'
                      : 'text-zinc-400 hover:text-red-500 hover:bg-red-50'
                      }`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
