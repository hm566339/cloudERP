import React from 'react';

const BankTransactionStatusBadge = ({ reconciled, glStatus }) => {
  if (glStatus === 'POSTED') {
    return (
      <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/60">
        Posted
      </span>
    );
  }

  if (reconciled) {
    return (
      <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60">
        Reconciled
      </span>
    );
  }

  return (
    <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60">
      Unreconciled
    </span>
  );
};

export default BankTransactionStatusBadge;
