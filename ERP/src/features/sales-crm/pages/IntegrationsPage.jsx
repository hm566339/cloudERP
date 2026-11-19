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
  Sparkles,
  Lock,
  Trash2,
  Sliders,
  Shield
} from 'lucide-react';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import ConfirmModal from '../../../components/common/ConfirmModal';
import { useRBAC } from '../../../utils/rbac';
import {
  useGetCrmTenantIntegrationsQuery,
  useGetCrmAvailableProvidersQuery,
  useTriggerCrmIntegrationSyncMutation,
  useDisconnectCrmTenantIntegrationMutation,
  useGetCrmRoundRobinPoolsQuery,
} from '../../../api/sales-crm/crm.api';
import IntegrationFormModal from '../components/IntegrationFormModal';
import SystemAdminProvidersModal from '../components/SystemAdminProvidersModal';

const CATALOG_CHANNELS = [
  {
    code: 'FACEBOOK',
    name: 'Meta / Facebook Lead Ads',
    authType: 'OAUTH2',
    badge: '1-Click OAuth',
    badgeColor: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    description: 'Direct CRM sync from Facebook & Instagram lead forms with automatic webhook subscription.',
  },
  {
    code: 'INDIAMART',
    name: 'IndiaMART B2B Portal',
    authType: 'API_KEY',
    badge: 'Verified API Key',
    badgeColor: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800',
    description: 'Instant buyer inquiry ingestion via IndiaMART CRM Push API & periodic polling.',
  },
  {
    code: 'TRADEINDIA',
    name: 'TradeIndia Marketplace',
    authType: 'WEBHOOK',
    badge: 'Buy Leads',
    badgeColor: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    description: 'Automated ingestion of TradeIndia RFQs, buy leads, and high-intent buyer inquiries.',
  },
  {
    code: 'CUSTOM_WEBHOOK',
    name: 'Custom Generic Webhook',
    authType: 'WEBHOOK',
    badge: 'Generic JSON',
    badgeColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    description: 'Universal JSON endpoint for website contact forms, Zapier, Make, and external microservices.',
  },
];

