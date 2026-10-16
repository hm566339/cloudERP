import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, Box, ShieldCheck, Globe } from 'lucide-react';

export default function FeatureFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  availableModules = []
}) {
  const isEditMode = Boolean(initialData && (initialData.id || initialData.code));

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    moduleName: '',
    active: true
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          code: initialData.code || '',
          name: initialData.name || '',
          description: initialData.description || '',
          moduleName: initialData.moduleName || '',
          active: initialData.active !== false
        });
      } else {
        setFormData({
          code: '',
          name: '',
          description: '',
          moduleName: availableModules[0] || '',
          active: true
        });
      }
      setErrors({});
      setSubmitError(null);
    }
  }, [isOpen, initialData, availableModules]);

  const validate = () => {
    const newErrors = {};
    const trimmedCode = (formData.code || '').trim();
    const trimmedName = (formData.name || '').trim();
    const trimmedModuleName = (formData.moduleName || '').trim();

    if (!trimmedModuleName) {
      newErrors.moduleName = 'Module Name is required';
    }

    if (!trimmedName) {
      newErrors.name = 'Feature Name is required';
    }

    if (!trimmedCode) {
      newErrors.code = 'Feature Code is required';
    } else if (!/^[A-Za-z0-9_]+$/.test(trimmedCode)) {
      newErrors.code = 'Code must contain only letters, numbers, and underscores (e.g. PAYMENTS)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (submitError) {
      setSubmitError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        moduleName: formData.moduleName.trim(),
        active: Boolean(formData.active)
      };

      if (isEditMode) {
        payload.id = initialData?.id || initialData?.featureId || initialData?.code;
      }

      await onSubmit(payload);
    } catch (error) {
      console.error('Failed to save feature:', error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.message ||
        'Failed to save feature. Please try again.';
      setSubmitError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              {isEditMode ? 'Edit Global Feature' : 'Create Global Feature'}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isEditMode
                ? 'Update global feature definition and catalog properties.'
                : 'Define a platform-level feature accessible across all tenants.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Global Master Data Banner */}
        <div className="mx-6 mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center gap-2.5 text-xs font-medium text-indigo-900">
          <Globe size={16} className="text-indigo-600 shrink-0" />
          <span>Global System Feature — Available to all organizations and companies</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-4">
          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-700">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <div className="flex-1">{submitError}</div>
            </div>
          )}

          {/* Module */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
              Module <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="moduleName"
                list="feature-module-options"
                value={formData.moduleName}
                onChange={handleChange}
                placeholder="e.g. ACCOUNT, CORE, SSO..."
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10/20 focus:border-zinc-400 transition-colors ${
                  errors.moduleName ? 'border-rose-300 bg-rose-50/50' : 'border-zinc-300'
                }`}
              />
              <datalist id="feature-module-options">
                {availableModules.map((mod) => (
                  <option key={mod} value={mod} />
                ))}
              </datalist>
            </div>
            {errors.moduleName ? (
              <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                <AlertTriangle size={12} /> {errors.moduleName}
              </p>
            ) : availableModules.length > 0 ? (
              <p className="mt-1 text-[11px] text-zinc-400">
                Select an existing module or specify a new module name.
              </p>
            ) : null}
          </div>

          {/* Feature Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
              Feature Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Payment Operations"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10/20 focus:border-zinc-400 transition-colors ${
                errors.name ? 'border-rose-300 bg-rose-50/50' : 'border-zinc-300'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                <AlertTriangle size={12} /> {errors.name}
              </p>
            )}
          </div>

          {/* Feature Code */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
              Feature Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={(e) =>
                handleChange({
                  target: {
                    name: 'code',
                    value: e.target.value.toUpperCase().replace(/\s+/g, '_')
                  }
                })
              }
              placeholder="e.g. PAYMENTS"
              disabled={isEditMode}
              className={`w-full px-3 py-2 text-sm border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900/10/20 focus:border-zinc-400 transition-colors ${
                isEditMode
                  ? 'bg-zinc-100 text-zinc-500 border-zinc-200 cursor-not-allowed'
                  : errors.code
                  ? 'border-rose-300 bg-rose-50/50'
                  : 'border-zinc-300'
              }`}
            />
            {errors.code ? (
              <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                <AlertTriangle size={12} /> {errors.code}
              </p>
            ) : isEditMode ? (
              <p className="mt-1 text-[11px] text-zinc-400">
                Feature code is a unique identifier and cannot be modified.
              </p>
            ) : null}
          </div>

          {/* Defined Actions */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
              Actions
            </label>
            <div className="flex items-center gap-2 p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg">
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-700 border border-blue-200">
                READ
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
                WRITE
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-rose-100 text-rose-700 border border-rose-200">
                DELETE
              </span>
              <span className="text-[11px] text-zinc-500 ml-auto">
                Standard platform actions
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
              Description <span className="text-zinc-400 font-normal normal-case">(Optional)</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Provide context or purpose for this system feature..."
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10/20 focus:border-zinc-400 transition-colors resize-none text-zinc-800 placeholder:text-zinc-400"
            />
          </div>

          {/* Active Toggle */}
          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
            <div>
              <label htmlFor="feature-active" className="text-xs font-semibold text-zinc-800 block cursor-pointer">
                Active Status
              </label>
              <p className="text-[11px] text-zinc-500">
                Active features are available for role and user permission assignments.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="feature-active"
                name="active"
                checked={formData.active}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Auto-provision note (create only) */}
          {!isEditMode && (
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-start gap-2.5 text-xs text-indigo-700">
              <ShieldCheck size={15} className="shrink-0 mt-0.5" />
              <span>
                On create, the standard permissions (<span className="font-semibold">READ</span>,{' '}
                <span className="font-semibold">WRITE</span>,{' '}
                <span className="font-semibold">DELETE</span>) are auto-provisioned for this feature so
                role and user permission sync remains compatible.
              </span>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed min-w-[130px] justify-center"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              <span>{isEditMode ? 'Update Feature' : 'Create Feature'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
