import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import { getAllFeatures } from '../../../api/sso/feature';

const ACTION_OPTIONS = [
  'READ',
  'CREATE',
  'UPDATE',
  'WRITE',
  'DELETE',
  'APPROVE',
  'REJECT',
  'RETURN',
  'DELEGATE',
  'CANCEL',
  'ACTIVATE',
  'DEACTIVATE',
  'EXPORT',
];

export default function PermissionFormModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    featureCode: '',
    action: 'READ',
    description: '',
    active: true,
  });

  const [features, setFeatures] = useState([]);
  const [isLoadingFeatures, setIsLoadingFeatures] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        featureCode: '',
        action: 'READ',
        description: '',
        active: true,
      });
      setErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchFeatures = async () => {
      if (!isOpen) return;
      setIsLoadingFeatures(true);
      try {
        const data = await getAllFeatures();
        setFeatures(data || []);
      } catch (err) {
        console.error('Failed to load features:', err);
      } finally {
        setIsLoadingFeatures(false);
      }
    };
    fetchFeatures();
  }, [isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!formData.featureCode) newErrors.featureCode = 'Feature Code is required';
    if (!formData.action) newErrors.action = 'Action is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        featureCode: formData.featureCode,
        action: formData.action,
        description: formData.description,
        active: formData.active
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 dark:bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#161922] rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-zinc-200 dark:border-[#2A2F3D]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-[#2A2F3D]">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-[#E6E8EE]">
            Create New Permission
          </h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-zinc-400 dark:text-[#A0A6B5] hover:text-zinc-600 dark:hover:text-[#E6E8EE] rounded-full hover:bg-zinc-100 dark:hover:bg-[#222736] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-[#E6E8EE] mb-1">
              Feature Code <span className="text-rose-500">*</span>
            </label>
            <select
              name="featureCode"
              value={formData.featureCode}
              onChange={handleChange}
              disabled={isLoadingFeatures}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white dark:bg-[#1D212C] text-zinc-900 dark:text-[#E6E8EE] ${
                errors.featureCode ? 'border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20' : 'border-zinc-300 dark:border-[#2A2F3D]'
              }`}
            >
              <option value="">
                {isLoadingFeatures ? 'Loading features...' : 'Select a feature'}
              </option>
              {features.map(f => (
                <option key={f.id} value={f.code}>
                  {f.name} ({f.code})
                </option>
              ))}
            </select>
            {errors.featureCode && (
              <p className="mt-1 text-sm text-rose-500 flex items-center gap-1">
                <AlertTriangle size={14} /> {errors.featureCode}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-[#E6E8EE] mb-1">
              Action <span className="text-rose-500">*</span>
            </label>
            <select
              name="action"
              value={formData.action}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white dark:bg-[#1D212C] text-zinc-900 dark:text-[#E6E8EE] ${
                errors.action ? 'border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20' : 'border-zinc-300 dark:border-[#2A2F3D]'
              }`}
            >
              {ACTION_OPTIONS.map((actionOption) => (
                <option key={actionOption} value={actionOption}>
                  {actionOption}
                </option>
              ))}
            </select>
            {errors.action && <p className="mt-1 text-sm text-rose-500">{errors.action}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-[#E6E8EE] mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what this permission allows..."
              rows={3}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-[#2A2F3D] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none bg-white dark:bg-[#1D212C] text-zinc-900 dark:text-[#E6E8EE] placeholder:text-zinc-400 dark:placeholder:text-[#6B7184]"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="active"
              name="active"
              checked={formData.active}
              onChange={handleChange}
              className="w-4 h-4 text-indigo-600 dark:text-primary border-zinc-300 dark:border-[#2A2F3D] rounded focus:ring-primary/20 bg-white dark:bg-[#1D212C]"
            />
            <label htmlFor="active" className="text-sm font-medium text-zinc-700 dark:text-[#E6E8EE]">
              Active Permission
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-[#A0A6B5] hover:text-zinc-900 dark:hover:text-[#E6E8EE] hover:bg-zinc-100 dark:hover:bg-[#222736] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-primary hover:bg-zinc-800 dark:hover:bg-primary-600 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Create Permission
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
