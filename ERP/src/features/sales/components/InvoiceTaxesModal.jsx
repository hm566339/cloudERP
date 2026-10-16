import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { salesInvoiceTaxesApi, chartOfAccountsApi } from '../../../api/account';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import useUrlFilters from '../../../hooks/useUrlFilters';
import RequirePermission from '../../../components/common/RequirePermission';
import Pagination from '../../../components/common/Pagination';
import SortableHeader from '../../../components/common/SortableHeader';
import { TableRowSkeleton } from '../../../components/common/SkeletonLoader';
import { confirmDialog } from '../../../utils/confirmDialog';
import CustomSelect from '../../../components/common/CustomSelect';

export default function InvoiceTaxesModal({ isOpen, onClose, invoiceId }) {
  const dispatch = useAppDispatch();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const {
    page, setPage, apiParams,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter
  } = useUrlFilters();

  const listFilters = {
    gstSlabId: filters.gstSlabId || undefined,
    gstSlabName: filters.gstSlabName || undefined,
    isDeleted: filters.isDeleted || undefined,
    minTaxableAmount: filters.minTaxableAmount || undefined,
    maxTaxableAmount: filters.maxTaxableAmount || undefined,
    createdFrom: filters.createdFrom || undefined,
    createdTo: filters.createdTo || undefined,
  };

  const { data: taxesResponse, isLoading, refetch } = useApiQuery(
    salesInvoiceTaxesApi.getList,
    [invoiceId, listFilters, apiParams],
    { enabled: isOpen && !!invoiceId && invoiceId !== 'undefined' }
  );

  const taxes = taxesResponse?.content || [];
  const pageInfo = taxesResponse || null;

  const { data: gstSlabsResponse } = useApiQuery(
    async () => {
      const { default: apiClient } = await import('../../../api/common/client');
      const res = await apiClient.get('/api/account/v1/gst-slabs');
      return res.data?.data?.content || res.data?.data?.gstSlabs || res.data?.data || [];
    },
    [],
    { skip: !isOpen }
  );
  const gstSlabs = gstSlabsResponse || [];

  const [formData, setFormData] = useState({
    gstSlabId: '',
    taxableAmount: '',
    cgstAmount: '',
    sgstAmount: '',
    igstAmount: '',
    cessAmount: ''
  });

  const { data: detailData, refetch: refetchDetail } = useApiQuery(
    salesInvoiceTaxesApi.getById,
    [invoiceId, editingId],
    { enabled: !!editingId && editingId !== 'undefined' && editingId !== 'null' }
  );

  useEffect(() => {
    if (editingId && detailData) {
      setFormData({
        gstSlabId: detailData.gstSlabId || '',
        taxableAmount: detailData.taxableAmount || '',
        cgstAmount: detailData.cgstAmount || '',
        sgstAmount: detailData.sgstAmount || '',
        igstAmount: detailData.igstAmount || '',
        cessAmount: detailData.cessAmount || ''
      });
    } else if (!editingId) {
      setFormData({
        gstSlabId: '', taxableAmount: '', cgstAmount: '', sgstAmount: '', igstAmount: '', cessAmount: ''
      });
    }
  }, [editingId, detailData]);

  const createMutation = useApiMutation(salesInvoiceTaxesApi.create);
  const updateMutation = useApiMutation(salesInvoiceTaxesApi.update);
  const deleteMutation = useApiMutation(salesInvoiceTaxesApi.delete);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenForm = (tax = null) => {
    if (tax) {
      setEditingId(tax.id);
    } else {
      setEditingId(null);
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.gstSlabId || formData.taxableAmount === '') {
      return dispatch(addAlert({ type: 'error', message: 'GST Slab and Taxable Amount are required' }));
    }

    const payload = {
      gstSlabId: formData.gstSlabId,
      taxableAmount: parseFloat(formData.taxableAmount) || 0,
      cgstAmount: parseFloat(formData.cgstAmount) || 0,
      sgstAmount: parseFloat(formData.sgstAmount) || 0,
      igstAmount: parseFloat(formData.igstAmount) || 0,
      cessAmount: parseFloat(formData.cessAmount) || 0,
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync([invoiceId, editingId, payload]);
        dispatch(addAlert({ type: 'success', message: 'Tax entry updated successfully' }));
      } else {
        await createMutation.mutateAsync([invoiceId, payload]);
        dispatch(addAlert({ type: 'success', message: 'Tax entry created successfully' }));
      }
      setIsFormOpen(false);
      setEditingId(null);
      refetch();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to save tax entry' }));
    }
  };

  const handleDelete = async (taxId) => {
    confirmDialog(
      'Delete Tax Entry?',
      'Are you sure you want to delete this tax entry? This action cannot be undone.',
      async () => {
        try {
          await deleteMutation.mutateAsync([invoiceId, taxId]);
          dispatch(addAlert({ type: 'success', message: 'Tax entry deleted successfully' }));
          refetch();
        } catch (err) {
          dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to delete tax entry' }));
        }
      }
    );
  };

  if (!isOpen) return null;

  const totalTaxable = taxes.reduce((acc, t) => acc + (parseFloat(t.taxableAmount) || 0), 0);
  const totalCgst = taxes.reduce((acc, t) => acc + (parseFloat(t.cgstAmount) || 0), 0);
  const totalSgst = taxes.reduce((acc, t) => acc + (parseFloat(t.sgstAmount) || 0), 0);
  const totalIgst = taxes.reduce((acc, t) => acc + (parseFloat(t.igstAmount) || 0), 0);
  const totalCess = taxes.reduce((acc, t) => acc + (parseFloat(t.cessAmount) || 0), 0);
  const grandTotalTax = totalCgst + totalSgst + totalIgst + totalCess;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-zinc-900/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-zinc-50 h-full shadow-2xl flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-white">
          <h2 className="text-lg font-bold text-zinc-800">Invoice Taxes Breakdown</h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-700 rounded-full hover:bg-zinc-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!isFormOpen && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="bg-white p-4 rounded-xl border border-zinc-100 shadow-sm flex flex-col">
                <span className="text-xs text-zinc-500 font-medium uppercase mb-1">Total Taxable</span>
                <span className="text-lg font-bold text-zinc-800">{totalTaxable.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-zinc-100 shadow-sm flex flex-col">
                <span className="text-xs text-zinc-500 font-medium uppercase mb-1">Total CGST</span>
                <span className="text-lg font-bold text-zinc-800">{totalCgst.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-zinc-100 shadow-sm flex flex-col">
                <span className="text-xs text-zinc-500 font-medium uppercase mb-1">Total SGST</span>
                <span className="text-lg font-bold text-zinc-800">{totalSgst.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-zinc-100 shadow-sm flex flex-col">
                <span className="text-xs text-zinc-500 font-medium uppercase mb-1">Total IGST</span>
                <span className="text-lg font-bold text-zinc-800">{totalIgst.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-zinc-100 shadow-sm flex flex-col">
                <span className="text-xs text-zinc-500 font-medium uppercase mb-1">Total CESS</span>
                <span className="text-lg font-bold text-zinc-800">{totalCess.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="bg-primary/10 p-4 rounded-xl border border-primary/20 shadow-sm flex flex-col">
                <span className="text-xs text-primary font-bold uppercase mb-1">Total Tax</span>
                <span className="text-lg font-black text-primary">{grandTotalTax.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            </div>
          )}

          {!isFormOpen ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-zinc-100 shadow-sm">
                <div className="flex gap-3">
                  <CustomSelect
                    value={filters.isDeleted || ''}
                    onChange={(e) => setFilter('isDeleted', e.target.value)}
                    className="input-field text-sm"
                  >
                    <option value="">Active Only</option>
                    <option value="true">Deleted Only</option>
                  </CustomSelect>
                  <button onClick={() => refetch()} className="btn-secondary py-1.5 px-3 text-sm">
                    <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                  </button>
                </div>
                <RequirePermission module="SALES_INVOICES" action="UPDATE">
                  <button onClick={() => handleOpenForm(null)} className="btn-primary text-sm py-1.5 px-3">
                    <Plus size={16} className="mr-1" /> Add Tax Entry
                  </button>
                </RequirePermission>
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto min-w-0 custom-scrollbar">
                  <table className="w-full text-left text-sm whitespace-nowrap" aria-label="Invoice Taxes Table">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 text-xs font-semibold uppercase sticky top-0 z-10">
                      <tr>
                        <SortableHeader field="gstSlabName" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleColumnSort} className="p-4">GST Slab</SortableHeader>
                        <SortableHeader field="taxableAmount" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleColumnSort} className="p-4 text-right">Taxable</SortableHeader>
                        <SortableHeader field="cgstAmount" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleColumnSort} className="p-4 text-right">CGST</SortableHeader>
                        <SortableHeader field="sgstAmount" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleColumnSort} className="p-4 text-right">SGST</SortableHeader>
                        <SortableHeader field="igstAmount" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleColumnSort} className="p-4 text-right">IGST</SortableHeader>
                        <SortableHeader field="cessAmount" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleColumnSort} className="p-4 text-right">CESS</SortableHeader>
                        <SortableHeader field="createdAt" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleColumnSort} className="p-4">Created</SortableHeader>
                        <th scope="col" className="p-4 w-20 text-center text-xs font-semibold uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {isLoading ? (
                        <TableRowSkeleton columns={8} rows={3} />
                      ) : taxes.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="p-8 text-center text-zinc-500">
                            No tax entries found.
                          </td>
                        </tr>
                      ) : (
                        taxes.map((tax) => (
                          <tr key={tax.id} className={`hover:bg-zinc-50/50 transition-colors ${tax.isDeleted ? 'opacity-50' : ''}`}>
                            <td className="p-4">
                              <span className="font-medium text-zinc-900">{tax.gstSlabName || 'Unknown'}</span>
                              {tax.isDeleted && <span className="ml-2 badge badge-danger text-[10px]">Deleted</span>}
                            </td>
                            <td className="p-4 text-right font-medium text-zinc-900 tabular-nums font-mono">{tax.taxableAmount?.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                            <td className="p-4 text-right text-zinc-600 tabular-nums font-mono">{tax.cgstAmount?.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                            <td className="p-4 text-right text-zinc-600 tabular-nums font-mono">{tax.sgstAmount?.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                            <td className="p-4 text-right text-zinc-600 tabular-nums font-mono">{tax.igstAmount?.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                            <td className="p-4 text-right text-zinc-600 tabular-nums font-mono">{tax.cessAmount?.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                            <td className="p-4 text-zinc-500 text-xs">{new Date(tax.createdAt).toLocaleDateString()}</td>
                            <td className="p-4">
                              <div className="flex items-center justify-center gap-2">
                                {!tax.isDeleted && (
                                  <>
                                    <RequirePermission module="SALES_INVOICES" action="UPDATE">
                                      <button onClick={() => handleOpenForm(tax)} className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" aria-label="Edit tax entry">
                                        <Edit2 size={16} />
                                      </button>
                                    </RequirePermission>
                                    <RequirePermission module="SALES_INVOICES" action="DELETE">
                                      <button onClick={() => handleDelete(tax.id)} className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" aria-label="Delete tax entry">
                                        <Trash2 size={16} />
                                      </button>
                                    </RequirePermission>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {pageInfo && taxes.length > 0 && (
                  <Pagination
                    currentPage={page}
                    totalPages={pageInfo.totalPages || 1}
                    onPageChange={setPage}
                    totalElements={pageInfo.totalElements}
                    pageSize={apiParams.size}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-zinc-800 mb-6 pb-3 border-b border-zinc-100">
                {editingId ? 'Edit Tax Entry' : 'Add Tax Entry'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">GST Slab *</label>
                    <CustomSelect
                      name="gstSlabId"
                      value={formData.gstSlabId}
                      onChange={(e) => handleInputChange({ target: { name: 'gstSlabId', value: e.target.value }})}
                      options={gstSlabs.map(slab => ({ value: slab.id, label: slab.slabName || slab.name }))}
                      placeholder="Select GST Slab"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Taxable Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="taxableAmount"
                      value={formData.taxableAmount}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">CGST Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="cgstAmount"
                      value={formData.cgstAmount}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">SGST Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="sgstAmount"
                      value={formData.sgstAmount}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">IGST Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="igstAmount"
                      value={formData.igstAmount}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Cess Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="cessAmount"
                      value={formData.cessAmount}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => { setIsFormOpen(false); setEditingId(null); }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {editingId ? 'Update Tax' : 'Save Tax'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
