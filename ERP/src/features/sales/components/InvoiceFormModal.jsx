import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, Package, AlertCircle, Printer, Loader2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useGetActiveCustomersQuery, useCreateCustomerMutation, useGetCustomerByIdQuery } from '../../../api/sales-crm';
import { useGetHsnSacsQuery, useGetGstSlabsQuery, useGetGstStatesQuery, useGetGstRegistrationsQuery } from '../../../api/account/accounting.api';
import { fetchHsnSacs, selectHsnSacItems } from '../../account/store/hsnSacSlice';
import { useGetGroupedStockQuery, useGetProductsQuery } from '../../../api/inventory/inventory.api';
import { productsApi } from '../../../api/inventory/products';
import CustomerCombobox from './CustomerCombobox';
import CustomerFormModal from '../../account/components/CustomerFormModal';
import HsnSacSelect from '../../../components/common/HsnSacSelect';
import HsnSacFormModal from '../../finance/components/HsnSacFormModal';
import CustomSelect from '../../../components/common/CustomSelect';
import useDebounce from '../../../hooks/useDebounce';
import ProductForm from '../../inventory/components/ProductForm';
import ConfirmModal from '../../../components/common/ConfirmModal';
import { salesInvoicesApi } from '../../../api/account/salesInvoices';
import { useGetPaymentTermsQuery, useGetTermsConditionsQuery, useGetDeliveryTermsQuery } from '../../../api/sales-crm/salesSettings.api';
import { addAlert } from '../../notifications/notificationSlice';
import PrintPreviewModal from './PrintPreviewModal';

import TransactionForm from '../../../components/erp/TransactionForm/TransactionForm';
import invoiceFormConfig from '../configs/invoiceFormConfig';
import InvoiceLineItemRow from './InvoiceLineItemRow';



