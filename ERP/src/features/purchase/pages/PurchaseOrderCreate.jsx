import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useGetVendorsQuery,
} from '../../../api/purchase';
import {
  useGetProductsQuery,
  useGetWarehousesQuery,
} from '../../../api/inventory/inventory.api';
import { useGetGstStatesQuery } from '../../../api/account/accounting.api';
import { Plus, Trash2, ArrowLeft, Save, X, RefreshCw } from 'lucide-react';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import CustomSelect from '../../../components/common/CustomSelect';
import { useRoutePath } from '../../../hooks/useRoutePath';

const getTodayLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const fmt = (n) => {
  const val = Number(n) || 0;
  return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const createEmptyItem = () => ({
  id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
  itemId: '',
  itemName: '',
  description: '',
  hsnSacId: '',
  unit: 'NOS',
  itemType: 'PRODUCT',
  orderedQuantity: 1,
  unitPrice: 0,
  taxPercent: 0,
  discountPercent: 0,
  cgstRate: 0,
  sgstRate: 0,
  igstRate: 0,
  cessRate: 0,
  warehouseId: '',
  locationId: '',
  notes: ''
});

export default function PurchaseOrderCreate({ initialData }) {
  const companyId =
    useParams().companyId ||
    JSON.parse(localStorage.getItem('selected_company'))?.id ||
    JSON.parse(localStorage.getItem('auth_user'))?.companyCode;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();

  const [createPurchaseOrder, { isLoading: isCreating }] = useCreatePurchaseOrderMutation();
  const [updatePurchaseOrder, { isLoading: isUpdating }] = useUpdatePurchaseOrderMutation();

  const { data: vendorsData } = useGetVendorsQuery({ companyId, size: 500 });
  const vendors = Array.isArray(vendorsData) ? vendorsData : (vendorsData?.data?.content || vendorsData?.data?.data || vendorsData?.data || vendorsData?.content || []);

  const { data: productsData } = useGetProductsQuery({ companyId, size: 500 });
  const products = Array.isArray(productsData) ? productsData : (productsData?.data?.content || productsData?.data?.data || productsData?.data || productsData?.content || []);

  const { data: warehousesData } = useGetWarehousesQuery({ companyId, size: 500 });
  const warehouses = Array.isArray(warehousesData) ? warehousesData : (warehousesData?.data?.content || warehousesData?.data?.data || warehousesData?.data || warehousesData?.content || []);

  const { data: gstStatesData } = useGetGstStatesQuery({}, { skip: false });
  const gstStates = Array.isArray(gstStatesData) ? gstStatesData : (gstStatesData?.data?.data || gstStatesData?.data || gstStatesData?.content || []);

  const [formData, setFormData] = useState({
    vendorId: '',
    poNumber: '',
    poDate: getTodayLocalDate(),
    expectedDeliveryDate: '',
    currency: 'INR',
    exchangeRate: 1,
    placeOfSupplyStateId: '',
    placeOfSupplyStateCode: '',
    vendorAddressId: '',
    purchaseAddressLine1: '',
    purchaseAddressLine2: '',
    purchaseCity: '',
    purchaseState: '',
    purchaseCountry: '',
    purchasePostalCode: '',
    shippingAddressSnapshot: '',
    referenceNumber: '',
    paymentTerms: '',
    deliveryTerms: '',
    termsAndConditions: '',
    notes: '',
    freightCharges: 0,
    otherCharges: 0,
    items: [createEmptyItem()]
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const isDirtyRef = useRef(false);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => {
        const rawItems = initialData.items && initialData.items.length > 0
          ? initialData.items.map(item => {
              const cgst = parseFloat(item.cgstRate) || 0;
              const sgst = parseFloat(item.sgstRate) || 0;
              const igst = parseFloat(item.igstRate) || 0;
              const cess = parseFloat(item.cessRate) || 0;
              const derivedTax = item.taxPercent !== undefined && item.taxPercent !== null
                ? parseFloat(item.taxPercent) || 0
                : (cgst + sgst + igst + cess);

              return {
                id: item.id || Date.now().toString() + Math.random().toString(36).substr(2, 4),
                itemId: item.itemId || item.productId || '',
                itemName: item.itemName || item.productName || '',
                description: item.description || '',
                hsnSacId: item.hsnSacId || '',
                unit: item.unit || 'NOS',
                itemType: item.itemType || 'PRODUCT',
                orderedQuantity: item.orderedQuantity ?? item.quantity ?? 1,
                unitPrice: item.unitPrice ?? item.rate ?? 0,
                taxPercent: derivedTax,
                discountPercent: item.discountPercent ?? 0,
                cgstRate: cgst,
                sgstRate: sgst,
                igstRate: igst,
                cessRate: cess,
                warehouseId: item.warehouseId || '',
                locationId: item.locationId || '',
                notes: item.notes || ''
              };
            })
          : [createEmptyItem()];

        return {
          ...prev,
          ...initialData,
          poDate: initialData.poDate ? String(initialData.poDate).split('T')[0] : getTodayLocalDate(),
          expectedDeliveryDate: initialData.expectedDeliveryDate ? String(initialData.expectedDeliveryDate).split('T')[0] : '',
          items: rawItems
        };
      });
    }
  }, [initialData]);

  const handleChange = (field, value) => {
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

  const handleItemChange = (id, field, value) => {
    isDirtyRef.current = true;
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => (item.id === id ? { ...item, [field]: value } : item))
    }));
    const itemIndex = formData.items.findIndex(it => it.id === id);
    if (itemIndex >= 0 && errors[`item_${itemIndex}_${field}`]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[`item_${itemIndex}_${field}`];
        return next;
      });
    }
  };

  const addItem = () => {
    isDirtyRef.current = true;
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, createEmptyItem()]
    }));
  };

  const removeItem = (id) => {
    if (formData.items.length <= 1) {
      dispatch(addAlert({ type: 'error', message: 'At least one item is required' }));
      return;
    }
    isDirtyRef.current = true;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const calculateLine = (item) => {
    const qty = parseFloat(item.orderedQuantity) || 0;
    const rate = parseFloat(item.unitPrice) || 0;
    const taxPct = parseFloat(item.taxPercent) || 0;
    const lineSubtotal = qty * rate;
    const lineTax = lineSubtotal * (taxPct / 100);
    const lineTotal = lineSubtotal + lineTax;
    return { lineSubtotal, lineTax, lineTotal };
  };

  const totals = useMemo(() => {
    let subtotal = 0;
    let tax = 0;

    formData.items.forEach(item => {
      const { lineSubtotal, lineTax } = calculateLine(item);
      subtotal += lineSubtotal;
      tax += lineTax;
    });

    const freight = parseFloat(formData.freightCharges) || 0;
    const otherCharges = parseFloat(formData.otherCharges) || 0;
    const taxableAmount = subtotal;
    const grandTotal = subtotal + tax + freight + otherCharges;

    return {
      totalItems: formData.items.length,
      subtotal,
      taxableAmount,
      tax,
      freight,
      otherCharges,
      grandTotal
    };
  }, [formData.items, formData.freightCharges, formData.otherCharges]);

  const validate = () => {
    const newErrors = {};
    if (!formData.vendorId) newErrors.vendorId = 'Vendor is required';
    if (!formData.poDate) newErrors.poDate = 'PO Date is required';
    if ((parseFloat(formData.freightCharges) || 0) < 0) newErrors.freightCharges = 'Freight cannot be negative';
    if ((parseFloat(formData.otherCharges) || 0) < 0) newErrors.otherCharges = 'Other charges cannot be negative';

    if (!formData.items || formData.items.length === 0) {
      newErrors.items = 'At least one item is required';
    } else {
      formData.items.forEach((item, idx) => {
        if (!item.itemId && (!item.itemName || !item.itemName.trim())) {
          newErrors[`item_${idx}_itemId`] = 'Product / Item is required';
        }
        const qty = parseFloat(item.orderedQuantity);
        if (isNaN(qty) || qty <= 0) {
          newErrors[`item_${idx}_orderedQuantity`] = 'Quantity must be > 0';
        }
        const rate = parseFloat(item.unitPrice);
        if (isNaN(rate) || rate < 0) {
          newErrors[`item_${idx}_unitPrice`] = 'Rate must be >= 0';
        }
        const tax = parseFloat(item.taxPercent);
        if (!isNaN(tax) && tax < 0) {
          newErrors[`item_${idx}_taxPercent`] = 'Tax must be >= 0';
        }
      });
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const doCancelNavigation = () => {
    navigate(buildPath('/purchases/purchase-orders'));
  };

  const handleCancel = () => {
    if (isDirtyRef.current) {
      setShowDiscardModal(true);
    } else {
      doCancelNavigation();
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting || isCreating || isUpdating) return;

    if (!validate()) {
      dispatch(addAlert({ type: 'error', message: 'Please fix validation errors before saving.' }));
      return;
    }

    setIsSubmitting(true);
    try {
      const payloadItems = formData.items.map(i => {
        const taxPct = parseFloat(i.taxPercent) || 0;
        const orderedQty = parseFloat(i.orderedQuantity) || 0;
        const unitPrice = parseFloat(i.unitPrice) || 0;

        const itemObj = {
          itemId: i.itemId || undefined,
          itemName: i.itemName || 'Product Item',
          description: i.description || undefined,
          orderedQuantity: orderedQty,
          unitPrice: unitPrice,
          unit: i.unit || 'NOS',
          taxPercent: taxPct,
          discountPercent: parseFloat(i.discountPercent) || 0,
          cgstRate: parseFloat(i.cgstRate) || (taxPct / 2),
          sgstRate: parseFloat(i.sgstRate) || (taxPct / 2),
          igstRate: parseFloat(i.igstRate) || taxPct,
          cessRate: parseFloat(i.cessRate) || 0,
          warehouseId: i.warehouseId || undefined,
          locationId: i.locationId || undefined,
          notes: i.notes || undefined,
        };

        if (initialData?.id && i.id && typeof i.id === 'string' && i.id.length === 36) {
          itemObj.id = i.id;
        }

        return itemObj;
      });

      const payload = {
        vendorId: formData.vendorId,
        poDate: formData.poDate,
        ...(formData.poNumber ? { poNumber: formData.poNumber } : {}),
        ...(formData.expectedDeliveryDate ? { expectedDeliveryDate: formData.expectedDeliveryDate } : {}),
        currency: formData.currency || 'INR',
        exchangeRate: parseFloat(formData.exchangeRate) || 1,
        ...(formData.placeOfSupplyStateId ? { placeOfSupplyStateId: formData.placeOfSupplyStateId } : {}),
        ...(formData.placeOfSupplyStateCode ? { placeOfSupplyStateCode: formData.placeOfSupplyStateCode } : {}),
        ...(formData.shippingAddressSnapshot ? { shippingAddressSnapshot: formData.shippingAddressSnapshot } : {}),
        ...(formData.referenceNumber ? { referenceNumber: formData.referenceNumber } : {}),
        ...(formData.paymentTerms ? { paymentTerms: formData.paymentTerms } : {}),
        ...(formData.deliveryTerms ? { deliveryTerms: formData.deliveryTerms } : {}),
        ...(formData.termsAndConditions ? { termsAndConditions: formData.termsAndConditions } : {}),
        ...(formData.notes ? { notes: formData.notes } : {}),
        freightCharges: totals.freight || 0,
        otherCharges: totals.otherCharges || 0,
        companyId,
        items: payloadItems
      };

      if (initialData?.id) {
        await updatePurchaseOrder({ id: initialData.id, ...payload }).unwrap();
        dispatch(addAlert({ type: 'success', message: 'Purchase Order updated successfully' }));
      } else {
        await createPurchaseOrder(payload).unwrap();
        dispatch(addAlert({ type: 'success', message: 'Purchase Order created successfully' }));
      }
      isDirtyRef.current = false;
      doCancelNavigation();
    } catch (err) {
      dispatch(
        addAlert({
          type: 'error',
          message: err?.data?.message || err?.message || 'Failed to save Purchase Order'
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Shared style tokens (exact match with PurchaseRequisitionForm) ── */
  const sidebarCard = 'flex-none border border-zinc-200 rounded-lg p-2.5 bg-white shadow-2xs space-y-1.5';
  const cardHead = 'flex items-center justify-between pb-1 border-b border-zinc-100';
  const cardTitle = 'text-[8px] font-bold text-zinc-800 uppercase tracking-wider';
  const label = 'text-[8px] font-semibold text-zinc-700 block mb-1';
  const field = (hasErr = false) =>
    `input-field w-full h-8 text-[8.8px] text-zinc-700 bg-white border border-zinc-200 rounded-md px-2 focus:ring-1 focus:ring-zinc-900/10 focus:border-zinc-400 outline-none transition-all ${
      hasErr ? 'border-rose-300' : ''
    }`;
  const errText = 'text-[7.2px] text-rose-600 mt-0.5 font-medium';
  const btnSecondary =
    'px-4 py-2 text-xs font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 shadow-xs transition-colors flex items-center gap-2 cursor-pointer';
  const btnPrimary =
    'px-4 py-2 text-xs font-bold text-white bg-primary rounded-md hover:bg-primary/90 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 cursor-pointer';
  const colTemplate =
    'grid-cols-[36px_minmax(180px,1.6fr)_minmax(130px,1.2fr)_minmax(130px,1.2fr)_80px_95px_75px_105px_40px]';

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
              {initialData ? 'Edit Purchase Order' : 'Create Purchase Order'}
            </h2>
            <div className="text-[8px] text-zinc-500 font-medium truncate">
              {initialData
                ? 'Update purchase order details and items'
                : 'Fill in the details to generate a new purchase order'}
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
          MAIN WORKSPACE: LEFT FORM PANEL | RIGHT ORDER ITEMS WORKSPACE
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 bg-white">

        {/* ── LEFT INTERNAL FORM PANEL (~250px) ── */}
        <div className="w-full lg:w-[250px] flex-none p-2 bg-zinc-50/40 overflow-y-auto overflow-x-hidden flex flex-col gap-2">

          {/* SECTION 1: PURCHASE ORDER INFORMATION */}
          <div className={sidebarCard}>
            <div className={cardHead}>
              <h3 className={cardTitle}>PURCHASE ORDER INFORMATION</h3>
            </div>
            <div className="space-y-2">
              {/* 1. Vendor * */}
              <div>
                <label className={label}>Vendor *</label>
                <CustomSelect
                  value={formData.vendorId}
                  onChange={(e) => {
                    const vId = e.target.value;
                    handleChange('vendorId', vId);
                    const vendor = vendors.find(v => v.id === vId);
                    if (vendor && !formData.shippingAddressSnapshot) {
                      const addr = [
                        vendor.addressLine1 || vendor.address,
                        vendor.city,
                        vendor.state,
                        vendor.country,
                        vendor.postalCode || vendor.zipCode
                      ].filter(Boolean).join(', ');
                      if (addr) {
                        handleChange('shippingAddressSnapshot', addr);
                      }
                    }
                  }}
                  searchable={true}
                  className={`w-full h-8 text-[8.8px] text-zinc-700 bg-white ${
                    errors.vendorId ? 'border-rose-300' : ''
                  }`}
                >
                  <option value="">Select an option</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.vendorName || v.companyName || v.name}
                    </option>
                  ))}
                </CustomSelect>
                {errors.vendorId && <p className={errText}>{errors.vendorId}</p>}
              </div>

              {/* 2. PO Number */}
              <div>
                <label className={label}>PO Number</label>
                <input
                  type="text"
                  value={formData.poNumber}
                  onChange={(e) => handleChange('poNumber', e.target.value)}
                  placeholder="Leave empty to auto-generate"
                  className={field()}
                />
              </div>

              {/* 3. PO Date * */}
              <div>
                <label className={label}>PO Date *</label>
                <input
                  type="date"
                  value={formData.poDate}
                  onChange={(e) => handleChange('poDate', e.target.value)}
                  className={field(errors.poDate)}
                />
                {errors.poDate && <p className={errText}>{errors.poDate}</p>}
              </div>

              {/* 4. Expected Delivery */}
              <div>
                <label className={label}>Expected Delivery</label>
                <input
                  type="date"
                  value={formData.expectedDeliveryDate}
                  onChange={(e) => handleChange('expectedDeliveryDate', e.target.value)}
                  className={field()}
                />
              </div>

              {/* 5. Currency */}
              <div>
                <label className={label}>Currency</label>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  placeholder="INR"
                  className={field()}
                />
              </div>

              {/* 6. Reference No */}
              <div>
                <label className={label}>Reference No</label>
                <input
                  type="text"
                  value={formData.referenceNumber}
                  onChange={(e) => handleChange('referenceNumber', e.target.value)}
                  placeholder="Reference No"
                  className={field()}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: DELIVERY DETAILS */}
          <div className={sidebarCard}>
            <div className={cardHead}>
              <h3 className={cardTitle}>DELIVERY DETAILS</h3>
            </div>
            <div className="space-y-2">
              <div>
                <label className={label}>Shipping Address</label>
                <textarea
                  value={formData.shippingAddressSnapshot}
                  onChange={(e) => handleChange('shippingAddressSnapshot', e.target.value)}
                  placeholder="Enter shipping address..."
                  rows={2}
                  className={`${field()} resize-none py-1 h-auto min-h-[44px]`}
                />
              </div>
              <div>
                <label className={label}>Place of Supply State</label>
                {gstStates && gstStates.length > 0 ? (
                  <CustomSelect
                    value={formData.placeOfSupplyStateCode}
                    onChange={(e) => {
                      const stateVal = e.target.value;
                      handleChange('placeOfSupplyStateCode', stateVal);
                      const matchedState = gstStates.find(s => (s.stateCode || s.code) === stateVal);
                      if (matchedState?.id) {
                        handleChange('placeOfSupplyStateId', matchedState.id);
                      }
                    }}
                    searchable={true}
                    className="w-full h-8 text-[8.8px] text-zinc-700 bg-white"
                  >
                    <option value="">Select State...</option>
                    {gstStates.map(s => {
                      const code = s.stateCode || s.code || '';
                      const name = s.stateName || s.name || '';
                      return (
                        <option key={s.id || code} value={code}>
                          {name ? `${name} (${code})` : code}
                        </option>
                      );
                    })}
                  </CustomSelect>
                ) : (
                  <input
                    type="text"
                    value={formData.placeOfSupplyStateCode}
                    onChange={(e) => handleChange('placeOfSupplyStateCode', e.target.value)}
                    placeholder="e.g. 27 or Maharashtra"
                    className={field()}
                  />
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: ADDITIONAL CHARGES */}
          <div className={sidebarCard}>
            <div className={cardHead}>
              <h3 className={cardTitle}>ADDITIONAL CHARGES</h3>
            </div>
            <div className="space-y-2">
              <div>
                <label className={label}>Freight Charges ({formData.currency})</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.freightCharges}
                  onChange={(e) => handleChange('freightCharges', e.target.value)}
                  placeholder="0"
                  className={field(errors.freightCharges)}
                />
                {errors.freightCharges && <p className={errText}>{errors.freightCharges}</p>}
              </div>
              <div>
                <label className={label}>Other Charges ({formData.currency})</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.otherCharges}
                  onChange={(e) => handleChange('otherCharges', e.target.value)}
                  placeholder="0"
                  className={field(errors.otherCharges)}
                />
                {errors.otherCharges && <p className={errText}>{errors.otherCharges}</p>}
              </div>
            </div>
          </div>

          {/* SECTION 4: TERMS & NOTES */}
          <div className={sidebarCard}>
            <div className={cardHead}>
              <h3 className={cardTitle}>TERMS & NOTES</h3>
            </div>
            <div className="space-y-2">
              <div>
                <label className={label}>Payment Terms</label>
                <input
                  type="text"
                  value={formData.paymentTerms}
                  onChange={(e) => handleChange('paymentTerms', e.target.value)}
                  placeholder="e.g. Net 30"
                  className={field()}
                />
              </div>
              <div>
                <label className={label}>Delivery Terms</label>
                <input
                  type="text"
                  value={formData.deliveryTerms}
                  onChange={(e) => handleChange('deliveryTerms', e.target.value)}
                  placeholder="e.g. FOB Destination"
                  className={field()}
                />
              </div>
              <div>
                <label className={label}>Terms and Conditions</label>
                <textarea
                  value={formData.termsAndConditions}
                  onChange={(e) => handleChange('termsAndConditions', e.target.value)}
                  placeholder="Terms and conditions..."
                  rows={2}
                  className={`${field()} resize-none py-1 h-auto min-h-[44px]`}
                />
              </div>
              <div>
                <label className={label}>Internal Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Internal notes..."
                  rows={2}
                  className={`${field()} resize-none py-1 h-auto min-h-[44px]`}
                />
              </div>
            </div>
          </div>

        </div>

        {/* ── RIGHT MAIN WORKSPACE: ORDER ITEMS TABLE + ORDER SUMMARY ── */}
        <div className="w-full flex-1 flex flex-col overflow-y-auto min-h-0 bg-white">

          {errors.items && (
            <div className="p-3 bg-rose-50 border-b border-rose-200 flex items-center gap-2 text-rose-700 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              {errors.items}
            </div>
          )}

          {/* 1. Order Items Section Header */}
          <div className="px-4 py-2.5 bg-zinc-50/80 border-b border-zinc-200 flex justify-between items-center flex-none sticky top-0 z-20">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">ORDER ITEMS</h3>
              {formData.items.length > 0 && (
                <span className="text-[8.8px] font-medium text-zinc-500 bg-white px-2 py-0.5 rounded-full border border-zinc-200 shadow-2xs">
                  {formData.items.length} {formData.items.length === 1 ? 'item' : 'items'}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={addItem}
              className="text-primary hover:text-primary/80 text-xs font-bold flex items-center gap-1.5 bg-primary/10 hover:bg-primary/15 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
            >
              <Plus size={14} /> Add Item
            </button>
          </div>

          {/* 2. Order Items Table */}
          <div className="overflow-x-auto flex-1">
            <div className="min-w-[880px]">
              {/* Table Header */}
              <div className="w-full text-left bg-zinc-100 text-zinc-600 border-b border-zinc-200 flex-none pr-1">
                <div className={`grid ${colTemplate} w-full min-w-0`}>
                  <div className="p-1.5 font-semibold truncate text-[10px] text-center uppercase tracking-wider">#</div>
                  <div className="p-1.5 font-semibold truncate text-[10px] uppercase tracking-wider">PRODUCT / ITEM *</div>
                  <div className="p-1.5 font-semibold truncate text-[10px] uppercase tracking-wider">DESCRIPTION</div>
                  <div className="p-1.5 font-semibold truncate text-[10px] uppercase tracking-wider">WAREHOUSE</div>
                  <div className="p-1.5 font-semibold truncate text-[10px] text-right uppercase tracking-wider">QTY *</div>
                  <div className="p-1.5 font-semibold truncate text-[10px] text-right uppercase tracking-wider">RATE *</div>
                  <div className="p-1.5 font-semibold truncate text-[10px] text-right uppercase tracking-wider">TAX %</div>
                  <div className="p-1.5 font-semibold truncate text-[10px] text-right uppercase tracking-wider">TOTAL</div>
                  <div className="p-1.5 font-semibold truncate text-[10px] text-center uppercase tracking-wider">ACTION</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="flex flex-col divide-y divide-zinc-100">
                {formData.items.map((item, idx) => {
                  const { lineTotal } = calculateLine(item);

                  return (
                    <div
                      key={item.id || idx}
                      className={`grid ${colTemplate} w-full bg-white hover:bg-zinc-50/50 min-w-0 border-b border-zinc-100 last:border-0 box-border transition-colors`}
                    >
                      {/* # */}
                      <div className="p-1 pt-2 pb-2 min-w-0 flex items-center justify-center text-[8.8px] text-zinc-400 font-medium">
                        {idx + 1}
                      </div>

                      {/* PRODUCT / ITEM */}
                      <div className="p-1 pt-2 min-w-0">
                        <CustomSelect
                          value={item.itemId}
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            const prod = products.find(p => p.id === selectedId);
                            handleItemChange(item.id, 'itemId', selectedId);
                            if (prod) {
                              handleItemChange(item.id, 'itemName', prod.productName || prod.name || '');
                              handleItemChange(item.id, 'unitPrice', prod.purchasePrice || prod.costPrice || 0);
                              handleItemChange(item.id, 'unit', prod.uom || 'NOS');
                              const tax = prod.taxRate ?? 0;
                              handleItemChange(item.id, 'taxPercent', tax);
                              handleItemChange(item.id, 'cgstRate', tax / 2);
                              handleItemChange(item.id, 'sgstRate', tax / 2);
                              handleItemChange(item.id, 'igstRate', tax);
                            }
                          }}
                          searchable={true}
                          className={`w-full h-8 text-[8.8px] text-zinc-700 bg-white ${
                            errors[`item_${idx}_itemId`] ? 'border-rose-300' : ''
                          }`}
                        >
                          <option value="">Select Product...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.productName || p.name}
                            </option>
                          ))}
                        </CustomSelect>
                        {errors[`item_${idx}_itemId`] && (
                          <p className={errText}>{errors[`item_${idx}_itemId`]}</p>
                        )}
                      </div>

                      {/* DESCRIPTION */}
                      <div className="p-1 pt-2 min-w-0">
                        <input
                          type="text"
                          value={item.description || ''}
                          onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                          placeholder="Line description"
                          className={field()}
                        />
                      </div>

                      {/* WAREHOUSE */}
                      <div className="p-1 pt-2 min-w-0">
                        <CustomSelect
                          value={item.warehouseId || ''}
                          onChange={(e) => handleItemChange(item.id, 'warehouseId', e.target.value)}
                          searchable={true}
                          className="w-full h-8 text-[8.8px] text-zinc-700 bg-white"
                        >
                          <option value="">Warehouse</option>
                          {warehouses.map(w => (
                            <option key={w.id} value={w.id}>
                              {w.name || w.warehouseName}
                            </option>
                          ))}
                        </CustomSelect>
                      </div>

                      {/* QTY */}
                      <div className="p-1 pt-2 min-w-0">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.orderedQuantity}
                          onChange={(e) => handleItemChange(item.id, 'orderedQuantity', e.target.value)}
                          placeholder="0"
                          className={`${field(errors[`item_${idx}_orderedQuantity`])} text-right`}
                        />
                        {errors[`item_${idx}_orderedQuantity`] && (
                          <p className={errText}>{errors[`item_${idx}_orderedQuantity`]}</p>
                        )}
                      </div>

                      {/* RATE */}
                      <div className="p-1 pt-2 min-w-0">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                          placeholder="0.00"
                          className={`${field(errors[`item_${idx}_unitPrice`])} text-right`}
                        />
                        {errors[`item_${idx}_unitPrice`] && (
                          <p className={errText}>{errors[`item_${idx}_unitPrice`]}</p>
                        )}
                      </div>

                      {/* TAX % */}
                      <div className="p-1 pt-2 min-w-0">
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={item.taxPercent ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleItemChange(item.id, 'taxPercent', val);
                              const num = parseFloat(val) || 0;
                              handleItemChange(item.id, 'cgstRate', num / 2);
                              handleItemChange(item.id, 'sgstRate', num / 2);
                              handleItemChange(item.id, 'igstRate', num);
                            }}
                            placeholder="0"
                            className={`${field(errors[`item_${idx}_taxPercent`])} text-right pr-4`}
                          />
                          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-zinc-400 pointer-events-none">
                            %
                          </span>
                        </div>
                        {errors[`item_${idx}_taxPercent`] && (
                          <p className={errText}>{errors[`item_${idx}_taxPercent`]}</p>
                        )}
                      </div>

                      {/* TOTAL (calculated) */}
                      <div className="p-1 pt-2 min-w-0 flex items-center justify-end pr-2">
                        <span className="text-[9.6px] font-semibold text-zinc-800 font-mono">
                          {fmt(lineTotal)}
                        </span>
                      </div>

                      {/* ACTION */}
                      <div className="p-1 pt-2 pb-2 min-w-0 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={formData.items.length <= 1}
                          title="Remove item"
                          className={`p-1.5 rounded-md transition-colors ${
                            formData.items.length <= 1
                              ? 'text-zinc-300 cursor-not-allowed'
                              : 'text-zinc-400 hover:text-red-500 hover:bg-red-50 cursor-pointer'
                          }`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. ORDER SUMMARY (pinned to bottom of right column) */}
          <div className="p-4 border-t border-zinc-200 bg-zinc-50/40 mt-auto flex-none">
            <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">ORDER SUMMARY</h3>
                <span className="text-[8.8px] font-medium text-zinc-500 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded-full">
                  {totals.totalItems} {totals.totalItems === 1 ? 'item' : 'items'}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div className="text-[9.6px] text-zinc-500">
                  <span className="font-semibold text-zinc-700">Commercial Summary:</span> Review subtotal, freight, other charges, and tax calculations before saving.
                </div>
                <div className="w-full sm:max-w-xs space-y-1.5">
                  <div className="flex justify-between items-center text-[9.6px]">
                    <span className="text-zinc-600 font-medium">Total Items</span>
                    <span className="font-semibold text-zinc-800">{totals.totalItems}</span>
                  </div>
                  <div className="flex justify-between items-center text-[9.6px]">
                    <span className="text-zinc-600 font-medium">Subtotal</span>
                    <span className="font-semibold text-zinc-800 font-mono">{fmt(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[9.6px]">
                    <span className="text-zinc-600 font-medium">Taxable Amount</span>
                    <span className="font-semibold text-zinc-800 font-mono">{fmt(totals.taxableAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[9.6px]">
                    <span className="text-zinc-600 font-medium">Freight</span>
                    <span className="font-semibold text-zinc-800 font-mono">{fmt(totals.freight)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[9.6px]">
                    <span className="text-zinc-600 font-medium">Other Charges</span>
                    <span className="font-semibold text-zinc-800 font-mono">{fmt(totals.otherCharges)}</span>
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
          disabled={isSubmitting || isCreating || isUpdating}
          className={btnSecondary}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || isCreating || isUpdating}
          className={btnPrimary}
        >
          {isSubmitting || isCreating || isUpdating ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save size={14} />
              <span>{initialData ? 'Update PO' : 'Save Draft'}</span>
            </>
          )}
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          DISCARD CONFIRMATION MODAL
      ═══════════════════════════════════════════════════════════════════ */}
      {showDiscardModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40">
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
                onClick={() => {
                  setShowDiscardModal(false);
                  doCancelNavigation();
                }}
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
