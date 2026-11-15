import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  Edit2,
  ExternalLink
} from 'lucide-react';
import { PageHeader } from '../../../components/common';
import DataTable from '../../../components/data-table/DataTable';
import {
  useGetCrmContactsQuery,
  useGetCrmAccountsQuery,
} from '../../../api/sales-crm/crm.api';
import ContactFormModal from '../components/ContactFormModal';

export default function ContactsPage() {
  const { companyId } = useParams();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  const { data: contactsRes, isLoading, refetch } = useGetCrmContactsQuery({
    companyId,
    search: searchTerm || undefined,
    role: selectedRole || undefined,
  });

  const { data: accountsRes } = useGetCrmAccountsQuery({ companyId, page: 0, size: 100 });
  const accounts = accountsRes?.data?.content || accountsRes?.data || [];
  const contacts = contactsRes?.data?.content || contactsRes?.data || [];

  const columns = [
    {
      header: 'Contact Name & Designation',
      accessorKey: 'firstName',
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div className="space-y-0.5">
            <span className="font-semibold text-zinc-900 dark:text-white text-xs block">
              {c.firstName} {c.lastName || ''}
            </span>
            <span className="text-[11px] text-zinc-500">{c.designation || 'Key Contact'}</span>
          </div>
        );
      },
    },
    {
      header: 'Linked Corporate Account',
      accessorKey: 'accountName',
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-[#A0A6B5]">
            <Building2 size={12} className="text-zinc-400" />
            <button
              onClick={() => c.accountId && navigate(`/sales-crm/accounts/${c.accountId}`)}
              className="hover:text-primary hover:underline font-medium"
            >
              {c.accountName || 'Independent'}
            </button>
          </div>
        );
      },
    },
    {
      header: 'Decision Role',
      accessorKey: 'decisionRole',
      cell: ({ row }) => {
        const role = row.original.decisionRole || 'DECISION_MAKER';
        let color = 'bg-zinc-100 text-zinc-600';
        if (role === 'DECISION_MAKER') color = 'bg-primary/10 text-primary';
        else if (role === 'CHAMPION') color = 'bg-emerald-500/10 text-emerald-600';
        else if (role === 'INFLUENCER') color = 'bg-blue-500/10 text-blue-600';

        return (
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${color}`}>
            {role}
          </span>
        );
      },
    },
    {
      header: 'Direct Communication',
      accessorKey: 'email',
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div className="text-xs space-y-0.5">
            <div className="flex items-center gap-1.5 text-zinc-700 dark:text-[#A0A6B5]">
              <Mail size={11} className="text-zinc-400" />
              <span>{c.email}</span>
            </div>
            {c.phone && (
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-500">
                <Phone size={11} className="text-zinc-400" />
                <span>{c.phone}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setEditingContact(row.original)}
            className="p-1.5 text-zinc-500 hover:text-blue-500 hover:bg-zinc-100 dark:hover:bg-[#1C202B] rounded transition-colors"
            title="Edit Contact"
          >
            <Edit2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Contact Directory"
        subtitle={`Central directory of ${contacts.length} business stakeholders and decision-makers.`}
        actions={
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5"
          >
            <Plus size={14} /> New Contact
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search contacts, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1C202B] text-zinc-900 dark:text-white"
          />
        </div>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1C202B] text-zinc-800 dark:text-[#E6E8EE]"
        >
          <option value="">All Decision Roles</option>
          <option value="DECISION_MAKER">Decision Maker</option>
          <option value="CHAMPION">Internal Champion</option>
          <option value="INFLUENCER">Influencer</option>
          <option value="GATEKEEPER">Gatekeeper</option>
        </select>
      </div>

      <DataTable
        data={contacts}
        columns={columns}
        isLoading={isLoading}
        enablePagination={true}
      />

      <ContactFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        companyId={companyId}
        onSuccess={() => refetch()}
      />

      <ContactFormModal
        isOpen={!!editingContact}
        onClose={() => setEditingContact(null)}
        initialData={editingContact}
        companyId={companyId}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

