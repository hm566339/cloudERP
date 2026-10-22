import React, { useState, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, Eye, Tag
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  useProductPriceList, 
  useProductPriceDelete, 
  useProductPriceCreate, 
  useProductPriceUpdate 
} from '../../../api/inventory';
import { useProductList } from '../../../api/inventory/hooks/useProduct';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import useUrlFilters from '../../../hooks/useUrlFilters';
import RequirePermission from '../../../components/common/RequirePermission';
import { confirmDialog } from '../../../utils/confirmDialog';
import ProductPriceForm from '../components/ProductPriceForm';
import ViewProductPriceModal from '../components/ViewProductPriceModal';
import ExpandedRowDetails from '../components/ExpandedRowDetails';
import ExportModal from '../../../components/common/ExportModal';
import PageHeader from '../../../components/common/PageHeader';
import { useRoutePath } from '../../../hooks/useRoutePath';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import AuditLogHover from '../../../components/common/AuditLogHover';
import Modal from '../../../components/common/Modal';

const DEFAULT_COLUMNS = [
  'product',
  'priceDetails',
  'validityPeriod',
  'constraints',
  'status'
];

function formatDisplayDate(dateStr, fallback = '-') {
  if (!dateStr) return fallback;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return fallback;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return fallback;
  }
}

