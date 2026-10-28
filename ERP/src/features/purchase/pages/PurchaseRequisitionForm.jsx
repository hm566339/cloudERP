import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Plus, Trash2, Save, Send, AlertCircle, RefreshCw, FileText, Printer, X, Package, Search, Loader2, AlertTriangle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { purchaseRequisitionsApi } from '../../../api/account';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { selectCurrentUser, selectSessionStatus } from '../../auth/authSlice';
import { addAlert } from '../../notifications/notificationSlice';
import ErrorState from '../../../components/common/ErrorState';
import { PageLoader } from '../../../components/common/SkeletonLoader';
import { useRoutePath } from '../../../hooks/useRoutePath';
import CustomSelect from '../../../components/common/CustomSelect';
import { productsApi } from '../../../api/inventory/products';
import { warehousesApi } from '../../../api/inventory/warehouses';
import { warehouseLocationsApi } from '../../../api/inventory/warehouseLocations';
import { unitOfMeasuresApi } from '../../../api/inventory/unitOfMeasures';
import ProductForm from '../../inventory/components/ProductForm';
import PurchaseRequisitionSidebar from '../components/PurchaseRequisitionSidebar';
import PurchaseRequisitionItemsTable from '../components/PurchaseRequisitionItemsTable';

const EMPTY_ITEM = {
  itemId: '',
  productId: '',
  itemName: '',
  description: '',
  itemType: 'PRODUCT',
  requestedQuantity: 0,
  estimatedUnitPrice: 0,
  unit: '',
  requiredDate: '',
  warehouseId: '',
  locationId: '',
  remarks: '',
};

const getTodayLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getApiErrorMessage = (err, fallback) => {
  const status = err?.response?.status;
  const backendMessage = err?.response?.data?.message || err?.response?.data?.error;
  if (status === 400) return backendMessage || 'Please check the entered details and try again.';
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 500) return 'Something went wrong on the server. Please try again.';
  return backendMessage || err?.message || fallback;
};

