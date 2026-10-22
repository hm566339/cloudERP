import React, { useState } from 'react';
import { History, ChevronDown, ChevronUp } from 'lucide-react';

export default function AuditInformation({ createdAt, createdBy, updatedAt, updatedBy }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!createdAt && !createdBy && !updatedAt && !updatedBy) return null;

  return (
    <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden mb-6">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C] flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors"
      >
        <div className="flex items-center gap-2">
          <History size={16} className="text-zinc-400 dark:text-[#6B7184]" />
          <h3 className="text-[10.4px] font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider">Audit Information</h3>
        </div>
        {isExpanded ? <ChevronUp size={16} className="text-zinc-400 dark:text-[#6B7184]" /> : <ChevronDown size={16} className="text-zinc-400 dark:text-[#6B7184]" />}
      </button>
      
      {isExpanded && (
        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-2">
          {createdAt && (
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-[#6B7184] mb-1">Created At</p>
              <p className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE]">
                {new Date(createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}
          {createdBy && (
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-[#6B7184] mb-1">Created By</p>
              <p className="text-sm text-zinc-900 dark:text-[#E6E8EE] font-semibold">{createdBy}</p>
            </div>
          )}
          {updatedAt && (
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-[#6B7184] mb-1">Updated At</p>
              <p className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE]">
                {new Date(updatedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}
          {updatedBy && (
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-[#6B7184] mb-1">Updated By</p>
              <p className="text-sm text-zinc-900 dark:text-[#E6E8EE] font-semibold">{updatedBy}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
