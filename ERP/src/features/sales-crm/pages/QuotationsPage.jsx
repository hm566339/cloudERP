import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  ExternalLink,
  Printer,
  Send,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import ConfirmModal from '../../../components/common/ConfirmModal';
import useUrlFilters from '../../../hooks/useUrlFilters';
import {
  useGetCrmQuotationsQuery,
  useConvertQuotationToOrderMutation,
  useGetCrmAccountsQuery,
} from '../../../api/sales-crm/crm.api';
import QuotationFormModal from '../components/QuotationFormModal';
import QuotationApprovalModal from '../components/QuotationApprovalModal';
import QuotationPrintModal from '../components/QuotationPrintModal';

const DEFAULT_COLUMNS = [
  'quotationNumber',
  'accountName',
  'totalAmount',
  'taxAmount',
  'status',
];

export default function QuotationsPage() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const crmBase = companyId ? `/company/${companyId}/sales-crm` : '/sales-crm';

  const [selectedRows, setSelectedRows] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [approvingQuote, setApprovingQuote] = useState(null);
  const [printingQuote, setPrintingQuote] = useState(null);
  const [convertingQuote, setConvertingQuote] = useState(null);

  const {
    page, setPage, setPageSize, apiParams,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10 });

  const { data: quotesRes, isLoading, refetch, isFetching } = useGetCrmQuotationsQuery({
    companyId,
    search: filters.searchKey || undefined,
    status: filters.status || undefined,
    page: page ? page - 1 : 0,
    size: apiParams.size || 10,
  });

  const { data: accountsRes } = useGetCrmAccountsQuery({ companyId, page: 0, size: 100 });
  const accounts = accountsRes?.data?.content || accountsRes?.data || [];

  const [convertToOrder, { isLoading: isConverting }] = useConvertQuotationToOrderMutation();

  const quotations = quotesRes?.data?.content || quotesRes?.data || [];
  const totalElements = quotesRes?.data?.totalElements || quotations.length;
  const totalPages = quotesRes?.data?.totalPages || Math.ceil(totalElements / (apiParams.size || 10)) || 1;

  const handleConvertOrderConfirm = async () => {
    if (!convertingQuote) return;
    try {
      await convertToOrder({ id: convertingQuote.id, companyId }).unwrap();
      setConvertingQuote(null);
      refetch();
    } catch (err) {
      console.error('Failed to convert quotation to sales order', err);
    }
  };

  const basicFilters = useMemo(() => [
    {
      key: 'status',
      label: 'STATUS',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
        { label: 'Approved', value: 'APPROVED' },
        { label: 'Converted to Order', value: 'CONVERTED_TO_ORDER' },
        { label: 'Rejected', value: 'REJECTED' },
      ],
    },
  ], []);

  const columns = useMemo(() => [
    {
      id: 'quotationNumber',
      label: 'Quote # & Title',
      sortable: true,
      render: (val, q) => {
        return (
          <div className="space-y-0.5">
            <button
              onClick={() => navigate(`${crmBase}/quotations/${q?.id}`)}
              className="font-semibold text-zinc-900 dark:text-white hover:text-primary text-xs text-left block transition-colors"
            >
              {q?.quotationNumber || val || 'Draft Quote'}
            </button>
            <span className="text-[11px] text-zinc-500 block truncate max-w-xs">{q?.title || 'Standard Commercial Supply'}</span>
          </div>
        );
      },
    },
    {
      id: 'accountName',
      label: 'Client Account',
      sortable: true,
      render: (val, q) => (
        <span className="text-xs font-medium text-zinc-800 dark:text-[#E6E8EE]">
          {q?.accountName || val || 'Direct Customer'}
        </span>
      ),
    },
    {
      id: 'totalAmount',
      label: 'Total Value (₹)',
      sortable: true,
      render: (val, q) => (
        <div className="space-y-0.5 text-xs">
          <span className="font-mono font-bold text-primary block">
            ₹{Number(q?.totalAmount ?? val ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-zinc-400 font-mono">
            Taxes: ₹{Number(q?.taxAmount ?? 0).toLocaleString('en-IN')}
          </span>
        </div>
      ),
    },
    {
      id: 'taxAmount',
      label: 'Tax Amount',
      render: (val, q) => (
        <span className="text-xs font-mono text-zinc-500">
          ₹{Number(q?.taxAmount ?? val ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      render: (val, q) => {
        const s = q?.status || (typeof val === 'string' ? val : 'DRAFT');
        let statusType = 'neutral';
        if (s === 'APPROVED') statusType = 'success';
        else if (s === 'PENDING_APPROVAL') statusType = 'warning';
        else if (s === 'CONVERTED_TO_ORDER') statusType = 'primary';
        else if (s === 'REJECTED') statusType = 'danger';

        return (
          <DataTableStatusBadge
            status={s.replace(/_/g, ' ')}
            variant={statusType}
          />
        );
      },
    },
  ], [crmBase, navigate]);

  const rowActions = useMemo(() => [
    {
      key: 'submit',
      label: 'Submit for Approval',
      icon: Send,
      tooltip: 'Submit',
      hidden: (row) => row.status !== 'DRAFT' && row.status !== 'REJECTED',
      className: 'hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20',
      onClick: (row) => setApprovingQuote(row),
    },
    {
      key: 'convert',
      label: 'Convert to Order',
      icon: ArrowRightLeft,
      tooltip: 'Convert PO',
      hidden: (row) => row.status !== 'APPROVED',
      className: 'hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20',
      onClick: (row) => setConvertingQuote(row),
    },
    {
      key: 'print',
      label: 'Print',
      icon: Printer,
      tooltip: 'Print Quotation',
      onClick: (row) => setPrintingQuote(row),
    },
    {
      key: 'view',
      label: 'View Dossier',
      icon: ExternalLink,
      tooltip: 'View Details',
      onClick: (row) => navigate(`${crmBase}/quotations/${row.id}`),
    },
  ], [crmBase, navigate]);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <PageHeader
        title="Commercial Quotations"
        description="Managing quotations, GST tax computations, and workflow approvals"
      >
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-primary-500/20 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Quotation</span>
        </button>
      </PageHeader>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          permissionFeature="CRM"
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={quotations}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}

          // Search
          searchable
          searchValue={filters.searchKey || ''}
          searchPlaceholder="Search quotation number, title..."
          onSearchChange={(val) => setFilter('searchKey', val)}

          // Filters
          filters={basicFilters}
          filterValues={filters}
          onFilterChange={setFilter}

          // Reset & Refresh
          onReset={resetFilters}
          onRefresh={refetch}

          // Column Visibility
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={setVisibleColumns}

          // Sorting
          sort={{ key: sortBy, direction: sortOrder }}
          onSortChange={({ key }) => handleColumnSort(key)}

          // Row Actions
          rowActions={rowActions}

          // Pagination
          pagination={{
            page,
            pageSize: apiParams.size || 10,
            totalPages,
            totalElements,
          }}
          pageIndexBase={1}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="quotations"

          // Empty State
          emptyMessage="No quotations found"
          emptyDescription="Try adjusting your search query or status filter to find quotations."
        />
      </div>

      {/* Modals */}
      <QuotationFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        companyId={companyId}
        accounts={accounts}
        onSuccess={() => refetch()}
      />

      <QuotationApprovalModal
        isOpen={!!approvingQuote}
        onClose={() => setApprovingQuote(null)}
        quotation={approvingQuote}
        companyId={companyId}
        onSuccess={() => refetch()}
      />

      <QuotationPrintModal
        isOpen={!!printingQuote}
        onClose={() => setPrintingQuote(null)}
        quotation={printingQuote}
      />

      <ConfirmModal
        isOpen={!!convertingQuote}
        onClose={() => setConvertingQuote(null)}
        onConfirm={handleConvertOrderConfirm}
        title="Convert Quotation to Sales Order"
        message={`Convert quote "${convertingQuote?.quotationNumber || convertingQuote?.title}" into an official Sales Order? This will reserve inventory allocations and generate downstream invoice schedules.`}
        confirmText={isConverting ? 'Converting...' : 'Convert to Order'}
        variant="primary"
      />
    </div>
  );
}


