import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, FileText, LayoutDashboard, AlertCircle, Loader2, Package, Tag, 
  Warehouse, MapPin, IndianRupee, BookOpen, Hash, Copy, Check, Shield, 
  Clock, Calendar, CheckCircle2, XCircle, Activity, ArrowRightLeft, Boxes,
  Building2, Layers, Cpu, Database
} from 'lucide-react';
import apiClient from '../../../api/common/client';
import { format } from 'date-fns';
import EntityHeader from '../../../components/common/EntityHeader';
import KPICard from '../../../components/common/KPICard';
import { PageLoader } from '../../../components/common/SkeletonLoader';

/**
 * Copyable ID Badge Component
 */
function CopyableIdBadge({ value, label }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    if (!value || value === '-') return;
    navigator.clipboard.writeText(String(value));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (!value || value === '-') {
    return <span className="text-zinc-400 dark:text-zinc-600 font-mono text-xs">-</span>;
  }

  return (
    <div className="inline-flex items-center gap-1.5 group max-w-full">
      <span 
        className="font-mono text-xs text-zinc-700 dark:text-[#A0A6B5] bg-zinc-100 dark:bg-[#1D212C] px-2 py-0.5 rounded border border-zinc-200/60 dark:border-[#2A2F3D] truncate select-all" 
        title={String(value)}
      >
        {String(value)}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-[#E6E8EE] rounded hover:bg-zinc-200/50 dark:hover:bg-[#2A2F3D] transition-colors shrink-0"
        title={copied ? "Copied!" : `Copy ${label || 'ID'}`}
      >
        {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
      </button>
    </div>
  );
}

/**
 * Reusable Information Card for Generic Entity Details
 */
function SectionInfoCard({ title, icon: Icon, badge, children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-[#161922] rounded-xl shadow-xs border border-zinc-200/80 dark:border-[#2A2F3D] overflow-hidden ${className}`}>
      <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]/60 flex items-center justify-between gap-3">
        <h3 className="font-bold text-zinc-800 dark:text-[#E6E8EE] text-[13px] tracking-tight flex items-center gap-2">
          {Icon && (
            <span className="p-1 rounded-md bg-zinc-100 dark:bg-[#161922] text-zinc-600 dark:text-[#4C8DFF]">
              <Icon size={15} />
            </span>
          )}
          {title}
        </h3>
        {badge && (
          <div>{badge}</div>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/**
 * Reusable Field Row Component
 */
function FieldRow({ label, value, mono = false, highlight = false, isBadge = false, badgeVariant = 'default' }) {
  let renderedValue = value;

  if (renderedValue === null || renderedValue === undefined || renderedValue === '') {
    renderedValue = <span className="text-zinc-400 dark:text-zinc-600">-</span>;
  } else if (isBadge) {
    const isSuccess = badgeVariant === 'success' || renderedValue === 'Yes' || renderedValue === 'ACTIVE' || renderedValue === 'COMPLETED' || renderedValue === 'POSTED';
    const isDanger = badgeVariant === 'danger' || renderedValue === 'No' || renderedValue === 'INACTIVE' || renderedValue === 'CANCELLED' || renderedValue === 'REJECTED';
    const isWarning = badgeVariant === 'warning' || renderedValue === 'PENDING' || renderedValue === 'DRAFT';

    const badgeCls = isSuccess
      ? 'bg-emerald-50 dark:bg-[#34C38F]/15 text-emerald-700 dark:text-[#34C38F] border-emerald-200 dark:border-[#34C38F]/30'
      : isDanger
      ? 'bg-rose-50 dark:bg-[#F0616D]/15 text-rose-700 dark:text-[#F0616D] border-rose-200 dark:border-[#F0616D]/30'
      : isWarning
      ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
      : 'bg-zinc-100 dark:bg-[#1D212C] text-zinc-700 dark:text-[#A0A6B5] border-zinc-200 dark:border-[#2A2F3D]';

    renderedValue = (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${badgeCls}`}>
        {String(value)}
      </span>
    );
  } else if (mono) {
    renderedValue = (
      <span className="font-mono text-xs font-semibold text-zinc-800 dark:text-[#E6E8EE] bg-zinc-100/80 dark:bg-[#1D212C] px-2 py-0.5 rounded border border-zinc-200/50 dark:border-[#2A2F3D]">
        {String(value)}
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <dt className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184] truncate">
        {label}
      </dt>
      <dd className={`text-sm font-semibold text-zinc-900 dark:text-[#E6E8EE] break-words ${highlight ? 'text-primary dark:text-[#4C8DFF]' : ''}`}>
        {renderedValue}
      </dd>
    </div>
  );
}

/**
 * Generic Details Page for any inventory entity.
 * Uses rich enterprise ERP aesthetics matching the website theme.
 */
export default function GenericEntityDetails({ endpoint, entityName }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [resolvedProductName, setResolvedProductName] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get(`${endpoint}/${id}`);
        if (isMounted) {
          const detailData = res.data?.data || res.data;
          setData(detailData);
          setLoading(false);
          if (detailData?.productId) {
            apiClient.get(`/api/inventory/products/${detailData.productId}`)
              .then(pRes => {
                if (isMounted) {
                  const p = pRes.data?.data || pRes.data;
                  if (p?.productName) {
                    setResolvedProductName(`${p.productName}${p.sku ? ` (${p.sku})` : ''}`);
                  }
                }
              })
              .catch(() => {});
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || err.message || 'Failed to load details');
          setLoading(false);
        }
      }
    };
    if (id && endpoint) fetchDetails();
    return () => { isMounted = false; };
  }, [id, endpoint]);

  const handleBack = () => {
    navigate('..', { relative: 'path' });
  };

  const formatKey = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, str => str.toUpperCase());
  };

  const formatValue = (key, val) => {
    if (val === null || val === undefined || val === '') return '-';
    if (key === 'productId') {
      return resolvedProductName ? `${resolvedProductName} [ID: ${val}]` : val;
    }
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (typeof val === 'number') {
      if (
        key.toLowerCase().includes('cost') || 
        key.toLowerCase().includes('price') || 
        key.toLowerCase().includes('amount') || 
        key.toLowerCase().includes('value')
      ) {
        return `₹${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      }
      return val.toLocaleString(undefined);
    }
    if (typeof val === 'string') {
      if (val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        try { return format(new Date(val), 'dd MMM yyyy, hh:mm a'); } catch (e) { return val; }
      }
      return val;
    }
    return String(val);
  };

  // ─── Extract Highlights / KPI Metrics ─────────────────────────────────────
  const kpiMetrics = useMemo(() => {
    if (!data) return [];
    const metrics = [];

    // 1. Quantity
    const qtyVal = data.quantity ?? data.qty ?? data.totalQuantity ?? data.availableQuantity ?? data.transferredQuantity;
    if (qtyVal !== undefined && qtyVal !== null) {
      metrics.push({
        title: 'Quantity',
        value: typeof qtyVal === 'number' ? qtyVal.toLocaleString() : qtyVal,
        subtitle: data.uom || data.unitOfMeasure || 'Units',
        icon: Boxes,
        valueClass: 'text-zinc-900 dark:text-[#E6E8EE]'
      });
    }

    // 2. Stock Value / Total Amount
    const valAmount = data.stockValue ?? data.totalValue ?? data.totalCost ?? data.totalAmount ?? data.amount;
    if (valAmount !== undefined && valAmount !== null && typeof valAmount === 'number') {
      metrics.push({
        title: 'Stock Value',
        value: `₹${valAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        subtitle: data.currencyCode || 'INR Base',
        icon: IndianRupee,
        valueClass: 'text-emerald-600 dark:text-[#34C38F]'
      });
    }

    // 3. Average / Unit Cost
    const unitCost = data.averageCost ?? data.unitCost ?? data.inventoryCost ?? data.unitPrice ?? data.cost;
    if (unitCost !== undefined && unitCost !== null && typeof unitCost === 'number') {
      metrics.push({
        title: 'Average Cost',
        value: `₹${unitCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        subtitle: 'Per unit cost',
        icon: Activity,
        valueClass: 'text-blue-600 dark:text-[#4C8DFF]'
      });
    }

    // 4. Valuation Method / Direction
    const methodVal = data.valuationMethod ?? data.method ?? data.direction ?? data.movementType ?? data.type;
    if (methodVal) {
      metrics.push({
        title: 'Valuation Method',
        value: String(methodVal),
        subtitle: data.valuationDate ? `As of ${formatValue('valuationDate', data.valuationDate)}` : 'Inventory Policy',
        icon: Layers,
        valueClass: 'text-indigo-600 dark:text-indigo-400'
      });
    }

    return metrics;
  }, [data]);

  // ─── Partition Data Fields into Semantic Categories ───────────────────────
  const fieldGroups = useMemo(() => {
    if (!data) return { itemFields: [], locationFields: [], financeFields: [], glFields: [], systemIds: [], generalFields: [] };

    const itemKeys = ['productName', 'productId', 'productCode', 'sku', 'productCategory', 'categoryName', 'batchNumber', 'serialNumber', 'description', 'notes', 'uom', 'unitOfMeasure'];
    const locationKeys = ['warehouseName', 'warehouseCode', 'warehouseId', 'locationName', 'locationId', 'stockMovementNo', 'stockMovementId', 'sourceWarehouseName', 'targetWarehouseName', 'direction', 'movementType', 'movementDate', 'valuationDate'];
    const financeKeys = ['stockValue', 'averageCost', 'inventoryCost', 'cogsAmount', 'valuationMethod', 'unitPrice', 'rate', 'currencyCode', 'currency', 'totalCost', 'totalValue', 'totalAmount'];
    const glKeys = ['glPostingRequired', 'glPosted', 'glJournalEntryId', 'journalEntryId', 'accountId', 'accountCode', 'accountName', 'fiscalYearId', 'periodId', 'periodCode'];
    const excludedFromDisplay = ['id', 'companyId', 'items', 'lineItems', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'isDeleted', 'version', 'deleted'];

    const itemFields = [];
    const locationFields = [];
    const financeFields = [];
    const glFields = [];
    const systemIds = [];
    const generalFields = [];

    // Collect Technical IDs
    Object.entries(data).forEach(([key, val]) => {
      if (typeof val === 'object' && val !== null) return;
      if (key === 'id' || (key.endsWith('Id') && key !== 'companyId') || key === 'uuid') {
        let friendlyName = null;
        if (key === 'productId') friendlyName = data.productName || resolvedProductName;
        if (key === 'warehouseId') friendlyName = data.warehouseName;
        if (key === 'locationId') friendlyName = data.locationName;
        if (key === 'stockMovementId') friendlyName = data.stockMovementNo;

        systemIds.push({
          key,
          label: formatKey(key),
          value: val,
          friendlyName
        });
      }
    });

    // Categorize remaining fields
    Object.entries(data).forEach(([key, val]) => {
      if (excludedFromDisplay.includes(key)) return;
      if (typeof val === 'object' && val !== null) return;
      if (key.endsWith('Id') && !['productId', 'warehouseId', 'locationId'].includes(key)) return;

      const fieldObj = {
        key,
        label: formatKey(key),
        value: val,
        formatted: formatValue(key, val),
        isBoolean: typeof val === 'boolean'
      };

      if (itemKeys.includes(key)) {
        itemFields.push(fieldObj);
      } else if (locationKeys.includes(key)) {
        locationFields.push(fieldObj);
      } else if (financeKeys.includes(key)) {
        financeFields.push(fieldObj);
      } else if (glKeys.includes(key)) {
        glFields.push(fieldObj);
      } else {
        generalFields.push(fieldObj);
      }
    });

    return { itemFields, locationFields, financeFields, glFields, systemIds, generalFields };
  }, [data, resolvedProductName]);

  if (loading) return <PageLoader />;

  if (error || !data) {
    return (
      <div className="p-8 mt-12 max-w-lg mx-auto bg-white dark:bg-[#161922] rounded-xl border border-rose-200 dark:border-rose-800/40 shadow-sm text-center animate-fade-in">
        <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg flex items-center justify-center mx-auto mb-4 border border-rose-100 dark:border-rose-900/40">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-[#E6E8EE] mb-2">Record Not Found</h2>
        <p className="text-sm text-zinc-500 dark:text-[#A0A6B5] mb-6">{error || `We couldn't find the requested ${entityName} record.`}</p>
        <button 
          onClick={handleBack} 
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-[#4C8DFF] dark:hover:bg-[#6AA1FF] text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
        >
          Go Back
        </button>
      </div>
    );
  }

  // ─── Header Information ───────────────────────────────────────────────────
  const title = (resolvedProductName ? `${resolvedProductName} — ${entityName}` : null) 
    || data.productName 
    || data.name 
    || data.code 
    || data.warehouseName 
    || data.batchNumber 
    || data.serialNumber 
    || `${entityName} Details`;

  const subtitle = data.stockMovementNo || data.code || data.sku || data.referenceNumber || (data.id ? data.id.slice(0, 8) : null);
  const isDeleted = Boolean(data.isDeleted || data.deleted);
  const status = data.status || (isDeleted ? 'DELETED' : 'ACTIVE');

  // Metadata chips for EntityHeader
  const headerMetadata = [
    { icon: Hash, label: `${entityName}` },
    ...(subtitle ? [{ icon: Tag, label: subtitle }] : []),
    ...(data.warehouseName ? [{ icon: Warehouse, label: data.warehouseName }] : []),
    ...(data.updatedAt ? [{ icon: Clock, label: `Updated ${formatValue('updatedAt', data.updatedAt)}` }] : [])
  ];

  // KPI Strip bottom slot
  const kpiStripSlot = kpiMetrics.length > 0 ? (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 xl:gap-4 pb-4">
      {kpiMetrics.map((kpi, idx) => (
        <KPICard
          key={idx}
          title={kpi.title}
          value={kpi.value}
          subtitle={kpi.subtitle}
          icon={kpi.icon}
          valueClass={kpi.valueClass}
        />
      ))}
    </div>
  ) : null;

  return (
    <div className="min-h-screen pb-16 bg-zinc-50/50 dark:bg-[#0F1117] animate-fade-in text-zinc-900 dark:text-[#E6E8EE]">
      {/* ── Entity Header ── */}
      <EntityHeader
        onBack={handleBack}
        title={title}
        badge={{
          label: status,
          isActive: !isDeleted && status !== 'INACTIVE' && status !== 'DELETED',
          isDeleted: isDeleted
        }}
        metadata={headerMetadata}
        bottomSlot={kpiStripSlot}
        sticky
      />

      {/* ── Page Content Container ── */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 mt-6">
        {/* Navigation Tabs Bar */}
        <div className="flex border-b border-zinc-200 dark:border-[#2A2F3D] mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-1 text-sm font-bold flex items-center gap-2 transition-all relative ${
              activeTab === 'overview'
                ? 'text-blue-600 dark:text-[#4C8DFF]'
                : 'text-zinc-500 dark:text-[#A0A6B5] hover:text-zinc-800 dark:hover:text-[#E6E8EE]'
            }`}
          >
            <LayoutDashboard size={16} /> Overview
            {activeTab === 'overview' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-[#4C8DFF] rounded-t-md"></span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 px-1 ml-6 text-sm font-bold flex items-center gap-2 transition-all relative ${
              activeTab === 'audit'
                ? 'text-blue-600 dark:text-[#4C8DFF]'
                : 'text-zinc-500 dark:text-[#A0A6B5] hover:text-zinc-800 dark:hover:text-[#E6E8EE]'
            }`}
          >
            <Shield size={16} /> Audit Log & Lifecycle
            {activeTab === 'audit' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-[#4C8DFF] rounded-t-md"></span>
            )}
          </button>
        </div>

        {/* ── TAB 1: OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-slide-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 1: Product / Item Details */}
              {fieldGroups.itemFields.length > 0 && (
                <SectionInfoCard title="Item & Product Details" icon={Package}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    {fieldGroups.itemFields.map((f) => (
                      <FieldRow 
                        key={f.key} 
                        label={f.label} 
                        value={f.formatted} 
                        mono={f.key === 'sku' || f.key === 'code'} 
                        highlight={f.key === 'productName'}
                      />
                    ))}
                  </div>
                </SectionInfoCard>
              )}

              {/* Card 2: Location & Warehouse Movement */}
              {fieldGroups.locationFields.length > 0 && (
                <SectionInfoCard title="Movement & Location" icon={Warehouse}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    {fieldGroups.locationFields.map((f) => (
                      <FieldRow 
                        key={f.key} 
                        label={f.label} 
                        value={f.formatted}
                        mono={f.key === 'stockMovementNo' || f.key === 'warehouseCode'}
                        highlight={f.key === 'warehouseName'}
                      />
                    ))}
                  </div>
                </SectionInfoCard>
              )}

              {/* Card 3: Valuation & Financials */}
              {fieldGroups.financeFields.length > 0 && (
                <SectionInfoCard title="Valuation & Costing" icon={IndianRupee}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    {fieldGroups.financeFields.map((f) => (
                      <FieldRow 
                        key={f.key} 
                        label={f.label} 
                        value={f.formatted}
                        highlight={f.key === 'stockValue' || f.key === 'averageCost'}
                        isBadge={f.key === 'valuationMethod'}
                        badgeVariant="default"
                      />
                    ))}
                  </div>
                </SectionInfoCard>
              )}

              {/* Card 4: Accounting & General Ledger */}
              {fieldGroups.glFields.length > 0 && (
                <SectionInfoCard title="GL & Accounting Integration" icon={BookOpen}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    {fieldGroups.glFields.map((f) => (
                      <FieldRow 
                        key={f.key} 
                        label={f.label} 
                        value={f.formatted}
                        isBadge={f.isBoolean}
                        mono={f.key.toLowerCase().includes('id') || f.key.toLowerCase().includes('entry')}
                      />
                    ))}
                  </div>
                </SectionInfoCard>
              )}
            </div>

            {/* Card 5: General & Custom Attributes */}
            {fieldGroups.generalFields.length > 0 && (
              <SectionInfoCard title="General Attributes" icon={Layers}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                  {fieldGroups.generalFields.map((f) => (
                    <FieldRow 
                      key={f.key} 
                      label={f.label} 
                      value={f.formatted}
                      isBadge={f.isBoolean}
                    />
                  ))}
                </div>
              </SectionInfoCard>
            )}

            {/* Card 6: System Identifiers & Cross-References */}
            {fieldGroups.systemIds.length > 0 && (
              <SectionInfoCard 
                title="System Identifiers & Cross-References" 
                icon={Cpu}
                badge={
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider">
                    {fieldGroups.systemIds.length} Keys
                  </span>
                }
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fieldGroups.systemIds.map((item) => (
                    <div 
                      key={item.key} 
                      className="p-3 rounded-lg border border-zinc-200/60 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]/40 flex flex-col justify-between"
                    >
                      <div>
                        <p className="text-[8.5px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184] mb-1">
                          {item.label}
                        </p>
                        {item.friendlyName && (
                          <p className="text-xs font-semibold text-zinc-800 dark:text-[#E6E8EE] mb-1.5 truncate" title={item.friendlyName}>
                            {item.friendlyName}
                          </p>
                        )}
                      </div>
                      <CopyableIdBadge value={item.value} label={item.label} />
                    </div>
                  ))}
                </div>
              </SectionInfoCard>
            )}

            {/* Card 7: Associated Items / Line Items Table (if present) */}
            {((data.items && Array.isArray(data.items) && data.items.length > 0) || 
              (data.lineItems && Array.isArray(data.lineItems) && data.lineItems.length > 0)) && (
              <SectionInfoCard 
                title="Associated Line Items" 
                icon={Boxes}
                badge={
                  <span className="text-xs font-bold bg-zinc-100 dark:bg-[#1D212C] text-zinc-700 dark:text-[#A0A6B5] px-2.5 py-0.5 rounded-full border border-zinc-200 dark:border-[#2A2F3D]">
                    {(data.items || data.lineItems).length} Items
                  </span>
                }
              >
                <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-[#2A2F3D]">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-zinc-50/80 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-[9px] uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5] font-bold">
                      <tr>
                        <th className="px-5 py-3.5">Item Description</th>
                        <th className="px-5 py-3.5 text-right">Quantity</th>
                        <th className="px-5 py-3.5 text-right">Unit Price</th>
                        <th className="px-5 py-3.5 text-right">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
                      {(data.items || data.lineItems).map((item, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-[#222736] transition-colors">
                          <td className="px-5 py-3.5 font-semibold text-zinc-800 dark:text-[#E6E8EE]">
                            {item.productName || item.product?.productName || item.name || item.itemName || `Item ${idx + 1}`}
                          </td>
                          <td className="px-5 py-3.5 text-right text-zinc-700 dark:text-[#A0A6B5] font-medium">
                            {item.quantity || item.qty || item.requestedQuantity || item.transferredQuantity || 1}
                          </td>
                          <td className="px-5 py-3.5 text-right text-zinc-700 dark:text-[#A0A6B5]">
                            ₹{parseFloat(item.unitPrice || item.rate || item.price || item.unitCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-5 py-3.5 text-right font-bold text-zinc-900 dark:text-[#E6E8EE]">
                            ₹{parseFloat(item.totalAmount || item.totalPrice || item.totalCost || item.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionInfoCard>
            )}
          </div>
        )}

        {/* ── TAB 2: AUDIT LOG & LIFECYCLE ── */}
        {activeTab === 'audit' && (
          <div className="space-y-6 animate-slide-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Record History Card */}
              <SectionInfoCard title="Record Lifecycle & Authorship" icon={Shield}>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-zinc-200/60 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]/40 flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-[#4C8DFF] flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/30">
                      <Clock size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Created Record</p>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-[#E6E8EE] mt-0.5">
                        {data.createdBy || 'System'}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] mt-0.5">
                        {data.createdAt ? formatValue('createdAt', data.createdAt) : 'Initial System Setup'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-zinc-200/60 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]/40 flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-[#34C38F] flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/30">
                      <CheckCircle2 size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Last Modification</p>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-[#E6E8EE] mt-0.5">
                        {data.updatedBy || 'System'}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] mt-0.5">
                        {data.updatedAt ? formatValue('updatedAt', data.updatedAt) : 'No subsequent modifications'}
                      </p>
                    </div>
                  </div>
                </div>
              </SectionInfoCard>

              {/* System State & Version Card */}
              <SectionInfoCard title="System Integrity & Version State" icon={Database}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-lg border border-zinc-200/60 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]/40">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Active Status</p>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-[#E6E8EE] mt-1 flex items-center gap-1.5">
                      {!isDeleted ? (
                        <>
                          <CheckCircle2 size={15} className="text-emerald-500" /> Active
                        </>
                      ) : (
                        <>
                          <XCircle size={15} className="text-rose-500" /> Deleted
                        </>
                      )}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg border border-zinc-200/60 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]/40">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Is Deleted Flag</p>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-[#E6E8EE] mt-1">
                      {isDeleted ? 'Yes' : 'No'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg border border-zinc-200/60 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]/40">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Record Version</p>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-[#E6E8EE] font-mono mt-1">
                      {data.version !== null && data.version !== undefined ? `v${data.version}` : 'v1.0'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg border border-zinc-200/60 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]/40">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Entity Type</p>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-[#E6E8EE] mt-1 truncate">
                      {entityName}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184]">Primary Record ID</p>
                    <p className="text-xs font-mono text-zinc-700 dark:text-[#A0A6B5] mt-0.5">{data.id}</p>
                  </div>
                  <CopyableIdBadge value={data.id} label="Record ID" />
                </div>
              </SectionInfoCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
