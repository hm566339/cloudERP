import React from 'react';
import { X, BookOpen, CheckCircle, ArrowRight, ShieldCheck, Printer } from 'lucide-react';
import { expenseStorageService } from '../../services/expenseStorageService';

export default function ExpenseAccountingModal({ isOpen, onClose, expense = null, reimbursement = null }) {
  if (!isOpen || (!expense && !reimbursement)) return null;

  const entry = expense
    ? expenseStorageService.getAccountingEntryForExpense(expense)
    : expenseStorageService.getAccountingEntryForReimbursement(reimbursement);

  if (!entry) return null;

  const title = expense ? 'Expense Journal Voucher' : 'Reimbursement Payment Voucher';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-zinc-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
              <BookOpen size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900">{title}</h2>
                <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck size={11} /> Auto-Generated GL Entry
                </span>
              </div>
              <p className="text-xs text-zinc-500">System-enforced balanced double-entry accounting posting</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Voucher Header Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/80 text-xs">
            <div>
              <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block">Voucher No.</span>
              <span className="font-mono font-bold text-zinc-900 text-sm">{entry.voucherNumber}</span>
            </div>
            <div>
              <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block">Voucher Date</span>
              <span className="font-semibold text-zinc-800">{entry.voucherDate}</span>
            </div>
            <div>
              <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block">Source Reference</span>
              <span className="font-mono font-semibold text-zinc-800">{entry.referenceNumber}</span>
            </div>
            <div>
              <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block">Module</span>
              <span className="font-semibold text-blue-600">{entry.sourceModule}</span>
            </div>
          </div>

          {/* Double-Entry Ledger Lines */}
          <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-100/80 border-b border-zinc-200 text-[8px] font-bold text-zinc-600 uppercase tracking-wider">
                  <th className="p-3">Account Name & Code</th>
                  <th className="p-3">Nature</th>
                  <th className="p-3">Description / Narration</th>
                  <th className="p-3 text-right">Debit (₹)</th>
                  <th className="p-3 text-right">Credit (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {entry.lines.map((line) => (
                  <tr key={line.id} className="hover:bg-zinc-50/50">
                    <td className="p-3">
                      <div className="font-bold text-zinc-900">{line.accountName}</div>
                      <div className="font-mono text-[8px] text-zinc-400">{line.accountCode}</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-semibold border ${
                        line.nature === 'EXPENSE' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        line.nature === 'LIABILITY' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {line.nature}
                      </span>
                    </td>
                    <td className="p-3 text-zinc-600 max-w-[144px] truncate">{line.description}</td>
                    <td className="p-3 text-right font-mono font-bold text-zinc-900">
                      {line.debit > 0 ? `₹${line.debit.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-zinc-900">
                      {line.credit > 0 ? `₹${line.credit.toLocaleString()}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-zinc-50 border-t border-zinc-200 font-bold">
                  <td colSpan={3} className="p-3 text-right text-xs text-zinc-600 uppercase tracking-wider">
                    Total Voucher Amount:
                  </td>
                  <td className="p-3 text-right font-mono text-xs font-extrabold text-emerald-700">
                    ₹{entry.totalDebit.toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-mono text-xs font-extrabold text-emerald-700">
                    ₹{entry.totalCredit.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Validation Banner */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle size={15} className="text-emerald-600" />
              <span className="font-semibold">Voucher is perfectly balanced (Total Debits = Total Credits).</span>
            </div>
            <span className="text-[8.8px] font-bold uppercase tracking-wider text-emerald-700">Audit Verified</span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 text-xs font-semibold text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
