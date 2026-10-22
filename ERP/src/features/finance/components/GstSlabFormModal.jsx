import React, { useState, useMemo, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import { useApiMutation } from '../../../hooks/useApi';
import { gstSlabsApi } from '../../../api/account';

const GstSlabFormModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
  const [createSlabMutation, { isPending: isCreating }] = useApiMutation(gstSlabsApi.createGstSlab);
  const [updateSlabMutation, { isPending: isUpdating }] = useApiMutation((args) => gstSlabsApi.updateGstSlab(args.id, args));

  const [formData, setFormData] = useState({
    slabName: '',
    cgstRate: 0,
    sgstRate: 0,
    igstRate: 0,
    cessRate: 0,
    effectiveFrom: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          slabName: initialData.slabName || '',
          cgstRate: initialData.cgstRate || 0,
          sgstRate: initialData.sgstRate || 0,
          igstRate: initialData.igstRate || 0,
          cessRate: initialData.cessRate || 0,
          effectiveFrom: initialData.effectiveFrom || new Date().toISOString().split('T')[0]
        });
      } else {
        setFormData({
          slabName: '',
          cgstRate: 0,
          sgstRate: 0,
          igstRate: 0,
          cessRate: 0,
          effectiveFrom: new Date().toISOString().split('T')[0]
        });
      }
    }
  }, [isOpen, initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const currentTotalRate = useMemo(() => {
    return (
      (parseFloat(formData.cgstRate) || 0) +
      (parseFloat(formData.sgstRate) || 0) +
      (parseFloat(formData.igstRate) || 0) +
      (parseFloat(formData.cessRate) || 0)
    );
  }, [formData.cgstRate, formData.sgstRate, formData.igstRate, formData.cessRate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        data: {
          slabName: formData.slabName.trim(),
          cgstRate: parseFloat(formData.cgstRate) || 0,
          sgstRate: parseFloat(formData.sgstRate) || 0,
          igstRate: parseFloat(formData.igstRate) || 0,
          cessRate: parseFloat(formData.cessRate) || 0,
          effectiveFrom: formData.effectiveFrom
        }
      };

      let result;
      if (initialData?.id) {
        result = await updateSlabMutation.mutateAsync({ gstSlabId: initialData.id, data: submitData });
      } else {
        result = await createSlabMutation.mutateAsync(submitData);
      }
      
      const newSlabData = result?.data?.data || result?.data || result;
      if (onSuccess) {
        onSuccess(newSlabData);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save GST slab:', err);
      alert(`Error: ${err?.response?.data?.message || err?.message || 'Validation failed'}`);
    }
  };

  const isSaving = isCreating || isUpdating;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData?.id ? 'Edit GST Slab' : 'New GST Slab'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Slab Name *</label>
          <input
            type="text"
            name="slabName"
            value={formData.slabName}
            onChange={handleInputChange}
            className="input-field w-full"
            placeholder="e.g., GST 18%"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">CGST Rate (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              name="cgstRate"
              value={formData.cgstRate}
              onChange={handleInputChange}
              className="input-field w-full"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">SGST Rate (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              name="sgstRate"
              value={formData.sgstRate}
              onChange={handleInputChange}
              className="input-field w-full"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">IGST Rate (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              name="igstRate"
              value={formData.igstRate}
              onChange={handleInputChange}
              className="input-field w-full"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Cess Rate (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              name="cessRate"
              value={formData.cessRate}
              onChange={handleInputChange}
              className="input-field w-full"
            />
          </div>
        </div>

        <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-lg flex justify-between items-center">
          <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">Total GST Rate</span>
          <span className="text-xl font-bold text-blue-700 dark:text-blue-200">{currentTotalRate.toFixed(2)}%</span>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Effective From *</label>
          <input
            type="date"
            name="effectiveFrom"
            value={formData.effectiveFrom}
            onChange={handleInputChange}
            className="input-field w-full"
            required
          />
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
            disabled={isSaving}
            className="btn-primary"
          >
            {isSaving ? 'Saving...' : 'Save Slab'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default GstSlabFormModal;
