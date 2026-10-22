import React from 'react';
import { Building2 } from 'lucide-react';

export default function BankDetails({ bankDetailsSnapshot }) {
  if (!bankDetailsSnapshot) return null;

  const parseBankDetails = (snapshot) => {
    try {
      const parsed = JSON.parse(snapshot);
      if (typeof parsed === 'object' && parsed !== null) {
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-[#6B7184] mb-1">Bank Name</p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-[#E6E8EE]">{parsed.bankName || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-[#6B7184] mb-1">Account Name</p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-[#E6E8EE]">{parsed.accountName || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-[#6B7184] mb-1">Account Number</p>
              <p className="text-sm font-mono text-zinc-900 dark:text-[#E6E8EE]">{parsed.accountNumber || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-[#6B7184] mb-1">IFSC Code</p>
              <p className="text-sm font-mono text-zinc-900 dark:text-[#E6E8EE]">{parsed.ifscCode || '—'}</p>
            </div>
            {parsed.branchName && (
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-[#6B7184] mb-1">Branch</p>
                <p className="text-sm text-zinc-900 dark:text-[#E6E8EE]">{parsed.branchName}</p>
              </div>
            )}
            {parsed.swiftCode && (
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-[#6B7184] mb-1">SWIFT Code</p>
                <p className="text-sm font-mono text-zinc-900 dark:text-[#E6E8EE]">{parsed.swiftCode}</p>
              </div>
            )}
          </div>
        );
      }
    } catch {
      // Ignore JSON parse error, handle as raw string
    }

    // Fallback if not JSON
    return (
      <p className="text-sm text-zinc-800 dark:text-[#E6E8EE] whitespace-pre-wrap leading-relaxed">
        {bankDetailsSnapshot}
      </p>
    );
  };

  return (
    <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C] flex items-center gap-2">
        <Building2 size={16} className="text-zinc-400 dark:text-[#6B7184]" />
        <h3 className="text-[10.4px] font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider">Bank Details</h3>
      </div>
      <div className="p-5">
        {parseBankDetails(bankDetailsSnapshot)}
      </div>
    </div>
  );
}
