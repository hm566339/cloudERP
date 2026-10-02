import React, { useState, useEffect } from 'react';
import ExpandedRowDetails from '../components/ExpandedRowDetails';
import { 
  ArrowLeft, Save, Plus, Trash2, PackageOpen, Info, AlertCircle 
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { 
  useOpeningStockDetail, 
  useOpeningStockCreate, 
  useOpeningStockUpdate 
} from '../../../api/inventory';
import useUrlFilters from '../../../hooks/useUrlFilters';

export default function OpeningStockDetails() {
  const { id } = useParams();
  const navigate = useNavigate();  const dispatch = useAppDispatch();
  const { prefix } = useUrlFilters();
  
  const isNew = id === 'new';

  const { openingStock, isLoading: isFetching } = useOpeningStockDetail(isNew ? null : id);
  const createMutation = useOpeningStockCreate();
  const updateMutation = useOpeningStockUpdate();

  const [formData, setFormData] = useState({
    openingStockNo: '',
    openingDate: new Date().toISOString().split('T')[0],
    warehouseId: '',
    status: 'DRAFT',
    remarks: '',
    lines: []
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (openingStock && !isNew) {
      setFormData({
        openingStockNo: openingStock.openingStockNo || '',
        openingDate: openingStock.openingDate ? openingStock.openingDate.split('T')[0] : '',
        warehouseId: openingStock.warehouseId || '',
        status: openingStock.status || 'DRAFT',
        remarks: openingStock.remarks || '',
        lines: openingStock.lines || []
      });
    }
  }, [openingStock, isNew]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleAddLine = () => {
    setFormData(prev => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          id: Date.now().toString(), // Temporary client-side ID
          productId: '',
          warehouseLocationId: '',
          batchId: '',
          serialId: '',
          quantity: 0,
          unitCost: 0,
          totalValue: 0,
          uomId: ''
        }
      ]
    }));
  };

  const handleRemoveLine = (index) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index)
    }));
  };

  const handleLineChange = (index, field, value) => {
    setFormData(prev => {
      const newLines = [...prev.lines];
      
      // Handle numeric fields
      if (['quantity', 'unitCost', 'totalValue'].includes(field)) {
        newLines[index][field] = Number(value);
      } else {
        newLines[index][field] = value;
      }
      
      // Auto-compute totalValue if quantity or unitCost changes
      if (field === 'quantity' || field === 'unitCost') {
        const qty = field === 'quantity' ? Number(value) : newLines[index].quantity;
        const cost = field === 'unitCost' ? Number(value) : newLines[index].unitCost;
        newLines[index].totalValue = qty * cost;
      }

      return { ...prev, lines: newLines };
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.openingStockNo?.trim()) newErrors.openingStockNo = 'Document No is required';
    if (!formData.warehouseId?.trim()) newErrors.warehouseId = 'Warehouse is required';
    if (!formData.openingDate) newErrors.openingDate = 'Date is required';
    
    if (formData.lines.length === 0) {
      newErrors.lines = 'At least one line item is required.';
    } else {
      formData.lines.forEach((line, idx) => {
        if (!line.productId) newErrors[`line_${idx}_productId`] = 'Required';
        if (line.quantity <= 0) newErrors[`line_${idx}_quantity`] = 'Must be > 0';
      });
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      dispatch(addAlert({ type: 'error', message: 'Please fix the errors before submitting.' }));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (isNew) {
        await createMutation.mutateAsync(formData);
        dispatch(addAlert({ type: 'success', message: 'Opening Stock created successfully' }));
        navigate(`${prefix}inventory/opening-stocks`);
      } else {
        await updateMutation.mutateAsync([id, formData]);
        dispatch(addAlert({ type: 'success', message: 'Opening Stock updated successfully' }));
      }
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error.response?.data?.message || 'Operation failed' }));
    }
  };

  const isLoading = createMutation.isLoading || updateMutation.isLoading || (isFetching && !isNew);

  return (
    <div className="animate-fade-in pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-full transition-colors active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-3">
              <PackageOpen size={24} className="text-blue-600" />
              {isNew ? 'New Opening Stock' : `Opening Stock: ${formData.openingStockNo}`}
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Initialize physical inventory balances for a warehouse.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-[10.4px] font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 text-[10.4px] font-semibold text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {isNew ? 'Create Document' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Header Information */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-5 space-y-5">
            <h2 className="text-base font-bold text-zinc-900 border-b border-zinc-100 pb-3 mb-4">Document Details</h2>
            
            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
                Document Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="openingStockNo"
                value={formData.openingStockNo}
                onChange={handleChange}
                placeholder="e.g. OS-2026-001"
                className={`w-full h-9 px-3 rounded-md border text-[10.4px] outline-none transition-all focus:ring-2 focus:ring-primary/20 ${
                  errors.openingStockNo ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
                }`}
              />
              {errors.openingStockNo && <p className="text-[8.8px] text-rose-500 mt-1 font-medium">{errors.openingStockNo}</p>}
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
                Warehouse ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="warehouseId"
                value={formData.warehouseId}
                onChange={handleChange}
                className={`w-full h-9 px-3 rounded-md border text-[10.4px] outline-none transition-all focus:ring-2 focus:ring-primary/20 ${
                  errors.warehouseId ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
                }`}
              />
              {errors.warehouseId && <p className="text-[8.8px] text-rose-500 mt-1 font-medium">{errors.warehouseId}</p>}
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
                Opening Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="openingDate"
                value={formData.openingDate}
                onChange={handleChange}
                className={`w-full h-9 px-3 rounded-md border text-[10.4px] outline-none transition-all focus:ring-2 focus:ring-primary/20 ${
                  errors.openingDate ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
                }`}
              />
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 text-[10.4px] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="APPROVED">Approved</option>
              </select>
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Remarks</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows={3}
                placeholder="Add any notes here..."
                className="w-full p-3 rounded-md border border-zinc-200 text-[10.4px] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex gap-3 text-amber-800">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold">Important Note</p>
              <p>Once an opening stock document is <b>APPROVED</b>, it will automatically generate corresponding stock ledger entries. This action cannot be reversed without administrative privileges.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Line Items Grid */}
        <div className="lg:col-span-2">
          <div className="card h-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-zinc-50/50">
              <h2 className="text-base font-bold text-zinc-900">Line Items</h2>
              <button
                type="button"
                onClick={handleAddLine}
                className="h-8 px-3 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 rounded-md transition-colors flex items-center gap-1.5"
              >
                <Plus size={14} strokeWidth={2.5} />
                Add Item
              </button>
            </div>

            {errors.lines && (
              <div className="p-3 mx-4 mt-4 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={14} /> {errors.lines}
              </div>
            )}

            <div className="flex-1 overflow-x-auto p-4">
              {formData.lines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50">
                  <PackageOpen size={32} className="text-zinc-300 mb-3" />
                  <p className="text-sm font-semibold text-zinc-700">No items added</p>
                  <p className="text-xs text-zinc-500 mt-1 max-w-[160px]">Click 'Add Item' to start building this opening stock document.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 text-[8.8px] uppercase tracking-wider text-zinc-500 font-bold bg-zinc-50/50">
                    <th className="w-16">S.No.</th>
                      <th className="px-3 py-2 w-10 text-center">#</th>
                      <th className="px-3 py-2 min-w-[120px]">Product ID *</th>
                      <th className="px-3 py-2 min-w-[96px]">Location ID</th>
                      <th className="px-3 py-2 w-24">Qty *</th>
                      <th className="px-3 py-2 w-28">Unit Cost</th>
                      <th className="px-3 py-2 w-28">Total Value</th>
                      <th className="px-3 py-2 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.lines.map((line, index) => (
                    <tr key={index} className="border-b border-zinc-100 hover:bg-zinc-50/30 transition-colors group">
                      <td className="text-zinc-500 font-medium">{typeof page !== 'undefined' && typeof size !== 'undefined' ? (page * size) + index + 1 : index + 1}</td>
                        <td className="px-3 py-2 text-center text-xs font-medium text-zinc-400">
                          {index + 1}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={line.productId}
                            onChange={(e) => handleLineChange(index, 'productId', e.target.value)}
                            className={`w-full h-8 px-2 rounded border text-xs outline-none focus:border-primary ${
                              errors[`line_${index}_productId`] ? 'border-rose-300 bg-rose-50' : 'border-zinc-200 bg-white'
                            }`}
                            placeholder="Product ID"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={line.warehouseLocationId}
                            onChange={(e) => handleLineChange(index, 'warehouseLocationId', e.target.value)}
                            className="w-full h-8 px-2 rounded border border-zinc-200 bg-white text-xs outline-none focus:border-primary"
                            placeholder="Loc ID"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            value={line.quantity}
                            onChange={(e) => handleLineChange(index, 'quantity', e.target.value)}
                            className={`w-full h-8 px-2 rounded border text-xs outline-none focus:border-primary ${
                              errors[`line_${index}_quantity`] ? 'border-rose-300 bg-rose-50' : 'border-zinc-200 bg-white'
                            }`}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.unitCost}
                            onChange={(e) => handleLineChange(index, 'unitCost', e.target.value)}
                            className="w-full h-8 px-2 rounded border border-zinc-200 bg-white text-xs outline-none focus:border-primary"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            readOnly
                            value={line.totalValue}
                            className="w-full h-8 px-2 rounded border border-transparent bg-zinc-50 text-zinc-900 font-semibold text-xs outline-none cursor-not-allowed"
                            tabIndex={-1}
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(index)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Remove Line"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                  ))}
                </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
