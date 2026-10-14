import { normalizeModuleName } from './rbac'

export function hasModule(userModules, moduleName) {
  if (!userModules || !moduleName) return false
  const normalized = userModules.map((m) => normalizeModuleName(m))
  const target = normalizeModuleName(moduleName)
  if (normalized.includes('ALL') || normalized.includes('ALL_MODULES')) return true
  return normalized.includes(target)
}

export function hasAnyModule(userModules, moduleNames) {
  return moduleNames.some((m) => hasModule(userModules, m))
}

export function canRead(permissions, moduleName) {
  if (!permissions || !moduleName) return false
  const normalized = permissions.map((p) => normalizeModuleName(p))
  if (normalized.includes('ALL')) return true
  const target = normalizeModuleName(moduleName)
  return normalized.includes(`READ_${target}`) || normalized.includes(target)
}

export function canCreate(permissions, moduleName) {
  if (!permissions || !moduleName) return false
  const normalized = permissions.map((p) => normalizeModuleName(p))
  if (normalized.includes('ALL')) return true
  return normalized.includes(`CREATE_${normalizeModuleName(moduleName)}`)
}

export function canUpdate(permissions, moduleName) {
  if (!permissions || !moduleName) return false
  const normalized = permissions.map((p) => normalizeModuleName(p))
  if (normalized.includes('ALL')) return true
  return normalized.includes(`UPDATE_${normalizeModuleName(moduleName)}`)
}

export function canDelete(permissions, moduleName) {
  if (!permissions || !moduleName) return false
  const normalized = permissions.map((p) => normalizeModuleName(p))
  if (normalized.includes('ALL')) return true
  return normalized.includes(`DELETE_${normalizeModuleName(moduleName)}`)
}

export function canApprove(permissions, moduleName) {
  if (!permissions || !moduleName) return false
  const normalized = permissions.map((p) => normalizeModuleName(p))
  if (normalized.includes('ALL')) return true
  return normalized.includes(`APPROVE_${normalizeModuleName(moduleName)}`)
}
