import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common';
import { useCreateLeadMutation, useUpdateLeadMutation } from '../../../api/sales-crm/crm.api';

export default function LeadFormModal({
  isOpen,
  onClose,
  initialData = null,
  companyId,
  sources = [],
  statuses = [],
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    organizationName: '',
    email: '',
    phone: '',
    leadSourceId: '',
    leadStatusId: '',
    state: '',
    gstin: '',
    notes: '',
    leadScore: 50,
  });

  const [createLead, { isLoading: isCreating }] = useCreateLeadMutation();
  const [updateLead, { isLoading: isUpdating }] = useUpdateLeadMutation();

  useEffect(() => {
    if (initialData) {
      setFormData({
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        organizationName: initialData.organizationName || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        leadSourceId: initialData.leadSourceId || '',
        leadStatusId: initialData.leadStatusId || '',
        state: initialData.state || '',
        gstin: initialData.gstin || '',
        notes: initialData.rawInquiryText || initialData.notes || '',
        leadScore: initialData.leadScore || 50,
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        organizationName: '',
        email: '',
        phone: '',
        leadSourceId: sources[0]?.id || '',
        leadStatusId: statuses[0]?.id || '',
        state: '',
        gstin: '',
        notes: '',
        leadScore: 50,
      });
    }
  }, [initialData, isOpen, sources, statuses]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (initialData?.id) {
        await updateLead({ id: initialData.id, data: formData, companyId }).unwrap();
      } else {
        await createLead({ data: formData, companyId }).unwrap();
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to save lead:', err);
    }
  };

  const isSubmitting = isCreating || isUpdating;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData?.id ? 'Edit Lead' : 'Create New Lead'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="e.g. Rahul"
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
              placeholder="e.g. Verma"
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
            Company / Organization Name
          </label>
          <input
            type="text"
            name="organizationName"
            value={formData.organizationName}
            onChange={handleChange}
            placeholder="e.g. Apex Enterprises Pvt Ltd"
            className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
          />
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
              placeholder="rahul@apex.com"
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
              Mobile / Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 98220 12345"
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
              Lead Source
            </label>
            <select
              name="leadSourceId"
              value={formData.leadSourceId}
              onChange={handleChange}
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
            >
              <option value="">Select source...</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.sourceName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
              Lead Status
            </label>
            <select
              name="leadStatusId"
              value={formData.leadStatusId}
              onChange={handleChange}
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
            >
              <option value="">Select status...</option>
              {statuses.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.statusName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
              State / Region
            </label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="e.g. Maharashtra"
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
              GSTIN (B2B)
            </label>
            <input
              type="text"
              name="gstin"
              value={formData.gstin}
              onChange={handleChange}
              placeholder="27AABCA1234A1Z5"
              maxLength={15}
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] uppercase focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
            Inquiry Notes / Requirements
          </label>
          <textarea
            name="notes"
            rows={2}
            value={formData.notes}
            onChange={handleChange}
            placeholder="Client needs 500 units of industrial components..."
            className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
          />
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
            disabled={isSubmitting}
            className="btn-primary text-xs px-4 py-1.5"
          >
            {isSubmitting ? 'Saving...' : initialData?.id ? 'Update Lead' : 'Create Lead'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

