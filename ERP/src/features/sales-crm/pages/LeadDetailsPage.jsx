import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Flame,
  Activity,
  CheckSquare,
  MessageSquare,
  Share2,
  ArrowRightLeft,
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  Clock,
  Hash,
  UserCheck,
  Edit2,
  Trash2,
  Plus,
  ExternalLink,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';

import KPICard from '../../../components/common/KPICard';
import InfoCard, { InfoField } from '../../../components/common/InfoCard';
import QuickActionsCard from '../../../components/common/QuickActionsCard';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { confirmDialog } from '../../../utils/confirmDialog';

import {
  CrmDetailShell,
  LeadOverviewSection,
  LeadAttributionSection,
  LeadActivitiesSection,
  LeadTasksSection,
  LeadCommunicationsSection,
  LeadConversionSection,
} from '../components/detail';

import LeadFormModal from '../components/LeadFormModal';
import LeadAssignModal from '../components/LeadAssignModal';
import LeadConvertModal from '../components/LeadConvertModal';
import ActivityFormModal from '../components/ActivityFormModal';
import TaskFormModal from '../components/TaskFormModal';

import {
  useGetLeadByIdQuery,
  useUpdateLeadStatusMutation,
  useDeleteLeadMutation,
  useGetCrmActivitiesQuery,
  useGetCrmTasksQuery,
  useCompleteCrmTaskMutation,
  useGetCrmConversationMessagesQuery,
} from '../../../api/sales-crm/crm.api';

