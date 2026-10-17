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
  const isSsoEntitled = entitledModules.includes('SSO');

  const allModules = [
    {
      id: 'finance',
      label: 'Finance & Accounts',
      icon: Calculator,
      isEntitled: isFinanceEntitled,
      moduleKey: 'ACCOUNT',
      path: activeCompanyId ? `/company/${activeCompanyId}/accounts/dashboard` : '/accounts/dashboard',
      accentColor: 'text-emerald-600',
      isNonClickable: true,
    },
    {
      id: 'inventory',
      label: 'Inventory Management',
      icon: Boxes,
      isEntitled: isInventoryEntitled,
      moduleKey: 'INVENTORY',
      path: activeCompanyId ? `/company/${activeCompanyId}/inventory/dashboard` : '/inventory/dashboard',
      accentColor: 'text-amber-600',
      isNonClickable: true,
    },
    {
      id: 'sales',
      label: 'Sales & CRM',
      icon: ShoppingCart,
      isEntitled: isCrmEntitled,
      moduleKey: 'CRM',
      path: activeCompanyId ? `/company/${activeCompanyId}/crm/dashboard` : '/crm/dashboard',
      accentColor: 'text-blue-600',
      isNonClickable: true,
    },
    {
      id: 'purchases',
      label: 'Purchasing & Procurement',
      icon: Briefcase,
      isEntitled: isPurchasesEntitled,
      moduleKey: 'PURCHASES',
      path: activeCompanyId ? `/company/${activeCompanyId}/purchases` : '/purchase-requisitions',
      accentColor: 'text-rose-600',
      isNonClickable: true,
    },
    {
      id: 'workflow',
      label: 'Workflow Automation',
      icon: Workflow,
      isEntitled: isWorkflowEntitled,
      moduleKey: 'WORKFLOW',
      path: activeCompanyId ? `/company/${activeCompanyId}/workflows` : '/workflows',
      accentColor: 'text-purple-600',
      isNonClickable: true,
    },
    {
      id: 'sso',
      label: 'SSO & Administration',
      icon: ShieldCheck,
      isEntitled: isSsoEntitled,
      moduleKey: 'SSO',
      path: activeCompanyId ? `/company/${activeCompanyId}/admin` : '/admin',
      accentColor: 'text-indigo-600',
      isNonClickable: true,
    },
  ];

  // ONLY include modules that are available in this organization
  const availableOrgModules = allModules.filter((m) => m.isEntitled);

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
      isDisplayOnly: true,
      items: allModules,
    },
    {
      id: 'settings-group',
      title: 'SETTINGS',
      items: [
        {
          id: 'organization-settings',
          label: 'Organization Settings',
          path: '/owner/settings',
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
