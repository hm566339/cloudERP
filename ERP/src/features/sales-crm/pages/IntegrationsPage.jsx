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
  ShieldCheck,
  Search,
  Zap,
  Radio,
  Layers,
  Sparkles
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

const CATALOG_CHANNELS = [
  {
    code: 'INDIAMART',
    name: 'IndiaMART B2B Portal',
    type: 'WEBHOOK_PUSH',
    badge: 'Real-time Push',
    badgeColor: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800',
    description: 'Instant buyer inquiry ingestion via IndiaMART CRM Push API & GLUSR key polling.',
  },
  {
    code: 'TRADEINDIA',
    name: 'TradeIndia Marketplace',
    type: 'WEBHOOK_PUSH',
    badge: 'Buy Leads',
    badgeColor: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    description: 'Automated ingestion of TradeIndia RFQs, buy leads, and high-intent buyer inquiries.',
  },
  {
    code: 'META_LEAD_ADS',
    name: 'Meta / Facebook Lead Ads',
    type: 'WEBHOOK_PUSH',
    badge: 'Instant Sync',
    badgeColor: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    description: 'Direct CRM sync from Facebook & Instagram lead forms with automatic hub.challenge verification.',
  },
  {
    code: 'CUSTOM_WEBHOOK',
    name: 'Custom Generic Webhook',
    type: 'WEBHOOK_PUSH',
    badge: 'Generic JSON',
    badgeColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    description: 'Universal JSON endpoint for website contact forms, Zapier, Make, and external microservices.',
  },
];

