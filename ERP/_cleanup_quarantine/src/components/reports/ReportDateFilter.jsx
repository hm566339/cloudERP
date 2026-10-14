import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

const QUICK_FILTERS = [
  { label: 'Today', getValue: () => { const d = new Date().toISOString().split('T')[0]; return [d, d]; } },
  { label: 'Yesterday', getValue: () => { const d = new Date(); d.setDate(d.getDate() - 1); const str = d.toISOString().split('T')[0]; return [str, str]; } },
  { label: 'This Week', getValue: () => { const d = new Date(); const first = d.getDate() - d.getDay(); const last = first + 6; return [new Date(d.setDate(first)).toISOString().split('T')[0], new Date(d.setDate(last)).toISOString().split('T')[0]]; } },
  { label: 'Last Week', getValue: () => { const d = new Date(); const first = d.getDate() - d.getDay() - 7; const last = first + 6; return [new Date(d.setDate(first)).toISOString().split('T')[0], new Date(d.setDate(last)).toISOString().split('T')[0]]; } },
  { label: 'This Month', getValue: () => { const d = new Date(); return [new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0], new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]]; } },
  { label: 'Last Month', getValue: () => { const d = new Date(); return [new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().split('T')[0], new Date(d.getFullYear(), d.getMonth(), 0).toISOString().split('T')[0]]; } },
  { label: 'Current Quarter', getValue: () => { const d = new Date(); const q = Math.floor(d.getMonth() / 3); return [new Date(d.getFullYear(), q * 3, 1).toISOString().split('T')[0], new Date(d.getFullYear(), q * 3 + 3, 0).toISOString().split('T')[0]]; } },
  { label: 'Previous Quarter', getValue: () => { const d = new Date(); const q = Math.floor(d.getMonth() / 3) - 1; return [new Date(d.getFullYear(), q * 3, 1).toISOString().split('T')[0], new Date(d.getFullYear(), q * 3 + 3, 0).toISOString().split('T')[0]]; } },
  { label: 'Current Year', getValue: () => { const d = new Date(); return [new Date(d.getFullYear(), 0, 1).toISOString().split('T')[0], new Date(d.getFullYear(), 11, 31).toISOString().split('T')[0]]; } }
];

export default function ReportDateFilter({ fromDate, toDate, onChange, label = "Period" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('This Month');

  useEffect(() => {
    // Check if current dates match a quick filter
    const match = QUICK_FILTERS.find(f => {
      const [fStart, fEnd] = f.getValue();
      return fStart === fromDate && fEnd === toDate;
    });
    if (match) {
      setActiveFilter(match.label);
    } else {
      setActiveFilter('Custom Range');
    }
  }, [fromDate, toDate]);

  const handleQuickSelect = (filter) => {
    const [start, end] = filter.getValue();
    onChange(start, end);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-zinc-200 shadow-sm relative z-10">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded text-xs font-bold text-zinc-700 transition-colors"
        >
          <Calendar size={14} className="text-primary" />
          {label ? `${label}: ${activeFilter}` : activeFilter}
          <ChevronDown size={14} className="text-zinc-400" />
        </button>

        <div className="h-6 w-px bg-zinc-200 mx-1"></div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-500 uppercase">From</span>
          <input 
            type="date" 
            className="input-field py-1 text-sm bg-transparent border-none p-0 focus:ring-0 w-[96px]" 
            value={fromDate}
            onChange={(e) => onChange(e.target.value, toDate)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-500 uppercase">To</span>
          <input 
            type="date" 
            className="input-field py-1 text-sm bg-transparent border-none p-0 focus:ring-0 w-[96px]" 
            value={toDate}
            onChange={(e) => onChange(fromDate, e.target.value)}
          />
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[192px] bg-white border border-zinc-200 shadow-xl rounded-xl z-50 overflow-hidden animate-slide-down">
          <div className="p-2 grid grid-cols-1 gap-1 max-h-[240px] overflow-y-auto">
            {QUICK_FILTERS.map((filter) => (
              <button
                key={filter.label}
                onClick={() => handleQuickSelect(filter)}
                className={`text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  activeFilter === filter.label 
                    ? 'bg-primary/10 text-primary font-bold' 
                    : 'text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
      )}
    </div>
  );
}
