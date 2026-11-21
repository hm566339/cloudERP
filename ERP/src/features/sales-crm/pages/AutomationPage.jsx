import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Cpu,
  Plus,
  Users,
  CheckCircle2,
  Trash2,
  Edit2,
  Play,
  RotateCw,
  Clock,
  Layers
} from 'lucide-react';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs from '../../../components/module-tabs';
import ConfirmModal from '../../../components/common/ConfirmModal';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import {
  useGetCrmAutomationRulesQuery,
  useGetCrmRoundRobinPoolsQuery,
  useGetCrmAutomationLogsQuery,
  useDeleteCrmAutomationRuleMutation,
  useUpdateCrmAutomationRuleMutation,
} from '../../../api/sales-crm/crm.api';
import AutomationRuleModal from '../components/AutomationRuleModal';
import RoundRobinPoolModal from '../components/RoundRobinPoolModal';

export default function AutomationPage() {
  const { companyId } = useParams();
  const [activeTab, setActiveTab] = useState('rules');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);
  const [deletingRule, setDeletingRule] = useState(null);

  const { data: rulesRes, isLoading: isRulesLoading, refetch: refetchRules, isFetching: isRulesFetching } = useGetCrmAutomationRulesQuery(companyId);
  const { data: poolsRes, isLoading: isPoolsLoading, refetch: refetchPools, isFetching: isPoolsFetching } = useGetCrmRoundRobinPoolsQuery(companyId);
  const { data: logsRes, isLoading: isLogsLoading, refetch: refetchLogs, isFetching: isLogsFetching } = useGetCrmAutomationLogsQuery({ companyId });

  const [deleteRule, { isLoading: isDeletingRule }] = useDeleteCrmAutomationRuleMutation();
  const [updateRule] = useUpdateCrmAutomationRuleMutation();

  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.content)) return res.data.content;
    return [];
  };

  const rules = toArray(rulesRes);
  const pools = toArray(poolsRes);
  const logs = toArray(logsRes);

  const automationTabs = useMemo(() => [
    {
      key: 'rules',
      label: `Automation Rules (${rules.length})`,
      icon: Cpu,
    },
    {
      key: 'pools',
      label: `Round-Robin Pools (${pools.length})`,
      icon: Users,
    },
    {
      key: 'logs',
      label: `Audit Logs (${logs.length})`,
      icon: Clock,
    },
  ], [rules.length, pools.length, logs.length]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setSearch('');
    setPage(0);
  };

  const handleDeleteRuleConfirm = async () => {
    if (!deletingRule) return;
    try {
      await deleteRule({ id: deletingRule.id, companyId }).unwrap();
      setDeletingRule(null);
      refetchRules();
    } catch (err) {
      console.error('Failed to delete rule', err);
    }
  };

  const handleToggleActive = async (rule) => {
    try {
      await updateRule({
        id: rule.id,
        companyId,
        data: {
          ...rule,
          isActive: !rule.isActive,
        },
      }).unwrap();
      refetchRules();
    } catch (err) {
      console.error('Failed to update rule status', err);
    }
  };

  const ruleColumns = useMemo(() => [
    {
      id: 'ruleName',
      label: 'RULE NAME & TRIGGER',
      sortable: true,
      headerClassName: 'min-w-[220px]',
      className: 'min-w-[220px]',
      render: (val, r) => (
        <div className="space-y-0.5">
          <span className="font-semibold text-xs text-zinc-900 dark:text-white block">{r?.ruleName || val}</span>
          <span className="text-[11px] font-mono text-zinc-500 uppercase">{r?.triggerEvent}</span>
        </div>
      ),
    },
    {
      id: 'conditionExpression',
      label: 'CONDITION EXPRESSION (SPEL)',
      sortable: true,
      headerClassName: 'min-w-[240px]',
      className: 'min-w-[240px]',
      render: (val, r) => (
        <span className="font-mono text-xs text-zinc-700 dark:text-[#A0A6B5] bg-zinc-100 dark:bg-[#1C202B] px-2 py-0.5 rounded border border-zinc-200 dark:border-[#2A2F3D]">
          {r?.conditionExpression || val || 'Always True (Default)'}
        </span>
      ),
    },
    {
      id: 'actionType',
      label: 'AUTOMATED ACTION',
      sortable: true,
      headerClassName: 'w-44',
      className: 'w-44 whitespace-nowrap',
      render: (val, r) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary">
          {(r?.actionType || val)?.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      id: 'isActive',
      label: 'ACTIVE STATE',
      sortable: true,
      headerClassName: 'w-36',
      className: 'w-36 whitespace-nowrap',
      render: (val, r) => {
        const active = r?.isActive ?? val;
        return (
          <button
            type="button"
            onClick={() => handleToggleActive(r)}
            className="cursor-pointer focus:outline-none"
          >
            <DataTableStatusBadge
              status={active ? 'ACTIVE' : 'PAUSED'}
              variant={active ? 'success' : 'neutral'}
            />
          </button>
        );
      },
    },
  ], []);

  const ruleActions = useMemo(() => [
    {
      key: 'delete',
      label: 'Delete Rule',
      icon: Trash2,
      danger: true,
      tooltip: 'Delete Rule',
      onClick: (row) => setDeletingRule(row),
    },
  ], []);

  const poolColumns = useMemo(() => [
    {
      id: 'poolName',
      label: 'POOL NAME',
      sortable: true,
      headerClassName: 'min-w-[220px]',
      className: 'min-w-[220px]',
      render: (val, r) => (
        <span className="font-semibold text-xs text-zinc-900 dark:text-white">
          {r?.poolName || val}
        </span>
      ),
    },
    {
      id: 'routingStrategy',
      label: 'ROUTING STRATEGY',
      sortable: true,
      headerClassName: 'w-48',
      className: 'w-48 whitespace-nowrap',
      render: (val, r) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-100 dark:bg-[#1C202B] text-zinc-700 dark:text-[#E6E8EE] border border-zinc-200 dark:border-[#2A2F3D]">
          {r?.routingStrategy || val}
        </span>
      ),
    },
    {
      id: 'members',
      label: 'ACTIVE REPS',
      sortable: true,
      headerClassName: 'w-44',
      className: 'w-44 whitespace-nowrap',
      render: (val, r) => (
        <span className="text-xs text-zinc-700 dark:text-[#A0A6B5]">
          {(r?.members || []).length} Sales Reps
        </span>
      ),
    },
  ], []);

  const logColumns = useMemo(() => [
    {
      id: 'triggerEvent',
      label: 'TRIGGER EVENT',
      sortable: true,
      headerClassName: 'min-w-[200px]',
      className: 'min-w-[200px]',
      render: (val, r) => (
        <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-white">
          {r?.triggerEvent || val}
        </span>
      ),
    },
    {
      id: 'actionType',
      label: 'ACTION EXECUTED',
      sortable: true,
      headerClassName: 'w-48',
      className: 'w-48 whitespace-nowrap',
      render: (val, r) => (
        <span className="text-xs text-primary font-medium">{r?.actionType || val}</span>
      ),
    },
    {
      id: 'executionStatus',
      label: 'RESULT STATUS',
      sortable: true,
      headerClassName: 'w-36',
      className: 'w-36 whitespace-nowrap',
      render: (val, r) => {
        const s = r?.executionStatus || val;
        const success = s === 'SUCCESS';
        return (
          <DataTableStatusBadge
            status={s || 'SUCCESS'}
            variant={success ? 'success' : 'danger'}
          />
        );
      },
    },
    {
      id: 'createdAt',
      label: 'TIMESTAMP',
      sortable: true,
      headerClassName: 'w-48',
      className: 'w-48 whitespace-nowrap',
      render: (val, r) => (
        <span className="text-xs text-zinc-500 font-mono">
          {r?.createdAt || val ? new Date(r?.createdAt || val).toLocaleString() : '-'}
        </span>
      ),
    },
  ], []);

  // Filtered & Paginated records
  const filteredRules = useMemo(() => {
    if (!search.trim()) return rules;
    const q = search.trim().toLowerCase();
    return rules.filter(
      (r) =>
        (r?.ruleName && r.ruleName.toLowerCase().includes(q)) ||
        (r?.triggerEvent && r.triggerEvent.toLowerCase().includes(q)) ||
        (r?.conditionExpression && r.conditionExpression.toLowerCase().includes(q)) ||
        (r?.actionType && r.actionType.toLowerCase().includes(q))
    );
  }, [rules, search]);

  const filteredPools = useMemo(() => {
    if (!search.trim()) return pools;
    const q = search.trim().toLowerCase();
    return pools.filter(
      (p) =>
        (p?.poolName && p.poolName.toLowerCase().includes(q)) ||
        (p?.routingStrategy && p.routingStrategy.toLowerCase().includes(q))
    );
  }, [pools, search]);

  const filteredLogs = useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.trim().toLowerCase();
    return logs.filter(
      (l) =>
        (l?.triggerEvent && l.triggerEvent.toLowerCase().includes(q)) ||
        (l?.actionType && l.actionType.toLowerCase().includes(q)) ||
        (l?.executionStatus && l.executionStatus.toLowerCase().includes(q))
    );
  }, [logs, search]);

  const currentList = activeTab === 'rules' ? filteredRules : activeTab === 'pools' ? filteredPools : filteredLogs;
  const totalElements = currentList.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / (pageSize || 10)));
  const paginatedList = useMemo(() => {
    const start = page * pageSize;
    return currentList.slice(start, start + pageSize);
  }, [currentList, page, pageSize]);

  const handleReset = () => {
    setSearch('');
    setPage(0);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      {/* 1. Page Header (Matches Trial Balance specs) */}
      <PageHeader
        title="Sales Automation & Round-Robin Routing"
        description="Event-driven workflows, dynamic lead assignment pools, and execution audit history"
        icon={Cpu}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPoolModalOpen(true)}
              className="btn-secondary flex items-center gap-1.5 text-xs font-semibold h-8 px-3 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] hover:bg-zinc-50 dark:hover:bg-[#1D212C] transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span>New Sales Pool</span>
            </button>
            <button
              type="button"
              onClick={() => setIsRuleModalOpen(true)}
              className="btn-primary flex items-center gap-1.5 text-xs font-semibold h-8 px-3.5 cursor-pointer rounded-lg shadow-sm"
            >
              <Plus size={15} />
              <span>New Automation Rule</span>
            </button>
          </div>
        }
      />

      {/* 2. Common Enterprise Module Tabs */}
      <ModuleTabs
        tabs={automationTabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* 3. Main Content Area (Matches Trial Balance layout & height) */}
      <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-5 min-h-0">
        <div className="flex-1 flex flex-col min-h-[300px]">
          <div className="flex-1 min-h-[300px]">
            {activeTab === 'rules' && (
              <DataTable
                permissionFeature="CRM"
                selectable={false}
                showIndex={true}
                searchable={true}
                searchValue={search}
                onSearchChange={(val) => {
                  setSearch(val);
                  setPage(0);
                }}
                searchPlaceholder="Search automation rules..."
                onReset={handleReset}
                columns={ruleColumns}
                data={paginatedList}
                rowKey="id"
                loading={isRulesLoading}
                isRefreshing={isRulesFetching}
                onRefresh={refetchRules}
                rowActions={ruleActions}
                pagination={{
                  page,
                  pageSize,
                  totalPages,
                  totalElements,
                }}
                pageIndexBase={0}
                onPageChange={setPage}
                onPageSizeChange={(s) => {
                  setPageSize(s);
                  setPage(0);
                }}
                itemName="rules"
                emptyMessage="No automation rules found"
                emptyDescription="Create automated trigger-action rules for inbound leads and events."
              />
            )}

            {activeTab === 'pools' && (
              <DataTable
                permissionFeature="CRM"
                selectable={false}
                showIndex={true}
                searchable={true}
                searchValue={search}
                onSearchChange={(val) => {
                  setSearch(val);
                  setPage(0);
                }}
                searchPlaceholder="Search sales pools..."
                onReset={handleReset}
                columns={poolColumns}
                data={paginatedList}
                rowKey="id"
                loading={isPoolsLoading}
                isRefreshing={isPoolsFetching}
                onRefresh={refetchPools}
                pagination={{
                  page,
                  pageSize,
                  totalPages,
                  totalElements,
                }}
                pageIndexBase={0}
                onPageChange={setPage}
                onPageSizeChange={(s) => {
                  setPageSize(s);
                  setPage(0);
                }}
                itemName="pools"
                emptyMessage="No round-robin pools configured"
                emptyDescription="Define sales rep pools for automatic lead distribution."
              />
            )}

            {activeTab === 'logs' && (
              <DataTable
                permissionFeature="CRM"
                selectable={false}
                showIndex={true}
                searchable={true}
                searchValue={search}
                onSearchChange={(val) => {
                  setSearch(val);
                  setPage(0);
                }}
                searchPlaceholder="Search audit logs..."
                onReset={handleReset}
                columns={logColumns}
                data={paginatedList}
                rowKey="id"
                loading={isLogsLoading}
                isRefreshing={isLogsFetching}
                onRefresh={refetchLogs}
                pagination={{
                  page,
                  pageSize,
                  totalPages,
                  totalElements,
                }}
                pageIndexBase={0}
                onPageChange={setPage}
                onPageSizeChange={(s) => {
                  setPageSize(s);
                  setPage(0);
                }}
                itemName="logs"
                emptyMessage="No audit logs found"
                emptyDescription="Execution events from automated triggers will appear here."
              />
            )}
          </div>
        </div>
      </div>

      <AutomationRuleModal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        companyId={companyId}
        pools={pools}
        onSuccess={() => refetchRules()}
      />

      <RoundRobinPoolModal
        isOpen={isPoolModalOpen}
        onClose={() => setIsPoolModalOpen(false)}
        companyId={companyId}
        onSuccess={() => refetchPools()}
      />

      <ConfirmModal
        open={Boolean(deletingRule)}
        isOpen={Boolean(deletingRule)}
        onCancel={() => setDeletingRule(null)}
        onClose={() => setDeletingRule(null)}
        onConfirm={handleDeleteRuleConfirm}
        loading={isDeletingRule}
        title="Delete Automation Rule"
        message={`Are you sure you want to delete automation rule "${deletingRule?.ruleName}"? This rule will no longer be evaluated on inbound events.`}
        confirmLabel={isDeletingRule ? 'Deleting...' : 'Delete Rule'}
        confirmText={isDeletingRule ? 'Deleting...' : 'Delete Rule'}
        isDestructive={true}
        type="danger"
        variant="danger"
      />
    </div>
  );
}
