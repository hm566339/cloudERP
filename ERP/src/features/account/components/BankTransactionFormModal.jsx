import React, { useMemo } from 'react';
import UpdateModal from '../../../components/common/UpdateModal';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import {
  useCreateBankTransactionMutation,
  useUpdateTransactionMutation,
  useGetBankAccountsQuery
} from '../../../api/account/banking.api';

const TRANSACTION_TYPES = [
  'DEPOSIT',
  'WITHDRAWAL',
  'TRANSFER',
  'BANK_CHARGE',
  'INTEREST_RECEIVED',
  'INTEREST_PAID',
  'CHEQUE_CLEARANCE',
  'CHEQUE_BOUNCE',
  'OTHER'
];

export default function BankTransactionFormModal({ isOpen, onClose, editingRecord, onSuccess }) {
  const dispatch = useAppDispatch();
  const isEditing = !!editingRecord?.id;

  const [createTransaction, { isLoading: isCreating }] = useCreateBankTransactionMutation();
  const [updateTransaction, { isLoading: isUpdating }] = useUpdateTransactionMutation();
  const isSubmitting = isCreating || isUpdating;

  // Fetch bank accounts for the dropdown
  const { data: bankAccountsResponse } = useGetBankAccountsQuery({ pageSize: 100 }, { skip: !isOpen });
  const bankAccounts = bankAccountsResponse?.data || [];

  const initialData = useMemo(() => {
    if (!editingRecord) return { transactionDate: new Date().toISOString().split('T')[0] };
    return {
      ...editingRecord,
      bankAccountId: editingRecord.bankAccount?.id || editingRecord.bankAccountId || '',
      transactionDate: editingRecord.transactionDate ? new Date(editingRecord.transactionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    };
  }, [editingRecord]);

  const sections = useMemo(() => {
    return [
      {
        title: 'Transaction Details',
        fields: [
          {
            key: 'bankAccountId',
            label: 'Bank Account',
            type: 'select',
            required: true,
            options: bankAccounts.map((acc) => ({
              value: acc.id,
              label: `${acc.bankName} - ${acc.accountNumber}`
            }))
          },
          { key: 'transactionDate', label: 'Transaction Date', type: 'date', required: true },
          {
            key: 'transactionType',
            label: 'Transaction Type',
            type: 'select',
            required: true,
            options: TRANSACTION_TYPES.map(type => ({ value: type, label: type.replace(/_/g, ' ') }))
          },
          { key: 'debitAmount', label: 'Debit Amount (Out)', type: 'number' },
          { key: 'creditAmount', label: 'Credit Amount (In)', type: 'number' }
        ]
      },
      {
        title: 'References',
        fields: [
          { key: 'referenceNo', label: 'Reference Number', type: 'text', uppercase: true },
          { key: 'utrNo', label: 'UTR / Transaction ID', type: 'text', uppercase: true, span: 'full' },
          { key: 'narration', label: 'Narration / Description', type: 'textarea', span: 'full' }
        ]
      }
    ];
  }, [bankAccounts]);

  const validate = (formData) => {
    const errors = {};
    if (!formData.bankAccountId) errors.bankAccountId = 'Bank account is required';
    if (!formData.transactionDate) errors.transactionDate = 'Transaction date is required';
    if (!formData.transactionType) errors.transactionType = 'Transaction type is required';
    
    const debit = Number(formData.debitAmount) || 0;
    const credit = Number(formData.creditAmount) || 0;
    
    if (debit <= 0 && credit <= 0) {
      errors.debitAmount = 'Enter either debit or credit amount';
      errors.creditAmount = 'Enter either debit or credit amount';
    }
    if (debit > 0 && credit > 0) {
      errors.debitAmount = 'Cannot have both debit and credit';
      errors.creditAmount = 'Cannot have both debit and credit';
    }

    return errors;
  };

  const handleSubmit = async (formData) => {
    try {
      const payload = {
        ...formData,
        debitAmount: Number(formData.debitAmount) || 0,
        creditAmount: Number(formData.creditAmount) || 0
      };

      if (isEditing) {
        await updateTransaction({ id: editingRecord.id, ...payload }).unwrap();
        dispatch(addAlert({ type: 'success', message: 'Bank transaction updated successfully' }));
      } else {
        await createTransaction(payload).unwrap();
        dispatch(addAlert({ type: 'success', message: 'Bank transaction created successfully' }));
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      const errorMessage = err?.data?.message || err?.message || 'Failed to save bank transaction';
      dispatch(addAlert({ type: 'error', message: errorMessage }));
      throw err;
    }
  };

  return (
    <UpdateModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Bank Transaction' : 'Record Bank Transaction'}
      sections={sections}
      initialData={initialData}
      onSubmit={handleSubmit}
      validate={validate}
      isSubmitting={isSubmitting}
      submitLabel={isEditing ? 'Update Transaction' : 'Save Transaction'}
    />
  );
}
