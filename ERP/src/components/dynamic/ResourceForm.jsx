import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2, AlertCircle, CheckCircle2, Save, X } from 'lucide-react';
import api from '../../services/api';
import { getResourceConfig } from '../../metadata/resourceRegistry';
import { useAuth } from '../../hooks/useAuth';
import RelationSelect from './RelationSelect';
import { useEnumOptions } from '../../hooks/useEnumOptions';
import FormField from '../forms/FormField';

/**
 * Dynamic Form Field Renderer
 */
function DynamicInput({ field, value, onChange, error, disabled }) {
  const enumOptions = useEnumOptions(field.enumKey);

  if (field.type === 'relation') {
    return (
      <RelationSelect
        resource={field.relationResource}
        value={value}
        onChange={(val) => onChange(field.name, val)}
        disabled={disabled || field.readOnly}
        required={field.required}
      />
    );
  }

  if (field.type === 'select' || field.enumKey) {
    return (
      <select
        id={field.name}
        name={field.name}
        value={value !== undefined && value !== null ? value : ''}
        onChange={(e) => onChange(field.name, e.target.value)}
        disabled={disabled || field.readOnly}
        required={field.required}
        className={`w-full text-xs rounded-lg border px-3 py-2 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
          error ? 'border-rose-500' : 'border-zinc-300 dark:border-zinc-700'
        }`}
      >
        <option value="">Select {field.label}...</option>
        {enumOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === 'boolean') {
    return (
      <label className="flex items-center gap-2 cursor-pointer mt-1">
        <input
          type="checkbox"
          id={field.name}
          name={field.name}
          checked={Boolean(value)}
          onChange={(e) => onChange(field.name, e.target.checked)}
          disabled={disabled || field.readOnly}
          className="w-4 h-4 text-indigo-600 rounded border-zinc-300 dark:border-zinc-700 focus:ring-indigo-500"
        />
        <span className="text-xs text-zinc-700 dark:text-zinc-300">{field.label}</span>
      </label>
    );
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        id={field.name}
        name={field.name}
        rows={field.rows || 3}
        value={value !== undefined && value !== null ? value : ''}
        onChange={(e) => onChange(field.name, e.target.value)}
        disabled={disabled || field.readOnly}
        placeholder={field.placeholder || `Enter ${field.label}...`}
        className={`w-full text-xs rounded-lg border px-3 py-2 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
          error ? 'border-rose-500' : 'border-zinc-300 dark:border-zinc-700'
        }`}
      />
    );
  }

  const inputType =
    field.type === 'decimal' || field.type === 'integer' || field.type === 'number'
      ? 'number'
      : field.type === 'date'
      ? 'date'
      : field.type === 'email'
      ? 'email'
      : 'text';

  const step = field.type === 'decimal' ? '0.01' : '1';

  return (
    <input
      type={inputType}
      id={field.name}
      name={field.name}
      step={step}
      value={value !== undefined && value !== null ? value : ''}
      onChange={(e) => onChange(field.name, inputType === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
      disabled={disabled || field.readOnly}
      required={field.required}
      maxLength={field.maxLength}
      placeholder={field.placeholder || `Enter ${field.label}...`}
      className={`w-full text-xs rounded-lg border px-3 py-2 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
        error ? 'border-rose-500' : 'border-zinc-300 dark:border-zinc-700'
      }`}
    />
  );
}

/**
 * Enterprise Dynamic Form Engine
 * Renders resource forms driven by schema with client and server error handling.
 */
export default function ResourceForm({
  resource,
  mode = 'create', // 'create' | 'edit'
  initialData = {},
  recordId,
  onSubmit,
  onSuccess,
  onCancel,
  customFields,
  sections,
  className = '',
}) {
  const { isReadOnly } = useAuth();
  const config = useMemo(() => getResourceConfig(resource), [resource]);

  const [formData, setFormData] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingDetail, setFetchingDetail] = useState(false);

  // Initialize fields
  const fields = useMemo(() => {
    if (customFields && customFields.length > 0) return customFields;
    return config?.fields || [];
  }, [customFields, config]);

  // Load record detail if in edit mode and recordId passed
  useEffect(() => {
    if (mode === 'edit' && recordId && config?.detailPath) {
      setFetchingDetail(true);
      const url = config.detailPath.replace(':id', recordId);
      api
        .get(url)
        .then((res) => {
          const data = res.data?.data || res.data;
          if (data) {
            setFormData(data);
          }
        })
        .catch((err) => {
          setGeneralError(err.message || 'Failed to load record details.');
        })
        .finally(() => {
          setFetchingDetail(false);
        });
    } else if (initialData && Object.keys(initialData).length > 0) {
      setFormData(initialData);
    }
  }, [mode, recordId, config, initialData]);

  const handleFieldChange = useCallback((name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (prev[name]) {
        const next = { ...prev };
        delete next[name];
        return next;
      }
      return prev;
    });
  }, []);

  // Validate on client before submit
  const validate = () => {
    const errs = {};
    for (const f of fields) {
      if (f.required && (formData[f.name] === undefined || formData[f.name] === null || formData[f.name] === '')) {
        errs[f.name] = `${f.label || f.name} is required.`;
      }
      if (f.maxLength && formData[f.name] && String(formData[f.name]).length > f.maxLength) {
        errs[f.name] = `Maximum length is ${f.maxLength} characters.`;
      }
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) {
      setGeneralError('Action disabled: system is currently in Read-Only mode.');
      return;
    }

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    setGeneralError(null);
    setFieldErrors({});

    try {
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        // Default API dispatch
        if (mode === 'create') {
          const url = config?.createPath;
          if (!url) throw new Error(`No createPath defined for ${resource}`);
          const res = await api.post(url, formData);
          if (onSuccess) onSuccess(res.data?.data || res.data);
        } else {
          const targetId = recordId || formData[config?.idField || 'id'];
          const url = (config?.updatePath || '').replace(':id', targetId);
          if (!url) throw new Error(`No updatePath defined for ${resource}`);
          const res = await api.put(url, formData);
          if (onSuccess) onSuccess(res.data?.data || res.data);
        }
      }
    } catch (err) {
      console.error(`[ResourceForm] Error submitting ${resource}:`, err);
      // Map server field errors
      const serverData = err.response?.data;
      if (serverData?.errors && typeof serverData.errors === 'object' && !Array.isArray(serverData.errors)) {
        setFieldErrors(serverData.errors);
      } else if (Array.isArray(serverData?.errors)) {
        setGeneralError(serverData.errors.join('; '));
      } else {
        setGeneralError(serverData?.message || err.message || 'Operation failed. Please check inputs.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (fetchingDetail) {
    return (
      <div className="p-12 text-center text-zinc-400 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
        <span className="text-xs font-medium">Loading {config?.name || 'record'} details...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {generalError && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Grid of Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((fld) => (
          <div key={fld.name} className={fld.fullWidth ? 'sm:col-span-2' : ''}>
            <FormField
              label={fld.label}
              htmlFor={fld.name}
              required={fld.required}
              error={fieldErrors[fld.name]}
              hint={fld.hint}
            >
              <DynamicInput
                field={fld}
                value={formData[fld.name]}
                onChange={handleFieldChange}
                error={fieldErrors[fld.name]}
                disabled={submitting || isReadOnly}
              />
            </FormField>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={submitting || isReadOnly}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
        >
          {submitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>{mode === 'create' ? `Create ${config?.name || 'Record'}` : 'Save Changes'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

