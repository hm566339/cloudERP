import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import CustomSelect from '../../../components/common/CustomSelect';
import { RefreshCw } from 'lucide-react';
import { useApiMutation, useApiQuery } from '../../../hooks/useApi';
import { budgetHeadersApi, fiscalYearsApi } from '../../../api/account';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';

const BudgetHeaderFormModal = ({ isOpen, onClose, editingRecord, onSuccess }) => {
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState({
    fiscalYearId: '',
    budgetName: '',
    totalBudget: ''
  });

  const createMutation = useApiMutation(budgetHeadersApi.createBudgetHeader);
  const updateMutation = useApiMutation(budgetHeadersApi.updateBudgetHeader);

  // Fetch Fiscal Years for Dropdown
  const { data: fiscalYearsData } = useApiQuery(fiscalYearsApi.getFiscalYears);
  const rawFiscalYears = fiscalYearsData?.data?.data?.fiscalYears || fiscalYearsData?.data?.data?.items || fiscalYearsData?.data?.fiscalYears || fiscalYearsData?.data?.items || fiscalYearsData?.fiscalYears || fiscalYearsData?.items || [];
  const fiscalYearsList = Array.isArray(rawFiscalYears) ? rawFiscalYears : [];
  const fiscalYearOptions = fiscalYearsList.map(y => ({ value: y.id, label: y.fiscalYear || y.name || y.id }));

  useEffect(() => {
    if (editingRecord) {
      setFormData({
        fiscalYearId: editingRecord.fiscalYearId || '',
        budgetName: editingRecord.budgetName || '',
        totalBudget: editingRecord.totalBudget || ''
      });
    } else {
      setFormData({
        fiscalYearId: '',
        budgetName: '',
        totalBudget: ''
      });
    }
  }, [editingRecord, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        data: {
          fiscalYearId: formData.fiscalYearId,
          budgetName: formData.budgetName,
          totalBudget: parseFloat(formData.totalBudget)
        }
      };

      if (editingRecord?.id) {
        await updateMutation.mutateAsync({ id: editingRecord.id, data: payload.data });
        dispatch(addAlert({ type: 'success', message: 'Budget Header updated successfully' }));
      } else {
        await createMutation.mutateAsync(payload);
        dispatch(addAlert({ type: 'success', message: 'Budget Header created successfully' }));
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save Budget Header:', err);
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || err?.message || 'Failed to save Budget Header' }));
    }
  };

  const isSaving = createMutation.isLoading || updateMutation.isLoading;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingRecord ? 'Edit Budget Header' : 'New Budget Header'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Fiscal Year *</label>
          <CustomSelect
            options={fiscalYearOptions}
            value={formData.fiscalYearId}
            onChange={(e) => handleInputChange({ target: { name: 'fiscalYearId', value: e.target.value } })}
            placeholder="Select Fiscal Year"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Budget Name *</label>
          <input
            type="text"
            name="budgetName"
            value={formData.budgetName}
            onChange={handleInputChange}
            className="input-field w-full"
            placeholder="e.g. FY26 Marketing Budget"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Total Budget *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 font-medium">₹</span>
            <input
              type="number"
              name="totalBudget"
              value={formData.totalBudget}
              onChange={handleInputChange}
              className="input-field w-full pl-8"
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-border-dark mt-6">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary flex items-center gap-2" disabled={isSaving}>
            {isSaving && <RefreshCw size={14} className="animate-spin" />}
            {editingRecord ? 'Update' : 'Save'} Budget Header
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BudgetHeaderFormModal;
