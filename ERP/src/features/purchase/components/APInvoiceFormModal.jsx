import { useGetPurchaseOrdersQuery, useGetGoodsReceiptsQuery } from '../../../api/purchase';
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, Package, Printer, Loader2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useApiQuery } from '../../../hooks/useApi';
import { chartOfAccountsApi } from '../../../api/account';
import apiClient from '../../../api/common/client';
import CustomSelect from '../../../components/common/CustomSelect';
import ComboBox from '../../../components/common/ComboBox';
import VendorFormModal from '../../account/components/VendorFormModal';
import ChartOfAccountsModal from '../../finance/components/ChartOfAccountsModal';
import { useGetAccountGroupsQuery } from '../../../api/account';
import { useGetProductsQuery, useGetWarehousesQuery, useGetWarehouseLocationsQuery } from '../../../api/inventory/inventory.api';
import useDebounce from '../../../hooks/useDebounce';
import ProductForm from '../../inventory/components/ProductForm';
import { productsApi } from '../../../api/inventory/products';
import { useGetGstStatesQuery } from '../../../api/account/accounting.api';
import HsnSacSelect from '../../../components/common/HsnSacSelect';
import HsnSacFormModal from '../../finance/components/HsnSacFormModal';

const gridStyle = { display: 'grid', gridTemplateColumns: '105px minmax(180px, 1.5fr) 120px 120px 100px 65px 95px 90px 70px 90px 32px', gap: '8px', alignItems: 'center' };

