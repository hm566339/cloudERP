import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useGetActiveCustomersQuery } from '../../../api/sales-crm';
import { useGetHsnSacsQuery } from '../../../api/account/accounting.api';
import CustomSelect from '../../../components/common/CustomSelect';
import HsnSacSelect from '../../../components/common/HsnSacSelect';
import useDebounce from '../../../hooks/useDebounce';
import { useGetProductsQuery } from '../../../api/inventory/inventory.api';

export default function InvoiceFormModal({ isOpen, onClose, onSubmit, initialData }) {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;

  const { data: customersData } = useGetActiveCustomersQuery(companyId, { skip: !isOpen });
  const customers = Array.isArray(customersData) ? customersData : customersData?.data || customersData?.content || [];

  const { data: hsnData } = useGetHsnSacsQuery(companyId, { skip: !isOpen });
  const hsnSacs = Array.isArray(hsnData) ? hsnData : hsnData?.data || hsnData?.content || [];

  const authUser = JSON.parse(localStorage.getItem("auth_user")) || {};
  const isSystemAdmin = authUser?.roles?.includes('ROLE_SYSTEM_ADMIN') || authUser?.roles?.includes('ROLE_SUPER_ADMIN') || authUser?.role === 'SYSTEM_ADMIN';

  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const debouncedItemSearchTerm = useDebounce(itemSearchTerm, 500);

  const { data: productsData, isLoading: productsLoading } = useGetProductsQuery({ companyId, isSystemAdmin, searchKey: debouncedItemSearchTerm, page: 0, size: 50 }, { skip: !isOpen });
  const products = Array.isArray(productsData) ? productsData : productsData?.data?.content || productsData?.data || productsData?.content || [];

  const [formData, setFormData] = useState({
    customerId: '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    invoiceCurrency: 'INR',
    exchangeRate: 1,
    placeOfSupply: '',
    receivedAmount: 0,
    notes: ''
  });

  const [items, setItems] = useState([
    { id: Date.now(), itemId: '', hsnSacId: '', itemName: '', description: '', quantity: 1, unitPrice: 0, unit: 'PCS', notes: '' }
  ]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          customerId: initialData.customerId || '',
          invoiceNumber: initialData.invoiceNumber || '',
          invoiceDate: initialData.invoiceDate || new Date().toISOString().split('T')[0],
          dueDate: initialData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          invoiceCurrency: initialData.invoiceCurrency || 'INR',
          exchangeRate: initialData.exchangeRate || 1,
          placeOfSupply: initialData.placeOfSupply || '',
          receivedAmount: initialData.receivedAmount || 0,
          notes: initialData.notes || initialData.remarks || ''
        });

        const rawItems = initialData.items || initialData.lineItems || [];
        if (rawItems.length > 0) {
          setItems(rawItems.map(item => ({
            id: item.id || Date.now() + Math.random(),
            itemId: item.itemId || '',
            hsnSacId: item.hsnSacId || item.hsnSacMaster?.id || '',
            itemName: item.itemName || item.description || '',
            description: item.description || '',
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            unit: item.unit || 'PCS',
            notes: item.notes || ''
          })));
        } else {
          setItems([{ id: Date.now(), itemId: '', hsnSacId: '', itemName: '', description: '', quantity: 1, unitPrice: 0, unit: 'PCS', notes: '' }]);
        }
      } else {
        setFormData({
          customerId: '',
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
          invoiceDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          invoiceCurrency: 'INR',
          exchangeRate: 1,
          placeOfSupply: '',
          receivedAmount: 0,
          notes: ''
        });
        setItems([{ id: Date.now(), itemId: '', hsnSacId: '', itemName: '', description: '', quantity: 1, unitPrice: 0, unit: 'PCS', notes: '' }]);
      }
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value
    }));
  };

  const handleItemChange = (id, field, value) => {
    if (id === 'SEARCH' && field === 'itemSearch') {
      setItemSearchTerm(value);
      return;
    }
    setItems(items.map(item => {
      if (item.id === id) {
        let updated = { ...item, [field]: value };
        if (field === 'itemId' && value) {
          const selectedProduct = products.find(p => p.id === value);
          if (selectedProduct) {
            updated.itemName = selectedProduct.productName || selectedProduct.name || '';
            updated.description = selectedProduct.description || '';
            updated.unitPrice = selectedProduct.sellingPrice || selectedProduct.salesPrice || selectedProduct.standardCost || selectedProduct.unitPrice || selectedProduct.price || 0;
            updated.unit = selectedProduct.baseUomCode || selectedProduct.unit || 'PCS';
          }
        }
        return updated;
      }
      return item;
    }));
  };

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), itemId: '', hsnSacId: '', itemName: '', description: '', quantity: 1, unitPrice: 0, unit: 'PCS', notes: '' }]);
  };

  const handleRemoveItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!formData.customerId) return alert('Please select a customer.');
    if (items.some(i => (!i.itemName?.trim() && !i.description?.trim()) || parseFloat(i.quantity) <= 0 || parseFloat(i.unitPrice) < 0)) {
      return alert('Please fill all item details (Item name/description, Qty > 0, Price >= 0).');
    }

    let subtotal = 0;
    const finalItems = items.map(item => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const amount = qty * price;
      subtotal += amount;

      return {
        // Omitting id for new items, keeping it if it's a UUID from backend
        id: (typeof item.id === 'string' && item.id.includes('-')) ? item.id : null,
        itemId: item.itemId || null,
        description: item.description || item.itemName || 'Item',
        quantity: qty,
        unitPrice: price,
        taxableAmount: amount,
        taxAmount: 0,
        revenueAccountId: null,
        totalAmount: amount
      };
    });

    const receivedAmount = parseFloat(formData.receivedAmount) || 0;
    const totalAmount = subtotal;
    const outstandingAmount = totalAmount - receivedAmount;

    const payload = {
      customerId: formData.customerId,
      receivableAccountId: null,
      invoiceNumber: formData.invoiceNumber,
      invoiceDate: formData.invoiceDate,
      dueDate: formData.dueDate,
      invoiceCurrency: formData.invoiceCurrency || 'INR',
      exchangeRate: parseFloat(formData.exchangeRate) || 1,
      subtotal: subtotal,
      taxAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      cessAmount: 0,
      outputCgstAccountId: null,
      outputSgstAccountId: null,
      outputIgstAccountId: null,
      outputCessAccountId: null,
      tdsAmount: 0,
      totalAmount: totalAmount,
      receivedAmount: receivedAmount,
      outstandingAmount: outstandingAmount,
      items: finalItems,
      notes: formData.notes || "",
      dueDateValid: new Date(formData.dueDate) >= new Date(formData.invoiceDate)
    };

    onSubmit({ data: payload });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[1120px] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-zinc-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-zinc-800">{initialData ? 'Edit Sales Invoice' : 'Create Sales Invoice'}</h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-50 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmitForm} className="p-5 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Header Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Customer *</label>
              <CustomSelect
                name="customerId"
                value={formData.customerId}
                onChange={(e) => handleChange({ target: { name: 'customerId', value: e.target.value } })}
                options={customers.map(c => ({ value: c.id, label: c.customerName || c.name }))}
                placeholder="Select Customer..."
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Invoice Number *</label>
              <input
                type="text"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleChange}
                className="input-field w-full"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Place Of Supply</label>
              <input
                type="text"
                name="placeOfSupply"
                value={formData.placeOfSupply}
                onChange={handleChange}
                className="input-field w-full"
                placeholder="e.g. MH, DL"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Invoice Date *</label>
              <input type="date" name="invoiceDate" value={formData.invoiceDate} onChange={handleChange} className="input-field w-full" required />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Due Date *</label>
              <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="input-field w-full" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Currency</label>
                <input type="text" name="invoiceCurrency" value={formData.invoiceCurrency} onChange={handleChange} className="input-field w-full" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Ex. Rate</label>
                <input type="number" step="0.000001" name="exchangeRate" value={formData.exchangeRate} onChange={handleChange} className="input-field w-full" required />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-zinc-700">Line Items</h3>
              <button type="button" onClick={handleAddItem} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                <Plus size={14} /> Add Item
              </button>
            </div>
            <div className="border border-zinc-200 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase">
                  <tr>
                    <th className="p-2.5 font-semibold w-36">Item Name *</th>
                    <th className="p-2.5 font-semibold w-32">HSN / SAC</th>
                    <th className="p-2.5 font-semibold">Description</th>
                    <th className="p-2.5 font-semibold w-24">Qty *</th>
                    <th className="p-2.5 font-semibold w-28">Unit Price *</th>
                    <th className="p-2.5 font-semibold w-20">Unit</th>
                    <th className="p-2.5 font-semibold w-32">Notes</th>
                    <th className="p-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {items.map((item) => (
                    <tr key={item.id} className="bg-white">
                      <td className="p-2">
                        <CustomSelect
                          className="input-field py-1.5 w-full bg-white text-xs"
                          value={item.itemId || ''}
                          onChange={e => handleItemChange(item.id, 'itemId', e.target.value)}
                          searchable={true}
                          onSearch={(term) => handleItemChange('SEARCH', 'itemSearch', term)}
                          placeholder="Select Item"
                        >
                          <option value="">Select Item</option>
                          {productsLoading ? (
                            <option disabled>Loading...</option>
                          ) : (
                            products.map(p => (
                              <option key={p.id} value={p.id}>{p.productName || p.name}</option>
                            ))
                          )}
                        </CustomSelect>
                      </td>
                      <td className="p-2 min-w-[112px]">
                        <HsnSacSelect
                          value={item.hsnSacId}
                          onChange={e => handleItemChange(item.id, 'hsnSacId', e.target.value)}
                          buttonClassName="px-2 py-1.5 bg-white border border-zinc-200 rounded-md text-xs text-left w-full hover:border-zinc-300 flex items-center justify-between"
                          placeholder="Select HSN/SAC..."
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="Description"
                          className="input-field py-1.5 w-full"
                          value={item.description}
                          onChange={e => handleItemChange(item.id, 'description', e.target.value)}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          className="input-field py-1.5 w-full text-center"
                          value={item.quantity}
                          onChange={e => handleItemChange(item.id, 'quantity', e.target.value)}
                          required
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="input-field py-1.5 w-full text-right"
                          value={item.unitPrice}
                          onChange={e => handleItemChange(item.id, 'unitPrice', e.target.value)}
                          required
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="PCS"
                          className="input-field py-1.5 w-full uppercase"
                          value={item.unit}
                          onChange={e => handleItemChange(item.id, 'unit', e.target.value)}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="Notes"
                          className="input-field py-1.5 w-full"
                          value={item.notes}
                          onChange={e => handleItemChange(item.id, 'notes', e.target.value)}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-zinc-400 hover:text-red-500"
                          disabled={items.length === 1}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes & Received Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="input-field w-full h-20 resize-none"
                placeholder="Additional notes or payment terms..."
              ></textarea>
            </div>

            <div className="space-y-2 max-w-xs ml-auto w-full">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Received Amount</label>
              <input
                type="number"
                name="receivedAmount"
                step="0.01"
                min="0"
                value={formData.receivedAmount}
                onChange={handleChange}
                className="input-field w-full text-right font-medium"
              />
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-2 p-4 border-t border-zinc-100 bg-zinc-50">
          <button type="button" onClick={onClose} className="btn-secondary py-1.5 px-4 text-sm">Cancel</button>
          <button type="button" onClick={handleSubmitForm} className="btn-primary py-1.5 px-4 text-sm">Save Sales Invoice</button>
        </div>
      </div>
    </div>
  );
}
