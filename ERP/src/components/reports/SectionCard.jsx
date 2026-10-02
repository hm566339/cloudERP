import React from 'react';

export default function SectionCard({ title, description, icon: Icon, fields = [] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col h-full animate-slide-up">
      <div className="p-4 border-b border-zinc-100 flex items-start gap-3 bg-zinc-50/50">
        {Icon && <div className="text-indigo-500 mt-0.5"><Icon size={18} /></div>}
        <div>
          <h3 className="text-[11.2px] font-bold text-zinc-800">{title}</h3>
          {description && <p className="text-[9.6px] text-zinc-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="p-4 flex-1">
        <ul className="space-y-3">
          {fields.map((field, idx) => (
            <li key={idx} className="flex justify-between items-center text-[10.4px]">
              <span className="text-zinc-500">{field.label}</span>
              <span className="font-semibold text-zinc-800">{field.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
