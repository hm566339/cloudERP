import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Modal, FormField, Input, Select, Button } from '../../../components/common';

export default function LeadFormModal({ isOpen, onClose, onSubmit }) {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;

  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [source, setSource] = useState('Website');
  const [value, setValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCompany('');
      setContact('');
      setSource('Website');
      setValue('');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      companyId,
      company,
      contact,
      source,
      value: parseFloat(value) || 0,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Lead"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Company Name" required>
          <Input 
            type="text" 
            value={company}
            onChange={e => setCompany(e.target.value)}
            placeholder="e.g. Acme Corp"
            required
          />
        </FormField>
        
        <FormField label="Contact Person" required>
          <Input 
            type="text" 
            value={contact}
            onChange={e => setContact(e.target.value)}
            placeholder="e.g. John Doe"
            required
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Source">
            <Select 
              value={source}
              onChange={e => setSource(e.target.value)}
            >
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="Trade Show">Trade Show</option>
              <option value="Cold Call">Cold Call</option>
            </Select>
          </FormField>
          <FormField label="Estimated Value (₹)">
            <Input 
              type="number" 
              min="0"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="0"
            />
          </FormField>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-[#2A2F3D]">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm">
            Save Lead
          </Button>
        </div>
      </form>
    </Modal>
  );
}
