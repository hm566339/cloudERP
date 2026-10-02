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
              <p className="text-xs font-medium text-zinc-500 mb-1">Bank Name</p>
              <p className="text-sm font-semibold text-zinc-900">{parsed.bankName || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-1">Account Name</p>
              <p className="text-sm font-semibold text-zinc-900">{parsed.accountName || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-1">Account Number</p>
              <p className="text-sm font-mono text-zinc-900">{parsed.accountNumber || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-1">IFSC Code</p>
              <p className="text-sm font-mono text-zinc-900">{parsed.ifscCode || '—'}</p>
            </div>
            {parsed.branchName && (
              <div>
                <p className="text-xs font-medium text-zinc-500 mb-1">Branch</p>
                <p className="text-sm text-zinc-900">{parsed.branchName}</p>
              </div>
            )}
            {parsed.swiftCode && (
              <div>
                <p className="text-xs font-medium text-zinc-500 mb-1">SWIFT Code</p>
                <p className="text-sm font-mono text-zinc-900">{parsed.swiftCode}</p>
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
      <p className="text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed">
        {bankDetailsSnapshot}
      </p>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
        <Building2 size={16} className="text-zinc-400" />
        <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider">Bank Details</h3>
      </div>
      <div className="p-5">
        {parseBankDetails(bankDetailsSnapshot)}
      </div>
    </div>
  );
}
