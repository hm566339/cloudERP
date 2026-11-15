import React, { useState } from 'react';
import { Modal } from '../../../components/common';
import { Plus, Trash2, Calculator, AlertTriangle, FileCheck2 } from 'lucide-react';
import { useCreateCrmQuotationMutation } from '../../../api/sales-crm/crm.api';

const GST_SLABS = [0, 5, 12, 18, 28];

export default function QuotationFormModal({
  isOpen,
  onClose,
  companyId,
  accounts = [],
  opportunities = [],
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    accountId: '',
    opportunityId: '',
    title: '',
    validUntilDays: 30,
    isInterState: false,
    termsAndConditions: '1. Prices are valid for 30 days.\n2. Delivery within 14 business days from PO.\n3. Standard warranty applies.',
    notes: '',
  });

  const [items, setItems] = useState([
    {
      description: '',
      hsnCode: '',
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      gstRate: 18,
    },
  ]);

  const [errorMsg, setErrorMsg] = useState(null);
  const [createQuotation, { isLoading }] = useCreateCrmQuotationMutation();

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        description: '',
        hsnCode: '',
        quantity: 1,
        unitPrice: 0,
        discountPercent: 0,
        gstRate: 18,
      },
    ]);
  };

  const removeItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const calculations = items.map((item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const disc = Number(item.discountPercent) || 0;
    const rate = Number(item.gstRate) || 0;

    const baseAmount = qty * price;
    const discountAmount = (baseAmount * disc) / 100;
    const taxableAmount = Math.max(0, baseAmount - discountAmount);
    const taxAmount = (taxableAmount * rate) / 100;
    const totalAmount = taxableAmount + taxAmount;

    return {
      baseAmount,
      discountAmount,
      taxableAmount,
      taxAmount,
      totalAmount,
    };
  });

  const subtotal = calculations.reduce((acc, c) => acc + c.baseAmount, 0);
  const totalDiscount = calculations.reduce((acc, c) => acc + c.discountAmount, 0);
  const taxableTotal = calculations.reduce((acc, c) => acc + c.taxableAmount, 0);
  const totalTax = calculations.reduce((acc, c) => acc + c.taxAmount, 0);
  const grandTotal = taxableTotal + totalTax;
  const overallDiscountPercent = subtotal > 0 ? (totalDiscount / subtotal) * 100 : 0;
  const requiresSpecialApproval = overallDiscountPercent > 15;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.accountId) {
      setErrorMsg('Please select an Account for this quotation.');
      return;
    }
    if (items.some((it) => !it.description.trim() || it.unitPrice <= 0)) {
      setErrorMsg('All line items must have a description and unit price greater than 0.');
      return;
    }

    try {
      setErrorMsg(null);
      const payload = {
        accountId: formData.accountId,
        opportunityId: formData.opportunityId || null,
        title: formData.title || 'Quotation',
        validityDays: Number(formData.validUntilDays) || 30,
        termsAndConditions: formData.termsAndConditions,
        notes: formData.notes,
        isInterState: formData.isInterState,
        items: items.map((it, idx) => ({
          lineNumber: idx + 1,
          description: it.description.trim(),
          hsnSacCode: it.hsnCode.trim() || null,
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          discountPercent: Number(it.discountPercent) || 0,
          taxRatePercent: Number(it.gstRate) || 0,
        })),
      };

      await createQuotation({ companyId, data: payload }).unwrap();
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMsg(err?.data?.message || err.message || 'Failed to create quotation');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Commercial Quotation"
      maxWidth="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-400">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
              Account / Client *
            </label>
            <select
              required
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
            >
              <option value="">Select Account...</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountName || acc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
              Linked Opportunity (Optional)
            </label>
            <select
              value={formData.opportunityId}
              onChange={(e) => setFormData({ ...formData, opportunityId: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
            >
              <option value="">None / Direct Quotation</option>
              {opportunities.map((opp) => (
                <option key={opp.id} value={opp.id}>
                  {opp.title} ({opp.stageName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
              Quotation Title / Subject
            </label>
            <input
              type="text"
              placeholder="e.g. Q4 Cloud Infrastructure Supply"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-6 p-2.5 bg-zinc-50 dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isInterState"
              checked={formData.isInterState}
              onChange={(e) => setFormData({ ...formData, isInterState: e.target.checked })}
              className="rounded border-zinc-300 dark:border-[#2A2F3D] text-primary"
            />
            <label htmlFor="isInterState" className="text-xs text-zinc-700 dark:text-[#A0A6B5] cursor-pointer">
              Inter-State Transaction (Apply IGST instead of CGST + SGST)
            </label>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-zinc-500">Validity:</span>
            <input
              type="number"
              min="1"
              max="180"
              value={formData.validUntilDays}
              onChange={(e) => setFormData({ ...formData, validUntilDays: e.target.value })}
              className="w-16 px-2 py-1 text-xs rounded border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1C202B] text-zinc-800 dark:text-[#E6E8EE] text-center"
            />
            <span className="text-xs text-zinc-500">Days</span>
          </div>
        </div>

        {/* Line Items Table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] flex items-center gap-1.5">
              <Calculator size={14} /> Line Items & Taxes ({items.length})
            </label>
            <button
              type="button"
              onClick={addItem}
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              <Plus size={13} /> Add Item
            </button>
          </div>

          <div className="border border-zinc-200 dark:border-[#2A2F3D] rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100 dark:bg-[#1C202B] text-zinc-600 dark:text-[#A0A6B5] uppercase text-[10px]">
                <tr>
                  <th className="p-2 w-10 text-center">#</th>
                  <th className="p-2">Description *</th>
                  <th className="p-2 w-24">HSN / SAC</th>
                  <th className="p-2 w-20 text-center">Qty</th>
                  <th className="p-2 w-28 text-right">Price (₹)</th>
                  <th className="p-2 w-20 text-center">Disc %</th>
                  <th className="p-2 w-24 text-center">GST</th>
                  <th className="p-2 w-28 text-right">Total (₹)</th>
                  <th className="p-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-[#2A2F3D] bg-white dark:bg-[#161922]">
                {items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-[#1C202B]/40">
                    <td className="p-2 text-center text-zinc-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="p-2">
                      <input
                        type="text"
                        required
                        placeholder="Product / Service description"
                        value={it.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-zinc-200 dark:border-[#2A2F3D] bg-transparent text-zinc-800 dark:text-[#E6E8EE]"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="e.g. 998313"
                        value={it.hsnCode}
                        onChange={(e) => handleItemChange(idx, 'hsnCode', e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-zinc-200 dark:border-[#2A2F3D] bg-transparent text-zinc-800 dark:text-[#E6E8EE]"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-zinc-200 dark:border-[#2A2F3D] bg-transparent text-zinc-800 dark:text-[#E6E8EE] text-center"
                      />
                    </td>
                    <td className="p-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={it.unitPrice}
                        onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-zinc-200 dark:border-[#2A2F3D] bg-transparent text-zinc-800 dark:text-[#E6E8EE] text-right font-mono"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={it.discountPercent}
                        onChange={(e) => handleItemChange(idx, 'discountPercent', e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-zinc-200 dark:border-[#2A2F3D] bg-transparent text-zinc-800 dark:text-[#E6E8EE] text-center"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <select
                        value={it.gstRate}
                        onChange={(e) => handleItemChange(idx, 'gstRate', Number(e.target.value))}
                        className="w-full px-1.5 py-1 text-xs rounded border border-zinc-200 dark:border-[#2A2F3D] bg-transparent text-zinc-800 dark:text-[#E6E8EE]"
                      >
                        {GST_SLABS.map((slab) => (
                          <option key={slab} value={slab}>
                            {slab}% {formData.isInterState ? 'IGST' : 'GST'}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2 text-right font-mono font-semibold text-zinc-800 dark:text-[#E6E8EE]">
                      ₹{calculations[idx].totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        disabled={items.length <= 1}
                        className="text-zinc-400 hover:text-rose-500 disabled:opacity-30"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calculation Summary Card */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-4 p-3 bg-zinc-50 dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg">
          <div className="flex-1 space-y-2">
            {requiresSpecialApproval && (
              <div className="p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0" />
                <span>
                  High Discount Alert: Overall discount is {overallDiscountPercent.toFixed(1)}% (&gt; 15%). This quotation will require Finance Manager workflow approval before sending.
                </span>
              </div>
            )}
            <textarea
              rows={2}
              placeholder="Terms & Conditions..."
              value={formData.termsAndConditions}
              onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1C202B] text-zinc-800 dark:text-[#E6E8EE]"
            />
          </div>

          <div className="w-full md:w-64 space-y-1.5 text-xs text-right">
            <div className="flex justify-between text-zinc-500">
              <span>Subtotal:</span>
              <span className="font-mono">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Total Discount:</span>
                <span className="font-mono">-₹{totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-zinc-500">
              <span>Taxable Value:</span>
              <span className="font-mono">₹{taxableTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-zinc-500">
              <span>{formData.isInterState ? 'IGST Total:' : 'CGST + SGST Total:'}</span>
              <span className="font-mono">₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-zinc-900 dark:text-white pt-2 border-t border-zinc-200 dark:border-[#2A2F3D]">
              <span>Grand Total:</span>
              <span className="font-mono text-primary">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-[#2A2F3D]">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs px-3.5 py-1.5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5"
          >
            <FileCheck2 size={14} />
            {isLoading ? 'Creating Quotation...' : 'Create Quotation'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

