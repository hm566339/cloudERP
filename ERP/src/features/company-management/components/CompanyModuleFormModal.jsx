import React, { useEffect, useState } from 'react';
import Modal from '../../../components/common/Modal';
import CustomSelect from '../../../components/common/CustomSelect';
import { useGetCompaniesQuery, useGetModulesQuery } from '../../../api/sso';
import { createCompanyModule, updateCompanyModule } from '../../../api/sso/companyModules';

export default function CompanyModuleFormModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  editData = null 
}) {
  const isEdit = !!editData;
  const [formData, setFormData] = useState({
    company: '',
    module: '',
    active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch options
  const { data: companiesData, isLoading: loadingCompanies } = useGetCompaniesQuery({ page: 0, pageSize: 100 });
  const { data: modulesData, isLoading: loadingModules } = useGetModulesQuery({ page: 0, pageSize: 100 });

  const companyOptions = companiesData?.companies?.map(c => ({
    value: c.id,
    label: `${c.companyName} (${c.companyCode})`
  })) || [];

  const moduleOptions = modulesData?.modules?.map(m => ({
    value: m.id,
    label: m.name
  })) || [];

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          company: editData.company?.id || '',
          module: editData.module?.id || '',
          active: editData.active !== undefined ? editData.active : true
        });
      } else {
        setFormData({ company: '', module: '', active: true });
      }
      setError(null);
    }
  }, [isOpen, editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company || !formData.module) {
      setError("Company and Module are required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      if (isEdit) {
        await updateCompanyModule(editData.id, {
          company: formData.company,
          module: formData.module,
          active: formData.active
        });
      } else {
        await createCompanyModule({
          company: formData.company,
          module: formData.module
        });
      }
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Company Module" : "Assign Module to Company"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-zinc-700 mb-1">Company *</label>
          <CustomSelect
            options={companyOptions}
            value={formData.company}
            onChange={(val) => setFormData({ ...formData, company: val })}
            placeholder="Select a company"
            isLoading={loadingCompanies}
            disabled={isEdit || isSubmitting}
          />
          {isEdit && <p className="text-xs text-zinc-500 mt-1">Company cannot be changed after creation.</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-700 mb-1">Module *</label>
          <CustomSelect
            options={moduleOptions}
            value={formData.module}
            onChange={(val) => setFormData({ ...formData, module: val })}
            placeholder="Select a module"
            isLoading={loadingModules}
            disabled={isEdit || isSubmitting}
          />
          {isEdit && <p className="text-xs text-zinc-500 mt-1">Module cannot be changed after creation.</p>}
        </div>

        {isEdit && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              disabled={isSubmitting}
              className="rounded border-zinc-300 text-primary focus:ring-primary h-4 w-4"
            />
            <label htmlFor="active" className="text-sm font-medium text-zinc-700">
              Active Assignment
            </label>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !formData.company || !formData.module}
            className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-600 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Saving...</>
            ) : (
              isEdit ? 'Save Changes' : 'Assign Module'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
