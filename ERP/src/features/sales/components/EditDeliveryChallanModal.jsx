import React, { useState, useEffect } from 'react';
import { X, Truck, Save, AlertCircle, Package } from 'lucide-react';
import { 
  useGetDeliveryChallanByIdQuery, 
  useUpdateDeliveryChallanMutation 
} from '../../../api/sales-crm/sales.api';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';

export default function EditDeliveryChallanModal({ isOpen, onClose, challanId, companyId, onSuccess }) {
  const dispatch = useAppDispatch();
  const [updateDeliveryChallan, { isLoading: isSubmitting }] = useUpdateDeliveryChallanMutation();

  const { data: responseData, isLoading: isLoadingDetails } = useGetDeliveryChallanByIdQuery(
    { id: challanId, companyId },
    { skip: !isOpen || !challanId }
  );

  const challan = responseData?.data?.id ? responseData.data : (responseData?.id ? responseData : null);

  const [formData, setFormData] = useState({
    deliveryAddressId: '',
    transporterId: '',
    referenceNumber: '',
    dispatchDate: '',
    vehicleNumber: '',
    lrNumber: '',
    notes: '',
  });
  const [itemRows, setItemRows] = useState([]);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (challan) {
      setFormData({
        deliveryAddressId: challan.deliveryAddressId || '',
        transporterId: challan.transporterId || '',
        referenceNumber: challan.referenceNumber || '',
        dispatchDate: challan.dispatchDate ? challan.dispatchDate.split('T')[0] : '',
        vehicleNumber: challan.vehicleNumber || '',
        lrNumber: challan.lrNumber || '',
        notes: challan.notes || '',
      });

      const mapped = (challan.items || []).map((it) => ({
        id: it.id,
        itemName: it.itemName || 'Item',
        description: it.description || '',
        unit: it.unit || '',
        quantity: it.quantity ?? 1,
        notes: it.notes || '',
      }));
      setItemRows(mapped);
      setSubmitError(null);
    }
  }, [challan]);

  if (!isOpen) return null;

  const handleFieldChange = (field, val) => {
    if (submitError) setSubmitError(null);
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleItemQtyChange = (index, val) => {
    if (submitError) setSubmitError(null);
    const newItems = [...itemRows];
    newItems[index].quantity = val === '' ? '' : parseFloat(val) || 0;
    setItemRows(newItems);
  };

  const handleItemNotesChange = (index, val) => {
    const newItems = [...itemRows];
    newItems[index].notes = val;
    setItemRows(newItems);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting || isLoadingDetails) return;

    // Validate quantities
    const invalidQty = itemRows.some((it) => Number(it.quantity) <= 0);
    if (invalidQty) {
      setSubmitError('All items must have a quantity greater than 0.');
      return;
    }

    try {
      const payload = {
        data: {
          deliveryAddressId: formData.deliveryAddressId || undefined,
          referenceNumber: formData.referenceNumber || undefined,
          dispatchDate: formData.dispatchDate ? new Date(formData.dispatchDate).toISOString().split('T')[0] : undefined,
          transporterId: formData.transporterId || undefined,
          vehicleNumber: formData.vehicleNumber || undefined,
          lrNumber: formData.lrNumber || undefined,
          notes: formData.notes || undefined,
          items: itemRows.map((it) => ({
            id: it.id,
            quantity: Number(it.quantity),
            notes: it.notes || undefined,
          })),
        },
        companyId,
      };

      await updateDeliveryChallan({ id: challanId, ...payload }).unwrap();
      dispatch(addAlert({ type: 'success', message: 'Delivery Challan updated successfully.' }));
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Failed to update Delivery Challan';
      setSubmitError(msg);
      dispatch(addAlert({ type: 'error', message: msg }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50 rounded-t-xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100 text-indigo-600">
              <Truck size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
                Edit Delivery Challan {challan?.dcNumber ? `(${challan.dcNumber})` : ''}
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Update dispatch metadata and item quantities
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 bg-zinc-50/30 space-y-5">
          {isLoadingDetails ? (
            <div className="py-16 text-center text-zinc-400">
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium">Loading details...</span>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-2xs space-y-4">
                <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                  Transport & Metadata
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider mb-1 block">
                      Dispatch Date
                    </label>
                    <input
                      type="date"
                      value={formData.dispatchDate}
                      onChange={(e) => handleFieldChange('dispatchDate', e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-800 outline-none focus:border-zinc-400"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider mb-1 block">
                      Reference Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PO Ref / Gate Pass..."
                      value={formData.referenceNumber}
                      onChange={(e) => handleFieldChange('referenceNumber', e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-800 outline-none focus:border-zinc-400"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider mb-1 block">
                      Vehicle Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MH12AB1234..."
                      value={formData.vehicleNumber}
                      onChange={(e) => handleFieldChange('vehicleNumber', e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-800 outline-none focus:border-zinc-400"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider mb-1 block">
                      LR Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. LR-98765..."
                      value={formData.lrNumber}
                      onChange={(e) => handleFieldChange('lrNumber', e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-800 outline-none focus:border-zinc-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider mb-1 block">
                    Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Add delivery instructions or notes..."
                    value={formData.notes}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    className="w-full p-2.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-800 outline-none focus:border-zinc-400"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Package size={14} className="text-zinc-400" />
                    Challan Items
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-white border-b border-zinc-200">
                      <tr>
                        <th className="px-3 py-2.5 font-semibold text-zinc-600">Product</th>
                        <th className="px-3 py-2.5 font-semibold text-zinc-600 w-32 text-right">Quantity</th>
                        <th className="px-3 py-2.5 font-semibold text-zinc-600">Item Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 bg-white">
                      {itemRows.map((it, idx) => (
                        <tr key={it.id || idx}>
                          <td className="px-3 py-2.5">
                            <div className="font-semibold text-zinc-900">{it.itemName}</div>
                            {it.description && (
                              <div className="text-[10px] text-zinc-500 truncate max-w-[220px]">{it.description}</div>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              value={it.quantity}
                              onChange={(e) => handleItemQtyChange(idx, e.target.value)}
                              className="w-24 px-2 py-1 text-right border border-zinc-300 rounded-md text-xs outline-none focus:border-indigo-500"
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <input
                              type="text"
                              placeholder="Notes for this item..."
                              value={it.notes}
                              onChange={(e) => handleItemNotesChange(idx, e.target.value)}
                              className="w-full px-2 py-1 border border-zinc-200 rounded-md text-xs outline-none focus:border-zinc-400"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {submitError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-xs">
                  <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600" />
                  <p className="font-medium">{submitError}</p>
                </div>
              )}
            </>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 bg-white flex items-center justify-end gap-3 rounded-b-xl shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoadingDetails}
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
