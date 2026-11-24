import React from 'react';
import {
  MessageSquare,
  Mail,
  PhoneCall,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import CrmTabCard from '../CrmTabCard';
import EmptyState from '../../../../../components/common/EmptyState';

/**
 * Communications Section for Lead Details.
 * Displays multi-channel message thread (SMS, WhatsApp, Email, Webhook leads).
 */
export default function LeadCommunicationsSection({ messages = [], lead }) {
  const count = messages.length;

  return (
    <CrmTabCard title="Omnichannel Communication History" count={count}>
      {count === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No communication records found"
          description="Omnichannel inbound and outbound messages (WhatsApp, SMS, Email) for this lead will appear here."
        />
      ) : (
        <div className="space-y-4">
          {messages.map((msg, index) => {
            const isInbound = msg.direction === 'INBOUND';
            const channel = msg.channel || 'MESSAGE';

            return (
              <div
                key={msg.id || index}
                className={`p-4 rounded-xl border flex flex-col gap-2 ${
                  isInbound
                    ? 'bg-zinc-50 dark:bg-[#1D212C] border-zinc-200/80 dark:border-[#2A2F3D]'
                    : 'bg-primary/5 dark:bg-primary/10 border-primary/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`p-1.5 rounded-lg ${
                        isInbound
                          ? 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-[#A0A6B5]'
                          : 'bg-primary text-white'
                      }`}
                    >
                      {isInbound ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
                    </span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-[#E6E8EE]">
                      {isInbound ? (lead?.displayName || 'Lead Prospect') : (msg.senderName || 'CRM Representative')}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-zinc-200 dark:bg-[#2A2F3D] text-zinc-700 dark:text-[#A0A6B5]">
                      {channel}
                    </span>
                  </div>

                  <span className="text-xs text-zinc-400 dark:text-[#6B7184] flex items-center gap-1">
                    <Clock size={12} />
                    {msg.sentAt || msg.createdAt
                      ? new Date(msg.sentAt || msg.createdAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : 'Recently'}
                  </span>
                </div>

                <p className="text-xs text-zinc-700 dark:text-[#E6E8EE] leading-relaxed whitespace-pre-wrap pl-8">
                  {msg.body || msg.content || msg.text || 'No message content'}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </CrmTabCard>
  );
}
