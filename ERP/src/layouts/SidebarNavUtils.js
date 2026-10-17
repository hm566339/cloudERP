/**
 * Sidebar Navigation Active Item Resolution Utilities
 */

export function isItemOrChildActive(item, currentPath) {
  if (!item) return false;

  if (item.path) {
    if (currentPath === item.path) return true;

    // Exact or sub-path matching without greedy prefix collision
    if (item.path !== '/' && item.path !== '/super-admin/dashboard' && item.path !== '/owner/dashboard' && item.path !== '/dashboard') {
      if (currentPath.startsWith(item.path + '/')) {
        // Prevent /workflows from greedily matching /workflows/approvals
        const isApprovalsTarget = currentPath === '/workflows/approvals' ||
          currentPath.startsWith('/workflows/approvals/') ||
          currentPath.endsWith('/workflows/approvals') ||
          currentPath.includes('/workflows/approvals/');

        if ((item.path === '/workflows' || item.id === 'workflow-approvals') && isApprovalsTarget) {
          // do not match
        } else {
          return true;
        }
      }
    }

    // Special module patterns
    if (item.path.includes('/transactions/expenses') && currentPath.includes('/transactions/expenses')) return true;

    const isApprovalsRoute = currentPath === '/workflows/approvals' ||
      currentPath.startsWith('/workflows/approvals/') ||
      currentPath.endsWith('/workflows/approvals') ||
      currentPath.includes('/workflows/approvals/');

    const isWorkflowRoute = currentPath === '/workflows' ||
      currentPath.startsWith('/workflows/') ||
      currentPath.endsWith('/workflows') ||
      currentPath.includes('/workflows/');

    if (item.id === 'workflow-approval-requests' && isApprovalsRoute) return true;
    if (item.id === 'workflow-approvals' && isWorkflowRoute && !isApprovalsRoute) return true;
  }

  if (Array.isArray(item.children) && item.children.length > 0) {
    return item.children.some(child => isItemOrChildActive(child, currentPath));
  }

  return false;
}
