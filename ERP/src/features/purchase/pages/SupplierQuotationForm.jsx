import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Save, RefreshCw, FileText, X } from 'lucide-react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { supplierQuotationsApi, rfqsApi, vendorsApi, hsnSacMasterApi } from '../../../api/account';
import { productsApi } from '../../../api/inventory/products';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { PageLoader } from '../../../components/common/SkeletonLoader';
import { useRoutePath } from '../../../hooks/useRoutePath';
import CustomSelect from '../../../components/common/CustomSelect';
import { formatCurrency } from '../../../utils/formatters';

const isUUID = (str) =>
  typeof str === 'string' &&
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

async function resolveItemHsnSacId(item) {
  if (isUUID(item.hsnSacId)) {
    return item.hsnSacId;
  }
  const code = item.hsnSacCode || (!isUUID(item.hsnSacId) ? item.hsnSacId : '');
  if (code) {
    try {
      const res = await hsnSacMasterApi.getHsnSacByCode(code);
      const data = res?.data || res;
      if (data && isUUID(data.id)) {
        return data.id;
      }
    } catch (err) {
      console.warn(`[SupplierQuotationForm] Could not resolve HSN UUID for code "${code}"`, err);
    }
  }
  return undefined;
}

const toNum = (v) => {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

const fmt = (v) => formatCurrency(toNum(v));

const calculateLine = (item) => {
  const quotedQty = toNum(item?.quotedQuantity);
  const unitPrice = toNum(item?.unitPrice);
  const taxRate = toNum(item?.tax);

  const lineSubtotal = quotedQty * unitPrice;
  const lineTax = (lineSubtotal * taxRate) / 100;
  const lineTotal = lineSubtotal + lineTax;

  return {
    quotedQty,
    unitPrice,
    taxRate,
    lineSubtotal,
    lineTax,
    lineTotal,
  };
};

const getTodayLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function SupplierQuotationForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const preSelectedRfq = searchParams.get('rfqId') || '';
  const preSelectedVendor = searchParams.get('vendorId') || '';
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const dispatch = useAppDispatch();

  const isEditing = !!id;

  const [formData, setFormData] = useState(() => ({
    rfqId: preSelectedRfq,
    vendorId: preSelectedVendor,
    quotationDate: getTodayLocalDate(),
    validUntil: '',
    freight: '',
    discount: '',
    deliveryTerms: '',
    paymentTerms: '',
    remarks: '',
  }));

  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const isDirtyRef = useRef(false);
  const loadedRfqIdRef = useRef(null);

  // Existing quotation query (for Edit mode)
  const { data: existing, isLoading: isLoadingExisting } = useApiQuery(
    supplierQuotationsApi.getById,
    id,
    { enabled: !!id }
  );

  const existingRaw = existing?.data?.data || existing?.data || existing;
  const quotation = (existingRaw && typeof existingRaw === 'object' && 'quotationNumber' in existingRaw)
    ? existingRaw
    : (existingRaw?.data || existingRaw);

  // RFQ list query (for Create mode)
  const { data: rfqsResp, isLoading: rfqsLoading } = useApiQuery(
    rfqsApi.getList,
    [{ companyId }, { page: 0, size: 100 }],
    { enabled: !isEditing }
  );

  const rfqList = useMemo(() => {
    const list = Array.isArray(rfqsResp) ? rfqsResp : (rfqsResp?.data?.content || rfqsResp?.content || []);
    const arr = Array.isArray(list) ? list : [];
    // Only RFQs that are eligible for supplier quotation (not cancelled and not closed unless preselected)
    return arr.filter(r => r.status !== 'CANCELLED' && r.status !== 'CLOSED');
  }, [rfqsResp]);

  const rfqOptions = useMemo(() => {
    const opts = rfqList.map(r => ({
      value: r.id,
      label: r.rfqNumber ? `${r.rfqNumber}${r.status ? ` (${r.status})` : ''}` : r.id,
      subLabel: r.status || undefined,
    }));
    // If an RFQ is preselected or in edit mode and not in active list, add it
    if (formData.rfqId && !opts.find(o => o.value === formData.rfqId)) {
      opts.unshift({
        value: formData.rfqId,
        label: quotation?.rfqNumber || formData.rfqId,
      });
    }
    return opts;
  }, [rfqList, formData.rfqId, quotation]);

  // Vendors master query
  const { data: vendorsResp, isLoading: vendorsLoading } = useApiQuery(
    vendorsApi.getActiveVendors,
    undefined,
    { enabled: true }
  );

  const vendorList = useMemo(() => {
    const list = Array.isArray(vendorsResp) ? vendorsResp : (vendorsResp?.data || vendorsResp?.content || []);
    return Array.isArray(list) ? list : [];
  }, [vendorsResp]);

  // Query details of selected RFQ
  const rfqQuery = useApiQuery(
    rfqsApi.getById,
    formData.rfqId,
    { enabled: !!formData.rfqId }
  );

  const rfqRaw = rfqQuery.data?.data?.data || rfqQuery.data?.data || rfqQuery.data;
  const rfq = (rfqRaw && typeof rfqRaw === 'object' && ('rfqNumber' in rfqRaw || 'items' in rfqRaw))
    ? rfqRaw
    : (rfqRaw?.data || rfqRaw);

  const rfqLoading = rfqQuery.isLoading && !!formData.rfqId;

  // Suppliers associated with selected RFQ
  const rfqVendors = useMemo(() => {
    if (!rfq || !Array.isArray(rfq.vendors)) return [];
    return rfq.vendors;
  }, [rfq]);

  const supplierOptions = useMemo(() => {
    if (!formData.rfqId) return [];
    if (rfqVendors.length > 0) {
      return rfqVendors.map(v => {
        const vid = v.vendorId || v.id;
        const matched = vendorList.find(x => x.id === vid);
        return {
          value: vid,
          label: matched?.vendorName || matched?.name || v.vendorName || v.name || 'Unnamed Supplier',
          subLabel: matched?.vendorCode || matched?.code || v.vendorCode || v.code || undefined,
        };
      });
    }
    // If RFQ has no explicit vendor associations recorded, fall back to active vendor list
    return vendorList.map(v => ({
      value: v.id,
      label: v.vendorName || v.name || 'Unnamed Supplier',
      subLabel: v.vendorCode || v.code || undefined,
    }));
  }, [formData.rfqId, rfqVendors, vendorList]);

  // Populate data when editing
  useEffect(() => {
    if (isEditing && quotation) {
      setFormData(prev => ({
        ...prev,
        rfqId: quotation.rfqId || prev.rfqId,
        vendorId: quotation.vendorId || prev.vendorId,
        quotationDate: quotation.quotationDate ? String(quotation.quotationDate).slice(0, 10) : prev.quotationDate,
        validUntil: quotation.validUntil ? String(quotation.validUntil).slice(0, 10) : '',
        freight: quotation.freight !== undefined && quotation.freight !== null ? String(quotation.freight) : '',
        discount: quotation.discount !== undefined && quotation.discount !== null ? String(quotation.discount) : '',
        deliveryTerms: quotation.deliveryTerms || '',
        paymentTerms: quotation.paymentTerms || '',
        remarks: quotation.remarks || '',
      }));

      if (quotation.items && Array.isArray(quotation.items)) {
        setItems(quotation.items.map(it => {
          const quotedQty = it.quotedQuantity ?? it.quantity ?? '';
          const reqQty = it.requestedQuantity ?? it.quantity ?? '';
          return {
            itemId: it.itemId || it.id || '',
            itemName: it.itemName || '',
            description: it.description || '',
            itemType: it.itemType || 'PRODUCT',
            requestedQuantity: reqQty,
            unit: it.unit || '',
            quotedQuantity: quotedQty,
            unitPrice: it.unitPrice !== undefined && it.unitPrice !== null ? String(it.unitPrice) : '',
            tax: it.tax !== undefined && it.tax !== null ? String(it.tax) : (it.taxAmount !== undefined && it.taxAmount !== null ? String(it.taxAmount) : ''),
            remarks: it.remarks || it.specifications || '',
            discount: it.discount ?? '',
            cgstRate: it.cgstRate ?? '',
            sgstRate: it.sgstRate ?? '',
            igstRate: it.igstRate ?? '',
            cessRate: it.cessRate ?? '',
            deliveryDate: it.deliveryDate ? String(it.deliveryDate).slice(0, 10) : '',
            hsnSacId: it.hsnSacId || it.hsnSacCode || '',
          };
        }));
      }
    }
  }, [isEditing, quotation]);

  // When RFQ is selected in create mode, automatically populate requested items
  useEffect(() => {
    if (isEditing) return;
    if (!formData.rfqId) {
      loadedRfqIdRef.current = null;
      setItems([]);
      return;
    }
    if (!rfq || !rfq.items || !Array.isArray(rfq.items) || rfq.items.length === 0) {
      return;
    }
    if (loadedRfqIdRef.current === formData.rfqId) {
      return;
    }
    loadedRfqIdRef.current = formData.rfqId;

    let isMounted = true;
    const rawItems = rfq.items;

    const initialItems = rawItems.map(it => {
      const reqQty = it.quantity ?? it.requestedQuantity ?? '';
      return {
        itemId: it.itemId || it.id || '',
        itemName: it.itemName || '',
        description: it.description || '',
        itemType: it.itemType || 'PRODUCT',
        requestedQuantity: reqQty,
        unit: it.unit || '',
        quotedQuantity: reqQty, // Default quoted quantity to requested quantity
        unitPrice: '',
        tax: '',
        remarks: it.specifications || it.remarks || '',
        deliveryDate: it.requiredDate ? String(it.requiredDate).slice(0, 10) : '',
        hsnSacId: it.hsnSacId || it.hsnSacCode || '',
        hsnSacCode: it.hsnSacCode || '',
      };
    });

    setItems(initialItems);

    const uniqueItemIds = [...new Set(rawItems.map(it => it.itemId || it.id).filter(Boolean))];
    if (uniqueItemIds.length > 0) {
      Promise.all(
        uniqueItemIds.map(async (id) => {
          try {
            const resp = await productsApi.getById(id);
            const data = resp?.data || resp;
            return { id, data };
          } catch (e) {
            return { id, data: null };
          }
        })
      ).then((results) => {
        if (!isMounted) return;
        const productMap = new Map();
        results.forEach(({ id, data }) => {
          if (data) productMap.set(id, data);
        });

        setItems(prevItems => {
          return prevItems.map(item => {
            const prod = productMap.get(item.itemId);
            if (!prod) return item;
            const hsnCode = prod?.hsnSac?.code || prod?.hsnSacCode || '';
            const rawId = prod?.hsnSac?.id || prod?.hsnSacId;
            const hsnId = isUUID(rawId) ? rawId : '';
            if (!hsnCode && !hsnId) return item;
            return {
              ...item,
              hsnSacId: hsnId || (isUUID(item.hsnSacId) ? item.hsnSacId : ''),
              hsnSacCode: hsnCode || item.hsnSacCode,
            };
          });
        });
      });
    }

    return () => {
      isMounted = false;
    };
  }, [rfq, isEditing, formData.rfqId]);

  const createMutation = useApiMutation(supplierQuotationsApi.create);
  const updateMutation = useApiMutation(supplierQuotationsApi.update);

  const handleFieldChange = (field, value) => {
    isDirtyRef.current = true;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSelectRfq = (value) => {
    isDirtyRef.current = true;
    loadedRfqIdRef.current = null;
    setFormData(prev => ({ ...prev, rfqId: value, vendorId: '' }));
    setItems([]);
    if (errors.rfqId) {
      setErrors(prev => {
        const next = { ...prev };
        delete next.rfqId;
        return next;
      });
    }
  };

  const updateItem = (idx, field, value) => {
    isDirtyRef.current = true;
    setItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
    const errKey = `item_${idx}_${field}`;
    if (errors[errKey]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[errKey];
        return next;
      });
    }
  };

  const handleCancel = () => {
    if (isDirtyRef.current) {
      setShowDiscardModal(true);
    } else {
      navigate(buildPath('/accounts/transactions/supplier-quotations'));
    }
  };

  // Calculations
  const totals = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;

    items.forEach(item => {
      const { lineSubtotal, lineTax } = calculateLine(item);
      subtotal += lineSubtotal;
      totalTax += lineTax;
    });

    const freight = toNum(formData.freight);
    const discount = toNum(formData.discount);
    const grandTotal = subtotal + freight - discount + totalTax;

    return {
      subtotal,
      freight,
      discount,
      tax: totalTax,
      grandTotal: grandTotal >= 0 ? grandTotal : 0,
    };
  }, [items, formData.freight, formData.discount]);

  const validate = () => {
    const newErrors = {};
    if (!formData.rfqId) newErrors.rfqId = 'RFQ is required';
    if (!formData.vendorId) newErrors.vendorId = 'Supplier is required';
    if (!formData.quotationDate) newErrors.quotationDate = 'Quotation date is required';
    if (!formData.validUntil) newErrors.validUntil = 'Valid until date is required';
    if (formData.quotationDate && formData.validUntil && formData.validUntil < formData.quotationDate) {
      newErrors.validUntil = 'Valid until date cannot be earlier than quotation date';
    }
    if (formData.freight !== '' && formData.freight !== null && formData.freight !== undefined && toNum(formData.freight) < 0) {
      newErrors.freight = 'Freight cannot be negative';
    }
    if (formData.discount !== '' && formData.discount !== null && formData.discount !== undefined && toNum(formData.discount) < 0) {
      newErrors.discount = 'Discount cannot be negative';
    }

    if (items.length === 0) {
      newErrors.items = 'At least one quote item is required. Select an RFQ to load items.';
    } else {
      items.forEach((item, idx) => {
        const quotedQty = toNum(item.quotedQuantity);
        if (item.quotedQuantity === '' || item.quotedQuantity === null || item.quotedQuantity === undefined) {
          newErrors[`item_${idx}_quotedQuantity`] = 'Quoted quantity is required';
        } else if (quotedQty <= 0) {
          newErrors[`item_${idx}_quotedQuantity`] = 'Quoted quantity must be greater than 0';
        }

        const unitPrice = toNum(item.unitPrice);
        if (item.unitPrice === '' || item.unitPrice === null || item.unitPrice === undefined) {
          newErrors[`item_${idx}_unitPrice`] = 'Unit price is required';
        } else if (unitPrice < 0) {
          newErrors[`item_${idx}_unitPrice`] = 'Unit price cannot be negative';
        }

        if (item.tax !== '' && item.tax !== null && item.tax !== undefined && toNum(item.tax) < 0) {
          newErrors[`item_${idx}_tax`] = 'Tax cannot be negative';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = (resolvedItemsList = items) => {
    const processedItems = resolvedItemsList
      .filter(item => item.itemName && item.itemName.trim())
      .map(item => {
        const { quotedQty, unitPrice } = calculateLine(item);

        return {
          itemId: item.itemId,
          itemName: item.itemName,
          description: item.description || "",
          itemType: item.itemType || 'PRODUCT',
          quantity: quotedQty || 1,
          unit: item.unit || "PCS",
          unitPrice: unitPrice || 0,
          discount: item.discount !== '' && item.discount !== null && item.discount !== undefined ? Number(item.discount) : 0,
          cgstRate: item.cgstRate !== '' && item.cgstRate !== null && item.cgstRate !== undefined ? Number(item.cgstRate) : 0,
          sgstRate: item.sgstRate !== '' && item.sgstRate !== null && item.sgstRate !== undefined ? Number(item.sgstRate) : 0,
          igstRate: item.igstRate !== '' && item.igstRate !== null && item.igstRate !== undefined ? Number(item.igstRate) : 0,
          cessRate: item.cessRate !== '' && item.cessRate !== null && item.cessRate !== undefined ? Number(item.cessRate) : 0,
          deliveryDate: item.deliveryDate || formData.quotationDate,
          ...(item.resolvedHsnId ? { hsnSacId: item.resolvedHsnId } : (isUUID(item.hsnSacId) ? { hsnSacId: item.hsnSacId } : {})),
        };
      });

    return {
      data: {
        rfqId: formData.rfqId,
        vendorId: formData.vendorId,
        quotationDate: formData.quotationDate,
        validUntil: formData.validUntil || null,
        deliveryTerms: formData.deliveryTerms || "",
        paymentTerms: formData.paymentTerms || "",
        freight: formData.freight !== '' ? Number(formData.freight) : 0,
        discount: formData.discount !== '' ? Number(formData.discount) : 0,
        remarks: formData.remarks || "",
        items: processedItems,
      }
    };
  };

  const extractId = (result) =>
    result?.id || result?.data?.id || result?.quotationId || result?.data?.quotationId;

  const handleSave = async () => {
    if (isSubmitting) return;
    if (!validate()) {
      dispatch(addAlert({ type: 'error', message: 'Please fix validation errors before saving.' }));
      return;
    }
    setIsSubmitting(true);
    try {
      const resolvedItems = await Promise.all(items
        .filter(item => item.itemName && item.itemName.trim())
        .map(async (item) => {
          const resolvedHsnId = await resolveItemHsnSacId(item);
          return {
            ...item,
            resolvedHsnId,
          };
        }));
      const payload = buildPayload(resolvedItems);
      console.log('[SupplierQuotationForm] Submitting payload to backend:', JSON.stringify(payload, null, 2));
      if (isEditing) {
        await updateMutation.mutateAsync([id, payload]);
        dispatch(addAlert({ type: 'success', message: 'Supplier quotation updated successfully' }));
        if (id) {
          navigate(buildPath(`/accounts/transactions/supplier-quotations/${id}`));
        } else {
          navigate(buildPath('/accounts/transactions/supplier-quotations'));
        }
      } else {
        await createMutation.mutateAsync([payload]);
        dispatch(addAlert({ type: 'success', message: 'Supplier quotation created successfully.' }));
        isDirtyRef.current = false;
        // Stay on the New Supplier Quotation create form - do NOT redirect or close
      }
    } catch (err) {
      console.error('[SupplierQuotationForm] Save failed:', {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });
      const resData = err?.response?.data;
      let msg = err?.response?.status === 403
        ? 'You do not have permission to save supplier quotations.'
        : (resData?.message || resData?.error || err?.message || 'Failed to save supplier quotation');
      if (Array.isArray(resData?.errors) && resData.errors.length > 0) {
        msg += ` (${resData.errors.join(', ')})`;
      }
      dispatch(addAlert({ type: 'error', message: msg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing && isLoadingExisting) {
    return <PageLoader message="Loading supplier quotation..." />;
  }

  /* ── Shared style tokens (exact match with PurchaseRequisitionForm) ── */
  const sidebarCard = 'flex-none border border-zinc-200 rounded-lg p-2.5 bg-white shadow-2xs space-y-1.5';
  const cardHead = 'flex items-center justify-between pb-1 border-b border-zinc-100';
  const cardTitle = 'text-[8px] font-bold text-zinc-800 uppercase tracking-wider';
  const label = 'text-[8px] font-semibold text-zinc-700 block mb-1';
  const field = (hasErr = false) =>
    `input-field w-full h-8 text-[8.8px] text-zinc-700 bg-white ${hasErr ? 'border-rose-300' : ''}`;
  const errText = 'text-[7.2px] text-rose-600 mt-0.5 font-medium';
  const btnSecondary = 'px-4 py-2 text-xs font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 shadow-xs transition-colors flex items-center gap-2';
  const btnPrimary = 'px-4 py-2 text-xs font-bold text-white bg-primary rounded-md hover:bg-primary/90 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2';
  const colTemplate = 'grid-cols-[36px_minmax(120px,1.4fr)_minmax(110px,1.3fr)_85px_65px_95px_105px_95px_110px_minmax(110px,1.2fr)]';

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white animate-fade-in w-full h-full min-h-screen overflow-hidden">

      {/* ═══════════════════════════════════════════════════════════════════
          PAGE HEADER (exact same structure as New Purchase Requisition)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap xl:flex-nowrap items-center gap-4 p-3 border-b border-zinc-100 bg-zinc-50/50 flex-none">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={handleCancel}
            className="p-1.5 flex-none text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
            title="Back"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex flex-col min-w-0">
            <h2 className="text-base font-bold text-zinc-800 truncate">
              {isEditing ? 'Edit Supplier Quotation' : 'New Supplier Quotation'}
            </h2>
            <div className="text-[8px] text-zinc-500 font-medium truncate">
              {isEditing ? 'Update supplier quotation pricing, taxes and terms' : 'Submit a supplier quotation against an RFQ'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-none">
          <button
            type="button"
            onClick={handleCancel}
            className="p-1.5 flex-none text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN WORKSPACE: LEFT SIDEBAR | RIGHT WORKSPACE
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 bg-white">

        {/* ── LEFT COLUMN (~230px, stacked sections) ── */}
        <div className="w-full lg:w-[230px] flex-none p-2 bg-zinc-50/40 overflow-y-auto overflow-x-hidden flex flex-col gap-2">

          {/* SECTION 1: QUOTATION INFORMATION */}
          <div className={sidebarCard}>
            <div className={cardHead}>
              <h3 className={cardTitle}>QUOTATION INFORMATION</h3>
            </div>
            <div className="space-y-2">
              {/* RFQ */}
              <div>
                <label className={label}>RFQ *</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={quotation?.rfqNumber || formData.rfqId}
                    disabled
                    readOnly
                    className={`${field()} bg-zinc-50 text-zinc-500 cursor-not-allowed font-medium`}
                  />
                ) : (
                  <CustomSelect
                    value={formData.rfqId}
                    onChange={(e) => handleSelectRfq(e.target.value)}
                    options={rfqOptions}
                    placeholder="Select an RFQ to quote against"
                    emptyMessage="No eligible RFQs found"
                    isLoading={rfqsLoading}
                    searchable={true}
                    error={errors.rfqId}
                    className="w-full"
                  />
                )}
                {errors.rfqId && <p className={errText}>{errors.rfqId}</p>}
                {rfqsLoading && <p className="text-[7.2px] text-zinc-400 mt-0.5">Loading RFQs...</p>}
              </div>

              {/* Supplier */}
              <div>
                <label className={label}>Supplier *</label>
                {isEditing ? (
                  (() => {
                    const v = vendorList.find(x => x.id === formData.vendorId);
                    return (
                      <input
                        type="text"
                        value={v?.vendorName || v?.name || quotation?.vendorName || formData.vendorId || 'Supplier'}
                        disabled
                        readOnly
                        className={`${field()} bg-zinc-50 text-zinc-500 cursor-not-allowed font-medium`}
                      />
                    );
                  })()
                ) : (
                  <CustomSelect
                    value={formData.vendorId}
                    onChange={(e) => handleFieldChange('vendorId', e.target.value)}
                    options={supplierOptions}
                    placeholder={
                      !formData.rfqId
                        ? 'Select an RFQ to load suppliers'
                        : (rfqLoading ? 'Loading suppliers...' : 'Select supplier')
                    }
                    emptyMessage={
                      !formData.rfqId
                        ? 'Select an RFQ first'
                        : 'No suppliers associated with this RFQ'
                    }
                    disabled={!formData.rfqId || rfqLoading}
                    isLoading={vendorsLoading || rfqLoading}
                    searchable={true}
                    error={errors.vendorId}
                    className="w-full"
                  />
                )}
                {errors.vendorId && <p className={errText}>{errors.vendorId}</p>}
                {formData.rfqId && rfqVendors.length > 0 && (
                  <p className="text-[7.2px] text-zinc-400 mt-0.5">
                    {rfqVendors.length} {rfqVendors.length === 1 ? 'supplier' : 'suppliers'} invited
                  </p>
                )}
              </div>

              {/* Quotation Date */}
              <div>
                <label className={label}>Quotation Date *</label>
                <input
                  type="date"
                  value={formData.quotationDate}
                  onChange={(e) => handleFieldChange('quotationDate', e.target.value)}
                  className={field(errors.quotationDate)}
                />
                {errors.quotationDate && <p className={errText}>{errors.quotationDate}</p>}
              </div>

              {/* Valid Until */}
              <div>
                <label className={label}>Valid Until *</label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => handleFieldChange('validUntil', e.target.value)}
                  className={field(errors.validUntil)}
                />
                {errors.validUntil && <p className={errText}>{errors.validUntil}</p>}
              </div>

              {/* Freight */}
              <div>
                <label className={label}>Freight (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.freight}
                  onChange={(e) => handleFieldChange('freight', e.target.value)}
                  placeholder="0.00"
                  className={field(errors.freight)}
                />
                {errors.freight && <p className={errText}>{errors.freight}</p>}
              </div>

              {/* Discount */}
              <div>
                <label className={label}>Discount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.discount}
                  onChange={(e) => handleFieldChange('discount', e.target.value)}
                  placeholder="0.00"
                  className={field(errors.discount)}
                />
                {errors.discount && <p className={errText}>{errors.discount}</p>}
              </div>
            </div>
          </div>

          {/* SECTION 2: TERMS & REMARKS */}
          <div className={sidebarCard}>
            <div className={cardHead}>
              <h3 className={cardTitle}>TERMS & REMARKS</h3>
            </div>
            <div className="space-y-2">
              <div>
                <label className={label}>Delivery Terms</label>
                <textarea
                  value={formData.deliveryTerms}
                  onChange={(e) => handleFieldChange('deliveryTerms', e.target.value)}
                  placeholder="Delivery terms and schedules"
                  rows={2}
                  className={`${field()} resize-none py-1 h-auto min-h-[44px]`}
                />
              </div>
              <div>
                <label className={label}>Payment Terms</label>
                <textarea
                  value={formData.paymentTerms}
                  onChange={(e) => handleFieldChange('paymentTerms', e.target.value)}
                  placeholder="Payment terms and conditions"
                  rows={2}
                  className={`${field()} resize-none py-1 h-auto min-h-[44px]`}
                />
              </div>
              <div>
                <label className={label}>Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => handleFieldChange('remarks', e.target.value)}
                  placeholder="Additional remarks"
                  rows={2}
                  className={`${field()} resize-none py-1 h-auto min-h-[44px]`}
                />
              </div>
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN: LARGE QUOTE ITEMS WORKSPACE + SUMMARY ── */}
        <div className="w-full flex-1 flex flex-col overflow-y-auto min-h-0 bg-white">

          {errors.items && (
            <div className="p-3 bg-rose-50 border-b border-rose-200 flex items-center gap-2 text-rose-700 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              {errors.items}
            </div>
          )}

          {/* 1. Quote Items Section Header */}
          <div className="px-4 py-2.5 bg-zinc-50/80 border-b border-zinc-200 flex justify-between items-center flex-none sticky top-0 z-20">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">QUOTE ITEMS</h3>
              {items.length > 0 && (
                <span className="text-[8.8px] font-medium text-zinc-500 bg-white px-2 py-0.5 rounded-full border border-zinc-200 shadow-2xs">
                  {items.length} {items.length === 1 ? 'item' : 'items'} loaded
                </span>
              )}
            </div>
            {formData.rfqId && (
              <span className="text-[8.8px] font-medium text-zinc-400">
                Loaded from selected RFQ
              </span>
            )}
          </div>

          {/* 2. Quote Items Table */}
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500">
              <div className="w-12 h-12 bg-zinc-50 border border-zinc-200 rounded-full flex items-center justify-center mb-3 shadow-2xs">
                <FileText size={20} className="text-zinc-400" />
              </div>
              <p className="text-[13px] font-semibold text-zinc-700 mb-1">Select an RFQ to load items for quotation.</p>
              <p className="text-[11px] text-zinc-500 max-w-sm leading-relaxed">
                Choose an eligible RFQ from the left panel to automatically load the requested items.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <div className="min-w-[1020px]">
                {/* Table Header */}
                <div className="w-full text-left bg-zinc-100 text-zinc-600 border-b border-zinc-200 flex-none pr-1">
                  <div className={`grid ${colTemplate} w-full min-w-0`}>
                    <div className="p-1.5 font-semibold truncate text-[10px] text-center uppercase tracking-wider">#</div>
                    <div className="p-1.5 font-semibold truncate text-[10px] uppercase tracking-wider">ITEM</div>
                    <div className="p-1.5 font-semibold truncate text-[10px] uppercase tracking-wider">DESCRIPTION</div>
                    <div className="p-1.5 font-semibold truncate text-[10px] text-right uppercase tracking-wider">REQUESTED QTY</div>
                    <div className="p-1.5 font-semibold truncate text-[10px] text-center uppercase tracking-wider">UNIT</div>
                    <div className="p-1.5 font-semibold truncate text-[10px] text-right uppercase tracking-wider">QUOTED QTY *</div>
                    <div className="p-1.5 font-semibold truncate text-[10px] text-right uppercase tracking-wider">UNIT PRICE *</div>
                    <div className="p-1.5 font-semibold truncate text-[10px] text-right uppercase tracking-wider">TAX</div>
                    <div className="p-1.5 font-semibold truncate text-[10px] text-right uppercase tracking-wider">TOTAL</div>
                    <div className="p-1.5 font-semibold truncate text-[10px] uppercase tracking-wider">REMARKS</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="flex flex-col divide-y divide-zinc-100">
                  {items.map((item, idx) => {
                    const { lineTotal } = calculateLine(item);

                    return (
                      <div
                        key={idx}
                        className={`grid ${colTemplate} w-full bg-white hover:bg-zinc-50/50 min-w-0 border-b border-zinc-100 last:border-0 box-border transition-colors`}
                      >
                        {/* # */}
                        <div className="p-1 pt-2 pb-2 min-w-0 flex items-center justify-center text-[8.8px] text-zinc-400 font-medium">
                          {idx + 1}
                        </div>

                        {/* ITEM (Read-only from RFQ) */}
                        <div className="p-1 pt-2 min-w-0">
                          <input
                            type="text"
                            value={item.itemName}
                            readOnly
                            disabled
                            title={item.itemName}
                            className={`${field()} bg-zinc-50 text-zinc-700 font-semibold cursor-not-allowed`}
                          />
                        </div>

                        {/* DESCRIPTION (Read-only from RFQ) */}
                        <div className="p-1 pt-2 min-w-0">
                          <input
                            type="text"
                            value={item.description || ''}
                            readOnly
                            disabled
                            placeholder="-"
                            title={item.description}
                            className={`${field()} bg-zinc-50 text-zinc-500 cursor-not-allowed`}
                          />
                        </div>

                        {/* REQUESTED QTY (Read-only from RFQ) */}
                        <div className="p-1 pt-2 min-w-0">
                          <input
                            type="text"
                            value={item.requestedQuantity ?? '-'}
                            readOnly
                            disabled
                            className={`${field()} bg-zinc-50 text-zinc-700 text-right cursor-not-allowed font-medium`}
                          />
                        </div>

                        {/* UNIT (Read-only from RFQ) */}
                        <div className="p-1 pt-2 min-w-0">
                          <input
                            type="text"
                            value={item.unit || '-'}
                            readOnly
                            disabled
                            className={`${field()} bg-zinc-50 text-zinc-700 text-center cursor-not-allowed`}
                          />
                        </div>

                        {/* QUOTED QTY (Quotation input) */}
                        <div className="p-1 pt-2 min-w-0">
                          <input
                            type="number"
                            step="any"
                            min="0.0001"
                            value={item.quotedQuantity ?? ''}
                            onChange={(e) => updateItem(idx, 'quotedQuantity', e.target.value)}
                            placeholder="0"
                            className={`${field(errors[`item_${idx}_quotedQuantity`])} text-right`}
                          />
                          {errors[`item_${idx}_quotedQuantity`] && (
                            <p className={errText}>{errors[`item_${idx}_quotedQuantity`]}</p>
                          )}
                        </div>

                        {/* UNIT PRICE (Quotation input) */}
                        <div className="p-1 pt-2 min-w-0">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice ?? ''}
                            onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                            placeholder="0.00"
                            className={`${field(errors[`item_${idx}_unitPrice`])} text-right`}
                          />
                          {errors[`item_${idx}_unitPrice`] && (
                            <p className={errText}>{errors[`item_${idx}_unitPrice`]}</p>
                          )}
                        </div>

                        {/* TAX (Quotation input - percentage) */}
                        <div className="p-1 pt-2 min-w-0">
                          <div className="relative">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.tax ?? ''}
                              onChange={(e) => updateItem(idx, 'tax', e.target.value)}
                              placeholder="0"
                              className={`${field(errors[`item_${idx}_tax`])} text-right pr-4`}
                            />
                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8.8px] text-zinc-400 pointer-events-none">
                              %
                            </span>
                          </div>
                          {errors[`item_${idx}_tax`] && (
                            <p className={errText}>{errors[`item_${idx}_tax`]}</p>
                          )}
                        </div>

                        {/* TOTAL (Line Subtotal + Tax) */}
                        <div className="p-1 pt-2 min-w-0 flex items-center justify-end pr-2">
                          <span className="text-[9.6px] font-semibold text-zinc-800 font-mono">
                            {fmt(lineTotal)}
                          </span>
                        </div>

                        {/* REMARKS (Quotation input) */}
                        <div className="p-1 pt-2 min-w-0">
                          <input
                            type="text"
                            value={item.remarks || ''}
                            onChange={(e) => updateItem(idx, 'remarks', e.target.value)}
                            placeholder="Remarks"
                            className={field()}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 3. Quotation Summary (Follows New Purchase Requisition summary pattern) */}
          <div className="p-4 border-t border-zinc-200 bg-zinc-50/40 mt-auto flex-none">
            <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">QUOTATION SUMMARY</h3>
                <span className="text-[8.8px] font-medium text-zinc-500 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded-full">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div className="text-[9.6px] text-zinc-500">
                  <span className="font-semibold text-zinc-700">Commercial Summary:</span> Review subtotal, freight, discount, and tax calculations before saving.
                </div>
                <div className="w-full sm:max-w-xs space-y-1.5">
                  <div className="flex justify-between items-center text-[9.6px]">
                    <span className="text-zinc-600 font-medium">Total Items</span>
                    <span className="font-semibold text-zinc-800">{items.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-[9.6px]">
                    <span className="text-zinc-600 font-medium">Subtotal</span>
                    <span className="font-semibold text-zinc-800 font-mono">{fmt(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[9.6px]">
                    <span className="text-zinc-600 font-medium">Freight</span>
                    <span className="font-semibold text-zinc-800 font-mono">{fmt(totals.freight)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[9.6px]">
                    <span className="text-zinc-600 font-medium">Discount</span>
                    <span className="font-semibold text-rose-600 font-mono">
                      {totals.discount > 0 ? `-${fmt(totals.discount)}` : fmt(0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[9.6px]">
                    <span className="text-zinc-600 font-medium">Tax</span>
                    <span className="font-semibold text-zinc-800 font-mono">{fmt(totals.tax)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-zinc-200 pt-2 font-bold">
                    <span className="text-zinc-900">Grand Total</span>
                    <span className="text-primary font-mono text-sm">{fmt(totals.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          BOTTOM ACTION BAR (exact same action-bar style as PR)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex justify-between items-center p-3 border-t border-zinc-200 bg-zinc-100 flex-none shadow-sm z-30">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className={btnSecondary}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSubmitting}
          className={btnPrimary}
        >
          {isSubmitting ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save size={14} />
              <span>{isEditing ? 'Update Quotation' : 'Save Quotation'}</span>
            </>
          )}
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          DISCARD CONFIRMATION MODAL
      ═══════════════════════════════════════════════════════════════════ */}
      {showDiscardModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-xl p-6 animate-fade-in">
            <h2 className="text-base font-semibold text-zinc-900">Discard unsaved changes?</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Your changes will be lost if you leave without saving.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDiscardModal(false)}
                className="btn-secondary h-8 px-3 text-[11px]"
              >
                Stay
              </button>
              <button
                type="button"
                onClick={() => navigate(buildPath('/accounts/transactions/supplier-quotations'))}
                className="btn-primary h-8 px-3 text-[11px]"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}