export default function IntegrationsPage() {
  const { companyId } = useParams();
  const { isSuperAdmin, isOwner, hasPermission } = useRBAC();

  // Strict RBAC check for Layer 2: CRM_INTEGRATION_MANAGE
  const canManageIntegrations = useMemo(() => {
    return (
      Boolean(isSuperAdmin) ||
      Boolean(isOwner) ||
      hasPermission('CRM_INTEGRATIONS', 'MANAGE') ||
      hasPermission('CRM_INTEGRATION', 'MANAGE') ||
      hasPermission('CRM', 'MANAGE') ||
      hasPermission('CRM_INTEGRATIONS', 'WRITE')
    );
  }, [isSuperAdmin, isOwner, hasPermission]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [modalChannel, setModalChannel] = useState('INDIAMART');
  const [copiedId, setCopiedId] = useState(null);
  const [syncingId, setSyncingId] = useState(null);
  const [disconnectItem, setDisconnectItem] = useState(null);
  const [searchKey, setSearchKey] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);

  const { data: integrationsRes, isLoading, refetch, isFetching } = useGetCrmTenantIntegrationsQuery(companyId);
  const { data: availableProvidersRes } = useGetCrmAvailableProvidersQuery();
  const { data: poolsRes } = useGetCrmRoundRobinPoolsQuery(companyId);

  const [triggerSync] = useTriggerCrmIntegrationSyncMutation();
  const [disconnectIntegration, { isLoading: isDisconnecting }] = useDisconnectCrmTenantIntegrationMutation();

  const rawIntegrations = useMemo(() => {
    if (Array.isArray(integrationsRes)) return integrationsRes;
    if (Array.isArray(integrationsRes?.data)) return integrationsRes.data;
    if (Array.isArray(integrationsRes?.content)) return integrationsRes.content;
    return [];
  }, [integrationsRes]);

  const availableProviders = useMemo(() => {
    if (Array.isArray(availableProvidersRes)) return availableProvidersRes;
    if (Array.isArray(availableProvidersRes?.data)) return availableProvidersRes.data;
    return [];
  }, [availableProvidersRes]);

  const filteredIntegrations = useMemo(() => {
    if (!searchKey.trim()) return rawIntegrations;
    const q = searchKey.trim().toLowerCase();
    return rawIntegrations.filter(
      (item) =>
        (item.integrationName && item.integrationName.toLowerCase().includes(q)) ||
        (item.connectionName && item.connectionName.toLowerCase().includes(q)) ||
        (item.providerCode && item.providerCode.toLowerCase().includes(q)) ||
        (item.channelCode && item.channelCode.toLowerCase().includes(q)) ||
        (item.webhookSlug && item.webhookSlug.toLowerCase().includes(q))
    );
  }, [rawIntegrations, searchKey]);

  const handleOpenModal = (channelCode = 'INDIAMART') => {
    if (!canManageIntegrations) return;
    setModalChannel(channelCode);
    setIsModalOpen(true);
  };

  const handleCopyWebhook = (item) => {
    const slug = item?.webhookSlug || item?.id;
    const url = item?.webhookUrl || `https://www.mark2.in/api/crm/integrations/webhook/${slug}`;
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

  const handleConfirmDisconnect = async () => {
    if (!disconnectItem) return;
    try {
      await disconnectIntegration({ id: disconnectItem.id, companyId }).unwrap();
      setDisconnectItem(null);
      refetch();
    } catch (err) {
      console.error('Disconnect failed', err);
    }
  };

  // Helper to calculate last synced duration
  const formatLastSynced = (lastSyncTime) => {
    if (!lastSyncTime) return 'Waiting for first sync';
    const diffMs = Date.now() - new Date(lastSyncTime).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Last synced just now';
    if (diffMins === 1) return 'Last synced 1 min ago';
    if (diffMins < 60) return `Last synced ${diffMins} mins ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return 'Last synced 1 hr ago';
    if (diffHours < 24) return `Last synced ${diffHours} hrs ago`;
    return `Last synced ${new Date(lastSyncTime).toLocaleDateString()}`;
  };

  const columns = useMemo(() => [
    {
      id: 'integrationName',
      label: 'INTEGRATION & CHANNEL',
      sortable: true,
      render: (val, item) => {
        const name = item?.integrationName || item?.connectionName || val || 'Lead Integration';
        const code = String(item?.providerCode || item?.channelCode || 'WEBHOOK').toUpperCase();
        const isMeta = code.includes('META') || code.includes('FACEBOOK');
        const isIndiaMart = code.includes('INDIAMART');
        const isTradeIndia = code.includes('TRADEINDIA');

        const badgeClass = isIndiaMart
          ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20'
          : isTradeIndia
          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
          : isMeta
          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';

        const labelText = isIndiaMart
          ? 'IndiaMART'
          : isTradeIndia
          ? 'TradeIndia'
          : isMeta
          ? 'Facebook Ads'
          : 'Generic Webhook';

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-zinc-900 dark:text-white">{name}</span>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${badgeClass}`}>
                {labelText}
              </span>
            </div>
            {item?.safeCredentials?.pageName && (
              <p className="text-[11px] text-zinc-500">Page: {item.safeCredentials.pageName}</p>
            )}
          </div>
        );
      },
    },
    {
      id: 'status',
      label: 'STATUS',
      sortable: true,
      render: (val, item) => {
        const st = String(item?.status || item?.syncStatus || 'CONNECTED').toUpperCase();
        const isConnected = st === 'CONNECTED' || st === 'ACTIVE';
        const lastSyncText = formatLastSynced(item?.lastSyncedAt || item?.lastSyncAt);

        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className={`text-xs font-bold ${isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                {isConnected ? 'Connected' : st}
              </span>
            </div>
            <span className="text-[11px] text-zinc-500">{lastSyncText}</span>
          </div>
        );
      },
    },
    {
      id: 'webhookUrl',
      label: 'WEBHOOK ENDPOINT',
      render: (val, item) => {
        const slug = item?.webhookSlug || item?.id;
        const url = item?.webhookUrl || `https://www.mark2.in/api/crm/integrations/webhook/${slug}`;
        const isCopied = copiedId === item?.id;

        return (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-600 dark:text-[#A0A6B5] bg-zinc-100 dark:bg-[#1C202B] px-2 py-1 rounded max-w-[220px] truncate border border-zinc-200 dark:border-[#2A2F3D]">
              {url}
            </span>
            <button
              onClick={() => handleCopyWebhook(item)}
              className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded hover:bg-zinc-100 dark:hover:bg-[#1C202B] transition-colors"
              title="Copy endpoint"
            >
              {isCopied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            </button>
          </div>
        );
      },
    },
    {
      id: 'routing',
      label: 'ROUTING RULES',
      render: (val, item) => {
        const auto = item?.routingConfig?.autoQualify ?? true;
        return (
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
              {auto ? 'Auto-Qualify Active' : 'Manual Triage'}
            </span>
          </div>
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
    ...(canManageIntegrations
      ? [
          {
            key: 'disconnect',
            label: 'Disconnect',
            icon: Trash2,
            tooltip: 'Deactivate Channel',
            danger: true,
            onClick: (row) => setDisconnectItem(row),
          },
        ]
      : []),
  ], [canManageIntegrations]);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <PageHeader
        title="Marketplace & Webhook Integrations"
        description="Odoo & HubSpot-style 2-tier synchronized lead ingestion with strict RBAC"
      >
        <div className="flex items-center gap-2">
          {/* Layer 1: SystemAdmin Global Configuration button */}
          {Boolean(isSuperAdmin) && (
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="btn-secondary flex items-center gap-1.5 text-xs font-semibold"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-500" />
              <span>Global Provider Defaults (SystemAdmin)</span>
            </button>
          )}

          {/* Layer 2: Tenant Connect Button */}
          {canManageIntegrations ? (
            <button
              onClick={() => handleOpenModal('INDIAMART')}
              className="btn-primary flex items-center gap-2 text-xs font-semibold"
            >
              <Plus size={15} />
              <span>Connect Channel</span>
            </button>
          ) : (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-[#1C202B] text-zinc-400 text-xs font-medium border border-zinc-200 dark:border-[#2A2F3D] cursor-not-allowed"
              title="Requires CRM_INTEGRATION_MANAGE permission to connect or disconnect channels"
            >
              <Lock size={13} />
              <span>Connect Restricted</span>
            </div>
          )}
        </div>
      </PageHeader>

      <div className="flex-1 p-6 overflow-auto flex flex-col space-y-6">
        {/* Marketplace Channels Catalog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          {CATALOG_CHANNELS.map((ch) => (
            <div
              key={ch.code}
              className="p-4 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-sm space-y-2.5 hover:border-emerald-500/50 transition-colors flex flex-col justify-between"
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

              {canManageIntegrations ? (
                <button
                  onClick={() => handleOpenModal(ch.code)}
                  className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 pt-2 self-start"
                >
                  Configure Connection <Plus size={12} />
                </button>
              ) : (
                <span className="text-[11px] text-zinc-400 flex items-center gap-1 pt-2 self-start">
                  <Lock size={11} /> Read-only
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Active Integrations Table */}
        <div className="flex-1 overflow-hidden flex flex-col space-y-3">
          <div className="flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Active Ingestion Pipelines</h2>
              <p className="text-[11px] text-zinc-500">Live connectors synchronizing leads into your sales pipeline</p>
            </div>
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
              emptyDescription="Connect Facebook Ads, IndiaMART, TradeIndia, or a custom webhook endpoint above to start ingesting leads."
            />
          </div>
        </div>
      </div>

      {/* Dynamic Platform-Specific Connection Modal */}
      <IntegrationFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        channelCode={modalChannel}
        companyId={companyId}
        availableProviders={availableProviders}
        onSuccess={() => refetch()}
      />

      {/* Layer 1: SystemAdmin Global Provider Defaults Modal */}
      <SystemAdminProvidersModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />

      {/* Disconnect Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(disconnectItem)}
        onClose={() => setDisconnectItem(null)}
        onConfirm={handleConfirmDisconnect}
        title="Disconnect Integration"
        message={`Are you sure you want to disconnect "${disconnectItem?.integrationName || disconnectItem?.connectionName}"? Real-time syncing and automated lead ingestion for this channel will be paused.`}
        confirmText={isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
        type="danger"
      />
    </div>
  );
}
