import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common';
import { useCreateCrmContactMutation } from '../../../api/sales-crm/crm.api';

export default function ContactFormModal({
  isOpen,
  onClose,
  initialData = null,
  companyId,
  accounts = [],
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

  const [createContact, { isLoading }] = useCreateCrmContactMutation();

  useEffect(() => {
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
    } else {
      setFormData({
        accountId: accounts[0]?.id || '',
        firstName: '',
        lastName: '',
        designation: '',
        department: '',
        email: '',
        phone: '',
        decisionMakerRole: 'INFLUENCER',
        isPrimaryContact: false,
      });
    }
  }, [initialData, isOpen, accounts]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createContact({ data: formData, companyId }).unwrap();
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to save contact:', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData?.id ? 'Edit Contact' : 'Create Contact'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
            Associated Account / Organization *
          </label>
          <select
            name="accountId"
            required
            value={formData.accountId}
            onChange={handleChange}
            className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
          >
            <option value="">Select Account...</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.accountName}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
              First Name *
            </label>
            <input
              type="text"
              name="firstName"
              required
              value={formData.firstName}
              onChange={handleChange}
              placeholder="e.g. Priya"
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="e.g. Kulkarni"
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
              Designation / Title
            </label>
            <input
              type="text"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              placeholder="e.g. VP Procurement"
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
              Decision Role
            </label>
            <select
              name="decisionMakerRole"
              value={formData.decisionMakerRole}
              onChange={handleChange}
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
            >
              <option value="ECONOMIC_BUYER">Economic Buyer</option>
              <option value="CHAMPION">Champion</option>
              <option value="TECHNICAL_EVALUATOR">Technical Evaluator</option>
              <option value="INFLUENCER">Influencer</option>
              <option value="END_USER">End User</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="priya@tata.com"
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 98220 99887"
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="isPrimary"
            name="isPrimaryContact"
            checked={formData.isPrimaryContact}
            onChange={handleChange}
            className="rounded border-zinc-300 text-primary focus:ring-primary"
          />
          <label htmlFor="isPrimary" className="text-xs font-semibold text-zinc-800 dark:text-[#E6E8EE]">
            Mark as primary contact for account
          </label>
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
            {isLoading ? 'Saving...' : 'Create Contact'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

