import React from 'react';
import Modal from '../../../components/common/Modal';

export default function APInvoiceEditModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Purchase Invoice"
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-3">
          <div>
            <label className="text-[10.4px] font-semibold text-zinc-700">Invoice Number</label>
            <input
              type="text"
              value={formData.invoiceNo}
              onChange={(e) => setFormData(prev => ({ ...prev, invoiceNo: e.target.value }))}
              className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] font-medium text-zinc-800 outline-none"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10.4px] font-semibold text-zinc-700">Invoice Date</label>
              <input
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] font-medium text-zinc-800 outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[10.4px] font-semibold text-zinc-700">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] font-medium text-zinc-800 outline-none"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-[10.4px] font-semibold text-zinc-700">Reference Number</label>
            <input
              type="text"
              value={formData.referenceNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
              className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] font-medium text-zinc-800 outline-none"
            />
          </div>
          <div>
            <label className="text-[10.4px] font-semibold text-zinc-700">Notes / Remarks</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full h-20 p-3 bg-white border border-zinc-200 rounded-lg text-[10.4px] font-medium text-zinc-800 outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 text-[10.4px] font-semibold text-zinc-700 hover:text-zinc-900 bg-white border border-zinc-200 rounded-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-1.5 text-[10.4px] font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-md"
          >
            {isSubmitting ? 'Saving...' : 'Update Purchase Invoice'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
