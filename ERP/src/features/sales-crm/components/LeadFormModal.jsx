import React, { useState, useEffect, useMemo } from 'react';
import { Modal, FormField, Input, Select, Textarea, Button } from '../../../components/common';
import {
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useGetCrmLeadSourcesQuery,
  useGetCrmLeadStatusesQuery,
} from '../../../api/sales-crm/crm.api';

const DEFAULT_SOURCES = [
  { id: 'DIRECT', sourceName: 'Direct / Inbound' },
  { id: 'WEBSITE', sourceName: 'Company Website' },
  { id: 'INDIAMART', sourceName: 'IndiaMART Marketplace' },
  { id: 'TRADEINDIA', sourceName: 'TradeIndia Marketplace' },
  { id: 'JUSTDIAL', sourceName: 'JustDial Portal' },
  { id: 'META_ADS', sourceName: 'Facebook / Instagram Ads' },
  { id: 'GOOGLE_ADS', sourceName: 'Google Ads' },
  { id: 'COLD_CALL', sourceName: 'Cold Outreach' },
  { id: 'REFERRAL', sourceName: 'Customer Referral' },
  { id: 'EXHIBITION', sourceName: 'Trade Show / Exhibition' },
  { id: 'OTHER', sourceName: 'Other / General' },
];

const DEFAULT_STATUSES = [
  { id: 'NEW', statusName: 'New / Open' },
  { id: 'CONTACTED', statusName: 'Contacted' },
  { id: 'QUALIFIED', statusName: 'Qualified' },
  { id: 'PROPOSAL', statusName: 'Proposal Sent' },
  { id: 'NEGOTIATION', statusName: 'In Negotiation' },
  { id: 'UNQUALIFIED', statusName: 'Unqualified' },
  { id: 'CONVERTED', statusName: 'Converted to Deal' },
  { id: 'LOST', statusName: 'Lost Lead' },
];

const toArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.content)) return res.data.content;
  return [];
};

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

  const { data: fetchedSourcesRes } = useGetCrmLeadSourcesQuery(companyId, { skip: !isOpen });
  const { data: fetchedStatusesRes } = useGetCrmLeadStatusesQuery(companyId, { skip: !isOpen });

  const availableSources = useMemo(() => {
    const fromProps = toArray(sources);
    if (fromProps.length > 0) return fromProps;
    const fromApi = toArray(fetchedSourcesRes);
    if (fromApi.length > 0) return fromApi;
    return DEFAULT_SOURCES;
  }, [sources, fetchedSourcesRes]);

  const availableStatuses = useMemo(() => {
    const fromProps = toArray(statuses);
    if (fromProps.length > 0) return fromProps;
    const fromApi = toArray(fetchedStatusesRes);
    if (fromApi.length > 0) return fromApi;
    return DEFAULT_STATUSES;
  }, [statuses, fetchedStatusesRes]);

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
        leadSourceId: initialData.leadSourceId || availableSources[0]?.id || '',
        leadStatusId: initialData.leadStatusId || availableStatuses[0]?.id || '',
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
        leadSourceId: availableSources[0]?.id || '',
        leadStatusId: availableStatuses[0]?.id || '',
        state: '',
        gstin: '',
        notes: '',
        leadScore: 50,
      });
    }
  }, [initialData, isOpen, availableSources, availableStatuses]);

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
          <FormField label="First Name" required>
            <Input
              type="text"
              name="firstName"
              required
              value={formData.firstName}
              onChange={handleChange}
              placeholder="e.g. Rahul"
            />
          </FormField>
          <FormField label="Last Name">
            <Input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="e.g. Verma"
            />
          </FormField>
        </div>

        <FormField label="Company / Organization Name">
          <Input
            type="text"
            name="organizationName"
            value={formData.organizationName}
            onChange={handleChange}
            placeholder="e.g. Apex Enterprises Pvt Ltd"
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Email Address">
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="rahul@apex.com"
            />
          </FormField>
          <FormField label="Mobile / Phone Number" required>
            <Input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 98220 12345"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Lead Source">
            <Select
              name="leadSourceId"
              value={formData.leadSourceId}
              onChange={handleChange}
            >
              <option value="">Select source...</option>
              {availableSources.map((s) => (
                <option key={s.id || s.sourceCode} value={s.id || s.sourceCode}>
                  {s.sourceName || s.name || s.sourceCode}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Lead Status">
            <Select
              name="leadStatusId"
              value={formData.leadStatusId}
              onChange={handleChange}
            >
              <option value="">Select status...</option>
              {availableStatuses.map((st) => (
                <option key={st.id || st.statusCode} value={st.id || st.statusCode}>
                  {st.statusName || st.name || st.statusCode}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="State / Region">
            <Input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="e.g. Maharashtra"
            />
          </FormField>
          <FormField label="GSTIN (B2B)">
            <Input
              type="text"
              name="gstin"
              value={formData.gstin}
              onChange={handleChange}
              placeholder="27AABCA1234A1Z5"
              maxLength={15}
              className="uppercase"
            />
          </FormField>
        </div>

        <FormField label="Inquiry Notes / Requirements">
          <Textarea
            name="notes"
            rows={2}
            value={formData.notes}
            onChange={handleChange}
            placeholder="Client needs 500 units of industrial components..."
          />
        </FormField>

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
            loading={isSubmitting}
          >
            {initialData?.id ? 'Update Lead' : 'Create Lead'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

