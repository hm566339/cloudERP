import React from 'react';
import Modal from '../../../../components/common/Modal';

export default function SalesInvoiceEditModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  isLoading
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Sales Invoice"
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-3">
          <div>
            <label className="text-[10.4px] font-semibold text-zinc-700 dark:text-[#A0A6B5]">Invoice Number</label>
            <input
              type="text"
              value={formData.invoiceNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
              className="w-full h-9 px-3 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-[10.4px] font-medium text-zinc-800 dark:text-[#E6E8EE] outline-none"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-[10.4px] font-semibold text-zinc-700 dark:text-[#A0A6B5]">Invoice Date</label>
              <input
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                className="w-full h-9 px-3 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-[10.4px] font-medium text-zinc-800 dark:text-[#E6E8EE] outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[10.4px] font-semibold text-zinc-700 dark:text-[#A0A6B5]">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full h-9 px-3 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-[10.4px] font-medium text-zinc-800 dark:text-[#E6E8EE] outline-none"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-[10.4px] font-semibold text-zinc-700 dark:text-[#A0A6B5]">Reference Number</label>
            <input
              type="text"
              value={formData.referenceNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
              className="w-full h-9 px-3 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-[10.4px] font-medium text-zinc-800 dark:text-[#E6E8EE] outline-none"
            />
          </div>
          <div>
            <label className="text-[10.4px] font-semibold text-zinc-700 dark:text-[#A0A6B5]">Remarks</label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              className="w-full h-20 p-3 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-[10.4px] font-medium text-zinc-800 dark:text-[#E6E8EE] outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-[#2A2F3D]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 text-[10.4px] font-semibold text-zinc-700 dark:text-[#A0A6B5] hover:text-zinc-900 dark:hover:text-[#E6E8EE] bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md dark:hover:bg-[#222736]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-1.5 text-[10.4px] font-semibold text-white bg-zinc-900 dark:bg-[#4C8DFF] hover:bg-zinc-800 dark:hover:bg-[#6AA1FF] rounded-md"
          >
            {isLoading ? 'Saving...' : 'Update Invoice'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
