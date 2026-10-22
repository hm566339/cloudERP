import React from 'react';
import CustomSelect from '../../../components/common/CustomSelect';
import { Plus } from 'lucide-react';

export default function JournalLinesTable({ lines, setLines, accounts }) {
  const handleAddLine = () => {
    setLines([...lines, { id: Date.now(), accountId: '', lineDescription: '', debitAmount: '', creditAmount: '' }]);
  };

  const handleRemoveLine = (id) => {
    if (lines.length <= 2) return; // Need at least 2 lines
    setLines(lines.filter(l => l.id !== id));
  };

  const updateLine = (id, field, value) => {
    setLines(lines.map(l => {
      if (l.id === id) {
        const updated = { ...l, [field]: value };
        if (field === 'debitAmount' && value !== '') updated.creditAmount = '';
        if (field === 'creditAmount' && value !== '') updated.debitAmount = '';
        return updated;
      }
      return l;
    }));
  };

  const totalDebit = lines.reduce((sum, line) => sum + (parseFloat(line.debitAmount) || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (parseFloat(line.creditAmount) || 0), 0);
  const isBalanced = totalDebit > 0 && Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <div className="border border-zinc-200 dark:border-[#2A2F3D] rounded-lg overflow-hidden bg-white dark:bg-[#161922]">
      <div className="overflow-auto max-h-[35vh]">
        <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
          <thead className="sticky top-0 z-10 shadow-sm">
            <tr className="bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              <th className="w-12 text-center p-3">S.No.</th>
              <th className="p-3">Account *</th>
              <th className="p-3">Description</th>
              <th className="p-3 w-32 text-right">Debit (₹)</th>
              <th className="p-3 w-32 text-right">Credit (₹)</th>
              <th className="p-3 w-12 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
            {lines.map((line, index) => (
              <tr key={line.id} className="bg-white dark:bg-[#161922]">
                <td className="text-center font-medium text-zinc-500 dark:text-zinc-400 p-2">{index + 1}</td>
                <td className="p-2 min-w-[160px]">
                  <CustomSelect
                    name="accountId" value={line.accountId} onChange={e => updateLine(line.id, 'accountId', e.target.value)}
                    options={accounts.map(acc => ({ value: acc.id, label: `${acc.accountCode} - ${acc.accountName}` }))}
                    placeholder="Select Account" required
                  />
                </td>
                <td className="p-2 min-w-[120px]">
                  <input type="text" placeholder="Line details..." className="input-field w-full" value={line.lineDescription} onChange={e => updateLine(line.id, 'lineDescription', e.target.value)} />
                </td>
                <td className="p-2">
                  <input type="number" step="0.01" min="0" placeholder="0.00" className="input-field w-full text-right font-mono text-emerald-700 dark:text-emerald-400 [&::-webkit-inner-spin-button]:appearance-none" value={line.debitAmount} disabled={line.creditAmount !== ''} onChange={e => updateLine(line.id, 'debitAmount', e.target.value)} />
                </td>
                <td className="p-2">
                  <input type="number" step="0.01" min="0" placeholder="0.00" className="input-field w-full text-right font-mono text-rose-700 dark:text-rose-400 [&::-webkit-inner-spin-button]:appearance-none" value={line.creditAmount} disabled={line.debitAmount !== ''} onChange={e => updateLine(line.id, 'creditAmount', e.target.value)} />
                </td>
                <td className="p-2 text-center">
                  <button type="button" onClick={() => handleRemoveLine(line.id)} disabled={lines.length <= 2} className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded disabled:opacity-30 transition-colors">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="sticky bottom-0 z-10 shadow-[0_-1px_0_0_#e4e4e7] dark:shadow-[0_-1px_0_0_#2A2F3D]">
            <tr className="bg-zinc-50 dark:bg-[#1D212C] border-t border-zinc-200 dark:border-[#2A2F3D]">
              <td colSpan={3} className="p-3">
                <button type="button" onClick={handleAddLine} className="text-[10.4px] font-semibold text-primary flex items-center gap-1 hover:underline">
                  <Plus size={14} /> Add Row
                </button>
              </td>
              <td className={`p-3 text-right font-mono font-bold ${totalDebit > 0 ? (isBalanced ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-900 dark:text-[#E6E8EE]') : 'text-zinc-400 dark:text-zinc-500'}`}>
                {totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
              <td className={`p-3 text-right font-mono font-bold ${totalCredit > 0 ? (isBalanced ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-900 dark:text-[#E6E8EE]') : 'text-zinc-400 dark:text-zinc-500'}`}>
                {totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
              <td className="bg-zinc-50 dark:bg-[#1D212C]"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
