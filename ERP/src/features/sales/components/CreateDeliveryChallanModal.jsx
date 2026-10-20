import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  X, Truck, Package, Search, ChevronRight, ArrowLeft, 
  CheckCircle, AlertCircle, Calendar, RefreshCw, Warehouse, MapPin
} from 'lucide-react';
import { 
  useGetSalesOrdersQuery, 
  useGetSalesOrderByIdQuery,
  useCreateDeliveryChallanFromSoMutation 
} from '../../../api/sales-crm/sales.api';
import { useGetGroupedStockQuery } from '../../../api/inventory/inventory.api';
import { warehousesApi, warehouseLocationsApi } from '../../../api/inventory';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { 
  isUuid, 
  validateDeliveryChallanSubmission, 
  buildDeliveryChallanPayload 
} from '../utils/deliveryChallanValidation';

function fmtDate(d, fallback = '—') {
  if (!d) return fallback;
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return fallback;
    const day = String(dt.getDate()).padStart(2, '0');
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const year = dt.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return fallback;
  }
}

const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const extractList = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.content)) return res.data.content;
  if (Array.isArray(res?.content)) return res.content;
  return [];
};

export default function CreateDeliveryChallanModal({ isOpen, onClose, companyId, onSuccess }) {
  const dispatch = useAppDispatch();
  const [createDeliveryChallan, { isLoading: isMutationLoading }] = useCreateDeliveryChallanFromSoMutation();

  const activeCompanyId = useMemo(() => {
    if (companyId) return companyId;
    try {
      const selComp = JSON.parse(localStorage.getItem('selected_company'));
      if (selComp?.id) return selComp.id;
    } catch {}
    try {
      const authUser = JSON.parse(localStorage.getItem('auth_user'));
      if (authUser?.companyCode) return authUser.companyCode;
    } catch {}
    return null;
  }, [companyId]);

  // Step management: 1 = select confirmed SO, 2 = configure dispatch items
  const [step, setStep] = useState(1);
  const [selectedOrderSummary, setSelectedOrderSummary] = useState(null);
  const [orderSearchKey, setOrderSearchKey] = useState('');
  const [items, setItems] = useState([]);
  const [submitError, setSubmitError] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Warehouse states
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);
  const [warehouseLoadError, setWarehouseLoadError] = useState(null);

  // Location states
  const [locations, setLocations] = useState([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [locationsLoadError, setLocationsLoadError] = useState(null);

  // Fetch confirmed Sales Orders for Step 1
  const {
    data: salesOrdersResponse,
    isLoading: isLoadingOrders,
    refetch: refetchOrders,
  } = useGetSalesOrdersQuery(
    { companyId: activeCompanyId, status: 'CONFIRMED', size: 100 },
    { skip: !isOpen }
  );

  const rawOrders = Array.isArray(salesOrdersResponse)
    ? salesOrdersResponse
    : (salesOrdersResponse?.data?.content || salesOrdersResponse?.content || salesOrdersResponse?.data || []);

  const confirmedOrders = useMemo(() => {
    return rawOrders.filter(o => String(o.status || '').toUpperCase() === 'CONFIRMED');
  }, [rawOrders]);

  const filteredOrders = useMemo(() => {
    if (!orderSearchKey.trim()) return confirmedOrders;
    const key = orderSearchKey.toLowerCase().trim();
    return confirmedOrders.filter(o => {
      const soNo = (o.soNumber || o.orderNumber || '').toLowerCase();
      const cust = (o.customerName || o.customer?.name || '').toLowerCase();
      return soNo.includes(key) || cust.includes(key);
    });
  }, [confirmedOrders, orderSearchKey]);

  // Fetch full SO details for Step 2
  const selectedOrderId = selectedOrderSummary?.id;
  const {
    data: fetchedOrderDetail,
    isLoading: isLoadingDetail,
    refetch: refetchOrderDetail,
  } = useGetSalesOrderByIdQuery(
    { id: selectedOrderId, companyId: activeCompanyId },
    { skip: !isOpen || !selectedOrderId || step !== 2 }
  );

  useEffect(() => {
    if (isOpen && step === 2 && selectedOrderId && refetchOrderDetail) {
      refetchOrderDetail();
    }
  }, [isOpen, step, selectedOrderId, refetchOrderDetail]);

  const fullOrder = fetchedOrderDetail?.data?.id 
    ? fetchedOrderDetail.data 
    : (fetchedOrderDetail?.id ? fetchedOrderDetail : selectedOrderSummary);

  // Fetch stock products for Step 2
  const {
    data: stockDataResponse,
    isLoading: isLoadingStock,
    isError: isStockError,
    error: stockQueryError,
    refetch: refetchStock,
  } = useGetGroupedStockQuery(
    { companyId: activeCompanyId || undefined, page: 0, size: 50 },
    { skip: !isOpen || step !== 2 }
  );

  const normalizedStockProducts = useMemo(() => {
    const list = extractList(stockDataResponse);
    return list.map(p => {
      const productId = p.productId || p.id || p.product_id;
      const productName = p.productName || p.name || p.product_name || '';
      const rawWarehouses = p.warehouses || p.warehouseList || [];

      const whs = rawWarehouses.map(w => {
        const whId = w.warehouseId || w.id || w.warehouse_id;
        const whName = w.warehouseName || w.name || w.warehouse_name || 'Warehouse';
        const rawLocations = w.locations || w.warehouseLocations || [];

        const locs = rawLocations.map(loc => {
          const locId = loc.locationId || loc.id || loc.location_id;
          const locName = loc.locationName || loc.name || loc.locationCode || 'Location';
          const availableQty = Number(loc.availableQuantity ?? loc.availableQty ?? loc.quantity ?? loc.stock ?? 0);
          return {
            id: locId,
            locationId: locId,
            name: locName,
            locationName: locName,
            availableQuantity: availableQty,
          };
        });

        const totalStock = locs.length > 0
          ? locs.reduce((sum, l) => sum + l.availableQuantity, 0)
          : Number(w.availableQuantity ?? w.quantity ?? w.stock ?? 0);

        return {
          id: whId,
          warehouseId: whId,
          name: whName,
          warehouseName: whName,
          warehouseCode: w.warehouseCode || w.code || '',
          locations: locs,
          totalStock,
        };
      });

      const totalStock = whs.reduce((sum, w) => sum + w.totalStock, 0);

      return {
        productId,
        productName,
        warehouses: whs,
        totalStock,
      };
    });
  }, [stockDataResponse]);

  // Fetch warehouses
  const fetchWarehouses = useCallback(async () => {
    if (!isOpen) return;
    setIsLoadingWarehouses(true);
    setWarehouseLoadError(null);
    try {
      const res = await warehousesApi.getList({ companyId: activeCompanyId }, { page: 0, size: 200 });
      const list = extractList(res);
      setWarehouses(list);

      const orderWhId = fullOrder?.warehouseId || fullOrder?.fulfillment?.warehouseId;
      if (orderWhId && list.some(w => w.id === orderWhId)) {
        setSelectedWarehouseId(orderWhId);
      } else if (list.length === 1) {
        setSelectedWarehouseId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load warehouses:', err);
      setWarehouseLoadError(err?.response?.data?.message || err?.message || 'Failed to load warehouses');
    } finally {
      setIsLoadingWarehouses(false);
    }
  }, [isOpen, activeCompanyId, fullOrder?.warehouseId, fullOrder?.fulfillment?.warehouseId]);

  useEffect(() => {
    if (isOpen) {
      fetchWarehouses();
    } else {
      setStep(1);
      setSelectedOrderSummary(null);
      setOrderSearchKey('');
      setItems([]);
      setSubmitError(null);
      setValidationErrors([]);
      setSelectedWarehouseId('');
      setLocations([]);
    }
  }, [isOpen, fetchWarehouses]);

  // Fetch locations for selected warehouse
  const fetchLocations = useCallback(async (whId) => {
    if (!whId) {
      setLocations([]);
      return;
    }
    setIsLoadingLocations(true);
    setLocationsLoadError(null);
    try {
      const res = await warehouseLocationsApi.getList({ warehouseId: whId, companyId: activeCompanyId }, { page: 0, size: 200 });
      const list = extractList(res);
      setLocations(list);

      // Reset items' warehouseLocationId on warehouse switch
      setItems(prevItems => prevItems.map(it => ({
        ...it,
        warehouseLocationId: list.length === 1 ? list[0].id : '',
      })));
    } catch (err) {
      console.error('Failed to load locations for warehouse:', whId, err);
      setLocationsLoadError(err?.response?.data?.message || err?.message || 'Failed to load locations');
      setLocations([]);
      setItems(prevItems => prevItems.map(it => ({ ...it, warehouseLocationId: '' })));
    } finally {
      setIsLoadingLocations(false);
    }
  }, [activeCompanyId]);

  useEffect(() => {
    if (selectedWarehouseId) {
      fetchLocations(selectedWarehouseId);
    } else {
      setLocations([]);
    }
  }, [selectedWarehouseId, fetchLocations]);

  // Map items for step 2
  useEffect(() => {
    if (step === 2 && fullOrder) {
      const rawItems = fullOrder.items || [];
      if (rawItems.length === 0 && isLoadingDetail) return;

      setItems(prevItems => {
        return rawItems.map(it => {
          const ordered = Number(it.quantity ?? it.orderedQuantity ?? 0);
          const dispatched = Number(
            it.dispatchedQuantity ?? 
            it.deliveredQuantity ?? 
            it.fulfillment?.dispatchedQuantity ?? 
            it.fulfillment?.deliveredQuantity ?? 
            0
          );
          const openQty = it.remainingQuantity !== undefined && it.remainingQuantity !== null
            ? Number(it.remainingQuantity)
            : (it.remainingOpenQuantity !== undefined && it.remainingOpenQuantity !== null
                ? Number(it.remainingOpenQuantity)
                : (it.openQuantity !== undefined && it.openQuantity !== null
                    ? Number(it.openQuantity)
                    : Math.max(0, ordered - dispatched)));

          const available = Math.max(0, openQty);
          const delivered = Math.max(dispatched, Number(it.deliveredQuantity ?? it.dispatchedQuantity ?? 0));

          const itemName = 
            (it.itemName && !isUuid(it.itemName) ? it.itemName : null) ||
            (it.item?.name && !isUuid(it.item.name) ? it.item.name : null) ||
            (it.productName && !isUuid(it.productName) ? it.productName : null) ||
            (it.name && !isUuid(it.name) ? it.name : null) ||
            'Item';

          const itemProductId = it.item?.id || it.productId || it.itemId || it.item?.productId || null;

          const matchedStock = normalizedStockProducts.find(sp => {
            if (itemProductId && sp.productId && String(sp.productId).toLowerCase() === String(itemProductId).toLowerCase()) {
              return true;
            }
            const pName = (sp.productName || '').trim().toLowerCase();
            const itName = itemName.trim().toLowerCase();
            return pName && itName && pName === itName;
          });

          const itemWh = matchedStock?.warehouses?.find(w => (w.warehouseId || w.id) === selectedWarehouseId);
          const itemLocs = itemWh?.locations || [];

          const existing = prevItems.find(p => p.sourceSalesOrderItemId === it.id);
          let selectedLocId = existing?.warehouseLocationId || '';
          if (itemLocs.length === 1 && !selectedLocId) {
            selectedLocId = itemLocs[0].locationId;
          }

          let availableStock = 0;
          if (selectedWarehouseId) {
            if (selectedLocId) {
              const locObj = itemLocs.find(l => l.locationId === selectedLocId);
              availableStock = locObj ? locObj.availableQuantity : 0;
            } else if (itemWh) {
              availableStock = itemWh.totalStock;
            }
          } else if (matchedStock) {
            availableStock = matchedStock.totalStock;
          }

          const maxDispatch = Math.min(available, availableStock);
          const prevQty = existing?.quantityToDispatch;
          const quantityToDispatch = available === 0
            ? 0
            : (prevQty !== undefined && prevQty !== '' 
                ? (Number(prevQty) > available ? available : prevQty)
                : (maxDispatch > 0 ? maxDispatch : 0));

          return {
            sourceSalesOrderItemId: it.id,
            itemName,
            itemProductId,
            matchedProduct: matchedStock || null,
            isMatched: !!matchedStock,
            description: it.description || '',
            ordered,
            delivered,
            available,
            availableStock,
            quantityToDispatch,
            warehouseLocationId: selectedLocId,
            locationId: selectedLocId,
            isFullyDispatchedOrReserved: available === 0,
          };
        });
      });

      setSubmitError(null);
      setValidationErrors([]);
    }
  }, [step, fullOrder, isLoadingDetail, normalizedStockProducts, selectedWarehouseId]);

  // Collect stock warehouses
  const stockWarehouses = useMemo(() => {
    const whMap = new Map();
    items.forEach(it => {
      const whList = it.matchedProduct?.warehouses || [];
      whList.forEach(w => {
        if (w.warehouseId && !whMap.has(w.warehouseId)) {
          whMap.set(w.warehouseId, {
            id: w.warehouseId,
            warehouseId: w.warehouseId,
            name: w.warehouseName,
            warehouseName: w.warehouseName,
            warehouseCode: w.warehouseCode,
            totalStock: w.totalStock,
          });
        }
      });
    });
    return Array.from(whMap.values());
  }, [items]);

  const availableWarehouses = useMemo(() => {
    if (stockWarehouses.length > 0) return stockWarehouses;
    return warehouses;
  }, [stockWarehouses, warehouses]);

  const handleSelectOrder = (order) => {
    setSelectedOrderSummary(order);
    setStep(2);
    setSubmitError(null);
    setValidationErrors([]);
  };

  const handleWarehouseChange = (e) => {
    const newWhId = e.target.value;
    setSelectedWarehouseId(newWhId);
    if (submitError) setSubmitError(null);
    if (validationErrors.length > 0) setValidationErrors([]);

    setItems(prevItems => prevItems.map(it => {
      const wh = it.matchedProduct?.warehouses?.find(w => (w.warehouseId || w.id) === newWhId);
      const locs = wh?.locations || [];
      const newLocId = locs.length === 1 ? locs[0].locationId : '';
      let newStock = 0;
      if (newLocId) {
        newStock = locs[0].availableQuantity;
      } else if (wh) {
        newStock = wh.totalStock;
      }

      const maxDispatch = Math.min(it.available, newStock);
      return {
        ...it,
        warehouseLocationId: newLocId,
        locationId: newLocId,
        availableStock: newStock,
        quantityToDispatch: it.available === 0 ? 0 : (maxDispatch > 0 ? maxDispatch : 0),
      };
    }));
  };

  const handleQtyChange = (index, val) => {
    if (submitError) setSubmitError(null);
    if (validationErrors.length > 0) setValidationErrors([]);
    setItems(prevItems => {
      const next = [...prevItems];
      if (next[index].available === 0) {
        next[index].quantityToDispatch = 0;
        return next;
      }
      if (val === '') {
        next[index].quantityToDispatch = '';
      } else {
        const num = parseFloat(val);
        next[index].quantityToDispatch = isNaN(num) ? 0 : num;
      }
      return next;
    });
  };

  const handleLocationChange = (index, locId) => {
    if (submitError) setSubmitError(null);
    if (validationErrors.length > 0) setValidationErrors([]);
    setItems(prevItems => {
      const next = [...prevItems];
      const it = next[index];
      const wh = it.matchedProduct?.warehouses?.find(w => (w.warehouseId || w.id) === selectedWarehouseId);
      const locObj = wh?.locations?.find(l => l.locationId === locId);
      const newStock = locObj ? locObj.availableQuantity : (wh ? wh.totalStock : 0);

      const maxDispatch = Math.min(it.available, newStock);
      const currQty = Number(it.quantityToDispatch) || 0;
      const nextQty = it.available === 0 ? 0 : (currQty > newStock ? (maxDispatch > 0 ? maxDispatch : 0) : it.quantityToDispatch);

      next[index] = {
        ...it,
        warehouseLocationId: locId,
        locationId: locId,
        availableStock: newStock,
        quantityToDispatch: nextQty,
      };
      return next;
    });
  };

  const hasExcessOrderError = items.some(it => {
    const val = Number(it.quantityToDispatch) || 0;
    return val > it.available;
  });

  const hasExcessStockError = items.some(it => {
    const val = Number(it.quantityToDispatch) || 0;
    return it.availableStock !== undefined && it.availableStock !== null && val > it.availableStock;
  });

  const hasNegativeError = items.some(it => {
    const val = Number(it.quantityToDispatch) || 0;
    return val < 0;
  });

  const totalDispatchItems = items.filter(it => (Number(it.quantityToDispatch) || 0) > 0).length;
  const totalDispatchQty = items.reduce((sum, it) => sum + (Number(it.quantityToDispatch) || 0), 0);

  const currentWhObj = stockWarehouses.find(w => w.warehouseId === selectedWarehouseId);
  const currentAvailableLocs = currentWhObj?.locations || locations;
  const requiresLocationSelection = currentAvailableLocs.length > 0;
  const hasMissingLocation = requiresLocationSelection && items.some(it => {
    const qty = Number(it.quantityToDispatch) || 0;
    return qty > 0 && !it.warehouseLocationId;
  });

  const isAllFullyDispatched = items.length > 0 && items.every(it => it.available === 0);

  const isFormValid = !isAllFullyDispatched &&
    !!selectedWarehouseId && 
    !hasExcessOrderError && 
    !hasExcessStockError && 
    !hasNegativeError && 
    totalDispatchItems > 0 && 
    !hasMissingLocation;

  const isSubmittingInProgress = isSubmitting || isMutationLoading;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSubmittingInProgress || isLoadingDetail || isLoadingWarehouses || isLoadingStock) return;

    const validation = validateDeliveryChallanSubmission({
      warehouseId: selectedWarehouseId,
      items,
      availableLocations: currentAvailableLocs,
      isStatusConfirmed: true,
    });

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setSubmitError(validation.errors[0] || 'Please fix validation errors before submitting.');
      return;
    }

    setValidationErrors([]);
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const payload = buildDeliveryChallanPayload({
        sourceSalesOrderId: fullOrder.id,
        warehouseId: selectedWarehouseId,
        items: items.map(it => ({
          ...it,
          locationId: it.warehouseLocationId,
        })),
        companyId: activeCompanyId,
      });

      const res = await createDeliveryChallan(payload).unwrap();
      const dcNumber = res?.data?.dcNumber || res?.dcNumber || res?.data?.deliveryChallanNumber;
      const successMsg = res?.message || (dcNumber ? `Delivery Challan ${dcNumber} created successfully.` : 'Delivery Challan generated successfully.');

      dispatch(addAlert({ type: 'success', message: successMsg }));

      if (onSuccess) {
        onSuccess(res);
      }
      onClose();
    } catch (err) {
      const msg = err?.data?.message || err?.data?.error || err?.message || (Array.isArray(err?.data?.errors) ? err.data.errors.join(', ') : 'Failed to generate Delivery Challan');
      setSubmitError(msg);
      dispatch(addAlert({ type: 'error', message: msg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl lg:max-w-5xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50 rounded-t-xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100 text-indigo-600">
              <Truck size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Generate Delivery Challan</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                {step === 1 ? 'Step 1: Select a confirmed Sales Order' : `Step 2: Dispatch from Sales Order ${fullOrder?.soNumber || fullOrder?.orderNumber || '—'}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmittingInProgress}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors disabled:opacity-50"
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/30">
          
          {/* STEP 1: SELECT CONFIRMED SALES ORDER */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search by SO number or customer..."
                    value={orderSearchKey}
                    onChange={(e) => setOrderSearchKey(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900/10 bg-white shadow-2xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => refetchOrders()}
                  className="px-3 py-2 text-xs font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <RefreshCw size={13} className={isLoadingOrders ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Confirmed SO List Table */}
              <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                <div className="max-h-[380px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-zinc-50/80 sticky top-0 border-b border-zinc-200 z-10">
                      <tr>
                        <th className="p-3 font-semibold text-zinc-600">Order Number</th>
                        <th className="p-3 font-semibold text-zinc-600">Customer</th>
                        <th className="p-3 font-semibold text-zinc-600">Date</th>
                        <th className="p-3 font-semibold text-zinc-600">Status</th>
                        <th className="p-3 font-semibold text-zinc-600 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {isLoadingOrders ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-zinc-400">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                              <span>Loading confirmed sales orders...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-zinc-400">
                            {orderSearchKey.trim() 
                              ? 'No confirmed sales orders matching your search.' 
                              : 'No confirmed sales orders available to dispatch.'}
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map(o => (
                          <tr 
                            key={o.id} 
                            onClick={() => handleSelectOrder(o)}
                            className="hover:bg-indigo-50/40 cursor-pointer transition-colors group"
                          >
                            <td className="p-3 font-mono font-semibold text-zinc-900">
                              {o.soNumber || o.orderNumber || o.id?.slice(0, 8)}
                            </td>
                            <td className="p-3 text-zinc-700 font-medium truncate max-w-[180px]">
                              {o.customerName || o.customer?.name || '—'}
                            </td>
                            <td className="p-3 text-zinc-500">
                              {fmtDate(o.soDate || o.orderDate)}
                            </td>
                            <td className="p-3">
                              <span className="badge badge-success inline-flex items-center gap-1">
                                <CheckCircle size={11} /> Confirmed
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleSelectOrder(o); }}
                                className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors flex items-center gap-1 ml-auto"
                              >
                                <span>Select</span>
                                <ChevronRight size={13} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CONFIGURE DISPATCH ITEMS */}
          {step === 2 && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isSubmittingInProgress}
                className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <ArrowLeft size={14} />
                <span>Change Sales Order</span>
              </button>

              {/* Order Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3.5 rounded-lg border border-zinc-200 shadow-2xs">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Customer</p>
                  <p className="text-sm font-semibold text-zinc-900 truncate">
                    {fullOrder?.customerName || fullOrder?.customer?.name || '—'}
                  </p>
                </div>
                <div className="bg-white p-3.5 rounded-lg border border-zinc-200 shadow-2xs">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Date</p>
                  <p className="text-sm font-semibold text-zinc-900">
                    {fmtDate(fullOrder?.soDate || fullOrder?.orderDate)}
                  </p>
                </div>
                <div className="bg-white p-3.5 rounded-lg border border-zinc-200 shadow-2xs">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Status</p>
                  <span className="badge badge-success inline-flex items-center gap-1">
                    <CheckCircle size={12} /> Confirmed
                  </span>
                </div>
              </div>

              {/* Warehouse Selection Section */}
              <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label htmlFor="step2-warehouse-select" className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Warehouse size={15} className="text-indigo-600" />
                      Dispatch Warehouse <span className="text-red-500">*</span>
                    </label>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Select the warehouse from which items will be dispatched.
                    </p>
                  </div>

                  <div className="w-full sm:w-80">
                    {isLoadingWarehouses ? (
                      <div className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-lg">
                        <div className="w-3.5 h-3.5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                        <span>Loading warehouses...</span>
                      </div>
                    ) : warehouseLoadError ? (
                      <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                        <span className="truncate">{warehouseLoadError}</span>
                        <button
                          type="button"
                          onClick={fetchWarehouses}
                          className="p-1 hover:bg-red-100 rounded text-red-700 transition-colors shrink-0"
                          title="Retry"
                        >
                          <RefreshCw size={13} />
                        </button>
                      </div>
                    ) : warehouses.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg font-medium">
                        No warehouses found. Please create a warehouse in Inventory.
                      </div>
                    ) : (
                      <select
                        id="step2-warehouse-select"
                        value={selectedWarehouseId}
                        onChange={handleWarehouseChange}
                        disabled={isSubmittingInProgress}
                        className={`w-full px-3 py-2 text-sm rounded-lg border bg-white text-zinc-800 font-medium transition-all outline-none ${
                          !selectedWarehouseId && validationErrors.length > 0
                            ? 'border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                            : 'border-zinc-300 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10'
                        }`}
                      >
                        <option value="">Select Warehouse *</option>
                        {warehouses.map(w => (
                          <option key={w.id} value={w.id}>
                            {w.warehouseName || w.name || 'Warehouse'} {w.warehouseCode ? `(${w.warehouseCode})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {selectedWarehouseId && (
                  <div className="mt-2 pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-zinc-400" />
                      {isLoadingLocations ? (
                        'Loading warehouse locations...'
                      ) : locationsLoadError ? (
                        <span className="text-red-600">{locationsLoadError}</span>
                      ) : locations.length > 0 ? (
                        `${locations.length} warehouse location${locations.length > 1 ? 's' : ''} available`
                      ) : (
                        'No specific sub-locations configured for this warehouse'
                      )}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-400">
                      ID: {selectedWarehouseId.slice(0, 8)}...
                    </span>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Package size={14} className="text-zinc-400" />
                    Dispatch Items
                  </h3>
                  {locations.length > 0 && (
                    <span className="text-[11px] text-zinc-500 font-medium">
                      Assign location per dispatched item
                    </span>
                  )}
                </div>
                <div className="w-full overflow-x-auto min-w-0 custom-scrollbar">
                  <table className="w-full min-w-[700px] text-left text-xs table-fixed border-collapse">
                    <colgroup>
                      <col className="w-[28%]" />
                      <col className="w-[8.5%]" />
                      <col className="w-[8.5%]" />
                      <col className="w-[9%]" />
                      <col className="w-[13%]" />
                      <col className="w-[19%]" />
                      <col className="w-[14%]" />
                    </colgroup>
                    <thead className="bg-zinc-50/80 border-b border-zinc-200 text-xs font-semibold text-zinc-600">
                      <tr>
                        <th className="px-3 py-2.5 text-left">Product</th>
                        <th className="px-2 py-2.5 text-right">Ordered</th>
                        <th className="px-2 py-2.5 text-right">Delivered</th>
                        <th className="px-2 py-2.5 text-right">Pending</th>
                        <th className="px-2 py-2.5 text-right">Avail. Stock</th>
                        <th className="px-2.5 py-2.5 text-left">Warehouse Location</th>
                        <th className="px-3 py-2.5 text-right">Dispatch Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 bg-white">
                      {isLoadingDetail && (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-zinc-500 text-xs">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                              <span>Loading items from Sales Order...</span>
                            </div>
                          </td>
                        </tr>
                      )}

                      {!isLoadingDetail && items.length > 0 && items.map((it, idx) => {
                        const qtyVal = Number(it.quantityToDispatch) || 0;
                        const isExcess = qtyVal > it.available;
                        const isExcessStock = it.availableStock !== undefined && it.availableStock !== null && qtyVal > it.availableStock;
                        const isNegative = qtyVal < 0;
                        const isQtyError = isExcess || isExcessStock || isNegative;
                        const isItemDispatched = qtyVal > 0;

                        const wh = it.matchedProduct?.warehouses?.find(w => (w.warehouseId || w.id) === selectedWarehouseId);
                        const itemLocations = wh?.locations || locations;
                        const isMissingLocation = isItemDispatched && itemLocations.length > 0 && !it.warehouseLocationId;
                        const isDisabled = it.available === 0;

                        return (
                          <tr 
                            key={it.sourceSalesOrderItemId || idx} 
                            className={isQtyError || isMissingLocation ? 'bg-red-50/40' : 'hover:bg-zinc-50/60 transition-colors'}
                          >
                            {/* Product info */}
                            <td className="px-3 py-2.5 align-top">
                              <div className="font-semibold text-zinc-900 text-xs break-words leading-snug">
                                {it.itemName}
                              </div>
                              {it.description && (
                                <div className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1 break-words" title={it.description}>
                                  {it.description}
                                </div>
                              )}
                              {isLoadingStock ? (
                                <div className="text-[10px] text-zinc-400 animate-pulse mt-1">Checking stock...</div>
                              ) : it.isMatched ? (
                                <div className="text-[10px] font-medium text-emerald-600 flex items-center gap-1 mt-1">
                                  <CheckCircle size={11} className="shrink-0" />
                                  <span>Stock matched</span>
                                </div>
                              ) : (
                                <div 
                                  className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1 mt-1 max-w-full" 
                                  title={it.itemProductId || 'No ID'}
                                >
                                  <AlertCircle size={10} className="shrink-0 text-amber-600" />
                                  <span className="truncate">Product ID not in stock</span>
                                </div>
                              )}
                            </td>

                            {/* Quantities */}
                            <td className="px-2 py-2.5 text-right font-medium text-zinc-700 text-xs align-middle">{fmt(it.ordered)}</td>
                            <td className="px-2 py-2.5 text-right font-medium text-emerald-600 text-xs align-middle">{fmt(it.delivered)}</td>
                            <td className="px-2 py-2.5 text-right font-bold text-zinc-900 text-xs align-middle">{fmt(it.available)}</td>

                            {/* Available Stock */}
                            <td className="px-2 py-2.5 text-right text-xs align-middle">
                              {!selectedWarehouseId ? (
                                <span className="text-zinc-400 text-[11px] italic">Select Wh</span>
                              ) : it.availableStock === 0 ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 leading-tight">
                                  0 (Out)
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {fmt(it.availableStock)}
                                </span>
                              )}
                            </td>

                            {/* Location Dropdown */}
                            <td className="px-2.5 py-2.5 align-middle">
                              {!selectedWarehouseId ? (
                                <span className="text-xs text-zinc-400 italic">Select warehouse</span>
                              ) : isLoadingLocations || isLoadingStock ? (
                                <span className="text-xs text-zinc-400 flex items-center gap-1">
                                  <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                  <span className="text-[11px]">Loading...</span>
                                </span>
                              ) : itemLocations.length === 0 ? (
                                <span className="text-xs text-zinc-400 italic">Default</span>
                              ) : (
                                <select
                                  value={it.warehouseLocationId || ''}
                                  onChange={(e) => handleLocationChange(idx, e.target.value)}
                                  disabled={isDisabled || isSubmittingInProgress}
                                  className={`w-full px-2 py-1 text-xs rounded-md border bg-white outline-none transition-all truncate ${
                                    isDisabled
                                      ? 'bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed'
                                      : isMissingLocation
                                        ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/50 text-red-700'
                                        : 'border-zinc-300 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 text-zinc-800'
                                  }`}
                                >
                                  <option value="">Select Location *</option>
                                  {itemLocations.map(loc => (
                                    <option key={loc.locationId || loc.id} value={loc.locationId || loc.id}>
                                      {loc.locationName || loc.name || loc.locationCode || 'Location'} {loc.availableQuantity !== undefined ? `(Stock: ${loc.availableQuantity})` : ''}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </td>

                            {/* Qty Input */}
                            <td className="px-3 py-2.5 text-right align-middle">
                              <div className="flex flex-col items-end">
                                <input
                                  type="number"
                                  min="0"
                                  max={Math.min(it.available, it.availableStock !== undefined ? it.availableStock : it.available)}
                                  step="any"
                                  disabled={isDisabled || isSubmittingInProgress}
                                  value={it.quantityToDispatch === 0 && it.quantityToDispatch.toString() !== "0" ? '' : it.quantityToDispatch}
                                  onChange={(e) => handleQtyChange(idx, e.target.value)}
                                  className={`w-full max-w-[85px] px-2 py-1 text-right text-xs font-semibold rounded-md border ${
                                    isDisabled 
                                      ? 'bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed'
                                      : isQtyError 
                                        ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50 text-red-700' 
                                        : 'border-zinc-300 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10'
                                  } outline-none transition-all`}
                                />
                                {isExcessStock && (
                                  <div className="text-[9px] text-red-600 font-semibold mt-0.5 leading-tight text-right break-words max-w-[85px]">
                                    &gt; Stock ({it.availableStock})
                                  </div>
                                )}
                                {isExcess && !isExcessStock && (
                                  <div className="text-[9px] text-red-600 font-semibold mt-0.5 leading-tight text-right break-words max-w-[85px]">
                                    &gt; Pending ({it.available})
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {!isLoadingDetail && items.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-zinc-400 text-xs">
                            No items found in this Sales Order.
                          </td>
                        </tr>
                      )}

                      {!isLoadingDetail && items.length > 0 && items.every(it => it.available === 0) && (
                        <tr>
                          <td colSpan={6} className="px-4 py-4 text-center text-zinc-500 font-medium bg-zinc-50/50 text-xs">
                            All items have already been completely delivered.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {hasExcessError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-xs">
                  <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600" />
                  <p className="font-medium">Dispatch quantity cannot exceed available quantity for any item.</p>
                </div>
              )}

              {hasMissingLocation && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-xs">
                  <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600" />
                  <p className="font-medium">Please select a warehouse location for each item being dispatched.</p>
                </div>
              )}


            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 bg-white flex items-center justify-between rounded-b-xl shrink-0">
          <div className="text-sm text-zinc-500">
            {step === 2 && (
              <>
                Total Dispatch Items: <span className="font-bold text-zinc-900">{totalDispatchItems}</span>
                {totalDispatchQty > 0 && (
                  <span className="text-xs text-zinc-400 ml-1.5 font-normal">
                    (Total Qty: <span className="font-semibold text-zinc-700">{fmt(totalDispatchQty)}</span>)
                  </span>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmittingInProgress}
              className="px-4 py-2 text-sm font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            {step === 2 && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmittingInProgress || isLoadingDetail || isLoadingWarehouses}
                className="px-5 py-2 text-sm font-semibold text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmittingInProgress ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Truck size={16} />
                    <span>Generate Challan</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
