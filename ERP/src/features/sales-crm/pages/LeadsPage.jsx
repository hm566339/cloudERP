import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Upload,
  Download,
  Filter,
  Search,
  UserCheck,
  ArrowRightLeft,
  Trash2,
  Edit2,
  Eye,
  ExternalLink,
  Flame,
  Phone,
  Mail,
  Building2
} from 'lucide-react';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/data-table';
import useUrlFilters from '../../../hooks/useUrlFilters';
import ConfirmModal from '../../../components/common/ConfirmModal';
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
import useCrmPermissions from '../hooks/useCrmPermissions';

const DEFAULT_SOURCES = [
  { id: '1', sourceName: 'Direct / Inbound' },
  { id: '2', sourceName: 'Company Website' },
  { id: '3', sourceName: 'IndiaMART Marketplace' },
  { id: '4', sourceName: 'TradeIndia Marketplace' },
  { id: '5', sourceName: 'JustDial Portal' },
  { id: '6', sourceName: 'Facebook / Instagram Ads' },
  { id: '7', sourceName: 'Google Ads' },
  { id: '8', sourceName: 'Cold Outreach' },
  { id: '9', sourceName: 'Customer Referral' },
];

const DEFAULT_STATUSES = [
  { id: '1', statusName: 'New / Open' },
  { id: '2', statusName: 'Contacted' },
  { id: '3', statusName: 'Qualified' },
  { id: '4', statusName: 'Proposal Sent' },
  { id: '5', statusName: 'In Negotiation' },
  { id: '6', statusName: 'Unqualified' },
  { id: '7', statusName: 'Converted to Deal' },
  { id: '8', statusName: 'Lost Lead' },
];

const DEFAULT_COLUMNS = [
  'displayName',
  'contact',
  'leadScore',
  'leadSource',
  'leadStatus'
];

