import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckSquare, Calendar } from 'lucide-react';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { crmTasksActivitiesTabs } from '../../../components/module-tabs';

export const TASKS_ACTIVITIES_TABS = crmTasksActivitiesTabs;

export default function TasksActivitiesHeader({
  activeTab,
  title,
  subtitle,
  description,
  actions,
  children,
}) {
  const location = useLocation();

  // Determine current active tab
  const resolvedTabKey = useMemo(() => {
    if (activeTab) return activeTab.toLowerCase();
    const path = (location.pathname || '').toLowerCase();
    if (path.includes('/activities')) return 'activities';
    return 'tasks';
  }, [activeTab, location.pathname]);

  const currentTabConfig = useMemo(() => {
    return (
      crmTasksActivitiesTabs.find((t) => t.key === resolvedTabKey) ||
      crmTasksActivitiesTabs[0]
    );
  }, [resolvedTabKey]);

  const defaultTitles = {
    tasks: {
      title: 'CRM Action Tasks',
      desc: 'Tracking sales follow-ups, calls, and action items',
      icon: CheckSquare,
    },
    activities: {
      title: 'Customer Interaction Timeline',
      desc: 'Audit trail of logged phone calls, client meetings, emails and internal notes',
      icon: Calendar,
    },
  };

  const currentDefaults = defaultTitles[resolvedTabKey] || defaultTitles.tasks;
  const effectiveTitle = title || currentDefaults.title;
  const effectiveSubtitle = subtitle || description || currentDefaults.desc;
  const TabIcon = currentTabConfig.icon || currentDefaults.icon;

  const actionElements = actions || children;

  return (
    <>
      <PageHeader
        title={effectiveTitle}
        description={effectiveSubtitle}
        icon={TabIcon}
        actions={actionElements}
      />
      <ModuleTabs tabs={crmTasksActivitiesTabs} activeTab={resolvedTabKey} />
    </>
  );
}

export function TasksActivitiesLayout({
  activeTab,
  title,
  subtitle,
  description,
  actions,
  children,
}) {
  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117] overflow-hidden">
      <TasksActivitiesHeader
        activeTab={activeTab}
        title={title}
        subtitle={subtitle}
        description={description}
        actions={actions}
      />
      <div className="flex-1 overflow-auto flex flex-col">{children}</div>
    </div>
  );
}
