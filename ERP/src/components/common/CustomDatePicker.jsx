import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const getTodayString = () => new Date().toISOString().split('T')[0];

export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return `${m}/${d}/${y}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

export function getCalendarGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];
  // Trailing previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    cells.push({
      year: prevYear,
      month: prevMonth,
      day: dayNum,
      isCurrentMonth: false,
      dateString: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`,
    });
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      year,
      month,
      day: d,
      isCurrentMonth: true,
      dateString: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    });
  }
  // Leading next month days
  const remaining = (7 - (cells.length % 7)) % 7;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  for (let d = 1; d <= remaining; d++) {
    cells.push({
      year: nextYear,
      month: nextMonth,
      day: d,
      isCurrentMonth: false,
      dateString: `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    });
  }
  return cells;
}

export default function CustomDatePicker({
  value,
  onChange,
  placeholder = 'Select date...',
  required = false,
  hasError = false,
  minDate,
  className = '',
  compact = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, openUpwards: false });

  // Current calendar view month & year
  const initialDate = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(() => (isNaN(initialDate.getTime()) ? new Date().getFullYear() : initialDate.getFullYear()));
  const [viewMonth, setViewMonth] = useState(() => (isNaN(initialDate.getTime()) ? new Date().getMonth() : initialDate.getMonth()));

  // Reset calendar view when opening
  useEffect(() => {
    if (isOpen) {
      const d = value ? new Date(value) : new Date();
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [isOpen, value]);

  useLayoutEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const pickerWidth = 264;
      const pickerHeight = 295;

      let left = rect.left;
      if (left + pickerWidth > window.innerWidth - 12) {
        left = rect.right - pickerWidth;
      }
      if (left < 12) left = 12;

      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUpwards = spaceBelow < pickerHeight && spaceAbove > spaceBelow;

      const top = openUpwards
        ? Math.max(12, rect.top - pickerHeight - 4)
        : rect.bottom + 4;

      setCoords({ top, left, openUpwards });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleDown = (e) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target) &&
        !e.target.closest('[data-custom-datepicker]')
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, [isOpen]);

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (cell) => {
    onChange(cell.dateString);
    setIsOpen(false);
  };

  const handleSelectToday = (e) => {
    e.stopPropagation();
    const today = getTodayString();
    onChange(today);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const cells = useMemo(() => getCalendarGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const todayStr = getTodayString();

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full bg-white border rounded-lg text-left flex items-center justify-between transition-all cursor-pointer font-mono ${
          compact ? 'h-8 px-2 text-[11px]' : 'h-8 px-2.5 text-xs'
        } ${
          hasError
            ? 'border-rose-400 bg-rose-50/20'
            : isOpen
            ? 'border-zinc-900 ring-2 ring-zinc-900/10'
            : 'border-zinc-200 hover:border-zinc-300'
        }`}
      >
        <span className={value ? 'font-medium text-zinc-900' : 'text-zinc-400 font-sans'}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <Calendar size={compact ? 12 : 14} className="text-zinc-400 shrink-0 ml-1" />
      </button>

      {isOpen && createPortal(
        <div
          data-custom-datepicker="true"
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: '264px',
            zIndex: 99999,
          }}
          className="bg-white border border-zinc-200 rounded-2xl shadow-2xl p-3 flex flex-col select-none animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header navigation */}
          <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-zinc-100">
            <span className="text-xs font-bold text-zinc-900">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-md hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-md hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors"
                title="Next Month"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 text-center py-1 text-[10px] font-bold text-zinc-400 uppercase">
            {DAYS_OF_WEEK.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs mt-0.5">
            {cells.map((cell) => {
              const isSelected = cell.dateString === value;
              const isToday = cell.dateString === todayStr;

              return (
                <button
                  type="button"
                  key={cell.dateString}
                  onClick={() => handleSelectDay(cell)}
                  className={`h-7 w-7 flex items-center justify-center mx-auto text-[11px] rounded-lg transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-900 text-white font-bold shadow-xs'
                      : isToday
                      ? 'border border-zinc-900 text-zinc-900 font-bold hover:bg-zinc-100'
                      : cell.isCurrentMonth
                      ? 'text-zinc-800 hover:bg-zinc-100 font-medium'
                      : 'text-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {/* Footer action buttons */}
          <div className="pt-2 mt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
            {!required ? (
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] font-medium text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                Clear
              </button>
            ) : <span />}
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-[11px] font-bold text-primary hover:underline transition-all"
            >
              Today
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
