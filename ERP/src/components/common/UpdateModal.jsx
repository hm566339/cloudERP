import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Save, Loader2, Check } from 'lucide-react';
import CustomSelect from './CustomSelect';
import { createPortal } from 'react-dom';

const EMPTY_FIELDS = [];

/**
 * UpdateModal — Config-driven create/edit form modal.
 *
 * Generic reusable modal for ANY entity (Customer, Vendor, Product,
 * Employee, Account, etc.). All form structure comes from config — no
 * entity-specific logic lives here.
 *
 * ─── USAGE (flat fields, backward-compatible) ───────────────────────────
 *   <UpdateModal
 *     isOpen={showEdit}
 *     onClose={() => setShowEdit(false)}
 *     title="Edit Bank Account"
 *     fields={FILTER_CONFIGS.bankAccounts.updateConfig.fields}
 *     initialData={selectedRecord}
 *     onSubmit={async (data) => { await updateAccount({ id, ...data }).unwrap(); }}
 *     isSubmitting={isUpdating}
 *   />
 *
 * ─── USAGE (sectioned layout) ───────────────────────────────────────────
 *   <UpdateModal
 *     isOpen={open}
 *     onClose={onClose}
 *     title="Add New Customer"
 *     sections={customerFormSections}
 *     initialData={customer}
 *     onSubmit={handleSubmit}
 *     submitLabel="Create Customer"
 *   />
 *
 * ─── PROPS ──────────────────────────────────────────────────────────────
 *   isOpen        boolean
 *   onClose       () => void
 *   title         string
 *
 *   fields        FieldConfig[]        — flat list (original API, still supported)
 *   sections      SectionConfig[]      — array of { title, fields[] }; takes priority over fields
 *
 *   initialData   object | null        — pre-fill values
 *   id            string | number      — if provided with endpoint, fetches data
 *   endpoint      string               — API endpoint to fetch initial data
 *
 *   onSubmit      async (formData) => void
 *   isSubmitting  boolean
 *   error         string               — external error message
 *
 *   submitLabel   string               — default: 'Save Changes'
 *   cancelLabel   string               — default: 'Cancel'
 *
 * ─── FIELD CONFIG SHAPE ─────────────────────────────────────────────────
 *   {
 *     key:          string          required
 *     label:        string          required
 *     type:         'text' | 'email' | 'tel' | 'number' | 'date' |
 *                   'select' | 'boolean' | 'textarea'
 *     required?:    boolean
 *     placeholder?: string
 *     options?:     { value, label }[]   — for type='select'
 *     uppercase?:   boolean
 *     maxLength?:   number
 *     pattern?:     string
 *     title?:       string            — tooltip / validation message
 *     span?:        'full'            — field spans full width inside section grid
 *     defaultValue?: any
 *   }
 *
 * ─── SECTION CONFIG SHAPE ───────────────────────────────────────────────
 *   {
 *     title:   string
 *     fields:  FieldConfig[]
 *   }
 */
