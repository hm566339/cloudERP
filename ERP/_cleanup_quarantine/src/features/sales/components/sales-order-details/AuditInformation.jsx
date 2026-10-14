import React from 'react';
import { History } from 'lucide-react';

export default function AuditInformation({ audit }) {
  if (!audit) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm mb-8 mt-6">
      <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2 mb-4 pb-3 border-b border-zinc-100">
        <History size={16} className="text-indigo-500" />
        Audit Information
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Created By</p>
          <p className="font-medium text-zinc-900">{audit.createdBy || '—'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Created At</p>
          <p className="font-medium text-zinc-900">{formatDate(audit.createdAt)}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Last Updated By</p>
          <p className="font-medium text-zinc-900">{audit.updatedBy || '—'}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Last Updated At</p>
          <p className="font-medium text-zinc-900">{formatDate(audit.updatedAt)}</p>
        </div>
      </div>
    </div>
  );
}
