import React, { useState } from 'react';
import { Modal } from '../../../components/common';
import { Users, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useCreateCrmRoundRobinPoolMutation } from '../../../api/sales-crm/crm.api';

export default function RoundRobinPoolModal({
  isOpen,
  onClose,
  companyId,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    poolName: '',
    routingStrategy: 'ROUND_ROBIN',
    isActive: true,
  });

  const [members, setMembers] = useState([
    { userId: 'USR-001', userName: 'Senior Sales Rep A', weight: 1, dailyCapacityLimit: 25 },
    { userId: 'USR-002', userName: 'Sales Executive B', weight: 1, dailyCapacityLimit: 20 },
  ]);

  const [errorMsg, setErrorMsg] = useState(null);
  const [createPool, { isLoading }] = useCreateCrmRoundRobinPoolMutation();

  const handleMemberChange = (index, field, value) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
  };

  const addMember = () => {
    setMembers([
      ...members,
      {
        userId: `USR-${Date.now().toString().slice(-4)}`,
        userName: 'New Sales Rep',
        weight: 1,
        dailyCapacityLimit: 20,
      },
    ]);
  };

  const removeMember = (index) => {
    if (members.length <= 1) return;
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.poolName.trim()) {
      setErrorMsg('Pool name is required.');
      return;
    }

    try {
      setErrorMsg(null);
      await createPool({
        companyId,
        data: {
          poolName: formData.poolName.trim(),
          routingStrategy: formData.routingStrategy,
          isActive: formData.isActive,
          members: members.map((m) => ({
            userId: m.userId,
            userName: m.userName,
            weight: Number(m.weight) || 1,
            dailyCapacityLimit: Number(m.dailyCapacityLimit) || 20,
          })),
        },
      }).unwrap();
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMsg(err?.data?.message || err.message || 'Failed to create sales pool');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Round-Robin Sales Pool"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
              Pool Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. West Region Inbound Sales"
              value={formData.poolName}
              onChange={(e) => setFormData({ ...formData, poolName: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
              Routing Strategy
            </label>
            <select
              value={formData.routingStrategy}
              onChange={(e) => setFormData({ ...formData, routingStrategy: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
            >
              <option value="ROUND_ROBIN">Strict Round-Robin (Equal Turn)</option>
              <option value="WEIGHTED_CAPACITY">Weighted by Experience / Capacity</option>
              <option value="LEAST_RECENTLY_ASSIGNED">Least Recently Assigned First</option>
            </select>
          </div>
        </div>

        {/* Member Allocation */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] flex items-center gap-1.5">
              <Users size={14} /> Pool Members & Daily Limits ({members.length})
            </label>
            <button
              type="button"
              onClick={addMember}
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              <Plus size={13} /> Add Rep
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {members.map((m, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg"
              >
                <input
                  type="text"
                  required
                  placeholder="Rep Name"
                  value={m.userName}
                  onChange={(e) => handleMemberChange(idx, 'userName', e.target.value)}
                  className="flex-1 px-2.5 py-1 text-xs rounded border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1C202B] text-zinc-800 dark:text-[#E6E8EE]"
                />
                <div className="flex items-center gap-1 w-24">
                  <span className="text-[10px] text-zinc-500">Weight:</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={m.weight}
                    onChange={(e) => handleMemberChange(idx, 'weight', e.target.value)}
                    className="w-10 px-1 py-1 text-xs rounded border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1C202B] text-zinc-800 dark:text-[#E6E8EE] text-center"
                  />
                </div>
                <div className="flex items-center gap-1 w-28">
                  <span className="text-[10px] text-zinc-500">Max/day:</span>
                  <input
                    type="number"
                    min="1"
                    value={m.dailyCapacityLimit}
                    onChange={(e) => handleMemberChange(idx, 'dailyCapacityLimit', e.target.value)}
                    className="w-12 px-1 py-1 text-xs rounded border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1C202B] text-zinc-800 dark:text-[#E6E8EE] text-center"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeMember(idx)}
                  disabled={members.length <= 1}
                  className="p-1 text-zinc-400 hover:text-rose-500 disabled:opacity-30"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
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
            className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5"
          >
            <Users size={13} />
            {isLoading ? 'Saving...' : 'Save Pool'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

