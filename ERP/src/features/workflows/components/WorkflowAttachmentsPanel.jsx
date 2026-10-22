import React, { useRef, useState } from 'react';
import { Paperclip, UploadCloud, Download, File, Loader2, Trash2 } from 'lucide-react';

export default function WorkflowAttachmentsPanel({
  attachments = [],
  onUpload,
  canUpload = true,
  isUploading = false,
}) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = () => {
    if (!selectedFile) return;
    onUpload?.(selectedFile);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip size={16} className="text-zinc-500" />
          <h3 className="text-sm font-bold text-zinc-900">Attachments & Documents</h3>
        </div>
        <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full font-semibold">
          {attachments.length}
        </span>
      </div>

      <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
        {attachments.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-6">
            No files attached to this workflow transaction.
          </p>
        ) : (
          attachments.map((att) => (
            <div
              key={att.id}
              className="p-3 rounded-lg border border-zinc-200 bg-zinc-50/50 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-md shrink-0">
                  <File size={16} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-800 truncate" title={att.fileName}>
                    {att.fileName}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    {formatFileSize(att.fileSize)} &bull; Uploaded by {att.uploadedByName || 'User'} &bull;{' '}
                    {att.createdAt ? new Date(att.createdAt).toLocaleDateString() : ''}
                  </p>
                </div>
              </div>

              {att.id && (
                <a
                  href={`/api/v1/workflow/attachments/download/${att.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-md text-zinc-500 hover:text-blue-600 hover:bg-blue-50 transition-colors shrink-0"
                  title="Download File"
                >
                  <Download size={15} />
                </a>
              )}
            </div>
          ))
        )}
      </div>

      {canUpload && (
        <div className="p-3 border-t border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1D212C]/50 flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="text-xs text-zinc-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer flex-1"
          />
          <button
            type="button"
            disabled={isUploading || !selectedFile}
            onClick={handleUploadSubmit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-colors disabled:opacity-40 shrink-0"
          >
            {isUploading ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
            Upload
          </button>
        </div>
      )}
    </div>
  );
}
