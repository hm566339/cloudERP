import React, { useState, useMemo } from 'react';
import useListQuery from '../../../hooks/useListQuery';
import SearchInput from '../../../components/common/SearchInput';
import Pagination from '../../../components/common/Pagination';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Truck, Plus, Search, SlidersHorizontal, ChevronDown, ChevronUp,
  RotateCcw, RefreshCw, X, Filter, Eye, CheckCircle, FileText,
  Receipt, ArrowRight, Package, AlertCircle, Download
} from 'lucide-react';
import {
  useGetGoodsReceiptsQuery,
  useConfirmGoodsReceiptMutation,
  useReverseGoodsReceiptMutation,
} from '../../../api/purchase';
import api from '../../../api/common/client';
import { useGetWarehousesQuery } from '../../../api/inventory/inventory.api';
import useUrlFilters from '../../../hooks/useUrlFilters';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { purchaseTabs } from '../../../components/module-tabs';
import DataTable from '../../../components/data-table/DataTable';
import AuditLogHover from '../../../components/common/AuditLogHover';
import ExportModal from '../../../components/common/ExportModal';
import { confirmDialog } from '../../../utils/confirmDialog';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { useRoutePath } from '../../../hooks/useRoutePath';
import StatusBadge from '../../../components/common/StatusBadge';


const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-');
      return new Date(year, month - 1, day).toLocaleDateString();
    }
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
};

const getPoBasePath = (pathname) => {
  if (pathname.includes('/accounts/transactions')) return '/accounts/transactions/purchase-orders';
  if (pathname.includes('/purchases/')) return '/purchases/purchase-orders';
  return '/purchase-orders';
};

