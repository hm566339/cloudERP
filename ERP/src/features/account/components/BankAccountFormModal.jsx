import React from 'react';
import UpdateModal from '../../../components/common/UpdateModal';
import { useApiMutation } from '../../../hooks/useApi';
import { bankAccountsApi } from '../../../api/account';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';

const ACCOUNT_TYPES = [
  'SAVINGS',
  'CURRENT',
  'CASH',
  'OVERDRAFT',
  'OTHER'
];

const bankAccountSections = [
  {
    title: 'Account Information',
    fields: [
      { key: 'bankName', label: 'Bank Name', type: 'text', required: true, uppercase: true },
      { key: 'accountNumber', label: 'Account Number', type: 'text', required: true },
      { key: 'branchName', label: 'Branch Name', type: 'text', uppercase: true },
      { 
        key: 'accountType', 
        label: 'Account Type', 
        type: 'select', 
        required: true,
        options: ACCOUNT_TYPES.map(type => ({ value: type, label: type.charAt(0) + type.slice(1).toLowerCase() }))
      }
    ]
  },
  {
    title: 'Identifiers & References',
    fields: [
      { key: 'ifscCode', label: 'IFSC Code', type: 'text', uppercase: true },
      { key: 'swiftCode', label: 'Swift Code', type: 'text', uppercase: true },
      { key: 'upiId', label: 'UPI ID', type: 'text' },
      { key: 'accountHolderName', label: 'Account Holder Name', type: 'text', uppercase: true }
    ]
  },
  {
    title: 'Financials & Status',
    fields: [
      { key: 'openingBalance', label: 'Opening Balance', type: 'number' },
      { key: 'isPrimary', label: 'Primary Account', type: 'boolean', defaultValue: false },
      { key: 'isActive', label: 'Active Status', type: 'boolean', defaultValue: true }
    ]
  }
];

export default function BankAccountFormModal({ isOpen, onClose, editingRecord, onSuccess }) {
  const dispatch = useAppDispatch();
  const isEditing = !!editingRecord?.id;

  const initialData = React.useMemo(() => {
    if (!editingRecord) return { isActive: true, isPrimary: false };
    return {
      ...editingRecord,
      isActive: editingRecord.isActive !== undefined 
        ? Boolean(editingRecord.isActive) 
        : (editingRecord.status ? editingRecord.status === 'ACTIVE' : true),
      isPrimary: Boolean(editingRecord.isPrimary)
    };
  }, [editingRecord]);

  const { mutateAsync: createAccount, isLoading: isCreating } = useApiMutation(bankAccountsApi.createBankAccount);
  const { mutateAsync: updateAccount, isLoading: isUpdating } = useApiMutation(bankAccountsApi.updateBankAccount);
  const isSubmitting = isCreating || isUpdating;

  const validate = (formData) => {
    const errors = {};
    if (!formData.bankName?.trim()) errors.bankName = 'Bank name is required';
    if (!formData.accountNumber?.trim()) errors.accountNumber = 'Account number is required';
    if (!formData.accountType) errors.accountType = 'Account type is required';
    
    if (formData.openingBalance !== '' && formData.openingBalance !== null && formData.openingBalance !== undefined) {
      const balance = Number(formData.openingBalance);
      if (Number.isNaN(balance)) {
        errors.openingBalance = 'Invalid amount';
      }
    }
    return errors;
  };

  const handleSubmit = async (formData) => {
    try {
      const payload = {
        ...formData,
        bankName: formData.bankName?.trim(),
        accountNumber: formData.accountNumber?.trim(),
        branchName: formData.branchName?.trim(),
        accountType: formData.accountType,
        ifscCode: formData.ifscCode?.trim(),
        swiftCode: formData.swiftCode?.trim(),
        upiId: formData.upiId?.trim(),
        accountHolderName: formData.accountHolderName?.trim(),
        openingBalance: formData.openingBalance ? Number(formData.openingBalance) : 0,
        isPrimary: Boolean(formData.isPrimary),
        isActive: formData.isActive !== undefined ? Boolean(formData.isActive) : true
      };

      if (isEditing) {
        await updateAccount({ id: editingRecord.id, data: payload, ...payload });
        dispatch(addAlert({ type: 'success', message: 'Bank account updated successfully' }));
      } else {
        await createAccount(payload);
        dispatch(addAlert({ type: 'success', message: 'Bank account created successfully' }));
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.message || err?.data?.message || 'Failed to save account' }));
      throw err; // Re-throw to let UpdateModal handle the error state if needed
    }
  };

  return (
    <UpdateModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Bank Account' : 'New Bank Account'}
      sections={bankAccountSections}
      initialData={initialData}
      onSubmit={handleSubmit}
      validate={validate}
      isSubmitting={isSubmitting}
      submitLabel={isEditing ? 'Update Account' : 'Create Account'}
    />
  );
}
