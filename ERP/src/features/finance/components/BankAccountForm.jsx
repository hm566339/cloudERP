import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApi';
import CustomSelect from '../../../components/common/CustomSelect';

const ACCOUNT_TYPES = [
  { value: 'SAVINGS', label: 'Savings' },
  { value: 'CURRENT', label: 'Current' },
  { value: 'CASH_CREDIT', label: 'Cash Credit' },
  { value: 'OVERDRAFT', label: 'Overdraft' },
  { value: 'OTHERS', label: 'Others' }
];

export default function BankAccountForm({ isOpen, onClose, initialData, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    bankName: '',
    branchName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    accountHolderName: '',
    swiftCode: '',
    accountType: 'SAVINGS',
    openingBalance: 0,
    isPrimary: false,
    isActive: true,
  });

  const [errors, setErrors] = useState({});
  const isEditing = !!initialData?.id;

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          bankName: initialData.bankName || '',
          branchName: initialData.branchName || '',
          accountNumber: initialData.accountNumber || '',
          ifscCode: initialData.ifscCode || '',
          upiId: initialData.upiId || '',
          accountHolderName: initialData.accountHolderName || '',
          swiftCode: initialData.swiftCode || '',
          accountType: initialData.accountType || 'SAVINGS',
          openingBalance: initialData.openingBalance || 0,
          isPrimary: initialData.isPrimary !== undefined ? initialData.isPrimary : false,
          isActive: initialData.isActive !== undefined ? initialData.isActive : true,
        });
      } else {
        setFormData({
          bankName: '',
          branchName: '',
          accountNumber: '',
          ifscCode: '',
          upiId: '',
          accountHolderName: '',
          swiftCode: '',
          accountType: 'SAVINGS',
          openingBalance: 0,
          isPrimary: false,
          isActive: true,
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);



  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Auto-uppercase IFSC
    const processedValue = name === 'ifscCode' ? value.toUpperCase() : value;
    
    let finalValue = type === 'checkbox' ? checked : processedValue;
    if (name === 'openingBalance') {
      finalValue = value === '' ? '' : Number(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
    
    // clear error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.bankName) newErrors.bankName = 'Bank Name is required';
    if (!formData.branchName) newErrors.branchName = 'Branch Name is required';
    if (!formData.accountNumber) newErrors.accountNumber = 'Account Number is required';
    
    if (!formData.ifscCode) {
      newErrors.ifscCode = 'IFSC Code is required';
    } else if (!/^[A-Za-z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode)) {
      newErrors.ifscCode = 'Invalid IFSC code format (e.g. HDFC0001234)';
    }

    if (!formData.accountType) newErrors.accountType = 'Account Type is required';
    if (formData.openingBalance === '' || formData.openingBalance < 0) {
      newErrors.openingBalance = 'Opening balance must be 0 or greater';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    const payload = { ...formData };
    
    onSubmit(payload);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-zinc-950/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-full overflow-hidden animate-slide-up flex flex-col bg-white dark:bg-[#161922] rounded-2xl shadow-xl border border-zinc-200 dark:border-[#2A2F3D]">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-zinc-100 dark:border-[#2A2F3D] sticky top-0 bg-white dark:bg-[#161922] z-10">
          <h2 className="text-lg font-bold text-zinc-800 dark:text-[#E6E8EE]">{isEditing ? 'Edit Bank Account' : 'Create Bank Account'}</h2>
          <button type="button" onClick={onClose} className="p-1.5 text-zinc-400 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-[#E6E8EE] rounded-full hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 flex-1 min-h-0 overflow-y-auto text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1 md:col-span-1">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Bank Name *</label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                className={`input-field ${errors.bankName ? 'border-red-500' : ''}`}
              />
              {errors.bankName && <p className="text-red-500 text-xs mt-0.5">{errors.bankName}</p>}
            </div>

            <div className="space-y-1 md:col-span-1">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Branch Name *</label>
              <input
                type="text"
                name="branchName"
                value={formData.branchName}
                onChange={handleChange}
                className={`input-field ${errors.branchName ? 'border-red-500' : ''}`}
              />
              {errors.branchName && <p className="text-red-500 text-xs mt-0.5">{errors.branchName}</p>}
            </div>

            <div className="space-y-1 md:col-span-1">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Account Number *</label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                className={`input-field ${errors.accountNumber ? 'border-red-500' : ''}`}
              />
              {errors.accountNumber && <p className="text-red-500 text-xs mt-0.5">{errors.accountNumber}</p>}
            </div>

            <div className="space-y-1 md:col-span-1">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">IFSC Code *</label>
              <input
                type="text"
                name="ifscCode"
                value={formData.ifscCode}
                onChange={handleChange}
                className={`input-field ${errors.ifscCode ? 'border-red-500' : ''}`}
                placeholder="e.g. HDFC0001234"
              />
              {errors.ifscCode && <p className="text-red-500 text-xs mt-0.5">{errors.ifscCode}</p>}
            </div>

            <div className="space-y-1 md:col-span-1">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">UPI ID (Optional)</label>
              <input
                type="text"
                name="upiId"
                value={formData.upiId}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. user@upi"
              />
            </div>

            <div className="space-y-1 md:col-span-1">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Account Holder Name (Optional)</label>
              <input
                type="text"
                name="accountHolderName"
                value={formData.accountHolderName}
                onChange={handleChange}
                className="input-field"
                placeholder="Account Holder Name"
              />
            </div>

            <div className="space-y-1 md:col-span-1">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">SWIFT Code (Optional)</label>
              <input
                type="text"
                name="swiftCode"
                value={formData.swiftCode}
                onChange={handleChange}
                className="input-field"
                placeholder="SWIFT Code"
              />
            </div>

            <div className="space-y-1 md:col-span-1">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Account Type *</label>
              <CustomSelect
                name="accountType"
                value={formData.accountType}
                onChange={(e) => handleSelectChange('accountType', e.target.value)}
                className={`input-field ${errors.accountType ? 'border-red-500' : ''}`}
              >
                {ACCOUNT_TYPES.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </CustomSelect>
              {errors.accountType && <p className="text-red-500 text-xs mt-0.5">{errors.accountType}</p>}
            </div>

            <div className="space-y-1 md:col-span-1">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Opening Balance *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="openingBalance"
                value={formData.openingBalance}
                onChange={handleChange}
                className={`input-field ${errors.openingBalance ? 'border-red-500' : ''}`}
              />
              {errors.openingBalance && <p className="text-red-500 text-xs mt-0.5">{errors.openingBalance}</p>}
            </div>
            
            {isEditing && initialData?.glAccountCode && (
              <div className="md:col-span-2 mt-2 p-3 bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg">
                <p className="text-[8.8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Generated GL Account</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE]">
                  {initialData.glAccountCode} - {initialData.glAccountName}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">This GL account was automatically generated and mapped to this bank account.</p>
              </div>
            )}

            <div className="md:col-span-2 mt-2 flex items-center space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-zinc-300 dark:border-[#2A2F3D] rounded focus:ring-zinc-900/10 dark:focus:ring-white/10"
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Account is Active</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  name="isPrimary"
                  checked={formData.isPrimary}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-zinc-300 dark:border-[#2A2F3D] rounded focus:ring-zinc-900/10 dark:focus:ring-white/10"
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Primary Account</span>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-zinc-100 dark:border-[#2A2F3D]">
            <button type="button" onClick={onClose} className="btn-secondary px-5 py-2">
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary px-5 py-2 flex items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              ) : null}
              {isEditing ? 'Update Account' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
