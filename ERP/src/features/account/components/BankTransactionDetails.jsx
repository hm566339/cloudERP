import React from 'react';

const formatCurrency = (amount) => {
  if (amount == null) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

export default function BankTransactionDetails({ transaction }) {
  if (!transaction) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
      
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">Bank Account</span>
        <p className="text-sm font-semibold text-zinc-900 dark:text-[#E6E8EE]">
          {transaction.bankAccount?.bankName} {transaction.bankAccount?.accountNumber ? `(${transaction.bankAccount?.accountNumber.slice(-4)})` : ''}
        </p>
      </div>

      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">UTR / Txn ID</span>
        <p className="text-sm font-semibold text-zinc-900 dark:text-[#E6E8EE]">{transaction.utrNo || '-'}</p>
      </div>
      
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">Reference No</span>
        <p className="text-sm font-semibold text-zinc-900 dark:text-[#E6E8EE]">{transaction.referenceNo || '-'}</p>
      </div>

      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">Reconciliation Status</span>
        <div>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
            transaction.reconciled ? 'bg-emerald-100 dark:bg-[#34C38F]/15 text-emerald-700 dark:text-[#34C38F]' : 'bg-amber-100 dark:bg-[#F5B544]/15 text-amber-700 dark:text-[#F5B544]'
          }`}>
            {transaction.reconciled ? 'Reconciled' : 'Unreconciled'}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">Debit (Out)</span>
        <p className="text-sm font-medium text-zinc-700 dark:text-[#E6E8EE]">
          {formatCurrency(transaction.debitAmount)}
        </p>
      </div>
      
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">Credit (In)</span>
        <p className="text-sm font-medium text-zinc-700 dark:text-[#E6E8EE]">
          {formatCurrency(transaction.creditAmount)}
        </p>
      </div>

      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">Running Balance</span>
        <p className="text-sm font-medium text-zinc-700 dark:text-[#E6E8EE]">
          {formatCurrency(transaction.runningBalance)}
        </p>
      </div>
      
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">GL Journal Entry</span>
        <p className="text-sm font-medium text-indigo-600 dark:text-[#4C8DFF]">
          {transaction.glJournalEntryId ? `JNL-${transaction.glJournalEntryId}` : '-'}
        </p>
      </div>

      <div className="space-y-1 col-span-2 md:col-span-4 lg:col-span-2">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">Narration / Description</span>
        <p className="text-sm font-medium text-zinc-700 dark:text-[#E6E8EE] whitespace-pre-wrap">
          {transaction.narration || '-'}
        </p>
      </div>

    </div>
  );
}
