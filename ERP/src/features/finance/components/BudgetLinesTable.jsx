import React, { useState } from 'react';
import { Edit, Trash2, Plus, AlertCircle } from 'lucide-react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { budgetLinesApi } from '../../../api/account';
import { formatCurrency } from '../../../utils/formatters';
import { confirmDialog } from '../../../utils/confirmDialog';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import RequirePermission from '../../../components/common/RequirePermission';
import BudgetLineFormModal from './BudgetLineFormModal';
import BudgetStatusBadge from './BudgetStatusBadge';

const getLineStatus = (record) => {
  const raw = record?.status?.toUpperCase?.();
  if (raw) return raw;
  const util = record?.utilizationPercentage ?? 0;
  if (util > 100) return 'EXCEEDED';
  if (util >= 100) return 'COMPLETED';
  if (util > 0) return 'ACTIVE';
  return 'DRAFT';
};

const BudgetLinesTable = ({ headerId }) => {
  const dispatch = useAppDispatch();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const { data: budgetLinesData, isLoading, refetch } = useApiQuery(
    budgetLinesApi.getBudgetLinesByHeader,
    headerId,
    { skip: !headerId }
  );

  const deleteMutation = useApiMutation(budgetLinesApi.deleteBudgetLine);

  const rawLines = budgetLinesData?.data?.data?.budgetLines || budgetLinesData?.data?.budgetLines || budgetLinesData?.data || [];
  const lineItems = Array.isArray(rawLines) ? rawLines : [];

  const handleDelete = async (record) => {
    if (await confirmDialog({ message: 'Are you sure you want to delete this budget line?' })) {
      try {
        await deleteMutation.mutateAsync(record.id);
        dispatch(addAlert({ type: 'success', message: 'Budget line deleted successfully' }));
        refetch();
      } catch (err) {
        dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to delete budget line' }));
      }
    }
  };

  const openForm = (record = null) => {
    setEditingRecord(record ? { ...record, budgetHeaderId: headerId } : { budgetHeaderId: headerId });
    setIsFormOpen(true);
  };

  return (
    <div className="bg-white dark:bg-[#161922] rounded-lg border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden shadow-sm">
      <div className="flex items-center justify-between p-3 border-b border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/80 dark:bg-[#1D212C]/80">
        <h4 className="text-xs font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider">Budget Lines</h4>
        <RequirePermission module="BUDGET" action="CREATE">
          <button
            onClick={() => openForm()}
            className="h-7 px-3 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] hover:bg-zinc-50 dark:hover:bg-[#222736] rounded flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <Plus size={12} />
            Add Line
          </button>
        </RequirePermission>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11.2px]">
          <thead className="bg-zinc-50/50 dark:bg-[#1D212C]/50 border-b border-zinc-200 dark:border-[#2A2F3D]">
            <tr className="text-zinc-500 dark:text-zinc-400 font-semibold whitespace-nowrap">
              <th className="px-4 py-2.5">ACCOUNT</th>
              <th className="px-4 py-2.5">DEPARTMENT</th>
              <th className="px-4 py-2.5 text-right">ALLOCATED</th>
              <th className="px-4 py-2.5 text-right">UTILIZED</th>
              <th className="px-4 py-2.5 text-right">REMAINING</th>
              <th className="px-4 py-2.5 text-center">STATUS</th>
              <th className="px-4 py-2.5 text-center w-20">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-400 dark:text-zinc-500">Loading lines...</td></tr>
            ) : lineItems.length > 0 ? (
              lineItems.map((it, i) => (
                <tr key={it.id || i} className="hover:bg-zinc-50/80 dark:hover:bg-[#1D212C]/80 transition-colors group">
                  <td className="px-4 py-3 align-middle">
                    <div className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">{it.accountName || '—'}</div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">{it.accountCode || '—'}</div>
                  </td>
                  <td className="px-4 py-3 align-middle text-zinc-700 dark:text-zinc-300 font-medium whitespace-nowrap">
                    {it.departmentName || it.departmentId || 'Not Assigned'}
                  </td>
                  <td className="px-4 py-3 align-middle text-right whitespace-nowrap">
                    <span className="font-medium text-blue-600 dark:text-[#4C8DFF]">₹ {formatCurrency(it.allocatedAmount)}</span>
                  </td>
                  <td className="px-4 py-3 align-middle text-right whitespace-nowrap">
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">₹ {formatCurrency(it.utilizedAmount)}</span>
                  </td>
                  <td className="px-4 py-3 align-middle text-right whitespace-nowrap">
                    <span className="font-bold text-rose-600 dark:text-rose-400">₹ {formatCurrency(it.remainingAmount)}</span>
                  </td>
                  <td className="px-4 py-3 align-middle text-center whitespace-nowrap">
                    <BudgetStatusBadge status={getLineStatus(it)} />
                  </td>
                  <td className="px-4 py-3 align-middle text-center">
                    <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <RequirePermission module="BUDGET" action="UPDATE">
                        <button 
                          onClick={() => openForm(it)} 
                          className="w-6 h-6 rounded flex items-center justify-center text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors" 
                          title="Edit Line"
                        >
                          <Edit size={13} />
                        </button>
                      </RequirePermission>
                      <RequirePermission module="BUDGET" action="DELETE">
                        <button 
                          onClick={() => handleDelete(it)} 
                          className="w-6 h-6 rounded flex items-center justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors" 
                          title="Delete Line"
                        >
                          <Trash2 size={13} />
                        </button>
                      </RequirePermission>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-10">
                  <div className="flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500">
                    <AlertCircle size={32} className="mb-2 opacity-50" />
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">No Budget Lines Found</p>
                    <p className="text-xs mt-1 mb-3">Add budget lines to define allocations for this header.</p>
                    <RequirePermission module="BUDGET" action="CREATE">
                      <button onClick={() => openForm()} className="btn-secondary text-[11px] px-3 py-1.5 h-auto border-zinc-200 dark:border-[#2A2F3D]">
                        Add First Line
                      </button>
                    </RequirePermission>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <BudgetLineFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingRecord(null); }}
        editingRecord={editingRecord}
        onSuccess={refetch}
      />
    </div>
  );
};

export default BudgetLinesTable;
