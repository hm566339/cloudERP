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
  Users,
  Factory,
} from 'lucide-react';
import { normalizeModuleName } from '../utils/moduleNormalization.js';

/**
 * Master catalog mapping of ERP business modules with rich UI configuration.
 * Configured routes and metadata for all canonical business modules.
 */
export const OWNER_MODULE_CATALOG = {
  ACCOUNT: {
    id: 'finance',
    moduleKey: 'ACCOUNT',
    label: 'Finance & Accounts',
    icon: Calculator,
    accentColor: 'text-emerald-600',
    path: (companyId) => (companyId ? `/company/${companyId}/accounts/dashboard` : '/accounts/dashboard'),
  },
  INVENTORY: {
    id: 'inventory',
    moduleKey: 'INVENTORY',
    label: 'Inventory Management',
    icon: Boxes,
    accentColor: 'text-amber-600',
    path: (companyId) => (companyId ? `/company/${companyId}/inventory/dashboard` : '/inventory/dashboard'),
  },
  CRM: {
    id: 'sales',
    moduleKey: 'CRM',
    label: 'Sales & CRM',
    icon: ShoppingCart,
    accentColor: 'text-blue-600',
    path: (companyId) => (companyId ? `/company/${companyId}/crm/dashboard` : '/crm/dashboard'),
  },
  PURCHASES: {
    id: 'purchases',
    moduleKey: 'PURCHASES',
    label: 'Purchasing & Procurement',
    icon: Briefcase,
    accentColor: 'text-rose-600',
    path: (companyId) => (companyId ? `/company/${companyId}/purchases` : '/purchase-requisitions'),
  },
  WORKFLOW: {
    id: 'workflow',
    moduleKey: 'WORKFLOW',
    label: 'Workflow Automation',
    icon: Workflow,
    accentColor: 'text-purple-600',
    path: (companyId) => (companyId ? `/company/${companyId}/workflows` : '/workflows'),
  },
  SSO: {
    id: 'sso',
    moduleKey: 'SSO',
    label: 'SSO & Administration',
    icon: ShieldCheck,
    accentColor: 'text-indigo-600',
    path: (companyId) => (companyId ? `/company/${companyId}/admin` : '/admin'),
  },
  HR: {
    id: 'hr',
    moduleKey: 'HR',
    label: 'HR & Employees',
    icon: Users,
    accentColor: 'text-teal-600',
    path: (companyId) => (companyId ? `/company/${companyId}/hr` : '/hr'),
  },
  MANUFACTURING: {
    id: 'manufacturing',
    moduleKey: 'MANUFACTURING',
    label: 'Manufacturing',
    icon: Factory,
    accentColor: 'text-cyan-600',
    path: (companyId) => (companyId ? `/company/${companyId}/manufacturing` : '/manufacturing'),
  },
};

/**
 * Standard default core modules order in Owner Console.
 */
const DEFAULT_CORE_MODULE_KEYS = ['ACCOUNT', 'INVENTORY', 'CRM', 'PURCHASES', 'WORKFLOW', 'SSO'];

/**
 * Navigation configuration for Owner Dashboard & Workspace.
 * Data-driven configuration with section groupings:
 * 1. Dashboard
 * 2. My Company
 * 3. Modules (Dynamically driven from organization module data)
 * 4. Settings
 *
 * @param {Object} params
 * @param {string[]} params.entitledModules - array of normalized active module keys
 * @param {Array} params.modules - raw or normalized modules array from authContext
 * @param {string|null} params.activeCompanyId - ID of currently selected company
 * @param {number} params.companiesCount - number of accessible companies
 * @param {boolean} params.isTrial - whether subscription is in trial
 * @param {number|null} params.daysRemaining - days left on trial
 * @param {boolean} params.isActive - whether subscription is active
 */
export function getOwnerSidebarNavGroups({
  entitledModules = [],
  modules = [],
  activeCompanyId = null,
  companiesCount = 0,
  isTrial = false,
  daysRemaining = null,
  isActive = false,
} = {}) {
  // Determine all module keys present for the organization
  const moduleKeysSet = new Set();

  // 1. Add any modules explicitly present in authContext.modules
  if (Array.isArray(modules) && modules.length > 0) {
    modules.forEach((m) => {
      const canonical = m?.canonical || normalizeModuleName(m);
      if (canonical) {
        moduleKeysSet.add(canonical);
      }
    });
  }

  // 2. Ensure all entitled active modules are present
  (entitledModules || []).forEach((key) => {
    if (key) {
      moduleKeysSet.add(key);
    }
  });

  // 3. Always include standard core modules so inactive / locked modules can be cleanly upgraded
  DEFAULT_CORE_MODULE_KEYS.forEach((key) => {
    moduleKeysSet.add(key);
  });

  // Build sorted list preserving catalog core order followed by any extension modules
  const allKeys = Array.from(moduleKeysSet);
  const orderedKeys = [
    ...DEFAULT_CORE_MODULE_KEYS.filter((k) => allKeys.includes(k)),
    ...allKeys.filter((k) => !DEFAULT_CORE_MODULE_KEYS.includes(k)),
  ];

  const moduleItems = orderedKeys.map((key) => {
    const meta = OWNER_MODULE_CATALOG[key] || {
      id: key.toLowerCase(),
      moduleKey: key,
      label: key,
      icon: Boxes,
      accentColor: 'text-zinc-600',
      path: (cId) => (cId ? `/company/${cId}/${key.toLowerCase()}` : `/${key.toLowerCase()}`),
    };

    let isEntitled = entitledModules.includes(key);
    if (key === 'PURCHASES' && (entitledModules.includes('PURCHASES') || entitledModules.includes('ACCOUNT'))) {
      isEntitled = true;
    }

    return {
      id: meta.id,
      label: meta.label,
      icon: meta.icon,
      isEntitled,
      moduleKey: key,
      path: isEntitled ? meta.path(activeCompanyId) : '/subscription',
      accentColor: meta.accentColor,
      badge: isEntitled ? 'Active' : 'Locked',
      badgeColor: isEntitled
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
        : 'bg-zinc-100 text-zinc-500 border border-zinc-200/80',
    };
  });

  return [
    {
      id: 'dashboard-group',
      title: null, // Top-level group without section header
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
      items: moduleItems,
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
