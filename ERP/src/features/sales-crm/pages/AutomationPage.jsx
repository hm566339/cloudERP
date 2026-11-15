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
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);
  const [deletingRule, setDeletingRule] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  const { data: rulesRes, isLoading: isRulesLoading, refetch: refetchRules } = useGetCrmAutomationRulesQuery(companyId);
  const { data: poolsRes, isLoading: isPoolsLoading, refetch: refetchPools } = useGetCrmRoundRobinPoolsQuery(companyId);
  const { data: logsRes, isLoading: isLogsLoading, refetch: refetchLogs } = useGetCrmAutomationLogsQuery({ companyId });

  const [deleteRule] = useDeleteCrmAutomationRuleMutation();
  const [updateRule] = useUpdateCrmAutomationRuleMutation();

  const rules = rulesRes?.data || [];
  const pools = poolsRes?.data || [];
  const logs = logsRes?.data?.content || logsRes?.data || [];

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
      label: 'Rule Name & Trigger',
      sortable: true,
      render: (val, r) => (
        <div className="space-y-0.5">
          <span className="font-semibold text-xs text-zinc-900 dark:text-white block">{r?.ruleName || val}</span>
          <span className="text-[11px] font-mono text-zinc-500 uppercase">{r?.triggerEvent}</span>
        </div>
      ),
    },
    {
      id: 'conditionExpression',
      label: 'Condition Expression (SpEL)',
      sortable: true,
      render: (val, r) => (
        <span className="font-mono text-xs text-zinc-700 dark:text-[#A0A6B5] bg-zinc-100 dark:bg-[#1C202B] px-2 py-0.5 rounded">
          {r?.conditionExpression || val || 'Always True (Default)'}
        </span>
      ),
    },
    {
      id: 'actionType',
      label: 'Automated Action',
      sortable: true,
      render: (val, r) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary">
          {(r?.actionType || val)?.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      id: 'isActive',
      label: 'Active State',
      sortable: true,
      render: (val, r) => {
        const active = r?.isActive ?? val;
        return (
          <button
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
      label: 'Pool Name',
      sortable: true,
      render: (val, r) => (
        <span className="font-semibold text-xs text-zinc-900 dark:text-white">
          {r?.poolName || val}
        </span>
      ),
    },
    {
      id: 'routingStrategy',
      label: 'Routing Strategy',
      sortable: true,
      render: (val, r) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-100 dark:bg-[#1C202B] text-zinc-700 dark:text-[#E6E8EE]">
          {r?.routingStrategy || val}
        </span>
      ),
    },
    {
      id: 'members',
      label: 'Active Reps',
      sortable: true,
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
      label: 'Trigger Event',
      sortable: true,
      render: (val, r) => (
        <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-white">
          {r?.triggerEvent || val}
        </span>
      ),
    },
    {
      id: 'actionType',
      label: 'Action Executed',
      sortable: true,
      render: (val, r) => (
        <span className="text-xs text-primary font-medium">{r?.actionType || val}</span>
      ),
    },
    {
      id: 'executionStatus',
      label: 'Result Status',
      sortable: true,
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
      label: 'Timestamp',
      sortable: true,
      render: (val, r) => (
        <span className="text-xs text-zinc-500 font-mono">
          {r?.createdAt || val ? new Date(r?.createdAt || val).toLocaleString() : '-'}
        </span>
      ),
    },
  ], []);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <PageHeader
        title="Sales Automation & Round-Robin Routing"
        description="Event-driven workflows, dynamic lead assignment pools, and execution audit history"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPoolModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-300 dark:border-[#2A2F3D] text-zinc-700 dark:text-[#E6E8EE] hover:bg-zinc-100 dark:hover:bg-[#1C202B] text-xs font-semibold rounded-lg shadow-sm transition-all active:scale-95"
          >
            <Users className="w-3.5 h-3.5" />
            <span>New Sales Pool</span>
          </button>
          <button
            onClick={() => setIsRuleModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-primary-500/20 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Automation Rule</span>
          </button>
        </div>
      </PageHeader>

      {/* Tabs bar */}
      <div className="px-6 py-2.5 bg-white dark:bg-[#161922] border-b border-zinc-200 dark:border-[#2A2F3D] flex items-center gap-2 shrink-0">
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'rules'
              ? 'bg-primary text-white shadow-sm'
              : 'text-zinc-600 dark:text-[#A0A6B5] hover:bg-zinc-100 dark:hover:bg-[#1C202B]'
          }`}
        >
          <Cpu size={13} /> Automation Rules ({rules.length})
        </button>
        <button
          onClick={() => setActiveTab('pools')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'pools'
              ? 'bg-primary text-white shadow-sm'
              : 'text-zinc-600 dark:text-[#A0A6B5] hover:bg-zinc-100 dark:hover:bg-[#1C202B]'
          }`}
        >
          <Users size={13} /> Round-Robin Pools ({pools.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'logs'
              ? 'bg-primary text-white shadow-sm'
              : 'text-zinc-600 dark:text-[#A0A6B5] hover:bg-zinc-100 dark:hover:bg-[#1C202B]'
          }`}
        >
          <Clock size={13} /> Audit Logs ({logs.length})
        </button>
      </div>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        {activeTab === 'rules' && (
          <DataTable
            permissionFeature="CRM"
            selectable
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
            columns={ruleColumns}
            data={rules}
            rowKey="id"
            loading={isRulesLoading}
            onRefresh={refetchRules}
            rowActions={ruleActions}
            itemName="rules"
            emptyMessage="No automation rules found"
            emptyDescription="Create automated trigger-action rules for inbound leads and events."
          />
        )}

        {activeTab === 'pools' && (
          <DataTable
            permissionFeature="CRM"
            selectable
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
            columns={poolColumns}
            data={pools}
            rowKey="id"
            loading={isPoolsLoading}
            onRefresh={refetchPools}
            itemName="pools"
            emptyMessage="No round-robin pools configured"
            emptyDescription="Define sales rep pools for automatic lead distribution."
          />
        )}

        {activeTab === 'logs' && (
          <DataTable
            permissionFeature="CRM"
            columns={logColumns}
            data={logs}
            rowKey="id"
            loading={isLogsLoading}
            onRefresh={refetchLogs}
            itemName="logs"
            emptyMessage="No audit logs found"
            emptyDescription="Execution events from automated triggers will appear here."
          />
        )}
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
        isOpen={!!deletingRule}
        onClose={() => setDeletingRule(null)}
        onConfirm={handleDeleteRuleConfirm}
        title="Delete Automation Rule"
        message={`Delete automation rule "${deletingRule?.ruleName}"? This rule will no longer be evaluated on inbound events.`}
        confirmText="Delete Rule"
        variant="danger"
      />
    </div>
  );
}
