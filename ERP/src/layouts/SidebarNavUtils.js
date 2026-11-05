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

export function isPurchaseTransactionsRoute(pathname) {
  if (!pathname) return false;
  const stripCompany = (p) => String(p || '').replace(/^\/company\/[^/]+/, '').replace(/\/$/, '') || '/';
  const clean = stripCompany(pathname);
  return (
    clean === '/accounts/transactions/purchase-requisitions' ||
    clean.startsWith('/accounts/transactions/purchase-requisitions/') ||
    clean === '/purchase-requisitions' ||
    clean.startsWith('/purchase-requisitions/') ||
    clean === '/purchases/requisitions' ||
    clean.startsWith('/purchases/requisitions/') ||
    clean === '/accounts/transactions/rfqs' ||
    clean.startsWith('/accounts/transactions/rfqs/') ||
    clean === '/rfqs' ||
    clean.startsWith('/rfqs/') ||
    clean === '/purchases/rfqs' ||
    clean.startsWith('/purchases/rfqs/') ||
    clean === '/accounts/transactions/purchase-quotations' ||
    clean.startsWith('/accounts/transactions/purchase-quotations/') ||
    clean === '/accounts/transactions/supplier-quotes' ||
    clean.startsWith('/accounts/transactions/supplier-quotes/') ||
    clean === '/accounts/transactions/supplier-quotations' ||
    clean.startsWith('/accounts/transactions/supplier-quotations/') ||
    clean === '/supplier-quotes' ||
    clean.startsWith('/supplier-quotes/') ||
    clean === '/purchases/quotations' ||
    clean.startsWith('/purchases/quotations/') ||
    clean === '/purchases/supplier-quotations' ||
    clean.startsWith('/purchases/supplier-quotations/') ||
    clean === '/accounts/transactions/purchase-orders' ||
    clean.startsWith('/accounts/transactions/purchase-orders/') ||
    clean === '/purchase-orders' ||
    clean.startsWith('/purchase-orders/') ||
    clean === '/purchases/purchase-orders' ||
    clean.startsWith('/purchases/purchase-orders/') ||
    clean === '/purchases/orders' ||
    clean.startsWith('/purchases/orders/') ||
    clean === '/accounts/transactions/goods-receipts' ||
    clean.startsWith('/accounts/transactions/goods-receipts/') ||
    clean === '/goods-receipts' ||
    clean.startsWith('/goods-receipts/') ||
    clean === '/purchases/goods-receipts' ||
    clean.startsWith('/purchases/goods-receipts/') ||
    clean === '/accounts/transactions/purchase' ||
    clean.startsWith('/accounts/transactions/purchase/') ||
    clean === '/accounts/transactions/purchase-invoices' ||
    clean.startsWith('/accounts/transactions/purchase-invoices/') ||
    clean === '/purchase-invoices' ||
    clean.startsWith('/purchase-invoices/') ||
    clean === '/purchases/invoices' ||
    clean.startsWith('/purchases/invoices/') ||
    clean === '/accounts/purchase/invoices' ||
    clean.startsWith('/accounts/purchase/invoices/')
  );
}

export function isItemOrChildActive(item, currentPath) {
  if (!item || !currentPath) return false;

  const stripCompany = (p) => String(p || '').replace(/^\/company\/[^/]+/, '').replace(/\/$/, '') || '/';
  const cleanCurrent = stripCompany(currentPath);

  if (item.path) {
    const cleanItem = stripCompany(item.path);

    // Organization Settings overview vs sub-item matching
    const isOverview = cleanItem === '/owner/settings' || cleanItem === '/settings/organization' || item.id === 'org-overview' || item.id === 'overview';
    if (isOverview) {
      const isOverviewRoute =
        cleanCurrent === '/owner/settings' ||
        cleanCurrent === '/owner/settings/' ||
        cleanCurrent === '/owner/settings/overview' ||
        cleanCurrent === '/settings/organization' ||
        cleanCurrent === '/settings/organization/' ||
        cleanCurrent === '/settings/organization/overview';
      if (isOverviewRoute) return true;
    }

    const normalizeOrg = (p) => String(p || '').replace(/^\/settings\/organization/, '/owner/settings');
    const normCurrent = normalizeOrg(cleanCurrent);
    const normItem = normalizeOrg(cleanItem);

    if (normCurrent === normItem && normItem !== '/') {
      return true;
    }

    // Exact or sub-path matching without greedy prefix collision
    if (
      normItem !== '/' &&
      normItem !== '/super-admin/dashboard' &&
      normItem !== '/owner/dashboard' &&
      normItem !== '/dashboard' &&
      normItem !== '/owner/settings'
    ) {
      if (normCurrent.startsWith(normItem + '/')) {
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
    const isExpenseMenu = item.id === 'acc-txn-exp' || item.id === 'expense' || item.id === 'txn-exp' || (typeof item.path === 'string' && item.path.includes('/transactions/expenses'));
    const isExpenseRoute = currentPath.includes('/transactions/expenses') || currentPath.includes('/transactions/expense-requests');
    if (isExpenseMenu && isExpenseRoute) return true;

    // Special module patterns: Sales (Quotations, PI, Orders, Challans, Sales Invoices, Receipts)
    const isSalesMenu = item.id === 'acc-txn-sales' || item.id === 'txn-si';
    if (isSalesMenu && isSalesTransactionsRoute(currentPath)) return true;

    // Special module patterns: Purchase (Requisitions, RFQs, Supplier Quotes, Purchase Orders, Goods Receipts, Purchase Invoices)
    const isPurchaseMenu = item.id === 'acc-txn-pur' || item.id === 'txn-pi';
    if (isPurchaseMenu && isPurchaseTransactionsRoute(currentPath)) return true;

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
