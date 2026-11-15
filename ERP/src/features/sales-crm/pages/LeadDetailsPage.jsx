import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  Calendar,
  Clock,
  UserCheck,
  ArrowRightLeft,
  Edit2,
  CheckSquare,
  Plus,
  MessageSquare,
  Flame,
  Globe,
  FileText
} from 'lucide-react';
import { PageHeader, Tabs } from '../../../components/common';
import {
  useGetLeadByIdQuery,
  useGetCrmActivitiesQuery,
  useGetCrmTasksQuery,
  useGetCrmConversationMessagesQuery,
} from '../../../api/sales-crm/crm.api';
import ActivityFormModal from '../components/ActivityFormModal';
import TaskFormModal from '../components/TaskFormModal';
import LeadConvertModal from '../components/LeadConvertModal';
import LeadFormModal from '../components/LeadFormModal';

export default function LeadDetailsPage() {
  const { id, companyId } = useParams();
  const navigate = useNavigate();
  const crmBase = companyId ? `/company/${companyId}/sales-crm` : '/sales-crm';

  const [activeTab, setActiveTab] = useState('overview');
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: leadRes, isLoading: isLeadLoading, refetch: refetchLead } = useGetLeadByIdQuery({ id, companyId });
  const lead = leadRes?.data || null;

  const { data: activitiesRes } = useGetCrmActivitiesQuery({
    entityType: 'LEAD',
    entityId: id,
    companyId,
  });
  const activities = activitiesRes?.data || [];

  const { data: tasksRes } = useGetCrmTasksQuery({
    entityType: 'LEAD',
    entityId: id,
    companyId,
  });
  const tasks = tasksRes?.data || [];

  const { data: messagesRes } = useGetCrmConversationMessagesQuery({
    entityType: 'LEAD',
    entityId: id,
    companyId,
  });
  const messages = messagesRes?.data || [];

  if (isLeadLoading) {
    return (
      <div className="p-8 text-center text-xs text-zinc-400">
        Loading lead dossier...
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-8 text-center text-xs text-zinc-400 space-y-2">
        <p>Lead record not found.</p>
        <button onClick={() => navigate(`${crmBase}/leads`)} className="text-primary hover:underline">
          Return to Leads
        </button>
      </div>
    );
  }

  const leadName = lead.displayName || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Lead Details';

  const tabList = [
    { id: 'overview', label: 'Lead Overview' },
    { id: 'timeline', label: `Activity Timeline (${activities.length})` },
    { id: 'tasks', label: `Tasks (${tasks.length})` },
    { id: 'messages', label: `Communications (${messages.length})` },
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117] overflow-auto p-6 space-y-4">
      {/* Top Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(`${crmBase}/leads`)}
          className="p-1.5 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] text-zinc-600 dark:text-[#A0A6B5] hover:bg-zinc-100 dark:hover:bg-[#1C202B]"
        >
          <ArrowLeft size={14} />
        </button>
        <span className="text-xs text-zinc-500 font-semibold">Back to Leads Directory</span>
      </div>

      {/* Header Profile Card */}
      <div className="p-5 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-zinc-900 dark:text-white">{leadName}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-primary/10 text-primary">
                Score: {lead.leadScore || 50}/100
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-500">
                {lead.leadStatus?.statusName || 'NEW'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <Building2 size={13} /> {lead.organizationName || 'Individual Contact'}
              </span>
              {lead.normalizedPhone && (
                <span className="flex items-center gap-1 font-mono">
                  <Phone size={13} /> {lead.normalizedPhone}
                </span>
              )}
              {lead.email && (
                <span className="flex items-center gap-1">
                  <Mail size={13} /> {lead.email}
                </span>
              )}
              {lead.state && <span>State: {lead.state}</span>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsActivityOpen(true)}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <Phone size={13} /> Log Activity
            </button>
            <button
              onClick={() => setIsTaskOpen(true)}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <CheckSquare size={13} /> Add Task
            </button>
            <button
              onClick={() => setIsConvertOpen(true)}
              className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5"
            >
              <ArrowRightLeft size={13} /> Convert Deal
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-t border-zinc-100 dark:border-[#2A2F3D] pt-3">
          <Tabs
            tabs={tabList}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <div className="p-4 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-sm space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Qualification & Inquiry Notes</h2>
              <p className="text-xs text-zinc-700 dark:text-[#E6E8EE] whitespace-pre-line leading-relaxed">
                {lead.rawInquiryText || lead.notes || 'No specific notes recorded on inbound inquiry.'}
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-sm space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Attribution & Channel Data</h2>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-zinc-500 block">Lead Source:</span>
                  <span className="font-semibold text-zinc-800 dark:text-[#E6E8EE]">{lead.leadSource?.sourceName || 'Direct'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">UTM Source / Campaign:</span>
                  <span className="font-mono text-zinc-800 dark:text-[#E6E8EE]">{lead.utmSource || 'N/A'} / {lead.utmCampaign || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">External Lead ID:</span>
                  <span className="font-mono text-zinc-800 dark:text-[#E6E8EE]">{lead.externalLeadId || 'None'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Created At:</span>
                  <span className="text-zinc-800 dark:text-[#E6E8EE]">{new Date(lead.createdAt || Date.now()).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-sm space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Corporate Compliance</h2>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-zinc-500 block">GSTIN:</span>
                  <span className="font-mono font-semibold text-zinc-800 dark:text-[#E6E8EE]">{lead.gstin || 'Not Provided'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Assigned Owner:</span>
                  <span className="font-semibold text-zinc-800 dark:text-[#E6E8EE]">{lead.assignedUserName || 'Round-Robin Pool'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Consent Source:</span>
                  <span className="text-zinc-800 dark:text-[#E6E8EE]">{lead.consentSource || 'Opt-in Web Form'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="bg-white dark:bg-[#161922] p-5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Customer Activity Trail</h2>
            <button
              onClick={() => setIsActivityOpen(true)}
              className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <Plus size={13} /> Log Activity
            </button>
          </div>

          <div className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-xs text-zinc-400 py-6 text-center">No logged activities for this lead yet.</p>
            ) : (
              activities.map((a) => (
                <div key={a.id} className="p-3 bg-zinc-50 dark:bg-[#1C202B] rounded-lg border border-zinc-200 dark:border-[#2A2F3D] text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-900 dark:text-white">{a.subject}</span>
                    <span className="text-[10px] uppercase font-semibold text-primary">{a.activityType}</span>
                  </div>
                  <p className="text-zinc-600 dark:text-[#A0A6B5]">{a.description}</p>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                    <span>Outcome: {a.outcome || 'Logged'}</span>
                    <span>{new Date(a.createdAt || Date.now()).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="bg-white dark:bg-[#161922] p-5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Lead Follow-Up Tasks</h2>
            <button
              onClick={() => setIsTaskOpen(true)}
              className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <Plus size={13} /> New Task
            </button>
          </div>

          <div className="space-y-2">
            {tasks.length === 0 ? (
              <p className="text-xs text-zinc-400 py-6 text-center">No tasks assigned to this lead.</p>
            ) : (
              tasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-[#1C202B] rounded-lg border border-zinc-200 dark:border-[#2A2F3D] text-xs">
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-white">{t.title}</p>
                    <p className="text-zinc-500 text-[11px]">{t.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-500">
                      {t.priority}
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-1">Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="bg-white dark:bg-[#161922] p-5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Omnichannel Message Thread</h2>
          <div className="space-y-2">
            {messages.length === 0 ? (
              <p className="text-xs text-zinc-400 py-6 text-center">No message history with this lead.</p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="p-3 bg-zinc-50 dark:bg-[#1C202B] rounded-lg border border-zinc-200 dark:border-[#2A2F3D] text-xs space-y-1">
                  <div className="flex justify-between font-semibold text-zinc-800 dark:text-[#E6E8EE]">
                    <span>{m.channel} ({m.direction})</span>
                    <span className="text-[11px] text-zinc-400">{new Date(m.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-zinc-600 dark:text-[#A0A6B5]">{m.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <ActivityFormModal
        isOpen={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
        companyId={companyId}
        entityType="LEAD"
        entityId={id}
        onSuccess={() => refetchLead()}
      />

      <TaskFormModal
        isOpen={isTaskOpen}
        onClose={() => setIsTaskOpen(false)}
        companyId={companyId}
        entityType="LEAD"
        entityId={id}
        onSuccess={() => refetchLead()}
      />

      <LeadConvertModal
        isOpen={isConvertOpen}
        onClose={() => setIsConvertOpen(false)}
        lead={lead}
        companyId={companyId}
        onSuccess={() => navigate(`${crmBase}/opportunities`)}
      />

      <LeadFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        initialData={lead}
        companyId={companyId}
        onSuccess={() => refetchLead()}
      />
    </div>
  );
}

