import React, { useState, useMemo, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { accountCategoriesApi } from '../../../api/account/accountCategories';
import { accountGroupsApi } from '../../../api/account/accountGroups';
import CustomSelect from '../../../components/common/CustomSelect';
import AccountCategoryForm from './AccountCategoryForm';

export default function AccountGroupForm({ initialData, onSubmit, onSuccess, onCancel, isLoading: externalLoading }) {
  const isEditing = !!(initialData?.id || initialData?.groupId || initialData?.accountGroupId);
  const [formData, setFormData] = useState({
    categoryId: initialData?.categoryId || '',
    parentGroupId: initialData?.parentGroupId || '',
    code: initialData?.code || '',
    name: initialData?.name || '',
    ...initialData
  });

  useEffect(() => {
    setFormData({
      categoryId: initialData?.categoryId || '',
      parentGroupId: initialData?.parentGroupId || '',
      code: initialData?.code || '',
      name: initialData?.name || '',
      ...initialData
    });
    setErrors({});
  }, [initialData]);

  const [errors, setErrors] = useState({});
  const [groupSearchQuery, setGroupSearchQuery] = useState('');

  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [initialCategoryData, setInitialCategoryData] = useState(null);

  const [isParentGroupFormOpen, setIsParentGroupFormOpen] = useState(false);
  const [initialParentGroupData, setInitialParentGroupData] = useState(null);

  // Fetch Categories
  const { data: categoriesResponse, refetch: refetchCategories } = useApiQuery(accountCategoriesApi.getList);

  const { mutate: createCategory, isLoading: isCreatingCategory } = useApiMutation(accountCategoriesApi.create);

  const handleCreateCategorySubmit = (data) => {
    createCategory(data, {
      onSuccess: (res) => {
        setIsCategoryFormOpen(false);
        const createdCat = res?.data || data;
        setFormData(prev => ({ ...prev, categoryId: createdCat.id }));
        refetchCategories();
      }
    });
  };

  // Fetch Account Groups for Parent Group Dropdown
  const { data: groupsResponse, isFetching: isGroupsLoading, refetch: refetchGroups } = useApiQuery(
    accountGroupsApi.getList,
    { size: 50, searchKey: groupSearchQuery }
  );

  const { mutate: createGroup, isLoading: isCreatingGroup } = useApiMutation(accountGroupsApi.create);
  const { mutate: updateGroup, isLoading: isUpdatingGroup } = useApiMutation(accountGroupsApi.update);
  const isLoading = externalLoading || isCreatingGroup || isUpdatingGroup;

  const handleCreateParentGroupSubmit = (payload) => {
    // extract data if wrapped
    const data = payload?.data ? payload.data : payload;
    createGroup({ data }, {
      onSuccess: (res) => {
        setIsParentGroupFormOpen(false);
        const createdGroup = res?.data || data;
        setFormData(prev => ({ ...prev, parentGroupId: createdGroup.id }));
        refetchGroups();
      }
    });
  };

  const extractArray = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (res?.data && Array.isArray(res.data)) return res.data;
    if (res?.data?.data && Array.isArray(res.data.data)) return res.data.data;
    if (res?.data?.data?.data && Array.isArray(res.data.data.data)) return res.data.data.data;
    if (res?.data?.content && Array.isArray(res.data.content)) return res.content;
    if (res?.data?.data?.content && Array.isArray(res.data.data.content)) return res.data.data.content;
    if (res?.content && Array.isArray(res.content)) return res.content;
    if (res?.data && typeof res.data === 'object') {
      let arr = Object.values(res.data).find(val => Array.isArray(val));
      if (arr) return arr;
      if (res.data.data && typeof res.data.data === 'object') {
        arr = Object.values(res.data.data).find(val => Array.isArray(val));
        if (arr) return arr;
      }
    }
    return [];
  };

  const categoryOptions = useMemo(() => {
    const normalizedList = extractArray(categoriesResponse);
    return normalizedList.map(cat => ({
      value: cat.id,
      label: cat.name || cat.categoryName || cat.id
    }));
  }, [categoriesResponse]);

  const groupOptions = useMemo(() => {
    const normalizedList = extractArray(groupsResponse);

    const filteredList = isEditing
      ? normalizedList.filter(g => g.id !== initialData.id)
      : normalizedList;

    return [
      { value: '', label: 'None (Root Level)' },
      ...filteredList.map(g => ({
        value: g.id,
        label: g.code ? `${g.code} - ${g.name}` : (g.name || 'Unknown Group')
      }))
    ];
  }, [groupsResponse, isEditing, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value === 'null' ? '' : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.categoryId) newErrors.categoryId = 'Category is required';
    if (!formData.name?.trim()) newErrors.name = 'Group Name is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      categoryId: formData.categoryId,
      parentGroupId: formData.parentGroupId || null,
      code: formData.code ? formData.code.trim() : null,
      name: formData.name.trim()
    };

    if (typeof onSubmit === 'function') {
      onSubmit({ data: payload });
    } else {
      const isEditingGroup = !!(initialData?.id || initialData?.groupId || initialData?.accountGroupId);
      if (isEditingGroup) {
        const id = initialData.id || initialData.groupId || initialData.accountGroupId;
        updateGroup({ id, data: payload }, {
          onSuccess: (res) => {
            onSuccess?.(res?.data || res);
          },
          onError: (err) => {
            const msg = err?.response?.data?.message || err?.message || 'Failed to update account group';
            setErrors(prev => ({ ...prev, form: msg }));
          }
        });
      } else {
        createGroup({ data: payload }, {
          onSuccess: (res) => {
            onSuccess?.(res?.data || res);
          },
          onError: (err) => {
            const msg = err?.response?.data?.message || err?.message || 'Failed to create account group';
            setErrors(prev => ({ ...prev, form: msg }));
          }
        });
      }
    }
  };

  return (
    <>
      <form id="account-group-form" onSubmit={handleSubmit} className="flex flex-col gap-y-4">
        {errors.form && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700">
            {errors.form}
          </div>
        )}
        {/* Category */}
        <div className="space-y-1 w-full">
          <CustomSelect
            label="Category *"
            value={formData.categoryId}
            options={categoryOptions}
            searchable={true}
            onChange={(e) => handleSelectChange('categoryId', e.target.value)}
            error={errors.categoryId}
            bottomAction={({ searchTerm, closeDropdown }) => {
              return (
                <button
                  type="button"
                  onClick={() => {
                    closeDropdown();
                    setInitialCategoryData(searchTerm ? { categoryName: searchTerm } : null);
                    setIsCategoryFormOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 text-[10.4px] text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors flex items-center gap-2"
                >
                  <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Plus size={14} className="text-primary" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold truncate">Create {searchTerm ? `"${searchTerm}"` : 'New Category'}</span>
                    <span className="text-[8.8px] text-zinc-500">Add as new category</span>
                  </div>
                </button>
              );
            }}
          />
        </div>
        
        {/* Parent Group */}
        <div className="space-y-1 w-full">
          <CustomSelect
            label="Parent Group"
            value={formData.parentGroupId || ''}
            options={groupOptions}
            onChange={(e) => handleSelectChange('parentGroupId', e.target.value)}
            error={errors.parentGroupId}
            onSearch={setGroupSearchQuery}
            isLoading={isGroupsLoading}
            bottomAction={({ searchTerm, closeDropdown }) => {
              return (
                <button
                  type="button"
                  onClick={() => {
                    closeDropdown();
                    setInitialParentGroupData(searchTerm ? { name: searchTerm } : null);
                    setIsParentGroupFormOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 text-[10.4px] text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors flex items-center gap-2"
                >
                  <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Plus size={14} className="text-primary" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold truncate">Create {searchTerm ? `"${searchTerm}"` : 'New Parent Group'}</span>
                    <span className="text-[8.8px] text-zinc-500">Add as new parent group</span>
                  </div>
                </button>
              );
            }}
          />
        </div>

        {/* Group Code */}
        <div className="space-y-1 w-full">
          <label className="text-[10.4px] font-semibold text-zinc-700">Group Code</label>
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            className={`w-full h-9 px-3 bg-white border rounded-lg text-[10.4px] font-medium text-zinc-800 outline-none transition-colors ${
              errors.code ? 'border-red-500 focus:border-red-500' : 'border-zinc-200 focus:border-zinc-400'
            }`}
            placeholder="e.g. 1000"
          />
          {errors.code && <p className="text-red-500 text-xs mt-0.5">{errors.code}</p>}
        </div>
        
        {/* Group Name */}
        <div className="space-y-1 w-full">
          <label className="text-[10.4px] font-semibold text-zinc-700">Group Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full h-9 px-3 bg-white border rounded-lg text-[10.4px] font-medium text-zinc-800 outline-none transition-colors ${
              errors.name ? 'border-red-500 focus:border-red-500' : 'border-zinc-200 focus:border-zinc-400'
            }`}
            placeholder="e.g. Current Assets"
          />
          {errors.name && <p className="text-red-500 text-xs mt-0.5">{errors.name}</p>}
        </div>
      </form>

      {/* Footer - Fake sticky by absolute positioning since parent has relative if we did, or just simple mt */}
      {/* Wait, the parent wrapper in AccountGroups.jsx doesn't have a sticky footer div inside the modal! */}
      {/* I should add the sticky footer wrapper here, pulling it outside the form visually using negative margins or fixed position, but we can't because of overflow-auto. */}
      {/* Actually, it's fine. We just make the container relative and pin it. No, we can just put it at the end of the form. */}
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
          form="account-group-form"
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-5 py-2 text-[10.4px] font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-all active:scale-95 disabled:opacity-50"
        >
          {isLoading && <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />}
          {isEditing ? 'Update Group' : 'Create Group'}
        </button>
      </div>
      {isCategoryFormOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] rounded-md shadow-2xl flex flex-col overflow-hidden animate-slide-up border border-zinc-200">
            <div className="flex justify-between items-center px-5 py-4 border-b border-zinc-200 bg-zinc-50/80 shrink-0">
              <h2 className="text-base font-bold text-zinc-900 tracking-tight">Create Account Category</h2>
              <button 
                type="button" 
                onClick={() => setIsCategoryFormOpen(false)} 
                className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors active:scale-95"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar bg-white">
              <AccountCategoryForm
                initialData={initialCategoryData}
                onSubmit={handleCreateCategorySubmit}
                onCancel={() => setIsCategoryFormOpen(false)}
                isLoading={isCreatingCategory}
              />
            </div>
          </div>
        </div>
      )}

      {isParentGroupFormOpen && (
        <AccountGroupFormModal
          initialData={initialParentGroupData}
          onSubmit={handleCreateParentGroupSubmit}
          onCancel={() => setIsParentGroupFormOpen(false)}
          isLoading={isCreatingGroup}
        />
      )}
    </>
  );
}

export function AccountGroupFormModal({ initialData, onSubmit, onSuccess, onCancel, isLoading }) {
  // If we ever need to use it in a modal wrapper, it can be here
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg max-h-[90vh] rounded-md shadow-2xl flex flex-col overflow-hidden animate-slide-up border border-zinc-200">
        <div className="flex justify-between items-center px-5 py-4 border-b border-zinc-200 bg-zinc-50/80 shrink-0">
          <h2 className="text-base font-bold text-zinc-900 tracking-tight">
            {initialData ? 'Edit Account Group' : 'Create Account Group'}
          </h2>
          <button type="button" onClick={onCancel} className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors active:scale-95">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar bg-white">
          <AccountGroupForm initialData={initialData} onSubmit={onSubmit} onSuccess={onSuccess} onCancel={onCancel} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