export default function LeadsPage() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const crmBase = companyId ? `/company/${companyId}/sales-crm` : '/sales-crm';

  const [selectedRows, setSelectedRows] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [convertingLead, setConvertingLead] = useState(null);
  const [assigningLead, setAssigningLead] = useState(null);
  const [deletingLead, setDeletingLead] = useState(null);

  const {
    page, setPage, setPageSize, apiParams,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10 });

  // API hooks
  const { data: leadsRes, isLoading, refetch, isFetching } = useGetLeadsQuery({
    companyId,
    search: filters.searchKey || undefined,
    statusId: filters.statusId || undefined,
    rating: filters.rating || undefined,
    sourceId: filters.sourceId || undefined,
    page,
    size: apiParams.size || 10,
  });

  const { data: sourcesRes } = useGetCrmLeadSourcesQuery(companyId);
  const { data: statusesRes } = useGetCrmLeadStatusesQuery(companyId);

  const [deleteLead, { isLoading: isDeleting }] = useDeleteLeadMutation();

  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.content)) return res.data.content;
    return [];
  };

  const leads = toArray(leadsRes);
  const totalElements = leadsRes?.data?.totalElements || leadsRes?.totalElements || leads.length;
  const rawSources = toArray(sourcesRes);
  const rawStatuses = toArray(statusesRes);
  const sources = rawSources.length > 0 ? rawSources : DEFAULT_SOURCES;
  const statuses = rawStatuses.length > 0 ? rawStatuses : DEFAULT_STATUSES;

  const handleReset = () => {
    resetFilters();
    setPage(0);
    setSelectedRows([]);
  };

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

  const basicFilters = useMemo(() => [
    {
      id: 'statusId',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        ...statuses.map((st) => ({ label: st.statusName, value: String(st.id) }))
      ]
    },
    {
      id: 'rating',
      label: 'Score Tier',
      type: 'select',
      options: [
        { label: 'All Scores', value: '' },
        { label: 'Hot Leads (≥ 75)', value: 'HOT' },
        { label: 'Warm Leads (45 - 74)', value: 'WARM' },
        { label: 'Cold Leads (< 45)', value: 'COLD' }
      ]
    },
    {
      id: 'sourceId',
      label: 'Source',
      type: 'select',
      options: [
        { label: 'All Sources', value: '' },
        ...sources.map((src) => ({ label: src.sourceName, value: String(src.id) }))
      ]
    }
  ], [statuses, sources]);

  const columns = useMemo(() => [
    {
      id: 'displayName',
      label: 'Lead Name & Company',
      sortable: true,
      render: (val, lead) => {
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
      }
    },
    {
      id: 'contact',
      label: 'Contact',
      sortable: false,
      render: (val, lead) => (
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
      )
    },
    {
      id: 'leadScore',
      label: 'Lead Score',
      sortable: true,
      render: (val, lead) => {
        const score = lead.leadScore || 50;
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
      }
    },
    {
      id: 'leadSource',
      label: 'Source',
      sortable: false,
      render: (val, lead) => (
        <span className="text-xs text-zinc-700 dark:text-[#A0A6B5]">
          {lead.leadSource?.sourceName || lead.utmSource || 'Direct'}
        </span>
      )
    },
    {
      id: 'leadStatus',
      label: 'Status',
      sortable: true,
      render: (val, lead) => (
        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-primary/10 text-primary dark:text-primary-light">
          {lead.leadStatus?.statusName || 'NEW'}
        </span>
      )
    }
  ], [crmBase, navigate]);

  const { leads: leadsPerms } = useCrmPermissions();

  const rowActions = useMemo(() => {
    const actions = [];
    if (leadsPerms.canRead) {
      actions.push({
        key: 'view',
        label: 'View Details',
        icon: Eye,
        onClick: (row) => navigate(`${crmBase}/leads/${row.id}`),
        tooltip: 'View Details',
        className: 'hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40',
      });
    }
    if (leadsPerms.canAssign) {
      actions.push({
        key: 'assign',
        label: 'Assign Lead',
        icon: UserCheck,
        onClick: (row) => setAssigningLead(row),
        tooltip: 'Assign Lead',
        className: 'hover:text-primary hover:bg-primary/10',
      });
    }
    if (leadsPerms.canConvert) {
      actions.push({
        key: 'convert',
        label: 'Convert to Account & Deal',
        icon: ArrowRightLeft,
        onClick: (row) => setConvertingLead(row),
        tooltip: 'Convert to Account & Deal',
        className: 'hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40',
      });
    }
    if (leadsPerms.canUpdate) {
      actions.push({
        key: 'edit',
        label: 'Edit Lead',
        icon: Edit2,
        onClick: (row) => setEditingLead(row),
        tooltip: 'Edit Lead',
        className: 'hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40',
      });
    }
    if (leadsPerms.canDelete) {
      actions.push({
        key: 'delete',
        label: 'Delete Lead',
        icon: Trash2,
        danger: true,
        onClick: (row) => setDeletingLead(row),
        tooltip: 'Delete Lead',
      });
    }
    return actions;
  }, [crmBase, navigate, leadsPerms.canRead, leadsPerms.canAssign, leadsPerms.canConvert, leadsPerms.canUpdate, leadsPerms.canDelete]);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <PageHeader
        title="Lead Management"
        description={`Tracking, scoring and converting ${totalElements} commercial leads.`}
      >
        {leadsPerms.canImport && (
          <button
            onClick={() => setIsImportOpen(true)}
            className="btn-secondary flex items-center gap-2 text-xs"
          >
            <Upload size={14} />
            <span>Import CSV</span>
          </button>
        )}
        {leadsPerms.canCreate && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn-primary flex items-center gap-2 text-xs"
          >
            <Plus size={14} />
            <span>New Lead</span>
          </button>
        )}
      </PageHeader>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          permissionFeature="CRM_LEADS"
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={leads}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}

          // Search
          searchable
          searchValue={filters.searchKey || ''}
          searchPlaceholder="Search by name, phone, GSTIN..."
          onSearchChange={(val) => setFilter('searchKey', val)}

          // Basic Filters
          filters={basicFilters}
          filterValues={filters}
          onFilterChange={setFilter}

          // Reset & Refresh & Export
          onReset={handleReset}
          onRefresh={refetch}
          onExport={exportLeadsCsv}

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
            totalPages: Math.ceil(totalElements / (apiParams.size || 10)) || 1,
            totalElements: totalElements
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="leads"

          // Empty State
          emptyMessage="No leads found"
          emptyDescription="Try adjusting your search keywords or filter criteria to find commercial leads."
        />
      </div>

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
        message={`Are you sure you want to delete lead "${deletingLead?.displayName || deletingLead?.firstName}"? This action cannot be undone.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Lead'}
        variant="danger"
      />
    </div>
  );
}
