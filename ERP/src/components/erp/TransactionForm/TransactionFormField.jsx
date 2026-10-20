import React, { useState } from 'react';
import CustomSelect from '../../common/CustomSelect';

const inputClass = 'w-full h-8 px-2.5 border border-zinc-200 rounded-md bg-white text-[10px] text-zinc-800 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 disabled:bg-zinc-50 disabled:text-zinc-400';

export default function TransactionFormField({ field, value, error, onChange, disabled = false, row, context = {} }) {
  const [query, setQuery] = useState('');
  const readOnly = disabled || field.readOnly;
  const setValue = (next) => onChange(field.key, next, row);
  const setFormValue = (key, nextValue) => onChange(key, nextValue);
  const rendererProps = {
    field,
    value,
    error,
    errors: context.errors,
    setValue,
    onChange: setValue,
    formValues: context.values,
    setFormValue,
    row,
    context,
    disabled: readOnly
  };
  if (field.render) return field.render(rendererProps);
  if (field.type === 'custom' && field.component) {
    const Component = field.component;
    return <Component {...rendererProps} />;
  }
  const common = { id: field.key, name: field.key, disabled: readOnly, required: field.required, value: value ?? '', onChange: e => setValue(e.target.value), className: inputClass };
  return (
    <div className={field.className || ''}>
      {field.label && <label htmlFor={field.key} className="block mb-1 text-[8.5px] font-semibold text-zinc-700">{field.label}{field.required && ' *'}</label>}
      {field.type === 'textarea' ? <textarea {...common} rows={field.rows || 3} placeholder={field.placeholder} className={`${inputClass} h-auto py-2 resize-y`} /> :
       field.type === 'checkbox' ? <label className="flex items-center gap-2 text-[10px] text-zinc-700"><input type="checkbox" checked={Boolean(value)} disabled={readOnly} onChange={e => setValue(e.target.checked)} />{field.checkboxLabel || field.label}</label> :
       field.type === 'radio' ? <div className="flex flex-wrap gap-3">{(field.options || []).map(option => <label key={option.value} className="flex items-center gap-1.5 text-[10px]"><input type="radio" name={field.key} value={option.value} checked={String(value ?? '') === String(option.value)} disabled={readOnly} onChange={e => setValue(e.target.value)} />{option.label}</label>)}</div> :
       field.type === 'select' ? <CustomSelect {...common} className="w-full" buttonClassName={`${inputClass} flex items-center justify-between`} searchable={field.searchable} placeholder={field.placeholder || 'Select an option'}>{(field.options || []).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</CustomSelect> :
       field.type === 'searchable-select' ? <CustomSelect {...common} className="w-full" buttonClassName={`${inputClass} flex items-center justify-between`} searchable comboInput onInput={e => setQuery(e.target.value)} placeholder={field.placeholder || 'Select an option'}>{(field.options || []).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</CustomSelect> :
       <input {...common} type={field.type === 'currency' || field.type === 'currency-input' ? 'number' : (field.type || 'text')} min={field.min} max={field.max} step={field.step || (field.type === 'number' || field.type === 'currency' || field.type === 'currency-input' ? '0.01' : undefined)} placeholder={field.placeholder} readOnly={field.readOnly} />}
      {field.helpText && <p className="mt-1 text-[8px] text-zinc-400">{field.helpText}</p>}
      {error && <p className="mt-1 text-[8px] text-red-600">{error}</p>}
    </div>
  );
}
