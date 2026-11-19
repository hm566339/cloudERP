import React, { useState, useEffect, useMemo } from 'react';
import { Modal, FormField, Input, Select, Button } from '../../../components/common';
import { Plus, Building2 } from 'lucide-react';
import {
  useCreateCrmContactMutation,
  useGetCrmAccountsQuery,
  useCreateCrmAccountMutation,
} from '../../../api/sales-crm/crm.api';

const EMPTY_ARRAY = [];

const toArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.content)) return res.data.content;
  return EMPTY_ARRAY;
};

export default function ContactFormModal({
  isOpen,
  onClose,
  initialData = null,
  companyId,
  accounts = EMPTY_ARRAY,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    accountId: '',
    firstName: '',
    lastName: '',
    designation: '',
    department: '',
    email: '',
    phone: '',
    decisionMakerRole: 'INFLUENCER',
    isPrimaryContact: false,
  });

  const [isNewAccountMode, setIsNewAccountMode] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');

  const { data: fetchedAccountsRes } = useGetCrmAccountsQuery(
    { companyId, page: 0, size: 100 },
    { skip: !isOpen }
  );

  const availableAccounts = useMemo(() => {
    const fromProps = toArray(accounts);
    if (fromProps.length > 0) return fromProps;
    return toArray(fetchedAccountsRes);
  }, [accounts, fetchedAccountsRes]);

  const [createContact, { isLoading }] = useCreateCrmContactMutation();
  const [createAccount, { isLoading: isCreatingAccount }] = useCreateCrmAccountMutation();

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setFormData({
        accountId: initialData.accountId || '',
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        designation: initialData.designation || '',
        department: initialData.department || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        decisionMakerRole: initialData.decisionMakerRole || 'INFLUENCER',
        isPrimaryContact: !!initialData.isPrimaryContact,
      });
      setIsNewAccountMode(false);
      setNewAccountName('');
    } else {
      setFormData({
        accountId: availableAccounts[0]?.id || '',
        firstName: '',
        lastName: '',
        designation: '',
        department: '',
        email: '',
        phone: '',
        decisionMakerRole: 'INFLUENCER',
        isPrimaryContact: false,
      });
      setIsNewAccountMode(false);
      setNewAccountName('');
    }
  }, [initialData, isOpen, availableAccounts]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let targetAccountId = formData.accountId;

      // If user typed a new account name inline, create the account first
      if (isNewAccountMode && newAccountName.trim()) {
        const createdAccRes = await createAccount({
          data: {
            accountName: newAccountName.trim(),
            accountType: 'CUSTOMER',
          },
          companyId,
        }).unwrap();
        targetAccountId = createdAccRes?.id || createdAccRes?.data?.id;
      }

      await createContact({
        data: {
          ...formData,
          accountId: targetAccountId || undefined,
        },
        companyId,
      }).unwrap();

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to save contact:', err);
    }
  };

  const isSaving = isLoading || isCreatingAccount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData?.id ? 'Edit Contact' : 'Create Contact'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
              Associated Account / Organization <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setIsNewAccountMode(!isNewAccountMode)}
              className="text-[11px] text-primary font-medium hover:underline flex items-center gap-1 cursor-pointer"
            >
              {isNewAccountMode ? (
                'Choose Existing Account'
              ) : (
                <>
                  <Plus size={12} />
                  <span>New Account</span>
                </>
              )}
            </button>
          </div>

          {isNewAccountMode ? (
            <div className="space-y-1">
              <Input
                type="text"
                required
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                placeholder="e.g. Apex Enterprises Pvt Ltd"
              />
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">
                Will automatically create and associate this new company account.
              </span>
            </div>
          ) : (
            <Select
              name="accountId"
              required={!isNewAccountMode}
              value={formData.accountId}
              onChange={handleChange}
            >
              <option value="">Select Account...</option>
              {availableAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountName || acc.name}
                </option>
              ))}
            </Select>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="First Name" required>
            <Input
              type="text"
              name="firstName"
              required
              value={formData.firstName}
              onChange={handleChange}
              placeholder="e.g. Priya"
            />
          </FormField>
          <FormField label="Last Name">
            <Input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="e.g. Kulkarni"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Designation / Title">
            <Input
              type="text"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              placeholder="e.g. VP Procurement"
            />
          </FormField>
          <FormField label="Decision Role">
            <Select
              name="decisionMakerRole"
              value={formData.decisionMakerRole}
              onChange={handleChange}
            >
              <option value="ECONOMIC_BUYER">Economic Buyer</option>
              <option value="CHAMPION">Champion</option>
              <option value="TECHNICAL_EVALUATOR">Technical Evaluator</option>
              <option value="INFLUENCER">Influencer</option>
              <option value="END_USER">End User</option>
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Email Address">
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="priya@tata.com"
            />
          </FormField>
          <FormField label="Phone Number">
            <Input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 98220 99887"
            />
          </FormField>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="isPrimary"
            name="isPrimaryContact"
            checked={formData.isPrimaryContact}
            onChange={handleChange}
            className="rounded border-zinc-300 text-primary focus:ring-primary cursor-pointer"
          />
          <label htmlFor="isPrimary" className="text-xs font-semibold text-zinc-800 dark:text-[#E6E8EE] cursor-pointer">
            Mark as primary contact for account
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-[#2A2F3D]">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={isSaving}
          >
            {initialData?.id ? 'Update Contact' : 'Create Contact'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

