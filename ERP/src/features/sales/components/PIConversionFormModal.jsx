import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import UpdateModal from '../../../components/common/UpdateModal';
import { piConversionFormSections } from '../configs/piConversionFormConfig';
import { useCreateProformaInvoiceFromQuotationMutation } from '../../../api/sales-crm';
import { useGetBankAccountsQuery } from '../../../api/account/banking.api';
import { useGetChartOfAccountsQuery } from '../../../api/account/accounting.api';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';

/**
 * PIConversionFormModal
 *
 * Thin wrapper around the generic <UpdateModal>.
 * Same pattern as CustomerFormModal.
 *
 * All UI (layout, fields, validation banner, footer) is handled by UpdateModal.
 * This component owns only PI-conversion-specific business logic:
 *   - dynamic account options injection
 *   - quotation data prefill
 *   - payload construction
 *   - API call
 *
 * Props:
 *   isOpen           boolean
 *   onClose          () => void
 *   companyId        string
 *   sourceQuotation  object   — the quotation row being converted
 *   onSuccess        (piId, piNumber) => void
 */
export default function PIConversionFormModal({
  isOpen,
  onClose,
  companyId: propCompanyId,
  sourceQuotation,
  onSuccess,
}) {
  const dispatch = useAppDispatch();
  const routeCompanyId = useParams().companyId;
  const companyId = propCompanyId || routeCompanyId ||
    JSON.parse(localStorage.getItem('selected_company') || '{}')?.id ||
    JSON.parse(localStorage.getItem('auth_user') || '{}')?.companyCode;

  const [createPI, { isLoading: isCreating }] = useCreateProformaInvoiceFromQuotationMutation();

  const { data: bankAccountsResponse, isLoading: banksLoading } = useGetBankAccountsQuery(
    { companyId, page: 0, size: 100 },
    { skip: !isOpen }
  );
  const bankAccounts = Array.isArray(bankAccountsResponse)
    ? bankAccountsResponse
    : (bankAccountsResponse?.bankAccounts || bankAccountsResponse?.data?.bankAccounts || bankAccountsResponse?.data?.data || bankAccountsResponse?.data?.content || bankAccountsResponse?.data || bankAccountsResponse?.content || []);

  const { data: chartOfAccountsData, isLoading: accountsLoading } = useGetChartOfAccountsQuery(
    { companyId, page: 0, size: 1000 },
    { skip: !isOpen }
  );
  const rawAccounts = chartOfAccountsData?.chartOfAccounts || chartOfAccountsData?.data?.chartOfAccounts || chartOfAccountsData?.data?.data || chartOfAccountsData?.data?.content || chartOfAccountsData?.content || chartOfAccountsData?.data || [];
  const chartOfAccounts = Array.isArray(rawAccounts) ? rawAccounts : [];

  // ── Build options ─────────────────────────────────────────────────────
  const bankOptions = useMemo(() =>
    bankAccounts
      .filter((a) => a?.id)
      .map((a) => ({
        value: a.id,
        label: `${a.bankName || a.name || ''} - ${a.accountNumber || ''}`.trim(),
      })),
    [bankAccounts]
  );

  const receivableAccountOptions = useMemo(() =>
    chartOfAccounts
      .filter((a) => a?.id && a.postingAllowed !== false && (a.groupName === 'Accounts Receivable' || a.accountName?.toLowerCase().includes('receivable')))
      .map((a) => ({
        value: a.id,
        label: `${a.accountName || a.name || ''} (${a.accountCode || a.code || ''})`.trim(),
      })),
    [chartOfAccounts]
  );

  const receiptAccountOptions = useMemo(() =>
    chartOfAccounts
      .filter((a) => a?.id && a.postingAllowed !== false && (a.groupName === 'Cash & Cash Equivalent' || a.groupName === 'Bank Accounts' || a.accountName?.toLowerCase().includes('cash') || a.accountName?.toLowerCase().includes('bank')))
      .map((a) => ({
        value: a.id,
        label: `${a.accountName || a.name || ''} (${a.accountCode || a.code || ''})`.trim(),
      })),
    [chartOfAccounts]
  );

  // ── Inject dynamic options into config sections ───────────────────────
  const sections = useMemo(() =>
    piConversionFormSections.map((section) => ({
      ...section,
      fields: section.fields.map((field) => {
        if (field.key === 'bankAccountId') return { ...field, options: bankOptions, isLoading: banksLoading };
        if (field.key === 'receivableAccountId') return { ...field, options: receivableAccountOptions, isLoading: accountsLoading };
        if (field.key === 'receiptAccountId') return { ...field, options: receiptAccountOptions, isLoading: accountsLoading };
        return field;
      }),
    })),
    [bankOptions, receivableAccountOptions, receiptAccountOptions, banksLoading, accountsLoading]
  );

  // ── Prefill from quotation ────────────────────────────────────────────
  const initialData = useMemo(() => {
    if (!sourceQuotation) return null;
    const cust = sourceQuotation.customerInformation || sourceQuotation.customer || {};
    return {
      quotationNumber: sourceQuotation.quotationNumber || '',
      customerName: cust.customerName || sourceQuotation.customerName || '',
      piDate: new Date().toISOString().split('T')[0],
      piValidTill: sourceQuotation.validUntil
        ? new Date(sourceQuotation.validUntil).toISOString().split('T')[0]
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      advanceRequired: false,
      advanceAmount: 0,
      paymentCondition: '',
      paymentMode: '',
      bankAccountId: '',
      receivableAccountId: '',
      receiptAccountId: '',
    };
  }, [sourceQuotation]);

  // ── Validation ────────────────────────────────────────────────────────
  const validate = (formData) => {
    const errors = {};
    if (!formData.piDate) errors.piDate = 'PI Date is required.';
    if (!formData.piValidTill) errors.piValidTill = 'Valid Until date is required.';
    if (formData.piDate && formData.piValidTill && formData.piValidTill < formData.piDate) {
      errors.piValidTill = 'Valid Until cannot be before PI Date.';
    }
    if (formData.advanceRequired) {
      if (!formData.advanceAmount || Number(formData.advanceAmount) <= 0) {
        errors.advanceAmount = 'Advance amount must be greater than zero.';
      }
      if (!formData.paymentMode) errors.paymentMode = 'Payment Mode is required for advance.';
      if (!formData.bankAccountId) errors.bankAccountId = 'Bank Account is required for advance.';
      if (!formData.receivableAccountId) errors.receivableAccountId = 'Receivable Account is required for advance.';
      if (!formData.receiptAccountId) errors.receiptAccountId = 'Receipt Account is required for advance.';
    }
    return errors;
  };

  // ── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async (formData) => {
    if (!sourceQuotation?.id) {
      throw new Error('No source quotation found.');
    }

    const payload = {
      quotationId: sourceQuotation.id,
      companyId,
      piDate: formData.piDate,
      piValidTill: formData.piValidTill,
      advanceRequired: !!formData.advanceRequired,
      advanceAmount: formData.advanceRequired ? Number(formData.advanceAmount) || 0 : 0,
      bankAccountId: formData.advanceRequired ? (formData.bankAccountId || null) : null,
      paymentCondition: formData.paymentCondition || '',
      paymentMode: formData.advanceRequired ? (formData.paymentMode || null) : null,
      receivableAccountId: formData.advanceRequired ? (formData.receivableAccountId || null) : null,
      receiptAccountId: formData.advanceRequired ? (formData.receiptAccountId || null) : null,
    };

    const response = await createPI(payload).unwrap();
    const createdPi = response?.data || response;

    dispatch(addAlert({
      type: 'success',
      message: `Proforma Invoice${createdPi?.piNumber ? ' ' + createdPi.piNumber : ''} created successfully from ${sourceQuotation.quotationNumber || 'quotation'}.`,
    }));

    if (onSuccess) onSuccess(createdPi?.id, createdPi?.piNumber);
  };

  return (
    <UpdateModal
      isOpen={isOpen}
      onClose={onClose}
      title="Convert Quotation to Proforma Invoice"
      sections={sections}
      initialData={initialData}
      onSubmit={handleSubmit}
      validate={validate}
      isSubmitting={isCreating}
      submitLabel="Create Proforma Invoice"
      cancelLabel="Cancel"
    />
  );
}
