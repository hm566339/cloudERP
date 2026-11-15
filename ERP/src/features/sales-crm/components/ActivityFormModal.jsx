import React, { useState } from 'react';
import { Modal } from '../../../components/common';
import { Phone, Users, FileText, Mail, AlertCircle, Plus } from 'lucide-react';
import { useLogCrmActivityMutation } from '../../../api/sales-crm/crm.api';

export default function ActivityFormModal({
  isOpen,
  onClose,
  companyId,
  entityType = 'LEAD',
  entityId = '',
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    activityType: 'CALL',
    subject: '',
    description: '',
    outcome: 'CONNECTED',
    durationMinutes: 10,
  });

  const [errorMsg, setErrorMsg] = useState(null);
  const [logActivity, { isLoading }] = useLogCrmActivityMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim()) {
      setErrorMsg('Activity subject is required.');
      return;
    }

    try {
      setErrorMsg(null);
      await logActivity({
        companyId,
        data: {
          entityType,
          entityId,
          activityType: formData.activityType,
          subject: formData.subject.trim(),
          description: formData.description.trim(),
          outcome: formData.outcome,
          durationMinutes: Number(formData.durationMinutes) || 0,
        },
      }).unwrap();
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMsg(err?.data?.message || err.message || 'Failed to log activity');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Customer Activity"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-4 gap-2">
          {[
            { id: 'CALL', label: 'Call', icon: Phone },
            { id: 'MEETING', label: 'Meeting', icon: Users },
            { id: 'EMAIL', label: 'Email', icon: Mail },
            { id: 'NOTE', label: 'Note', icon: FileText },
          ].map((type) => {
            const Icon = type.icon;
            const isSelected = formData.activityType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setFormData({ ...formData, activityType: type.id })}
                className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary dark:text-primary-light'
                    : 'border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-600 dark:text-[#A0A6B5]'
                }`}
              >
                <Icon size={16} />
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
            Subject *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Discovery call on warehouse requirements"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
          />
        </div>

        {formData.activityType === 'CALL' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
                Call Outcome
              </label>
              <select
                value={formData.outcome}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
              >
                <option value="CONNECTED">Connected / Discussed</option>
                <option value="BUSY">Line Busy</option>
                <option value="NO_ANSWER">No Answer</option>
                <option value="LEFT_VOICEMAIL">Left Voicemail</option>
                <option value="WRONG_NUMBER">Wrong Number</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min="1"
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
            Notes & Key Takeaways
          </label>
          <textarea
            rows={3}
            placeholder="Summarize key points discussed, client pain points, or next scheduled steps..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
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
            <Plus size={13} />
            {isLoading ? 'Saving...' : 'Log Activity'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

