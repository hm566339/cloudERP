import React from 'react';
import { format } from 'date-fns';
import { Bot, User, Bell } from 'lucide-react';
import QuotationRequestCard from './QuotationRequestCard';
import QuotationReadyCard from './QuotationReadyCard';

export default function MessageBubble({
  message,
  currentUserId,
  onUpdateStatus,
  isUpdatingStatus,
}) {
  const isMine =
    currentUserId && message.senderId && String(message.senderId) === String(currentUserId);
  const isSystem = message.messageType === 'SYSTEM_ALERT';
  const isQuotationRequest = message.messageType === 'QUOTATION_REQUEST';
  const isQuotationReady = message.messageType === 'QUOTATION_READY';

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'hh:mm a');
    } catch {
      return '';
    }
  };

  // Centered System Notice
  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60 shadow-2xs">
          <Bell className="w-3 h-3 text-zinc-400" />
          <span>{message.content}</span>
          <span className="text-[10px] text-zinc-400">· {formatTimestamp(message.createdAt)}</span>
        </div>
      </div>
    );
  }

  // Structured Cards (Quotation Request / Ready)
  if (isQuotationRequest || isQuotationReady) {
    return (
      <div className={`flex flex-col my-3 ${isMine ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-zinc-500 dark:text-zinc-400">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
            {message.senderName || 'ERP System'}
          </span>
          <span>·</span>
          <span>{formatTimestamp(message.createdAt)}</span>
        </div>
        {isQuotationRequest && (
          <QuotationRequestCard
            message={message}
            onUpdateStatus={onUpdateStatus}
            isUpdating={isUpdatingStatus}
          />
        )}
        {isQuotationReady && <QuotationReadyCard message={message} />}
      </div>
    );
  }

  // Standard Text Message
  return (
    <div className={`flex flex-col my-2.5 ${isMine ? 'items-end' : 'items-start'}`}>
      <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-zinc-500 dark:text-zinc-400">
        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
          {isMine ? 'You' : message.senderName || 'Member'}
        </span>
        <span>·</span>
        <span>{formatTimestamp(message.createdAt)}</span>
      </div>

      <div
        className={`relative px-4 py-2.5 rounded-2xl max-w-lg text-xs leading-relaxed break-words shadow-2xs ${
          isMine
            ? 'bg-[#4C8DFF] text-white rounded-br-xs'
            : 'bg-white dark:bg-[#1E222D] text-zinc-900 dark:text-[#E6E8EE] border border-zinc-200/80 dark:border-[#2A2F3D] rounded-bl-xs'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
