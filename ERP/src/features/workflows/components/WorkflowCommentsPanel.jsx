import React, { useState } from 'react';
import { MessageSquare, Send, User, Lock, Loader2 } from 'lucide-react';

export default function WorkflowCommentsPanel({
  comments = [],
  onAddComment,
  canAddComment = true,
  isPosting = false,
}) {
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = newComment.trim();
    if (!trimmed) return;
    onAddComment?.(trimmed, isInternal);
    setNewComment('');
  };

  return (
    <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-zinc-500" />
          <h3 className="text-sm font-bold text-zinc-900">Discussion & Comments</h3>
        </div>
        <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full font-semibold">
          {comments.length}
        </span>
      </div>

      <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-6">
            No comments recorded on this workflow yet.
          </p>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className={`p-3 rounded-lg border text-xs space-y-1 ${
                c.isInternal
                  ? 'bg-amber-50/40 border-amber-200'
                  : 'bg-zinc-50/70 border-zinc-200/80'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-semibold text-zinc-800">
                  <User size={13} className="text-zinc-400" />
                  <span>{c.userName || 'System Participant'}</span>
                  {c.isInternal && (
                    <span className="flex items-center gap-0.5 text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded font-bold">
                      <Lock size={10} /> Internal
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-zinc-400">
                  {c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}
                </span>
              </div>
              <p className="text-zinc-700 whitespace-pre-wrap">{c.commentText}</p>
            </div>
          ))
        )}
      </div>

      {canAddComment && (
        <form onSubmit={handleSubmit} className="p-3 border-t border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1D212C]/50 space-y-2">
          <textarea
            rows={2}
            placeholder="Write a comment or reviewer feedback..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 p-2.5 text-xs outline-none focus:border-zinc-400 focus:bg-white transition-colors"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-zinc-600">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-zinc-300 text-blue-600"
              />
              <span>Internal note (admin-only)</span>
            </label>
            <button
              type="submit"
              disabled={isPosting || !newComment.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-colors disabled:opacity-40"
            >
              {isPosting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              Send Comment
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
