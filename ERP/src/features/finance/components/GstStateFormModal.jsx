import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import { useCreateGstStateMutation, useUpdateGstStateMutation } from '../../../api/account/accounting.api';
import { Loader2 } from 'lucide-react';

const INITIAL_STATE = {
  stateCode: '',
  stateName: '',
  unionTerritory: false
};

const GstStateFormModal = ({ isOpen, onClose, onSuccess, editData }) => {
  const companyId = JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [createGstState, { isLoading: isCreating }] = useCreateGstStateMutation();
  const [updateGstState, { isLoading: isUpdating }] = useUpdateGstStateMutation();
  const isLoading = isCreating || isUpdating;
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          stateCode: editData.stateCode || '',
          stateName: editData.stateName || '',
          unionTerritory: editData.unionTerritory !== undefined ? editData.unionTerritory : (editData.isUnionTerritory || false)
        });
      } else {
        setFormData(INITIAL_STATE);
      }
      setError(null);
    }
  }, [isOpen, editData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (editData) {
        await updateGstState({ id: editData.id, ...formData, companyId }).unwrap();
      } else {
        await createGstState({ ...formData, companyId }).unwrap();
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Failed to save GST State Code');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? "Edit GST State Code" : "Create GST State Code"}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">State Code *</label>
            <input
              type="text"
              name="stateCode"
              value={formData.stateCode}
              onChange={handleChange}
              className="input-field w-full"
              required
              placeholder="e.g. 29"
              maxLength={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">State Name *</label>
            <input
              type="text"
              name="stateName"
              value={formData.stateName}
              onChange={handleChange}
              className="input-field w-full"
              required
              placeholder="e.g. Karnataka"
            />
          </div>
        </div>



        <div className="flex flex-col gap-3 pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="unionTerritory"
              checked={formData.unionTerritory}
              onChange={handleChange}
              className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-zinc-700">Is Union Territory?</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
            disabled={isLoading}
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {editData ? "Update State" : "Create State"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default GstStateFormModal;
