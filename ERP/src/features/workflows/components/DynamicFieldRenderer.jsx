import React from 'react';
import { Paperclip } from 'lucide-react';

export default function DynamicFieldRenderer({
  field,
  value,
  onChange,
  error,
  readOnly = false,
}) {
  if (!field) return null;

  const isFieldReadOnly = readOnly || field.readOnly;
  const currentValue = value ?? field.value ?? field.defaultValue ?? '';

  const renderInput = () => {
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={`field-${field.name}`}
            rows={3}
            disabled={isFieldReadOnly}
            placeholder={field.placeholder || ''}
            value={currentValue}
            onChange={(e) => onChange?.(field.name, e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
              error
                ? 'border-red-400 bg-red-50/20 focus:border-red-500'
                : 'border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
            } ${isFieldReadOnly ? 'bg-zinc-50 text-zinc-700 cursor-not-allowed border-zinc-200' : 'bg-white'}`}
          />
        );

      case 'number':
        return (
          <input
            id={`field-${field.name}`}
            type="number"
            disabled={isFieldReadOnly}
            placeholder={field.placeholder || ''}
            value={currentValue}
            onChange={(e) => onChange?.(field.name, e.target.value === '' ? '' : Number(e.target.value))}
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
              error
                ? 'border-red-400 bg-red-50/20 focus:border-red-500'
                : 'border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
            } ${isFieldReadOnly ? 'bg-zinc-50 text-zinc-700 cursor-not-allowed border-zinc-200' : 'bg-white'}`}
          />
        );

      case 'select':
        return (
          <select
            id={`field-${field.name}`}
            disabled={isFieldReadOnly}
            value={currentValue}
            onChange={(e) => onChange?.(field.name, e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
              error
                ? 'border-red-400 bg-red-50/20 focus:border-red-500'
                : 'border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
            } ${isFieldReadOnly ? 'bg-zinc-50 text-zinc-700 cursor-not-allowed border-zinc-200' : 'bg-white'}`}
          >
            <option value="">{field.placeholder || 'Select option'}</option>
            {(field.options || []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label || opt.value}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-pointer mt-1">
            <input
              id={`field-${field.name}`}
              type="checkbox"
              disabled={isFieldReadOnly}
              checked={Boolean(currentValue)}
              onChange={(e) => onChange?.(field.name, e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
            />
            <span className="text-xs text-zinc-700 select-none">{field.label}</span>
          </label>
        );

      case 'radio':
        return (
          <div className="flex flex-wrap gap-4 mt-1">
            {(field.options || []).map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-xs text-zinc-700">
                <input
                  type="radio"
                  name={field.name}
                  disabled={isFieldReadOnly}
                  value={opt.value}
                  checked={String(currentValue) === String(opt.value)}
                  onChange={(e) => onChange?.(field.name, e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
                <span>{opt.label || opt.value}</span>
              </label>
            ))}
          </div>
        );

      case 'date':
      case 'datetime':
        return (
          <input
            id={`field-${field.name}`}
            type={field.type === 'datetime' ? 'datetime-local' : 'date'}
            disabled={isFieldReadOnly}
            value={currentValue ? String(currentValue).slice(0, field.type === 'datetime' ? 16 : 10) : ''}
            onChange={(e) => onChange?.(field.name, e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
              error
                ? 'border-red-400 bg-red-50/20 focus:border-red-500'
                : 'border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
            } ${isFieldReadOnly ? 'bg-zinc-50 text-zinc-700 cursor-not-allowed border-zinc-200' : 'bg-white'}`}
          />
        );

      case 'file':
        return (
          <div className="mt-1">
            {isFieldReadOnly ? (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-600">
                <Paperclip size={14} className="text-zinc-400" />
                <span>{currentValue || 'No file attached'}</span>
              </div>
            ) : (
              <input
                id={`field-${field.name}`}
                type="file"
                onChange={(e) => onChange?.(field.name, e.target.files?.[0])}
                className="block w-full text-xs text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            )}
          </div>
        );

      case 'text':
      default:
        return (
          <input
            id={`field-${field.name}`}
            type="text"
            disabled={isFieldReadOnly}
            placeholder={field.placeholder || ''}
            value={currentValue}
            onChange={(e) => onChange?.(field.name, e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
              error
                ? 'border-red-400 bg-red-50/20 focus:border-red-500'
                : 'border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
            } ${isFieldReadOnly ? 'bg-zinc-50 text-zinc-700 cursor-not-allowed border-zinc-200' : 'bg-white'}`}
          />
        );
    }
  };

  if (field.type === 'checkbox') {
    return (
      <div className="space-y-1">
        {renderInput()}
        {field.helperText && <p className="text-[11px] text-zinc-400">{field.helperText}</p>}
        {error && <p className="text-[11px] text-red-600 font-medium">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={`field-${field.name}`} className="block text-xs font-semibold text-zinc-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1 font-bold">*</span>}
      </label>
      {renderInput()}
      {field.helperText && <p className="text-[11px] text-zinc-400">{field.helperText}</p>}
      {error && <p className="text-[11px] text-red-600 font-medium">{error}</p>}
    </div>
  );
}
