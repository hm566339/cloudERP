export const MODULE_DEFINITIONS = [
  { key: 'finance', label: 'Finance', dashboardPath: 'finance' },
  { key: 'sales', label: 'Sales', dashboardPath: 'sales' },
  { key: 'purchase', label: 'Purchase', dashboardPath: 'purchases' },
  { key: 'inventory', label: 'Inventory', dashboardPath: 'inventory' },
  { key: 'manufacturing', label: 'Manufacturing', dashboardPath: 'manufacturing' },
  { key: 'hr', label: 'HR', dashboardPath: 'hr' },
  { key: 'crm', label: 'CRM', dashboardPath: 'crm' },
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
}

export function getDashboardPathFromModuleName(moduleName) {
  if (!moduleName) return null;
  const normalized = String(moduleName).toLowerCase().trim();
  const coreModule = MODULE_ALIASES[normalized] || normalized;

  const def = MODULE_DEFINITIONS.find(m => m.key === coreModule || m.dashboardPath === coreModule);
  if (def) return def.dashboardPath;

  if (normalized.includes('account') || normalized.includes('finance')) return 'finance';
  if (normalized.includes('sales') || normalized.includes('crm')) return 'sales-crm';
  if (normalized.includes('purch')) return 'purchases';

  return null;
}


export function normalizeModuleKey(value) {
  if (!value) return ''

  if (typeof value === 'object') {
    return normalizeModuleKey(
      value.moduleName ||
      value.name ||
      value.key ||
      value.module?.moduleName ||
      value.module?.name ||
      value.module?.moduleCode ||
      value.module?.key ||
      value.module?.id ||
      value.moduleType ||
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

export function getPermissionModuleKeys(permissions = [], userRole = 'employee') {
  if (userRole === 'super_admin' || permissions?.includes('all')) {
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

export function getAccessibleModuleKeys({ userRole, permissions, companyModulesData, companyId }) {
  const permissionKeys = getPermissionModuleKeys(permissions, userRole)
  const companyKeys = getCompanyModuleKeys(companyModulesData, companyId)

  if (companyKeys.length === 0) return permissionKeys
  if (userRole === 'company_admin' || userRole === 'super_admin') return companyKeys

  return companyKeys.filter((key) => permissionKeys.includes(key))
}

export function getModuleDashboardPath(companyId, moduleKey) {
  const module = MODULE_DEFINITIONS.find((item) => item.key === normalizeModuleKey(moduleKey))
  return module ? `/company/${companyId}/${module.dashboardPath}` : `/company/${companyId}/dashboard`
}

export function getFirstAccessibleDashboardPath({ companyId, userRole, permissions, companyModulesData }) {
  const accessibleKeys = getAccessibleModuleKeys({ userRole, permissions, companyModulesData, companyId })
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
  const companyId = user.companyCode || user.companyId

  if (userRole === 'super_admin') {
    return '/super-admin/dashboard'
  }

  if (userRole === 'company_admin') {
    return companyId ? `/company/${companyId}` : '/company-select'
  }

  const backendPath = normalizeAppRedirectPath(dashboardPath)
  if (backendPath && backendPath !== '/company-select') {
    return backendPath
  }

  if (companyId) {
    return `/accounts/dashboard`
  }

  return '/company-select'
}