const APInvoiceLineItemRow = ({ item, products, warehouses, expenseAccountOptions, onUpdate, onRemove, canRemove, setActiveAccountTarget, setIsAddAccountOpen, companyId, currency, isSystemAdmin, onAddNewItem, setAddHsnSacTargetRowId }) => {
  const { data: locationsData, isLoading: isLoadingLocations } = useGetWarehouseLocationsQuery(
    { companyId, isSystemAdmin, warehouseId: item.warehouseId, size: 500 },
    { skip: !item.warehouseId || item.itemType !== 'PRODUCT' }
  );

  const locations = Array.isArray(locationsData) ? locationsData : locationsData?.data?.content || locationsData?.data || [];

  return (
    <div className="w-full min-w-0 bg-white dark:bg-card-dark hover:bg-zinc-50/50 dark:hover:bg-hover-dark/40 border-b border-zinc-100 dark:border-[#2A2F3D] last:border-0 p-2" style={gridStyle}>
      {/* Type */}
      <div className="min-w-0 max-w-full">
        <CustomSelect
          className="input-field w-full min-w-0 h-8 text-[8.8px] text-zinc-700 dark:text-zinc-200 bg-white dark:bg-surface-dark box-border"
          value={item.itemType}
          onChange={e => onUpdate(item.id, 'itemType', e.target.value)}
        >
          <option value="EXPENSE">Expense</option>
          <option value="PRODUCT">Product</option>
        </CustomSelect>
      </div>

      {/* Product / Expense Details */}
      <div className="min-w-0 max-w-full">
        {item.itemType === 'PRODUCT' ? (
          <CustomSelect
            className="input-field w-full min-w-0 h-8 text-[8.8px] text-zinc-700 dark:text-zinc-200 bg-white dark:bg-surface-dark box-border overflow-hidden text-ellipsis whitespace-nowrap"
            value={item.itemId || ''}
            onChange={e => onUpdate(item.id, 'itemId', e.target.value)}
            searchable={true}
            comboInput={true}
            onSearch={(term) => onUpdate('SEARCH', 'itemSearch', term)}
            bottomAction={({ closeDropdown, searchTerm }) => {
              const exactMatch = products.find(p => (p.productName || p.name || '').toLowerCase() === (searchTerm || '').toLowerCase());
              if (searchTerm && !exactMatch) {
                return (
                  <button
                    type="button"
                    onClick={() => {
                      closeDropdown();
                      if (onAddNewItem) onAddNewItem(item.id, searchTerm);
                    }}
                    className="w-full text-left px-3 py-2 text-[9.6px] text-primary hover:bg-zinc-50 flex items-center gap-1 font-medium"
                  >
                    <Plus size={14} /> Create "{searchTerm}"
                  </button>
                );
              }
              return null;
            }}
            required
          >
            <option value="">Select Product</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{`${p.productCode || p.id.slice(0, 6)} - ${p.productName || p.name}`}</option>
            ))}
          </CustomSelect>
        ) : (
          <input
            type="text"
            placeholder="Description"
            className="input-field w-full min-w-0 h-8 text-[8.8px] text-zinc-700 dark:text-zinc-200 bg-white dark:bg-surface-dark px-2 box-border overflow-hidden text-ellipsis whitespace-nowrap"
            title={item.description}
            value={item.description}
            onChange={e => onUpdate(item.id, 'description', e.target.value)}
            required
          />
        )}
      </div>

      {/* HSN/SAC */}
      <div className="min-w-0 max-w-full">
        <HsnSacSelect
          value={item.hsnSacId}
          onChange={e => onUpdate(item.id, 'hsnSacId', e.target.value)}
          onAddNew={() => setAddHsnSacTargetRowId(item.id)}
          buttonClassName="w-full h-8 border border-zinc-200 rounded-md text-[8.8px] hover:border-zinc-300 flex items-center justify-between bg-white dark:bg-surface-dark text-zinc-800 dark:text-zinc-200"
          placeholder="HSN/SAC"
        />
      </div>

      {/* Account / Warehouse */}
      <div className="min-w-0 max-w-full">
        {item.itemType === 'PRODUCT' ? (
          <CustomSelect
            className="input-field w-full min-w-0 h-8 text-[8.8px] text-zinc-700 dark:text-zinc-200 bg-white dark:bg-surface-dark box-border"
            value={item.warehouseId || ''}
            onChange={e => onUpdate(item.id, 'warehouseId', e.target.value)}
            required
          >
            <option value="">Warehouse</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name || w.warehouseName}</option>
            ))}
          </CustomSelect>
        ) : (
          <ComboBox
            value={item.expenseAccountId}
            onChange={val => onUpdate(item.id, 'expenseAccountId', val)}
            options={expenseAccountOptions}
            placeholder="Search A/C..."
            inputClassName="w-full min-w-0 box-border h-8 pl-8 pr-2 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[8.8px] hover:border-zinc-300 focus:border-zinc-400 outline-none"
            required={item.itemType === 'EXPENSE'}
            onCreateClick={(searchTerm) => { setActiveAccountTarget({ type: 'item', id: item.id }); setIsAddAccountOpen(true); }}
            createSubtext="Add as new account"
          />
        )}
      </div>

      {/* Location */}
      <div className="min-w-0 max-w-full">
        {item.itemType === 'PRODUCT' ? (
          <CustomSelect
            className="input-field w-full min-w-0 h-8 text-[8.8px] text-zinc-700 dark:text-zinc-200 bg-white dark:bg-surface-dark box-border"
            value={item.locationId || ''}
            onChange={e => onUpdate(item.id, 'locationId', e.target.value)}
            required
            disabled={!item.warehouseId || isLoadingLocations}
          >
            <option value="">{isLoadingLocations ? '...' : 'Location'}</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.locationName || loc.name || loc.locationCode}</option>
            ))}
          </CustomSelect>
        ) : (
          <div className="w-full min-w-0 box-border h-8 bg-zinc-50 rounded-md border border-zinc-200/60 flex items-center justify-center text-zinc-400 text-xs">-</div>
        )}
      </div>

      {/* Qty */}
      <div className="min-w-0 max-w-full">
        <input type="number" min="0.01" step="0.01" className="input-field w-full min-w-0 h-8 text-center text-[8.8px] bg-white dark:bg-surface-dark dark:text-zinc-100 box-border" value={item.quantity} onChange={e => onUpdate(item.id, 'quantity', e.target.value)} required />
      </div>

      {/* UOM */}
      <div className="min-w-0 max-w-full">
        <input
          type="text"
          placeholder="UOM"
          className="input-field w-full min-w-0 h-8 text-center text-[8.8px] uppercase bg-white box-border"
          value={item.unit}
          onChange={e => onUpdate(item.id, 'unit', e.target.value)}
        />
      </div>

      {/* Price */}
      <div className="min-w-0 max-w-full">
        <input type="number" min="0" step="0.01" className="input-field w-full min-w-0 h-8 text-right text-[8.8px] bg-white dark:bg-surface-dark dark:text-zinc-100 box-border" value={item.unitPrice} onChange={e => onUpdate(item.id, 'unitPrice', e.target.value)} required />
      </div>

      {/* Tax % */}
      <div className="min-w-0 max-w-full">
        <input type="number" min="0" step="1" className="input-field w-full min-w-0 h-8 text-center text-[8.8px] bg-white dark:bg-surface-dark dark:text-zinc-100 box-border" value={item.taxSlab} onChange={e => onUpdate(item.id, 'taxSlab', parseFloat(e.target.value) || 0)} />
      </div>

      {/* Total */}
      <div className="text-right font-bold text-zinc-800 text-[8.8px] truncate px-1 min-w-0 max-w-full">
        {(((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)) * (1 + (parseFloat(item.taxSlab) || 0) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>

      {/* Delete */}
      <div className="flex justify-center items-center min-w-0 max-w-full">
        <button type="button" onClick={() => onRemove(item.id)} className="p-1 text-zinc-400 hover:text-red-500 rounded hover:bg-red-50 flex justify-center w-full min-w-0 box-border" disabled={!canRemove}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default function APInvoiceFormModal({ isOpen, onClose, onSubmit, initialData }) {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
  const authUser = JSON.parse(localStorage.getItem("auth_user")) || {};
  const isSystemAdmin = authUser?.roles?.includes('ROLE_SYSTEM_ADMIN') || authUser?.roles?.includes('ROLE_SUPER_ADMIN') || authUser?.role === 'SYSTEM_ADMIN';

  const [vendors, setVendors] = useState([]);
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [vendorSearchTerm, setVendorSearchTerm] = useState('');

  const [vendorAddresses, setVendorAddresses] = useState([]);
  const [isAddVendorAddressOpen, setIsAddVendorAddressOpen] = useState(false);
  const [addHsnSacTargetRowId, setAddHsnSacTargetRowId] = useState(null);

  const { data: gstStatesData } = useGetGstStatesQuery({ companyId, active: true }, { skip: !isOpen });
  let gstStates = [];
  if (Array.isArray(gstStatesData)) {
    gstStates = gstStatesData;
  } else if (gstStatesData?.data?.records) {
    gstStates = gstStatesData.data.records;
  } else if (gstStatesData?.records) {
    gstStates = gstStatesData.records;
  } else if (gstStatesData?.data?.states) {
    gstStates = gstStatesData.data.states;
  } else if (gstStatesData?.states) {
    gstStates = gstStatesData.states;
  }

  const [downloadPdfFlag, setDownloadPdfFlag] = useState(false);
  const [sendEmailFlag, setSendEmailFlag] = useState(false);

  const [vendorSearchInput, setVendorSearchInput] = useState('');
  const debouncedVendorSearch = useDebounce(vendorSearchInput, 500);

  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [addItemTargetRowId, setAddItemTargetRowId] = useState(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  const fetchVendors = (search = '') => {
    apiClient.get(`/api/account/v1/vendors/search?query=${search}`).then(res => {
      setVendors(res.data?.data?.content || []);
    }).catch(() => { });
  };

  useEffect(() => {
    if (isOpen) {
      fetchVendors(debouncedVendorSearch);
    }
  }, [isOpen, debouncedVendorSearch]);

  const { data: accountsData, refetch: refetchAccounts } = useApiQuery(chartOfAccountsApi.getList, { companyId, size: 1000 }, { enabled: isOpen });
  const accounts = Array.isArray(accountsData?.data?.data) ? accountsData.data.data :
    Array.isArray(accountsData?.data?.content) ? accountsData.data.content :
      Array.isArray(accountsData?.data) ? accountsData.data :
        Array.isArray(accountsData?.content) ? accountsData.content :
          Array.isArray(accountsData) ? accountsData : [];

  const expenseAccountOptions = useMemo(() => {
    const filtered = accounts.filter(a => {
      const isActive = a.isActive === true || String(a.isActive) === 'true';
      const isPostingAllowed = a.postingAllowed === true || String(a.postingAllowed) === 'true';
      const hasExpenseGroup = a.groupName && a.groupName.toLowerCase().includes('expense');
      return isActive && isPostingAllowed && hasExpenseGroup;
    });
    return filtered.map(a => ({ value: a.id, label: `${a.accountCode} - ${a.accountName}` }));
  }, [accounts]);

  const cgstAccountOptions = useMemo(() => {
    const filtered = accounts.filter(a => {
      const isActive = a.isActive === true || String(a.isActive) === 'true';
      const isPostingAllowed = a.postingAllowed === true || String(a.postingAllowed) === 'true';
      const isCgst = a.accountName && a.accountName.toLowerCase().includes('cgst');
      return isActive && isPostingAllowed && isCgst;
    });
    return filtered.map(a => ({ value: a.id, label: `${a.accountCode} - ${a.accountName}` }));
  }, [accounts]);

  const sgstAccountOptions = useMemo(() => {
    const filtered = accounts.filter(a => {
      const isActive = a.isActive === true || String(a.isActive) === 'true';
      const isPostingAllowed = a.postingAllowed === true || String(a.postingAllowed) === 'true';
      const isSgst = a.accountName && a.accountName.toLowerCase().includes('sgst');
      return isActive && isPostingAllowed && isSgst;
    });
    return filtered.map(a => ({ value: a.id, label: `${a.accountCode} - ${a.accountName}` }));
  }, [accounts]);

  const igstAccountOptions = useMemo(() => {
    const filtered = accounts.filter(a => {
      const isActive = a.isActive === true || String(a.isActive) === 'true';
      const isPostingAllowed = a.postingAllowed === true || String(a.postingAllowed) === 'true';
      const isIgst = a.accountName && a.accountName.toLowerCase().includes('igst');
      return isActive && isPostingAllowed && isIgst;
    });
    return filtered.map(a => ({ value: a.id, label: `${a.accountCode} - ${a.accountName}` }));
  }, [accounts]);

  const { data: groupsResponse } = useGetAccountGroupsQuery({ pageSize: 1000 });
  const groups = groupsResponse?.data?.content || groupsResponse?.data || groupsResponse?.content || [];

  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const debouncedItemSearchTerm = useDebounce(itemSearchTerm, 500);

  const { data: productsData } = useGetProductsQuery({ companyId, isSystemAdmin, searchKey: debouncedItemSearchTerm, page: 0, size: 50 }, { skip: !isOpen });
  const products = Array.isArray(productsData) ? productsData : productsData?.data?.content || productsData?.data || productsData?.content || [];

  const { data: warehousesData } = useGetWarehousesQuery({ companyId, isSystemAdmin }, { skip: !isOpen });
  const warehouses = Array.isArray(warehousesData) ? warehousesData : warehousesData?.data?.content || warehousesData?.data || [];

  const { data: purchaseOrdersData } = useGetPurchaseOrdersQuery({ companyId }, { skip: !isOpen });
  const purchaseOrders = Array.isArray(purchaseOrdersData) ? purchaseOrdersData : purchaseOrdersData?.data?.content || purchaseOrdersData?.data || purchaseOrdersData?.content || [];

  const { data: goodsReceiptsData } = useGetGoodsReceiptsQuery({ companyId }, { skip: !isOpen });
  const goodsReceipts = Array.isArray(goodsReceiptsData) ? goodsReceiptsData : goodsReceiptsData?.data?.content || goodsReceiptsData?.data || goodsReceiptsData?.content || [];

  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [activeAccountTarget, setActiveAccountTarget] = useState(null);
  const [accountSearchTerm, setAccountSearchTerm] = useState('');

  const createAccount = async (payload) => {
    try {
      const response = await chartOfAccountsApi.create(payload);
      refetchAccounts();
      return { success: true, data: response?.data || response };
    } catch (err) {
      return { success: false, message: err?.response?.data?.message || err.message };
    }
  };

  const handleAccountSuccess = (newAccount) => {
    setIsAddAccountOpen(false);
    if (newAccount?.id) {
      if (activeAccountTarget === 'cgst') {
        setFormData(prev => ({ ...prev, inputCgstAccountId: newAccount.id }));
      } else if (activeAccountTarget === 'sgst') {
        setFormData(prev => ({ ...prev, inputSgstAccountId: newAccount.id }));
      } else if (activeAccountTarget === 'igst') {
        setFormData(prev => ({ ...prev, inputIgstAccountId: newAccount.id }));
      } else if (activeAccountTarget?.type === 'item') {
        handleItemChange(activeAccountTarget.id, 'expenseAccountId', newAccount.id);
      }
    }
  };

  const [formData, setFormData] = useState({
    vendorId: '',
    purchaseOrderId: initialData?.purchaseOrderId || '',
    goodsReceiptId: initialData?.goodsReceiptId || '',
    allowVariance: false,
    vendorAddressId: '',
    placeOfSupplyStateId: '',
    saveNewVendorAddress: false,
    newVendorAddress: {
      addressType: 'BILLING',
      addressLine1: '',
      addressLine2: '',
      city: '',
      gstStateId: '',
      country: 'India',
      postalCode: ''
    },
    invoiceNo: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    invoiceCurrency: 'INR',
    exchangeRate: 1,
    notes: '',
    inputCgstAccountId: '',
    inputSgstAccountId: '',
    inputIgstAccountId: '',
    inputCessAccountId: '',
    tdsAmount: 0,
    status: 'DRAFT',
    glPostingStatus: 'DRAFT',
    isReverseCharge: false,
    isBlockedItc: false
  });

  const [items, setItems] = useState([
    { id: Date.now(), itemType: 'EXPENSE', itemId: '', warehouseId: '', locationId: '', unit: 'PCS', description: '', quantity: 1, unitPrice: 0, taxSlab: 0, expenseAccountId: '', itcEligibility: 'INPUTS', reversalType: '', reversalReason: '', isCommonCredit: false, exemptSupply: 0, hsnSacId: '', hsnSacCode: '' }
  ]);

  useEffect(() => {
    if (formData.vendorId) {
      apiClient.get(`/api/account/v1/vendors/${formData.vendorId}/addresses`)
        .then(res => {
          const addresses = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
          setVendorAddresses(addresses);

          if (addresses.length > 0) {
            if (!formData.vendorAddressId && !initialData?.vendorAddressId) {
              const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
              setFormData(prev => ({
                ...prev,
                vendorAddressId: defaultAddr.id,
                saveNewVendorAddress: false,
                placeOfSupplyStateId: prev.placeOfSupplyStateId || defaultAddr.gstStateId || defaultAddr.gstState?.id || ''
              }));
            }
          } else {
            // Fallback to Vendor Master
            const vendor = vendors.find(v => v.id === formData.vendorId);
            if (vendor) {
              const vendorStateName = vendor.state || vendor.gstState?.stateName;
              let resolvedStateId = '';
              if (vendorStateName && gstStates.length > 0) {
                const matchedState = gstStates.find(s =>
                  s.stateName?.toLowerCase() === vendorStateName.toLowerCase() ||
                  s.stateCode === vendorStateName
                );
                if (matchedState) {
                  resolvedStateId = matchedState.id;
                }
              }
              setFormData(prev => ({
                ...prev,
                vendorAddressId: 'FALLBACK',
                saveNewVendorAddress: false,
                placeOfSupplyStateId: prev.placeOfSupplyStateId || resolvedStateId
              }));
            }
          }
        })
        .catch(err => {
          console.error("Failed to fetch vendor addresses", err);
          setVendorAddresses([]);
        });
    } else {
      setVendorAddresses([]);
    }
  }, [formData.vendorId, vendors, gstStates]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          vendorId: initialData.vendorId || '',
          vendorAddressId: initialData.vendorAddressId || '',
          placeOfSupplyStateId: initialData.placeOfSupplyStateId || '',
          saveNewVendorAddress: false,
          newVendorAddress: {
            addressType: 'BILLING',
            addressLine1: '',
            addressLine2: '',
            city: '',
            gstStateId: '',
            country: 'India',
            postalCode: ''
          },
          invoiceNo: initialData.invoiceNo || '',
          invoiceDate: initialData.invoiceDate || new Date().toISOString().split('T')[0],
          dueDate: initialData.dueDate || '',
          invoiceCurrency: initialData.invoiceCurrency || 'INR',
          exchangeRate: initialData.exchangeRate || 1,
          notes: initialData.notes || '',
          inputCgstAccountId: initialData.inputCgstAccountId || '',
          inputSgstAccountId: initialData.inputSgstAccountId || '',
          inputIgstAccountId: initialData.inputIgstAccountId || '',
          inputCessAccountId: initialData.inputCessAccountId || '',
          tdsAmount: initialData.tdsAmount || 0,
          status: initialData.status || 'DRAFT',
          glPostingStatus: initialData.glPostingStatus || 'DRAFT',
          isReverseCharge: initialData.isReverseCharge || false,
          isBlockedItc: initialData.isBlockedItc || false
        });
        if (initialData.items && initialData.items.length > 0) {
          setItems(initialData.items.map(item => ({
            id: item.id || Date.now() + Math.random(),
            itemType: item.itemType || (item.itemId ? 'PRODUCT' : 'EXPENSE'),
            itemId: item.itemId || '',
            warehouseId: item.warehouseId || '',
            locationId: item.locationId || '',
            unit: item.unit || 'PCS',
            description: item.description || '',
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            taxSlab: item.taxPercentage || item.taxSlab || 0,
            expenseAccountId: item.expenseAccountId || '',
            itcEligibility: item.itcEligibility || 'INPUTS',
            reversalType: item.reversalType || '',
            reversalReason: item.reversalReason || '',
            isCommonCredit: item.isCommonCredit || false,
            exemptSupply: item.exemptSupply || 0,
            hsnSacId: item.hsnSacId || item.hsnSacMaster?.id || '',
            hsnSacCode: item.hsnSacCode || item.hsnSacMaster?.code || ''
          })));
        }
      } else {
        setFormData({
          vendorId: '', vendorAddressId: '', placeOfSupplyStateId: '', saveNewVendorAddress: false,
          newVendorAddress: { addressType: 'BILLING', addressLine1: '', addressLine2: '', city: '', gstStateId: '', country: 'India', postalCode: '' },
          invoiceNo: '',
          invoiceDate: new Date().toISOString().split('T')[0], dueDate: '',
          invoiceCurrency: 'INR', exchangeRate: 1, notes: '',
          inputCgstAccountId: '', inputSgstAccountId: '', inputIgstAccountId: '', inputCessAccountId: '',
          tdsAmount: 0, status: 'DRAFT', glPostingStatus: 'DRAFT',
          isReverseCharge: false, isBlockedItc: false
        });
        setItems([{ id: Date.now(), itemType: 'EXPENSE', itemId: '', warehouseId: '', locationId: '', unit: 'PCS', description: '', quantity: 1, unitPrice: 0, taxSlab: 0, expenseAccountId: '', itcEligibility: 'INPUTS', reversalType: '', reversalReason: '', isCommonCredit: false, exemptSupply: 0, hsnSacId: '', hsnSacCode: '' }]);
      }
    }
  }, [isOpen, initialData]);

  const handleSelectPO = (poId) => {
    setFormData(prev => {
      const upd = { ...prev, purchaseOrderId: poId };
      if (poId) {
        const po = purchaseOrders.find(p => p.id === poId);
        if (po && po.vendorId && !prev.vendorId) {
          upd.vendorId = po.vendorId;
        }
      }
      return upd;
    });
  };

  const handleSelectGRN = (grnId) => {
    setFormData(prev => {
      const upd = { ...prev, goodsReceiptId: grnId };
      if (grnId) {
        const grn = goodsReceipts.find(g => g.id === grnId);
        if (grn) {
          if (grn.purchaseOrderId || grn.purchaseOrder?.id) {
            upd.purchaseOrderId = grn.purchaseOrderId || grn.purchaseOrder?.id;
          }
          if (grn.vendorId && !prev.vendorId) {
            upd.vendorId = grn.vendorId;
          }
        }
      }
      return upd;
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = async (id, field, value) => {
    if (id === 'SEARCH' && field === 'itemSearch') {
      setItemSearchTerm(value);
      return;
    }

    let shouldFetchStock = false;

    setItems(prevItems => {
      let nextItems = prevItems.map(item => {
        if (item.id === id) {
          let updatedItem = { ...item, [field]: value };
          if (field === 'itemType') {
            if (value === 'EXPENSE') {
              updatedItem.itemId = '';
              updatedItem.warehouseId = '';
              updatedItem.locationId = '';
              updatedItem.hsnSacId = '';
              updatedItem.hsnSacCode = '';
            }
          }
          if (field === 'warehouseId') {
            updatedItem.locationId = '';
          }
          if (field === 'itemId') {
            if (value) {
              const selectedProduct = products.find(p => p.id === value);
              shouldFetchStock = true;

              if (selectedProduct) {
                updatedItem.description = selectedProduct.description || selectedProduct.productName || selectedProduct.name || '';
                updatedItem.unitPrice = selectedProduct.purchasePrice || selectedProduct.standardCost || selectedProduct.unitPrice || selectedProduct.price || 0;
                updatedItem.quantity = 1;
                updatedItem.unit = selectedProduct.baseUomCode || selectedProduct.unit || 'PCS';
                updatedItem.taxSlab = selectedProduct.taxPercentage || updatedItem.taxSlab;
                updatedItem.hsnSacId = '';
                updatedItem.hsnSacCode = '';
                updatedItem.stockProduct = null;
                updatedItem.isStockLoading = true;
              }
            } else {
              updatedItem.description = '';
              updatedItem.unitPrice = 0;
              updatedItem.quantity = 1;
              updatedItem.hsnSacId = '';
              updatedItem.hsnSacCode = '';
              updatedItem.stockProduct = null;
            }
          }
          return updatedItem;
        }
        return item;
      });
      return nextItems;
    });

    if (shouldFetchStock) {
      try {
        const response = await productsApi.getIntegrationStockProducts();
        const stockData = Array.isArray(response) ? response : response?.data?.content || response?.data || [];
        const selectedStock = stockData.find(product => product.productId === value);

        if (selectedStock) {
          setItems(prevItems => prevItems.map(item => {
            if (item.id === id) {
              return {
                ...item,
                hsnSacId: selectedStock.hsnSacId || '',
                hsnSacCode: selectedStock.hsnSacCode || '',
                stockProduct: selectedStock,
                isStockLoading: false
              };
            }
            return item;
          }));
        } else {
          setItems(prevItems => prevItems.map(item =>
            item.id === id
              ? { ...item, hsnSacId: '', hsnSacCode: '', isStockLoading: false }
              : item
          ));
        }
      } catch (error) {
        console.error("Failed to fetch stock", error);
        setItems(prevItems => prevItems.map(item => item.id === id ? { ...item, isStockLoading: false } : item));
      }
    }
  };

  const handleAddItem = () => {
    setItems([...items, { id: Date.now() + Math.random(), itemType: 'EXPENSE', itemId: '', warehouseId: '', locationId: '', unit: 'PCS', description: '', quantity: 1, unitPrice: 0, taxSlab: 0, expenseAccountId: '', itcEligibility: 'INPUTS', reversalType: '', reversalReason: '', isCommonCredit: false, exemptSupply: 0, hsnSacId: '', hsnSacCode: '' }]);
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const financials = useMemo(() => {
    let subtotal = 0;
    let taxAmount = 0;

    const processedItems = items.map(item => {
      const taxableAmount = Number(((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)).toFixed(2));
      const itemTax = Number((taxableAmount * ((parseFloat(item.taxSlab) || 0) / 100)).toFixed(2));
      subtotal += taxableAmount;
      taxAmount += itemTax;

      return {
        ...item,
        taxableAmount,
        taxAmount: itemTax,
        totalAmount: Number((taxableAmount + itemTax).toFixed(2))
      };
    });

    subtotal = Number(subtotal.toFixed(2));
    taxAmount = Number(taxAmount.toFixed(2));

    const cgstAmount = Number((taxAmount / 2).toFixed(2));
    const sgstAmount = Number((taxAmount / 2).toFixed(2));
    const igstAmount = 0;
    const cessAmount = 0;

    const totalAmount = Number((subtotal + taxAmount - (parseFloat(formData.tdsAmount) || 0)).toFixed(2));

    return { subtotal, taxAmount, cgstAmount, sgstAmount, igstAmount, cessAmount, totalAmount, processedItems };
  }, [items, formData.tdsAmount]);

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!formData.vendorId) return alert('Please select a vendor.');
    if (!formData.saveNewVendorAddress && !formData.vendorAddressId) return alert('Please select a vendor address.');
    if (!formData.placeOfSupplyStateId) return alert('Please select a Place of Supply. If using the default vendor address, the GST state could not be resolved automatically.');

    if (formData.saveNewVendorAddress) {
      const { addressLine1, city, gstStateId, country, postalCode } = formData.newVendorAddress;
      if (!addressLine1?.trim() || !city?.trim() || !gstStateId || !country?.trim() || !postalCode?.trim()) {
        return alert('Please fill all required fields for the New Vendor Address (Address Line 1, City, State, Country, Postal Code).');
      }
    }

    const hasInvalidItem = items.some(i => {
      if (i.quantity <= 0 || i.unitPrice < 0) return true;
      if (i.itemType === 'PRODUCT') {
        if (!i.itemId || !i.warehouseId || !i.locationId) return true;
      } else {
        if (!i.description || !i.expenseAccountId) return true;
      }
      return false;
    });

    if (hasInvalidItem) {
      return alert('Please fill all item details correctly. Products require Warehouse/Location. Expenses require Description/Account.');
    }

    if (formData.invoiceDate && formData.dueDate) {
      if (new Date(formData.dueDate) < new Date(formData.invoiceDate)) {
        return alert('Due Date cannot be earlier than Invoice Date.');
      }
    }

    if (financials.subtotal == null || financials.taxAmount == null || financials.totalAmount == null) {
      return alert('Calculation error: subtotal, taxAmount, or totalAmount is missing.');
    }

    if (financials.processedItems.some(i => i.taxAmount == null)) {
      return alert('Calculation error: One or more items are missing a taxAmount.');
    }

    let payloadVendorAddressId = formData.saveNewVendorAddress ? null : (formData.vendorAddressId === 'FALLBACK' ? null : formData.vendorAddressId);
    let payloadNewVendorAddress = null;

    if (formData.saveNewVendorAddress) {
      payloadNewVendorAddress = formData.newVendorAddress;
    } else if (formData.vendorAddressId === 'FALLBACK') {
      const v = vendors.find(ven => ven.id === formData.vendorId);
      if (v) {
        payloadNewVendorAddress = {
          addressType: 'DEFAULT',
          addressLine1: v.addressLine1 || '',
          addressLine2: v.addressLine2 || null,
          city: v.city || '',
          gstStateId: formData.placeOfSupplyStateId,
          country: v.country || 'India',
          postalCode: v.pinCode || '',
          isDefault: true,
          isActive: true
        };
      }
    }

    const payload = {
      vendorId: formData.vendorId,
      purchaseOrderId: formData.purchaseOrderId || null,
      goodsReceiptId: formData.goodsReceiptId || null,
      allowVariance: !!formData.allowVariance,
      vendorAddressId: payloadVendorAddressId,
      saveNewVendorAddress: formData.saveNewVendorAddress,
      newVendorAddress: payloadNewVendorAddress,
      placeOfSupplyStateId: formData.placeOfSupplyStateId,
      invoiceNo: formData.invoiceNo || null,
      invoiceDate: formData.invoiceDate,
      dueDate: formData.dueDate,
      invoiceCurrency: formData.invoiceCurrency,
      exchangeRate: parseFloat(formData.exchangeRate) || 1,
      inputCgstAccountId: formData.inputCgstAccountId || null,
      inputSgstAccountId: formData.inputSgstAccountId || null,
      inputIgstAccountId: formData.inputIgstAccountId || null,
      inputCessAccountId: formData.inputCessAccountId || null,
      tdsAmount: parseFloat(formData.tdsAmount) || 0,
      subtotal: financials.subtotal,
      taxAmount: financials.taxAmount,
      totalAmount: financials.totalAmount,
      notes: formData.notes || '',
      items: financials.processedItems.map(item => {
        const outItem = {
          itemType: item.itemType,
          description: item.description,
          quantity: parseFloat(item.quantity) || 0,
          unitPrice: parseFloat(item.unitPrice) || 0,
          unit: item.unit || (item.itemType === 'EXPENSE' ? 'UNIT' : 'PCS'),
          expenseAccountId: item.expenseAccountId || null,
          hsnSacId: item.hsnSacId || null,
          taxableAmount: item.taxableAmount,
          taxAmount: item.taxAmount,
          totalAmount: item.totalAmount
        };

        if (item.itemType === 'PRODUCT') {
          outItem.itemId = item.itemId;
          outItem.warehouseId = item.warehouseId;
          outItem.locationId = item.locationId;
        }

        return outItem;
      })
    };

    onSubmit(payload, { downloadPdf: downloadPdfFlag, sendEmail: sendEmailFlag });
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-card-dark shadow-2xl w-full h-full flex flex-col overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1D212C]/50 flex-none">
            <h2 className="text-base font-bold text-zinc-800">{initialData?.id ? 'Edit Purchase Invoice' : 'Create Purchase Invoice'}</h2>
            <button type="button" onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 transition-colors">
              <X size={16} />
            </button>
          </div>

          <form className="flex-1 flex flex-col overflow-hidden text-xs min-h-0">
            {/* ── MAIN WORKSPACE: LEFT FORM (30%) | RIGHT ITEMS (70%) ── */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 dark:divide-border-dark bg-white dark:bg-card-dark">

              {/* ── LEFT COLUMN: DETAILS & SETTINGS (~30%) ── */}
              <div className="w-full lg:w-[30%] flex-none p-3 bg-zinc-50/40 overflow-y-auto overflow-x-hidden flex flex-col gap-2.5">
                
                {/* 0. PROCUREMENT REFERENCE (PO / GRN) */}
                <div className="flex-none border border-zinc-200 dark:border-border-dark rounded-lg p-2.5 bg-white dark:bg-surface-dark/40 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-100 dark:border-[#2A2F3D]">
                    <h3 className="text-[8px] font-bold text-zinc-800 uppercase tracking-wider">Procurement Link (Optional)</h3>
                  </div>
                  <div>
                    <label className="text-[8px] font-semibold text-zinc-700 block mb-1">Link Goods Receipt (GRN)</label>
                    <CustomSelect
                      className="input-field w-full h-8 text-[8.8px] text-zinc-700 dark:text-zinc-200 bg-white dark:bg-surface-dark"
                      value={formData.goodsReceiptId || ''}
                      onChange={e => handleSelectGRN(e.target.value)}
                    >
                      <option value="">-- Standalone (No GRN) --</option>
                      {goodsReceipts.map(g => (
                        <option key={g.id} value={g.id}>
                          {g.grnNumber} ({g.status}) - {g.vendorName || ''}
                        </option>
                      ))}
                    </CustomSelect>
                  </div>
                  <div>
                    <label className="text-[8px] font-semibold text-zinc-700 block mb-1">Link Purchase Order</label>
                    <CustomSelect
                      className="input-field w-full h-8 text-[8.8px] text-zinc-700 dark:text-zinc-200 bg-white dark:bg-surface-dark"
                      value={formData.purchaseOrderId || ''}
                      onChange={e => handleSelectPO(e.target.value)}
                    >
                      <option value="">-- Standalone (No PO) --</option>
                      {purchaseOrders.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.poNumber} ({p.status}) - {p.vendorName || ''}
                        </option>
                      ))}
                    </CustomSelect>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="checkbox"
                      id="allowVariance"
                      checked={formData.allowVariance || false}
                      onChange={e => setFormData(prev => ({ ...prev, allowVariance: e.target.checked }))}
                      className="rounded border-zinc-300 text-primary focus:ring-primary h-3 w-3"
                    />
                    <label htmlFor="allowVariance" className="text-[8px] text-zinc-600 font-medium cursor-pointer">
                      Allow 3-Way Match Variance
                    </label>
                  </div>
                </div>

                {/* 1. VENDOR DETAILS (COMPACT SINGLE COLUMN) */}
                <div className="flex-none border border-zinc-200 dark:border-border-dark rounded-lg p-2.5 bg-white dark:bg-surface-dark/40 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-100 dark:border-[#2A2F3D]">
                    <h3 className="text-[8px] font-bold text-zinc-800 uppercase tracking-wider">Vendor Details</h3>
                  </div>
                    
                    <div>
                      <label className="text-[8px] font-semibold text-zinc-700 block mb-1">Vendor *</label>
                      <ComboBox
                        name="vendorId"
                        value={formData.vendorId}
                        onChange={(val) => handleChange({ target: { name: 'vendorId', value: val } })}
                        options={vendors.map(v => ({
                          value: v.id,
                          label: v.vendorName || v.name,
                          subLabel: v.mobile || v.phone || v.email
                        }))}
                        placeholder="Search vendor..."
                        onSearchChange={setVendorSearchInput}
                        serverSideSearch={true}
                        required
                        onCreateClick={(searchTerm) => {
                          setVendorSearchTerm(searchTerm);
                          setIsAddVendorOpen(true);
                        }}
                        createSubtext="Add as new vendor"
                        inputClassName="w-full h-8 pl-8 pr-2 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[8.8px] hover:border-zinc-300 focus:border-zinc-400 outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="text-[8px] font-semibold text-zinc-700 block mb-1">Vendor Address *</label>
                      <CustomSelect
                        name="vendorAddressId"
                        value={formData.saveNewVendorAddress ? 'NEW' : formData.vendorAddressId}
                        onChange={(e) => {
                          if (e.target.value === 'NEW') {
                            setFormData(prev => ({ ...prev, saveNewVendorAddress: true, vendorAddressId: '' }));
                          } else if (e.target.value === 'FALLBACK') {
                            setFormData(prev => ({ ...prev, saveNewVendorAddress: false, vendorAddressId: 'FALLBACK' }));
                          } else {
                            const selectedAddr = vendorAddresses.find(a => a.id === e.target.value);
                            setFormData(prev => ({
                              ...prev,
                              vendorAddressId: e.target.value,
                              saveNewVendorAddress: false,
                              placeOfSupplyStateId: selectedAddr ? (selectedAddr.gstStateId || selectedAddr.gstState?.id || prev.placeOfSupplyStateId) : prev.placeOfSupplyStateId
                            }));
                          }
                        }}
                        className="input-field w-full h-8 text-[8.8px]"
                        required={!formData.saveNewVendorAddress}
                        disabled={!formData.vendorId}
                      >
                        <option value="">Select Vendor Address</option>
                        {vendorAddresses.map(addr => (
                          <option key={addr.id} value={addr.id}>
                            {addr.addressType ? `${addr.addressType} - ` : ''}{addr.addressLine1}, {addr.city}
                          </option>
                        ))}
                        {vendorAddresses.length === 0 && formData.vendorId && (
                          <option value="FALLBACK">
                            Default Vendor Address - {vendors.find(v => v.id === formData.vendorId)?.addressLine1 || ''}, {vendors.find(v => v.id === formData.vendorId)?.city || ''}
                          </option>
                        )}
                        <option value="NEW" className="text-primary font-semibold">+ Add New Vendor Address</option>
                      </CustomSelect>
                    </div>

                    <div>
                      <label className="text-[8px] font-semibold text-zinc-700 block mb-1">Place of Supply *</label>
                      <CustomSelect
                        name="placeOfSupplyStateId"
                        value={formData.placeOfSupplyStateId}
                        onChange={handleChange}
                        className="input-field w-full h-8 text-[8.8px]"
                        required
                        searchable={true}
                        comboInput={true}
                      >
                        <option value="">Select Place of Supply...</option>
                        {gstStates.map(s => (
                          <option key={s.id} value={s.id}>{s.displayName || `${s.stateCode} - ${s.stateName}`}</option>
                        ))}
                      </CustomSelect>
                    </div>

                    {formData.saveNewVendorAddress && (
                      <div className="mt-1.5 p-2 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1.5 animate-in slide-in-from-top-2">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-zinc-700 text-[7.2px] uppercase tracking-wide">New Vendor Address</h4>
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, saveNewVendorAddress: false, vendorAddressId: vendorAddresses[0]?.id || '' }))} className="text-zinc-400 hover:text-zinc-600">
                            <X size={12} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="col-span-2">
                            <label className="text-zinc-600 text-[7.2px] font-semibold block mb-0.5">Address Line 1 *</label>
                            <input type="text" className="input-field w-full h-6 text-[8px]" value={formData.newVendorAddress.addressLine1} onChange={(e) => setFormData(prev => ({ ...prev, newVendorAddress: { ...prev.newVendorAddress, addressLine1: e.target.value } }))} required={formData.saveNewVendorAddress} />
                          </div>
                          <div className="col-span-2">
                            <label className="text-zinc-600 text-[7.2px] font-semibold block mb-0.5">Address Line 2</label>
                            <input type="text" className="input-field w-full h-6 text-[8px]" value={formData.newVendorAddress.addressLine2} onChange={(e) => setFormData(prev => ({ ...prev, newVendorAddress: { ...prev.newVendorAddress, addressLine2: e.target.value } }))} />
                          </div>
                          <div>
                            <label className="text-zinc-600 text-[7.2px] font-semibold block mb-0.5">City *</label>
                            <input type="text" className="input-field w-full h-6 text-[8px]" value={formData.newVendorAddress.city} onChange={(e) => setFormData(prev => ({ ...prev, newVendorAddress: { ...prev.newVendorAddress, city: e.target.value } }))} required={formData.saveNewVendorAddress} />
                          </div>
                          <div>
                            <label className="text-zinc-600 text-[7.2px] font-semibold block mb-0.5">State *</label>
                            <CustomSelect className="w-full h-6 text-[8px]" value={formData.newVendorAddress.gstStateId} onChange={(e) => setFormData(prev => ({ ...prev, newVendorAddress: { ...prev.newVendorAddress, gstStateId: e.target.value } }))} required={formData.saveNewVendorAddress}>
                              <option value="">Select State...</option>
                              {gstStates.map(s => (
                                <option key={s.id} value={s.id}>{s.displayName || `${s.stateCode} - ${s.stateName}`}</option>
                              ))}
                            </CustomSelect>
                          </div>
                          <div>
                            <label className="text-zinc-600 text-[7.2px] font-semibold block mb-0.5">Postal Code *</label>
                            <input type="text" className="input-field w-full h-6 text-[8px]" value={formData.newVendorAddress.postalCode} onChange={(e) => setFormData(prev => ({ ...prev, newVendorAddress: { ...prev.newVendorAddress, postalCode: e.target.value } }))} required={formData.saveNewVendorAddress} />
                          </div>
                          <div>
                            <label className="text-zinc-600 text-[7.2px] font-semibold block mb-0.5">Country *</label>
                            <input type="text" className="input-field w-full h-6 text-[8px]" value={formData.newVendorAddress.country} onChange={(e) => setFormData(prev => ({ ...prev, newVendorAddress: { ...prev.newVendorAddress, country: e.target.value } }))} required={formData.saveNewVendorAddress} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. TAX / ACCOUNT DETAILS (COMPACT 2-COLUMN) */}
                  <div className="flex-none border border-zinc-200 dark:border-border-dark rounded-lg p-2.5 bg-white dark:bg-surface-dark/40 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between pb-1 border-b border-zinc-100 dark:border-[#2A2F3D]">
                      <h3 className="text-[8px] font-bold text-zinc-800 uppercase tracking-wider">Tax & Account Details</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="text-[8px] font-semibold text-zinc-700 block mb-1 truncate">Input CGST A/C</label>
                        <ComboBox name="inputCgstAccountId" value={formData.inputCgstAccountId} onChange={(val) => handleChange({ target: { name: 'inputCgstAccountId', value: val } })} options={cgstAccountOptions} placeholder="Search account..." inputClassName="w-full h-8 pl-8 pr-2 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[8.8px] hover:border-zinc-300 focus:border-zinc-400 outline-none" onCreateClick={(searchTerm) => { setAccountSearchTerm(searchTerm); setActiveAccountTarget('cgst'); setIsAddAccountOpen(true); }} createSubtext="Add as new account" />
                      </div>
                      <div>
                        <label className="text-[8px] font-semibold text-zinc-700 block mb-1 truncate">Input SGST A/C</label>
                        <ComboBox name="inputSgstAccountId" value={formData.inputSgstAccountId} onChange={(val) => handleChange({ target: { name: 'inputSgstAccountId', value: val } })} options={sgstAccountOptions} placeholder="Search account..." inputClassName="w-full h-8 pl-8 pr-2 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[8.8px] hover:border-zinc-300 focus:border-zinc-400 outline-none" onCreateClick={(searchTerm) => { setAccountSearchTerm(searchTerm); setActiveAccountTarget('sgst'); setIsAddAccountOpen(true); }} createSubtext="Add as new account" />
                      </div>
                      <div>
                        <label className="text-[8px] font-semibold text-zinc-700 block mb-1 truncate">Input IGST A/C</label>
                        <ComboBox name="inputIgstAccountId" value={formData.inputIgstAccountId} onChange={(val) => handleChange({ target: { name: 'inputIgstAccountId', value: val } })} options={igstAccountOptions} placeholder="Search account..." inputClassName="w-full h-8 pl-8 pr-2 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[8.8px] hover:border-zinc-300 focus:border-zinc-400 outline-none" onCreateClick={(searchTerm) => { setAccountSearchTerm(searchTerm); setActiveAccountTarget('igst'); setIsAddAccountOpen(true); }} createSubtext="Add as new account" />
                      </div>
                      <div>
                        <label className="text-[8px] font-semibold text-zinc-700 block mb-1 truncate">TDS Amount</label>
                        <input type="number" step="0.01" name="tdsAmount" value={formData.tdsAmount} onChange={handleChange} className="input-field w-full h-8 text-[8.8px]" />
                      </div>
                    </div>
                  </div>

                  {/* 3. INVOICE DETAILS (COMPACT 2-COLUMN ROWS) */}
                  <div className="flex-none border border-zinc-200 dark:border-border-dark rounded-lg p-2.5 bg-white dark:bg-surface-dark/40 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between pb-1 border-b border-zinc-100 dark:border-[#2A2F3D]">
                      <h3 className="text-[8px] font-bold text-zinc-800 uppercase tracking-wider">Invoice Details</h3>
                    </div>
                    <div className="space-y-2 pt-1">
                      <div>
                        <label className="text-[8px] font-semibold text-zinc-700 block mb-1">Invoice No</label>
                        <input type="text" name="invoiceNo" value={formData.invoiceNo} onChange={handleChange} className="input-field w-full h-8 text-[8.8px]" placeholder="Auto-generated if left blank" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[8px] font-semibold text-zinc-700 block mb-1">Invoice Date *</label>
                          <input type="date" name="invoiceDate" value={formData.invoiceDate} onChange={handleChange} className="input-field w-full h-8 text-[8.8px]" required />
                        </div>
                        <div>
                          <label className="text-[8px] font-semibold text-zinc-700 block mb-1">Due Date *</label>
                          <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="input-field w-full h-8 text-[8.8px]" required />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[8px] font-semibold text-zinc-700 block mb-1">Currency *</label>
                          <input type="text" name="invoiceCurrency" value={formData.invoiceCurrency} onChange={handleChange} className="input-field w-full h-8 text-[8.8px]" required />
                        </div>
                        <div>
                          <label className="text-[8px] font-semibold text-zinc-700 block mb-1">Exchange Rate</label>
                          <input type="number" step="0.000001" min="0.000001" name="exchangeRate" value={formData.exchangeRate} onChange={handleChange} className="input-field w-full h-8 text-[8.8px]" required />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. NOTES */}
                  <div className="flex-none border border-zinc-200 dark:border-border-dark rounded-lg p-2 bg-white dark:bg-surface-dark/40 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between pb-0.5 border-b border-zinc-100 dark:border-[#2A2F3D]">
                      <label className="text-[8px] font-bold text-zinc-800 uppercase tracking-wider block">Notes</label>
                    </div>
                    <textarea
                      name="notes"
                      className="input-field w-full h-[48px] min-h-[48px] max-h-[48px] resize-none text-[8.8px] p-1.5 rounded-md border border-zinc-200 focus:ring-1 focus:ring-zinc-900/10 focus:border-zinc-400 bg-white dark:bg-surface-dark dark:text-zinc-100"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Additional notes or payment terms..."
                    ></textarea>
                  </div>

                </div>

              {/* ── RIGHT COLUMN: ITEMS + SUMMARY (~70%) ── */}
              <div className="w-full lg:w-[70%] flex-1 flex flex-col overflow-y-auto min-h-0 bg-white dark:bg-card-dark">
                
                {/* Items Section Header */}
                <div className="px-4 py-2.5 bg-zinc-50/80 border-b border-zinc-200 flex justify-between items-center flex-none sticky top-0 z-20">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Items</h3>
                    <span className="text-[8.8px] font-medium text-zinc-500 dark:text-zinc-400 bg-white dark:bg-surface-dark px-2 py-0.5 rounded-full border border-zinc-200 dark:border-border-dark">
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-md shadow-xs hover:bg-primary/90 transition-colors"
                  >
                    <Plus size={13} strokeWidth={2.5} />
                    <span>Add Item</span>
                  </button>
                </div>

                {/* Items Table Header */}
                <div className="w-full text-left bg-zinc-100 text-zinc-600 border-b border-zinc-200 sticky top-[36px] z-10 flex-none pr-1">
                  <div className="w-full min-w-0 p-2" style={gridStyle}>
                    <div className="font-semibold truncate text-[8.8px] min-w-0 max-w-full">Type *</div>
                    <div className="font-semibold truncate text-[8.8px] min-w-0 max-w-full">Product / Expense Details *</div>
                    <div className="font-semibold truncate text-[8.8px] min-w-0 max-w-full">HSN/SAC</div>
                    <div className="font-semibold truncate text-[8.8px] min-w-0 max-w-full">Account / Warehouse *</div>
                    <div className="font-semibold truncate text-[8.8px] min-w-0 max-w-full">Location</div>
                    <div className="font-semibold text-center truncate text-[8.8px] min-w-0 max-w-full">Qty *</div>
                    <div className="font-semibold text-center truncate text-[8.8px] min-w-0 max-w-full">UOM</div>
                    <div className="font-semibold text-right truncate text-[8.8px] min-w-0 max-w-full">Price *</div>
                    <div className="font-semibold text-center truncate text-[8.8px] min-w-0 max-w-full">Tax %</div>
                    <div className="font-semibold text-right truncate text-[8.8px] min-w-0 max-w-full">Total</div>
                    <div className="font-semibold text-center truncate text-[8.8px] min-w-0 max-w-full">Action</div>
                  </div>
                </div>

                {/* Items Table Body */}
                <div className="flex flex-col flex-1 min-h-[112px] w-full max-w-full bg-white dark:bg-card-dark divide-y divide-zinc-100 dark:divide-border-dark/60">
                  {items.map((item) => (
                    <APInvoiceLineItemRow
                      key={item.id}
                      item={item}
                      products={products}
                      warehouses={warehouses}
                      expenseAccountOptions={expenseAccountOptions}
                      onUpdate={handleItemChange}
                      onRemove={handleRemoveItem}
                      canRemove={items.length > 1}
                      setActiveAccountTarget={setActiveAccountTarget}
                      setIsAddAccountOpen={setIsAddAccountOpen}
                      companyId={companyId}
                      currency={formData.invoiceCurrency}
                      isSystemAdmin={isSystemAdmin}
                      onAddNewItem={(rowId, term) => {
                        setAddItemTargetRowId(rowId);
                        setNewItemName(term);
                        setIsAddItemOpen(true);
                      }}
                      setAddHsnSacTargetRowId={setAddHsnSacTargetRowId}
                    />
                  ))}
                </div>

                {/* Summary Section */}
                <div className="p-4 border-t border-zinc-200 bg-zinc-50/40 mt-auto flex-none">
                  <div className="bg-white dark:bg-card-dark p-3.5 rounded-xl border border-zinc-200 dark:border-border-dark flex flex-col justify-between shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-[#2A2F3D]">
                      <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Invoice Summary</h3>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[9.6px]">
                        <span className="text-zinc-600 font-medium">Subtotal</span>
                        <span className="font-semibold text-zinc-800">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: formData.invoiceCurrency || 'INR' }).format(financials.subtotal)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[9.6px]">
                        <span className="text-zinc-600 font-medium">Tax Amount</span>
                        <span className="text-zinc-800 font-semibold">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: formData.invoiceCurrency || 'INR' }).format(financials.taxAmount)}
                        </span>
                      </div>

                      {formData.tdsAmount > 0 && (
                        <div className="flex justify-between items-center text-[9.6px]">
                          <span className="text-rose-600 font-medium">Less: TDS</span>
                          <span className="text-rose-600 font-semibold">
                            -{new Intl.NumberFormat('en-IN', { style: 'currency', currency: formData.invoiceCurrency || 'INR' }).format(formData.tdsAmount)}
                          </span>
                        </div>
                      )}

                      <div className="pt-2.5 border-t border-zinc-200 flex justify-between items-center">
                        <span className="text-sm font-bold text-zinc-900">Total Amount</span>
                        <span className="text-base font-black text-primary">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: formData.invoiceCurrency || 'INR' }).format(financials.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </form>

          <div className="flex justify-between items-center p-3 border-t border-zinc-200 bg-zinc-100 flex-none">
            <div className="flex items-center gap-6 px-2">
              {!initialData && (
                <>
                  <label className="flex items-center gap-2 text-[10.4px] font-semibold text-zinc-700 cursor-pointer hover:text-zinc-900 transition-colors">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-zinc-300 text-primary focus:ring-primary focus:ring-offset-0 transition-colors cursor-pointer"
                      checked={downloadPdfFlag}
                      onChange={(e) => setDownloadPdfFlag(e.target.checked)}
                    />
                    Download PDF
                  </label>
                  <label className="flex items-center gap-2 text-[10.4px] font-semibold text-zinc-700 cursor-pointer hover:text-zinc-900 transition-colors">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-zinc-300 text-primary focus:ring-primary focus:ring-offset-0 transition-colors cursor-pointer"
                      checked={sendEmailFlag}
                      onChange={(e) => setSendEmailFlag(e.target.checked)}
                    />
                    Send Email
                  </label>
                </>
              )}
              
              <button
                type="button"
                className="flex items-center gap-2 text-[10.4px] font-semibold text-zinc-700 cursor-pointer hover:text-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  setDownloadPdfFlag(true);
                  handleSubmitForm({ preventDefault: () => {} });
                }}
              >
                <Printer size={16} /> Print Invoice
              </button>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="btn-secondary py-1.5 px-5">Cancel</button>
              <button type="button" onClick={handleSubmitForm} className="btn-primary py-1.5 px-5">
                {initialData?.id ? 'Update Purchase Invoice' : 'Save Purchase Invoice'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isAddVendorOpen && (
        <VendorFormModal
          isOpen={isAddVendorOpen}
          onClose={() => setIsAddVendorOpen(false)}
          initialData={vendorSearchTerm ? { vendorName: vendorSearchTerm } : null}
          onSuccess={(newVendor) => {
            setIsAddVendorOpen(false);
            fetchVendors();
            if (newVendor?.id) {
              setFormData(prev => ({ ...prev, vendorId: newVendor.id }));
            }
          }}
        />
      )}

      {isAddAccountOpen && (
        <ChartOfAccountsModal
          isOpen={isAddAccountOpen}
          onClose={() => setIsAddAccountOpen(false)}
          mode="create"
          account={accountSearchTerm ? { accountName: accountSearchTerm } : null}
          groups={groups}
          allAccounts={accounts}
          companyId={companyId}
          createAccount={createAccount}
          onSuccess={handleAccountSuccess}
        />
      )}

      {/* Embedded Item Creation Modal */}
      {isAddItemOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-card-dark w-full max-w-2xl h-[95vh] max-h-[95vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200 dark:border-border-dark">
            <div className="flex justify-between items-center px-5 py-4 border-b border-zinc-200 bg-zinc-50/80 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center border border-zinc-200 text-zinc-700">
                  <Package size={16} />
                </div>
                <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                  New Product
                </h2>
              </div>
              <button onClick={() => {
                setIsAddItemOpen(false);
                setAddItemTargetRowId(null);
                setNewItemName('');
              }} className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors active:scale-95">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-white dark:bg-card-dark flex flex-col">
              <ProductForm
                initialData={{ productName: newItemName }}
                onSubmit={async (payload) => {
                  try {
                    setIsCreatingProduct(true);
                    const result = await productsApi.create(payload);

                    if (result && result.id) {
                      handleItemChange(addItemTargetRowId, 'itemId', result.id);
                    }
                    setIsAddItemOpen(false);
                    setAddItemTargetRowId(null);
                    setNewItemName('');
                  } catch (err) {
                    console.error('Failed to create item', err);
                    alert(err?.response?.data?.message || err?.data?.message || err?.message || 'Failed to create item');
                  } finally {
                    setIsCreatingProduct(false);
                  }
                }}
                onCancel={() => {
                  setIsAddItemOpen(false);
                  setAddItemTargetRowId(null);
                  setNewItemName('');
                }}
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
