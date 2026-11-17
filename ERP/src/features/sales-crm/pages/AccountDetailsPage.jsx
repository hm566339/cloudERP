import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  UserCheck,
  CreditCard,
  Target,
  FileText,
  Plus,
  Users,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { PageHeader, Tabs } from '../../../components/common';
import DataTable from '../../../components/data-table';
import {
  useGetCrmAccountByIdQuery,
  useGetCrmContactsQuery,
  useGetCrmOpportunitiesQuery,
  useGetCrmQuotationsQuery,
} from '../../../api/sales-crm/crm.api';
import ContactFormModal from '../components/ContactFormModal';
import OpportunityFormModal from '../components/OpportunityFormModal';
import QuotationFormModal from '../components/QuotationFormModal';

export default function AccountDetailsPage() {
  const { id, companyId } = useParams();
  const navigate = useNavigate();
  const crmBase = companyId ? `/company/${companyId}/sales-crm` : '/sales-crm';

  const [activeTab, setActiveTab] = useState('contacts');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isOppModalOpen, setIsOppModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  const { data: accountRes, isLoading: isAccLoading, refetch: refetchAcc } = useGetCrmAccountByIdQuery({ id, companyId });
  const account = accountRes?.data || null;

  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.content)) return res.data.content;
    return [];
  };

  const { data: contactsRes, refetch: refetchContacts } = useGetCrmContactsQuery({ accountId: id, companyId });
  const contacts = toArray(contactsRes);

  const { data: oppsRes } = useGetCrmOpportunitiesQuery({ accountId: id, companyId });
  const opportunities = toArray(oppsRes);

  const { data: quotesRes } = useGetCrmQuotationsQuery({ accountId: id, companyId });
  const quotations = toArray(quotesRes);

  if (isAccLoading) {
    return <div className="p-8 text-center text-xs text-zinc-400">Loading Account dossier...</div>;
  }

  if (!account) {
    return (
      <div className="p-8 text-center text-xs text-zinc-400 space-y-2">
        <p>Account record not found.</p>
        <button onClick={() => navigate(`${crmBase}/accounts`)} className="text-primary hover:underline">
          Return to Accounts
        </button>
      </div>
    );
  }

  const tabList = [
    { id: 'contacts', label: `Key Stakeholders & Contacts (${contacts.length})` },
    { id: 'deals', label: `Opportunities & Pipeline (${opportunities.length})` },
    { id: 'quotes', label: `Quotations (${quotations.length})` },
    { id: 'financials', label: 'Billing & Limits' },
  ];

  const contactColumns = [
    {
      id: 'firstName',
      label: 'Contact Name',
      render: (val, row) => (
        <div>
          <span className="font-semibold text-zinc-900 dark:text-white block">
            {row?.firstName || val} {row?.lastName || ''}
          </span>
          <span className="text-[11px] text-zinc-500">{row?.designation || 'Contact Person'}</span>
        </div>
      ),
    },
    {
      id: 'decisionRole',
      label: 'Role',
      render: (val, row) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 dark:bg-[#1C202B] text-zinc-700 dark:text-[#E6E8EE]">
          {row?.decisionRole || val || 'DECISION_MAKER'}
        </span>
      ),
    },
    {
      id: 'email',
      label: 'Email & Phone',
      render: (val, row) => (
        <div className="text-xs space-y-0.5">
          <span className="text-zinc-700 dark:text-[#A0A6B5] block">{row?.email || val || '-'}</span>
          <span className="font-mono text-zinc-500 text-[11px]">{row?.phone || 'N/A'}</span>
        </div>
      ),
    },
  ];

  const oppColumns = [
    {
      id: 'title',
      label: 'Deal Title',
      render: (val, row) => (
        <span className="font-semibold text-zinc-900 dark:text-white text-xs">
          {row?.title || val}
        </span>
      ),
    },
    {
      id: 'stageName',
      label: 'Stage',
      render: (val, row) => (
        <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary">
          {row?.stageName || val || 'Pipeline Stage'}
        </span>
      ),
    },
    {
      id: 'dealValue',
      label: 'Deal Value',
      render: (val, row) => (
        <span className="font-mono font-semibold text-zinc-900 dark:text-white text-xs">
          ₹{Number(row?.dealValue ?? val ?? 0).toLocaleString('en-IN')}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117] overflow-auto p-6 space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(`${crmBase}/accounts`)}
          className="p-1.5 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] text-zinc-600 dark:text-[#A0A6B5] hover:bg-zinc-100 dark:hover:bg-[#1C202B]"
        >
          <ArrowLeft size={14} />
        </button>
        <span className="text-xs text-zinc-500 font-semibold">Back to Accounts Directory</span>
      </div>

      {/* Account Profile Header */}
      <div className="p-5 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-zinc-900 dark:text-white">{account.accountName || account.name}</h1>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-primary/10 text-primary">
                {account.accountTier || 'SMB'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <Building2 size={13} /> {account.industry || 'Commercial Enterprise'}
              </span>
              {account.gstin && (
                <span className="font-mono text-zinc-700 dark:text-[#A0A6B5]">
                  GSTIN: {account.gstin}
                </span>
              )}
              {account.pan && (
                <span className="font-mono text-zinc-700 dark:text-[#A0A6B5]">
                  PAN: {account.pan}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <Users size={13} /> Add Contact
            </button>
            <button
              onClick={() => setIsOppModalOpen(true)}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <Target size={13} /> New Deal
            </button>
            <button
              onClick={() => setIsQuoteModalOpen(true)}
              className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5"
            >
              <FileText size={13} /> Create Quote
            </button>
          </div>
        </div>

        <div className="border-t border-zinc-100 dark:border-[#2A2F3D] pt-3">
          <Tabs
            tabs={tabList}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>
      </div>

      {activeTab === 'contacts' && (
        <div className="space-y-3">
          <DataTable
            data={contacts}
            columns={contactColumns}
            isLoading={false}
            enablePagination={true}
          />
        </div>
      )}

      {activeTab === 'deals' && (
        <div className="space-y-3">
          <DataTable
            data={opportunities}
            columns={oppColumns}
            isLoading={false}
            enablePagination={true}
          />
        </div>
      )}

      {activeTab === 'quotes' && (
        <div className="space-y-3 bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D]">
          {quotations.length === 0 ? (
            <p className="text-xs text-zinc-400 py-6 text-center">No quotations generated for this account yet.</p>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-[#2A2F3D]">
              {quotations.map((q) => (
                <div key={q.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-zinc-900 dark:text-white block">{q.quotationNumber || q.title}</span>
                    <span className="text-[11px] text-zinc-500">Status: {q.status}</span>
                  </div>
                  <span className="font-mono font-bold text-primary">₹{(q.totalAmount || 0).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'financials' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-sm space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Credit & Payment Terms</h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Assigned Credit Limit:</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-white">₹{(account.creditLimit || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Payment Terms:</span>
                <span className="font-semibold text-zinc-800 dark:text-[#E6E8EE]">{account.paymentTerms || 'NET_30'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ContactFormModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        companyId={companyId}
        accountId={id}
        onSuccess={() => refetchContacts()}
      />

      <OpportunityFormModal
        isOpen={isOppModalOpen}
        onClose={() => setIsOppModalOpen(false)}
        companyId={companyId}
        initialAccountId={id}
        onSuccess={() => refetchAcc()}
      />

      <QuotationFormModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        companyId={companyId}
        accounts={[account]}
        opportunities={opportunities}
        onSuccess={() => refetchAcc()}
      />
    </div>
  );
}

