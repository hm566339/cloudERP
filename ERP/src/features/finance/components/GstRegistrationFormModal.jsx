import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import { useCreateGstRegistrationMutation, useUpdateGstRegistrationMutation, useGetGstStatesQuery } from '../../../api/account/accounting.api';
import { Loader2 } from 'lucide-react';
import CustomSelect from '../../../components/common/CustomSelect';

const INITIAL_STATE = {
  gstin: '',
  pan: '',
  registrationType: 'REGULAR',
  registeredDate: '',
  legalName: '',
  tradeName: '',
  stateCodeId: '',
  isDefault: false,
  branchId: ''
};

const REGISTRATION_TYPES = [
  { value: 'REGULAR', label: 'Regular' },
  { value: 'COMPOSITION', label: 'Composition' },
  { value: 'UNREGISTERED', label: 'Unregistered' },
  { value: 'CONSUMER', label: 'Consumer' }
];

const GstRegistrationFormModal = ({ isOpen, onClose, onSuccess, editData }) => {
  const companyId = JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [createGstRegistration, { isLoading: isCreating }] = useCreateGstRegistrationMutation();
  const [updateGstRegistration, { isLoading: isUpdating }] = useUpdateGstRegistrationMutation();
  const { data: statesData, isLoading: isLoadingStates } = useGetGstStatesQuery(companyId, { skip: !isOpen });
  const isLoading = isCreating || isUpdating;
  const [error, setError] = useState(null);

  let gstStates = [];
  if (Array.isArray(statesData)) {
    gstStates = statesData;
  } else if (statesData?.data?.records) {
    gstStates = statesData.data.records;
  } else if (statesData?.records) {
    gstStates = statesData.records;
  } else if (statesData?.data?.states) {
    gstStates = statesData.data.states;
  } else if (statesData?.states) {
    gstStates = statesData.states;
  } else if (statesData?.data) {
    gstStates = Array.isArray(statesData.data) ? statesData.data : [];
  }

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          gstin: editData.gstin || '',
          pan: editData.pan || '',
          registrationType: editData.registrationType || 'REGULAR',
          registeredDate: editData.registeredDate || '',
          legalName: editData.legalName || '',
          tradeName: editData.tradeName || '',
          stateCodeId: editData.stateCode?.id || editData.stateCodeId || '',
          isDefault: editData.default === true,
          branchId: editData.branch?.id || editData.branchId || ''
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

    // Prepare payload
    const payload = { ...formData, companyId };
    
    // Auto-extract PAN from GSTIN if PAN is empty and GSTIN is valid length
    if (!payload.pan && payload.gstin && payload.gstin.length >= 12) {
      payload.pan = payload.gstin.substring(2, 12);
    }
    
    // Ensure empty fields are completely removed to avoid Jackson deserialization errors
    Object.keys(payload).forEach(key => {
      if (payload[key] === '' || payload[key] === null) {
        delete payload[key];
      }
    });
    
    try {
      if (editData) {
        await updateGstRegistration({ id: editData.id, companyId, ...payload }).unwrap();
      } else {
        await createGstRegistration({ companyId, ...payload }).unwrap();
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Failed to save GST Registration');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? "Edit GST Registration" : "Create GST Registration"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">GSTIN *</label>
            <input
              type="text"
              name="gstin"
              value={formData.gstin}
              onChange={handleChange}
              className="input-field w-full"
              required
              placeholder="e.g. 29ABCDE1234F1Z5"
              maxLength={15}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">PAN</label>
            <input
              type="text"
              name="pan"
              value={formData.pan}
              onChange={handleChange}
              className="input-field w-full"
              placeholder="Auto-extracted from GSTIN"
              maxLength={10}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Registration Type *</label>
            <CustomSelect
              name="registrationType"
              value={formData.registrationType}
              onChange={handleChange}
              className="input-field w-full"
              required
            >
              {REGISTRATION_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </CustomSelect>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Registered Date</label>
            <input
              type="date"
              name="registeredDate"
              value={formData.registeredDate}
              onChange={handleChange}
              className="input-field w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Legal Name *</label>
            <input
              type="text"
              name="legalName"
              value={formData.legalName}
              onChange={handleChange}
              className="input-field w-full"
              required
              placeholder="Legal entity name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Trade Name</label>
            <input
              type="text"
              name="tradeName"
              value={formData.tradeName}
              onChange={handleChange}
              className="input-field w-full"
              placeholder="Trade name (if different)"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">State Code *</label>
          <CustomSelect
            name="stateCodeId"
            value={formData.stateCodeId}
            onChange={handleChange}
            className="input-field w-full"
            required
            disabled={isLoadingStates}
          >
            <option value="">Select State</option>
            {gstStates.map(state => (
              <option key={state.id} value={state.id}>
                {state.stateCode} - {state.stateName}
              </option>
            ))}
          </CustomSelect>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="isDefault"
              checked={formData.isDefault}
              onChange={handleChange}
              className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-zinc-700">Default GST Registration</span>
          </label>
          <p className="text-xs text-zinc-500 ml-6">Use this GST registration by default for accounting and invoice calculations.</p>
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
            {editData ? "Update Registration" : "Create Registration"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default GstRegistrationFormModal;
