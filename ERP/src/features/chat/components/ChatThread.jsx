import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  FileText,
  Users,
  Hash,
  Lock,
  Bell,
  MessageSquare,
  Loader2,
  Paperclip,
  Smile,
} from 'lucide-react';
import MessageBubble from './MessageBubble';
import Badge from '../../../components/common/Badge';
import GroupOptionsMenu from './GroupOptionsMenu';

export default function ChatThread({
  channel,
  messages = [],
  currentUserId,
  onSendMessage,
  onOpenQuotationModal,
  onOpenGroupInfo,
  onOpenAddMembers,
  onOpenManageMembers,
  onOpenDeleteConfirm,
  onOpenLeaveConfirm,
  onUpdateStatus,
  isSending = false,
  isUpdatingStatus = false,
  isLoadingMessages = false,
  isConnected = false,
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    onSendMessage({
      content: inputText.trim(),
      messageType: 'TEXT',
    });
    setInputText('');
  };

  if (!channel) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-zinc-50/50 dark:bg-[#12151D]">
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mb-3">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
          No Channel Selected
        </h3>
        <p className="text-xs text-zinc-400 mt-1 max-w-xs">
          Select a channel from the left sidebar or create a new one to start collaborating.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50/30 dark:bg-[#12151D] min-w-0">
      {/* Thread Header */}
      <div className="h-14 px-5 flex items-center justify-between border-b border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-[#4C8DFF] flex items-center justify-center shrink-0">
            {channel.type === 'DIRECT' ? (
              <Lock className="w-4 h-4" />
            ) : channel.type === 'SYSTEM_ALERT' ? (
              <Bell className="w-4 h-4 text-amber-500" />
            ) : (
              <Hash className="w-4 h-4" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE] truncate">
                {channel.name}
              </h3>
              <Badge variant="outline" size="sm">
                {channel.type}
              </Badge>
            </div>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 flex-wrap">
              <Users className="w-3 h-3" />
              <span>{channel.memberCount || 1} members</span>
              {channel.description && (
                <>
                  <span>·</span>
                  <span className="truncate max-w-[240px]" title={channel.description}>
                    {channel.description}
                  </span>
                </>
              )}
              <span>·</span>
              <span className={isConnected ? 'text-emerald-500' : 'text-zinc-400'}>
                {isConnected ? 'Real-time Connected' : 'Connecting...'}
              </span>
            </p>
          </div>
        </div>

        {/* Header Action: Request Quotation Button & 3-Dot Group Management Menu */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenQuotationModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Request Quote</span>
          </button>

          {/* 3-Dot Group Management Options */}
          <GroupOptionsMenu
            channel={channel}
            onOpenInfo={onOpenGroupInfo}
            onOpenAddMembers={onOpenAddMembers}
            onOpenManageMembers={onOpenManageMembers}
            onOpenDeleteConfirm={onOpenDeleteConfirm}
            onOpenLeaveConfirm={onOpenLeaveConfirm}
          />
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full text-xs text-zinc-400 gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#4C8DFF]" />
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-zinc-400 py-12">
            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-2">
              <Hash className="w-5 h-5 text-zinc-400" />
            </div>
            <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Welcome to #{channel.name}
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              This is the beginning of the channel history.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              currentUserId={currentUserId}
              onUpdateStatus={onUpdateStatus}
              isUpdatingStatus={isUpdatingStatus}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3.5 border-t border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922]">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          {/* Quick RFQ button */}
          <button
            type="button"
            onClick={onOpenQuotationModal}
            title="Create structured Quotation Request card"
            className="p-2 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors shrink-0"
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message #${channel.name}...`}
            className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#4C8DFF]"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-2 rounded-lg bg-[#4C8DFF] hover:bg-blue-600 text-white transition-colors disabled:opacity-40 disabled:hover:bg-[#4C8DFF] shrink-0 shadow-xs"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
