import React, { useState, useMemo } from 'react';
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
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
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
  const [selectedRows, setSelectedRows] = useState([]);

  const { data: integrationsRes, isLoading, refetch, isFetching } = useGetCrmTenantIntegrationsQuery(companyId);
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

  const columns = useMemo(() => [
    {
      id: 'integrationName',
      header: 'Integration & Channel',
      accessorKey: 'integrationName',
      sortable: true,
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
      id: 'webhookSlug',
      header: 'Webhook Inbound Endpoint',
      accessorKey: 'webhookSlug',
      sortable: true,
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
      id: 'isActive',
      header: 'Status',
      accessorKey: 'isActive',
      sortable: true,
      cell: ({ row }) => (
        <DataTableStatusBadge
          status="CONNECTED"
          variant="success"
        />
      ),
    },
    {
      id: 'lastSyncAt',
      header: 'Last Sync / Lead',
      accessorKey: 'lastSyncAt',
      sortable: true,
      cell: ({ row }) => (
        <span className="text-xs text-zinc-500 font-mono">
          {row.original.lastSyncAt ? new Date(row.original.lastSyncAt).toLocaleString() : 'Listening for Webhooks'}
        </span>
      ),
    },
  ], [copiedId]);

  const rowActions = useMemo(() => [
    {
      key: 'sync',
      label: 'Sync Now',
      icon: RotateCw,
      tooltip: 'Trigger Pull Sync',
      onClick: (row) => handleManualSync(row.id),
    },
  ], []);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <PageHeader
        title="Marketplace & Webhook Integrations"
        description="Automatic lead ingestion from IndiaMART, TradeIndia, Meta Ads and custom webhooks"
      >
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-primary-500/20 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Connect Channel</span>
        </button>
      </PageHeader>

      <div className="flex-1 p-6 overflow-auto flex flex-col space-y-6">
        {/* Marketplace Channels Catalog */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          {channels.map((ch) => (
            <div
              key={ch.code}
              className="p-4 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-sm space-y-2 hover:border-primary/50 transition-colors"
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
        <div className="flex-1 overflow-hidden flex flex-col space-y-3">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white shrink-0">Active Ingestion Pipelines</h2>
          <div className="flex-1 overflow-hidden flex flex-col">
            <DataTable
              permissionFeature="CRM"
              selectable
              selectedRows={selectedRows}
              onSelectionChange={setSelectedRows}
              columns={columns}
              data={integrations}
              rowKey="id"
              loading={isLoading}
              isRefreshing={isFetching}
              onRefresh={refetch}
              rowActions={rowActions}
              itemName="integrations"
              emptyMessage="No active integrations configured"
              emptyDescription="Connect your marketplace accounts above or set up webhook endpoints."
            />
          </div>
        </div>
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
