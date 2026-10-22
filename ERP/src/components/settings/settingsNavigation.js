import {
  SlidersHorizontal,
  User,
  Building2,
  Users,
  ShieldCheck,
  Bell,
  Globe,
  CreditCard,
  Calculator,
  Boxes,
  Workflow,
  Target,
  Lock
} from 'lucide-react';
import { normalizeModuleKey } from '../../utils/moduleAccess.js';

/**
 * Navigation items for General Settings.
 */
export const GENERAL_SETTINGS_NAV_ITEMS = [
  {
    id: 'general',
    label: 'General Settings',
    shortLabel: 'General',
    path: '/settings/general',
    aliases: ['/settings', '/settings/general'],
    icon: SlidersHorizontal,
    description: 'Basic configuration for your organization and workspace',
    category: 'general',
  },
  {
    id: 'my_account',
    label: 'My Account',
    shortLabel: 'My Account',
    path: '/profile',
    aliases: ['/settings/my-account', '/settings/profile', '/profile'],
    icon: User,
    description: 'Personal profile, email address, password, and preferences',
    category: 'general',
  },
  {
    id: 'organization',
    label: 'Organization Settings',
    shortLabel: 'Organization',
    path: '/settings/organization',
    aliases: ['/organization/settings', '/owner/organization', '/owner/settings', '/settings/organization', '/owner/settings/organization'],
    icon: Building2,
    description: 'Organization identity, legal entity details, and contact email',
    requiresPrivilege: true,
    category: 'general',
  },
  {
    id: 'users_permissions',
    label: 'Users & Permissions',
    shortLabel: 'Users & Permissions',
    path: '/settings/security/users',
    aliases: ['/settings/security/roles', '/settings/security/users', '/users', '/roles', '/security/users', '/security/roles'],
    icon: Users,
    description: 'Team member invitations, role management, and access permissions',
    category: 'general',
  },
  {
    id: 'security',
    label: 'Security & Authentication',
    shortLabel: 'Security',
    path: '/settings/security',
    aliases: ['/settings/security', '/security'],
    icon: ShieldCheck,
    description: 'Multi-factor authentication (2FA), password policies, and session timeouts',
    category: 'general',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    shortLabel: 'Notifications',
    path: '/settings/notifications',
    aliases: ['/settings/notifications'],
    icon: Bell,
    description: 'Configure email alerts, push notifications, and system alerts',
    category: 'general',
  },
  {
    id: 'localization',
    label: 'Localization & Formats',
    shortLabel: 'Localization',
    path: '/settings/preferences',
    aliases: ['/settings/preferences', '/settings/localization'],
    icon: Globe,
    description: 'Currency, timezone, date formats, and language display',
    category: 'general',
  },
  {
    id: 'subscription_billing',
    label: 'Subscription & Billing',
    shortLabel: 'Subscription',
    path: '/settings/plans',
    aliases: ['/settings/plans', '/subscription', '/owner/subscription'],
    icon: CreditCard,
    description: 'Subscription plan, module entitlements, invoices, and billing rules',
    category: 'general',
  },
];

/**
 * Available Module Settings configurations mapped by normalized module key.
 * Only genuine ERP application modules are defined here (no demo sub-features).
 */
