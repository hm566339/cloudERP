import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X, Truck, FileText, Calendar, Building2, CheckCircle,
  AlertTriangle, AlertCircle, Package, MapPin, Loader2,
  Info, ChevronDown, Check
} from 'lucide-react';
import { useCreateGoodsReceiptFromPOMutation, useGetPurchaseOrderByIdQuery } from '../../../api/purchase';
import { warehousesApi, warehouseLocationsApi } from '../../../api/inventory';
import { purchaseRequisitionsApi, rfqsApi, supplierQuotationsApi } from '../../../api/account';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { formatDate } from '../../../utils/formatters';
import CustomDatePicker, { getTodayString } from '../../../components/common/CustomDatePicker';
import CustomWarehouseSelect from './CustomWarehouseSelect';
import CustomLocationCellSelect from './CustomLocationCellSelect';
import GrnLineItemsTable from './GrnLineItemsTable';


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
      <div className="bg-white dark:bg-card-dark rounded-2xl shadow-2xl max-w-[1240px] w-full max-h-[92vh] flex flex-col overflow-hidden border border-zinc-200 dark:border-border-dark">

        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-border-dark bg-white dark:bg-card-dark">
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
          <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D]/80 p-4 shadow-2xs">
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-zinc-100 dark:border-[#2A2F3D]">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-zinc-400" />
                <span className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">Purchase Order Summary</span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184] bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                Read-Only
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">PO Number</p>
                <p className="text-xs font-bold text-zinc-900 font-mono mt-0.5">{po.poNumber || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Supplier</p>
                <p className="text-xs font-semibold text-zinc-800 mt-0.5 truncate" title={po.vendorName || po.vendor?.name}>
                  {po.vendorName || po.vendor?.name || '-'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">PO Date</p>
                <p className="text-xs font-medium text-zinc-700 mt-0.5">{formatDate(po.poDate)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Expected Delivery</p>
                <p className="text-xs font-medium text-zinc-700 mt-0.5">{formatDate(po.expectedDeliveryDate)}</p>
              </div>
            </div>
          </div>

          {/* 2. GRN DETAILS & WAREHOUSE */}
          {/* 2. RECEIPT DETAILS & DESTINATION WAREHOUSE */}
          <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D]/80 p-4 shadow-2xs space-y-3.5">
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

            <div className="flex items-center gap-2 pb-2.5 border-b border-zinc-100 dark:border-[#2A2F3D]">
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
                  className="w-full h-8 px-2.5 text-xs text-zinc-800 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 font-mono"
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
                  className="w-full h-8 px-2.5 text-xs text-zinc-800 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 font-mono"
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
                  className="w-full h-8 px-2.5 text-xs text-zinc-800 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5"
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
                  className="w-full h-8 px-2.5 text-xs text-zinc-800 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5"
                  placeholder="e.g. Blue Dart / DHL Express / Freight Carrier"
                  value={transporterName}
                  onChange={e => setTransporterName(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 3. GRN ITEMS TABLE */}
          <GrnLineItemsTable
            isLoadingPo={isLoadingPo}
            itemReceipts={itemReceipts}
            formErrors={formErrors}
            locations={locations}
            loadingLocations={loadingLocations}
            onItemChange={handleItemChange}
          />


          {/* 4. RECEIVING SUMMARY & REMARKS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D]/80 p-4 shadow-2xs space-y-2">
              <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={13} className="text-zinc-400" />
                Receiving / Inspection Notes
              </label>
              <textarea
                className="w-full h-18 p-2.5 text-xs text-zinc-800 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 resize-none placeholder-zinc-400"
                placeholder="Add general receiving remarks, package condition notes, or gate inspection comments..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D]/80 p-4 shadow-2xs flex flex-col justify-between">
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
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-border-dark bg-white dark:bg-card-dark flex items-center justify-between">
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
              className="h-9 px-4 text-xs font-semibold text-zinc-600 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors shadow-2xs cursor-pointer"
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
