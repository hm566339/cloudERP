import React, { useState, useEffect } from 'react';
import ExpandedRowDetails from '../components/ExpandedRowDetails';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, ArrowLeft, Plus, Trash2, Calendar, FileText, LayoutList
} from 'lucide-react';
import { 
  useStockAdjustmentDetail, 
  useStockAdjustmentCreate, 
  useStockAdjustmentUpdate 
} from '../../../api/inventory';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';

export default function StockAdjustmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();  const dispatch = useAppDispatch();
  const isNew = !id || id === 'new';

  const { stockAdjustment, isLoading: isFetching } = useStockAdjustmentDetail(isNew ? null : id);
  const createMutation = useStockAdjustmentCreate();
  const updateMutation = useStockAdjustmentUpdate();

  const [header, setHeader] = useState({
    adjustmentNo: '',
    adjustmentDate: new Date().toISOString().split('T')[0],
    warehouseId: '',
    locationId: '',
    reason: '',
    remarks: '',
    status: 'DRAFT'
  });

  const [lines, setLines] = useState([]);

  useEffect(() => {
    if (stockAdjustment && !isNew) {
      setHeader({
        adjustmentNo: stockAdjustment.adjustmentNo || '',
        adjustmentDate: stockAdjustment.adjustmentDate ? new Date(stockAdjustment.adjustmentDate).toISOString().split('T')[0] : '',
        warehouseId: stockAdjustment.warehouseId || '',
        locationId: stockAdjustment.locationId || '',
        reason: stockAdjustment.reason || '',
        remarks: stockAdjustment.remarks || '',
        status: stockAdjustment.status || 'DRAFT'
      });
      setLines(stockAdjustment.lines || []);
    }
  }, [stockAdjustment, isNew]);

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setHeader(prev => ({ ...prev, [name]: value }));
  };

  const addLine = () => {
    setLines(prev => [
      ...prev, 
      { 
        id: `temp-${Date.now()}`,
        productId: '', 
        batchId: '', 
        serialId: '', 
        adjustmentType: 'INCREASE', 
        quantity: 1, 
        unitCost: 0, 
        adjustmentValue: 0 
      }
    ]);
  };

  const removeLine = (index) => {
    setLines(prev => prev.filter((_, i) => i !== index));
  };

  const handleLineChange = (index, field, value) => {
    setLines(prev => {
      const newLines = [...prev];
      newLines[index] = { ...newLines[index], [field]: value };
      
      // Auto calc adjustment value
      if (field === 'quantity' || field === 'unitCost') {
        const qty = Number(newLines[index].quantity) || 0;
        const cost = Number(newLines[index].unitCost) || 0;
        newLines[index].adjustmentValue = qty * cost;
      }
      
      return newLines;
    });
  };

  const handleSave = async () => {
    if (!header.adjustmentNo || !header.warehouseId) {
      dispatch(addAlert({ type: 'error', message: 'Adjustment No and Warehouse ID are required' }));
      return;
    }
    if (lines.length === 0) {
      dispatch(addAlert({ type: 'error', message: 'At least one line item is required' }));
      return;
    }

    const payload = {
      ...header,
      lines: lines.map((l, index) => ({
        stockAdjustmentId: isNew ? undefined : id,
        productId: l.productId,
        batchId: l.batchId,
        serialId: l.serialId,
        adjustmentType: l.adjustmentType,
        quantity: Number(l.quantity) || 0,
        unitCost: Number(l.unitCost) || 0,
        adjustmentValue: Number(l.adjustmentValue) || 0
      }))
    };

    try {
      if (isNew) {
        await createMutation.mutateAsync(payload);
        dispatch(addAlert({ type: 'success', message: 'Stock Adjustment created successfully' }));
      } else {
        await updateMutation.mutateAsync([id, payload]);
        dispatch(addAlert({ type: 'success', message: 'Stock Adjustment updated successfully' }));
      }
      navigate('../stock-adjustments');
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error.response?.data?.message || 'Failed to save' }));
    }
  };

  if (isFetching) {
    return <div className="p-8 text-center text-zinc-500">Loading document...</div>;
  }

  const isSaving = createMutation.isLoading || updateMutation.isLoading;

  return (
    <div className="animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('../stock-adjustments')}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-200 transition-colors"
          >
            <ArrowLeft size={18} className="text-zinc-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-3">
              {isNew ? 'New Stock Adjustment' : `Adjustment ${header.adjustmentNo}`}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || header.status === 'COMPLETED'}
            className="btn-primary flex items-center gap-2"
          >
            {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? 'Saving...' : 'Save Document'}
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          
          {/* Header Card */}
          <div className="card p-5">
            <h2 className="text-[11.2px] font-bold text-zinc-800 mb-4 flex items-center gap-2 border-b border-zinc-100 pb-3">
              <FileText size={16} className="text-zinc-400" /> General Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Adjustment Number *</label>
                <input
                  type="text"
                  name="adjustmentNo"
                  value={header.adjustmentNo}
                  onChange={handleHeaderChange}
                  disabled={header.status === 'COMPLETED'}
                  className="w-full h-9 px-3 rounded-md border border-zinc-200 text-[10.4px] bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Adjustment Date</label>
                <input
                  type="date"
                  name="adjustmentDate"
                  value={header.adjustmentDate}
                  onChange={handleHeaderChange}
                  disabled={header.status === 'COMPLETED'}
                  className="w-full h-9 px-3 rounded-md border border-zinc-200 text-[10.4px] bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Warehouse ID *</label>
                <input
                  type="text"
                  name="warehouseId"
                  value={header.warehouseId}
                  onChange={handleHeaderChange}
                  disabled={header.status === 'COMPLETED'}
                  className="w-full h-9 px-3 rounded-md border border-zinc-200 text-[10.4px] bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Location ID</label>
                <input
                  type="text"
                  name="locationId"
                  value={header.locationId}
                  onChange={handleHeaderChange}
                  disabled={header.status === 'COMPLETED'}
                  className="w-full h-9 px-3 rounded-md border border-zinc-200 text-[10.4px] bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Reason</label>
                <select
                  name="reason"
                  value={header.reason}
                  onChange={handleHeaderChange}
                  disabled={header.status === 'COMPLETED'}
                  className="w-full h-9 px-3 rounded-md border border-zinc-200 text-[10.4px] bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select Reason...</option>
                  <option value="DAMAGED">Damaged Goods</option>
                  <option value="SHRINKAGE">Shrinkage / Theft</option>
                  <option value="COUNT_ERROR">Cycle Count Correction</option>
                  <option value="EXPIRY">Expired Stock</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Remarks</label>
                <textarea
                  name="remarks"
                  value={header.remarks}
                  onChange={handleHeaderChange}
                  disabled={header.status === 'COMPLETED'}
                  rows={2}
                  className="w-full p-3 rounded-md border border-zinc-200 text-[10.4px] bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

            </div>
          </div>

          {/* Lines Card */}
          <div className="card overflow-hidden">
             <div className="p-4 border-b border-zinc-200 bg-white flex justify-between items-center">
               <h2 className="text-[11.2px] font-bold text-zinc-800 flex items-center gap-2">
                 <LayoutList size={16} className="text-zinc-400" /> Line Items
               </h2>
               <button 
                  type="button" 
                  onClick={addLine}
                  disabled={header.status === 'COMPLETED'}
                  className="text-[9.6px] font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                 <Plus size={14}/> Add Line
               </button>
             </div>
             
             <div className="overflow-x-auto">
               <table className="erp-table">
                 <thead>
                   <tr>
                    <th className="w-16">S.No.</th>
                     <th className="w-[160px]">Product ID</th>
                     <th>Batch / Serial</th>
                     <th className="w-[112px]">Type</th>
                     <th className="w-[96px]">Qty</th>
                     <th className="w-[96px]">Unit Cost</th>
                     <th className="w-[96px]">Value</th>
                     <th className="w-10"></th>
                   </tr>
                 </thead>
                 <tbody>
                   {lines.length === 0 ? (
                     <tr>
                       <td colSpan={8} className="text-center py-8 text-zinc-500 text-sm">
                         No lines added yet. Click "Add Line" to begin.
                       </td>
                     </tr>
                   ) : (
                     lines.map((line, idx) => (
                       <tr key={line.id || idx}>
                      <td className="text-zinc-500 font-medium text-center text-xs tabular-nums">{idx + 1}</td>
                         <td>
                           <input
                             type="text"
                             value={line.productId}
                             onChange={(e) => handleLineChange(idx, 'productId', e.target.value)}
                             disabled={header.status === 'COMPLETED'}
                             className="w-full h-8 px-2 rounded border border-zinc-200 text-xs outline-none focus:border-primary"
                             placeholder="Product ID..."
                           />
                         </td>
                         <td>
                           <div className="flex gap-2">
                             <input
                               type="text"
                               value={line.batchId}
                               onChange={(e) => handleLineChange(idx, 'batchId', e.target.value)}
                               disabled={header.status === 'COMPLETED'}
                               className="w-1/2 h-8 px-2 rounded border border-zinc-200 text-xs outline-none focus:border-primary"
                               placeholder="Batch ID..."
                             />
                             <input
                               type="text"
                               value={line.serialId}
                               onChange={(e) => handleLineChange(idx, 'serialId', e.target.value)}
                               disabled={header.status === 'COMPLETED'}
                               className="w-1/2 h-8 px-2 rounded border border-zinc-200 text-xs outline-none focus:border-primary"
                               placeholder="Serial ID..."
                             />
                           </div>
                         </td>
                         <td>
                           <select
                              value={line.adjustmentType}
                              onChange={(e) => handleLineChange(idx, 'adjustmentType', e.target.value)}
                              disabled={header.status === 'COMPLETED'}
                              className="w-full h-8 px-2 rounded border border-zinc-200 text-xs outline-none focus:border-primary"
                           >
                             <option value="INCREASE">Increase (+)</option>
                             <option value="DECREASE">Decrease (-)</option>
                           </select>
                         </td>
                         <td>
                           <input
                             type="number"
                             value={line.quantity}
                             onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                             disabled={header.status === 'COMPLETED'}
                             className="w-full h-8 px-2 rounded border border-zinc-200 text-xs outline-none focus:border-primary text-right"
                           />
                         </td>
                         <td>
                           <input
                             type="number"
                             value={line.unitCost}
                             onChange={(e) => handleLineChange(idx, 'unitCost', e.target.value)}
                             disabled={header.status === 'COMPLETED'}
                             className="w-full h-8 px-2 rounded border border-zinc-200 text-xs outline-none focus:border-primary text-right"
                           />
                         </td>
                         <td className="text-right font-mono text-xs font-bold text-zinc-700 bg-zinc-50 rounded">
                           {line.adjustmentValue?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                         </td>
                         <td className="text-center">
                           <button 
                             type="button"
                             onClick={() => removeLine(idx)}
                             disabled={header.status === 'COMPLETED'}
                             className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors disabled:opacity-50"
                           >
                             <Trash2 size={14}/>
                           </button>
                         </td>
                       </tr>
                     ))
                   )}
                 </tbody>
                 {lines.length > 0 && (
                   <tfoot className="bg-zinc-50/80 border-t border-zinc-200 font-bold text-[10.4px] text-zinc-800">
                     <tr>
                       <td colSpan={6} className="text-right py-3 pr-4">Total Adjustment Value:</td>
                       <td className="text-right py-3 pr-4 font-mono">
                         {lines.reduce((sum, l) => sum + (Number(l.adjustmentValue) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                       </td>
                       <td></td>
                     </tr>
                   </tfoot>
                 )}
               </table>
             </div>
          </div>
        </div>

        {/* Sidebar Status / Config */}
        <div className="xl:w-80 space-y-6">
          <div className="card p-5">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Document Status</h3>
            <select
               name="status"
               value={header.status}
               onChange={handleHeaderChange}
               disabled={header.status === 'COMPLETED'}
               className="w-full h-10 px-3 rounded-md border border-zinc-200 text-[10.4px] font-bold bg-zinc-50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
               <option value="DRAFT">Draft</option>
               <option value="COMPLETED">Completed</option>
            </select>
            <p className="text-[8.8px] text-zinc-500 mt-2 leading-relaxed">
              When marked as <strong>Completed</strong>, the system will apply the stock adjustments and this document will become read-only.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
