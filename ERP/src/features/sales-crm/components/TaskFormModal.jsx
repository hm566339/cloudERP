import React, { useState } from 'react';
import { Modal, FormField, Input, Select, Textarea, Button } from '../../../components/common';
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

        <FormField label="Task Title" required>
          <Input
            type="text"
            required
            placeholder="e.g. Follow up on proposal discount discussion"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Priority">
            <Select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent (Immediate)</option>
            </Select>
          </FormField>

          <FormField label="Due Date">
            <Input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </FormField>
        </div>

        <FormField label="Description / Checklist">
          <Textarea
            rows={3}
            placeholder="Add details, talking points or action items..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
            icon={CheckSquare}
          >
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
}

