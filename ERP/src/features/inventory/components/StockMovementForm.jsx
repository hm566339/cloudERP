import React, { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';

export default function StockMovementForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading 
}) {
  const [formData, setFormData] = useState({
    movementNo: initialData?.movementNo || '',
    movementDate: initialData?.movementDate ? new Date(initialData.movementDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    movementType: initialData?.movementType || 'TRANSFER',
    status: initialData?.status || 'DRAFT',
    referenceType: initialData?.referenceType || 'MANUAL',
    referenceId: initialData?.referenceId || '',
    referenceNumber: initialData?.referenceNumber || '',
    remarks: initialData?.remarks || '',
    totalQuantity: initialData?.totalQuantity || 0,
    totalValue: initialData?.totalValue || 0,
    postedAt: initialData?.postedAt ? new Date(initialData.postedAt).toISOString().split('T')[0] : '',
    postedBy: initialData?.postedBy || '',
    reversedMovementId: initialData?.reversedMovementId || '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let parsedValue = value;
    
    if (type === 'number') {
      parsedValue = value === '' ? '' : Number(value);
    }
    
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.movementNo.trim()) newErrors.movementNo = 'Movement Number is required';
    if (!formData.movementDate) newErrors.movementDate = 'Movement Date is required';
    if (!formData.movementType) newErrors.movementType = 'Movement Type is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* General Details */}
        <div className="space-y-4">
          <h3 className="text-[10.4px] font-bold text-zinc-800 border-b border-zinc-100 pb-2">General Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
                Movement Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="movementNo"
                value={formData.movementNo}
                onChange={handleChange}
                disabled={!!initialData}
                className={`w-full h-9 px-3 rounded-md border text-[10.4px] bg-white transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.movementNo ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
                } disabled:bg-zinc-50 disabled:text-zinc-500`}
                autoFocus={!initialData}
              />
              {errors.movementNo && (
                <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle size={12} /> {errors.movementNo}
                </p>
              )}
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
                Movement Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="movementDate"
                value={formData.movementDate}
                onChange={handleChange}
                className={`w-full h-9 px-3 rounded-md border text-[10.4px] bg-white transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.movementDate ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
                }`}
              />
              {errors.movementDate && (
                <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle size={12} /> {errors.movementDate}
                </p>
              )}
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
                Movement Type <span className="text-rose-500">*</span>
              </label>
              <select
                name="movementType"
                value={formData.movementType}
                onChange={handleChange}
                className={`w-full h-9 px-3 rounded-md border text-[10.4px] bg-white transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.movementType ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
                }`}
              >
                <option value="TRANSFER">Transfer</option>
                <option value="ADJUSTMENT">Adjustment</option>
                <option value="RECEIPT">Receipt</option>
                <option value="ISSUE">Issue</option>
              </select>
            </div>
            
            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 text-[10.4px] bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="DRAFT">Draft</option>
                <option value="POSTED">Posted</option>
                <option value="REVERSED">Reversed</option>
              </select>
            </div>
          </div>
        </div>

        {/* References */}
        <div className="space-y-4">
          <h3 className="text-[10.4px] font-bold text-zinc-800 border-b border-zinc-100 pb-2">Reference Info</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50/50 p-4 rounded-lg border border-zinc-100">
            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Reference Type</label>
              <select
                name="referenceType"
                value={formData.referenceType}
                onChange={handleChange}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 text-[10.4px] bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="MANUAL">Manual</option>
                <option value="PURCHASE_ORDER">Purchase Order</option>
                <option value="SALES_ORDER">Sales Order</option>
                <option value="STOCK_ADJUSTMENT">Stock Adjustment</option>
              </select>
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Reference Number</label>
              <input
                type="text"
                name="referenceNumber"
                value={formData.referenceNumber}
                onChange={handleChange}
                placeholder="e.g. PO-10294"
                className="w-full h-9 px-3 rounded-md border border-zinc-200 text-[10.4px] bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Reference ID (UUID)</label>
              <input
                type="text"
                name="referenceId"
                value={formData.referenceId}
                onChange={handleChange}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 text-[10.4px] bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Totals & Remarks */}
        <div className="space-y-4">
          <h3 className="text-[10.4px] font-bold text-zinc-800 border-b border-zinc-100 pb-2">Totals & Remarks</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Total Quantity</label>
              <input
                type="number"
                name="totalQuantity"
                value={formData.totalQuantity}
                onChange={handleChange}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 text-[10.4px] bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Total Value</label>
              <input
                type="number"
                name="totalValue"
                value={formData.totalValue}
                onChange={handleChange}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 text-[10.4px] bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Remarks</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows={2}
                className="w-full p-3 rounded-md border border-zinc-200 text-[10.4px] bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
            
          </div>
        </div>

      </div>

      <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-zinc-100 bg-zinc-50/50 mt-auto shrink-0">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-[10.4px] font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 hover:text-zinc-900 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-[10.4px] font-semibold text-white bg-zinc-900 border border-transparent rounded-md hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {initialData ? 'Update Header' : 'Save Header'}
        </button>
      </div>
    </form>
  );
}
