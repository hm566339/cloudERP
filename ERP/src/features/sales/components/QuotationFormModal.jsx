import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, AlertCircle, FileText, Printer, Package } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useGetCustomerByIdQuery } from '../../../api/sales-crm';
import { useGetQuotationByIdQuery, useCreateQuotationMutation, useUpdateQuotationMutation, useLazyGetQuotationPdfQuery, useSendQuotationMutation } from '../../../api/sales-crm/sales.api';
import { useGetPaymentTermsQuery, useGetTermsConditionsQuery, useGetDeliveryTermsQuery, useGetWarrantyTermsQuery } from '../../../api/sales-crm/salesSettings.api';
import CustomerCombobox from './CustomerCombobox';
import CustomSelect from '../../../components/common/CustomSelect';
import { useGetHsnSacsQuery, useGetGstStatesQuery, useGetGstSlabsQuery, useGetGstRegistrationsQuery } from '../../../api/account/accounting.api';
import { fetchHsnSacs, selectHsnSacItems } from '../../account/store/hsnSacSlice';
import HsnSacSelect from '../../../components/common/HsnSacSelect';
import { useGetGroupedStockQuery, useGetProductsQuery } from '../../../api/inventory/inventory.api';
import { productsApi } from '../../../api/inventory/products';
import ProductForm from '../../inventory/components/ProductForm';
import useDebounce from '../../../hooks/useDebounce';
import { TransactionForm } from '../../../components/erp/TransactionForm';
import quotationFormConfig from '../configs/quotationFormConfig';
import { buildQuotationPayload, isUuid } from '../utils/quotationPayload';
import { extractCustomer } from '../../../components/erp/TransactionForm/fields/DeliveryAddressField';

