import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, IndianRupee } from 'lucide-react';

export default function PartialPaymentModal({ 
  isOpen, 
  onClose, 
  invoice, 
  onSubmit, 
  isSubmitting 
}) {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPaymentAmount('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !invoice) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    
    if (amount > invoice.outstandingAmount) {
      setError(`Payment amount cannot exceed the outstanding balance of ₹${invoice.outstandingAmount.toLocaleString()}`);
      return;
    }
    
    onSubmit(amount);
  };

  const remainingBalance = invoice.outstandingAmount - (parseFloat(paymentAmount) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-950/60 backdrop-blur-sm px-3 py-6 sm:px-4 sm:py-8">
      <div className="card my-auto w-full max-w-md max-h-[calc(100vh-3rem)] sm:max-h-[calc(100vh-4rem)] overflow-hidden animate-slide-up flex flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <IndianRupee size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-800">Record Payment</h2>
              <p className="text-xs text-zinc-500">Invoice {invoice.invoiceNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 flex-1 min-h-0 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Total Amount</p>
              <p className="text-lg font-bold text-zinc-800">₹{invoice.totalAmount?.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Outstanding</p>
              <p className="text-lg font-bold text-amber-700">₹{invoice.outstandingAmount?.toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700">Payment Amount <span className="text-red-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IndianRupee size={16} className="text-zinc-400" />
              </div>
              <input
                type="number"
                step="0.01"
                required
                min="0.01"
                max={invoice.outstandingAmount}
                value={paymentAmount}
                onChange={(e) => {
                  setPaymentAmount(e.target.value);
                  setError('');
                }}
                className="input-field pl-9 w-full text-lg font-semibold"
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-zinc-50 rounded-lg text-sm">
            <span className="text-zinc-600 font-medium">Remaining Balance:</span>
            <span className={`font-bold ${remainingBalance < 0 ? 'text-red-600' : 'text-zinc-800'}`}>
              ₹{remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !paymentAmount || remainingBalance < 0}
              className="btn-primary flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Record Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
