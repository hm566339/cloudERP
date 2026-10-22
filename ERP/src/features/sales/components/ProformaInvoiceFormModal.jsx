import React, { useState, useEffect, useMemo } from 'react';
import CustomSelect from '../../../components/common/CustomSelect';
import { Plus, Trash2, Package, X } from 'lucide-react';
import { useCreateProformaInvoiceFromQuotationMutation, useCreateDirectProformaInvoiceMutation, useUpdateProformaInvoiceMutation, useGetCustomersQuery, useGetQuotationByIdQuery } from '../../../api/sales-crm';
import { useGetBankAccountsQuery } from '../../../api/account/banking.api';
import { useGetChartOfAccountsQuery, useGetGstStatesQuery, useGetHsnSacsQuery, useGetGstSlabsQuery, useGetGstRegistrationsQuery } from '../../../api/account/accounting.api';
import { useGetPaymentTermsQuery } from '../../../api/sales-crm/salesSettings.api';
import { useGetGroupedStockQuery } from '../../../api/inventory/inventory.api';
import { productsApi } from '../../../api/inventory/products';
import ProductForm from '../../inventory/components/ProductForm';
import { useAppDispatch } from '../../../app/hooks';
import { useSelector, useDispatch } from 'react-redux';
import { addAlert } from '../../notifications/notificationSlice';
import { fetchHsnSacs, selectHsnSacItems } from '../../account/store/hsnSacSlice';
import { TransactionForm } from '../../../components/erp/TransactionForm';
import CustomerCombobox from './CustomerCombobox';
import HsnSacSelect from '../../../components/common/HsnSacSelect';
import proformaInvoiceFormConfig from '../configs/proformaInvoiceFormConfig';
import { QuotationLineItemRow } from './QuotationFormModal';

const emptyItem = () => ({
  id: Date.now() + Math.random(),
  itemId: '',
  itemName: '',
  description: '',
  quantity: 1,
  unit: 'Nos',
  unitPrice: 0,
  discountPercent: 0,
  hsnSacCode: '',

  notes: ''
});



