import React, { useState, useEffect } from 'react';
import ExpandedRowDetails from '../components/ExpandedRowDetails';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, AlertCircle, Plus, Trash2, ArrowLeftRight, Check, ArrowLeft, RotateCcw } from 'lucide-react';
import { 
  useStockTransferDetail, 
  useStockTransferCreate, 
  useStockTransferUpdate,
  useStockTransferReverse
} from '../../../api/inventory';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import RequirePermission from '../../../components/common/RequirePermission';
import WorkflowActionButtons from '../../workflows/components/WorkflowActionButtons';

export default function StockTransferDetails() {
  const { id } = useParams();
  const navigate = useNavigate();  const dispatch = useAppDispatch();
  const isNew = id === 'new';

  const { stockTransfer, isLoading: isFetching, refetch } = useStockTransferDetail(isNew ? null : id);
  const createMutation = useStockTransferCreate();
  const updateMutation = useStockTransferUpdate();
  const reverseMutation = useStockTransferReverse();

  const [header, setHeader] = useState({
    transferNo: '',
    transferDate: new Date().toISOString().split('T')[0],
    sourceWarehouseId: '',
    destinationWarehouseId: '',
    status: 'DRAFT',
    remarks: ''
  });

  const [lines, setLines] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isNew && stockTransfer) {
      setHeader({
        transferNo: stockTransfer.transferNo || '',
        transferDate: stockTransfer.transferDate ? new Date(stockTransfer.transferDate).toISOString().split('T')[0] : '',
        sourceWarehouseId: stockTransfer.sourceWarehouseId || '',
        destinationWarehouseId: stockTransfer.destinationWarehouseId || '',
        status: stockTransfer.status || 'DRAFT',
        remarks: stockTransfer.remarks || ''
      });
      
      const mappedLines = (stockTransfer.lines || []).map((line, index) => ({
        _tempId: Math.random().toString(36).substr(2, 9),
        productId: line.productId || '',
        batchId: line.batchId || '',
        serialId: line.serialId || '',
        uomId: line.uomId || '',
        quantity: line.quantity || 0,
        unitCost: line.unitCost || 0,
        sourceLocationId: line.sourceLocationId || '',
        destinationLocationId: line.destinationLocationId || ''
      }));
      setLines(mappedLines);
    }
  }, [isNew, stockTransfer]);

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setHeader(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleLineChange = (index, field, value) => {
    const updatedLines = [...lines];
    let parsedValue = value;
    if (field === 'quantity' || field === 'unitCost') {
      parsedValue = value === '' ? '' : Number(value);
    }
    updatedLines[index][field] = parsedValue;
    setLines(updatedLines);
    if (errors[`line_${index}_field`]) {
      setErrors(prev => ({ ...prev, [`line_${index}_${field}`]: null }));
    }
  };

  const addLine = () => {
    setLines([...lines, {
      _tempId: Math.random().toString(36).substr(2, 9),
      productId: '',
      batchId: '',
      serialId: '',
      uomId: '',
      quantity: 0,
      unitCost: 0,
      sourceLocationId: '',
      destinationLocationId: ''
    }]);
  };

  const removeLine = (index) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors = {};
    if (!header.transferNo.trim()) newErrors.transferNo = 'Transfer No is required';
    if (!header.sourceWarehouseId.trim()) newErrors.sourceWarehouseId = 'Source WH is required';
    if (!header.destinationWarehouseId.trim()) newErrors.destinationWarehouseId = 'Destination WH is required';
    
    if (header.sourceWarehouseId && header.destinationWarehouseId && header.sourceWarehouseId === header.destinationWarehouseId) {
       newErrors.destinationWarehouseId = 'Source and Destination cannot be the same';
    }

    if (lines.length === 0) {
      newErrors.lines = 'At least one line item is required';
    }

    lines.forEach((line, i) => {
      if (!line.productId) newErrors[`line_${i}_productId`] = 'Required';
      if (!line.uomId) newErrors[`line_${i}_uomId`] = 'Required';
      if (line.quantity <= 0) newErrors[`line_${i}_quantity`] = 'Must be > 0';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      dispatch(addAlert({ type: 'error', message: 'Please fix validation errors before saving' }));
      return;
    }

    const payload = {
      ...header,
      lines: lines.map((l, index) => {
        const { _tempId, ...rest } = l;
        return rest;
      })
    };

    try {
      if (isNew) {
        const res = await createMutation.mutateAsync(payload);
        dispatch(addAlert({ type: 'success', message: 'Stock Transfer created successfully' }));
        navigate(`/inventory/stock-transfers/${res.id || res.data?.id}`, { replace: true });
      } else {
        await updateMutation.mutateAsync([id, payload]);
        dispatch(addAlert({ type: 'success', message: 'Stock Transfer updated successfully' }));
        refetch();
      }
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error.response?.data?.message || 'Failed to save transfer' }));
    }
  };

  const handleReverse = async () => {
    try {
      await reverseMutation.mutateAsync(id);
      dispatch(addAlert({ type: 'success', message: 'Transfer reversed successfully' }));
      refetch();
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error.response?.data?.message || 'Failed to reverse transfer' }));
    }
  };

  const isSaving = createMutation.isLoading || updateMutation.isLoading;
  const isReadOnly = !isNew && header.status !== 'DRAFT';

  if (isFetching && !isNew) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-12 max-w-7xl mx-auto">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/inventory/stock-transfers')}
            className="p-2 -ml-2 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shadow-sm">
            <ArrowLeftRight size={20} className="text-zinc-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-3">
              {isNew ? 'New Stock Transfer' : header.transferNo}
              {!isNew && (
                <span className={`px-2.5 py-0.5 rounded text-[8.8px] font-bold ${
                  header.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-800' :
                  header.status === 'REVERSED' ? 'bg-rose-100 text-rose-800' :
                  header.status === 'DISPATCHED' ? 'bg-blue-100 text-blue-800' :
                  'bg-zinc-100 text-zinc-600'
                }`}>
                  {header.status}
                </span>
              )}
            </h1>
            <p className="text-sm text-zinc-500 mt-0.5">Transfer inventory across warehouses and locations.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isNew && id && (
            <WorkflowActionButtons
              module="INVENTORY"
              documentType="STOCK_TRANSFER"
              documentId={id}
              documentStatus={header.status}
              onActionComplete={() => {
                refetch?.();
              }}
            />
          )}
          {!isNew && header.status !== 'REVERSED' && (
            <RequirePermission module="INVENTORY" action="EDIT">
              <button
                onClick={handleReverse}
                disabled={reverseMutation.isLoading}
                className="btn-secondary flex items-center gap-2 text-rose-600 hover:bg-rose-50 border-rose-200"
              >
                {reverseMutation.isLoading ? <div className="w-4 h-4 border-2 border-rose-500/30 border-t-rose-600 rounded-full animate-spin" /> : <RotateCcw size={16} />}
                Reverse Transfer
              </button>
            </RequirePermission>
          )}

          {!isReadOnly && (
            <RequirePermission module="INVENTORY" action={isNew ? 'CREATE' : 'EDIT'}>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary flex items-center gap-2 shadow-sm"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                {isNew ? 'Create Transfer' : 'Save Changes'}
              </button>
            </RequirePermission>
          )}
        </div>
      </div>

      <div className="space-y-6">
        
        {/* Header Form */}
        <div className="card p-6 bg-white shadow-sm border border-zinc-200/80">
          <h2 className="text-[10.4px] font-bold text-zinc-800 mb-4 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-2">
            Transfer Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
                Transfer No <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="transferNo"
                value={header.transferNo}
                onChange={handleHeaderChange}
                disabled={!isNew}
                className={`w-full h-9 px-3 rounded-md border text-[10.4px] bg-zinc-50 transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.transferNo ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
                }`}
              />
              {errors.transferNo && <p className="text-xs text-rose-500 mt-1"><AlertCircle size={12} className="inline mr-1" />{errors.transferNo}</p>}
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Transfer Date</label>
              <input
                type="date"
                name="transferDate"
                value={header.transferDate}
                onChange={handleHeaderChange}
                disabled={isReadOnly}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 text-[10.4px] bg-zinc-50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-70"
              />
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Status</label>
              <select
                name="status"
                value={header.status}
                onChange={handleHeaderChange}
                disabled={isReadOnly && header.status !== 'DRAFT'} // Allowed to change status to trigger workflows if needed, depending on biz logic. Locking for now if not DRAFT.
                className="w-full h-9 px-3 rounded-md border border-zinc-200 text-[10.4px] bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-zinc-50 disabled:opacity-70"
              >
                <option value="DRAFT">Draft</option>
                <option value="APPROVED">Approved</option>
                <option value="DISPATCHED">Dispatched</option>
                <option value="RECEIVED">Received</option>
                <option value="REVERSED">Reversed</option>
              </select>
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
                Source Warehouse ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="sourceWarehouseId"
                value={header.sourceWarehouseId}
                onChange={handleHeaderChange}
                disabled={isReadOnly}
                className={`w-full h-9 px-3 rounded-md border text-[10.4px] bg-zinc-50 transition-all outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-70 ${
                  errors.sourceWarehouseId ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
                }`}
              />
              {errors.sourceWarehouseId && <p className="text-xs text-rose-500 mt-1"><AlertCircle size={12} className="inline mr-1" />{errors.sourceWarehouseId}</p>}
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
                Destination Warehouse ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="destinationWarehouseId"
                value={header.destinationWarehouseId}
                onChange={handleHeaderChange}
                disabled={isReadOnly}
                className={`w-full h-9 px-3 rounded-md border text-[10.4px] bg-zinc-50 transition-all outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-70 ${
                  errors.destinationWarehouseId ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
                }`}
              />
              {errors.destinationWarehouseId && <p className="text-xs text-rose-500 mt-1"><AlertCircle size={12} className="inline mr-1" />{errors.destinationWarehouseId}</p>}
            </div>

            <div className="lg:col-span-3">
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Remarks</label>
              <input
                type="text"
                name="remarks"
                value={header.remarks}
                onChange={handleHeaderChange}
                disabled={isReadOnly}
                placeholder="Internal notes or reason for transfer..."
                className="w-full h-9 px-3 rounded-md border border-zinc-200 text-[10.4px] bg-zinc-50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-70"
              />
            </div>
          </div>
        </div>

        {/* Lines Table */}
        <div className="card bg-white shadow-sm border border-zinc-200/80 overflow-hidden flex flex-col min-h-[320px]">
          <div className="p-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-50/50">
            <h2 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
              Transfer Items
            </h2>
            {!isReadOnly && (
              <button 
                onClick={addLine}
                className="h-8 px-3 text-[9.6px] font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors flex items-center gap-1.5"
              >
                <Plus size={14} /> Add Line
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-x-auto">
            {errors.lines && (
              <div className="p-3 m-4 bg-rose-50 border border-rose-200 rounded-md text-sm text-rose-600 flex items-center gap-2">
                <AlertCircle size={16} /> {errors.lines}
              </div>
            )}
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-[8.8px] uppercase tracking-wider text-zinc-500">
                    <th className="font-bold py-3 px-4 w-12">#</th>
                  <th className="font-bold py-3 px-4 min-w-[120px]">Product ID *</th>
                  <th className="font-bold py-3 px-4 min-w-[96px]">UOM *</th>
                  <th className="font-bold py-3 px-4 text-right min-w-[80px]">Quantity *</th>
                  <th className="font-bold py-3 px-4 text-right min-w-[80px]">Unit Cost</th>
                  <th className="font-bold py-3 px-4 min-w-[96px]">Src Loc ID</th>
                  <th className="font-bold py-3 px-4 min-w-[96px]">Dest Loc ID</th>
                  {!isReadOnly && <th className="font-bold py-3 px-4 w-16 text-center">Act</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {lines.length === 0 ? (
                  <tr>
                    <td colSpan={isReadOnly ? 7 : 8} className="py-12 text-center text-sm text-zinc-500">
                      No lines added to this transfer.
                    </td>
                  </tr>
                ) : (
                  lines.map((line, index) => (
                    <tr key={line._tempId} className="group hover:bg-zinc-50/50 transition-colors">
                      <td className="py-2 px-4 text-[9.6px] font-medium text-zinc-400">
                        {index + 1}
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="text"
                          value={line.productId}
                          onChange={(e) => handleLineChange(index, 'productId', e.target.value)}
                          disabled={isReadOnly}
                          className={`w-full h-8 px-2 rounded border text-[10.4px] bg-white transition-all outline-none focus:ring-1 focus:ring-primary disabled:bg-transparent disabled:border-transparent ${
                            errors[`line_${index}_productId`] ? 'border-rose-300' : 'border-zinc-200'
                          }`}
                          placeholder="UUID"
                        />
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="text"
                          value={line.uomId}
                          onChange={(e) => handleLineChange(index, 'uomId', e.target.value)}
                          disabled={isReadOnly}
                          className={`w-full h-8 px-2 rounded border text-[10.4px] bg-white transition-all outline-none focus:ring-1 focus:ring-primary disabled:bg-transparent disabled:border-transparent ${
                            errors[`line_${index}_uomId`] ? 'border-rose-300' : 'border-zinc-200'
                          }`}
                          placeholder="UUID"
                        />
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="number"
                          value={line.quantity}
                          onChange={(e) => handleLineChange(index, 'quantity', e.target.value)}
                          disabled={isReadOnly}
                          className={`w-full h-8 px-2 rounded border text-[10.4px] bg-white transition-all outline-none focus:ring-1 focus:ring-primary text-right disabled:bg-transparent disabled:border-transparent ${
                            errors[`line_${index}_quantity`] ? 'border-rose-300' : 'border-zinc-200'
                          }`}
                        />
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="number"
                          value={line.unitCost}
                          onChange={(e) => handleLineChange(index, 'unitCost', e.target.value)}
                          disabled={isReadOnly}
                          className="w-full h-8 px-2 rounded border border-zinc-200 text-[10.4px] bg-white transition-all outline-none focus:border-primary focus:ring-1 focus:ring-primary text-right disabled:bg-transparent disabled:border-transparent"
                        />
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="text"
                          value={line.sourceLocationId}
                          onChange={(e) => handleLineChange(index, 'sourceLocationId', e.target.value)}
                          disabled={isReadOnly}
                          className="w-full h-8 px-2 rounded border border-zinc-200 text-[10.4px] bg-white transition-all outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-transparent disabled:border-transparent"
                          placeholder="UUID"
                        />
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="text"
                          value={line.destinationLocationId}
                          onChange={(e) => handleLineChange(index, 'destinationLocationId', e.target.value)}
                          disabled={isReadOnly}
                          className="w-full h-8 px-2 rounded border border-zinc-200 text-[10.4px] bg-white transition-all outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-transparent disabled:border-transparent"
                          placeholder="UUID"
                        />
                      </td>
                      {!isReadOnly && (
                        <td className="py-2 px-4 text-center">
                          <button
                            onClick={() => removeLine(index)}
                            className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors mx-auto block"
                            title="Remove Line"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
