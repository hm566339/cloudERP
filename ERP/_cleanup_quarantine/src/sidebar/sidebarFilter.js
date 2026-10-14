import { canAccessModule } from '../utils/rbac'

const normalize = (value) => (value ? String(value).trim().toLowerCase().replace(/[\s_]/g, '') : '');

export function filterSidebarByModules(sidebarConfig, userModules = [], authContext = {}) {
  const isSuperAdmin = authContext?.isSuperAdmin || normalize(authContext?.role) === 'superadmin' || normalize(authContext?.role) === 'systemadmin';
  const isOwner = authContext?.isOwner || authContext?.memberType === 'OWNER' || normalize(authContext?.role) === 'owner';

  if (isSuperAdmin || isOwner) {
    return sidebarConfig;
  }

  const modules = Array.isArray(userModules) ? userModules.map(m => String(m).trim().toUpperCase()) : [];

  const filterNode = (node) => {
    if (!node) return null;

    // Check role restrictions if present on node
    if (node.roles && Array.isArray(node.roles) && node.roles.length > 0) {
      const userRole = normalize(authContext?.role || '');
      const allowedRoles = node.roles.map(normalize);
      if (!allowedRoles.includes(userRole)) {
        return null;
      }
    }

    // Check permission restrictions if present on node
    if (node.permissions && authContext?.can) {
      const perms = Array.isArray(node.permissions) ? node.permissions : [node.permissions];
      const hasPerm = perms.some(p => authContext.can(p));
      if (!hasPerm) {
        return null;
      }
    }

    const normalizedModule = node.module ? String(node.module).trim().toUpperCase() : '';
    const visibleChildren = (node.children || []).map(filterNode).filter(Boolean);
    const hasVisibleChildren = visibleChildren.length > 0;
    const hasChildren = (node.children || []).length > 0;

    if (!normalizedModule) {
      if (hasChildren) {
        return hasVisibleChildren ? { ...node, children: visibleChildren } : null;
      }
      return { ...node, children: visibleChildren };
    }

    const isNodeAccessible = modules.length === 0 || canAccessModule(modules, normalizedModule);
    if (isNodeAccessible) {
      return { ...node, children: visibleChildren };
    }
    return hasVisibleChildren ? { ...node, children: visibleChildren } : null;
  };

  return sidebarConfig.map(filterNode).filter(Boolean);
}
