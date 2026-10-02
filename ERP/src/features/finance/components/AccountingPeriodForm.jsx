import React, { useState, useEffect, useMemo } from 'react';
import { useApiQuery } from '../../../hooks/useApi';
import { fiscalYearsApi } from '../../../api/account/fiscalYears';
import CustomSelect from '../../../components/common/CustomSelect';
import { Plus, X } from 'lucide-react';
import { useApiMutation } from '../../../hooks/useApi';
export default function AccountingPeriodForm({ initialData, onSubmit, onCancel, isLoading }) {
  const isEditing = !!(initialData?.id || initialData?.accountingPeriodId);
  const [formData, setFormData] = useState({
    fiscalYearId: '',
    periodName: '',
    startDate: '',
    endDate: '',
    ...initialData
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);

  // Fetch Fiscal Years if creating
  const { data: fiscalYearsData, refetch: refetchFiscalYears } = useApiQuery(fiscalYearsApi.getFiscalYears, { size: 100 }, { skip: isEditing });

  const [isFiscalYearFormOpen, setIsFiscalYearFormOpen] = useState(false);
  const [fiscalYearFormData, setFiscalYearFormData] = useState({
    fiscalYear: '',
    startDate: '',
    endDate: '',
    isClosed: false
  });

  const { mutate: createFiscalYear, isLoading: isCreatingFiscalYear } = useApiMutation(fiscalYearsApi.createFiscalYear);

  const handleCreateFiscalYearSubmit = (e) => {
    e.preventDefault();
    createFiscalYear({ companyId, data: fiscalYearFormData }, {
      onSuccess: (res) => {
        setIsFiscalYearFormOpen(false);
        const createdFY = res?.data || fiscalYearFormData;
        setFormData(prev => ({ ...prev, fiscalYearId: createdFY.id }));
        refetchFiscalYears();
      }
    });
  };

  const handleFiscalYearFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFiscalYearFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const fiscalYearOptions = useMemo(() => {
    const raw = fiscalYearsData?.data?.data?.fiscalYears || fiscalYearsData?.data?.fiscalYears || fiscalYearsData?.fiscalYears || fiscalYearsData?.content || fiscalYearsData?.data?.content || [];
    const list = Array.isArray(raw) ? raw : [];
    return list.map(fy => ({ value: fy.id, label: `${fy.fiscalYearName || fy.fiscalYear || fy.name} (${fy.startDate} to ${fy.endDate})` }));
  }, [fiscalYearsData]);

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
    if (!isEditing && !formData.fiscalYearId) newErrors.fiscalYearId = 'Fiscal Year is required';
    if (!formData.periodName?.trim()) newErrors.periodName = 'Period Name is required';
    if (!formData.startDate) newErrors.startDate = 'Start Date is required';
    if (!formData.endDate) newErrors.endDate = 'End Date is required';
    
    if (formData.startDate && formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'End Date must be greater than Start Date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    const payload = {
      periodName: formData.periodName,
      startDate: formData.startDate,
      endDate: formData.endDate
    };
    
    // For creation, we also pass fiscalYearId separately or inside payload depending on parent handler
    onSubmit({ fiscalYearId: formData.fiscalYearId, data: payload });
  };

  return (
    <>
      <form id="accounting-period-form" onSubmit={handleSubmit} className="flex flex-col gap-y-4">
        {serverError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700">
            {serverError}
          </div>
        )}

        {/* Fiscal Year */}
        {!isEditing ? (
          <div className="space-y-1 w-full">
            <CustomSelect
              label={
                <>
                  Fiscal Year <span className="text-red-500">*</span>
                </>
              }
              value={formData.fiscalYearId}
              options={fiscalYearOptions}
              onChange={(e) => handleSelectChange('fiscalYearId', e.target.value)}
              error={errors.fiscalYearId}
              searchable={true}
              bottomAction={({ searchTerm, closeDropdown }) => {
                const noData = fiscalYearOptions.length === 0;
                if (!searchTerm && !noData) return null;
                
                return (
                  <button
                    type="button"
                    onClick={() => {
                      closeDropdown();
                      setFiscalYearFormData(prev => ({ ...prev, fiscalYear: searchTerm || '' }));
                      setIsFiscalYearFormOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-[10.4px] text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors flex items-center gap-2"
                  >
                    <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <Plus size={14} className="text-primary" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold truncate">Create {searchTerm ? `"${searchTerm}"` : 'New Fiscal Year'}</span>
                      <span className="text-[8.8px] text-zinc-500">Add as new fiscal year</span>
                    </div>
                  </button>
                );
              }}
            />
          </div>
        ) : (
          <div className="hidden"></div>
        )}

        {/* Period Name */}
        <div className="space-y-1 w-full">
          <label className="text-[10.4px] font-semibold text-zinc-700">
            Period Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="periodName"
            value={formData.periodName}
            onChange={handleChange}
            disabled={isLoading}
            className={`w-full h-9 px-3 bg-white border rounded-lg text-[10.4px] font-medium text-zinc-800 outline-none transition-colors ${
              errors.periodName ? 'border-red-500 focus:border-red-500' : 'border-zinc-200 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10'
            } disabled:bg-zinc-50 disabled:text-zinc-500`}
            placeholder="e.g. Jan 2026"
          />
          {errors.periodName && <p className="text-red-500 text-xs mt-0.5">{errors.periodName}</p>}
        </div>

        {/* Start Date */}
        <div className="space-y-1 w-full">
          <label className="text-[10.4px] font-semibold text-zinc-700">
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            disabled={isLoading}
            className={`w-full h-9 px-3 bg-white border rounded-lg text-[10.4px] font-medium text-zinc-800 outline-none transition-colors ${
              errors.startDate ? 'border-red-500 focus:border-red-500' : 'border-zinc-200 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10'
            } disabled:bg-zinc-50 disabled:text-zinc-500`}
          />
          {errors.startDate && <p className="text-red-500 text-xs mt-0.5">{errors.startDate}</p>}
        </div>
        
        {/* End Date */}
        <div className="space-y-1 w-full">
          <label className="text-[10.4px] font-semibold text-zinc-700">
            End Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            disabled={isLoading}
            className={`w-full h-9 px-3 bg-white border rounded-lg text-[10.4px] font-medium text-zinc-800 outline-none transition-colors ${
              errors.endDate ? 'border-red-500 focus:border-red-500' : 'border-zinc-200 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10'
            } disabled:bg-zinc-50 disabled:text-zinc-500`}
          />
          {errors.endDate && <p className="text-red-500 text-xs mt-0.5">{errors.endDate}</p>}
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
          form="accounting-period-form"
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-5 py-2 text-[10.4px] font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-all active:scale-95 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              <span>Saving...</span>
            </>
          ) : (
            <span>{isEditing ? 'Update Period' : 'Create Period'}</span>
          )}
        </button>
      </div>
      {isFiscalYearFormOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] rounded-md shadow-2xl flex flex-col overflow-hidden animate-slide-up border border-zinc-200">
            <div className="flex justify-between items-center px-5 py-4 border-b border-zinc-200 bg-zinc-50/80 shrink-0">
              <h2 className="text-base font-bold text-zinc-900 tracking-tight">Create Fiscal Year</h2>
              <button 
                type="button" 
                onClick={() => setIsFiscalYearFormOpen(false)} 
                className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors active:scale-95"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar bg-white">
              <form id="inline-fiscal-year-form" onSubmit={handleCreateFiscalYearSubmit} className="flex flex-col gap-y-4">
                <div className="space-y-1 w-full">
                  <label className="text-[10.4px] font-semibold text-zinc-700">Fiscal Year <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="fiscalYear"
                    value={fiscalYearFormData.fiscalYear}
                    onChange={handleFiscalYearFormChange}
                    className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] font-medium text-zinc-800 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 transition-colors"
                    placeholder="e.g. 2026-2027"
                    required
                  />
                </div>
                
                <div className="space-y-1 w-full">
                  <label className="text-[10.4px] font-semibold text-zinc-700">Start Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    name="startDate"
                    value={fiscalYearFormData.startDate}
                    onChange={handleFiscalYearFormChange}
                    className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] font-medium text-zinc-800 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 transition-colors"
                    required
                  />
                </div>
                
                <div className="space-y-1 w-full">
                  <label className="text-[10.4px] font-semibold text-zinc-700">End Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    name="endDate"
                    value={fiscalYearFormData.endDate}
                    onChange={handleFiscalYearFormChange}
                    className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] font-medium text-zinc-800 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 transition-colors"
                    required
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer p-3 bg-zinc-50 border border-zinc-200 rounded-lg group mt-2">
                  <input
                    type="checkbox"
                    name="isClosed"
                    checked={fiscalYearFormData.isClosed}
                    onChange={handleFiscalYearFormChange}
                    className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-zinc-900"
                  />
                  <span className="text-[10.4px] font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">
                    Mark this Fiscal Year as Closed
                  </span>
                </label>
              </form>
              
              <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsFiscalYearFormOpen(false)}
                  className="px-5 py-2 text-[10.4px] font-bold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200/50 bg-white border border-zinc-300 rounded-md transition-all active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="inline-fiscal-year-form"
                  disabled={isCreatingFiscalYear}
                  className="flex items-center justify-center gap-2 px-5 py-2 text-[10.4px] font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {isCreatingFiscalYear && (
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  )}
                  Create Fiscal Year
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