export default function IntegrationsPage() {
  const { companyId } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalChannel, setModalChannel] = useState('INDIAMART');
  const [copiedId, setCopiedId] = useState(null);
  const [syncingId, setSyncingId] = useState(null);
  const [searchKey, setSearchKey] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);

  const { data: integrationsRes, isLoading, refetch, isFetching } = useGetCrmTenantIntegrationsQuery(companyId);
  const { data: channelsRes } = useGetCrmIntegrationChannelsQuery();
  const { data: poolsRes } = useGetCrmRoundRobinPoolsQuery(companyId);

  const [triggerSync] = useTriggerCrmIntegrationSyncMutation();

  const rawIntegrations = useMemo(() => {
    if (Array.isArray(integrationsRes)) return integrationsRes;
    if (Array.isArray(integrationsRes?.data)) return integrationsRes.data;
    if (Array.isArray(integrationsRes?.content)) return integrationsRes.content;
    return [];
  }, [integrationsRes]);

  const pools = useMemo(() => {
    if (Array.isArray(poolsRes)) return poolsRes;
    if (Array.isArray(poolsRes?.data)) return poolsRes.data;
    return [];
  }, [poolsRes]);

  const filteredIntegrations = useMemo(() => {
    if (!searchKey.trim()) return rawIntegrations;
    const q = searchKey.trim().toLowerCase();
    return rawIntegrations.filter(
      (item) =>
        (item.integrationName && item.integrationName.toLowerCase().includes(q)) ||
        (item.connectionName && item.connectionName.toLowerCase().includes(q)) ||
        (item.channelCode && item.channelCode.toLowerCase().includes(q)) ||
        (item.webhookSlug && item.webhookSlug.toLowerCase().includes(q))
    );
  }, [rawIntegrations, searchKey]);

  const handleOpenModal = (channelCode = 'INDIAMART') => {
    setModalChannel(channelCode);
    setIsModalOpen(true);
  };

  const handleCopyWebhook = (item) => {
    const slug = item?.webhookSlug || item?.id;
    const url = `https://www.mark2.in/api/crm/integrations/webhook/${slug}`;
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
      label: 'INTEGRATION & CHANNEL',
      sortable: true,
      render: (val, item) => {
        const name = item?.integrationName || item?.connectionName || val || 'Lead Webhook';
        const code = item?.channelCode || 'WEBHOOK';
        const isMeta = code.includes('META');
        const isIndiaMart = code.includes('INDIAMART');
        const isTradeIndia = code.includes('TRADEINDIA');

        const badgeClass = isIndiaMart
          ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20'
          : isTradeIndia
          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
          : isMeta
          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';

        return (
          <div className="space-y-1">
            <span className="font-semibold text-xs text-zinc-900 dark:text-white block">
              {name}
            </span>
            <span className={`inline-block px-1.5 py-0.5 text-[10px] font-mono uppercase rounded border ${badgeClass}`}>
              {code}
            </span>
          </div>
        );
      },
    },
    {
      id: 'webhookSlug',
      label: 'INBOUND WEBHOOK ENDPOINT',
      sortable: true,
      render: (val, item) => {
        const slug = item?.webhookSlug || item?.id || val;
        const endpoint = `/api/crm/integrations/webhook/${slug}`;
        const isCopied = copiedId === item?.id;

        return (
          <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-600 dark:text-[#A0A6B5]">
            <span className="bg-zinc-100 dark:bg-[#1C202B] px-2 py-0.5 rounded truncate max-w-xs text-[11px]">
              {endpoint}
            </span>
            <button
              onClick={() => handleCopyWebhook(item)}
              className="p-1 hover:text-emerald-500 transition-colors"
              title="Copy Full Webhook URL"
            >
              {isCopied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            </button>
          </div>
        );
      },
    },
    {
      id: 'syncStatus',
      label: 'STATUS',
      sortable: true,
      render: (val, item) => (
        <DataTableStatusBadge
          status={item?.isEnabled !== false ? 'ACTIVE' : 'DISABLED'}
          variant={item?.isEnabled !== false ? 'success' : 'neutral'}
        />
      ),
    },
    {
      id: 'lastSyncAt',
      label: 'LAST ACTIVITY',
      sortable: true,
      render: (val, item) => {
        const time = item?.lastSyncAt || val;
        return (
          <span className="text-xs text-zinc-500 font-mono">
            {time ? new Date(time).toLocaleString() : 'Listening for Webhooks'}
          </span>
        );
      },
    },
  ], [copiedId]);

  const rowActions = useMemo(() => [
    {
      key: 'sync',
      label: 'Sync Now',
      icon: RotateCw,
      tooltip: 'Trigger Pull Sync / Refresh',
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
          onClick={() => handleOpenModal('INDIAMART')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Connect Channel</span>
        </button>
      </PageHeader>

      <div className="flex-1 p-6 overflow-auto flex flex-col space-y-6">
        {/* Marketplace Channels Catalog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          {CATALOG_CHANNELS.map((ch) => (
            <div
              key={ch.code}
              className="p-4 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-sm space-y-2 hover:border-emerald-500/50 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-zinc-900 dark:text-white">{ch.name}</span>
                  <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded border ${ch.badgeColor}`}>
                    {ch.badge}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-[#A0A6B5] leading-relaxed">
                  {ch.description}
                </p>
              </div>

              <button
                onClick={() => handleOpenModal(ch.code)}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 pt-2 self-start"
              >
                Configure Connection <Plus size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Active Integrations Table */}
        <div className="flex-1 overflow-hidden flex flex-col space-y-3">
          <div className="flex items-center justify-between shrink-0">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Active Ingestion Pipelines</h2>
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search integrations..."
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <DataTable
              permissionFeature="CRM"
              selectable
              selectedRows={selectedRows}
              onSelectionChange={setSelectedRows}
              columns={columns}
              data={filteredIntegrations}
              rowKey="id"
              loading={isLoading}
              isRefreshing={isFetching}
              onRefresh={refetch}
              rowActions={rowActions}
              itemName="integrations"
              emptyMessage="No active integrations configured"
              emptyDescription="Connect IndiaMART, TradeIndia, Meta Ads, or set up a custom webhook endpoint above."
            />
          </div>
        </div>
      </div>

      <IntegrationFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        companyId={companyId}
        pools={pools}
        initialChannel={modalChannel}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
