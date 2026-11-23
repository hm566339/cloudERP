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
  Filter,
  RefreshCw
} from 'lucide-react';
import TasksActivitiesHeader from '../components/TasksActivitiesHeader';
import { Select } from '../../../components/common';
import { useGetCrmActivitiesQuery } from '../../../api/sales-crm/crm.api';
import ActivityFormModal from '../components/ActivityFormModal';

export default function ActivitiesPage() {
  const { companyId } = useParams();
  const [selectedType, setSelectedType] = useState('');
  const [isLogOpen, setIsLogOpen] = useState(false);

  const { data: activitiesRes, isLoading, refetch, isFetching } = useGetCrmActivitiesQuery({
    companyId,
    activityType: selectedType || undefined,
  });

  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.content)) return res.data.content;
    return [];
  };

  const activities = toArray(activitiesRes);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <TasksActivitiesHeader
        activeTab="activities"
        actions={
          <button
            type="button"
            onClick={() => setIsLogOpen(true)}
            className="btn-primary flex items-center gap-1.5 text-xs font-semibold h-8 px-3.5 cursor-pointer rounded-lg shadow-sm"
          >
            <Plus size={15} />
            <span>Log Activity</span>
          </button>
        }
      />

      <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-5 min-h-0">
        {/* Filter toolbar */}
        <div className="bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A0A6B5]">Activity Type</span>
            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-56"
            >
              <option value="">All Activity Types</option>
              <option value="CALL">Phone Calls</option>
              <option value="MEETING">Client Meetings</option>
              <option value="EMAIL">Email Threads</option>
              <option value="NOTE">Internal Notes</option>
            </Select>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 px-3 text-[10.4px] font-semibold text-zinc-600 dark:text-[#A0A6B5] hover:text-zinc-900 dark:hover:text-[#E6E8EE] bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg hover:bg-zinc-50 dark:hover:bg-[#222736] transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs cursor-pointer"
            title="Refresh Timeline"
          >
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="bg-white dark:bg-[#161922] p-6 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm flex-1">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-zinc-400">Loading activity timeline...</div>
          ) : activities.length === 0 ? (
            <div className="p-16 text-center text-xs text-zinc-400 space-y-3">
              <Clock size={36} className="mx-auto text-zinc-300 dark:text-zinc-600" />
              <p className="text-sm font-semibold text-zinc-700 dark:text-[#E6E8EE]">No customer activities logged yet</p>
              <p className="text-xs text-zinc-500">Record phone calls, in-person meetings, and email threads to establish an audit trail.</p>
              <button
                onClick={() => setIsLogOpen(true)}
                className="btn-primary inline-flex items-center gap-1.5 text-xs font-semibold"
              >
                <Plus size={13} />
                <span>Log First Interaction</span>
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
