import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useUpdatePurchaseOrderAdvanceRequirementMutation } from '../../../api/purchase';
import { addAlert } from '../../notifications/notificationSlice';
import { X, DollarSign } from 'lucide-react';
import { useParams } from 'react-router-dom';

const RequireAdvanceModal = ({ isOpen, onClose, purchaseOrder, refetch }) => {
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [updateAdvanceRequirement, { isLoading }] = useUpdatePurchaseOrderAdvanceRequirementMutation();
  const dispatch = useDispatch();
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;

  if (!isOpen || !purchaseOrder) return null;

  const totalAmount = purchaseOrder.totalAmount || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(advanceAmount);
    
    if (isNaN(amount) || amount <= 0) {
      dispatch(addAlert({ type: 'error', message: 'Advance amount must be greater than 0.' }));
      return;
    }
    
    if (amount > totalAmount) {
      dispatch(addAlert({ type: 'error', message: 'Advance amount cannot exceed the Purchase Order total.' }));
      return;
    }

    try {
      await updateAdvanceRequirement({
        id: purchaseOrder.id,
        companyId,
        advanceRequired: true,
        advanceAmount: amount
      }).unwrap();
      
      dispatch(addAlert({ type: 'success', message: 'Advance payment requirement enabled successfully.' }));
      refetch && refetch();
      onClose();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.data?.message || err?.message || 'Failed to require advance payment' }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up relative">
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign size={18} />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">Require Advance Payment</h3>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded-md transition-colors">
            <X size={16} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 font-medium">Purchase Order Total</span>
              <span className="font-bold text-zinc-900 font-mono">
                {purchaseOrder.currency || 'INR'} {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          
          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
              Advance Amount <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-zinc-500 text-xs font-mono">{purchaseOrder.currency || 'INR'}</span>
              </div>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                max={totalAmount}
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                className="w-full pl-12 pr-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
                placeholder="Enter advance amount"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !advanceAmount}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 border border-transparent rounded-lg transition-colors flex items-center justify-center min-w-[80px]"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequireAdvanceModal;
