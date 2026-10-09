import {
  Banknote,
  Users,
  Box,
  ShoppingCart,
  Briefcase,
  Factory,
  Building2,
  Workflow,
  ClipboardCheck,
  ShieldCheck,
  Layers,
  Globe,
} from 'lucide-react';

export const MODULE_DEFINITIONS = [
  { key: 'finance', label: 'Finance & Accounts', dashboardPath: 'accounts/dashboard' },
  { key: 'sales', label: 'Sales & CRM', dashboardPath: 'sales-crm' },
  { key: 'purchase', label: 'Purchase Management', dashboardPath: 'purchases' },
  { key: 'inventory', label: 'Inventory Management', dashboardPath: 'inventory' },
  { key: 'manufacturing', label: 'Manufacturing', dashboardPath: 'manufacturing' },
  { key: 'hr', label: 'HR & Employees', dashboardPath: 'hr' },
  { key: 'crm', label: 'Sales & CRM', dashboardPath: 'sales-crm' },
  { key: 'sso', label: 'SSO & Administration', dashboardPath: 'admin' },
  { key: 'workflow', label: 'Workflow & Approvals', dashboardPath: 'workflows' },
]

const MODULE_ALIASES = {
  account: 'finance',
  accounts: 'finance',
  accounting: 'finance',
  banking: 'finance',
  budget: 'finance',
  budgeting: 'finance',
  finance: 'finance',
  hsn: 'finance',
  gst: 'finance',
  masters: 'finance',
  customers: 'finance',
  vendors: 'finance',
  expense: 'finance',
  expenses: 'finance',
  hr: 'hr',
  humanresources: 'hr',
  employee: 'hr',
  employees: 'hr',
  inventory: 'inventory',
  stock: 'inventory',
  stocks: 'inventory',
  warehouse: 'inventory',
  sales: 'sales',
  sale: 'sales',
  salescrm: 'sales',
  salescrmorders: 'sales',
  salescrmquotations: 'sales',
  salescrminvoices: 'sales',
  purchase: 'purchases',
  purchases: 'purchases',
  procurement: 'purchases',
  vendor: 'purchases',
  vendors: 'purchases',
  manufacturing: 'manufacturing',
  production: 'manufacturing',
  crm: 'crm',
  customerrelationshipmanagement: 'crm',
  workflow: 'workflow',
  workflows: 'workflow',
  wf: 'workflow',
  approval: 'workflow',
  approvals: 'workflow',
  sso: 'sso',
  auth: 'sso',
  authentication: 'sso',
  admin: 'sso',
  administration: 'sso',
  portalaccess: 'sso',
  platformadmin: 'sso',
  user: 'sso',
  role: 'sso',
  permission: 'sso',
  session: 'sso',
}

export function getDashboardPathFromModuleName(moduleName) {
  if (!moduleName) return null;
  const normalized = String(moduleName).toLowerCase().trim();
  const coreModule = MODULE_ALIASES[normalized] || normalized;

  const def = MODULE_DEFINITIONS.find(m => m.key === coreModule || m.dashboardPath === coreModule);
  if (def) return def.dashboardPath;

  if (normalized.includes('sso') || normalized.includes('admin') || normalized.includes('auth')) return 'admin';
  if (normalized.includes('account') || normalized.includes('finance')) return 'accounts/dashboard';
  if (normalized.includes('sales') || normalized.includes('crm')) return 'sales-crm';
  if (normalized.includes('purch')) return 'purchases';
  if (normalized.includes('inventor')) return 'inventory';

  return null;
}


export function normalizeModuleKey(value) {
  if (!value) return ''

  if (typeof value === 'object') {
    return normalizeModuleKey(
      value.moduleName ||
      value.name ||
      value.key ||
      value.moduleCode ||
      value.module?.moduleName ||
      value.module?.name ||
      value.module?.moduleCode ||
      value.module?.key ||
      value.module?.id ||
      value.moduleType ||
      value.code ||
      value.id
    )
  }

  const raw = String(value).trim().toLowerCase()
  if (!raw) return ''

  const compact = raw.replace(/[^a-z0-9]/g, '')
  if (MODULE_ALIASES[compact]) return MODULE_ALIASES[compact]

  const matched = Object.entries(MODULE_ALIASES).find(([alias]) =>
    compact.includes(alias)
  )
  return matched?.[1] || compact
}

