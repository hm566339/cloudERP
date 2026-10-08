import {
  LayoutDashboard,
  Building2,
  Calculator,
  Boxes,
  ShoppingCart,
  Briefcase,
  Settings,
  CreditCard,
  ShieldCheck,
  Workflow,
} from 'lucide-react';

/**
 * Navigation configuration for Owner Dashboard & Workspace.
 * Data-driven configuration with section groupings:
 * 1. Dashboard
 * 2. My Company
 * 3. Modules
 * 4. Settings
 *
 * @param {Object} params
 * @param {string[]} params.entitledModules - array of normalized module IDs
 * @param {string|null} params.activeCompanyId - ID of currently selected company
 * @param {number} params.companiesCount - number of accessible companies
 * @param {boolean} params.isTrial - whether subscription is in trial
 * @param {number|null} params.daysRemaining - days left on trial
 * @param {boolean} params.isActive - whether subscription is active
 */
export function getOwnerSidebarNavGroups({
  entitledModules = [],
  activeCompanyId = null,
  companiesCount = 0,
  isTrial = false,
  daysRemaining = null,
  isActive = false,
} = {}) {
  const isFinanceEntitled = entitledModules.includes('ACCOUNT');
  const isInventoryEntitled = entitledModules.includes('INVENTORY');
  const isCrmEntitled = entitledModules.includes('CRM');
  const isPurchasesEntitled =
    entitledModules.includes('PURCHASES') || entitledModules.includes('ACCOUNT');
  const isWorkflowEntitled = entitledModules.includes('WORKFLOW');

  return [
    {
      id: 'dashboard-group',
      title: null, // Top level group without section header
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          path: '/owner/dashboard',
          icon: LayoutDashboard,
          isEntitled: true,
        },
      ],
    },
    {
      id: 'my-company-group',
      title: 'MY COMPANY',
      items: [
        {
          id: 'companies',
          label: 'Companies',
          path: '/owner/companies',
          icon: Building2,
          badge: companiesCount > 0 ? `${companiesCount}` : null,
          badgeColor: 'bg-zinc-100 text-zinc-600',
          isEntitled: true,
        },
      ],
    },
    {
      id: 'modules-group',
      title: 'MODULES',
      items: [
        {
          id: 'finance',
          label: 'Finance & Accounts',
          path: '/accounts/dashboard',
          icon: Calculator,
          isEntitled: isFinanceEntitled,
          moduleKey: 'ACCOUNT',
          accentColor: 'text-emerald-600',
        },
        {
          id: 'inventory',
          label: 'Inventory Management',
          path: '/inventory/dashboard',
          icon: Boxes,
          isEntitled: isInventoryEntitled,
          moduleKey: 'INVENTORY',
          accentColor: 'text-amber-600',
        },
        {
          id: 'sales',
          label: 'Sales & CRM',
          path: '/crm/dashboard',
          icon: ShoppingCart,
          isEntitled: isCrmEntitled,
          moduleKey: 'CRM',
          accentColor: 'text-blue-600',
        },
        {
          id: 'purchases',
          label: 'Purchasing & Procurement',
          path: '/purchase-requisitions',
          icon: Briefcase,
          isEntitled: isPurchasesEntitled,
          moduleKey: 'PURCHASES',
          accentColor: 'text-rose-600',
        },
        {
          id: 'workflow',
          label: 'Workflow Automation',
          path: '/workflows',
          icon: Workflow,
          isEntitled: isWorkflowEntitled,
          moduleKey: 'WORKFLOW',
          accentColor: 'text-purple-600',
        },
      ],
    },
    {
      id: 'settings-group',
      title: 'SETTINGS',
      items: [
        {
          id: 'organization-settings',
          label: 'Organization Settings',
          path: '/accounts/settings',
          icon: Settings,
          isEntitled: true,
        },
        {
          id: 'subscription-billing',
          label: 'Subscription / Billing',
          path: '/subscription',
          icon: CreditCard,
          badge: isTrial && daysRemaining !== null ? `${daysRemaining}d left` : (isActive ? 'Active' : null),
          badgeColor: isTrial ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700',
          isEntitled: true,
        },
        {
          id: 'owner-profile',
          label: 'Owner Profile',
          path: '/profile',
          icon: ShieldCheck,
          isEntitled: true,
        },
      ],
    },
  ];
}
