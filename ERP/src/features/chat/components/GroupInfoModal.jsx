import React, { useState, useEffect } from 'react';
import { X, Hash, Users, Calendar, AlertCircle, Loader2, Check } from 'lucide-react';
import Badge from '../../../components/common/Badge';

export default function GroupInfoModal({
  isOpen,
  channel,
  onClose,
  onUpdateChannel,
  isSubmitting = false,
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (channel) {
      setName(channel.name || '');
      setDescription(channel.description || '');
      setError(null);
      setSuccessMsg(null);
    }
  }, [channel, isOpen]);

  if (!isOpen || !channel) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Group name cannot be blank.');
      return;
    }

    setError(null);
    setSuccessMsg(null);

    try {
      await onUpdateChannel({
        name: name.trim(),
        description: description.trim() || null,
      });
      setSuccessMsg('Group details updated successfully.');
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to update group details. Please try again.';
      setError(msg);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#161922] w-full max-w-md rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-[#2A2F3D]">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
              Group Info & Settings
            </h3>
            <Badge variant="outline" size="sm">
              {channel.type}
            </Badge>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quick Metadata Stats */}
          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
              <Users className="w-3.5 h-3.5 text-zinc-400" />
              <span>{channel.memberCount || 1} Total Members</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>Created {formatDate(channel.createdAt)}</span>
            </div>
          </div>

          {/* Group Name */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Group Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Hash className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                required
                maxLength={255}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sales Coordination"
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#4C8DFF]"
              />
            </div>
          </div>

          {/* Group Description / Topic */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                Description / Topic
              </label>
              <span className="text-[10px] text-zinc-400">
                {description.length}/500
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group about? Add guidelines, topics, or responsibilities..."
              className="w-full p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#4C8DFF] resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-[#2A2F3D]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#4C8DFF] hover:bg-blue-600 text-white font-medium transition-colors shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
