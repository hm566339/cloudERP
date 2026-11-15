import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Upload,
  Download,
  Filter,
  Search,
  MoreVertical,
  UserCheck,
  ArrowRightLeft,
  Trash2,
  Edit2,
  ExternalLink,
  Flame,
  Phone,
  Mail,
  Building2
} from 'lucide-react';
import { PageHeader, ConfirmModal, StatusBadge } from '../../../components/common';
import DataTable from '../../../components/data-table/DataTable';
import {
  useGetLeadsQuery,
  useDeleteLeadMutation,
  useGetCrmLeadSourcesQuery,
  useGetCrmLeadStatusesQuery,
} from '../../../api/sales-crm/crm.api';
import LeadFormModal from '../components/LeadFormModal';
import LeadConvertModal from '../components/LeadConvertModal';
import LeadAssignModal from '../components/LeadAssignModal';
import LeadImportModal from '../components/LeadImportModal';

export default function LeadsPage() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const crmBase = companyId ? `/company/${companyId}/sales-crm` : '/sales-crm';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [page, setPage] = useState(0);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [convertingLead, setConvertingLead] = useState(null);
  const [assigningLead, setAssigningLead] = useState(null);
  const [deletingLead, setDeletingLead] = useState(null);

  // API hooks
  const { data: leadsRes, isLoading, refetch } = useGetLeadsQuery({
    companyId,
    search: searchTerm || undefined,
    statusId: selectedStatus || undefined,
    rating: selectedRating || undefined,
    page,
    size: 15,
  });

  const { data: sourcesRes } = useGetCrmLeadSourcesQuery(companyId);
  const { data: statusesRes } = useGetCrmLeadStatusesQuery(companyId);

  const [deleteLead, { isLoading: isDeleting }] = useDeleteLeadMutation();

  const leads = leadsRes?.data?.content || leadsRes?.data || [];
  const totalElements = leadsRes?.data?.totalElements || leads.length;
  const sources = sourcesRes?.data || [];
  const statuses = statusesRes?.data || [];

  const handleDeleteConfirm = async () => {
    if (!deletingLead) return;
    try {
      await deleteLead({ id: deletingLead.id, companyId }).unwrap();
      setDeletingLead(null);
      refetch();
    } catch (err) {
      console.error('Delete lead failed', err);
    }
  };

  const exportLeadsCsv = () => {
    if (leads.length === 0) return;
    const headers = ['Name', 'Company', 'Phone', 'Email', 'Source', 'Score', 'Status'];
    const rows = leads.map((l) => [
      `"${l.displayName || `${l.firstName || ''} ${l.lastName || ''}`.trim()}"`,
      `"${l.organizationName || ''}"`,
      `"${l.normalizedPhone || l.phone || ''}"`,
      `"${l.email || ''}"`,
      `"${l.leadSource?.sourceName || ''}"`,
      l.leadScore || 50,
      `"${l.leadStatus?.statusName || 'NEW'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      header: 'Lead Name & Company',
      accessorKey: 'displayName',
      cell: ({ row }) => {
        const lead = row.original;
        const name = lead.displayName || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'New Lead';
        return (
          <div className="space-y-0.5">
            <button
              onClick={() => navigate(`${crmBase}/leads/${lead.id}`)}
              className="font-semibold text-zinc-900 dark:text-white hover:text-primary text-left text-xs block transition-colors"
            >
              {name}
            </button>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
              <Building2 size={11} />
              <span>{lead.organizationName || 'Individual Contact'}</span>
              {lead.state && <span className="text-[10px] bg-zinc-100 dark:bg-[#1C202B] px-1 rounded">({lead.state})</span>}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Communication',
      accessorKey: 'phone',
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <div className="space-y-1 text-xs">
            {(lead.normalizedPhone || lead.phone) && (
              <div className="flex items-center gap-1.5 font-mono text-zinc-700 dark:text-[#A0A6B5]">
                <Phone size={11} className="text-zinc-400" />
                <span>{lead.normalizedPhone || lead.phone}</span>
              </div>
            )}
            {lead.email && (
              <div className="flex items-center gap-1.5 text-zinc-500 text-[11px]">
                <Mail size={11} className="text-zinc-400" />
                <span className="truncate max-w-[150px]">{lead.email}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: 'Lead Score',
      accessorKey: 'leadScore',
      cell: ({ row }) => {
        const score = row.original.leadScore || 50;
        let badgeColor = 'bg-zinc-100 dark:bg-[#1C202B] text-zinc-600';
        let label = 'Cold';
        if (score >= 75) {
          badgeColor = 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
          label = 'Hot';
        } else if (score >= 45) {
          badgeColor = 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
          label = 'Warm';
        }
        return (
          <div className="flex items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${badgeColor}`}>
              {score}
            </span>
            <span className="text-[11px] font-medium text-zinc-500">{label}</span>
          </div>
        );
      },
    },
    {
      header: 'Source',
      accessorKey: 'leadSource',
      cell: ({ row }) => (
        <span className="text-xs text-zinc-700 dark:text-[#A0A6B5]">
          {row.original.leadSource?.sourceName || row.original.utmSource || 'Direct'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'leadStatus',
      cell: ({ row }) => (
        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-primary/10 text-primary dark:text-primary-light">
          {row.original.leadStatus?.statusName || 'NEW'}
        </span>
      ),
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <div className="flex items-center gap-1.5 justify-end">
            <button
              onClick={() => setAssigningLead(lead)}
              className="p-1.5 text-zinc-500 hover:text-primary hover:bg-zinc-100 dark:hover:bg-[#1C202B] rounded transition-colors"
              title="Assign Lead"
            >
              <UserCheck size={14} />
            </button>
            <button
              onClick={() => setConvertingLead(lead)}
              className="p-1.5 text-zinc-500 hover:text-emerald-500 hover:bg-zinc-100 dark:hover:bg-[#1C202B] rounded transition-colors"
              title="Convert to Account & Deal"
            >
              <ArrowRightLeft size={14} />
            </button>
            <button
              onClick={() => setEditingLead(lead)}
              className="p-1.5 text-zinc-500 hover:text-blue-500 hover:bg-zinc-100 dark:hover:bg-[#1C202B] rounded transition-colors"
              title="Edit Lead"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => setDeletingLead(lead)}
              className="p-1.5 text-zinc-500 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-[#1C202B] rounded transition-colors"
              title="Delete Lead"
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Lead Management"
        subtitle={`Tracking, scoring and converting ${totalElements} commercial leads.`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={exportLeadsCsv}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <Download size={13} /> Export
            </button>
            <button
              onClick={() => setIsImportOpen(true)}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <Upload size={13} /> Import CSV
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5"
            >
              <Plus size={14} /> Add Lead
            </button>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name, phone, GSTIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1C202B] text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1C202B] text-zinc-800 dark:text-[#E6E8EE]"
          >
            <option value="">All Statuses</option>
            {statuses.map((st) => (
              <option key={st.id} value={st.id}>
                {st.statusName}
              </option>
            ))}
          </select>

          <select
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1C202B] text-zinc-800 dark:text-[#E6E8EE]"
          >
            <option value="">All Scores</option>
            <option value="HOT">Hot Leads (&ge; 75)</option>
            <option value="WARM">Warm Leads (45 - 74)</option>
            <option value="COLD">Cold Leads (&lt; 45)</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        data={leads}
        columns={columns}
        isLoading={isLoading}
        enablePagination={true}
      />

      {/* Modals */}
      <LeadFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        companyId={companyId}
        sources={sources}
        statuses={statuses}
        onSuccess={() => refetch()}
      />

      <LeadFormModal
        isOpen={!!editingLead}
        onClose={() => setEditingLead(null)}
        initialData={editingLead}
        companyId={companyId}
        sources={sources}
        statuses={statuses}
        onSuccess={() => refetch()}
      />

      <LeadConvertModal
        isOpen={!!convertingLead}
        onClose={() => setConvertingLead(null)}
        lead={convertingLead}
        companyId={companyId}
        onSuccess={() => refetch()}
      />

      <LeadAssignModal
        isOpen={!!assigningLead}
        onClose={() => setAssigningLead(null)}
        lead={assigningLead}
        companyId={companyId}
        onSuccess={() => refetch()}
      />

      <LeadImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        companyId={companyId}
        onSuccess={() => refetch()}
      />

      <ConfirmModal
        isOpen={!!deletingLead}
        onClose={() => setDeletingLead(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Lead Record"
        message={`Are you sure you want to delete lead "${deletingLead?.displayName || 'this lead'}"? This action will mark the lead as deleted.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Lead'}
        variant="danger"
      />
    </div>
  );
}