export default function ProformaInvoiceFormModal({ 
  isOpen, 
  onClose, 
  companyId, 
  mode = 'create', // 'create', 'edit', or 'direct'
  sourceQuotation, // if create
  existingPI,      // if edit
  onSuccess 
}) {
  const dispatch = useAppDispatch();
  const [createPI, { isLoading: isCreating }] = useCreateProformaInvoiceFromQuotationMutation();
  const [createDirectPI, { isLoading: isCreatingDirect }] = useCreateDirectProformaInvoiceMutation();
  const [updatePI, { isLoading: isUpdating }] = useUpdateProformaInvoiceMutation();

  const skipQuotationFetch = mode !== 'create' || !sourceQuotation?.id;
  const { data: quotationResponse, isLoading: isQuotationLoading, error: quotationError } = useGetQuotationByIdQuery(
    { id: sourceQuotation?.id, companyId },
    { skip: skipQuotationFetch }
  );
  // Backend returns QuotationProfileResponse directly (not wrapped in {success, data})
  // baseApi auto-unwrapper passes it through as-is since there's no success/data envelope
  const fullQuotation = quotationResponse;

  const { data: customersData } = useGetCustomersQuery({ companyId, page: 0, size: 500 }, { skip: !isOpen || mode !== 'direct' });
  const customersList = Array.isArray(customersData) ? customersData : (customersData?.content || customersData?.data?.content || []);

  const { data: productsData, isLoading: productsLoading } = useGetGroupedStockQuery({ companyId, page: 0, size: 50 }, { skip: !isOpen });
  const fetchedProducts = useMemo(() => Array.isArray(productsData) ? productsData : productsData?.data || productsData?.content || [], [productsData]);
  const [createdProducts, setCreatedProducts] = useState([]);
  const productsList = useMemo(() => {
    const productMap = new Map();
    [...fetchedProducts, ...createdProducts].forEach((product) => {
      const productId = product?.productId || product?.id;
      if (productId) productMap.set(String(productId), { ...product, productId });
    });
    return Array.from(productMap.values());
  }, [createdProducts, fetchedProducts]);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productTargetRowId, setProductTargetRowId] = useState(null);
  const [newProductName, setNewProductName] = useState('');
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  const { data: bankAccountsResponse, isLoading: banksLoading } = useGetBankAccountsQuery(
    { companyId, page: 0, size: 100 },
    { skip: !isOpen }
  );
  const bankAccounts = Array.isArray(bankAccountsResponse) ? bankAccountsResponse : (bankAccountsResponse?.data?.content || bankAccountsResponse?.data || bankAccountsResponse?.content || []);

  const { data: chartOfAccountsData, isLoading: accountsLoading } = useGetChartOfAccountsQuery(
    { companyId, page: 0, size: 1000 },
    { skip: !isOpen }
  );
  const rawAccounts = chartOfAccountsData?.data?.data || chartOfAccountsData?.data?.content || chartOfAccountsData?.content || chartOfAccountsData?.data || [];
  const chartOfAccounts = Array.isArray(rawAccounts) ? rawAccounts : [];

  const { data: gstStatesResponse } = useGetGstStatesQuery({ companyId, active: true }, { skip: !isOpen });
  const gstStates = Array.isArray(gstStatesResponse) ? gstStatesResponse : (gstStatesResponse?.data || gstStatesResponse?.content || []);

  // ── GST DATA SOURCES ──
  const reduxHsnItems = useSelector(selectHsnSacItems) || [];
  const { data: hsnApiData } = useGetHsnSacsQuery({ companyId, size: 1000 }, { skip: !isOpen });
  const { data: gstSlabsData } = useGetGstSlabsQuery(companyId, { skip: !isOpen });
  useEffect(() => { if (isOpen && companyId) { dispatch(fetchHsnSacs({ companyId, page: 0, size: 1000 })); } }, [isOpen, companyId, dispatch]);

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
    [...apiHsnList, ...reduxHsnItems].forEach(item => { if (item && (item.id || item.code)) { map.set(String(item.id || item.code), item); } });
    return Array.from(map.values());
  }, [apiHsnList, reduxHsnItems]);

  const { data: gstRegistrationsData } = useGetGstRegistrationsQuery({ companyId }, { skip: !isOpen });
  const gstRegistrations = Array.isArray(gstRegistrationsData) ? gstRegistrationsData : gstRegistrationsData?.data || gstRegistrationsData?.content || [];
  const defaultRegistration = gstRegistrations.find(r => r.isDefault || r.default) || gstRegistrations[0];
  const authUser = JSON.parse(localStorage.getItem("auth_user")) || {};
  const selectedCompany = JSON.parse(localStorage.getItem("selected_company")) || {};
  const authCompany = authUser?.company || {};
  const companyStateCode = (
    defaultRegistration?.stateCode?.stateCode || (typeof defaultRegistration?.stateCode === 'string' ? defaultRegistration.stateCode : '') ||
    (defaultRegistration?.gstin ? defaultRegistration.gstin.substring(0, 2) : '') ||
    selectedCompany.stateCode || (selectedCompany.gstin ? selectedCompany.gstin.substring(0, 2) : '') ||
    authCompany.stateCode || (authCompany.gstin ? authCompany.gstin.substring(0, 2) : '') ||
    authUser.stateCode || '10'
  );

  const [formData, setFormData] = useState({
    piDate: new Date().toISOString().split('T')[0],
    piValidTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    advanceRequired: false,
    advanceAmount: 0,
    bankAccountId: '',
    paymentCondition: '',
    paymentMode: '',
    receivableAccountId: '',
    receiptAccountId: '',
    paymentTerms: '',
    deliveryTerms: '',
    notes: '',
    customerId: '',
    paymentTermId: '',
    placeOfSupplyStateId: '',
    freightCharges: 0,
    otherCharges: 0,
    items: [] 
  });

  const resolvedBuyerStateCode = useMemo(() => {
    if (!formData.placeOfSupplyStateId) return '';
    const match = gstStates.find(s => String(s.id) === String(formData.placeOfSupplyStateId));
    if (match?.stateCode) return String(match.stateCode).padStart(2, '0');
    return '';
  }, [formData?.placeOfSupplyStateId, gstStates]);

  function calculateItemGst({ taxableAmount, cgstRate, sgstRate, igstRate, sellerStateCode, buyerStateCode }) {
    const seller = String(sellerStateCode ?? '').trim();
    const buyer = String(buyerStateCode ?? '').trim();
    const amount = Number(taxableAmount || 0);
    const isIntraState = Boolean(seller && buyer && seller === buyer);
    const numCgst = Number(cgstRate || 0);
    const numSgst = Number(sgstRate || 0);
    let numIgst = Number(igstRate || 0);
    if (numIgst === 0 && (numCgst > 0 || numSgst > 0)) { numIgst = numCgst + numSgst; }
    let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;
    if (isIntraState) { cgstAmount = (amount * numCgst) / 100; sgstAmount = (amount * numSgst) / 100; }
    else { igstAmount = (amount * numIgst) / 100; }
    return { isInterState: !isIntraState, cgstRate: isIntraState ? numCgst : 0, sgstRate: isIntraState ? numSgst : 0, igstRate: isIntraState ? 0 : numIgst, cgstAmount, sgstAmount, igstAmount, totalTax: cgstAmount + sgstAmount + igstAmount };
  }

  function resolveHsnTaxRates(item) {
    const rawCode = String(item.hsnSacCode || '').split('-')[0].trim();
    const rawId = String(item.hsnSacId || '').trim();
    let hsnMaster = allHsnSacs.find(h => {
      const hCode = String(h.code || '').split('-')[0].trim();
      const hId = String(h.id || '').trim();
      return (rawId && hId && hId === rawId) || (rawCode && hCode && (hCode === rawCode || hCode.startsWith(rawCode) || rawCode.startsWith(hCode)));
    });
    if (!hsnMaster && item.hsnSac) hsnMaster = item.hsnSac;
    let cgstRate = Number(hsnMaster?.cgstRate ?? 0), sgstRate = Number(hsnMaster?.sgstRate ?? 0), igstRate = Number(hsnMaster?.igstRate ?? 0);
    if (cgstRate === 0 && sgstRate === 0 && igstRate === 0 && hsnMaster?.gstSlabId) {
      const slab = gstSlabs.find(s => String(s.id) === String(hsnMaster.gstSlabId));
      if (slab) { cgstRate = Number(slab.cgstRate ?? 0); sgstRate = Number(slab.sgstRate ?? 0); igstRate = Number(slab.igstRate ?? 0); }
    }
    if (cgstRate === 0 && sgstRate === 0 && igstRate === 0) {
      const slabName = hsnMaster?.gstSlabName || hsnMaster?.slabName || '';
      const match = String(slabName).match(/(\d+(\.\d+)?)/);
      if (match) { const totalRate = parseFloat(match[1]); if (totalRate > 0) { igstRate = totalRate; cgstRate = totalRate / 2; sgstRate = totalRate / 2; } }
    }
    if (cgstRate === 0 && sgstRate === 0 && igstRate === 0 && (rawCode || rawId)) { cgstRate = 9; sgstRate = 9; igstRate = 18; }
    return { cgstRate, sgstRate, igstRate };
  }

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
      const taxResult = calculateItemGst({ taxableAmount: updated.taxableAmount, cgstRate: rates.cgstRate, sgstRate: rates.sgstRate, igstRate: rates.igstRate, sellerStateCode: companyStateCode, buyerStateCode: resolvedBuyerStateCode });
      updated.isInterState = taxResult.isInterState;
      updated.cgstRate = taxResult.cgstRate; updated.sgstRate = taxResult.sgstRate; updated.igstRate = taxResult.igstRate;
      updated.cgstAmount = taxResult.cgstAmount; updated.sgstAmount = taxResult.sgstAmount; updated.igstAmount = taxResult.igstAmount;
      updated.cessAmount = 0; updated.taxAmount = taxResult.totalTax;
      updated.totalAmount = updated.taxableAmount + updated.taxAmount;
      return updated;
    });
  };

  useEffect(() => {
    if (formData?.items?.length > 0 && resolvedBuyerStateCode && companyStateCode) {
      setFormData(prev => ({ ...prev, items: recalculateTaxes(prev.items) }));
    }
  }, [resolvedBuyerStateCode, companyStateCode, allHsnSacs, gstSlabs]);

  const { data: ptData } = useGetPaymentTermsQuery({ documentType: 'PROFORMA_INVOICE', companyId }, { skip: !isOpen });
  const paymentTermsList = Array.isArray(ptData) ? ptData : (ptData?.data || []);



  const [postSaveActions, setPostSaveActions] = useState({ downloadPdf: false, sendEmail: false });

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && existingPI) {
        setFormData({
          piDate: existingPI.piDate ? new Date(existingPI.piDate).toISOString().split('T')[0] : '',
          piValidTill: existingPI.piValidTill ? new Date(existingPI.piValidTill).toISOString().split('T')[0] : '',
          advanceRequired: existingPI.advanceRequired || false,
          advanceAmount: existingPI.advanceAmount || 0,
          bankAccountId: existingPI.bankAccountId || '',
          paymentCondition: existingPI.notes || '',
          paymentMode: existingPI.paymentMode || '',
          receivableAccountId: existingPI.receivableAccountId || '',
          receiptAccountId: existingPI.receiptAccountId || '',
          paymentTermId: existingPI.paymentTermId || (existingPI.paymentTerms ? 'CUSTOM' : ''),
          paymentTerms: existingPI.paymentTerms || '',
          deliveryTerms: existingPI.deliveryTerms || '',
          notes: existingPI.notes || '',
          customerId: existingPI.customerId || '',
          placeOfSupplyStateId: existingPI.placeOfSupplyStateId || '',
          freightCharges: existingPI.freightCharges || 0,
          otherCharges: existingPI.otherCharges || 0,
          items: existingPI.items ? JSON.parse(JSON.stringify(existingPI.items)).map(i => ({...i, id: i.id || Date.now() + Math.random()})) : []
        });
      } else if (mode === 'create' && fullQuotation && fullQuotation.id) {
        // Backend returns QuotationProfileResponse with nested sub-objects:
        // customerInformation, lineItems, amountSummary, termsAndConditions, taxSummary
        const cust = fullQuotation.customerInformation || {};
        const terms = fullQuotation.termsAndConditions || {};
        const amounts = fullQuotation.amountSummary || {};
        const taxSum = fullQuotation.taxSummary || {};
        // Map lineItems from profile response to the items array the UI expects
        const rawItems = fullQuotation.lineItems || fullQuotation.items || fullQuotation.quotationItems || [];
        const mappedItems = rawItems.map(li => ({
          id: li.id || li.itemId || '',
          itemId: li.itemId || '',
          itemName: li.itemName || '',
          description: li.description || '',
          hsnSacCode: li.hsnSacCode || '',
          quantity: Number(li.quantity) || 0,
          unit: li.unit || 'Nos',
          unitPrice: Number(li.unitPrice) || 0,
          discountPercent: Number(li.discountPercentage || li.discountPercent) || 0,
          discountAmount: Number(li.discountAmount) || 0,
          taxableAmount: Number(li.taxableAmount) || 0,
          cgst: Number(li.cgst || li.cgstAmount) || 0,
          sgst: Number(li.sgst || li.sgstAmount) || 0,
          igst: Number(li.igst || li.igstAmount) || 0,
          cess: Number(li.cess || li.cessAmount) || 0,
          taxAmount: Number(li.taxAmount) || 0,
          totalAmount: Number(li.totalAmount) || 0,

          notes: li.lineRemarks || li.notes || ''
        }));

        setFormData({
          piDate: new Date().toISOString().split('T')[0],
          piValidTill: fullQuotation.validUntil ? new Date(fullQuotation.validUntil).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          advanceRequired: false,
          advanceAmount: 0,
          bankAccountId: '',
          paymentCondition: '',
          paymentMode: '',
          receivableAccountId: '',
          receiptAccountId: '',
          paymentTermId: terms.paymentTermId || (terms.paymentTerms ? 'CUSTOM' : '') || '',
          paymentTerms: terms.paymentTerms || '',
          deliveryTerms: terms.deliveryTerms || '',
          warrantyTerms: terms.warrantyTerms || '',
          termsAndConditions: terms.termsAndConditions || '',
          notes: terms.notes || '',
          customerId: cust.customerId || fullQuotation.customerId || '',
          customerName: cust.customerName || sourceQuotation?.customerName || '',
          placeOfSupplyStateId: fullQuotation.placeOfSupplyStateId || '',
          placeOfSupply: fullQuotation.placeOfSupply || fullQuotation.placeOfSupplyStateCode || cust.state || '',
          freightCharges: Number(amounts.freightCharges) || 0,
          otherCharges: Number(amounts.otherCharges) || 0,
          // Store quotation totals for read-only display in summary
          _subtotal: Number(amounts.subtotal) || 0,
          _discountAmount: Number(amounts.discountAmount) || 0,
          _taxAmount: Number(taxSum.totalTax) || 0,
          _roundOff: Number(amounts.roundOff) || 0,
          _totalAmount: Number(taxSum.grandTotal || amounts.totalAmount) || 0,
          items: mappedItems
        });
      } else if (mode === 'direct') {
        setFormData({
          piDate: new Date().toISOString().split('T')[0],
          piValidTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          advanceRequired: false,
          advanceAmount: 0,
          bankAccountId: '',
          paymentCondition: '',
          paymentMode: '',
          receivableAccountId: '',
          receiptAccountId: '',
          paymentTermId: '',
          paymentTerms: '',
          deliveryTerms: '',
          notes: '',
          customerId: '',
          placeOfSupplyStateId: '',
          freightCharges: 0,
          otherCharges: 0,
          items: [emptyItem()],
        });
      }
    }
  }, [isOpen, mode, sourceQuotation, existingPI, fullQuotation]);

  useEffect(() => {
    if (isOpen && mode === 'direct' && paymentTermsList.length > 0 && !formData.paymentTermId) {
      const defaultPt = paymentTermsList.find(pt => pt.isDefault);
      if (defaultPt) {
        setFormData(prev => ({ ...prev, paymentTermId: defaultPt.id, paymentTerms: defaultPt.description }));
      }
    }
  }, [paymentTermsList, isOpen, mode, formData.paymentTermId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTransactionFieldChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleTransactionItemChange = (item, field, value) => {
    const id = item.id;
    setFormData(prev => {
      let updatedItems = prev.items.map(it => {
        if (it.id !== id) return it;
        let updated = { ...it };
        if (field === 'itemSelection') {
          updated.itemId = value.productId || value.id;
          updated.itemName = value.productName || value.name;
          updated.description = value.description || '';
          updated.unit = value.baseUomName || value.baseUomCode || value.unit || 'PCS';
          updated.unitPrice = value.sellingPrice || value.price || 0;
          updated.hsnSacId = value.hsnSacId || '';
          updated.hsnSacCode = value.hsnSacCode || value.hsnCode || '';
          updated.hsnSacName = value.hsnSacName || '';
          updated.hsnSac = allHsnSacs.find(h => (value.hsnSacId && String(h.id) === String(value.hsnSacId)) || (value.hsnSacCode && String(h.code) === String(value.hsnSacCode))) || null;

        } else if (field === 'hsnSelection') {
          updated.hsnSacId = value.hsnSacId; updated.hsnSacCode = value.hsnSacCode; updated.hsnSacName = value.hsnSacName || ''; updated.hsnSac = value.hsnSac || null;
        } else {
          updated[field] = value;
        }
        return updated;
      });
      return { ...prev, items: recalculateTaxes(updatedItems) };
    });
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        emptyItem()
      ]
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculatedTotals = useMemo(() => {
    // In create mode, use the pre-calculated totals from the quotation profile response
    if (mode === 'create' && formData._subtotal !== undefined) {
      return {
        subtotal: formData._subtotal || 0,
        discount: formData._discountAmount || 0,
        freight: Number(formData.freightCharges) || 0,
        other: Number(formData.otherCharges) || 0,
        tax: formData._taxAmount || 0,
        roundOff: formData._roundOff || 0,
        grandTotal: formData._totalAmount || 0
      };
    }
    // For direct/edit mode, calculate from items
    let subtotal = 0;
    let discount = 0;
    let tax = 0;

    formData.items.forEach(item => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const discPct = parseFloat(item.discountPercent) || 0;
      const grossAmount = qty * price;
      const discAmt = (grossAmount * discPct) / 100;
      subtotal += grossAmount;
      discount += discAmt;
      tax += parseFloat(item.taxAmount || 0); 
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
  }, [formData.items, formData.freightCharges, formData.otherCharges, formData._subtotal, formData._discountAmount, formData._taxAmount, formData._roundOff, formData._totalAmount, mode]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.piDate) throw new Error("PI Date is required.");
      if (!formData.piValidTill) throw new Error("PI Valid Till date is required.");
      if (formData.piValidTill < formData.piDate) throw new Error("PI Valid Till date cannot be before PI Date.");

      if (formData.advanceRequired) {
        if (!formData.advanceAmount || Number(formData.advanceAmount) <= 0) throw new Error("Advance amount must be greater than zero.");
        if (!formData.paymentMode) throw new Error("Please select a Payment Mode for advance payment.");
        if (!formData.bankAccountId) throw new Error("Please select a Bank Account for advance payment.");
        if (!formData.receivableAccountId) throw new Error("Please select a Receivable Account for advance payment.");
        if (!formData.receiptAccountId) throw new Error("Please select a Receipt Account for advance payment.");
      }

      if (mode === 'create') {
        if (!sourceQuotation?.id) throw new Error("No source quotation found.");
        const payload = {
          quotationId: sourceQuotation.id,
          companyId,
          piDate: formData.piDate,
          piValidTill: formData.piValidTill,
          advanceRequired: formData.advanceRequired,
          advanceAmount: formData.advanceRequired ? Number(formData.advanceAmount) : 0,
          bankAccountId: formData.advanceRequired ? (formData.bankAccountId || null) : null,
          paymentCondition: formData.paymentCondition || formData.notes,
          paymentMode: formData.advanceRequired ? (formData.paymentMode || null) : null,
          receivableAccountId: formData.advanceRequired ? (formData.receivableAccountId || null) : null,
          receiptAccountId: formData.advanceRequired ? (formData.receiptAccountId || null) : null
        };
        const response = await createPI(payload).unwrap();
        const createdPi = response?.data || response;
        dispatch(addAlert({ type: 'success', message: `Proforma Invoice${createdPi?.piNumber ? ' ' + createdPi.piNumber : ''} created successfully.` }));
        if (onSuccess) onSuccess(createdPi?.id, createdPi?.piNumber);
        onClose();
        return; 
      } else if (mode === 'direct') {
        if (!formData.customerId) throw new Error("Customer is required.");
        if (!formData.items || formData.items.length === 0) throw new Error("At least one item is required.");
        const payload = {
          companyId,
          piDate: formData.piDate,
          piValidTill: formData.piValidTill,
          customerId: formData.customerId,
          advanceRequired: formData.advanceRequired,
          advanceAmount: formData.advanceRequired ? Number(formData.advanceAmount) : 0,
          bankAccountId: formData.advanceRequired ? (formData.bankAccountId || null) : null,
          paymentTermId: formData.paymentTermId === 'CUSTOM' ? null : (formData.paymentTermId || null),
          paymentTerms: formData.paymentTerms || '',
          deliveryTerms: formData.deliveryTerms || '',
          notes: formData.paymentCondition || formData.notes || '',
          paymentMode: formData.advanceRequired ? (formData.paymentMode || null) : null,
          receivableAccountId: formData.advanceRequired ? (formData.receivableAccountId || null) : null,
          receiptAccountId: formData.advanceRequired ? (formData.receiptAccountId || null) : null,
          freightCharges: Number(formData.freightCharges) || 0,
          otherCharges: Number(formData.otherCharges) || 0,
          items: formData.items.map(item => ({
            ...item,
            quantity: Number(item.quantity) || 0,
            unitPrice: Number(item.unitPrice) || 0,
            discountPercent: Number(item.discountPercent) || 0
          }))
        };
        const response = await createDirectPI(payload).unwrap();
        dispatch(addAlert({ type: 'success', message: 'Direct Proforma Invoice created successfully.' }));
        if (onSuccess) onSuccess(response?.data?.id || response?.id);
        onClose();
        return;
      } else if (mode === 'edit') {
        if (!existingPI?.id) throw new Error("No PI found to edit.");
        const payload = {
          id: existingPI.id,
          companyId,
          piDate: formData.piDate,
          piValidTill: formData.piValidTill,
          advanceRequired: formData.advanceRequired,
          advanceAmount: formData.advanceRequired ? Number(formData.advanceAmount) : 0,
          bankAccountId: formData.advanceRequired ? (formData.bankAccountId || null) : null,
          paymentMode: formData.advanceRequired ? (formData.paymentMode || null) : null,
          receivableAccountId: formData.advanceRequired ? (formData.receivableAccountId || null) : null,
          receiptAccountId: formData.advanceRequired ? (formData.receiptAccountId || null) : null,
          paymentTermId: formData.paymentTermId === 'CUSTOM' ? null : (formData.paymentTermId || null),
          paymentTerms: formData.paymentTerms,
          deliveryTerms: formData.deliveryTerms,
          notes: formData.notes,
          freightCharges: Number(formData.freightCharges) || 0,
          otherCharges: Number(formData.otherCharges) || 0,
          items: formData.items
        };
        await updatePI(payload).unwrap();
        dispatch(addAlert({ type: 'success', message: 'Proforma Invoice updated successfully.' }));
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      dispatch(addAlert({ type: 'error', message: error?.data?.message || error?.message || 'An error occurred' }));
    }
  };

  const handlePrint = () => window.print();

  const isLoading = isCreating || isUpdating || isCreatingDirect;
  const currency = 'INR';
  const transactionValues = {
    ...formData,
    subtotal: calculatedTotals.subtotal,
    discount: calculatedTotals.discount,
    taxableAmount: calculatedTotals.subtotal - (calculatedTotals.discount || 0),
    taxAmount: calculatedTotals.tax,
    roundOff: calculatedTotals.roundOff,
    grandTotal: calculatedTotals.grandTotal,
    balanceDue: calculatedTotals.grandTotal - (Number(formData.advanceAmount) || 0),
    downloadPdf: postSaveActions.downloadPdf,
    sendEmail: postSaveActions.sendEmail,
  };

  const transactionConfig = {
    ...proformaInvoiceFormConfig,
    header: {
      ...proformaInvoiceFormConfig.header,
      title: mode === 'edit' ? 'Edit Proforma Invoice' : (mode === 'direct' ? 'Create Direct Proforma Invoice' : 'Convert Quotation to Proforma Invoice'),
      subtitle: mode === 'create' && sourceQuotation ? `From Quotation: ${sourceQuotation.quotationNumber}` : proformaInvoiceFormConfig.subtitle,
    },
    sidebar: {
      sections: proformaInvoiceFormConfig.sidebar.sections.map(section => ({
        ...section,
        fields: section.fields.map(field => {
          if (field.key === 'customerId') {
            return {
              ...field,
              render: ({ value, setValue, error, disabled }) => mode === 'create' ? (
                <input value={formData.customerName || sourceQuotation?.customerName || ''} disabled className="input-field w-full h-8 text-[8.8px] bg-zinc-50 dark:bg-[#1D212C] text-zinc-800 dark:text-[#E6E8EE]" />
              ) : (
                <div>
                  <CustomerCombobox value={value || ''} onChange={setValue} error={error} disabled={disabled} />
                  {error && <p className="mt-1 text-[8px] text-red-600">{error}</p>}
                </div>
              ),
            };
          }
          if (field.key === 'placeOfSupplyStateId') {
            return { ...field, options: gstStates.map(state => ({ value: state.id, label: state.stateName || state.name || state.code })) };
          }
          if (field.key === 'paymentTermId') {
            return { ...field, options: [...paymentTermsList.map(term => ({ value: term.id, label: term.name || term.title })), { value: 'CUSTOM', label: 'Custom' }] };
          }
          if (field.key === 'paymentMode') {
            return { ...field, options: ['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'CARD'].map(value => ({ value, label: value })) };
          }
          if (field.key === 'bankAccountId') return { ...field, options: bankAccounts.map(account => ({ value: account.id, label: `${account.bankName} - ${account.accountNumber}` })), readOnly: !formData.advanceRequired };
          if (field.key === 'receivableAccountId') {
            const options = chartOfAccounts
              .filter(a => a.postingAllowed !== false && (a.groupName === 'Accounts Receivable' || a.accountName?.toLowerCase().includes('receivable')))
              .map(account => ({ value: account.id, label: `${account.accountName} (${account.accountCode})` }));
            return { ...field, options, readOnly: !formData.advanceRequired };
          }
          if (field.key === 'receiptAccountId') {
            const options = chartOfAccounts
              .filter(a => a.postingAllowed !== false && (a.groupName === 'Cash & Cash Equivalent' || a.groupName === 'Bank Accounts' || a.accountName?.toLowerCase().includes('cash') || a.accountName?.toLowerCase().includes('bank')))
              .map(account => ({ value: account.id, label: `${account.accountName} (${account.accountCode})` }));
            return { ...field, options, readOnly: !formData.advanceRequired };
          }
          if (field.key === 'advanceAmount') return { ...field, readOnly: !formData.advanceRequired };
          return field;
        }),
      })),
    },
    items: {
      ...proformaInvoiceFormConfig.items,
      rowRenderer: ({ item, onUpdate, onRemove, canRemove, gridTemplateColumns, disabled: rowDisabled }) => (
        <QuotationLineItemRow
          item={item}
          products={productsList}
          productsLoading={productsLoading}
          companyId={companyId}
          onUpdate={(id, field, value) => handleTransactionItemChange(item, field, value)}
          onRemove={() => onRemove()}
          canRemove={canRemove}
          currency={currency}
          gridTemplateColumns={gridTemplateColumns}
          onAddNewProduct={(rowId, term) => { setProductTargetRowId(item.id); setNewProductName(term || ''); setIsAddProductOpen(true); }}
        />
      ),
    },
    onItemChange: handleTransactionItemChange,
    onAddItem: handleAddItem,
    onRemoveItem: item => handleRemoveItem(formData.items.findIndex(candidate => candidate === item || candidate.id === item.id)),
    footer: {
      ...proformaInvoiceFormConfig.footer,
      rightActions: proformaInvoiceFormConfig.footer.rightActions.map(action => action.key === 'save' ? { ...action, label: mode === 'edit' ? 'Save Changes' : 'Create Proforma Invoice' } : action),
    },
  };

  if (!isOpen) return null;

  const closeProductModal = () => { setIsAddProductOpen(false); setProductTargetRowId(null); setNewProductName(''); };
  const handleCreateProduct = async (payload) => {
    try {
      setIsCreatingProduct(true);
      const result = await productsApi.create(payload);
      const product = result?.data || result;
      const productId = product?.productId || product?.id;
      if (!productId) throw new Error('Product was created but no product ID was returned.');
      const normalizedProduct = { ...product, productId, productName: product.productName || payload.productName, baseUomName: product.baseUomName || product.baseUom?.name || product.baseUom?.uomName, baseUomCode: product.baseUomCode || product.baseUom?.code || product.baseUom?.uomCode, hsnSacId: product.hsnSacId || product.hsnSac?.id, hsnSacCode: product.hsnSacCode || product.hsnSac?.code, hsnSacName: product.hsnSacName || product.hsnSac?.description || product.hsnSac?.name };
      setCreatedProducts(prev => [normalizedProduct, ...prev.filter(item => String(item.productId || item.id) !== String(productId))]);
      handleTransactionItemChange({ id: productTargetRowId }, 'itemSelection', normalizedProduct);
      closeProductModal();
    } catch (error) {
      window.alert(error?.response?.data?.message || error?.data?.message || error?.message || 'Failed to create product');
    } finally {
      setIsCreatingProduct(false);
    }
  };

  return (
    <>
      <TransactionForm
        config={transactionConfig}
        values={transactionValues}
        items={formData.items}
        errors={{}}
        onChange={handleTransactionFieldChange}
        onSubmit={() => handleSubmit({ preventDefault: () => {} })}
        onCancel={onClose}
        onPrint={handlePrint}
        loading={isLoading}
        mode={mode === 'edit' ? 'edit' : 'create'}
        context={{ companyId, gstStates, paymentTermsList, bankAccounts, chartOfAccounts, mode }}
      />
      {isAddProductOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#161922] w-full max-w-2xl h-[95vh] max-h-[95vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200 dark:border-[#2A2F3D]">
            <div className="flex justify-between items-center px-5 py-4 border-b border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/80 dark:bg-[#1D212C] shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#222736] flex items-center justify-center border border-zinc-200 dark:border-[#2A2F3D] text-zinc-700 dark:text-[#A0A6B5]">
                  <Package size={16} />
                </div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight">New Product</h2>
              </div>
              <button type="button" onClick={closeProductModal} className="p-1 text-zinc-400 dark:text-[#6B7184] hover:text-zinc-900 dark:hover:text-[#E6E8EE] hover:bg-zinc-200 dark:hover:bg-[#222736] rounded-md transition-colors active:scale-95">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-white dark:bg-[#161922] flex flex-col">
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
    </>
  );


}
