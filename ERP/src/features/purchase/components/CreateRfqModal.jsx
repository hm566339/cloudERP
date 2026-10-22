import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  FileSearch,
  Calendar,
  Check,
  Search,
  AlertCircle,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApi';
import { purchaseRequisitionsApi, rfqsApi, vendorsApi } from '../../../api/account';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';

const getTodayLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function CreateRfqModal({
  isOpen,
  onClose,
  purchaseRequisition,
  companyId,
  onSuccess
}) {
  const dispatch = useAppDispatch();

  const prId = purchaseRequisition?.id;

  // Fetch full details of the PR in case the table row object has partial item details
  const { data: fullPrResp, isLoading: isPrLoading } = useApiQuery(
    purchaseRequisitionsApi.getById,
    prId,
    { enabled: !!isOpen && !!prId }
  );

  const fullPr = useMemo(() => {
    const raw = fullPrResp?.data?.data || fullPrResp?.data || fullPrResp;
    if (raw && typeof raw === 'object' && ('requisitionNumber' in raw || 'items' in raw)) {
      return raw;
    }
    return purchaseRequisition || {};
  }, [fullPrResp, purchaseRequisition]);

  // Fetch active vendors
  const { data: vendorsResp, isLoading: isVendorsLoading } = useApiQuery(
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

  // Form states
  const [formData, setFormData] = useState({
    issueDate: getTodayLocalDate(),
    quotationDeadline: '',
    expectedDeliveryDate: '',
    terms: '',
    notes: '',
  });

  const [items, setItems] = useState([]);
  const [selectedVendorIds, setSelectedVendorIds] = useState([]);
  const [vendorSearch, setVendorSearch] = useState('');
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const vendorDropdownRef = useRef(null);

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize initial data when PR or modal opens
  useEffect(() => {
    if (isOpen && fullPr) {
      const prReqDate = fullPr.requiredDate ? String(fullPr.requiredDate).slice(0, 10) : '';
      setFormData({
        issueDate: getTodayLocalDate(),
        quotationDeadline: '',
        expectedDeliveryDate: prReqDate,
        terms: '',
        notes: '',
      });
      setSelectedVendorIds([]);
      setVendorSearch('');
      setIsVendorDropdownOpen(false);
      setErrors({});
      setApiError('');

      const prItems = Array.isArray(fullPr.items) ? fullPr.items : [];
      setItems(
        prItems.map(item => ({
          itemId: item.itemId || item.id || '',
          itemName: item.itemName || item.productName || 'Item',
          description: item.description || '',
          itemType: item.itemType || 'PRODUCT',
          quantity: item.quantity ?? item.requestedQuantity ?? 1,
          unit: item.unit || 'PCS',
          requiredDate: item.requiredDate
            ? String(item.requiredDate).slice(0, 10)
            : prReqDate,
          specifications: item.specifications || item.remarks || '',
        }))
      );
    }
  }, [isOpen, fullPr]);

  // Close vendor dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(event.target)) {
        setIsVendorDropdownOpen(false);
      }
    }
    if (isVendorDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVendorDropdownOpen]);

  if (!isOpen) return null;

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

  const handleSpecificationChange = (index, value) => {
    setItems(prev => prev.map((it, idx) => (idx === index ? { ...it, specifications: value } : it)));
  };

  const handleItemQuantityChange = (index, value) => {
    setItems(prev => prev.map((it, idx) => (idx === index ? { ...it, quantity: value } : it)));
    if (errors[`item_${index}_quantity`]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[`item_${index}_quantity`];
        return next;
      });
    }
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      dispatch(addAlert({ type: 'warning', message: 'At least one item is required for the RFQ.' }));
      return;
    }
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const toggleVendor = (vendorId) => {
    setSelectedVendorIds(prev => {
      const isSelected = prev.includes(vendorId);
      const next = isSelected ? prev.filter(id => id !== vendorId) : [...prev, vendorId];
      if (errors.vendors && next.length > 0) {
        setErrors(errs => {
          const newErrs = { ...errs };
          delete newErrs.vendors;
          return newErrs;
        });
      }
      return next;
    });
  };

  const removeVendor = (vendorId) => {
    setSelectedVendorIds(prev => prev.filter(id => id !== vendorId));
  };

  const filteredVendors = vendorList.filter(v => {
    const term = vendorSearch.toLowerCase().trim();
    if (!term) return true;
    const name = (v.vendorName || v.companyName || v.name || '').toLowerCase();
    const code = (v.vendorCode || '').toLowerCase();
    const email = (v.email || '').toLowerCase();
    return name.includes(term) || code.includes(term) || email.includes(term);
  });

  const validate = () => {
    const newErrors = {};

    if (!formData.quotationDeadline) {
      newErrors.quotationDeadline = 'Quotation deadline is required';
    } else if (formData.issueDate && formData.quotationDeadline < formData.issueDate) {
      newErrors.quotationDeadline = 'Quotation deadline cannot be before issue date';
    }

    if (
      formData.expectedDeliveryDate &&
      formData.issueDate &&
      formData.expectedDeliveryDate < formData.issueDate
    ) {
      newErrors.expectedDeliveryDate = 'Expected delivery date cannot be before issue date';
    }

    if (!items || items.length === 0) {
      newErrors.items = 'At least one item is required';
    } else {
      items.forEach((item, idx) => {
        if (!item.itemName || !item.itemName.trim()) {
          newErrors[`item_${idx}_itemName`] = 'Item name is required';
        }
        if (
          item.quantity === '' ||
          item.quantity === null ||
          item.quantity === undefined ||
          Number(item.quantity) <= 0 ||
          isNaN(Number(item.quantity))
        ) {
          newErrors[`item_${idx}_quantity`] = 'Quantity must be > 0';
        }
      });
    }

    if (!selectedVendorIds || selectedVendorIds.length === 0) {
      newErrors.vendors = 'Please select at least one vendor for this RFQ';
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
      const payload = {
        data: {
          purchaseRequisitionId: fullPr.id || purchaseRequisition.id,
          issueDate: formData.issueDate || getTodayLocalDate(),
          quotationDeadline: formData.quotationDeadline,
          expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
          terms: formData.terms?.trim() || undefined,
          notes: formData.notes?.trim() || undefined,
          items: items.map(item => ({
            itemId: item.itemId || undefined,
            itemName: item.itemName,
            description: item.description || undefined,
            itemType: item.itemType || 'PRODUCT',
            quantity: Number(item.quantity),
            unit: item.unit || undefined,
            requiredDate: item.requiredDate || undefined,
            specifications: item.specifications?.trim() || undefined,
          })),
          vendorIds: selectedVendorIds,
        },
      };

      const result = await rfqsApi.create(payload, companyId);

      dispatch(
        addAlert({
          type: 'success',
          message: 'RFQ created successfully.',
        })
      );

      if (onSuccess) {
        onSuccess(result);
      }
      onClose();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to create RFQ';
      setApiError(msg);
      dispatch(addAlert({ type: 'error', message: msg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 bg-zinc-950/40 backdrop-blur-xs overflow-hidden animate-in fade-in duration-150">
      <div className="bg-white dark:bg-card-dark rounded-2xl shadow-2xl w-full max-w-[960px] max-h-[90vh] flex flex-col border border-zinc-200/90 dark:border-border-dark overflow-hidden">
        
        {/* ── 1. HEADER ── */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-zinc-200/80 dark:border-border-dark bg-white dark:bg-card-dark shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-zinc-100 border border-zinc-200/70 flex items-center justify-center text-zinc-700 shadow-2xs">
              <FileSearch size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-[19px] font-bold text-zinc-900 tracking-tight leading-none">Create RFQ</h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 tracking-wide">
                  APPROVED PR
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Generate a Request for Quotation based on requisition{' '}
                <span className="font-mono font-semibold text-zinc-800">
                  {fullPr.requisitionNumber || 'PR'}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── 2. SCROLLABLE FORM CONTENT ── */}
        <div className="p-6 overflow-y-auto space-y-5 bg-white dark:bg-card-dark flex-1">
          {/* API Error Banner */}
          {apiError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-700">
              <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Unable to create RFQ</p>
                <p className="mt-0.5 text-rose-600 leading-relaxed">{apiError}</p>
              </div>
            </div>
          )}

          {isPrLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-zinc-400 gap-2.5">
              <RefreshCw size={22} className="animate-spin text-zinc-500" />
              <p className="text-xs font-medium">Loading requisition details...</p>
            </div>
          ) : (
            <>
              {/* ── 3. PURCHASE REQUISITION SUMMARY CARD ── */}
              <div className="bg-[#fafafa] rounded-xl border border-zinc-200/80 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-xs font-bold text-zinc-800 tracking-wide">Purchase Requisition</h3>
                  <span className="text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-zinc-200/60 text-zinc-600 border border-zinc-300/50">
                    READ-ONLY
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-0.5">
                      PR NUMBER
                    </span>
                    <span className="font-mono text-xs font-semibold text-zinc-900 block">
                      {fullPr.requisitionNumber || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-0.5">
                      REQUESTER
                    </span>
                    <span className="text-xs font-medium text-zinc-800 block">
                      {fullPr.requesterName || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-0.5">
                      DEPARTMENT
                    </span>
                    <span className="text-xs font-medium text-zinc-800 block">
                      {fullPr.departmentName || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-0.5">
                      REQUIRED DATE
                    </span>
                    <span className="text-xs font-medium text-zinc-800 block">
                      {fullPr.requiredDate ? new Date(fullPr.requiredDate).toLocaleDateString() : '-'}
                    </span>
                  </div>
                </div>
                <div className="border-t border-zinc-200/60 mt-3 pt-2.5 flex items-start gap-2">
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider shrink-0 mt-0.5">
                    PURPOSE:
                  </span>
                  <span className="text-xs text-zinc-700 font-normal">
                    {fullPr.purpose || '-'}
                  </span>
                </div>
              </div>

              {/* ── 4. RFQ TIMELINE ── */}
              <div>
                <h3 className="text-xs font-bold text-zinc-800 tracking-wide mb-2.5">RFQ Timeline</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Issue Date */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                      Issue Date <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.issueDate}
                        onChange={(e) => handleFieldChange('issueDate', e.target.value)}
                        className={`w-full h-9 px-3 bg-white dark:bg-surface-dark border dark:border-border-dark rounded-lg text-xs text-zinc-800 dark:text-zinc-200 outline-none transition-all ${
                          errors.issueDate
                            ? 'border-rose-400 focus:ring-1 focus:ring-rose-200'
                            : 'border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10'
                        }`}
                      />
                    </div>
                    {errors.issueDate && (
                      <p className="text-[11px] text-rose-500 mt-1">{errors.issueDate}</p>
                    )}
                  </div>

                  {/* Quotation Deadline */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                      Quotation Deadline <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.quotationDeadline}
                        min={formData.issueDate}
                        onChange={(e) => handleFieldChange('quotationDeadline', e.target.value)}
                        className={`w-full h-9 px-3 bg-white dark:bg-surface-dark border dark:border-border-dark rounded-lg text-xs text-zinc-800 dark:text-zinc-200 outline-none transition-all ${
                          errors.quotationDeadline
                            ? 'border-rose-400 focus:ring-1 focus:ring-rose-200'
                            : 'border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10'
                        }`}
                      />
                    </div>
                    {errors.quotationDeadline ? (
                      <p className="text-[11px] text-rose-500 mt-1">{errors.quotationDeadline}</p>
                    ) : (
                      <p className="text-[11px] text-zinc-400 mt-1">Must not be before issue date</p>
                    )}
                  </div>

                  {/* Expected Delivery Date */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                      Expected Delivery Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.expectedDeliveryDate}
                        min={formData.issueDate}
                        onChange={(e) => handleFieldChange('expectedDeliveryDate', e.target.value)}
                        className={`w-full h-9 px-3 bg-white dark:bg-surface-dark border dark:border-border-dark rounded-lg text-xs text-zinc-800 dark:text-zinc-200 outline-none transition-all ${
                          errors.expectedDeliveryDate
                            ? 'border-rose-400 focus:ring-1 focus:ring-rose-200'
                            : 'border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10'
                        }`}
                      />
                    </div>
                    {errors.expectedDeliveryDate ? (
                      <p className="text-[11px] text-rose-500 mt-1">{errors.expectedDeliveryDate}</p>
                    ) : (
                      <p className="text-[11px] text-zinc-400 mt-1">Pre-filled from PR required date</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── 5. TARGET VENDORS ── */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-zinc-800 tracking-wide">
                    Target Vendors <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-medium text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200/80">
                    {selectedVendorIds.length} Selected
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 mb-2.5">
                  Select one or more vendors to receive this RFQ.
                </p>

                {/* Selected vendor tags/chips */}
                {selectedVendorIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {selectedVendorIds.map(vId => {
                      const vendor = vendorList.find(v => v.id === vId);
                      const displayName = vendor?.vendorName || vendor?.companyName || vendor?.name || vId;
                      return (
                        <span
                          key={vId}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 text-zinc-800 border border-zinc-200/80 group"
                        >
                          <span className="max-w-[220px] truncate">{displayName}</span>
                          <button
                            type="button"
                            onClick={() => removeVendor(vId)}
                            className="p-0.5 text-zinc-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Vendor picker dropdown */}
                <div className="relative" ref={vendorDropdownRef}>
                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      value={vendorSearch}
                      onChange={(e) => {
                        setVendorSearch(e.target.value);
                        setIsVendorDropdownOpen(true);
                      }}
                      onFocus={() => setIsVendorDropdownOpen(true)}
                      placeholder="Search vendors by name or code..."
                      className={`w-full h-9 pl-9 pr-8 bg-white dark:bg-surface-dark border dark:border-border-dark rounded-lg text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 outline-none transition-all ${
                        errors.vendors
                          ? 'border-rose-400 focus:ring-1 focus:ring-rose-200'
                          : 'border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10'
                      }`}
                    />
                    {vendorSearch && (
                      <button
                        type="button"
                        onClick={() => setVendorSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {errors.vendors && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors.vendors}</p>
                  )}

                  {isVendorDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-xl max-h-52 overflow-y-auto py-1 divide-y divide-zinc-50 animate-in fade-in zoom-in-95 duration-100">
                      {isVendorsLoading ? (
                        <div className="px-4 py-3 text-xs text-zinc-400 text-center flex items-center justify-center gap-2">
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Loading vendors...</span>
                        </div>
                      ) : filteredVendors.length === 0 ? (
                        <div className="px-4 py-3 text-xs text-zinc-400 text-center">
                          No vendors found.
                        </div>
                      ) : (
                        filteredVendors.map(vendor => {
                          const isSelected = selectedVendorIds.includes(vendor.id);
                          const name = vendor.vendorName || vendor.companyName || vendor.name || 'Vendor';
                          return (
                            <div
                              key={vendor.id}
                              onClick={() => toggleVendor(vendor.id)}
                              className={`px-3 py-2 cursor-pointer flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors text-xs ${
                                isSelected ? 'bg-zinc-50' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                    isSelected
                                      ? 'bg-zinc-900 border-zinc-900 text-white'
                                      : 'border-zinc-300 dark:border-border-dark bg-white dark:bg-surface-dark text-zinc-800 dark:text-zinc-200'
                                  }`}
                                >
                                  {isSelected && <Check size={11} strokeWidth={3} />}
                                </div>
                                <div className="truncate">
                                  <span className="font-medium text-zinc-800 block truncate">{name}</span>
                                  <span className="text-[10px] text-zinc-400 font-mono">
                                    {vendor.vendorCode || vendor.email || ''}
                                  </span>
                                </div>
                              </div>
                              {isSelected && (
                                <span className="text-[10px] font-semibold text-zinc-600 shrink-0">
                                  Selected
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ── 6. REQUISITION ITEMS ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-zinc-800 tracking-wide">Requisition Items</h3>
                    <span className="text-[11px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200/80">
                      {items.length}
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    Pre-populated from PR • specifications are editable
                  </span>
                </div>

                {errors.items && (
                  <div className="p-3 bg-rose-50 text-rose-600 text-xs border border-rose-100 rounded-lg mb-2">
                    {errors.items}
                  </div>
                )}

                <div className="overflow-x-auto rounded-xl border border-zinc-200/80 dark:border-border-dark bg-white dark:bg-card-dark">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#fafafa] border-b border-zinc-200/80 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3 min-w-[180px]">ITEM</th>
                        <th className="py-2.5 px-3 w-24">TYPE</th>
                        <th className="py-2.5 px-3 w-20 text-right">QTY</th>
                        <th className="py-2.5 px-3 w-20">UNIT</th>
                        <th className="py-2.5 px-3 w-28">REQUIRED DATE</th>
                        <th className="py-2.5 px-3 min-w-[200px]">SPECIFICATIONS</th>
                        <th className="py-2.5 px-3 w-12 text-center">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/70 transition-colors">
                          <td className="py-3 px-3 text-center text-zinc-400 font-mono text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-zinc-900">{item.itemName}</div>
                            {item.description && (
                              <div className="text-[11px] text-zinc-500 truncate max-w-[240px] mt-0.5">
                                {item.description}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200/60">
                              {item.itemType || 'PRODUCT'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemQuantityChange(idx, e.target.value)}
                              className={`w-16 h-8 px-2 text-right font-mono bg-white dark:bg-surface-dark border dark:border-border-dark text-zinc-900 dark:text-zinc-100 rounded-lg text-xs outline-none transition-all ${
                                errors[`item_${idx}_quantity`]
                                  ? 'border-rose-400 text-rose-600'
                                  : 'border-zinc-200 text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10'
                              }`}
                            />
                            {errors[`item_${idx}_quantity`] && (
                              <div className="text-[9px] text-rose-500 mt-0.5 whitespace-nowrap">
                                &gt; 0 req.
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-zinc-600 font-mono text-[11px]">
                            {item.unit || 'PCS'}
                          </td>
                          <td className="py-3 px-3 text-zinc-600 font-mono text-[11px]">
                            {item.requiredDate ? new Date(item.requiredDate).toLocaleDateString() : '-'}
                          </td>
                          <td className="py-3 px-3">
                            <input
                              type="text"
                              value={item.specifications || ''}
                              onChange={(e) => handleSpecificationChange(idx, e.target.value)}
                              placeholder="Enter specifications or remarks..."
                              className="w-full h-8 px-2.5 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs text-zinc-800 placeholder-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 outline-none transition-all"
                            />
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1.5 text-zinc-300 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── 7. TERMS & INTERNAL NOTES ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">
                      Terms & Conditions
                    </label>
                    <span className="text-[10px] text-zinc-400 font-normal">Optional</span>
                  </div>
                  <textarea
                    rows={3}
                    value={formData.terms}
                    onChange={(e) => handleFieldChange('terms', e.target.value)}
                    placeholder="Enter payment terms, delivery requirements, warranty, etc."
                    className="w-full p-2.5 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs text-zinc-800 placeholder-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 outline-none resize-none transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">
                      Internal Notes
                    </label>
                    <span className="text-[10px] text-zinc-400 font-normal">Optional</span>
                  </div>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    placeholder="Enter internal notes, reference codes or instructions..."
                    className="w-full p-2.5 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs text-zinc-800 placeholder-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 outline-none resize-none transition-all"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── 8. FOOTER ── */}
        <div className="px-6 py-5 border-t border-zinc-200/80 dark:border-border-dark bg-white dark:bg-card-dark flex items-center justify-between gap-3 shrink-0 sticky bottom-0 z-10">
          <div>
            {apiError && (
              <div className="text-xs text-rose-600 flex items-center gap-1.5 max-w-md truncate">
                <AlertCircle size={14} className="shrink-0" />
                <span className="truncate">{apiError}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 text-xs font-semibold text-zinc-700 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 active:bg-zinc-100 transition-all inline-flex items-center justify-center cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || isPrLoading}
              className="h-9 px-5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] rounded-lg shadow-xs transition-all inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Creating RFQ...</span>
                </>
              ) : (
                <>
                  <FileSearch size={14} />
                  <span>Create RFQ</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
