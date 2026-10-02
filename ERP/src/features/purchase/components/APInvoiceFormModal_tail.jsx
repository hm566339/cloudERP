
import CustomSelect from '../../../components/common/CustomSelect';
      items: processedItems
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-950/60 backdrop-blur-sm px-3 py-6 sm:px-4 sm:py-8">
      <div className="card my-auto w-full max-w-4xl max-h-[calc(100vh-3rem)] sm:max-h-[calc(100vh-4rem)] overflow-hidden animate-slide-up flex flex-col bg-white shadow-xl">
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-zinc-800">{initialData ? 'Edit AP Bill' : 'Generate AP Bill'}</h2>
          <button type="button" onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-50 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 flex-1 min-h-0 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Vendor *</label>
              <CustomSelect 
                name="vendorId"
                className="input-field" 
                value={formData.vendorId} 
                onChange={handleInputChange}
                required
              >
                <option value="">Select Vendor...</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.vendorName || v.companyName || v.name}</option>
                ))}
              </CustomSelect>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Invoice No *</label>
              <input 
                name="invoiceNo"
                type="text" 
                className="input-field" 
                value={formData.invoiceNo}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Currency</label>
              <input 
                name="invoiceCurrency"
                type="text" 
                className="input-field" 
                value={formData.invoiceCurrency}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Invoice Date *</label>
              <input 
                name="invoiceDate"
                type="date" 
                className="input-field" 
                value={formData.invoiceDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Due Date *</label>
              <input 
                name="dueDate"
                type="date" 
                className="input-field" 
                value={formData.dueDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Exchange Rate</label>
              <input 
                name="exchangeRate"
                type="number"
                step="0.000001" 
                className="input-field" 
                value={formData.exchangeRate}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-zinc-700">Line Items</h3>
              <button type="button" onClick={handleAddItem} className="btn-secondary text-xs py-1.5 px-3">
                <Plus size={14} /> Add Item
              </button>
            </div>

            <div className="border border-zinc-200 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-xs uppercase">
                  <tr>
                    <th className="p-3 font-semibold">Description</th>
                    <th className="p-3 font-semibold w-24">Qty</th>
                    <th className="p-3 font-semibold w-32">Unit Price</th>
                    <th className="p-3 font-semibold w-32">Tax Amount</th>
                    <th className="p-3 font-semibold w-32 text-right">Total</th>
                    <th className="p-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 staggered-list">
                  {items.map((item) => {
                    const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0) + (parseFloat(item.taxAmount) || 0);
                    return (
                      <tr key={item.id} className="bg-white">
                        <td className="p-2">
                          <input 
                            type="text" 
                            placeholder="Item description" 
                            className="input-field py-2" 
                            value={item.description}
                            onChange={e => handleItemChange(item.id, 'description', e.target.value)}
                            required
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="number" 
                            min="0.01"
                            step="0.01"
                            className="input-field py-2 text-center" 
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
                            className="input-field py-2 text-right" 
                            value={item.unitPrice}
                            onChange={e => handleItemChange(item.id, 'unitPrice', e.target.value)}
                            required
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="number" 
                            min="0"
                            step="0.01"
                            className="input-field py-2 text-right" 
                            value={item.taxAmount}
                            onChange={e => handleItemChange(item.id, 'taxAmount', e.target.value)}
                          />
                        </td>
                        <td className="p-2 text-right font-medium text-zinc-700">
                          {lineTotal.toFixed(2)}
                        </td>
                        <td className="p-2 text-center">
                          <button 
                            type="button" 
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                            disabled={items.length === 1}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Notes</label>
              <textarea
                name="notes"
                className="input-field min-h-[64px]"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes or terms..."
              ></textarea>
            </div>

            <div className="flex flex-col gap-2 w-full text-sm ml-auto max-w-xs">
              <div className="flex justify-between items-center text-zinc-600">
                <span>Subtotal:</span>
                <span>{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-600">
                <span>Total Tax:</span>
                <span>{totalTaxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-600">
                <span>TDS Amount:</span>
                <input 
                  type="number"
                  name="tdsAmount"
                  min="0"
                  step="0.01"
                  className="input-field py-1 px-2 w-24 text-right ml-2"
                  value={formData.tdsAmount}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex justify-between items-center text-zinc-600">
                <span>Paid Amount:</span>
                <input 
                  type="number"
                  name="paidAmount"
                  min="0"
                  step="0.01"
                  className="input-field py-1 px-2 w-24 text-right ml-2"
                  value={formData.paidAmount}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex justify-between text-lg font-bold text-primary mt-2 pt-2 border-t border-zinc-100">
                <span>Outstanding:</span>
                <span>{outstandingAmount.toFixed(2)} {formData.invoiceCurrency}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" >
              {initialData ? 'Update Bill' : 'Generate Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
