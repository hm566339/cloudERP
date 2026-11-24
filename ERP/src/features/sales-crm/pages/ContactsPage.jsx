import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  Edit2,
  Trash2,
  ExternalLink
} from 'lucide-react';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/data-table';
import useUrlFilters from '../../../hooks/useUrlFilters';
import {
  useGetCrmContactsQuery,
  useGetCrmAccountsQuery,
  useDeleteCrmContactMutation,
} from '../../../api/sales-crm/crm.api';
import ContactFormModal from '../components/ContactFormModal';
import useCrmPermissions from '../hooks/useCrmPermissions';
import confirmDialog from '../../../utils/confirmDialog';

const DEFAULT_COLUMNS = [
  'name',
  'accountName',
  'decisionRole',
  'contact'
];

export default function ContactsPage() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const crmBase = companyId ? `/company/${companyId}/sales-crm` : '/sales-crm';

  const [selectedRows, setSelectedRows] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  const {
    page, setPage, setPageSize, apiParams,
    sortBy, sortOrder, handleColumnSort,
    filters, setFilter, resetFilters
  } = useUrlFilters({ defaultPageSize: 10 });

  const { data: contactsRes, isLoading, refetch, isFetching } = useGetCrmContactsQuery({
    companyId,
    search: filters.searchKey || undefined,
    role: filters.role || undefined,
  });

  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.content)) return res.data.content;
    return [];
  };

  const { data: accountsRes } = useGetCrmAccountsQuery({ companyId, page: 0, size: 100 });
  const accounts = toArray(accountsRes);
  const contacts = toArray(contactsRes);
  const totalElements = contactsRes?.data?.totalElements || contactsRes?.totalElements || contacts.length;

  const handleReset = () => {
    resetFilters();
    setPage(0);
    setSelectedRows([]);
  };

  const basicFilters = useMemo(() => [
    {
      id: 'role',
      label: 'Decision Role',
      type: 'select',
      options: [
        { label: 'All Decision Roles', value: '' },
        { label: 'Decision Maker', value: 'DECISION_MAKER' },
        { label: 'Internal Champion', value: 'CHAMPION' },
        { label: 'Influencer', value: 'INFLUENCER' },
        { label: 'Gatekeeper', value: 'GATEKEEPER' },
      ]
    }
  ], []);

  const columns = useMemo(() => [
    {
      id: 'name',
      label: 'Contact Name & Designation',
      sortable: true,
      render: (val, c) => (
        <div className="space-y-0.5">
          <span className="font-semibold text-zinc-900 dark:text-white text-xs block">
            {c.firstName} {c.lastName || ''}
          </span>
          <span className="text-[11px] text-zinc-500">{c.designation || 'Key Contact'}</span>
        </div>
      )
    },
    {
      id: 'accountName',
      label: 'Linked Corporate Account',
      sortable: true,
      render: (val, c) => (
        <div className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-[#A0A6B5]">
          <Building2 size={12} className="text-zinc-400" />
          <button
            onClick={() => c.accountId && navigate(`${crmBase}/accounts/${c.accountId}`)}
            className="hover:text-primary hover:underline font-medium text-left"
          >
            {c.accountName || 'Independent'}
          </button>
        </div>
      )
    },
    {
      id: 'decisionRole',
      label: 'Decision Role',
      sortable: true,
      render: (val, c) => {
        const role = c.decisionMakerRole || c.decisionRole || val || 'DECISION_MAKER';
        let color = 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400';
        if (role === 'DECISION_MAKER' || role === 'ECONOMIC_BUYER') {
          color = 'bg-primary/10 text-primary';
        } else if (role === 'CHAMPION') {
          color = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
        } else if (role === 'INFLUENCER') {
          color = 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
        } else if (role === 'TECHNICAL_EVALUATOR' || role === 'EVALUATOR') {
          color = 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
        } else if (role === 'GATEKEEPER') {
          color = 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
        }

        return (
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${color}`}>
            {role.replace(/_/g, ' ')}
          </span>
        );
      }
    },
    {
      id: 'contact',
      label: 'Direct Communication',
      sortable: false,
      render: (val, c) => (
        <div className="text-xs space-y-0.5">
          {c.email && (
            <div className="flex items-center gap-1.5 text-zinc-700 dark:text-[#A0A6B5]">
              <Mail size={11} className="text-zinc-400" />
              <span>{c.email}</span>
            </div>
          )}
          {c.phone && (
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-500">
              <Phone size={11} className="text-zinc-400" />
              <span>{c.phone}</span>
            </div>
          )}
          {!c.email && !c.phone && <span className="text-zinc-400">-</span>}
        </div>
      )
    }
  ], [crmBase, navigate]);

  const { contacts: contactPerms } = useCrmPermissions();
  const [deleteContact] = useDeleteCrmContactMutation();

  const handleDeleteContact = async (contact) => {
    const confirmed = await confirmDialog({
      title: 'Delete Contact',
      message: `Are you sure you want to delete ${contact.firstName} ${contact.lastName || ''}? This action cannot be undone.`,
    });
    if (confirmed) {
      try {
        await deleteContact({ id: contact.id, companyId }).unwrap();
        refetch();
      } catch (err) {
        console.error('Failed to delete contact:', err);
      }
    }
  };

  const rowActions = useMemo(() => {
    const actions = [];
    if (contactPerms.canUpdate) {
      actions.push({
        key: 'edit',
        label: 'Edit Contact',
        icon: Edit2,
        onClick: (row) => setEditingContact(row),
        tooltip: 'Edit Contact',
        className: 'hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40',
      });
    }
    if (contactPerms.canDelete) {
      actions.push({
        key: 'delete',
        label: 'Delete Contact',
        icon: Trash2,
        onClick: handleDeleteContact,
        tooltip: 'Delete Contact',
        className: 'hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40',
      });
    }
    return actions;
  }, [contactPerms.canUpdate, contactPerms.canDelete, companyId]);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <PageHeader
        title="Contact Management"
        description={`Central directory of ${totalElements} business stakeholders and decision-makers.`}
      >
        {contactPerms.canCreate && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn-primary flex items-center gap-2 text-xs"
          >
            <Plus size={16} />
            <span>New Contact</span>
          </button>
        )}
      </PageHeader>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          permissionFeature="CRM_ACCOUNTS"
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          data={contacts}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}

          // Search
          searchable
          searchValue={filters.searchKey || ''}
          searchPlaceholder="Search contacts, email, phone..."
          onSearchChange={(val) => setFilter('searchKey', val)}

          // Basic Filters
          filters={basicFilters}
          filterValues={filters}
          onFilterChange={setFilter}

          // Reset & Refresh
          onReset={handleReset}
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
            totalPages: Math.ceil(totalElements / (apiParams.size || 10)) || 1,
            totalElements: totalElements
          }}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="contacts"

          // Empty State
          emptyMessage="No contacts found"
          emptyDescription="Try adjusting your search keywords or filter criteria to find business contacts."
        />
      </div>

      <ContactFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        companyId={companyId}
        accounts={accounts}
        onSuccess={() => refetch()}
      />

      <ContactFormModal
        isOpen={!!editingContact}
        onClose={() => setEditingContact(null)}
        initialData={editingContact}
        companyId={companyId}
        accounts={accounts}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
