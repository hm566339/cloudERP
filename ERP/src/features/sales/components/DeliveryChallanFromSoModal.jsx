import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Truck, Package, AlertCircle } from 'lucide-react';
import { 
  useCreateDeliveryChallanFromSoMutation,
  useCreateDeliveryChallanFromReceiptMutation,
  useConfirmDeliveryChallanMutation,
  useGetSalesOrderByIdQuery 
} from '../../../api/sales-crm/sales.api';
import { useGetGroupedStockQuery } from '../../../api/inventory/inventory.api';
import { warehousesApi, warehouseLocationsApi } from '../../../api/inventory';
import { salesInvoicesApi, receiptVouchersApi } from '../../../api/account';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { 
  isUuid, 
  validateDeliveryChallanSubmission, 
  buildDeliveryChallanPayload 
} from '../utils/deliveryChallanValidation';
import DeliveryInvoiceActionsModal from './DeliveryInvoiceActionsModal';
import DeliveryChallanConfirmModal from './delivery-challan/DeliveryChallanConfirmModal';
import DeliveryChallanWarehouseSelect from './delivery-challan/DeliveryChallanWarehouseSelect';
import DeliveryChallanItemsTable from './delivery-challan/DeliveryChallanItemsTable';

const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const extractList = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.content)) return res.data.content;
  if (Array.isArray(res?.content)) return res.content;
  if (Array.isArray(res?.products)) return res.products;
  return [];
};