export const QuotationLineItemRow = ({ item, products, productsLoading, companyId, onUpdate, onRemove, canRemove, currency, onAddNewProduct, gridTemplateColumns }) => {
  const selectedProductStock = products.find(p => p.productId === item.itemId) || null;


  return (
    <div className="grid gap-1 w-full bg-white hover:bg-zinc-50/50 min-w-0 border-b border-zinc-100 last:border-0 box-border" style={{ gridTemplateColumns: gridTemplateColumns || 'repeat(12, minmax(90px, 1fr))' }}>
      <div className="p-1 pt-2 min-w-0">
        <CustomSelect
          className="w-full min-w-0"
          buttonClassName="w-full h-8 px-2 border border-zinc-200 rounded-md bg-white text-[8.8px] text-zinc-800 hover:border-zinc-300 flex items-center justify-between outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10"
          value={item.itemId || ''}
          onChange={e => {
            const prod = products.find(p => p.productId === e.target.value);
            if (prod) {
              onUpdate(item.id, 'itemSelection', prod);
            }
          }}
          searchable={true}
          comboInput={true}
          bottomAction={({ closeDropdown, searchTerm }) => (
            <button
              type="button"
              onClick={() => {
                closeDropdown();
                onAddNewProduct?.(item.id, searchTerm);
              }}
              className="w-full text-left px-3 py-2 text-[9.6px] text-primary hover:bg-zinc-50 flex items-center gap-1 font-semibold border-t border-zinc-100"
            >
              <Plus size={14} /> Add New Product
            </button>
          )}
          required
        >
          <option value="">Select Item</option>
          {productsLoading ? (
            <option disabled>Loading...</option>
          ) : (
            products.map(p => (
              <option key={p.productId} value={p.productId}>{p.productName}</option>
            ))
          )}
        </CustomSelect>
      </div>



      <div className="p-1 pt-2 min-w-0">
        <HsnSacSelect
          value={item.hsnSacId}
          onChange={(e, selectedHsn) => {
            if (selectedHsn) {
              onUpdate(item.id, 'hsnSelection', {
                hsnSacId: e.target.value,
                hsnSacCode: selectedHsn.code || '',
                hsnSacName: selectedHsn.description || '',
                hsnSac: selectedHsn,
                cgstRate: selectedHsn.cgstRate,
                sgstRate: selectedHsn.sgstRate,
                igstRate: selectedHsn.igstRate
              });
            } else {
              onUpdate(item.id, 'hsnSelection', {
                hsnSacId: e.target.value,
                hsnSacCode: '',
                hsnSacName: '',
                hsnSac: null,
                cgstRate: 0,
                sgstRate: 0,
                igstRate: 0
              });
            }
          }}
          buttonClassName="w-full h-8 border border-zinc-200 rounded-md text-[8.8px] hover:border-zinc-300 flex items-center justify-between bg-white"
          placeholder="Select HSN/SAC"
          preSelectedCode={item.hsnSacCode}
          preSelectedName={item.hsnSacName}
        />
      </div>

      <div className="p-1 pt-2 min-w-0">
        <input
          type="text"
          placeholder="Description"
          className="input-field w-full h-8 text-[8.8px] text-zinc-700 bg-white truncate"
          value={item.description}
          onChange={e => onUpdate(item.id, 'description', e.target.value)}
        />
      </div>

      <div className="p-1 pt-2 min-w-0 relative">
        <input
          type="number"
          min="0.01"
          step="0.01"
          className="input-field w-full h-8 text-center text-[8.8px]"
          value={item.quantity}
          onChange={e => onUpdate(item.id, 'quantity', e.target.value)}
          required
        />
      </div>

      <div className="p-1 pt-2 min-w-0">
        <input
          type="number"
          min="0"
          step="0.01"
          className="input-field w-full h-8 text-right text-[8.8px]"
          value={item.unitPrice}
          onChange={e => onUpdate(item.id, 'unitPrice', e.target.value)}
          required
        />
        {item.quantity > 0 && item.unitPrice > 0 && (
          <div className="text-right text-[8px] text-zinc-500 mt-1 font-medium whitespace-nowrap">
            Total: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR' }).format(item.quantity * item.unitPrice)}
          </div>
        )}
      </div>

      <div className="p-1 pt-2 min-w-0">
        <input
          type="text"
          placeholder="e.g. PCS"
          className="input-field w-full h-8 text-center text-[8.8px] uppercase"
          value={item.unit}
          onChange={e => onUpdate(item.id, 'unit', e.target.value)}
        />
      </div>

      <div className="p-1 pt-2 min-w-0">
        <input
          type="number"
          min="0"
          max="100"
          step="0.01"
          placeholder="Disc %"
          className="input-field w-full h-8 text-right text-[8.8px]"
          value={item.discountPercent}
          onChange={e => onUpdate(item.id, 'discountPercent', e.target.value)}
        />
      </div>

      <div className="p-1 pt-2 min-w-0 flex flex-col justify-center text-[8px] leading-tight">
        {item.hsnSacId ? (
          <div className="flex flex-col gap-1 w-full px-1">
            <div className="text-zinc-800 font-semibold mb-0.5 border-b border-zinc-100 pb-0.5">
              GST {item.isInterState ? item.igstRate : (item.cgstRate + item.sgstRate)}%
            </div>
            {item.isInterState ? (
              item.igstRate > 0 && (
                <div className="flex justify-between items-center w-full">
                  <span className="text-zinc-500">IGST {item.igstRate}%</span>
                  <span className="text-zinc-700 font-medium">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR' }).format(item.igstAmount)}</span>
                </div>
              )
            ) : (
              <>
                {item.cgstRate > 0 && (
                  <div className="flex justify-between items-center w-full">
                    <span className="text-zinc-500">CGST {item.cgstRate}%</span>
                    <span className="text-zinc-700 font-medium">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR' }).format(item.cgstAmount)}</span>
                  </div>
                )}
                {item.sgstRate > 0 && (
                  <div className="flex justify-between items-center w-full">
                    <span className="text-zinc-500">SGST {item.sgstRate}%</span>
                    <span className="text-zinc-700 font-medium">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR' }).format(item.sgstAmount)}</span>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="text-zinc-400 text-center">-</div>
        )}
      </div>

      <div className="p-1 pt-2 min-w-0 flex items-center justify-end pr-2 text-[8.8px] font-semibold text-zinc-800 truncate">
        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR' }).format(item.totalAmount || 0)}
      </div>

      <div className="p-1 pt-2 pb-2 min-w-0 flex items-center justify-center">
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          disabled={!canRemove}
          className={`p-1.5 rounded-md transition-colors ${!canRemove
              ? 'text-zinc-300 cursor-not-allowed'
              : 'text-zinc-400 hover:text-red-500 hover:bg-red-50'
            }`}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export const emptyItem = () => ({
  id: Date.now() + Math.random(),
  itemId: '',

  itemName: '',
  description: '',
  quantity: 1,
  unit: 'NOS',
  unitPrice: 0,
  discountPercent: 0,
  discountAmount: 0,
  taxableAmount: 0,
  hsnSacId: '',
  hsnSacCode: '',
  hsnSacName: '',
  rawHsnCgst: 0,
  rawHsnSgst: 0,
  rawHsnIgst: 0,
  rawHsnCess: 0,
  cgstRate: 0,
  cgstAmount: 0,
  sgstRate: 0,
  sgstAmount: 0,
  igstRate: 0,
  igstAmount: 0,
  cessRate: 0,
  cessAmount: 0,
  taxAmount: 0,
  totalAmount: 0,
  isInterState: false
});

export default function QuotationFormModal({ isOpen, onClose, quotationId, onSuccess, companyId: propCompanyId }) {
  const dispatch = useDispatch();
  const reduxCompanyId = useSelector(s => s.company?.selectedCompany?.id);
  const companyId = propCompanyId || reduxCompanyId || useParams().companyId || JSON.parse(localStorage.getItem("selected_company") || "{}")?.id;
  const authUser = JSON.parse(localStorage.getItem("auth_user")) || {};

  const [createQuotation, { isLoading: isCreating }] = useCreateQuotationMutation();
  const [updateQuotation, { isLoading: isUpdating }] = useUpdateQuotationMutation();
  const [errors, setErrors] = useState({});

  const [downloadPdf] = useLazyGetQuotationPdfQuery();
  const [sendEmail] = useSendQuotationMutation();
  const [postSaveActions, setPostSaveActions] = useState({ downloadPdf: false, sendEmail: false });

  const { data: quotationData, isLoading: isLoadingQuotation } = useGetQuotationByIdQuery(
    { id: quotationId, companyId },
    { skip: !quotationId }
  );

  const { data: allProductsData, isLoading: allProductsLoading } = useGetProductsQuery({ companyId, page: 0, size: 200 }, { skip: !isOpen });
  const { data: stockData, isLoading: stockLoading } = useGetGroupedStockQuery({ companyId, page: 0, size: 200 }, { skip: !isOpen });
  const productsLoading = allProductsLoading || stockLoading;

  const masterProducts = useMemo(() => {
    if (Array.isArray(allProductsData)) return allProductsData;
    return allProductsData?.data?.content || allProductsData?.data?.records || allProductsData?.data || allProductsData?.content || [];
  }, [allProductsData]);

  const fetchedProducts = useMemo(() => {
    if (Array.isArray(stockData)) return stockData;
    return stockData?.data?.content || stockData?.data?.records || stockData?.data || stockData?.content || [];
  }, [stockData]);

  const [createdProducts, setCreatedProducts] = useState([]);
  const products = useMemo(() => {
    const productMap = new Map();

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

    [...fetchedProducts, ...createdProducts].forEach(p => {
      if (!p) return;
      const id = p.productId || p.id;
      if (!id) return;
      const existing = productMap.get(String(id)) || {};
      productMap.set(String(id), {
        ...existing,
        ...p,
        productId: id,
        id: id,
        productName: p.productName || p.name || existing.productName || '',
        sellingPrice: p.sellingPrice ?? p.pricing?.sellingPrice ?? existing.sellingPrice ?? 0,
        baseUomCode: p.baseUomCode || p.uom?.code || p.unit || existing.baseUomCode || 'PCS',
        hsnSacId: p.hsnSacId || p.hsnSac?.id || existing.hsnSacId || '',
        hsnSacCode: p.hsnSacCode || p.hsnSac?.code || existing.hsnSacCode || '',
        hsnSacName: p.hsnSacName || p.hsnSac?.description || existing.hsnSacName || ''
      });
    });

    return Array.from(productMap.values());
  }, [masterProducts, createdProducts, fetchedProducts]);

  // ── GST DATA SOURCES (mirroring InvoiceFormModal) ──
  // 1. Redux HSN/SAC items
  const reduxHsnItems = useSelector(selectHsnSacItems) || [];
  // 2. RTK Query HSN/SAC items
  const { data: hsnApiData } = useGetHsnSacsQuery({ companyId, size: 1000 }, { skip: !isOpen });
  // 3. GST Slabs for rate lookup
  const { data: gstSlabsData } = useGetGstSlabsQuery(companyId, { skip: !isOpen });
  // 4. Fetch full Redux HSN list on open
  useEffect(() => {
    if (isOpen && companyId) {
      dispatch(fetchHsnSacs({ companyId, page: 0, size: 1000 }));
    }
  }, [isOpen, companyId, dispatch]);

  // Parse HSN API response (same logic as InvoiceFormModal)
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

  // Parse GST Slabs (same logic as InvoiceFormModal)
  const gstSlabs = useMemo(() => {
    if (Array.isArray(gstSlabsData)) return gstSlabsData;
    if (Array.isArray(gstSlabsData?.data?.gstSlabs)) return gstSlabsData.data.gstSlabs;
    if (Array.isArray(gstSlabsData?.data?.content)) return gstSlabsData.data.content;
    if (Array.isArray(gstSlabsData?.data)) return gstSlabsData.data;
    if (Array.isArray(gstSlabsData?.content)) return gstSlabsData.content;
    return [];
  }, [gstSlabsData]);

  // Merge Redux + API HSN sources (same as InvoiceFormModal)
  const allHsnSacs = useMemo(() => {
    const map = new Map();
    [...apiHsnList, ...reduxHsnItems].forEach(item => {
      if (item && (item.id || item.code)) {
        map.set(String(item.id || item.code), item);
      }
    });
    return Array.from(map.values());
  }, [apiHsnList, reduxHsnItems]);

  // GST States
  const { data: gstStatesResponse } = useGetGstStatesQuery({ companyId, active: true }, { skip: !isOpen });
  const gstStates = useMemo(() => {
    if (Array.isArray(gstStatesResponse)) return gstStatesResponse;
    if (gstStatesResponse?.data?.records) return gstStatesResponse.data.records;
    if (gstStatesResponse?.records) return gstStatesResponse.records;
    if (gstStatesResponse?.data?.states) return gstStatesResponse.data.states;
    if (gstStatesResponse?.states) return gstStatesResponse.states;
    if (Array.isArray(gstStatesResponse?.data)) return gstStatesResponse.data;
    if (Array.isArray(gstStatesResponse?.content)) return gstStatesResponse.content;
    return [];
  }, [gstStatesResponse]);

  // Company State Code (same as InvoiceFormModal — use GstRegistrations)
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

  const { data: ptData } = useGetPaymentTermsQuery({ documentType: 'QUOTATION', companyId }, { skip: !isOpen });
  const { data: tcData } = useGetTermsConditionsQuery({ documentType: 'QUOTATION', companyId }, { skip: !isOpen });
  const { data: dtData } = useGetDeliveryTermsQuery({ documentType: 'QUOTATION', companyId }, { skip: !isOpen });
  const { data: wtData } = useGetWarrantyTermsQuery({ documentType: 'QUOTATION', companyId }, { skip: !isOpen });
  
  const paymentTermsList = Array.isArray(ptData) ? ptData : (ptData?.data || []);
  const termsConditionsList = Array.isArray(tcData) ? tcData : (tcData?.data || []);
  const deliveryTermsList = Array.isArray(dtData) ? dtData : (dtData?.data || []);
  const warrantyTermsList = Array.isArray(wtData) ? wtData : (wtData?.data || []);

  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    quotationNumber: '',
    quotationDate: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    referenceNumber: '',
    quotationCurrency: 'INR',
    exchangeRate: 1,
    placeOfSupplyStateId: '',
    freightCharges: 0,
    otherCharges: 0,
    paymentTermId: '',
    paymentTerms: '',
    deliveryTermId: '',
    deliveryTerms: '',
    warrantyTermId: '',
    warrantyTerms: '',
    termsConditionId: '',
    termsAndConditions: '',
    notes: '',
    billingAddressId: '',
    deliveryAddressId: '',
    deliveryAddressMode: 'existing',
    saveNewDeliveryAddress: false,
    newDeliveryAddress: null
  });

  const [items, setItems] = useState([emptyItem()]);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productTargetRowId, setProductTargetRowId] = useState(null);
  const [newProductName, setNewProductName] = useState('');
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  // Handle Customer Selection side-effects
  const { data: selectedCustomerData } = useGetCustomerByIdQuery(
    { id: formData.customerId, companyId },
    { skip: !formData.customerId }
  );

  const customer = extractCustomer(selectedCustomerData);
  const rawAddresses = customer?.addresses || [];

  const customerAddresses = useMemo(() => {
    const responseCustomerId = customer?.id || customer?.customerId;
    if (responseCustomerId && String(responseCustomerId) !== String(formData.customerId)) return [];
    return rawAddresses.filter(address => address.isActive !== false && address.id !== undefined && address.id !== null && String(address.id).trim() !== '');
  }, [rawAddresses, customer, formData.customerId]);

  useEffect(() => {
    if (quotationId && quotationData?.data) {
      const q = quotationData.data;
      const termsObj = (q.termsAndConditions && typeof q.termsAndConditions === 'object') ? q.termsAndConditions : {};
      const ptId = q.paymentTermId || termsObj.paymentTermId || '';
      const ptText = q.paymentTerms || termsObj.paymentTerms || '';
      const dtId = q.deliveryTermId || termsObj.deliveryTermId || '';
      const dtText = q.deliveryTerms || termsObj.deliveryTerms || '';
      const wtId = q.warrantyTermId || termsObj.warrantyTermId || '';
      const wtText = q.warrantyTerms || termsObj.warrantyTerms || '';
      const tcId = q.termsConditionId || termsObj.termsConditionId || '';
      const tcText = (typeof q.termsAndConditions === 'string' ? q.termsAndConditions : termsObj.termsAndConditions) || '';
      const notesText = q.notes || termsObj.notes || '';

      setFormData(prev => ({
        ...prev,
        customerId: q.customerId || '',
        customerName: q.customerName || '',
        quotationNumber: q.quotationNumber || '',
        quotationDate: q.quotationDate || new Date().toISOString().split('T')[0],
        validUntil: q.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        referenceNumber: q.referenceNumber || '',
        quotationCurrency: q.quotationCurrency || 'INR',
        exchangeRate: q.exchangeRate || 1,
        placeOfSupplyStateId: q.placeOfSupplyStateId || '',
        freightCharges: q.freightCharges || 0,
        otherCharges: q.otherCharges || 0,
        paymentTermId: ptId || (ptText ? 'CUSTOM' : ''),
        paymentTerms: ptText,
        deliveryTermId: dtId || (dtText ? 'CUSTOM' : ''),
        deliveryTerms: dtText,
        warrantyTermId: wtId || (wtText ? 'CUSTOM' : ''),
        warrantyTerms: wtText,
        termsConditionId: tcId || (tcText ? 'CUSTOM' : ''),
        termsAndConditions: tcText,
        notes: notesText,
        billingAddressId: q.billingAddressId || '',
        deliveryAddressId: q.deliveryAddressId || '',
        deliveryAddressMode: q.newDeliveryAddress ? 'new' : 'existing',
        saveNewDeliveryAddress: Boolean(q.saveNewDeliveryAddress),
        newDeliveryAddress: {
          addressLine1: q.newDeliveryAddress?.addressLine1 || '',
          addressLine2: q.newDeliveryAddress?.addressLine2 || '',
          city: q.newDeliveryAddress?.city || '',
          gstStateId: q.newDeliveryAddress?.gstStateId || '',
          postalCode: q.newDeliveryAddress?.postalCode || '',
          country: q.newDeliveryAddress?.country || ''
        }
      }));
      if (q.items && q.items.length > 0) {
        setItems(q.items.map(i => ({
          ...i,
          id: i.id || Date.now() + Math.random(),
          discountPercent: Number(i.discountPercent ?? i.discountPercentage ?? i.discount ?? 0),
        })));
      }
    } else if (!quotationId && isOpen) {
      setFormData(prev => ({
        ...prev,
        customerId: '',
        customerName: '',
        quotationNumber: '',
        quotationDate: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        referenceNumber: '',
        quotationCurrency: 'INR',
        exchangeRate: 1,
        placeOfSupplyStateId: '',
        freightCharges: 0,
        otherCharges: 0,
        paymentTermId: '',
        paymentTerms: '',
        deliveryTermId: '',
        deliveryTerms: '',
        warrantyTermId: '',
        warrantyTerms: '',
        termsConditionId: '',
        termsAndConditions: '',
        notes: '',
        billingAddressId: '',
        deliveryAddressId: '',
        deliveryAddressMode: 'existing',
        saveNewDeliveryAddress: false,
        newDeliveryAddress: null
      }));
      setItems([emptyItem()]);
    }
  }, [quotationId, quotationData, isOpen]);

  useEffect(() => {
    if (customer && formData.customerId && !quotationId) {
      setFormData(prev => {
        const next = {
          ...prev,
          customerName: customer.customerName || customer.companyName || customer.name || prev.customerName
        };

        // Auto-select Place of Supply
        if (gstStates.length > 0) {
          let custStateCode = '';
          if (customer.gstin && customer.gstin.length >= 2) {
            custStateCode = customer.gstin.substring(0, 2);
          } else if (customer.stateCode) {
            custStateCode = String(customer.stateCode);
          } else if (customer.addresses?.[0]?.gstStateCode) {
            custStateCode = String(customer.addresses[0].gstStateCode);
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
            const stateName = customer.state || customer.stateName || customer.addresses?.[0]?.state || customer.addresses?.[0]?.gstStateName;
            if (stateName) {
              const lower = String(stateName).trim().toLowerCase();
              matched = gstStates.find(s => 
                String(s.stateName || s.name || '').trim().toLowerCase() === lower ||
                String(s.displayName || '').toLowerCase().includes(lower)
              );
            }
          }

          if (matched && matched.id) {
            next.placeOfSupplyStateId = matched.id;
          }
        }

        // Auto-select delivery address
        const addresses = (customer.addresses || []).filter(a => a.isActive !== false);
        if (addresses.length > 0) {
          const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
          if (defaultAddr?.id) {
            next.deliveryAddressId = defaultAddr.id;
            next.billingAddressId = defaultAddr.id;
          }
        }

        return next;
      });
    }
  }, [customer, formData.customerId, quotationId, gstStates]);

  useEffect(() => {
    if (!quotationId && isOpen && paymentTermsList.length > 0 && !formData.paymentTermId) {
      const defaultPt = paymentTermsList.find(pt => pt.isDefault) || paymentTermsList[0];
      if (defaultPt) {
        setFormData(prev => ({ ...prev, paymentTermId: defaultPt.id, paymentTerms: defaultPt.description }));
      }
    }
  }, [paymentTermsList, quotationId, isOpen, formData.paymentTermId]);

  useEffect(() => {
    if (!quotationId && isOpen && termsConditionsList.length > 0 && !formData.termsConditionId) {
      const defaultTc = termsConditionsList.find(tc => tc.isDefault) || termsConditionsList[0];
      if (defaultTc) {
        setFormData(prev => ({ ...prev, termsConditionId: defaultTc.id, termsAndConditions: defaultTc.content }));
      }
    }
  }, [termsConditionsList, quotationId, isOpen, formData.termsConditionId]);

  useEffect(() => {
    if (!quotationId && isOpen && deliveryTermsList.length > 0 && !formData.deliveryTermId) {
      const defaultDt = deliveryTermsList.find(dt => dt.isDefault) || deliveryTermsList[0];
      if (defaultDt) {
        setFormData(prev => ({ ...prev, deliveryTermId: defaultDt.id, deliveryTerms: defaultDt.description }));
      }
    }
  }, [deliveryTermsList, quotationId, isOpen, formData.deliveryTermId]);

  useEffect(() => {
    if (!quotationId && isOpen && warrantyTermsList.length > 0 && !formData.warrantyTermId) {
      const defaultWt = warrantyTermsList.find(wt => wt.isDefault) || warrantyTermsList[0];
      if (defaultWt) {
        setFormData(prev => ({ ...prev, warrantyTermId: defaultWt.id, warrantyTerms: defaultWt.description }));
      }
    }
  }, [warrantyTermsList, quotationId, isOpen, formData.warrantyTermId]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // ── CENTRAL GST CALCULATION (mirroring InvoiceFormModal exactly) ──
  function calculateItemGst({ taxableAmount, cgstRate, sgstRate, igstRate, sellerStateCode, buyerStateCode }) {
    const seller = String(sellerStateCode ?? '').trim();
    const buyer = String(buyerStateCode ?? '').trim();
    const amount = Number(taxableAmount || 0);
    const isIntraState = Boolean(seller && buyer && seller === buyer);

    const numCgst = Number(cgstRate || 0);
    const numSgst = Number(sgstRate || 0);
    let numIgst = Number(igstRate || 0);

    // Derive IGST from CGST+SGST if missing
    if (numIgst === 0 && (numCgst > 0 || numSgst > 0)) {
      numIgst = numCgst + numSgst;
    }

    let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;
    if (isIntraState) {
      cgstAmount = (amount * numCgst) / 100;
      sgstAmount = (amount * numSgst) / 100;
    } else {
      igstAmount = (amount * numIgst) / 100;
    }

    return {
      isInterState: !isIntraState,
      cgstRate: isIntraState ? numCgst : 0,
      sgstRate: isIntraState ? numSgst : 0,
      igstRate: isIntraState ? 0 : numIgst,
      cgstAmount, sgstAmount, igstAmount,
      totalTax: cgstAmount + sgstAmount + igstAmount
    };
  }

  // Resolve HSN tax rates using multi-fallback (same chain as InvoiceFormModal)
  function resolveHsnTaxRates(item) {
    const rawCode = String(item.hsnSacCode || '').split('-')[0].trim();
    const rawId = String(item.hsnSacId || '').trim();

    // Find HSN master from merged list
    let hsnMaster = allHsnSacs.find(h => {
      const hCode = String(h.code || '').split('-')[0].trim();
      const hId = String(h.id || '').trim();
      return (rawId && hId && hId === rawId) ||
        (rawCode && hCode && (hCode === rawCode || hCode.startsWith(rawCode) || rawCode.startsWith(hCode)));
    });

    if (!hsnMaster && item.hsnSac) hsnMaster = item.hsnSac;

    let cgstRate = Number(hsnMaster?.cgstRate ?? 0);
    let sgstRate = Number(hsnMaster?.sgstRate ?? 0);
    let igstRate = Number(hsnMaster?.igstRate ?? 0);

    // Fallback 1: look up GST slab by gstSlabId
    if (cgstRate === 0 && sgstRate === 0 && igstRate === 0 && hsnMaster?.gstSlabId) {
      const slab = gstSlabs.find(s => String(s.id) === String(hsnMaster.gstSlabId));
      if (slab) {
        cgstRate = Number(slab.cgstRate ?? 0);
        sgstRate = Number(slab.sgstRate ?? 0);
        igstRate = Number(slab.igstRate ?? 0);
      }
    }

    // Fallback 2: parse gstSlabName (e.g. "GST 18%")
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

    // Fallback 3: if HSN is selected but all rates are still 0, use 18% default
    if (cgstRate === 0 && sgstRate === 0 && igstRate === 0 && (rawCode || rawId)) {
      cgstRate = 9;
      sgstRate = 9;
      igstRate = 18;
    }

    return { cgstRate, sgstRate, igstRate };
  }

  // Resolve Place of Supply state code
  const resolvedBuyerStateCode = useMemo(() => {
    if (!formData.placeOfSupplyStateId) return '';
    const match = gstStates.find(s => String(s.id) === String(formData.placeOfSupplyStateId));
    if (match?.stateCode) return String(match.stateCode).padStart(2, '0');
    return '';
  }, [formData.placeOfSupplyStateId, gstStates]);

  // Recalculate ALL items' taxes
  const recalculateTaxes = (currentItems) => {
    return currentItems.map(item => {
      let updated = { ...item };
      const qty = parseFloat(updated.quantity) || 0;
      const price = parseFloat(updated.unitPrice) || 0;
      const discPct = parseFloat(updated.discountPercent) || 0;
      const grossAmount = qty * price;
      updated.discountAmount = (grossAmount * discPct) / 100;
      updated.taxableAmount = grossAmount - updated.discountAmount;

      if (!updated.hsnSacId) {
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

  // Recalculate when Place of Supply, company state, or HSN data changes
  useEffect(() => {
    if (items.length > 0 && resolvedBuyerStateCode && companyStateCode) {
      setItems(prev => recalculateTaxes(prev));
    }
  }, [resolvedBuyerStateCode, companyStateCode, allHsnSacs, gstSlabs]);

  const handleUpdateItem = (id, field, value) => {
    setItems(prevItems => {
      let updatedItems = prevItems.map(item => {
        if (item.id !== id) return item;

        let updated = { ...item };

        if (field === 'itemSelection') {
          updated.itemId = value.productId;
          updated.itemName = value.productName;
          updated.description = value.description || '';
          updated.unit = value.baseUomName || value.baseUomCode || value.unit || 'PCS';
          updated.unitPrice = value.sellingPrice || 0;
          updated.hsnSacId = value.hsnSacId || '';
          updated.hsnSacCode = value.hsnSacCode || '';
          updated.hsnSacName = value.hsnSacName || '';
          // Store HSN object for rate resolution
          updated.hsnSac = allHsnSacs.find(h =>
            (value.hsnSacId && String(h.id) === String(value.hsnSacId)) ||
            (value.hsnSacCode && String(h.code) === String(value.hsnSacCode))
          ) || null;


        } else if (field === 'hsnSelection') {
          updated.hsnSacId = value.hsnSacId;
          updated.hsnSacCode = value.hsnSacCode;
          updated.hsnSacName = value.hsnSacName || '';
          // Store the full HSN object for tax rate resolution
          updated.hsnSac = value.hsnSac || null;
        } else {
          updated[field] = value;
        }
        return updated;
      });

      if (field === 'itemSelection') {
        const lastItem = updatedItems[updatedItems.length - 1];
        if (lastItem && lastItem.itemId) {
          updatedItems.push(emptyItem());
        }
      }

      return recalculateTaxes(updatedItems);
    });
  };

  const handleAddItem = () => {
    setItems([...items, emptyItem()]);
  };
  const handleRemoveItem = (id) => {
    setItems(prevItems => {
      let nextItems = prevItems.filter(item => item.id !== id);
      if (nextItems.length === 0) {
        nextItems.push(emptyItem());
      }
      return recalculateTaxes(nextItems);
    });
  };

  const closeProductModal = () => {
    setIsAddProductOpen(false);
    setProductTargetRowId(null);
    setNewProductName('');
  };

  const handleCreateProduct = async (payload) => {
    try {
      setIsCreatingProduct(true);
      const result = await productsApi.create(payload);
      const product = result?.data || result;
      const productId = product?.productId || product?.id;

      if (!productId) {
        throw new Error('Product was created but no product ID was returned.');
      }

      const normalizedProduct = {
        ...product,
        productId,
        productName: product.productName || payload.productName,
        baseUomName: product.baseUomName || product.baseUom?.name || product.baseUom?.uomName,
        baseUomCode: product.baseUomCode || product.baseUom?.code || product.baseUom?.uomCode,
        hsnSacId: product.hsnSacId || product.hsnSac?.id,
        hsnSacCode: product.hsnSacCode || product.hsnSac?.code,
        hsnSacName: product.hsnSacName || product.hsnSac?.description || product.hsnSac?.name,
      };
      setCreatedProducts(prev => [normalizedProduct, ...prev.filter(item => String(item.productId || item.id) !== String(productId))]);
      handleUpdateItem(productTargetRowId, 'itemSelection', normalizedProduct);
      closeProductModal();
    } catch (error) {
      console.error('Failed to create product', error);
      // ProductForm keeps its own field validation; this handles API failures
      // without closing the modal so the user can correct or retry the form.
      window.alert(error?.response?.data?.message || error?.data?.message || error?.message || 'Failed to create product');
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const calculatedTotals = useMemo(() => {
    let subtotal = 0;
    let discount = 0;
    let tax = 0;

    items.forEach(item => {
      const grossAmount = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
      const discAmt = (grossAmount * (parseFloat(item.discountPercent) || 0)) / 100;
      subtotal += grossAmount;
      discount += discAmt;
      tax += (parseFloat(item.taxAmount) || 0);
    });

    const freight = parseFloat(formData.freightCharges) || 0;
    const other = parseFloat(formData.otherCharges) || 0;

    const totalBeforeRoundOff = (subtotal - discount) + freight + other + tax;
    const grandTotal = Math.round(totalBeforeRoundOff);
    const roundOff = grandTotal - totalBeforeRoundOff;

    return {
      subtotal,
      discount,
      freight,
      other,
      tax,
      roundOff,
      grandTotal
    };
  }, [items, formData.freightCharges, formData.otherCharges]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    const validationErrors = {};
    if (!formData.customerId) validationErrors.customerId = 'Customer is required';
    if (!formData.quotationDate) validationErrors.quotationDate = 'Quotation Date is required';
    if (!isUuid(formData.placeOfSupplyStateId)) validationErrors.placeOfSupplyStateId = 'Place of Supply is required';
    if (!formData.validUntil) validationErrors.validUntil = 'Valid Until date is required';

    if (formData.deliveryAddressMode === 'new') {
      const address = formData.newDeliveryAddress || {};
      if (!address.addressLine1?.trim() || !address.city?.trim() || !isUuid(address.gstStateId) || !address.country?.trim() || !address.postalCode?.trim()) {
        validationErrors.deliveryAddressId = 'Complete the new delivery address';
      }
    } else if (!customerAddresses.some(address => String(address.id) === String(formData.deliveryAddressId))) {
      validationErrors.deliveryAddressId = 'Delivery Address is required';
    }

    const validItems = items.filter(i => i.itemId);
    if (validItems.length === 0) validationErrors.items = 'At least one item is required';



    if (formData.paymentTermId === 'CUSTOM' && !formData.paymentTerms?.trim()) {
      validationErrors.paymentTerms = 'Custom payment terms are required';
    }
    if (formData.deliveryTermId === 'CUSTOM' && !formData.deliveryTerms?.trim()) {
      validationErrors.deliveryTerms = 'Custom delivery terms are required';
    }
    if (formData.warrantyTermId === 'CUSTOM' && !formData.warrantyTerms?.trim()) {
      validationErrors.warrantyTerms = 'Custom warranty terms are required';
    }
    if (formData.termsConditionId === 'CUSTOM' && !formData.termsAndConditions?.trim()) {
      validationErrors.termsAndConditions = 'Custom terms & conditions are required';
    }

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const payload = buildQuotationPayload(formData, items, quotationId);

    try {
      let savedQuotationId = quotationId;
      if (quotationId) {
        await updateQuotation({ id: quotationId, companyId, ...payload }).unwrap();
      } else {
        const createResult = await createQuotation({ companyId, ...payload }).unwrap();
        savedQuotationId = createResult?.data?.id || createResult?.id || createResult;
      }

      if (savedQuotationId && typeof savedQuotationId === 'string') {
        if (postSaveActions.downloadPdf) {
          try {
            const pdfResponse = await downloadPdf({ id: savedQuotationId, companyId }).unwrap();
            const blob = pdfResponse instanceof Blob ? pdfResponse : new Blob([pdfResponse], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Quotation_${payload.quotationNumber || savedQuotationId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
          } catch (err) {
            console.error("Failed to download PDF", err);
          }
        }
        if (postSaveActions.sendEmail) {
          try {
            await sendEmail({ id: savedQuotationId, companyId }).unwrap();
          } catch (err) {
            console.error("Failed to send email", err);
          }
        }
      }

      if (onSuccess) onSuccess(savedQuotationId);
    } catch (error) {
      console.error("Failed to save quotation:", error);
      alert(error?.data?.message || "Error saving quotation. Check console for details.");
    }
  };

  const transactionValues = {
    ...formData,
    subtotal: calculatedTotals.subtotal,
    taxAmount: calculatedTotals.tax,
    roundOff: calculatedTotals.roundOff,
    grandTotal: calculatedTotals.grandTotal,
    downloadPdf: postSaveActions.downloadPdf,
    sendEmail: postSaveActions.sendEmail
  };

  const selectField = (field, options, placeholder, onValueChange = null, customKey = null) => ({
    ...field,
    render: ({ value, setValue, formValues, setFormValue, disabled, errors }) => (
      <div className="flex flex-col w-full">
        {field.label && (
          <label className="block mb-1 text-[8.5px] font-semibold text-zinc-700">
            {field.label}{field.required ? ' *' : ''}
          </label>
        )}
        <CustomSelect
          value={value || ''}
          onChange={e => {
            const val = e.target.value;
            if (onValueChange) {
              onValueChange(val, setValue, setFormValue, formValues);
            } else {
              setValue(val);
              if (customKey) {
                if (val === 'CUSTOM') {
                  setFormValue(customKey, '');
                } else {
                  const selected = options.find(opt => String(opt.value) === String(val));
                  setFormValue(customKey, selected?.text || selected?.label || '');
                }
              }
            }
          }}
          disabled={disabled}
          className="w-full"
          buttonClassName="w-full h-8 px-2.5 border border-zinc-200 rounded-md bg-white text-[10px] text-zinc-800 flex items-center justify-between outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10 disabled:bg-zinc-50 disabled:text-zinc-400"
        >
          <option value="">{placeholder || 'Select an option'}</option>
          {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          <option value="CUSTOM">Custom</option>
        </CustomSelect>
        {value === 'CUSTOM' && customKey && (
          <div className="flex flex-col gap-1 mt-1.5">
            <textarea
              value={formValues?.[customKey] || ''}
              onChange={e => setFormValue(customKey, e.target.value)}
              disabled={disabled}
              placeholder={`Enter custom ${field.label.toLowerCase()}...`}
              className={`w-full h-auto py-2 px-2.5 border rounded-md bg-white text-[10px] text-zinc-800 outline-none focus:ring-1 disabled:bg-zinc-50 disabled:text-zinc-400 resize-y min-h-[60px] ${errors?.[customKey] ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-zinc-200 focus:border-zinc-400 focus:ring-zinc-900/10'}`}
            />
            {errors?.[customKey] && <p className="text-[8px] text-rose-500">{errors[customKey]}</p>}
          </div>
        )}
      </div>
    )
  });

  const transactionConfig = {
    ...quotationFormConfig,
    title: quotationId ? 'Edit Quotation' : quotationFormConfig.title,
    header: {
      ...quotationFormConfig.header,
      title: quotationId ? 'Edit Quotation' : quotationFormConfig.header.title,
      fields: quotationFormConfig.header.fields.map(field => ({
        ...field,
        render: field.key === 'quotationDate'
          ? ({ value, setValue, disabled }) => <input type="date" value={value || ''} onChange={e => setValue(e.target.value)} disabled={disabled} required={field.required} className="input-field w-28 h-7 text-[8.8px]" />
          : undefined
      }))
    },
    sidebar: {
      sections: [
        {
          ...quotationFormConfig.sidebar.sections[0],
          fields: [
            {
              key: 'customerId', label: 'Customer', required: true,
              render: ({ value, setValue, error }) => (
                <div>
                  <label className="block mb-1 text-[8.5px] font-semibold text-zinc-700">Customer *</label>
                  <CustomerCombobox value={value || ''} onChange={setValue} error={error} />
                  {error && <p className="mt-1 text-[8px] text-red-600">{error}</p>}
                </div>
              )
            },
            quotationFormConfig.sidebar.sections[0].fields[1],
            {
              key: 'placeOfSupplyStateId', label: 'Place of Supply', required: true,
              render: ({ value, setValue, error }) => (
                <div>
                  <label className="block mb-1 text-[8.5px] font-semibold text-zinc-700">Place of Supply *</label>
                  <CustomSelect
                    value={value || ''}
                    onChange={event => setValue(event.target.value)}
                    options={[{ value: '', label: 'Select State...' }, ...gstStates.map(state => ({ value: state.id, label: state.stateName || state.name || state.code }))]}
                    placeholder="Select State..."
                    searchable
                    className="w-full"
                    buttonClassName="w-full h-8 px-2.5 border border-zinc-200 rounded-md bg-white text-[10px] text-zinc-800 flex items-center justify-between outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10"
                  />
                  {error && <p className="mt-1 text-[8px] text-red-600">{error}</p>}
                </div>
              )
            }
          ]
        },
        {
          ...quotationFormConfig.sidebar.sections[1],
          fields: [
            selectField({ key: 'paymentTermId', label: 'Payment Terms' }, paymentTermsList.map(term => ({ value: term.id, label: term.name || term.title, text: term.description })), 'Select Payment Terms...', null, 'paymentTerms'),
            selectField({ key: 'deliveryTermId', label: 'Delivery Terms' }, deliveryTermsList.map(term => ({ value: term.id, label: term.name || term.title, text: term.description })), 'Select Delivery Terms...', null, 'deliveryTerms'),
            selectField({ key: 'warrantyTermId', label: 'Warranty Terms' }, warrantyTermsList.map(term => ({ value: term.id, label: term.name || term.title, text: term.description })), 'Select Warranty Terms...', null, 'warrantyTerms')
          ]
        },
        {
          ...quotationFormConfig.sidebar.sections[2],
          fields: [
            { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional notes for the customer...' },
            selectField({ key: 'termsConditionId', label: 'Terms & Conditions' }, termsConditionsList.map(term => ({ value: term.id, label: term.title, text: term.content })), 'Select Terms & Conditions...', (value, setValue, setFormValue) => {
              setValue(value);
              if (value === 'CUSTOM') {
                setFormValue('termsAndConditions', '');
              } else {
                const selected = termsConditionsList.find(term => String(term.id) === String(value));
                setFormValue('termsAndConditions', selected?.content || '');
              }
            }, 'termsAndConditions')
          ]
        }
      ]
    },
    items: {
      ...quotationFormConfig.items,
      rowRenderer: ({ item, onUpdate, onRemove, canRemove, gridTemplateColumns }) => <QuotationLineItemRow
        item={item}
        products={products}
        productsLoading={productsLoading}
        companyId={companyId}
        onUpdate={(id, field, value) => onUpdate(field, value)}
        onRemove={() => onRemove()}
        canRemove={canRemove}
        currency={formData.quotationCurrency}
        gridTemplateColumns={gridTemplateColumns}
        onAddNewProduct={(rowId, term) => {
          setProductTargetRowId(rowId);
          setNewProductName(term || '');
          setIsAddProductOpen(true);
        }}
      />,
      allowDelete: true
    },
    onItemChange: (item, field, value) => handleUpdateItem(item.id, field, value),
    onAddItem: handleAddItem,
    onRemoveItem: item => handleRemoveItem(item.id),
    summary: {
      ...quotationFormConfig.summary,
      rows: quotationFormConfig.summary.rows.map(row => row.key === 'freightCharges' || row.key === 'otherCharges' ? { ...row, type: 'currency-input' } : row)
    }
  };

  const handleTransactionChange = (key, value) => {
    if (key === 'downloadPdf' || key === 'sendEmail') {
      setPostSaveActions(prev => ({ ...prev, [key]: value }));
      return;
    }
    if (key === 'customerId') {
      setFormData(prev => ({
        ...prev,
        customerId: value,
        customerName: '',
        deliveryAddressId: '',
        deliveryAddressMode: 'existing',
        saveNewDeliveryAddress: false,
        newDeliveryAddress: null
      }));
      return;
    }
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <TransactionForm
        config={transactionConfig}
        values={transactionValues}
        items={items}
        errors={errors}
        onChange={handleTransactionChange}
        onSubmit={() => handleSubmit({ preventDefault: () => {} })}
        onCancel={onClose}
        loading={isCreating || isUpdating}
        mode={quotationId ? 'edit' : 'create'}
        context={{ companyId, customerAddresses, gstStates, paymentTermsList, deliveryTermsList, warrantyTermsList, termsConditionsList }}
      />

      {isAddProductOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl h-[95vh] max-h-[95vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200">
            <div className="flex justify-between items-center px-5 py-4 border-b border-zinc-200 bg-zinc-50/80 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center border border-zinc-200 text-zinc-700">
                  <Package size={16} />
                </div>
                <h2 className="text-base font-bold text-zinc-900 tracking-tight">New Product</h2>
              </div>
              <button type="button" onClick={closeProductModal} className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors active:scale-95">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-white flex flex-col">
              <ProductForm
                initialData={{ productName: newProductName }}
                onSubmit={handleCreateProduct}
                onCancel={closeProductModal}
                isLoading={isCreatingProduct}
              />
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}