export default function UpdateModal({
  isOpen,
  onClose,
  title = 'Update',

  // Either sections (preferred) or flat fields (legacy)
  sections,
  fields: legacyFields = EMPTY_FIELDS,

  initialData = null,
  id,
  endpoint,
  onSubmit,
  validate,
  isSubmitting = false,
  error: externalError,

  submitLabel = 'Save Changes',
  cancelLabel = 'Cancel',
}) {
  // Normalise: if sections provided, flatten for state management
  const allFields = useMemo(() => {
    if (sections?.length) {
      return sections.flatMap((s) => s.fields || []);
    }
    return legacyFields;
  }, [sections, legacyFields]);

  const [formData, setFormData]       = useState({});
  const [localError, setLocalError]   = useState('');
  const [loading, setLoading]         = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [fetchedData, setFetchedData] = useState(null);
  const wasOpenRef                    = useRef(false);
  const initializedKeyRef             = useRef(null);

  // ── Fetch data via endpoint if provided ──────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setFetchedData(null);
      return;
    }
    let controller = null;
    if (id && endpoint) {
      setLoading(true);
      controller = new AbortController();
      import('../../api/common/client').then(({ default: apiClient }) => {
        apiClient
          .get(endpoint, { signal: controller.signal })
          .then((res) => {
            setFetchedData(res.data?.data || res.data);
            setLoading(false);
          })
          .catch((err) => {
            if (err.name === 'CanceledError' || err.message === 'canceled') return;
            setLocalError('Failed to load details for editing');
            setLoading(false);
          });
      });
    }
    return () => { if (controller) controller.abort(); };
  }, [isOpen, id, endpoint]);

  // ── Pre-fill form state ───────────────────────────────────────────────
  // dataKey tracks: which record is loaded, and whether data came from
  // a fetch, from initialData, or is a blank create form.
  // Using initialData?.id + isOpen ensures we re-fill whenever:
  //   • the modal opens fresh (isOpen: false → true)
  //   • the target record changes (different id)
  //   • switching from edit → create (id goes undefined)
  useEffect(() => {
    if (!isOpen) {
      // Reset refs so next open always re-initialises
      wasOpenRef.current = false;
      initializedKeyRef.current = null;
      setLocalError('');
      setFieldErrors({});
      return;
    }

    const dataToUse = fetchedData || initialData || {};
    // Include the record id AND a null-sentinel so create mode ('create:empty')
    // is distinct from edit mode ('123:initial') even when switching between them.
    const recordId   = id || dataToUse?.id || 'create';
    const dataSource = fetchedData ? 'fetched' : initialData?.id ? 'initial' : 'empty';
    const dataKey    = `${recordId}:${dataSource}`;

    if (wasOpenRef.current && initializedKeyRef.current === dataKey) return;

    const filled = {};
    allFields.forEach((field) => {
      const val = dataToUse[field.key];
      if (field.type === 'boolean') {
        filled[field.key] = val !== undefined
          ? val === true || val === 'true'
          : (field.defaultValue ?? false);
      } else if (field.type === 'date' && val) {
        filled[field.key] = typeof val === 'string' ? val.substring(0, 10) : '';
      } else {
        filled[field.key] = val ?? (field.defaultValue ?? '');
      }
    });

    setFormData(filled);
    setLocalError('');
    wasOpenRef.current = true;
    initializedKeyRef.current = dataKey;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, id, initialData?.id, fetchedData, allFields]);

  // ── Escape key ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // ── Field change handler ──────────────────────────────────────────────
  const handleChange = (key, value, field) => {
    let processed = value;
    if (field.type !== 'boolean' && typeof value === 'string' && field.uppercase) {
      processed = value.toUpperCase();
    }
    setFormData((prev) => ({
      ...prev,
      [key]: field.type === 'boolean'
        ? (processed === 'true' || processed === true)
        : processed,
    }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // ── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setFieldErrors({});
    try {
      const rawData = allFields.reduce((acc, field) => {
        acc[field.key] = field.type === 'number'
          ? (formData[field.key] === '' ? null : Number(formData[field.key]))
          : (formData[field.key] ?? null);
        return acc;
      }, {});

      if (initialData?.id || fetchedData?.id) {
        rawData.id = initialData?.id || fetchedData?.id;
      }

      const validationErrors = validate?.(rawData) || {};
      if (Object.keys(validationErrors).length > 0) {
        setFieldErrors(validationErrors);
        return;
      }

      setSubmitting(true);
      await onSubmit(rawData);
      onClose();
    } catch (err) {
      const responseData = err?.response?.data || err?.data;
      const fieldErrorsFromBackend = responseData?.data;
      if (fieldErrorsFromBackend && typeof fieldErrorsFromBackend === 'object') {
        const mappedErrors = {};
        Object.entries(fieldErrorsFromBackend).forEach(([key, val]) => {
          const cleanKey = key.replace(/^data\./, '');
          mappedErrors[cleanKey] = val;
        });
        setFieldErrors((prev) => ({ ...prev, ...mappedErrors }));
      }
      const msg =
        (typeof fieldErrorsFromBackend === 'string' ? fieldErrorsFromBackend : null) ||
        responseData?.message ||
        (Array.isArray(responseData?.errors) ? responseData.errors.join(', ') : null) ||
        (fieldErrorsFromBackend && typeof fieldErrorsFromBackend === 'object'
          ? Object.values(fieldErrorsFromBackend).join(', ')
          : null) ||
        err?.message ||
        'Save failed';
      setLocalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Dirty check ───────────────────────────────────────────────────────
  const isDirty = useMemo(() => {
    if (!initialData) return true;
    return allFields.some((f) => {
      const initial = initialData?.[f.key];
      const current = formData[f.key];
      return String(current ?? '') !== String(initial ?? '');
    });
  }, [formData, initialData, allFields]);

  if (!isOpen) return null;

  const errorMsg = localError || externalError;
  const hasSections = sections?.length > 0;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white dark:bg-[#1D212C] w-full max-w-5xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-slide-up border border-zinc-200 dark:border-[#2A2F3D]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* ── Header ── */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/80 dark:bg-[#161922] shrink-0">
          <h2 id="modal-title" className="text-[13.6px] font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:text-[#6B7184] dark:hover:text-[#E6E8EE] hover:bg-zinc-200 dark:hover:bg-[#222736] rounded-lg transition-colors active:scale-95"
          >
            <X size={17} strokeWidth={2.5} />
          </button>
        </div>

        {/* ── Body ── */}
        {loading ? (
          <div className="flex items-center justify-center py-16 bg-white dark:bg-[#1D212C]">
            <Loader2 size={24} className="animate-spin text-zinc-400 dark:text-[#A0A6B5]" />
            <span className="ml-3 text-sm text-zinc-500 dark:text-[#A0A6B5]">Loading details...</span>
          </div>
        ) : (
          <form
            id="update-modal-form"
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 overflow-y-auto bg-white dark:bg-[#1D212C] px-6 py-5">
              {/* Error banner */}
              {errorMsg && (
                <div className="mb-4 p-3 bg-rose-50 dark:bg-[#F0616D]/15 border border-rose-200 dark:border-[#F0616D]/30 rounded-lg text-sm text-rose-700 dark:text-[#F0616D] animate-fade-in">
                  {errorMsg}
                </div>
              )}

              {hasSections ? (
                /* ── Sectioned layout (new) ── */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                  {sections.map((section, sIdx) => {
                    const visibleFields = (section.fields || []).filter(field => {
                      const isHidden = typeof field.hidden === 'function' ? field.hidden(formData) : field.hidden;
                      return !isHidden;
                    });
                    if (visibleFields.length === 0) return null;
                    
                    return (
                      <div key={sIdx} className="space-y-4">
                        {/* Section heading */}
                        <h3 className="text-xs font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider pb-2 border-b border-zinc-100 dark:border-[#2A2F3D]">
                          {section.title}
                        </h3>
                        {/* Section fields grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                          {visibleFields.map((field) => (
                            <FieldRenderer
                              key={field.key}
                              field={field}
                              value={formData[field.key]}
                              onChange={handleChange}
                              error={fieldErrors[field.key]}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* ── Flat fields layout (legacy, backward-compatible) ── */
                <div
                  className={`grid grid-cols-1 gap-x-4 ${
                    allFields.length > 8
                      ? 'md:grid-cols-3 gap-y-2.5'
                      : 'md:grid-cols-2 gap-y-4'
                  }`}
                >
                  {allFields.map((field) => {
                    const isHidden = typeof field.hidden === 'function' ? field.hidden(formData) : field.hidden;
                    if (isHidden) return null;
                    return (
                      <FieldRenderer
                        key={field.key}
                        field={field}
                        value={formData[field.key]}
                        onChange={handleChange}
                        error={fieldErrors[field.key]}
                        legacyLargeForm={allFields.length > 8}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/80 dark:bg-[#161922] px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2 text-[10.8px] font-semibold text-zinc-700 dark:text-[#E6E8EE] hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-[#222736] bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-md transition-all active:scale-95"
              >
                {cancelLabel}
              </button>
              <button
                type="submit"
                form="update-modal-form"
                disabled={isSubmitting || submitting || !isDirty}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 text-[10.8px] font-semibold text-white bg-zinc-900 dark:bg-[#4C8DFF] hover:bg-zinc-800 dark:hover:bg-[#6AA1FF] rounded-md transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmitting || submitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={15} strokeWidth={2.5} />
                    {submitLabel}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   FieldRenderer — renders a single field based on its type config.
   Internal component, not exported.
────────────────────────────────────────────────────────────────────────── */
function FieldRenderer({ field, value, onChange, error, legacyLargeForm = false }) {
  const inputClass =
    'w-full h-9 px-3 bg-zinc-50 dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] font-medium text-zinc-900 dark:text-[#E6E8EE] focus:bg-white dark:focus:bg-[#161922] focus:border-zinc-900 dark:focus:border-[#4C8DFF] focus:ring-0 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-[#6B7184] placeholder:font-normal';

  // Span override: 'full' means md:col-span-2
  const spanClass = field.span === 'full' ? 'md:col-span-2' : '';

  // Checkbox / boolean — special layout
  if (field.type === 'boolean') {
    const boolSpanClass = legacyLargeForm ? 'col-span-1 pt-5 flex flex-col justify-end' : `md:col-span-2 ${spanClass}`;
    return (
      <div className={`space-y-1 min-w-0 flex items-end pb-1 ${boolSpanClass}`}>
        <div>
          <label className="flex items-center gap-2.5 cursor-pointer group w-max">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(field.key, e.target.checked, field)}
              disabled={field.disabled}
              className="w-4 h-4 rounded border-zinc-300 dark:border-[#2A2F3D] dark:bg-[#161922] text-zinc-900 dark:text-[#4C8DFF] focus:ring-0 focus:ring-offset-0 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-[10.4px] font-bold text-zinc-700 dark:text-[#E6E8EE] select-none group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
              {field.label}
              {field.required && <span className="text-rose-500 ml-0.5">*</span>}
            </span>
          </label>
          {error && <p className="text-[9px] text-rose-600 dark:text-[#F0616D] mt-1">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-1.5 min-w-0 ${spanClass}`}>
      <label className="text-[9.6px] font-semibold text-zinc-700 dark:text-[#A0A6B5] block">
        {field.label}
        {field.required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>

      {field.type === 'info' ? (
        <div className="w-full h-9 px-3 py-2 bg-zinc-50 dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] font-medium text-zinc-700 dark:text-[#E6E8EE] flex items-center overflow-hidden text-ellipsis whitespace-nowrap">
          {value ?? '—'}
        </div>
      ) : field.type === 'select' ? (
        <CustomSelect
          value={value ?? ''}
          onChange={(e) => onChange(field.key, e.target.value, field)}
          required={field.required}
          disabled={field.disabled}
          isLoading={field.isLoading}
          options={field.options || []}
          placeholder="— Select —"
          buttonClassName={`${inputClass} flex items-center justify-between ${field.disabled ? 'opacity-60 cursor-not-allowed bg-zinc-100 dark:bg-[#1D212C]' : ''}`}
        />
      ) : field.type === 'textarea' ? (
        <textarea
          value={value ?? ''}
          onChange={(e) => onChange(field.key, e.target.value, field)}
          required={field.required}
          rows={field.rows || 3}
          placeholder={field.placeholder || ''}
          maxLength={field.maxLength}
          disabled={field.disabled}
          className={`${inputClass} h-auto py-2 resize-none ${field.disabled ? 'opacity-60 cursor-not-allowed bg-zinc-100 dark:bg-[#1D212C]' : ''}`}
        />
      ) : (
        <input
          type={
            field.type === 'number'   ? 'number'
            : field.type === 'date'   ? 'date'
            : field.type === 'email'  ? 'email'
            : field.type === 'tel'    ? 'tel'
            : field.type === 'password' ? 'password'
            : 'text'
          }
          value={value ?? ''}
          onChange={(e) => onChange(field.key, e.target.value, field)}
          required={field.required}
          placeholder={field.placeholder || ''}
          pattern={field.pattern}
          title={field.title}
          maxLength={field.maxLength}
          min={field.min}
          max={field.max}
          step={field.type === 'number' ? (field.step ?? '0.01') : undefined}
          disabled={field.disabled}
          className={`${inputClass} ${field.uppercase ? 'uppercase placeholder:normal-case' : ''} ${field.disabled ? 'opacity-60 cursor-not-allowed bg-zinc-100 dark:bg-[#1D212C]' : ''}`}
        />
      )}
      {error && <p className="text-[9px] text-rose-600 dark:text-[#F0616D]">{error}</p>}
    </div>
  );
}