export default function ProductPriceManagement() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [viewingPrice, setViewingPrice] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();

  const {
    page, setPage, setPageSize, apiParams,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10, defaultSortBy: 'effectiveFrom', defaultSortOrder: 'desc' });

  // Fetch product catalog to resolve product names and UOMs efficiently
  const { products, isLoading: isLoadingProducts, refetch: refetchProducts } = useProductList({}, { page: 0, size: 1000 });

  const productMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(products)) {
      products.forEach(p => {
        if (p?.id) map.set(p.id, p);
      });
    }
    return map;
  }, [products]);

  const queryFilters = useMemo(() => {
    const q = {};
    const searchTerm = (filters.searchKey || '').trim();

    if (searchTerm) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchTerm);
      if (isUuid) {
        q.productId = searchTerm;
      } else {
        const matches = Array.from(productMap.values()).filter(p => 
          (p.productName && p.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (p.productCode && p.productCode.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        if (matches.length === 1) {
          q.productId = matches[0].id;
        } else {
          q.searchKey = searchTerm;
        }
      }
    }

    if (filters.productId && filters.productId.trim()) q.productId = filters.productId.trim();
    if (filters.priceType && filters.priceType.trim()) q.priceType = filters.priceType.trim();
    if (filters.status && filters.status.trim()) q.status = filters.status.trim();
    if (filters.currencyCode && filters.currencyCode.trim()) q.currencyCode = filters.currencyCode.trim();
    if (filters.minQuantity !== undefined && filters.minQuantity !== '') q.minQuantity = filters.minQuantity;

    return q;
  }, [filters, productMap]);

  const pageable = useMemo(() => ({
    page,
    size: apiParams.size || 10,
    sort: sortBy ? `${sortBy},${sortOrder || 'desc'}` : 'effectiveFrom,desc'
  }), [page, apiParams.size, sortBy, sortOrder]);

  const { 
    productPrices, 
    pagination: pageInfo, 
    isLoading, 
    isFetching, 
    refetch 
  } = useProductPriceList(queryFilters, pageable, { keepPreviousData: true });

  const deleteMutation = useProductPriceDelete();
  const createMutation = useProductPriceCreate();
  const updateMutation = useProductPriceUpdate();

  const handleReset = () => {
    resetFilters();
    setPage(0);
    setSelectedRows([]);
  };

  const handleDelete = (id) => {
    confirmDialog(
      'Delete Price Record',
      'Are you sure you want to delete this price record? This action cannot be undone.',
      async () => {
        try {
          await deleteMutation.mutateAsync(id);
          dispatch(addAlert({ type: 'success', message: 'Price record deleted successfully' }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to delete price record' }));
        }
      }
    );
  };

  const handleFormSubmit = async (payload) => {
    try {
      if (selectedPrice?.id) {
        await updateMutation.mutateAsync([selectedPrice.id, payload]);
        dispatch(addAlert({ type: 'success', message: 'Price record updated successfully' }));
      } else {
        await createMutation.mutateAsync(payload);
        dispatch(addAlert({ type: 'success', message: 'Price record created successfully' }));
      }
      setIsFormOpen(false);
      refetch();
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to save price record' }));
      throw error;
    }
  };

  const handleEdit = (price) => {
    setSelectedPrice(price);
    setIsFormOpen(true);
  };

  const handleCreate = (prefillData = null) => {
    if (prefillData && prefillData.nativeEvent) {
      prefillData = null;
    }
    setSelectedPrice(prefillData);
    setIsFormOpen(true);
  };

  const columns = useMemo(() => [
    {
      id: 'product',
      label: 'Product',
      sortable: false,
      render: (val, row) => {
        const product = productMap.get(row.productId);
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-zinc-900 truncate max-w-[260px]" title={product?.productName || row.productId}>
              {product?.productName || (row.productId ? `${row.productId.substring(0, 8)}...` : '-')}
            </span>
            <span className="text-zinc-500 font-mono text-xs flex items-center gap-1.5 mt-0.5">
              <Tag size={10} className="text-zinc-400" />
              {product?.sku ? `SKU: ${product.sku}` : product?.productCode ? `Code: ${product.productCode}` : row.productId ? `ID: ${row.productId.substring(0, 8)}...` : '-'}
            </span>
          </div>
        );
      }
    },
    {
      id: 'priceDetails',
      label: 'Price Details',
      sortable: true,
      sortKey: 'price',
      align: 'right',
      render: (val, row) => (
        <div className="flex flex-col items-end">
          <span className="font-medium text-zinc-900 font-mono">
            {row.currencyCode || 'INR'} {Number(row.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
            {row.priceType || 'STANDARD'}
          </span>
        </div>
      )
    },
    {
      id: 'validityPeriod',
      label: 'Validity Period',
      sortable: true,
      sortKey: 'effectiveFrom',
      render: (val, row) => (
        <div className="flex flex-col gap-1 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-800 font-medium">
            <span className="text-emerald-500">From:</span>
            <span>{formatDisplayDate(row.effectiveFrom)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-500">
            <span className={row.effectiveTo ? "text-rose-400" : "text-zinc-400"}>To:</span>
            <span className={row.effectiveTo ? "font-medium text-zinc-700" : "font-normal italic"}>
              {formatDisplayDate(row.effectiveTo, 'Indefinite')}
            </span>
          </div>
        </div>
      )
    },
    {
      id: 'constraints',
      label: 'Constraints',
      sortable: false,
      render: (val, row) => {
        const product = productMap.get(row.productId);
        return (
          <div className="text-xs text-zinc-600">
            <span>Min Qty: </span>
            <span className="font-bold text-zinc-800">{row.minQuantity !== undefined && row.minQuantity !== null ? Number(row.minQuantity) : 1}</span>
            {product?.baseUomCode && <span className="text-zinc-500 font-medium ml-1">({product.baseUomCode})</span>}
          </div>
        );
      }
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      sortKey: 'status',
      align: 'center',
      render: (val, row) => <DataTableStatusBadge status={row.status} />
    }
  ], [productMap]);

  const basicFilters = useMemo(() => [
    {
      id: 'priceType',
      label: 'Price Type',
      type: 'select',
      options: [
        { label: 'All Types', value: '' },
        { label: 'Purchase', value: 'PURCHASE' },
        { label: 'Selling', value: 'SELLING' },
        { label: 'MRP', value: 'MRP' },
        { label: 'Wholesale', value: 'WHOLESALE' },
        { label: 'Retail', value: 'RETAIL' },
        { label: 'Standard', value: 'STANDARD' }
      ]
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Inactive', value: 'INACTIVE' },
        { label: 'Draft', value: 'DRAFT' }
      ]
    }
  ], []);

  const advancedFilters = useMemo(() => {
    const productOptions = Array.from(productMap.values()).map(p => ({
      value: p.id,
      label: p.productName
    }));
    return [
      {
        title: 'Product & Limits',
        fields: [
          { id: 'productId', label: 'Filter By Product', type: 'select', options: [{ label: 'All Products', value: '' }, ...productOptions] },
          { id: 'minQuantity', label: 'Minimum Quantity', type: 'number', placeholder: 'Min Qty' }
        ]
      },
      {
        title: 'Currency',
        fields: [
          { id: 'currencyCode', label: 'Currency Code', placeholder: 'e.g. INR, USD', uppercase: true }
        ]
      }
    ];
  }, [productMap]);

  const rowActions = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => setViewingPrice(row),
      tooltip: 'View Details',
      className: 'hover:text-blue-600 hover:bg-blue-50'
    },
    {
      key: 'audit',
      component: ({ row }) => <AuditLogHover audit={row.audit} />
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: Edit2,
      permission: { module: 'INVENTORY', action: 'UPDATE' },
      onClick: (row) => handleEdit(row),
      tooltip: 'Edit',
      className: 'hover:text-indigo-600 hover:bg-indigo-50'
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      permission: { module: 'INVENTORY', action: 'DELETE' },
      onClick: (row) => handleDelete(row.id),
      tooltip: 'Delete'
    }
  ], []);

  const renderExpandedRow = (price) => {
    const product = productMap.get(price.productId);
    const enrichedPriceData = {
      ...price,
      productName: product?.productName || null,
      sku: product?.sku || null,
      productCode: product?.productCode || null,
      baseUom: product?.baseUomCode || null,
    };
    return <ExpandedRowDetails data={enrichedPriceData} bare />;
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <PageHeader
        title="Product Prices"
        description="Manage pricing tiers, multi-currency rates, and validity periods"
        icon={Tag}
      >
        <RequirePermission module="INVENTORY" action="CREATE">
          <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span>New Price</span>
          </button>
        </RequirePermission>
      </PageHeader>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={productPrices}
          rowKey="id"
          loading={isLoading || isLoadingProducts}
          isRefreshing={isFetching}
          onRowClick={(row) => setViewingPrice(row)}
          
          searchable
          searchValue={filters.searchKey || ''}
          searchPlaceholder="Search Name, SKU, ID..."
          onSearchChange={(val) => setFilter('searchKey', val)}
          createOption={{
            enabled: true,
            label: (val) => `New Price for "${val}"`,
            description: 'Add as new price record',
            onCreate: () => handleCreate()
          }}

          filters={basicFilters}
          filterValues={filters}
          onFilterChange={setFilter}

          advancedFilters={advancedFilters}

          onReset={handleReset}
          onRefresh={() => { refetch(); refetchProducts(); }}
          onExport={() => setIsExportModalOpen(true)}

          visibleColumns={visibleColumns}
          onVisibleColumnsChange={setVisibleColumns}

          sort={{ key: sortBy, direction: sortOrder }}
          onSortChange={({ key }) => handleColumnSort(key)}

          rowActions={rowActions}

          expandedRowId={expandedRowId}
          onToggleExpand={(id) => setExpandedRowId(expandedRowId === id ? null : id)}
          renderExpandedRow={renderExpandedRow}

          pagination={{
            page,
            pageSize: apiParams.size,
            totalPages: pageInfo?.totalPages || 1,
            totalElements: pageInfo?.totalElements || productPrices?.length || 0
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="price records"

          emptyMessage="No price records found"
          emptyDescription="Try adjusting your search keywords or filter criteria."
        />
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedPrice ? 'Edit Price Record' : 'New Price Record'}
        maxWidth="max-w-xl"
      >
        <ProductPriceForm
          initialData={selectedPrice}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
          isLoading={createMutation.isLoading || updateMutation.isLoading}
        />
      </Modal>

      {viewingPrice && createPortal(
        <ViewProductPriceModal
          price={viewingPrice}
          product={viewingPrice ? productMap.get(viewingPrice.productId) : null}
          isOpen={!!viewingPrice}
          onClose={() => setViewingPrice(null)}
          onEdit={(p) => {
            setViewingPrice(null);
            handleEdit(p);
          }}
        />,
        document.body
      )}

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="productprices-export"
        hideDateRange={true}
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}
