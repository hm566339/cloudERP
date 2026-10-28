import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { useSidebar } from './SidebarContext'
import { isItemOrChildActive, isSalesTransactionsRoute } from './SidebarNavUtils.js'

export { isItemOrChildActive, isSalesTransactionsRoute }

function SidebarNavItem({ item, location, level = 0, onLinkClick }) {
  const { isMenuOpen, toggleMenu, setMenuOpen } = useSidebar();
  const hasChildren = Array.isArray(item.children) && item.children.length > 0;

  const currentPath = location?.pathname || '';
  const isParentActive = isItemOrChildActive(item, currentPath);

  const open = isMenuOpen(item.id, isParentActive);
  const Icon = item.icon;

  useEffect(() => {
    if (isParentActive) {
      setMenuOpen(item.id, true);
    }
  }, [isParentActive, item.id, setMenuOpen]);

  if (!hasChildren) {
    const isSalesMenu = item.id === 'acc-txn-sales' || item.id === 'txn-si';
    const isSalesRoute = isSalesTransactionsRoute(currentPath);
    const isExpenseMenu = item.id === 'expense' || item.id === 'txn-exp' || (typeof item.path === 'string' && item.path.includes('/transactions/expenses'));
    const isApprovalsRoute = currentPath === '/workflows/approvals' ||
      currentPath.startsWith('/workflows/approvals/') ||
      currentPath.endsWith('/workflows/approvals') ||
      currentPath.includes('/workflows/approvals/');
    const isWorkflowRoute = currentPath === '/workflows' ||
      currentPath.startsWith('/workflows/') ||
      currentPath.endsWith('/workflows') ||
      currentPath.includes('/workflows/');

    const isWorkflowApprovals = item.id === 'workflow-approvals';
    const isWorkflowRequests = item.id === 'workflow-approval-requests';

    const isActive = isItemOrChildActive(item, currentPath) ||
      currentPath === item.path ||
      (item.path !== '/super-admin/dashboard' && item.path !== '/' && item.path !== '/owner/dashboard' && item.path !== '/dashboard' &&
        currentPath.startsWith(item.path + '/'))
      || (isSalesMenu && isSalesRoute)
      || (isExpenseMenu && currentPath.includes('/transactions/expenses'))
      || (isWorkflowApprovals && isWorkflowRoute && !isApprovalsRoute)
      || (isWorkflowRequests && isApprovalsRoute);

    return (
      <Link
        to={item.path}
        onClick={onLinkClick}
        className={`sidebar-item ${level > 0 ? 'sidebar-child-item' : ''} ${isActive ? (level > 0 ? 'sidebar-child-active' : 'sidebar-item-active') : (level > 0 ? 'sidebar-child-inactive' : 'sidebar-item-inactive')}`}
        style={level > 0 ? {} : undefined}
      >
        {Icon && <Icon size={level > 0 ? 16 : 18} className="shrink-0" />}
        <span className="truncate">{item.label}</span>
      </Link>
    )
  }

  return (
    <div className={level === 0 ? "mb-1" : "mt-0.5"}>
      <button
        type="button"
        onClick={() => toggleMenu(item.id)}
        className={`sidebar-item ${level > 0 ? 'sidebar-child-item' : ''} ${isParentActive ? (level === 0 ? 'text-zinc-900 font-bold bg-white border border-zinc-300 shadow-sm dark:text-[#E6E8EE] dark:bg-[#1D212C] dark:border-[#2A2F3D]' : 'text-zinc-900 dark:text-[#E6E8EE] font-medium') : (level > 0 ? 'sidebar-child-inactive' : 'sidebar-item-inactive')}`}
      >
        {Icon && <Icon size={level > 0 ? 16 : 18} className={`shrink-0 transition-colors ${isParentActive ? 'text-zinc-900 dark:text-[#E6E8EE]' : 'text-zinc-400 dark:text-[#6B7184]'}`} />}
        <span className="flex-1 text-left truncate">{item.label}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-zinc-400 dark:text-[#6B7184] transition-transform duration-standard ease-move ${open ? '' : '-rotate-90'}`}
        />
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-standard ease-move"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden min-h-0">
          <div className={`mt-0.5 space-y-0.5 ${level === 0 ? 'ml-3 pl-3 border-l border-zinc-200/80 dark:border-[#2A2F3D] pb-0.5' : 'ml-3 pl-2.5 border-l border-zinc-100 dark:border-[#2A2F3D]/60 pb-0.5'}`}>
            {item.children.map((child) => (
              <SidebarNavItem
                key={child.id}
                item={child}
                location={location}
                level={level + 1}
                onLinkClick={onLinkClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(SidebarNavItem);