export default function PurchaseRequisitionForm() {
  const { id } = useParams();
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const dispatch = useAppDispatch();

  const isEditing = !!id;

  const [formData, setFormData] = useState({
    requesterId: '',
    requisitionName: '',
    departmentId: '',
    costCenterId: '',
    requiredDate: getTodayLocalDate(),
    priority: 'MEDIUM',
    purpose: '',
    remarks: '',
    location: '',
  });

  const [items, setItems] = useState([{ ...EMPTY_ITEM, requiredDate: getTodayLocalDate() }]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingType, setSubmittingType] = useState(null);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const isDirtyRef = useRef(false);

  const [initialProducts, setInitialProducts] = useState([]);
  const [initialProductsLoaded, setInitialProductsLoaded] = useState(false);
  const [productSearchResults, setProductSearchResults] = useState([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const initialProductsLoadRef = useRef(false);
  const productSearchIdRef = useRef(0);

  const [initialUoms, setInitialUoms] = useState([]);
  const initialUomsLoadRef = useRef(false);
  const uomSearchIdRef = useRef(0);

  const [initialWarehouses, setInitialWarehouses] = useState([]);
  const initialWarehousesLoadRef = useRef(false);
  const warehouseSearchIdRef = useRef(0);

  const locationsByWarehouseIdRef = useRef({});
  const locationSearchIdRef = useRef(0);

  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [warehouseSearchResults, setWarehouseSearchResults] = useState([]);
  const [isSearchingWarehouses, setIsSearchingWarehouses] = useState(false);
  const [warehouseSearchTerm, setWarehouseSearchTerm] = useState('');
  const [locationSearchResults, setLocationSearchResults] = useState([]);
  const [isSearchingLocations, setIsSearchingLocations] = useState(false);
  const [locationSearchTerm, setLocationSearchTerm] = useState('');
  const [uomSearchResults, setUomSearchResults] = useState([]);
  const [isSearchingUoms, setIsSearchingUoms] = useState(false);
  const [uomSearchTerm, setUomSearchTerm] = useState('');

  const { data: existingData, isLoading: isLoadingExisting } = useApiQuery(
    purchaseRequisitionsApi.getById,
    id,
    { enabled: !!id }
  );

  const currentUser = useAppSelector(selectCurrentUser);
  const sessionStatus = useAppSelector(selectSessionStatus);

  const meUserId = currentUser?.id || currentUser?.userId || currentUser?.user_id || currentUser?.uuid || currentUser?.sub || currentUser?.uid || '';
  const meDisplayName = currentUser?.fullName || currentUser?.username || '';
  const isMeLoading = sessionStatus === 'checking';
  const requesterReady = Boolean(meUserId);
  const requesterError = !requesterReady && !isMeLoading;

  useEffect(() => {
    if (existingData && isEditing) {
      const raw = existingData?.data?.data || existingData?.data || existingData;
      setFormData({
        requesterId: raw.requesterId || '',
        requisitionName: meDisplayName,
        departmentId: raw.departmentId || '',
        costCenterId: raw.costCenterId || '',
        requiredDate: raw.requiredDate || getTodayLocalDate(),
        priority: raw.priority || 'MEDIUM',
        purpose: raw.purpose || '',
        remarks: raw.remarks || '',
        location: raw.location || '',
      });
      if (raw.items && raw.items.length > 0) {
        setItems(raw.items.map(item => ({
          itemId: item.itemId || '',
          productId: item.productId || '',
          itemName: item.itemName || '',
          description: item.description || '',
          itemType: item.itemType || 'PRODUCT',
          requestedQuantity: item.requestedQuantity || item.quantity || '',
          estimatedUnitPrice: item.estimatedUnitPrice || 0,
          unit: item.unit || '',
          requiredDate: item.requiredDate || getTodayLocalDate(),
          warehouseId: item.warehouseId || '',
          locationId: item.locationId || '',
          remarks: item.remarks || item.specifications || '',
        })));
      }
    }
  }, [existingData, isEditing]);

  useEffect(() => {
    if (requesterReady) {
      setFormData(prev => (prev.requesterId ? prev : { ...prev, requesterId: meUserId }));
    }
  }, [requesterReady, meUserId]);

  useEffect(() => {
    if (initialProductsLoadRef.current) return;
    initialProductsLoadRef.current = true;
    (async () => {
      try {
        const result = await productsApi.getList({}, { page: 0, size: 100 });
        const data = result?.data || [];
        setInitialProducts(data);
        setProductSearchResults(data);
        setInitialProductsLoaded(true);
      } catch {
        setInitialProductsLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (initialUomsLoadRef.current) return;
    initialUomsLoadRef.current = true;
    (async () => {
      try {
        const result = await unitOfMeasuresApi.getList({}, { page: 0, size: 100 });
        const data = result?.data || [];
        setInitialUoms(data);
        setUomSearchResults(data);
      } catch {
        /* empty */
      }
    })();
  }, []);

  useEffect(() => {
    if (initialWarehousesLoadRef.current) return;
    initialWarehousesLoadRef.current = true;
    (async () => {
      try {
        const result = await warehousesApi.getList({}, { page: 0, size: 100 });
        const data = result?.data || [];
        setInitialWarehouses(data);
        setWarehouseSearchResults(data);
      } catch {
        /* empty */
      }
    })();
  }, []);

  const searchProducts = useCallback(async (term) => {
    if (!term || !term.trim()) {
      setProductSearchResults(initialProducts);
      setIsSearchingProducts(false);
      return;
    }
    const searchId = ++productSearchIdRef.current;
    setIsSearchingProducts(true);
    try {
      const result = await productsApi.getList({ searchKey: term.trim() }, { page: 0, size: 20 });
      if (searchId === productSearchIdRef.current) {
        setProductSearchResults(result?.data || []);
      }
    } catch {
      if (searchId === productSearchIdRef.current) {
        setProductSearchResults([]);
      }
    } finally {
      if (searchId === productSearchIdRef.current) {
        setIsSearchingProducts(false);
      }
    }
  }, [initialProducts]);

  const handleProductSearch = useCallback((term) => {
    setProductSearchTerm(term);
    searchProducts(term);
  }, [searchProducts]);

  const handleProductSelect = (index, productId) => {
    if (!productId) {
      isDirtyRef.current = true;
      setItems(prev => prev.map((item, i) => i === index ? {
        ...item,
        productId: '',
        itemId: '',
        itemName: '',
        description: '',
        itemType: 'PRODUCT',
        unit: '',
      } : item));
      return;
    }
    const product = productSearchResults.find(p => p.id === productId)
      || initialProducts.find(p => p.id === productId);
    if (product) {
      isDirtyRef.current = true;
      const typeMap = { GOODS: 'PRODUCT', SERVICE: 'SERVICE', NON_INVENTORY: 'PRODUCT' };
      setItems(prev => prev.map((item, i) => i === index ? {
        ...item,
        productId: product.id,
        itemId: product.id,
        itemName: product.productName || '',
        description: product.description || '',
        itemType: typeMap[product.productType] || 'PRODUCT',
        unit: product.baseUomCode || '',
      } : item));
      setErrors(prev => {
        const next = { ...prev };
        delete next[`item_${index}_itemName`];
        return next;
      });
    }
  };

  const handleOpenCreateProduct = (searchTerm) => {
    setNewProductName(searchTerm || '');
    setIsCreateProductOpen(true);
  };

  const handleCreateProduct = async (payload) => {
    setIsCreatingProduct(true);
    try {
      const result = await productsApi.create(payload);
      const newProduct = result?.data || result;
      if (!newProduct?.id) throw new Error('Product created but no ID returned');

      const duplicateRow = items.findIndex(item =>
        (item.productId && item.productId === newProduct.id) ||
        (item.itemId && item.itemId === newProduct.id)
      );
      if (duplicateRow >= 0) {
        dispatch(addAlert({
          type: 'warning',
          message: `Product "${newProduct.productName}" is already in the requisition at row ${duplicateRow + 1}`
        }));
        setIsCreateProductOpen(false);
        setNewProductName('');
        return;
      }

      setItems(prev => {
        const updated = [...prev];
        const lastItem = updated[updated.length - 1];
        if (lastItem && !lastItem.productId && !lastItem.itemId && !lastItem.itemName) {
          updated[updated.length - 1] = {
            ...lastItem,
            productId: newProduct.id,
            itemId: newProduct.id,
            itemName: newProduct.productName || '',
            description: newProduct.description || '',
            itemType: newProduct.productType === 'SERVICE' ? 'SERVICE' : 'PRODUCT',
            unit: newProduct.baseUomCode || '',
          };
        } else {
          updated.push({
            ...EMPTY_ITEM,
            requiredDate: formData.requiredDate,
            productId: newProduct.id,
            itemId: newProduct.id,
            itemName: newProduct.productName || '',
            description: newProduct.description || '',
            itemType: newProduct.productType === 'SERVICE' ? 'SERVICE' : 'PRODUCT',
            unit: newProduct.baseUomCode || '',
          });
        }
        return updated;
      });

      dispatch(addAlert({ type: 'success', message: `Product "${newProduct.productName}" created and selected` }));
      setIsCreateProductOpen(false);
      setNewProductName('');
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || err?.message || 'Failed to create product' }));
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const searchWarehouses = useCallback(async (term) => {
    if (!term || !term.trim()) {
      setWarehouseSearchResults(initialWarehouses);
      setIsSearchingWarehouses(false);
      return;
    }
    const searchId = ++warehouseSearchIdRef.current;
    setIsSearchingWarehouses(true);
    try {
      const result = await warehousesApi.getList({ searchKey: term.trim() }, { page: 0, size: 20 });
      if (searchId === warehouseSearchIdRef.current) {
        setWarehouseSearchResults(result?.data || []);
      }
    } catch {
      if (searchId === warehouseSearchIdRef.current) {
        setWarehouseSearchResults([]);
      }
    } finally {
      if (searchId === warehouseSearchIdRef.current) {
        setIsSearchingWarehouses(false);
      }
    }
  }, [initialWarehouses]);

  const handleWarehouseSearch = useCallback((term) => {
    setWarehouseSearchTerm(term);
    searchWarehouses(term);
  }, [searchWarehouses]);

  const fetchLocationsForWarehouse = useCallback(async (warehouseId) => {
    if (!warehouseId) return;
    if (locationsByWarehouseIdRef.current[warehouseId]) {
      setLocationSearchResults(locationsByWarehouseIdRef.current[warehouseId]);
      return;
    }
    const searchId = ++locationSearchIdRef.current;
    setIsSearchingLocations(true);
    try {
      const result = await warehouseLocationsApi.getList({ warehouseId }, { page: 0, size: 100 });
      const data = result?.data || [];
      if (searchId === locationSearchIdRef.current) {
        locationsByWarehouseIdRef.current[warehouseId] = data;
        setLocationSearchResults(data);
      }
    } catch {
      if (searchId === locationSearchIdRef.current) {
        setLocationSearchResults([]);
      }
    } finally {
      if (searchId === locationSearchIdRef.current) {
        setIsSearchingLocations(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!isEditing || !existingData) return;
    const raw = existingData?.data?.data || existingData?.data || existingData;
    if (raw.items) {
      const warehouseIds = [...new Set(raw.items.map(i => i.warehouseId).filter(Boolean))];
      warehouseIds.forEach(wid => {
        if (!locationsByWarehouseIdRef.current[wid]) {
          fetchLocationsForWarehouse(wid);
        }
      });
    }
  }, [existingData, isEditing, fetchLocationsForWarehouse]);

  const searchLocations = useCallback(async (term, warehouseId) => {
    if (!term || !term.trim()) {
      if (warehouseId && locationsByWarehouseIdRef.current[warehouseId]) {
        setLocationSearchResults(locationsByWarehouseIdRef.current[warehouseId]);
      } else {
        setLocationSearchResults([]);
      }
      setIsSearchingLocations(false);
      return;
    }
    const searchId = ++locationSearchIdRef.current;
    setIsSearchingLocations(true);
    try {
      const filter = {};
      if (warehouseId) filter.warehouseId = warehouseId;
      filter.searchKey = term.trim();
      const result = await warehouseLocationsApi.getList(filter, { page: 0, size: 20 });
      if (searchId === locationSearchIdRef.current) {
        setLocationSearchResults(result?.data || []);
      }
    } catch {
      if (searchId === locationSearchIdRef.current) {
        setLocationSearchResults([]);
      }
    } finally {
      if (searchId === locationSearchIdRef.current) {
        setIsSearchingLocations(false);
      }
    }
  }, []);

  const handleLocationSearch = useCallback((term, warehouseId) => {
    setLocationSearchTerm(term);
    searchLocations(term, warehouseId);
  }, [searchLocations]);

  const searchUoms = useCallback(async (term) => {
    if (!term || !term.trim()) {
      setUomSearchResults(initialUoms);
      setIsSearchingUoms(false);
      return;
    }
    const searchId = ++uomSearchIdRef.current;
    setIsSearchingUoms(true);
    try {
      const result = await unitOfMeasuresApi.getList({ searchKey: term.trim() }, { page: 0, size: 20 });
      if (searchId === uomSearchIdRef.current) {
        setUomSearchResults(result?.data || []);
      }
    } catch {
      if (searchId === uomSearchIdRef.current) {
        setUomSearchResults([]);
      }
    } finally {
      if (searchId === uomSearchIdRef.current) {
        setIsSearchingUoms(false);
      }
    }
  }, [initialUoms]);

  const handleUomSearch = useCallback((term) => {
    setUomSearchTerm(term);
    searchUoms(term);
  }, [searchUoms]);

  const createMutation = useApiMutation(purchaseRequisitionsApi.create);
  const updateMutation = useApiMutation(purchaseRequisitionsApi.update);
  const submitMutation = useApiMutation(purchaseRequisitionsApi.submit);

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

  const handleItemChange = (index, field, value) => {
    isDirtyRef.current = true;
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
    if (errors[`item_${index}_${field}`]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[`item_${index}_${field}`];
        return next;
      });
    }
  };

  const addItem = () => {
    setItems(prev => [...prev, { ...EMPTY_ITEM, requiredDate: formData.requiredDate }]);
  };

  const removeItem = (index) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.requisitionName || !formData.requisitionName.trim()) newErrors.requisitionName = 'Requisition name is mandatory';
    if (!formData.requiredDate) newErrors.requiredDate = 'Required date is mandatory';
    if (!formData.priority) newErrors.priority = 'Priority is mandatory';
    if (!formData.purpose || !formData.purpose.trim()) newErrors.purpose = 'Purpose is mandatory';

    if (items.length === 0) {
      newErrors.items = 'At least one item is required';
    } else {
      items.forEach((item, idx) => {
        if (!item.itemId && !item.productId && (!item.itemName || !item.itemName.trim())) newErrors[`item_${idx}_itemName`] = 'Product selection is required';
        if (!item.requestedQuantity || Number(item.requestedQuantity) <= 0) newErrors[`item_${idx}_requestedQuantity`] = 'Quantity must be greater than 0';
        if (!item.unit || !item.unit.trim()) newErrors[`item_${idx}_unit`] = 'Unit is required';
        if (!item.requiredDate) newErrors[`item_${idx}_requiredDate`] = 'Required date is required';
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = () => {
    const processedItems = items
      .filter(item => item.itemId || item.productId || (item.itemName && item.itemName.trim()))
      .map(item => ({
        itemId: item.itemId || item.productId || undefined,
        itemName: item.itemName || '',
        description: item.description || '',
        itemType: item.itemType || 'PRODUCT',
        requestedQuantity: Number(item.requestedQuantity) || 0,
        unit: item.unit || '',
        estimatedUnitPrice: Number(item.estimatedUnitPrice) || 0,
        requiredDate: item.requiredDate || formData.requiredDate,
        warehouseId: item.warehouseId || undefined,
        locationId: item.locationId || undefined,
        remarks: item.remarks || '',
      }));

    const data = {
      requesterId: formData.requesterId || undefined,
      requisitionName: formData.requisitionName,
      requiredDate: formData.requiredDate,
      priority: formData.priority,
      purpose: formData.purpose,
      remarks: formData.remarks || '',
      items: processedItems,
    };

    if (formData.departmentId && formData.departmentId.trim()) {
      data.departmentId = formData.departmentId.trim();
    }
    if (formData.costCenterId && formData.costCenterId.trim()) {
      data.costCenterId = formData.costCenterId.trim();
    }

    return { data };
  };

  const handleSaveDraft = async () => {
    if (isSubmitting) return;
    if (!requesterReady) {
      dispatch(addAlert({ type: 'error', message: 'Could not identify the current user. Please refresh the page and try again.' }));
      return;
    }
    const valid = validate();
    if (!valid) {
      dispatch(addAlert({ type: 'error', message: 'Please fix validation errors before saving.' }));
      return;
    }
    setIsSubmitting(true);
    setSubmittingType('draft');
    try {
      const payload = buildPayload();
      if (isEditing) {
        await updateMutation.mutateAsync([id, payload, companyId]);
        dispatch(addAlert({ type: 'success', message: 'Requisition updated successfully' }));
        isDirtyRef.current = false;
        navigate(buildPath('/accounts/transactions/purchase-requisitions'));
      } else {
        await createMutation.mutateAsync([payload, companyId]);
        dispatch(addAlert({
          type: 'success',
          message: 'Purchase requisition saved as draft successfully.'
        }));
        isDirtyRef.current = false;
        // Stay on the same New Purchase Requisition form - do NOT redirect or close
      }
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: getApiErrorMessage(err, 'Failed to save requisition') }));
    } finally {
      setIsSubmitting(false);
      setSubmittingType(null);
    }
  };

  const handleSaveAndSubmit = async () => {
    if (isSubmitting) return;
    if (!requesterReady) {
      dispatch(addAlert({ type: 'error', message: 'Could not identify the current user. Please refresh the page and try again.' }));
      return;
    }
    const valid = validate();
    if (!valid) {
      dispatch(addAlert({ type: 'error', message: 'Please fix validation errors before submitting.' }));
      return;
    }
    setIsSubmitting(true);
    setSubmittingType('submit');
    try {
      const payload = buildPayload();
      let result;
      if (isEditing) {
        result = await updateMutation.mutateAsync([id, payload, companyId]);
        await submitMutation.mutateAsync([id, companyId]);
        dispatch(addAlert({
          type: 'success',
          message: 'Purchase requisition submitted successfully.'
        }));
        isDirtyRef.current = false;
        navigate(buildPath('/accounts/transactions/purchase-requisitions'));
      } else {
        result = await createMutation.mutateAsync([payload, companyId]);
        const resData = result?.data?.data || result?.data || result;
        const newId = resData?.id || result?.id || result?.data?.id;
        if (newId) {
          await submitMutation.mutateAsync([newId, companyId]);
        }
        dispatch(addAlert({
          type: 'success',
          message: 'Purchase requisition submitted successfully.'
        }));
        isDirtyRef.current = false;
        // Stay on the same New Purchase Requisition form - do NOT redirect or close
      }
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: getApiErrorMessage(err, 'Failed to submit requisition') }));
    } finally {
      setIsSubmitting(false);
      setSubmittingType(null);
    }
  };

  const handleCancel = () => {
    if (isDirtyRef.current) {
      setShowDiscardModal(true);
    } else {
      navigate(buildPath('/accounts/transactions/purchase-requisitions'));
    }
  };

  if (isEditing && isLoadingExisting) return <PageLoader message="Loading requisition..." />;

  if (isEditing && !existingData) {
    return (
      <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
        <ErrorState
          title="Requisition Not Found"
          message="The requested purchase requisition could not be found."
          onRetry={() => navigate(buildPath('/accounts/transactions/purchase-requisitions'))}
        />
      </div>
    );
  }

  /* ── Shared style tokens (mirror Create Quotation / QuotationFormModal) ── */
  const sidebarCard = 'flex-none border border-zinc-200 dark:border-border-dark rounded-lg p-2.5 bg-white dark:bg-card-dark shadow-2xs space-y-1.5';
  const cardHead = 'flex items-center justify-between pb-1 border-b border-zinc-100 dark:border-[#2A2F3D]';
  const cardTitle = 'text-[8px] font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider';
  const label = 'text-[8px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1';
  const field = (hasErr = false) =>
    `input-field w-full h-8 text-[8.8px] text-zinc-700 dark:text-zinc-200 bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border-dark ${hasErr ? 'border-rose-300 dark:border-rose-500' : ''}`;
  const errText = 'text-[7.2px] text-rose-600 dark:text-rose-400 mt-0.5 font-medium';
  const btnSecondary = 'px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md hover:bg-zinc-50 dark:hover:bg-[#222736] shadow-xs transition-colors flex items-center gap-2';
  const btnPrimary = 'px-4 py-2 text-xs font-bold text-white bg-primary rounded-md hover:bg-primary/90 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2';
  const colTemplate = 'grid-cols-[3%_13%_11%_8%_8%_8%_11%_10%_10%_12%_6%]';

  return (
    <div className="flex flex-col h-full bg-white dark:bg-page-dark animate-fade-in">

      {/* ═══════════════════════════════════════════════════════════════════
          PAGE HEADER (same structure as Create Quotation)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap xl:flex-nowrap items-center gap-4 p-3 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1D212C]/50 flex-none">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={handleCancel}
            className="p-1.5 flex-none text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-[#222736] transition-colors"
            title="Back"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex flex-col min-w-0">
            <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-100 truncate">
              {isEditing ? 'Edit Purchase Requisition' : 'New Purchase Requisition'}
            </h2>
            <div className="text-[8px] text-zinc-500 dark:text-zinc-400 font-medium truncate">
              {isEditing ? 'Update requisition details and items' : 'Create a new internal request for equipment and services'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-none">
          <button
            type="button"
            onClick={handleCancel}
            className="p-1.5 flex-none text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-[#222736] transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN WORKSPACE: LEFT SIDEBAR | RIGHT CONTENT (like Create Quotation)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 dark:divide-border-dark bg-white dark:bg-page-dark">

        {/* ── LEFT COLUMN (~230px) ── */}
        <PurchaseRequisitionSidebar
          formData={formData}
          handleFieldChange={handleFieldChange}
          errors={errors}
          items={items}
          meUserId={meUserId}
          meDisplayName={meDisplayName}
          isMeLoading={isMeLoading}
          requesterError={requesterError}
        />

        {/* ── RIGHT COLUMN: REQUESTED ITEMS + REQUEST SUMMARY ── */}
        <div className="w-full flex-1 flex flex-col overflow-y-auto min-h-0 bg-white dark:bg-page-dark">

          <PurchaseRequisitionItemsTable
            items={items}
            errors={errors}
            addItem={addItem}
            removeItem={removeItem}
            handleItemChange={handleItemChange}
            handleProductSelect={handleProductSelect}
            handleProductSearch={handleProductSearch}
            setProductSearchTerm={setProductSearchTerm}
            productSearchResults={productSearchResults}
            setProductSearchResults={setProductSearchResults}
            initialProducts={initialProducts}
            isSearchingProducts={isSearchingProducts}
            handleOpenCreateProduct={handleOpenCreateProduct}
            handleUomSearch={handleUomSearch}
            isSearchingUoms={isSearchingUoms}
            uomSearchResults={uomSearchResults}
            handleWarehouseSearch={handleWarehouseSearch}
            isSearchingWarehouses={isSearchingWarehouses}
            warehouseSearchResults={warehouseSearchResults}
            handleLocationSearch={handleLocationSearch}
            isSearchingLocations={isSearchingLocations}
            locationSearchResults={locationSearchResults}
            setLocationSearchResults={setLocationSearchResults}
            locationsByWarehouseIdRef={locationsByWarehouseIdRef}
            fetchLocationsForWarehouse={fetchLocationsForWarehouse}
          />

          {/* 3. Request Summary (non-financial, pinned to bottom of right column) */}
          <div className="p-4 border-t border-zinc-200 dark:border-border-dark bg-zinc-50/40 dark:bg-transparent mt-auto flex-none">
            <div className="bg-white dark:bg-card-dark p-3.5 rounded-xl border border-zinc-200 dark:border-border-dark flex flex-col justify-between shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-[#2A2F3D]">
                <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Request Summary</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[9.6px]">
                  <span className="text-zinc-600 dark:text-zinc-400 font-medium">Total Items</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{items.length}</span>
                </div>
                <div className="flex justify-between items-center text-[9.6px]">
                  <span className="text-zinc-600 dark:text-zinc-400 font-medium">Pending Approval</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">0</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          BOTTOM ACTION BAR (fixed at bottom of page)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex justify-between items-center p-3 border-t border-zinc-200 dark:border-border-dark bg-zinc-100 dark:bg-card-dark flex-none">
        <div className="flex items-center gap-6 px-2">
          <button type="button" className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer" onClick={() => window.print()}>
            <FileText size={14} /> Download PDF
          </button>
          <button type="button" className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer" onClick={() => window.print()}>
            <Printer size={14} /> Print Requisition
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleCancel} disabled={isSubmitting} className={btnSecondary}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className={btnSecondary}
          >
            {isSubmitting && submittingType === 'draft' ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Save Draft</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleSaveAndSubmit}
            disabled={isSubmitting}
            className={btnPrimary}
          >
            {isSubmitting && submittingType === 'submit' ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Saving &amp; Submitting...</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>Save &amp; Submit</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          DISCARD CONFIRMATION MODAL
      ═══════════════════════════════════════════════════════════════════ */}
      {showDiscardModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm bg-white dark:bg-card-dark rounded-xl shadow-xl border border-zinc-200 dark:border-border-dark p-6 animate-fade-in">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Discard unsaved changes?</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Your changes will be lost if you leave without saving.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setShowDiscardModal(false)}
                className="btn-secondary h-8 px-3 text-[11px]"
              >
                Stay
              </button>
              <button
                onClick={() => navigate(buildPath('/accounts/transactions/purchase-requisitions'))}
                className="btn-primary h-8 px-3 text-[11px]"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          CREATE NEW PRODUCT MODAL
      ═══════════════════════════════════════════════════════════════════ */}
      {isCreateProductOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-card-dark w-full max-w-2xl h-[95vh] max-h-[95vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200 dark:border-border-dark">
            <div className="flex justify-between items-center px-5 py-4 border-b border-zinc-200 dark:border-border-dark bg-zinc-50/80 dark:bg-card-dark shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-surface-dark flex items-center justify-center border border-zinc-200 dark:border-border-dark text-zinc-700 dark:text-zinc-200">
                  <Package size={16} />
                </div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">New Product</h2>
              </div>
              <button
                onClick={() => { setIsCreateProductOpen(false); setNewProductName(''); }}
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-hover-dark transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-white dark:bg-card-dark flex flex-col">
              <ProductForm
                initialData={{ productName: newProductName }}
                onSubmit={handleCreateProduct}
                onCancel={() => { setIsCreateProductOpen(false); setNewProductName(''); }}
                isLoading={isCreatingProduct}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}