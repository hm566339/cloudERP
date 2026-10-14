import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, 
  MapPin, 
  ArrowRightLeft, 
  Calendar,
  Eye
} from 'lucide-react';
import { 
  useInventoryValuationList,
  useProductList,
  useWarehouseList,
  useWarehouseLocationList,
  useStockMovementList
} from '../../../api/inventory';
import { useAppDispatch } from '../../../app/hooks';
import useUrlFilters from '../../../hooks/useUrlFilters';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import ExportModal from '../../../components/common/ExportModal';

/**
 * Checks whether a given value is formatted as a raw UUID string.
 */
function isUuid(val) {
  if (typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
}

const DEFAULT_COLUMNS = [
  'movementNo',
  'productLocation',
  'quantity',
  'averageCost',
  'cogsAmount',
  'stockValue',
  'glStatus'
];

export default function InventoryValuationManagement() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [expandedRowId, setExpandedRowId] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);

  const {
    page, setPage, setPageSize, apiParams,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10, defaultSortBy: 'valuationDate', defaultSortOrder: 'desc' });

  // Lookups to guarantee clean, user-friendly labels without exposing raw UUIDs
  const { products } = useProductList({}, { page: 0, size: 100 });
  const { warehouses } = useWarehouseList({}, { page: 0, size: 100 });
  const { locations } = useWarehouseLocationList({}, { page: 0, size: 100 });
  const { stockMovements } = useStockMovementList({}, { page: 0, size: 100 });

  const productMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(products)) {
      products.forEach(p => {
        if (p?.id) map.set(p.id, p);
      });
    }
    return map;
  }, [products]);

  const warehouseMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(warehouses)) {
      warehouses.forEach(w => {
        if (w?.id) map.set(w.id, w);
      });
    }
    return map;
  }, [warehouses]);

  const locationMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(locations)) {
      locations.forEach(l => {
        if (l?.id) map.set(l.id, l);
      });
    }
    return map;
  }, [locations]);

  const stockMovementMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(stockMovements)) {
      stockMovements.forEach(m => {
        if (m?.id) map.set(m.id, m);
      });
    }
    return map;
  }, [stockMovements]);

  // Resolvers to extract user-friendly display labels
  const getProductName = (val) => {
    if (val.productName && !isUuid(val.productName)) return val.productName;
    if (val.product?.name && !isUuid(val.product.name)) return val.product.name;
    if (val.product?.productName && !isUuid(val.product.productName)) return val.product.productName;
    const fromMap = productMap.get(val.productId);
    if (fromMap?.name && !isUuid(fromMap.name)) return fromMap.name;
    if (fromMap?.productName && !isUuid(fromMap.productName)) return fromMap.productName;
    return '—';
  };

  const getMovementNo = (val) => {
    if (val.stockMovementNo && !isUuid(val.stockMovementNo)) return val.stockMovementNo;
    if (val.movementNo && !isUuid(val.movementNo)) return val.movementNo;
    if (val.stockMovement?.movementNo && !isUuid(val.stockMovement.movementNo)) return val.stockMovement.movementNo;
    const fromMap = stockMovementMap.get(val.stockMovementId);
    if (fromMap?.movementNo && !isUuid(fromMap.movementNo)) return fromMap.movementNo;
    if (fromMap?.stockMovementNo && !isUuid(fromMap.stockMovementNo)) return fromMap.stockMovementNo;
    return '—';
  };

  const getWarehouseLocation = (val) => {
    const wName = (val.warehouseName && !isUuid(val.warehouseName))
      ? val.warehouseName 
      : (warehouseMap.get(val.warehouseId)?.name || warehouseMap.get(val.warehouseId)?.warehouseName || '');

    const lName = (val.locationName && !isUuid(val.locationName))
      ? val.locationName 
      : (locationMap.get(val.locationId)?.locationName || locationMap.get(val.locationId)?.name || '');

    if (wName && lName) {
      return `${wName} · ${lName}`;
    }
    return wName || lName || '';
  };

  const queryFilters = useMemo(() => {
    const q = {};
    if (filters.productId && filters.productId.trim()) {
      const val = filters.productId.trim();
      if (isUuid(val)) {
        q.productId = val;
      } else {
        const matched = Array.from(productMap.values()).find(p => 
          (p.name && p.name.toLowerCase().includes(val.toLowerCase())) ||
          (p.sku && p.sku.toLowerCase().includes(val.toLowerCase()))
        );
        q.productId = matched ? matched.id : val;
      }
    }
    if (filters.stockMovementId && filters.stockMovementId.trim()) {
      const val = filters.stockMovementId.trim();
      if (isUuid(val)) {
        q.stockMovementId = val;
      } else {
        const matched = Array.from(stockMovementMap.values()).find(sm => 
          (sm.movementNo && sm.movementNo.toLowerCase().includes(val.toLowerCase()))
        );
        q.stockMovementId = matched ? matched.id : val;
      }
    }
    if (filters.warehouseId && filters.warehouseId.trim()) {
      const val = filters.warehouseId.trim();
      if (isUuid(val)) {
        q.warehouseId = val;
      } else {
        const matched = Array.from(warehouseMap.values()).find(w =>
          (w.name && w.name.toLowerCase().includes(val.toLowerCase()))
        );
        q.warehouseId = matched ? matched.id : val;
      }
    }
    if (filters.glJournalEntryId && filters.glJournalEntryId.trim()) {
      q.glJournalEntryId = filters.glJournalEntryId.trim();
    }
    return q;
  }, [filters, productMap, stockMovementMap, warehouseMap]);

  const finalParams = useMemo(() => ({
    ...queryFilters
  }), [queryFilters]);

  const pageable = useMemo(() => ({
    page,
    size: apiParams.size || 10,
    sort: sortBy ? `${sortBy},${sortOrder || 'desc'}` : (apiParams.sort || 'valuationDate,desc')
  }), [page, apiParams.size, sortBy, sortOrder, apiParams.sort]);

  const { inventoryValuations, pagination: pageInfo, isLoading, isFetching, refetch } = useInventoryValuationList(
    finalParams,
    pageable,
    { keepPreviousData: true }
  );

  const handleReset = () => {
    resetFilters();
    setPage(0);
    setSelectedRows([]);
  };

  const columns = useMemo(() => [
    {
      id: 'movementNo',
      label: 'Ref & Date',
      sortable: false,
      render: (val, row) => (
        <div className="flex flex-col">
          <span 
            className="font-semibold text-zinc-900 text-xs flex items-center gap-1.5"
            title={getMovementNo(row) !== '—' ? getMovementNo(row) : undefined}
          >
            <ArrowRightLeft size={13} className="text-zinc-400 shrink-0" />
            <span className="truncate max-w-[160px] font-mono">
              {getMovementNo(row)}
            </span>
          </span>
          <span className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1">
            <Calendar size={11} className="text-zinc-400 shrink-0" />
            <span>{row.valuationDate ? new Date(row.valuationDate).toLocaleDateString() : '—'}</span>
          </span>
        </div>
      )
    },
    {
      id: 'productLocation',
      label: 'Product & Location',
      sortable: false,
      render: (val, row) => (
        <div className="flex flex-col">
          <span 
            className="font-semibold text-zinc-900 text-xs flex items-center gap-1.5"
            title={getProductName(row) !== '—' ? getProductName(row) : undefined}
          >
            <Package size={13} className="text-zinc-400 shrink-0" />
            <span className="truncate max-w-[280px]">{getProductName(row)}</span>
          </span>
          {getWarehouseLocation(row) ? (
            <span 
              className="text-zinc-500 text-[11px] mt-0.5 flex items-center gap-1"
              title={getWarehouseLocation(row)}
            >
              <MapPin size={11} className="text-zinc-400 shrink-0" />
              <span className="truncate max-w-[280px]">{getWarehouseLocation(row)}</span>
            </span>
          ) : null}
        </div>
      )
    },
    {
      id: 'quantity',
      label: 'Qty',
      sortable: true,
      align: 'right',
      render: (val, row) => (
        <span className="font-medium text-zinc-900 text-sm font-mono">
          {row.quantity ?? 0}
        </span>
      )
    },
    {
      id: 'averageCost',
      label: 'Unit Cost',
      sortable: true,
      align: 'right',
      render: (val, row) => (
        <span className="font-medium text-zinc-700 text-sm font-mono">
          {row.averageCost !== undefined && row.averageCost !== null 
            ? Number(row.averageCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
            : '0.00'}
        </span>
      )
    },
    {
      id: 'cogsAmount',
      label: 'COGS Amt',
      sortable: true,
      align: 'right',
      render: (val, row) => (
        <span className="font-medium text-zinc-700 text-sm font-mono">
          {row.cogsAmount !== undefined && row.cogsAmount !== null 
            ? Number(row.cogsAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
            : '0.00'}
        </span>
      )
    },
    {
      id: 'stockValue',
      label: 'Total Value',
      sortable: true,
      align: 'right',
      render: (val, row) => (
        <span className="font-bold text-zinc-900 text-sm font-mono">
          {row.stockValue !== undefined && row.stockValue !== null 
            ? Number(row.stockValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
            : '0.00'}
        </span>
      )
    },
    {
      id: 'glStatus',
      label: 'GL Status',
      sortable: false,
      align: 'center',
      render: (val, row) => {
        if (row.glPostingRequired) {
          if (row.glPosted) {
            return <DataTableStatusBadge status="POSTED" label="Posted" />;
          }
          return <DataTableStatusBadge status="PENDING" label="Pending" />;
        }
        return <DataTableStatusBadge status="DRAFT" label="No Impact" />;
      }
    }
  ], [productMap, warehouseMap, locationMap, stockMovementMap]);

  const basicFilters = useMemo(() => [
    {
      id: 'productId',
      label: 'Product',
      type: 'text',
      placeholder: 'Search product...'
    },
    {
      id: 'warehouseId',
      label: 'Warehouse',
      type: 'text',
      placeholder: 'Search warehouse...'
    }
  ], []);

  const advancedFilters = useMemo(() => [
    {
      title: 'Financial & GL Tracking',
      fields: [
        { id: 'glJournalEntryId', label: 'GL Journal Reference', placeholder: 'Search GL Journal...' }
      ]
    }
  ], []);

  const rowActions = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => setExpandedRowId(expandedRowId === row.id ? null : row.id),
      tooltip: 'View Details',
      className: 'hover:text-blue-600 hover:bg-blue-50'
    }
  ], [expandedRowId]);

  const renderExpandedRow = (val) => {
    const prodName = getProductName(val);
    const wName = (val.warehouseName && !isUuid(val.warehouseName))
      ? val.warehouseName 
      : (warehouseMap.get(val.warehouseId)?.name || warehouseMap.get(val.warehouseId)?.warehouseName || '-');
    const locName = (val.locationName && !isUuid(val.locationName))
      ? val.locationName 
      : (locationMap.get(val.locationId)?.locationName || locationMap.get(val.locationId)?.name || '-');
    const movNo = getMovementNo(val);

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <div className="space-y-1">
          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Product Name</span>
          <p className="text-sm font-semibold text-zinc-900">{prodName}</p>
        </div>
        <div className="space-y-1">
          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Movement No</span>
          <p className="text-sm font-semibold text-zinc-900 font-mono">{movNo}</p>
        </div>
        <div className="space-y-1">
          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Warehouse</span>
          <p className="text-sm font-medium text-zinc-700">{wName}</p>
        </div>
        <div className="space-y-1">
          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Location</span>
          <p className="text-sm font-medium text-zinc-700">{locName}</p>
        </div>
        <div className="space-y-1">
          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Valuation Date</span>
          <p className="text-sm font-medium text-zinc-700">
            {val.valuationDate ? new Date(val.valuationDate).toLocaleDateString() : '-'}
          </p>
        </div>
        <div className="space-y-1">
          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Quantity</span>
          <p className="text-sm font-medium text-zinc-900 font-mono">{val.quantity ?? 0}</p>
        </div>
        <div className="space-y-1">
          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Average Cost</span>
          <p className="text-sm font-medium text-zinc-700 font-mono">
            {val.averageCost !== undefined && val.averageCost !== null 
              ? Number(val.averageCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
              : '0.00'}
          </p>
        </div>
        <div className="space-y-1">
          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">COGS Amount</span>
          <p className="text-sm font-medium text-zinc-700 font-mono">
            {val.cogsAmount !== undefined && val.cogsAmount !== null 
              ? Number(val.cogsAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
              : '0.00'}
          </p>
        </div>
        <div className="space-y-1">
          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Stock Value</span>
          <p className="text-sm font-bold text-zinc-900 font-mono">
            {val.stockValue !== undefined && val.stockValue !== null 
              ? Number(val.stockValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
              : '0.00'}
          </p>
        </div>
        <div className="space-y-1">
          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">GL Status</span>
          <div>
            {val.glPostingRequired ? (
              val.glPosted ? (
                <DataTableStatusBadge status="POSTED" label="Posted" />
              ) : (
                <DataTableStatusBadge status="PENDING" label="Pending" />
              )
            ) : (
              <DataTableStatusBadge status="DRAFT" label="No Impact" />
            )}
          </div>
        </div>
        {val.valuationMethod && (
          <div className="space-y-1">
            <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Valuation Method</span>
            <p className="text-sm font-medium text-zinc-700 font-mono uppercase">{val.valuationMethod}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <PageHeader
        title="Inventory Financial Valuations"
        description="Review the financial impact (COGS, Average Cost, GL Postings) of stock movements"
      />

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={inventoryValuations || []}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}

          // Search
          searchable
          searchValue={filters.stockMovementId || ''}
          searchPlaceholder="Search Movement No..."
          onSearchChange={(val) => setFilter('stockMovementId', val)}

          // Basic Filters
          filters={basicFilters}
          filterValues={filters}
          onFilterChange={setFilter}

          // Advanced Filters
          advancedFilters={advancedFilters}

          // Reset & Refresh & Export
          onReset={handleReset}
          onRefresh={refetch}
          onExport={() => setIsExportModalOpen(true)}

          // Column Visibility
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={setVisibleColumns}

          // Sorting
          sort={{ key: sortBy, direction: sortOrder }}
          onSortChange={({ key }) => handleColumnSort(key)}

          // Row Actions
          rowActions={rowActions}

          // Expandable Sub-rows
          expandedRowId={expandedRowId}
          onToggleExpand={(id) => setExpandedRowId(expandedRowId === id ? null : id)}
          renderExpandedRow={renderExpandedRow}

          // Pagination
          pagination={{
            page,
            pageSize: apiParams.size || 10,
            totalPages: pageInfo?.totalPages || 1,
            totalElements: pageInfo?.totalElements || inventoryValuations?.length || 0
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="valuations"

          // Empty State
          emptyMessage="No valuations found"
          emptyDescription="There are no financial ledger entries matching your search criteria."
        />
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="inventoryvaluation-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
        totalItems={pageInfo?.totalElements || inventoryValuations?.length || 0}
      />
    </div>
  );
}
