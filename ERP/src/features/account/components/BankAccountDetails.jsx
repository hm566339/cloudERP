import React from 'react';
import { format } from 'date-fns';

const formatCurrency = (amount) => {
  if (amount == null) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

export default function BankAccountDetails({ account }) {
  if (!account) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
      
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Bank Name</span>
        <p className="text-sm font-semibold text-zinc-900">{account.bankName || '-'}</p>
      </div>

      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Account Number</span>
        <p className="text-sm font-semibold text-zinc-900">{account.accountNumber || '-'}</p>
      </div>

      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Status</span>
        <div>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
            (account.isActive || account.status === 'ACTIVE') 
              ? 'bg-emerald-100 text-emerald-700' 
              : 'bg-rose-100 text-rose-700'
          }`}>
            {(account.isActive || account.status === 'ACTIVE') ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Branch Name</span>
        <p className="text-sm font-medium text-zinc-700">{account.branchName || '-'}</p>
      </div>

      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">IFSC Code</span>
        <p className="text-sm font-medium text-zinc-700">{account.ifscCode || '-'}</p>
      </div>

      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Swift Code</span>
        <p className="text-sm font-medium text-zinc-700">{account.swiftCode || '-'}</p>
      </div>

      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">UPI ID</span>
        <p className="text-sm font-medium text-zinc-700">{account.upiId || '-'}</p>
      </div>

      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Opening Balance</span>
        <p className="text-sm font-medium text-zinc-700">{formatCurrency(account.openingBalance)}</p>
      </div>

      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Current Balance</span>
        <p className="text-sm font-semibold text-emerald-700">{formatCurrency(account.currentBalance)}</p>
      </div>

      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Linked GL Account</span>
        <p className="text-sm font-medium text-zinc-700">
          {account.glAccountName ? `${account.glAccountCode} - ${account.glAccountName}` : '-'}
        </p>
      </div>
      
      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Transaction Count</span>
        <p className="text-sm font-medium text-zinc-700">{account.transactionCount || 0}</p>
      </div>

      <div className="space-y-1">
        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Created At</span>
        <p className="text-sm font-medium text-zinc-700">{formatDate(account.createdAt)}</p>
      </div>

    </div>
  );
}