export const MODULE_SETTINGS_CONFIG = [
  {
    id: 'module_account',
    moduleKey: 'ACCOUNT',
    label: 'Accounting Module',
    shortLabel: 'Accounting',
    path: '/settings/sales',
    aliases: ['/settings/sales', '/accounts/settings/sales', '/settings/account', '/accounts/settings'],
    icon: Calculator,
    description: 'Quotation terms, delivery conditions, warranty terms, and billing rules',
    category: 'module',
    knownFeatures: [
      'QUOTATIONS',
      'PROFORMA_INVOICES',
      'SALES_ORDERS',
      'SALES_INVOICES',
      'DELIVERY_CHALLANS',
      'PURCHASE_ORDERS',
      'PURCHASE_INVOICES',
      'CUSTOMERS',
      'VENDORS',
      'GENERAL_LEDGER',
      'CHART_OF_ACCOUNTS',
      'BANK_ACCOUNTS',
      'BANK_TRANSACTIONS',
      'EXPENSES',
      'REPORTS',
      'GST_SLABS',
      'HSN_SAC',
      'SETTINGS'
    ],
  },
  {
    id: 'module_inventory',
    moduleKey: 'INVENTORY',
    label: 'Inventory Settings',
    shortLabel: 'Inventory',
    path: '/settings/inventory',
    aliases: ['/settings/inventory', '/inventory/unit-of-measures', '/inventory/warehouses', '/inventory/settings'],
    icon: Boxes,
    description: 'Units of measure, warehouse storage locations, cost layers, and stock rules',
    category: 'module',
    knownFeatures: [
      'PRODUCTS',
      'PRODUCT_CATEGORIES',
      'PRODUCT_PRICES',
      'PRODUCT_BATCHES',
      'PRODUCT_SERIALS',
      'WAREHOUSES',
      'WAREHOUSE_LOCATIONS',
      'STOCKS',
      'STOCK_ADJUSTMENTS',
      'STOCK_TRANSFERS',
      'STOCK_RESERVATIONS',
      'VALUATION'
    ],
  },
  {
    id: 'module_workflow',
    moduleKey: 'WORKFLOW',
    label: 'Workflow Settings',
    shortLabel: 'Workflow',
    path: '/settings/workflow',
    aliases: ['/settings/workflow', '/workflows', '/workflows/definitions', '/settings/workflows'],
    icon: Workflow,
    description: 'Approval thresholds, multi-step workflow rules, triggers, and document flows',
    category: 'module',
    knownFeatures: [
      'WORKFLOW_MANAGEMENT',
      'WORKFLOW_DEFINITIONS',
      'WORKFLOW_TASKS',
      'WORKFLOW_NOTIFICATIONS',
      'WORKFLOW_DOCUMENT_FLOWS',
      'WORKFLOW_TRANSACTIONS',
      'WORKFLOW_ATTACHMENTS',
      'WORKFLOW_CALLBACKS'
    ],
  },
  {
    id: 'module_crm',
    moduleKey: 'CRM',
    label: 'CRM Settings',
    shortLabel: 'CRM',
    path: '/settings/crm',
    aliases: ['/settings/crm', '/crm/communication', '/crm/dashboard', '/crm/settings', '/crm'],
    icon: Target,
    description: 'Customer communication templates, lead stages, and sales lifecycle preferences',
    category: 'module',
    knownFeatures: [
      'CUSTOMERS',
      'LEADS',
      'QUOTATIONS',
      'SALES_ORDERS',
      'COMMUNICATION',
      'ANALYTICS'
    ],
  },
  {
    id: 'module_sso',
    moduleKey: 'SSO',
    label: 'SSO & Access Management',
    shortLabel: 'SSO / Access',
    path: '/settings/security/features',
    aliases: ['/settings/security/features', '/settings/security/permissions', '/portal-access', '/admin', '/security/features'],
    icon: Lock,
    description: 'Feature catalog permissions, directory authentication, and token sessions',
    category: 'module',
    knownFeatures: [
      'USER_MANAGEMENT',
      'ROLE_MANAGEMENT',
      'PERMISSION_MANAGEMENT',
      'ORGANIZATION_MANAGEMENT',
      'COMPANY_MANAGEMENT',
      'MODULE_MANAGEMENT',
      'AUTHENTICATION',
      'SUBSCRIPTION_MANAGEMENT',
      'SESSION_MANAGEMENT',
      'AUDIT_LOGS'
    ],
  },
];

/**
 * Helper to build route paths consistently supporting optional company scope.
 */
export function buildSettingsPath(rawPath, companyId) {
  if (!rawPath) return '/settings/general';
  const clean = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  if (!companyId) return clean;
  // If companyId is supplied and route doesn't already have /company/
  if (clean.startsWith('/company/')) return clean;
  // Keep owner and global profile paths clean
  if (clean.startsWith('/owner/') || clean === '/profile' || clean.startsWith('/profile')) {
    return clean;
  }
  return `/company/${companyId}${clean}`;
}

/**
 * Calculates a match score between an item's paths and currentPath.
 * Higher score indicates a better / more specific match.
 */
function scoreItemPathMatch(itemPaths, currentPath, pathWithoutCompany) {
  let highestScore = 0;
  const isGenericSettingsRoot = (p) => p === '/settings' || p.endsWith('/settings');

  itemPaths.forEach((p) => {
    const cleanP = p.replace(/\/+$/, '').toLowerCase();
    if (!cleanP) return;

    // Exact Match
    if (currentPath === cleanP || pathWithoutCompany === cleanP) {
      const score = 1000 + cleanP.length;
      if (score > highestScore) highestScore = score;
    }
    // Sub-path / Prefix Match (e.g. /settings/security/users starts with /settings/security)
    else if (
      !isGenericSettingsRoot(cleanP) &&
      (currentPath.startsWith(`${cleanP}/`) || pathWithoutCompany.startsWith(`${cleanP}/`))
    ) {
      const score = 500 + cleanP.length;
      if (score > highestScore) highestScore = score;
    }
  });

  return highestScore;
}

/**
 * Dynamically resolves accessible Settings navigation groups based on
 * live application state, API modules, features, permissions, and roles.
 */
