import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import CustomSelect from '../../../components/common/CustomSelect';
import HsnSacSelect from '../../../components/common/HsnSacSelect';

const InvoiceLineItemRow = ({ item, products, productsLoading, companyId, isSystemAdmin, onUpdate, onRemove, canRemove, setAddHsnSacTargetRowId, currency, onAddNewItem, gridTemplateColumns, error }) => {
  return (
    <div 
      className="grid w-full min-w-[860px] bg-white dark:bg-[#161922] hover:bg-zinc-50/50 dark:hover:bg-[#222736] border-b border-zinc-100 dark:border-[#2A2F3D] last:border-0 box-border"
      style={{ gridTemplateColumns: gridTemplateColumns || '18% 12% 18% 7% 10% 7% 8% 7% 9% 4%' }}
    >
      <div className="p-1 pt-2 min-w-0">
        <CustomSelect
          className="w-full min-w-0"
          buttonClassName={`w-full h-8 px-2 border rounded-md text-[8.8px] text-zinc-700 dark:text-[#E6E8EE] bg-white dark:bg-[#1D212C] flex items-center justify-between outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 ${error ? '!border-rose-500 !ring-1 !ring-rose-500/20' : 'border-zinc-200 dark:border-[#2A2F3D] hover:border-zinc-300 dark:hover:border-[#3A3F4D]'}`}
          value={item.itemId || ''}
          onChange={e => onUpdate(item.id, 'itemId', e.target.value)}
          searchable={true}
          comboInput={true}
          onSearch={(term) => onUpdate('SEARCH', 'itemSearch', term)}
          bottomAction={({ closeDropdown, searchTerm }) => {
            const exactMatch = products.find(p => (p.productName || p.name || '').toLowerCase() === (searchTerm || '').toLowerCase());
            if (searchTerm && !exactMatch) {
              return (
                <button
                  type="button"
                  onClick={() => {
                    closeDropdown();
                    if (onAddNewItem) onAddNewItem(item.id, searchTerm);
                  }}
                  className="w-full text-left px-3 py-2 text-[9.6px] text-primary hover:bg-zinc-50 dark:hover:bg-[#222736] flex items-center gap-1 font-medium"
                >
                  <Plus size={14} /> Create "{searchTerm}"
                </button>
              );
            }
            return null;
          }}
          error={error}
          required
        >
          <option value="">Select Item</option>
          {productsLoading ? (
            <option disabled>Loading...</option>
          ) : (
            products.map(p => (
              <option key={p.productId} value={p.productId}>{p.productName}</option>
            ))
          )}
        </CustomSelect>
      </div>


      <div className="p-1 pt-2 min-w-0">
        <HsnSacSelect
          value={item.hsnSacId}
          onChange={(e, selectedHsn) => {
            if (selectedHsn) {
              onUpdate(item.id, 'hsnSelection', {
                hsnSacId: e.target.value,
                hsnSacCode: selectedHsn.code || '',
                hsnSacName: selectedHsn.description || '',
                hsnSac: selectedHsn,
                cgstRate: selectedHsn.cgstRate,
                sgstRate: selectedHsn.sgstRate,
                igstRate: selectedHsn.igstRate
              });
            } else {
              onUpdate(item.id, 'hsnSelection', {
                hsnSacId: e.target.value,
                hsnSacCode: '',
                hsnSacName: '',
                hsnSac: null,
                cgstRate: 0,
                sgstRate: 0,
                igstRate: 0
              });
            }
          }}
          onAddNew={() => setAddHsnSacTargetRowId(item.id)}
          buttonClassName="w-full h-8 border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[8.8px] text-zinc-800 dark:text-[#E6E8EE] hover:border-zinc-300 dark:hover:border-[#3A3F4D] flex items-center justify-between bg-white dark:bg-[#1D212C]"
          placeholder="Select HSN/SAC"
          preSelectedCode={item.hsnSacCode}
          preSelectedName={item.hsnSacName}
        />
      </div>
      <div className="p-1 pt-2 min-w-0">
        <input
          type="text"
          placeholder="Description"
          className="input-field w-full h-8 text-[8.8px] text-zinc-700 dark:text-[#E6E8EE] bg-white dark:bg-[#1D212C] truncate"
          value={item.description}
          onChange={e => onUpdate(item.id, 'description', e.target.value)}
        />
      </div>
      <div className="p-1 pt-2 min-w-0">
        <input
          type="number"
          min="0.01"
          step="0.01"
          className="input-field w-full h-8 text-center text-[8.8px]"
          value={item.quantity % 1 === 0 ? parseInt(item.quantity) : item.quantity}
          onChange={e => onUpdate(item.id, 'quantity', e.target.value)}
          required
        />
      </div>
      <div className="p-1 pt-2 min-w-0">
        <input
          type="number"
          min="0"
          step="0.01"
          className="input-field w-full h-8 text-right text-[8.8px]"
          value={item.unitPrice}
          onChange={e => onUpdate(item.id, 'unitPrice', e.target.value)}
          required
        />
      </div>
      <div className="p-1 pt-2 min-w-0">
        <input
          type="text"
          placeholder="e.g. PCS"
          className="input-field w-full h-8 text-center text-[8.8px] uppercase"
          value={item.unit}
          onChange={e => onUpdate(item.id, 'unit', e.target.value)}
        />
      </div>
      <div className="p-1 pt-2 min-w-0">
        <input
          type="number"
          min="0"
          max="100"
          step="0.01"
          placeholder="0"
          className="input-field w-full h-8 text-center text-[8.8px]"
          value={item.discountPercentage || 0}
          onChange={e => onUpdate(item.id, 'discountPercentage', e.target.value)}
        />
      </div>
      
      {/* Tax */}
      <div className="p-1 pt-2 min-w-0 flex flex-col justify-center text-[8px] leading-tight">
        {item.hsnSacId ? (
          <div className="flex flex-col gap-1 w-full px-1">
            <div className="text-zinc-800 dark:text-[#E6E8EE] font-semibold mb-0.5 border-b border-zinc-100 dark:border-[#2A2F3D] pb-0.5">
              GST {item.isInterState ? item.igstRate : (item.cgstRate + item.sgstRate)}%
            </div>
            {item.isInterState ? (
              item.igstRate > 0 && (
                <div className="flex justify-between items-center w-full">
                  <span className="text-zinc-500 dark:text-[#6B7184]">IGST {item.igstRate}%</span>
                  <span className="text-zinc-700 dark:text-[#A0A6B5] font-medium">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR' }).format(item.igstAmount)}</span>
                </div>
              )
            ) : (
              <>
                {item.cgstRate > 0 && (
                  <div className="flex justify-between items-center w-full">
                    <span className="text-zinc-500 dark:text-[#6B7184]">CGST {item.cgstRate}%</span>
                    <span className="text-zinc-700 dark:text-[#A0A6B5] font-medium">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR' }).format(item.cgstAmount)}</span>
                  </div>
                )}
                {item.sgstRate > 0 && (
                  <div className="flex justify-between items-center w-full">
                    <span className="text-zinc-500 dark:text-[#6B7184]">SGST {item.sgstRate}%</span>
                    <span className="text-zinc-700 dark:text-[#A0A6B5] font-medium">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR' }).format(item.sgstAmount)}</span>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="text-zinc-400 dark:text-[#6B7184] text-center">-</div>
        )}
      </div>

      {/* Total */}
      <div className="p-1 pt-2 min-w-0 flex items-center justify-end pr-2 text-[8.8px] font-semibold text-zinc-800 dark:text-[#E6E8EE] truncate">
        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR' }).format(item.totalAmount || 0)}
      </div>

      <div className="p-1 pt-2 pb-2 min-w-0 flex items-center justify-center">
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className={`p-1.5 rounded-md transition-colors ${canRemove ? 'text-zinc-400 dark:text-[#6B7184] hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30' : 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed'}`}
          disabled={!canRemove}
          title="Delete item"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default InvoiceLineItemRow;
