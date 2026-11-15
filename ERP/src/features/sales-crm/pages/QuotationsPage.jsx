import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  ExternalLink,
  Printer,
  Send,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PageHeader, ConfirmModal, StatusBadge } from '../../../components/common';
import DataTable from '../../../components/data-table/DataTable';
import {
  useGetCrmQuotationsQuery,
  useConvertQuotationToOrderMutation,
  useGetCrmAccountsQuery,
} from '../../../api/sales-crm/crm.api';
import QuotationFormModal from '../components/QuotationFormModal';
import QuotationApprovalModal from '../components/QuotationApprovalModal';
import QuotationPrintModal from '../components/QuotationPrintModal';

export default function QuotationsPage() {
  const { companyId } = useParams();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(0);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [approvingQuote, setApprovingQuote] = useState(null);
  const [printingQuote, setPrintingQuote] = useState(null);
  const [convertingQuote, setConvertingQuote] = useState(null);

  const { data: quotesRes, isLoading, refetch } = useGetCrmQuotationsQuery({
    companyId,
    search: searchTerm || undefined,
    status: selectedStatus || undefined,
    page,
    size: 15,
  });

  const { data: accountsRes } = useGetCrmAccountsQuery({ companyId, page: 0, size: 100 });
  const accounts = accountsRes?.data?.content || accountsRes?.data || [];

  const [convertToOrder, { isLoading: isConverting }] = useConvertQuotationToOrderMutation();

  const quotations = quotesRes?.data?.content || quotesRes?.data || [];
  const totalElements = quotesRes?.data?.totalElements || quotations.length;

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

  const columns = [
    {
      header: 'Quote # & Title',
      accessorKey: 'quotationNumber',
      cell: ({ row }) => {
        const q = row.original;
        return (
          <div className="space-y-0.5">
            <button
              onClick={() => navigate(`/sales-crm/quotations/${q.id}`)}
              className="font-semibold text-zinc-900 dark:text-white hover:text-primary text-xs text-left block transition-colors"
            >
              {q.quotationNumber || 'Draft Quote'}
            </button>
            <span className="text-[11px] text-zinc-500 block truncate max-w-xs">{q.title || 'Standard Commercial Supply'}</span>
          </div>
        );
      },
    },
    {
      header: 'Client Account',
      accessorKey: 'accountName',
      cell: ({ row }) => (
        <span className="text-xs font-medium text-zinc-800 dark:text-[#E6E8EE]">
          {row.original.accountName || 'Direct Customer'}
        </span>
      ),
    },
    {
      header: 'Total Value (₹)',
      accessorKey: 'totalAmount',
      cell: ({ row }) => (
        <div className="space-y-0.5 text-xs">
          <span className="font-mono font-bold text-primary block">
            ₹{(row.original.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-zinc-400 font-mono">
            Taxes: ₹{(row.original.taxAmount || 0).toLocaleString('en-IN')}
          </span>
        </div>
      ),
    },
    {
      header: 'Approval Status',
      accessorKey: 'status',
      cell: ({ row }) => {
        const s = row.original.status || 'DRAFT';
        let color = 'bg-zinc-100 text-zinc-600';
        if (s === 'APPROVED') color = 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
        else if (s === 'PENDING_APPROVAL') color = 'bg-amber-500/10 text-amber-600 border border-amber-500/20';
        else if (s === 'CONVERTED_TO_ORDER') color = 'bg-purple-500/10 text-purple-600 border border-purple-500/20';
        else if (s === 'REJECTED') color = 'bg-rose-500/10 text-rose-600 border border-rose-500/20';

        return (
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${color}`}>
            {s.replace(/_/g, ' ')}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => {
        const q = row.original;
        const canSubmit = q.status === 'DRAFT' || q.status === 'REJECTED';
        const canConvert = q.status === 'APPROVED';

        return (
          <div className="flex items-center gap-1.5 justify-end">
            {canSubmit && (
              <button
                onClick={() => setApprovingQuote(q)}
                className="px-2 py-1 text-[11px] font-semibold rounded bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 flex items-center gap-1"
                title="Submit for Approval"
              >
                <Send size={11} /> Submit
              </button>
            )}

            {canConvert && (
              <button
                onClick={() => setConvertingQuote(q)}
                className="px-2 py-1 text-[11px] font-semibold rounded bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 flex items-center gap-1"
                title="Convert to Sales Order"
              >
                <ArrowRightLeft size={11} /> Convert PO
              </button>
            )}

            <button
              onClick={() => setPrintingQuote(q)}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded"
              title="Print Quotation"
            >
              <Printer size={13} />
            </button>

            <button
              onClick={() => navigate(`/sales-crm/quotations/${q.id}`)}
              className="p-1.5 text-zinc-500 hover:text-primary rounded"
              title="View Details"
            >
              <ExternalLink size={13} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Commercial Quotations"
        subtitle={`Managing ${totalElements} quotes, GST tax computations, and workflow approvals.`}
        actions={
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5"
          >
            <Plus size={14} /> Create Quotation
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search quotation number, title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1C202B] text-zinc-900 dark:text-white"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1C202B] text-zinc-800 dark:text-[#E6E8EE]"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
          <option value="APPROVED">Approved</option>
          <option value="CONVERTED_TO_ORDER">Converted to Order</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <DataTable
        data={quotations}
        columns={columns}
        isLoading={isLoading}
        enablePagination={true}
      />

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

