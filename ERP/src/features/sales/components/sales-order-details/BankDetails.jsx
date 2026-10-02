import React from 'react';
import { Landmark } from 'lucide-react';

export default function BankDetails({ bankDetailsSnapshot }) {
  if (!bankDetailsSnapshot) return null;

  let bank;
  try {
    bank = typeof bankDetailsSnapshot === 'string' ? JSON.parse(bankDetailsSnapshot) : bankDetailsSnapshot;
  } catch (e) {
    return null; // Invalid JSON
  }

  if (!bank || !bank.accountNumber) return null;

  return (
    <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm h-full">
      <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2 mb-4 pb-3 border-b border-zinc-100">
        <Landmark size={16} className="text-indigo-500" />
        Bank Details
      </h2>
      
      <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-100 space-y-3">
        {bank.bankName && (
          <div>
            <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">Bank Name</p>
            <p className="text-sm font-bold text-zinc-900">{bank.bankName}</p>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          {bank.accountName && (
            <div>
              <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">Account Name</p>
              <p className="text-sm font-medium text-zinc-800">{bank.accountName}</p>
            </div>
          )}
          {bank.accountNumber && (
            <div>
              <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">Account Number</p>
              <p className="text-sm font-mono font-semibold text-zinc-900">{bank.accountNumber}</p>
            </div>
          )}
          {bank.ifscCode && (
            <div>
              <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">IFSC Code</p>
              <p className="text-sm font-mono font-medium text-zinc-800">{bank.ifscCode}</p>
            </div>
          )}
          {bank.swiftCode && (
            <div>
              <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">SWIFT Code</p>
              <p className="text-sm font-mono font-medium text-zinc-800">{bank.swiftCode}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
