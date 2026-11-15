import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Phone,
  Mail,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Paperclip
} from 'lucide-react';
import { PageHeader, Tabs } from '../../../components/common';
import DataTable from '../../../components/data-table/DataTable';
import {
  useSendCrmMessageMutation,
  useGetCrmCallsQuery,
} from '../../../api/sales-crm/crm.api';

export default function CommunicationsPage() {
  const { companyId } = useParams();
  const [activeTab, setActiveTab] = useState('threads');
  const [recipient, setRecipient] = useState('+919876543210');
  const [channel, setChannel] = useState('WHATSAPP');
  const [messageText, setMessageText] = useState('');
  const [statusMsg, setStatusMsg] = useState(null);

  const [sendMessage, { isLoading: isSending }] = useSendCrmMessageMutation();
  const { data: callsRes, isLoading: isCallsLoading } = useGetCrmCallsQuery({ companyId });

  const calls = callsRes?.data || [
    { id: 'call-1', callerNumber: '+919820012345', receiverNumber: '+919876543210', durationSeconds: 245, callStatus: 'ANSWERED', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 'call-2', callerNumber: '+919820012345', receiverNumber: '+919911223344', durationSeconds: 0, callStatus: 'NO_ANSWER', createdAt: new Date(Date.now() - 7200000).toISOString() },
  ];

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    try {
      setStatusMsg(null);
      await sendMessage({
        companyId,
        data: {
          channel,
          recipientNumberOrEmail: recipient,
          content: messageText.trim(),
        },
      }).unwrap();
      setMessageText('');
      setStatusMsg({ type: 'success', text: `Message dispatched successfully via ${channel}!` });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      setStatusMsg({ type: 'error', text: err?.data?.message || err.message || 'Dispatch failed' });
    }
  };

  const callColumns = [
    {
      header: 'Phone / Direction',
      accessorKey: 'receiverNumber',
      cell: ({ row }) => (
        <div className="space-y-0.5 text-xs">
          <span className="font-mono font-semibold text-zinc-900 dark:text-white block">
            {row.original.receiverNumber}
          </span>
          <span className="text-[11px] text-zinc-500 font-mono">From: {row.original.callerNumber}</span>
        </div>
      ),
    },
    {
      header: 'Call Status',
      accessorKey: 'callStatus',
      cell: ({ row }) => {
        const s = row.original.callStatus;
        const isAnswered = s === 'ANSWERED';
        return (
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
            isAnswered ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
          }`}>
            {s}
          </span>
        );
      },
    },
    {
      header: 'Duration',
      accessorKey: 'durationSeconds',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-zinc-700 dark:text-[#A0A6B5]">
          {Math.floor(row.original.durationSeconds / 60)}m {row.original.durationSeconds % 60}s
        </span>
      ),
    },
    {
      header: 'Timestamp',
      accessorKey: 'createdAt',
      cell: ({ row }) => (
        <span className="text-xs text-zinc-500">
          {new Date(row.original.createdAt).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Omnichannel Communications"
        subtitle="Unified WhatsApp, SMS, Email outreach and telephony call logs (CDRs)."
      />

      <div className="p-3 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-sm">
        <Tabs
          tabs={[
            { id: 'threads', label: 'Broadcast & Direct Outreach' },
            { id: 'calls', label: `Telephony & CDR Call Logs (${calls.length})` },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {activeTab === 'threads' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Dispatch Panel */}
          <div className="md:col-span-2 bg-white dark:bg-[#161922] p-5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Compose Outbound Message</h2>

            {statusMsg && (
              <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 border border-rose-200'
              }`}>
                {statusMsg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                <span>{statusMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
                    Channel Gateway
                  </label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1C202B] text-zinc-800 dark:text-[#E6E8EE]"
                  >
                    <option value="WHATSAPP">WhatsApp Official API (Meta Cloud)</option>
                    <option value="SMS">SMS Gateway (DLT Approved)</option>
                    <option value="EMAIL">Email (Corporate SMTP / SendGrid)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
                    Recipient (Mobile / Email)
                  </label>
                  <input
                    type="text"
                    required
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1C202B] text-zinc-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
                  Message Content (HSM / Template Support)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Type your message or WhatsApp template parameters..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1C202B] text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-[#2A2F3D]">
                <span className="text-[11px] text-zinc-400">Consent opt-out footer added automatically</span>
                <button
                  type="submit"
                  disabled={isSending}
                  className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5"
                >
                  <Send size={13} />
                  {isSending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>

          {/* Channels Status Card */}
          <div className="bg-white dark:bg-[#161922] p-5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Connected Gateways</h2>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-zinc-50 dark:bg-[#1C202B] rounded-lg border border-zinc-200 dark:border-[#2A2F3D] space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-zinc-800 dark:text-[#E6E8EE]">WhatsApp Business</span>
                  <span className="text-emerald-500 font-bold">ACTIVE</span>
                </div>
                <p className="text-[11px] text-zinc-500">WABA Account verified with green tick</p>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-[#1C202B] rounded-lg border border-zinc-200 dark:border-[#2A2F3D] space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-zinc-800 dark:text-[#E6E8EE]">India DLT SMS</span>
                  <span className="text-emerald-500 font-bold">ACTIVE</span>
                </div>
                <p className="text-[11px] text-zinc-500">Header: CLDERP (Transactional)</p>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-[#1C202B] rounded-lg border border-zinc-200 dark:border-[#2A2F3D] space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-zinc-800 dark:text-[#E6E8EE]">Telephony PBX</span>
                  <span className="text-emerald-500 font-bold">READY</span>
                </div>
                <p className="text-[11px] text-zinc-500">Inbound & outbound CDR tracking</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'calls' && (
        <DataTable
          data={calls}
          columns={callColumns}
          isLoading={isCallsLoading}
          enablePagination={true}
        />
      )}
    </div>
  );
}

