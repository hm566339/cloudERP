import React, { useState, useMemo } from 'react';
import { Save, AlertCircle, Package, Settings, Calculator, BookOpen } from 'lucide-react';
import { useParams } from 'react-router-dom';
import CustomSelect from '../../../components/common/CustomSelect';
import ComboBox from '../../../components/common/ComboBox';
import HsnSacSelect from '../../../components/common/HsnSacSelect';
import { useProductCategoryList } from '../../../api/inventory/hooks/useProductCategory';
import { useUnitOfMeasureList } from '../../../api/inventory/hooks/useUnitOfMeasure';
import { useGetChartOfAccountsQuery } from '../../../api/account/accounting.api';

export default function ProductForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading 
}) {
  const { companyId } = useParams();
  const [activeTab, setActiveTab] = useState('basic'); // basic, config, accounting

  // Fetch Dropdown Data
  const { productCategories } = useProductCategoryList({ companyId });
  const { unitOfMeasures } = useUnitOfMeasureList({ companyId });
  const { data: chartOfAccountsData } = useGetChartOfAccountsQuery({ 
    companyId, 
    size: 2000, 
    postingAllowed: true, 
    isActive: true 
  });
  
  const rawAccounts = chartOfAccountsData?.data?.data || chartOfAccountsData?.data?.content || chartOfAccountsData?.content || chartOfAccountsData?.data || [];
  const chartOfAccounts = Array.isArray(rawAccounts) ? rawAccounts : [];

  const inventoryAccountOptions = useMemo(() => {
    return chartOfAccounts
      .filter(a => a.deleted !== true && (
        a.groupName === 'Inventory' || 
        a.groupName === 'Current Assets' || 
        a.accountName?.toLowerCase().includes('inventory') || 
        a.accountName?.toLowerCase().includes('stock')
      ))
      .map(acc => ({ value: acc.id, label: `${acc.accountCode || acc.code} - ${acc.accountName || acc.name}` }));
  }, [chartOfAccounts]);

  const cogsAccountOptions = useMemo(() => {
    return chartOfAccounts
      .filter(a => a.deleted !== true && (
        a.groupName === 'Cost of Goods Sold' || 
        a.groupName === 'Direct Expenses' || 
        a.groupName === 'Indirect Expenses' ||
        a.accountName?.toLowerCase().includes('cogs') || 
        a.accountName?.toLowerCase().includes('cost of goods sold')
      ))
      .map(acc => ({ value: acc.id, label: `${acc.accountCode || acc.code} - ${acc.accountName || acc.name}` }));
  }, [chartOfAccounts]);

  const salesAccountOptions = useMemo(() => {
    return chartOfAccounts
      .filter(a => a.deleted !== true && (
        a.groupName === 'Sales' || 
        a.groupName === 'Direct Income' || 
        a.groupName === 'Indirect Income' || 
        a.groupName === 'Other Income' || 
        a.accountName?.toLowerCase().includes('sales') || 
        a.accountName?.toLowerCase().includes('revenue') || 
        a.accountName?.toLowerCase().includes('income')
      ))
      .map(acc => ({ value: acc.id, label: `${acc.accountCode || acc.code} - ${acc.accountName || acc.name}` }));
  }, [chartOfAccounts]);

  const purchaseAccountOptions = useMemo(() => {
    return chartOfAccounts
      .filter(a => a.deleted !== true && (
        a.groupName === 'Purchase' || 
        a.groupName === 'Purchases' || 
        a.groupName === 'Direct Expenses' || 
        a.groupName === 'Indirect Expenses' || 
        a.accountName?.toLowerCase().includes('purchase') || 
        a.accountName?.toLowerCase().includes('cost') || 
        a.accountName?.toLowerCase().includes('expense')
      ))
      .map(acc => ({ value: acc.id, label: `${acc.accountCode || acc.code} - ${acc.accountName || acc.name}` }));
  }, [chartOfAccounts]);

  // Auto-default accounting accounts if creating a new product
  React.useEffect(() => {
    if (!initialData) {
      setFormData(prev => {
        let updated = { ...prev };
        let changed = false;

        if (!updated.purchaseAccountId && purchaseAccountOptions.length > 0) {
          const match = purchaseAccountOptions.find(o => 
            o.label.toLowerCase().includes('500001') || 
            o.label.toLowerCase().includes('purchase account') ||
            o.label.toLowerCase().includes('purchase')
          ) || purchaseAccountOptions[0];
          if (match) {
            updated.purchaseAccountId = match.value;
            changed = true;
          }
        }

        if (!updated.salesAccountId && salesAccountOptions.length > 0) {
          const match = salesAccountOptions.find(o => 
            o.label.toLowerCase().includes('400001') || 
            o.label.toLowerCase().includes('sales account') ||
            o.label.toLowerCase().includes('sales')
          ) || salesAccountOptions[0];
          if (match) {
            updated.salesAccountId = match.value;
            changed = true;
          }
        }

        if (!updated.inventoryAccountId && inventoryAccountOptions.length > 0) {
          const match = inventoryAccountOptions.find(o => 
            o.label.toLowerCase().includes('140001') || 
            o.label.toLowerCase().includes('inventory asset') ||
            o.label.toLowerCase().includes('inventory') ||
            o.label.toLowerCase().includes('stock')
          ) || inventoryAccountOptions[0];
          if (match) {
            updated.inventoryAccountId = match.value;
            changed = true;
          }
        }

        if (!updated.cogsAccountId && cogsAccountOptions.length > 0) {
          const match = cogsAccountOptions.find(o => 
            o.label.toLowerCase().includes('500002') || 
            o.label.toLowerCase().includes('cogs') ||
            o.label.toLowerCase().includes('cost of goods sold')
          ) || cogsAccountOptions[0];
          if (match) {
            updated.cogsAccountId = match.value;
            changed = true;
          }
        }

        return changed ? updated : prev;
      });
    }
  }, [purchaseAccountOptions, salesAccountOptions, inventoryAccountOptions, cogsAccountOptions, initialData]);

  const [formData, setFormData] = useState({
    sku: initialData?.sku || '',
    productName: initialData?.productName || '',
    productType: initialData?.productType || 'GOODS',
    categoryId: initialData?.categoryId || '',
    baseUomId: initialData?.baseUomId || '',
    hsnSacId: initialData?.hsnSacId || '',
    hsnSacCode: initialData?.hsnSacCode || '',
    hsnSacName: initialData?.hsnSacName || '',
    barcode: initialData?.barcode || '',
    alternateBarcode: initialData?.alternateBarcode || '',
    description: initialData?.description || '',
    trackingType: initialData?.trackingType || 'NONE',
    valuationMethod: initialData?.valuationMethod || 'FIFO',
    standardCost: initialData?.standardCost || 0,
    inventoryAccountId: initialData?.inventoryAccountId || '',
    cogsAccountId: initialData?.cogsAccountId || '',
    salesAccountId: initialData?.salesAccountId || '',
    purchaseAccountId: initialData?.purchaseAccountId || '',
    status: initialData?.status || 'ACTIVE',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let parsedValue = value;
    
    if (type === 'number') {
      parsedValue = value === '' ? '' : Number(value);
    }
    
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.productName?.trim()) newErrors.productName = 'Product Name is required';
    else if (formData.productName.length > 200) newErrors.productName = 'Max 200 characters';
    
    if (formData.sku && formData.sku.length > 50) newErrors.sku = 'Max 50 characters';
    
    if (!formData.baseUomId?.trim()) newErrors.baseUomId = 'Base UOM is required';
    if (!formData.categoryId?.trim()) newErrors.categoryId = 'Category is required';
    if (!formData.trackingType) newErrors.trackingType = 'Tracking Type is required';
    if (!formData.valuationMethod) newErrors.valuationMethod = 'Valuation Method is required';

    if (formData.standardCost < 0) newErrors.standardCost = 'Cost cannot be negative';
    if (formData.sellingPrice < 0) newErrors.sellingPrice = 'Price cannot be negative';

    if (!formData.purchaseAccountId?.trim()) {
      newErrors.purchaseAccountId = 'Purchase Account is required';
    }

    setErrors(newErrors);
    
    // Auto-switch tab to where the error is
    if (newErrors.productName || newErrors.sku || newErrors.baseUomId || newErrors.categoryId) {
      setActiveTab('basic');
    } else if (newErrors.standardCost || newErrors.sellingPrice || newErrors.trackingType || newErrors.valuationMethod) {
      setActiveTab('config');
    } else if (newErrors.inventoryAccountId || newErrors.cogsAccountId || newErrors.salesAccountId || newErrors.purchaseAccountId) {
      setActiveTab('accounting');
    }

    return Object.keys(newErrors).length === 0;
  };

  const hasBasicErrors = Boolean(errors.productName || errors.sku || errors.baseUomId || errors.categoryId);
  const hasConfigErrors = Boolean(errors.standardCost || errors.sellingPrice || errors.trackingType || errors.valuationMethod);
  const hasAccountingErrors = Boolean(errors.inventoryAccountId || errors.cogsAccountId || errors.salesAccountId || errors.purchaseAccountId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // Clean up empty strings to null for optional UUIDs before submitting
      const payload = { ...formData };
      const uuidFields = ['inventoryAccountId', 'cogsAccountId', 'salesAccountId', 'hsnSacId'];
      uuidFields.forEach(field => {
        if (payload[field] === '') {
          payload[field] = null;
        }
      });
      onSubmit(payload);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white dark:bg-card-dark min-h-0">
      {/* Tabs */}
      <div className="flex px-5 border-b border-zinc-200 dark:border-border-dark bg-white dark:bg-card-dark shrink-0 gap-6 z-10 sticky top-0">
        <button
          type="button"
          onClick={() => setActiveTab('basic')}
          className={`py-3 text-[10.4px] font-bold flex items-center gap-2 border-b-2 transition-colors focus:outline-none outline-none ${
            activeTab === 'basic' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <Package size={14} /> Basic Details
          {hasBasicErrors && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('config')}
          className={`py-3 text-[10.4px] font-bold flex items-center gap-2 border-b-2 transition-colors focus:outline-none outline-none ${
            activeTab === 'config' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <Settings size={14} /> Inventory & Config
          {hasConfigErrors && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('accounting')}
          className={`py-3 text-[10.4px] font-bold flex items-center gap-2 border-b-2 transition-colors focus:outline-none outline-none ${
            activeTab === 'accounting' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <BookOpen size={14} /> Accounting
          {hasAccountingErrors && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5 pb-40">
        
        {/* BASIC TAB */}
        <div className={activeTab === 'basic' ? 'block space-y-5' : 'hidden'}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="sm:col-span-2">
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="productName"
                value={formData.productName}
                onChange={handleChange}
                maxLength={200}
                className={`w-full h-9 px-3 rounded-md border dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.productName ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
                }`}
                autoFocus
              />
              {errors.productName && (
                <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle size={12} /> {errors.productName}
                </p>
              )}
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
                SKU
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                maxLength={50}
                className={`w-full h-9 px-3 rounded-md border dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.sku ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
                }`}
              />
              {errors.sku && (
                <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle size={12} /> {errors.sku}
                </p>
              )}
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Product Type</label>
              <CustomSelect
                name="productType"
                value={formData.productType}
                onChange={handleChange}
                className="w-full h-9 px-3 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] transition-all hover:border-zinc-300"
              >
                <option value="GOODS">Goods</option>
                <option value="SERVICE">Service</option>
                <option value="NON_INVENTORY">Non-Inventory</option>
              </CustomSelect>
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
                Category <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                error={!!errors.categoryId}
                className="w-full h-9 px-3 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] transition-all hover:border-zinc-300"
                required
              >
                <option value="">Select Category</option>
                {productCategories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.categoryName || cat.name}
                  </option>
                ))}
              </CustomSelect>
              {errors.categoryId && (
                <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle size={12} /> {errors.categoryId}
                </p>
              )}
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
                Base UOM <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                name="baseUomId"
                value={formData.baseUomId}
                onChange={handleChange}
                error={!!errors.baseUomId}
                className="w-full h-9 px-3 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] transition-all hover:border-zinc-300"
                required
              >
                <option value="">Select UOM</option>
                {unitOfMeasures?.map((uom) => (
                  <option key={uom.id} value={uom.id}>
                    {uom.uomName || uom.name} ({uom.uomCode || uom.code})
                  </option>
                ))}
              </CustomSelect>
              {errors.baseUomId && (
                <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle size={12} /> {errors.baseUomId}
                </p>
              )}
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Barcode</label>
              <input
                type="text"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Alternate Barcode</label>
              <input
                type="text"
                name="alternateBarcode"
                value={formData.alternateBarcode}
                onChange={handleChange}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-zinc-200 dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            <div className="sm:col-span-2 border-t border-zinc-100 pt-4 mt-2">
              <label className="text-[9.6px] font-bold text-zinc-700 mb-2 block">Product Status</label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="ACTIVE"
                    checked={formData.status === 'ACTIVE'}
                    onChange={handleChange}
                    className="w-4 h-4 text-emerald-600 border-zinc-300 focus:ring-emerald-600"
                  />
                  <span className="text-[10.4px] font-medium text-zinc-700">Active</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="INACTIVE"
                    checked={formData.status === 'INACTIVE'}
                    onChange={handleChange}
                    className="w-4 h-4 text-rose-600 border-zinc-300 focus:ring-rose-600"
                  />
                  <span className="text-[10.4px] font-medium text-zinc-700">Inactive</span>
                </label>
              </div>
            </div>

          </div>
        </div>

        {/* CONFIG TAB */}
        <div className={activeTab === 'config' ? 'block space-y-5' : 'hidden'}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="sm:col-span-2">
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">HSN/SAC</label>
              <HsnSacSelect
                value={formData.hsnSacId}
                onChange={(e, selectedHsnSac) => {
                  setFormData(prev => ({
                    ...prev,
                    hsnSacId: e.target.value,
                    hsnSacCode: selectedHsnSac?.code || '',
                    hsnSacName: selectedHsnSac?.description || ''
                  }));
                }}
                buttonClassName="w-full h-9 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-[10.4px] hover:border-zinc-300 flex items-center justify-between"
                placeholder="Select HSN/SAC"
              />
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
                Tracking Type <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                name="trackingType"
                value={formData.trackingType}
                onChange={handleChange}
                error={!!errors.trackingType}
                required
              >
                <option value="NONE">None</option>
                <option value="BATCH">Batch</option>
                <option value="SERIAL">Serial</option>
                <option value="BATCH_AND_SERIAL">Batch & Serial</option>
              </CustomSelect>
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
                Valuation Method <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                name="valuationMethod"
                value={formData.valuationMethod}
                onChange={handleChange}
                error={!!errors.valuationMethod}
                required
              >
                <option value="FIFO">FIFO</option>
                <option value="WEIGHTED_AVERAGE">Weighted Average</option>
                <option value="STANDARD_COST">Standard Cost</option>
              </CustomSelect>
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Standard Cost</label>
              <input
                type="number"
                min="0"
                step="0.01"
                name="standardCost"
                value={formData.standardCost}
                onChange={handleChange}
                className={`w-full h-9 px-3 rounded-md border dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.standardCost ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
                }`}
              />
              {errors.standardCost && (
                <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle size={12} /> {errors.standardCost}
                </p>
              )}
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Selling Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                name="sellingPrice"
                value={formData.sellingPrice || 0}
                onChange={handleChange}
                className={`w-full h-9 px-3 rounded-md border dark:border-border-dark text-[10.4px] bg-white dark:bg-surface-dark text-zinc-900 dark:text-zinc-100 transition-all outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.sellingPrice ? 'border-rose-300 focus:border-rose-500' : 'border-zinc-200 focus:border-primary'
                }`}
              />
              {errors.sellingPrice && (
                <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle size={12} /> {errors.sellingPrice}
                </p>
              )}
            </div>

          </div>
        </div>

        {/* ACCOUNTING TAB */}
        <div className={activeTab === 'accounting' ? 'block space-y-5' : 'hidden'}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="sm:col-span-2 mb-2">
              <p className="text-sm text-zinc-500">
                Link product to general ledger accounts. If left blank, category defaults might be used during transactions.
              </p>
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Inventory Account</label>
              <ComboBox
                value={formData.inventoryAccountId}
                onChange={(val) => setFormData(prev => ({ ...prev, inventoryAccountId: val }))}
                options={inventoryAccountOptions}
                placeholder="Select Account"
              />
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">COGS Account</label>
              <ComboBox
                value={formData.cogsAccountId}
                onChange={(val) => setFormData(prev => ({ ...prev, cogsAccountId: val }))}
                options={cogsAccountOptions}
                placeholder="Select Account"
              />
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">Sales Account</label>
              <ComboBox
                value={formData.salesAccountId}
                onChange={(val) => setFormData(prev => ({ ...prev, salesAccountId: val }))}
                options={salesAccountOptions}
                placeholder="Select Account"
              />
            </div>

            <div>
              <label className="text-[9.6px] font-bold text-zinc-700 mb-1.5 block">
                Purchase Account <span className="text-rose-500">*</span>
              </label>
              <ComboBox
                value={formData.purchaseAccountId}
                onChange={(val) => setFormData(prev => ({ ...prev, purchaseAccountId: val }))}
                options={purchaseAccountOptions}
                placeholder="Select Account"
              />
              {errors.purchaseAccountId && (
                <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle size={12} /> {errors.purchaseAccountId}
                </p>
              )}
            </div>

          </div>
        </div>

      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 dark:border-border-dark bg-white dark:bg-card-dark mt-auto shrink-0 z-20">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-[10.4px] font-semibold text-zinc-600 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md hover:bg-zinc-50 hover:text-zinc-900 transition-colors disabled:opacity-50 focus:outline-none outline-none"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-[10.4px] font-semibold text-white bg-zinc-900 border border-transparent rounded-md hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {initialData ? 'Update Product' : 'Save Product'}
        </button>
      </div>
    </form>
  );
}
