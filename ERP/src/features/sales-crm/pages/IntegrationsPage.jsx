import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
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
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../../features/notifications/notificationSlice';
import {
  useGetCrmTenantIntegrationsQuery,
  useGetCrmAvailableProvidersQuery,
  useTriggerCrmIntegrationSyncMutation,
  useDeleteCrmTenantIntegrationMutation,
  useDisconnectCrmTenantIntegrationMutation,
  useBatchDeleteCrmTenantIntegrationsMutation,
  useGetCrmRoundRobinPoolsQuery,
} from '../../../api/sales-crm/crm.api';
import IntegrationFormModal from '../components/IntegrationFormModal';
import SystemAdminProvidersModal from '../components/SystemAdminProvidersModal';
import IntegrationProviderLogo from '../components/IntegrationProviderLogo';
import IntegrationsCampaignsHeader from '../components/IntegrationsCampaignsHeader';

export default function IntegrationsPage() {
  const { companyId } = useParams();
  const navigate = useNavigate();
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

  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [modalChannel, setModalChannel] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [syncingId, setSyncingId] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  // Enterprise DataTable Toolbar State (Matches Trial Balance standards)
  const initialFilters = {
    search: '',
    channel: '',
    status: '',
    page: 0,
    pageSize: 10,
  };
  const [filters, setFilters] = useState(initialFilters);
  const [visibleColumns, setVisibleColumns] = useState(['integrationName', 'status', 'webhookUrl', 'routing']);

  const { data: integrationsRes, isLoading, refetch, isFetching } = useGetCrmTenantIntegrationsQuery(companyId);
  const { data: availableProvidersRes } = useGetCrmAvailableProvidersQuery();
  const { data: poolsRes } = useGetCrmRoundRobinPoolsQuery(companyId);

  const [triggerSync] = useTriggerCrmIntegrationSyncMutation();
  const [deleteIntegration, { isLoading: isDeleting }] = useDeleteCrmTenantIntegrationMutation();
  const [batchDeleteIntegrations, { isLoading: isBatchDeleting }] = useBatchDeleteCrmTenantIntegrationsMutation();

  // Listen for OAuth callback redirect results (?fb_connected=true or ?fb_error=...)
  useEffect(() => {
    const fbConnected = searchParams.get('fb_connected');
    const fbError = searchParams.get('fb_error');

    if (fbConnected === 'true') {
      dispatch(
        addAlert({
          type: 'success',
          message: 'Meta / Facebook Lead Ads connected successfully! Lead forms and webhooks are now active.',
        })
      );
      refetch();
      searchParams.delete('fb_connected');
      setSearchParams(searchParams, { replace: true });
    } else if (fbError) {
      dispatch(
        addAlert({
          type: 'error',
          message: `Facebook connection failed: ${decodeURIComponent(fbError)}`,
        })
      );
      searchParams.delete('fb_error');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, dispatch, refetch, setSearchParams]);

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

  const basicFilters = useMemo(() => [
    {
      id: 'channel',
      label: 'Channel',
      type: 'select',
      placeholder: 'All Channels',
      options: [
        { value: '', label: 'All Channels' },
        { value: 'FACEBOOK', label: 'Meta / Facebook Ads' },
        { value: 'INDIAMART', label: 'IndiaMART' },
        { value: 'TRADEINDIA', label: 'TradeIndia' },
        { value: 'CUSTOM_WEBHOOK', label: 'Custom Generic Webhook' },
        ...availableProviders
          .filter(
            (p) =>
              !['FACEBOOK', 'INDIAMART', 'TRADEINDIA', 'CUSTOM_WEBHOOK'].includes(
                String(p.providerCode || p.code || '').toUpperCase()
              )
          )
          .map((p) => {
            const code = String(p.providerCode || p.code || '').toUpperCase();
            return {
              value: code,
              label: p.displayName || p.name || code,
            };
          }),
      ],
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      placeholder: 'All Statuses',
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'CONNECTED', label: 'Connected' },
        { value: 'PAUSED', label: 'Paused' },
        { value: 'ERROR', label: 'Error' },
      ],
    },
  ], [availableProviders]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: name === 'page' ? value : 0,
    }));
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
  };

  const filteredIntegrations = useMemo(() => {
    return rawIntegrations.filter((item) => {
      // 1. Search Query Filter
      if (filters.search?.trim()) {
        const q = filters.search.trim().toLowerCase();
        const matchesSearch =
          (item.integrationName && item.integrationName.toLowerCase().includes(q)) ||
          (item.connectionName && item.connectionName.toLowerCase().includes(q)) ||
          (item.providerCode && item.providerCode.toLowerCase().includes(q)) ||
          (item.channelCode && item.channelCode.toLowerCase().includes(q)) ||
          (item.webhookSlug && item.webhookSlug.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      // 2. Channel Filter
      if (filters.channel) {
        const code = String(item.providerCode || item.channelCode || '').toUpperCase();
        if (code !== filters.channel && !code.includes(filters.channel)) {
          return false;
        }
      }

      // 3. Status Filter
      if (filters.status) {
        const st = String(item.status || item.syncStatus || 'CONNECTED').toUpperCase();
        if (filters.status === 'CONNECTED') {
          if (st !== 'CONNECTED' && st !== 'ACTIVE') return false;
        } else if (st !== filters.status) {
          return false;
        }
      }

      return true;
    });
  }, [rawIntegrations, filters.search, filters.channel, filters.status]);

  const totalElements = filteredIntegrations.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / (filters.pageSize || 10)));
  const paginatedIntegrations = useMemo(() => {
    const start = filters.page * filters.pageSize;
    return filteredIntegrations.slice(start, start + filters.pageSize);
  }, [filteredIntegrations, filters.page, filters.pageSize]);

  const handleExport = () => {
    if (!filteredIntegrations || filteredIntegrations.length === 0) {
      dispatch(addAlert({ type: 'warning', message: 'No integrations to export.' }));
      return;
    }
    const headers = ['Integration Name', 'Channel', 'Auth Type', 'Status', 'Webhook URL', 'Last Synced'];
    const csvRows = [headers.join(',')];
    filteredIntegrations.forEach((item) => {
      const name = `"${(item.integrationName || item.connectionName || 'Lead Integration').replace(/"/g, '""')}"`;
      const code = item.providerCode || item.channelCode || 'WEBHOOK';
      const auth = item.authType || '';
      const status = item.status || item.syncStatus || 'CONNECTED';
      const slug = item.webhookSlug || item.id;
      const url = `"${(item.webhookUrl || `https://www.mark2.in/api/crm/integrations/webhook/${slug}`).replace(/"/g, '""')}"`;
      const lastSync = item.lastSyncedAt || item.lastSyncAt || '';
      csvRows.push([name, code, auth, status, url, `"${lastSync}"`].join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `crm-integrations-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    dispatch(addAlert({ type: 'success', message: `Exported ${filteredIntegrations.length} integrations to CSV.` }));
  };

  const handleOpenModal = (channelCode = null) => {
    if (!canManageIntegrations) return;
    setModalChannel(channelCode);
    setIsModalOpen(true);
  };

  const handleCopyWebhook = (item) => {
    const slug = item?.webhookSlug || item?.id;
    const url = item?.webhookUrl || `https://www.mark2.in/api/crm/integrations/webhook/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(item.id);
    dispatch(addAlert({ type: 'success', message: 'Webhook endpoint copied to clipboard.' }));
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleManualSync = async (integrationId) => {
    try {
      setSyncingId(integrationId);
      await triggerSync({ id: integrationId, companyId }).unwrap();
      dispatch(addAlert({ type: 'success', message: 'Manual sync triggered successfully.' }));
      refetch();
    } catch (err) {
      console.error('Manual sync failed', err);
      dispatch(addAlert({ type: 'error', message: err?.data?.message || err?.message || 'Manual sync failed.' }));
    } finally {
      setSyncingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    try {
      await deleteIntegration({ id: deleteItem.id, companyId }).unwrap();
      dispatch(addAlert({
        type: 'success',
        message: `Integration "${deleteItem.integrationName || deleteItem.connectionName}" deleted successfully.`
      }));
      setDeleteItem(null);
      refetch();
    } catch (err) {
      console.error('Delete integration failed', err);
      dispatch(addAlert({
        type: 'error',
        message: err?.data?.message || err?.message || 'Failed to delete integration.'
      }));
    }
  };

  const handleConfirmBatchDelete = async () => {
    if (!selectedRows || selectedRows.length === 0) return;
    try {
      await batchDeleteIntegrations({ ids: selectedRows, companyId }).unwrap();
      dispatch(addAlert({
        type: 'success',
        message: `${selectedRows.length} integration(s) deleted successfully.`
      }));
      setSelectedRows([]);
      setIsBatchDeleteOpen(false);
      refetch();
    } catch (err) {
      console.error('Batch delete failed', err);
      dispatch(addAlert({
        type: 'error',
        message: err?.data?.message || err?.message || 'Failed to delete selected integrations.'
      }));
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
      key: 'integrationName',
      id: 'integrationName',
      label: 'INTEGRATION & CHANNEL',
      sortable: true,
      className: 'min-w-[200px]',
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

        const rowLogo = item?.logoUrl || item?.safeCredentials?.logoUrl;
        return (
          <div className="flex items-center gap-2.5">
            <IntegrationProviderLogo code={code} logoUrl={rowLogo} size="sm" />
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-zinc-900 dark:text-white truncate">{name}</span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border shrink-0 ${badgeClass}`}>
                  {labelText}
                </span>
              </div>
              {item?.safeCredentials?.pageName && (
                <p className="text-[11px] text-zinc-500 truncate">Page: {item.safeCredentials.pageName}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      id: 'status',
      label: 'STATUS',
      sortable: true,
      className: 'w-36 whitespace-nowrap',
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
      key: 'webhookUrl',
      id: 'webhookUrl',
      label: 'WEBHOOK ENDPOINT',
      headerClassName: 'w-64 max-w-xs',
      className: 'w-64 max-w-xs',
      render: (val, item) => {
        const slug = item?.webhookSlug || item?.id;
        const url = item?.webhookUrl || `https://www.mark2.in/api/crm/integrations/webhook/${slug}`;
        const isCopied = copiedId === item?.id;

        return (
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-mono text-zinc-600 dark:text-[#A0A6B5] bg-zinc-100 dark:bg-[#1C202B] px-2 py-1 rounded max-w-[200px] truncate border border-zinc-200 dark:border-[#2A2F3D]"
              title={url}
            >
              {url}
            </span>
            <button
              type="button"
              onClick={() => handleCopyWebhook(item)}
              className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded hover:bg-zinc-100 dark:hover:bg-[#1C202B] transition-colors shrink-0 cursor-pointer"
              title="Copy endpoint"
            >
              {isCopied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            </button>
          </div>
        );
      },
    },
    {
      key: 'routing',
      id: 'routing',
      label: 'ROUTING RULES',
      className: 'w-36 whitespace-nowrap',
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
      icon: (row) => <RotateCw size={14} className={syncingId === row?.id ? 'animate-spin text-emerald-500' : ''} />,
      tooltip: 'Trigger Pull Sync / Refresh',
      onClick: (row) => handleManualSync(row.id),
    },
    ...(canManageIntegrations
      ? [
        {
          key: 'delete',
          label: 'Delete Integration',
          icon: <Trash2 size={14} />,
          tooltip: 'Delete Channel',
          danger: true,
          onClick: (row) => setDeleteItem(row),
        },
      ]
      : []),
  ], [canManageIntegrations, syncingId]);

  const bulkActions = useMemo(() => [
    ...(canManageIntegrations
      ? [
        {
          key: 'delete-selected',
          label: 'Delete Selected',
          icon: <Trash2 size={13} className="text-rose-500" />,
          className: 'text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30',
          onClick: () => setIsBatchDeleteOpen(true),
        },
      ]
      : []),
  ], [canManageIntegrations]);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <IntegrationsCampaignsHeader
        activeTab="integrations"
        title="Marketplace & Webhook Integrations"
        description="Automated 2-tier synchronized lead ingestion with strict RBAC"
        actions={
          <div className="flex items-center gap-2">
            {/* Layer 1: SystemAdmin Global Configuration button */}
            {Boolean(isSuperAdmin) && (
              <button
                type="button"
                onClick={() => navigate('/sales-crm/settings/providers')}
                className="btn-secondary flex items-center gap-1.5 text-xs font-semibold h-8 px-3 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] hover:bg-zinc-50 dark:hover:bg-[#1D212C] transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-500" />
                <span>Global Provider Defaults (SystemAdmin)</span>
              </button>
            )}

            {/* Layer 2: Tenant Connect Button */}
            {canManageIntegrations ? (
              <button
                type="button"
                onClick={() => handleOpenModal(null)}
                className="btn-primary flex items-center gap-1.5 text-xs font-semibold h-8 px-3.5 cursor-pointer rounded-lg shadow-sm"
              >
                <Plus size={15} />
                <span>Connect Channel</span>
              </button>
            ) : (
              <div
                className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-zinc-100 dark:bg-[#1C202B] text-zinc-400 text-xs font-medium border border-zinc-200 dark:border-[#2A2F3D] cursor-not-allowed"
                title="Requires CRM_INTEGRATIONS_MANAGE permission to connect or disconnect channels"
              >
                <Lock size={13} />
                <span>Connect Restricted</span>
              </div>
            )}
          </div>
        }
      />

      {/* Main Content Area: Focused Clean Table & Pagination (Matches Trial Balance) */}
      <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-5 min-h-0">
        <div className="flex-1 flex flex-col min-h-[300px]">
          <div className="flex-1 min-h-[300px]">
            <DataTable
              permissionFeature="CRM"
              selectable={false}
              showIndex={true}
              columns={columns}
              data={paginatedIntegrations}
              rowKey="id"
              loading={isLoading}
              isRefreshing={isFetching}
              onRefresh={refetch}
              searchable={true}
              searchValue={filters.search}
              onSearchChange={(val) => handleFilterChange('search', val)}
              searchPlaceholder="Search integrations..."
              basicFilters={basicFilters}
              filterValues={filters}
              onFilterChange={handleFilterChange}
              visibleColumns={visibleColumns}
              onVisibleColumnsChange={setVisibleColumns}
              onReset={handleResetFilters}
              onExport={handleExport}
              exportLabel="Export"
              rowActions={rowActions}
              pagination={{
                page: filters.page,
                pageSize: filters.pageSize,
                totalPages,
                totalElements,
              }}
              pageIndexBase={0}
              onPageChange={(p) => handleFilterChange('page', p)}
              onPageSizeChange={(s) => handleFilterChange('pageSize', s)}
              itemName="pipelines"
              emptyMessage="No active integrations configured"
              emptyDescription="Click '+ Connect Channel' above to configure Facebook Ads, IndiaMART, TradeIndia, or a custom webhook endpoint."
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

      {/* Delete Single Integration Confirmation Modal */}
      <ConfirmModal
        open={Boolean(deleteItem)}
        isOpen={Boolean(deleteItem)}
        onCancel={() => setDeleteItem(null)}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title="Delete Integration"
        message={`Are you sure you want to delete "${deleteItem?.integrationName || deleteItem?.connectionName}"? Real-time syncing and automated lead ingestion for this channel will be permanently removed.`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete Integration'}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Integration'}
        isDestructive={true}
        type="danger"
      />

      {/* Batch Delete Integrations Confirmation Modal */}
      <ConfirmModal
        open={isBatchDeleteOpen}
        isOpen={isBatchDeleteOpen}
        onCancel={() => setIsBatchDeleteOpen(false)}
        onClose={() => setIsBatchDeleteOpen(false)}
        onConfirm={handleConfirmBatchDelete}
        loading={isBatchDeleting}
        title="Delete Selected Integrations"
        message={`Are you sure you want to delete ${selectedRows.length} selected integration channel(s)? Real-time syncing and automated lead ingestion for these channels will be permanently removed.`}
        confirmLabel={isBatchDeleting ? 'Deleting...' : `Delete (${selectedRows.length})`}
        confirmText={isBatchDeleting ? 'Deleting...' : `Delete (${selectedRows.length})`}
        isDestructive={true}
        type="danger"
      />
    </div>
  );
}
