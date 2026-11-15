import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Phone,
  Users,
  Mail,
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
  Filter
} from 'lucide-react';
import { PageHeader } from '../../../components/common';
import { useGetCrmActivitiesQuery } from '../../../api/sales-crm/crm.api';
import ActivityFormModal from '../components/ActivityFormModal';

export default function ActivitiesPage() {
  const { companyId } = useParams();
  const [selectedType, setSelectedType] = useState('');
  const [isLogOpen, setIsLogOpen] = useState(false);

  const { data: activitiesRes, isLoading, refetch } = useGetCrmActivitiesQuery({
    companyId,
    activityType: selectedType || undefined,
  });

  const activities = activitiesRes?.data || [];

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Customer Interaction Timeline"
        subtitle={`Audit trail of ${activities.length} logged phone calls, client meetings, emails and internal notes.`}
        actions={
          <button
            onClick={() => setIsLogOpen(true)}
            className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5"
          >
            <Plus size={14} /> Log Activity
          </button>
        }
      />

      <div className="flex items-center gap-2 p-3 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-sm">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1C202B] text-zinc-800 dark:text-[#E6E8EE]"
        >
          <option value="">All Activity Types</option>
          <option value="CALL">Phone Calls</option>
          <option value="MEETING">Client Meetings</option>
          <option value="EMAIL">Email Threads</option>
          <option value="NOTE">Internal Notes</option>
        </select>
      </div>

      <div className="bg-white dark:bg-[#161922] p-5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm space-y-4">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-zinc-400">Loading activity timeline...</div>
        ) : activities.length === 0 ? (
          <div className="p-10 text-center text-xs text-zinc-400 space-y-2">
            <Clock size={32} className="mx-auto text-zinc-300 dark:text-zinc-600" />
            <p>No customer activities logged yet.</p>
            <button onClick={() => setIsLogOpen(true)} className="btn-primary text-xs px-3 py-1.5">
              Log First Interaction
            </button>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-zinc-200 dark:before:bg-[#2A2F3D]">
            {activities.map((a) => {
              let Icon = FileText;
              let iconBg = 'bg-primary/10 text-primary';
              if (a.activityType === 'CALL') {
                Icon = Phone;
                iconBg = 'bg-blue-500/10 text-blue-500';
              } else if (a.activityType === 'MEETING') {
                Icon = Users;
                iconBg = 'bg-emerald-500/10 text-emerald-500';
              } else if (a.activityType === 'EMAIL') {
                Icon = Mail;
                iconBg = 'bg-purple-500/10 text-purple-500';
              }

              return (
                <div key={a.id} className="relative group">
                  <div className={`absolute -left-6 top-1 p-1 rounded-full ring-4 ring-white dark:ring-[#161922] ${iconBg}`}>
                    <Icon size={12} />
                  </div>
                  <div className="p-4 bg-zinc-50 dark:bg-[#1C202B] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-zinc-900 dark:text-white">{a.subject}</span>
                      <span className="text-[11px] font-mono text-zinc-400">
                        {new Date(a.createdAt || Date.now()).toLocaleString()}
                      </span>
                    </div>
                    {a.description && (
                      <p className="text-xs text-zinc-600 dark:text-[#A0A6B5] whitespace-pre-line leading-relaxed">
                        {a.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-[11px] text-zinc-500 pt-1">
                      <span>Type: <strong className="uppercase">{a.activityType}</strong></span>
                      {a.outcome && <span>Outcome: <strong className="text-zinc-700 dark:text-[#E6E8EE]">{a.outcome}</strong></span>}
                      {a.durationMinutes > 0 && <span>Duration: <strong>{a.durationMinutes} mins</strong></span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ActivityFormModal
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
        companyId={companyId}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

