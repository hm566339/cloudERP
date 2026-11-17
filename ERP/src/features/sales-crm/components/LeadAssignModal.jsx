import React, { useState, useMemo } from 'react';
import { Modal, FormField, Input, Select, Button } from '../../../components/common';
import { useAssignLeadMutation, useGetCrmRoundRobinPoolsQuery } from '../../../api/sales-crm/crm.api';

const toArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.content)) return res.data.content;
  return [];
};

export default function LeadAssignModal({
  isOpen,
  onClose,
  lead,
  companyId,
  users = [],
  onSuccess,
}) {
  const [mode, setMode] = useState('direct'); // 'direct' | 'round_robin'
  const [targetUserId, setTargetUserId] = useState('');
  const [selectedPoolId, setSelectedPoolId] = useState('');
  const [reason, setReason] = useState('Manual reassignment');

  const { data: poolsData } = useGetCrmRoundRobinPoolsQuery(companyId, { skip: !isOpen });
  const pools = useMemo(() => toArray(poolsData), [poolsData]);

  const currentAuth = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user'));
    } catch {
      return null;
    }
  }, []);

  const availableUsers = useMemo(() => {
    if (users && users.length > 0) return users;
    if (currentAuth?.id) {
      return [{ id: currentAuth.id, name: currentAuth.fullName || currentAuth.username || 'Current User (You)' }];
    }
    return [{ id: 'CURRENT_USER', name: 'Current Sales Representative' }];
  }, [users, currentAuth]);

  const [assignLead, { isLoading }] = useAssignLeadMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lead?.id) return;

    try {
      await assignLead({
        id: lead.id,
        targetUserId: targetUserId || undefined,
        reason,
        companyId,
      }).unwrap();
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to assign lead:', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reassign Lead Ownership"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex rounded-lg bg-zinc-100 dark:bg-[#161922] p-1 border border-zinc-200 dark:border-[#2A2F3D]">
          <button
            type="button"
            onClick={() => setMode('direct')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mode === 'direct'
                ? 'bg-white dark:bg-[#1D212C] text-zinc-900 dark:text-[#E6E8EE] shadow-2xs'
                : 'text-zinc-600 dark:text-[#A0A6B5]'
            }`}
          >
            Direct Assignee
          </button>
          <button
            type="button"
            onClick={() => setMode('round_robin')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mode === 'round_robin'
                ? 'bg-white dark:bg-[#1D212C] text-zinc-900 dark:text-[#E6E8EE] shadow-2xs'
                : 'text-zinc-600 dark:text-[#A0A6B5]'
            }`}
          >
            Round Robin Pool
          </button>
        </div>

        {mode === 'direct' ? (
          <FormField label="Select Sales Representative" required>
            <Select
              required
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
            >
              <option value="">Select user...</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.fullName || u.email || u.username}
                </option>
              ))}
            </Select>
          </FormField>
        ) : (
          <FormField label="Select Routing Pool" required>
            <Select
              required
              value={selectedPoolId}
              onChange={(e) => setSelectedPoolId(e.target.value)}
            >
              <option value="">Select pool...</option>
              {pools.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.poolName} ({p.routingStrategy})
                </option>
              ))}
            </Select>
          </FormField>
        )}

        <FormField label="Reason / Assignment Remarks">
          <Input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </FormField>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-[#2A2F3D]">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={isLoading}
          >
            Confirm Assignment
          </Button>
        </div>
      </form>
    </Modal>
  );
}

