import React, { useState } from 'react';
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
import { PageHeader, Tabs, ConfirmModal } from '../../../components/common';
import DataTable from '../../../components/data-table/DataTable';
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

  const { data: rulesRes, isLoading: isRulesLoading, refetch: refetchRules } = useGetCrmAutomationRulesQuery(companyId);
  const { data: poolsRes, isLoading: isPoolsLoading, refetch: refetchPools } = useGetCrmRoundRobinPoolsQuery(companyId);
  const { data: logsRes, isLoading: isLogsLoading } = useGetCrmAutomationLogsQuery({ companyId });

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

  const ruleColumns = [
    {
      header: 'Rule Name & Trigger',
      accessorKey: 'ruleName',
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="space-y-0.5">
            <span className="font-semibold text-xs text-zinc-900 dark:text-white block">{r.ruleName}</span>
            <span className="text-[11px] font-mono text-zinc-500 uppercase">{r.triggerEvent}</span>
          </div>
        );
      },
    },
    {
      header: 'Condition Expression (SpEL)',
      accessorKey: 'conditionExpression',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-zinc-700 dark:text-[#A0A6B5] bg-zinc-100 dark:bg-[#1C202B] px-2 py-0.5 rounded">
          {row.original.conditionExpression || 'Always True (Default)'}
        </span>
      ),
    },
    {
      header: 'Automated Action',
      accessorKey: 'actionType',
      cell: ({ row }) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary">
          {row.original.actionType?.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      header: 'Active State',
      accessorKey: 'isActive',
      cell: ({ row }) => {
        const active = row.original.isActive;
        return (
          <button
            onClick={() => handleToggleActive(row.original)}
            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-zinc-100 text-zinc-500'
            }`}
          >
            {active ? 'ACTIVE' : 'PAUSED'}
          </button>
        );
      },
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={() => setDeletingRule(row.original)}
            className="p-1.5 text-zinc-400 hover:text-rose-500 rounded"
            title="Delete Rule"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  const poolColumns = [
    {
      header: 'Pool Name',
      accessorKey: 'poolName',
      cell: ({ row }) => (
        <span className="font-semibold text-xs text-zinc-900 dark:text-white">
          {row.original.poolName}
        </span>
      ),
    },
    {
      header: 'Routing Strategy',
      accessorKey: 'routingStrategy',
      cell: ({ row }) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-100 dark:bg-[#1C202B] text-zinc-700 dark:text-[#E6E8EE]">
          {row.original.routingStrategy}
        </span>
      ),
    },
    {
      header: 'Active Reps',
      accessorKey: 'members',
      cell: ({ row }) => (
        <span className="text-xs text-zinc-700 dark:text-[#A0A6B5]">
          {(row.original.members || []).length} Sales Reps
        </span>
      ),
    },
  ];

  const logColumns = [
    {
      header: 'Trigger Event',
      accessorKey: 'triggerEvent',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-white">
          {row.original.triggerEvent}
        </span>
      ),
    },
    {
      header: 'Action Executed',
      accessorKey: 'actionType',
      cell: ({ row }) => (
        <span className="text-xs text-primary font-medium">{row.original.actionType}</span>
      ),
    },
    {
      header: 'Result Status',
      accessorKey: 'executionStatus',
      cell: ({ row }) => {
        const success = row.original.executionStatus === 'SUCCESS';
        return (
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
            success ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
          }`}>
            {row.original.executionStatus || 'SUCCESS'}
          </span>
        );
      },
    },
    {
      header: 'Timestamp',
      accessorKey: 'createdAt',
      cell: ({ row }) => (
        <span className="text-xs text-zinc-500 font-mono">
          {new Date(row.original.createdAt || Date.now()).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Sales Automation & Round-Robin Routing"
        subtitle="Event-driven workflows, dynamic lead assignment pools, and execution audit history."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPoolModalOpen(true)}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <Users size={13} /> New Sales Pool
            </button>
            <button
              onClick={() => setIsRuleModalOpen(true)}
              className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5"
            >
              <Plus size={14} /> New Automation Rule
            </button>
          </div>
        }
      />

      <div className="p-3 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-sm">
        <Tabs
          tabs={[
            { id: 'rules', label: `Automation Rules (${rules.length})` },
            { id: 'pools', label: `Round-Robin Pools (${pools.length})` },
            { id: 'logs', label: `Execution Audit Trail (${logs.length})` },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {activeTab === 'rules' && (
        <DataTable
          data={rules}
          columns={ruleColumns}
          isLoading={isRulesLoading}
          enablePagination={true}
        />
      )}

      {activeTab === 'pools' && (
        <DataTable
          data={pools}
          columns={poolColumns}
          isLoading={isPoolsLoading}
          enablePagination={true}
        />
      )}

      {activeTab === 'logs' && (
        <DataTable
          data={logs}
          columns={logColumns}
          isLoading={isLogsLoading}
          enablePagination={true}
        />
      )}

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

