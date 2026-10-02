import { canAccessModule } from '../utils/rbac'

const normalizeModule = (value) => (value ? String(value).trim().toUpperCase() : '');

export function filterSidebarByModules(sidebarConfig, userModules = []) {
  const modules = Array.isArray(userModules) ? userModules.map(normalizeModule) : [];
  if (modules.length === 0) {
    return sidebarConfig;
  }
  const filterNode = (node) => {
    if (!node) return null;
    const normalizedModule = normalizeModule(node.module);
    const visibleChildren = (node.children || []).map(filterNode).filter(Boolean);
    const hasVisibleChildren = visibleChildren.length > 0;
    const hasChildren = (node.children || []).length > 0;

    if (!normalizedModule) {
      if (hasChildren) {
        return hasVisibleChildren ? { ...node, children: visibleChildren } : null;
      }
      return { ...node, children: visibleChildren };
    }
    const isNodeAccessible = canAccessModule(modules, normalizedModule);
    if (isNodeAccessible) {
      return { ...node, children: visibleChildren };
    }
    return hasVisibleChildren ? { ...node, children: visibleChildren } : null;
  };
  const filtered = sidebarConfig.map(filterNode).filter(Boolean);
  return filtered;
}
