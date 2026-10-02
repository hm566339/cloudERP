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
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Bank Account</span>
        <p className="text-sm font-semibold text-zinc-900">
          {transaction.bankAccount?.bankName} {transaction.bankAccount?.accountNumber ? `(${transaction.bankAccount?.accountNumber.slice(-4)})` : ''}
        </p>
      </div>

      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">UTR / Txn ID</span>
        <p className="text-sm font-semibold text-zinc-900">{transaction.utrNo || '-'}</p>
      </div>
      
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Reference No</span>
        <p className="text-sm font-semibold text-zinc-900">{transaction.referenceNo || '-'}</p>
      </div>

      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Reconciliation Status</span>
        <div>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
            transaction.reconciled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {transaction.reconciled ? 'Reconciled' : 'Unreconciled'}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Debit (Out)</span>
        <p className="text-sm font-medium text-zinc-700">
          {formatCurrency(transaction.debitAmount)}
        </p>
      </div>
      
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Credit (In)</span>
        <p className="text-sm font-medium text-zinc-700">
          {formatCurrency(transaction.creditAmount)}
        </p>
      </div>

      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Running Balance</span>
        <p className="text-sm font-medium text-zinc-700">
          {formatCurrency(transaction.runningBalance)}
        </p>
      </div>
      
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">GL Journal Entry</span>
        <p className="text-sm font-medium text-indigo-600">
          {transaction.glJournalEntryId ? `JNL-${transaction.glJournalEntryId}` : '-'}
        </p>
      </div>

      <div className="space-y-1 col-span-2 md:col-span-4 lg:col-span-2">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Narration / Description</span>
        <p className="text-sm font-medium text-zinc-700 whitespace-pre-wrap">
          {transaction.narration || '-'}
        </p>
      </div>

    </div>
  );
}
