import React, { useState, useEffect } from 'react';
import { ChevronDown, CalendarDays } from 'lucide-react';
import CustomSelect from './CustomSelect';

export default function DateRangeFilter({ value, onChange, label }) {
  const [mode, setMode] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Parse initial value
  useEffect(() => {
    if (!value) {
      setMode('all');
      setCustomStart('');
      setCustomEnd('');
      return;
    }
    
    const [start, end] = value.split('|');
    setCustomStart(start || '');
    setCustomEnd(end || '');
    
    // Auto-detect mode based on standard presets
    const today = new Date();
    const formatDate = (date) => date.toISOString().split('T')[0];
    
    const todayStr = formatDate(today);
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    const weekStr = formatDate(lastWeek);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthStr = formatDate(startOfMonth);
    
    if (start === todayStr && end === todayStr) {
      setMode('today');
    } else if (start === weekStr && end === todayStr) {
      setMode('week');
    } else if (start === monthStr && end === todayStr) {
      setMode('month');
    } else {
      setMode('custom');
    }
  }, [value]);

  const handleModeChange = (e) => {
    const newMode = e.target.value;
    setMode(newMode);
    
    if (newMode === 'all') {
      onChange('');
      return;
    }
    
    const today = new Date();
    const formatDate = (date) => date.toISOString().split('T')[0];
    const todayStr = formatDate(today);
    
    if (newMode === 'today') {
      onChange(`${todayStr}|${todayStr}`);
    } else if (newMode === 'week') {
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      onChange(`${formatDate(lastWeek)}|${todayStr}`);
    } else if (newMode === 'month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      onChange(`${formatDate(startOfMonth)}|${todayStr}`);
    }
  };

  const handleCustomChange = (type, dateVal) => {
    if (type === 'start') {
      setCustomStart(dateVal);
      if (dateVal || customEnd) onChange(`${dateVal || ''}|${customEnd || ''}`);
      else onChange('');
    } else {
      setCustomEnd(dateVal);
      if (customStart || dateVal) onChange(`${customStart || ''}|${dateVal || ''}`);
      else onChange('');
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-1 hover:bg-slate-100 transition-colors focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 w-full overflow-hidden">
        <CalendarDays size={14} className="text-slate-400 shrink-0" />
        {label && <span className="text-sm font-medium text-slate-500 whitespace-nowrap shrink-0">{label}:</span>}
        <CustomSelect 
          value={mode}
          onChange={handleModeChange}
          options={[
            { value: 'all', label: 'All Time' },
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'Last 7 Days' },
            { value: 'month', label: 'This Month' },
            { value: 'custom', label: 'Custom Range...' }
          ]}
          buttonClassName="w-full bg-transparent border-none text-sm font-semibold text-slate-800 p-0 py-2 cursor-pointer focus:outline-none flex justify-between items-center"
          dropdownClassName="bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 max-h-[200px] overflow-y-auto w-[160px]"
        />
      </div>

      {mode === 'custom' && (
        <div className="flex items-center gap-2 mt-1 animate-slide-up">
          <input 
            type="date" 
            value={customStart}
            onChange={(e) => handleCustomChange('start', e.target.value)}
            className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-[8.8px] text-slate-800 focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-slate-400 text-xs">to</span>
          <input 
            type="date" 
            value={customEnd}
            onChange={(e) => handleCustomChange('end', e.target.value)}
            className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-[8.8px] text-slate-800 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      )}
    </div>
  );
}
