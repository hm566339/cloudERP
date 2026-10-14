import React from 'react';
import { User, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CustomerInformation({ customer }) {
  const navigate = useNavigate();
  
  if (!customer) return null;

  return (
    <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm h-full flex flex-col">
      <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2 mb-4">
        <User size={16} className="text-indigo-500" />
        Customer Information
      </h2>
      
      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-4">
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-1">
            <Hash size={12} />
            Customer Code
          </p>
          <p className="text-sm font-mono text-zinc-700 bg-zinc-50 px-2 py-1 rounded inline-block border border-zinc-200">
            {customer.code || '—'}
          </p>
        </div>
        
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-1">
            <User size={12} />
            Customer Name
          </p>
          <p 
            className="text-base font-bold text-indigo-700 hover:text-indigo-800 cursor-pointer hover:underline transition-all"
            onClick={() => customer.id && navigate(`/company/customers/${customer.id}`)}
          >
            {customer.name || '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
