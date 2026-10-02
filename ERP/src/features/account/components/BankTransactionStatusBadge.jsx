import React from 'react';

const BankTransactionStatusBadge = ({ reconciled, glStatus }) => {
  if (glStatus === 'POSTED') {
    return (
      <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-indigo-50 text-indigo-700 border-indigo-200">
        Posted
      </span>
    );
  }

  if (reconciled) {
    return (
      <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200">
        Reconciled
      </span>
    );
  }

  return (
    <span className="px-2.5 py-1 text-[8.8px] font-semibold rounded-md border bg-amber-50 text-amber-700 border-amber-200">
      Unreconciled
    </span>
  );
};

export default BankTransactionStatusBadge;
