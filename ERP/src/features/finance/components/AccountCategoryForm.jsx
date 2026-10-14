import React, { useState, useEffect } from 'react';
import CustomSelect from '../../../components/common/CustomSelect';
import { useApiMutation } from '../../../hooks/useApi';
import { accountCategoriesApi } from '../../../api/account/accountCategories';

export default function AccountCategoryForm({ initialData, onSubmit, onSuccess, onCancel, isLoading: externalLoading, serverError }) {
  const isEditing = !!(initialData?.id || initialData?.categoryId);
  const [formData, setFormData] = useState({
    name: '',
    nature: 'DEBIT'
  });

  const [errors, setErrors] = useState({});

  const { mutate: createCategory, isLoading: isCreating } = useApiMutation(accountCategoriesApi.create);
  const { mutate: updateCategory, isLoading: isUpdating } = useApiMutation(accountCategoriesApi.update);
  const isLoading = externalLoading || isCreating || isUpdating;

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        nature: initialData.nature || 'DEBIT'
      });
    } else {
      setFormData({
        name: '',
        nature: 'DEBIT'
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Category Name is required';
    }
    if (!formData.nature) {
      newErrors.nature = 'Nature is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    // Construct request body: { name, nature } - DO NOT send code field as backend auto-generates it
    const payload = {
      name: formData.name.trim(),
      nature: formData.nature
    };
    
    if (typeof onSubmit === 'function') {
      onSubmit({ data: payload }, resetForm);
    } else {
      if (isEditing) {
        const id = initialData?.id || initialData?.categoryId;
        updateCategory({ id, data: payload }, {
          onSuccess: (res) => {
            resetForm();
            onSuccess?.(res?.data || res);
          },
          onError: (err) => {
            const msg = err?.response?.data?.message || err?.message || 'Failed to update category';
            setErrors(prev => ({ ...prev, form: msg }));
          }
        });
      } else {
        createCategory({ data: payload }, {
          onSuccess: (res) => {
            resetForm();
            onSuccess?.(res?.data || res);
          },
          onError: (err) => {
            const msg = err?.response?.data?.message || err?.message || 'Failed to create category';
            setErrors(prev => ({ ...prev, form: msg }));
          }
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nature: 'DEBIT'
    });
    setErrors({});
  };

  const displayError = serverError || errors.form;

  return (
    <>
      <form id="account-category-form" onSubmit={handleSubmit} className="flex flex-col gap-y-4">
        {displayError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700">
            {displayError}
          </div>
        )}

        {/* Category Name */}
        <div className="space-y-1 w-full">
          <label className="text-[10.4px] font-semibold text-zinc-700">
            Category Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={isLoading}
            className={`w-full h-9 px-3 bg-white border rounded-lg text-[10.4px] font-medium text-zinc-800 outline-none transition-colors ${
              errors.name ? 'border-red-500 focus:border-red-500' : 'border-zinc-200 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10'
            } disabled:bg-zinc-50 disabled:text-zinc-500`}
            placeholder="e.g. Cash Account"
          />
          {errors.name && <p className="text-red-500 text-xs mt-0.5">{errors.name}</p>}
        </div>

        {/* Nature */}
        <div className="space-y-1 w-full">
          <CustomSelect
            label={
              <>
                Accounting Nature <span className="text-red-500">*</span>
              </>
            }
            value={formData.nature}
            options={[
              { value: 'DEBIT', label: 'DEBIT' },
              { value: 'CREDIT', label: 'CREDIT' }
            ]}
            onChange={(e) => handleSelectChange('nature', e.target.value)}
            error={errors.nature}
            searchable={false}
          />
        </div>
      </form>

      {/* Footer Buttons */}
      <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-zinc-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-5 py-2 text-[10.4px] font-bold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200/50 bg-white border border-zinc-300 rounded-md transition-all active:scale-95 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="account-category-form"
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-5 py-2 text-[10.4px] font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-all active:scale-95 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              <span>Saving...</span>
            </>
          ) : (
            <span>{isEditing ? 'Update Category' : 'Create Category'}</span>
          )}
        </button>
      </div>
    </>
  );
}