export function getPermissionModuleKeys(permissions = [], userRole = 'employee', memberType = null) {
  const isOwner = memberType === 'OWNER' || String(userRole).toLowerCase() === 'owner';
  if (userRole === 'super_admin' || isOwner || permissions?.includes('all') || permissions?.includes('all_modules') || permissions?.includes('ALL_MODULES')) {
    return MODULE_DEFINITIONS.map((module) => module.key)
  }

  return [...new Set(
    (permissions || [])
      .map((permission) => normalizeModuleKey(permission?.module || permission?.moduleName || permission))
      .filter(Boolean)
  )]
}

export function getCompanyModuleAssignments(companyModulesData, companyId, options = {}) {
  const { activeOnly = true } = options
  const assignments =
    companyModulesData?.companyModuleResponse ||
    companyModulesData?.companyModules ||
    companyModulesData?.modules ||
    (Array.isArray(companyModulesData) ? companyModulesData : [])

  return (assignments || []).filter((assignment) => {
    const assignmentCompanyId =
      assignment.company?.id ||
      assignment.companyId ||
      assignment.company ||
      assignment.tenantId

    const hasCompanyInfo = 'company' in assignment || 'companyId' in assignment || 'tenantId' in assignment;
    const sameCompany = !companyId || !hasCompanyInfo || assignmentCompanyId?.toString() === companyId?.toString()
    const active = assignment.active ?? assignment.status ?? assignment.module?.moduleStatus ?? true
    const isActive = active !== false && active !== 'INACTIVE' && active !== 'SUSPENDED'
    return sameCompany && (!activeOnly || isActive)
  })
}

export function getCompanyModuleKeys(companyModulesData, companyId) {
  return [...new Set(
    getCompanyModuleAssignments(companyModulesData, companyId)
      .map((assignment) => normalizeModuleKey(assignment))
      .filter(Boolean)
  )]
}

export function getAccessibleModuleKeys({ userRole, memberType, permissions, companyModulesData, companyId, authModules = [] }) {
  const permissionKeys = getPermissionModuleKeys(permissions, userRole, memberType)
  const companyKeys = getCompanyModuleKeys(companyModulesData, companyId)
  
  // Extract active entitled module keys from the backend session/context response
  const authModuleKeys = (Array.isArray(authModules) ? authModules : [])
    .filter((m) => m && (m.active !== false && m.status !== 'INACTIVE'))
    .map((m) => normalizeModuleKey(m))
    .filter(Boolean);

  const combinedBackendKeys = [...new Set([...companyKeys, ...authModuleKeys])];

  const isOwner = memberType === 'OWNER' || String(userRole).toLowerCase() === 'owner';
  if (combinedBackendKeys.length === 0) {
    return permissionKeys;
  }
  if (isOwner || userRole === 'company_admin' || userRole === 'super_admin') {
    return combinedBackendKeys;
  }

  return combinedBackendKeys.filter((key) => permissionKeys.includes(key))
}

export function getModuleDashboardPath(companyId, moduleKey) {
  const normalized = normalizeModuleKey(moduleKey);
  const module = MODULE_DEFINITIONS.find((item) => item.key === normalized);
  const subPath = module?.dashboardPath || (normalized === 'sso' ? 'admin' : (normalized || 'dashboard'));
  return companyId ? `/company/${companyId}/${subPath}` : `/${subPath}`
}

export function getFirstAccessibleDashboardPath({ companyId, userRole, permissions, companyModulesData, authModules }) {
  const accessibleKeys = getAccessibleModuleKeys({ userRole, permissions, companyModulesData, companyId, authModules })
  const firstRoutableKey = MODULE_DEFINITIONS.find((module) => accessibleKeys.includes(module.key))?.key
  return getModuleDashboardPath(companyId, firstRoutableKey)
}

