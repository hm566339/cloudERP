import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Globe, Layers, AlertCircle, Copy, Key, CheckCircle2 } from 'lucide-react';
import { createModule, updateModule } from '../../../api/sso/module';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { copyToClipboard } from '../../../utils/clipboard';

export default function ModuleFormModal({ isOpen, onClose, initialData = null, onSuccess }) {
  const isEdit = !!initialData;
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [newCredentials, setNewCredentials] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      name: '',
      host: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          name: initialData.name || '',
          host: initialData.host || ''
        });
      } else {
        reset({
          name: '',
          host: ''
        });
      }
      setNewCredentials(null);
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      if (isEdit) {
        await updateModule(initialData.id, { name: data.name, host: data.host });
        dispatch(addAlert({ type: 'success', message: 'Module updated successfully' }));
        onSuccess?.();
        onClose();
      } else {
        const result = await createModule({ name: data.name, host: data.host });
        dispatch(addAlert({ type: 'success', message: 'Module created successfully' }));
        // Display credentials directly from the response
        setNewCredentials(result);
        onSuccess?.();
      }
    } catch (error) {
      dispatch(addAlert({ 
        type: 'error', 
        message: error?.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} module` 
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text, label) => {
    try {
      await copyToClipboard(text);
      dispatch(addAlert({ type: 'success', message: `${label} copied to clipboard` }));
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: `Failed to copy ${label}` }));
    }
  };

  const handleClose = () => {
    onClose();
    setNewCredentials(null);
  };

  if (!isOpen) return null;

  const loadingState = isLoading || isSubmitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#161922] rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-up border border-zinc-200 dark:border-[#2A2F3D]">
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-[#2A2F3D]">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${newCredentials ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'}`}>
              {newCredentials ? <CheckCircle2 size={20} /> : <Layers size={20} />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-[#E6E8EE]">
                {newCredentials ? 'Module Created Successfully' : (isEdit ? 'Edit Module' : 'Create Module')}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-[#A0A6B5]">
                {newCredentials ? 'Please securely save the generated credentials' : (isEdit ? 'Update existing module details' : 'Add a new application module')}
              </p>
            </div>
          </div>
          {!newCredentials && (
            <button 
              onClick={handleClose}
              className="p-2 text-zinc-400 dark:text-[#A0A6B5] hover:text-zinc-600 dark:hover:text-[#E6E8EE] hover:bg-zinc-100 dark:hover:bg-[#222736] rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {!newCredentials ? (
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-[#E6E8EE] mb-1.5 uppercase tracking-wider">
                Module Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  {...register('name', { 
                    required: 'Module name is required',
                    setValueAs: v => v?.trim()
                  })}
                  placeholder="e.g. Human Resources"
                  className={`input-field pl-10 ${errors.name ? 'border-rose-300 focus:ring-rose-200' : ''}`}
                  autoFocus
                />
                <Layers size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-[#6B7184]" />
              </div>
              {errors.name && (
                <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-[#E6E8EE] mb-1.5 uppercase tracking-wider">
                Host URL <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  {...register('host', { 
                    required: 'Host URL is required',
                    validate: (value) => {
                      if (!value) return true;
                      try {
                        const url = new URL(value);
                        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                          return 'URL must start with http:// or https://';
                        }
                        return true;
                      } catch (e) {
                        return 'Please enter a valid URL';
                      }
                    },
                    setValueAs: v => v?.trim()
                  })}
                  placeholder="e.g. https://hr.example.com"
                  className={`input-field pl-10 ${errors.host ? 'border-rose-300 focus:ring-rose-200' : ''}`}
                />
                <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-[#6B7184]" />
              </div>
              {errors.host && (
                <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.host.message}
                </p>
              )}
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-[#A0A6B5]">The primary endpoint where this module is hosted.</p>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-[#2A2F3D] flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loadingState}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loadingState}
                className="btn-primary"
              >
                {loadingState ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Module' : 'Create Module')}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6">
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-zinc-50 dark:bg-[#1D212C] rounded-xl border border-zinc-200/60 dark:border-[#2A2F3D] space-y-4">
                <div>
                  <label className="text-[8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider block mb-1">Client ID</label>
                  <div className="flex items-center justify-between gap-3">
                    <code className="text-sm font-mono font-semibold text-zinc-700 dark:text-[#E6E8EE] truncate">
                      {newCredentials.clientId}
                    </code>
                    <button onClick={() => handleCopy(newCredentials.clientId, 'Client ID')} className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-[#E6E8EE] bg-white dark:bg-[#161922] shadow-sm border border-zinc-200 dark:border-[#2A2F3D] rounded-md transition-colors shrink-0">
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider block mb-1">Client Secret</label>
                  <div className="flex items-center justify-between gap-3">
                    <code className="text-sm font-mono font-semibold text-zinc-700 dark:text-[#E6E8EE] truncate">
                      {newCredentials.clientSecret}
                    </code>
                    <button onClick={() => handleCopy(newCredentials.clientSecret, 'Client Secret')} className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-[#E6E8EE] bg-white dark:bg-[#161922] shadow-sm border border-zinc-200 dark:border-[#2A2F3D] rounded-md transition-colors shrink-0">
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-lg">
                <p className="text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <Key size={14} className="shrink-0" />
                  Save these credentials now. You will not be able to see the secret again.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-[#2A2F3D] flex justify-end">
              <button onClick={handleClose} className="btn-primary w-full justify-center">
                I have saved the credentials
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
