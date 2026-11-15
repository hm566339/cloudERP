import React, { useState } from 'react';
import { Modal } from '../../../components/common';
import { CheckSquare, AlertCircle } from 'lucide-react';
import { useCreateCrmTaskMutation } from '../../../api/sales-crm/crm.api';

export default function TaskFormModal({
  isOpen,
  onClose,
  companyId,
  entityType = null,
  entityId = null,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    entityType: entityType || 'LEAD',
    entityId: entityId || '',
  });

  const [errorMsg, setErrorMsg] = useState(null);
  const [createTask, { isLoading }] = useCreateCrmTaskMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setErrorMsg('Task title is required.');
      return;
    }

    try {
      setErrorMsg(null);
      await createTask({
        companyId,
        data: {
          title: formData.title.trim(),
          description: formData.description.trim(),
          priority: formData.priority,
          dueDate: formData.dueDate ? `${formData.dueDate}T18:00:00Z` : null,
          entityType: formData.entityType,
          entityId: formData.entityId || null,
        },
      }).unwrap();
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMsg(err?.data?.message || err.message || 'Failed to create task');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create CRM Task"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
            Task Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Follow up on proposal discount discussion"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent (Immediate)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
            Description / Checklist
          </label>
          <textarea
            rows={3}
            placeholder="Add details, talking points or action items..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
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
            className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5"
          >
            <CheckSquare size={13} />
            {isLoading ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

