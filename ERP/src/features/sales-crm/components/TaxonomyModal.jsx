import React, { useState } from 'react';
import { Modal, FormField, Input, Button } from '../../../components/common';
import { Tag, AlertCircle } from 'lucide-react';
import { useCreateCrmTagMutation } from '../../../api/sales-crm/crm.api';

const COLOR_OPTIONS = [
  '#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#14B8A6'
];

export default function TaxonomyModal({
  isOpen,
  onClose,
  companyId,
  onSuccess,
}) {
  const [tagName, setTagName] = useState('');
  const [colorCode, setColorCode] = useState(COLOR_OPTIONS[0]);
  const [errorMsg, setErrorMsg] = useState(null);

  const [createTag, { isLoading }] = useCreateCrmTagMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tagName.trim()) {
      setErrorMsg('Tag name is required.');
      return;
    }

    try {
      setErrorMsg(null);
      await createTag({
        tagName: tagName.trim(),
        colorCode,
        companyId,
      }).unwrap();
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMsg(err?.data?.message || err.message || 'Failed to create tag');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Custom CRM Tag"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <FormField label="Tag Name" required>
          <Input
            type="text"
            required
            placeholder="e.g. VIP-Account, High-Priority, Manufacturing"
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
          />
        </FormField>

        <div>
          <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            Tag Badge Color
          </label>
          <div className="flex items-center gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColorCode(c)}
                className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                  colorCode === c ? 'scale-110 border-white ring-2 ring-primary' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="p-3 bg-zinc-50 dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg">
          <span className="text-[11px] text-zinc-500 mr-2">Preview:</span>
          <span
            className="px-2.5 py-1 rounded-full text-xs font-semibold text-white inline-flex items-center gap-1"
            style={{ backgroundColor: colorCode }}
          >
            <Tag size={12} /> {tagName || 'Tag Preview'}
          </span>
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
            icon={Tag}
          >
            Create Tag
          </Button>
        </div>
      </form>
    </Modal>
  );
}