export default function InvoiceFormModal({ isOpen, onClose, onSubmit, initialData, isSubmitting }) {
  const dispatch = useDispatch();
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
  const authUser = JSON.parse(localStorage.getItem("auth_user")) || {};
  const isSystemAdmin = authUser?.roles?.includes('ROLE_SYSTEM_ADMIN') || authUser?.roles?.includes('ROLE_SUPER_ADMIN') || authUser?.role === 'SYSTEM_ADMIN';

  const { data: customersData, refetch: refetchCustomers } = useGetActiveCustomersQuery(companyId, { skip: !isOpen });
  const customers = Array.isArray(customersData) ? customersData : customersData?.data || customersData?.content || [];

  // Redux store HSN/SAC items
  const reduxHsnItems = useSelector(selectHsnSacItems) || [];

  // RTK Query HSN/SAC items
  const { data: hsnApiData } = useGetHsnSacsQuery({ companyId, size: 1000 }, { skip: !isOpen });
  const { data: gstSlabsData } = useGetGstSlabsQuery(companyId, { skip: !isOpen });

  // Fetch full list of HSN/SACs on modal open
  useEffect(() => {
    if (isOpen && companyId) {
      dispatch(fetchHsnSacs({ companyId, page: 0, size: 1000 }));
    }
  }, [isOpen, companyId, dispatch]);

  const apiHsnList = useMemo(() => {
    if (Array.isArray(hsnApiData)) return hsnApiData;
    if (Array.isArray(hsnApiData?.data?.data?.hsnSacMasters)) return hsnApiData.data.data.hsnSacMasters;
    if (Array.isArray(hsnApiData?.data?.hsnSacMasters)) return hsnApiData.data.hsnSacMasters;
    if (Array.isArray(hsnApiData?.hsnSacMasters)) return hsnApiData.hsnSacMasters;
    if (Array.isArray(hsnApiData?.data?.content)) return hsnApiData.data.content;
    if (Array.isArray(hsnApiData?.data?.records)) return hsnApiData.data.records;
    if (Array.isArray(hsnApiData?.data)) return hsnApiData.data;
    if (Array.isArray(hsnApiData?.content)) return hsnApiData.content;
    return [];
  }, [hsnApiData]);

  const gstSlabs = useMemo(() => {
    if (Array.isArray(gstSlabsData)) return gstSlabsData;
    if (Array.isArray(gstSlabsData?.data?.gstSlabs)) return gstSlabsData.data.gstSlabs;
    if (Array.isArray(gstSlabsData?.data?.content)) return gstSlabsData.data.content;
    if (Array.isArray(gstSlabsData?.data)) return gstSlabsData.data;
    if (Array.isArray(gstSlabsData?.content)) return gstSlabsData.content;
    return [];
  }, [gstSlabsData]);

  const allHsnSacs = useMemo(() => {
    const map = new Map();
    [...apiHsnList, ...reduxHsnItems].forEach(item => {
      if (item && (item.id || item.code)) {
        map.set(String(item.id || item.code), item);
      }
    });
    return Array.from(map.values());
  }, [apiHsnList, reduxHsnItems]);

  const { data: gstStatesData } = useGetGstStatesQuery({ companyId, active: true, size: 100, pageSize: 100 }, { skip: !isOpen });
  const gstStates = useMemo(() => {
    if (Array.isArray(gstStatesData)) return gstStatesData;
    if (gstStatesData?.data?.records) return gstStatesData.data.records;
    if (gstStatesData?.records) return gstStatesData.records;
    if (gstStatesData?.data?.states) return gstStatesData.data.states;
    if (gstStatesData?.states) return gstStatesData.states;
    return [];
  }, [gstStatesData]);

  const { data: gstRegistrationsData } = useGetGstRegistrationsQuery({ companyId }, { skip: !isOpen });
  const gstRegistrations = Array.isArray(gstRegistrationsData) ? gstRegistrationsData : gstRegistrationsData?.data || gstRegistrationsData?.content || [];
  const defaultRegistration = gstRegistrations.find(r => r.isDefault || r.default) || gstRegistrations[0];

  const selectedCompany = JSON.parse(localStorage.getItem("selected_company")) || {};
  const authCompany = authUser?.company || {};
  const companyStateCode = (
    defaultRegistration?.stateCode?.stateCode ||
    (typeof defaultRegistration?.stateCode === 'string' ? defaultRegistration.stateCode : '') ||
    (defaultRegistration?.gstin ? defaultRegistration.gstin.substring(0, 2) : '') ||
    selectedCompany.stateCode ||
    (selectedCompany.gstin ? selectedCompany.gstin.substring(0, 2) : '') ||
    authCompany.stateCode ||
    (authCompany.gstin ? authCompany.gstin.substring(0, 2) : '') ||
    authUser.stateCode ||
    '10'
  );

  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const debouncedItemSearchTerm = useDebounce(itemSearchTerm, 500);

  const { data: ptData, isLoading: isLoadingPt, isError: isErrorPt } = useGetPaymentTermsQuery(
    { documentType: 'INVOICE', companyId },
    { skip: !isOpen || !companyId }
  );
  const { data: dtData, isLoading: isLoadingDt, isError: isErrorDt } = useGetDeliveryTermsQuery(
    { documentType: 'INVOICE', companyId },
    { skip: !isOpen || !companyId }
  );
  const { data: tcData, isLoading: isLoadingTc, isError: isErrorTc } = useGetTermsConditionsQuery(
    { documentType: 'INVOICE', companyId },
    { skip: !isOpen || !companyId }
  );


  const extractItems = (response) => {
    const result = response?.data ?? response;

    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.data)) return result.data;
    if (Array.isArray(result?.content)) return result.content;
    if (Array.isArray(result?.items)) return result.items;
    if (Array.isArray(result?.records)) return result.records;

    return [];
  };

  const paymentTermsList = useMemo(() => {
    const raw = extractItems(ptData);
    return raw.filter(item => item && item.isActive !== false && item.active !== false);
  }, [ptData]);

  const deliveryTermsList = useMemo(() => {
    const raw = extractItems(dtData);
    return raw.filter(item => item && item.isActive !== false && item.active !== false);
  }, [dtData]);

  const termsConditionsList = useMemo(() => {
    const raw = extractItems(tcData);
    return raw.filter(item => item && item.isActive !== false && item.active !== false);
  }, [tcData]);

  const defaultsInitializedRef = useRef({ pt: false, dt: false, tc: false });

  useEffect(() => {
    if (!isOpen) {
      defaultsInitializedRef.current = { pt: false, dt: false, tc: false };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || initialData?.id) return;

    if (!defaultsInitializedRef.current.pt && paymentTermsList.length > 0) {
      const defaultPt = paymentTermsList.find(pt => pt.isDefault === true || pt.default === true);
      if (defaultPt) {
        setFormData(prev => {
          if (prev.paymentTermId) return prev;
          return {
            ...prev,
            paymentTermId: defaultPt.id,
            paymentTerms: defaultPt.name || defaultPt.title || defaultPt.description || ''
          };
        });
      }
      defaultsInitializedRef.current.pt = true;
    }

    if (!defaultsInitializedRef.current.dt && deliveryTermsList.length > 0) {
      const defaultDt = deliveryTermsList.find(dt => dt.isDefault === true || dt.default === true);
      if (defaultDt) {
        setFormData(prev => {
          if (prev.deliveryTermId || prev.deliveryTerms) return prev;
          return {
            ...prev,
            deliveryTermId: defaultDt.id,
            deliveryTerms: defaultDt.name || defaultDt.title || defaultDt.description || ''
          };
        });
      }
      defaultsInitializedRef.current.dt = true;
    }

    if (!defaultsInitializedRef.current.tc && termsConditionsList.length > 0) {
      const defaultTc = termsConditionsList.find(tc => tc.isDefault === true || tc.default === true);
      if (defaultTc) {
        setFormData(prev => {
          if (prev.termsConditionId) return prev;
          return {
            ...prev,
            termsConditionId: defaultTc.id,
            termsAndConditions: defaultTc.content || defaultTc.description || defaultTc.title || defaultTc.name || ''
          };
        });
      }
      defaultsInitializedRef.current.tc = true;
    }
  }, [isOpen, initialData?.id, paymentTermsList, deliveryTermsList, termsConditionsList]);

  const [errors, setErrors] = useState({});

  const { data: allProductsData, isLoading: allProductsLoading } = useGetProductsQuery({ companyId, isSystemAdmin, searchKey: debouncedItemSearchTerm, page: 0, size: 200 }, { skip: !isOpen });
  const { data: stockData, isLoading: stockLoading } = useGetGroupedStockQuery({ companyId, isSystemAdmin, search: debouncedItemSearchTerm, page: 0, size: 200 }, { skip: !isOpen });
  const productsLoading = allProductsLoading || stockLoading;

  const masterProducts = useMemo(() => {
    if (Array.isArray(allProductsData)) return allProductsData;
    return allProductsData?.data?.content || allProductsData?.data?.records || allProductsData?.data || allProductsData?.content || [];
  }, [allProductsData]);

  const stockProducts = useMemo(() => {
    if (Array.isArray(stockData)) return stockData;
    return stockData?.data?.content || stockData?.data?.records || stockData?.data || stockData?.content || [];
  }, [stockData]);

  const products = useMemo(() => {
    const productMap = new Map();

    // 1. Populate from master products
    masterProducts.forEach(p => {
      if (!p) return;
      const id = p.id || p.productId;
      if (!id) return;
      productMap.set(String(id), {
        productId: id,
        id: id,
        productName: p.productName || p.name || '',
        productCode: p.productCode || p.code || '',
        sku: p.sku || '',
        description: p.description || '',
        sellingPrice: p.sellingPrice ?? p.pricing?.sellingPrice ?? p.standardCost ?? 0,
        standardCost: p.standardCost ?? 0,
        baseUomId: p.baseUomId || p.uom?.id,
        baseUomCode: p.baseUomCode || p.uom?.code || p.unit || 'PCS',
        baseUomName: p.baseUomName || p.uom?.name || '',
        hsnSacId: p.hsnSacId || p.hsnSac?.id || '',
        hsnSacCode: p.hsnSacCode || p.hsnSac?.code || '',
        hsnSacName: p.hsnSacName || p.hsnSac?.description || '',
        warehouses: []
      });
    });

    // 2. Enrich from grouped stock (warehouses, location stock)
    stockProducts.forEach(p => {
      if (!p) return;
      const id = p.productId || p.id || p.stockId;
      if (!id) return;
      const existing = productMap.get(String(id)) || {};
      productMap.set(String(id), {
        ...existing,
        productId: id,
        id: id,
        productName: p.productName || p.name || p.itemName || existing.productName || '',
        productCode: p.productCode || existing.productCode || '',
        sku: p.sku || existing.sku || '',
        description: p.description || existing.description || '',
        sellingPrice: p.sellingPrice ?? p.pricing?.sellingPrice ?? existing.sellingPrice ?? 0,
        baseUomCode: p.baseUomCode || p.uom?.code || p.unit || existing.baseUomCode || 'PCS',
        hsnSacId: p.hsnSacId || p.hsnSac?.id || existing.hsnSacId || '',
        hsnSacCode: p.hsnSacCode || p.hsnSac?.code || existing.hsnSacCode || '',
        hsnSacName: p.hsnSacName || p.hsnSac?.description || existing.hsnSacName || '',
        warehouses: (p.warehouses && p.warehouses.length > 0) ? p.warehouses : (existing.warehouses || []),
        totalQuantity: p.totalQuantity,
        availableQuantity: p.availableQuantity
      });
    });

    return Array.from(productMap.values());
  }, [masterProducts, stockProducts]);

  const [createCustomer] = useCreateCustomerMutation();
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [addHsnSacTargetRowId, setAddHsnSacTargetRowId] = useState(null);

  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [addItemTargetRowId, setAddItemTargetRowId] = useState(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  const [downloadPdfFlag, setDownloadPdfFlag] = useState(false);
  const [sendEmailFlag, setSendEmailFlag] = useState(false);
  const [formError, setFormError] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [printStatus, setPrintStatus] = useState('');

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  const [previewInvoiceNo, setPreviewInvoiceNo] = useState('');

  useEffect(() => {
    return () => {
      if (previewPdfUrl) {
        window.URL.revokeObjectURL(previewPdfUrl);
      }
    };
  }, [previewPdfUrl]);

  const handlePrint = async () => {
    setFormError('');
    let currentInvoiceId = initialData?.id || initialData?.invoiceId;

    if (!currentInvoiceId) {
      const payload = validateAndBuildPayload();
      if (!payload) return;

      setIsPrinting(true);
      setPrintStatus('Creating invoice...');

      try {
        currentInvoiceId = await onSubmit(payload, { print: true });
        if (!currentInvoiceId) {
          throw new Error('No invoice ID returned from creation');
        }
      } catch (err) {
        setIsPrinting(false);
        setPrintStatus('');
        return; // Parent handles the error alert
      }
    }

    setPrintStatus('Preparing print...');
    setIsPrinting(true);

    try {
      const response = await salesInvoicesApi.downloadPdf(currentInvoiceId, companyId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      setPreviewPdfUrl(url);
      setPreviewInvoiceNo(formData.invoiceNumber || currentInvoiceId);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error('Print error:', err);
      if (!initialData) {
        setFormError('Invoice created successfully, but PDF could not be prepared for printing.');
      } else {
        setFormError('Failed to fetch invoice PDF for printing.');
      }
    } finally {
      setIsPrinting(false);
      setPrintStatus('');
    }
  };

  const [formData, setFormData] = useState({
    customerId: '',
    deliveryAddressId: '',
    newDeliveryAddress: {
      addressLine1: '',
      addressLine2: '',
      city: '',
      gstStateId: '',
      country: 'India',
      postalCode: ''
    },
    saveNewDeliveryAddress: false,
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    invoiceCurrency: 'INR',
    exchangeRate: 1,
    placeOfSupplyStateId: '',
    transporter: '',
    transportDocNo: '',
    vehicleNo: '',
    notes: '',
    paymentTermId: '',
    paymentTerms: '',
    deliveryTermId: '',
    deliveryTerms: '',
    termsConditionId: '',
    termsAndConditions: '',
    receivedAmount: 0,
    freightCharges: 0,
    otherCharges: 0
  });

  const activeCustomer = useMemo(() => {
    if (!formData.customerId) return null;
    return customers.find(c => String(c.id) === String(formData.customerId)) || null;
  }, [customers, formData.customerId]);

  const { data: selectedCustomerData } = useGetCustomerByIdQuery({ id: formData.customerId, companyId }, { skip: !formData.customerId });
  const detailedCustomer = selectedCustomerData?.data || selectedCustomerData;
  const currentCustomer = detailedCustomer || activeCustomer;
  const rawAddresses = currentCustomer?.addresses || [];

  const customerAddresses = useMemo(() => {
    if (rawAddresses.length > 0) {
      return rawAddresses.map(a => ({ ...a, id: a.id || 'MASTER_ADDRESS' }));
    }
    if (currentCustomer?.addressLine1) {
      return [{
        id: 'MASTER_ADDRESS',
        addressLine1: currentCustomer.addressLine1,
        addressLine2: currentCustomer.addressLine2 || '',
        city: currentCustomer.city,
        state: currentCustomer.state || currentCustomer.gstStateName,
        postalCode: currentCustomer.postalCode,
        country: currentCustomer.country || 'India',
        isDefault: true
      }];
    }
    return [];
  }, [rawAddresses, currentCustomer]);

  // Track customer change to trigger auto-fill
  useEffect(() => {
    if (!formData.customerId || !currentCustomer) return;

    // 1. Auto-select Delivery Address
    if (customerAddresses.length > 0) {
      const defaultAddr = customerAddresses.find(a => a.isDefault && a.isActive !== false) || customerAddresses.find(a => a.isActive !== false) || customerAddresses[0];
      if (defaultAddr && defaultAddr.id) {
        setFormData(prev => ({
          ...prev,
          deliveryAddressId: defaultAddr.id
        }));
      }
    } else {
      setFormData(prev => {
        if (prev.deliveryAddressId && prev.deliveryAddressId !== 'NEW') return prev;
        return { ...prev, deliveryAddressId: '' };
      });
    }

    // Pre-fill newDeliveryAddress template with customer info if available
    const firstAddr = customerAddresses[0] || {};
    if (firstAddr.addressLine1 || currentCustomer.addressLine1) {
      setFormData(prev => ({
        ...prev,
        newDeliveryAddress: {
          addressLine1: firstAddr.addressLine1 || currentCustomer.addressLine1 || '',
          addressLine2: firstAddr.addressLine2 || currentCustomer.addressLine2 || '',
          city: firstAddr.city || currentCustomer.city || '',
          gstStateId: firstAddr.gstStateId || prev.newDeliveryAddress?.gstStateId || '',
          country: firstAddr.country || currentCustomer.country || 'India',
          postalCode: firstAddr.postalCode || currentCustomer.postalCode || ''
        }
      }));
    }

    // 2. Auto-select Place of Supply
    if (gstStates.length > 0) {
      let custStateCode = '';
      if (currentCustomer.gstin && currentCustomer.gstin.length >= 2) {
        custStateCode = currentCustomer.gstin.substring(0, 2);
      } else if (currentCustomer.stateCode) {
        custStateCode = String(currentCustomer.stateCode);
      } else if (firstAddr.gstStateCode) {
        custStateCode = String(firstAddr.gstStateCode);
      }

      let matched = null;
      if (custStateCode) {
        const cleanCode = custStateCode.trim();
        matched = gstStates.find(s => 
          String(s.stateCode).trim() === cleanCode || 
          String(s.stateCode).trim() === cleanCode.padStart(2, '0') ||
          String(s.code).trim() === cleanCode
        );
      }

      if (!matched) {
        const stateName = currentCustomer.state || currentCustomer.stateName || firstAddr.state || firstAddr.gstStateName;
        if (stateName) {
          const lower = String(stateName).trim().toLowerCase();
          matched = gstStates.find(s => 
            String(s.stateName || s.name || '').trim().toLowerCase() === lower ||
            String(s.displayName || '').toLowerCase().includes(lower)
          );
        }
      }

      if (matched && matched.id) {
        setFormData(prev => ({
          ...prev,
          placeOfSupplyStateId: matched.id
        }));
      }
    }

    // 3. Auto-fill payment terms if customer has specific terms
    if (currentCustomer.paymentTermId) {
      setFormData(prev => ({ ...prev, paymentTermId: currentCustomer.paymentTermId }));
    }
  }, [formData.customerId, currentCustomer, customerAddresses, gstStates]);

  const [items, setItems] = useState([
    {
      id: Date.now(),
      itemId: '',
      warehouseId: '',
      locationId: '',
      batchId: '',
      hsnSacId: '',
      hsnSacCode: '',
      itemName: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discountPercentage: 0,
      unit: 'PCS'
    }
  ]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          customerId: initialData.customerId || '',
          deliveryAddressId: initialData.deliveryAddressId || '',
          newDeliveryAddress: {
            addressLine1: '',
            addressLine2: '',
            city: '',
            gstStateId: '',
            country: 'India',
            postalCode: ''
          },
          saveNewDeliveryAddress: false,
          invoiceNumber: initialData.invoiceNumber || '',
          invoiceDate: initialData.invoiceDate || new Date().toISOString().split('T')[0],
          dueDate: initialData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          invoiceCurrency: initialData.invoiceCurrency || 'INR',
          exchangeRate: initialData.exchangeRate || 1,
          placeOfSupplyStateId: initialData.placeOfSupplyStateId || initialData.placeOfSupply || '',
          transporter: initialData.transporter || '',
          transportDocNo: initialData.transportDocNo || '',
          vehicleNo: initialData.vehicleNo || '',
          notes: initialData.notes || initialData.remarks || '',
          paymentTermId: initialData.paymentTermId || (initialData.paymentTerms ? 'CUSTOM' : ''),
          paymentTerms: initialData.paymentTerms || '',
          deliveryTermId: initialData.deliveryTermId || (initialData.deliveryTerms ? 'CUSTOM' : ''),
          deliveryTerms: initialData.deliveryTerms || '',
          termsConditionId: initialData.termsConditionId || (initialData.termsAndConditions ? 'CUSTOM' : ''),
          termsAndConditions: initialData.termsAndConditions || '',
          receivedAmount: initialData.receivedAmount || 0,
          freightCharges: initialData.freightCharges || 0,
          otherCharges: initialData.otherCharges || 0
        });

        const rawItems = initialData.items || initialData.lineItems || [];
        if (rawItems.length > 0) {
          setItems(rawItems.map(i => ({
            id: i.id || Date.now() + Math.random(),
            itemId: i.itemId || '',
            warehouseId: i.warehouseId || '',
            locationId: i.locationId || '',
            batchId: i.batchId || '',
            hsnSacId: i.hsnSacId || i.hsnSacMaster?.id || '',
            hsnSacCode: i.hsnSacCode || i.hsnSacMaster?.code || '',
            itemName: i.itemName || '',
            description: i.description || '',
            quantity: i.quantity || 1,
            unitPrice: i.unitPrice || 0,
            discountPercentage: i.discountPercentage || 0,
            unit: i.unit || 'PCS'
          })));
        } else {
          setItems([{ id: Date.now(), itemId: '', warehouseId: '', locationId: '', batchId: '', hsnSacId: '', itemName: '', description: '', quantity: 1, unitPrice: 0, discountPercentage: 0, unit: 'PCS' }]);
        }
      } else {
        setFormData({
          customerId: '',
          deliveryAddressId: '',
          newDeliveryAddress: {
            addressLine1: '',
            addressLine2: '',
            city: '',
            gstStateId: '',
            country: 'India',
            postalCode: ''
          },
          saveNewDeliveryAddress: false,
          invoiceNumber: '',
          invoiceDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          invoiceCurrency: 'INR',
          exchangeRate: 1,
          placeOfSupplyStateId: '',
          transporter: '',
          transportDocNo: '',
          vehicleNo: '',
          notes: '',
          paymentTermId: '',
          paymentTerms: '',
          deliveryTermId: '',
          deliveryTerms: '',
          termsConditionId: '',
          termsAndConditions: '',
          receivedAmount: 0,
          freightCharges: 0,
          otherCharges: 0
        });
        setItems([{ id: Date.now(), itemId: '', warehouseId: '', locationId: '', batchId: '', hsnSacId: '', itemName: '', description: '', quantity: 1, unitPrice: 0, discountPercentage: 0, unit: 'PCS' }]);
      }
    }
  }, [isOpen, initialData]);

  const handleAddItem = () => {
    setItems(prevItems => [
      ...prevItems,
      { id: Date.now() + Math.random(), itemId: '', warehouseId: '', locationId: '', batchId: '', hsnSacId: '', hsnSacCode: '', itemName: '', description: '', quantity: 1, unitPrice: 0, discountPercentage: 0, unit: 'PCS' }
    ]);
  };

  const resolvedBuyerStateCode = useMemo(() => {
    const placeOfSupplyState = gstStates.find(s => String(s.id) === String(formData.placeOfSupplyStateId) || String(s.stateCode) === String(formData.placeOfSupplyStateId));
    const selectedCustomerAddress = customerAddresses.find(a => String(a.id) === String(formData.deliveryAddressId));

    let code = '';
    if (placeOfSupplyState?.stateCode) {
      code = String(placeOfSupplyState.stateCode).trim();
    } else if (formData.placeOfSupplyStateId) {
      const codeMatch = String(formData.placeOfSupplyStateId).match(/^(\d{1,2})/);
      if (codeMatch) {
        code = codeMatch[1].padStart(2, '0');
      }
    }

    if (!code && selectedCustomerAddress) {
      const custState = gstStates.find(s =>
        String(s.id) === String(selectedCustomerAddress.gstStateId) ||
        String(s.name).toLowerCase() === String(selectedCustomerAddress.city || '').toLowerCase() ||
        String(s.name).toLowerCase() === String(selectedCustomerAddress.state || '').toLowerCase()
      );
      if (custState?.stateCode) {
        code = String(custState.stateCode).trim();
      }
    }

    if (!code && currentCustomer?.gstin) {
      code = currentCustomer.gstin.substring(0, 2);
    }

    if (!code) {
      code = String(companyStateCode).trim();
    }

    return code;
  }, [formData.placeOfSupplyStateId, formData.deliveryAddressId, gstStates, customerAddresses, currentCustomer, companyStateCode]);

  function resolveHsnTaxRates(item) {
    const rawCode = String(item.hsnSacCode || '').split('-')[0].trim();
    const rawId = String(item.hsnSacId || '').trim();

    let hsnMaster = allHsnSacs.find(h => {
      const hCode = String(h.code || '').split('-')[0].trim();
      const hId = String(h.id || '').trim();
      return (rawId && hId && hId === rawId) ||
        (rawCode && hCode && (hCode === rawCode || hCode.startsWith(rawCode) || rawCode.startsWith(hCode)));
    });

    if (!hsnMaster && item.hsnSac) hsnMaster = item.hsnSac;
    if (!hsnMaster && item.stockProduct?.hsnSac) hsnMaster = item.stockProduct.hsnSac;

    let cgstRate = Number(item.cgstRate ?? hsnMaster?.cgstRate ?? 0);
    let sgstRate = Number(item.sgstRate ?? hsnMaster?.sgstRate ?? 0);
    let igstRate = Number(item.igstRate ?? hsnMaster?.igstRate ?? 0);

    if (cgstRate === 0 && sgstRate === 0 && igstRate === 0 && hsnMaster?.gstSlabId) {
      const slab = gstSlabs.find(s => String(s.id) === String(hsnMaster.gstSlabId));
      if (slab) {
        cgstRate = Number(slab.cgstRate ?? 0);
        sgstRate = Number(slab.sgstRate ?? 0);
        igstRate = Number(slab.igstRate ?? 0);
      }
    }

    if (cgstRate === 0 && sgstRate === 0 && igstRate === 0) {
      const slabName = hsnMaster?.gstSlabName || hsnMaster?.slabName || '';
      const match = String(slabName).match(/(\d+(\.\d+)?)/);
      if (match) {
        const totalRate = parseFloat(match[1]);
        if (totalRate > 0) {
          igstRate = totalRate;
          cgstRate = totalRate / 2;
          sgstRate = totalRate / 2;
        }
      }
    }

    if (cgstRate === 0 && sgstRate === 0 && igstRate === 0 && (rawCode || rawId)) {
      cgstRate = 9;
      sgstRate = 9;
      igstRate = 18;
    }

    return { cgstRate, sgstRate, igstRate };
  }

  function calculateItemGst({ taxableAmount, cgstRate, sgstRate, igstRate, sellerStateCode, buyerStateCode }) {
    const sellerState = String(sellerStateCode ?? "").trim();
    const buyerState = String(buyerStateCode ?? "").trim();
    const amount = Number(taxableAmount || 0);

    const isIntraState = Boolean(sellerState && buyerState && sellerState === buyerState);

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    const numCgst = Number(cgstRate || 0);
    const numSgst = Number(sgstRate || 0);
    let numIgst = Number(igstRate || 0);

    if (numIgst === 0 && (numCgst > 0 || numSgst > 0)) {
      numIgst = numCgst + numSgst;
    }

    if (isIntraState) {
      cgstAmount = (amount * numCgst) / 100;
      sgstAmount = (amount * numSgst) / 100;
      igstAmount = 0;
    } else {
      cgstAmount = 0;
      sgstAmount = 0;
      igstAmount = (amount * numIgst) / 100;
    }

    return {
      isInterState: !isIntraState,
      cgstRate: isIntraState ? numCgst : 0,
      sgstRate: isIntraState ? numSgst : 0,
      igstRate: isIntraState ? 0 : numIgst,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalTax: cgstAmount + sgstAmount + igstAmount
    };
  }

  const recalculateTaxes = (currentItems) => {
    return currentItems.map(item => {
      let updated = { ...item };
      const qty = parseFloat(updated.quantity) || 0;
      const price = parseFloat(updated.unitPrice) || 0;
      const discPct = parseFloat(updated.discountPercentage) || 0;
      const grossAmount = qty * price;
      updated.discountAmount = (grossAmount * discPct) / 100;
      updated.taxableAmount = grossAmount - updated.discountAmount;

      if (!updated.hsnSacId && !updated.hsnSacCode) {
        updated.cgstRate = 0; updated.sgstRate = 0; updated.igstRate = 0;
        updated.cgstAmount = 0; updated.sgstAmount = 0; updated.igstAmount = 0; updated.cessAmount = 0;
        updated.taxAmount = 0; updated.totalAmount = updated.taxableAmount;
        updated.isInterState = false;
        return updated;
      }

      const rates = resolveHsnTaxRates(updated);
      const taxResult = calculateItemGst({
        taxableAmount: updated.taxableAmount,
        cgstRate: rates.cgstRate,
        sgstRate: rates.sgstRate,
        igstRate: rates.igstRate,
        sellerStateCode: companyStateCode,
        buyerStateCode: resolvedBuyerStateCode
      });

      updated.isInterState = taxResult.isInterState;
      updated.cgstRate = taxResult.cgstRate;
      updated.sgstRate = taxResult.sgstRate;
      updated.igstRate = taxResult.igstRate;
      updated.cgstAmount = taxResult.cgstAmount;
      updated.sgstAmount = taxResult.sgstAmount;
      updated.igstAmount = taxResult.igstAmount;
      updated.cessAmount = 0;
      updated.taxAmount = taxResult.totalTax;
      updated.totalAmount = updated.taxableAmount + updated.taxAmount;

      return updated;
    });
  };

  useEffect(() => {
    if (items.length > 0 && resolvedBuyerStateCode && companyStateCode) {
      setItems(prev => recalculateTaxes(prev));
    }
  }, [resolvedBuyerStateCode, companyStateCode, allHsnSacs, gstSlabs]);

  const calculatedTotals = useMemo(() => {
    let subtotal = 0;
    let tax = 0;

    items.forEach(item => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const discPct = parseFloat(item.discountPercentage) || 0;
      const grossAmount = qty * price;
      const discAmt = (grossAmount * discPct) / 100;
      subtotal += (grossAmount - discAmt);
      tax += (parseFloat(item.taxAmount) || 0);
    });

    const freight = parseFloat(formData.freightCharges) || 0;
    const other = parseFloat(formData.otherCharges) || 0;

    const totalBeforeRoundOff = subtotal + freight + other + tax;
    const grandTotal = Math.round(totalBeforeRoundOff);
    const roundOff = grandTotal - totalBeforeRoundOff;

    return {
      taxableAmount: subtotal,
      subtotal,
      tax,
      roundOff,
      grandTotal
    };
  }, [items, formData.freightCharges, formData.otherCharges]);

  const handleRemoveItem = (id) => {
    setItems(prevItems => {
      let nextItems = prevItems.filter(item => item.id !== id);
      if (nextItems.length === 0) {
        nextItems.push({ id: Date.now() + Math.random(), itemId: '', warehouseId: '', locationId: '', batchId: '', hsnSacId: '', hsnSacCode: '', itemName: '', description: '', quantity: 1, unitPrice: 0, discountPercentage: 0, unit: 'PCS' });
      }
      return recalculateTaxes(nextItems);
    });
  };

  const handleItemChange = (id, field, value) => {
    if (id === 'SEARCH' && field === 'itemSearch') {
      setItemSearchTerm(value);
      return;
    }

    setItems(prevItems => {
      let nextItems = prevItems.map(item => {
        if (item.id === id) {
          if (field === 'warehouseSelection' || field === 'locationSelection') {
            return { ...item, ...value };
          }
          if (field === 'hsnSelection') {
            return { ...item, ...value };
          }
          let updatedItem = { ...item, [field]: value };
          if (field === 'itemId') {
            if (value) {
              const selectedProduct = products.find(p => String(p.productId) === String(value) || String(p.id) === String(value));

              if (selectedProduct) {
                updatedItem.itemName = selectedProduct.productName || selectedProduct.name || '';
                updatedItem.description = selectedProduct.description || selectedProduct.productName || '';
                updatedItem.unitPrice = Number(selectedProduct.sellingPrice ?? selectedProduct.standardCost ?? 0);
                if (!updatedItem.quantity || Number(updatedItem.quantity) <= 0) {
                  updatedItem.quantity = 1;
                }
                updatedItem.discountPercentage = updatedItem.discountPercentage || 0;
                updatedItem.unit = selectedProduct.baseUomCode || selectedProduct.unit || 'PCS';

                const rawHsnCode = selectedProduct.hsnSacCode || selectedProduct.hsnSac?.code || '';
                const cleanHsnCode = String(rawHsnCode).split('-')[0].trim().substring(0, 15);
                updatedItem.hsnSacId = selectedProduct.hsnSacId || '';
                updatedItem.hsnSacCode = cleanHsnCode;
                updatedItem.hsnSacName = selectedProduct.hsnSacName || selectedProduct.hsnSac?.description || '';

                // Find matching HSN master to attach tax rates immediately
                const matchedHsn = allHsnSacs.find(h =>
                  (selectedProduct.hsnSacId && String(h.id) === String(selectedProduct.hsnSacId)) ||
                  (cleanHsnCode && String(h.code || '').split('-')[0].trim() === cleanHsnCode)
                );
                if (matchedHsn) {
                  updatedItem.hsnSac = matchedHsn;
                  updatedItem.hsnSacId = matchedHsn.id || updatedItem.hsnSacId;
                  updatedItem.cgstRate = matchedHsn.cgstRate;
                  updatedItem.sgstRate = matchedHsn.sgstRate;
                  updatedItem.igstRate = matchedHsn.igstRate;
                } else if (cleanHsnCode) {
                  // Fallback standard rate if HSN master not explicitly registered
                  updatedItem.cgstRate = 9;
                  updatedItem.sgstRate = 9;
                  updatedItem.igstRate = 18;
                }

                let defaultWarehouseId = '';
                let defaultLocationId = '';
                let defaultBatchId = '';

                if (selectedProduct.warehouses && selectedProduct.warehouses.length > 0) {
                  const firstWhs = selectedProduct.warehouses[0];
                  defaultWarehouseId = firstWhs.warehouseId || firstWhs.id || '';

                  if (firstWhs.locations && firstWhs.locations.length > 0) {
                    const firstLoc = firstWhs.locations[0];
                    defaultLocationId = firstLoc.locationId || firstLoc.id || '';
                    defaultBatchId = firstLoc.batchId || '';
                  }
                }

                updatedItem.warehouseId = defaultWarehouseId;
                updatedItem.locationId = defaultLocationId;
                updatedItem.batchId = defaultBatchId;
                updatedItem.stockProduct = selectedProduct;
                updatedItem.isStockLoading = false;
              }
            } else {
              updatedItem.itemName = '';
              updatedItem.description = '';
              updatedItem.unitPrice = 0;
              updatedItem.quantity = 1;
              updatedItem.discountPercentage = 0;
              updatedItem.unit = 'PCS';
              updatedItem.hsnSacId = '';
              updatedItem.hsnSacCode = '';
              updatedItem.hsnSacName = '';
              updatedItem.warehouseId = '';
              updatedItem.locationId = '';
              updatedItem.batchId = '';
              updatedItem.stockProduct = null;
            }
          }
          return updatedItem;
        }
        return item;
      });

      if (field === 'itemId' && nextItems[nextItems.length - 1].itemId) {
        nextItems.push({ id: Date.now() + Math.random(), itemId: '', warehouseId: '', locationId: '', batchId: '', hsnSacId: '', hsnSacCode: '', itemName: '', description: '', quantity: 1, unitPrice: 0, discountPercentage: 0, unit: 'PCS' });
      }
      return recalculateTaxes(nextItems);
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value
    }));
  };

  const validateAndBuildPayload = () => {
    const validationErrors = {};
    if (!formData.customerId) { validationErrors.customerId = 'Customer is required'; }
    if (!formData.invoiceDate) { validationErrors.invoiceDate = 'Invoice Date is required'; }
    if (!formData.dueDate) { validationErrors.dueDate = 'Due Date is required'; }
    if (!formData.placeOfSupplyStateId) { validationErrors.placeOfSupplyStateId = 'Place of Supply is required'; }

    if (formData.paymentTermId === 'CUSTOM' && !formData.paymentTerms?.trim()) {
      validationErrors.paymentTerms = 'Custom payment terms are required';
    }
    if (formData.deliveryTermId === 'CUSTOM' && !formData.deliveryTerms?.trim()) {
      validationErrors.deliveryTerms = 'Custom delivery terms are required';
    }
    if (formData.termsConditionId === 'CUSTOM' && !formData.termsAndConditions?.trim()) {
      validationErrors.termsAndConditions = 'Custom terms & conditions are required';
    }

    const validItems = items.filter(i => i.itemId && String(i.itemId).trim() !== '');
    if (validItems.length === 0) { validationErrors.items = 'Please select a product for the invoice.'; }

    if (validItems.some(i => parseFloat(i.quantity) <= 0 || parseFloat(i.unitPrice) < 0 || parseFloat(i.discountPercentage) < 0 || parseFloat(i.discountPercentage) > 100)) {
      validationErrors.items = 'Please fill all line item details correctly, including Quantity > 0, Price >= 0, and Disc % between 0-100.';
    }

    if (formData.deliveryAddressId === 'NEW') {
      const { addressLine1, city, gstStateId, country, postalCode } = formData.newDeliveryAddress || {};
      const hasAnyField = Boolean(addressLine1?.trim() || city?.trim() || gstStateId || postalCode?.trim());
      if (hasAnyField && (!addressLine1?.trim() || !city?.trim() || !gstStateId || !country?.trim() || !postalCode?.trim())) {
        validationErrors.deliveryAddressId = 'Please fill all required fields for the New Delivery Address (Street, City, State, Country, Postal Code).';
      }
    }

    const exchangeRateVal = parseFloat(formData.exchangeRate);
    if (!exchangeRateVal || exchangeRateVal <= 0) { validationErrors.exchangeRate = 'Exchange Rate must be greater than 0.'; }

    const receivedAmountVal = parseFloat(formData.receivedAmount) || 0;
    if (isNaN(receivedAmountVal) || receivedAmountVal < 0) { validationErrors.receivedAmount = 'Received Amount must be 0 or greater.'; }

    if (formData.invoiceDate && formData.dueDate) {
      if (new Date(formData.dueDate) < new Date(formData.invoiceDate)) {
        validationErrors.dueDate = 'Due Date cannot be earlier than Invoice Date.';
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstError = Object.values(validationErrors)[0];
      setFormError(firstError);
      dispatch(addAlert({ type: 'error', message: firstError }));
      return null;
    }
    setErrors({});

    const invoiceData = {
      customerId: formData.customerId,
      invoiceDate: formData.invoiceDate,
      dueDate: formData.dueDate,
      invoiceCurrency: formData.invoiceCurrency || 'INR',
      exchangeRate: exchangeRateVal,
      receivedAmount: receivedAmountVal,
      freightCharges: Number(formData.freightCharges || 0),
      otherCharges: Number(formData.otherCharges || 0),
      placeOfSupplyStateId: formData.placeOfSupplyStateId,
      transporter: formData.transporter || null,
      transportDocNo: formData.transportDocNo || null,
      vehicleNo: formData.vehicleNo || null,
      notes: formData.notes || null,
      paymentTermId: (formData.paymentTermId && formData.paymentTermId !== 'CUSTOM' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formData.paymentTermId)) ? formData.paymentTermId : null,
      paymentTerms: formData.paymentTerms || null,
      deliveryTerms: formData.deliveryTerms || null,
      termsConditionId: (formData.termsConditionId && formData.termsConditionId !== 'CUSTOM' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formData.termsConditionId)) ? formData.termsConditionId : null,
      termsAndConditions: formData.termsAndConditions || null,
      items: validItems.map(item => {
        const isUuid = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
        const rawHsn = item.hsnSacCode || item.hsnSac?.code || item.hsnSacId || '99';
        const cleanHsn = String(rawHsn).split('-')[0].trim().substring(0, 15) || '99';

        const outItem = {
          itemId: isUuid(item.itemId) ? item.itemId : null,
          hsnSacCode: cleanHsn,
          itemName: item.itemName || null,
          description: item.description || null,
          quantity: parseFloat(item.quantity) || 1,
          unitPrice: parseFloat(item.unitPrice) || 0,
          discountPercentage: parseFloat(item.discountPercentage) || 0,
          unit: item.unit || 'PCS',
          warehouseId: isUuid(item.warehouseId) ? item.warehouseId : null,
          locationId: isUuid(item.locationId) ? item.locationId : null
        };
        // Include id only if it's a real UUID (for invoice line item updates)
        if (isUuid(item.id)) {
          outItem.id = item.id;
        }
        return outItem;
      })
    };

    // Optional fields - only include when applicable
    if (formData.invoiceNumber) invoiceData.invoiceNumber = formData.invoiceNumber;

    // Delivery address: existing UUID vs new address (mutually exclusive)
    const isAddressUuid = typeof formData.deliveryAddressId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formData.deliveryAddressId);
    if (isAddressUuid) {
      invoiceData.deliveryAddressId = formData.deliveryAddressId;
    } else if (formData.deliveryAddressId === 'NEW') {
      const { addressLine1, city, country } = formData.newDeliveryAddress || {};
      if (addressLine1?.trim() && city?.trim() && country?.trim()) {
        invoiceData.newDeliveryAddress = formData.newDeliveryAddress;
      }
    }

    return { data: invoiceData };
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setFormError('');
    const payload = validateAndBuildPayload();
    if (!payload) return;

    onSubmit(payload, { downloadPdf: downloadPdfFlag, sendEmail: sendEmailFlag }, calculatedTotals);
  };



  const handleFieldChange = (key, value) => {
    if (key === 'downloadPdf') { setDownloadPdfFlag(value); return; }
    if (key === 'sendEmail') { setSendEmailFlag(value); return; }
    if (key === 'customerId') {
      const activeCust = customers.find(c => String(c.id) === String(value));
      setFormData(prev => {
        const next = {
          ...prev,
          customerId: value,
          deliveryAddressId: ''
        };
        if (activeCust?.gstin && gstStates.length > 0) {
          const code = activeCust.gstin.substring(0, 2);
          const match = gstStates.find(s => String(s.stateCode).trim() === code || String(s.stateCode).trim() === code.padStart(2, '0'));
          if (match) next.placeOfSupplyStateId = match.id;
        }
        return next;
      });
      return;
    }
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const selectField = (field, options, placeholder, onValueChange = null, customKey = null, isLoading = false, isError = false) => {
    const selectOptions = [
      ...options.map(opt => ({
        value: opt.value,
        label: opt.label,
        text: opt.text
      })),
      { value: 'CUSTOM', label: 'Custom' }
    ];

    const placeholderText = isLoading
      ? 'Loading...'
      : isError
        ? 'Failed to load options'
        : (placeholder || 'Select an option');

    return {
      ...field,
      options: selectOptions,
      placeholder: placeholderText,
      render: ({ value, setValue, formValues, setFormValue, disabled, errors }) => {
        const currentVal = value || '';
        const currentCustom = formValues?.[customKey] ?? formData[customKey] ?? '';
        const customError = errors?.[customKey];

        return (
          <div className="flex flex-col gap-1 w-full">
            {field.label && (
              <label className="block text-[8.5px] font-semibold text-zinc-700 mb-0.5">
                {field.label}{field.required ? ' *' : ''}
              </label>
            )}
            <CustomSelect
              value={currentVal}
              options={selectOptions}
              placeholder={placeholderText}
              onChange={e => {
                const val = e.target.value;
                if (onValueChange) {
                  onValueChange(val, setValue, setFormValue, formValues);
                } else {
                  setValue(val);
                  if (customKey) {
                    if (val === 'CUSTOM') {
                      if (setFormValue) setFormValue(customKey, '');
                      setFormData(prev => ({ ...prev, [field.key]: val, [customKey]: '' }));
                    } else {
                      const selected = selectOptions.find(opt => String(opt.value) === String(val));
                      const textVal = selected?.text || selected?.label || '';
                      if (setFormValue) setFormValue(customKey, textVal);
                      setFormData(prev => ({ ...prev, [field.key]: val, [customKey]: textVal }));
                    }
                  }
                }
              }}
              disabled={disabled || isLoading}
              className="w-full"
              buttonClassName="w-full h-8 px-2.5 border border-zinc-200 dark:border-[#2A2F3D] rounded-md bg-white dark:bg-[#1D212C] text-[10px] text-zinc-800 dark:text-[#E6E8EE] flex items-center justify-between outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10"
            />
            {currentVal === 'CUSTOM' && customKey && (
              <div className="flex flex-col gap-1 mt-1">
                <textarea
                  value={currentCustom}
                  onChange={e => {
                    if (setFormValue) setFormValue(customKey, e.target.value);
                    setFormData(prev => ({ ...prev, [customKey]: e.target.value }));
                  }}
                  disabled={disabled}
                  placeholder={`Enter custom ${field.label?.toLowerCase() || 'terms'}...`}
                  className={`w-full h-auto py-2 px-2.5 border rounded-md bg-white dark:bg-[#1D212C] text-[10px] text-zinc-800 dark:text-[#E6E8EE] outline-none focus:ring-1 disabled:bg-zinc-50 dark:disabled:bg-[#161922] disabled:text-zinc-400 dark:disabled:text-[#6B7184] resize-y min-h-[60px] ${customError
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-zinc-200 dark:border-[#2A2F3D] focus:border-zinc-400 focus:ring-zinc-900/10'
                    }`}
                />
                {customError && <p className="text-[8px] text-rose-500">{customError}</p>}
              </div>
            )}
          </div>
        );
      }
    };
  };

  const transactionConfig = {
    ...invoiceFormConfig,
    header: {
      ...invoiceFormConfig.header,
      fields: invoiceFormConfig.header.fields.map(field => {
        if (field.key === 'invoiceDate' || field.key === 'dueDate') {
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
          ...invoiceFormConfig.sidebar.sections[0],
          fields: invoiceFormConfig.sidebar.sections[0].fields.map(f => {
            if (f.key === 'customerId') {
              return {
                ...f,
                render: () => (
                  <div className="relative">
                    <label className="block text-xs font-bold text-zinc-800 dark:text-[#E6E8EE] tracking-wide mb-1">Customer <span className="text-rose-500">*</span></label>
                    <CustomerCombobox
                      value={formData.customerId}
                      onChange={(val, custObj) => {
                        setFormData(prev => {
                          const next = { ...prev, customerId: val, deliveryAddressId: '' };
                          const targetCust = custObj || customers.find(c => String(c.id) === String(val));
                          if (targetCust?.gstin && gstStates.length > 0) {
                            const code = targetCust.gstin.substring(0, 2);
                            const match = gstStates.find(s => String(s.stateCode).trim() === code || String(s.stateCode).trim() === code.padStart(2, '0'));
                            if (match) next.placeOfSupplyStateId = match.id;
                          }
                          return next;
                        });
                      }}
                      onAddNewCustomer={() => setIsAddCustomerOpen(true)}
                      error={!formData.customerId && isSubmitting}
                    />
                  </div>
                )
              };
            }
            if (f.key === 'deliveryAddressId') {
              return {
                ...f,
                render: () => (
                  <div className="space-y-2">
                    <label className="block text-[8px] font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">Delivery Address</label>
                    <CustomSelect
                      className="w-full"
                      buttonClassName="w-full h-8 px-2.5 border border-zinc-200 dark:border-[#2A2F3D] rounded-md bg-white dark:bg-[#1D212C] text-[10px] text-zinc-800 dark:text-[#E6E8EE] flex items-center justify-between outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10"
                      value={formData.deliveryAddressId || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, deliveryAddressId: e.target.value }))}
                      disabled={!formData.customerId}
                    >
                      <option value="">Select Delivery Address...</option>
                      {customerAddresses.map(addr => {
                        const displayParts = [addr.addressLine1, addr.city].filter(Boolean);
                        const displayText = displayParts.length > 0 ? displayParts.join(', ') : (addr.state || addr.stateName || 'Address');
                        return <option key={addr.id} value={addr.id}>{displayText}{addr.isDefault ? ' - Default' : ''}</option>;
                      })}
                      <option value="NEW">+ Add New Delivery Address</option>
                    </CustomSelect>
                    {formData.deliveryAddressId === 'NEW' && (
                      <div className="mt-2 p-2 border border-zinc-200 dark:border-[#2A2F3D] rounded-lg bg-zinc-50 dark:bg-[#161922] space-y-2">
                        <input type="text" placeholder="Street Address *" className="input-field w-full h-7 text-[8px]" value={formData.newDeliveryAddress.addressLine1} onChange={e => setFormData(prev => ({ ...prev, newDeliveryAddress: { ...prev.newDeliveryAddress, addressLine1: e.target.value } }))} />
                        <input type="text" placeholder="Apt, Suite, etc. (Optional)" className="input-field w-full h-7 text-[8px]" value={formData.newDeliveryAddress.addressLine2} onChange={e => setFormData(prev => ({ ...prev, newDeliveryAddress: { ...prev.newDeliveryAddress, addressLine2: e.target.value } }))} />
                        <input type="text" placeholder="City *" className="input-field w-full h-7 text-[8px]" value={formData.newDeliveryAddress.city} onChange={e => setFormData(prev => ({ ...prev, newDeliveryAddress: { ...prev.newDeliveryAddress, city: e.target.value } }))} />
                        <CustomSelect className="w-full" buttonClassName="w-full h-7 px-2 border border-zinc-200 dark:border-[#2A2F3D] rounded-md bg-white dark:bg-[#1D212C] text-[8px] text-zinc-800 dark:text-[#E6E8EE] flex items-center justify-between" value={formData.newDeliveryAddress.gstStateId} onChange={e => setFormData(prev => ({ ...prev, newDeliveryAddress: { ...prev.newDeliveryAddress, gstStateId: e.target.value } }))}>
                          <option value="">Select State *</option>
                          {gstStates.map(s => <option key={s.id} value={s.id}>{s.displayName || `${s.stateCode} - ${s.stateName}`}</option>)}
                        </CustomSelect>
                        <input type="text" placeholder="Postal Code *" className="input-field w-full h-7 text-[8px]" value={formData.newDeliveryAddress.postalCode} onChange={e => setFormData(prev => ({ ...prev, newDeliveryAddress: { ...prev.newDeliveryAddress, postalCode: e.target.value } }))} />
                      </div>
                    )}
                  </div>
                )
              };
            }
            if (f.key === 'placeOfSupplyStateId') {
              return {
                ...f,
                render: () => (
                  <div>
                    <label className="block text-[8px] font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">Place of Supply *</label>
                    <CustomSelect
                      className="w-full"
                      buttonClassName="w-full h-8 px-2.5 border border-zinc-200 dark:border-[#2A2F3D] rounded-md bg-white dark:bg-[#1D212C] text-[10px] text-zinc-800 dark:text-[#E6E8EE] flex items-center justify-between outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10"
                      value={formData.placeOfSupplyStateId || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, placeOfSupplyStateId: e.target.value }))}
                      searchable={true}
                      comboInput={true}
                    >
                      <option value="">Select Place of Supply...</option>
                      {gstStates.map(s => (
                        <option key={s.id} value={s.id}>{s.displayName || `${s.stateCode} - ${s.stateName}`}</option>
                      ))}
                    </CustomSelect>
                  </div>
                )
              };
            }
            return f;
          })
        },
        invoiceFormConfig.sidebar.sections[1],
        {
          ...invoiceFormConfig.sidebar.sections[2],
          fields: [
            selectField(
              { key: 'paymentTermId', label: 'Payment Terms' },
              paymentTermsList.map(term => ({
                value: term.id,
                label: term.name || term.title,
                text: term.name || term.description || term.title
              })),
              'Select Payment Terms...',
              null,
              'paymentTerms',
              isLoadingPt,
              isErrorPt
            ),
            selectField(
              { key: 'deliveryTermId', label: 'Delivery Terms' },
              deliveryTermsList.map(term => ({
                value: term.id,
                label: term.name || term.title,
                text: term.name || term.description || term.title
              })),
              'Select Delivery Terms...',
              null,
              'deliveryTerms',
              isLoadingDt,
              isErrorDt
            )
          ]
        },
        {
          ...invoiceFormConfig.sidebar.sections[3],
          fields: [
            { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional notes for the customer...' },
            selectField(
              { key: 'termsConditionId', label: 'Terms & Conditions' },
              termsConditionsList.map(term => ({
                value: term.id,
                label: term.title || term.name,
                text: term.content || term.description || term.title || term.name
              })),
              'Select Terms & Conditions...',
              (val, setValue, setFormValue) => {
                setValue(val);
                if (val === 'CUSTOM') {
                  if (setFormValue) setFormValue('termsAndConditions', '');
                  setFormData(prev => ({ ...prev, termsConditionId: val, termsAndConditions: '' }));
                } else {
                  const selected = termsConditionsList.find(term => String(term.id) === String(val));
                  const textVal = selected?.content || selected?.description || selected?.title || selected?.name || '';
                  if (setFormValue) setFormValue('termsAndConditions', textVal);
                  setFormData(prev => ({ ...prev, termsConditionId: val, termsAndConditions: textVal }));
                }
              },
              'termsAndConditions',
              isLoadingTc,
              isErrorTc
            )
          ]
        }
      ]
    },
    items: {
      ...invoiceFormConfig.items,
      rowRenderer: ({ item, index, onUpdate, onRemove, canRemove, gridTemplateColumns }) => (
        <InvoiceLineItemRow
          key={item.id || index}
          item={item}
          products={products}
          productsLoading={productsLoading}
          companyId={companyId}
          isSystemAdmin={isSystemAdmin}
          currency={formData.invoiceCurrency}
          onUpdate={(id, field, value) => handleItemChange(id, field, value)}
          onRemove={() => handleRemoveItem(item.id)}
          canRemove={canRemove}
          setAddHsnSacTargetRowId={setAddHsnSacTargetRowId}
          onAddNewItem={(id, term) => {
            setNewItemName(term);
            setAddItemTargetRowId(id);
            setIsAddItemOpen(true);
          }}
          gridTemplateColumns={gridTemplateColumns}
          error={errors?.items && (!item.itemId || String(item.itemId).trim() === '') ? 'Product is required' : undefined}
        />
      ),
      allowDelete: true
    },
    onItemChange: (item, field, value) => {
      const idx = items.indexOf(item);
      if (idx !== -1) handleItemChange(idx, field, value);
    },
    onAddItem: () => {
      setItems(prev => {
        const nextItems = [...prev, {
          id: Date.now() + Math.random(),
          itemId: '', warehouseId: '', locationId: '', batchId: '',
          hsnSacId: '', hsnSacCode: '', itemName: '', description: '',
          quantity: 1, unitPrice: 0, discountPercentage: 0, unit: 'PCS'
        }];
        return recalculateTaxes(nextItems);
      });
    },
    onRemoveItem: (item) => {
      handleRemoveItem(item.id);
    },
    summary: {
      ...invoiceFormConfig.summary,
      rows: invoiceFormConfig.summary.rows.map(row =>
        row.key === 'freightCharges' || row.key === 'otherCharges' || row.key === 'receivedAmount' ? { ...row, type: 'currency-input' } : row
      )
    },
    footer: invoiceFormConfig.footer
  };

  const transactionValues = {
    ...formData,
    downloadPdf: downloadPdfFlag,
    sendEmail: sendEmailFlag,
    subtotal: calculatedTotals.taxableAmount,
    taxAmount: calculatedTotals.tax,
    roundOff: calculatedTotals.roundOff || 0,
    grandTotal: calculatedTotals.grandTotal
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <TransactionForm
        config={transactionConfig}
        values={transactionValues}
        items={items}
        errors={errors}
        onChange={handleFieldChange}
        onSubmit={() => handleSubmit()}
        onCancel={onClose}
        onPrint={handlePrint}
        loading={isSubmitting}
        mode={initialData?.id ? 'edit' : 'create'}
        context={{ companyId, customerAddresses, gstStates, paymentTermsList, deliveryTermsList, termsConditionsList, errors, values: transactionValues }}
      />

      <CustomerFormModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onSuccess={async (newCustomer) => {
          setIsAddCustomerOpen(false);
          await refetchCustomers();
          if (newCustomer?.id) {
            setFormData(prev => ({ ...prev, customerId: newCustomer.id }));
          }
        }}
        companyId={companyId}
        isSystemAdmin={isSystemAdmin}
      />

      <HsnSacFormModal
        isOpen={!!addHsnSacTargetRowId}
        onClose={() => setAddHsnSacTargetRowId(null)}
        onSuccess={(newHsn) => {
          if (!addHsnSacTargetRowId) return;
          const idx = items.findIndex(it => it.id === addHsnSacTargetRowId);
          if (idx !== -1) {
            handleItemChange(idx, 'hsnSelection', {
              hsnSacId: newHsn.id,
              hsnSacCode: newHsn.hsnCode || newHsn.sacCode || '',
              hsnSacName: newHsn.description || '',
              hsnSac: newHsn,
              cgstRate: newHsn.cgstRate,
              sgstRate: newHsn.sgstRate,
              igstRate: newHsn.igstRate
            });
          }
          setAddHsnSacTargetRowId(null);
        }}
        companyId={companyId}
      />

      <ProductForm
        isOpen={isAddItemOpen}
        onClose={() => {
          setIsAddItemOpen(false);
          setNewItemName('');
          setAddItemTargetRowId(null);
        }}
        initialData={{ name: newItemName, productName: newItemName }}
        mode="create"
      />

      <ConfirmModal
        open={!!formError}
        title="Validation Error"
        message="Please review and correct the following error before proceeding:"
        details={formError}
        confirmLabel="OK"
        cancelLabel="Close"
        onConfirm={() => setFormError('')}
        onCancel={() => setFormError('')}
        isDestructive={true}
        zIndex={500}
      />

      <PrintPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        pdfUrl={previewPdfUrl}
        invoiceNo={previewInvoiceNo}
      />
    </>,
    document.body
  );
}
