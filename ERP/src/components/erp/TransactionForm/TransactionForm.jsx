import React, { useMemo, useState } from 'react';
import TransactionFormHeader from './TransactionFormHeader';
import TransactionFormSidebar from './TransactionFormSidebar';
import TransactionFormItems from './TransactionFormItems';
import TransactionFormSummary from './TransactionFormSummary';
import TransactionFormFooter from './TransactionFormFooter';
import { createItem, validateTransaction } from './transactionFormUtils';
import { TransactionFormProvider } from './TransactionFormContext';

export default function TransactionForm({ config, values: controlledValues, initialValues = {}, errors: externalErrors, onChange, onSubmit, onCancel, onPrint, loading = false, mode = 'create', items: controlledItems, onItemsChange, context: externalContext = {} }) {
  const [internalValues, setInternalValues] = useState(initialValues);
  const [internalItems, setInternalItems] = useState(() => initialValues.items || [createItem(config)]);
  const [internalErrors, setInternalErrors] = useState({});
  const values = controlledValues || internalValues;
  const items = controlledItems || internalItems;
  const errors = useMemo(() => ({ ...internalErrors, ...(externalErrors || {}) }), [internalErrors, externalErrors]);
  const disabled = loading || mode === 'view';
  const context = useMemo(() => ({ ...externalContext, config, mode, items }), [externalContext, config, mode, items]);
  const setValue = (key, value, row) => {
    if (row) {
      if (config.onItemChange) {
        config.onItemChange(row, key, value, items);
        return;
      }
      const nextItems = items.map((item, index) => item === row ? { ...item, [key]: value } : item);
      if (onItemsChange) onItemsChange(nextItems); else setInternalItems(nextItems);
      config.onItemChange?.(row, key, value, nextItems);
      return;
    }
    if (onChange) onChange(key, value); else setInternalValues(prev => ({ ...prev, [key]: value }));
    config.onFieldChange?.(key, value, values);
  };
  const addItem = () => { if (config.onAddItem) return config.onAddItem(); const next = [...items, createItem(config)]; if (onItemsChange) onItemsChange(next); else setInternalItems(next); };
  const removeItem = index => { if (config.onRemoveItem) return config.onRemoveItem(items[index], index); const next = items.filter((_, itemIndex) => itemIndex !== index); if (onItemsChange) onItemsChange(next); else setInternalItems(next); };
  const submit = event => { event.preventDefault(); const nextErrors = validateTransaction(values, config); setInternalErrors(nextErrors); if (Object.keys(nextErrors).length === 0) onSubmit?.({ ...values, items }); };
  const formContext = { values, errors, items, setValue, addItem, removeItem, updateItem: (index, key, value) => setValue(key, value, items[index]), loading, disabled, mode, config };
  return <TransactionFormProvider value={formContext}><div className="fixed inset-0 z-[300] flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm"><div className="bg-white shadow-2xl w-full h-full flex flex-col overflow-hidden text-xs"><form noValidate onSubmit={submit} className="flex-1 flex flex-col overflow-hidden min-h-0"><TransactionFormHeader config={config} values={values} errors={errors} onChange={setValue} onClose={onCancel} disabled={disabled} context={context} /><div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200"><TransactionFormSidebar config={config} values={values} errors={errors} onChange={setValue} disabled={disabled} context={context} /><main className="flex-1 min-w-0 flex flex-col overflow-y-auto lg:overflow-hidden min-h-0"><TransactionFormItems config={config} items={items} errors={errors.items} onAdd={addItem} onUpdate={(index, key, value, row) => setValue(key, value, items[index])} onRemove={removeItem} disabled={disabled} context={context} /><TransactionFormSummary config={config} values={values} errors={errors} onChange={setValue} disabled={disabled} context={context} /></main></div><TransactionFormFooter config={config} values={values} onChange={setValue} onCancel={onCancel} onPrint={onPrint} loading={loading} disabled={disabled} /></form></div></div></TransactionFormProvider>;
}