export function resolveSettingsNavigation({
  modules = [],
  features = [],
  permissions = [],
  userRole = 'employee',
  memberType = null,
  isOwner = false,
  companyId = null,
  currentPath = '',
} = {}) {
  const isPrivileged =
    isOwner ||
    memberType === 'OWNER' ||
    String(userRole).toLowerCase() === 'owner' ||
    String(userRole).toLowerCase() === 'super_admin' ||
    String(userRole).toLowerCase() === 'admin';

  // 1. Resolve Active Entitled Modules
  const normalizedActiveModuleKeys = new Set();
  
  if (Array.isArray(modules) && modules.length > 0) {
    modules.forEach((mod) => {
      if (!mod) return;
      const rawKey = typeof mod === 'string' ? mod : (mod.moduleKey || mod.code || mod.moduleName || mod.name || mod.key);
      const isActive = typeof mod === 'object' ? (mod.active !== false && mod.status !== 'INACTIVE') : true;
      if (isActive && rawKey) {
        const rawUpper = String(rawKey).toUpperCase();
        normalizedActiveModuleKeys.add(rawUpper);
        const norm = normalizeModuleKey(rawKey);
        if (norm) {
          const normUpper = norm.toUpperCase();
          normalizedActiveModuleKeys.add(normUpper);
          if (normUpper === 'FINANCE') normalizedActiveModuleKeys.add('ACCOUNT');
          if (normUpper === 'ACCOUNT') normalizedActiveModuleKeys.add('FINANCE');
        }
      }
    });
  } else {
    // If no modules array was provided, fallback to active application modules
    ['ACCOUNT', 'FINANCE', 'INVENTORY', 'WORKFLOW', 'CRM', 'SSO'].forEach(m => normalizedActiveModuleKeys.add(m));
  }

  // Normalize current path for comparison
  const normalizedCurrentPath = (currentPath || '').replace(/\/+$/, '').toLowerCase();
  const pathWithoutCompany = normalizedCurrentPath.replace(/^\/company\/[^/]+/, '');

  // 2. Resolve General Settings Items
  let bestScore = 0;
  let scoredActiveItem = null;

  const generalItems = GENERAL_SETTINGS_NAV_ITEMS.filter((item) => {
    if (item.requiresPrivilege && !isPrivileged) return false;
    return true;
  }).map((item) => {
    const fullPath = buildSettingsPath(item.path, companyId);
    const allPaths = [
      item.path.toLowerCase(),
      fullPath.toLowerCase(),
      ...(item.aliases || []).map(a => a.toLowerCase()),
      ...(item.aliases || []).map(a => buildSettingsPath(a, companyId).toLowerCase())
    ];

    const matchScore = scoreItemPathMatch(allPaths, normalizedCurrentPath, pathWithoutCompany);
    if (matchScore > bestScore) {
      bestScore = matchScore;
      scoredActiveItem = item.id;
    }

    return {
      ...item,
      fullPath,
      matchScore,
    };
  });

  // 3. Associate Features to Modules & Resolve Module Settings Items
  const moduleItems = MODULE_SETTINGS_CONFIG.filter((cfg) => {
    // Only show active modules
    const normCfgKey = normalizeModuleKey(cfg.moduleKey).toUpperCase();
    return (
      normalizedActiveModuleKeys.has(cfg.moduleKey) ||
      normalizedActiveModuleKeys.has(normCfgKey)
    );
  }).map((cfg) => {
    const fullPath = buildSettingsPath(cfg.path, companyId);
    const allPaths = [
      cfg.path.toLowerCase(),
      fullPath.toLowerCase(),
      ...(cfg.aliases || []).map(a => a.toLowerCase()),
      ...(cfg.aliases || []).map(a => buildSettingsPath(a, companyId).toLowerCase())
    ];

    const matchScore = scoreItemPathMatch(allPaths, normalizedCurrentPath, pathWithoutCompany);
    if (matchScore > bestScore) {
      bestScore = matchScore;
      scoredActiveItem = cfg.id;
    }

    // Associated features from live API
    const associatedFeatures = (Array.isArray(features) ? features : []).filter(
      f => f && (f.moduleName?.toUpperCase() === cfg.moduleKey || f.module?.toUpperCase() === cfg.moduleKey)
    );

    return {
      ...cfg,
      fullPath,
      matchScore,
      associatedFeatures: associatedFeatures.length > 0 ? associatedFeatures : cfg.knownFeatures.map(code => ({ code, name: code })),
    };
  });

  // If no route matched with score > 0, fallback to general if on /settings
  const finalActiveId = scoredActiveItem || (normalizedCurrentPath.includes('settings') ? 'general' : generalItems[0]?.id);

  // Set final isActive flags
  const finalGeneralItems = generalItems.map(i => ({ ...i, isActive: i.id === finalActiveId }));
  const finalModuleItems = moduleItems.map(m => ({ ...m, isActive: m.id === finalActiveId }));

  const allItems = [...finalGeneralItems, ...finalModuleItems];
  const activeItem = allItems.find(item => item.id === finalActiveId) || finalGeneralItems[0];
  const activeGroup = finalGeneralItems.some(i => i.id === finalActiveId) ? 'general' : 'module';

  return {
    generalItems: finalGeneralItems,
    moduleItems: finalModuleItems,
    allItems,
    activeItem,
    activeGroup,
  };
}
