import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import CustomSelect from '../../../components/common/CustomSelect';
import HsnSacSelect from '../../../components/common/HsnSacSelect';

const InvoiceLineItemRow = ({ item, products, productsLoading, companyId, isSystemAdmin, onUpdate, onRemove, canRemove, setAddHsnSacTargetRowId, currency, onAddNewItem, gridTemplateColumns, error }) => {
  return (
    <div 
      className="grid w-full min-w-[860px] bg-white hover:bg-zinc-50/50 border-b border-zinc-100 last:border-0 box-border"
      style={{ gridTemplateColumns: gridTemplateColumns || '18% 12% 18% 7% 10% 7% 8% 7% 9% 4%' }}
    >
      <div className="p-1 pt-2 min-w-0">
        <CustomSelect
          className="w-full min-w-0"
          buttonClassName={`w-full h-8 px-2 border rounded-md text-[8.8px] text-zinc-700 bg-white flex items-center justify-between outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 ${error ? '!border-rose-500 !ring-1 !ring-rose-500/20' : 'border-zinc-200 hover:border-zinc-300'}`}
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
                  className="w-full text-left px-3 py-2 text-[9.6px] text-primary hover:bg-zinc-50 flex items-center gap-1 font-medium"
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
          buttonClassName="w-full h-8 border border-zinc-200 rounded-md text-[8.8px] hover:border-zinc-300 flex items-center justify-between bg-white"
          placeholder="Select HSN/SAC"
          preSelectedCode={item.hsnSacCode}
          preSelectedName={item.hsnSacName}
        />
      </div>
      <div className="p-1 pt-2 min-w-0">
        <input
          type="text"
          placeholder="Description"
          className="input-field w-full h-8 text-[8.8px] text-zinc-700 bg-white truncate"
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
            <div className="text-zinc-800 font-semibold mb-0.5 border-b border-zinc-100 pb-0.5">
              GST {item.isInterState ? item.igstRate : (item.cgstRate + item.sgstRate)}%
            </div>
            {item.isInterState ? (
              item.igstRate > 0 && (
                <div className="flex justify-between items-center w-full">
                  <span className="text-zinc-500">IGST {item.igstRate}%</span>
                  <span className="text-zinc-700 font-medium">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR' }).format(item.igstAmount)}</span>
                </div>
              )
            ) : (
              <>
                {item.cgstRate > 0 && (
                  <div className="flex justify-between items-center w-full">
                    <span className="text-zinc-500">CGST {item.cgstRate}%</span>
                    <span className="text-zinc-700 font-medium">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR' }).format(item.cgstAmount)}</span>
                  </div>
                )}
                {item.sgstRate > 0 && (
                  <div className="flex justify-between items-center w-full">
                    <span className="text-zinc-500">SGST {item.sgstRate}%</span>
                    <span className="text-zinc-700 font-medium">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR' }).format(item.sgstAmount)}</span>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="text-zinc-400 text-center">-</div>
        )}
      </div>

      {/* Total */}
      <div className="p-1 pt-2 min-w-0 flex items-center justify-end pr-2 text-[8.8px] font-semibold text-zinc-800 truncate">
        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR' }).format(item.totalAmount || 0)}
      </div>

      <div className="p-1 pt-2 pb-2 min-w-0 flex items-center justify-center">
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className={`p-1.5 rounded-md transition-colors ${canRemove ? 'text-zinc-400 hover:text-red-500 hover:bg-red-50' : 'text-zinc-300 cursor-not-allowed'}`}
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
