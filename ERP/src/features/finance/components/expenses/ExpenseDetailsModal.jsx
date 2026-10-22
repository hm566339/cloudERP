import React, { useState, useEffect } from 'react';
import {
  X,
  Receipt,
  Paperclip,
  Calendar,
  User,
  CreditCard,
  Tag,
  Loader2,
  AlertTriangle,
  Send,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit
} from 'lucide-react';
import { expensesApi } from '../../../../api/account/expenses';

const STATUS_BADGE = {
  DRAFT: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-[#1D212C] dark:text-zinc-300 dark:border-[#2A2F3D]',
  SUBMITTED: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
  FINANCE_APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
  APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
  PAID: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800',
  REJECTED: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
  CANCELLED: 'bg-zinc-100 text-zinc-400 border-zinc-200 dark:bg-[#1D212C] dark:text-zinc-500 dark:border-[#2A2F3D]',
};

export default function ExpenseDetailsModal({
  isOpen,
  onClose,
  expenseId,
  initialExpense = null,
  onEdit,
  onSubmitForApproval,
  onApprove,
  onReject,
  onCancel,
  onDelete,
  onOpenAccounting,
  actionLoading = false
}) {
  const [expense, setExpense] = useState(initialExpense);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    if (initialExpense && !expenseId) {
      setExpense(initialExpense);
      return;
    }

    if (expenseId) {
      const fetchExpense = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await expensesApi.getById(expenseId);
          setExpense(response?.data || initialExpense);
        } catch (err) {
          console.error('Error fetching expense details:', err);
          setError('Failed to load expense details');
          // Fallback to initial data if available
          if (initialExpense) setExpense(initialExpense);
        } finally {
          setIsLoading(false);
        }
      };
      fetchExpense();
    }
  }, [isOpen, expenseId, initialExpense]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-zinc-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#161922] rounded-xl shadow-2xl border border-zinc-200 dark:border-[#2A2F3D] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
              <Receipt size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900 dark:text-[#E6E8EE]">
                  {expense?.claimNo || 'Expense Claim Details'}
                </h2>
                {expense?.status && (
                  <span className={`px-2 py-0.5 rounded text-[8.8px] font-bold border ${STATUS_BADGE[expense.status] || 'bg-zinc-100 dark:bg-[#1D212C]'}`}>
                    {expense.status.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {expense?.expenseRequestNumber ? `Linked to Request: ${expense.expenseRequestNumber}` : 'Standalone Claim'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-[#E6E8EE] rounded-lg hover:bg-zinc-100 dark:hover:bg-[#222736] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 min-h-0 text-xs relative">
          
          {isLoading && (
            <div className="absolute inset-0 z-10 bg-white/50 dark:bg-[#161922]/50 backdrop-blur-[0.8px] flex items-center justify-center">
              <Loader2 size={32} className="animate-spin text-zinc-400" />
            </div>
          )}
          
          {error && !expense && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 rounded-lg flex items-center gap-2">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {expense && (
            <>
              {/* Top Attributes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-zinc-50 dark:bg-[#1D212C] rounded-xl border border-zinc-200/80 dark:border-[#2A2F3D]">
                <div>
                  <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block flex items-center gap-1">
                    <Calendar size={11} /> Claim Date
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-[#E6E8EE]">{expense.claimDate || expense.createdAt?.split('T')[0] || '—'}</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block flex items-center gap-1">
                    <User size={11} /> Employee
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-[#E6E8EE]">{expense.employeeName || expense.employeeDriverName || 'Staff Member'}</span>
                  <span className="text-[8px] text-zinc-400 dark:text-zinc-500 block capitalize">{expense.employeeId}</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block flex items-center gap-1">
                    <CreditCard size={11} /> Payment Type
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-[#E6E8EE]">Standard</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block flex items-center gap-1">
                    <Tag size={11} /> Category
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-[#E6E8EE]">Multiple</span>
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <h3 className="text-xs font-bold text-zinc-700 dark:text-[#E6E8EE] uppercase tracking-wider mb-2">Itemized Breakdown</h3>
                <div className="border border-zinc-200 dark:border-[#2A2F3D] rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-100/80 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-[8px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                        <th className="p-2.5 pl-3">Item Description</th>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5 text-center">Attachment</th>
                        <th className="p-2.5 text-right pr-3">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D] bg-white dark:bg-[#161922]">
                      {expense.items && expense.items.length > 0 ? (
                        expense.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-[#1D212C]/50 font-medium">
                            <td className="p-2.5 pl-3 text-zinc-900 dark:text-[#E6E8EE]">{item.description || '—'}</td>
                            <td className="p-2.5 text-zinc-500 dark:text-zinc-400">{item.categoryName || 'General'}</td>
                            <td className="p-2.5 text-center">
                              {item.receiptAttachment ? (
                                <span className="text-blue-600 dark:text-[#4C8DFF] underline cursor-pointer hover:text-blue-800 dark:hover:text-[#6AA1FF]">
                                  View
                                </span>
                              ) : (
                                <span className="text-zinc-300 dark:text-zinc-600">—</span>
                              )}
                            </td>
                            <td className="p-2.5 text-right pr-3 font-bold text-zinc-900 dark:text-[#E6E8EE]">₹{Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-zinc-400 dark:text-zinc-500">No items recorded</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-zinc-50 dark:bg-[#1D212C] border-t border-zinc-200 dark:border-[#2A2F3D] font-bold">
                        <td colSpan={3} className="p-3 text-right text-xs text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                          Grand Total Amount:
                        </td>
                        <td className="p-3 text-right text-sm font-extrabold text-zinc-900 dark:text-[#E6E8EE] pr-3">
                          ₹{Number(expense.claimAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

            </>
          )}
        </div>
        
        {/* Actions Footer */}
        {expense && (
          <div className="border-t border-zinc-200 dark:border-[#2A2F3D] p-4 bg-zinc-50 dark:bg-[#1D212C] flex items-center justify-between">
            <div className="flex gap-2">
              {expense.status === 'DRAFT' && (
                <>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => onEdit && onEdit(expense)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-700 dark:text-zinc-300 font-semibold text-xs hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Edit size={14} /> Edit
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => onDelete && onDelete(expense)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800/50 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-semibold text-xs hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </>
              )}
            </div>

            <div className="flex gap-2">
              {expense.status === 'DRAFT' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => onSubmitForApproval && onSubmitForApproval(expense)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-zinc-900 dark:bg-[#4C8DFF] text-white font-semibold text-xs hover:bg-zinc-800 dark:hover:bg-[#6AA1FF] transition-colors shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Submit for Approval
                </button>
              )}
              {(expense.status === 'SUBMITTED' || expense.status === 'PENDING_APPROVAL') && (
                <>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => onReject && onReject(expense)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800/50 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-semibold text-xs hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => onApprove && onApprove(expense)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 dark:hover:bg-emerald-500 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} /> Approve
                  </button>
                </>
              )}
              {(expense.status === 'DRAFT' || expense.status === 'SUBMITTED' || expense.status === 'PENDING_APPROVAL') && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => onCancel && onCancel(expense)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-700 dark:text-zinc-300 font-semibold text-xs hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors shadow-sm disabled:opacity-50"
                >
                  <AlertTriangle size={14} /> Cancel Claim
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
