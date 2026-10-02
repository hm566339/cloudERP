import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { TransactionForm } from '../../../components/erp/TransactionForm';
import supplierQuotationFormConfig from '../configs/supplierQuotationFormConfig';
import SupplierQuotationLineItemRow from './SupplierQuotationLineItemRow';
import {
  X,
  Receipt,
  AlertCircle,
  RefreshCw,
  Building2,
  Calendar,
  Package,
  FileText,
  ChevronDown,
  Check,
  Search
} from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApi';
import { rfqsApi, supplierQuotationsApi, vendorsApi, hsnSacMasterApi } from '../../../api/account';
import { productsApi } from '../../../api/inventory/products';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { formatCurrency } from '../../../utils/formatters';

const toNum = (v) => {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

const getTodayLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Global product cache to avoid redundant API calls across modal opens/renders
const productCache = new Map();
const productPendingRequests = new Map();

async function getProductByIdSafely(itemId) {
  if (!itemId) return null;

  // Requirement 11: Return cached product data if already loaded
  if (productCache.has(itemId)) {
    return productCache.get(itemId);
  }

  // Deduplicate in-flight requests for the same itemId
  if (productPendingRequests.has(itemId)) {
    return productPendingRequests.get(itemId);
  }

  const promise = (async () => {
    try {
      const resp = await productsApi.getById(itemId);
      const data = resp?.data || resp;
      if (data) {
        productCache.set(itemId, data);
      }
      return data;
    } catch (err) {
      console.warn(`[CreateSupplierQuotationModal] Failed to fetch product for itemId: ${itemId}`, err);
      return null;
    } finally {
      productPendingRequests.delete(itemId);
    }
  })();

  productPendingRequests.set(itemId, promise);
  return promise;
}

const isUUID = (str) =>
  typeof str === 'string' &&
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

function extractProductHsn(product) {
  if (!product) return { code: '', description: '', id: '', raw: null };
  const data = product?.data || product;
  const hsnObj = data?.hsnSac || null;
  const code = hsnObj?.code || data?.hsnSacCode || data?.product?.hsnSacCode || '';
  const description = hsnObj?.description || data?.hsnSacDescription || '';
  const rawId = hsnObj?.id || data?.hsnSacId;
  const id = isUUID(rawId) ? rawId : '';
  return { code, description, id, raw: hsnObj };
}

/**
 * Resolve the actual backend UUID for an HSN/SAC code or ID.
 * Guarantees that only a valid UUID or undefined is returned, never a raw code string.
 */
async function resolveItemHsnSacId(item, list) {
  if (isUUID(item.hsnSacId)) {
    return item.hsnSacId;
  }
  if (item.hsnSacData && isUUID(item.hsnSacData.id)) {
    return item.hsnSacData.id;
  }
  const code = item.hsnSacCode || (!isUUID(item.hsnSacId) ? item.hsnSacId : '');
  if (code) {
    if (Array.isArray(list)) {
      const match = list.find(h => (h.code === code || h.hsnCode === code || h.id === code) && isUUID(h.id));
      if (match && isUUID(match.id)) {
        return match.id;
      }
    }
    try {
      const res = await hsnSacMasterApi.getHsnSacByCode(code);
      const data = res?.data || res;
      if (data && isUUID(data.id)) {
        return data.id;
      }
    } catch (err) {
      console.warn(`[CreateSupplierQuotationModal] Could not resolve HSN UUID for code "${code}"`, err);
    }
  }
  return undefined;
}

/**
 * Dedicated, portal-based HSN/SAC selector for table cells.
 * - Aligns right with button edge so it never overflows off-screen.
 * - Flips upward if near bottom so it never covers the footer.
 * - Shows bold code with type badge and clean description.
 */
function HsnSacCellSelect({ value, onChange, hsnSacList, fallbackHsn }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const buttonRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 280, openUpwards: false });

  // Supplement master list with fallbackHsn if not yet present in hsnSacList
  const combinedList = useMemo(() => {
    const list = Array.isArray(hsnSacList) ? hsnSacList : [];
    if (!fallbackHsn || (!fallbackHsn.code && !fallbackHsn.id)) return list;
    const exists = list.some(h =>
      (fallbackHsn.id && h.id === fallbackHsn.id) ||
      (fallbackHsn.code && (h.code === fallbackHsn.code || h.hsnCode === fallbackHsn.code))
    );
    if (exists) return list;
    return [{
      id: fallbackHsn.id || fallbackHsn.code,
      code: fallbackHsn.code,
      description: fallbackHsn.description || '',
      type: fallbackHsn.type || 'GOODS',
    }, ...list];
  }, [hsnSacList, fallbackHsn]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return combinedList;
    return combinedList.filter(h => {
      const code = (h.code || h.hsnCode || h.sacCode || '').toLowerCase();
      const desc = (h.description || h.name || '').toLowerCase();
      return code.includes(term) || desc.includes(term);
    });
  }, [combinedList, search]);

  const selected = useMemo(() => {
    if (!value) return null;
    const found = combinedList.find(h => h.id === value || h.code === value || h.hsnCode === value);
    if (found) return found;
    if (fallbackHsn && (fallbackHsn.id === value || fallbackHsn.code === value)) {
      return fallbackHsn;
    }
    return { code: value, description: '' };
  }, [combinedList, value, fallbackHsn]);

  useLayoutEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 280;
      const dropdownHeight = 230;

      // Align right edge of dropdown with right edge of button
      let left = rect.right - dropdownWidth;
      if (left < 16) left = 16;
      if (left + dropdownWidth > window.innerWidth - 16) {
        left = window.innerWidth - dropdownWidth - 16;
      }

      // Check space above vs below
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUpwards = spaceBelow < dropdownHeight || (spaceAbove > spaceBelow && spaceBelow < 280);

      const top = openUpwards
        ? Math.max(16, rect.top - dropdownHeight - 6)
        : rect.bottom + 6;

      setCoords({ top, left, width: dropdownWidth, openUpwards });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleDown = (e) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target) &&
        !e.target.closest('[data-hsn-dropdown]')
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        title={selected ? (selected.description ? `${selected.code || selected.hsnCode} - ${selected.description}` : (selected.code || selected.hsnCode || selected.sacCode)) : 'Select HSN/SAC'}
        onClick={() => {
          setIsOpen(prev => !prev);
          setSearch('');
        }}
        className={`w-full h-8 px-1.5 bg-white border rounded-md text-[11px] text-left flex items-center justify-between transition-all cursor-pointer ${
          isOpen ? 'border-zinc-900 ring-1 ring-zinc-900/10' : 'border-zinc-200 hover:border-zinc-300'
        }`}
      >
        <span className={`truncate flex-1 font-mono ${selected ? 'font-semibold text-zinc-900' : 'text-zinc-400 font-sans text-[10.5px]'}`}>
          {selected
            ? (selected.description ? `${selected.code || selected.hsnCode} - ${selected.description}` : (selected.code || selected.hsnCode || selected.sacCode))
            : 'Select...'}
        </span>
        <ChevronDown
          size={11}
          className={`text-zinc-400 shrink-0 ml-0.5 transition-transform ${isOpen ? 'rotate-180 text-zinc-700' : ''}`}
        />
      </button>

      {isOpen && createPortal(
        <div
          data-hsn-dropdown="true"
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            zIndex: 99999
          }}
          className="bg-white border border-zinc-200 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100 divide-y divide-zinc-100"
        >
          {/* Search box */}
          <div className="p-2 bg-zinc-50/80 border-b border-zinc-100">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search HSN/SAC code or desc..."
                className="w-full h-8 pl-8 pr-2.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-800 placeholder-zinc-400 outline-none focus:border-zinc-900"
                autoFocus
              />
            </div>
          </div>

          {/* List items */}
          <div className="max-h-52 overflow-y-auto py-1 divide-y divide-zinc-50">
            <div
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
              className="px-3 py-1.5 cursor-pointer text-[11px] text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 transition-colors italic"
            >
              None (Clear Selection)
            </div>

            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-xs text-zinc-400 text-center">
                No matching HSN/SAC codes
              </div>
            ) : (
              filtered.map(h => {
                const code = h.code || h.hsnCode || h.sacCode || '';
                const isSelected = value === h.id || value === code || (h.code && value === h.code);
                return (
                  <div
                    key={h.id || code}
                    onClick={() => {
                      onChange(h);
                      setIsOpen(false);
                    }}
                    className={`px-3 py-2 cursor-pointer hover:bg-zinc-50/90 transition-colors flex items-center justify-between gap-2 ${
                      isSelected ? 'bg-zinc-50/90 font-semibold' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-zinc-900">{code}</span>
                        {h.type && (
                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200/70">
                            {h.type}
                          </span>
                        )}
                      </div>
                      {h.description && (
                        <p className="text-[10px] text-zinc-500 truncate mt-0.5 max-w-[210px]">
                          {h.description}
                        </p>
                      )}
                    </div>
                    {isSelected && <Check size={13} strokeWidth={2.5} className="text-zinc-900 shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function CreateSupplierQuotationModal({
  isOpen,
  onClose,
  rfq,
  companyId,
  onSuccess
}) {
  const dispatch = useAppDispatch();
  const rfqId = rfq?.id;

  // 1. Fetch full RFQ details
  const { data: fullRfqResp, isLoading: isRfqLoading } = useApiQuery(
    rfqsApi.getById,
    rfqId,
    { enabled: !!isOpen && !!rfqId }
  );

  const fullRfq = useMemo(() => {
    const raw = fullRfqResp?.data?.data || fullRfqResp?.data || fullRfqResp;
    if (raw && typeof raw === 'object' && ('rfqNumber' in raw || 'items' in raw)) {
      return raw;
    }
    return rfq || {};
  }, [fullRfqResp, rfq]);

  // 2. Fetch active vendors master to cross-reference names & codes
  const { data: vendorsResp } = useApiQuery(
    vendorsApi.getActiveVendors,
    undefined,
    { enabled: !!isOpen }
  );

  const vendorList = useMemo(() => {
    const list = Array.isArray(vendorsResp)
      ? vendorsResp
      : (vendorsResp?.data || vendorsResp?.content || []);
    return Array.isArray(list) ? list : [];
  }, [vendorsResp]);

  // 3. Fetch HSN/SAC master list
  const { data: hsnSacResp } = useApiQuery(
    hsnSacMasterApi.getHsnSacList,
    { companyId, size: 1000 },
    { enabled: !!isOpen }
  );

  const hsnSacList = useMemo(() => {
    const list =
      hsnSacResp?.data?.data?.hsnSacMasters ||
      hsnSacResp?.data?.hsnSacMasters ||
      hsnSacResp?.hsnSacMasters ||
      hsnSacResp?.data?.content ||
      hsnSacResp?.content ||
      hsnSacResp?.data ||
      (Array.isArray(hsnSacResp) ? hsnSacResp : []);
    return Array.isArray(list) ? list : [];
  }, [hsnSacResp]);

  // Associated RFQ vendors
  const rfqVendors = useMemo(() => {
    const rawVendors = fullRfq?.vendors || fullRfq?.vendorIds || [];
    if (Array.isArray(rawVendors) && rawVendors.length > 0) {
      return rawVendors.map(v => {
        const vId = typeof v === 'string' ? v : (v.vendorId || v.id);
        const match = vendorList.find(x => x.id === vId);
        return {
          id: vId,
          name: match?.vendorName || match?.companyName || match?.name || v?.vendorName || v?.name || 'Vendor',
          code: match?.vendorCode || match?.code || v?.vendorCode || v?.code || '',
        };
      });
    }
    // Fallback to active vendors list if RFQ vendors array is empty
    return vendorList.map(v => ({
      id: v.id,
      name: v.vendorName || v.companyName || v.name || 'Vendor',
      code: v.vendorCode || v.code || '',
    }));
  }, [fullRfq, vendorList]);

  // Form states
  const [formData, setFormData] = useState({
    vendorId: '',
    quotationDate: getTodayLocalDate(),
    validUntil: '',
    deliveryTerms: '',
    paymentTerms: '',
    freight: 0,
    discount: 0,
    remarks: '',
  });

  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom vendor selector dropdown states
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const [vendorSearch, setVendorSearch] = useState('');
  const vendorDropdownRef = useRef(null);

  // Filtered RFQ vendors for searchable dropdown
  const filteredRfqVendors = useMemo(() => {
    const term = vendorSearch.toLowerCase().trim();
    if (!term) return rfqVendors;
    return rfqVendors.filter(v => {
      const name = (v.name || '').toLowerCase();
      const code = (v.code || '').toLowerCase();
      return name.includes(term) || code.includes(term);
    });
  }, [rfqVendors, vendorSearch]);

  // Click outside listener for vendor dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(e.target)) {
        setIsVendorDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Synchronize initial data when RFQ or modal opens
  useEffect(() => {
    if (!isOpen || !fullRfq) return;

    let isMounted = true;
    const initialVendorId = rfqVendors.length === 1 ? rfqVendors[0].id : '';

    setFormData({
      vendorId: initialVendorId,
      quotationDate: getTodayLocalDate(),
      validUntil: '',
      deliveryTerms: fullRfq.terms || '',
      paymentTerms: '',
      freight: 0,
      discount: 0,
      remarks: '',
    });
    setIsVendorDropdownOpen(false);
    setVendorSearch('');
    setErrors({});
    setApiError('');

    const rawItems = Array.isArray(fullRfq.items) ? fullRfq.items : [];

    // Map initial items, checking productCache for immediate fill if already available
    const initialQuotationItems = rawItems.map(item => {
      const itId = item.itemId || item.id || '';
      const cached = itId ? productCache.get(itId) : null;
      const { code: cachedCode, description: cachedDesc, id: cachedId, raw: cachedRaw } = extractProductHsn(cached);

      const resolvedCode = cachedCode || item.hsnSacCode || '';
      const resolvedId = isUUID(cachedId) ? cachedId : (isUUID(item.hsnSacId) ? item.hsnSacId : '');

      return {
        itemId: itId,
        itemName: item.itemName || item.productName || 'Item',
        description: item.description || '',
        itemType: item.itemType || 'PRODUCT',
        quantity: item.quantity ?? item.requestedQuantity ?? 1,
        unit: item.unit || 'PCS',
        unitPrice: '',
        discount: 0,
        cgstRate: 0,
        sgstRate: 0,
        igstRate: 0,
        cessRate: 0,
        deliveryDate: item.requiredDate
          ? String(item.requiredDate).slice(0, 10)
          : (fullRfq.expectedDeliveryDate ? String(fullRfq.expectedDeliveryDate).slice(0, 10) : ''),
        hsnSacId: resolvedId,
        hsnSacCode: resolvedCode,
        hsnSacData: cachedRaw || (resolvedCode ? { code: resolvedCode, description: cachedDesc, id: resolvedId } : null),
        hsnSacManuallyChanged: false,
      };
    });

    setItems(initialQuotationItems);

    // Fetch product details for items whose product data is not yet in cache
    const itemsToFetch = rawItems.filter(item => {
      const itId = item.itemId || item.id;
      return itId && !productCache.has(itId);
    });

    if (itemsToFetch.length > 0) {
      const uniqueItemIds = [...new Set(itemsToFetch.map(it => it.itemId || it.id))];

      Promise.all(
        uniqueItemIds.map(async (id) => {
          const prod = await getProductByIdSafely(id);
          return { id, prod };
        })
      ).then((results) => {
        if (!isMounted) return;

        const productMap = new Map();
        results.forEach(({ id, prod }) => {
          if (prod) productMap.set(id, prod);
        });

        setItems(prevItems => {
          return prevItems.map(item => {
            // Requirement 9: Do not overwrite user's manually selected HSN/SAC
            if (item.hsnSacManuallyChanged) {
              return item;
            }

            const prod = productMap.get(item.itemId);
            if (!prod) return item;

            const { code, description, id: hsnId, raw } = extractProductHsn(prod);
            if (!code && !hsnId) return item;

            const finalId = isUUID(hsnId) ? hsnId : (isUUID(item.hsnSacId) ? item.hsnSacId : '');
            return {
              ...item,
              hsnSacCode: code || item.hsnSacCode || '',
              hsnSacId: finalId,
              hsnSacData: raw || (code ? { code, description, id: finalId } : item.hsnSacData),
            };
          });
        });
      });
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, fullRfq, rfqVendors]);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleHsnSelect = (index, selectedHsn) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      if (!selectedHsn) {
        return {
          ...item,
          hsnSacId: '',
          hsnSacCode: '',
          hsnSacData: null,
          hsnSacManuallyChanged: true,
        };
      }
      const code = selectedHsn.code || selectedHsn.hsnCode || selectedHsn.sacCode || '';
      const id = isUUID(selectedHsn.id) ? selectedHsn.id : '';
      return {
        ...item,
        hsnSacId: id,
        hsnSacCode: code,
        hsnSacData: selectedHsn,
        hsnSacManuallyChanged: true,
      };
    }));
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        const updated = { ...item, [field]: value };
        if (field === 'hsnSacId' || field === 'hsnSacCode') {
          updated.hsnSacManuallyChanged = true;
          const matched = hsnSacList.find(h => h.id === value || h.code === value || h.hsnCode === value);
          if (matched) {
            updated.hsnSacId = isUUID(matched.id) ? matched.id : '';
            updated.hsnSacCode = matched.code || matched.hsnCode || '';
            updated.hsnSacData = matched;
          } else if (isUUID(value)) {
            updated.hsnSacId = value;
          } else {
            updated.hsnSacCode = typeof value === 'string' ? value : '';
          }
        }
        return updated;
      }
      return item;
    }));
    const errKey = `item_${index}_${field}`;
    if (errors[errKey]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[errKey];
        return next;
      });
    }
  };

  // Calculations
  const calculatedItems = useMemo(() => {
    return items.map(item => {
      const qty = toNum(item.quantity);
      const unitPrice = toNum(item.unitPrice);
      const discount = toNum(item.discount);
      const baseAmount = qty * unitPrice;
      const taxableAmount = Math.max(0, baseAmount - discount);

      const cgstAmount = (taxableAmount * toNum(item.cgstRate)) / 100;
      const sgstAmount = (taxableAmount * toNum(item.sgstRate)) / 100;
      const igstAmount = (taxableAmount * toNum(item.igstRate)) / 100;
      const cessAmount = (taxableAmount * toNum(item.cessRate)) / 100;
      const totalTax = cgstAmount + sgstAmount + igstAmount + cessAmount;
      const total = taxableAmount + totalTax;

      return {
        ...item,
        baseAmount,
        taxableAmount,
        cgstAmount,
        sgstAmount,
        igstAmount,
        cessAmount,
        totalTax,
        total,
      };
    });
  }, [items]);

  const summary = useMemo(() => {
    let subtotal = 0;
    let totalItemDiscount = 0;
    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalCess = 0;

    calculatedItems.forEach(item => {
      subtotal += item.baseAmount;
      totalItemDiscount += toNum(item.discount);
      totalTaxable += item.taxableAmount;
      totalCgst += item.cgstAmount;
      totalSgst += item.sgstAmount;
      totalIgst += item.igstAmount;
      totalCess += item.cessAmount;
    });

    const quotationDiscount = toNum(formData.discount);
    const freight = toNum(formData.freight);
    const overallDiscount = totalItemDiscount + quotationDiscount;
    const finalTaxable = Math.max(0, totalTaxable - quotationDiscount);
    const totalTaxes = totalCgst + totalSgst + totalIgst + totalCess;
    const grandTotal = Math.max(0, finalTaxable + totalTaxes + freight);

    return {
      subtotal,
      totalItemDiscount,
      quotationDiscount,
      overallDiscount,
      freight,
      taxableAmount: finalTaxable,
      cgst: totalCgst,
      sgst: totalSgst,
      igst: totalIgst,
      cess: totalCess,
      totalTaxes,
      grandTotal,
    };
  }, [calculatedItems, formData.discount, formData.freight]);

  const validate = () => {
    const newErrors = {};

    if (!formData.vendorId) {
      newErrors.vendorId = 'Please select a vendor';
    }

    if (!formData.quotationDate) {
      newErrors.quotationDate = 'Quotation date is required';
    }

    if (formData.quotationDate && formData.validUntil && formData.validUntil < formData.quotationDate) {
      newErrors.validUntil = 'Valid until date cannot be before quotation date';
    }

    if (toNum(formData.freight) < 0) {
      newErrors.freight = 'Freight cannot be negative';
    }

    if (toNum(formData.discount) < 0) {
      newErrors.discount = 'Discount cannot be negative';
    }

    if (!items || items.length === 0) {
      newErrors.items = 'At least one item is required';
    } else {
      items.forEach((item, idx) => {
        if (item.unitPrice === '' || item.unitPrice === null || item.unitPrice === undefined) {
          newErrors[`item_${idx}_unitPrice`] = 'Unit price is required';
        } else if (toNum(item.unitPrice) < 0) {
          newErrors[`item_${idx}_unitPrice`] = 'Cannot be negative';
        }

        if (toNum(item.discount) < 0) {
          newErrors[`item_${idx}_discount`] = 'Cannot be negative';
        }
        if (toNum(item.cgstRate) < 0 || toNum(item.sgstRate) < 0 || toNum(item.igstRate) < 0 || toNum(item.cessRate) < 0) {
          newErrors[`item_${idx}_tax`] = 'Tax rate cannot be negative';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    setApiError('');

    if (!validate()) {
      dispatch(
        addAlert({
          type: 'error',
          message: 'Please resolve the highlighted validation errors before submitting.',
        })
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const resolvedItems = await Promise.all(items.map(async (item) => {
        const resolvedHsnId = await resolveItemHsnSacId(item, hsnSacList);
        return {
          ...item,
          resolvedHsnId,
        };
      }));

      const payload = {
        data: {
          rfqId: fullRfq.id || rfq.id,
          vendorId: formData.vendorId,
          quotationDate: formData.quotationDate,
          validUntil: formData.validUntil || null,
          deliveryTerms: formData.deliveryTerms || "",
          paymentTerms: formData.paymentTerms || "",
          freight: toNum(formData.freight) || 0,
          discount: toNum(formData.discount) || 0,
          remarks: formData.remarks || "",
          items: resolvedItems.map(item => ({
            itemId: item.itemId,
            itemName: item.itemName,
            description: item.description || "",
            itemType: item.itemType || 'PRODUCT',
            quantity: toNum(item.quantity) || 1,
            unit: item.unit || "PCS",
            unitPrice: toNum(item.unitPrice) || 0,
            discount: toNum(item.discount) || 0,
            cgstRate: toNum(item.cgstRate) || 0,
            sgstRate: toNum(item.sgstRate) || 0,
            igstRate: toNum(item.igstRate) || 0,
            cessRate: toNum(item.cessRate) || 0,
            deliveryDate: item.deliveryDate || formData.quotationDate,
            ...(item.resolvedHsnId ? { hsnSacId: item.resolvedHsnId } : {}),
          })),
        },
      };

      console.log('[CreateSupplierQuotationModal] Submitting payload to backend:', JSON.stringify(payload, null, 2));

      const result = await supplierQuotationsApi.create(payload, companyId);
      const qNum = result?.quotationNumber || result?.data?.quotationNumber;

      dispatch(
        addAlert({
          type: 'success',
          message: qNum
            ? `Supplier quotation ${qNum} created successfully.`
            : 'Supplier quotation created successfully.',
        })
      );

      if (onSuccess) {
        onSuccess(result);
      }
      onClose();
    } catch (err) {
      console.error('[CreateSupplierQuotationModal] Create failed:', {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });
      const resData = err?.response?.data;
      let msg = resData?.message || resData?.error || err?.message || 'Failed to create supplier quotation.';
      if (Array.isArray(resData?.errors) && resData.errors.length > 0) {
        msg += ` (${resData.errors.join(', ')})`;
      }
      setApiError(msg);
      dispatch(addAlert({ type: 'error', message: msg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const transactionConfig = {
    ...supplierQuotationFormConfig,
    header: {
      ...supplierQuotationFormConfig.header,
      fields: supplierQuotationFormConfig.header.fields.map(field => {
        if (field.key === 'quotationDate') {
          return {
            ...field,
            render: ({ value, setValue, disabled }) => (
              <input type="date" value={value || ''} onChange={e => setValue(e.target.value)} disabled={disabled} required={field.required} className="input-field w-28 h-7 text-[8.8px]" />
            )
          };
        }
        return field;
      })
    },
    sidebar: {
      sections: [
        {
          id: 'rfqSummary',
          title: 'RFQ Summary',
          fields: [
            {
              key: 'rfqDetails',
              render: () => (
                <div className="flex flex-col gap-3">
                  {apiError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-700">
                      <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold">Unable to create quotation</p>
                        <p className="mt-0.5 text-rose-600 leading-relaxed">{apiError}</p>
                      </div>
                    </div>
                  )}
                  <div className="bg-[#fafafa] rounded-xl border border-zinc-200/80 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-xs font-bold text-zinc-800 tracking-wide">Request for Quotation</h3>
                      <span className="text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-zinc-200/60 text-zinc-600 border border-zinc-300/50">
                        READ-ONLY
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-0.5">RFQ NUMBER</span>
                        <span className="font-mono text-xs font-semibold text-zinc-900 block">{fullRfq.rfqNumber || '-'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-0.5">ISSUE DATE</span>
                        <span className="text-xs font-medium text-zinc-800 block">{fullRfq.issueDate ? new Date(fullRfq.issueDate).toLocaleDateString() : '-'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-0.5">DEADLINE</span>
                        <span className="text-xs font-medium text-zinc-800 block">{fullRfq.quotationDeadline ? new Date(fullRfq.quotationDeadline).toLocaleDateString() : '-'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-0.5">EXPECTED</span>
                        <span className="text-xs font-medium text-zinc-800 block">{fullRfq.expectedDeliveryDate ? new Date(fullRfq.expectedDeliveryDate).toLocaleDateString() : '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }
          ]
        },
        {
          ...supplierQuotationFormConfig.sidebar.sections[0],
          fields: [
            {
              key: 'vendorId',
              label: 'Vendor',
              required: true,
              render: () => (
                <div className="relative" ref={vendorDropdownRef}>
                  <label className="block text-xs font-bold text-zinc-800 tracking-wide mb-1">
                    Vendor <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsVendorDropdownOpen(prev => !prev)}
                    className={`w-full min-h-[40px] px-3 py-2 bg-white border rounded-xl flex items-center justify-between text-left transition-all cursor-pointer ${
                      errors.vendorId
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-100'
                        : isVendorDropdownOpen
                        ? 'border-zinc-900 ring-2 ring-zinc-900/10'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-lg bg-zinc-100 border border-zinc-200/60 flex items-center justify-center text-zinc-600 shrink-0">
                        <Building2 size={14} />
                      </div>
                      {(() => {
                        const selected = rfqVendors.find(v => v.id === formData.vendorId);
                        if (!selected) return <span className="text-xs text-zinc-400">Select vendor...</span>;
                        return (
                          <div className="flex items-center gap-2 min-w-0 truncate">
                            <span className="text-xs font-semibold text-zinc-900 truncate">{selected.name}</span>
                            {selected.code && <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-100 text-zinc-600 border border-zinc-200 shrink-0">{selected.code}</span>}
                          </div>
                        );
                      })()}
                    </div>
                    <ChevronDown size={15} className={`text-zinc-400 shrink-0 ml-2 transition-transform duration-200 ${isVendorDropdownOpen ? 'rotate-180 text-zinc-800' : ''}`} />
                  </button>

                  {isVendorDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 divide-y divide-zinc-100">
                      {rfqVendors.length > 4 && (
                        <div className="p-2 bg-zinc-50/70 border-b border-zinc-100">
                          <div className="relative">
                            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                              type="text"
                              value={vendorSearch}
                              onChange={(e) => setVendorSearch(e.target.value)}
                              placeholder="Filter vendors by name or code..."
                              className="w-full h-8 pl-8 pr-2.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-800 placeholder-zinc-400 outline-none focus:border-zinc-900"
                              autoFocus
                            />
                          </div>
                        </div>
                      )}
                      <div className="max-h-56 overflow-y-auto py-1 divide-y divide-zinc-50">
                        {filteredRfqVendors.length === 0 ? (
                          <div className="px-4 py-3 text-xs text-zinc-400 text-center">No matching vendors found</div>
                        ) : (
                          filteredRfqVendors.map(v => {
                            const isSelected = formData.vendorId === v.id;
                            return (
                              <div
                                key={v.id}
                                onClick={() => {
                                  handleFieldChange('vendorId', v.id);
                                  setIsVendorDropdownOpen(false);
                                }}
                                className={`px-3.5 py-2.5 cursor-pointer flex items-center justify-between hover:bg-zinc-50/90 transition-colors text-xs ${isSelected ? 'bg-zinc-50/90' : ''}`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${isSelected ? 'bg-zinc-900 border-zinc-900 text-white' : 'border-zinc-300 bg-white'}`}>
                                    {isSelected && <Check size={11} strokeWidth={3} />}
                                  </div>
                                  <div className="truncate">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-semibold text-zinc-900 truncate">{v.name}</span>
                                      {v.code && <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono bg-zinc-100 text-zinc-600 border border-zinc-200 shrink-0">{v.code}</span>}
                                    </div>
                                  </div>
                                </div>
                                {isSelected && <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider shrink-0">Selected</span>}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                  {errors.vendorId && <p className="text-[11px] text-rose-500 mt-1.5">{errors.vendorId}</p>}
                </div>
              )
            },
            ...supplierQuotationFormConfig.sidebar.sections[0].fields.slice(1)
          ]
        },
        ...supplierQuotationFormConfig.sidebar.sections.slice(1)
      ]
    },
    items: {
      ...supplierQuotationFormConfig.items,
      rowRenderer: ({ item, index, onUpdate, onRemove, canRemove, gridTemplateColumns }) => (
        <SupplierQuotationLineItemRow
          item={item}
          currency={formData.currency}
          onUpdate={(id, field, value) => handleItemChange(index, field, value)}
          onRemove={() => {
             setItems(prev => prev.filter((_, i) => i !== index));
          }}
          canRemove={canRemove}
          gridTemplateColumns={gridTemplateColumns}
        />
      ),
      allowDelete: true
    },
    onItemChange: (item, field, value) => {
      const idx = items.indexOf(item);
      if (idx !== -1) handleItemChange(idx, field, value);
    },
    onAddItem: () => {},
    onRemoveItem: (item, index) => {
      setItems(prev => prev.filter((_, i) => i !== index));
    },
    summary: {
      ...supplierQuotationFormConfig.summary,
      rows: supplierQuotationFormConfig.summary.rows.map(row => 
        row.key === 'freightCharges' || row.key === 'otherCharges' ? { ...row, type: 'currency-input' } : row
      )
    }
  };

  const transactionValues = {
    ...formData,
    subtotal: summary.taxableAmount,
    taxAmount: summary.totalTaxes,
    roundOff: 0,
    grandTotal: summary.grandTotal
  };

  if (!isOpen) return null;

  return createPortal(
    <TransactionForm
      config={transactionConfig}
      values={transactionValues}
      items={items}
      errors={errors}
      onChange={(key, value) => handleFieldChange(key, value)}
      onSubmit={() => handleSubmit({ preventDefault: () => {} })}
      onCancel={onClose}
      loading={isSubmitting || isRfqLoading}
      mode="create"
      context={{ fullRfq, rfqVendors, apiError }}
    />,
    document.body
  );
}
