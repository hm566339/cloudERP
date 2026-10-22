import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomLocationCellSelect({
  value,
  onChange,
  locations = [],
  disabled = false,
  fallbackName = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const [search, setSearch] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, openUpwards: false });

  const availableLocations = useMemo(() => {
    if (value && fallbackName && !locations.some((l) => l.id === value)) {
      return [{ id: value, locationName: fallbackName }, ...locations];
    }
    return locations;
  }, [locations, value, fallbackName]);

  const selectedLocation = useMemo(() => {
    return availableLocations.find((l) => l.id === value);
  }, [availableLocations, value]);

  useLayoutEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const popoverWidth = 220;
      const popoverHeight = 220;

      let left = rect.left;
      if (left + popoverWidth > window.innerWidth - 12) {
        left = rect.right - popoverWidth;
      }
      if (left < 12) left = 12;

      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUpwards = spaceBelow < popoverHeight && spaceAbove > spaceBelow;

      const top = openUpwards
        ? Math.max(12, rect.top - popoverHeight - 4)
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
        !e.target.closest('[data-location-dropdown]')
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, [isOpen]);

  const filteredLocations = useMemo(() => {
    if (!search.trim()) return availableLocations;
    const term = search.toLowerCase();
    return availableLocations.filter((l) =>
      (l.locationName || l.locationCode || l.name || '').toLowerCase().includes(term)
    );
  }, [availableLocations, search]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setIsOpen((prev) => !prev);
          setSearch('');
        }}
        title={selectedLocation ? (selectedLocation.locationName || selectedLocation.locationCode) : (fallbackName || 'Default Location')}
        className={`w-full h-8 px-1.5 bg-white dark:bg-[#1D212C] border rounded-md text-left flex items-center justify-between transition-colors cursor-pointer text-[11px] ${
          disabled ? 'opacity-50 cursor-not-allowed bg-zinc-50 dark:bg-[#161922]' : 'hover:border-zinc-300 dark:hover:border-zinc-600'
        } ${isOpen ? 'border-zinc-900 dark:border-[#4C8DFF] ring-1 ring-zinc-900/10 dark:ring-[#4C8DFF]/20' : 'border-zinc-200 dark:border-[#2A2F3D]'}`}
      >
        <span className="truncate flex-1 font-medium text-zinc-700 dark:text-[#E6E8EE]">
          {selectedLocation
            ? (selectedLocation.locationName || selectedLocation.locationCode || selectedLocation.name)
            : (fallbackName && value ? fallbackName : 'Default')}
        </span>
        <ChevronDown size={11} className={`text-zinc-400 dark:text-[#6B7184] shrink-0 ml-1 transition-transform ${isOpen ? 'rotate-180 text-zinc-700 dark:text-[#E6E8EE]' : ''}`} />
      </button>

      {isOpen && createPortal(
        <div
          data-location-dropdown="true"
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: '220px',
            zIndex: 99999,
          }}
          className="bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100 divide-y divide-zinc-100 dark:divide-[#2A2F3D]"
        >
          {availableLocations.length > 4 && (
            <div className="p-2 bg-zinc-50/80 dark:bg-[#161922] border-b border-zinc-100 dark:border-[#2A2F3D]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search racks/bins..."
                className="w-full h-7 px-2 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-xs text-zinc-800 dark:text-[#E6E8EE] placeholder-zinc-400 dark:placeholder-[#6B7184] outline-none focus:border-zinc-900 dark:focus:border-[#4C8DFF]"
                autoFocus
              />
            </div>
          )}

          <div className="max-h-48 overflow-y-auto py-1 divide-y divide-zinc-50 dark:divide-[#2A2F3D]/50">
            {/* Default option */}
            <div
              onClick={() => {
                onChange('', null);
                setIsOpen(false);
              }}
              className={`px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-[#222736] text-[11px] flex items-center justify-between ${
                !value ? 'bg-zinc-50/90 dark:bg-[#222736] font-bold text-zinc-900 dark:text-[#E6E8EE]' : 'text-zinc-600 dark:text-[#A0A6B5]'
              }`}
            >
              <span>Default (No specific rack/bin)</span>
              {!value && <Check size={13} className="text-zinc-900 dark:text-[#4C8DFF] shrink-0" />}
            </div>

            {filteredLocations.map((loc) => {
              const isSelected = loc.id === value;
              const name = loc.locationName || loc.locationCode || loc.name;
              return (
                <div
                  key={loc.id}
                  onClick={() => {
                    onChange(loc.id, loc);
                    setIsOpen(false);
                  }}
                  className={`px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-[#222736] text-[11px] flex items-center justify-between ${
                    isSelected ? 'bg-zinc-50/90 dark:bg-[#222736] font-bold text-zinc-900 dark:text-[#E6E8EE]' : 'text-zinc-700 dark:text-[#A0A6B5]'
                  }`}
                >
                  <div className="min-w-0 flex-1 truncate">
                    <span className="truncate">{name}</span>
                    {loc.locationCode && loc.locationName && (
                      <span className="text-[9px] font-mono text-zinc-400 dark:text-[#6B7184] block truncate">
                        {loc.locationCode}
                      </span>
                    )}
                  </div>
                  {isSelected && <Check size={13} className="text-zinc-900 dark:text-[#4C8DFF] shrink-0 ml-1.5" />}
                </div>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
