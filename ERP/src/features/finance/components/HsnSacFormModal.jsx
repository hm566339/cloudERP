import React, { useState } from 'react';
import { useApiMutation } from '../../../hooks/useApi';
import { hsnSacMasterApi } from '../../../api/account';
import Modal from '../../../components/common/Modal';
import CustomSelect from '../../../components/common/CustomSelect';
import GstSlabSelect from '../../../components/common/GstSlabSelect';

export default function HsnSacFormModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    code: '',
    type: 'HSN',
    description: '',
    gstSlabId: ''
  });

  const createHsnSacMutation = useApiMutation(hsnSacMasterApi.create);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.gstSlabId || !formData.type) {
      alert("Please fill in Description, Type, and GST Slab");
      return;
    }
    try {
      const res = await createHsnSacMutation.mutateAsync(formData);
      if (onSubmit) {
        // Find the created ID
        const createdId = res?.data?.id || res?.id;
        onSubmit(createdId);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || 'Failed to create HSN/SAC');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New HSN/SAC Master"
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Code</label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              className="input-field w-full"
              placeholder="Auto-generated if empty"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Type *</label>
            <CustomSelect
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              options={[
                { value: "HSN", label: "HSN (Goods)" },
                { value: "SAC", label: "SAC (Services)" }
              ]}
              searchable={false}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Description *</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="input-field w-full"
              placeholder="e.g., Management consulting services"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">GST Slab *</label>
            <GstSlabSelect
              name="gstSlabId"
              value={formData.gstSlabId}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100 dark:border-border-dark">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createHsnSacMutation.isPending}
            className="btn-primary"
          >
            {createHsnSacMutation.isPending ? 'Saving...' : 'Save HSN/SAC'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
