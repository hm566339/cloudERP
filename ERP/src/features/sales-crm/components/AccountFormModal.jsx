import React, { useState, useEffect } from 'react';
import { Modal, FormField, Input, Select, Button } from '../../../components/common';
import { useCreateCrmAccountMutation } from '../../../api/sales-crm/crm.api';

export default function AccountFormModal({
  isOpen,
  onClose,
  initialData = null,
  companyId,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    accountName: '',
    industry: '',
    accountType: 'CUSTOMER',
    businessType: 'B2B',
    accountTier: 'TIER_2',
    gstin: '',
    panNumber: '',
    website: '',
    phone: '',
    email: '',
    creditLimit: '500000',
    paymentTermsDays: 30,
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
  });

  const [createAccount, { isLoading }] = useCreateCrmAccountMutation();

  useEffect(() => {
    if (initialData) {
      setFormData({
        accountName: initialData.accountName || '',
        industry: initialData.industry || '',
        accountType: initialData.accountType || 'CUSTOMER',
        businessType: initialData.businessType || 'B2B',
        accountTier: initialData.accountTier || 'TIER_2',
        gstin: initialData.gstin || '',
        panNumber: initialData.panNumber || '',
        website: initialData.website || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        creditLimit: initialData.creditLimit ? String(initialData.creditLimit) : '500000',
        paymentTermsDays: initialData.paymentTermsDays || 30,
        addressLine1: initialData.addressLine1 || '',
        city: initialData.city || '',
        state: initialData.state || '',
        postalCode: initialData.postalCode || '',
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createAccount({
        data: {
          ...formData,
          creditLimit: Number(formData.creditLimit) || 0,
          paymentTermsDays: Number(formData.paymentTermsDays) || 30,
        },
        companyId,
      }).unwrap();
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to save account:', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData?.id ? 'Edit Account' : 'Create B2B Account'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Account / Enterprise Name" required>
          <Input
            type="text"
            name="accountName"
            required
            value={formData.accountName}
            onChange={handleChange}
            placeholder="e.g. Tata Steel Processing Ltd"
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormField label="Account Type">
            <Select
              name="accountType"
              value={formData.accountType}
              onChange={handleChange}
            >
              <option value="PROSPECT">Prospect</option>
              <option value="CUSTOMER">Customer</option>
              <option value="PARTNER">Partner</option>
              <option value="VENDOR">Vendor</option>
            </Select>
          </FormField>
          <FormField label="Account Tier">
            <Select
              name="accountTier"
              value={formData.accountTier}
              onChange={handleChange}
            >
              <option value="TIER_1">Tier 1 (Enterprise)</option>
              <option value="TIER_2">Tier 2 (Mid-Market)</option>
              <option value="TIER_3">Tier 3 (SMB)</option>
            </Select>
          </FormField>
          <FormField label="Industry">
            <Input
              type="text"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              placeholder="e.g. Manufacturing"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="GSTIN (15 characters)">
            <Input
              type="text"
              name="gstin"
              maxLength={15}
              value={formData.gstin}
              onChange={handleChange}
              placeholder="27AAACT1234A1Z5"
              className="uppercase"
            />
          </FormField>
          <FormField label="PAN Number (10 characters)">
            <Input
              type="text"
              name="panNumber"
              maxLength={10}
              value={formData.panNumber}
              onChange={handleChange}
              placeholder="AAACT1234A"
              className="uppercase"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Credit Limit (₹)">
            <Input
              type="number"
              min="0"
              name="creditLimit"
              value={formData.creditLimit}
              onChange={handleChange}
            />
          </FormField>
          <FormField label="Payment Terms (Days)">
            <Input
              type="number"
              min="0"
              name="paymentTermsDays"
              value={formData.paymentTermsDays}
              onChange={handleChange}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormField label="City">
            <Input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Pune"
            />
          </FormField>
          <FormField label="State">
            <Input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="Maharashtra"
            />
          </FormField>
          <FormField label="Postal Code">
            <Input
              type="text"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              placeholder="411001"
            />
          </FormField>
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
            loading={isLoading}
          >
            {initialData?.id ? 'Update Account' : 'Create Account'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

