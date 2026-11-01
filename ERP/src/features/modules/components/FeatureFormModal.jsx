import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Save, AlertTriangle, ShieldCheck, Globe, Plus, ChevronDown } from 'lucide-react';
import { CANONICAL_ACTIONS, ACTION_COLOR_MAP } from '../constants/featureActions';

export { CANONICAL_ACTIONS, ACTION_COLOR_MAP };

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
    active: true,
    actions: ['READ', 'WRITE', 'DELETE']
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const loadedActions = Array.isArray(initialData.actions) && initialData.actions.length > 0
          ? initialData.actions
          : ['READ', 'WRITE', 'DELETE'];
        setFormData({
          code: initialData.code || '',
          name: initialData.name || '',
          description: initialData.description || '',
          moduleName: initialData.moduleName || '',
          active: initialData.active !== false,
          actions: [...loadedActions]
        });
      } else {
        setFormData({
          code: '',
          name: '',
          description: '',
          moduleName: availableModules[0] || '',
          active: true,
          actions: ['READ', 'WRITE', 'DELETE']
        });
      }
      setErrors({});
      setSubmitError(null);
      setIsDropdownOpen(false);
    }
  }, [isOpen, initialData, availableModules]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const availableActions = useMemo(() => {
    const currentSet = new Set((formData.actions || []).map((a) => String(a).toUpperCase()));
    return CANONICAL_ACTIONS.filter((act) => !currentSet.has(act));
  }, [formData.actions]);

  const handleAddAction = (actionToAdd) => {
    if (!actionToAdd) return;
    const upper = actionToAdd.toUpperCase();
    setFormData((prev) => {
      if ((prev.actions || []).includes(upper)) return prev;
      return {
        ...prev,
        actions: [...(prev.actions || []), upper]
      };
    });
    if (errors.actions) {
      setErrors((prev) => ({ ...prev, actions: undefined }));
    }
  };

  const handleRemoveAction = (actionToRemove) => {
    setFormData((prev) => ({
      ...prev,
      actions: (prev.actions || []).filter((a) => a !== actionToRemove)
    }));
    if (errors.actions) {
      setErrors((prev) => ({ ...prev, actions: undefined }));
    }
  };

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

    if (!formData.actions || formData.actions.length === 0) {
      newErrors.actions = 'At least one action is required for this feature';
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
        active: Boolean(formData.active),
        actions: formData.actions
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#161922] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-zinc-200 dark:border-[#2A2F3D]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-[#E6E8EE]">
              {isEditMode ? 'Edit Global Feature' : 'Create Global Feature'}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] mt-0.5">
              {isEditMode
                ? 'Update global feature definition, supported actions, and catalog properties.'
                : 'Define a platform-level feature accessible across all tenants.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-zinc-400 dark:text-[#A0A6B5] hover:text-zinc-600 dark:hover:text-[#E6E8EE] rounded-lg hover:bg-zinc-100 dark:hover:bg-[#222736] transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Global Master Data Banner */}
        <div className="mx-6 mt-4 p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-lg flex items-center gap-2.5 text-xs font-medium text-indigo-900 dark:text-indigo-300">
          <Globe size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>Global System Feature — Available to all organizations and companies</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-4">
          {submitError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-lg flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-400">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <div className="flex-1">{submitError}</div>
            </div>
          )}

          {/* Module */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] uppercase tracking-wider mb-1.5">
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
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white dark:bg-[#1D212C] text-zinc-900 dark:text-[#E6E8EE] placeholder:text-zinc-400 dark:placeholder:text-[#6B7184] ${
                  errors.moduleName ? 'border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20' : 'border-zinc-300 dark:border-[#2A2F3D]'
                }`}
              />
              <datalist id="feature-module-options">
                {availableModules.map((mod) => (
                  <option key={mod} value={mod} />
                ))}
              </datalist>
            </div>
            {errors.moduleName ? (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <AlertTriangle size={12} /> {errors.moduleName}
              </p>
            ) : availableModules.length > 0 ? (
              <p className="mt-1 text-[11px] text-zinc-400 dark:text-[#6B7184]">
                Select an existing module or specify a new module name.
              </p>
            ) : null}
          </div>

          {/* Feature Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] uppercase tracking-wider mb-1.5">
              Feature Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Payment Operations"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white dark:bg-[#1D212C] text-zinc-900 dark:text-[#E6E8EE] placeholder:text-zinc-400 dark:placeholder:text-[#6B7184] ${
                errors.name ? 'border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20' : 'border-zinc-300 dark:border-[#2A2F3D]'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <AlertTriangle size={12} /> {errors.name}
              </p>
            )}
          </div>

          {/* Feature Code */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] uppercase tracking-wider mb-1.5">
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
              className={`w-full px-3 py-2 text-sm border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                isEditMode
                  ? 'bg-zinc-100 dark:bg-[#161922] text-zinc-500 dark:text-[#6B7184] border-zinc-200 dark:border-[#2A2F3D] cursor-not-allowed'
                  : errors.code
                  ? 'border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20'
                  : 'bg-white dark:bg-[#1D212C] text-zinc-900 dark:text-[#E6E8EE] border-zinc-300 dark:border-[#2A2F3D]'
              }`}
            />
            {errors.code ? (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <AlertTriangle size={12} /> {errors.code}
              </p>
            ) : isEditMode ? (
              <p className="mt-1 text-[11px] text-zinc-400 dark:text-[#6B7184]">
                Feature code is a unique identifier and cannot be modified.
              </p>
            ) : null}
          </div>

          {/* Dynamic Actions Management */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] uppercase tracking-wider">
                Actions <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-zinc-500 dark:text-[#A0A6B5]">
                {formData.actions.length} action{formData.actions.length !== 1 ? 's' : ''} assigned
              </span>
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg space-y-2.5">
              {/* Selected Action Badges with Remove (X) */}
              <div className="flex flex-wrap items-center gap-2">
                {formData.actions.length === 0 ? (
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 italic py-1">
                    No actions assigned. Click "+ Add Action" below to add supported actions.
                  </span>
                ) : (
                  formData.actions.map((action) => (
                    <span
                      key={action}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border shadow-sm transition-all ${
                        ACTION_COLOR_MAP[action] ||
                        'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      <span>{action}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAction(action)}
                        className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-current transition-colors"
                        title={`Remove ${action}`}
                        aria-label={`Remove ${action}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Add Action (+) Dropdown and Controls */}
              <div className="pt-2 border-t border-zinc-200/60 dark:border-[#2A2F3D] flex items-center justify-between gap-2">
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen((prev) => !prev)}
                    disabled={availableActions.length === 0}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      availableActions.length === 0
                        ? 'opacity-50 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700'
                        : 'bg-white dark:bg-[#161922] text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-300 shadow-sm'
                    }`}
                  >
                    <Plus size={14} className="shrink-0" />
                    <span>Add Action (+)</span>
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-150 ${isDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && availableActions.length > 0 && (
                    <div className="absolute left-0 bottom-full mb-1 w-52 max-h-60 overflow-y-auto rounded-lg bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] shadow-2xl z-30 py-1 divide-y divide-zinc-100 dark:divide-zinc-800">
                      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#A0A6B5] bg-zinc-50 dark:bg-[#161922]">
                        Available Actions ({availableActions.length})
                      </div>
                      <div className="py-1">
                        {availableActions.map((action) => (
                          <button
                            key={action}
                            type="button"
                            onClick={() => {
                              handleAddAction(action);
                              setIsDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-300 flex items-center justify-between transition-colors"
                          >
                            <span>{action}</span>
                            <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-medium">
                              + Add
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <span className="text-[11px] text-zinc-400 dark:text-[#6B7184]">
                  {availableActions.length === 0
                    ? 'All 13 actions assigned'
                    : `${availableActions.length} more action${availableActions.length !== 1 ? 's' : ''} available`}
                </span>
              </div>
            </div>

            {errors.actions && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <AlertTriangle size={12} /> {errors.actions}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] uppercase tracking-wider mb-1.5">
              Description <span className="text-zinc-400 dark:text-[#6B7184] font-normal normal-case">(Optional)</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              placeholder="Provide context or purpose for this system feature..."
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-[#2A2F3D] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none text-zinc-800 dark:text-[#E6E8EE] bg-white dark:bg-[#1D212C] placeholder:text-zinc-400 dark:placeholder:text-[#6B7184]"
            />
          </div>

          {/* Active Toggle */}
          <div className="pt-2 border-t border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between">
            <div>
              <label htmlFor="feature-active" className="text-xs font-semibold text-zinc-800 dark:text-[#E6E8EE] block cursor-pointer">
                Active Status
              </label>
              <p className="text-[11px] text-zinc-500 dark:text-[#A0A6B5]">
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
              <div className="w-10 h-5 bg-zinc-200 dark:bg-[#2A2F3D] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 dark:after:border-zinc-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Info note */}
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-lg flex items-start gap-2.5 text-xs text-indigo-700 dark:text-indigo-300">
            <ShieldCheck size={15} className="shrink-0 mt-0.5" />
            <span>
              {isEditMode
                ? 'Assigned actions determine the granular permissions available for role and user assignments. Newly added actions will be provisioned automatically.'
                : 'Selected actions are auto-provisioned as feature permissions so role and user access can be configured immediately.'}
            </span>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-[#A0A6B5] hover:text-zinc-900 dark:hover:text-[#E6E8EE] hover:bg-zinc-100 dark:hover:bg-[#222736] rounded-lg transition-colors disabled:opacity-50"
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