export function normalizeAppRedirectPath(path) {
  if (!path || typeof path !== 'string') return null

  let normalized = path.trim()
  if (!normalized) return null

  if (normalized.startsWith('http')) {
    try {
      const parsed = new URL(normalized)
      normalized = `${parsed.pathname}${parsed.search}${parsed.hash}`
    } catch {
      return null
    }
  }

  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`
  }

  if (normalized === '/account/dashboard' || normalized === '/account') {
    return '/account/dashboard'
  }

  if (normalized.includes('/company/undefined')) {
    return '/company-select'
  }
  if (
    normalized === '/login' ||
    normalized === '/admin-login' ||
    normalized === '/modules'
  ) {
    return null
  }
  return normalized
}

export function getPostLoginRedirectPath({ user = {}, role, dashboardPath } = {}) {
  const userRole = role || user.role

  if (userRole === 'super_admin') {
    return '/super-admin/dashboard'
  }

  // Canonical ERP entry point for all tenant members (including OWNER) is /workspace.
  // /workspace dynamically evaluates entitled business modules from GET /api/sso/auth/me.
  const backendPath = normalizeAppRedirectPath(dashboardPath)
  if (backendPath && backendPath !== '/company-select' && backendPath !== '/owner/dashboard') {
    return backendPath
  }

  return '/workspace'
}

export const MODULES_UI_METADATA = {
  finance: {
    key: 'finance',
    name: 'Finance & Accounts',
    icon: Banknote,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    path: 'accounts/dashboard',
    description: 'General ledger, charts of accounts, journals, invoices, and tax compliance.',
  },
  sales: {
    key: 'sales',
    name: 'Sales & CRM',
    icon: ShoppingCart,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    path: 'sales-crm',
    description: 'Customers, quotations, sales orders, leads, and revenue analytics.',
  },
  crm: {
    key: 'crm',
    name: 'Sales & CRM',
    icon: Users,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    path: 'sales-crm',
    description: 'Customer relationships, leads, and pipeline tracking.',
  },
  inventory: {
    key: 'inventory',
    name: 'Inventory Management',
    icon: Box,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    path: 'inventory',
    description: 'Warehouse locations, stock valuations, batches, and item movements.',
  },
  purchases: {
    key: 'purchases',
    name: 'Purchase Management',
    icon: Briefcase,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    path: 'purchases',
    description: 'Vendor RFQs, purchase requisitions, orders, and AP invoice settlements.',
  },
  purchase: {
    key: 'purchase',
    name: 'Purchase Management',
    icon: Briefcase,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    path: 'purchases',
    description: 'Vendor RFQs, purchase requisitions, orders, and AP invoice settlements.',
  },
  manufacturing: {
    key: 'manufacturing',
    name: 'Manufacturing',
    icon: Factory,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    path: 'manufacturing',
    description: 'Production orders, bill of materials, work orders, and batch tracking.',
  },
  hr: {
    key: 'hr',
    name: 'HR & Employees',
    icon: Building2,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    path: 'hr',
    description: 'Employee directory, attendance, leave requests, and payroll records.',
  },
  sso: {
    key: 'sso',
    name: 'SSO & Administration',
    icon: ShieldCheck,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    path: 'admin',
    description: 'Single sign-on, security administration, user roles, portal access, and system logs.',
  },
  dashboard: {
    key: 'dashboard',
    name: 'Company Dashboard',
    icon: Layers,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    path: 'company-dashboard',
    description: 'Overview of company performance, operations, and quick shortcuts.',
  },
  workflow: {
    key: 'workflow',
    name: 'Workflow & Approvals',
    icon: ClipboardCheck,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    path: 'workflows',
    description: 'Transaction approvals, multistep workflows, rules, and audit trails.',
  },
  workflows: {
    key: 'workflow',
    name: 'Workflow & Approvals',
    icon: ClipboardCheck,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    path: 'workflows',
    description: 'Transaction approvals, multistep workflows, rules, and audit trails.',
  },
};

export function sanitizeBrowserModuleRoute(rawPath, companyId) {
  if (!rawPath) return companyId ? `/company/${companyId}/dashboard` : '/dashboard';

  let path = String(rawPath).trim();

  // If backend returns internal container or host URL like http://auth-service:8090 or http://localhost:8090
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const url = new URL(path);
      // Check if it corresponds to auth-service or sso
      if (
        url.port === '8090' ||
        url.hostname.includes('auth-service') ||
        url.pathname.includes('/sso') ||
        url.pathname.includes('/admin')
      ) {
        path = 'admin';
      } else {
        path = url.pathname.replace(/^\/+/, '');
      }
    } catch {
      path = 'admin';
    }
  }

  // Remove leading slashes
  path = path.replace(/^\/+/, '');

  // If path is an absolute route already formatted with company
  if (path.startsWith('company/')) {
    return `/${path}`;
  }

  // If path is a core module or alias
  const normalizedKey = normalizeModuleKey(path);
  const defPath = getDashboardPathFromModuleName(normalizedKey || path);
  const finalSubPath = defPath || path;

  return companyId ? `/company/${companyId}/${finalSubPath}` : `/${finalSubPath}`;
}

export function getUnifiedNavigationModules({ authContext = {}, companyModulesData, companyId, userRole }) {
  const memberType = authContext?.membership?.memberType;
  const isOwner = memberType === 'OWNER' || String(userRole).toLowerCase() === 'owner';
  const modulesMap = new Map();

  // 1. Process assignments from companyModulesData
  const companyAssignments = getCompanyModuleAssignments(companyModulesData, companyId, { activeOnly: false });
  companyAssignments.forEach((assignment, index) => {
    const rawKey =
      assignment.module?.name ||
      assignment.moduleName ||
      assignment.name ||
      assignment.moduleType ||
      assignment.moduleCode ||
      '';
    const modKey = normalizeModuleKey(rawKey) || rawKey.toLowerCase();
    const isActive = assignment.active ?? assignment.status ?? assignment.module?.moduleStatus ?? true;
    const isCurrentlyActive = isActive !== false && isActive !== 'INACTIVE' && isActive !== 'SUSPENDED';

    const meta = MODULES_UI_METADATA[modKey] || {
      name:
        assignment.displayName ||
        assignment.module?.displayName ||
        assignment.label ||
        assignment.module?.label ||
        rawKey,
      icon: Globe,
      color: 'text-zinc-600',
      bg: 'bg-zinc-100',
      path: modKey || 'dashboard',
      description: assignment.description || assignment.module?.description || '',
    };

    const targetPath = sanitizeBrowserModuleRoute(meta.path || modKey, companyId);

    modulesMap.set(modKey, {
      id: assignment.id || `${modKey}-${index}`,
      key: modKey,
      name: assignment.displayName || assignment.module?.displayName || meta.name,
      technicalKey: rawKey,
      icon: meta.icon,
      color: meta.color,
      bg: meta.bg,
      path: meta.path,
      browserRoute: targetPath,
      description: meta.description,
      active: isCurrentlyActive,
      source: 'company',
    });
  });

  // 2. Process authContext.modules (canonical backend session context)
  const authModules = Array.isArray(authContext?.modules) ? authContext.modules : [];
  authModules.forEach((m, index) => {
    if (!m) return;
    const rawKey = m.code || m.canonical || m.name || m.moduleName || '';
    const modKey = normalizeModuleKey(rawKey) || rawKey.toLowerCase();
    const isActive = m.active !== false && m.status !== 'INACTIVE';

    if (!modulesMap.has(modKey)) {
      const meta = MODULES_UI_METADATA[modKey] || {
        name: m.name || rawKey.toUpperCase(),
        icon: modKey === 'sso' ? ShieldCheck : Globe,
        color: modKey === 'sso' ? 'text-indigo-600' : 'text-zinc-600',
        bg: modKey === 'sso' ? 'bg-indigo-50' : 'bg-zinc-100',
        path: modKey === 'sso' ? 'admin' : modKey,
        description: m.description || '',
      };

      const targetPath = sanitizeBrowserModuleRoute(
        meta.path || (modKey === 'sso' ? 'admin' : modKey),
        companyId
      );

      modulesMap.set(modKey, {
        id: m.id || `auth-${modKey}-${index}`,
        key: modKey,
        name: meta.name,
        technicalKey: rawKey,
        icon: meta.icon,
        color: meta.color,
        bg: meta.bg,
        path: meta.path,
        browserRoute: targetPath,
        description: meta.description,
        active: isActive,
        source: 'auth',
      });
    } else {
      const existing = modulesMap.get(modKey);
      if (isActive && !existing.active) {
        existing.active = true;
      }
    }
  });

  // 3. For OWNER or company_admin, if SSO is in authContext or features, ensure SSO is present
  const hasSsoInAuth = authModules.some((m) => normalizeModuleKey(m?.code || m?.name) === 'sso');
  const hasSsoFeatures = (authContext?.features || []).some((f) => {
    const code = String(f.featureCode || f.code || f.featureName || '').toUpperCase();
    return [
      'AUTH',
      'USER',
      'ROLE',
      'PERMISSION',
      'FEATURE',
      'COMPANY',
      'SESSION',
      'PORTAL_ACCESS',
      'BILLING',
    ].includes(code);
  });

  if ((isOwner || hasSsoInAuth || hasSsoFeatures) && !modulesMap.has('sso')) {
    const meta = MODULES_UI_METADATA.sso;
    const targetPath = sanitizeBrowserModuleRoute('admin', companyId);
    modulesMap.set('sso', {
      id: 'auth-sso',
      key: 'sso',
      name: meta.name,
      technicalKey: 'sso',
      icon: meta.icon,
      color: meta.color,
      bg: meta.bg,
      path: meta.path,
      browserRoute: targetPath,
      description: meta.description,
      active: true,
      source: 'auth',
    });
  }

  return Array.from(modulesMap.values());
}

