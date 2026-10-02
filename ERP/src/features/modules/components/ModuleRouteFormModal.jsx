import React, { useEffect, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { X, Network, AlertCircle, Hash, Globe, Layers, Link } from 'lucide-react';
import { createModuleRoute, updateModuleRoute } from '../../../api/sso';
import { useGetModulesQuery } from '../../../api/sso';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import CustomSelect from '../../../components/common/CustomSelect';

export default function ModuleRouteFormModal({ isOpen, onClose, initialData = null, onSuccess }) {
  const isEdit = !!initialData;
  const dispatch = useAppDispatch();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { data: modulesData, isLoading: modulesLoading } = useGetModulesQuery({ page: 0, pageSize: 100 });

  const moduleOptions = useMemo(() => {
    return (modulesData?.modules || []).map(m => ({
      value: m.id,
      label: m.name
    }));
  }, [modulesData]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      moduleId: '',
      apiPattern: '',
      serviceUrl: '',
      routeOrder: 0,
      active: true
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          moduleId: initialData.moduleId || initialData.module_id || initialData.module?.id || '',
          apiPattern: initialData.apiPattern || '',
          serviceUrl: initialData.serviceUrl || '',
          routeOrder: initialData.routeOrder ?? 0,
          active: initialData.active ?? true
        });
      } else {
        reset({
          moduleId: '',
          apiPattern: '',
          serviceUrl: '',
          routeOrder: 0,
          active: true
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (data) => {
    setIsProcessing(true);
    try {
      const payload = { 
        ...data, 
        routeOrder: parseInt(data.routeOrder, 10) || 0 
      };
      if (isEdit) {
        await updateModuleRoute(initialData.id, payload);
        dispatch(addAlert({ type: 'success', message: 'Module route updated successfully' }));
        onSuccess?.();
      } else {
        await createModuleRoute(payload);
        dispatch(addAlert({ type: 'success', message: 'Module route created successfully' }));
        onSuccess?.();
      }
      onClose();
    } catch (error) {
      dispatch(addAlert({ 
        type: 'error', 
        message: error?.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} module route` 
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const isLoading = isProcessing;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
        <div className="flex justify-between items-center p-6 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Network size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">
                {isEdit ? 'Edit Module Route' : 'Create Module Route'}
              </h2>
              <p className="text-xs text-zinc-500">
                {isEdit ? 'Update existing API route mapping' : 'Add a new API route mapping'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
              Module <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Controller
                control={control}
                name="moduleId"
                rules={{ required: 'Module is required' }}
                render={({ field }) => (
                  <CustomSelect
                    value={field.value}
                    onChange={(e) => field.onChange(e?.target?.value !== undefined ? e.target.value : e)}
                    options={moduleOptions}
                    placeholder="Select a Module"
                    isLoading={modulesLoading}
                    buttonClassName={`input-field pl-10 text-left ${errors.moduleId ? 'border-rose-300 focus:ring-rose-200' : ''}`}
                  />
                )}
              />
              <Layers size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none z-10" />
            </div>
            {errors.moduleId && (
              <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.moduleId.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
              API Pattern <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                {...register('apiPattern', { 
                  required: 'API Pattern is required',
                  setValueAs: v => v?.trim()
                })}
                placeholder="e.g. /api/hr/*"
                className={`input-field pl-10 ${errors.apiPattern ? 'border-rose-300 focus:ring-rose-200' : ''}`}
              />
              <Link size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>
            {errors.apiPattern && (
              <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.apiPattern.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
              Service URL <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                {...register('serviceUrl', { 
                  required: 'Service URL is required',
                  setValueAs: v => v?.trim()
                })}
                placeholder="e.g. http://hr-service:8080"
                className={`input-field pl-10 ${errors.serviceUrl ? 'border-rose-300 focus:ring-rose-200' : ''}`}
              />
              <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>
            {errors.serviceUrl && (
              <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.serviceUrl.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
                Route Order
              </label>
              <div className="relative">
                <input
                  type="number"
                  {...register('routeOrder')}
                  className="input-field pl-10"
                />
                <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
                Status
              </label>
              <div className="flex items-center h-[33.6px]">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" {...register('active')} className="sr-only peer" />
                  <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1.6px] after:left-[1.6px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  <span className="ml-3 text-sm font-medium text-zinc-700">Active</span>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || modulesLoading}
              className="btn-primary"
            >
              {isLoading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Route')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