/* ─────────────────────────────────────────────────────────────────
   Lead Detail Tabs Definition
───────────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'overview',       label: 'Overview',       icon: LayoutDashboard },
  { id: 'activities',     label: 'Timeline',       icon: Activity },
  { id: 'tasks',          label: 'Tasks',          icon: CheckSquare },
  { id: 'communications', label: 'Communications', icon: MessageSquare },
  { id: 'attribution',    label: 'Attribution',    icon: Share2 },
  { id: 'conversion',     label: 'Deal Conversion',icon: ArrowRightLeft },
];

export default function LeadDetailsPage() {
  const { id, companyId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const crmBase = companyId ? `/company/${companyId}/sales-crm` : '/sales-crm';

  const [activeTab, setActiveTab] = useState('overview');

  // Modal open states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);

  /* ── 1. Fetch Lead Data (with multi-tenant header & param resolution) ── */
  const {
    data: leadRes,
    isLoading: isLeadLoading,
    error: leadError,
    refetch: refetchLead,
  } = useGetLeadByIdQuery({ id, companyId });

  // Safe unwrapping: baseApi unwraps standard ApiResponse so leadRes might be the lead directly
  const lead = leadRes?.id
    ? leadRes
    : leadRes?.data?.id
    ? leadRes.data
    : leadRes?.data || null;

  /* ── Mutations ── */
  const [deleteLead] = useDeleteLeadMutation();
  const [updateLeadStatus] = useUpdateLeadStatusMutation();
  const [completeTask] = useCompleteCrmTaskMutation();

  /* ── 2. Child Entity Queries ── */
  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.content)) return res.data.content;
    return [];
  };

  const {
    data: activitiesRes,
    refetch: refetchActivities,
  } = useGetCrmActivitiesQuery(
    { entityType: 'LEAD', entityId: id, companyId },
    { skip: !id }
  );
  const activities = toArray(activitiesRes);

  const {
    data: tasksRes,
    refetch: refetchTasks,
  } = useGetCrmTasksQuery(
    { entityType: 'LEAD', entityId: id, companyId },
    { skip: !id }
  );
  const tasks = toArray(tasksRes);

  const { data: messagesRes } = useGetCrmConversationMessagesQuery(
    { entityType: 'LEAD', entityId: id, companyId },
    { skip: !id }
  );
  const messages = toArray(messagesRes);

  /* ── Handlers ── */
  const handleDelete = async () => {
    const confirmed = await confirmDialog({
      title: 'Delete Lead',
      message: 'Are you sure you want to permanently delete this lead? This action cannot be undone.',
    });
    if (!confirmed) return;

    try {
      await deleteLead({ id, companyId }).unwrap();
      dispatch(
        addAlert({
          type: 'success',
          message: 'Lead deleted successfully.',
        })
      );
      navigate(`${crmBase}/leads`);
    } catch (err) {
      dispatch(
        addAlert({
          type: 'error',
          message: err?.data?.message || err.message || 'Failed to delete lead.',
        })
      );
    }
  };

  const handleToggleTask = async (task) => {
    if (!task?.id) return;
    try {
      await completeTask({ id: task.id, companyId }).unwrap();
      refetchTasks();
      dispatch(
        addAlert({
          type: 'success',
          message: 'Task marked as completed.',
        })
      );
    } catch (err) {
      dispatch(
        addAlert({
          type: 'error',
          message: err?.data?.message || err.message || 'Failed to update task status.',
        })
      );
    }
  };

  /* ── If not found / error ── */
  if (!isLeadLoading && (!lead || leadError)) {
    return (
      <CrmDetailShell
        loading={false}
        notFound={true}
        notFoundTitle="Lead Record Not Found"
        notFoundMessage="The requested lead does not exist, has been removed, or is inaccessible in the current company context."
        onBack={() => navigate(`${crmBase}/leads`)}
        backLabel="Return to Leads Directory"
      />
    );
  }

  /* ── Loading Skeleton ── */
  if (isLeadLoading || !lead) {
    return <CrmDetailShell loading={true} />;
  }

  /* ── Derived Lead Identity ── */
  const leadName =
    lead.displayName ||
    `${lead.firstName || ''} ${lead.lastName || ''}`.trim() ||
    lead.organizationName ||
    'Lead Dossier';

  const score = Number(lead.leadScore) || 50;
  const isHot = score >= 80;
  const isWarm = score >= 50 && score < 80;
  const scoreClass = isHot
    ? 'text-rose-600'
    : isWarm
    ? 'text-amber-600'
    : 'text-blue-600';

  const updatedDateStr = lead.updatedAt
    ? new Date(lead.updatedAt).toLocaleDateString()
    : 'Recently';

  /* ── Header Metadata Chips ── */
  const headerMetadata = [
    { icon: Hash, label: lead.leadCode || lead.id?.slice(0, 8) || 'N/A' },
    { icon: Building, label: lead.organizationName || 'Individual Contact' },
    { icon: Clock, label: `Updated ${updatedDateStr}` },
    { icon: User, label: `Owner: ${lead.ownerUsername || 'Unassigned'}` },
  ];

  /* ── Header Actions ── */
  const headerActions = [
    {
      label: 'Edit',
      icon: Edit2,
      variant: 'secondary',
      permission: { module: 'CRM_LEADS', action: 'UPDATE', behavior: 'disable' },
      onClick: () => setIsEditOpen(true),
    },
    {
      label: 'Assign',
      icon: UserCheck,
      variant: 'secondary',
      permission: { module: 'CRM_LEADS', action: 'ASSIGN', behavior: 'disable' },
      onClick: () => setIsAssignOpen(true),
    },
    {
      label: lead.isConverted ? 'Converted' : 'Convert',
      icon: ArrowRightLeft,
      variant: 'primary',
      disabled: lead.isConverted,
      permission: { module: 'CRM_LEADS', action: 'CONVERT', behavior: 'disable' },
      onClick: () => setIsConvertOpen(true),
    },
    {
      label: 'More Actions',
      type: 'dropdown',
      variant: 'secondary',
      items: [
        {
          label: 'Log Activity',
          icon: MessageSquare,
          onClick: () => setIsActivityOpen(true),
        },
        {
          label: 'Add Task',
          icon: CheckSquare,
          onClick: () => setIsTaskOpen(true),
        },
        { type: 'divider' },
        {
          label: 'Delete Lead',
          icon: Trash2,
          permission: { module: 'CRM_LEADS', action: 'DELETE' },
          onClick: handleDelete,
        },
      ],
    },
  ];

  /* ── KPI Card Strip (rendered inside EntityHeader's bottomSlot) ── */
  const pendingTasksCount = tasks.filter((t) => t.status !== 'COMPLETED' && !t.isCompleted).length;
  const kpiStrip = (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 xl:gap-4 pb-6">
      <KPICard
        title="Lead Score"
        value={`${score}/100`}
        valueClass={scoreClass}
        subtitle={isHot ? '🔥 High Intent' : isWarm ? '⚡ Active Prospect' : '❄️ Nurture Stage'}
        icon={Flame}
      />
      <KPICard
        title="Pipeline Stage"
        value={lead.leadStage || 'RAW'}
        valueClass="text-zinc-900 dark:text-[#E6E8EE]"
        icon={TrendingUp}
      />
      <KPICard
        title="Status"
        value={lead.leadStatus?.statusName || 'New / Open'}
        valueClass="text-emerald-600"
        icon={CheckCircle}
      />
      <KPICard
        title="Lead Source"
        value={lead.leadSource?.sourceName || lead.leadSourceId || 'Direct'}
        subtitle={lead.externalLeadId ? 'External Ad / Portal' : 'Direct Inbound'}
        icon={Share2}
      />
      <KPICard
        title="Activities"
        value={`${activities.length}`}
        subtitle={`Total interactions`}
        icon={Activity}
      />
      <KPICard
        title="Pending Tasks"
        value={`${pendingTasksCount}`}
        valueClass={pendingTasksCount > 0 ? 'text-amber-600' : 'text-zinc-900 dark:text-[#E6E8EE]'}
        subtitle={`Total tasks: ${tasks.length}`}
        icon={CheckSquare}
      />
    </div>
  );

  /* ── Quick Actions (Sidebar) ── */
  const quickActions = [
    {
      label: 'Convert to Deal',
      icon: ArrowRightLeft,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      trailingIcon: Plus,
      disabled: lead.isConverted,
      onClick: () => setIsConvertOpen(true),
    },
    {
      label: 'Log Activity',
      icon: Activity,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      trailingIcon: Plus,
      onClick: () => setIsActivityOpen(true),
    },
    {
      label: 'Add Task',
      icon: CheckSquare,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      trailingIcon: Plus,
      onClick: () => setIsTaskOpen(true),
    },
    {
      label: 'Assign Owner',
      icon: UserCheck,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      trailingIcon: ExternalLink,
      onClick: () => setIsAssignOpen(true),
    },
  ];

  /* ── Sidebar (30%) ── */
  const sidebar = (
    <>
      {/* Lead Contact Info Card */}
      <InfoCard
        title="Lead Contact Info"
        icon={User}
        iconBg="bg-blue-50"
        iconColor="text-blue-600"
      >
        <div className="space-y-4">
          <InfoField
            label="Full Name"
            value={`${lead.firstName || ''} ${lead.lastName || ''}`.trim() || lead.displayName}
          />
          <InfoField label="Organization" value={lead.organizationName} />
          <InfoField label="Designation" value={lead.designation} />
          <InfoField label="Email Address" value={lead.email} />
          <InfoField
            label="Primary Phone"
            value={lead.normalizedPhone || lead.phone}
            mono
          />
          {lead.alternatePhone && (
            <InfoField label="Alternate Phone" value={lead.alternatePhone} mono />
          )}

          {/* Lead Qualification Status */}
          <div>
            <p className="text-[8.5px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#6B7184] mb-1.5">
              Qualification Status
            </p>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                  lead.isQualified
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'bg-zinc-100 text-zinc-700 dark:bg-[#1D212C] dark:text-[#A0A6B5]'
                }`}
              >
                {lead.isQualified ? '✓ Qualified Prospect' : 'Pending Qualification'}
              </span>
            </div>
          </div>
        </div>
      </InfoCard>

      {/* Location & Territory Card */}
      <InfoCard
        title="Location & Territory"
        icon={MapPin}
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
      >
        <div className="space-y-1">
          <p className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE]">
            {lead.addressLine1 || 'No street address recorded'}
          </p>
          {lead.addressLine2 && (
            <p className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE]">
              {lead.addressLine2}
            </p>
          )}
          <p className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE]">
            {[lead.city, lead.state, lead.postalCode].filter(Boolean).join(', ') || 'City/State not specified'}
          </p>
          <p className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE]">
            {lead.country || 'India'}
          </p>
        </div>
      </InfoCard>

      {/* Quick Actions Card */}
      <QuickActionsCard title="Quick Actions" actions={quickActions} />
    </>
  );

  /* ── Tab List with Counts ── */
  const tabsWithCounts = TABS.map((tab) => {
    if (tab.id === 'activities') return { ...tab, count: activities.length };
    if (tab.id === 'tasks') return { ...tab, count: tasks.length };
    if (tab.id === 'communications') return { ...tab, count: messages.length };
    return tab;
  });

  /* ── Modals Slot ── */
  const modals = (
    <>
      <LeadFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        initialData={lead}
        companyId={companyId}
        onSuccess={() => {
          refetchLead();
          dispatch(addAlert({ type: 'success', message: 'Lead updated successfully.' }));
        }}
      />

      <LeadAssignModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        lead={lead}
        companyId={companyId}
        onSuccess={() => {
          refetchLead();
          dispatch(addAlert({ type: 'success', message: 'Lead assigned successfully.' }));
        }}
      />

      <LeadConvertModal
        isOpen={isConvertOpen}
        onClose={() => setIsConvertOpen(false)}
        lead={lead}
        companyId={companyId}
        onSuccess={() => {
          refetchLead();
          dispatch(addAlert({ type: 'success', message: 'Lead converted into Deal successfully.' }));
        }}
      />

      <ActivityFormModal
        isOpen={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
        entityType="LEAD"
        entityId={lead.id}
        companyId={companyId}
        onSuccess={() => {
          refetchActivities();
          dispatch(addAlert({ type: 'success', message: 'Activity logged successfully.' }));
        }}
      />

      <TaskFormModal
        isOpen={isTaskOpen}
        onClose={() => setIsTaskOpen(false)}
        entityType="LEAD"
        entityId={lead.id}
        companyId={companyId}
        onSuccess={() => {
          refetchTasks();
          dispatch(addAlert({ type: 'success', message: 'Task created successfully.' }));
        }}
      />
    </>
  );

  return (
    <CrmDetailShell
      loading={false}
      onBack={() => navigate(`${crmBase}/leads`)}
      title={leadName}
      badge={{
        label: lead.leadStage || lead.leadStatus?.statusName || 'NEW',
        status: lead.leadStage || 'RAW',
      }}
      metadata={headerMetadata}
      actions={headerActions}
      kpiStrip={kpiStrip}
      sidebar={sidebar}
      tabs={tabsWithCounts}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      modals={modals}
    >
      {/* ── Active Tab Content Panel ── */}
      {activeTab === 'overview' && (
        <LeadOverviewSection
          lead={lead}
          onEditInquiry={() => setIsEditOpen(true)}
        />
      )}

      {activeTab === 'activities' && (
        <LeadActivitiesSection
          activities={activities}
          onLogActivity={() => setIsActivityOpen(true)}
        />
      )}

      {activeTab === 'tasks' && (
        <LeadTasksSection
          tasks={tasks}
          onNewTask={() => setIsTaskOpen(true)}
          onToggleTask={handleToggleTask}
        />
      )}

      {activeTab === 'communications' && (
        <LeadCommunicationsSection
          messages={messages}
          lead={lead}
        />
      )}

      {activeTab === 'attribution' && (
        <LeadAttributionSection lead={lead} />
      )}

      {activeTab === 'conversion' && (
        <LeadConversionSection
          lead={lead}
          companyId={companyId}
          onOpenConvert={() => setIsConvertOpen(true)}
        />
      )}
    </CrmDetailShell>
  );
}
