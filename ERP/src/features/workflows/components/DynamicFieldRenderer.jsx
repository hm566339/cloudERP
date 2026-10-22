import React from 'react';
import { Paperclip } from 'lucide-react';
import CustomSelect from '../../../components/common/CustomSelect';

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
                ? 'border-red-400 dark:border-red-500 bg-red-50/20 dark:bg-red-950/20 focus:border-red-500'
                : 'border-zinc-200 dark:border-border-dark focus:border-zinc-400 dark:focus:border-primary focus:ring-1 focus:ring-zinc-900/10 dark:focus:ring-primary/20'
            } ${isFieldReadOnly ? 'bg-zinc-50 dark:bg-hover-dark text-zinc-700 dark:text-zinc-400 cursor-not-allowed border-zinc-200 dark:border-border-dark' : 'bg-white dark:bg-card-dark text-zinc-900 dark:text-zinc-100'}`}
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
                ? 'border-red-400 dark:border-red-500 bg-red-50/20 dark:bg-red-950/20 focus:border-red-500'
                : 'border-zinc-200 dark:border-border-dark focus:border-zinc-400 dark:focus:border-primary focus:ring-1 focus:ring-zinc-900/10 dark:focus:ring-primary/20'
            } ${isFieldReadOnly ? 'bg-zinc-50 dark:bg-hover-dark text-zinc-700 dark:text-zinc-400 cursor-not-allowed border-zinc-200 dark:border-border-dark' : 'bg-white dark:bg-card-dark text-zinc-900 dark:text-zinc-100'}`}
          />
        );

      case 'select':
        return (
          <CustomSelect
            id={`field-${field.name}`}
            disabled={isFieldReadOnly}
            value={currentValue}
            onChange={(e, val) => onChange?.(field.name, val !== undefined ? val : e?.target?.value)}
            placeholder={field.placeholder || 'Select option'}
            error={error}
            size="md"
            options={(field.options || []).map((opt) => (
              typeof opt === 'object'
                ? { value: opt.value, label: opt.label || opt.value }
                : { value: opt, label: opt }
            ))}
          />
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
              className="h-4 w-4 rounded border-zinc-300 dark:border-border-dark dark:bg-card-dark text-blue-600 focus:ring-zinc-900/10 dark:focus:ring-primary/20 disabled:opacity-50"
            />
            <span className="text-xs text-zinc-700 dark:text-zinc-300 select-none">{field.label}</span>
          </label>
        );

      case 'radio':
        return (
          <div className="flex flex-wrap gap-4 mt-1">
            {(field.options || []).map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-xs text-zinc-700 dark:text-zinc-300">
                <input
                  type="radio"
                  name={field.name}
                  disabled={isFieldReadOnly}
                  value={opt.value}
                  checked={String(currentValue) === String(opt.value)}
                  onChange={(e) => onChange?.(field.name, e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-zinc-900/10 dark:focus:ring-primary/20 disabled:opacity-50"
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
                ? 'border-red-400 dark:border-red-500 bg-red-50/20 dark:bg-red-950/20 focus:border-red-500'
                : 'border-zinc-200 dark:border-border-dark focus:border-zinc-400 dark:focus:border-primary focus:ring-1 focus:ring-zinc-900/10 dark:focus:ring-primary/20'
            } ${isFieldReadOnly ? 'bg-zinc-50 dark:bg-hover-dark text-zinc-700 dark:text-zinc-400 cursor-not-allowed border-zinc-200 dark:border-border-dark' : 'bg-white dark:bg-card-dark text-zinc-900 dark:text-zinc-100'}`}
          />
        );

      case 'file':
        return (
          <div className="mt-1">
            {isFieldReadOnly ? (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-hover-dark border border-zinc-200 dark:border-border-dark text-xs text-zinc-600 dark:text-zinc-300">
                <Paperclip size={14} className="text-zinc-400 dark:text-zinc-500" />
                <span>{currentValue || 'No file attached'}</span>
              </div>
            ) : (
              <input
                id={`field-${field.name}`}
                type="file"
                onChange={(e) => onChange?.(field.name, e.target.files?.[0])}
                className="block w-full text-xs text-zinc-500 dark:text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 dark:file:bg-blue-950/50 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50"
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
                ? 'border-red-400 dark:border-red-500 bg-red-50/20 dark:bg-red-950/20 focus:border-red-500'
                : 'border-zinc-200 dark:border-border-dark focus:border-zinc-400 dark:focus:border-primary focus:ring-1 focus:ring-zinc-900/10 dark:focus:ring-primary/20'
            } ${isFieldReadOnly ? 'bg-zinc-50 dark:bg-hover-dark text-zinc-700 dark:text-zinc-400 cursor-not-allowed border-zinc-200 dark:border-border-dark' : 'bg-white dark:bg-card-dark text-zinc-900 dark:text-zinc-100'}`}
          />
        );
    }
  };

  if (field.type === 'checkbox') {
    return (
      <div className="space-y-1">
        {renderInput()}
        {field.helperText && <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{field.helperText}</p>}
        {error && <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={`field-${field.name}`} className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        {field.label}
        {field.required && <span className="text-red-500 ml-1 font-bold">*</span>}
      </label>
      {renderInput()}
      {field.helperText && <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{field.helperText}</p>}
      {error && <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">{error}</p>}
    </div>
  );
}
