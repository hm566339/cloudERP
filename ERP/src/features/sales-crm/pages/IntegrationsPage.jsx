import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Globe,
  Plus,
  RotateCw,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { PageHeader } from '../../../components/common';
import DataTable from '../../../components/data-table/DataTable';
import {
  useGetCrmTenantIntegrationsQuery,
  useGetCrmIntegrationChannelsQuery,
  useTriggerCrmIntegrationSyncMutation,
  useGetCrmRoundRobinPoolsQuery,
} from '../../../api/sales-crm/crm.api';
import IntegrationFormModal from '../components/IntegrationFormModal';

export default function IntegrationsPage() {
  const { companyId } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [syncingId, setSyncingId] = useState(null);

  const { data: integrationsRes, isLoading, refetch } = useGetCrmTenantIntegrationsQuery(companyId);
  const { data: channelsRes } = useGetCrmIntegrationChannelsQuery();
  const { data: poolsRes } = useGetCrmRoundRobinPoolsQuery(companyId);

  const [triggerSync] = useTriggerCrmIntegrationSyncMutation();

  const integrations = integrationsRes?.data || [];
  const channels = channelsRes?.data || [
    { code: 'INDIAMART', name: 'IndiaMART B2B Portal', type: 'WEBHOOK_PUSH', description: 'Real-time buyer inquiries push via GLUSR key' },
    { code: 'TRADEINDIA', name: 'TradeIndia Marketplace', type: 'WEBHOOK_PUSH', description: 'Automated leads ingestion via webhook' },
    { code: 'JUSTDIAL', name: 'Justdial Inquiries', type: 'POLL_SYNC', description: 'Local and regional commercial buyer alerts' },
    { code: 'META_LEAD_ADS', name: 'Meta / Facebook Lead Ads', type: 'WEBHOOK_PUSH', description: 'Direct CRM synchronization from Facebook forms' },
  ];
  const pools = poolsRes?.data || [];

  const handleCopyWebhook = (item) => {
    const url = `https://www.mark2.in/api/crm/integrations/webhook/${item.webhookSlug || item.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleManualSync = async (integrationId) => {
    try {
      setSyncingId(integrationId);
      await triggerSync({ id: integrationId, companyId }).unwrap();
      refetch();
    } catch (err) {
      console.error('Manual sync failed', err);
    } finally {
      setSyncingId(null);
    }
  };

  const columns = [
    {
      header: 'Integration & Channel',
      accessorKey: 'integrationName',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="space-y-0.5">
            <span className="font-semibold text-xs text-zinc-900 dark:text-white block">
              {item.integrationName || item.channelCode}
            </span>
            <span className="text-[11px] font-mono text-zinc-500 uppercase">{item.channelCode}</span>
          </div>
        );
      },
    },
    {
      header: 'Webhook Inbound Endpoint',
      accessorKey: 'webhookSlug',
      cell: ({ row }) => {
        const item = row.original;
        const slug = item.webhookSlug || item.id;
        const url = `/api/crm/integrations/webhook/${slug}`;
        const isCopied = copiedId === item.id;

        return (
          <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-600 dark:text-[#A0A6B5]">
            <span className="bg-zinc-100 dark:bg-[#1C202B] px-2 py-0.5 rounded truncate max-w-xs">{url}</span>
            <button
              onClick={() => handleCopyWebhook(item)}
              className="p-1 hover:text-primary transition-colors"
              title="Copy Full Webhook URL"
            >
              {isCopied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            </button>
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessorKey: 'isActive',
      cell: ({ row }) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-600 flex items-center gap-1 w-fit">
          <CheckCircle2 size={11} /> CONNECTED
        </span>
      ),
    },
    {
      header: 'Last Sync / Lead',
      accessorKey: 'lastSyncAt',
      cell: ({ row }) => (
        <span className="text-xs text-zinc-500">
          {row.original.lastSyncAt ? new Date(row.original.lastSyncAt).toLocaleString() : 'Listening for Webhooks'}
        </span>
      ),
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleManualSync(row.original.id)}
            disabled={syncingId === row.original.id}
            className="btn-secondary text-xs px-2.5 py-1 flex items-center gap-1"
            title="Trigger Immediate Pull Sync"
          >
            <RotateCw size={11} className={syncingId === row.original.id ? 'animate-spin' : ''} />
            {syncingId === row.original.id ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 p-4 md:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Marketplace & Webhook Integrations"
        subtitle="Automatic lead ingestion from IndiaMART, TradeIndia, Meta Ads and custom webhooks."
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5"
          >
            <Plus size={14} /> Connect Channel
          </button>
        }
      />

      {/* Available Marketplace Channels Catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {channels.map((ch) => (
          <div
            key={ch.code}
            className="p-4 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-sm space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-zinc-900 dark:text-white">{ch.name}</span>
              <Globe size={16} className="text-primary" />
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">{ch.description}</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 pt-1"
            >
              Configure Connection <Plus size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Active Integrations Table */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Active Ingestion Pipelines</h2>
        <DataTable
          data={integrations}
          columns={columns}
          isLoading={isLoading}
          enablePagination={true}
        />
      </div>

      <IntegrationFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        companyId={companyId}
        pools={pools}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

