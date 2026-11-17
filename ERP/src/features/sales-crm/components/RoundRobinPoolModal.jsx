import React, { useState } from 'react';
import { Modal, FormField, Input, Select, Button } from '../../../components/common';
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
          <FormField label="Pool Name" required>
            <Input
              type="text"
              required
              placeholder="e.g. West Region Inbound Sales"
              value={formData.poolName}
              onChange={(e) => setFormData({ ...formData, poolName: e.target.value })}
            />
          </FormField>

          <FormField label="Routing Strategy">
            <Select
              value={formData.routingStrategy}
              onChange={(e) => setFormData({ ...formData, routingStrategy: e.target.value })}
            >
              <option value="ROUND_ROBIN">Strict Round-Robin (Equal Turn)</option>
              <option value="WEIGHTED_CAPACITY">Weighted by Experience / Capacity</option>
              <option value="LEAST_RECENTLY_ASSIGNED">Least Recently Assigned First</option>
            </Select>
          </FormField>
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
                <div className="flex-1">
                  <Input
                    size="sm"
                    type="text"
                    required
                    placeholder="Rep Name"
                    value={m.userName}
                    onChange={(e) => handleMemberChange(idx, 'userName', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-1 w-24">
                  <span className="text-[10px] text-zinc-500">Weight:</span>
                  <Input
                    size="sm"
                    type="number"
                    min="1"
                    max="10"
                    value={m.weight}
                    onChange={(e) => handleMemberChange(idx, 'weight', e.target.value)}
                    className="w-12 text-center"
                  />
                </div>
                <div className="flex items-center gap-1 w-28">
                  <span className="text-[10px] text-zinc-500">Max/day:</span>
                  <Input
                    size="sm"
                    type="number"
                    min="1"
                    value={m.dailyCapacityLimit}
                    onChange={(e) => handleMemberChange(idx, 'dailyCapacityLimit', e.target.value)}
                    className="w-14 text-center"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeMember(idx)}
                  disabled={members.length <= 1}
                  className="p-1 text-zinc-400 hover:text-rose-500 disabled:opacity-30 cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

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
            icon={Users}
          >
            Save Pool
          </Button>
        </div>
      </form>
    </Modal>
  );
}

