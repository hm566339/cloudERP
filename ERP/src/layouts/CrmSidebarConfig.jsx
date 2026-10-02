import {
  LayoutDashboard, Users, UserPlus, FileText, ShoppingCart,
  BarChart3, MessageSquare, TrendingUp
} from 'lucide-react';

export const CRM_SIDEBAR = [
  { id: 'crm-dashboard', label: 'Dashboard', path: '/crm/dashboard', icon: LayoutDashboard, module: 'DASHBOARD' },
  { id: 'crm-customers', label: 'Customers', path: '/crm/customers', icon: Users, module: 'CUSTOMERS' },
  { id: 'crm-leads', label: 'Leads', path: '/crm/leads', icon: UserPlus, module: 'LEADS' },
  { id: 'crm-quotations', label: 'Quotations', path: '/crm/quotations', icon: FileText, module: 'QUOTATIONS' },
  { id: 'crm-orders', label: 'Orders', path: '/crm/orders', icon: ShoppingCart, module: 'ORDERS' },
  { id: 'crm-analytics', label: 'Reports', path: '/crm/analytics', icon: BarChart3, module: 'ANALYTICS' },
];

function filterItem(item, hasAccess) {
  if (item.children) {
    const filtered = item.children
      .map((child) => filterItem(child, hasAccess))
      .filter(Boolean);
    if (filtered.length === 0) return null;
    return { ...item, children: filtered };
  }
  // If item has a feature module check
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
    label: 'CRM',
    icon: TrendingUp,
    path: '/crm/dashboard',
    children: filtered,
  }];
}
