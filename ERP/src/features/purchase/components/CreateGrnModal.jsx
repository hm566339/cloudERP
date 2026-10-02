import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Truck, FileText, Calendar, Building2, CheckCircle,
  AlertTriangle, AlertCircle, Package, MapPin, Loader2,
  Info, ChevronDown, ChevronLeft, ChevronRight, Check, Search
} from 'lucide-react';
import { useCreateGoodsReceiptFromPOMutation, useGetPurchaseOrderByIdQuery } from '../../../api/purchase';
import { warehousesApi, warehouseLocationsApi } from '../../../api/inventory';
import { purchaseRequisitionsApi, rfqsApi, supplierQuotationsApi } from '../../../api/account';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';

// ── Date Formatting Helpers ──────────────────────────────────────────────────
const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getTodayString = () => new Date().toISOString().split('T')[0];

const formatDisplayDate = (dateStr) => {
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

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

function getCalendarGrid(year, month) {
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
      dateString: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
    });
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      year,
      month,
      day: d,
      isCurrentMonth: true,
      dateString: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
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
      dateString: `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    });
  }
  return cells;
}

// ── Custom Date Picker Component ─────────────────────────────────────────────
function CustomDatePicker({
  value,
  onChange,
  placeholder = 'Select date...',
  required = false,
  hasError = false,
  minDate,
  className = '',
  compact = false
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
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
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
        onClick={() => setIsOpen(prev => !prev)}
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
            zIndex: 99999
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
            {DAYS_OF_WEEK.map(d => (
              <span key={d}>{d}</span>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs mt-0.5">
            {cells.map(cell => {
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

// ── Custom Warehouse Selector Component ──────────────────────────────────────
function CustomWarehouseSelect({
  value,
  onChange,
  warehouses = [],
  loading = false,
  hasError = false,
  fallbackName = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handleDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, []);

  const availableWarehouses = useMemo(() => {
    if (value && fallbackName && !warehouses.some(w => w.id === value)) {
      return [{ id: value, warehouseName: fallbackName }, ...warehouses];
    }
    return warehouses;
  }, [warehouses, value, fallbackName]);

  const selectedWarehouse = useMemo(() => {
    return availableWarehouses.find(w => w.id === value);
  }, [availableWarehouses, value]);

  const filteredWarehouses = useMemo(() => {
    if (!search.trim()) return availableWarehouses;
    const term = search.toLowerCase();
    return availableWarehouses.filter(w =>
      (w.warehouseName || '').toLowerCase().includes(term) ||
      (w.warehouseCode || '').toLowerCase().includes(term)
    );
  }, [availableWarehouses, search]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(prev => !prev);
          setSearch('');
        }}
        disabled={loading}
        className={`w-full h-8 px-2.5 bg-white border rounded-lg text-left flex items-center justify-between transition-all cursor-pointer ${
          hasError
            ? 'border-rose-400 bg-rose-50/20'
            : isOpen
            ? 'border-zinc-900 ring-2 ring-zinc-900/10'
            : 'border-zinc-200 hover:border-zinc-300'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
          <Building2 size={13} className="text-zinc-400 shrink-0" />
          {selectedWarehouse ? (
            <span className="text-xs font-semibold text-zinc-900 truncate">
              {selectedWarehouse.warehouseName}
              {selectedWarehouse.warehouseCode && (
                <span className="ml-1.5 font-mono text-[10px] text-zinc-400 font-normal">
                  ({selectedWarehouse.warehouseCode})
                </span>
              )}
            </span>
          ) : (
            <span className="text-xs text-zinc-400">
              {loading ? 'Loading warehouses...' : '-- Select Destination Warehouse --'}
            </span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`text-zinc-400 shrink-0 ml-1 transition-transform ${isOpen ? 'rotate-180 text-zinc-700' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 divide-y divide-zinc-100 flex flex-col">
          {warehouses.length > 3 && (
            <div className="p-2 bg-zinc-50/80 border-b border-zinc-100">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Filter warehouses..."
                  className="w-full h-7 pl-8 pr-2.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-800 placeholder-zinc-400 outline-none focus:border-zinc-900"
                  autoFocus
                />
              </div>
            </div>
          )}

          <div className="max-h-52 overflow-y-auto py-1 divide-y divide-zinc-50">
            {filteredWarehouses.length === 0 ? (
              <div className="px-3 py-3 text-xs text-zinc-400 text-center italic">
                No matching warehouses
              </div>
            ) : (
              filteredWarehouses.map(wh => {
                const isSelected = wh.id === value;
                return (
                  <div
                    key={wh.id}
                    onClick={() => {
                      onChange(wh.id);
                      setIsOpen(false);
                    }}
                    className={`px-3 py-2 cursor-pointer hover:bg-zinc-50 transition-colors flex items-center justify-between gap-2 ${
                      isSelected ? 'bg-zinc-50/90 font-semibold' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-zinc-900">{wh.warehouseName}</span>
                        {wh.warehouseCode && (
                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono bg-zinc-100 text-zinc-600 border border-zinc-200">
                            {wh.warehouseCode}
                          </span>
                        )}
                      </div>
                      {wh.city && (
                        <p className="text-[10px] text-zinc-400 mt-0.5 truncate">{wh.city}</p>
                      )}
                    </div>
                    {isSelected && <Check size={14} className="text-zinc-900 shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Custom Location Cell Selector Component ──────────────────────────────────
function CustomLocationCellSelect({
  value,
  onChange,
  locations = [],
  disabled = false,
  fallbackName = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const [search, setSearch] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, openUpwards: false });

  const availableLocations = useMemo(() => {
    if (value && fallbackName && !locations.some(l => l.id === value)) {
      return [{ id: value, locationName: fallbackName }, ...locations];
    }
    return locations;
  }, [locations, value, fallbackName]);

  const selectedLocation = useMemo(() => {
    return availableLocations.find(l => l.id === value);
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
    return availableLocations.filter(l =>
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
          setIsOpen(prev => !prev);
          setSearch('');
        }}
        title={selectedLocation ? (selectedLocation.locationName || selectedLocation.locationCode) : (fallbackName || 'Default Location')}
        className={`w-full h-8 px-1.5 bg-white border rounded-md text-left flex items-center justify-between transition-colors cursor-pointer text-[11px] ${
          disabled ? 'opacity-50 cursor-not-allowed bg-zinc-50' : 'hover:border-zinc-300'
        } ${isOpen ? 'border-zinc-900 ring-1 ring-zinc-900/10' : 'border-zinc-200'}`}
      >
        <span className="truncate flex-1 font-medium text-zinc-700">
          {selectedLocation
            ? (selectedLocation.locationName || selectedLocation.locationCode || selectedLocation.name)
            : (fallbackName && value ? fallbackName : 'Default')}
        </span>
        <ChevronDown size={11} className={`text-zinc-400 shrink-0 ml-1 transition-transform ${isOpen ? 'rotate-180 text-zinc-700' : ''}`} />
      </button>

      {isOpen && createPortal(
        <div
          data-location-dropdown="true"
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: '220px',
            zIndex: 99999
          }}
          className="bg-white border border-zinc-200 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100 divide-y divide-zinc-100"
        >
          {availableLocations.length > 4 && (
            <div className="p-2 bg-zinc-50/80 border-b border-zinc-100">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search racks/bins..."
                className="w-full h-7 px-2 bg-white border border-zinc-200 rounded-md text-xs outline-none focus:border-zinc-900"
                autoFocus
              />
            </div>
          )}

          <div className="max-h-48 overflow-y-auto py-1 divide-y divide-zinc-50">
            {/* Default option */}
            <div
              onClick={() => {
                onChange('', null);
                setIsOpen(false);
              }}
              className={`px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 text-[11px] flex items-center justify-between ${
                !value ? 'bg-zinc-50/90 font-bold text-zinc-900' : 'text-zinc-600'
              }`}
            >
              <span>Default (No specific rack/bin)</span>
              {!value && <Check size={13} className="text-zinc-900 shrink-0" />}
            </div>

            {filteredLocations.map(loc => {
              const isSelected = loc.id === value;
              const name = loc.locationName || loc.locationCode || loc.name;
              return (
                <div
                  key={loc.id}
                  onClick={() => {
                    onChange(loc.id, loc);
                    setIsOpen(false);
                  }}
                  className={`px-2.5 py-1.5 cursor-pointer hover:bg-zinc-50 text-[11px] flex items-center justify-between ${
                    isSelected ? 'bg-zinc-50/90 font-bold text-zinc-900' : 'text-zinc-700'
                  }`}
                >
                  <div className="min-w-0 flex-1 truncate">
                    <span className="truncate">{name}</span>
                    {loc.locationCode && loc.locationName && (
                      <span className="text-[9px] font-mono text-zinc-400 block truncate">
                        {loc.locationCode}
                      </span>
                    )}
                  </div>
                  {isSelected && <Check size={13} className="text-zinc-900 shrink-0 ml-1.5" />}
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

// ── Helper: Match PO Item to Source PR Item ──────────────────────────────────
function findMatchingPrItem(poItem, prItems) {
  if (!poItem || !Array.isArray(prItems) || prItems.length === 0) return null;

  // 1. Direct itemId match (preferred)
  if (poItem.itemId) {
    const match = prItems.find(p => p.itemId && p.itemId === poItem.itemId);
    if (match) return match;
  }

  // 2. PR item id matching PO item's itemId, requisitionItemId, or purchaseRequisitionItemId
  const matchById = prItems.find(p =>
    p.id && (
      p.id === poItem.itemId ||
      p.id === poItem.requisitionItemId ||
      p.id === poItem.purchaseRequisitionItemId
    )
  );
  if (matchById) return matchById;

  // 3. Match by itemCode / productCode
  const poCode = (poItem.itemCode || poItem.productCode || '').trim().toLowerCase();
  if (poCode) {
    const matchByCode = prItems.find(p => {
      const prCode = (p.itemCode || p.productCode || '').trim().toLowerCase();
      return prCode && prCode === poCode;
    });
    if (matchByCode) return matchByCode;
  }

  // 4. Match by itemName / productName
  const poName = (poItem.itemName || poItem.productName || '').trim().toLowerCase();
  if (poName) {
    const matchByName = prItems.find(p => {
      const prName = (p.itemName || p.productName || '').trim().toLowerCase();
      return prName && prName === poName;
    });
    if (matchByName) return matchByName;
  }

  // 5. Single item fallback
  if (prItems.length === 1) {
    return prItems[0];
  }

  return null;
}

// ── Main CreateGrnModal Component ────────────────────────────────────────────
export default function CreateGrnModal({ isOpen, onClose, purchaseOrder, companyId, onSuccess }) {
  const dispatch = useAppDispatch();
  const [createGrn, { isLoading: isSubmitting }] = useCreateGoodsReceiptFromPOMutation();

  // Load fresh PO details (including items)
  const { data: fullPoResp, isLoading: isLoadingPo } = useGetPurchaseOrderByIdQuery(
    { id: purchaseOrder?.id, companyId },
    { skip: !isOpen || !purchaseOrder?.id }
  );

  const po = useMemo(() => {
    const raw = fullPoResp?.data || fullPoResp;
    return (raw && typeof raw === 'object' && raw.id) ? raw : purchaseOrder;
  }, [fullPoResp, purchaseOrder]);

  // Form states
  const [grnNumber, setGrnNumber] = useState('');
  const [grnDate, setGrnDate] = useState(() => getTodayString());
  const [warehouseId, setWarehouseId] = useState('');
  const [warehouseFallbackName, setWarehouseFallbackName] = useState('');
  const [userChangedWarehouse, setUserChangedWarehouse] = useState(false);
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState('');
  const [deliveryNoteDate, setDeliveryNoteDate] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [transporterName, setTransporterName] = useState('');
  const [notes, setNotes] = useState('');

  // Source PR state
  const [loadingPr, setLoadingPr] = useState(false);
  const [prError, setPrError] = useState(null);
  const [sourcePr, setSourcePr] = useState(null);

  // Item receipts state
  const [itemReceipts, setItemReceipts] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  // Warehouses and Locations lookup
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Fetch warehouses on modal open
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    (async () => {
      setLoadingWarehouses(true);
      try {
        const res = await warehousesApi.getList({ companyId }, { page: 0, size: 100 });
        const list = Array.isArray(res) ? res : res?.data?.content || res?.data || res?.content || [];
        if (isMounted) {
          setWarehouses(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.error('Failed to load warehouses', err);
      } finally {
        if (isMounted) setLoadingWarehouses(false);
      }
    })();
    return () => { isMounted = false; };
  }, [isOpen, companyId]);

  // Fetch source Purchase Requisition details
  useEffect(() => {
    if (!isOpen) {
      setSourcePr(null);
      setLoadingPr(false);
      setPrError(null);
      setUserChangedWarehouse(false);
      setWarehouseFallbackName('');
      return;
    }

    let isMounted = true;
    (async () => {
      let prId = po?.purchaseRequisitionId || purchaseOrder?.purchaseRequisitionId || po?.requisitionId;

      if (!prId && po?.rfqId) {
        try {
          const rfqRes = await rfqsApi.getById(po.rfqId);
          const rfq = rfqRes?.data?.data || rfqRes?.data || rfqRes;
          if (rfq?.purchaseRequisitionId) {
            prId = rfq.purchaseRequisitionId;
          }
        } catch (e) {
          console.warn('Could not resolve PR from RFQ', e);
        }
      }

      if (!prId && po?.supplierQuotationId) {
        try {
          const sqRes = await supplierQuotationsApi.getById(po.supplierQuotationId);
          const sq = sqRes?.data?.data || sqRes?.data || sqRes;
          if (sq?.purchaseRequisitionId) {
            prId = sq.purchaseRequisitionId;
          } else if (sq?.rfqId) {
            const rfqRes = await rfqsApi.getById(sq.rfqId);
            const rfq = rfqRes?.data?.data || rfqRes?.data || rfqRes;
            if (rfq?.purchaseRequisitionId) {
              prId = rfq.purchaseRequisitionId;
            }
          }
        } catch (e) {
          console.warn('Could not resolve PR from Supplier Quotation', e);
        }
      }

      if (!prId) {
        return;
      }

      setLoadingPr(true);
      setPrError(null);
      try {
        const res = await purchaseRequisitionsApi.getById(prId);
        const data = res?.data?.data || res?.data || res;
        if (isMounted) {
          if (data && typeof data === 'object') {
            setSourcePr(data);
          } else {
            setPrError('Unable to load source requisition warehouse details. Please select the warehouse manually.');
          }
        }
      } catch (err) {
        console.error('Failed to load source PR details', err);
        if (isMounted) {
          setPrError('Unable to load source requisition warehouse details. Please select the warehouse manually.');
        }
      } finally {
        if (isMounted) setLoadingPr(false);
      }
    })();

    return () => { isMounted = false; };
  }, [isOpen, po?.id, po?.purchaseRequisitionId, purchaseOrder?.purchaseRequisitionId, po?.rfqId, po?.supplierQuotationId]);

  // Synchronize Warehouse & Item Receipts from PO and source PR
  useEffect(() => {
    if (!isOpen || !po) return;
    const poItems = Array.isArray(po.items) ? po.items : [];
    const prItems = Array.isArray(sourcePr?.items) ? sourcePr.items : [];

    // 1. Resolve Warehouse:
    // Priority 1: PO warehouse if available and non-null
    // Priority 2: Source PR warehouse or first item's warehouse in PR
    const poWhId = po.warehouseId;
    const poWhName = po.warehouseName;
    const prWhId = sourcePr?.warehouseId || prItems.find(i => i.warehouseId)?.warehouseId;
    const prWhName = sourcePr?.warehouseName || prItems.find(i => i.warehouseName)?.warehouseName;

    const resolvedWhId = poWhId || prWhId;
    const resolvedWhName = poWhName || prWhName;

    if (resolvedWhId && !userChangedWarehouse) {
      setWarehouseId(resolvedWhId);
      if (resolvedWhName) {
        setWarehouseFallbackName(resolvedWhName);
      }
    } else if (!warehouseId && !userChangedWarehouse && warehouses.length > 0 && !loadingPr && !po?.purchaseRequisitionId) {
      setWarehouseId(warehouses[0].id);
    }

    // 2. Map items:
    const activeWhId = resolvedWhId || warehouseId;
    setItemReceipts(prev => {
      return poItems.map((item, idx) => {
        const existingRow = prev.find(r => r.purchaseOrderItemId === item.id) || prev[idx];
        const matchedPrItem = findMatchingPrItem(item, prItems);

        const ordered = Number(item.orderedQuantity) || 0;
        const prevReceived = Number(item.receivedQuantity) || 0;
        const pending = item.pendingQuantity != null
          ? Math.max(0, Number(item.pendingQuantity))
          : Math.max(0, ordered - prevReceived);

        const defaultRcvd = pending > 0 ? pending : 0;

        // Fallback logic for warehouse:
        // Priority 1: PO item warehouse
        // Priority 2: PR item warehouse
        // Priority 3: Global warehouse
        const itemWhId = item.warehouseId ?? matchedPrItem?.warehouseId ?? (existingRow?.warehouseId || activeWhId || '');

        // Fallback logic for location:
        // Priority 1: PO item location
        // Priority 2: PR item location
        // Priority 3: Existing selected location
        const itemLocId = item.locationId ?? matchedPrItem?.locationId ?? existingRow?.locationId ?? '';
        const itemLocName = item.locationName ?? matchedPrItem?.locationName ?? existingRow?.locationName ?? '';

        return {
          key: item.id || `item-${idx}`,
          purchaseOrderItemId: item.id,
          itemId: item.itemId,
          itemName: item.itemName || item.productName || `Item #${idx + 1}`,
          itemCode: item.itemCode || item.productCode || '',
          unit: item.unit || 'PCS',
          orderedQuantity: ordered,
          previouslyReceivedQuantity: prevReceived,
          pendingQuantity: pending,
          receivedQuantity: existingRow?.receivedQuantity !== undefined ? existingRow.receivedQuantity : defaultRcvd,
          acceptedQuantity: existingRow?.acceptedQuantity !== undefined ? existingRow.acceptedQuantity : defaultRcvd,
          rejectedQuantity: existingRow?.rejectedQuantity || 0,
          rejectionReason: existingRow?.rejectionReason || '',
          batchNumber: existingRow?.batchNumber || '',
          serialNumber: existingRow?.serialNumber || '',
          expiryDate: existingRow?.expiryDate || '',
          warehouseId: itemWhId,
          locationId: itemLocId,
          locationName: itemLocName,
          notes: existingRow?.notes || ''
        };
      });
    });
  }, [isOpen, po, sourcePr, userChangedWarehouse, warehouses.length, loadingPr]);

  // Fetch locations whenever selected warehouseId changes
  useEffect(() => {
    if (!warehouseId || !isOpen) {
      setLocations([]);
      return;
    }
    let isMounted = true;
    (async () => {
      setLoadingLocations(true);
      try {
        const res = await warehouseLocationsApi.getList({ warehouseId, companyId }, { page: 0, size: 100 });
        const list = Array.isArray(res) ? res : res?.data?.content || res?.data || res?.content || [];
        if (isMounted) {
          setLocations(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.error('Failed to load locations', err);
      } finally {
        if (isMounted) setLoadingLocations(false);
      }
    })();
    return () => { isMounted = false; };
  }, [warehouseId, companyId, isOpen]);

  // Handler for user manually changing warehouse
  const handleWarehouseChange = (newWhId) => {
    setUserChangedWarehouse(true);
    setWarehouseId(newWhId);
    const found = warehouses.find(w => w.id === newWhId);
    setWarehouseFallbackName(found?.warehouseName || '');
    setItemReceipts(prev => prev.map(row => ({
      ...row,
      warehouseId: newWhId,
      locationId: '',
      locationName: ''
    })));
  };

  if (!isOpen || !purchaseOrder) return null;

  const handleItemChange = (idx, field, rawVal) => {
    setItemReceipts(prev => {
      const updated = [...prev];
      const row = { ...updated[idx] };

      if (field === 'receivedQuantity') {
        const val = rawVal === '' ? '' : Math.max(0, parseFloat(rawVal) || 0);
        row.receivedQuantity = val;
        const numVal = typeof val === 'number' ? val : 0;
        row.acceptedQuantity = Math.max(0, numVal - (Number(row.rejectedQuantity) || 0));
      } else if (field === 'rejectedQuantity') {
        const val = rawVal === '' ? '' : Math.max(0, parseFloat(rawVal) || 0);
        row.rejectedQuantity = val;
        const numVal = typeof val === 'number' ? val : 0;
        const rcvd = Number(row.receivedQuantity) || 0;
        row.acceptedQuantity = Math.max(0, rcvd - numVal);
      } else if (field === 'acceptedQuantity') {
        const val = rawVal === '' ? '' : Math.max(0, parseFloat(rawVal) || 0);
        row.acceptedQuantity = val;
        const numVal = typeof val === 'number' ? val : 0;
        const rcvd = Number(row.receivedQuantity) || 0;
        row.rejectedQuantity = Math.max(0, rcvd - numVal);
      } else if (field === 'locationId') {
        row.locationId = rawVal;
        const foundLoc = locations.find(l => l.id === rawVal);
        row.locationName = foundLoc ? (foundLoc.locationName || foundLoc.locationCode || foundLoc.name || '') : (row.locationName || '');
      } else if (field === 'locationName') {
        row.locationName = rawVal;
      } else {
        row[field] = rawVal;
      }

      updated[idx] = row;
      return updated;
    });

    if (formErrors[`${idx}_${field}`] || formErrors[idx]) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[`${idx}_${field}`];
        delete next[idx];
        return next;
      });
    }
  };

  // Summary counts
  const summary = useMemo(() => {
    let totalOrdered = 0;
    let totalPending = 0;
    let totalReceived = 0;
    let totalAccepted = 0;
    let totalRejected = 0;

    itemReceipts.forEach(row => {
      totalOrdered += Number(row.orderedQuantity) || 0;
      totalPending += Number(row.pendingQuantity) || 0;
      totalReceived += Number(row.receivedQuantity) || 0;
      totalAccepted += Number(row.acceptedQuantity) || 0;
      totalRejected += Number(row.rejectedQuantity) || 0;
    });

    return {
      itemCount: itemReceipts.length,
      totalOrdered,
      totalPending,
      totalReceived,
      totalAccepted,
      totalRejected
    };
  }, [itemReceipts]);

  // Validation
  const validateForm = () => {
    const errors = {};
    if (!warehouseId) {
      errors.warehouseId = 'Warehouse is required.';
    }
    if (!grnDate) {
      errors.grnDate = 'GRN Date is required.';
    }

    const itemsToReceive = itemReceipts.filter(it => (Number(it.receivedQuantity) || 0) > 0);
    if (itemsToReceive.length === 0) {
      errors.general = 'Please enter a received quantity greater than 0 for at least one item.';
    }

    itemReceipts.forEach((row, idx) => {
      const rcvd = Number(row.receivedQuantity) || 0;
      const accepted = Number(row.acceptedQuantity) || 0;
      const rejected = Number(row.rejectedQuantity) || 0;
      const pending = Number(row.pendingQuantity) || 0;

      if (rcvd < 0) {
        errors[`${idx}_receivedQuantity`] = 'Cannot be negative';
      }
      if (rcvd > pending) {
        errors[`${idx}_receivedQuantity`] = `Cannot exceed pending (${pending})`;
      }
      if (accepted < 0) {
        errors[`${idx}_acceptedQuantity`] = 'Cannot be negative';
      }
      if (rejected < 0) {
        errors[`${idx}_rejectedQuantity`] = 'Cannot be negative';
      }
      if (accepted + rejected > rcvd) {
        errors[`${idx}_acceptedQuantity`] = `Accepted + Rejected cannot exceed Received (${rcvd})`;
      }
      if (rejected > 0 && (!row.rejectionReason || !row.rejectionReason.trim())) {
        errors[`${idx}_rejectionReason`] = 'Reason is required when items are rejected';
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      dispatch(addAlert({ type: 'error', message: 'Please resolve the validation errors before creating the Goods Receipt.' }));
      return;
    }

    const validItems = itemReceipts.filter(it => (Number(it.receivedQuantity) || 0) > 0);

    try {
      const payload = {
        poId: po.id,
        companyId,
        purchaseOrderId: po.id,
        grnNumber: grnNumber.trim() || undefined,
        grnDate,
        warehouseId,
        deliveryNoteNumber: deliveryNoteNumber.trim() || undefined,
        deliveryNoteDate: deliveryNoteDate || undefined,
        vehicleNumber: vehicleNumber.trim() || undefined,
        transporterName: transporterName.trim() || undefined,
        notes: notes.trim() || undefined,
        items: validItems.map(it => ({
          purchaseOrderItemId: it.purchaseOrderItemId,
          receivedQuantity: Number(it.receivedQuantity),
          acceptedQuantity: Number(it.acceptedQuantity),
          rejectedQuantity: Number(it.rejectedQuantity),
          rejectionReason: Number(it.rejectedQuantity) > 0 ? (it.rejectionReason?.trim() || undefined) : undefined,
          batchNumber: it.batchNumber?.trim() || undefined,
          serialNumber: it.serialNumber?.trim() || undefined,
          expiryDate: it.expiryDate || undefined,
          warehouseId: it.warehouseId || warehouseId,
          locationId: it.locationId || undefined,
          notes: it.notes?.trim() || undefined
        }))
      };

      const result = await createGrn(payload).unwrap();

      const returnedGrnNumber = result?.grnNumber || result?.data?.grnNumber;
      const successMsg = returnedGrnNumber
        ? `Goods Receipt ${returnedGrnNumber} created successfully.`
        : 'Goods Receipt created successfully.';

      dispatch(addAlert({ type: 'success', message: successMsg }));

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      const errorMsg = err?.data?.message || err?.message || 'Failed to create Goods Receipt.';
      const errorsList = Array.isArray(err?.data?.errors) ? err.data.errors.join(', ') : null;
      const fullMsg = errorsList ? `${errorMsg} (${errorsList})` : errorMsg;
      setSubmitError(fullMsg);
      dispatch(addAlert({ type: 'error', message: fullMsg }));
    }
  };

  const statusLabel = `${(po.status || 'APPROVED').replace('_', ' ')} PO`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-[1240px] w-full max-h-[92vh] flex flex-col overflow-hidden border border-zinc-200">

        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-2xs">
              <Truck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-zinc-900 tracking-tight">Create Goods Receipt</h2>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200">
                  {po.poNumber || '-'}
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {statusLabel}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Record physical receipt, accepted & rejected quantities, and assign inventory locations.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Modal Scrollable Body ── */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 min-h-0 bg-zinc-50/40">

          {/* Submission / General Error Alert */}
          {(submitError || formErrors.general) && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5 animate-shake">
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{submitError || formErrors.general}</p>
                <p className="text-[11px] text-rose-600 mt-0.5">Please review the fields below and correct highlighted issues.</p>
              </div>
            </div>
          )}

          {/* 1. PURCHASE ORDER SUMMARY (READ-ONLY) */}
          <div className="bg-white rounded-xl border border-zinc-200/80 p-4 shadow-2xs">
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-zinc-400" />
                <span className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">Purchase Order Summary</span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                Read-Only
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">PO Number</p>
                <p className="text-xs font-bold text-zinc-900 font-mono mt-0.5">{po.poNumber || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Supplier</p>
                <p className="text-xs font-semibold text-zinc-800 mt-0.5 truncate" title={po.vendorName || po.vendor?.name}>
                  {po.vendorName || po.vendor?.name || '-'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">PO Date</p>
                <p className="text-xs font-medium text-zinc-700 mt-0.5">{formatDate(po.poDate)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Expected Delivery</p>
                <p className="text-xs font-medium text-zinc-700 mt-0.5">{formatDate(po.expectedDeliveryDate)}</p>
              </div>
            </div>
          </div>

          {/* 2. GRN DETAILS & WAREHOUSE */}
          {/* 2. RECEIPT DETAILS & DESTINATION WAREHOUSE */}
          <div className="bg-white rounded-xl border border-zinc-200/80 p-4 shadow-2xs space-y-3.5">
            {/* PR Loading indicator */}
            {loadingPr && (
              <div className="px-3.5 py-2 bg-blue-50/80 border border-blue-200/70 rounded-xl flex items-center gap-2.5 text-xs text-blue-700 animate-pulse">
                <Loader2 size={14} className="animate-spin text-blue-600 shrink-0" />
                <span className="font-medium">Loading requisition details...</span>
              </div>
            )}

            {/* PR Error banner */}
            {prError && (
              <div className="px-3.5 py-2 bg-amber-50 border border-amber-200/70 rounded-xl flex items-center justify-between text-xs text-amber-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                  <span>{prError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPrError(null)}
                  className="text-amber-600 hover:text-amber-900 font-medium ml-2 cursor-pointer text-[11px]"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 pb-2.5 border-b border-zinc-100">
              <Building2 size={14} className="text-zinc-400" />
              <span className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">Receipt Details & Destination Warehouse</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              {/* GRN Number */}
              <div>
                <label className="text-[10.5px] font-bold text-zinc-600 block mb-1">
                  GRN Number <span className="text-zinc-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  className="w-full h-8 px-2.5 text-xs text-zinc-800 bg-white border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 font-mono"
                  placeholder="Auto-generated if blank"
                  value={grnNumber}
                  onChange={e => setGrnNumber(e.target.value)}
                />
              </div>

              {/* Custom GRN Date */}
              <div>
                <label className="text-[10.5px] font-bold text-zinc-600 block mb-1">
                  GRN Date <span className="text-rose-500">*</span>
                </label>
                <CustomDatePicker
                  value={grnDate}
                  onChange={val => setGrnDate(val)}
                  required={true}
                  hasError={!!formErrors.grnDate}
                />
                {formErrors.grnDate && <p className="text-[10px] text-rose-500 mt-0.5">{formErrors.grnDate}</p>}
              </div>

              {/* Custom Warehouse Selector */}
              <div>
                <label className="text-[10.5px] font-bold text-zinc-600 block mb-1">
                  Receiving Warehouse <span className="text-rose-500">*</span>
                </label>
                <CustomWarehouseSelect
                  value={warehouseId}
                  onChange={handleWarehouseChange}
                  warehouses={warehouses}
                  loading={loadingWarehouses || loadingPr}
                  fallbackName={warehouseFallbackName}
                  hasError={!!formErrors.warehouseId}
                />
                {formErrors.warehouseId && <p className="text-[10px] text-rose-500 mt-0.5">{formErrors.warehouseId}</p>}
              </div>

              {/* Delivery Note Number */}
              <div>
                <label className="text-[10.5px] font-bold text-zinc-600 block mb-1">
                  Delivery Note Number
                </label>
                <input
                  type="text"
                  className="w-full h-8 px-2.5 text-xs text-zinc-800 bg-white border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 font-mono"
                  placeholder="e.g. DN-2026-0089"
                  value={deliveryNoteNumber}
                  onChange={e => setDeliveryNoteNumber(e.target.value)}
                />
              </div>

              {/* Custom Delivery Note Date */}
              <div>
                <label className="text-[10.5px] font-bold text-zinc-600 block mb-1">
                  Delivery Note Date
                </label>
                <CustomDatePicker
                  value={deliveryNoteDate}
                  onChange={val => setDeliveryNoteDate(val)}
                  placeholder="mm/dd/yyyy"
                  required={false}
                />
              </div>

              {/* Vehicle Number */}
              <div>
                <label className="text-[10.5px] font-bold text-zinc-600 block mb-1">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  className="w-full h-8 px-2.5 text-xs text-zinc-800 bg-white border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5"
                  placeholder="e.g. MH-12-AB-1234"
                  value={vehicleNumber}
                  onChange={e => setVehicleNumber(e.target.value)}
                />
              </div>

              {/* Transporter Name */}
              <div className="sm:col-span-2">
                <label className="text-[10.5px] font-bold text-zinc-600 block mb-1">
                  Transporter / Courier Name
                </label>
                <input
                  type="text"
                  className="w-full h-8 px-2.5 text-xs text-zinc-800 bg-white border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5"
                  placeholder="e.g. Blue Dart / DHL Express / Freight Carrier"
                  value={transporterName}
                  onChange={e => setTransporterName(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 3. GRN ITEMS TABLE */}
          <div className="bg-white rounded-xl border border-zinc-200/80 p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Package size={14} className="text-zinc-400" />
                <span className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">Receipt Items</span>
              </div>
              <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                <Info size={13} className="text-zinc-400" />
                <span>Quantities: Accepted + Rejected must not exceed Received.</span>
              </div>
            </div>

            {isLoadingPo ? (
              <div className="py-8 flex flex-col items-center justify-center text-zinc-400 gap-2">
                <Loader2 size={24} className="animate-spin text-zinc-500" />
                <p className="text-xs">Loading Purchase Order item details...</p>
              </div>
            ) : itemReceipts.length === 0 ? (
              <div className="py-8 text-center text-zinc-400 text-xs italic">
                No items found for this Purchase Order.
              </div>
            ) : (
              <div className="w-full max-w-full overflow-hidden border border-zinc-200/80 rounded-xl shadow-2xs">
                <table className="table-fixed w-full text-left border-collapse">
                  <colgroup>
                    <col className="w-[30px]" />
                    <col className="min-w-[140px]" />
                    <col className="w-[62px]" />
                    <col className="w-[62px]" />
                    <col className="w-[62px]" />
                    <col className="w-[78px]" />
                    <col className="w-[78px]" />
                    <col className="w-[78px]" />
                    <col className="w-[45px]" />
                    <col className="w-[80px]" />
                    <col className="w-[80px]" />
                    <col className="w-[98px]" />
                    <col className="w-[105px]" />
                    <col className="w-[130px]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200/80 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      <th className="py-2.5 px-1.5 text-center">#</th>
                      <th className="py-2.5 px-2">Item</th>
                      <th className="py-2.5 px-1 text-right">Ordered</th>
                      <th className="py-2.5 px-1 text-right">Prev Rcvd</th>
                      <th className="py-2.5 px-1 text-right">Pending</th>
                      <th className="py-2.5 px-1 text-right text-zinc-900">Rcvd Qty *</th>
                      <th className="py-2.5 px-1 text-right text-emerald-700">Accepted *</th>
                      <th className="py-2.5 px-1 text-right text-rose-700">Rejected</th>
                      <th className="py-2.5 px-1 text-center">Unit</th>
                      <th className="py-2.5 px-1">Batch</th>
                      <th className="py-2.5 px-1">Serial</th>
                      <th className="py-2.5 px-1">Expiry</th>
                      <th className="py-2.5 px-1">Location</th>
                      <th className="py-2.5 px-1.5">Notes / Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-xs">
                    {itemReceipts.map((row, idx) => {
                      const rcvdErr = formErrors[`${idx}_receivedQuantity`];
                      const acceptedErr = formErrors[`${idx}_acceptedQuantity`];
                      const rejectedErr = formErrors[`${idx}_rejectedQuantity`];
                      const reasonErr = formErrors[`${idx}_rejectionReason`];
                      const isRejected = (Number(row.rejectedQuantity) || 0) > 0;

                      return (
                        <tr key={row.key} className="hover:bg-zinc-50/50 transition-colors">
                          {/* # */}
                          <td className="py-2 px-1 text-center text-[11px] font-mono text-zinc-400">
                            {idx + 1}
                          </td>

                          {/* Item */}
                          <td className="py-2 px-2">
                            <p className="font-semibold text-zinc-800 text-[11.5px] leading-tight line-clamp-2" title={row.itemName}>
                              {row.itemName}
                            </p>
                            {row.itemCode && (
                              <span className="font-mono text-[9px] text-zinc-400">
                                {row.itemCode}
                              </span>
                            )}
                          </td>

                          {/* Ordered */}
                          <td className="py-2 px-1 text-right font-mono text-[11px] text-zinc-600">
                            {row.orderedQuantity.toLocaleString()}
                          </td>

                          {/* Prev Rcvd */}
                          <td className="py-2 px-1 text-right font-mono text-[11px] text-zinc-400">
                            {row.previouslyReceivedQuantity.toLocaleString()}
                          </td>

                          {/* Pending */}
                          <td className="py-2 px-1 text-right font-mono text-[11px] font-bold text-amber-700">
                            {row.pendingQuantity.toLocaleString()}
                          </td>

                          {/* Received Qty */}
                          <td className="py-1 px-1">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              max={row.pendingQuantity}
                              className={`w-full h-8 px-1.5 text-xs text-right font-mono font-bold bg-white border rounded-md outline-none focus:ring-1 focus:ring-zinc-900/10 ${
                                rcvdErr ? 'border-rose-400 bg-rose-50/30 text-rose-700' : 'border-zinc-300 focus:border-zinc-500 text-zinc-900'
                              }`}
                              value={row.receivedQuantity}
                              onChange={e => handleItemChange(idx, 'receivedQuantity', e.target.value)}
                              title={rcvdErr}
                            />
                            {rcvdErr && <p className="text-[8.5px] text-rose-500 text-right leading-none mt-0.5 truncate">{rcvdErr}</p>}
                          </td>

                          {/* Accepted Qty */}
                          <td className="py-1 px-1">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              max={row.receivedQuantity}
                              className={`w-full h-8 px-1.5 text-xs text-right font-mono font-bold bg-white border rounded-md outline-none focus:ring-1 focus:ring-emerald-500/20 ${
                                acceptedErr ? 'border-rose-400 bg-rose-50/30 text-rose-700' : 'border-emerald-300 text-emerald-700 focus:border-emerald-500'
                              }`}
                              value={row.acceptedQuantity}
                              onChange={e => handleItemChange(idx, 'acceptedQuantity', e.target.value)}
                              title={acceptedErr}
                            />
                            {acceptedErr && <p className="text-[8.5px] text-rose-500 text-right leading-none mt-0.5 truncate">{acceptedErr}</p>}
                          </td>

                          {/* Rejected Qty */}
                          <td className="py-1 px-1">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              max={row.receivedQuantity}
                              className={`w-full h-8 px-1.5 text-xs text-right font-mono font-bold bg-white border rounded-md outline-none focus:ring-1 focus:ring-rose-500/20 ${
                                rejectedErr || (isRejected && reasonErr) ? 'border-rose-400 bg-rose-50/30 text-rose-700' : isRejected ? 'border-rose-300 text-rose-700' : 'border-zinc-300 text-zinc-600 focus:border-zinc-500'
                              }`}
                              value={row.rejectedQuantity}
                              onChange={e => handleItemChange(idx, 'rejectedQuantity', e.target.value)}
                              title={rejectedErr}
                            />
                            {rejectedErr && <p className="text-[8.5px] text-rose-500 text-right leading-none mt-0.5 truncate">{rejectedErr}</p>}
                          </td>

                          {/* Unit */}
                          <td className="py-2 px-1 text-center font-mono text-[10.5px] text-zinc-500">
                            <span className="px-1 py-0.5 rounded bg-zinc-100 border border-zinc-200/60">
                              {row.unit || 'PCS'}
                            </span>
                          </td>

                          {/* Batch Number */}
                          <td className="py-1 px-1">
                            <input
                              type="text"
                              placeholder="Batch"
                              className="w-full h-8 px-1.5 text-[11px] font-mono bg-white border border-zinc-200 rounded-md outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/5 text-zinc-700"
                              value={row.batchNumber}
                              onChange={e => handleItemChange(idx, 'batchNumber', e.target.value)}
                            />
                          </td>

                          {/* Serial Number */}
                          <td className="py-1 px-1">
                            <input
                              type="text"
                              placeholder="Serial"
                              className="w-full h-8 px-1.5 text-[11px] font-mono bg-white border border-zinc-200 rounded-md outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/5 text-zinc-700"
                              value={row.serialNumber}
                              onChange={e => handleItemChange(idx, 'serialNumber', e.target.value)}
                            />
                          </td>

                          {/* Custom Expiry DatePicker (Portal with smart upward flip) */}
                          <td className="py-1 px-1">
                            <CustomDatePicker
                              value={row.expiryDate}
                              onChange={val => handleItemChange(idx, 'expiryDate', val)}
                              placeholder="Expiry"
                              required={false}
                              compact={true}
                            />
                          </td>

                          {/* Custom Location Dropdown */}
                          <td className="py-1 px-1">
                            <CustomLocationCellSelect
                              value={row.locationId}
                              fallbackName={row.locationName}
                              onChange={(val, locObj) => {
                                handleItemChange(idx, 'locationId', val);
                                if (locObj) {
                                  handleItemChange(idx, 'locationName', locObj.locationName || locObj.locationCode || locObj.name || '');
                                }
                              }}
                              locations={locations}
                              disabled={loadingLocations && !row.locationId && locations.length === 0}
                            />
                          </td>

                          {/* Notes / Rejection Reason */}
                          <td className="py-1 px-1.5">
                            {isRejected ? (
                              <div>
                                <input
                                  type="text"
                                  placeholder="Rejection reason *"
                                  className={`w-full h-8 px-1.5 text-[11px] bg-white border rounded-md outline-none focus:ring-1 ${
                                    reasonErr ? 'border-rose-400 bg-rose-50/20 text-rose-700 placeholder-rose-400' : 'border-rose-300 text-rose-700 focus:border-rose-500'
                                  }`}
                                  value={row.rejectionReason}
                                  onChange={e => handleItemChange(idx, 'rejectionReason', e.target.value)}
                                  title={reasonErr}
                                />
                                {reasonErr && <p className="text-[8px] text-rose-500 leading-none mt-0.5 truncate">{reasonErr}</p>}
                              </div>
                            ) : (
                              <input
                                type="text"
                                placeholder="Notes..."
                                className="w-full h-8 px-1.5 text-[11px] bg-white border border-zinc-200 rounded-md outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/5 text-zinc-700"
                                value={row.notes}
                                onChange={e => handleItemChange(idx, 'notes', e.target.value)}
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 4. RECEIVING SUMMARY & REMARKS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-white rounded-xl border border-zinc-200/80 p-4 shadow-2xs space-y-2">
              <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={13} className="text-zinc-400" />
                Receiving / Inspection Notes
              </label>
              <textarea
                className="w-full h-18 p-2.5 text-xs text-zinc-800 bg-white border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 resize-none placeholder-zinc-400"
                placeholder="Add general receiving remarks, package condition notes, or gate inspection comments..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <div className="bg-white rounded-xl border border-zinc-200/80 p-4 shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block mb-2">
                Receipt Summary
              </span>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Items to Receive:</span>
                  <span className="font-mono font-semibold text-zinc-900">
                    {itemReceipts.filter(i => (Number(i.receivedQuantity) || 0) > 0).length} of {summary.itemCount}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Total Received Qty:</span>
                  <span className="font-mono font-bold text-zinc-900">{summary.totalReceived.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Accepted Qty:</span>
                  <span className="font-mono font-bold">{summary.totalAccepted.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>Rejected Qty:</span>
                  <span className="font-mono font-bold">{summary.totalRejected.toLocaleString()}</span>
                </div>
              </div>
              <div className="pt-2 mt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
                <span>Pending balance:</span>
                <span className="font-mono font-semibold text-zinc-600">
                  {Math.max(0, summary.totalPending - summary.totalReceived).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* ── Modal Footer ── */}
        <div className="px-6 py-4 border-t border-zinc-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-100 font-medium">
              <Package size={13} className="text-zinc-400" />
              {itemReceipts.length} items
            </span>
            {summary.totalAccepted > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-200/60">
                <CheckCircle size={13} />
                {summary.totalAccepted.toLocaleString()} accepted
              </span>
            )}
            {summary.totalRejected > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-50 text-rose-700 font-medium border border-rose-200/60">
                <AlertTriangle size={13} />
                {summary.totalRejected.toLocaleString()} rejected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 text-xs font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors shadow-2xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || loadingPr}
              className="h-9 px-5 text-xs font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Creating GRN...</span>
                </>
              ) : loadingPr ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Loading Details...</span>
                </>
              ) : (
                <>
                  <Truck size={15} />
                  <span>Create GRN</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