/* Expanded Goods Receipt Overview */
const GoodsReceiptOverview = ({ grn, warehouseMap, navigate, location, buildPath, setSelectedGrn }) => {
  const poId = grn.purchaseOrderId || grn.purchaseOrder?.id;
  const poNum = grn.purchaseOrder?.poNumber || grn.poNumber;
  const vendorDisplay = grn.vendor?.vendorName || grn.vendorName || '—';
  const warehouseDisplay = grn.warehouseName || grn.warehouse?.warehouseName || grn.warehouse?.name || (grn.warehouseId ? warehouseMap[grn.warehouseId] : null) || '—';
  const itemCount = Array.isArray(grn.items) ? grn.items.length : (grn.itemsCount ?? grn.itemCount ?? 0);

  return (
    <div className="bg-zinc-50/70 p-6 rounded-xl border border-zinc-200/80">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Receipt Information */}
        <div className="space-y-3 bg-white p-4 rounded-xl border border-zinc-200/70 shadow-xs">
          <h4 className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-100 pb-2">
            <Truck size={14} className="text-zinc-500" />
            Receipt Details
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-zinc-50">
              <span className="text-zinc-500">GRN Number:</span>
              <span className="font-mono font-bold text-zinc-900">{grn.grnNumber || '—'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-50">
              <span className="text-zinc-500">GRN Date:</span>
              <span className="font-medium text-zinc-800">{formatDate(grn.grnDate)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-50">
              <span className="text-zinc-500">PO Reference:</span>
              {poNum && poId ? (
                <button
                  type="button"
                  onClick={() => navigate(buildPath(`${getPoBasePath(location.pathname)}/${poId}`))}
                  className="font-mono font-semibold text-primary hover:underline"
                >
                  {poNum}
                </button>
              ) : (
                <span className="font-mono font-semibold text-zinc-700">{poNum || '—'}</span>
              )}
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-50">
              <span className="text-zinc-500">Warehouse:</span>
              <span className="font-medium text-zinc-800">{warehouseDisplay}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-zinc-500">Status:</span>
              <StatusBadge status={grn.status} />
            </div>
          </div>
        </div>

        {/* Logistics & Vendor */}
        <div className="space-y-3 bg-white p-4 rounded-xl border border-zinc-200/70 shadow-xs">
          <h4 className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-100 pb-2">
            <FileText size={14} className="text-zinc-500" />
            Logistics & Vendor
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-zinc-50">
              <span className="text-zinc-500">Vendor:</span>
              <span className="font-semibold text-zinc-800">{vendorDisplay}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-50">
              <span className="text-zinc-500">Delivery Note #:</span>
              <span className="font-mono text-zinc-700">{grn.deliveryNoteNumber || '—'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-50">
              <span className="text-zinc-500">Vehicle #:</span>
              <span className="font-mono text-zinc-700">{grn.vehicleNumber || '—'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-50">
              <span className="text-zinc-500">Transporter:</span>
              <span className="text-zinc-700">{grn.transporterName || '—'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-zinc-500">Created At:</span>
              <span className="text-zinc-700">{formatDateTime(grn.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Items Summary & Quick Actions */}
        <div className="space-y-3 bg-white p-4 rounded-xl border border-zinc-200/70 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-100 pb-2">
              <Package size={14} className="text-zinc-500" />
              Received Items ({itemCount})
            </h4>
            <div className="mt-2 max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {(grn.items || []).map((it, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-zinc-50 last:border-none">
                  <span className="font-medium text-zinc-800 truncate max-w-[140px]">
                    {it.itemName || it.itemCode || `Item ${i + 1}`}
                  </span>
                  <span className="text-zinc-600 font-mono text-[11px]">
                    Recv: <strong className="text-zinc-800">{it.receivedQuantity} {it.unit || ''}</strong>
                    {it.rejectedQuantity > 0 && <span className="text-rose-600 ml-1">({it.rejectedQuantity} rej)</span>}
                  </span>
                </div>
              ))}
              {(!grn.items || grn.items.length === 0) && (
                <p className="text-xs text-zinc-400 italic py-2">No items listed</p>
              )}
            </div>
          </div>
          <div className="pt-2 border-t border-zinc-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedGrn(grn)}
              className="btn-secondary text-xs flex items-center gap-1 py-1 px-2.5 shadow-2xs"
            >
              <Eye size={13} /> Full Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function GoodsReceiptsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { buildPath } = useRoutePath();
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;

  const [expandedRowId, setExpandedRowId] = useState(null);
  const [selectedGrn, setSelectedGrn] = useState(null);
  const [selectedGrns, setSelectedGrns] = useState([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [reversalReason, setReversalReason] = useState('');
  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [grnToReverse, setGrnToReverse] = useState(null);
  const [creatingInvoiceId, setCreatingInvoiceId] = useState(null);

  const {
    page, setPage, pageSize, setPageSize,
    searchTerm, setSearchTerm, debouncedSearch,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10 });

  const handleReset = () => {
    resetFilters();
    setSearchTerm('');
    setSelectedGrns([]);
    setPage(0);
  };

  // Optional warehouse lookup
  const { data: warehousesData } = useGetWarehousesQuery({ companyId, size: 200 }, { skip: !companyId });
  const warehouseMap = useMemo(() => {
    const map = {};
    const list = warehousesData?.content || warehousesData?.data?.content || (Array.isArray(warehousesData) ? warehousesData : []);
    if (Array.isArray(list)) {
      list.forEach(w => {
        if (w.id) map[w.id] = w.warehouseName || w.name;
      });
    }
    return map;
  }, [warehousesData]);

  const queryFilters = useMemo(() => {
    const q = {};
    if (debouncedSearch && debouncedSearch.trim()) q.search = debouncedSearch.trim();
    if (filters.status) q.status = filters.status;
    if (filters.grnDateFrom) q.grnDateFrom = filters.grnDateFrom;
    if (filters.grnDateTo) q.grnDateTo = filters.grnDateTo;
    return q;
  }, [debouncedSearch, filters]);

  const { data: apiResponse, isLoading, isFetching, refetch } = useGetGoodsReceiptsQuery({
    companyId,
    page,
    size: pageSize,
    ...queryFilters
  });

  const [confirmGrn, { isLoading: isConfirming }] = useConfirmGoodsReceiptMutation();
  const [reverseGrn, { isLoading: isReversing }] = useReverseGoodsReceiptMutation();

  const rawList = apiResponse?.data?.content || apiResponse?.data || (Array.isArray(apiResponse) ? apiResponse : []);
  const backendPage = apiResponse?.data?.page || apiResponse?.page || null;

  // Client-side filtering fallback
  const filteredList = useMemo(() => {
    let list = Array.isArray(rawList) ? rawList : [];

    if (debouncedSearch && debouncedSearch.trim()) {
      const s = debouncedSearch.toLowerCase().trim();
      list = list.filter(g =>
        g.grnNumber?.toLowerCase().includes(s) ||
        (g.purchaseOrder?.poNumber || g.poNumber)?.toLowerCase().includes(s) ||
        (g.vendor?.vendorName || g.vendorName)?.toLowerCase().includes(s) ||
        (g.warehouseName || warehouseMap[g.warehouseId])?.toLowerCase().includes(s)
      );
    }

    if (filters.status) {
      list = list.filter(g => (g.status || '').toUpperCase() === filters.status.toUpperCase());
    }

    if (filters.grnDateFrom) {
      list = list.filter(g => g.grnDate && g.grnDate >= filters.grnDateFrom);
    }

    if (filters.grnDateTo) {
      list = list.filter(g => g.grnDate && g.grnDate <= filters.grnDateTo);
    }

    if (filters.deliveryNote) {
      const dn = filters.deliveryNote.toLowerCase().trim();
      list = list.filter(g => g.deliveryNoteNumber?.toLowerCase().includes(dn));
    }

    if (filters.transporter) {
      const tr = filters.transporter.toLowerCase().trim();
      list = list.filter(g => g.transporterName?.toLowerCase().includes(tr) || g.vehicleNumber?.toLowerCase().includes(tr));
    }

    return list;
  }, [rawList, debouncedSearch, filters, warehouseMap]);

  // Client-side sorting fallback
  const sortedList = useMemo(() => {
    if (!sortBy) return filteredList;
    return [...filteredList].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      if (sortBy === 'poNumber') aVal = a.purchaseOrder?.poNumber || a.poNumber;
      if (sortBy === 'vendor') aVal = a.vendor?.vendorName || a.vendorName;
      if (sortBy === 'itemsCount') aVal = Array.isArray(a.items) ? a.items.length : (a.itemsCount ?? 0);
      if (sortBy === 'warehouse') aVal = a.warehouseName || warehouseMap[a.warehouseId] || '';

      if (!aVal && !bVal) return 0;
      if (!aVal) return 1;
      if (!bVal) return -1;
      if (typeof aVal === 'string') {
        return sortOrder === 'desc'
          ? bVal.localeCompare(aVal)
          : aVal.localeCompare(bVal);
      }
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [filteredList, sortBy, sortOrder, warehouseMap]);

  const totalElements = backendPage?.totalElements ?? apiResponse?.data?.totalElements ?? filteredList.length;
  const totalPages = backendPage?.totalPages ?? apiResponse?.data?.totalPages ?? Math.max(1, Math.ceil(totalElements / pageSize));

  const handleConfirm = async (grn) => {
    const confirmed = await confirmDialog({
      title: 'Confirm Goods Receipt?',
      message: `Are you sure you want to confirm GRN ${grn.grnNumber}? This will trigger inventory stock-in and update received quantities.`,
      confirmLabel: 'Confirm GRN',
      isDestructive: false
    });
    if (!confirmed) return;

    try {
      await confirmGrn({ id: grn.id, companyId }).unwrap();
      dispatch(addAlert({ type: 'success', message: `GRN ${grn.grnNumber} confirmed and stock-in scheduled!` }));
      refetch();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.data?.message || err?.message || 'Failed to confirm GRN' }));
    }
  };

  const handleOpenReverse = (grn) => {
    setGrnToReverse(grn);
    setReversalReason('');
    setIsReverseModalOpen(true);
  };

  const handleReverseSubmit = async () => {
    if (!grnToReverse) return;
    try {
      await reverseGrn({ id: grnToReverse.id, reason: reversalReason || 'Goods receipt reversed', companyId }).unwrap();
      dispatch(addAlert({ type: 'success', message: `GRN ${grnToReverse.grnNumber} reversed successfully! PO quantities restored.` }));
      setIsReverseModalOpen(false);
      refetch();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.data?.message || err?.message || 'Failed to reverse GRN' }));
    }
  };

  const handleCreateInvoiceDirect = async (grn) => {
    if (creatingInvoiceId) return;
    setCreatingInvoiceId(grn.id);
    try {
      const response = await api.post(`/api/account/invoices/from-grn/${grn.id}`);
      dispatch(addAlert({ type: 'success', message: 'Invoice created successfully.' }));
      refetch();
      const newInvoiceId = response?.data?.id || response?.data?.invoiceId;
      const basePath = location.pathname.includes('/accounts/transactions') 
        ? '/accounts/transactions/purchase-invoices' 
        : '/purchases/invoices';
      if (newInvoiceId) {
        navigate(buildPath(`${basePath}/${newInvoiceId}`));
      } else {
        navigate(buildPath(basePath));
      }
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || err?.message || 'Failed to create invoice' }));
    } finally {
      setCreatingInvoiceId(null);
    }
  };

  const getGrnActions = (grn) => {
    const actions = [];
    const hasInvoice = grn.hasInvoice || grn.invoiceId || grn.purchaseInvoiceId;

    actions.push({
      tooltip: 'View Details',
      icon: <Eye size={16} />,
      onClick: () => setSelectedGrn(grn)
    });

    if (!hasInvoice) {
      actions.push({
        tooltip: 'Create Invoice',
        icon: creatingInvoiceId === grn.id ? <RefreshCw size={16} className="animate-spin" /> : <Receipt size={16} />,
        disabled: creatingInvoiceId === grn.id,
        onClick: () => handleCreateInvoiceDirect(grn)
      });
    }

    if (grn.status === 'DRAFT') {
      actions.push({
        tooltip: 'Confirm GRN',
        icon: <CheckCircle size={16} className="text-emerald-600" />,
        disabled: isConfirming,
        onClick: () => handleConfirm(grn)
      });
    }

    if (grn.status === 'CONFIRMED') {
      actions.push({
        tooltip: 'Reverse GRN',
        icon: <RotateCcw size={16} className="text-amber-600" />,
        disabled: isReversing,
        onClick: () => handleOpenReverse(grn)
      });
    }

    return actions;
  };

  const columns = useMemo(() => [
    {
      id: 'grnNumber',
      header: 'GRN NUMBER',
      accessor: 'grnNumber',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Truck size={15} className="text-zinc-400 shrink-0" />
          <span
            onClick={(e) => {
              e.stopPropagation();
              setSelectedGrn(row);
            }}
            className="font-mono text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            {row.grnNumber || '—'}
          </span>
          {row.audit && <AuditLogHover audit={row.audit} />}
        </div>
      )
    },
    {
      id: 'grnDate',
      header: 'GRN DATE',
      accessor: 'grnDate',
      sortable: true,
      cell: (row) => (
        <span className="text-xs text-zinc-600">{formatDate(row.grnDate)}</span>
      )
    },
    {
      id: 'poNumber',
      header: 'PO NUMBER',
      accessor: 'poNumber',
      sortable: true,
      cell: (row) => {
        const poId = row.purchaseOrderId || row.purchaseOrder?.id;
        const poNum = row.purchaseOrder?.poNumber || row.poNumber;
        if (!poNum) return <span className="text-zinc-400">—</span>;
        if (poId) {
          return (
            <span
              onClick={(e) => {
                e.stopPropagation();
                navigate(buildPath(`${getPoBasePath(location.pathname)}/${poId}`));
              }}
              className="font-mono text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              {poNum}
            </span>
          );
        }
        return <span className="font-mono text-xs font-semibold text-zinc-700">{poNum}</span>;
      }
    },
    {
      id: 'vendor',
      header: 'VENDOR',
      accessor: 'vendor',
      sortable: true,
      cell: (row) => (
        <span className="text-xs font-medium text-zinc-900">
          {row.vendor?.vendorName || row.vendorName || '—'}
        </span>
      )
    },
    {
      id: 'warehouse',
      header: 'WAREHOUSE',
      accessor: 'warehouse',
      sortable: true,
      cell: (row) => (
        <span className="text-xs text-zinc-700">
          {row.warehouseName || row.warehouse?.warehouseName || row.warehouse?.name || (row.warehouseId ? warehouseMap[row.warehouseId] : null) || '—'}
        </span>
      )
    },
    {
      id: 'status',
      header: 'STATUS',
      accessor: 'status',
      sortable: true,
      headerClassName: 'text-center',
      cell: (row) => (
        <div className="text-center">
          <StatusBadge status={row.status} />
        </div>
      )
    },
    {
      id: 'itemsCount',
      header: 'ITEMS COUNT',
      accessor: 'itemsCount',
      sortable: true,
      headerClassName: 'text-center',
      cell: (row) => {
        const count = Array.isArray(row.items) ? row.items.length : (row.itemsCount ?? row.itemCount ?? 0);
        return (
          <div className="text-center font-mono text-xs font-medium text-zinc-700">
            {count} {count === 1 ? 'item' : 'items'}
          </div>
        );
      }
    }
  ], [navigate, location.pathname, buildPath, warehouseMap]);

  const basicFilters = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      value: filters.status || '',
      onChange: (val) => setFilter('status', val),
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'DRAFT', label: 'Draft' },
        { value: 'CONFIRMED', label: 'Confirmed' },
        { value: 'VERIFIED', label: 'Verified' },
        { value: 'POSTED', label: 'Posted' },
        { value: 'REVERSED', label: 'Reversed' },
        { value: 'CANCELLED', label: 'Cancelled' },
      ]
    },
    {
      id: 'grnDateFrom',
      label: 'Date From',
      type: 'date',
      value: filters.grnDateFrom || '',
      onChange: (val) => setFilter('grnDateFrom', val)
    },
    {
      id: 'grnDateTo',
      label: 'Date To',
      type: 'date',
      value: filters.grnDateTo || '',
      onChange: (val) => setFilter('grnDateTo', val)
    }
  ], [filters.status, filters.grnDateFrom, filters.grnDateTo, setFilter]);

  const advancedFilters = useMemo(() => [
    {
      id: 'deliveryNote',
      label: 'Delivery Note Number',
      type: 'text',
      placeholder: 'e.g. DN-1002',
      value: filters.deliveryNote || '',
      onChange: (val) => setFilter('deliveryNote', val)
    },
    {
      id: 'transporter',
      label: 'Transporter / Vehicle',
      type: 'text',
      placeholder: 'e.g. BlueDart or MH-12',
      value: filters.transporter || '',
      onChange: (val) => setFilter('transporter', val)
    },
    {
      id: 'grnDateFrom',
      label: 'GRN Date From',
      type: 'date',
      value: filters.grnDateFrom || '',
      onChange: (val) => setFilter('grnDateFrom', val)
    },
    {
      id: 'grnDateTo',
      label: 'GRN Date To',
      type: 'date',
      value: filters.grnDateTo || '',
      onChange: (val) => setFilter('grnDateTo', val)
    }
  ], [filters, setFilter]);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/50">
      <PageHeader
        title="Goods Receipts"
        description="Manage inbound warehouse deliveries, physical receipts, and 3-way matching"
        icon={Truck}
        actions={
          <button
            type="button"
            onClick={() => navigate(buildPath('/accounts/transactions/purchase-orders'))}
            className="btn-primary flex items-center gap-2"
            title="Create Goods Receipt from an Approved Purchase Order"
          >
            <Plus size={16} />
            <span>New Goods Receipt</span>
          </button>
        }
      />

      <ModuleTabs tabs={purchaseTabs} />

      <div className="p-6">
        <DataTable
          data={sortedList}
          columns={columns}
          keyField="id"
          loading={isLoading}
          searchable
          searchPlaceholder="Search GRN number, vendor, PO..."
          searchValue={searchTerm || ''}
          onSearchChange={setSearchTerm}
          filters={basicFilters}
          filterValues={filters}
          onFilterChange={setFilter}
          onReset={handleReset}
          advancedFilters={advancedFilters}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleColumnSort}
          pagination={{
            currentPage: page,
            totalPages,
            totalElements,
            pageSize,
            onPageChange: setPage,
            onPageSizeChange: setPageSize
          }}
          columnVisibility
          selectable
          selectedRows={selectedGrns}
          onSelectionChange={setSelectedGrns}
          bulkActions={[
            {
              key: 'export',
              label: 'Export Selected',
              icon: <Download size={14} />,
              onClick: () => setIsExportModalOpen(true)
            }
          ]}
          exportable
          onExport={() => setIsExportModalOpen(true)}
          refreshable
          onRefresh={refetch}
          getRowActions={getGrnActions}
          expandedRowId={expandedRowId}
          onToggleExpand={(id) => setExpandedRowId(expandedRowId === id ? null : id)}
          renderExpandedRow={(grn) => (
            <GoodsReceiptOverview
              grn={grn}
              warehouseMap={warehouseMap}
              navigate={navigate}
              location={location}
              buildPath={buildPath}
              setSelectedGrn={setSelectedGrn}
            />
          )}
          emptyState={{
            icon: Truck,
            title: 'No Goods Receipts found',
            description: 'Try adjusting your filters or create a new Goods Receipt from an approved Purchase Order.',
            action: {
              label: 'View Purchase Orders',
              icon: ArrowRight,
              onClick: () => navigate(buildPath('/accounts/transactions/purchase-orders'))
            }
          }}
        />
      </div>

      {/* VIEW DETAILS MODAL */}
      {selectedGrn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-5 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
              <div>
                <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <Truck size={18} className="text-zinc-700" />
                  GRN Details: <span className="font-mono">{selectedGrn.grnNumber}</span>
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  PO: <span className="font-mono font-semibold text-zinc-700">{selectedGrn.purchaseOrder?.poNumber || selectedGrn.poNumber || '—'}</span> | Status: <StatusBadge status={selectedGrn.status} />
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGrn(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 flex-1 pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/80">
                <div>
                  <span className="font-semibold text-zinc-500 block text-[10px] uppercase">GRN Date</span>
                  <span className="font-medium text-zinc-800">{formatDate(selectedGrn.grnDate)}</span>
                </div>
                <div>
                  <span className="font-semibold text-zinc-500 block text-[10px] uppercase">Vendor</span>
                  <span className="font-medium text-zinc-800">{selectedGrn.vendor?.vendorName || selectedGrn.vendorName || '—'}</span>
                </div>
                <div>
                  <span className="font-semibold text-zinc-500 block text-[10px] uppercase">Warehouse</span>
                  <span className="font-medium text-zinc-800">{selectedGrn.warehouseName || selectedGrn.warehouse?.warehouseName || (selectedGrn.warehouseId ? warehouseMap[selectedGrn.warehouseId] : null) || '—'}</span>
                </div>
                <div>
                  <span className="font-semibold text-zinc-500 block text-[10px] uppercase">Delivery Note</span>
                  <span className="font-mono text-zinc-800">{selectedGrn.deliveryNoteNumber || '—'}</span>
                </div>
                <div>
                  <span className="font-semibold text-zinc-500 block text-[10px] uppercase">Vehicle #</span>
                  <span className="font-mono text-zinc-800">{selectedGrn.vehicleNumber || '—'}</span>
                </div>
                <div>
                  <span className="font-semibold text-zinc-500 block text-[10px] uppercase">Transporter</span>
                  <span className="font-medium text-zinc-800">{selectedGrn.transporterName || '—'}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Package size={14} className="text-zinc-500" />
                  Receipt Items
                </h4>
                <div className="border border-zinc-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-zinc-100/80 border-b border-zinc-200 text-zinc-600 font-semibold">
                        <th className="p-2.5 text-left">Item</th>
                        <th className="p-2.5 text-right">Received</th>
                        <th className="p-2.5 text-right">Accepted</th>
                        <th className="p-2.5 text-right">Rejected</th>
                        <th className="p-2.5 text-right">Unit Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {(selectedGrn.items || []).map((it, i) => (
                        <tr key={i} className="hover:bg-zinc-50/50">
                          <td className="p-2.5">
                            <div className="font-medium text-zinc-800">{it.itemName || it.itemCode || `Item ${i + 1}`}</div>
                            {it.itemCode && <div className="text-[10px] text-zinc-400 font-mono">{it.itemCode}</div>}
                          </td>
                          <td className="p-2.5 text-right font-semibold text-zinc-800">{it.receivedQuantity} {it.unit || ''}</td>
                          <td className="p-2.5 text-right text-emerald-600 font-semibold">{it.acceptedQuantity}</td>
                          <td className="p-2.5 text-right text-rose-600 font-semibold">{it.rejectedQuantity || 0}</td>
                          <td className="p-2.5 text-right font-mono text-zinc-700">₹{Number(it.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                      {(!selectedGrn.items || selectedGrn.items.length === 0) && (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-zinc-400 italic">No receipt items found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedGrn.remarks && (
                <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-xs">
                  <span className="font-semibold text-zinc-500 block mb-1">Remarks:</span>
                  <p className="text-zinc-700">{selectedGrn.remarks}</p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-zinc-200">
              <div className="flex items-center gap-2">
                {selectedGrn.status === 'DRAFT' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleConfirm(selectedGrn);
                      setSelectedGrn(null);
                    }}
                    disabled={isConfirming}
                    className="btn-primary text-xs flex items-center gap-1.5"
                  >
                    <CheckCircle size={14} /> Confirm GRN
                  </button>
                )}
                {selectedGrn.status === 'CONFIRMED' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleCreateInvoiceDirect(selectedGrn);
                      setSelectedGrn(null);
                    }}
                    disabled={creatingInvoiceId === selectedGrn.id || selectedGrn.hasInvoice || selectedGrn.invoiceId || selectedGrn.purchaseInvoiceId}
                    className="btn-primary text-xs flex items-center gap-1.5"
                  >
                    <Receipt size={14} /> Create Invoice
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedGrn(null)}
                className="btn-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVERSAL MODAL */}
      {isReverseModalOpen && grnToReverse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle size={22} />
              <h3 className="font-bold text-base text-zinc-900">Reverse Goods Receipt</h3>
            </div>
            <p className="text-xs text-zinc-600">
              Reversing GRN <strong className="font-mono">{grnToReverse.grnNumber}</strong> will restore received/pending quantities on PO <strong className="font-mono">{grnToReverse.purchaseOrder?.poNumber || grnToReverse.poNumber || '—'}</strong> and schedule reverse inventory stock-out.
            </p>
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Reason for Reversal *</label>
              <textarea
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-800 placeholder-zinc-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all resize-none h-20"
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="e.g. Wrong delivery batch, quality inspection rejection, damaged in transit..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => setIsReverseModalOpen(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReverseSubmit}
                disabled={isReversing || !reversalReason.trim()}
                className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {isReversing ? 'Reversing...' : 'Confirm Reversal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {isExportModalOpen && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          reportName="goods-receipts"
          defaultFilters={queryFilters}
          selectedIds={selectedGrns}
          selectedCount={selectedGrns.length}
        />
      )}
    </div>
  );
}
