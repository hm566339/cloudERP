import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import TransactionFormField from './TransactionFormField';

export default function TransactionFormItems({ config, items, errors, onAdd, onUpdate, onRemove, disabled, context }) {
  const itemConfig = config.items || {};
  const gridTemplateColumns = itemConfig.gridTemplateColumns || `repeat(${itemConfig.columns?.length || 1}, minmax(90px, 1fr)) 34px`;
  return <section className="flex-1 min-h-0 flex flex-col border-b border-zinc-200">
    <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100"><h2 className="text-[9px] font-bold uppercase tracking-wider text-zinc-800">{itemConfig.title || 'Items'} <span className="ml-1 text-[8px] font-medium text-zinc-400">{items.length} items</span></h2>{!disabled && itemConfig.addButtonLabel !== false && <button type="button" onClick={onAdd} className="h-7 px-2.5 rounded-md bg-zinc-900 text-white text-[9px] font-semibold flex items-center gap-1.5"><Plus size={12} />{itemConfig.addButtonLabel || 'Add Item'}</button>}</div>
    <div className="overflow-auto flex-1"><div className="min-w-[900px]">
      <div className="grid gap-1 px-1 py-1 bg-zinc-50 border-b border-zinc-200" style={{ gridTemplateColumns }}>{(itemConfig.columns || []).map(column => <div key={column.key} className="px-1 text-[8px] font-bold text-zinc-500 uppercase tracking-wider">{column.label}{column.required && ' *'}</div>)}<div className="text-[8px] font-bold text-zinc-500 uppercase">Action</div></div>
      {items.map((item, index) => itemConfig.rowRenderer ? itemConfig.rowRenderer({ item, index, gridTemplateColumns, onUpdate: (key, value) => onUpdate(index, key, value, item), onRemove: () => onRemove(index), canRemove: !disabled && itemConfig.allowDelete !== false, disabled, context }) : <div key={item.id || index} className="grid gap-1 border-b border-zinc-100" style={{ gridTemplateColumns }}>{(itemConfig.columns || []).map(column => <div key={column.key} className="p-1"><TransactionFormField field={column} value={item[column.key]} error={errors?.[index]?.[column.key]} row={item} onChange={(key, value, row) => onUpdate(index, key, value, row)} disabled={disabled} context={context} /></div>)}<div className="flex items-center justify-center">{!disabled && itemConfig.allowDelete !== false && <button type="button" onClick={() => onRemove(index)} className="p-1 text-zinc-400 hover:text-red-600" aria-label="Remove item"><Trash2 size={13} /></button>}</div></div>)}
    </div></div>
  </section>;
}
