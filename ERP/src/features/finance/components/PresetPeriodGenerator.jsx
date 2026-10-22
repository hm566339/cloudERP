import React, { useState, useMemo } from 'react';
import { useApiQuery } from '../../../hooks/useApi';
import { fiscalYearsApi } from '../../../api/account/fiscalYears';
import CustomSelect from '../../../components/common/CustomSelect';
import { Plus, Trash2 } from 'lucide-react';

const PERIOD_TYPES = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'HALF_YEARLY', label: 'Half-Yearly' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'CUSTOM', label: 'Custom' }
];

export default function PresetPeriodGenerator({ onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    fiscalYearId: '',
    periodType: 'MONTHLY',
    customPeriods: []
  });

  const [errors, setErrors] = useState({});

  const { data: fiscalYearsData } = useApiQuery(fiscalYearsApi.getFiscalYears, { size: 100 });

  const fiscalYearOptions = useMemo(() => {
    const raw = fiscalYearsData?.data?.data?.fiscalYears || fiscalYearsData?.data?.fiscalYears || fiscalYearsData?.fiscalYears || fiscalYearsData?.content || fiscalYearsData?.data?.content || [];
    const list = Array.isArray(raw) ? raw : [];
    return list.map(fy => ({ value: fy.id, label: `${fy.fiscalYearName || fy.fiscalYear || fy.name} (${fy.startDate} to ${fy.endDate})` }));
  }, [fiscalYearsData]);

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    
    // Auto-add one empty custom period if switching to CUSTOM
    if (name === 'periodType' && value === 'CUSTOM' && formData.customPeriods.length === 0) {
      setFormData(prev => ({
        ...prev,
        customPeriods: [{ periodName: '', startDate: '', endDate: '' }]
      }));
    }
  };

  const addCustomPeriod = () => {
    setFormData(prev => ({
      ...prev,
      customPeriods: [...prev.customPeriods, { periodName: '', startDate: '', endDate: '' }]
    }));
  };

  const removeCustomPeriod = (index) => {
    setFormData(prev => ({
      ...prev,
      customPeriods: prev.customPeriods.filter((_, i) => i !== index)
    }));
  };

  const updateCustomPeriod = (index, field, value) => {
    setFormData(prev => {
      const newPeriods = [...prev.customPeriods];
      newPeriods[index] = { ...newPeriods[index], [field]: value };
      return { ...prev, customPeriods: newPeriods };
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fiscalYearId) newErrors.fiscalYearId = 'Fiscal Year is required';
    if (!formData.periodType) newErrors.periodType = 'Period Type is required';
    
    if (formData.periodType === 'CUSTOM') {
      if (formData.customPeriods.length === 0) {
        newErrors.customPeriods = 'At least one custom period is required';
      } else {
        formData.customPeriods.forEach((cp, idx) => {
          if (!cp.periodName?.trim()) newErrors[`cp_${idx}_name`] = 'Required';
          if (!cp.startDate) newErrors[`cp_${idx}_start`] = 'Required';
          if (!cp.endDate) newErrors[`cp_${idx}_end`] = 'Required';
          if (cp.startDate && cp.endDate && new Date(cp.endDate) <= new Date(cp.startDate)) {
            newErrors[`cp_${idx}_end`] = 'Invalid end date';
          }
        });
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    const payload = {
      fiscalYearId: formData.fiscalYearId,
      periodType: formData.periodType,
      customPeriods: formData.periodType === 'CUSTOM' ? formData.customPeriods : []
    };
    
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <CustomSelect
            label="Fiscal Year *"
            value={formData.fiscalYearId}
            options={fiscalYearOptions}
            onChange={(e) => handleSelectChange('fiscalYearId', e.target.value)}
            error={errors.fiscalYearId}
            searchable={true}
          />
        </div>
        <div>
          <CustomSelect
            label="Period Type *"
            value={formData.periodType}
            options={PERIOD_TYPES}
            onChange={(e) => handleSelectChange('periodType', e.target.value)}
            error={errors.periodType}
          />
        </div>
      </div>

      {formData.periodType === 'CUSTOM' && (
        <div className="mt-4 border border-zinc-200 dark:border-[#2A2F3D] rounded-lg p-4 bg-zinc-50 dark:bg-[#161922]">
          <div className="flex justify-between items-center mb-4 border-b border-zinc-200 dark:border-[#2A2F3D] pb-2">
            <h4 className="font-medium text-zinc-900 dark:text-[#E6E8EE]">Custom Periods</h4>
            <button
              type="button"
              onClick={addCustomPeriod}
              className="px-3 py-1 bg-white dark:bg-[#1D212C] border border-zinc-300 dark:border-[#2A2F3D] text-zinc-700 dark:text-zinc-300 rounded text-sm hover:bg-zinc-100 dark:hover:bg-[#222736] flex items-center"
            >
              <Plus size={16} className="mr-1" /> Add Period
            </button>
          </div>
          
          {errors.customPeriods && (
            <p className="text-red-500 text-sm mb-3">{errors.customPeriods}</p>
          )}

          <div className="space-y-3">
            {formData.customPeriods.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">No custom periods added. Click 'Add Period' to create one.</p>
            ) : (
              formData.customPeriods.map((cp, idx) => (
                <div key={idx} className="flex flex-col md:flex-row gap-3 items-start bg-white dark:bg-[#1D212C] p-3 rounded border border-zinc-200 dark:border-[#2A2F3D] shadow-sm">
                  <div className="w-full md:w-1/3">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Period Name *</label>
                    <input
                      type="text"
                      value={cp.periodName}
                      onChange={(e) => updateCustomPeriod(idx, 'periodName', e.target.value)}
                      className={`w-full p-2 text-sm border rounded focus:ring-zinc-900/10 dark:focus:ring-white/10 bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] ${errors[`cp_${idx}_name`] ? 'border-red-500' : 'border-zinc-300 dark:border-[#2A2F3D]'}`}
                      placeholder="e.g. Phase 1"
                    />
                    {errors[`cp_${idx}_name`] && <p className="text-red-500 text-xs mt-1">{errors[`cp_${idx}_name`]}</p>}
                  </div>
                  <div className="w-full md:w-1/3">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Start Date *</label>
                    <input
                      type="date"
                      value={cp.startDate}
                      onChange={(e) => updateCustomPeriod(idx, 'startDate', e.target.value)}
                      className={`w-full p-2 text-sm border rounded focus:ring-zinc-900/10 dark:focus:ring-white/10 bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] ${errors[`cp_${idx}_start`] ? 'border-red-500' : 'border-zinc-300 dark:border-[#2A2F3D]'}`}
                    />
                    {errors[`cp_${idx}_start`] && <p className="text-red-500 text-xs mt-1">{errors[`cp_${idx}_start`]}</p>}
                  </div>
                  <div className="w-full md:w-1/3 flex items-start gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">End Date *</label>
                      <input
                        type="date"
                        value={cp.endDate}
                        onChange={(e) => updateCustomPeriod(idx, 'endDate', e.target.value)}
                        className={`w-full p-2 text-sm border rounded focus:ring-zinc-900/10 dark:focus:ring-white/10 bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] ${errors[`cp_${idx}_end`] ? 'border-red-500' : 'border-zinc-300 dark:border-[#2A2F3D]'}`}
                      />
                      {errors[`cp_${idx}_end`] && <p className="text-red-500 text-xs mt-1">{errors[`cp_${idx}_end`]}</p>}
                    </div>
                    <div className="pt-6">
                      <button
                        type="button"
                        onClick={() => removeCustomPeriod(idx)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded"
                        title="Remove"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-6 border-t border-zinc-200 dark:border-[#2A2F3D]">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-[#1D212C] border border-zinc-300 dark:border-[#2A2F3D] rounded hover:bg-zinc-50 dark:hover:bg-[#222736] disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-[#4C8DFF] rounded hover:bg-zinc-800 dark:hover:bg-[#3A78E6] disabled:opacity-50 flex items-center"
        >
          {isLoading ? (
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
          ) : null}
          Generate Presets
        </button>
      </div>
    </form>
  );
}
