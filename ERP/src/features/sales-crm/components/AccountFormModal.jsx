import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common';
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
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
            Account / Enterprise Name *
          </label>
          <input
            type="text"
            name="accountName"
            required
            value={formData.accountName}
            onChange={handleChange}
            placeholder="e.g. Tata Steel Processing Ltd"
            className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
              Account Type
            </label>
            <select
              name="accountType"
              value={formData.accountType}
              onChange={handleChange}
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
            >
              <option value="PROSPECT">Prospect</option>
              <option value="CUSTOMER">Customer</option>
              <option value="PARTNER">Partner</option>
              <option value="VENDOR">Vendor</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
              Account Tier
            </label>
            <select
              name="accountTier"
              value={formData.accountTier}
              onChange={handleChange}
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
            >
              <option value="TIER_1">Tier 1 (Enterprise)</option>
              <option value="TIER_2">Tier 2 (Mid-Market)</option>
              <option value="TIER_3">Tier 3 (SMB)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
              Industry
            </label>
            <input
              type="text"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              placeholder="e.g. Manufacturing"
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
              GSTIN (15 characters)
            </label>
            <input
              type="text"
              name="gstin"
              maxLength={15}
              value={formData.gstin}
              onChange={handleChange}
              placeholder="27AAACT1234A1Z5"
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] uppercase focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
              PAN Number (10 characters)
            </label>
            <input
              type="text"
              name="panNumber"
              maxLength={10}
              value={formData.panNumber}
              onChange={handleChange}
              placeholder="AAACT1234A"
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] uppercase focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
              Credit Limit (₹)
            </label>
            <input
              type="number"
              min="0"
              name="creditLimit"
              value={formData.creditLimit}
              onChange={handleChange}
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
              Payment Terms (Days)
            </label>
            <input
              type="number"
              min="0"
              name="paymentTermsDays"
              value={formData.paymentTermsDays}
              onChange={handleChange}
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
              City
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Pune"
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
              State
            </label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="Maharashtra"
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
              Postal Code
            </label>
            <input
              type="text"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              placeholder="411001"
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-[#2A2F3D]">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs px-3.5 py-1.5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary text-xs px-4 py-1.5"
          >
            {isLoading ? 'Saving...' : initialData?.id ? 'Update Account' : 'Create Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

