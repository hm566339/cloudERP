import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import CustomSelect from '../../../components/common/CustomSelect';
import { RefreshCw } from 'lucide-react';
import { useApiMutation, useApiQuery } from '../../../hooks/useApi';
import { budgetLinesApi, chartOfAccountsApi } from '../../../api/account';
import { accountHttpClient } from '../../../api/common/client';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';

const fetchBudgetHeaders = (companyId) => {
  return accountHttpClient.get('/api/account/budget-headers', { params: { size: 1000, companyId } });
};

const fetchDepartments = () => {
  return Promise.resolve({ data: [] });
};

const BudgetLineFormModal = ({ isOpen, onClose, editingRecord, onSuccess }) => {
  const dispatch = useAppDispatch();
  const companyId = JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;

  const [formData, setFormData] = useState({
    budgetHeaderId: '',
    accountId: '',
    departmentId: '',
    allocatedAmount: '',
    utilizedAmount: ''
  });

  const createMutation = useApiMutation(budgetLinesApi.createBudgetLine);
  const updateMutation = useApiMutation(budgetLinesApi.updateBudgetLine);

  // Form Dropdown Data
  const { data: accountsData } = useApiQuery(chartOfAccountsApi.getList, { size: 1000, companyId });
  const accountsResponse = accountsData?.data?.data ?? accountsData?.data ?? accountsData;
  const raw_accountsList = Array.isArray(accountsResponse?.content)
    ? accountsResponse.content
    : Array.isArray(accountsResponse?.items)
      ? accountsResponse.items
      : Array.isArray(accountsResponse)
        ? accountsResponse
        : [];
  const accountsList = Array.isArray(raw_accountsList) ? raw_accountsList : [];

  const { data: budgetHeadersData } = useApiQuery(fetchBudgetHeaders, companyId);
  const budgetHeadersResponse = budgetHeadersData?.data?.data ?? budgetHeadersData?.data ?? budgetHeadersData;
  const raw_budgetHeadersList = Array.isArray(budgetHeadersResponse?.content)
    ? budgetHeadersResponse.content
    : Array.isArray(budgetHeadersResponse?.budgetHeaders)
      ? budgetHeadersResponse.budgetHeaders
      : Array.isArray(budgetHeadersResponse?.items)
        ? budgetHeadersResponse.items
        : Array.isArray(budgetHeadersResponse)
          ? budgetHeadersResponse
          : [];
  const budgetHeadersList = Array.isArray(raw_budgetHeadersList) ? raw_budgetHeadersList : [];

  const { data: departmentsData } = useApiQuery(fetchDepartments, companyId);
  const raw_departmentsList = departmentsData?.data?.content || departmentsData?.data || [];
  const departmentsList = Array.isArray(raw_departmentsList) ? raw_departmentsList : [];

  useEffect(() => {
    if (editingRecord) {
      setFormData({
        budgetHeaderId: editingRecord.budgetHeaderId || '',
        accountId: editingRecord.accountId || '',
        departmentId: editingRecord.departmentId || '',
        allocatedAmount: editingRecord.allocatedAmount || '',
        utilizedAmount: editingRecord.utilizedAmount || ''
      });
    } else {
      setFormData({
        budgetHeaderId: '',
        accountId: '',
        departmentId: '',
        allocatedAmount: '',
        utilizedAmount: ''
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

  const validateForm = () => {
    if (!formData.budgetHeaderId) return "Budget Header is required";
    if (!formData.accountId) return "GL Account is required";
    if (formData.allocatedAmount === '' || parseFloat(formData.allocatedAmount) <= 0) return "Allocated Amount must be a positive number";
    if (formData.utilizedAmount !== '' && parseFloat(formData.utilizedAmount) < 0) return "Utilized Amount cannot be negative";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      dispatch(addAlert({ type: 'error', message: error }));
      return;
    }

    try {
      const payload = {
        data: {
          budgetHeaderId: formData.budgetHeaderId,
          accountId: formData.accountId,
          departmentId: formData.departmentId || null,
          allocatedAmount: parseFloat(formData.allocatedAmount),
          utilizedAmount: formData.utilizedAmount ? parseFloat(formData.utilizedAmount) : 0
        }
      };

      if (editingRecord?.id) {
        await updateMutation.mutateAsync({ id: editingRecord.id, data: payload.data });
        dispatch(addAlert({ type: 'success', message: 'Budget Line updated successfully' }));
      } else {
        await createMutation.mutateAsync(payload);
        dispatch(addAlert({ type: 'success', message: 'Budget Line created successfully' }));
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save Budget Line:', err);
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || err?.message || 'Validation failed' }));
    }
  };

  const isSaving = createMutation.isLoading || updateMutation.isLoading;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingRecord ? 'Edit Budget Line' : 'New Budget Line'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Budget Header *</label>
          <CustomSelect
            options={budgetHeadersList.map(h => ({ value: h.id, label: h.budgetName || h.name || h.budgetHeaderName || h.id }))}
            value={formData.budgetHeaderId}
            onChange={(e) => handleInputChange({ target: { name: 'budgetHeaderId', value: e.target.value } })}
            placeholder="Select Budget Header"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Account *</label>
          <CustomSelect
            options={accountsList.map(a => ({ value: a.id, label: a.accountName }))}
            value={formData.accountId}
            onChange={(e) => handleInputChange({ target: { name: 'accountId', value: e.target.value } })}
            placeholder="Select Account"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Department</label>
          <CustomSelect
            options={departmentsList.map(d => ({ value: d.id, label: d.name || d.departmentName || d.id }))}
            value={formData.departmentId}
            onChange={(e) => handleInputChange({ target: { name: 'departmentId', value: e.target.value } })}
            placeholder="None (Global)"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Allocated Amount *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 font-medium">₹</span>
              <input
                type="number"
                name="allocatedAmount"
                value={formData.allocatedAmount}
                onChange={handleInputChange}
                className="input-field w-full pl-8"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Utilized Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 font-medium">₹</span>
              <input
                type="number"
                name="utilizedAmount"
                value={formData.utilizedAmount}
                onChange={handleInputChange}
                className="input-field w-full pl-8"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <p className="text-[10.4px] text-zinc-500 dark:text-zinc-400 mt-1">Usually updated automatically</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-border-dark mt-6">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary flex items-center gap-2" disabled={isSaving}>
            {isSaving && <RefreshCw size={14} className="animate-spin" />}
            {editingRecord ? 'Update' : 'Save'} Budget Line
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BudgetLineFormModal;
