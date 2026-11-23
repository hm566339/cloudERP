import {
  LayoutDashboard, Users, UserPlus, Building2, Target, GitBranch,
  FileText, CheckSquare, Calendar, Megaphone, PieChart,
  MessageSquare, Zap, Cable, Settings, TrendingUp, Globe
} from 'lucide-react';

export const CRM_SIDEBAR = [
  { id: 'crm-dashboard', label: 'Dashboard', path: '/sales-crm/dashboard', icon: LayoutDashboard, module: 'CRM' },
  { id: 'crm-leads', label: 'Leads', path: '/sales-crm/leads', icon: UserPlus, module: 'CRM_LEADS' },
  { id: 'crm-accounts', label: 'Accounts', path: '/sales-crm/accounts', icon: Building2, module: 'CRM_ACCOUNTS' },
  { id: 'crm-contacts', label: 'Contacts', path: '/sales-crm/contacts', icon: Users, module: 'CRM_ACCOUNTS' },
  { id: 'crm-opportunities', label: 'Opportunities', path: '/sales-crm/opportunities', icon: Target, module: 'CRM_OPPORTUNITIES' },
  { id: 'crm-pipelines', label: 'Pipelines', path: '/sales-crm/pipelines', icon: GitBranch, module: 'CRM_OPPORTUNITIES' },
  { id: 'crm-quotations', label: 'Quotations', path: '/sales-crm/quotations', icon: FileText, module: 'CRM_QUOTATIONS' },
  { id: 'crm-tasks-activities', label: 'Tasks & Activities', path: '/sales-crm/tasks', icon: CheckSquare, module: 'CRM_ACTIVITIES' },
  { id: 'crm-communications', label: 'Communications', path: '/sales-crm/communications', icon: MessageSquare, module: 'CRM_COMMUNICATION' },
  { id: 'crm-automation', label: 'Automation', path: '/sales-crm/automation', icon: Zap, module: 'CRM_AUTOMATION' },
  { id: 'crm-integrations-campaigns', label: 'Integrations & Campaigns', path: '/sales-crm/integrations', icon: Globe, module: 'CRM_INTEGRATIONS' },
  { id: 'crm-settings', label: 'Settings', path: '/sales-crm/settings', icon: Settings, module: 'CRM_SETTINGS' },
];

export function filterItem(item, hasAccess) {
  if (item.children) {
    const filtered = item.children
      .map((child) => filterItem(child, hasAccess))
      .filter(Boolean);
    if (filtered.length === 0) return null;
    return { ...item, children: filtered };
  }
  if (item.module && !hasAccess(item.module, item.action, 'CRM')) return null;
  return item;
}

export function buildFilteredCrmSidebar(config, hasAccess) {
  return config
    .map((item) => filterItem(item, hasAccess))
    .filter(Boolean);
}

export function buildCrmSidebarLinks(userRole, canAccess) {
  const filtered = buildFilteredCrmSidebar(CRM_SIDEBAR, (feature, action, mod) => {
    if (!feature) return true;
    return canAccess(feature, action, mod || 'CRM');
  });

  if (filtered.length === 0) return [];

  return [{
    id: 'crm',
    label: 'Sales & CRM',
    icon: TrendingUp,
    path: '/sales-crm/dashboard',
    children: filtered,
  }];
}

export default CRM_SIDEBAR;
