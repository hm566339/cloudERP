import React, { useState } from 'react';
import { Modal } from '../../../components/common';
import { useAssignLeadMutation, useGetCrmRoundRobinPoolsQuery } from '../../../api/sales-crm/crm.api';

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

  const { data: poolsData } = useGetCrmRoundRobinPoolsQuery(companyId);
  const pools = poolsData?.data || [];

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
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
              Select Sales Representative *
            </label>
            <select
              required
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
            >
              <option value="">Select user...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
              Select Routing Pool *
            </label>
            <select
              required
              value={selectedPoolId}
              onChange={(e) => setSelectedPoolId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
            >
              <option value="">Select pool...</option>
              {pools.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.poolName} ({p.routingStrategy})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A0A6B5] mb-1">
            Reason / Assignment Remarks
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE] focus:ring-1 focus:ring-primary focus:outline-hidden"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-[#2A2F3D]">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs px-3.5 py-1.5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary text-xs px-4 py-1.5"
          >
            {isLoading ? 'Assigning...' : 'Confirm Assignment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