export default function DeliveryChallanFromSoModal({ isOpen, onClose, companyId, salesOrder, receipt, onSuccess }) {
  const dispatch = useAppDispatch();
  const [createDeliveryChallanFromSo, { isLoading: isSoMutationLoading }] = useCreateDeliveryChallanFromSoMutation();
  const [createDeliveryChallanFromReceipt, { isLoading: isReceiptMutationLoading }] = useCreateDeliveryChallanFromReceiptMutation();
  const [confirmDeliveryChallan, { isLoading: isConfirming }] = useConfirmDeliveryChallanMutation();
  const isMutationLoading = isSoMutationLoading || isReceiptMutationLoading;

  // Confirmation popup state
  const [dcConfirmPopup, setDcConfirmPopup] = useState(null); // { dcId, dcNumber }
  const [confirmError, setConfirmError] = useState(null);
  const [isInvoiceActionsModalOpen, setIsInvoiceActionsModalOpen] = useState(false);
  const [invoiceActionsData, setInvoiceActionsData] = useState(null);

  const isReceiptMode = Boolean(receipt && !salesOrder);
  
  const [items, setItems] = useState([]);
  const [submitError, setSubmitError] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Warehouse states
  const [companyWarehouses, setCompanyWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);
  const [warehouseLoadError, setWarehouseLoadError] = useState(null);

  // Location states (fallback)
  const [locations, setLocations] = useState([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [locationsLoadError, setLocationsLoadError] = useState(null);

  // Receipt & Linked Sales Invoice states (Receipt mode)
  const receiptId = receipt?.id;
  const [detailedReceipt, setDetailedReceipt] = useState(null);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);
  const [selectedSalesInvoiceId, setSelectedSalesInvoiceId] = useState('');
  const [salesInvoiceData, setSalesInvoiceData] = useState(null);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);
  const [invoiceLoadError, setInvoiceLoadError] = useState(null);

  // Derive active companyId from prop or local storage context
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

  // Fetch full receipt details if in receipt mode
  useEffect(() => {
    if (!isOpen || !isReceiptMode || !receiptId) {
      setDetailedReceipt(null);
      setSelectedSalesInvoiceId('');
      setSalesInvoiceData(null);
      setInvoiceLoadError(null);
      return;
    }

    if (Array.isArray(receipt?.allocations) && receipt.allocations.length > 0) {
      setDetailedReceipt(receipt);
    }

    let isMounted = true;
    setIsLoadingReceipt(true);
    receiptVouchersApi.getReceiptById(receiptId)
      .then(res => {
        if (isMounted) {
          const r = res?.data || res;
          setDetailedReceipt(r);
        }
      })
      .catch(err => {
        console.warn('Could not fetch detailed receipt:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingReceipt(false);
      });

    return () => { isMounted = false; };
  }, [isOpen, isReceiptMode, receiptId, receipt]);

  const currentReceipt = detailedReceipt || receipt;

  // Extract allocations linked to sales invoices
  const receiptAllocations = useMemo(() => {
    if (!currentReceipt) return [];
    const raw = currentReceipt.allocations || currentReceipt.invoiceAllocations || [];
    return raw.filter(a => a && (a.salesInvoiceId || a.salesInvoice?.id));
  }, [currentReceipt]);

  // Auto-select linked sales invoice id when allocations available
  useEffect(() => {
    if (!isOpen || !isReceiptMode) return;
    if (receiptAllocations.length > 0) {
      const exists = receiptAllocations.some(a => (a.salesInvoiceId || a.salesInvoice?.id) === selectedSalesInvoiceId);
      if (!exists) {
        setSelectedSalesInvoiceId(receiptAllocations[0].salesInvoiceId || receiptAllocations[0].salesInvoice?.id);
      }
    } else if (currentReceipt?.salesInvoiceId || currentReceipt?.salesInvoice?.id) {
      setSelectedSalesInvoiceId(currentReceipt.salesInvoiceId || currentReceipt.salesInvoice?.id);
    }
  }, [isOpen, isReceiptMode, receiptAllocations, selectedSalesInvoiceId, currentReceipt]);

  // Fetch sales invoice items whenever selectedSalesInvoiceId changes
  useEffect(() => {
    if (!isOpen || !isReceiptMode || !selectedSalesInvoiceId) {
      setSalesInvoiceData(null);
      return;
    }

    let isMounted = true;
    setIsLoadingInvoice(true);
    setInvoiceLoadError(null);

    salesInvoicesApi.getById(selectedSalesInvoiceId)
      .then(res => {
        if (isMounted) {
          const inv = res?.data?.data || res?.data || res;
          setSalesInvoiceData(inv);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error('Failed to load sales invoice:', err);
          setInvoiceLoadError(err?.response?.data?.message || err?.message || 'Failed to load Sales Invoice details');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingInvoice(false);
      });

    return () => { isMounted = false; };
  }, [isOpen, isReceiptMode, selectedSalesInvoiceId]);

  const salesOrderId = salesOrder?.id;

  // 1. Fetch latest sales order details whenever modal is open to ensure fresh fulfillment status
  const {
    data: fetchedOrderData,
    isLoading: isOrderLoading,
    refetch: refetchOrder,
  } = useGetSalesOrderByIdQuery(
    { id: salesOrderId, companyId: activeCompanyId },
    { skip: !isOpen || !salesOrderId }
  );

  useEffect(() => {
    if (isOpen && salesOrderId && refetchOrder) {
      refetchOrder();
    }
  }, [isOpen, salesOrderId, refetchOrder]);

  const orderDetail = fetchedOrderData?.data?.id 
    ? fetchedOrderData.data 
    : (fetchedOrderData?.id ? fetchedOrderData : null);

  const currentOrder = orderDetail || salesOrder;
  const orderId = currentOrder?.id;

  const currentSourceItems = useMemo(() => {
    if (isReceiptMode) {
      return salesInvoiceData?.lineItems || salesInvoiceData?.items || salesInvoiceData?.salesInvoiceItems || [];
    }
    return currentOrder?.items || [];
  }, [isReceiptMode, salesInvoiceData, currentOrder]);

  const rawItemsLength = currentSourceItems.length;
  const isSourceLoading = isReceiptMode ? (isLoadingReceipt || isLoadingInvoice) : isOrderLoading;

  // 2. Fetch stock products from Integration Stock API: GET /api/inventory/integration/stock/products?page=0&size=50
  const {
    data: stockDataResponse,
    isLoading: isLoadingStock,
    isError: isStockError,
    error: stockQueryError,
    refetch: refetchStock,
  } = useGetGroupedStockQuery(
    { companyId: activeCompanyId || undefined, page: 0, size: 50 },
    { skip: !isOpen }
  );

  // 3. Normalize stock products response
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
            batchId: loc.batchId || loc.batch_id || '',
            batchCode: loc.batchCode || loc.batch_code || '',
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

  // Load fallback warehouses from inventory API
  const fetchFallbackWarehouses = useCallback(async () => {
    if (!isOpen) return;
    setIsLoadingWarehouses(true);
    setWarehouseLoadError(null);
    try {
      const res = await warehousesApi.getList({ companyId: activeCompanyId }, { page: 0, size: 200 });
      const list = extractList(res);
      setCompanyWarehouses(list);
    } catch (err) {
      console.error('Failed to load fallback warehouses:', err);
      setWarehouseLoadError(err?.response?.data?.message || err?.message || 'Failed to load warehouses');
    } finally {
      setIsLoadingWarehouses(false);
    }
  }, [isOpen, activeCompanyId]);

  useEffect(() => {
    if (isOpen) {
      fetchFallbackWarehouses();
    } else {
      setCompanyWarehouses([]);
      setSelectedWarehouseId('');
      setWarehouseLoadError(null);
      setLocations([]);
      setSubmitError(null);
      setValidationErrors([]);
    }
  }, [isOpen, fetchFallbackWarehouses]);

  // Fallback locations for selected warehouse if not in stock API
  const fetchFallbackLocations = useCallback(async (whId) => {
    if (!whId) {
      setLocations([]);
      setLocationsLoadError(null);
      return;
    }
    setIsLoadingLocations(true);
    setLocationsLoadError(null);
    try {
      const res = await warehouseLocationsApi.getList({ warehouseId: whId, companyId: activeCompanyId }, { page: 0, size: 200 });
      const list = extractList(res);
      setLocations(list);
    } catch (err) {
      console.error('Failed to load locations for warehouse:', whId, err);
      setLocationsLoadError(err?.response?.data?.message || err?.message || 'Failed to load locations');
      setLocations([]);
    } finally {
      setIsLoadingLocations(false);
    }
  }, [activeCompanyId]);

  useEffect(() => {
    if (selectedWarehouseId) {
      fetchFallbackLocations(selectedWarehouseId);
    } else {
      setLocations([]);
    }
  }, [selectedWarehouseId, fetchFallbackLocations]);

  // 4. Match Sales Order / Sales Invoice items with Stock Products and build rows
  useEffect(() => {
    if (!isOpen || (!currentOrder && !isReceiptMode) || (isReceiptMode && !salesInvoiceData && !isSourceLoading)) {
      if (!isReceiptMode || !salesInvoiceData) {
        setItems([]);
        setSubmitError(null);
        setValidationErrors([]);
        return;
      }
    }

    const currentItems = isReceiptMode
      ? (salesInvoiceData?.lineItems || salesInvoiceData?.items || salesInvoiceData?.salesInvoiceItems || [])
      : (currentOrder?.items || []);

    if (currentItems.length === 0 && isSourceLoading) {
      return;
    }

    setItems(prevItems => {
      return currentItems.map((it, idx) => {
        const itemId = it.id || it.itemId || (isReceiptMode ? it.sourceSalesInvoiceItemId : it.sourceSalesOrderItemId);
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

        // Match with Stock API products by productId or by product name
        let matchedStock = normalizedStockProducts.find(sp => {
          if (itemProductId && sp.productId && String(sp.productId).toLowerCase() === String(itemProductId).toLowerCase()) {
            return true;
          }
          const pName = (sp.productName || '').trim().toLowerCase();
          const itName = itemName.trim().toLowerCase();
          return pName && itName && pName === itName;
        });

        // Fallback to item.inventory if API mapping failed but backend provided inventory
        if (!matchedStock && it.inventory && it.inventory.inventoryFetchStatus === 'SUCCESS') {
          matchedStock = {
            productId: itemProductId,
            productName: itemName,
            totalStock: Number(it.inventory.availableQuantity || it.inventory.stockQuantity || 0),
            warehouses: [
              {
                id: it.inventory.warehouseId,
                warehouseId: it.inventory.warehouseId,
                name: it.inventory.warehouseName || 'Warehouse',
                warehouseName: it.inventory.warehouseName || 'Warehouse',
                totalStock: Number(it.inventory.availableQuantity || it.inventory.stockQuantity || 0),
                locations: [
                  {
                    id: it.inventory.locationId,
                    locationId: it.inventory.locationId,
                    name: it.inventory.locationName || 'Location',
                    locationName: it.inventory.locationName || 'Location',
                    availableQuantity: Number(it.inventory.availableQuantity || it.inventory.stockQuantity || 0)
                  }
                ]
              }
            ]
          };
        }

        // Compute warehouse-specific details if warehouse already selected
        const itemWh = matchedStock?.warehouses?.find(w => w.warehouseId === selectedWarehouseId);
        const itemLocs = itemWh?.locations || [];

        // Check if existing item already had a selection
        const existing = prevItems.find(p => (
          p.sourceSalesOrderItemId === itemId || 
          p.sourceSalesInvoiceItemId === itemId || 
          p.id === itemId
        ));
        let selectedLocId = existing?.warehouseLocationId || '';
        if (itemLocs.length === 1 && !selectedLocId) {
          selectedLocId = itemLocs[0].locationId;
        }

        // Available stock determination
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
          id: itemId,
          sourceSalesOrderItemId: itemId,
          sourceSalesInvoiceItemId: itemId,
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
  }, [isOpen, orderId, rawItemsLength, isSourceLoading, normalizedStockProducts, selectedWarehouseId, isReceiptMode, salesInvoiceData]);

  // 5. Collect matching warehouses across all matched items in the Sales Order / Invoice
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

  // Warehouses to display in Dispatch Warehouse dropdown
  const availableWarehouses = useMemo(() => {
    if (stockWarehouses.length > 0) {
      return stockWarehouses;
    }
    return companyWarehouses;
  }, [stockWarehouses, companyWarehouses]);

  // Pre-select warehouse if single warehouse available or order specifies warehouse
  useEffect(() => {
    if (!isOpen || selectedWarehouseId) return;

    const orderWhId = currentOrder?.warehouseId || currentOrder?.fulfillment?.warehouseId || salesInvoiceData?.warehouseId;
    if (orderWhId && availableWarehouses.some(w => (w.warehouseId || w.id) === orderWhId)) {
      setSelectedWarehouseId(orderWhId);
    } else if (availableWarehouses.length === 1) {
      setSelectedWarehouseId(availableWarehouses[0].warehouseId || availableWarehouses[0].id);
    }
  }, [isOpen, availableWarehouses, selectedWarehouseId, currentOrder?.warehouseId, currentOrder?.fulfillment?.warehouseId, salesInvoiceData?.warehouseId]);

  if (!isOpen || (!salesOrder && !receipt)) return null;

  // Handle Dispatch Warehouse Change
  const handleWarehouseChange = (e) => {
    const newWhId = e.target.value;
    setSelectedWarehouseId(newWhId);
    if (submitError) setSubmitError(null);
    if (validationErrors.length > 0) setValidationErrors([]);

    // Update each item's location and available stock for the new warehouse
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

  // Handle Location Change per item
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

  // Handle Dispatch Quantity Change
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

  const receiptStatus = String(currentReceipt?.receiptStatus || currentReceipt?.status || 'DRAFT').toUpperCase();
  const isReceiptStatusValid = ['APPROVED', 'POSTED'].includes(receiptStatus);
  const isStatusConfirmed = isReceiptMode ? isReceiptStatusValid : (String(currentOrder?.status || '').toUpperCase() === 'CONFIRMED');

  // Validation rules
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

  // Check if any dispatched item is missing location selection
  const hasMissingLocation = items.some(it => {
    const qty = Number(it.quantityToDispatch) || 0;
    if (qty <= 0) return false;
    const wh = it.matchedProduct?.warehouses?.find(w => (w.warehouseId || w.id) === selectedWarehouseId);
    const itemLocs = wh?.locations || locations;
    return itemLocs.length > 0 && !it.warehouseLocationId;
  });

  const isAllFullyDispatched = items.length > 0 && items.every(it => it.available === 0);

  const isFormValid = isStatusConfirmed && 
    !isAllFullyDispatched &&
    !!selectedWarehouseId && 
    !hasExcessOrderError && 
    !hasExcessStockError && 
    !hasNegativeError && 
    totalDispatchItems > 0 && 
    !hasMissingLocation &&
    (!isReceiptMode || !!selectedSalesInvoiceId);

  const isSubmittingInProgress = isSubmitting || isMutationLoading;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSubmittingInProgress || isSourceLoading || isLoadingWarehouses || isLoadingStock || isAllFullyDispatched) return;

    // Run strict business validation
    const currentWarehouseWh = stockWarehouses.find(w => w.warehouseId === selectedWarehouseId);
    const availableLocs = currentWarehouseWh?.locations || locations;

    const validation = validateDeliveryChallanSubmission({
      warehouseId: selectedWarehouseId,
      items,
      availableLocations: availableLocs,
      isStatusConfirmed,
    });

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setSubmitError(validation.errors[0] || 'Please fix the validation errors before generating.');
      return;
    }

    setValidationErrors([]);
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      if (isReceiptMode) {
        if (!selectedSalesInvoiceId) {
          throw new Error('No linked Sales Invoice found for this Receipt Voucher.');
        }

        const payloadItems = items
          .filter(it => (Number(it.quantityToDispatch) || 0) > 0)
          .map(it => {
            const itemPayload = {
              sourceSalesInvoiceItemId: it.sourceSalesInvoiceItemId || it.sourceSalesOrderItemId || it.id,
              quantityToDispatch: Number(it.quantityToDispatch),
            };
            const locId = it.warehouseLocationId || it.locationId;
            if (locId && isUuid(locId)) {
              itemPayload.warehouseLocationId = locId;
            }
            return itemPayload;
          });

        if (payloadItems.length === 0) {
          throw new Error('Please enter a dispatch quantity greater than zero for at least one item.');
        }

        const defaultLocId = payloadItems[0]?.warehouseLocationId || (availableLocs.length === 1 ? (availableLocs[0].id || availableLocs[0].locationId) : undefined);

        const payload = {
          warehouseId: selectedWarehouseId,
          ...(defaultLocId && isUuid(defaultLocId) ? { locationId: defaultLocId } : {}),
          salesInvoiceId: selectedSalesInvoiceId,
          items: payloadItems,
        };

        const res = await createDeliveryChallanFromReceipt({
          receiptId: currentReceipt.id,
          data: payload,
          companyId: activeCompanyId,
        }).unwrap();

        const dcId = res?.data?.id || res?.id;
        const dcNumber = res?.data?.dcNumber || res?.dcNumber || res?.data?.deliveryChallanNumber;
        const successMsg = res?.message || (dcNumber ? `Delivery Challan ${dcNumber} generated successfully.` : 'Delivery Challan generated successfully from Receipt Voucher.');

        dispatch(addAlert({ type: 'success', message: successMsg }));

        // Show confirmation popup if we got a DC ID (Defer onSuccess and onClose)
        if (dcId) {
          setDcConfirmPopup({ 
            dcId, 
            dcNumber, 
            originalRes: res,
            invoiceId: selectedSalesInvoiceId || salesInvoiceData?.id || res?.data?.salesInvoiceId || res?.data?.invoiceId,
            invoiceNumber: salesInvoiceData?.invoiceNumber || res?.data?.salesInvoiceNumber || res?.data?.invoiceNumber,
            customerName: currentReceipt?.customerName || currentReceipt?.customer?.name || currentReceipt?.customer?.customerName || salesInvoiceData?.customerName,
          });
          setConfirmError(null);
        } else {
          if (onSuccess) {
            onSuccess(res);
          }
          onClose();
        }
      } else {
        const payload = buildDeliveryChallanPayload({
          sourceSalesOrderId: currentOrder.id,
          warehouseId: selectedWarehouseId,
          items: items.map(it => ({
            ...it,
            locationId: it.warehouseLocationId,
          })),
          companyId: activeCompanyId,
        });

        const res = await createDeliveryChallanFromSo(payload).unwrap();

        const dcId = res?.data?.id || res?.id;
        const dcNumber = res?.data?.dcNumber || res?.dcNumber || res?.data?.deliveryChallanNumber;
        const successMsg = res?.message || (dcNumber ? `Delivery Challan ${dcNumber} generated successfully.` : 'Delivery Challan generated successfully.');

        dispatch(addAlert({ type: 'success', message: successMsg }));

        // Show confirmation popup if we got a DC ID (Defer onSuccess and onClose)
        if (dcId) {
          setDcConfirmPopup({ 
            dcId, 
            dcNumber, 
            originalRes: res,
            invoiceId: res?.data?.salesInvoiceId || res?.data?.invoiceId || currentOrder?.salesInvoiceId || currentOrder?.invoiceId,
            invoiceNumber: res?.data?.salesInvoiceNumber || res?.data?.invoiceNumber || currentOrder?.invoiceNumber,
            customerName: currentOrder?.customerName || currentOrder?.clientName || currentOrder?.customer?.name || currentOrder?.customer?.customerName,
          });
          setConfirmError(null);
        } else {
          if (onSuccess) {
            onSuccess(res);
          }
          onClose();
        }
      }
    } catch (err) {
      const status = err?.status || err?.response?.status;
      let msg = err?.data?.message || err?.data?.error || err?.message || (Array.isArray(err?.data?.errors) ? err.data.errors.join(', ') : 'Failed to generate Delivery Challan');
      if (status === 409) {
        msg = 'Concurrent modification conflict on Sales Invoice. Please retry in a few seconds.';
      } else if (status === 404) {
        msg = 'Receipt Voucher or linked Sales Invoice was not found on the server.';
      } else if (status === 400 && typeof msg === 'string' && msg.includes('APPROVED or POSTED')) {
        msg = 'Receipt Voucher must be APPROVED or POSTED before creating a Delivery Challan.';
      }
      setSubmitError(msg);
      dispatch(addAlert({ type: 'error', message: msg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Header display details
  const displayOrderNo = currentOrder?.soNumber || currentOrder?.orderNumber || '—';
  const displayReceiptNo = currentReceipt?.receiptNo || '—';
  const customerName = isReceiptMode
    ? (currentReceipt?.customerName || currentReceipt?.customer?.customerName || currentReceipt?.customer?.name || salesInvoiceData?.customerName || '—')
    : (currentOrder?.customer?.name || currentOrder?.customerName || currentOrder?.customer?.customerName || '—');
  const rawDate = isReceiptMode
    ? (currentReceipt?.receiptDate || currentReceipt?.date)
    : (currentOrder?.soDate || currentOrder?.orderDate || currentOrder?.date);
  const displayDate = rawDate ? new Date(rawDate).toLocaleDateString() : '—';
  const orderStatus = isReceiptMode ? receiptStatus : (currentOrder?.status || 'CONFIRMED');

  const selectedWhObj = availableWarehouses.find(w => (w.warehouseId || w.id) === selectedWarehouseId);

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-900/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#161922] border border-transparent dark:border-[#2A2F3D] rounded-xl shadow-xl w-full max-w-4xl lg:max-w-5xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between bg-zinc-50/50 dark:bg-[#1D212C] rounded-t-xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-blue-500/10 flex items-center justify-center border border-indigo-100 dark:border-blue-500/20 text-indigo-600 dark:text-[#4C8DFF]">
              <Truck size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight">Generate Delivery Challan</h2>
              <p className="text-xs font-medium text-zinc-500 dark:text-[#6B7184] mt-0.5">
                {isReceiptMode ? (
                  <>From Receipt Voucher <span className="font-mono text-zinc-900 dark:text-[#E6E8EE] font-semibold">{displayReceiptNo}</span></>
                ) : (
                  <>From Sales Order <span className="font-mono text-zinc-900 dark:text-[#E6E8EE] font-semibold">{displayOrderNo}</span></>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmittingInProgress}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-[#222736] text-zinc-400 dark:text-[#6B7184] hover:text-zinc-600 dark:hover:text-[#E6E8EE] transition-colors disabled:opacity-50"
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/30 dark:bg-[#0F1117] space-y-4">
          
          {/* Status Alert if not confirmed/approved */}
          {!isStatusConfirmed && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-lg flex items-start gap-2 text-amber-800 dark:text-amber-400 text-xs">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <p className="font-medium">
                {isReceiptMode ? (
                  <>This Receipt Voucher status is <strong>{orderStatus}</strong>. The server requires Receipt Vouchers to be <strong>APPROVED</strong> or <strong>POSTED</strong> before generating Delivery Challans.</>
                ) : (
                  <>This Sales Order status is <strong>{orderStatus}</strong>. Only <strong>CONFIRMED</strong> Sales Orders can generate Delivery Challans.</>
                )}
              </p>
            </div>
          )}

          {/* Linked Sales Invoice Selector (Receipt mode) */}
          {isReceiptMode && (
            <div className="bg-white dark:bg-[#161922] p-3.5 rounded-lg border border-indigo-100 dark:border-[#2A2F3D] bg-indigo-50/20 dark:bg-[#1D212C]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider flex items-center gap-1.5">
                  <Package size={14} className="text-indigo-600 dark:text-[#4C8DFF]" />
                  Target Sales Invoice <span className="text-red-500">*</span>
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-[#6B7184] mt-0.5">
                  {receiptAllocations.length > 1
                    ? 'Select which allocated Sales Invoice to generate this Delivery Challan for:'
                    : 'Linked Sales Invoice for line items dispatch.'}
                </p>
              </div>

              <div className="w-full sm:w-80">
                {isLoadingReceipt ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-500 dark:text-[#6B7184] bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg">
                    <div className="w-3.5 h-3.5 border-2 border-zinc-900 dark:border-primary border-t-transparent rounded-full animate-spin" />
                    <span>Loading receipt allocations...</span>
                  </div>
                ) : receiptAllocations.length === 0 ? (
                  <div className="px-3 py-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-lg font-medium">
                    No linked Sales Invoice found on this receipt.
                  </div>
                ) : receiptAllocations.length === 1 ? (
                  <div className="px-3 py-1.5 text-xs font-semibold text-zinc-800 dark:text-[#E6E8EE] bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg flex items-center justify-between">
                    <span className="font-mono">{receiptAllocations[0].invoiceNumber || selectedSalesInvoiceId}</span>
                    {receiptAllocations[0].allocatedAmount !== undefined && (
                      <span className="text-[11px] text-indigo-600 dark:text-[#4C8DFF] font-bold">
                        Allocated: ₹{fmt(receiptAllocations[0].allocatedAmount)}
                      </span>
                    )}
                  </div>
                ) : (
                  <select
                    value={selectedSalesInvoiceId}
                    onChange={(e) => setSelectedSalesInvoiceId(e.target.value)}
                    disabled={isSubmittingInProgress}
                    className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-300 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C] text-zinc-800 dark:text-[#E6E8EE] outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10"
                  >
                    {receiptAllocations.map(a => {
                      const invId = a.salesInvoiceId || a.salesInvoice?.id;
                      const invNo = a.invoiceNumber || a.salesInvoice?.invoiceNumber || invId;
                      const allocAmt = a.allocatedAmount !== undefined ? ` (₹${fmt(a.allocatedAmount)})` : '';
                      return (
                        <option key={invId} value={invId}>
                          {invNo}{allocAmt}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>
            </div>
          )}

          {/* Invoice Load Error Banner */}
          {invoiceLoadError && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg flex items-start gap-2.5 text-red-800 dark:text-red-400 text-xs">
              <AlertCircle size={17} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <div>
                <p className="font-bold text-red-950 dark:text-red-300">Sales Invoice Error</p>
                <p className="mt-0.5 font-medium">{invoiceLoadError}</p>
              </div>
            </div>
          )}

          {/* Fully Dispatched Alert Banner */}
          {isAllFullyDispatched && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-lg flex items-start gap-2.5 text-amber-900 dark:text-amber-400 text-xs">
              <AlertCircle size={17} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-bold text-amber-950 dark:text-amber-300">
                  This {isReceiptMode ? 'Sales Invoice' : 'Sales Order'} has already been fully dispatched or reserved.
                </p>
                <p className="mt-0.5 text-amber-800 dark:text-amber-400">
                  All items have a remaining open quantity of 0. No additional Delivery Challan can be created.
                </p>
              </div>
            </div>
          )}

          {/* Backend / Submission Error Banner */}
          {submitError && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg flex items-start gap-2.5 text-red-800 dark:text-red-400 text-xs">
              <AlertCircle size={17} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <div>
                <p className="font-bold text-red-950 dark:text-red-300">Generation Error</p>
                <p className="mt-0.5 font-medium">{submitError}</p>
              </div>
            </div>
          )}

          {/* Cards: Customer, Date, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#161922] p-4 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] shadow-sm">
              <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#6B7184] mb-1">Customer</p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-[#E6E8EE] truncate" title={customerName}>{customerName}</p>
            </div>
            <div className="bg-white dark:bg-[#161922] p-4 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] shadow-sm">
              <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#6B7184] mb-1">Date</p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-[#E6E8EE]">{displayDate}</p>
            </div>
            <div className="bg-white dark:bg-[#161922] p-4 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] shadow-sm">
              <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#6B7184] mb-1">Status</p>
              <div>
                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-md border inline-flex items-center ${
                  isStatusConfirmed 
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40' 
                    : 'bg-zinc-100 dark:bg-[#222736] text-zinc-700 dark:text-[#A0A6B5] border-zinc-200 dark:border-[#2A2F3D]'
                }`}>
                  {orderStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Warehouse Selection Section */}
          <DeliveryChallanWarehouseSelect
            selectedWarehouseId={selectedWarehouseId}
            onWarehouseChange={handleWarehouseChange}
            isSubmittingInProgress={isSubmittingInProgress}
            isStatusConfirmed={isStatusConfirmed}
            validationErrors={validationErrors}
            availableWarehouses={availableWarehouses}
            stockWarehouses={stockWarehouses}
            isLoadingStock={isLoadingStock}
            isLoadingWarehouses={isLoadingWarehouses}
            isStockError={isStockError}
            stockQueryError={stockQueryError}
            refetchStock={refetchStock}
            selectedWhObj={selectedWhObj}
            locations={locations}
          />

          {/* Dispatch Items Table */}
          <DeliveryChallanItemsTable
            items={items}
            isSourceLoading={isSourceLoading}
            isReceiptMode={isReceiptMode}
            selectedWarehouseId={selectedWarehouseId}
            locations={locations}
            isLoadingStock={isLoadingStock}
            isLoadingLocations={isLoadingLocations}
            isStatusConfirmed={isStatusConfirmed}
            isSubmittingInProgress={isSubmittingInProgress}
            onLocationChange={handleLocationChange}
            onQtyChange={handleQtyChange}
          />
          
          {/* Validation & Error Alerts */}
          {hasExcessStockError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg flex items-start gap-2 text-red-700 dark:text-red-400 text-xs">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <p className="font-medium">Dispatch quantity cannot exceed available stock for any item.</p>
            </div>
          )}

          {hasExcessOrderError && !hasExcessStockError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg flex items-start gap-2 text-red-700 dark:text-red-400 text-xs">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <p className="font-medium">Dispatch quantity cannot exceed pending order quantity for any item.</p>
            </div>
          )}

          {hasMissingLocation && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg flex items-start gap-2 text-red-700 dark:text-red-400 text-xs">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <p className="font-medium">Please select a warehouse location for each item being dispatched.</p>
            </div>
          )}


        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] flex items-center justify-between rounded-b-xl shrink-0">
          <div className="text-sm text-zinc-500 dark:text-[#6B7184]">
            Total Dispatch Items: <span className="font-bold text-zinc-900 dark:text-[#E6E8EE]">{totalDispatchItems}</span>
            {totalDispatchQty > 0 && (
              <span className="text-xs text-zinc-400 dark:text-[#6B7184] ml-1.5 font-normal">
                (Total Qty: <span className="font-semibold text-zinc-700 dark:text-[#A0A6B5]">{fmt(totalDispatchQty)}</span>)
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmittingInProgress}
              className="px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-[#E6E8EE] bg-white dark:bg-[#1D212C] border border-zinc-300 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmittingInProgress || isSourceLoading || isLoadingWarehouses || isLoadingStock}
              className="px-5 py-2 text-sm font-semibold text-white bg-zinc-900 dark:bg-primary rounded-lg hover:bg-zinc-800 dark:hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-xs"
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
          </div>
        </div>

      </div>
    </div>

    {/* ── Confirmation Popup (rendered after successful DC creation) ── */}
    <DeliveryChallanConfirmModal
      isOpen={Boolean(dcConfirmPopup)}
      dcNumber={dcConfirmPopup?.dcNumber}
      isConfirming={isConfirming}
      confirmError={confirmError}
      onCancelDraft={() => {
        dispatch(addAlert({ type: 'success', message: 'Delivery Challan saved as Draft' }));
        const res = dcConfirmPopup?.originalRes;
        setDcConfirmPopup(null);
        setConfirmError(null);
        if (onSuccess && res) onSuccess(res);
        onClose();
      }}
      onConfirm={async () => {
        setConfirmError(null);
        try {
          const confirmRes = await confirmDeliveryChallan({
            id: dcConfirmPopup.dcId,
            companyId: activeCompanyId,
          }).unwrap();

          // 1. Success toast notification
          dispatch(addAlert({ type: 'success', message: 'Delivery Challan confirmed successfully.' }));

          // 2. Extract confirmed delivery challan and invoice IDs
          const confirmedChallanId = dcConfirmPopup?.dcId || confirmRes?.data?.id || confirmRes?.id;
          const confirmedChallanNumber = dcConfirmPopup?.dcNumber || confirmRes?.data?.dcNumber || confirmRes?.data?.deliveryChallanNumber || confirmRes?.dcNumber;
          const confirmedInvoiceId = dcConfirmPopup?.invoiceId || confirmRes?.data?.salesInvoiceId || confirmRes?.data?.invoiceId || confirmRes?.salesInvoiceId || confirmRes?.invoiceId || selectedSalesInvoiceId || salesInvoiceData?.id;
          const confirmedInvoiceNumber = dcConfirmPopup?.invoiceNumber || confirmRes?.data?.salesInvoiceNumber || confirmRes?.data?.invoiceNumber || confirmRes?.salesInvoiceNumber || confirmRes?.invoiceNumber || salesInvoiceData?.invoiceNumber;
          const confirmedCustomerName = dcConfirmPopup?.customerName || confirmRes?.data?.customerName || confirmRes?.customerName || customerName;
          const originalRes = dcConfirmPopup?.originalRes;

          const payloadData = {
            dcId: confirmedChallanId,
            deliveryChallanId: confirmedChallanId,
            dcNumber: confirmedChallanNumber,
            deliveryChallanNumber: confirmedChallanNumber,
            invoiceId: confirmedInvoiceId,
            confirmedInvoiceId: confirmedInvoiceId,
            invoiceNumber: confirmedInvoiceNumber,
            customerName: confirmedCustomerName,
            originalRes,
          };

          // 3. Close the intermediate DC confirm dialog and open Invoice Actions Popup
          setDcConfirmPopup(null);
          setInvoiceActionsData(payloadData);
          setIsInvoiceActionsModalOpen(true);
        } catch (err) {
          const msg = err?.data?.message || err?.data?.error || err?.message || 'Failed to confirm Delivery Challan. Please try again.';
          setConfirmError(msg);
          dispatch(addAlert({ type: 'error', message: msg }));
        }
      }}
    />

    {/* ── Invoice Actions Popup (rendered automatically after successful delivery confirmation) ── */}
    {isInvoiceActionsModalOpen && (
      <DeliveryInvoiceActionsModal
        isOpen={isInvoiceActionsModalOpen}
        onClose={() => {
          setIsInvoiceActionsModalOpen(false);
          const originalRes = invoiceActionsData?.originalRes;
          setInvoiceActionsData(null);
          if (onSuccess && originalRes) onSuccess(originalRes);
          onClose();
        }}
        companyId={activeCompanyId}
        dcId={invoiceActionsData?.dcId}
        deliveryChallanId={invoiceActionsData?.dcId}
        dcNumber={invoiceActionsData?.dcNumber}
        deliveryChallanNumber={invoiceActionsData?.dcNumber}
        invoiceId={invoiceActionsData?.invoiceId}
        confirmedInvoiceId={invoiceActionsData?.invoiceId}
        invoiceNumber={invoiceActionsData?.invoiceNumber}
        customerName={invoiceActionsData?.customerName}
        onComplete={() => {
          setIsInvoiceActionsModalOpen(false);
          const originalRes = invoiceActionsData?.originalRes;
          setInvoiceActionsData(null);
          if (onSuccess && originalRes) onSuccess(originalRes);
          onClose();
        }}
      />
    )}
  </>
  );
}
