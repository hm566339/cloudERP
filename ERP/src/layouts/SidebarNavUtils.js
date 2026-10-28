/**
 * Sidebar Navigation Active Item Resolution Utilities
 */

export function isSalesTransactionsRoute(pathname) {
  if (!pathname) return false;
  const stripCompany = (p) => String(p || '').replace(/^\/company\/[^/]+/, '').replace(/\/$/, '') || '/';
  const clean = stripCompany(pathname);
  return (
    clean === '/accounts/transactions/quotations' ||
    clean.startsWith('/accounts/transactions/quotations/') ||
    clean === '/accounts/transactions/proforma-invoices' ||
    clean.startsWith('/accounts/transactions/proforma-invoices/') ||
    clean === '/accounts/transactions/sales-orders' ||
    clean.startsWith('/accounts/transactions/sales-orders/') ||
    clean === '/accounts/transactions/delivery-challans' ||
    clean.startsWith('/accounts/transactions/delivery-challans/') ||
    clean === '/accounts/transactions/sales' ||
    clean.startsWith('/accounts/transactions/sales/') ||
    clean === '/accounts/sales/invoices' ||
    clean.startsWith('/accounts/sales/invoices/') ||
    clean === '/accounts/transactions/receipts' ||
    clean.startsWith('/accounts/transactions/receipts/')
  );
}

export function isItemOrChildActive(item, currentPath) {
  if (!item || !currentPath) return false;

  const stripCompany = (p) => String(p || '').replace(/^\/company\/[^/]+/, '').replace(/\/$/, '') || '/';
  const cleanCurrent = stripCompany(currentPath);

  if (item.path) {
    const cleanItem = stripCompany(item.path);

    if (currentPath === item.path || (cleanCurrent === cleanItem && cleanItem !== '/')) {
      return true;
    }

    // Exact or sub-path matching without greedy prefix collision
    if (cleanItem !== '/' && cleanItem !== '/super-admin/dashboard' && cleanItem !== '/owner/dashboard' && cleanItem !== '/dashboard') {
      if (currentPath.startsWith(item.path + '/') || cleanCurrent.startsWith(cleanItem + '/')) {
        // Prevent /workflows from greedily matching /workflows/approvals
        const isApprovalsTarget = cleanCurrent === '/workflows/approvals' ||
          cleanCurrent.startsWith('/workflows/approvals/');

        if ((cleanItem === '/workflows' || item.id === 'workflow-approvals') && isApprovalsTarget) {
          // do not match
        } else {
          return true;
        }
      }
    }

    // Special module patterns
    if (item.path.includes('/transactions/expenses') && currentPath.includes('/transactions/expenses')) return true;

    // Special module patterns: Sales (Quotations, PI, Orders, Challans, Sales Invoices, Receipts)
    const isSalesMenu = item.id === 'acc-txn-sales' || item.id === 'txn-si';
    if (isSalesMenu && isSalesTransactionsRoute(currentPath)) return true;

    const isApprovalsRoute = cleanCurrent === '/workflows/approvals' ||
      cleanCurrent.startsWith('/workflows/approvals/');

    const isWorkflowRoute = cleanCurrent === '/workflows' ||
      cleanCurrent.startsWith('/workflows/');

    if (item.id === 'workflow-approval-requests' && isApprovalsRoute) return true;
    if (item.id === 'workflow-approvals' && isWorkflowRoute && !isApprovalsRoute) return true;
  }

  if (Array.isArray(item.children) && item.children.length > 0) {
    return item.children.some(child => isItemOrChildActive(child, currentPath));
  }

  return false;
}
