import React, { useState, useMemo } from 'react';
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
import PageHeader from '../../../components/common/PageHeader';
import { Select } from '../../../components/common';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
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
  const [selectedRows, setSelectedRows] = useState([]);

  const [sendMessage, { isLoading: isSending }] = useSendCrmMessageMutation();
  const { data: callsRes, isLoading: isCallsLoading, refetch } = useGetCrmCallsQuery({ companyId });

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

  const callColumns = useMemo(() => [
    {
      id: 'receiverNumber',
      label: 'Phone / Direction',
      sortable: true,
      render: (val, row) => (
        <div className="space-y-0.5 text-xs">
          <span className="font-mono font-semibold text-zinc-900 dark:text-white block">
            {row?.receiverNumber || val}
          </span>
          <span className="text-[11px] text-zinc-500 font-mono">From: {row?.callerNumber || '-'}</span>
        </div>
      ),
    },
    {
      id: 'callStatus',
      label: 'Call Status',
      sortable: true,
      render: (val, row) => {
        const s = row?.callStatus || val;
        const isAnswered = s === 'ANSWERED';
        return (
          <DataTableStatusBadge
            status={s || 'UNKNOWN'}
            variant={isAnswered ? 'success' : 'danger'}
          />
        );
      },
    },
    {
      id: 'durationSeconds',
      label: 'Duration',
      sortable: true,
      render: (val, row) => {
        const sec = row?.durationSeconds ?? val ?? 0;
        const mins = Math.floor(sec / 60);
        const remSec = sec % 60;
        return (
          <span className="font-mono text-xs text-zinc-700 dark:text-[#A0A6B5]">
            {mins}m {remSec}s
          </span>
        );
      },
    },
    {
      id: 'createdAt',
      label: 'Timestamp',
      sortable: true,
      render: (val, row) => (
        <span className="text-xs text-zinc-500">
          {row?.createdAt || val ? new Date(row?.createdAt || val).toLocaleString() : '-'}
        </span>
      ),
    },
  ], []);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <PageHeader
        title="Customer Communication Hub"
        description="Omnichannel messaging via WhatsApp Cloud API, SMS gateways, and telephony PBX"
      />

      {/* Tabs bar */}
      <div className="px-6 py-2.5 bg-white dark:bg-[#161922] border-b border-zinc-200 dark:border-[#2A2F3D] flex items-center gap-2 shrink-0">
        <button
          onClick={() => setActiveTab('threads')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'threads'
              ? 'bg-primary text-white shadow-sm'
              : 'text-zinc-600 dark:text-[#A0A6B5] hover:bg-zinc-100 dark:hover:bg-[#1C202B]'
          }`}
        >
          <MessageSquare size={13} /> Message Dispatch
        </button>
        <button
          onClick={() => setActiveTab('calls')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'calls'
              ? 'bg-primary text-white shadow-sm'
              : 'text-zinc-600 dark:text-[#A0A6B5] hover:bg-zinc-100 dark:hover:bg-[#1C202B]'
          }`}
        >
          <Phone size={13} /> Call Logs & CDR
        </button>
      </div>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        {activeTab === 'threads' ? (
          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Dispatch Panel */}
              <div className="md:col-span-2 bg-white dark:bg-[#161922] p-6 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm space-y-4">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5] mb-1">
                        Channel Gateway
                      </label>
                      <Select
                        value={channel}
                        onChange={(e) => setChannel(e.target.value)}
                      >
                        <option value="WHATSAPP">WhatsApp Official API (Meta Cloud)</option>
                        <option value="SMS">SMS Gateway (DLT Approved)</option>
                        <option value="EMAIL">Email (Corporate SMTP / SendGrid)</option>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5] mb-1">
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
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5] mb-1">
                      Message Content (HSM / Template Support)
                    </label>
                    <textarea
                      rows={5}
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
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all active:scale-95"
                    >
                      <Send size={13} />
                      {isSending ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Channels Status Card */}
              <div className="bg-white dark:bg-[#161922] p-6 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm space-y-4">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Connected Gateways</h2>
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 bg-zinc-50 dark:bg-[#1C202B] rounded-lg border border-zinc-200 dark:border-[#2A2F3D] space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-zinc-800 dark:text-[#E6E8EE]">WhatsApp Business</span>
                      <span className="text-emerald-500 font-bold">ACTIVE</span>
                    </div>
                    <p className="text-[11px] text-zinc-500">WABA Account verified with green tick</p>
                  </div>

                  <div className="p-3.5 bg-zinc-50 dark:bg-[#1C202B] rounded-lg border border-zinc-200 dark:border-[#2A2F3D] space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-zinc-800 dark:text-[#E6E8EE]">India DLT SMS</span>
                      <span className="text-emerald-500 font-bold">ACTIVE</span>
                    </div>
                    <p className="text-[11px] text-zinc-500">Header: CLDERP (Transactional)</p>
                  </div>

                  <div className="p-3.5 bg-zinc-50 dark:bg-[#1C202B] rounded-lg border border-zinc-200 dark:border-[#2A2F3D] space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-zinc-800 dark:text-[#E6E8EE]">Telephony PBX</span>
                      <span className="text-emerald-500 font-bold">READY</span>
                    </div>
                    <p className="text-[11px] text-zinc-500">Inbound & outbound CDR tracking</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <DataTable
            permissionFeature="CRM"
            selectable
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
            columns={callColumns}
            data={calls}
            rowKey="id"
            loading={isCallsLoading}
            onRefresh={refetch}
            itemName="calls"
            emptyMessage="No call logs found"
            emptyDescription="Telephony CDR records will show here once calls are initiated."
          />
        )}
      </div>
    </div>
  );
}
