import React, { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { useProductCategoryList } from '../../../api/inventory';

export default function ProductCategoryForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading 
}) {
  const [formData, setFormData] = useState({
    parentCategoryId: initialData?.parentCategoryId || '',
    name: initialData?.name || '',
    description: initialData?.description || '',
    isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
  });

  const [errors, setErrors] = useState({});

  const { productCategories } = useProductCategoryList({}, { page: 0, size: 500, sort: 'name,asc' });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        
        <div className="grid grid-cols-1 gap-4">
          {/* Parent Category */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Parent Category</label>
            <select
              name="parentCategoryId"
              value={formData.parentCategoryId}
              onChange={handleChange}
              className="w-full h-9 px-3 rounded-md border border-zinc-200 text-[10.4px] bg-white transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              autoFocus
            >
              <option value="">-- Top Level Category --</option>
              {productCategories?.filter(c => c.id !== initialData?.id).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
              Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full h-9 px-3 rounded-md border text-[10.4px] bg-white transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                errors.name ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
              }`}
            />
            {errors.name && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.name}
              </p>
            )}
          </div>

          {/* Code (Read-Only context in edit mode) */}
          {initialData?.code && (
            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Category Code (System Generated)</label>
              <input
                type="text"
                value={initialData.code}
                disabled
                className="w-full h-9 px-3 rounded-md border border-transparent bg-zinc-50 text-[10.4px] text-zinc-500 cursor-not-allowed"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full p-3 rounded-md border border-zinc-200 text-[10.4px] bg-white transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          {/* Is Active */}
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4 text-emerald-600 rounded border-zinc-300 focus:ring-emerald-600 focus:ring-2"
              />
              <span className="text-[10.4px] font-semibold text-zinc-700">Active</span>
            </label>
            <p className="text-[8.8px] text-zinc-500 mt-1 ml-6">
              Inactive categories cannot be assigned to new products.
            </p>
          </div>

        </div>
      </div>

      <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-zinc-100 bg-zinc-50/50 mt-auto shrink-0">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-[10.4px] font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 hover:text-zinc-900 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-[10.4px] font-semibold text-white bg-zinc-900 border border-transparent rounded-md hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {initialData ? 'Update Category' : 'Create Category'}
        </button>
      </div>
    </form>
  );
}
